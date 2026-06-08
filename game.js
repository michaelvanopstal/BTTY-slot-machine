// game.js
const symbols = [
    "btty1.png",  // 1 = hoogste payout (zwarte ronde BTTY)
    "btty2.png",  // 2 = black-ops
    "btty3.png",  // 3 = satoshi
    "btty4.png"   // 4 = construction
];

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

// 9 Paylines voor 3x4 grid (posities 0 t/m 11)
const paylines = [
    [0,1,2,3],     // 1. Top rij
    [4,5,6,7],     // 2. Midden rij
    [8,9,10,11],   // 3. Bottom rij
    [0,5,10,11],   // 4. Diagonal top-left to bottom-right
    [8,5,2,3],     // 5. Diagonal bottom-left to top-right
    [0,1,6,11],    // 6. V-vorm
    [8,9,6,3],     // 7. Omgekeerde V
    [4,1,2,7],     // 8. Zigzag boven
    [4,9,10,7]     // 9. Zigzag onder
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

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// Verwijder alle highlights
function clearHighlights() {
    document.querySelectorAll(".symbol").forEach(s => {
        s.classList.remove("winning");
    });
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

    // Start spinning
    allImgs.forEach(img => img.style.animation = "spin 0.08s linear infinite");

    const rowDelays = [650, 1050, 1500];

    for (let row = 0; row < 3; row++) {
        await new Promise(r => setTimeout(r, rowDelays[row]));
        const start = row * 4;
        for (let i = 0; i < 4; i++) {
            allImgs[start + i].style.animation = "none";
            allImgs[start + i].src = getRandomSymbol();
        }
    }

    // Check wins
    const wins = checkAllPaylines();

    if (wins.length > 0) {
        // Sorteer van laagste naar hoogste winst
        wins.sort((a, b) => a.amount - b.amount);

        let totalWin = 0;

        for (const win of wins) {
            highlightPayline(win.line);
            messageEl.innerHTML = `🎉 Payline ${win.lineIndex + 1} → <strong>${win.amount}</strong>`;
            totalWin += win.amount;
            await new Promise(r => setTimeout(r, 800)); // pauze tussen wins
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
    const currentSymbols = imgs.map(img => img.src);
    const wins = [];

    paylines.forEach((line, index) => {
        const lineSymbols = line.map(pos => currentSymbols[pos]);
        const first = lineSymbols[0];
        
        let count = 1;
        for (let i = 1; i < lineSymbols.length; i++) {
            if (lineSymbols[i] === first) count++;
            else break;
        }

        if (count >= 3) {
            const winAmount = payouts[first] ? payouts[first][count] || 0 : 0;
            if (winAmount > 0) {
                wins.push({
                    lineIndex: index,
                    line: line,
                    symbol: first,
                    count: count,
                    amount: winAmount
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
