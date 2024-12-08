// script.js
const board = document.getElementById('board');
const statusDiv = document.getElementById('status');
const ws = new WebSocket('ws://localhost:8080');

let playerID = null;
let gameState = null;

// Initialize WebSocket connection
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);

  if (data.type === 'playerID') {
    playerID = data.playerID;
    statusDiv.textContent = `You are Player ${playerID}`;
  } else if (data.type === 'gameState') {
    gameState = data.gameState;
    renderBoard();
    updateStatus();
  } else if (data.type === 'win') {
    alert(`Player ${data.playerID} wins!`);
  }
};

// Render the board
const renderBoard = () => {
  board.innerHTML = '';
  for (let r = 0; r < gameState.grid.length; r++) {
    for (let c = 0; c < gameState.grid[r].length; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (gameState.grid[r][c] === 1) {
        const piece = document.createElement('div');
        piece.classList.add('player1');
        cell.appendChild(piece);
      } else if (gameState.grid[r][c] === 2) {
        const piece = document.createElement('div');
        piece.classList.add('player2');
        cell.appendChild(piece);
      }

      board.appendChild(cell);
    }
  }
};

// Handle cell clicks for movement
let selectedPiece = null;

board.addEventListener('click', (e) => {
  const target = e.target.closest('.cell');
  if (!target || !gameState || gameState.currentPlayer !== playerID) return;

  const row = parseInt(target.dataset.row, 10);
  const col = parseInt(target.dataset.col, 10);

  if (gameState.grid[row][col] === playerID) {
    selectedPiece = { row, col };
  } else if (selectedPiece) {
    ws.send(
      JSON.stringify({
        type: 'move',
        playerID,
        fromRow: selectedPiece.row,
        fromCol: selectedPiece.col,
        toRow: row,
        toCol: col,
      })
    );
    selectedPiece = null;
  }
});

const updateStatus = () => {
  if (gameState.currentPlayer === playerID) {
    statusDiv.textContent = `Your turn! Moves left: ${gameState.movesLeft}`;
  } else {
    statusDiv.textContent = `Player ${gameState.currentPlayer}'s turn`;
  }
};
