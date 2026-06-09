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

// ==================== PAYLINES (zelfde als vorige) ====================
const paylines5 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3]];

const paylines13 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3],[0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7]];

const paylines21 = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[0,1,6,11],[8,9,6,3],[0,1,2,7],[4,5,6,3],[4,5,6,11],[8,9,10,7],[0,5,6,7],[4,1,2,3],[4,9,10,11],[9,5,6,7],[0,5,3,7],[4,1,6,3],[4,9,6,11],[8,5,10,7],[0,1,6,7],[4,5,2,3],[4,5,10,11],[8,9,6,7]];

let currentPaylines = paylines5;

// ==================== CREATE REELS & HELPERS (zelfde) ====================
function createReels() { /* ... hetzelfde als vorige versie ... */ }
function getFileName(src) { return src.split("/").pop().split("?")[0]; }
function clearHighlights() { document.querySelectorAll(".symbol").forEach(s => s.classList.remove("winning")); }
async function highlightPayline(positions) { /* ... hetzelfde ... */ }

// ==================== KOP OF MUNT GAMBLE ====================
async function gambleWin(winAmount) {
    if (winAmount <= 0) return winAmount;

    return new Promise(resolve => {
        messageEl.innerHTML = `
            <strong>🎰 Wil je je winst van <span style="color:gold">${winAmount}</span> verdubbelen?</strong><br><br>
            <button id="kopBtn" style="padding:12px 30px; font-size:18px; margin:5px;">KOP</button>
            <button id="muntBtn" style="padding:12px 30px; font-size:18px; margin:5px;">MUNT</button>
            <button id="noGambleBtn" style="padding:12px 20px; font-size:16px; margin:5px;">Nee, neem winst</button>
        `;

        const kopBtn = document.getElementById("kopBtn");
        const muntBtn = document.getElementById("muntBtn");
        const noBtn = document.getElementById("noGambleBtn");

        const finishGamble = (result) => {
            kopBtn.disabled = muntBtn.disabled = noBtn.disabled = true;
            setTimeout(() => resolve(result), 1800);
        };

        kopBtn.onclick = () => {
            const isHeads = Math.random() < 0.5;
            const resultText = isHeads ? "✅ KOP! Je wint dubbel!" : "❌ MUNT... Je verliest alles.";
            messageEl.innerHTML += `<br><br><strong>${resultText}</strong>`;
            finishGamble(isHeads ? winAmount * 2 : 0);
        };

        muntBtn.onclick = () => {
            const isTails = Math.random() < 0.5;
            const resultText = isTails ? "✅ MUNT! Je wint dubbel!" : "❌ KOP... Je verliest alles.";
            messageEl.innerHTML += `<br><br><strong>${resultText}</strong>`;
            finishGamble(isTails ? winAmount * 2 : 0);
        };

        noBtn.onclick = () => {
            messageEl.innerHTML += `<br><br><strong>✅ Winst veilig opgenomen.</strong>`;
            finishGamble(winAmount);
        };
    });
}

// ==================== SPIN ====================
async function spin() {
    if (credits < bet) { alert("Niet genoeg credits!"); return; }

    spinBtn.disabled = linesBtn.disabled = true;
    credits -= bet;
    updateUI();

    messageEl.textContent = "SPINNING...";
    clearHighlights();

    // Spin animatie...
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

        // === NIEUWE GAMBLE FEATURE ===
        const finalWin = await gambleWin(totalWin);
        totalWin = finalWin;
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst...";
    }

    // Jackpot check
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

// ==================== OVERIGE FUNCTIES (checkAllPaylines, checkJackpot, updateUI, etc.) ====================
// ... (deze zijn hetzelfde als de vorige versie die ik je gaf)

function checkAllPaylines() { /* vorige versie */ }
function checkJackpot() { /* vorige versie */ }
function updateUI() { /* vorige versie met jackpotEl */ }
function updateLinesButton() { /* vorige */ }
function toggleLines() { /* vorige */ }

// ==================== START ====================
createReels();
updateUI();
updateLinesButton();

spinBtn.addEventListener("click", spin);
linesBtn.addEventListener("click", toggleLines);
