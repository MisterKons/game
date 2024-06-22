document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('No username found, redirecting to welcome page.');
        window.location.href = 'index.html';
    }

    let score = getUserScore(username);
    updateScoreDisplay(score);

    document.getElementById('spinButton').addEventListener('click', spin);
    document.getElementById('resetButton').addEventListener('click', reset);
    document.getElementById('gambleButton').addEventListener('click', gamble);
    document.getElementById('freeRespinsButton').addEventListener('click', freeReSpin);
    document.getElementById('exit_slots').addEventListener('click', () => {
        saveUserScore(username, score);
        window.location.href = 'index.html';
    });

    function saveUserScore(username, score) {
        let scores = JSON.parse(localStorage.getItem('userScores')) || {};
        scores[username] = score;
        localStorage.setItem('userScores', JSON.stringify(scores));
    }

    function getUserScore(username) {
        const scores = JSON.parse(localStorage.getItem('userScores')) || {};
        return scores[username] || 0;
    }

    function updateScoreDisplay(score) {
        document.getElementById('score').textContent = score;
    }

    function spin() {
        const betAmount = parseInt(document.getElementById('betAmount').value);
        if (isNaN(betAmount) || betAmount <= 0 || betAmount > score) {
            alert('Please enter a valid bet amount that is less than or equal to your current score.');
            return;
        }

        const selectedLines = Array.from(document.querySelectorAll('.line-checkbox:checked')).map(cb => parseInt(cb.value));
        if (selectedLines.length === 0) {
            alert('Please select at least one line to play.');
            return;
        }

        clearHighlights();
        let win = false;
        let totalWin = 0;

        for (let row = 1; row <= 5; row++) {
            for (let col = 1; col <= 5; col++) {
                spinReel(`reel${row}-${col}`);
            }
        }

        setTimeout(() => {
            selectedLines.forEach(line => {
                if (Math.random() < winRate) {
                    if (checkLine(line)) {
                        totalWin += betAmount * 10 * multiplier;
                        highlightLine(line);
                        win = true;
                    }
                }
            });

            if (win) {
                score += totalWin;
                multiplier = 1;
                document.getElementById('score').classList.add('win-animation');
                setTimeout(() => {
                    document.getElementById('score').classList.remove('win-animation');
                }, 1000);
            } else {
                score -= betAmount;
                multiplier += 1;
            }

            updateScoreDisplay(score);
            saveUserScore(username, score);
        }, 2000);
    }

    function spinReel(reelId) {
        const reel = document.getElementById(reelId);
        const randomIndex = Math.floor(Math.random() * symbols.length);
        reel.textContent = symbols[randomIndex];
        reel.style.transform = 'rotateX(360deg)';
        setTimeout(() => {
            reel.style.transform = 'rotateX(0deg)';
        }, 500);
    }

    function checkLine(line) {
        let positions;
        if (line === 6) {
            positions = ['reel1-1', 'reel2-2', 'reel3-3', 'reel4-4', 'reel5-5'];
        } else if (line === 7) {
            positions = ['reel1-5', 'reel2-4', 'reel3-3', 'reel4-2', 'reel5-1'];
        } else {
            positions = [`reel${line}-1`, `reel${line}-2`, `reel${line}-3`, `reel${line}-4`, `reel${line}-5`];
        }

        const firstSymbol = document.getElementById(positions[0]).textContent;
        for (let i = 1; i < positions.length; i++) {
            if (document.getElementById(positions[i]).textContent !== firstSymbol) {
                return false;
            }
        }
        return true;
    }

    function highlightLine(line) {
        let positions;
        if (line === 6) {
            positions = ['reel1-1', 'reel2-2', 'reel3-3', 'reel4-4', 'reel5-5'];
        } else if (line === 7) {
            positions = ['reel1-5', 'reel2-4', 'reel3-3', 'reel4-2', 'reel5-1'];
        } else {
            positions = [`reel${line}-1`, `reel${line}-2`, `reel${line}-3`, `reel${line}-4`, `reel${line}-5`];
        }

        positions.forEach(pos => {
            document.getElementById(pos).classList.add('highlight');
        });
    }

    function clearHighlights() {
        const reels = document.querySelectorAll('.reel');
        reels.forEach(reel => {
            reel.classList.remove('highlight');
        });
    }

    function reset() {
        score = 0;
        multiplier = 1;
        updateScoreDisplay(score);
        for (let row = 1; row <= 5; row++) {
            for (let col = 1; col <= 5; col++) {
                document.getElementById(`reel${row}-${col}`).textContent = '';
            }
        }
        document.getElementById('betAmount').value = '';
        clearHighlights();
        saveUserScore(username, score);
    }

    function gamble() {
        if (score <= 0) {
            alert('You have no winnings to gamble.');
            return;
        }

        const gambleWin = Math.random() > 0.5;
        if (gambleWin) {
            score *= 2;
            alert('You won the gamble! Your score is doubled.');
        } else {
            score = 0;
            alert('You lost the gamble. Your score is reset to zero.');
        }
        updateScoreDisplay(score);
        saveUserScore(username, score);
    }

    function freeReSpin() {
        const selectedLines = Array.from(document.querySelectorAll('.line-checkbox:checked')).map(cb => parseInt(cb.value));
        if (selectedLines.length === 0) {
            alert('Please select at least one line to play.');
            return;
        }

        clearHighlights();
        let win = false;

        selectedLines.forEach(line => {
            if (checkLine(line)) {
                highlightLine(line);
                win = true;
            }
        });

        if (win) {
            alert('You cannot use free re-spin when there is already a winning combination.');
            return;
        }

        for (let row = 1; row <= 5; row++) {
            for (let col = 1; col <= 5; col++) {
                spinReel(`reel${row}-${col}`);
            }
        }

        setTimeout(() => {
            selectedLines.forEach(line => {
                if (checkLine(line)) {
                    score += 10 * multiplier;
                    highlightLine(line);
                    win = true;
                }
            });

            if (win) {
                document.getElementById('score').classList.add('win-animation');
                setTimeout(() => {
                    document.getElementById('score').classList.remove('win-animation');
                }, 1000);
            }

            updateScoreDisplay(score);
            saveUserScore(username, score);
        }, 2000);
    }

    const symbols = ['🍒', '🍋', '🔔', '⭐', '💎'];
    let multiplier = 1;
    const winRate = 0.3;
});
