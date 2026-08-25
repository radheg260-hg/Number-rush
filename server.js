// ===============================
// NUMBER RUSH - SUPABASE BACKEND
// ===============================

require("dotenv").config();

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;


// ===============================
// SUPABASE SETUP
// ===============================

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY;


if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
) {

    console.error(
        "❌ Supabase environment variables are missing."
    );

    console.error(
        "Check SUPABASE_URL and SUPABASE_SECRET_KEY in your .env file."
    );

    process.exit(1);

}


const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );


// ===============================
// MIDDLEWARE
// ===============================

app.use(
    express.json({
        limit: "50kb"
    })
);


app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ===============================
// HELPERS
// ===============================

const allowedLevels = [
    "easy",
    "hard",
    "extreme"
];


function isValidNumber(value) {

    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );

}


function cleanPlayerName(name) {

    return String(name)
        .trim()
        .replace(/[<>]/g, "")
        .slice(0, 20);

}


// ===============================
// GET LEADERBOARD
// ===============================

app.get(
    "/api/scores",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("scores")
                    .select("*")
                    .order(
                        "score",
                        {
                            ascending: false
                        }
                    )
                    .order(
                        "accuracy",
                        {
                            ascending: false
                        }
                    )
                    .order(
                        "time_remaining",
                        {
                            ascending: false
                        }
                    )
                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                console.error(
                    "Leaderboard fetch error:",
                    error
                );

                return res
                    .status(500)
                    .json({
                        message:
                            "Could not load leaderboard."
                    });

            }


            const difficultyRank = {
                extreme: 3,
                hard: 2,
                easy: 1
            };


            const formatted =
                data
                    .map(item => ({
                        id:
                            item.id,

                        name:
                            item.name,

                        score:
                            item.score,

                        level:
                            item.level,

                        accuracy:
                            item.accuracy,

                        timeRemaining:
                            Number(
                                item.time_remaining || 0
                            ),

                        createdAt:
                            item.created_at
                    }))
                    .sort(
                        (a, b) => {

                            const levelDifference =
                                (
                                    difficultyRank[
                                        b.level
                                    ] || 0
                                ) -
                                (
                                    difficultyRank[
                                        a.level
                                    ] || 0
                                );


                            if (
                                levelDifference !== 0
                            ) {

                                return levelDifference;

                            }


                            if (
                                b.score !==
                                a.score
                            ) {

                                return (
                                    b.score -
                                    a.score
                                );

                            }


                            if (
                                b.accuracy !==
                                a.accuracy
                            ) {

                                return (
                                    b.accuracy -
                                    a.accuracy
                                );

                            }


                            return (
                                b.timeRemaining -
                                a.timeRemaining
                            );

                        }
                    );


            res.json(
                formatted
            );

        }

        catch (error) {

            console.error(
                "GET /api/scores error:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Internal server error."
                });

        }

    }
);


// ===============================
// SAVE / UPDATE BEST LEADERBOARD SCORE
// ===============================

app.post(
    "/api/scores",
    async (req, res) => {

        try {

            const {
                name,
                score,
                level,
                accuracy,
                timeRemaining
            } = req.body;


            // NAME VALIDATION

            if (
                typeof name !== "string" ||
                name.trim().length === 0
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Player name is required."
                    });

            }


            // SCORE VALIDATION

            if (
                !isValidNumber(score) ||
                score < 0 ||
                score > 25
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid score."
                    });

            }


            // LEVEL VALIDATION

            if (
                !allowedLevels.includes(level)
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid difficulty level."
                    });

            }


            // ACCURACY VALIDATION

            if (
                !isValidNumber(accuracy) ||
                accuracy < 0 ||
                accuracy > 100
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid accuracy."
                    });

            }


            const cleanName =
                cleanPlayerName(name);


            const safeScore =
                Math.round(score);


            const safeAccuracy =
                Math.round(accuracy);


            const safeTime =
                isValidNumber(timeRemaining)
                    ? Math.max(
                        0,
                        Number(
                            timeRemaining.toFixed(2)
                        )
                    )
                    : 0;


            // ===============================
            // FIND EXISTING PLAYER + LEVEL
            // ===============================

            const {
                data: existingScores,
                error: findError
            } =
                await supabase
                    .from("scores")
                    .select("*")
                    .eq(
                        "level",
                        level
                    )
                    .ilike(
                        "name",
                        cleanName
                    )
                    .limit(1);


            if (findError) {

                console.error(
                    "Existing score lookup error:",
                    findError
                );


                return res
                    .status(500)
                    .json({
                        message:
                            "Could not check existing score."
                    });

            }


            const existingScore =
                existingScores &&
                existingScores.length > 0
                    ? existingScores[0]
                    : null;


            // ===============================
            // NO EXISTING SCORE → INSERT
            // ===============================

            if (!existingScore) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("scores")
                        .insert({
                            name:
                                cleanName,

                            score:
                                safeScore,

                            level:
                                level,

                            accuracy:
                                safeAccuracy,

                            time_remaining:
                                safeTime
                        })
                        .select()
                        .single();


                if (error) {

                    console.error(
                        "Score insert error:",
                        error
                    );


                    return res
                        .status(500)
                        .json({
                            message:
                                "Could not save score."
                        });

                }


                return res
                    .status(201)
                    .json({

                        message:
                            "Score saved successfully.",

                        updated:
                            false,

                        improved:
                            true,

                        score: {

                            id:
                                data.id,

                            name:
                                data.name,

                            score:
                                data.score,

                            level:
                                data.level,

                            accuracy:
                                data.accuracy,

                            timeRemaining:
                                Number(
                                    data.time_remaining || 0
                                ),

                            createdAt:
                                data.created_at

                        }

                    });

            }


            // ===============================
            // CHECK IF NEW RESULT IS BETTER
            // ===============================

            const oldScore =
                Number(
                    existingScore.score || 0
                );


            const oldAccuracy =
                Number(
                    existingScore.accuracy || 0
                );


            const oldTime =
                Number(
                    existingScore.time_remaining || 0
                );


            let isBetter =
                false;


            if (
                safeScore >
                oldScore
            ) {

                isBetter =
                    true;

            }

            else if (
                safeScore === oldScore &&
                safeAccuracy >
                oldAccuracy
            ) {

                isBetter =
                    true;

            }

            else if (
                safeScore === oldScore &&
                safeAccuracy === oldAccuracy &&
                safeTime >
                oldTime
            ) {

                isBetter =
                    true;

            }


            // ===============================
            // WORSE / SAME RESULT
            // KEEP OLD BEST
            // ===============================

            if (!isBetter) {

                return res
                    .status(200)
                    .json({

                        message:
                            "Existing best score kept.",

                        updated:
                            false,

                        improved:
                            false,

                        score: {

                            id:
                                existingScore.id,

                            name:
                                existingScore.name,

                            score:
                                existingScore.score,

                            level:
                                existingScore.level,

                            accuracy:
                                existingScore.accuracy,

                            timeRemaining:
                                Number(
                                    existingScore.time_remaining || 0
                                ),

                            createdAt:
                                existingScore.created_at

                        }

                    });

            }


            // ===============================
            // BETTER RESULT → UPDATE
            // ===============================

            const {
                data: updatedScore,
                error: updateError
            } =
                await supabase
                    .from("scores")
                    .update({

                        name:
                            cleanName,

                        score:
                            safeScore,

                        accuracy:
                            safeAccuracy,

                        time_remaining:
                            safeTime,

                        created_at:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        existingScore.id
                    )
                    .select()
                    .single();


            if (updateError) {

                console.error(
                    "Score update error:",
                    updateError
                );


                return res
                    .status(500)
                    .json({
                        message:
                            "Could not update score."
                    });

            }


            return res
                .status(200)
                .json({

                    message:
                        "New personal best! Leaderboard updated.",

                    updated:
                        true,

                    improved:
                        true,

                    score: {

                        id:
                            updatedScore.id,

                        name:
                            updatedScore.name,

                        score:
                            updatedScore.score,

                        level:
                            updatedScore.level,

                        accuracy:
                            updatedScore.accuracy,

                        timeRemaining:
                            Number(
                                updatedScore.time_remaining || 0
                            ),

                        createdAt:
                            updatedScore.created_at

                    }

                });

        }

        catch (error) {

            console.error(
                "POST /api/scores error:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Internal server error."
                });

        }

    }
);

// ===============================
// SAVE GAME HISTORY
// ===============================

app.post(
    "/api/game-history",
    async (req, res) => {

        try {

            const {
                level,
                score,
                accuracy,
                mistakes,
                completed,
                timeRemaining
            } = req.body;


            // LEVEL

            if (
                !allowedLevels.includes(
                    level
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid difficulty level."
                    });

            }


            // SCORE

            if (
                !isValidNumber(
                    score
                ) ||
                score < 0 ||
                score > 25
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid score."
                    });

            }


            // ACCURACY

            if (
                !isValidNumber(
                    accuracy
                ) ||
                accuracy < 0 ||
                accuracy > 100
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid accuracy."
                    });

            }


            // MISTAKES

            if (
                !isValidNumber(
                    mistakes
                ) ||
                mistakes < 0
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid mistakes value."
                    });

            }


            // COMPLETED

            if (
                typeof completed !==
                "boolean"
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid completed value."
                    });

            }


            const safeTime =
                isValidNumber(
                    timeRemaining
                )
                    ? Math.max(
                        0,
                        Number(
                            timeRemaining
                                .toFixed(2)
                        )
                    )
                    : 0;


            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "game_history"
                    )
                    .insert({
                        level:
                            level,

                        score:
                            Math.round(
                                score
                            ),

                        accuracy:
                            Math.round(
                                accuracy
                            ),

                        mistakes:
                            Math.round(
                                mistakes
                            ),

                        completed:
                            completed,

                        time_remaining:
                            safeTime
                    })
                    .select()
                    .single();


            if (error) {

                console.error(
                    "Game history insert error:",
                    error
                );


                return res
                    .status(500)
                    .json({
                        message:
                            "Could not save game history."
                    });

            }


            res
                .status(201)
                .json({

                    message:
                        "Game recorded.",

                    game: {

                        id:
                            data.id,

                        level:
                            data.level,

                        score:
                            data.score,

                        accuracy:
                            data.accuracy,

                        mistakes:
                            data.mistakes,

                        completed:
                            data.completed,

                        timeRemaining:
                            Number(
                                data.time_remaining ||
                                0
                            ),

                        playedAt:
                            data.played_at

                    }

                });

        }

        catch (error) {

            console.error(
                "POST /api/game-history error:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Internal server error."
                });

        }

    }
);


// ===============================
// VIEW GAME HISTORY
// ===============================

app.get(
    "/api/game-history",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "game_history"
                    )
                    .select("*")
                    .order(
                        "played_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "Game history fetch error:",
                    error
                );


                return res
                    .status(500)
                    .json({
                        message:
                            "Could not load game history."
                    });

            }


            const formatted =
                data.map(
                    item => ({

                        id:
                            item.id,

                        level:
                            item.level,

                        score:
                            item.score,

                        accuracy:
                            item.accuracy,

                        mistakes:
                            item.mistakes,

                        completed:
                            item.completed,

                        timeRemaining:
                            Number(
                                item.time_remaining ||
                                0
                            ),

                        playedAt:
                            item.played_at

                    })
                );


            res.json(
                formatted
            );

        }

        catch (error) {

            console.error(
                "GET /api/game-history error:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Internal server error."
                });

        }

    }
);


// ===============================
// GAME STATS
// ===============================

app.get(
    "/api/stats",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "game_history"
                    )
                    .select(
                        "level, score, completed"
                    );


            if (error) {

                console.error(
                    "Stats fetch error:",
                    error
                );


                return res
                    .status(500)
                    .json({
                        message:
                            "Could not load stats."
                    });

            }


            if (
                !data ||
                data.length === 0
            ) {

                return res.json({

                    totalGames:
                        0,

                    completedGames:
                        0,

                    averageScore:
                        0,

                    highestScore:
                        0,

                    easyGames:
                        0,

                    hardGames:
                        0,

                    extremeGames:
                        0

                });

            }


            const totalGames =
                data.length;


            const completedGames =
                data.filter(
                    game =>
                        game.completed ===
                        true
                ).length;


            const totalScore =
                data.reduce(
                    (
                        sum,
                        game
                    ) =>
                        sum +
                        game.score,
                    0
                );


            const averageScore =
                Number(
                    (
                        totalScore /
                        totalGames
                    ).toFixed(1)
                );


            const highestScore =
                Math.max(
                    ...data.map(
                        game =>
                            game.score
                    )
                );


            const easyGames =
                data.filter(
                    game =>
                        game.level ===
                        "easy"
                ).length;


            const hardGames =
                data.filter(
                    game =>
                        game.level ===
                        "hard"
                ).length;


            const extremeGames =
                data.filter(
                    game =>
                        game.level ===
                        "extreme"
                ).length;


            res.json({

                totalGames,

                completedGames,

                averageScore,

                highestScore,

                easyGames,

                hardGames,

                extremeGames

            });

        }

        catch (error) {

            console.error(
                "GET /api/stats error:",
                error
            );


            res
                .status(500)
                .json({
                    message:
                        "Internal server error."
                });

        }

    }
);


// ===============================
// HEALTH CHECK
// ===============================

app.get(
    "/api/health",
    async (req, res) => {

        try {

            const {
                error
            } =
                await supabase
                    .from("scores")
                    .select(
                        "id",
                        {
                            head: true,
                            count: "exact"
                        }
                    );


            if (error) {

                return res
                    .status(500)
                    .json({

                        status:
                            "database-error",

                        game:
                            "Number Rush",

                        database:
                            "Supabase disconnected"

                    });

            }


            res.json({

                status:
                    "ok",

                game:
                    "Number Rush",

                database:
                    "Supabase connected",

                serverTime:
                    new Date()
                        .toISOString()

            });

        }

        catch (error) {

            res
                .status(500)
                .json({

                    status:
                        "error",

                    database:
                        "Supabase unavailable"

                });

        }

    }
);


// ===============================
// 404
// ===============================

app.use(
    (req, res) => {

        res
            .status(404)
            .json({

                message:
                    "Route not found."

            });

    }
);


// ===============================
// START SERVER
// ===============================

app.listen(
    PORT,
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "⚡ Number Rush server started!"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "🗄️ Database: Supabase"
        );

        console.log(
            "📊 Leaderboard: Supabase scores"
        );

        console.log(
            "🎮 Game history: Supabase game_history"
        );

        console.log(
            "===================================="
        );

    }
);