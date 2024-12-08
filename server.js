const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
const players = [];
let gameState = {
  grid: Array(8)
    .fill(null)
    .map(() => Array(16).fill(null)),
  currentPlayer: 1,
  movesLeft: 3,
};

// Initialize the game board
const initializeBoard = () => {
  for (let i = 4; i < 12; i++) {
    gameState.grid[5][i] = 1;
    gameState.grid[6][i] = 1;
    gameState.grid[1][i] = 2;
    gameState.grid[2][i] = 2;
  }
};

initializeBoard();

// Broadcast game state to all players
const broadcast = (message) => {
  players.forEach((player) => {
    if (player.readyState === WebSocket.OPEN) {
      player.send(JSON.stringify(message));
    }
  });
};

server.on('connection', (socket) => {
  if (players.length >= 2) {
    socket.send(JSON.stringify({ type: 'error', message: 'Game is full!' }));
    socket.close();
    return;
  }

  players.push(socket);

  // Assign player ID (1 or 2)
  const playerID = players.length;
  socket.send(JSON.stringify({ type: 'playerID', playerID }));

  // Send initial game state
  socket.send(JSON.stringify({ type: 'gameState', gameState }));

  socket.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'move' && gameState.currentPlayer === data.playerID) {
      const { fromRow, fromCol, toRow, toCol } = data;

      // Validate and execute move
      const dx = Math.abs(fromRow - toRow);
      const dy = Math.abs(fromCol - toCol);

      if (
        gameState.grid[toRow][toCol] === null &&
        (dx + dy === 1 || (dx === 1 && dy === 1))
      ) {
        gameState.grid[toRow][toCol] = gameState.grid[fromRow][fromCol];
        gameState.grid[fromRow][fromCol] = null;
        gameState.movesLeft--;

        // Check win condition
        if (
          (data.playerID === 1 && toRow === 0) ||
          (data.playerID === 2 && toRow === 7)
        ) {
          broadcast({ type: 'win', playerID: data.playerID });
          initializeBoard();
          gameState.currentPlayer = 1;
          gameState.movesLeft = 3;
        }

        // End turn if no moves left
        if (gameState.movesLeft === 0) {
          gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
          gameState.movesLeft = 3;
        }

        // Broadcast updated game state
        broadcast({ type: 'gameState', gameState });
      }
    }
  });

  socket.on('close', () => {
    players.splice(players.indexOf(socket), 1);
  });
});

console.log('WebSocket server running on ws://localhost:8080');

