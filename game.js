// ==================== CONFIG ====================
const symbolNames = ["btty1.png", "btty2.png", "btty3.png", "btty4.png", "golden.png"];

const payouts = {
    "btty1.png": 3000, "btty2.png": 1800, "btty3.png": 1200,
    "btty4.png": 600, "golden.png": 0
};

let credits = 5000;
let bet = 100;
let numLines = 5;
let lastWin = 0;
let jackpot = 500000;
let isGambleActive = false;
let currentGambleWin = 0;
let gambleInterval = null;

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
const reelsContainer = document.getElementById("reels");

// Paylines
const paylines5 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3]];
const paylines13 = [...paylines5, [0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7]];
const paylines21 = [...paylines13, [0,5,3,7],[4,1,6,3],[4,9,6,11],[8,5,10,7],[0,1,6,7],[4,5,2,3],[4,5,10,11],[8,9,6,7]];

let currentPaylines = paylines5;
const reelStrips = [];
let finalGrid = new Array(12).fill(null);

// ==================== CREATE REELS (belangrijk: goede sizing) ====================
function createReels() {
    reelsContainer.innerHTML = "";
    reelStrips.length = 0;

    for (let r = 0; r < 4; r++) {
        const reel = document.createElement("div");
        reel.className = "reel";

        const strip = document.createElement("div");
        strip.className = "reel-strip";

        for (let i = 0; i < 80; i++) {   // genoeg symbols voor spin
            const symbol = document.createElement("div");
            symbol.className = "symbol";
            const img = document.createElement("img");
            img.src = Math.random() < 0.08 ? "golden.png" : symbolNames[Math.floor(Math.random() * 4)];
            img.draggable = false;
            symbol.appendChild(img);
            strip.appendChild(symbol);
        }

        strip.style.transition = "none";
        strip.style.transform = "translateY(0px)";
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

// ==================== SPIN REEL - VISUEEL GEOPTIMALISEERD ====================
function spinReel(reelIndex, finalStopIndex) {
    return new Promise(resolve => {
        const strip = reelStrips[reelIndex];
        const symbolHeight = 90;
        const extraSpins = 6 + Math.floor(Math.random() * 5);

        const targetY = -((extraSpins * 80) + finalStopIndex) * symbolHeight;

        // Reset
        strip.style.transition = "none";
        strip.style.transform = "translateY(0px)";
        void strip.offsetHeight; // force reflow

        // Echte spin
        strip.style.transition = `transform ${1350 + reelIndex * 280}ms cubic-bezier(0.22, 0.05, 0.25, 1)`;
        strip.style.transform = `translateY(${targetY}px)`;

        setTimeout(resolve, 1400 + reelIndex * 280);
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

    // Bepaal stop posities + vul finalGrid
    for (let reel = 0; reel < 4; reel++) {
        const strip = reelStrips[reel];
        const symbols = strip.querySelectorAll(".symbol");
        const stopIdx = Math.floor(Math.random() * (symbols.length - 5)) + 2; // veilige marge

        stopIndices.push(stopIdx);

        for (let row = 0; row < 3; row++) {
            const idx = (stopIdx + row) % symbols.length;
            finalGrid[row * 4 + reel] = getFileName(symbols[idx].querySelector("img").src);
        }
    }

    // Spin alle reels
    await Promise.all(reelStrips.map((_, i) => spinReel(i, stopIndices[i])));

    // Kleine extra wacht voor visuele settling
    await new Promise(r => setTimeout(r, 180));

    // Win check
    const wins = checkAllPaylines();
    let totalWin = 0;

    if (wins.length > 0) {
        for (const win of wins) {
            await highlightPayline(win.line);
            totalWin += win.amount;
            jackpot += 5;
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

// Win checks
function checkAllPaylines() {
    let wins = [];
    currentPaylines.forEach((line, idx) => {
        const syms = line.map(p => finalGrid[p]);
        const first = syms[0];
        if (first && syms.every(s => s === first) && first !== "golden.png") {
            wins.push({ line, amount: payouts[first] });
        }
    });
    return wins;
}

function checkJackpot() {
    return [[0,1,2,3],[4,5,6,7],[8,9,10,11]].some(l => l.every(i => finalGrid[i] === "golden.png"));
}

// Highlight
async function highlightPayline(positions) {
    clearHighlights();
    positions.forEach(pos => {
        const reelIdx = pos % 4;
        const rowIdx = Math.floor(pos / 4);
        const strip = reelStrips[reelIdx];
        const symbols = strip.querySelectorAll(".symbol img");
        // Simpele benadering: neem de huidige visuele positie
        const symbolEl = symbols[rowIdx * 2 + 1] || symbols[rowIdx]; // veilige fallback
        if (symbolEl && symbolEl.parentElement) symbolEl.parentElement.classList.add("winning");
    });
    await new Promise(r => setTimeout(r, 1350));
}

// Gamble (onveranderd)
function startGamble(win) { /* zelfde als vorige versie */ 
    // ... kopieer uit vorige code
}
function gambleChoice(choice) { /* zelfde */ }
function resetGamble() { /* zelfde */ }

function updateUI() { /* zelfde als vorige */ }

function toggleLines() { /* zelfde */ }

// Event listeners
spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);
kopGambleBtn.addEventListener("click", () => gambleChoice("kop"));
muntGambleBtn.addEventListener("click", () => gambleChoice("munt"));

createReels();
updateUI();

