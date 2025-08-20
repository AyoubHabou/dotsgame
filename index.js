import React, { useState, useEffect, useRef } from 'react';

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER_RED = 1;
const PLAYER_YELLOW = 2;

const JoinDotsGame = () => {
  const [board, setBoard] = useState(() => 
    Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY))
  );
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_RED);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [dropAnimation, setDropAnimation] = useState(null);

  const checkWinner = (board, row, col, player) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (let [dx, dy] of directions) {
      let count = 1;
      let cells = [[row, col]];
      
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
            board[newRow][newCol] === player) {
          count++;
          cells.push([newRow, newCol]);
        } else break;
      }
      
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
            board[newRow][newCol] === player) {
          count++;
          cells.unshift([newRow, newCol]);
        } else break;
      }
      
      if (count >= 4) {
        return cells.slice(0, 4);
      }
    }
    return null;
  };

  const isDraw = (board) => {
    return board[0].every(cell => cell !== EMPTY);
  };

  const makeMove = async (col) => {
    if (gameOver || isAnimating || board[0][col] !== EMPTY) return;

    setIsAnimating(true);
    
    // Find the lowest empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) {
        row = r;
        break;
      }
    }

    if (row === -1) {
      setIsAnimating(false);
      return;
    }

    // Animate piece drop
    setDropAnimation({ col, targetRow: row, player: currentPlayer });
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 400));

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setLastMove([row, col]);
    setDropAnimation(null);

    // Check for winner
    const winCells = checkWinner(newBoard, row, col, currentPlayer);
    if (winCells) {
      setWinningCells(winCells);
      setWinner(currentPlayer);
      setGameOver(true);
    } else if (isDraw(newBoard)) {
      setGameOver(true);
      setWinner('draw');
    } else {
      setCurrentPlayer(currentPlayer === PLAYER_RED ? PLAYER_YELLOW : PLAYER_RED);
    }

    setIsAnimating(false);
  };

  const resetGame = () => {
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER_RED);
    setGameOver(false);
    setWinner(null);
    setWinningCells([]);
    setLastMove(null);
    setIsAnimating(false);
    setHoveredColumn(null);
    setDropAnimation(null);
  };

  const getColumnPreview = (col) => {
    if (gameOver || isAnimating || board[0][col] !== EMPTY) return -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) return r;
    }
    return -1;
  };

  const FloatingOrbs = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" 
           style={{top: '10%', left: '10%', animationDelay: '0s', animationDuration: '4s'}} />
      <div className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" 
           style={{top: '60%', right: '10%', animationDelay: '2s', animationDuration: '5s'}} />
      <div className="absolute w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" 
           style={{bottom: '10%', left: '50%', animationDelay: '1s', animationDuration: '6s'}} />
    </div>
  );

  const GamePiece = ({ player, isWinning, isLastMove, isPreview, isDropping, dropRow }) => {
    const baseClasses = "w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center relative";
    
    let playerClasses = "";
    let glowClasses = "";
    
    if (player === PLAYER_RED) {
      playerClasses = "bg-gradient-to-br from-red-400 via-red-500 to-red-600 shadow-lg shadow-red-500/50";
      glowClasses = isWinning ? "animate-pulse shadow-2xl shadow-red-400/80" : "";
    } else if (player === PLAYER_YELLOW) {
      playerClasses = "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50";
      glowClasses = isWinning ? "animate-pulse shadow-2xl shadow-yellow-400/80" : "";
    }
    
    if (isPreview) {
      playerClasses = player === PLAYER_RED 
        ? "bg-gradient-to-br from-red-400/40 via-red-500/40 to-red-600/40 border-2 border-red-400/60"
        : "bg-gradient-to-br from-yellow-400/40 via-yellow-500/40 to-orange-500/40 border-2 border-yellow-400/60";
    }

    const dropStyle = isDropping ? {
      transform: `translateY(-${(5 - dropRow) * 64}px)`,
      transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    } : {};

    return (
      <div className={`${baseClasses} ${playerClasses} ${glowClasses}`} style={dropStyle}>
        {isLastMove && !isPreview && (
          <div className="absolute inset-0 rounded-full border-4 border-white animate-ping" />
        )}
        {isWinning && (
          <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative">
      <FloatingOrbs />
      
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Join Dots
          </h1>
          {!gameOver && (
            <div className="flex items-center justify-center gap-4">
              <span className="text-xl text-white/80">Current Player:</span>
              <div className="flex items-center gap-2">
                <GamePiece player={currentPlayer} />
                <span className="text-xl font-semibold text-white">
                  {currentPlayer === PLAYER_RED ? 'Red' : 'Yellow'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="bg-slate-800/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-7 gap-2 p-4 bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-2xl backdrop-blur-sm border border-white/5">
            {Array.from({ length: ROWS }, (_, row) =>
              Array.from({ length: COLS }, (_, col) => {
                const cell = board[row][col];
                const isWinning = winningCells.some(([r, c]) => r === row && c === col);
                const isLastMove = lastMove && lastMove[0] === row && lastMove[1] === col;
                const previewRow = getColumnPreview(col);
                const showPreview = hoveredColumn === col && previewRow === row && !gameOver;
                const isDropping = dropAnimation && dropAnimation.col === col && row === dropAnimation.targetRow;
                
                return (
                  <div
                    key={`${row}-${col}`}
                    className="w-16 h-16 bg-slate-800/60 rounded-xl border border-slate-600/30 flex items-center justify-center relative overflow-hidden cursor-pointer hover:bg-slate-700/60 transition-all duration-200"
                    onClick={() => makeMove(col)}
                    onMouseEnter={() => setHoveredColumn(col)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    {/* Drop animation piece */}
                    {isDropping && (
                      <GamePiece 
                        player={dropAnimation.player} 
                        isDropping={true}
                        dropRow={row}
                      />
                    )}
                    
                    {/* Regular piece */}
                    {cell !== EMPTY && !isDropping && (
                      <GamePiece 
                        player={cell} 
                        isWinning={isWinning} 
                        isLastMove={isLastMove} 
                      />
                    )}
                    
                    {/* Preview piece */}
                    {showPreview && cell === EMPTY && !isDropping && (
                      <GamePiece player={currentPlayer} isPreview={true} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-lg border border-white/20 rounded-3xl p-8 text-center shadow-2xl transform animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-6">
                {winner === 'draw' ? (
                  <div>
                    <div className="text-6xl mb-4">🤝</div>
                    <h2 className="text-3xl font-bold text-white mb-2">It's a Draw!</h2>
                    <p className="text-white/70">Great game! Want to play again?</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center mb-4">
                      <GamePiece player={winner} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {winner === PLAYER_RED ? 'Red' : 'Yellow'} Wins! 🎉
                    </h2>
                    <p className="text-white/70">Congratulations on the victory!</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="text-center mt-6">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white/80 hover:text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinDotsGame;
