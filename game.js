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
let isGambleActive = false;
let currentGambleWin = 0;
let gambleInterval = null;
let gambleSide = null; // wat speler kiest
let gambleResultSide = null; // echte uitkomst

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

// ==================== PAYLINES & HELPERS (verkort) ====================
const paylines5 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3]];
const paylines13 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3],[0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7]];
const paylines21 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3],[0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7],[0,5,3,7],[4,1,6,3],[4,9,6,11],[8,5,10,7],[0,1,6,7],[4,5,2,3],[4,5,10,11],[8,9,6,7]];

let currentPaylines = paylines5;

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

function getFileName(src) { return src.split("/").pop().split("?")[0]; }
function clearHighlights() { document.querySelectorAll(".symbol").forEach(s => s.classList.remove("winning")); }
async function highlightPayline(positions) {
    positions.forEach(pos => reelsContainer.children[pos]?.classList.add("winning"));
    await new Promise(r => setTimeout(r, 1200));
}

// ==================== GAMBLE ====================
function startGamble(winAmount) {

    clearInterval(gambleInterval);

    currentGambleWin = winAmount;
    isGambleActive = true;

    kopGambleBtn.disabled = false;
    muntGambleBtn.disabled = false;

    messageEl.innerHTML =
        `💰 Winst: <strong>${currentGambleWin}</strong><br>
        Kies KOP of MUNT of druk SPIN om te cashen`;

    let flip = true;

    gambleInterval = setInterval(() => {
        flip = !flip;

        kopGambleBtn.classList.toggle("active", flip);
        muntGambleBtn.classList.toggle("active", !flip);

    }, 150);
}

// ==================== SPIN ====================
async function spin() {

    // ==========================
    // CASH OUT VAN GAMBLE
    // ==========================
    if (isGambleActive) {

        const cashoutAmount = currentGambleWin;

        resetGamble();

        credits += cashoutAmount;
        lastWin = cashoutAmount;

        messageEl.innerHTML =
            `💰 Geclaimed: ${cashoutAmount}`;

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

    const allImgs =
        document.querySelectorAll(".symbol img");

    allImgs.forEach(img => {
        img.style.animation =
            "spin 0.08s linear infinite";
    });

    const delays = [600, 1000, 1450];

    for (let r = 0; r < 3; r++) {

        await new Promise(res =>
            setTimeout(res, delays[r])
        );

        const start = r * 4;

        for (let i = 0; i < 4; i++) {

            allImgs[start + i].style.animation =
                "none";

            allImgs[start + i].src =
                Math.random() < 0.08
                    ? "golden.png"
                    : symbolNames[
                        Math.floor(Math.random() * 4)
                    ];
        }
    }

    const wins = checkAllPaylines();

    let totalWin = 0;

    if (wins.length > 0) {

        wins.sort((a, b) => b.amount - a.amount);

        let messages = [];

        for (const win of wins) {

            await highlightPayline(
                win.line.slice(0, win.count)
            );

            messages.push(
                `Lijn ${win.lineIndex + 1} (${win.count}x) = ${win.amount}`
            );

            totalWin += win.amount;

            jackpot += 5;
        }

        messageEl.innerHTML =
            messages.join("<br>") +
            `<br><strong>🎉 WIN ${totalWin}!</strong>`;

        await new Promise(r =>
            setTimeout(r, 1200)
        );

        clearHighlights();

        lastWin = totalWin;
        updateUI();

        // winst gaat naar gamble-pot
        currentGambleWin = totalWin;

        startGamble(totalWin);

    } else {

        lastWin = 0;

        messageEl.textContent =
            "Geen winst...";

        updateUI();
    }

    // ==========================
    // JACKPOT
    // ==========================
    const jackpotWin = checkJackpot();

    if (jackpotWin > 0) {

        credits += jackpotWin;

        messageEl.innerHTML +=
            `<br><strong>🔥 JACKPOT! +${jackpotWin}</strong>`;

        jackpot = 500;

        updateUI();
    }

    spinBtn.disabled = false;
    linesBtn.disabled = false;
}

// ==================== OVERIGE FUNCTIES ====================
function checkAllPaylines() { /* je huidige code */ 
    const imgs = Array.from(document.querySelectorAll(".symbol img"));
    const current = imgs.map(img => getFileName(img.src));
    let wins = [];
    currentPaylines.forEach((line, index) => {
        const symbols = line.map(pos => current[pos]);
        const first = symbols[0];
        let count = 1;
        for (let i = 1; i < symbols.length; i++) if (symbols[i] === first) count++; else break;
        if (count === 4 && first !== "golden.png") {
            const amount = payouts[first]?.[4];
            if (amount) wins.push({lineIndex: index, line, count:4, amount});
        }
    });
    return wins;
}

function gambleChoice(choice) {
    if (!isGambleActive) return;

    // 🎲 echte uitkomst per klik
    gambleResultSide = Math.random() < 0.5 ? "kop" : "munt";

    if (choice === gambleResultSide) {

        currentGambleWin *= 2;
        lastWin = currentGambleWin;

        messageEl.innerHTML =
            `🎉 Goed! Nieuwe winst: <strong>${currentGambleWin}</strong><br>
            Nog een keer of SPIN om te cashen`;

        updateUI();

    } else {

        messageEl.innerHTML = "❌ Verloren!";

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
function checkJackpot() { /* je huidige code */ 
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

function updateUI() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    linesEl.textContent = numLines;
    winEl.textContent = lastWin;
    if (jackpotEl) jackpotEl.textContent = jackpot;
}

function updateLinesButton() {
    linesBtn.innerHTML = "";
}

function toggleLines() {
    if (numLines === 5) { numLines = 13; bet = 300; currentPaylines = paylines13; }
    else if (numLines === 13) { numLines = 21; bet = 500; currentPaylines = paylines21; }
    else { numLines = 5; bet = 100; currentPaylines = paylines5; }
    updateUI();
    updateLinesButton();
}

// ==================== START ====================
createReels();
updateUI();
updateLinesButton();

spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);

kopGambleBtn.addEventListener("click", () => {
    gambleChoice("kop");
});

muntGambleBtn.addEventListener("click", () => {
    gambleChoice("munt");
});
spinBtn.addEventListener("click", () => {
    spinBtn.style.transform = "scale(0.9)";

    setTimeout(() => {
        spinBtn.style.transform = "scale(1)";
    }, 120);
});

