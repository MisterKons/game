document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const slotsContainer = document.getElementById('slotsContainer');
    const pointsElement = document.getElementById('points');
    const betAmountElement = document.getElementById('betAmount');
    const historyList = document.getElementById('historyList');
    const exitButton = document.getElementById('exitButton'); // Reference to the Exit Game button
    const slotValues = [33, 10, 5, 1.5, 1.2, 0.5, 0.2, 0.2, 0.5, 1.2, 1.5, 5, 10, 33];
    const ripples = [];
    let totalPoints = 5000;
    let ballPrice = 10;
    const obstacles = [];
    const balls = [];
    const gravity = 0.98;
    const friction = 0.96;
    let canvasWidth, canvasHeight;

    const getGradientColor = (value) => {
        const min = 1;
        const max = 9;
        const ratio = (value - min) / (max - min);
        const red = 255;
        const green = Math.max(0, 255 - ratio * 255);
        const blue = 0;
        return `rgb(${red},${green},${blue})`;
    };

    const slotSound = new Audio('slot.mp3');

    function resizeGame() {
        const maxWidth = window.innerWidth < 700 ? window.innerWidth : 700;
        const maxHeight = window.innerHeight < 500 ? window.innerHeight : 500;
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        const rows = 8;
        const cols = 10;
        const spacingX = canvas.width / cols;
        const spacingY = canvas.height / (rows + 2.5);

        obstacles.length = 0;
        for (let row = 3; row <= rows; row++) {
            for (let col = 0; col < row; col++) {
                const x = spacingX / 2 + col * spacingX - (row * spacingX) / 2 + canvas.width / 2;
                const y = row * spacingY;
                obstacles.push({ x, y });
            }
        }

        const slotWidth = canvas.width / slotValues.length;
        Array.from(slotsContainer.children).forEach((slot, index) => {
            slot.style.width = `${slotWidth - 10}px`;
            slot.style.height = '50px';
        });

        slotsContainer.style.bottom = `${spacingY / 2 + 3}px`; // Adjust slot position relative to obstacles
    }

    resizeGame();

    window.addEventListener('resize', resizeGame);

    slotValues.forEach((value) => {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.dataset.value = value;
        slot.innerText = `${value}x`;
        slot.style.backgroundColor = getGradientColor(value);
        slotsContainer.appendChild(slot);
    });

    class Ball {
        constructor(x, y, radius, imageSrc) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.image = new Image();
            this.image.src = imageSrc;
            this.image.onload = () => {
                this.draw(); // Draw the image once it's loaded
            };
            this.dx = (Math.random() - 0.5) * 2;
            this.dy = 2;
            this.bounceFactor = 0.75; // Energy loss factor
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.image, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }

        update() {
            this.dy += gravity;
            this.dy *= friction;
            this.y += this.dy;
            this.x += this.dx;

            obstacles.forEach(obstacle => {
                const dist = Math.hypot(this.x - obstacle.x, this.y - obstacle.y);
                if (dist < this.radius + 10) {
                    const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
                    const bouncePower = 3.5;
                    const bounceX = Math.cos(angle) * bouncePower;
                    const bounceY = Math.sin(angle) * bouncePower;

                    this.dx = bounceX * this.bounceFactor;
                    this.dy = bounceY * this.bounceFactor;
                    ripples.push(new Ripple(obstacle.x, obstacle.y));
                }
            });

            if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
                this.dx = -this.dx * this.bounceFactor;
            }

            if (this.y + this.radius > canvas.height) {
                this.y = canvas.height - this.radius;
                addScore(this.x);
                balls.splice(balls.indexOf(this), 1);
            }

            this.draw();
        }
    }


    function releaseBall() {
        const maxBalls = 50;
        ballPrice = parseInt(betAmountElement.value, 10);
        if (totalPoints - ballPrice >= 0 && balls.length < maxBalls) {
            const ballImageSrc = 'ball_1.png'; // Path to your ball image
            balls.push(new Ball(canvas.width / 2, 20, 10, ballImageSrc));
            totalPoints -= ballPrice;
            updatePoints();
        }
    }

    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 2;
            this.alpha = 1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.stroke();
            ctx.closePath();
        }

        update() {
            this.radius += 0.2;
            this.alpha -= 0.02;
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            releaseBall();
        }
    });

    document.getElementById('releaseButton').addEventListener('click', () => {
        releaseBall();
    });

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
                slotSound.currentTime = 0;
                slotSound.play();
                setTimeout(() => slot.classList.remove('highlight'), 300);
                updatePoints();
                updateHistory(score, getGradientColor(parseFloat(slot.dataset.value)));
            }
        });
    }

    function updatePoints() {
        pointsElement.textContent = formatNumber(totalPoints);
    }

    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function updateHistory(score, color) {
        const newHistoryItem = document.createElement('li');
        newHistoryItem.textContent = score.toFixed(2);
        newHistoryItem.classList.add('new');
        newHistoryItem.style.backgroundColor = color;

        // Insert new item at the top of the list
        historyList.insertBefore(newHistoryItem, historyList.firstChild);

        // Remove 'new' class from previous items and mark them as old
        const historyItems = historyList.querySelectorAll('li');
        historyItems.forEach((item, index) => {
            if (index !== 0) {
                item.classList.remove('new');
                item.classList.add('old');
            }
        });

        // Limit the number of displayed items
        if (historyItems.length > 5) {
            historyList.removeChild(historyItems[5]);
        }

        // Ensure the latest item stays 'new' for a brief moment
        setTimeout(() => {
            newHistoryItem.classList.remove('new');
        }, 500);
    }


    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        obstacles.forEach(obstacle => {
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
        });

        balls.forEach(ball => ball.update());

        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].update();
            ripples[i].draw();
            if (ripples[i].alpha <= 0) {
                ripples.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();

    exitButton.addEventListener('click', () => {
        alert(`You have exited the game with ${totalPoints} points.`);
        savePoints(totalPoints);
    });

    function savePoints(points) {
        let leaderboard = localStorage.getItem('leaderboard');
        if (!leaderboard) {
            leaderboard = [];
        } else {
            leaderboard = JSON.parse(leaderboard);
        }

        // Get the user ID counter
        let userIdCounter = localStorage.getItem('userIdCounter');
        if (!userIdCounter) {
            userIdCounter = 1;
        } else {
            userIdCounter = parseInt(userIdCounter, 10) + 1;
        }

        const playerName = prompt("Enter your name for the leaderboard:") || `user_${userIdCounter}`;
        if (!playerName.startsWith("user_")) {
            localStorage.setItem('userIdCounter', userIdCounter);
        }

        leaderboard.push({ name: playerName, points });
        leaderboard.sort((a, b) => b.points - a.points);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        displayLeaderboard(leaderboard);
    }

    function displayLeaderboard(leaderboard) {
        const leaderboardDiv = document.createElement('div');
        leaderboardDiv.id = 'leaderboard';
        leaderboardDiv.innerHTML = '<h3>Leaderboard</h3><ul>' + leaderboard.map(entry => `<li>${entry.name}: ${entry.points}</li>`).join('') + '</ul>';
        document.body.appendChild(leaderboardDiv);
    }
});
