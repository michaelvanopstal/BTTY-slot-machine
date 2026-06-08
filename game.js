const symbols = [
    "BITTY",
    "CHERRY",
    "BAR",
    "BRC20",
    "WILD",
    "BONUS"
];

let credits = 5000;
let bet = 100;
let score = 0;
let lastWin = 0;

const reel1 = document.getElementById("reel1");
const reel2 = document.getElementById("reel2");
const reel3 = document.getElementById("reel3");
const reel4 = document.getElementById("reel4");

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const messageEl = document.getElementById("message");
const scoreEl = document.getElementById("score");

document
    .getElementById("spinBtn")
    .addEventListener("click", spin);

function randomSymbol() {
    return symbols[
        Math.floor(Math.random() * symbols.length)
    ];
}

function spin() {

    if (credits < bet) {

        alert("Not enough credits");
        return;
    }

    credits -= bet;

    const r1 = randomSymbol();
    const r2 = randomSymbol();
    const r3 = randomSymbol();
    const r4 = randomSymbol();

    reel1.textContent = r1;
    reel2.textContent = r2;
    reel3.textContent = r3;
    reel4.textContent = r4;

    lastWin = 0;

    const results = [r1, r2, r3, r4];

    const counts = {};

    results.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1;
    });

    let winningSymbol = null;
    let matchCount = 0;

    for (const symbol in counts) {

        if (counts[symbol] > matchCount) {

            matchCount = counts[symbol];
            winningSymbol = symbol;
        }
    }

    if (matchCount >= 2) {

        lastWin = calculateWin(
            winningSymbol,
            matchCount
        );

        credits += lastWin;
        score += lastWin;

        messageEl.textContent =
            `🎉 ${matchCount}x ${winningSymbol} = ${lastWin} points`;

    } else {

        messageEl.textContent =
            "No Win";
    }

    updateUI();
}

function calculateWin(symbol, count) {

    const payouts = {

        BITTY: {
            2: 100,
            3: 1000,
            4: 5000
        },

        BRC20: {
            2: 50,
            3: 500,
            4: 2500
        },

        BONUS: {
            2: 25,
            3: 300,
            4: 1500
        },

        WILD: {
            2: 20,
            3: 200,
            4: 1000
        },

        BAR: {
            2: 10,
            3: 100,
            4: 500
        },

        CHERRY: {
            2: 5,
            3: 50,
            4: 250
        }
    };

    return payouts[symbol]?.[count] || 0;
}

function updateUI() {

    creditsEl.textContent = credits;
    betEl.textContent = bet;
    winEl.textContent = lastWin;

    if (scoreEl) {
        scoreEl.textContent = score;
    }
}

updateUI();
