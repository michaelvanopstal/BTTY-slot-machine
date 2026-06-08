const symbols = ["🟠", "🍒", "BAR", "BRC20", "⭐", "🔥"]; // later vervang je dit door images

let credits = 5000;
let bet = 100;
let score = 0;
let lastWin = 0;

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");

const reelsGrid = document.getElementById("reels");

// Maak 3x4 grid
function createGrid() {
    reelsGrid.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const symbolDiv = document.createElement("div");
        symbolDiv.classList.add("symbol");
        symbolDiv.textContent = "?";
        reelsGrid.appendChild(symbolDiv);
    }
}

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// Spin animatie + logica
async function spin() {
    if (credits < bet) {
        alert("Niet genoeg credits!");
        return;
    }

    credits -= bet;
    updateUI();
    messageEl.textContent = "Spinning...";

    spinBtn.disabled = true;

    const allSymbols = Array.from(document.querySelectorAll(".symbol"));

    // Snelle spin animatie
    for (let i = 0; i < 12; i++) {
        allSymbols[i].style.transition = "transform 0.1s";
        allSymbols[i].style.transform = "rotateX(360deg)";
    }

    // Stop animatie na korte tijd
    await new Promise(r => setTimeout(r, 800));

    // Vul met nieuwe random symbolen
    const result = [];
    allSymbols.forEach(symbol => {
        const newSym = getRandomSymbol();
        symbol.textContent = newSym;
        result.push(newSym);
    });

    // Win check (3 rijen)
    const winAmount = checkWins(result);

    if (winAmount > 0) {
        credits += winAmount;
        score += winAmount;
        lastWin = winAmount;
        messageEl.innerHTML = `🎉 WIN ${winAmount} !`;
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst... Probeer opnieuw!";
    }

    updateUI();
    spinBtn.disabled = false;
}

// Eenvoudige win check voor 3 rijen (horizontale lijnen)
function checkWins(result) {
    let totalWin = 0;
    const rows = [
        result.slice(0, 4),   // rij 1
        result.slice(4, 8),   // rij 2
        result.slice(8, 12)   // rij 3
    ];

    rows.forEach(row => {
        const count = {};
        row.forEach(s => count[s] = (count[s] || 0) + 1);

        const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];

        if (best[1] >= 3) {
            totalWin += calculatePayout(best[0], best[1]);
        }
    });

    return totalWin;
}

function calculatePayout(symbol, count) {
    const payouts = {
        "🟠": { 3: 400, 4: 1500 },
        "BRC20": { 3: 300, 4: 1200 },
        "⭐": { 3: 250, 4: 1000 },
        "🔥": { 3: 200, 4: 800 },
        "BAR": { 3: 80, 4: 400 },
        "🍒": { 3: 50, 4: 200 }
    };
    return payouts[symbol]?.[count] || 0;
}

function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    winEl.textContent = lastWin;
    scoreEl.textContent = score;
}

// Start
createGrid();
updateUI();
spinBtn.addEventListener("click", spin);
