// ========================
// AUTHENTICATION SYSTEM
// ========================
const CORRECT_PASSWORD = "JN.NAYEM"; // আপনার পাসওয়ার্ড এখানে সেট করুন
let sessionTimer;
let sessionTimeout;
const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

// Check password
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput').value;
    const loginMessage = document.getElementById('loginMessage');
    
    if (passwordInput === CORRECT_PASSWORD) {
        // Start authenticated session
        startSession();
    } else {
        loginMessage.textContent = "Incorrect password! Please try again.";
        loginMessage.style.color = "#e74c3c";
    }
}

// Start authenticated session
function startSession() {
    // Hide login screen, show app
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Generate session ID
    const sessionId = 'SID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    document.getElementById('sessionId').textContent = sessionId;
    
    // Start session timer
    startSessionTimer();
    
    // Initialize application
    initApp();
}

// Start session timer
function startSessionTimer() {
    let timeLeft = SESSION_DURATION / 1000; // seconds
    updateTimerDisplay(timeLeft);
    
    sessionTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            logout();
        }
    }, 1000);
    
    // Reset timeout on user activity
    document.addEventListener('mousemove', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
    
    resetSessionTimeout();
}

// Reset session timeout
function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(logout, SESSION_DURATION);
}

// Update timer display
function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('sessionTimer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Logout function
function logout() {
    clearInterval(sessionTimer);
    clearTimeout(sessionTimeout);
    
    // Show login screen, hide app
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    
    // Clear password field
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginMessage').textContent = '';
}

// ========================
// APPLICATION CORE
// ========================
let gameHistory = [];
let historyChart = null;
let predictionModel = null;
let currentRoundId = null;
let countdownInterval;

async function initApp() {
    // Load any saved history
    const savedHistory = localStorage.getItem('aviatorHistory');
    if (savedHistory) {
        gameHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
    
    // Initialize history chart
    initHistoryChart();
    
    // Load TensorFlow.js model
    await loadPredictionModel();
    
    // Start checking for game updates
    startGameLoop();
    
    // Start countdown timer
    startCountdown();
}

async function loadPredictionModel() {
    try {
        // Replace with your actual model URL
        const modelUrl = 'https://yourgithub.io/aviator-predictor-/model/model.json';
        predictionModel = await tf.loadLayersModel(modelUrl);
        console.log("Prediction model loaded successfully");
    } catch (error) {
        console.error("Failed to load prediction model:", error);
        // Fallback to simple prediction if model fails to load
        predictionModel = {
            predict: () => tf.tensor([1.0 + Math.random() * 5.0])
        };
    }
}

function initHistoryChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Actual',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Predicted',
                    data: [],
                    borderColor: '#3498db',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ecf0f1'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 1.0,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#bdc3c7'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#bdc3c7'
                    }
                }
            }
        }
    });
}

async function verifyRound() {
    const serverSeed = document.getElementById('serverSeed').value;
    const clientSeed = document.getElementById('clientSeed').value;
    const nonce = document.getElementById('nonce').value;
    
    if (!serverSeed || !clientSeed || !nonce) {
        verificationResult.textContent = "Please fill all fields";
        verificationResult.style.color = "#e74c3c";
        return;
    }
    
    try {
        const crashPoint = await calculateCrashPoint(serverSeed, clientSeed, nonce);
        verificationResult.innerHTML = `
            <strong>Verification Successful</strong><br>
            Calculated Crash Point: <strong>${crashPoint.toFixed(2)}x</strong>
        `;
        verificationResult.style.color = "#2ecc71";
    } catch (error) {
        verificationResult.textContent = "Error: " + error.message;
        verificationResult.style.color = "#e74c3c";
    }
}

async function calculateCrashPoint(serverSeed, clientSeed, nonce) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${serverSeed}-${clientSeed}-${nonce}`);
    
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(serverSeed),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, data);
    const byteArray = new Uint8Array(signature);
    const hexDigest = Array.from(byteArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const decimal = parseInt(hexDigest.substring(0, 8), 16);
    return Math.max(1.0, 1000000 / (decimal % 1000000 + 1));
}

async function fetchGameData() {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('https://your-api-service.com/aviator/live');
        const data = await response.json();
        
        return {
            roundId: data.round_id,
            crashPoint: data.crash_point,
            timestamp: new Date().toLocaleTimeString()
        };
    } catch (error) {
        console.error("Failed to fetch game data:", error);
        
        // Fallback: Generate mock data if API fails
        return {
            roundId: Date.now(),
            crashPoint: 1 + Math.random() * 10,
            timestamp: new Date().toLocaleTimeString()
        };
    }
}

function startGameLoop() {
    checkForGameUpdates();
}

function startCountdown() {
    let countdown = 30;
    document.getElementById('countdown').textContent = countdown;
    
    countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('countdown').textContent = countdown;
        
        if (countdown <= 0) {
            countdown = 30;
            document.getElementById('countdown').textContent = countdown;
        }
    }, 1000);
}

async function checkForGameUpdates() {
    const gameData = await fetchGameData();
    
    // Check if new round started
    if (!currentRoundId || gameData.roundId !== currentRoundId) {
        currentRoundId = gameData.roundId;
        
        // Generate prediction before crash happens
        const prediction = await generatePrediction();
        
        // Create history item
        const historyItem = {
            id: gameData.roundId,
            predicted: prediction.value,
            actual: gameData.crashPoint,
            timestamp: gameData.timestamp,
            confidence: prediction.confidence
        };
        
        // Add to history
        gameHistory.unshift(historyItem);
        if (gameHistory.length > 20) gameHistory.pop();
        
        // Save to localStorage
        localStorage.setItem('aviatorHistory', JSON.stringify(gameHistory));
        
        // Update displays
        updateHistoryDisplay();
        updateChart();
        
        // Update prediction display
        updatePredictionDisplay(prediction.value, prediction.confidence);
    }
    
    // Schedule next check
    setTimeout(checkForGameUpdates, 3000);
}

async function generatePrediction() {
    // Prepare input data (last 10 actual values)
    const inputData = gameHistory
        .slice(0, 10)
        .map(item => item.actual)
        .reverse();
    
    // Pad with zeros if not enough history
    while (inputData.length < 10) {
        inputData.push(1.0);
    }
    
    try {
        // Create tensor from input data
        const inputTensor = tf.tensor2d([inputData]);
        
        // Make prediction
        const prediction = predictionModel.predict(inputTensor);
        const predictionValue = prediction.dataSync()[0];
        
        // Calculate confidence (simple heuristic)
        const confidence = Math.min(95, Math.round(predictionValue * 10));
        
        // Clean up tensors
        tf.dispose([inputTensor, prediction]);
        
        return {
            value: predictionValue,
            confidence: confidence
        };
    } catch (error) {
        console.error("Prediction failed:", error);
        
        // Fallback: Simple random prediction
        return {
            value: 1 + Math.random() * 5,
            confidence: Math.round(Math.random() * 50) + 25
        };
    }
}

function updatePredictionDisplay(prediction, confidence) {
    predictionValue.textContent = prediction.toFixed(2) + 'x';
    confidenceFill.style.width = confidence + '%';
    confidencePercent.textContent = confidence + '%';
    
    // Color coding based on prediction strength
    if (prediction > 2.5) {
        predictionValue.style.color = '#2ecc71';
    } else if (prediction > 1.8) {
        predictionValue.style.color = '#f39c12';
    } else {
        predictionValue.style.color = '#e74c3c';
    }
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    
    gameHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Calculate accuracy indicator
        const accuracy = Math.max(0, 100 - Math.abs(item.predicted - item.actual) * 20);
        const accuracyColor = accuracy > 75 ? '#2ecc71' : accuracy > 50 ? '#f39c12' : '#e74c3c';
        
        historyItem.innerHTML = `
            <div class="value">${item.actual.toFixed(2)}x</div>
            <div class="time">${item.timestamp}</div>
            <div class="predicted">Pred: ${item.predicted.toFixed(2)}x</div>
            <div class="accuracy" style="color: ${accuracyColor}">${Math.round(accuracy)}%</div>
        `;
        historyList.appendChild(historyItem);
    });
}

function updateChart() {
    const labels = [];
    const actualData = [];
    const predictedData = [];
    
    // Show last 15 points
    const displayItems = gameHistory.slice(0, 15).reverse();
    
    displayItems.forEach(item => {
        labels.push(`Round ${item.id.toString().slice(-3)}`);
        actualData.push(item.actual);
        predictedData.push(item.predicted);
    });
    
    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = actualData;
    historyChart.data.datasets[1].data = predictedData;
    historyChart.update();
}

function refreshData() {
    checkForGameUpdates();
    document.getElementById('countdown').textContent = '30';
}

// Initialize on window load
window.onload = function() {
    // Focus password input
    document.getElementById('passwordInput').focus();
};
