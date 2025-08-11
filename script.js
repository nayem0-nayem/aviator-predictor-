// ========================
// AUTHENTICATION SYSTEM
// ========================
const CORRECT_PASSWORD = "JERIN.ILOVE.U"; // Updated password
let sessionTimer;

// Check password
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput').value;
    const loginMessage = document.getElementById('loginMessage');
    
    if (passwordInput === CORRECT_PASSWORD) {
        startSession();
    } else {
        loginMessage.textContent = "Incorrect password! Please try again.";
        loginMessage.style.color = "#e74c3c";
    }
}

// Start authenticated session
function startSession() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    initApp();
}

// Logout function
function logout() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginMessage').textContent = '';
}

// ========================
// PROVABLE FAIR SYSTEM
// ========================
let currentServerSeed = '';
let currentClientSeed = 'aviator_client_seed';
let currentNonce = 0;
let currentCrashPoint = 1.0;

// Generate random hex string for server seed
function generateServerSeed() {
    const length = 64;
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Automated verification function
async function autoVerifyRound() {
    // Generate new seeds and nonce for each verification
    currentServerSeed = generateServerSeed();
    currentNonce++;
    
    // Update display
    document.getElementById('serverSeedDisplay').textContent = currentServerSeed;
    document.getElementById('clientSeedDisplay').textContent = currentClientSeed;
    document.getElementById('nonceDisplay').textContent = currentNonce;
    
    // Calculate crash point
    currentCrashPoint = await calculateCrashPoint(currentServerSeed, currentClientSeed, currentNonce);
    document.getElementById('crashPointDisplay').textContent = currentCrashPoint.toFixed(2) + 'x';
    
    return currentCrashPoint;
}

// Crash point calculation algorithm
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

// ========================
// PREDICTION SYSTEM
// ========================
let gameHistory = [];
let historyChart = null;
let currentRoundId = 0;
let countdownInterval;

async function initApp() {
    // Initialize verification system
    await autoVerifyRound();
    
    // Load history
    const savedHistory = localStorage.getItem('aviatorHistory');
    if (savedHistory) gameHistory = JSON.parse(savedHistory);
    
    // Initialize chart
    initHistoryChart();
    
    // Start game loop
    startGameLoop();
}

function initHistoryChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Crash Points', data: [], borderColor: '#e74c3c' }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false, min: 1.0 } }
        }
    });
}

async function fetchGameData() {
    // In a real implementation, this would connect to your API
    // For demo, we use the calculated crash point from verification
    return {
        roundId: ++currentRoundId,
        crashPoint: currentCrashPoint,
        timestamp: new Date().toLocaleTimeString()
    };
}

function startGameLoop() {
    gameUpdate();
    startCountdown();
}

function startCountdown() {
    let countdown = 30;
    document.getElementById('countdown').textContent = countdown;
    
    countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('countdown').textContent = countdown;
        if (countdown <= 0) countdown = 30;
    }, 1000);
}

async function gameUpdate() {
    const gameData = await fetchGameData();
    
    // Add to history
    const historyItem = {
        id: gameData.roundId,
        actual: gameData.crashPoint,
        timestamp: gameData.timestamp,
        serverSeed: currentServerSeed,
        clientSeed: currentClientSeed,
        nonce: currentNonce
    };
    
    gameHistory.unshift(historyItem);
    if (gameHistory.length > 20) gameHistory.pop();
    
    // Save to localStorage
    localStorage.setItem('aviatorHistory', JSON.stringify(gameHistory));
    
    // Update displays
    updatePredictionDisplay();
    updateHistoryDisplay();
    updateChart();
    
    // Schedule next update
    setTimeout(gameUpdate, 30000); // 30 seconds
}

function updatePredictionDisplay() {
    // For demo, we'll show the last calculated crash point
    const prediction = currentCrashPoint;
    const confidence = Math.min(95, Math.round(prediction * 10));
    
    document.getElementById('predictionValue').textContent = prediction.toFixed(2) + 'x';
    document.getElementById('confidenceFill').style.width = confidence + '%';
    document.getElementById('confidencePercent').textContent = confidence + '%';
    
    // Color coding
    if (prediction > 2.5) {
        document.getElementById('predictionValue').style.color = '#2ecc71';
    } else if (prediction > 1.8) {
        document.getElementById('predictionValue').style.color = '#f39c12';
    } else {
        document.getElementById('predictionValue').style.color = '#e74c3c';
    }
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    gameHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="value">${item.actual.toFixed(2)}x</div>
            <div class="time">${item.timestamp}</div>
            <div class="round">Round #${item.id}</div>
        `;
        historyList.appendChild(historyItem);
    });
}

function updateChart() {
    const labels = [];
    const data = [];
    
    const displayItems = gameHistory.slice(0, 15).reverse();
    displayItems.forEach(item => {
        labels.push(`Round ${item.id}`);
        data.push(item.actual);
    });
    
    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = data;
    historyChart.update();
}

// Initialize on window load
window.onload = function() {
    document.getElementById('passwordInput').focus();
};
