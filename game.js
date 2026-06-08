// game.js
const symbols = [
    "btty1.png",  // Hoogste payout
    "btty2.png",
    "btty3.png",
    "btty4.png"
];

let credits = 5000;
let bet = 100;
let lastWin = 0;

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const reelsContainer = document.getElementById("reels");

function createReels() {
    reelsContainer.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const div = document.createElement("div");
        div.classList.add("symbol");
        
        const img = document.createElement("img");
        img.src = symbols[Math.floor(Math.random() * symbols.length)];
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        
        div.appendChild(img);
        reelsContainer.appendChild(div);
    }
}

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

async function spin() {
    if (credits < bet) {
        alert("Niet genoeg credits!");
        return;
    }

    credits -= bet;
    updateUI();
    messageEl.textContent = "SPINNING...";
    spinBtn.disabled = true;

    const allSymbols = document.querySelectorAll(".symbol img");

    // Start spinning
    allSymbols.forEach(img => {
        img.style.transition = "transform 0.1s linear";
        img.style.animation = "spin 0.08s linear infinite";
    });

    const rowDelays = [700, 1050, 1450];

    for (let row = 0; row < 3; row++) {
        await new Promise(r => setTimeout(r, rowDelays[row]));

        const start = row * 4;
        for (let i = 0; i < 4; i++) {
            const index = start + i;
            allSymbols[index].style.animation = "none";
            allSymbols[index].src = getRandomSymbol();
        }
    }

    const winAmount = calculateWin();

    if (winAmount > 0) {
        credits += winAmount;
        lastWin = winAmount;
        messageEl.innerHTML = `🎉 BIG WIN ${winAmount}!`;
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst...";
    }

    updateUI();
    spinBtn.disabled = false;
}

function calculateWin() {
    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    let totalWin = 0;

    for (let row = 0; row < 3; row++) {
        const rowImgs = imgs.slice(row*4, row*4 + 4);
        const srcList = rowImgs.map(img => img.src);

        const counts = {};
        srcList.forEach(src => counts[src] = (counts[src] || 0) + 1);

        const highestCount = Math.max(...Object.values(counts));

        if (highestCount >= 3) {
            // Hoe hoger het symbool, hoe meer punten
            const payoutMultiplier = 4 - Object.keys(counts).indexOf(Object.keys(counts).find(s => counts[s] === highestCount));
            totalWin += highestCount * 150 * payoutMultiplier;
        }
    }
    return Math.floor(totalWin);
}

function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    winEl.textContent = lastWin;
}

// Start
createReels();
updateUI();
spinBtn.addEventListener("click", spin);
