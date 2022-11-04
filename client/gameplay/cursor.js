const cCtx = el("cursorCanvas").getContext("2d");
cCtx.lineWidth = 1;
cCtx.strokeStyle = "gray";

function drawCursor(x, y)
{
    const pos = { x: x, y: y };
    clearCCanvas();

    cCtx.beginPath();
    cCtx.arc(pos.x, pos.y, lineWidth / 2, 0, 6.28, false);
    cCtx.stroke();
    cCtx.closePath();
}

function clearCCanvas()
{
    cCtx.clearRect(0, 0, cCtx.canvas.width, cCtx.canvas.height);
}