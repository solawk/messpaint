el("createCountInput").oninput = (e) => { el("createCountDisplay").innerHTML = e.target.value.toString(); evalMaxAmount(); }
el("createLengthInput").oninput = (e) => { el("createLengthDisplay").innerHTML = e.target.value.toString(); evalMaxAmount(); }
el("createAmountInput").oninput = (e) => { el("createAmountDisplay").innerHTML = e.target.value.toString(); evalMaxAmount(); }
el("createT2DInput").oninput = (e) => { el("createT2DDisplay").innerHTML = e.target.value.toString() + " с"; }
el("createT2VInput").oninput = (e) => { el("createT2VDisplay").innerHTML = e.target.value.toString() + " с"; }

const factorials = [ 1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600 ];

function fact(i)
{
    return factorials[i];
}

function evalMaxAmount()
{
    // amount = ((playerCount - 1)! / (playerCount - 1 - promptLength)!)

    const playerCount = parseInt(el("createCountInput").value);
    const promptLength = parseInt(el("createLengthInput").value);

    let maxAmount = 0;
    const evaluatedAmount = fact(playerCount - 1) / fact(playerCount - 1 - promptLength);
    if (promptLength <= playerCount - 1) maxAmount = Math.floor(evaluatedAmount);

    el("createMaxAmountDisplay").innerHTML = maxAmount.toString();

    const amount = parseInt(el("createAmountInput").value);
    if (amount > maxAmount)
    {
        el("createMaxAmountDisplay").style.color = "red";
    }
    else
    {
        el("createMaxAmountDisplay").style.color = "black";
    }
}