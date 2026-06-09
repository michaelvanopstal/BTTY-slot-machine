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
let jackpot = 500;

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const linesEl = document.getElementById("lines");
const winEl = document.getElementById("win");
const jackpotEl = document.getElementById("jackpot");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const linesBtn = document.getElementById("linesBtn");
const reelsContainer = document.getElementById("reels");

// ==================== PAYLINES ====================
const paylines5 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3]];

const paylines13 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3],[0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7]];

const paylines21 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3],[0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7],[0,5,3,7],[4,1,6,3],[4,9,6,11],[8,5,10,7],[0,1,6,7],[4,5,2,3],[4,5,10,11],[8,9,6,7]];

let currentPaylines = paylines5;

// ==================== HELPER FUNCTIONS ====================
function createReels() {
    reelsContainer.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const div = document.createElement("div");
        div.classList.add("symbol");
        const img = document.createElement("img");
        img.src = Math.random() < 0.08 ? "golden.png" : symbolNames[Math.floor(Math.random() * 4)];
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
        if (reelsContainer.children[pos]) {
            reelsContainer.children[pos].classList.add("winning");
        }
    });
    await new Promise(r => setTimeout(r, 1200));
}

// ==================== KOP OF MUNT GAMBLE ====================
async function gambleWin(winAmount) {
    if (winAmount <= 0) return winAmount;

    return new Promise(resolve => {
        messageEl.innerHTML = `
            <div class="gamble-container">
                <div class="gamble-title">💰 Wil je je winst van <strong>${winAmount}</strong> verdubbelen?</div>
                <div class="coin-buttons">
                    <div class="coin-btn" id="kopBtn">KOP<br><span style="font-size:18px">🔴</span></div>
                    <div class="coin-btn" id="muntBtn">MUNT<br><span style="font-size:18px">🪙</span></div>
                </div>
                <div class="gamble-actions">
                    <button id="noGambleBtn">Nee, neem winst veilig</button>
                </div>
            </div>
        `;

        const kopBtn = document.getElementById("kopBtn");
        const muntBtn = document.getElementById("muntBtn");
        const noBtn = document.getElementById("noGambleBtn");

        const finish = (won) => {
            kopBtn.style.pointerEvents = "none";
            muntBtn.style.pointerEvents = "none";
            noBtn.style.pointerEvents = "none";
            setTimeout(() => resolve(won ? winAmount * 2 : 0), 2200);
        };

        kopBtn.onclick = () => {
            const won = Math.random() < 0.5;
            messageEl.innerHTML += won ? 
                `<br><br><strong style="color:lime">✅ KOP! Je hebt verdubbeld!</strong>` : 
                `<br><br><strong style="color:red">❌ Helaas... Je verliest alles.</strong>`;
            finish(won);
        };

        muntBtn.onclick = () => {
            const won = Math.random() < 0.5;
            messageEl.innerHTML += won ? 
                `<br><br><strong style="color:lime">✅ MUNT! Je hebt verdubbeld!</strong>` : 
                `<br><br><strong style="color:red">❌ Helaas... Je verliest alles.</strong>`;
            finish(won);
        };

        noBtn.onclick = () => {
            messageEl.innerHTML += `<br><br><strong style="color:#ffd700">✅ Winst veilig opgenomen.</strong>`;
            finish(true);
        };
    });
}

// ==================== CHECK FUNCTIONS ====================
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
        if (count === 4 && first !== "golden.png") {
            const amount = payouts[first]?.[4];
            if (amount) wins.push({lineIndex: index, line, count:4, amount});
        }
    });
    return wins;
}

function checkJackpot() {
    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    const current = imgs.map(img => getFileName(img.src));
    const horizontal = [[0,1,2,3],[4,5,6,7],[8,9,10,11]];

    for (let line of horizontal) {
        if (line.every(pos => current[pos] === "golden.png")) {
            line.forEach(pos => reelsContainer.children[pos]?.classList.add("winning"));
            return jackpot;
        }
    }
    return 0;
}

// ==================== UI ====================
function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
    if (jackpotEl) jackpotEl.textContent = jackpot;
}

function updateLinesButton() {
    linesBtn.innerHTML = `LINES: <strong>${numLines}</strong>`;
}

function toggleLines() {
    if (numLines === 5) { numLines = 13; bet = 300; currentPaylines = paylines13; }
    else if (numLines === 13) { numLines = 21; bet = 500; currentPaylines = paylines21; }
    else { numLines = 5; bet = 100; currentPaylines = paylines5; }
    updateUI();
    updateLinesButton();
}

// ==================== SPIN ====================
async function spin() {
    if (credits < bet) { alert("Niet genoeg credits!"); return; }

    spinBtn.disabled = linesBtn.disabled = true;
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
            allImgs[start + i].src = Math.random() < 0.08 ? "golden.png" : symbolNames[Math.floor(Math.random() * 4)];
        }
    }

    const wins = checkAllPaylines();
    let totalWin = 0;

    if (wins.length > 0) {
        wins.sort((a, b) => b.amount - a.amount);
        let messages = [];

        for (const win of wins) {
            await highlightPayline(win.line.slice(0, win.count));
            messages.push(`Lijn ${win.lineIndex + 1} (${win.count}x) = ${win.amount}`);
            totalWin += win.amount;
            jackpot += 5;
        }

        messageEl.innerHTML = messages.join("<br>") + `<br><strong>🎉 WIN ${totalWin}!</strong>`;
        await new Promise(r => setTimeout(r, 1500));
        clearHighlights();

        const finalWin = await gambleWin(totalWin);
        totalWin = finalWin;
    } else {
        messageEl.textContent = "Geen winst...";
    }

    const jackpotWin = checkJackpot();
    if (jackpotWin > 0) {
        credits += jackpotWin;
        messageEl.innerHTML += `<br><strong>🔥 BTTY JACKPOT HIT! +${jackpotWin} 🔥</strong>`;
        jackpot = 500;
    }

    credits += totalWin;
    lastWin = totalWin;
    updateUI();
    spinBtn.disabled = linesBtn.disabled = false;
}

// ==================== START ====================
createReels();
updateUI();
updateLinesButton();

spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);
