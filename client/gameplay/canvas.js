const pCtx = el("paintCanvas").getContext("2d", { willReadFrequently: true });

pCtx.lineCap = "round";
let lineWidth = 8;
pCtx.strokeStyle = "black";

let drawing = false;
let previousImageData = [];

pCtx.canvas.oncontextmenu = (e) => { e.preventDefault(); };

pCtx.canvas.onpointermove = (e) =>
{
    drawCursor(e.offsetX, e.offsetY);

    if (e.buttons !== 1)
    {
        drawing = false;
        return;
    }

    if (!drawing)
    {
        saveState();
        drawing = true;
    }

    const pos = { x: e.offsetX, y: e.offsetY };
    const mov = { x: e.movementX, y: e.movementY };

    let trueWidth = lineWidth;
    if (e.pointerType === "mouse")
    {
        trueWidth = lineWidth * 2;
    }

    pCtx.lineWidth = trueWidth * e.pressure;
    pCtx.beginPath();
    pCtx.moveTo(pos.x - mov.x, pos.y - mov.y);
    pCtx.lineTo(pos.x, pos.y);
    pCtx.stroke();
    pCtx.closePath();
}

function clearCanvas()
{
    pCtx.fillStyle = "white";
    pCtx.fillRect(0, 0, pCtx.canvas.width, pCtx.canvas.height);
}

clearCanvas();

function saveState()
{
    const data = pCtx.getImageData(0, 0, pCtx.canvas.width, pCtx.canvas.height);
    const newLength = previousImageData.push(data);
    if (newLength > 30) previousImageData.shift();
}

el("paintReadyCheckbox").onchange = () =>
{
    const ready = el("paintReadyCheckbox").checked;
    setReadyStatus(ready);
};

function setReadyStatus(status)
{
    console.log("Setting ready to " + status);
    wsSend("READYSTATUS", status === true ? "1" : "-1");
}

function sendPainting()
{
    const paintingData = pCtx.canvas.toDataURL("image/png", 1.0);
    wsSend("SENDPAINTING", paintingData);
    clearCanvas();
}

// Palette and tools

let selectedCell = null;

function createPalette()
{
    for (let v = 4; v > 0; v--)
    {
        const row = document.createElement("tr");
        el("paintPalette").appendChild(row);

        for (let h = 0; h < 13; h++)
        {
            const hs = (h * 30).toString();
            const ss = "100%";
            const ls = (v * 20).toString() + "%";
            const bs = ((v - 1) * 34).toString() + "%";
            const colors = h !== 12 ? "hsl(" + hs + " " + ss + " " + ls + ")" : "hsl(0 0% " + bs + ")";

            const cell = document.createElement("td");
            row.appendChild(cell);
            cell.style.backgroundColor = colors;
            cell.style.boxSizing = "border-box";
            cell.style.border = "1px solid black";
            cell.style.width = (70 / 12).toString() + "%";
            cell.style.height = "30px";
            //cell.innerHTML = "<br>";

            cell.onclick = () =>
            {
                pCtx.strokeStyle = cell.style.backgroundColor;
                if (selectedCell) selectedCell.style.border = "1px solid black";
                selectedCell = cell;
                cell.style.border = "3px solid black";
            }
        }
    }
}

createPalette();

el("paintSize").onchange = () =>
{
    lineWidth = Math.pow(2, parseInt(el("paintSize").value));
}

document.onkeydown = (e) =>
{
    if (e.code === "KeyZ" && e.ctrlKey)
    {
        if (previousImageData.length < 1) return;
        const data = previousImageData.pop();
        pCtx.putImageData(data, 0, 0);
    }
}