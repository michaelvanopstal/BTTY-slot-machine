// ==================== CONFIG ====================
const symbolNames = ["btty1.png", "btty2.png", "btty3.png", "btty4.png", "golden.png"];

const payouts = {
    "btty1.png": 3000,
    "btty2.png": 1800,
    "btty3.png": 1200,
    "btty4.png": 600,
    "golden.png": 0
};

let credits = 5000;
let bet = 100;
let numLines = 5;
let lastWin = 0;
let jackpot = 500000;
let isGambleActive = false;
let currentGambleWin = 0;
let gambleInterval = null;

// DOM Elements
const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const linesEl = document.getElementById("lines");
const winEl = document.getElementById("win");
const jackpotEl = document.getElementById("jackpot");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const linesBtn = document.getElementById("linesBtn");
const kopGambleBtn = document.getElementById("kopGambleBtn");
const muntGambleBtn = document.getElementById("muntGambleBtn");
const reelsContainer = document.getElementById("reels");   // dit moet je .reels of slot-window zijn

const reelStrips = [];
let finalGrid = new Array(12).fill(null);

const SYMBOL_HEIGHT = 90;
const VISIBLE_ROWS = 3;

// ==================== CREATE REELS ====================
function createReels() {
    reelsContainer.innerHTML = "";
    reelStrips.length = 0;

    for (let r = 0; r < 4; r++) {
        const reel = document.createElement("div");
        reel.className = "reel";

        const strip = document.createElement("div");
        strip.className = "reel-strip";

        // Genoeg symbols voor mooie spin
        for (let i = 0; i < 60; i++) {
            const symbol = document.createElement("div");
            symbol.className = "symbol";

            const img = document.createElement("img");
            img.src = Math.random() < 0.08 ? "golden.png" : symbolNames[Math.floor(Math.random() * 4)];
            img.draggable = false;
            symbol.appendChild(img);

            strip.appendChild(symbol);
        }

        strip.style.transform = "translateY(0px)";
        strip.style.transition = "none";

        reel.appendChild(strip);
        reelsContainer.appendChild(reel);
        reelStrips.push(strip);
    }
}

// ==================== HELPERS ====================
function getFileName(src) {
    return src.split("/").pop().split("?")[0];
}

function clearHighlights() {
    document.querySelectorAll(".symbol").forEach(s => s.classList.remove("winning"));
}

// ==================== SPIN REEL (aangepast aan jouw CSS) ====================
function spinReel(reelIndex, stopIndex) {
    return new Promise(resolve => {
        const strip = reelStrips[reelIndex];
        const extraSpins = 7 + Math.floor(Math.random() * 6);

        // Bereken exacte positie zodat de stopIndex perfect in beeld komt
        const targetY = -((extraSpins * 40) + stopIndex) * SYMBOL_HEIGHT;

        strip.style.transition = "none";
        strip.style.transform = "translateY(0px)";
        void strip.offsetHeight; // force reflow

        strip.style.transition = `transform ${1300 + reelIndex * 320}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        strip.style.transform = `translateY(${targetY}px)`;

        setTimeout(resolve, 1350 + reelIndex * 320);
    });
}

// ==================== MAIN SPIN ====================
async function spin() {
    if (isGambleActive) {
        const cashout = currentGambleWin;
        resetGamble();
        credits += cashout;
        lastWin = cashout;
        messageEl.textContent = `Geclaimed: ${cashout}`;
        updateUI();
        return;
    }

    if (credits < bet) return alert("Niet genoeg credits!");

    spinBtn.disabled = linesBtn.disabled = true;
    credits -= bet;
    updateUI();
    messageEl.textContent = "SPINNING...";
    clearHighlights();

    finalGrid = new Array(12).fill(null);
    const stopIndices = [];

    // Bepaal stop posities + finalGrid
    for (let reel = 0; reel < 4; reel++) {
        const strip = reelStrips[reel];
        const symbols = strip.querySelectorAll(".symbol");
        const stopIdx = Math.floor(Math.random() * (symbols.length - VISIBLE_ROWS - 5)) + 3;

        stopIndices.push(stopIdx);

        for (let row = 0; row < VISIBLE_ROWS; row++) {
            const idx = (stopIdx + row) % symbols.length;
            finalGrid[row * 4 + reel] = getFileName(symbols[idx].querySelector("img").src);
        }
    }

    // Start spinning
    await Promise.all(reelStrips.map((_, i) => spinReel(i, stopIndices[i])));

    await new Promise(r => setTimeout(r, 200)); // settling time

    // Win check
    const wins = checkAllPaylines();
    let totalWin = 0;

    if (wins.length > 0) {
        for (const win of wins) {
            await highlightPayline(win.line);
            totalWin += win.amount;
            jackpot += Math.floor(bet / 10);
        }
        messageEl.innerHTML = `🎉 WIN ${totalWin}! 🎉`;
        lastWin = totalWin;
        currentGambleWin = totalWin;
        startGamble(totalWin);
    } else {
        messageEl.textContent = "Geen winst...";
        lastWin = 0;
    }

    if (checkJackpot()) {
        credits += jackpot;
        messageEl.innerHTML += `<br>🎰 JACKPOT! +${jackpot}`;
        jackpot = 500000;
    }

    updateUI();
    spinBtn.disabled = linesBtn.disabled = false;
}

// ==================== WIN CHECKS ====================
function checkAllPaylines() {
    let wins = [];
    currentPaylines.forEach((line, idx) => {
        const syms = line.map(p => finalGrid[p]);
        const first = syms[0];
        if (first && syms.every(s => s === first) && first !== "golden.png") {
            wins.push({ line, amount: payouts[first] || 0 });
        }
    });
    return wins.filter(w => w.amount > 0);
}

function checkJackpot() {
    const horizontals = [[0,1,2,3],[4,5,6,7],[8,9,10,11]];
    return horizontals.some(line => line.every(pos => finalGrid[pos] === "golden.png"));
}

// ==================== HIGHLIGHT ====================
async function highlightPayline(positions) {
    clearHighlights();
    positions.forEach(pos => {
        const reelIdx = pos % 4;
        const rowIdx = Math.floor(pos / 4);
        const strip = reelStrips[reelIdx];
        const symbols = strip.querySelectorAll(".symbol");
        if (symbols[rowIdx]) symbols[rowIdx].classList.add("winning");
    });
    await new Promise(r => setTimeout(r, 1400));
}

// Gamble functies (kopieer deze uit je vorige werkende versie)
function startGamble(winAmount) {
    // ... je bestaande gamble code ...
}
function gambleChoice(choice) { /* ... */ }
function resetGamble() { /* ... */ }

function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
    if (jackpotEl) jackpotEl.textContent = jackpot;
}

function toggleLines() {
    if (numLines === 5) { numLines = 13; bet = 300; currentPaylines = paylines13; }
    else if (numLines === 13) { numLines = 21; bet = 500; currentPaylines = paylines21; }
    else { numLines = 5; bet = 100; currentPaylines = paylines5; }
    updateUI();
}

// ==================== INIT ====================
createReels();
updateUI();

