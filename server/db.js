module.exports = {
    save: saveSession,
    load: loadSession,
    connect: dbConnect
};

// Connecting Mongoose
const mongoose = require("mongoose");

const cache = [];

// Connecting to DB
const playerDataSchema = new mongoose.Schema
({
    name: String,
    prompt: [ String ],
    drawingPrompts: [ String ],
    drawings: [ String ]
});

const sessionSchema = new mongoose.Schema
({
    playerData: [ playerDataSchema ]
});

let sessionModel = null;

async function dbConnect()
{
    try
    {
        const mongoConnection = await mongoose.connect("mongodb+srv://messPaintAdmin:messPaintPassword041122@messpaint.loqumtp.mongodb.net/?retryWrites=true&w=majority",
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

        console.log("Mongo connection success");

        sessionModel = mongoConnection.model("sessions", sessionSchema);
    }
    catch (e)
    {
        console.log("Error when connecting to Mongo: " + e);
    }
}

async function saveSession(playerDataArray)
{
    const session = { playerData: [] };

    for (let playerData of playerDataArray)
    {
        session.playerData.push({
            name: playerData.name,
            prompt: playerData.prompt,
            drawingPrompts: playerData.drawingPrompts,
            drawings: playerData.drawings
        });
    }

    let id = 1;
    let createdSession;

    // Saving to Mongo
    try
    {
        createdSession = await sessionModel.create(session);
        id = createdSession._id.toString();
    }
    catch (e)
    {
        console.log("Error adding a session: " + e);
    }

    saveToCache({ ...session, _id: id });

    return id;
}

function saveToCache(session)
{
    cache.unshift(session);

    if (cache.length > 10)
    {
        cache.pop();
    }
}

async function loadSession(id)
{
    for (let session of cache)
    {
        if (session._id === id) return session;
    }

    //console.log("id: " + id);
    try
    {
        const session = await sessionModel.findById(id);

        saveToCache(session);
        return session;
    }
    catch (e)
    {
        console.log("load error: " + e);
    }

    return null;
}