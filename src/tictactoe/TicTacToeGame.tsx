import { useState } from 'react';

type Cell = 'X' | 'O' | null;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

const PLAYER_COLORS = ['#e63946', '#2a9d8f'];
const PLAYER_BG = ['#fff0f1', '#f0faf9'];

export function TicTacToeGame() {
  const [names, setNames] = useState(['', '']);
  const [namesDone, setNamesDone] = useState(false);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<0 | 1>(0); // 0 = X, 1 = O
  const [winResult, setWinResult] = useState<{ winner: Cell; line: number[] } | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [wins, setWins] = useState([0, 0]);

  const marks: Cell[] = ['X', 'O'];

  const handleStart = () => {
    if (!names[0].trim() || !names[1].trim()) {
      alert('Enter both player names!');
      return;
    }
    setNamesDone(true);
  };

  const handleClick = (i: number) => {
    if (!namesDone || board[i] || winResult || isDraw) return;
    const newBoard = [...board];
    newBoard[i] = marks[currentTurn];
    const result = checkWinner(newBoard);
    setBoard(newBoard);
    if (result) {
      setWinResult(result);
      const winnerIdx = result.winner === 'X' ? 0 : 1;
      setWins((w) => { const next = [...w]; next[winnerIdx]++; return next; });
    } else if (newBoard.every((c) => c !== null)) {
      setIsDraw(true);
    } else {
      setCurrentTurn(currentTurn === 0 ? 1 : 0);
    }
  };

  const playAgain = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn(0);
    setWinResult(null);
    setIsDraw(false);
  };

  if (!namesDone) {
    return (
      <div className="ttt-setup">
        <p className="ttt-setup-desc">Take turns placing X and O — get 3 in a row to win!</p>
        <div className="ttt-setup-players">
          {[0, 1].map((i) => (
            <div key={i} className="ttt-setup-player" style={{ borderColor: PLAYER_COLORS[i] }}>
              <div className="ttt-setup-mark" style={{ color: PLAYER_COLORS[i] }}>
                {marks[i]}
              </div>
              <input
                className="ttt-setup-input"
                type="text"
                placeholder={`Player ${i + 1} name`}
                value={names[i]}
                maxLength={18}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
          ))}
        </div>
        <button className="ttt-start-btn" onClick={handleStart}>
          Start Game!
        </button>
      </div>
    );
  }

  const gameOver = !!(winResult || isDraw);
  const currentColor = PLAYER_COLORS[currentTurn];
  const currentName = names[currentTurn];

  return (
    <div className="ttt-game">
      {/* Score bar */}
      <div className="ttt-scorebar">
        {[0, 1].map((i) => (
          <div key={i} className={`ttt-score-chip ${!gameOver && i === currentTurn ? 'active' : ''}`}
            style={{ borderColor: PLAYER_COLORS[i], background: i === currentTurn && !gameOver ? PLAYER_BG[i] : '#f8f8f8' }}>
            <span className="ttt-score-mark" style={{ color: PLAYER_COLORS[i] }}>{marks[i]}</span>
            <span className="ttt-score-name">{names[i]}</span>
            <span className="ttt-score-wins" style={{ color: PLAYER_COLORS[i] }}>{wins[i]}W</span>
          </div>
        ))}
      </div>

      {/* Status */}
      {!gameOver && (
        <div className="ttt-status" style={{ color: currentColor }}>
          {currentName}'s turn ({marks[currentTurn]})
        </div>
      )}
      {gameOver && (
        <div className="ttt-result">
          {winResult
            ? <span>🏆 {names[winResult.winner === 'X' ? 0 : 1]} wins!</span>
            : <span>🤝 It's a draw!</span>
          }
        </div>
      )}

      {/* Board */}
      <div className="ttt-board">
        {board.map((cell, i) => {
          const isWin = winResult?.line.includes(i);
          return (
            <button
              key={i}
              className={`ttt-cell${cell ? ` ttt-${cell.toLowerCase()}` : ''}${isWin ? ' ttt-win' : ''}${!cell && !gameOver ? ' ttt-empty' : ''}`}
              onClick={() => handleClick(i)}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      {gameOver && (
        <div className="ttt-actions">
          <button className="ttt-again-btn" onClick={playAgain}>Play Again</button>
          <button className="ttt-reset-btn" onClick={() => { setNamesDone(false); setWins([0, 0]); playAgain(); }}>
            Change Names
          </button>
        </div>
      )}
    </div>
  );
}
