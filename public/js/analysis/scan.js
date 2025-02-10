// Debug logger
function debug(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) console.log(data);
}

// State management
const state = {
    stream: null,
    isProcessing: false,
    model: null,
    scanningInterval: null,
    alignmentStartTime: null,
    lastAnalysisResults: null
};

// DOM Elements
const elements = {
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    photo: document.getElementById('photo'),
    captureButton: document.getElementById('capture'),
    analyzeButton: document.getElementById('analyze'),
    retakeButton: document.getElementById('retake'),
    result: document.getElementById('result'),
    faceStatus: document.getElementById('face-status'),
    overlay: document.querySelector('.face-overlay'),
    countdownNumber: document.querySelector('.countdown-number'),
    overlayMessage: document.querySelector('.overlay-message'),
    cameraSection: document.getElementById('camera-section')
};

// Validate DOM elements
function validateElements() {
    debug('Validating DOM elements');
    const missingElements = [];
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            missingElements.push(key);
        }
    }
    if (missingElements.length > 0) {
        debug('Missing elements:', missingElements);
        throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
    }
}

// Helper Functions
function showMessage(message, duration = 0) {
    debug('Showing message:', message);
    if (!elements.overlayMessage) return;
    elements.overlayMessage.textContent = message;
    elements.overlayMessage.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(() => {
            hideMessage();
        }, duration);
    }
}

function hideMessage() {
    if (!elements.overlayMessage) return;
    elements.overlayMessage.style.display = 'none';
}

function analyzeSkin(imageData) {
    debug('Starting skin analysis');
    const data = imageData.data;
    const metrics = {
        brightness: 0,
        redness: 0,
        texture: 0,
        oiliness: 0
    };

    let validPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;
        validPixels++;
        
        metrics.brightness += (r + g + b) / 3;
        
        const greenBlueAvg = (g + b) / 2;
        if (greenBlueAvg > 0) {
            metrics.redness += (r / greenBlueAvg) - 1;
        }
        
        if (i > 0 && i < data.length - 4) {
            const prevPixel = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
            const currentPixel = (r + g + b) / 3;
            metrics.texture += Math.abs(currentPixel - prevPixel);
        }
        
        if (r > 200 && g > 200 && b > 200) {
            metrics.oiliness++;
        }
    }

    if (validPixels > 0) {
        metrics.brightness = (metrics.brightness / validPixels / 255) * 100;
        metrics.redness = Math.max(0, Math.min(100, (metrics.redness / validPixels) * 50));
        metrics.texture = Math.min(100, (metrics.texture / validPixels) * 20);
        metrics.oiliness = Math.min(100, (metrics.oiliness / validPixels) * 1000);
    }

    Object.keys(metrics).forEach(key => {
        metrics[key] = Math.round(metrics[key] * 100) / 100;
    });

    debug('Analysis complete:', metrics);
    return metrics;
}

async function captureAndAnalyze() {
    debug('Starting capture and analysis');
    try {
        elements.canvas.width = elements.video.videoWidth;
        elements.canvas.height = elements.video.videoHeight;
        const ctx = elements.canvas.getContext('2d');
        ctx.drawImage(elements.video, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
        const metrics = analyzeSkin(imageData);
        state.lastAnalysisResults = metrics;

        elements.photo.src = elements.canvas.toDataURL('image/jpeg');
        debug('Capture and analysis complete');
        return { metrics, imageData: elements.photo.src };
    } catch (error) {
        debug('Error in capture and analyze:', error);
        throw new Error('Failed to capture and analyze photo');
    }
}

async function submitToServer(data) {
    debug('Starting server submission');
    try {
        // Start redirect timeout
        const redirectTimeout = setTimeout(() => {
            debug('Redirect timeout triggered');
            window.location.href = '/process';
        }, 1500);

        const response = await fetch('/analyze/face', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                imageData: data.imageData,
                analysisResults: {
                    brightness: data.metrics.brightness,
                    redness: data.metrics.redness,
                    texture: data.metrics.texture,
                    oiliness: data.metrics.oiliness
                }
            })
        });

        debug('Server response status:', response.status);

        // Clear redirect timeout if response is received quickly
        clearTimeout(redirectTimeout);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        debug('Server response data:', result);

        // Redirect after successful submission
        window.location.href = '/process';
        
        return result;
    } catch (error) {
        debug('Server submission error:', error);
        // Ensure redirect happens even on error
        window.location.href = '/process';
        return null;
    }
}

async function updateOverlayStatus(isInBounds) {
    if (!elements.overlay) return;

    if (isInBounds) {
        elements.overlay.className = 'face-overlay valid';
        elements.faceStatus.innerHTML = 'Perfect position! <span class="checkmark">✓</span>';
        elements.faceStatus.className = 'status-message success';

        if (!state.alignmentStartTime) {
            state.alignmentStartTime = Date.now();
            elements.countdownNumber.textContent = "3";
            showMessage("Hold still...");
        }
        
        const timeAligned = Date.now() - state.alignmentStartTime;
        const remainingSeconds = 3 - Math.floor(timeAligned / 1000);
        
        if (remainingSeconds > 0) {
            elements.countdownNumber.textContent = remainingSeconds.toString();
        } else if (remainingSeconds === 0 && !state.isProcessing) {
            state.isProcessing = true;
            
            try {
                elements.countdownNumber.textContent = "";
                showMessage("Processing...");

                const { metrics, imageData } = await captureAndAnalyze();
                
                cleanupCamera();

                elements.video.style.display = 'none';
                elements.overlay.style.display = 'none';
                elements.photo.style.display = 'block';
                
                showMessage("Analysis complete! Redirecting...");
                
                submitToServer({ metrics, imageData });
                
            } catch (error) {
                debug('Processing error:', error);
                setTimeout(() => {
                    window.location.href = '/process';
                }, 1500);
            }
        }
    } else {
        resetState();
        elements.overlay.className = 'face-overlay invalid';
        elements.faceStatus.textContent = 'Please align your face with the outline';
        elements.faceStatus.className = 'status-message warning';
        elements.countdownNumber.textContent = "";
        hideMessage();
    }
}

async function detectFace() {
    if (!state.model) {
        debug('Face detection model not loaded');
        return false;
    }
    
    try {
        const predictions = await state.model.estimateFaces(elements.video, false);
        
        if (predictions.length > 0) {
            const face = predictions[0];
            const faceCenterX = face.topLeft[0] + (face.bottomRight[0] - face.topLeft[0]) / 2;
            const faceCenterY = face.topLeft[1] + (face.bottomRight[1] - face.topLeft[1]) / 2;
            
            const relativeX = faceCenterX / elements.video.videoWidth;
            const relativeY = faceCenterY / elements.video.videoHeight;
            
            const isInBounds = 
                relativeX > 0.35 && relativeX < 0.65 &&
                relativeY > 0.35 && relativeY < 0.65;
            
            await updateOverlayStatus(isInBounds);
            return isInBounds;
        }
        
        await updateOverlayStatus(false);
        return false;
    } catch (error) {
        debug('Face detection error:', error);
        await updateOverlayStatus(false);
        return false;
    }
}

async function loadFaceDetectionModel() {
    debug('Loading face detection model');
    try {
        showMessage("Loading face detection model...");
        state.model = await blazeface.load();
        debug('Face detection model loaded successfully');
        hideMessage();
    } catch (error) {
        debug('Error loading model:', error);
        showMessage("Error loading face detection. Please refresh the page.", 3000);
    }
}

async function startCamera() {
    debug('Starting camera');
    try {
        const constraints = {
            video: { 
                facingMode: 'user',
                width: { ideal: window.innerWidth },
                height: { ideal: window.innerHeight }
            }
        };
        
        state.stream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.video.srcObject = state.stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            elements.video.onloadedmetadata = () => {
                debug('Video metadata loaded');
                resolve();
            };
        });
        
        await elements.video.play();
        debug('Camera started successfully');
        
        await loadFaceDetectionModel();
        
        state.scanningInterval = setInterval(detectFace, 200);
    } catch (error) {
        debug('Camera error:', error);
        showMessage("Error accessing camera. Please ensure camera permissions are granted.", 3000);
    }
}

function cleanupCamera() {
    debug('Cleaning up camera');
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
    }
    if (state.scanningInterval) {
        clearInterval(state.scanningInterval);
    }
}

function resetState() {
    state.alignmentStartTime = null;
    state.isProcessing = false;
}

// Event Listeners
elements.retakeButton?.addEventListener('click', async () => {
    debug('Retake button clicked');
    elements.photo.style.display = 'none';
    elements.video.style.display = 'block';
    elements.overlay.style.display = 'block';
    elements.retakeButton.style.display = 'none';
    elements.result.innerHTML = '';
    hideMessage();
    
    resetState();
    await startCamera();
});

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    debug('DOM Content Loaded');
    try {
        validateElements();
        await startCamera();
    } catch (error) {
        debug('Initialization error:', error);
        showMessage("Error initializing application. Please refresh the page.", 3000);
    }
});