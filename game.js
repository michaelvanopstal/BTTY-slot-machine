// ==================== CONFIG ====================
const symbolNames = ["btty1.png", "btty2.png", "btty3.png", "btty4.png", "golden.png"];

const payouts = {
    "btty1.png": { 4: 3000 },
    "btty2.png": { 4: 1800 },
    "btty3.png": { 4: 1200 },
    "btty4.png": { 4: 600 },
    "golden.png": { 4: 0 }
};

let credits = 5000;
let bet = 100;
let numLines = 5;
let lastWin = 0;
let jackpot = 500000;
let isGambleActive = false;
let currentGambleWin = 0;
let gambleInterval = null;
let gambleSide = null;
let gambleResultSide = null;

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
const reelsContainer = document.getElementById("reels");

// ==================== PAYLINES ====================
const paylines5 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11],
    [0,1,6,11], [8,9,6,3]
];

const paylines13 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11],
    [0,1,6,11], [8,9,6,3],
    [0,1,2,7], [4,5,6,3], [4,5,6,11], [8,9,10,7],
    [0,5,6,7], [4,1,2,3], [4,9,10,11], [9,5,6,7]
];

const paylines21 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11],
    [0,1,6,11], [8,9,6,3],
    [0,1,2,7], [4,5,6,3], [4,5,6,11], [8,9,10,7],
    [0,5,6,7], [4,1,2,3], [4,9,10,11], [9,5,6,7],
    [0,5,3,7], [4,1,6,3], [4,9,6,11], [8,5,10,7],
    [0,1,6,7], [4,5,2,3], [4,5,10,11], [8,9,6,7]
];

let currentPaylines = paylines5;

const reelStrips = [];
const reelResults = [[], [], [], []];

// ==================== REELS CREATION ====================
function createReels() {
    reelsContainer.innerHTML = "";
    reelStrips.length = 0;

    for (let r = 0; r < 4; r++) {
        const reel = document.createElement("div");
        reel.className = "reel";

        const strip = document.createElement("div");
        strip.className = "reel-strip";

        // Veel symbolen voor soepele animatie
        for (let i = 0; i < 120; i++) {
            const symbol = document.createElement("div");
            symbol.className = "symbol";

            const img = document.createElement("img");
            const randomSymbol = Math.random() < 0.08 
                ? "golden.png" 
                : symbolNames[Math.floor(Math.random() * 4)];

            img.src = randomSymbol;
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

async function highlightPayline(positions) {
    positions.forEach(pos => {
        const symbol = reelsContainer.children[pos];
        if (symbol) symbol.classList.add("winning");
    });
    await new Promise(r => setTimeout(r, 1200));
}

function getVisibleGrid() {
    return [
        reelResults[0][0], reelResults[1][0], reelResults[2][0], reelResults[3][0],
        reelResults[0][1], reelResults[1][1], reelResults[2][1], reelResults[3][1],
        reelResults[0][2], reelResults[1][2], reelResults[2][2], reelResults[3][2]
    ];
}

// ==================== GAMBLE ====================
function startGamble(winAmount) {
    clearInterval(gambleInterval);
    currentGambleWin = winAmount;
    isGambleActive = true;

    kopGambleBtn.disabled = false;
    muntGambleBtn.disabled = false;

    messageEl.innerHTML = `
        Winst: <strong>${currentGambleWin}</strong><br>
        Kies KOP of MUNT of druk SPIN om te cashen
    `;

    let flip = true;
    gambleInterval = setInterval(() => {
        flip = !flip;
        kopGambleBtn.classList.toggle("active", flip);
        muntGambleBtn.classList.toggle("active", !flip);
    }, 150);
}

function gambleChoice(choice) {
    if (!isGambleActive) return;

    gambleResultSide = Math.random() < 0.5 ? "kop" : "munt";

    if (choice === gambleResultSide) {
        currentGambleWin *= 2;
        lastWin = currentGambleWin;

        messageEl.innerHTML = `
            Goed! Nieuwe winst: <strong>${currentGambleWin}</strong><br>
            Nog een keer of SPIN om te cashen
        `;
        updateUI();
    } else {
        messageEl.innerHTML = "Verloren!";
        resetGamble();
        setTimeout(() => spin(), 600);
    }
}

function resetGamble() {
    clearInterval(gambleInterval);
    gambleInterval = null;
    isGambleActive = false;

    kopGambleBtn.disabled = true;
    muntGambleBtn.disabled = true;
    kopGambleBtn.classList.remove("active");
    muntGambleBtn.classList.remove("active");
}

// ==================== SPIN REEL ====================
function spinReel(reelIndex, baseDuration = 2000) {
    return new Promise(resolve => {
        const strip = reelStrips[reelIndex];
        const symbolHeight = 90;
        const extraRounds = 8;
        const stopIndex = Math.floor(Math.random() * 22) + 8;

        // Bepaal zichtbare symbolen
        const visibleSymbols = [];
        for (let i = 0; i < 3; i++) {
            visibleSymbols.push(
                Math.random() < 0.08 ? "golden.png" : 
                symbolNames[Math.floor(Math.random() * 4)]
            );
        }
        reelResults[reelIndex] = visibleSymbols;

        // Reset positie
        strip.style.transition = "none";
        strip.style.transform = "translateY(0px)";
        void strip.offsetHeight;

        const targetPosition = (extraRounds * symbolHeight) + (stopIndex * symbolHeight);

        let duration = baseDuration;

        // Snelle spin
        strip.style.transition = `transform ${duration}ms linear`;
        strip.style.transform = `translateY(-${targetPosition}px)`;

        // Bounce effect
        setTimeout(() => {
            strip.style.transition = "transform 70ms cubic-bezier(0.35, 0, 1, 1)";
            strip.style.transform = `translateY(-${targetPosition - 38}px)`;

            setTimeout(() => {
                strip.style.transition = "transform 105ms cubic-bezier(0.25, 0.1, 0.3, 1)";
                strip.style.transform = `translateY(-${targetPosition + 14}px)`;

                setTimeout(() => {
                    strip.style.transition = "transform 45ms ease-out";
                    strip.style.transform = `translateY(-${targetPosition}px)`;
                    setTimeout(resolve, 55);
                }, 105);
            }, 70);
        }, duration - 95);
    });
}

// ==================== MAIN SPIN FUNCTION ====================
async function spin() {
    // Cash out gamble als actief
    if (isGambleActive) {
        const cashoutAmount = currentGambleWin;
        resetGamble();
        credits += cashoutAmount;
        lastWin = cashoutAmount;
        messageEl.innerHTML = `Geclaimed: ${cashoutAmount}`;
        currentGambleWin = 0;
        updateUI();
    }

    if (credits < bet) {
        alert("Niet genoeg credits!");
        return;
    }

    spinBtn.disabled = true;
    linesBtn.disabled = true;
    credits -= bet;
    updateUI();

    messageEl.textContent = "SPINNING...";
    clearHighlights();

    // Spin alle rollen met stagger
    await Promise.all([
        spinReel(0, 1600),
        spinReel(1, 1800),
        spinReel(2, 2000),
        spinReel(3, 2200)
    ]);

    // Winsten berekenen
    const wins = checkAllPaylines();
    let totalWin = 0;

    if (wins.length > 0) {
        wins.sort((a, b) => b.amount - a.amount);

        const messages = [];
        for (const win of wins) {
            await highlightPayline(win.line.slice(0, win.count));
            messages.push(`Lijn ${win.lineIndex + 1} (${win.count}x) = ${win.amount}`);
            totalWin += win.amount;
            jackpot += 5;
        }

        messageEl.innerHTML = messages.join("<br>") + `<br><strong>WIN ${totalWin}!</strong>`;

        await new Promise(r => setTimeout(r, 1200));
        clearHighlights();

        lastWin = totalWin;
        updateUI();

        currentGambleWin = totalWin;
        startGamble(totalWin);
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst...";
        updateUI();
    }

    // Jackpot check
    const jackpotWin = checkJackpot();
    if (jackpotWin > 0) {
        credits += jackpotWin;
        messageEl.innerHTML += `<br><strong>JACKPOT! +${jackpotWin}</strong>`;
        jackpot = 500000;
        updateUI();
    }

    spinBtn.disabled = false;
    linesBtn.disabled = false;
}

// ==================== WIN CHECKS ====================
function checkAllPaylines() {
    const current = getVisibleGrid();
    let wins = [];

    currentPaylines.forEach((line, index) => {
        const symbols = line.map(pos => current[pos]);
        const first = symbols[0];
        let count = 1;

        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === first) count++;
            else break;
        }

        if (count === 4 && first !== "golden.png") {
            const amount = payouts[first]?.[4];
            if (amount) {
                wins.push({
                    lineIndex: index,
                    line: line,
                    count: 4,
                    amount: amount
                });
            }
        }
    });

    return wins;
}

function checkJackpot() {
    const current = getVisibleGrid();
    const horizontal = [[0,1,2,3], [4,5,6,7], [8,9,10,11]];

    for (const line of horizontal) {
        if (line.every(pos => current[pos] === "golden.png")) {
            return jackpot;
        }
    }
    return 0;
}

// ==================== UI UPDATES ====================
function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
    if (jackpotEl) jackpotEl.textContent = jackpot.toFixed(3);
}

function updateLinesButton() {
    // Je kunt hier eventueel de tekst updaten als je wilt
}

function toggleLines() {
    if (numLines === 5) {
        numLines = 13;
        bet = 300;
        currentPaylines = paylines13;
    } else if (numLines === 13) {
        numLines = 21;
        bet = 500;
        currentPaylines = paylines21;
    } else {
        numLines = 5;
        bet = 100;
        currentPaylines = paylines5;
    }
    updateUI();
    updateLinesButton();
}

// ==================== EVENT LISTENERS ====================
spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);

kopGambleBtn.addEventListener("click", () => gambleChoice("kop"));
muntGambleBtn.addEventListener("click", () => gambleChoice("munt"));

// Button press effect
spinBtn.addEventListener("mousedown", () => {
    spinBtn.style.transform = "scale(0.9)";
});
spinBtn.addEventListener("mouseup", () => {
    spinBtn.style.transform = "scale(1)";
});
spinBtn.addEventListener("mouseleave", () => {
    spinBtn.style.transform = "scale(1)";
});

// ==================== INIT ====================
createReels();
updateUI();
updateLinesButton();
