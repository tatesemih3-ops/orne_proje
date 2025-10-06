// Game variables
let isJumping = false;
let isGameRunning = false;
let score = 0;
let highScore = 0;
let obstacleSpeed = 2;
let obstacleInterval = null;
let scoreInterval = null;
let gameLoopInterval = null;
let obstacles = [];

// DOM elements
const dino = document.getElementById('dino');
const game = document.getElementById('game');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');

// Load high score from localStorage
if (localStorage.getItem('dinoHighScore')) {
    highScore = parseInt(localStorage.getItem('dinoHighScore'));
    highScoreElement.textContent = highScore;
}

// Add clouds to background
function createClouds() {
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.width = Math.random() * 60 + 40 + 'px';
        cloud.style.height = Math.random() * 30 + 20 + 'px';
        cloud.style.top = Math.random() * 100 + 20 + 'px';
        cloud.style.right = Math.random() * 800 + 'px';
        cloud.style.animationDuration = Math.random() * 10 + 15 + 's';
        cloud.style.animationDelay = Math.random() * 5 + 's';
        game.appendChild(cloud);
    }
}

createClouds();

// Jump function
function jump() {
    if (isJumping || !isGameRunning) return;
    
    isJumping = true;
    dino.classList.add('jump');
    
    setTimeout(() => {
        dino.classList.remove('jump');
        isJumping = false;
    }, 500);
}

// Create obstacle
function createObstacle() {
    if (!isGameRunning) return;
    
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    
    // Randomize obstacle properties
    const randomHeight = Math.random() > 0.5 ? 50 : 40;
    const randomWidth = Math.random() > 0.5 ? 30 : 25;
    obstacle.style.height = randomHeight + 'px';
    obstacle.style.width = randomWidth + 'px';
    
    game.appendChild(obstacle);
    obstacles.push(obstacle);
    
    // Remove obstacle after animation
    setTimeout(() => {
        if (obstacle.parentNode) {
            obstacle.remove();
            obstacles = obstacles.filter(obs => obs !== obstacle);
        }
    }, 2000 / (obstacleSpeed / 2));
}

// Check collision
function checkCollision() {
    const dinoRect = dino.getBoundingClientRect();
    
    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();
        
        if (
            dinoRect.left < obstacleRect.right &&
            dinoRect.right > obstacleRect.left &&
            dinoRect.bottom > obstacleRect.top &&
            dinoRect.top < obstacleRect.bottom
        ) {
            gameOver();
        }
    });
}

// Update score
function updateScore() {
    if (!isGameRunning) return;
    score++;
    scoreElement.textContent = score;
    
    // Increase difficulty every 100 points
    if (score % 100 === 0) {
        increaseDifficulty();
    }
}

// Increase difficulty
function increaseDifficulty() {
    if (obstacleSpeed < 4) {
        obstacleSpeed += 0.2;
        clearInterval(obstacleInterval);
        obstacleInterval = setInterval(createObstacle, Math.max(1000 - (score / 10), 800));
    }
}

// Start game
function startGame() {
    // Reset variables
    isGameRunning = true;
    score = 0;
    obstacleSpeed = 2;
    obstacles = [];
    scoreElement.textContent = '0';
    
    // Hide screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Clear existing obstacles
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    
    // Start game loops
    obstacleInterval = setInterval(createObstacle, 1500);
    scoreInterval = setInterval(updateScore, 100);
    gameLoopInterval = setInterval(checkCollision, 10);
    
    // Add animation to ground
    document.getElementById('ground').style.animationPlayState = 'running';
}

// Game over
function gameOver() {
    isGameRunning = false;
    
    // Clear intervals
    clearInterval(obstacleInterval);
    clearInterval(scoreInterval);
    clearInterval(gameLoopInterval);
    
    // Stop animations
    document.getElementById('ground').style.animationPlayState = 'paused';
    obstacles.forEach(obstacle => {
        obstacle.style.animationPlayState = 'paused';
    });
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('dinoHighScore', highScore);
    }
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        
        if (!isGameRunning) {
            startGame();
        } else {
            jump();
        }
    }
});

// Click/touch to jump or start
game.addEventListener('click', () => {
    if (!isGameRunning) {
        startGame();
    } else {
        jump();
    }
});

document.addEventListener('click', (e) => {
    if (!isGameRunning && (e.target.closest('.start-screen') || e.target.closest('.game-over'))) {
        startGame();
    }
});

// Touch support for mobile
document.addEventListener('touchstart', (e) => {
    if (!isGameRunning) {
        startGame();
    } else {
        jump();
    }
    e.preventDefault();
}, { passive: false });

// Prevent space from scrolling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
    }
});
