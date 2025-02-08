let faceDetectionInterval;

const state = {
    stream: null,
    isProcessing: false,
    model: null
};

const elements = {
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    photo: document.getElementById('photo'),
    captureButton: document.getElementById('capture'),
    analyzeButton: document.getElementById('analyze'),
    retakeButton: document.getElementById('retake'),
    result: document.getElementById('result'),
    faceStatus: document.getElementById('face-status')
};

async function loadFaceDetectionModel() {
    try {
        elements.faceStatus.textContent = 'Loading face detection model...';
        state.model = await blazeface.load();
        elements.faceStatus.textContent = 'Model loaded. Checking for face...';
    } catch (error) {
        console.error('Error loading model:', error);
        elements.faceStatus.textContent = 'Error loading face detection model';
    }
}

async function detectFace() {
    if (!state.model) return false;
    
    try {
        const predictions = await state.model.estimateFaces(elements.video, false);
        const hasFace = predictions.length > 0;
        elements.faceStatus.textContent = hasFace ? 'Face detected ✓' : 'No face detected - Please position your face in the camera';
        elements.faceStatus.className = `status-message ${hasFace ? 'success' : 'warning'}`;
        elements.captureButton.disabled = !hasFace;
        return hasFace;
    } catch (error) {
        console.error('Face detection error:', error);
        return false;
    }
}

async function startCamera() {
    try {
        state.stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        elements.video.srcObject = state.stream;
        await elements.video.play();
        await loadFaceDetectionModel();
        
        faceDetectionInterval = setInterval(detectFace, 500);
    } catch (error) {
        console.error('Camera error:', error);
        elements.faceStatus.textContent = 'Error accessing camera';
        elements.faceStatus.className = 'status-message error';
    }
}

function analyzeSkin(imageData) {
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

        // Skip transparent pixels
        if (a === 0) continue;
        
        validPixels++;
        
        // Brightness: average of RGB values (0-255)
        metrics.brightness += (r + g + b) / 3;
        
        // Redness: ratio of red to other colors, avoiding division by zero
        const greenBlueAvg = (g + b) / 2;
        if (greenBlueAvg > 0) {
            metrics.redness += (r / greenBlueAvg) - 1; // Subtract 1 to normalize
        }
        
        // Calculate texture based on local variations
        if (i > 0 && i < data.length - 4) {
            const prevPixel = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
            const currentPixel = (r + g + b) / 3;
            metrics.texture += Math.abs(currentPixel - prevPixel);
        }
        
        // Calculate oiliness based on highlights
        if (r > 200 && g > 200 && b > 200) {
            metrics.oiliness++;
        }
    }

    // Normalize metrics
    if (validPixels > 0) {
        // Brightness: Convert to percentage (0-100)
        metrics.brightness = (metrics.brightness / validPixels / 255) * 100;
        
        // Redness: Convert to percentage (0-100)
        metrics.redness = Math.max(0, Math.min(100, (metrics.redness / validPixels) * 50));
        
        // Texture: Normalize to 0-100 range
        metrics.texture = Math.min(100, (metrics.texture / validPixels) * 20);
        
        // Oiliness: Convert to percentage
        metrics.oiliness = Math.min(100, (metrics.oiliness / validPixels) * 1000);
    }

    // Round all values to 2 decimal places
    Object.keys(metrics).forEach(key => {
        metrics[key] = Math.round(metrics[key] * 100) / 100;
    });

    return metrics;
}

// function displayResults(metrics) {
//     elements.result.innerHTML = `
//         <div class="results-container">
//             <h2>Skin Analysis Results</h2>
//             <div class="metrics">
//                 <div class="metric">
//                     <label>Brightness</label>
//                     <div class="progress-bar">
//                         <div class="progress" style="width: ${metrics.brightness}%"></div>
//                     </div>
//                     <span>${Math.round(metrics.brightness)}%</span>
//                 </div>
//                 <div class="metric">
//                     <label>Redness Level</label>
//                     <div class="progress-bar">
//                         <div class="progress" style="width: ${metrics.redness}%"></div>
//                     </div>
//                     <span>${Math.round(metrics.redness)}%</span>
//                 </div>
//                 <div class="metric">
//                     <label>Texture Quality</label>
//                     <div class="progress-bar">
//                         <div class="progress" style="width: ${metrics.texture}%"></div>
//                     </div>
//                     <span>${Math.round(metrics.texture)}%</span>
//                 </div>
//                 <div class="metric">
//                     <label>Oil Level</label>
//                     <div class="progress-bar">
//                         <div class="progress" style="width: ${metrics.oiliness}%"></div>
//                     </div>
//                     <span>${Math.round(metrics.oiliness)}%</span>
//                 </div>
//             </div>
//         </div>
//     `;
// }

// Event Listeners
elements.captureButton.addEventListener('click', () => {
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
    }
    
    elements.canvas.width = elements.video.videoWidth;
    elements.canvas.height = elements.video.videoHeight;
    elements.canvas.getContext('2d').drawImage(elements.video, 0, 0);
    
    elements.photo.src = elements.canvas.toDataURL('image/jpeg');
    elements.video.style.display = 'none';
    elements.photo.style.display = 'block';
    elements.analyzeButton.disabled = false;
    elements.captureButton.style.display = 'none';
    elements.retakeButton.style.display = 'block';
    elements.faceStatus.style.display = 'none';
    
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
    }
});

elements.retakeButton.addEventListener('click', async () => {
    elements.photo.style.display = 'none';
    elements.video.style.display = 'block';
    elements.analyzeButton.disabled = true;
    elements.retakeButton.style.display = 'none';
    elements.captureButton.style.display = 'block';
    elements.faceStatus.style.display = 'block';
    elements.result.innerHTML = '';
    await startCamera();
});

elements.analyzeButton.addEventListener('click', async () => {
    if (state.isProcessing) return;
    
    try {
        state.isProcessing = true;
        elements.analyzeButton.disabled = true;
        elements.analyzeButton.textContent = 'Analyzing...';
        
        const ctx = elements.canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
        const metrics = analyzeSkin(imageData);
        
        try {
            const response = await fetch('/analyze/face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: elements.photo.src,
                    analysisResults: metrics
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Analysis failed');
            }
        } catch (error) {
            console.warn('Server analysis failed, continuing with local results:', error);
        }
        
        // Display results regardless of server response
        displayResults(metrics);
        
    } catch (error) {
        console.error('Analysis error:', error);
        elements.result.innerHTML = `
            <div class="error-message">
                Error analyzing skin. Please try again.
            </div>
        `;
    } finally {
        state.isProcessing = false;
        elements.analyzeButton.disabled = false;
        elements.analyzeButton.textContent = 'Analyze Skin';
    }
});

// Initialize the camera when the page loads
document.addEventListener('DOMContentLoaded', startCamera);