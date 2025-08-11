document.addEventListener('DOMContentLoaded', function() {
    // Password validation
    const passwordInput = document.getElementById('passwordInput');
    passwordInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    // Site selection buttons
    const siteButtons = document.querySelectorAll('.site-btn');
    siteButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectSite(this.dataset.site);
        });
    });

    // Hide dashboard initially
    document.getElementById('dashboard').style.display = 'none';
});

function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    const correctPassword = 'jerin.i.love.u';
    
    if (password === correctPassword) {
        document.getElementById('passwordSection').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        startPredictionCycle();
    } else {
        alert('Incorrect password! Please try again.');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

function selectSite(site) {
    // Update active button
    document.querySelectorAll('.site-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activate selected button
    document.querySelector(`.site-btn[data-site="${site}"]`).classList.add('active');
    
    // Save selected site to localStorage
    localStorage.setItem('selectedSite', site);
    
    // Generate new prediction
    generateNewPrediction();
}

function generatePrediction() {
    // For demo purposes - replace with your actual prediction logic
    const sites = {
        '1xbet': { min: 1.5, max: 15.0 },
        'mostbet': { min: 1.3, max: 12.0 },
        'parimatch': { min: 1.4, max: 14.0 }
    };
    
    const selectedSite = localStorage.getItem('selectedSite') || '1xbet';
    const config = sites[selectedSite];
    
    // More realistic prediction distribution
    const rand = Math.random();
    let prediction;
    
    if (rand < 0.5) {
        // Common multipliers (min-2.0x)
        prediction = config.min + Math.random() * (2.0 - config.min);
    } else if (rand < 0.8) {
        // Medium multipliers (2.0x-4.0x)
        prediction = 2.0 + Math.random() * 2.0;
    } else if (rand < 0.95) {
        // High multipliers (4.0x-8.0x)
        prediction = 4.0 + Math.random() * 4.0;
    } else {
        // Very high multipliers (8.0x-max)
        prediction = 8.0 + Math.random() * (config.max - 8.0);
    }
    
    return prediction.toFixed(2);
}

function updatePredictionDisplay(value) {
    const display = document.getElementById('predictionValue');
    display.textContent = value + 'x';
    
    // Add pulse animation
    display.classList.remove('pulse');
    void display.offsetWidth; // Trigger reflow
    display.classList.add('pulse');
}

function generateNewPrediction() {
    const prediction = generatePrediction();
    updatePredictionDisplay(prediction);
}

function startPredictionCycle() {
    // Set initial site if not set
    if (!localStorage.getItem('selectedSite')) {
        localStorage.setItem('selectedSite', '1xbet');
        document.querySelector('.site-btn[data-site="1xbet"]').classList.add('active');
    }
    
    // Initial prediction
    generateNewPrediction();
    
    // Update prediction every 5-10 seconds
    setInterval(generateNewPrediction, 5000 + Math.random() * 5000);
                        }
