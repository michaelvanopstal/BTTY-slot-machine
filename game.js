// game.js
const symbolNames = ["btty1.png", "btty2.png", "btty3.png", "btty4.png"];

const payouts = {
    "btty1.png": { 3: 600, 4: 3000 },
    "btty2.png": { 3: 350, 4: 1800 },
    "btty3.png": { 3: 250, 4: 1200 },
    "btty4.png": { 3: 120, 4: 600 }
};

let credits = 5000;
let bet = 100;
let lastWin = 0;

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const reelsContainer = document.getElementById("reels");

const paylines = [
    [0,1,2,3],   // top rij
    [4,5,6,7],   // midden rij
    [8,9,10,11], // bottom rij
    [0,5,10], // diagonaal linksboven → rechtsonder
    [8,5,2]    // diagonaal linksonder → rechtsboven
];

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

async function highlightPayline(line, count) {
    clearHighlights();
    for (let i = 0; i < count; i++) {
        const symbolDiv = reelsContainer.children[line[i]];
        if (symbolDiv) symbolDiv.classList.add("winning");
    }
    await new Promise(res => setTimeout(res, 1700));
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
        wins.sort((a, b) => a.amount - b.amount);
        let totalWin = 0;

        for (let win of wins) {
            messageEl.innerHTML = `Payline ${win.lineIndex + 1} → <strong>${win.amount} credits</strong>`;
            await highlightPayline(win.line, win.count);
            totalWin += win.amount;
        }

        credits += totalWin;
        lastWin = totalWin;
        messageEl.innerHTML = `🎉 <strong>BIG WIN ${totalWin}!</strong>`;
        setTimeout(clearHighlights, 2800);
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

    paylines.forEach((line, index) => {
        const lineSymbols = line.map(pos => current[pos]);
        const first = lineSymbols[0];
        let count = 1;

        for (let i = 1; i < lineSymbols.length; i++) {
            if (lineSymbols[i] === first) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 3) {
            const amount = payouts[first]?.[count] || 0;
            if (amount > 0) {
                wins.push({
                    lineIndex: index,
                    line: line,
                    count: count,
                    amount: amount
                });
            }
        }
    });

    return wins;
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
