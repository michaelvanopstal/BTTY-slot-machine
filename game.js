const symbols = ["🟠", "🍒", "BAR", "BRC20", "⭐", "🔥"]; // later jouw afbeeldingen

let credits = 5000;
let bet = 100;
let lastWin = 0;

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const reelsContainer = document.getElementById("reels");

function createReels() {
    reelsContainer.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const div = document.createElement("div");
        div.classList.add("symbol");
        div.textContent = symbols[Math.floor(Math.random()*symbols.length)];
        reelsContainer.appendChild(div);
    }
}

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// Hoofdfunctie met echte spin
async function spin() {
    if (credits < bet) {
        alert("Niet genoeg credits!");
        return;
    }

    credits -= bet;
    updateUI();
    messageEl.textContent = "SPINNING...";
    spinBtn.disabled = true;

    const allSymbols = document.querySelectorAll(".symbol");

    // Start spinning animatie
    allSymbols.forEach(s => s.classList.add("spinning"));

    // Verschillende stop tijden per rij voor realistisch effect
    const rowDelays = [800, 1100, 1500]; // rij 1, 2 en 3

    for (let row = 0; row < 3; row++) {
        await new Promise(resolve => setTimeout(resolve, rowDelays[row]));

        // Stop deze rij
        const start = row * 4;
        for (let i = 0; i < 4; i++) {
            const index = start + i;
            allSymbols[index].classList.remove("spinning");
            allSymbols[index].textContent = getRandomSymbol();
        }
    }

    // Win check
    const winAmount = calculateWin();

    if (winAmount > 0) {
        credits += winAmount;
        lastWin = winAmount;
        messageEl.innerHTML = `🎉 <strong>BIG WIN ${winAmount}!</strong>`;
    } else {
        lastWin = 0;
        messageEl.textContent = "Geen winst... volgende keer beter!";
    }

    updateUI();
    spinBtn.disabled = false;
}

function calculateWin() {
    const allSymbols = Array.from(document.querySelectorAll(".symbol")).map(s => s.textContent);
    let total = 0;

    for (let row = 0; row < 3; row++) {
        const rowSymbols = allSymbols.slice(row*4, row*4 + 4);
        const counts = {};
        rowSymbols.forEach(s => counts[s] = (counts[s] || 0) + 1);

        const highest = Math.max(...Object.values(counts));
        if (highest >= 3) {
            total += highest * 150; // simpele payout
        }
    }
    return total;
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
