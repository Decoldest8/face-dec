# Face-API.js Models

This directory contains the face-api.js models required for face recognition functionality.

## Required Models

The following models need to be downloaded from the face-api.js repository:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_landmark_68_model-shard2**
6. **face_recognition_model-weights_manifest.json**
7. **face_recognition_model-shard1**
8. **face_recognition_model-shard2**

## Download Instructions

Download the models from the official face-api.js repository:

https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Place the model files in this directory (`frontend/public/models/`).

## Alternative: Use CDN

Alternatively, you can modify the MODEL_URL in the FaceRegistration and BiometricTerminal components to use a CDN:

```javascript
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
```

## Model Files

- **tiny_face_detector**: Lightweight face detection model
- **face_landmark_68**: 68-point facial landmark detection
- **face_recognition**: Face descriptor extraction for recognition
