let db = 0;
let timer = 3;

async function getSessionData()
{
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("id");
    el("demoId").innerHTML = sessionId;

    db = parseInt(params.get("db"));
    timer = parseInt(params.get("t"));

    const apiURL = "/api/getSessionData?id=" + sessionId;

    const response = await fetch(apiURL,
        {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

    if (response.ok)
    {
        const json = await response.json();

        if (json.error === "noId")
        {
            console.log("No ID when fetching!");
            return null;
        }

        if (json.error === "notFound")
        {
            console.log("Session not found!");
            return null;
        }

        return json;
    }
    else
    {
        console.log("Failed to fetch the session data!");
        return null;
    }
}

const playerRows = [];
const paintingDivs = [];

let playerCount = 0;
let paintingsPerPlayer = 0;

async function demo()
{
    const sessionData = await getSessionData(); // Array of player data objects
    const sessionPlayerData = sessionData.data;

    playerCount = sessionPlayerData.length;

    for (let playerData of sessionPlayerData)
    {
        const playerRow = document.createElement("tr");
        playerRows.push(playerRow);
        el("playerTable").appendChild(playerRow);

        const prompt = playerData.prompt.join(" ");
        playerRow.innerHTML = playerData.name + ": " + prompt + "<br>";

        paintingsPerPlayer = playerData.drawings.length;

        for (let i = 0; i < playerData.drawings.length; i++)
        {
            const div = document.createElement("div");
            paintingDivs.push(div);
            playerRow.appendChild(div);

            div.innerHTML += playerData.drawingPrompts[i] + "<br>";

            const img = document.createElement("img");
            img.src = playerData.drawings[i];
            div.appendChild(img);
        }
    }

    if (db === 0) // If demonstrating right after the game
    {
        showNextPainting();
    }
}

demo();

let nextPaintingIndex = 0;

function showNextPainting()
{
    if (nextPaintingIndex === playerCount * paintingsPerPlayer)
    {
        // When the demonstration is over
        for (let playerRow of playerRows) show(playerRow); // Show all rows
        for (let paintingDiv of paintingDivs) show(paintingDiv); // Show all divs

        return;
    }

    if (nextPaintingIndex % paintingsPerPlayer === 0) // If it's the first painting of a player
    {
        for (let playerRow of playerRows) hide(playerRow); // Hide all rows
        show(playerRows[Math.floor(nextPaintingIndex / paintingsPerPlayer)]); // Show the current player's row
    }

    for (let paintingDiv of paintingDivs) hide(paintingDiv); // Hide all divs
    show(paintingDivs[nextPaintingIndex]); // Show the current painting

    nextPaintingIndex++;
    setTimeout(() => { showNextPainting(); }, timer * 1000);
}

el("demoBack").onclick = () =>
{
    window.location.href = "/";
}