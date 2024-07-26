# Deep Voice Classifier

## Our Project

### Project Overview

- The proliferation of deep learning and audio synthesis technologies has made the creation of highly realistic synthetic voices, i.e., deepfake voices, possible. These synthetic voices can closely mimic real human voices, presenting significant challenges in fields such as security, authentication, and media integrity. Therefore, it is crucial to effectively distinguish between genuine human voices and deepfake voices.

### Project Objectives

- The primary objective of this project is to develop an accurate and reliable classifier capable of detecting deepfake voices. To achieve this, we will utilize advanced machine learning techniques. By converting audio signals into mel-spectrogram images and applying sophisticated visual classification methods, we aim to identify and differentiate between real and fake voices.

### Key Project Steps

1. **Library Invocation**:

    - Invoke libraries such as numpy, pandas, torch, torchaudio, matplotlib, and tensorflow required for audio processing and model training.

2. **Loading and Processing WAV Files**:

    - Use torchaudio to load audio data, ensuring consistency and preprocessing.

3. **Audio Segmentation and Noise Removal**:

    - Employ audio separation models to isolate human voices from background noise, enhancing the clarity of audio data.

4. **Segmenting Audio into 1-Second Intervals**:

    - Split the cleaned audio data into 1-second intervals for precise analysis and feature extraction.

5. **Converting Segmented Audio to Mel-Spectrograms**:

    - Convert each 1-second audio segment into a mel-spectrogram using torchaudio.

6. **Setting up and Training Vision Transformer (ViT)**:

    - Use mel-spectrograms as input data to prepare and train the FastViT model.

7. **Model Evaluation**:

    - Evaluate the performance of the trained model using validation or test data.

8. **Deploying the Model in ONNX Format**:

    - Convert and deploy the trained model in ONNX format.

### Inference

1. **Loading WAV or MP3 Voice Data**:

    - Load the audio data to be classified using torchaudio. This step ensures that the audio data is in a suitable format for further processing.

2. **Converting Audio Data to Mel-Spectrogram Images**:

    - If necessary, split the audio and then apply mel-spectrogram conversion to transform the audio data into mel-spectrogram images.

3. **Inputting Mel-Spectrogram Images to the Model**:

    - Input the mel-spectrogram images into the trained ViT model. The mel-spectrograms need to be resized and normalized to meet the input requirements of the ViT model.

4. **Class Prediction**:

    - Use the model to predict the class of each mel-spectrogram segment. The model outputs the probability or class indicating whether the voice is a deepfake or a real human voice.

### Introduction to DeepVoiceClassifier Workflow

#### Summary

- The objective of this project is to detect deepfake voices using the Vision Transformer (ViT) model. By converting audio data into mel-spectrogram images, we leverage the capabilities of the ViT model to distinguish between real human voices and deepfake voices. This approach is designed to enhance the accuracy and efficiency of deepfake voice detection.

#### Introduction

- The proliferation of deepfake technology has made it essential to detect artificially generated voices. This project aims to address this issue by utilizing the Vision Transformer (ViT) model, which is optimized for speed and performance. By converting audio signals into mel-spectrogram images, we can effectively apply visual classification techniques to the audio domain.

#### Related Research

- Previous studies have explored various methods for deepfake voice detection, including traditional machine learning algorithms, convolutional neural networks (CNNs), and recurrent neural networks (RNNs). This project builds on these foundations by leveraging the advanced features of ViT, known for its efficient architecture and high accuracy in image classification tasks.

#### DeepVoiceClassifier

The key steps of our approach are as follows:

1. **Feature Extraction**:

    - Segment audio signals into 1-second intervals and convert them into mel-spectrogram images.

2. **Model Architecture**:

    - Utilize the ViT model to process mel-spectrogram images.

3. **Training**:

    - Train the model with a labeled dataset consisting of real human voices and deepfake voices.

4. **Inference**:

    - Use the trained model to classify new audio samples, providing predictions on whether they are real or fake.

#### Experiments

- To validate our approach, we conducted experiments using a labeled dataset of audio samples. The dataset includes real human voices and deepfake voices generated using the latest synthesis technologies. We split the dataset into training and testing sets, trained the ViT model, and evaluated its performance using standard metrics such as accuracy, precision, recall, and F1-score.

  - Accuracy for 1-minute voice segments:

        - ViT : 98.8% ACC

        - FastViT : 98.8% ACC

        - Shallow CNN : 96.2% ACC

        - ResNet : 95.8% ACC

    - Inference speed for 1-minute voice segments:

      - ViT : 5s

      - FastViT : 8s

      - Shallow CNN : 11s

      - ResNet : 8s

#### Conclusion

- Our experiments demonstrate that the ViT model, when applied to mel-spectrogram images, achieves high accuracy in detecting deepfake voices. This approach offers a robust solution for real-time deepfake voice detection, with potential applications in security, authentication, and media verification. Future work may include further optimization of the model and exploration of additional features to enhance detection capabilities. By leveraging the advanced Vision Transformer model, we aim to set a new standard in the field of deepfake voice detection.
