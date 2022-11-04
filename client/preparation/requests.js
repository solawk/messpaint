let activeRequest = false;

async function createRoomRequest(count, length, amount, t2d, t2v)
{
    if (activeRequest) return;
    activeRequest = true;

    const apiURL = "/api/createRoom?c=" + count + "&l=" + length + "&a=" + amount + "&d=" + t2d + "&v=" + t2v;

    const response = await fetch(apiURL,
        {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

    if (response.ok)
    {
        const roomCode = await response.json();
        window.location.href = "room?code=" + roomCode.code + "&name=" + playerName;
        activeRequest = false;
        return true;
    }
    else
    {
        console.log("Failed to create the room!");
        activeRequest = false;
        return false;
    }
}

async function joinRoomRequest(code)
{
    if (activeRequest) return;
    activeRequest = true;

    const apiURL = "/api/joinRoom?code=" + code;

    const response = await fetch(apiURL,
        {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

    if (response.ok)
    {
        const roomExists = await response.json();
        if (roomExists.exists) window.location.href = "room?code=" + code + "&name=" + playerName;
        activeRequest = false;
        return roomExists.exists;
    }
    else
    {
        console.log("Failed to try to join the room!");
        activeRequest = false;
        return null;
    }
}

async function demoSessionExistsRequest(id)
{
    if (activeRequest) return;
    activeRequest = true;

    const apiURL = "/api/getSessionData?id=" + id;

    const response = await fetch(apiURL,
        {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

    if (response.ok)
    {
        const sessionData = await response.json();
        activeRequest = false;
        return sessionData.error == null;
    }
    else
    {
        console.log("Failed to try to request session data!");
        activeRequest = false;
        return null;
    }
}