import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import api from '../utils/api';

const FaceRegistration = ({ employeeId, onRegistrationComplete, existingFaceData }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFaces, setCapturedFaces] = useState([]);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const videoElement = useRef(null);
  const canvasElement = useRef(null);

  useEffect(() => {
    loadModels();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoElement.current && canvasElement.current && isModelLoaded) {
      startVideo();
    }
  }, [isModelLoaded]);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelLoaded(true);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load face detection models. Please ensure models are available.');
      setIsLoading(false);
    }
  };

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: {} });
      setStream(mediaStream);
      if (videoElement.current) {
        videoElement.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const handleVideoPlay = () => {
    if (!videoElement.current || !canvasElement.current) return;

    const displaySize = {
      width: videoElement.current.videoWidth,
      height: videoElement.current.videoHeight
    };

    faceapi.matchDimensions(canvasElement.current, displaySize);

    const interval = setInterval(async () => {
      if (!videoElement.current || !canvasElement.current) {
        clearInterval(interval);
        return;
      }

      const ctx = canvasElement.current.getContext('2d');
      if (!ctx) {
        clearInterval(interval);
        return;
      }

      const detections = await faceapi
        .detectAllFaces(videoElement.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      ctx.clearRect(0, 0, canvasElement.current.width, canvasElement.current.height);

      faceapi.draw.drawDetections(canvasElement.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasElement.current, resizedDetections);
    }, 100);

    return () => clearInterval(interval);
  };

  const captureFace = async () => {
    if (!videoElement.current || !isModelLoaded) return;

    setIsCapturing(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoElement.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptor = Array.from(detection.descriptor);
        setCapturedFaces(prev => [...prev, descriptor]);
        
        if (capturedFaces.length >= 2) {
          await submitFaceData([...capturedFaces, descriptor]);
        }
      } else {
        setError('No face detected. Please position your face clearly in the frame.');
      }
    } catch (err) {
      setError('Failed to capture face. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const submitFaceData = async (descriptors) => {
    try {
      // Store raw array of descriptors instead of averaging
      const faceData = JSON.stringify(descriptors);

      const response = await api.put(`/employees/${employeeId}/update-face`, {
        face_data: faceData
      });

      onRegistrationComplete(response.data);
    } catch (err) {
      setError('Failed to save face data. Please try again.');
    }
  };

  const resetCapture = () => {
    setCapturedFaces([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Face Registration</h3>
      
      {isLoading && (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <RefreshCw className="h-8 w-8 text-royal-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading face detection models...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="ml-2 text-red-700">{error}</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <video
              ref={videoElement}
              autoPlay
              muted
              onPlay={handleVideoPlay}
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasElement}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Captures: {capturedFaces.length}/3</span>
              {capturedFaces.map((_, i) => (
                <Check key={i} className="h-4 w-4 text-green-600" />
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={resetCapture}
                disabled={isCapturing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={captureFace}
                disabled={isCapturing || capturedFaces.length >= 3}
                className="btn-primary flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>{isCapturing ? 'Capturing...' : 'Capture Face'}</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-medium">Instructions:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Position your face clearly in the frame</li>
              <li>Ensure good lighting</li>
              <li>Capture 3 images from slightly different angles</li>
              <li>Keep a neutral expression</li>
              <li>Multiple descriptors improve recognition accuracy</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceRegistration;
