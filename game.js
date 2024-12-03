// Game setup
const board = [];
let boardSize = 7;
let oScore = 0;
let xScore = 0;
let currentPlayer = "O";
let selectedTiles = [];
let robot = "X";
let validityAlerts = [];

// Function to generate a random board
function initBoard() {
    do {
        board.length = 0; // Reset the board before regeneration

        for (let i = 0; i < boardSize; i++) {
            const row = [];
            for (let j = 0; j < boardSize; j++) {
                row.push(Math.random() > 0.5 ? "O" : "X");
            }
            board.push(row);
        }
    } while (!isFairBoard());
}

// Function to check if the board is fair
function isFairBoard() {
    let oCount = 0;
    let xCount = 0;

    // Count the number of O and X tiles
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === "O") {
                oCount++;
            } else if (board[i][j] === "X") {
                xCount++;
            }
        }
    }

    // Return true if the difference between O and X is at most 1
    return Math.abs(oCount - xCount) <= 1;
}

// Handle tile click
function onTileClick(x, y) {
    const tile = { x, y };
    if (selectedTiles.find(t => t.x === x && t.y === y)) {
        selectedTiles = selectedTiles.filter(t => t.x !== x || t.y !== y);
        highlightSelectedTiles();
        return;
    }

    selectedTiles.push(tile);
    highlightSelectedTiles();

    if (selectedTiles.length === 3) {
        val = validateMove(selectedTiles);
        if (val === 0) {
            applyMove();
        } else if (val === 1) {
            customAlert("Invalid move! Pick at least two " + currentPlayer + "s.");
            resetSelection();
        } else {
            customAlert("Invalid move! All three tiles must be connected.");
            resetSelection();
        }
    }
}

// Validate move
function validateMove(tiles) {
    if (!areTilesConnected(tiles)) return 2;
    const selfTiles = tiles.filter(t => board[t.x][t.y] === currentPlayer).length;
    // return selfTiles > 1;
    if (selfTiles < 2) return 1;
    return 0;
}

// Check if tiles are connected
function areTilesConnected() {
    if (selectedTiles.length !== 3) return false;

    // Check adjacency
    for (let i = 0; i < selectedTiles.length; i++) {
        const tileA = selectedTiles[i];
        let connected = false;
        for (let j = 0; j < selectedTiles.length; j++) {
            if (i === j) continue; // Skip self-comparison
            const tileB = selectedTiles[j];
            if (
                (Math.abs(tileA.x - tileB.x) === 1 && tileA.y === tileB.y) || // Up/Down
                (Math.abs(tileA.y - tileB.y) === 1 && tileA.x === tileB.x)    // Left/Right
            ) {
                connected = true;
                break;
            }
        }
        if (!connected) return false; // If any tile is not connected, return false
    }

    return true;
}


// Apply move
function applyMove() {
    let selfTiles = 0;

    // Calculate score changes and clear tiles
    for (const tile of selectedTiles) {
        if (board[tile.x][tile.y] === currentPlayer) {
            selfTiles++;
        }
        board[tile.x][tile.y] = " "; // Clear tile
    }

    // Update scores
    if (currentPlayer === "O") {
        oScore += selfTiles;
    } else {
        xScore += selfTiles;
    }

    updateScores(); // Update UI scores
    updateBoardUI(); // Refresh the board display
    resetSelection(); // Clear selection

    // Switch to the next player
    switchPlayer();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function selectRandom(time=300) {
    const moves = validMoves(currentPlayer);
    const randomMove = moves[
        Math.floor(Math.random() * moves.length)
    ]
    selectedTiles = randomMove;
    highlightSelectedTiles();
    await sleep(time); 
    applyMove();
}

function selectRandomIfRobot() {
    if (robot === currentPlayer || robot === "both") {
        selectRandom(time=800);
    }
}

// Update scores in the UI
function updateScores() {
    document.getElementById("o-score").textContent = `O Score: ${oScore}`;
    document.getElementById("x-score").textContent = `X Score: ${xScore}`;
}

// Update the board UI
function updateBoardUI() {
    const boardElement = document.getElementById("board");
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;
    boardElement.innerHTML = "";

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.textContent = board[i][j];
            if (tile.textContent === " ") tile.classList.add("taken");
            tile.dataset.x = i;
            tile.dataset.y = j;
            tile.addEventListener("click", () => onTileClick(i, j));
            boardElement.appendChild(tile);
        }
    }
}

// Switch player
function switchPlayer() {
    currentPlayer = currentPlayer === "O" ? "X" : "O";
    document.getElementById("current-player").textContent = `Current Player: ${currentPlayer}`;

    // Check if the next player has valid moves
    if (!hasValidMove(currentPlayer)) {
        // Force UI update before showing the alert
        setTimeout(() => {
            validityAlerts.push(customAlert(`${currentPlayer} has no valid moves!`));
            if (skippedLastTurn) {
                endGame();
                return;
            }
            skippedLastTurn = true;
            switchPlayer(); // Automatically switch turn
        }, 100); // Delay to allow UI rendering
    } else {
        skippedLastTurn = false;
    }

    if (robot === currentPlayer || robot === "both") {
        selectRandom(time=800);
    }
}


// Highlight selected tiles
function highlightSelectedTiles() {
    const tiles = document.querySelectorAll(".tile");
    tiles.forEach(tile => tile.classList.remove("selected"));
    selectedTiles.forEach(t => {
        const tile = document.querySelector(`[data-x="${t.x}"][data-y="${t.y}"]`);
        if (tile) tile.classList.add("selected");
    });
}

// Reset selection
function resetSelection() {
    selectedTiles = [];
    highlightSelectedTiles();
}

// Function to skip the current player's turn
function skipTurn() {
    customAlert(`${currentPlayer} has skipped their turn.`);
    resetSelection();
    switchPlayer();
}

// Check if the player has any valid moves
function hasValidMove(player) {
    for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
            if (connectedGroups(x, y, player).length > 0) {
                return true;
            }
        }
    }
    return false;
}

function validMoves(player) {
    let moves = [];
    for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
            moves = moves.concat(connectedGroups(x, y, player));
        }
    }
    return moves;
}

// Helper function to check if three connected tiles can be selected
function connectedGroups(x, y, player) {
    // Adjacency directions: up, down, left, right
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0]
    ];


    if (board[x][y] === " ") return [];

    let adjacentTiles = [];
    for (let [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize && board[nx][ny] !== " ") {
            adjacentTiles.push({ x: nx, y: ny });
        }
    }

    // Ensure there are at least 3 tiles and player owns the majority
    // if (adjacentTiles.length < 2) return [];
    let validGroups = [];

    let center_player = (board[x][y] === player);

    for (let i = 0; i < adjacentTiles.length; i++) {
        let tile_i = adjacentTiles[i];
        let i_player = (board[tile_i.x][tile_i.y] === player);
        for (let j = i + 1; j < adjacentTiles.length; j++) {
            let tile_j = adjacentTiles[j];
            let j_player = (board[tile_j.x][tile_j.y] === player);
            if ((center_player + i_player + j_player) >= 2)
                validGroups.push([tile_i, {x: x, y: y}, tile_j])
        }
    }

    return validGroups;
}

function endGame() {
    const winner = oScore > xScore ? "O wins!" : oScore < xScore ? "X wins!" : "It's a tie!";

    customAlert(`<p><strong>${winner}</strong></p><p>Final Scores:</p><p>O: ${oScore}</p><p>X: ${xScore}</p>`);
    disableBoard();

    for (let alert of validityAlerts)
        document.body.removeChild(alert);
}

// Disable board interactions
function disableBoard() {
    document.getElementById("board").style.pointerEvents = "none";
}

function do_nothing() {}

function customAlert(message, button_content="OK", on_button=do_nothing) {
    // create overlay
    const overlay = document.createElement('div');
    overlay.classList.add('custom-alert-overlay');

    // create alert box
    const alertBox = document.createElement('div');
    alertBox.classList.add('custom-alert-box');

    // add message
    const messageElem = document.createElement('p');
    messageElem.innerHTML = message;
    alertBox.appendChild(messageElem);

    // add "ok" button
    const okButton = document.createElement('button');
    okButton.textContent = button_content;
    okButton.onclick = () => {
        document.body.removeChild(overlay); // remove alert on click
        on_button();
    };
    alertBox.appendChild(okButton);

    // append alert box to overlay
    overlay.appendChild(alertBox);

    // append overlay to body
    document.body.appendChild(overlay);

    return overlay;
}

function customAlertWithSwitches(message, button_content="OK", on_button=do_nothing) {
    let xType = "human";
    let oType = "human";
    // create overlay
    const overlay = document.createElement('div');
    overlay.classList.add('custom-alert-overlay');

    // create alert box
    const alertBox = document.createElement('div');
    alertBox.classList.add('custom-alert-box');

    // add message
    const messageElem = document.createElement('p');
    messageElem.innerHTML = message;
    alertBox.appendChild(messageElem);

    const label = document.createElement('span');
    label.textContent = 'Board size: ';

    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.value = 7; // default value
    numberInput.min = 3; // optional: minimum value
    numberInput.max = 10; // optional: maximum value
    numberInput.step = 1; // optional: step value for increment/decrement
    numberInput.classList.add('number-input'); // add class for styling if needed

    // handle input change
    numberInput.onchange = () => {
        boardSize = numberInput.value;
        initBoard();
        updateBoardUI();
        console.log(`X is now: ${numberInput.value}`);
    };

    alertBox.appendChild(label);
    alertBox.appendChild(numberInput);

    const xSwitch = document.createElement('button');
    xSwitch.classList.add('switch')
    xSwitch.textContent = `X: ${xType}`;
    xSwitch.onclick = () => {
        xType = (xType === "human") ? "robot" : "human";
        xSwitch.textContent = `X: ${xType}`;
    };

    const oSwitch = document.createElement('button');
    oSwitch.classList.add('switch')
    oSwitch.textContent = `O: ${oType}`;
    oSwitch.onclick = () => {
        oType = (oType === "human") ? "robot" : "human";
        oSwitch.textContent = `O: ${oType}`;
    };

    const switchDiv = document.createElement('div');
    switchDiv.appendChild(oSwitch);
    switchDiv.appendChild(xSwitch);
    alertBox.appendChild(switchDiv);


    // add "ok" button
    const okButton = document.createElement('button');
    okButton.textContent = button_content;
    okButton.onclick = () => {
        if (xType === "human") {
            if (oType === "human") robot = "neither";
            else robot = "O";
        } else {
            if (oType === "human") robot = "X";
            else robot = "both";
        }

        document.body.removeChild(overlay); // remove alert on click
        selectRandomIfRobot();
    };
    alertBox.appendChild(okButton);

    // append alert box to overlay
    overlay.appendChild(alertBox);

    // append overlay to body
    document.body.appendChild(overlay);
}



// Initialize game
initBoard();
updateBoardUI();
updateScores();

customAlertWithSwitches("<p><strong>Instructions:</strong> On your turn, take a set of three connected tiles. At least two must have your symbol. If you can't (or don't want to) take a set, you can skip your turn. When both players pass, the game ends, and the player with more of their own tiles taken is the winner.</p>", button_content = "Play", on_button = selectRandomIfRobot)

document.getElementById("skip-button").addEventListener("click", skipTurn);
document.getElementById("random-button").addEventListener("click", selectRandom);