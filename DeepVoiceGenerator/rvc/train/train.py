import torch
import sys
import os
import datetime
import glob
import json
import re

from utils import (
    get_hparams,
    plot_spectrogram_to_numpy,
    summarize,
    load_checkpoint,
    save_checkpoint,
    latest_checkpoint_path,
)
from random import randint, shuffle
from time import sleep
from time import time as ttime

from torch.cuda.amp import GradScaler, autocast

from torch.nn import functional as F
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
import torch.distributed as dist
import torch.multiprocessing as mp

now_dir = os.getcwd()
sys.path.append(os.path.join(now_dir))

from data_utils import (
    DistributedBucketSampler,
    TextAudioCollate,
    TextAudioCollateMultiNSFsid,
    TextAudioLoader,
    TextAudioLoaderMultiNSFsid,
)

from losses import (
    discriminator_loss,
    feature_loss,
    generator_loss,
    kl_loss,
)
from mel_processing import mel_spectrogram_torch, spec_to_mel_torch

from rvc.train.process.extract_model import extract_model

from rvc.lib.algorithm import commons

hps = get_hparams()
if hps.version == "v1":
    from rvc.lib.algorithm.discriminators import MultiPeriodDiscriminator
    from rvc.lib.algorithm.synthesizers import SynthesizerV1_F0 as RVC_Model_f0
    from rvc.lib.algorithm.synthesizers import SynthesizerV1_NoF0 as RVC_Model_nof0
elif hps.version == "v2":
    from rvc.lib.algorithm.discriminators import (
        MultiPeriodDiscriminatorV2 as MultiPeriodDiscriminator,
    )
    from rvc.lib.algorithm.synthesizers import SynthesizerV2_F0 as RVC_Model_f0
    from rvc.lib.algorithm.synthesizers import SynthesizerV2_NoF0 as RVC_Model_nof0


os.environ["CUDA_VISIBLE_DEVICES"] = hps.gpus.replace("-", ",")
n_gpus = len(hps.gpus.split("-"))

torch.backends.cudnn.deterministic = False
torch.backends.cudnn.benchmark = False

global_step = 0
lowest_value = {"step": 0, "value": float("inf"), "epoch": 0}
last_loss_gen_all = 0

# Disable logging
import logging

logging.getLogger("torch").setLevel(logging.ERROR)


class EpochRecorder:
    """
    Records the time elapsed per epoch.
    """

    def __init__(self):
        self.last_time = ttime()

    def record(self):
        """
        Records the elapsed time and returns a formatted string.

        Returns:
            str: Formatted string containing the current time and training speed.
        """
        now_time = ttime()
        elapsed_time = now_time - self.last_time
        self.last_time = now_time
        elapsed_time = round(elapsed_time, 1)
        elapsed_time_str = str(datetime.timedelta(seconds=int(elapsed_time)))
        current_time = datetime.datetime.now().strftime("%H:%M:%S")
        return f"time={current_time} | training_speed={elapsed_time_str}"


def main():
    """
    Main function to start the training process.
    """

    def start():
        """
        Starts the training process with multi-GPU support.
        """
        children = []
        pid_file_path = os.path.join(now_dir, "rvc", "train", "train_pid.txt")
        with open(pid_file_path, "w") as pid_file:
            for i in range(n_gpus):
                subproc = mp.Process(
                    target=run,
                    args=(i, n_gpus, hps),
                )
                children.append(subproc)
                subproc.start()
                pid_file.write(str(subproc.pid) + "\n")

        for i in range(n_gpus):
            children[i].join()

    n_gpus = torch.cuda.device_count()

    if torch.cuda.is_available() == False and torch.backends.mps.is_available() == True:
        n_gpus = 1
    if n_gpus < 1:
        print("GPU not detected, reverting to CPU (not recommended)")
        n_gpus = 1

    if hps.sync_graph == 1:
        print(
            "Sync graph is now activated! With sync graph enabled, the model undergoes a single epoch of training. Once the graphs are synchronized, training proceeds for the previously specified number of epochs."
        )
        hps.custom_total_epoch = 1
        hps.custom_save_every_weights = "1"
        start()

        # Synchronize graphs by modifying config files
        logs_path = os.path.join(now_dir, "logs")
        model_config_file = os.path.join(now_dir, "logs", hps.name, "config.json")
        rvc_config_file = os.path.join(
            now_dir, "rvc", "configs", hps.version, str(hps.sample_rate) + ".json"
        )
        if not os.path.exists(rvc_config_file):
            rvc_config_file = os.path.join(
                now_dir, "rvc", "configs", "v1", str(hps.sample_rate) + ".json"
            )

        pattern = rf"{os.path.basename(hps.name)}_1e_(\d+)s\.pth"

        for filename in os.listdir(logs_path):
            match = re.match(pattern, filename)
            if match:
                steps = int(match.group(1))

        def edit_config(config_file):
            """
            Edits the config file to synchronize graphs.

            Args:
                config_file (str): Path to the config file.
            """
            with open(config_file, "r", encoding="utf8") as json_file:
                config_data = json.load(json_file)

            config_data["train"]["log_interval"] = steps

            with open(config_file, "w", encoding="utf8") as json_file:
                json.dump(
                    config_data,
                    json_file,
                    indent=2,
                    separators=(",", ": "),
                    ensure_ascii=False,
                )

        edit_config(model_config_file)
        edit_config(rvc_config_file)

        # Clean up unnecessary files
        for root, dirs, files in os.walk(
            os.path.join(now_dir, "logs", hps.name), topdown=False
        ):
            for name in files:
                file_path = os.path.join(root, name)
                file_name, file_extension = os.path.splitext(name)
                if file_extension == ".0":
                    os.remove(file_path)
                elif ("D" in name or "G" in name) and file_extension == ".pth":
                    os.remove(file_path)
                elif (
                    "added" in name or "trained" in name
                ) and file_extension == ".index":
                    os.remove(file_path)
            for name in dirs:
                if name == "eval":
                    folder_path = os.path.join(root, name)
                    for item in os.listdir(folder_path):
                        item_path = os.path.join(folder_path, item)
                        if os.path.isfile(item_path):
                            os.remove(item_path)
                    os.rmdir(folder_path)

        print("Successfully synchronized graphs!")
        hps.custom_total_epoch = hps.total_epoch
        hps.custom_save_every_weights = hps.save_every_weights
        start()
    else:
        hps.custom_total_epoch = hps.total_epoch
        hps.custom_save_every_weights = hps.save_every_weights
        start()


def run(
    rank,
    n_gpus,
    hps,
):
    """
    Runs the training loop on a specific GPU.

    Args:
        rank (int): Rank of the current GPU.
        n_gpus (int): Total number of GPUs.
        hps (Namespace): Hyperparameters.
    """
    global global_step
    if rank == 0:
        writer = SummaryWriter(log_dir=hps.model_dir)
        writer_eval = SummaryWriter(log_dir=os.path.join(hps.model_dir, "eval"))

    os.environ["MASTER_ADDR"] = "localhost"
    os.environ["MASTER_PORT"] = str(randint(20000, 55555))
    dist.init_process_group(
        backend="gloo", init_method="env://", world_size=n_gpus, rank=rank
    )
    torch.manual_seed(hps.train.seed)
    if torch.cuda.is_available():
        torch.cuda.set_device(rank)

    # Create datasets and dataloaders
    if hps.if_f0 == 1:
        train_dataset = TextAudioLoaderMultiNSFsid(hps.data)
    else:
        train_dataset = TextAudioLoader(hps.data)

    train_sampler = DistributedBucketSampler(
        train_dataset,
        hps.train.batch_size * n_gpus,
        [100, 200, 300, 400, 500, 600, 700, 800, 900],
        num_replicas=n_gpus,
        rank=rank,
        shuffle=True,
    )

    if hps.if_f0 == 1:
        collate_fn = TextAudioCollateMultiNSFsid()
    else:
        collate_fn = TextAudioCollate()
    train_loader = DataLoader(
        train_dataset,
        num_workers=4,
        shuffle=False,
        pin_memory=True,
        collate_fn=collate_fn,
        batch_sampler=train_sampler,
        persistent_workers=True,
        prefetch_factor=8,
    )

    # Initialize models and optimizers
    if hps.if_f0 == 1:
        net_g = RVC_Model_f0(
            hps.data.filter_length // 2 + 1,
            hps.train.segment_size // hps.data.hop_length,
            **hps.model,
            is_half=hps.train.fp16_run,
            sr=hps.sample_rate,
        )
    else:
        net_g = RVC_Model_nof0(
            hps.data.filter_length // 2 + 1,
            hps.train.segment_size // hps.data.hop_length,
            **hps.model,
            is_half=hps.train.fp16_run,
        )
    if torch.cuda.is_available():
        net_g = net_g.cuda(rank)
    net_d = MultiPeriodDiscriminator(hps.model.use_spectral_norm)
    if torch.cuda.is_available():
        net_d = net_d.cuda(rank)
    optim_g = torch.optim.AdamW(
        net_g.parameters(),
        hps.train.learning_rate,
        betas=hps.train.betas,
        eps=hps.train.eps,
    )
    optim_d = torch.optim.AdamW(
        net_d.parameters(),
        hps.train.learning_rate,
        betas=hps.train.betas,
        eps=hps.train.eps,
    )

    # Wrap models with DDP
    if torch.cuda.is_available():
        net_g = DDP(net_g, device_ids=[rank])
        net_d = DDP(net_d, device_ids=[rank])
    else:
        net_g = DDP(net_g)
        net_d = DDP(net_d)

    # Load checkpoint if available
    try:
        print("Starting training...")
        _, _, _, epoch_str = load_checkpoint(
            latest_checkpoint_path(hps.model_dir, "D_*.pth"), net_d, optim_d
        )
        _, _, _, epoch_str = load_checkpoint(
            latest_checkpoint_path(hps.model_dir, "G_*.pth"), net_g, optim_g
        )
        global_step = (epoch_str - 1) * len(train_loader)

    except:
        epoch_str = 1
        global_step = 0
        if hps.pretrainG != "":
            if rank == 0:
                print(f"Loaded pretrained (G) '{hps.pretrainG}'")
            if hasattr(net_g, "module"):
                net_g.module.load_state_dict(
                    torch.load(hps.pretrainG, map_location="cpu")["model"]
                )

            else:
                net_g.load_state_dict(
                    torch.load(hps.pretrainG, map_location="cpu")["model"]
                )

        if hps.pretrainD != "":
            if rank == 0:
                print(f"Loaded pretrained (D) '{hps.pretrainD}'")
            if hasattr(net_d, "module"):
                net_d.module.load_state_dict(
                    torch.load(hps.pretrainD, map_location="cpu")["model"]
                )

            else:
                net_d.load_state_dict(
                    torch.load(hps.pretrainD, map_location="cpu")["model"]
                )

    # Initialize schedulers and scaler
    scheduler_g = torch.optim.lr_scheduler.ExponentialLR(
        optim_g, gamma=hps.train.lr_decay, last_epoch=epoch_str - 2
    )
    scheduler_d = torch.optim.lr_scheduler.ExponentialLR(
        optim_d, gamma=hps.train.lr_decay, last_epoch=epoch_str - 2
    )

    scaler = GradScaler(enabled=hps.train.fp16_run)

    cache = []
    for epoch in range(epoch_str, hps.train.epochs + 1):
        if rank == 0:
            train_and_evaluate(
                rank,
                epoch,
                hps,
                [net_g, net_d],
                [optim_g, optim_d],
                scaler,
                [train_loader, None],
                [writer, writer_eval],
                cache,
            )
        else:
            train_and_evaluate(
                rank,
                epoch,
                hps,
                [net_g, net_d],
                [optim_g, optim_d],
                scaler,
                [train_loader, None],
                None,
                cache,
            )

        scheduler_g.step()
        scheduler_d.step()


def train_and_evaluate(rank, epoch, hps, nets, optims, scaler, loaders, writers, cache):
    """
    Trains and evaluates the model for one epoch.

    Args:
        rank (int): Rank of the current GPU.
        epoch (int): Current epoch number.
        hps (Namespace): Hyperparameters.
        nets (list): List of models [net_g, net_d].
        optims (list): List of optimizers [optim_g, optim_d].
        scaler (GradScaler): Gradient scaler for mixed precision training.
        loaders (list): List of dataloaders [train_loader, eval_loader].
        writers (list): List of TensorBoard writers [writer, writer_eval].
        cache (list): List to cache data in GPU memory.
    """
    global global_step, last_loss_gen_all, lowest_value

    if epoch == 1:
        lowest_value = {"step": 0, "value": float("inf"), "epoch": 0}
        last_loss_gen_all = 0.0

    net_g, net_d = nets
    optim_g, optim_d = optims
    train_loader = loaders[0] if loaders is not None else None
    if writers is not None:
        writer = writers[0]

    train_loader.batch_sampler.set_epoch(epoch)

    net_g.train()
    net_d.train()

    # Data caching
    if hps.if_cache_data_in_gpu == True:
        data_iterator = cache
        if cache == []:
            for batch_idx, info in enumerate(train_loader):
                if hps.if_f0 == 1:
                    (
                        phone,
                        phone_lengths,
                        pitch,
                        pitchf,
                        spec,
                        spec_lengths,
                        wave,
                        wave_lengths,
                        sid,
                    ) = info
                else:
                    (
                        phone,
                        phone_lengths,
                        spec,
                        spec_lengths,
                        wave,
                        wave_lengths,
                        sid,
                    ) = info
                if torch.cuda.is_available():
                    phone = phone.cuda(rank, non_blocking=True)
                    phone_lengths = phone_lengths.cuda(rank, non_blocking=True)
                    if hps.if_f0 == 1:
                        pitch = pitch.cuda(rank, non_blocking=True)
                        pitchf = pitchf.cuda(rank, non_blocking=True)
                    sid = sid.cuda(rank, non_blocking=True)
                    spec = spec.cuda(rank, non_blocking=True)
                    spec_lengths = spec_lengths.cuda(rank, non_blocking=True)
                    wave = wave.cuda(rank, non_blocking=True)
                    wave_lengths = wave_lengths.cuda(rank, non_blocking=True)
                if hps.if_f0 == 1:
                    cache.append(
                        (
                            batch_idx,
                            (
                                phone,
                                phone_lengths,
                                pitch,
                                pitchf,
                                spec,
                                spec_lengths,
                                wave,
                                wave_lengths,
                                sid,
                            ),
                        )
                    )
                else:
                    cache.append(
                        (
                            batch_idx,
                            (
                                phone,
                                phone_lengths,
                                spec,
                                spec_lengths,
                                wave,
                                wave_lengths,
                                sid,
                            ),
                        )
                    )
        else:
            shuffle(cache)
    else:
        data_iterator = enumerate(train_loader)

    epoch_recorder = EpochRecorder()
    for batch_idx, info in data_iterator:
        if hps.if_f0 == 1:
            (
                phone,
                phone_lengths,
                pitch,
                pitchf,
                spec,
                spec_lengths,
                wave,
                wave_lengths,
                sid,
            ) = info
        else:
            phone, phone_lengths, spec, spec_lengths, wave, wave_lengths, sid = info
        if (hps.if_cache_data_in_gpu == False) and torch.cuda.is_available():
            phone = phone.cuda(rank, non_blocking=True)
            phone_lengths = phone_lengths.cuda(rank, non_blocking=True)
            if hps.if_f0 == 1:
                pitch = pitch.cuda(rank, non_blocking=True)
                pitchf = pitchf.cuda(rank, non_blocking=True)
            sid = sid.cuda(rank, non_blocking=True)
            spec = spec.cuda(rank, non_blocking=True)
            spec_lengths = spec_lengths.cuda(rank, non_blocking=True)
            wave = wave.cuda(rank, non_blocking=True)

        # Forward pass
        with autocast(enabled=hps.train.fp16_run):
            if hps.if_f0 == 1:
                (
                    y_hat,
                    ids_slice,
                    x_mask,
                    z_mask,
                    (z, z_p, m_p, logs_p, m_q, logs_q),
                ) = net_g(phone, phone_lengths, pitch, pitchf, spec, spec_lengths, sid)
            else:
                (
                    y_hat,
                    ids_slice,
                    x_mask,
                    z_mask,
                    (z, z_p, m_p, logs_p, m_q, logs_q),
                ) = net_g(phone, phone_lengths, spec, spec_lengths, sid)
            mel = spec_to_mel_torch(
                spec,
                hps.data.filter_length,
                hps.data.n_mel_channels,
                hps.data.sampling_rate,
                hps.data.mel_fmin,
                hps.data.mel_fmax,
            )
            y_mel = commons.slice_segments(
                mel, ids_slice, hps.train.segment_size // hps.data.hop_length
            )
            with autocast(enabled=False):
                y_hat_mel = mel_spectrogram_torch(
                    y_hat.float().squeeze(1),
                    hps.data.filter_length,
                    hps.data.n_mel_channels,
                    hps.data.sampling_rate,
                    hps.data.hop_length,
                    hps.data.win_length,
                    hps.data.mel_fmin,
                    hps.data.mel_fmax,
                )
            if hps.train.fp16_run == True:
                y_hat_mel = y_hat_mel.half()
            wave = commons.slice_segments(
                wave, ids_slice * hps.data.hop_length, hps.train.segment_size
            )

            y_d_hat_r, y_d_hat_g, _, _ = net_d(wave, y_hat.detach())
            with autocast(enabled=False):
                loss_disc, losses_disc_r, losses_disc_g = discriminator_loss(
                    y_d_hat_r, y_d_hat_g
                )

        # Discriminator backward and update
        optim_d.zero_grad()
        scaler.scale(loss_disc).backward()
        scaler.unscale_(optim_d)
        grad_norm_d = commons.clip_grad_value(net_d.parameters(), None)
        scaler.step(optim_d)

        # Generator backward and update
        with autocast(enabled=hps.train.fp16_run):
            y_d_hat_r, y_d_hat_g, fmap_r, fmap_g = net_d(wave, y_hat)
            with autocast(enabled=False):
                loss_mel = F.l1_loss(y_mel, y_hat_mel) * hps.train.c_mel
                loss_kl = kl_loss(z_p, logs_q, m_p, logs_p, z_mask) * hps.train.c_kl
                loss_fm = feature_loss(fmap_r, fmap_g)
                loss_gen, losses_gen = generator_loss(y_d_hat_g)
                loss_gen_all = loss_gen + loss_fm + loss_mel + loss_kl

                if loss_gen_all < lowest_value["value"]:
                    lowest_value["value"] = loss_gen_all
                    lowest_value["step"] = global_step
                    lowest_value["epoch"] = epoch
                    # print(f'Lowest generator loss updated: {lowest_value["value"]} at epoch {epoch}, step {global_step}')
                    if epoch > lowest_value["epoch"]:
                        print(
                            "Alert: The lower generating loss has been exceeded by a lower loss in a subsequent epoch."
                        )

        optim_g.zero_grad()
        scaler.scale(loss_gen_all).backward()
        scaler.unscale_(optim_g)
        grad_norm_g = commons.clip_grad_value(net_g.parameters(), None)
        scaler.step(optim_g)
        scaler.update()

        # Logging and checkpointing
        if rank == 0:
            if global_step % hps.train.log_interval == 0:
                lr = optim_g.param_groups[0]["lr"]
                # print("Epoch: {} [{:.0f}%]".format(epoch, 100.0 * batch_idx / len(train_loader)))

                if loss_mel > 75:
                    loss_mel = 75
                if loss_kl > 9:
                    loss_kl = 9

                scalar_dict = {
                    "loss/g/total": loss_gen_all,
                    "loss/d/total": loss_disc,
                    "learning_rate": lr,
                    "grad_norm_d": grad_norm_d,
                    "grad_norm_g": grad_norm_g,
                }
                scalar_dict.update(
                    {
                        "loss/g/fm": loss_fm,
                        "loss/g/mel": loss_mel,
                        "loss/g/kl": loss_kl,
                    }
                )

                scalar_dict.update(
                    {"loss/g/{}".format(i): v for i, v in enumerate(losses_gen)}
                )
                scalar_dict.update(
                    {"loss/d_r/{}".format(i): v for i, v in enumerate(losses_disc_r)}
                )
                scalar_dict.update(
                    {"loss/d_g/{}".format(i): v for i, v in enumerate(losses_disc_g)}
                )
                image_dict = {
                    "slice/mel_org": plot_spectrogram_to_numpy(
                        y_mel[0].data.cpu().numpy()
                    ),
                    "slice/mel_gen": plot_spectrogram_to_numpy(
                        y_hat_mel[0].data.cpu().numpy()
                    ),
                    "all/mel": plot_spectrogram_to_numpy(mel[0].data.cpu().numpy()),
                }
                summarize(
                    writer=writer,
                    global_step=global_step,
                    images=image_dict,
                    scalars=scalar_dict,
                )

        global_step += 1

    # Save checkpoint
    if epoch % hps.save_every_epoch == 0 and rank == 0:
        checkpoint_suffix = "{}.pth".format(
            global_step if hps.if_latest == 0 else 2333333
        )
        save_checkpoint(
            net_g,
            optim_g,
            hps.train.learning_rate,
            epoch,
            os.path.join(hps.model_dir, "G_" + checkpoint_suffix),
        )
        save_checkpoint(
            net_d,
            optim_d,
            hps.train.learning_rate,
            epoch,
            os.path.join(hps.model_dir, "D_" + checkpoint_suffix),
        )

        if rank == 0 and hps.custom_save_every_weights == "1":
            if hasattr(net_g, "module"):
                ckpt = net_g.module.state_dict()
            else:
                ckpt = net_g.state_dict()
            extract_model(
                ckpt,
                hps.sample_rate,
                hps.if_f0,
                hps.name,
                os.path.join(
                    hps.model_dir, "{}_{}e_{}s.pth".format(hps.name, epoch, global_step)
                ),
                epoch,
                global_step,
                hps.version,
                hps,
            )

    # Overtraining detection and best model saving
    if hps.overtraining_detector == 1:
        if epoch >= (lowest_value["epoch"] + hps.overtraining_threshold):
            print(
                "Stopping training due to possible overtraining. Lowest generator loss: {} at epoch {}, step {}".format(
                    lowest_value["value"], lowest_value["epoch"], lowest_value["step"]
                )
            )
            os._exit(2333333)

        best_epoch = lowest_value["epoch"] + hps.overtraining_threshold - epoch

        if best_epoch == hps.overtraining_threshold:
            old_model_files = glob.glob(
                os.path.join(
                    hps.model_dir,
                    "{}_{}e_{}s_best_epoch.pth".format(hps.name, "*", "*"),
                )
            )
            for file in old_model_files:
                os.remove(file)

            if hasattr(net_g, "module"):
                ckpt = net_g.module.state_dict()
            else:
                ckpt = net_g.state_dict()

            extract_model(
                ckpt,
                hps.sample_rate,
                hps.if_f0,
                hps.name,
                os.path.join(
                    hps.model_dir,
                    "{}_{}e_{}s_best_epoch.pth".format(hps.name, epoch, global_step),
                ),
                epoch,
                global_step,
                hps.version,
                hps,
            )

    # Print training progress
    if rank == 0:
        lowest_value_rounded = float(lowest_value["value"])  # Convert to float
        lowest_value_rounded = round(
            lowest_value_rounded, 3
        )  # Round to 3 decimal place

        if epoch > 1 and hps.overtraining_detector == 1:
            print(
                f"{hps.name} | epoch={epoch} | step={global_step} | {epoch_recorder.record()} | lowest_value={lowest_value_rounded} (epoch {lowest_value['epoch']} and step {lowest_value['step']}) | Number of epochs remaining for overtraining: {lowest_value['epoch'] + hps.overtraining_threshold - epoch}"
            )
        elif epoch > 1 and hps.overtraining_detector == 0:
            print(
                f"{hps.name} | epoch={epoch} | step={global_step} | {epoch_recorder.record()} | lowest_value={lowest_value_rounded} (epoch {lowest_value['epoch']} and step {lowest_value['step']})"
            )
        else:
            print(
                f"{hps.name} | epoch={epoch} | step={global_step} | {epoch_recorder.record()}"
            )
        last_loss_gen_all = loss_gen_all

    # Save the final model
    if epoch >= hps.custom_total_epoch and rank == 0:
        lowest_value_rounded = float(lowest_value["value"])  # Convert to float
        lowest_value_rounded = round(
            lowest_value_rounded, 3
        )  # Round to 3 decimal place
        print(
            f"Training has been successfully completed with {epoch} epoch, {global_step} steps and {round(loss_gen_all.item(), 3)} loss gen."
        )
        print(
            f"Lowest generator loss: {lowest_value_rounded} at epoch {lowest_value['epoch']}, step {lowest_value['step']}"
        )

        pid_file_path = os.path.join(now_dir, "rvc", "train", "train_pid.txt")
        os.remove(pid_file_path)

        if hasattr(net_g, "module"):
            ckpt = net_g.module.state_dict()
        else:
            ckpt = net_g.state_dict()

        extract_model(
            ckpt,
            hps.sample_rate,
            hps.if_f0,
            hps.name,
            os.path.join(
                hps.model_dir, "{}_{}e_{}s.pth".format(hps.name, epoch, global_step)
            ),
            epoch,
            global_step,
            hps.version,
            hps,
        )
        sleep(1)
        os._exit(2333333)


if __name__ == "__main__":
    torch.multiprocessing.set_start_method("spawn")
    main()
