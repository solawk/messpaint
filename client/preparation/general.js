let playerName = "Игрок";
el("nameEnterInput").value = playerName;

function setPlayerName()
{
    if (el("nameEnterInput").value.trim() === "")
    {
        el("nameEnterInput").style.backgroundColor = "red";
        return false;
    }

    playerName = el("nameEnterInput").value;
    return true;
}

el("createRoomButton").onclick = () =>
{
    if (!setPlayerName()) return;

    hide(el("cjaDiv"));
    show(el("createRoomDiv"));
}

el("createRoomBackButton").onclick = () =>
{
    show(el("cjaDiv"));
    hide(el("createRoomDiv"));
}

el("createRoomConfirmButton").onclick = async () =>
{
    const count = el("createCountInput").value;
    const length = el("createLengthInput").value;
    const amount = el("createAmountInput").value;
    const t2d = el("createT2DInput").value;
    const t2v = el("createT2VInput").value;

    hide(el("createRoomConfirmButton"));
    const success = await createRoomRequest(count, length, amount, t2d, t2v);
    if (!success) show(el("createRoomConfirmButton"));
}

el("joinRoomButton").onclick = () =>
{
    if (!setPlayerName()) return;

    hide(el("cjaDiv"));
    show(el("joinRoomDiv"));
}

el("joinRoomBackButton").onclick = () =>
{
    show(el("cjaDiv"));
    hide(el("joinRoomDiv"));
    hide(el("joinFailedSpan"));
}

el("joinRoomConfirmButton").onclick = async () =>
{
    const code = parseInt(el("joinRoomCodeInput").value);

    hide(el("joinRoomConfirmButton"));
    const success = await joinRoomRequest(code);

    if (success === false)
    {
        el("joinRoomConfirmButton").style.display = "";
        show(el("joinFailedSpan"));
    }

    if (success == null)
    {
        show(el("joinRoomConfirmButton"));
        hide(el("joinFailedSpan"));
    }
}

el("demoButton").onclick = () =>
{
    hide(el("cjaDiv"));
    show(el("demoDiv"));
}

el("demoRequestButton").onclick = async () =>
{
    const id = el("demoIdInput").value.toString();

    if (id.length === 0) return;

    const exists = await demoSessionExistsRequest(id);

    if (exists)
    {
        window.location.href = "demonstration?id=" + id + "&db=1&t=5";
    }
    else
    {
        show(el("demoFailedSpan"));
    }
}

el("demoBackButton").onclick = () =>
{
    show(el("cjaDiv"));
    hide(el("demoDiv"));
    hide(el("demoFailedSpan"));
}