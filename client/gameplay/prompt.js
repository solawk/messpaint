let promptReadyPlayers = 0;

el("promptSend").onclick = () =>
{
    let prompt = "";
    const partsCount = el("promptRow").childElementCount;
    for (let i = 0; i < partsCount; i++)
    {
        const element = el("sentencePart" + i.toString());
        const part = element.value;
        if (part.trim() === "")
        {
            element.style.backgroundColor = "red";
            return;
        }

        prompt += part;
        if (i < partsCount-1) prompt += "|";
    }

    for (let i = 0; i < partsCount; i++)
    {
        el("sentencePart" + i.toString()).style.backgroundColor = "gray";
        el("sentencePart" + i.toString()).readOnly = true;
    }

    wsSend("SENDPROMPT", prompt);
    el("promptSend").disabled = true;
};