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
let lastWin = 0;

const reel1 = document.getElementById("reel1");
const reel2 = document.getElementById("reel2");
const reel3 = document.getElementById("reel3");
const reel4 = document.getElementById("reel4");

const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const messageEl = document.getElementById("message");

document
.getElementById("spinBtn")
.addEventListener("click", spin);

function randomSymbol(){

    return symbols[
        Math.floor(Math.random() * symbols.length)
    ];
}

function spin(){

    if(credits < bet){

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

    if(
        r1 === r2 &&
        r2 === r3 &&
        r3 === r4
    ){

        lastWin = 500;

        if(r1 === "BITTY"){
            lastWin = 5000;
        }

        credits += lastWin;

        messageEl.textContent =
        "🎉 JACKPOT! " + r1;

    }else{

        messageEl.textContent =
        "Try Again";
    }

    updateUI();
}

function updateUI(){

    creditsEl.textContent = credits;
    betEl.textContent = bet;
    winEl.textContent = lastWin;
}

updateUI();
