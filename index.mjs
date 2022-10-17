import express from "express";
import path from 'path';
import fs from "fs";
import { fileURLToPath } from 'url';
import https from "https";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import { names } from './names.js';

const PORT = 8080;

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const options = {
    key: fs.readFileSync('ssl/privkey.pem'),
    cert: fs.readFileSync('ssl/fullchain.pem'),
}

const app = express();
const server = https.createServer(options, app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.static(path.join(dirname, 'build')));
app.get('/', (req, res) => {
    res.sendFile(path.join(dirname, 'build', 'index.html'));
})

let games = {};

// for displaying "Round Two", etc
const numMap = {
    1: 'One',
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    8: 'Eight',
    9: 'Nine',
    10: 'Ten'
}

const STATUS = {
    THINK: 'THINK',
    RETURN: 'RETURN',
    CONTINUE: 'CONTINUE',
    RETURNED: 'RETURNED',
}

const shuffle = (array) => {
    return array.sort(() => Math.random() - 0.5);
}

const makeDeck = (usedArtifacts) => {
    let i;
    let deck = [];
    let traps = [
        "snake", "rocks", "fire", "flood", "spiders"
    ];
    let artifacts = [
        "square_5",
        "star_5",
        "frog_7",
        // "hand_7",
        // "head_11",
        "crown_11",
    ];

    // add TWO of each trap
    for (i = 0; i < 2; i++) {
        traps.forEach(t => deck.push({ value: t, type: "trap" }));
    }

    // add the artifacts
    artifacts
        .filter(x => !usedArtifacts.includes(x))
        .forEach((a) => {
            deck.push({ value: a, type: "artifact" });
        });

    // coin distribution from the actual game
    [1, 2, 3, 4, 5, 5, 7, 7, 9, 11, 11, 13, 14, 15, 17].forEach(val => {
        deck.push({ value: val, type: "coins" });
    })

    // shuffle until the first card isn't a trap
    // this is guaranteed to run at least once
    // cause we added the traps to the list first
    while (deck[0].type != 'coins') {
        deck = shuffle(deck);
    }

    return deck;
}

const getGameId = (io, socket) => {
    return Array.from(io.of("/").adapter.sids.get(socket.id))[1];
}

const startRound = (gameId) => {
    games[gameId].round += 1;
    games[gameId].roundStr = numMap[games[gameId].round];
    games[gameId].message = `Starting Round ${games[gameId].roundStr}`
    games[gameId].deck = makeDeck(games[gameId].artifacts);
    games[gameId].drawn = [];
    games[gameId].leftovers = 0;
    io.to(gameId).emit("gameUpdate", games[gameId]);

    // reset the players so they 
    // are able to click the buttons
    Object.values(games[gameId].players)
        .forEach(p => {
            p.status = STATUS.THINK;
            p.tmp = 0;
        });

    // draw the first card
    setTimeout(() => {
        // handle cases where all users disconnect
        // at the end of a round
        if (!games[gameId]) return;

        let card = games[gameId].deck.shift();
        let n = Object.keys(games[gameId].players).length;

        games[gameId].drawn.push(card);
        games[gameId].message = "";

        let split = Math.floor(card.value / n);
        games[gameId].leftovers += card.value % n;

        Object.values(games[gameId].players)
            .forEach(p => {
                p.tmp += split;
                p.coinSort = (p.tot * 200) + p.tmp;
            });

        io.to(gameId).emit("gameUpdate", games[gameId]);
    }, 2000);
}

const endRound = (gameId, message) => {
    games[gameId].message = message;
    io.to(gameId).emit("gameUpdate", games[gameId]);
 
    if (games[gameId].round === games[gameId].nrounds) {
        games[gameId].gameOver = true;
        // find winners?
        io.to(gameId).emit("gameUpdate", games[gameId]);
    } else {
        setTimeout(() => {
            startRound(gameId);
        }, 2000);
    }
}

const handleDecision = (choice, socket) => {
    let gameId = getGameId(io, socket);

    // how many people in dungeon? needed below for 
    // bots calculating the expected value of stay/go
    let inDungeon = Object.values(games[gameId].players)
        .filter(p => p.status !== STATUS.RETURNED)
        .length;

    Object.values(games[gameId].players)
        .filter(p => p.bot)
        .filter(p => p.status === STATUS.THINK)
        .forEach(p => {
            let expCont = p.tmp;
            let expRet = p.tmp + (games[gameId].leftovers / inDungeon);
            let cardChance = 1 / games[gameId].deck.length;
            games[gameId].deck.forEach(card => {
                if (card.type === "trap") {
                    let trapCount = games[gameId].drawn
                        .filter(c => c.value === card.value)
                        .length;
                    if (trapCount > 0) {
                        expCont += (-p.tmp * cardChance);
                    }
                } else if (card.type === "coins") {
                    expCont += (Math.floor(card.value / inDungeon) * cardChance);
                } else if (card.type === "artifact") {
                    let val = card.value.split('_')[1]
                    expCont += ((val / inDungeon) * cardChance);
                }
            })

            if (expRet >= expCont && Math.random() < p.caution) {
                p.status = STATUS.RETURN
            } else {
                p.status = STATUS.CONTINUE
            }
        })

    // update the players status
    if (choice === "return") {
        games[gameId].players[socket.id].status = STATUS.RETURN;
    } else if (choice === "continue") {
        games[gameId].players[socket.id].status = STATUS.CONTINUE;
    }

    // find the number of players still making their decision (thinkers)
    let thinkers = Object.values(games[gameId].players)
        .filter(p => p.status === STATUS.THINK);

    // if everyone has made their decision we can draw a new card and process the results
    if (thinkers.length === 0) {

        // handle players who chose to RETURN (cowards)
        //   1. split the leftovers
        //   2. check if any artifacts were taken
        //   3. update their status to RETURNED
        //   4. move the `tmp` score to the `tot` score
        let cowards = Object.values(games[gameId].players)
            .filter(p => p.status === STATUS.RETURN);

        if (cowards.length > 0) {
            if (cowards.length === 1) {
                let artifacts = games[gameId].drawn
                    .filter(c => c.type === 'artifact');
                artifacts.forEach(a => {
                    cowards[0].tmp += Number(a.value.split('_')[1]);
                    a.type = 'artifact_taken';
                    games[gameId].artifacts.push(a.value);
                });

                games[gameId].message = `${cowards[0].name} returned!`;
            } else if (cowards.length > 1) {
                // TODO format this like `Bob, Joe, and Jim...` ? with some max limit?
                games[gameId].message = `${cowards.length} ppl returned!`;
            }
            let split = Math.floor(games[gameId].leftovers / cowards.length);
            games[gameId].leftovers -= split * cowards.length;
            cowards.forEach(p => {
                p.status = STATUS.RETURNED;
                p.tot += (p.tmp + split);
                p.tmp = 0;
                p.coinSort = p.tot * 200;
            })
        }

        // check if everyone has left
        let n_brave_ones = Object.values(games[gameId].players)
            .filter(p => p.status === STATUS.CONTINUE)
            .length;

        let humans_left = Object.values(games[gameId].players)
            .filter(p => !p.bot)
            .filter(p => p.status === STATUS.CONTINUE)
            .length;

        // when everyone has left...
        if (n_brave_ones === 0) {
            endRound(gameId, "Everyone returned!");
            return;
        }

        // draw the next card
        let card = games[gameId].deck.shift();
        games[gameId].drawn.push(card);

        if (card.type === "coins") {
            let split = Math.floor(card.value / n_brave_ones);
            games[gameId].leftovers += card.value % n_brave_ones;

            Object.values(games[gameId].players)
                .filter(p => p.status === STATUS.CONTINUE)
                .forEach(p => {
                    p.tmp += split;
                    p.coinSort = (p.tot * 200) + p.tmp;
                });
        }
        else if (card.type === "trap") {
            let trapCount = games[gameId]
                .drawn
                .filter(c => c.value === card.value)
                .length;
            if (trapCount > 1) {
                Object.values(games[gameId].players)
                    .forEach(p => {
                        p.status = STATUS.RETURNED;
                    });
                io.to(gameId).emit("gameUpdate", games[gameId]);
                endRound(gameId, "Two traps!");
                return;
            }
        }

        // reset status for the "Brave Ones"
        Object.values(games[gameId].players)
            .filter(p => p.status === STATUS.CONTINUE)
            .forEach(p => {
                p.status = STATUS.THINK;
            });

        io.to(gameId).emit("gameUpdate", games[gameId]);

        // when all the humans have left but there
        // are still bots in the dungeon, let the bots
        // make their decisions until the round ends
        if (n_brave_ones > 0 && humans_left === 0) {
            setTimeout(() => {
                handleDecision(null, socket)
            }, 1000)
        }
    }
}

io.on("connection", (socket) => {
    console.log("user connected!", socket.id);

    socket.on("createGame", (data) => {
        let { gameId, name, nrounds, nbots, showScores } = data;

        // check if the game already exists
        if (games[gameId]) {
            socket.emit("gameUnavailable");
            return;
        }

        socket.join(gameId);
        games[gameId] = {
            gameId: gameId,
            playing: false,
            gameOver: false,
            nrounds: Number(nrounds),
            showScores: showScores,
            round: 0,
            leftovers: 0,
            roundStr: 'Zero',
            message: '',
            artifacts: [],
            host: socket.id,
            msgs: [],
            players: {
                [socket.id]: {
                    pid: socket.id,
                    name: name,
                    tmp: 0,
                    tot: 0,
                    status: STATUS.THINK,
                    coinSort: 0,
                    bot: false,
                },
            },
        }

        // add bots
        for (let i = 0; i < nbots; i++) {
            let id = uuidv4();
            games[gameId].players[id] = {
                pid: id,
                name: names[Math.floor(Math.random() * names.length)],
                tmp: 0,
                tot: 0,
                status: STATUS.THINK,
                coinSort: 0,
                bot: true,
                caution: Math.random() * (0.7 - 1) + 0.7
            }
        }

        io.to(gameId).emit("gameUpdate", games[gameId]);
    });

    socket.on("joinGame", (data) => {
        let { gameId, name } = data;

        if (!games[gameId]) {
            socket.emit("gameUnavailable");
            return;
        } else if (games[gameId].playing) {
            socket.emit("gameAlreadyStarted");
            return;
        } else if (
            Object
                .values(games[gameId].players)
                .map(p => p.name).includes(name)
        ) {
            socket.emit("nameUnavailable");
            return;
        }

        socket.join(gameId);
        games[gameId].players[socket.id] = {
            pid: socket.id,
            name: name,
            tmp: 0,
            tot: 0,
            status: STATUS.THINK,
            coinSort: 0,
            bot: false,
        };

        io.to(gameId).emit("gameUpdate", games[gameId]);
    });

    socket.on("startGame", () => {
        let gameId = getGameId(io, socket);

        games[gameId] = {
            deck: makeDeck(games[gameId].artifacts),
            drawn: [],
            ...games[gameId]
        }

        games[gameId].playing = true;
        io.to(gameId).emit("gameUpdate", games[gameId]);
        startRound(gameId);
    });

    socket.on("nameUpdate", name => {
        let gameId = getGameId(io, socket);
        games[gameId].players[socket.id].name = name;
        io.to(gameId).emit("gameUpdate", games[gameId]);
    });

    socket.on("playerDecision", choice => {
        handleDecision(choice, socket)
    });

    socket.on("leaveGame", () => {
        let gameId = getGameId(io, socket);
        socket.leave(gameId);

        // if everyone left the room, it is autoremoved.
        // if that's the case, delete that game
        if (!io.of('/').adapter.rooms.get(gameId)) {
            delete games[gameId];
        }
    });

    socket.on("chatMessage", msg => {
        let gameId = getGameId(io, socket);
        games[gameId].msgs.push([socket.id, msg]);
        io.to(gameId).emit("gameUpdate", games[gameId]);
    });

    socket.on("disconnecting", () => {
        let gameId = getGameId(io, socket);
        if (gameId) {
            delete games[gameId].players[socket.id];
            io.to(gameId).emit("gameUpdate", games[gameId]);
            if (Object.keys(games[gameId].players).length === 0) {
                delete games[gameId];
            }
        }
    });
});

console.log(`Server running @ http://localhost:${PORT}`);
server.listen(PORT);
