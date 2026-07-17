import React, { useState, useEffect, useRef } from 'react';
import { Camera, LogIn, LogOut, Clock, Building, X, AlertCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import api from '../utils/api';

const BiometricTerminal = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [lastAction, setLastAction] = useState(null);
  
  // Modal states
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalMessageType, setModalMessageType] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [stream, setStream] = useState(null);
  
  const videoElement = useRef(null);
  const canvasElement = useRef(null);

  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      setModalMessage('Loading face recognition models...');
      setModalMessageType('info');
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelLoaded(true);
      setIsLoadingModels(false);
      setModalMessage('');
    } catch (err) {
      console.error('Failed to load face detection models:', err);
      setIsLoadingModels(false);
      setModalMessage('Failed to load face recognition models. Please try again.');
      setModalMessageType('error');
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
      setModalMessage('Unable to access camera. Please ensure camera permissions are granted.');
      setModalMessageType('error');
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

      const detections = await faceapi
        .detectAllFaces(videoElement.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvasElement.current.getContext('2d');
      ctx.clearRect(0, 0, canvasElement.current.width, canvasElement.current.height);

      faceapi.draw.drawDetections(canvasElement.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasElement.current, resizedDetections);
    }, 200);

    return () => clearInterval(interval);
  };

  const recognizeFace = async () => {
    if (!videoElement.current || !targetEmployee) {
      setModalMessage('Camera not ready or employee data missing.');
      setModalMessageType('error');
      return;
    }

    setModalLoading(true);
    setModalMessage('');

    try {
      const detections = await faceapi
        .detectSingleFace(videoElement.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setModalMessage('No face detected in image. Please position your face in the camera frame.');
        setModalMessageType('error');
        setModalLoading(false);
        return;
      }

      const capturedDescriptor = detections.descriptor;
      const storedFaceData = JSON.parse(targetEmployee.face_data);
      
      // Handle both old format (single descriptor) and new format (array of descriptors)
      const storedDescriptors = Array.isArray(storedFaceData[0]) 
        ? storedFaceData 
        : [storedFaceData];
      
      // Compare against all descriptors
      let matchFound = false;
      let minDistance = Infinity;
      
      for (const storedDescriptor of storedDescriptors) {
        const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);
        minDistance = Math.min(minDistance, distance);
        
        // Strict threshold: 0.45 - accept if ANY descriptor matches
        if (distance <= 0.45) {
          matchFound = true;
          break;
        }
      }

      if (matchFound) {
        // Face matches - proceed with clock in/out
        await processAttendance();
      } else {
        setModalMessage(`Face does not match the entered Employee ID. Closest match distance: ${minDistance.toFixed(3)}. Please try again.`);
        setModalMessageType('error');
      }
    } catch (err) {
      console.error('Face recognition error:', err);
      setModalMessage('Error during face recognition. Please try again.');
      setModalMessageType('error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!employeeId) {
      setMessage('Please enter an Employee ID');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.get(`/employees/by-employee-id/${employeeId}`);
      setTargetEmployee(response.data.employee);
      setPendingAction('clock-in');
      setShowFaceModal(true);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to validate employee');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!employeeId) {
      setMessage('Please enter an Employee ID');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.get(`/employees/by-employee-id/${employeeId}`);
      setTargetEmployee(response.data.employee);
      setPendingAction('clock-out');
      setShowFaceModal(true);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to validate employee');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const processAttendance = async () => {
    try {
      const endpoint = pendingAction === 'clock-in' ? '/attendance/clock-in' : '/attendance/clock-out';
      const response = await api.post(endpoint, {
        employee_id: targetEmployee.employee_id,
        method: 'face_recognition',
      });

      const actionText = pendingAction === 'clock-in' ? 'Clock in' : 'Clock out';
      const suffix = pendingAction === 'clock-in' 
        ? (response.data.isLate ? ' (Late arrival)' : '')
        : (response.data.isEarlyDeparture ? ' (Early departure)' : '');

      setMessage(`${actionText} successful for ${targetEmployee.employee_id}${suffix}`);
      setMessageType('success');
      setLastAction({ type: pendingAction, time: new Date(), employeeId: targetEmployee.employee_id });
      setEmployeeId('');
      closeModal();
    } catch (error) {
      setModalMessage(error.response?.data?.error || `${pendingAction} failed`);
      setModalMessageType('error');
    }
  };

  const closeModal = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoElement.current) {
      videoElement.current.srcObject = null;
    }
    setShowFaceModal(false);
    setTargetEmployee(null);
    setPendingAction(null);
    setModalMessage('');
    setModalMessageType('');
    setIsModelLoaded(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleClockIn();
    }
  };

  // Initialize modal when it opens
  useEffect(() => {
    if (showFaceModal) {
      loadModels();
    }
  }, [showFaceModal]);

  // Start video when models are loaded
  useEffect(() => {
    if (showFaceModal && isModelLoaded && !stream) {
      startVideo();
    }
  }, [showFaceModal, isModelLoaded, stream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-600 to-royal-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <Building className="h-16 w-16 mx-auto text-royal-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Vitality Hospital</h1>
          <p className="text-gray-600 mt-2">Biometric Terminal</p>
        </div>

        <div className="card mb-6">
          <div className="text-center mb-6">
            <Camera className="h-16 w-16 mx-auto text-royal-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Employee Clock In/Out</h2>
            <p className="text-gray-600 mt-2">Enter your Employee ID to begin</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input-field text-center text-2xl tracking-wider"
              placeholder="EMP001"
              autoFocus
            />
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-center ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="btn-primary flex items-center justify-center space-x-2 py-4 text-lg"
            >
              <LogIn className="h-6 w-6" />
              <span>{loading ? 'Processing...' : 'Clock In'}</span>
            </button>
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="btn-secondary flex items-center justify-center space-x-2 py-4 text-lg"
            >
              <LogOut className="h-6 w-6" />
              <span>{loading ? 'Processing...' : 'Clock Out'}</span>
            </button>
          </div>
        </div>

        {lastAction && (
          <div className="card mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-royal-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Last Action: {lastAction.type === 'clock-in' ? 'Clock In' : 'Clock Out'}
                </p>
                <p className="text-sm text-gray-600">
                  Employee: {lastAction.employeeId} at {lastAction.time.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="text-lg font-bold text-royal-600 mb-4">Instructions</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Enter your Employee ID in the field above</li>
            <li>• Click "Clock In" when arriving for your shift</li>
            <li>• Click "Clock Out" when leaving for the day</li>
            <li>• Face verification will be required after clicking</li>
            <li>• Late arrivals and early departures will be marked automatically</li>
            <li>• Contact HR if you experience any issues</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-royal-600 hover:text-royal-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Face Verification Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {pendingAction === 'clock-in' ? 'Clock In' : 'Clock Out'} Verification
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {targetEmployee && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee:</span> {targetEmployee.first_name} {targetEmployee.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {targetEmployee.employee_id}
                </p>
              </div>
            )}

            {isLoadingModels && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading face recognition models...</p>
              </div>
            )}

            {!isLoadingModels && isModelLoaded && (
              <>
                <div className="mb-4">
                  <div className="relative bg-black rounded-lg overflow-hidden mx-auto" style={{ height: '300px' }}>
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
                </div>

                {modalMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-center ${
                      modalMessageType === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : modalMessageType === 'info'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {modalMessage}
                  </div>
                )}

                <button
                  onClick={recognizeFace}
                  disabled={modalLoading}
                  className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                >
                  <Camera className="h-5 w-5" />
                  <span>{modalLoading ? 'Processing...' : 'Recognize Face'}</span>
                </button>
              </>
            )}

            {!isLoadingModels && !isModelLoaded && modalMessage && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{modalMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricTerminal;
