'''
uvicorn vit_app:app --host 0.0.0.0 --port 8000
백그라운드 실행 : nohup uvicorn vit_app:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &
실핼 확인 : tail -f uvicorn.log 또는 ps aux | grep uvicorn
종료 : ps aux | grep uvicorn 으로 <PID> 찾은 후 sudo kill -9 <PID>

Program Process
1. request 대기
2. key 검증(boolean)
3. 추론 타입 확인
4. 오디오 파일 호출
5. 음성, 배경 분리
6. 음성 데이터에서 1초 단위로 분할
7. 분할된 음성 데이터에서 멜 스펙트로그램 추출
8. ONNX 모델 추론
9. 결과 반환
'''

# Import Libraries
## FastAPI
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn
## AWS S3
import boto3
## Video to wav
from moviepy.editor import VideoFileClip
## Youtube to wav
import yt_dlp as youtube_dl
from pydub import AudioSegment
## Audio Splitter
from lib import dataset
from lib import nets
from lib import spec_utils
from lib import utils
## Common
import numpy as np
import librosa
import soundfile as sf
import os
import re
import json
import logging
import datetime
import base64
import pytz
import urllib.parse
import uuid
import torch
import onnxruntime as ort
from scipy.signal import butter, lfilter
from urllib.parse import urlparse
from io import BytesIO
from skimage.transform import resize

app = FastAPI()

'''
System Log
'''
log_dir = "./log"
log_file = "app.log"
log_path = os.path.join(log_dir, log_file)
# 로그 디렉토리 생성 (존재하지 않으면)
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 파일 핸들러 설정
file_handler = logging.FileHandler(log_path)
file_handler.setLevel(logging.INFO)

# 포매터 설정
class KSTFormatter(logging.Formatter):
    def converter(self, timestamp):
        dt = datetime.datetime.fromtimestamp(timestamp, tz=pytz.UTC)
        return dt.astimezone(pytz.timezone('Asia/Seoul'))
    
    def formatTime(self, record, datefmt=None):
        dt = self.converter(record.created)
        if datefmt:
            s = dt.strftime(datefmt)
        else:
            try:
                s = dt.isoformat(timespec='milliseconds')
            except TypeError:
                s = dt.isoformat()
        return s

# 사용 예시
formatter = KSTFormatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

# 핸들러를 로거에 추가
logger.addHandler(file_handler)

'''
AWS S3 Config
'''
# AWS config json 경로
json_file_path = './config/aws_config.json'
assert os.path.exists(json_file_path), f"AWS config file not found: {json_file_path}"

# JSON 파일 읽기
with open(json_file_path, 'r') as file:
    config = json.load(file)

# AWS 설정
try:
    AWS_REGION = config['AWS_REGION']
    AWS_STORAGE_BUCKET_NAME = config['AWS_STORAGE_BUCKET_NAME']
    AWS_ACCESS_KEY_ID = config['AWS_ACCESS_KEY_ID']
    AWS_SECRET_ACCESS_KEY = config['AWS_SECRET_ACCESS_KEY']
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com'

    # Static Setting
    STATIC_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/static/"
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

    # Media Setting
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
except KeyError as e:
    logger.error(f"Missing AWS configuration key: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Missing AWS configuration key: {str(e)}")

# Initialize S3 client
s3_client = boto3.client(
    's3',
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

# aws s3 Download
def download_from_s3(bucket_name, file_key, download_path, client_ip):
    try:
        s3_client.download_file(bucket_name, file_key, download_path)
        logger.info(f"{file_key} download successful. -- {client_ip}.")
        return True
    except Exception as e:
        logger.error(f"Error downloading file from S3: {str(e)} -- {client_ip}")
        return False

# aws s3 Delete
def delete_from_s3(bucket_name, file_key, client_ip):
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        logger.info(f"{file_key} delete successful. -- {client_ip}")
        return True
    except Exception as e:
        logger.error(f"Error deleting file from S3: {str(e)} -- {client_ip}")
        return False

# aws s3 upload
def upload_to_s3(file_path, bucket_name, s3_key):
    try:
        s3_client.upload_file(file_path, bucket_name, s3_key)
        logging.info(f"Uploaded {file_path} to s3://{bucket_name}/{s3_key}")
        return True
    except Exception as e:
        logging.error(f"Failed to upload {file_path} to S3: {str(e)}")
        return False

'''
Allowed IP Address
'''
allowed_ip_file = "./config/access_ip.json"
with open(allowed_ip_file, 'r') as file:
    allowed_ip_list = json.load(file)
allowed_ips = allowed_ip_list['allowed_ips']

'''
Get raw audio data
'''
def get_sample_rate(file_path):
    try:
        audio = AudioSegment.from_file(file_path)
        sample_rate = audio.frame_rate
        return sample_rate
    except Exception as e:
        logger.error(f"Failed to get sample rate from file: {file_path} -- {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get sample rate from file")
    
def get_raw_audio(client_ip, infer_type, data_url):
    if infer_type == "aws":
        logger.info(f"Select AWS S3 Inference Type. -- {client_ip}")
        logger.info(f"Data url : {data_url} -- {client_ip}")
        
        # s3 파일 경로 정보 파싱
        parsed_url = urlparse(data_url)
        bucket_name = parsed_url.netloc.split('.')[0]
        file_key = parsed_url.path.lstrip('/')
        
        # 파일 경로 정의(서버)
        data_path = f"/tmp/{os.path.basename(file_key)}"  # Temporary path to store the downloaded file
        
        # Download the audio file from S3
        if not download_from_s3(bucket_name, file_key, data_path, client_ip):
            raise HTTPException(status_code=500, detail="Failed to download file from S3")
        
        # Get sample rate from the downloaded file
        sample_rate = get_sample_rate(data_path)
        return data_path

    elif infer_type == "youtube":
        logger.info(f"Select YouTube Inference Type. -- {client_ip}")
        # 유튜브 링크 패턴
        youtube_url_pattern = re.compile(r'^(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})')
        # data_url이 유튜브 링크인지 확인
        if not re.match(youtube_url_pattern, data_url):
            logger.error(f"Invalid YouTube link. -- {client_ip}")
            raise HTTPException(status_code=400, detail="Invalid YouTube link.")
        logger.info(f"Data url : {data_url} -- {client_ip}")
        
        # Download audio from YouTube
        unique_id = str(uuid.uuid4())
        output_filename = f"./tmp/youtube_file_{unique_id}.wav"
        ydl_opts = {
            'format': 'bestaudio/best',
            'noplaylist': True,
            'quiet': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
            }],
            'outtmpl': f"./tmp/youtube_file_{unique_id}"  # Path to save the file
        }

        try:
            with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                ydl.download([data_url])
                data_path = output_filename  # Save path should match the postprocessor output format
        except Exception as e:
            logger.error(f"Failed to download audio from YouTube: {data_url} -- {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to download audio from YouTube: {data_url}")
        
        # Get sample rate from the downloaded file
        sample_rate = get_sample_rate(data_path)
        return data_path
    
    else:
        logger.error(f"Inference type is not supported. -- {client_ip}")
        raise HTTPException(status_code=400, detail="Inference type is not supported.")

'''
Audio Splitter
'''
class Separator(object):

    def __init__(self, model, device=None, batchsize=1, cropsize=256):
        self.model = model
        self.offset = model.offset
        self.device = device
        self.batchsize = batchsize
        self.cropsize = cropsize

    def _postprocess(self, X_spec, mask_y, mask_v):
        X_mag = np.abs(X_spec)
        X_phase = np.angle(X_spec)

        y_spec = X_mag * mask_y * np.exp(1.j * X_phase)
        v_spec = X_mag * mask_v * np.exp(1.j * X_phase)

        return y_spec, v_spec

    def _separate(self, X_spec_pad, roi_size):
        X_dataset = []
        patches = (X_spec_pad.shape[2] - 2 * self.offset) // roi_size
        for i in range(patches):
            start = i * roi_size
            X_spec_crop = X_spec_pad[:, :, start:start + self.cropsize]
            X_dataset.append(X_spec_crop)

        X_dataset = np.asarray(X_dataset)

        self.model.eval()
        with torch.no_grad():
            mask_y_list = []
            mask_v_list = []
            # To reduce the overhead, dataloader is not used.
            for i in range(0, patches, self.batchsize):
                X_batch = X_dataset[i: i + self.batchsize]
                X_batch = torch.from_numpy(X_batch).to(self.device)

                mask_y, mask_v = self.model.predict_mask(torch.abs(X_batch))

                mask_y = mask_y.detach().cpu().numpy()
                mask_y = np.concatenate(mask_y, axis=2)
                mask_y_list.append(mask_y)

                mask_v = mask_v.detach().cpu().numpy()
                mask_v = np.concatenate(mask_v, axis=2)
                mask_v_list.append(mask_v)

            mask_y = np.concatenate(mask_y_list, axis=2)
            mask_v = np.concatenate(mask_v_list, axis=2)

        return mask_y, mask_v

    def separate(self, X_spec):
        n_frame = X_spec.shape[2]
        pad_l, pad_r, roi_size = dataset.make_padding(n_frame, self.cropsize, self.offset)
        X_spec_pad = np.pad(X_spec, ((0, 0), (0, 0), (pad_l, pad_r)), mode='constant')
        X_spec_pad /= np.abs(X_spec).max()

        mask_y, mask_v = self._separate(X_spec_pad, roi_size)
        mask_y = mask_y[:, :, :n_frame]
        mask_v = mask_v[:, :, :n_frame]

        y_spec, v_spec = self._postprocess(X_spec, mask_y, mask_v)

        return y_spec, v_spec
    
SPLITTER_MODEL_PATH = './models/baseline.pth'
if torch.cuda.is_available():
    device = torch.device('cuda:0')
elif torch.backends.mps.is_available() and torch.backends.mps.is_built():
    device = torch.device('mps')
else:
    device = torch.device('cpu')

def audio_splitter(audio_file):
    sample_rate = 44100
    n_fft = 2048
    hop_length = 1024
    batchsize = 4
    cropsize = 256
    output_dir = './tmp/'
    
    model = nets.CascadedNet(n_fft, hop_length, 32, 128)
    model.load_state_dict(torch.load(SPLITTER_MODEL_PATH, map_location='cpu'))
    model.to(device)
    
    X, sr = librosa.load(
        audio_file, sr=sample_rate, mono=False, dtype=np.float32, res_type='kaiser_fast'
    )
    basename = os.path.splitext(os.path.basename(audio_file))[0]
    
    if X.ndim == 1:
        # mono to stereo
        X = np.asarray([X, X])
    
    X_spec = spec_utils.wave_to_spectrogram(X, hop_length, n_fft)
    sp = Separator(
        model=model,
        device=device,
        batchsize=batchsize,
        cropsize=cropsize
    )
    
    y_spec, v_spec = sp.separate(X_spec)
    # wave = spec_utils.spectrogram_to_wave(y_spec, hop_length=hop_length)
    # sf.write('{}{}_Instruments.wav'.format(output_dir, basename), wave.T, sr)
    wave = spec_utils.spectrogram_to_wave(v_spec, hop_length=hop_length)
    sf.write('{}{}_Vocals.wav'.format(output_dir, basename), wave.T, sr)
    # raw audio 삭제
    os.remove(audio_file)
    return '{}{}_Vocals.wav'.format(output_dir, basename)

'''
Audio Filter Processing
'''
def butter_bandstop(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='bandstop')
    return b, a

def bandstop_filter(data, lowcut, highcut, fs, order=5):
    b, a = butter_bandstop(lowcut, highcut, fs, order=order)
    y = lfilter(b, a, data)
    return y

'''
Mel-Spectrogram Processing
'''
def extract_melspectrogram(segment, n_mels=128):
    sample_rate = 44100
    n_fft = 2048
    hop_length = 1024
        
    S = librosa.feature.melspectrogram(y=segment, sr=sample_rate,
                                       n_fft=n_fft, hop_length=hop_length,
                                       n_mels=n_mels)
    S_dB = librosa.power_to_db(S, ref=np.max)
    return S_dB

def prepare_input(audio_data, n_mels=128, target_size=(128, 128)):
    sample_rate = 44100
    
    if len(audio_data) < sample_rate:
        # 전체 음성 길이가 1초 미만일 경우 0으로 채워서 1초로 만듦
        audio_data = np.pad(audio_data, (0, sample_rate - len(audio_data)), mode='constant')

    num_segments = int(np.ceil(len(audio_data) / sample_rate))  # 전체 음성을 1초 단위로 나눈 섹션의 수 계산
    spectrogram_segments = []  # 멜-스펙토그램을 저장할 리스트

    for i in range(num_segments):
        start_sample = i * sample_rate  # 시작 샘플 인덱스
        end_sample = start_sample + sample_rate  # 끝 샘플 인덱스
        segment = audio_data[start_sample:end_sample]  # 1초 단위로 음성 데이터 자르기

        if len(segment) < sample_rate:
            if i == 0:
                # 첫 번째 세그먼트가 1초보다 짧으면 0으로 채움
                segment = np.pad(segment, (0, sample_rate - len(segment)), mode='constant')
            else:
                # 마지막 세그먼트가 1초보다 짧으면 앞의 구간을 가져와서 1초로 채움
                previous_segment = audio_data[start_sample - sample_rate:start_sample]
                segment = np.concatenate((previous_segment[-(sample_rate - len(segment)):], segment))
        
        # 강조된 구간의 값을 0으로 치환
        # segment = np.where((segment >= -20) & (segment <= 20), 1000, segment)
        
        # 필터 적용
        filtered_segment = bandstop_filter(segment, lowcut=150.0, highcut=5500.0, fs=sample_rate, order=5)
        
        # 멜-스펙토그램 추출
        mel_spectrogram = extract_melspectrogram(filtered_segment, n_mels=n_mels)
        
        # 이미지 리사이즈
        mel_spectrogram_resized = resize(mel_spectrogram, target_size, mode='constant', anti_aliasing=True)

        # 모델 입력에 맞게 형식 변경
        mel_spectrogram_resized = mel_spectrogram_resized.astype(np.float32)  # float32로 형변환 추가
        mel_spectrogram_resized = mel_spectrogram_resized[np.newaxis, ..., np.newaxis] # .astype(np.float32)  # (1, 128, 128, 1)
        
        spectrogram_segments.append(mel_spectrogram_resized)  # 리스트에 추가
    return np.concatenate(spectrogram_segments, axis=0)

'''
Deep Voice Classifier Inference
'''
# Load ONNX model - Vision Transformer
onnx_model_path = "./models/Mel_1s_vit.onnx" # Mel_1s_vit.onnx
assert os.path.exists(onnx_model_path), f"Model file not found: {onnx_model_path}"
try:
    ort_session = ort.InferenceSession(onnx_model_path)
except Exception as e:
    logger.error(f"Error loading ONNX model: {str(e)}")
    raise HTTPException(status_code=500, detail="Error loading ONNX model")

# 추론 기준
threshold_1s = 0.8
threshold_t = 0.3

@app.post("/predict")
async def predict(request: Request):
    client_ip = request.client.host # Client IP Address
    if client_ip not in allowed_ips: # Check the accessible IP address
        logger.exception(f"Unauthorized access detected. -- {client_ip}")
        raise HTTPException(status_code=403, detail="Forbidden")

    # Request information verification
    try:
        # 요청 바디가 비어 있는지 확인
        body = await request.body()
        if not body:
            logger.error(f"No information has been received. -- {client_ip}")
            raise HTTPException(status_code=400, detail="No information has been received.")
        
        # 전달받은 정보
        try:
            data = await request.json()
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in request body. -- {client_ip}")
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")

        # 필수 키 목록
        required_keys = ['key_verity', 'data_type', 'file_path']
        # 필수 키가 모두 존재하는지 확인
        for key in required_keys:
            if key not in data:
                logger.error(f"Missing required key from {client_ip}: {key}")
                raise HTTPException(status_code=400, detail=f"Missing required key: {key}")
        
        # 키에 대한 값 가져오기
        key_verity = data.get('key_verity')
        infer_type = data.get('data_type')
        data_url = data.get('file_path')
        data_url = urllib.parse.unquote(data_url)
        
        # 값 검증
        if not isinstance(key_verity, bool):
            logger.error(f"Invalid value for API key. -- {client_ip}")
            raise HTTPException(status_code=400, detail="Invalid value for key_verity.")
        
        if infer_type not in ['aws', 'youtube', 'admin_test']:
            logger.error(f"Invalid value for Inference type. -- {client_ip}")
            raise HTTPException(status_code=400, detail="Invalid value for Inferrence Type.")
        
        if not isinstance(data_url, str):
            logger.error(f"Invalid value for Data path. -- {client_ip}")
            raise HTTPException(status_code=400, detail="Invalid value for Data path.")
        
    except Exception as e:
        logger.exception(f"An error occurred during prediction. -- {client_ip}")
        raise HTTPException(status_code=500, detail="Internal server error")

    # API key 검증 여부 확인
    if key_verity:
        logger.info(f"API key verification successful. -- {client_ip}")
    else:
        logger.error(f"This API key is not authorized. -- {client_ip}")
        raise HTTPException(status_code=400, detail="This API key is not authorized.")

    # 원천 Audio File 획득
    if infer_type == "admin_test":
        admin_content = data['file_content']
        data_url = f"./tmp/{data_url}"
        with open(data_url, "wb") as raw_file:
            raw_file.write(base64.b64decode(admin_content))
        raw_audio_file = data_url
        logger.info(f"File received and saved at {data_url} -- {client_ip}")
    else:
        raw_audio_file = get_raw_audio(client_ip, infer_type, data_url)
    
    # 오디오에서 음성 분리
    splitted_audio_file = audio_splitter(raw_audio_file)
    
    # 음성 오디오 파일 로드
    splitted_audio_data, sr = librosa.load(splitted_audio_file, sr=None)

    # 멜-스펙토그램 추출 및 준비
    melspectrograms = prepare_input(splitted_audio_data)
    
    # Deep Voice Classification
    try:
        input_name = ort_session.get_inputs()[0].name  # ONNX 모델의 입력 이름 가져오기
    except Exception as e:
        return JSONResponse(content={"error": f"Failed to get input name from ONNX session: {str(e)}"}, status_code=500)
    results = []  # 결과를 저장할 리스트
    
    for mel_spectrogram in melspectrograms:
        try:
            # 0.8초 이상의 구간이 0으로 채워져 있는지 확인
            if np.sum(mel_spectrogram == 0) / mel_spectrogram.size > 0.8:
                results.append(None)  # 0.8초 이상의 구간이 0으로 채워져 있으면 결과를 0으로 설정
            else:
                input_data = np.expand_dims(mel_spectrogram, axis=0)  # 모델 입력에 맞게 차원 추가
                result = ort_session.run(None, {input_name: input_data})  # 모델 추론 수행
                results.append(float(result[0][0][0]))  # 결과를 리스트에 추가
        except Exception as e:
            results.append(None)  # 오류가 발생한 경우 None을 추가
            print(f"Error during inference: {str(e)}")
    # 결과가 None인 항목들을 제외하고 Fake/Real 카운트 계산
    valid_results = [r for r in results if r is not None]
    
    if len(valid_results) == 0:
        return JSONResponse(content={"error": "All inferences failed."}, status_code=500)
    
    try:
        fake_cnt = sum(1 for x in valid_results if x >= threshold_1s)  # Fake로 분류된 수 계산
        real_cnt = len(valid_results) - fake_cnt  # Real로 분류된 수 계산

        analysis = fake_cnt / len(valid_results)  # Fake 비율 계산
        if analysis >= threshold_t:
            analysis_result = 'Fake'  # Fake 비율이 임계값 이상이면 'Fake'로 분류
        else:
            analysis_result = 'Real'  # 그렇지 않으면 'Real'로 분류

        # # 업로드할 S3 경로 설정
        # file_name = os.path.basename(data_url)
        # s3_key = f"{analysis_result}/{file_name}"

        # # S3로 업로드
        # if not upload_to_s3(splitted_audio_file, 'your-bucket-name', s3_key):
        #     return JSONResponse(content={"error": "Failed to upload the result to S3."}, status_code=500)
        os.remove(splitted_audio_file)
        
        contents = {
            "predictions": results,  # 1초마다의 모델 결과(확률값)
            "fake_cnt": fake_cnt,  # Fake로 분류된 수
            "real_cnt": real_cnt,  # Real로 분류된 수
            "analysis_result": analysis_result  # 전체 음성 중 Fake의 비율
        }
        return JSONResponse(content=contents)
    except Exception as e:
        return JSONResponse(content={"error": f"Error during result analysis: {str(e)}"}, status_code=500)
    
'''
API Model Server Status Check
'''
@app.get("/status")
async def status():
    local_status = {"status": "OK", "detail": "Server is healthy"}
    return JSONResponse(content=local_status)

'''
System Run
Access : All
Port : 8000
'''
if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)