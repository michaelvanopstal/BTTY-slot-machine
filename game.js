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
    [0,1,2,3],
    [4,5,6,7],
    [8,9,10,11],
    [0,1,6,11],
    [8,9,6,3]
];

// Echte 12 lijnen, geen dubbele 3-symbolen versies
const paylines12 = [
    [0,1,2,3],
    [4,5,6,7],
    [8,9,10,11],
    [0,1,6,11],
    [8,9,6,3],

    [0,1,2,7],
    [4,5,6,3],
    [4,5,6,11],
    [8,9,10,7],
    
     [0,5,6,7],
    [4,1,2,3],
    [4,9,10,11],
    [9,5,6,7],

    
    
];

const paylines18 = [
    [0,1,2,3],
    [4,5,6,7],
    [8,9,10,11],
    [0,1,6,11],
    [8,9,6,3],

    [0,1,2,7],
    [4,5,6,3],
    [4,5,6,11],
    [8,9,10,7],

     [0,5,6,7],
    [4,1,2,3],
    [4,9,10,11],
    [9,5,6,7],

    [0,5,3,7],
    [4,1,6,3],
    [4,9,6,11],
    [8,5,10,7]

    
];
let currentPaylines = paylines5;

// ==================== CREATE REELS ====================

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
    document
        .querySelectorAll(".symbol")
        .forEach(s => s.classList.remove("winning"));
}

async function highlightPayline(positions) {

    positions.forEach(pos => {

        if (reelsContainer.children[pos]) {
            reelsContainer.children[pos].classList.add("winning");
        }

    });

    await new Promise(r => setTimeout(r, 1200));
}

// ==================== SPIN ====================

async function spin() {

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

    const allImgs = document.querySelectorAll(".symbol img");

    allImgs.forEach(img => {
        img.style.animation = "spin 0.08s linear infinite";
    });

    const delays = [600, 1000, 1450];

    for (let r = 0; r < 3; r++) {

        await new Promise(res => setTimeout(res, delays[r]));

        const start = r * 4;

        for (let i = 0; i < 4; i++) {

            allImgs[start + i].style.animation = "none";

            allImgs[start + i].src =
                symbolNames[Math.floor(Math.random() * symbolNames.length)];

        }
    }

    const wins = checkAllPaylines();

    if (wins.length > 0) {

        wins.sort((a, b) => b.count - a.count);

        let totalWin = 0;
        let messages = [];

        for (const win of wins) {

            const winningPositions = win.line.slice(0, win.count);

            await highlightPayline(winningPositions);

            messages.push(
                `Lijn ${win.lineIndex + 1} (${win.count}x) = ${win.amount}`
            );

            totalWin += win.amount;
        }

        credits += totalWin;
        lastWin = totalWin;

        messageEl.innerHTML =
            messages.join("<br>") +
            `<br><strong>🎉 BIG WIN ${totalWin}!</strong>`;

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

// ==================== PAYLINE CHECK ====================

function checkAllPaylines() {

    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    const current = imgs.map(img => getFileName(img.src));

    let wins = [];

    console.clear();

    console.log("=================================");
    console.log("MODE:", numLines);
    console.log("BET:", bet);
    console.log("ACTIVE PAYLINES:", currentPaylines.length);
    console.log("=================================");

    currentPaylines.forEach((line, index) => {

        const symbols = line.map(pos => current[pos]);

        const firstSymbol = symbols[0];

        let count = 1;

        for (let i = 1; i < symbols.length; i++) {

            if (symbols[i] === firstSymbol) {
                count++;
            } else {
                break;
            }

        }

        if (count !== 4) return;

        const amount = payouts[firstSymbol]?.[count];

        if (!amount) return;

        wins.push({
            lineIndex: index,
            line: line,
            count: count,
            amount: amount,
            symbol: firstSymbol
        });

    });

    // ==================================================
    // VERWIJDER KORTERE WINS DIE IN LANGERE WINS ZITTEN
    // ==================================================

    wins = wins.filter(win => {

        return !wins.some(other => {

            if (other === win) return false;

            // alleen kijken naar langere combinaties
            if (other.count <= win.count) return false;

            // zelfde symbool
            if (other.symbol !== win.symbol) return false;

            // begin van langere lijn vergelijken
            const otherPrefix =
                other.line.slice(0, win.line.length).join(",");

            const thisLine =
                win.line.join(",");

            return thisLine === otherPrefix;

        });

    });

    console.log("=================================");
    console.log("WINS");
    console.log("=================================");

    let totalWin = 0;

    wins.forEach(win => {

        totalWin += win.amount;

        console.log(
            `Lijn ${win.lineIndex + 1} | Posities ${win.line.join("-")} | ${win.count}x ${win.symbol} | Win ${win.amount}`
        );

    });

    console.log("=================================");
    console.log("TOTAL WIN:", totalWin);
    console.log("=================================");

    return wins;
}
function updateUI() {

    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
}

function updateLinesButton() {

    linesBtn.innerHTML =
        `LINES: <strong>${numLines}</strong>`;
}

// ==================== TOGGLE ====================

function toggleLines() {

    if (numLines === 5) {

        numLines = 12;
        bet = 500;
        currentPaylines = paylines12;

    } else {

        numLines = 5;
        bet = 100;
        currentPaylines = paylines5;
    }

    updateUI();
    updateLinesButton();

    console.log(
        `MODE GEWIJZIGD -> ${numLines} lijnen`
    );
}

// ==================== START ====================

createReels();
updateUI();
updateLinesButton();

spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);
