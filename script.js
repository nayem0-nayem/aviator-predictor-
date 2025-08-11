// DOM elements
const predictionValue = document.getElementById('predictionValue');
const confidenceFill = document.getElementById('confidenceFill');
const confidencePercent = document.getElementById('confidencePercent');
const verificationResult = document.getElementById('verificationResult');
const historyList = document.getElementById('historyList');

// Game state
let gameHistory = [];

// Initialize
function init() {
    // Load any saved history
    const savedHistory = localStorage.getItem('aviatorHistory');
    if (savedHistory) {
        gameHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
    
    // Start prediction loop
    simulatePredictionLoop();
}

// Provable fair verification
async function verifyRound() {
    const serverSeed = document.getElementById('serverSeed').value;
    const clientSeed = document.getElementById('clientSeed').value;
    const nonce = document.getElementById('nonce').value;
    
    if (!serverSeed || !clientSeed || !nonce) {
        verificationResult.textContent = "Please fill all fields";
        return;
    }
    
    try {
        const crashPoint = await calculateCrashPoint(serverSeed, clientSeed, nonce);
        verificationResult.innerHTML = `
            <strong>Verification Successful</strong><br>
            Calculated Crash Point: <strong>${crashPoint.toFixed(2)}x</strong>
        `;
    } catch (error) {
        verificationResult.textContent = "Error: " + error.message;
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

// Prediction simulation (replace with actual model later)
function simulatePredictionLoop() {
    // Generate a random prediction between 1.0 and 10.0
    const prediction = 1 + Math.random() * 9;
    const confidence = Math.min(95, Math.round(prediction * 10));
    
    // Update display
    predictionValue.textContent = prediction.toFixed(2) + 'x';
    confidenceFill.style.width = confidence + '%';
    confidencePercent.textContent = confidence + '%';
    
    // Color coding
    if (prediction > 2.5) {
        predictionValue.style.color = '#2ecc71';
    } else if (prediction > 1.8) {
        predictionValue.style.color = '#f39c12';
    } else {
        predictionValue.style.color = '#e74c3c';
    }
    
    // Add to history every 5-15 seconds
    if (Math.random() > 0.7) {
        addToHistory(prediction);
    }
    
    // Repeat every 2 seconds
    setTimeout(simulatePredictionLoop, 2000);
}

function addToHistory(prediction) {
    const actual = prediction * (0.9 + Math.random() * 0.2); // Simulate actual result
    const historyItem = {
        round: gameHistory.length + 1,
        predicted: prediction,
        actual: actual,
        timestamp: new Date().toLocaleTimeString()
    };
    
    gameHistory.push(historyItem);
    if (gameHistory.length > 20) gameHistory.shift();
    
    // Save to localStorage
    localStorage.setItem('aviatorHistory', JSON.stringify(gameHistory));
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    gameHistory.slice().reverse().forEach(item => {
        const elem = document.createElement('div');
        elem.className = 'history-item';
        elem.innerHTML = `
            <div>Round: ${item.round}</div>
            <div>Predicted: <strong>${item.predicted.toFixed(2)}x</strong></div>
            <div>Actual: <strong>${item.actual.toFixed(2)}x</strong></div>
        `;
        historyList.appendChild(elem);
    });
}

// Start the app
init();
