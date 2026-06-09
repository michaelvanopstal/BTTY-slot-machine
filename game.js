<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Slot Machine - 21 Lijnen</title>
<style>
    body { font-family: Arial, sans-serif; text-align: center; background: #111; color: #0f0; }
    #reels { 
        display: grid; 
        grid-template-columns: repeat(4, 120px); 
        gap: 8px; 
        margin: 20px auto; 
        width: fit-content; 
        padding: 15px; 
        background: #222; 
        border: 4px solid #0f0; 
        border-radius: 12px;
    }
    .symbol { 
        width: 120px; 
        height: 120px; 
        background: #000; 
        border: 2px solid #0f0; 
        border-radius: 8px; 
        overflow: hidden;
    }
    .symbol img { width: 100%; height: 100%; object-fit: contain; }
    .winning { 
        border: 4px solid gold !important; 
        box-shadow: 0 0 20px gold; 
        animation: winpulse 0.6s infinite alternate; 
    }
    @keyframes winpulse { from { transform: scale(1); } to { transform: scale(1.08); } }
    button { 
        font-size: 18px; padding: 12px 24px; margin: 10px; 
        background: #0f0; color: #000; border: none; border-radius: 8px; cursor: pointer;
    }
    button:disabled { opacity: 0.5; }
    .info { font-size: 22px; margin: 10px; }
</style>
</head>
<body>

<h1>SLOT MACHINE - 21 Lijnen</h1>

<div class="info">
    Credits: <span id="credits">5000</span> | 
    Bet: <span id="bet">100</span> | 
    Lines: <span id="lines">5</span> | 
    Last Win: <span id="win">0</span>
</div>

<div id="reels"></div>

<div>
    <button id="spinBtn">SPIN</button>
    <button id="linesBtn">LINES: <strong>5</strong></button>
</div>

<div id="message" style="margin-top:15px; font-size:20px; min-height:70px;"></div>

<script>
// ==================== CONFIG ====================

const symbolNames = ["btty1.png", "btty2.png", "btty3.png", "btty4.png"];

const payouts = {
    "btty1.png": { 4: 3000 },
    "btty2.png": { 4: 1800 },
    "btty3.png": { 4: 1200 },
    "btty4.png": { 4: 600 }
};

let credits = 5000;
let bet = 100;
let numLines = 5;
let lastWin = 0;

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const linesEl = document.getElementById("lines");
const winEl = document.getElementById("win");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const linesBtn = document.getElementById("linesBtn");
const reelsContainer = document.getElementById("reels");

// ==================== PAYLINES ====================

const paylines5 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [0,1,6,11], [8,9,6,3]
];

const paylines13 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [0,1,6,11], [8,9,6,3],
    [0,1,2,7], [4,5,6,3], [4,5,6,11], [8,9,10,7],
    [0,5,6,7], [4,1,2,3], [4,9,10,11], [9,5,6,7]
];

const paylines21 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [0,1,6,11], [8,9,6,3],     // 5
    [0,1,2,7], [4,5,6,3], [4,5,6,11], [8,9,10,7],                 // 9
    [0,5,6,7], [4,1,2,3], [4,9,10,11], [9,5,6,7],                 // 13
    [0,5,3,7], [4,1,6,3], [4,9,6,11], [8,5,10,7],                 // 17
    [0,1,6,7], [4,5,2,3], [4,5,10,11], [8,9,6,7]                  // 21
];

let currentPaylines = paylines5;

// ==================== FUNCTIONS ====================

function createReels() {
    reelsContainer.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const div = document.createElement("div");
        div.classList.add("symbol");
        const img = document.createElement("img");
        img.src = symbolNames[Math.floor(Math.random() * symbolNames.length)];
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        div.appendChild(img);
        reelsContainer.appendChild(div);
    }
}

function getFileName(src) {
    return src.split("/").pop().split("?")[0];
}

function clearHighlights() {
    document.querySelectorAll(".symbol").forEach(s => s.classList.remove("winning"));
}

async function highlightPayline(positions) {
    positions.forEach(pos => {
        if (reelsContainer.children[pos]) reelsContainer.children[pos].classList.add("winning");
    });
    await new Promise(r => setTimeout(r, 1200));
}

async function spin() {
    if (credits < bet) { alert("Niet genoeg credits!"); return; }

    spinBtn.disabled = true;
    linesBtn.disabled = true;
    credits -= bet;
    updateUI();

    messageEl.textContent = "SPINNING...";
    clearHighlights();

    const allImgs = document.querySelectorAll(".symbol img");
    allImgs.forEach(img => img.style.animation = "spin 0.08s linear infinite");

    const delays = [600, 1000, 1450];
    for (let r = 0; r < 3; r++) {
        await new Promise(res => setTimeout(res, delays[r]));
        const start = r * 4;
        for (let i = 0; i < 4; i++) {
            allImgs[start + i].style.animation = "none";
            allImgs[start + i].src = symbolNames[Math.floor(Math.random() * symbolNames.length)];
        }
    }

    const wins = checkAllPaylines();

    if (wins.length > 0) {
        wins.sort((a, b) => b.amount - a.amount);
        let totalWin = 0;
        let messages = [];

        for (const win of wins) {
            await highlightPayline(win.line.slice(0, win.count));
            messages.push(`Lijn ${win.lineIndex + 1} (${win.count}x) = ${win.amount}`);
            totalWin += win.amount;
        }

        credits += totalWin;
        lastWin = totalWin;
        messageEl.innerHTML = messages.join("<br>") + `<br><strong>🎉 BIG WIN ${totalWin}!</strong>`;
        await new Promise(r => setTimeout(r, 2500));
        clearHighlights();
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst...";
    }

    updateUI();
    spinBtn.disabled = false;
    linesBtn.disabled = false;
}

function checkAllPaylines() {
    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    const current = imgs.map(img => getFileName(img.src));
    let wins = [];

    currentPaylines.forEach((line, index) => {
        const symbols = line.map(pos => current[pos]);
        const first = symbols[0];
        let count = 1;

        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === first) count++;
            else break;
        }

        if (count === 4) {
            const amount = payouts[first]?.[4];
            if (amount) {
                wins.push({
                    lineIndex: index,
                    line: line,
                    count: 4,
                    amount: amount,
                    symbol: first
                });
            }
        }
    });

    return wins;
}

function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
}

function updateLinesButton() {
    linesBtn.innerHTML = `LINES: <strong>${numLines}</strong>`;
}

function toggleLines() {
    if (numLines === 5) {
        numLines = 13;
        bet = 300;
        currentPaylines = paylines13;
    } else if (numLines === 13) {
        numLines = 21;
        bet = 500;           // of hoger als je wilt (bijv. 700)
        currentPaylines = paylines21;
    } else {
        numLines = 5;
        bet = 100;
        currentPaylines = paylines5;
    }
    updateUI();
    updateLinesButton();
}

// ==================== START ====================
createReels();
updateUI();
updateLinesButton();

spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);
</script>
</body>
</html>
