// Connecting Express
const express = require("express");
const app = express();

// Connecting modules
const ROOMS = require("./server/rooms");
const DB = require("./server/db");
const PROMPTS = require("./server/prompts");

// Constants
const port = process.env.PORT || 4000;
const wsport = process.env.WSPORT || 5000;
const ws = require("ws");
//const expressWs = require("express-ws")(app);
const sendFileOptions = { root: "." };

// Adding directories for script routing
app.use("/js", express.static(__dirname + "/client"));

let wsserver;

// Launching
app.listen(port, () =>
{
    console.log("Server is up, port = " + port + "!");
    wsSetup();

    testStart();
    DB.connect();
});

// For testing
function testStart()
{
    //PROMPTS.generate(null);
    //ROOMS.createRoom({ playerCount: 5, drawingsCount: 3, drawingTimer: 10, demonstrationTimer: 5 });
}

// Routing

app.get("/game", (req, res) =>
{
    console.log("PREPARATION");

    res.sendFile("/client/preparation/index.html", sendFileOptions);
});

app.get("/room", (req, res) =>
{
    console.log("GAMEPLAY");

    const roomCode = req.query.code;
    const playerName = req.query.name;

    //console.log("code = " + roomCode);
    //console.log("name = " + playerName);

    if (!roomCode)
    {
        res.send("No room code!");
        return;
    }

    if (!playerName)
    {
        res.send("No player name!");
        return;
    }

    /*if (!ROOMS.findRoom(parseInt(roomCode)))
    {
        res.send("This room doesn't exist!");
        return;
    }*/

    res.sendFile("/client/gameplay/index.html", sendFileOptions);
});

app.get("/demonstration", (req, res) =>
{
    console.log("DEMONSTRATION");
    console.log("id = " + req.query.id);
    console.log("db = " + req.query.db);
    res.sendFile("/client/demonstration/index.html", sendFileOptions);
});

// API

app.get("/api/getSessionData", async (req, res) =>
{
    const sessionId = req.query.id;

    if (sessionId !== 0 && !sessionId)
    {
        res.send({ error: "noId" });
        return;
    }

    const session = await DB.load(sessionId);
    if (!session)
    {
        res.send({ error: "notFound" });
        return;
    }

    res.send({ error: null, data: session.playerData, timer: session.demonstrationTimer });
});

app.get("/api/createRoom", (req, res) =>
{
    const count = parseInt(req.query.c);
    const length = parseInt(req.query.l);
    const amount = parseInt(req.query.a);
    const t2d = parseInt(req.query.d);
    const t2v = parseInt(req.query.v);

    console.log("Creating room: count " + count + ", length " + length + ", amount " + amount + ", t2d " + t2d + ", t2v " + t2v);
    const room = ROOMS.createRoom({ playerCount: count, promptLength: length, drawingsCount: amount, drawingTimer: t2d, demonstrationTimer: t2v });

    res.send({ code: room.code });
});

app.get("/api/joinRoom", (req, res) => // Just checks the existence of a room with the code
{
    const code = parseInt(req.query.code);

    const room = ROOMS.findRoom(code);

    res.send({ exists: (room != null) });
});

// WebSockets

function wsSetup()
{
    wsserver = new ws.Server({ port: wsport, clientTracking: true, path: "/" });
    console.log("WSServer is up, port = " + wsport + "!");

    wsserver.on("connection", (wsuser) =>
    {
        wsuser.on("message", (data) => { wsHandling(wsuser, data.toString()); })

        wsuser.on("close", () =>
        {
            // Prepare to message everyone in the room to update their player lists
            const room = ROOMS.findRoomOfPlayer(wsuser);
            if (!room) return;

            // Remove the disconnected player from their room
            ROOMS.disconnect( { ws: wsuser } );

            wsRoomSend(room, "ROOMPLAYERSUPDATE", makeRoomPlayersData(room));
        });
    });
}

/*app.ws('/', (wsuser, req) =>
{
    wsuser.on("message", (data) => { wsHandling(wsuser, data.toString()); })

    wsuser.on("close", () =>
    {
        // Prepare to message everyone in the room to update their player lists
        const room = ROOMS.findRoomOfPlayer(wsuser);
        if (!room) return;

        // Remove the disconnected player from their room
        ROOMS.disconnect( { ws: wsuser } );

        wsRoomSend(room, "ROOMPLAYERSUPDATE", makeRoomPlayersData(room));
    });
});*/

function wsHandling(wsuser, msg)
{
    console.log(msg);

    const params = msg.split("|");
    const signature = params[0];

    let room = ROOMS.findRoomOfPlayer(wsuser);

    switch (signature)
    {
        case "CONNECTTOROOM": // Room connection
            const roomCode = parseInt(params[1]);
            room = ROOMS.findRoom(roomCode);
            if (!room) // Room not found
            {
                wsSend(wsuser, "ROOMCONNECTIONFAIL", "0");
                break;
            }
            const playerName = params[2];
            const connectionResult = ROOMS.connectToRoom({ ws: wsuser, name: playerName }, room);

            if (connectionResult === -1) // Room full
            {
                wsSend(wsuser, "ROOMCONNECTIONFAIL", "1");
                break;
            }

            if (connectionResult === -2) // Room has started
            {
                wsSend(wsuser, "ROOMCONNECTIONFAIL", "2");
                break;
            }

            wsSend(wsuser, "ROOMCONNECTIONSUCCESS", "");
            wsRoomSend(room, "ROOMPLAYERSUPDATE", makeRoomPlayersData(room));

            // If starting the room
            if (connectionResult === 1)
            {
                console.log("STARTING");
                room.hasStarted = true;

                const playerCount = room.playerCount;
                const sentenceStructure = PROMPTS.sentenceStructure(room.promptLength);

                wsRoomSend(room, "ROOMSTARTING", playerCount + "|" + sentenceStructure);
            }
            break;

        case "SENDPROMPT": // Receiving a prompt
            if (!room) // Room not found
            {
                console.log("CRITICAL: Prompt received, room of player not found")
                break;
            }

            const addingPromptResult = ROOMS.addPrompt(room, ROOMS.findIndexOfPlayer(wsuser, room), params);
            wsRoomSend(room, "PROMPTCOUNTINC", room.playerData.length);

            if (addingPromptResult === 1)
            {
                const generationSuccess = PROMPTS.generate(room);
                if (generationSuccess === -1) // Too few combinations
                {
                    wsRoomSend(room, "PAINTSTARTFAIL", "1");
                    endRoom(room, false);
                    break;
                }

                for (let player of room.playerData)
                {
                    wsSend(player.ws, "PAINTSTART", player.drawingPrompts[0] + "|" + room.drawingTimer);
                }

                startPainting(room);
            }

            break;

        case "READYSTATUS": // When someone ticks they're ready
            if (!room) // Room not found
            {
                console.log("CRITICAL: Ready status received, room of player not found")
                break;
            }

            console.log("Received ready status " + params[1]);
            ROOMS.setReadyStatus(room, ROOMS.findIndexOfPlayer(wsuser, room), params[1] === "1");
            const allPlayersAreReady = ROOMS.getAllReady(room);
            if (allPlayersAreReady)
            {
                forceSend(room);
                startPainting(room);
                console.log("All players are ready!");
            }

            break;

        case "SENDPAINTING": // Painting
            if (!room) // Room not found
            {
                console.log("CRITICAL: Painting received, room of player not found")
                break;
            }

            ROOMS.addPainting(room, ROOMS.findIndexOfPlayer(wsuser, room), params[1]);
            if (checkIfAllPaintingsHaveBeenReceived(room))
            {
                if (room.endingTimeout != null) clearTimeout(room.endingTimeout);
                endRoom(room, true);
            }

            break;
    }
}

function makeRoomPlayersData(room)
{
    let roomPlayersData = "";
    let first = true;
    for (let player of room.playerData)
    {
        if (first) first = false;
        else roomPlayersData += "|";

        roomPlayersData += player.name;
    }

    return roomPlayersData;
}

function startPainting(room)
{
    if (room.drawingTimeout != null)
    {
        clearTimeout(room.drawingTimeout);
        room.drawingTimeout = null;
    }

    if (room.drawingsCount === room.drawingsFinished)
    {
        room.endingTimeout = setTimeout(() =>
        {
            endRoom(room, true);
        }, 5 * 1000);
        return;
    }

    room.drawingTimeout = setTimeout(() =>
    {
        forceSend(room);
        startPainting(room);
    }, room.drawingTimer * 1000);
}

function forceSend(room)
{
    room.drawingsFinished++;

    for (let player of room.playerData)
    {
        const msg = room.drawingsFinished < room.drawingsCount ?
            player.drawingPrompts[room.drawingsFinished] : "";
        wsSend(player.ws, "FORCESENDPAINTING", msg);
        player.ready = false;
    }
}

function checkIfAllPaintingsHaveBeenReceived(room)
{
    for (let playerData of room.playerData)
    {
        if (playerData.drawings.length < room.drawingsCount) return false;
    }

    return true;
}

async function endRoom(room, sendDemo)
{
    const sessionId = await DB.save(room.playerData);
    if (sendDemo) wsRoomSend(room, "DEMONSTRATION", sessionId + "|" + room.demonstrationTimer);
    ROOMS.deleteRoom(room);
}

function wsRoomSend(room, signature, msg)
{
    for (let player of room.playerData)
    {
        wsSend(player.ws, signature, msg);
    }
}

function wsSend(wsuser, signature, msg)
{
    wsuser.send(signature + "|" + msg);
}