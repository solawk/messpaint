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

    // Saving to Mongo
    await sessionModel.create(session, (err, createdSession) =>
    {
        if (err)
        {
            console.log("Error adding a session: " + err);
        }

        id = createdSession._id.toString();
    });

    cache.push({ ...session, _id: id });

    return id;
}

async function loadSession(id)
{
    for (let session of cache)
    {
        if (session._id === id) return session;
    }

    console.log("id: " + id);
    try
    {
        const session = await sessionModel.findById(id);

        cache.push(session);
        return session;
    }
    catch (e)
    {
        console.log("load error: " + e);
    }

    return null;
}