// ===============================
// NUMBER RUSH - MAIN GAME SCRIPT
// ===============================


// ===============================
// ELEMENTS
// ===============================

const gameBoard = document.getElementById("gameBoard");

const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const nextNumberDisplay = document.getElementById("nextNumber");

const streakDisplay = document.getElementById("streak");
const mistakesDisplay = document.getElementById("mistakes");

const timerProgress = document.getElementById("timerProgress");

const penaltyMessage =
    document.getElementById("penaltyMessage");

const message = document.getElementById("message");

const startBtn = document.getElementById("startBtn");

const soundBtn = document.getElementById("soundBtn");

const levelButtons =
    document.querySelectorAll(".level-btn");

const bestScoreDisplay =
    document.getElementById("bestScore");

const bestTimeDisplay =
    document.getElementById("bestTime");


// ===============================
// RESULT MODAL
// ===============================

const resultModal =
    document.getElementById("resultModal");

const resultIcon =
    document.getElementById("resultIcon");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const finalScore =
    document.getElementById("finalScore");

const accuracyDisplay =
    document.getElementById("accuracy");

const playerName =
    document.getElementById("playerName");

const saveScoreBtn =
    document.getElementById("saveScoreBtn");

const playAgainBtn =
    document.getElementById("playAgainBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");


// ===============================
// LEADERBOARD
// ===============================

const leaderboard =
    document.getElementById("leaderboard");

const refreshLeaderboard =
    document.getElementById("refreshLeaderboard");

const filterButtons =
    document.querySelectorAll(".filter-btn");

let leaderboardData = [];

let currentLeaderboardFilter = "all";


// ===============================
// GAME VARIABLES
// ===============================

let currentLevel = "easy";

let totalTime = 35;

let timeLeft = 35;

let currentNumber = 1;

let score = 0;

let streak = 0;

let mistakes = 0;

let correctClicks = 0;

let wrongClicks = 0;

let totalClicks = 0;

let gameStarted = false;

let countdownActive = false;

let timerInterval = null;

let countdownInterval = null;

let startTimestamp = null;

let penaltyTime = 0;

let soundEnabled = true;


// ===============================
// LEVEL CONFIGURATION
// ===============================

const levels = {

    easy: {
        time: 35,
        label: "Easy"
    },

    hard: {
        time: 25,
        label: "Hard"
    },

    extreme: {
        time: 15,
        label: "Extreme"
    }

};


// ===============================
// SETTINGS
// ===============================

const WRONG_CLICK_PENALTY = 0.5;


// ===============================
// INITIAL SETUP
// ===============================

createBoard();

lockBoard();

loadPersonalBest();

loadLeaderboard();


// ===============================
// CREATE RANDOM BOARD
// ===============================

function createBoard() {

    gameBoard.innerHTML = "";

    const numbers = [];

    for (let i = 1; i <= 25; i++) {

        numbers.push(i);

    }

    shuffleArray(numbers);


    numbers.forEach(number => {

        const button =
            document.createElement("button");

        button.classList.add(
            "number-cell"
        );

        button.textContent =
            number;

        button.dataset.number =
            number;


        button.addEventListener(
            "click",
            () => {

                handleNumberClick(
                    button,
                    number
                );

            }
        );


        gameBoard.appendChild(
            button
        );

    });

}


// ===============================
// SHUFFLE ARRAY
// ===============================

function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }

    return array;

}


// ===============================
// LOCK BOARD
// ===============================

function lockBoard() {

    const cells =
        document.querySelectorAll(
            ".number-cell"
        );

    cells.forEach(cell => {

        cell.disabled = true;

    });

}


// ===============================
// UNLOCK BOARD
// ===============================

function unlockBoard() {

    const cells =
        document.querySelectorAll(
            ".number-cell"
        );

    cells.forEach(cell => {

        if (
            !cell.classList.contains(
                "correct"
            )
        ) {

            cell.disabled = false;

        }

    });

}


// ===============================
// DIFFICULTY SELECTION
// ===============================

levelButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            if (
                gameStarted ||
                countdownActive
            ) {

                return;

            }


            levelButtons.forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            currentLevel =
                button.dataset.level;


            totalTime =
                levels[currentLevel].time;


            timeLeft =
                totalTime;


            timerDisplay.textContent =
                totalTime.toFixed(1);


            timerProgress.style.width =
                "100%";


            message.textContent =
                `${levels[currentLevel].label} mode selected.`;


            loadPersonalBest();

        }
    );

});


// ===============================
// START BUTTON
// ===============================

startBtn.addEventListener(
    "click",
    prepareGame
);


// ===============================
// PREPARE GAME
// ===============================

function prepareGame() {

    if (countdownActive) {

        return;

    }


    clearInterval(
        timerInterval
    );

    clearInterval(
        countdownInterval
    );


    gameStarted = false;

    countdownActive = true;


    resultModal.classList.add(
        "hidden"
    );


    createBoard();

    lockBoard();


    currentNumber = 1;

    score = 0;

    streak = 0;

    mistakes = 0;

    correctClicks = 0;

    wrongClicks = 0;

    totalClicks = 0;

    penaltyTime = 0;


    totalTime =
        levels[currentLevel].time;


    timeLeft =
        totalTime;


    startTimestamp =
        null;


    // RESET SAVE BUTTON

    saveScoreBtn.disabled =
        false;

    saveScoreBtn.textContent =
        "Save Score";


    // RESET UI

    scoreDisplay.textContent =
        "0";


    nextNumberDisplay.textContent =
        "1";


    streakDisplay.textContent =
        "x0";


    mistakesDisplay.textContent =
        "0";


    streakDisplay.classList.remove(
        "hot-streak",
        "streak-pop"
    );


    timerDisplay.textContent =
        totalTime.toFixed(1);


    timerDisplay.classList.remove(
        "timer-danger",
        "timer-warning",
        "timer-penalty"
    );


    scoreDisplay.classList.remove(
        "score-success"
    );


    penaltyMessage.textContent =
        "";


    penaltyMessage.classList.remove(
        "penalty-show"
    );


    timerProgress.style.width =
        "100%";


    message.textContent =
        "Get ready...";


    startBtn.textContent =
        "Get Ready...";


    startBtn.disabled =
        true;


    startCountdown();

}


// ===============================
// COUNTDOWN
// ===============================

function startCountdown() {

    let countdownValue = 3;


    message.textContent =
        countdownValue;


    playCountdownSound();


    countdownInterval =
        setInterval(
            () => {

                countdownValue--;


                if (
                    countdownValue > 0
                ) {

                    message.textContent =
                        countdownValue;


                    playCountdownSound();

                }

                else {

                    clearInterval(
                        countdownInterval
                    );


                    message.textContent =
                        "GO! Find number 1.";


                    playGoSound();


                    startBtn.disabled =
                        false;


                    startBtn.textContent =
                        "Restart Game";


                    countdownActive =
                        false;


                    startActualGame();

                }

            },
            1000
        );

}


// ===============================
// START ACTUAL GAME
// ===============================

function startActualGame() {

    gameStarted = true;


    unlockBoard();


    startTimestamp =
        Date.now();


    timerInterval =
        setInterval(
            () => {

                const elapsed =
                    (
                        Date.now() -
                        startTimestamp
                    ) / 1000;


                timeLeft =
                    Math.max(
                        0,
                        totalTime -
                        elapsed -
                        penaltyTime
                    );


                updateTimerUI();


                if (
                    timeLeft <= 0
                ) {

                    timeLeft = 0;

                    updateTimerUI();

                    endGame(false);

                }

            },
            50
        );

}


// ===============================
// UPDATE TIMER
// ===============================

function updateTimerUI() {

    timerDisplay.textContent =
        timeLeft.toFixed(1);


    const percentage =
        Math.max(
            0,
            (
                timeLeft /
                totalTime
            ) * 100
        );


    timerProgress.style.width =
        `${percentage}%`;


    timerDisplay.classList.remove(
        "timer-warning",
        "timer-danger"
    );


    if (
        timeLeft <= 3
    ) {

        timerDisplay.classList.add(
            "timer-danger"
        );

    }

    else if (
        timeLeft <= 7
    ) {

        timerDisplay.classList.add(
            "timer-warning"
        );

    }

}


// ===============================
// NUMBER CLICK
// ===============================

function handleNumberClick(
    button,
    number
) {

    if (!gameStarted) {

        return;

    }


    totalClicks++;


    // ===============================
    // CORRECT CLICK
    // ===============================

    if (
        number === currentNumber
    ) {

        correctClicks++;

        score++;

        streak++;


        button.classList.add(
            "correct"
        );


        button.disabled =
            true;


        scoreDisplay.textContent =
            score;


        streakDisplay.textContent =
            `x${streak}`;


        animateStreak();


        playCorrectSound();


        if (
            streak >= 5
        ) {

            streakDisplay.classList.add(
                "hot-streak"
            );

        }

        else {

            streakDisplay.classList.remove(
                "hot-streak"
            );

        }


        if (
            score >= 20
        ) {

            scoreDisplay.classList.add(
                "score-success"
            );

        }


        // COMPLETED ALL 25

        if (
            currentNumber === 25
        ) {

            nextNumberDisplay.textContent =
                "✓";


            message.textContent =
                `Amazing! ${streak} correct clicks in a row.`;


            endGame(true);

            return;

        }


        currentNumber++;


        nextNumberDisplay.textContent =
            currentNumber;


        if (
            streak >= 10
        ) {

            message.textContent =
                `🔥 x${streak} streak! Find ${currentNumber}.`;

        }

        else if (
            streak >= 5
        ) {

            message.textContent =
                `Nice streak! x${streak} — find ${currentNumber}.`;

        }

        else {

            message.textContent =
                `Good! Now find ${currentNumber}.`;

        }

    }


    // ===============================
    // WRONG CLICK
    // ===============================

    else {

        wrongClicks++;

        mistakes++;


        // RESET STREAK

        streak = 0;


        streakDisplay.textContent =
            "x0";


        streakDisplay.classList.remove(
            "hot-streak"
        );


        mistakesDisplay.textContent =
            mistakes;


        // APPLY TIME PENALTY

        penaltyTime +=
            WRONG_CLICK_PENALTY;


        timeLeft =
            Math.max(
                0,
                timeLeft -
                WRONG_CLICK_PENALTY
            );


        updateTimerUI();


        showPenalty();


        button.classList.add(
            "wrong"
        );


        playWrongSound();


        message.textContent =
            `Wrong! Find ${currentNumber}.`;


        setTimeout(
            () => {

                button.classList.remove(
                    "wrong"
                );

            },
            300
        );


        // PENALTY MAY END GAME

        if (
            timeLeft <= 0
        ) {

            timeLeft = 0;

            updateTimerUI();

            endGame(false);

        }

    }

}


// ===============================
// STREAK ANIMATION
// ===============================

function animateStreak() {

    streakDisplay.classList.remove(
        "streak-pop"
    );


    void streakDisplay.offsetWidth;


    streakDisplay.classList.add(
        "streak-pop"
    );

}


// ===============================
// SHOW PENALTY
// ===============================

function showPenalty() {

    penaltyMessage.textContent =
        `-${WRONG_CLICK_PENALTY.toFixed(1)}s`;


    penaltyMessage.classList.remove(
        "penalty-show"
    );


    timerDisplay.classList.remove(
        "timer-penalty"
    );


    void penaltyMessage.offsetWidth;


    penaltyMessage.classList.add(
        "penalty-show"
    );


    timerDisplay.classList.add(
        "timer-penalty"
    );


    setTimeout(
        () => {

            timerDisplay.classList.remove(
                "timer-penalty"
            );

        },
        350
    );

}


// ===============================
// END GAME
// ===============================

function endGame(completed) {

    if (!gameStarted) {

        return;

    }


    gameStarted = false;


    clearInterval(
        timerInterval
    );


    lockBoard();


    // ACCURACY

    let accuracy = 100;


    if (
        totalClicks > 0
    ) {

        accuracy =
            Math.round(
                (
                    correctClicks /
                    totalClicks
                ) * 100
            );

    }

    recordGameHistory(
    completed,
    accuracy
);
    if (completed) {

        resultIcon.textContent =
            "🏆";


        resultTitle.textContent =
            "Challenge Completed!";


        resultMessage.textContent =
            `You completed ${levels[currentLevel].label} mode with ${timeLeft.toFixed(1)}s left and ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`;


        message.textContent =
            "Challenge completed!";

    }

    else {

        resultIcon.textContent =
            "⏱️";


        resultTitle.textContent =
            "Time's Up!";


        resultMessage.textContent =
            `You reached ${score}/25 with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`;


        message.textContent =
            `Time over! Score: ${score}/25`;

    }


    finalScore.textContent =
        `${score} / 25`;


    accuracyDisplay.textContent =
        `${accuracy}%`;


    updatePersonalBest(
        score,
        completed
            ? timeLeft
            : null
    );


    setTimeout(
        () => {

            resultModal.classList.remove(
                "hidden"
            );

        },
        300
    );

}


// ===============================
// PERSONAL BEST
// ===============================

function updatePersonalBest(
    newScore,
    remainingTime
) {

    const key =
        `numberRushBest_${currentLevel}`;


    const stored =
        JSON.parse(
            localStorage.getItem(
                key
            )
        ) || {

            score: 0,

            remainingTime: null

        };


    let shouldUpdate =
        false;


    if (
        newScore >
        stored.score
    ) {

        shouldUpdate =
            true;

    }

    else if (
        newScore === 25 &&
        stored.score === 25 &&
        remainingTime !== null &&
        (
            stored.remainingTime === null ||
            remainingTime >
            stored.remainingTime
        )
    ) {

        shouldUpdate =
            true;

    }


    if (shouldUpdate) {

        const data = {

            score:
                newScore,

            remainingTime:
                remainingTime !== null
                    ? Number(
                        remainingTime.toFixed(
                            2
                        )
                    )
                    : stored.remainingTime

        };


        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

    }


    loadPersonalBest();

}


// ===============================
// LOAD PERSONAL BEST
// ===============================

function loadPersonalBest() {

    const key =
        `numberRushBest_${currentLevel}`;


    const stored =
        JSON.parse(
            localStorage.getItem(
                key
            )
        );


    if (!stored) {

        bestScoreDisplay.textContent =
            "0 / 25";


        bestTimeDisplay.textContent =
            "--";


        return;

    }


    bestScoreDisplay.textContent =
        `${stored.score} / 25`;


    if (
        stored.score === 25 &&
        stored.remainingTime !== null
    ) {

        bestTimeDisplay.textContent =
            `${stored.remainingTime}s left`;

    }

    else {

        bestTimeDisplay.textContent =
            "--";

    }

}


// ===============================
// PLAY AGAIN
// ===============================

playAgainBtn.addEventListener(
    "click",
    () => {

        resultModal.classList.add(
            "hidden"
        );


        prepareGame();

    }
);


// ===============================
// CLOSE RESULT MODAL
// ===============================

closeModalBtn.addEventListener(
    "click",
    () => {

        resultModal.classList.add(
            "hidden"
        );

    }
);


// ===============================
// SOUND BUTTON
// ===============================

soundBtn.addEventListener(
    "click",
    () => {

        soundEnabled =
            !soundEnabled;


        soundBtn.textContent =
            soundEnabled
                ? "🔊"
                : "🔇";

    }
);


// ===============================
// SOUND EFFECTS
// ===============================

function playCorrectSound() {

    if (!soundEnabled) {

        return;

    }


    createBeep(
        520,
        0.05,
        0.04
    );

}


function playWrongSound() {

    if (!soundEnabled) {

        return;

    }


    createBeep(
        180,
        0.08,
        0.05
    );

}


function playCountdownSound() {

    if (!soundEnabled) {

        return;

    }


    createBeep(
        350,
        0.08,
        0.05
    );

}


function playGoSound() {

    if (!soundEnabled) {

        return;

    }


    createBeep(
        700,
        0.12,
        0.06
    );

}


function createBeep(
    frequency,
    duration,
    volume
) {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        const audioContext =
            new AudioContext();


        const oscillator =
            audioContext.createOscillator();


        const gainNode =
            audioContext.createGain();


        oscillator.type =
            "sine";


        oscillator.frequency.value =
            frequency;


        gainNode.gain.value =
            volume;


        oscillator.connect(
            gainNode
        );


        gainNode.connect(
            audioContext.destination
        );


        oscillator.start();


        oscillator.stop(
            audioContext.currentTime +
            duration
        );

    }

    catch (error) {

        console.log(
            "Audio unavailable."
        );

    }

}


// ===============================
// SAVE SCORE
// ===============================

saveScoreBtn.addEventListener(
    "click",
    saveScore
);


async function saveScore() {

    const name =
        playerName.value.trim();


    if (!name) {

        playerName.focus();


        playerName.placeholder =
            "Please enter your name";


        return;

    }


    saveScoreBtn.disabled =
        true;


    saveScoreBtn.textContent =
        "Saving...";


    const accuracy =
        totalClicks === 0
            ? 100
            : Math.round(
                (
                    correctClicks /
                    totalClicks
                ) * 100
            );


    const scoreData = {

        name:
            name,

        score:
            score,

        level:
            currentLevel,

        accuracy:
            accuracy,

        timeRemaining:
            Number(
                timeLeft.toFixed(
                    2
                )
            )

    };


    try {

        const response =
            await fetch(
                "/api/scores",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            scoreData
                        )

                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to save score."
            );

        }


        saveScoreBtn.textContent =
            "✓ Score Saved";


        saveScoreBtn.disabled =
            true;


        await loadLeaderboard();

    }

    catch (error) {

        console.error(
            error
        );


        saveScoreBtn.textContent =
            "Could not save";


        setTimeout(
            () => {

                saveScoreBtn.textContent =
                    "Save Score";


                saveScoreBtn.disabled =
                    false;

            },
            1500
        );

    }

}


// ===============================
// LOAD LEADERBOARD
// ===============================

async function loadLeaderboard() {

    leaderboard.innerHTML = `
        <p class="empty-leaderboard">
            Loading leaderboard...
        </p>
    `;


    try {

        const response =
            await fetch(
                "/api/scores"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load leaderboard."
            );

        }


        leaderboardData =
            await response.json();


        displayLeaderboard(
            leaderboardData
        );

    }

    catch (error) {

        console.error(
            error
        );


        leaderboard.innerHTML = `
            <p class="empty-leaderboard">
                Leaderboard could not be loaded.
            </p>
        `;

    }

}


// ===============================
// DISPLAY LEADERBOARD
// ===============================

function displayLeaderboard(
    scores
) {

    let filteredScores =
        scores;


    if (
        currentLeaderboardFilter !==
        "all"
    ) {

        filteredScores =
            scores.filter(
                item =>
                    item.level ===
                    currentLeaderboardFilter
            );

    }


    if (
        !Array.isArray(
            filteredScores
        ) ||
        filteredScores.length === 0
    ) {

        leaderboard.innerHTML = `
            <p class="empty-leaderboard">
                No scores found for this level.
            </p>
        `;


        return;

    }


    leaderboard.innerHTML =
        "";


    filteredScores
        .forEach(
            (item, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.classList.add(
                    "leaderboard-row"
                );


                let medal =
                    `#${index + 1}`;


                if (
                    index === 0
                ) {

                    medal =
                        "🥇";

                }

                else if (
                    index === 1
                ) {

                    medal =
                        "🥈";

                }

                else if (
                    index === 2
                ) {

                    medal =
                        "🥉";

                }


                let timeText =
                    "--";


                if (
                    typeof item.timeRemaining ===
                    "number"
                ) {

                    timeText =
                        `${item.timeRemaining.toFixed(1)}s`;

                }


                row.innerHTML = `

                    <span class="rank">
                        ${medal}
                    </span>

                    <span class="player">
                        ${escapeHTML(
                            item.name
                        )}
                    </span>

                    <span class="leaderboard-score">
                        ${item.score}/25
                    </span>

                    <span class="leaderboard-level">
                        ${escapeHTML(
                            item.level
                        )}
                    </span>

                    <span class="leaderboard-accuracy">
                        ${item.accuracy}%
                    </span>

                    <span class="leaderboard-time">
                        ${timeText}
                    </span>

                `;


                leaderboard.appendChild(
                    row
                );

            }
        );

}


// ===============================
// LEADERBOARD FILTERS
// ===============================

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentLeaderboardFilter =
                    button.dataset.filter;


                displayLeaderboard(
                    leaderboardData
                );

            }
        );

    }
);


// ===============================
// REFRESH LEADERBOARD
// ===============================

refreshLeaderboard.addEventListener(
    "click",
    loadLeaderboard
);


// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ===============================
// KEYBOARD SUPPORT
// ===============================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space" &&
            !gameStarted &&
            !countdownActive &&
            resultModal.classList.contains(
                "hidden"
            )
        ) {

            event.preventDefault();

            prepareGame();

        }


        if (
            event.code === "Escape" &&
            !resultModal.classList.contains(
                "hidden"
            )
        ) {

            resultModal.classList.add(
                "hidden"
            );

        }

    }
);

async function recordGameHistory(completed, accuracy) {

    const gameData = {
        level: currentLevel,
        score: score,
        accuracy: accuracy,
        mistakes: mistakes,
        completed: completed,
        timeRemaining: Number(timeLeft.toFixed(2))
    };

    try {

        await fetch("/api/game-history", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(gameData)
        });

    }

    catch (error) {

        console.error(
            "Game history could not be saved:",
            error
        );

    }

}