module.exports = {
    createRoom: createRoom,
    deleteRoom: deleteRoom,
    findRoom: findRoom,
    findRoomOfPlayer: findRoomOfPlayer,
    findIndexOfPlayer: findIndexOfPlayer,
    connectToRoom: connectToRoom,
    disconnect: disconnect,
    getRooms: () => { return rooms; },

    addPrompt: addPrompt,
    addPainting: addPainting,
    setReadyStatus: setReadyStatus,
    getAllReady: getAllReady
};

// Getting a unique connection code
function getConnectionCode()
{
    let code = 1;

    for (let room of rooms)
    {
        if (room.code === code) code++;
        else break;
    }

    return code;
}

const rooms = [];

function createRoom(settings)
{
    const room = {
        code: getConnectionCode(),
        playerCount: settings.playerCount,
        promptLength: settings.promptLength,
        drawingsCount: settings.drawingsCount,
        drawingsFinished: 0,
        drawingTimer: settings.drawingTimer,
        hasStarted: false,
        drawingTimeout: null,
        endingTimeout: null,
        demonstrationTimer: settings.demonstrationTimer,

        playerData: []
    };

    rooms.push(room);
    return room;
}

function deleteRoom(room)
{
    rooms.splice(rooms.indexOf(room), 1);
}

function findRoom(code)
{
    for (let room of rooms)
    {
        if (room.code === code) return room;
    }

    return null;
}

function findRoomOfPlayer(playerws)
{
    for (let room of rooms)
    {
        for (let playerData of room.playerData)
        {
            if (playerData.ws === playerws)
            {
                return room;
            }
        }
    }

    return null;
}

function findIndexOfPlayer(playerws, room)
{
    for (let i = 0; i < room.playerData.length; i++)
    {
        if (room.playerData[i].ws === playerws) return i;
    }

    return null;
}

function connectToRoom(player, room)
{
    if (room.playerCount === room.playerData.length) return -1;
    if (room.hasStarted) return -2;

    const newPlayerData = {
        ws: player.ws,
        name: player.name,
        prompt: [],
        ready: false,
        drawingPrompts: [],
        drawings: []
    };

    room.playerData.push(newPlayerData);

    if (room.playerData.length === room.playerCount)
    {
        console.log("START THE ROOM");
        return 1;
    }

    return 0;
}

function disconnect(player)
{
    for (let room of rooms)
    {
        for (let playerData of room.playerData)
        {
            if (playerData.ws === player.ws)
            {
                room.playerData.splice(room.playerData.indexOf(playerData), 1);
                if (room.playerData.length === 0)
                {
                    deleteRoom(room);
                }
            }
        }
    }
}

// Gameplay

function addPrompt(room, playerIndex, params)
{
    // params[0] is signature

    params.splice(0, 1);
    room.playerData[playerIndex].prompt = params;

    // Checking if all prompts are entered
    for (let playerData of room.playerData)
    {
        if (playerData.prompt.length === 0)
        {
            return 0;
        }
    }

    return 1;
}

function addPainting(room, playerIndex, painting)
{
    room.playerData[playerIndex].drawings.push(painting);

    //console.log(Buffer.byteLength(painting, "utf-8"));
}

function setReadyStatus(room, playerIndex, status)
{
    room.playerData[playerIndex].ready = status;
}

function getAllReady(room)
{
    for (let playerData of room.playerData)
    {
        if (playerData.ready === false) return false;
    }

    return true;
}