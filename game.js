// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Game variables
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameSpeed = 6;
let gravity = 0.8;
let isGameOver = false;
let isPaused = false;
let gameStarted = false;

// Update high score display
document.getElementById('highScore').textContent = highScore;

// Dino object
const dino = {
    x: 50,
    y: canvas.height - 100,
    width: 40,
    height: 50,
    velocityY: 0,
    jumping: false,
    ducking: false,
    
    draw() {
        ctx.fillStyle = '#2ecc71';
        
        if (this.ducking) {
            // Draw ducking dino
            ctx.fillRect(this.x, this.y + 20, this.width + 20, this.height - 20);
            // Eye
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x + 5, this.y + 25, 8, 8);
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x + 7, this.y + 27, 4, 4);
        } else {
            // Body
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Eye
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x + 5, this.y + 10, 10, 10);
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x + 8, this.y + 13, 5, 5);
            // Legs
            ctx.fillStyle = '#2ecc71';
            const legOffset = Math.floor(score / 5) % 2 === 0 ? 0 : 5;
            ctx.fillRect(this.x + 10, this.y + this.height, 8, 15 + legOffset);
            ctx.fillRect(this.x + 25, this.y + this.height, 8, 15 - legOffset);
        }
    },
    
    jump() {
        if (!this.jumping && !this.ducking) {
            this.velocityY = -15;
            this.jumping = true;
        }
    },
    
    duck(isDucking) {
        if (!this.jumping) {
            this.ducking = isDucking;
        }
    },
    
    update() {
        // Apply gravity
        if (this.jumping || this.y < canvas.height - 100) {
            this.velocityY += gravity;
            this.y += this.velocityY;
            
            // Ground collision
            if (this.y >= canvas.height - 100) {
                this.y = canvas.height - 100;
                this.velocityY = 0;
                this.jumping = false;
            }
        }
    }
};

// Obstacle class
class Obstacle {
    constructor() {
        this.width = 30;
        this.height = Math.random() > 0.5 ? 50 : 70;
        this.x = canvas.width;
        this.y = canvas.height - 50 - this.height;
        this.type = Math.random() > 0.7 ? 'bird' : 'cactus';
        
        if (this.type === 'bird') {
            this.y = canvas.height - 150 - Math.random() * 50;
            this.height = 30;
            this.width = 40;
            this.wingOffset = 0;
        }
    }
    
    draw() {
        if (this.type === 'cactus') {
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Cactus arms
            ctx.fillRect(this.x - 10, this.y + 20, 10, 20);
            ctx.fillRect(this.x + this.width, this.y + 15, 10, 25);
        } else {
            // Bird
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x + 10, this.y + 10, 20, 15);
            // Wings
            this.wingOffset = (this.wingOffset + 0.5) % 20;
            const wingY = this.y + 10 + (this.wingOffset > 10 ? 20 - this.wingOffset : this.wingOffset);
            ctx.fillRect(this.x, wingY, 10, 5);
            ctx.fillRect(this.x + 30, wingY, 10, 5);
        }
    }
    
    update() {
        this.x -= gameSpeed;
    }
}

// Cloud class for background
class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = Math.random() * 150;
        this.width = 60 + Math.random() * 40;
        this.height = 30;
        this.speed = 1 + Math.random();
    }
    
    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 3, this.y - 10, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 1.5, this.y, this.height / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = canvas.width;
            this.y = Math.random() * 150;
        }
    }
}

// Game arrays
let obstacles = [];
let clouds = [];
let frameCount = 0;

// Initialize clouds
for (let i = 0; i < 3; i++) {
    clouds.push(new Cloud());
}

// Collision detection
function checkCollision(dino, obstacle) {
    const dinoHeight = dino.ducking ? dino.height - 20 : dino.height;
    const dinoY = dino.ducking ? dino.y + 20 : dino.y;
    
    return (
        dino.x < obstacle.x + obstacle.width &&
        dino.x + dino.width > obstacle.x &&
        dinoY < obstacle.y + obstacle.height &&
        dinoY + dinoHeight > obstacle.y
    );
}

// Draw ground
function drawGround() {
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Ground line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();
    
    // Ground details
    for (let i = 0; i < canvas.width; i += 30) {
        const offset = (frameCount % 30);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(i - offset, canvas.height - 45, 2, 2);
    }
}

// Game loop
function gameLoop() {
    if (isGameOver || isPaused || !gameStarted) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(0.5, '#D2B48C');
    gradient.addColorStop(1, '#C19A6B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw clouds
    clouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
    });
    
    // Draw ground
    drawGround();
    
    // Update and draw dino
    dino.update();
    dino.draw();
    
    // Spawn obstacles
    frameCount++;
    if (frameCount % 100 === 0) {
        obstacles.push(new Obstacle());
    }
    
    // Update and draw obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        
        // Check collision
        if (checkCollision(dino, obstacle)) {
            endGame();
        }
        
        // Remove off-screen obstacles and increase score
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++;
            document.getElementById('score').textContent = score;
            
            // Increase difficulty
            if (score % 10 === 0 && gameSpeed < 12) {
                gameSpeed += 0.5;
            }
        }
    });
    
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    isGameOver = true;
    gameStarted = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

// Start game
function startGame() {
    isGameOver = false;
    isPaused = false;
    gameStarted = true;
    score = 0;
    gameSpeed = 6;
    obstacles = [];
    frameCount = 0;
    
    dino.y = canvas.height - 100;
    dino.velocityY = 0;
    dino.jumping = false;
    dino.ducking = false;
    
    document.getElementById('score').textContent = score;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    gameLoop();
}

// Restart game
function restartGame() {
    startGame();
}

// Keyboard controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!isGameOver && !isPaused) {
            dino.jump();
        }
    }
    
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (gameStarted && !isGameOver && !isPaused) {
            dino.duck(true);
        }
    }
    
    if (e.code === 'KeyP') {
        e.preventDefault();
        if (gameStarted && !isGameOver) {
            isPaused = !isPaused;
            if (!isPaused) {
                gameLoop();
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    
    if (e.code === 'ArrowDown') {
        dino.duck(false);
    }
});

// Mobile touch controls
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted) {
        startGame();
    } else if (!isGameOver && !isPaused) {
        dino.jump();
    }
});

// Mouse click controls
canvas.addEventListener('click', (e) => {
    if (!gameStarted) {
        startGame();
    } else if (!isGameOver && !isPaused) {
        dino.jump();
    }
});

// Button event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);

// Initialize game
document.getElementById('startScreen').style.display = 'block';
