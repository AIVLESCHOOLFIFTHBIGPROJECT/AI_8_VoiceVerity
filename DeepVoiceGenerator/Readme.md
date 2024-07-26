# Deep Voice Generator

## Our Project

### Project Overview

- The objective of this project is to generate a comprehensive dataset of deep fake voices in Korean to facilitate the development of a deep voice classification model. Due to the lack of existing datasets containing deep fake voices in Korean, we have opted to create our own dataset. This involves using the Deep Voice Generator to produce synthetic voices, ensuring that the dataset is diverse and representative of various demographics, including gender, age groups, regional dialects, and speech characteristics.

### Project Objectives

1. Generate Deep Fake Voice Data: Use the Deep Voice Generator to create synthetic voices for the purpose of building a robust dataset.

2. Dataset Construction: Compile a comprehensive dataset that includes real and synthetic voices, encompassing a wide range of demographics.

3. Deep Voice Classification Model: Utilize the generated dataset to develop a model capable of accurately distinguishing between real and deep fake voices.

### Key Steps in the Project

1. Data Collection:

    - Sources: Utilize data from AI Hub, specifically the following categories:

        - News scripts and anchor voices

        - Free conversation voices (mixed gender, children)

        - Free conversation voices (elderly, mixed gender)

        - Free conversation voices (general population, mixed gender)

    - Demographic Diversity: Collect real voice data that includes a range of genders, age groups, regional dialects, and speech characteristics.

2. Deep Voice Generation:

- Model Selection: Use the open-source RVC model from Applio for voice synthesis.

- Transfer Learning: Apply transfer learning to the RVC model to generate synthetic voices for the following demographics:

  - Children (11 speakers)
  
  - Adults (33 speakers)
  
  - Elderly (10 speakers)

- Data Generation: For each demographic group, generate approximately 210 samples for children, 740 samples for adults, and 290 samples for the elderly.

### Detailed Process

#### Data Collection

1. Real Voice Data:

    - AI Hub Data: Extract real voice data from AI Hub’s categories, ensuring a balanced representation of various demographics.

    - Demographic Information: Include metadata for each sample, specifying gender, age group, regional dialect, and other relevant speech characteristics.

2. Data Preprocessing:

    - Normalization: Normalize the audio data to ensure consistency in volume and quality.

    - Segmentation: Segment the audio files into manageable lengths suitable for training and synthesis.

#### Deep Voice Generation

1. Model Training:

    - RVC Model: Set up and configure the RVC model from Applio for voice synthesis.

    - Transfer Learning: Fine-tune the RVC model using the collected real voice data to adapt it for generating deep fake voices.

    - Demographic Groups: Train separate models or use appropriate conditioning to generate voices for each demographic group (children, adults, elderly).

2. Data Generation:

    - Synthetic Voice Samples: Generate deep fake voice samples for each demographic group, ensuring diversity in speech patterns and characteristics.

    - Quality Control: Implement quality control measures to ensure the generated voices are realistic and high-quality.

#### Dataset Construction

1. Combining Real and Fake Data:

    - Balanced Dataset: Combine the real and synthetic voice data to create a balanced dataset for training the classification model.

    - Metadata: Maintain detailed metadata for each sample, including whether it is real or synthetic and its demographic information.

2. Dataset Augmentation:

    - Additional Augmentation: Apply data augmentation techniques to further diversify the dataset and enhance the model’s robustness.

### Application: Deep Voice Classification

1. Model Development:

    - Feature Extraction: Convert audio samples to mel-spectrograms for input into the classification model.

    - Model Training: Train a Vision Transformer (ViT) model using the prepared dataset to distinguish between real and deep fake voices.

    - Evaluation: Evaluate the model using standard metrics to ensure high accuracy and reliability.

2. Deployment:

    - ONNX Conversion: Convert the trained classification model to ONNX format for deployment.

    - Real-World Application: Deploy the model in applications where real-time deep fake voice detection is required, such as in security and media verification.
