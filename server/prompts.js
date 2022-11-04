module.exports = {
    sentenceStructure: generateSentenceStructure,
    generate: generatePromptsForRoom
};

// Sentence structures
const ss2 = [ 'S|G', 'P|S' ];
const ss3 = [ 'S|G|SV', 'P|S|G' ];
const ss4 = [ 'P|S|N|G', 'S|N|G|SV' ];
const ss5 = [ 'P|S|N|G|SV', 'S|N|G|PV|SV' ];
const ss6 = [ 'P|S|N|G|PV|SV', ];
const ssArr = [ ss2, ss3, ss4, ss5, ss6 ];

function generateSentenceStructure(length)
{
    const ss = ssArr[length - 2];
    const index = Math.floor(Math.random() * ss.length);

    return ss[index];
}

function generatePromptsForRoom(room)
{
    // Theory:
    // Combinations available per player = (playerCount - 1)! / (playerCount - 1 - promptLength)!
    // In example:
    // playerCount = 5, promptLength = 3, drawingCount = 4! / 1! = 24
    // playerCount = 7, promptLength = 4, drawingCount = 6! / 2! = 360
    // playerCount = 7, promptLength = 2, drawingCount = 6! / 4! = 30
    // Choosing smaller drawingCount reduces the chance of providing players their own prompt parts

    // 1. Put all prompts into a matrix

    const matrix = [];
    for (let player of room.playerData) matrix.push(player.prompt);

    const playerCount = matrix.length;
    const promptLength = room.promptLength;

    // 2. Generate all possible combinations, paired with meta info on the player indices the parts belong to
    // -- Never use parts from the prompts that have been used before

    const combinations = [];

    const combineNextPart = (combination) =>
    {
        const partsCount = combination.parts.length;

        if (partsCount === promptLength)
        {
            combinations.push(combination);
            return;
        }

        for (let i = 0; i < playerCount; i++)
        {
            if (combination.indices.includes(i)) continue;

            combineNextPart({ parts: [ ...combination.parts, matrix[i][partsCount]], indices: [ ...combination.indices, i ] });
        }
    }

    combineNextPart({ parts: [], indices: [] });
    console.log("Combination count: " + combinations.length);

    // 3. Shuffle
    combinations.sort((a, b) => { return Math.random() - 0.5; });

    // 4. For every player give a certain amount of combinations
    // -- Try to avoid giving player combinations with their own parts

    for (let i = 0; i < playerCount; i++)
    {
        for (let j = 0; j < room.drawingsCount; j++)
        {
            if (combinations.length === 0) return -1;

            let k;

            for (k = 0; k < combinations.length; k++)
            {
                if (!combinations[k].indices.includes(i)) break;
            }

            if (k === combinations.length) k--;
            room.playerData[i].drawingPrompts.push(combinations[k].parts.join(" "));
            combinations.splice(k, 1);
        }
    }
}