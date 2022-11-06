const isDev = window.location.href.includes("localhost");
let ws = new WebSocket(isDev ? "ws://localhost:4000" : "wss://messpaint.herokuapp.com");
ws.onopen = () =>
{
    hide(el("websocketWaitingForConnection"));
    show(el("roomConnecting"));

    const params = new URLSearchParams(window.location.search);

    const roomCode = params.get("code");
    const playerName = params.get("name");
    el("roomCode").innerHTML = roomCode;

    ws.send("CONNECTTOROOM|" + roomCode + "|" + playerName);
};
ws.onerror = (e) =>
{
    console.log(e);
}

ws.onmessage = (event) =>
{
    const msg = event.data;

    const params = msg.split("|");
    const signature = params[0];
    //console.log(msg);
    switch (signature)
    {
        case "ROOMCONNECTIONFAIL":
            hide(el("roomConnecting"));
            const reason = parseInt(params[1]);
            switch (reason)
            {
                case 0:
                    show(el("roomFailNotFound"));
                    break;

                case 1:
                    show(el("roomFailFull"));
                    break;

                case 2:
                    show(el("roomFailHasStarted"));
                    break;
            }
            break;

        case "ROOMCONNECTIONSUCCESS":
            hide(el("roomConnecting"));
            show(el("roomPlayers"));
            show(el("roomWaitingForPlayers"));
            break;

        case "ROOMPLAYERSUPDATE":
            let playerNames = "<br>Игроки:<br>";
            for (let i = 1; i < params.length; i++)
                playerNames += params[i] + "<br>";
            el("roomPlayers").innerHTML = playerNames;
            el("promptReady").innerHTML = "Готовы " + promptReadyPlayers + "/" + (params.length - 1) + " игроков";
            break;

        case "ROOMSTARTING":
            hide(el("roomDiv"));

            // Adding sentence inputs
            for (let i = 2; i < params.length; i++)
            {
                const td = document.createElement("td");
                el("promptRow").appendChild(td);

                switch (params[i])
                {
                    case "S":
                        td.innerHTML += "Существительное";
                        break;

                    case "G":
                        td.innerHTML += "Глагол";
                        break;

                    case "SV":
                        td.innerHTML += "Существительное в винительном падеже (кого? что?)";
                        break;

                    case "N":
                        td.innerHTML += "Наречие";
                        break;

                    case "P":
                        td.innerHTML += "Прилагательное";
                        break;

                    case "PV":
                        td.innerHTML += "Прилагательное в винительном падеже (кого? что?)";
                        break;
                }

                td.innerHTML += ":<br>";
                const input = document.createElement("input");
                input.id = "sentencePart" + (i-2).toString();
                input.className = "marginInputText";

                // DEV
                //const paramsurl = new URLSearchParams(window.location.search);
                //const playerName = paramsurl.get("name");
                //input.value = playerName + "--" + (i - 1).toString();
                // DEV END

                input.type = "text";
                input.onchange = () => { input.style.backgroundColor = "" };

                td.appendChild(input);
            }

            show(el("promptDiv"));
            el("promptReady").innerHTML = "Готовы " + promptReadyPlayers + "/" + parseInt(params[1]) + " игроков";
            break;

        case "PROMPTCOUNTINC":
            promptReadyPlayers++;
            el("promptReady").innerHTML = "Готовы " + promptReadyPlayers + "/" + parseInt(params[1]) + " игроков";
            break;

        case "PAINTSTARTFAIL":
            show(el("promptStartFailNotEnoughCombinations"));
            break;

        case "PAINTSTART":
            hide(el("promptDiv"));
            hide(el("abovePaintDiv"));
            show(el("paintDiv"));
            el("paintPrompt").innerHTML = "Нарисуйте: " + params[1];
            setupTimer(params[2]);
            launchTimer();
            break;

        case "DEMONSTRATION":
            window.location.href = "demonstration?id=" + params[1] + "&db=0&t=" + params[2];
            break;

        case "FORCESENDPAINTING":
            sendPainting();
            el("paintPrompt").innerHTML = "Нарисуйте: " + params[1];
            el("paintReadyCheckbox").checked = false;
            launchTimer();
            break;
    }
};

function wsSend(signature, msg)
{
    ws.send(signature + "|" + msg);
}