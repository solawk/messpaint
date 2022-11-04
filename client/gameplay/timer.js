let timerDuration = 0;
let timerStartStamp = 0; // in milliseconds
let timeout = null;

function setupTimer(duration)
{
    timerDuration = duration;
}

function timeLeft()
{
    return timerDuration - Math.floor((Date.now() - timerStartStamp) / 1000);
}

function seconds2timer(seconds)
{
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    const minutesStr = minutes > 9 ? minutes.toString() : + "0" + minutes.toString();
    const secondsStr = seconds > 9 ? seconds.toString() : + "0" + seconds.toString();

    return minutesStr + ":" + secondsStr;
}

function launchTimer()
{
    if (timeout != null)
    {
        clearTimeout(timeout);
    }

    timerStartStamp = Date.now();
    el("paintTimer").innerHTML = "Осталось " + seconds2timer(timeLeft());

    timeout = setTimeout(reduceTimer, 100);
}

function reduceTimer()
{
    el("paintTimer").innerHTML = "Осталось " + seconds2timer(timeLeft());
    if (timeLeft() > 0) timeout = setTimeout(reduceTimer, 100);
    else timeout = null;
}