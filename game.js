const symbolNames = ["btty1.png", "btty2.png", "btty3.png", "btty4.png"];

const payouts = {
    "btty1.png": { 3: 600, 4: 3000 },
    "btty2.png": { 3: 350, 4: 1800 },
    "btty3.png": { 3: 250, 4: 1200 },
    "btty4.png": { 3: 120, 4: 600 }
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

// === JOUW PAYLINES ===
const paylines5 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11],
    [0,5,10], [8,5,2]
];

const paylines12 = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11],
    [0,5,10], [8,5,2],
    [0,1,6], [4,5,2], [4,5,10], [8,9,6],
    [0,1,6,11], [8,9,6,3]
];

let currentPaylines = paylines5;

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
    return src.split('/').pop().split('?')[0];
}

function clearHighlights() {
    document.querySelectorAll(".symbol").forEach(s => s.classList.remove("winning"));
}

async function highlightPayline(positions) {
    positions.forEach(pos => {
        if (reelsContainer.children[pos]) {
            reelsContainer.children[pos].classList.add("winning");
        }
    });
    await new Promise(r => setTimeout(r, 1200));
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
    clearHighlights();

    // Spin animatie
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
        wins.sort((a, b) => b.count - a.count);

        let totalWin = 0;
        let winMessages = [];

        for (let win of wins) {
            const winningPositions = win.line.slice(0, win.count);
            await highlightPayline(winningPositions);
            
            winMessages.push(`Lijn ${win.lineIndex + 1} (${win.count}x) = ${win.amount}`);
            totalWin += win.amount;
        }

        credits += totalWin;
        lastWin = totalWin;

        // Mooie weergave bij veel wins
        if (winMessages.length > 3) {
            messageEl.innerHTML = `🎉 <strong>${winMessages.length} WINS! BIG WIN ${totalWin}</strong>`;
        } else {
            messageEl.innerHTML = winMessages.join("<br>") + `<br>🎉 <strong>BIG WIN ${totalWin}!</strong>`;
        }

        await new Promise(r => setTimeout(r, 2800));
        clearHighlights();
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst...";
    }

    updateUI();
    spinBtn.disabled = false;
}

function checkAllPaylines() {
    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    const current = imgs.map(img => getFileName(img.src));
    const wins = [];

    console.clear(); // schoon debug venster
    console.log("%c=== PAYLINE CHECK START ===", "color: yellow; font-size: 14px");

    currentPaylines.forEach((line, index) => {
        const lineSymbols = line.map(pos => current[pos]);
        const first = lineSymbols[0];
        let count = 1;

        for (let i = 1; i < lineSymbols.length; i++) {
            if (lineSymbols[i] === first) count++;
            else break;
        }

        if (count >= 3) {
            const amount = payouts[first]?.[count] || 0;
            if (amount > 0) {
                wins.push({
                    lineIndex: index,
                    line: line,
                    count: count,
                    amount: amount,
                    symbols: lineSymbols
                });
                
                // Debug in console
                console.log(`✅ Lijn ${index + 1} → ${count}x ${first} | Posities: ${line.slice(0,count)} | Win: ${amount}`);
            }
        }
    });

    console.log(`%cTotaal wins gevonden: ${wins.length} → Uitbetaling: ${wins.reduce((sum, w) => sum + w.amount, 0)}`, 
                "color: lime; font-weight: bold");

    return wins;
}

function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
}

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
}

// Start
createReels();
updateUI();
spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);
