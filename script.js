const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const slotValues = [33, 10, 5, 1.5, 1.2, 1.1, 0.2, 0.2, 0.5, 1.2, 1.5, 5, 10, 33];
const slotsContainer = document.getElementById('slotsContainer');
const pointsElement = document.getElementById('points');
const betAmountElement = document.getElementById('betAmount');
const historyList = document.getElementById('historyList');
let totalPoints = 5000;
let ballPrice = 10;

const obstacles = [];
const balls = [];
const gravity = 0.5;
const friction = 0.98;

// Gradient function
const getGradientColor = (value) => {
    const min = 0.2;
    const max = 33;
    const ratio = (value - min) / (max - min);
    const red = 255;
    const green = Math.max(0, 255 - ratio * 255); // Green component decreases as value increases
    const blue = 0; // Blue component stays 0 to keep the color in the yellow-red range
    return `rgb(${red},${green},${blue})`;
};


// Load sounds
const bounceSound = new Audio('bounce.mp3');
const slotSound = new Audio('slot.mp3');
bounceSound.volume = 0.5;
bounceSound.playbackRate = 1.5;

// Distribute slot values
slotValues.forEach((value) => {
    const slot = document.createElement('div');
    slot.classList.add('slot');
    slot.dataset.value = value;
    slot.innerText = `${value}x`;
    slot.style.backgroundColor = getGradientColor(value);
    slotsContainer.appendChild(slot);
});

// Create obstacles in a triangular pattern from top to bottom
const rows = 12;  // Number of rows for obstacles
const cols = 13;  // Number of columns for obstacles
const spacingX = canvas.width / cols;
const spacingY = canvas.height / (rows + 1);

for (let row = 1; row <= rows; row++) {
    for (let col = 0; col < row; col++) {
        const x = spacingX / 2 + col * spacingX - (row * spacingX) / 2 + canvas.width / 2;
        const y = row * spacingY;
        obstacles.push({ x, y });
    }
}

// Ball class
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = 2;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.dy += gravity;
        this.dy *= friction;
        this.y += this.dy;
        this.x += this.dx;

        // Collision with obstacles
        obstacles.forEach(obstacle => {
            if (Math.hypot(this.x - obstacle.x, this.y - obstacle.y) < this.radius + 5) {
                const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
                this.dx = Math.cos(angle) * 2;
                this.dy = Math.sin(angle) * 2;
                bounceSound.currentTime = 0;  // Reset sound to the beginning
                bounceSound.play();
            }
        });

        // Collision with walls
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
        }

        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            addScore(this.x);
            balls.splice(balls.indexOf(this), 1);
        }

        this.draw();
    }
}

// Release ball on space bar press
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        ballPrice = parseInt(betAmountElement.value, 10);
        if (totalPoints - ballPrice >= 0) {
            balls.push(new Ball(canvas.width / 2, 20, 10, 'white'));
            totalPoints -= ballPrice;
            updatePoints();
        }
    }
});

// Add score based on ball's landing position
function addScore(x) {
    const rects = slotsContainer.children;
    Array.from(rects).forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const slotX = rect.left + rect.width / 2;
        const canvasRect = canvas.getBoundingClientRect();
        const relativeX = slotX - canvasRect.left;

        if (Math.abs(relativeX - x) < rect.width / 2) {
            const score = parseFloat(slot.dataset.value) * ballPrice;
            totalPoints += score;
            slot.classList.add('highlight');
            slotSound.currentTime = 0;  // Reset sound to the beginning
            slotSound.play();
            setTimeout(() => slot.classList.remove('highlight'), 300);
            updatePoints();
            updateHistory(score, getGradientColor(parseFloat(slot.dataset.value)));
        }
    });
}

// Update points display
function updatePoints() {
    pointsElement.textContent = totalPoints;
}

// Update hit history
function updateHistory(score, color) {
    const newHistoryItem = document.createElement('li');
    newHistoryItem.textContent = score.toFixed(2);
    newHistoryItem.classList.add('new');
    newHistoryItem.style.backgroundColor = color;
    historyList.insertBefore(newHistoryItem, historyList.firstChild);

    const historyItems = historyList.querySelectorAll('li');
    if (historyItems.length > 4) {
        historyItems[4].remove();
    }

    historyItems.forEach(item => {
        item.classList.remove('new');
    });
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    obstacles.forEach(obstacle => {
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    });

    balls.forEach(ball => ball.update());

    requestAnimationFrame(animate);
}

animate();

