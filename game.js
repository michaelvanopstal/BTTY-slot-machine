// game.js
const symbols = ["btty1.png", "btty2.png", "btty3.png", "btty4.png"];

const payouts = {
    "btty1.png": { 3: 500, 4: 2500 },
    "btty2.png": { 3: 300, 4: 1500 },
    "btty3.png": { 3: 200, 4: 1000 },
    "btty4.png": { 3: 100, 4: 500 }
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
    [0,1,2,3], [4,5,6,7], [8,9,10,11],     // horizontale
    [0,5,10,11], [8,5,2,3],                 // diagonalen
    [0,1,6,11], [8,9,6,3],                  // V vormen
    [4,1,2,7], [4,9,10,7]                   // zigzag
];

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

function clearHighlights() {
    document.querySelectorAll(".symbol").forEach(s => s.classList.remove("winning"));
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

    // Snelle spin
    allImgs.forEach(img => img.style.animation = "spin 0.08s linear infinite");

    const delays = [600, 1000, 1450];

    for (let r = 0; r < 3; r++) {
        await new Promise(res => setTimeout(res, delays[r]));
        const start = r * 4;
        for (let i = 0; i < 4; i++) {
            allImgs[start + i].style.animation = "none";
            allImgs[start + i].src = symbols[Math.floor(Math.random() * symbols.length)];
        }
    }

    // Win check
    const wins = checkAllPaylines();

    if (wins.length > 0) {
        wins.sort((a, b) => a.amount - b.amount);   // laag naar hoog

        let totalWin = 0;

        for (let win of wins) {
            highlightPayline(win.line);
            messageEl.innerHTML = `Payline ${win.lineIndex + 1} → <strong>${win.amount} credits</strong>`;
            totalWin += win.amount;
            await new Promise(res => setTimeout(res, 1100)); // pauze zodat je het ziet
        }

        credits += totalWin;
        lastWin = totalWin;
        messageEl.innerHTML = `🎉 <strong>BIG WIN ${totalWin}!</strong>`;
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst...";
    }

    updateUI();
    spinBtn.disabled = false;
}

function checkAllPaylines() {
    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    const current = imgs.map(img => img.src);
    const wins = [];

    paylines.forEach((line, index) => {
        const lineSymbols = line.map(pos => current[pos]);
        const firstSymbol = lineSymbols[0];
        let count = 1;

        for (let i = 1; i < lineSymbols.length; i++) {
            if (lineSymbols[i] === firstSymbol) count++;
            else break;
        }

        if (count >= 3) {
            const amount = payouts[firstSymbol]?.[count] || 0;
            if (amount > 0) {
                wins.push({
                    lineIndex: index,
                    line: line,
                    amount: amount
                });
            }
        }
    });

    return wins;
}

function highlightPayline(line) {
    line.forEach(pos => {
        const symbolDiv = reelsContainer.children[pos];
        if (symbolDiv) symbolDiv.classList.add("winning");
    });
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
