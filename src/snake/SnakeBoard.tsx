import { useSnakeStore, SNAKE_COLORS, SNAKES, LADDERS } from './snakeStore';

// Maps grid position (row from top 0-9, col 0-9) → board square number 1-100
function squareAt(gridRow: number, col: number): number {
  const rowFromBottom = 9 - gridRow;
  return rowFromBottom % 2 === 0
    ? rowFromBottom * 10 + col + 1
    : rowFromBottom * 10 + (9 - col) + 1;
}

const DICE_EMOJI = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function SnakeBoard() {
  const { players, positions, turnIndex, lastRoll, lastEvent, status, winnerId, playerId, rollDice, resetGame } = useSnakeStore();

  const isMyTurn = players[turnIndex]?.id === playerId;
  const isHost = players[0]?.id === playerId;
  const winner = winnerId ? players.find(p => p.id === winnerId) : null;

  // Build a map: squareNumber → array of player indices on that square
  const playerOnSquare: Record<number, number[]> = {};
  players.forEach((p, i) => {
    const sq = positions[p.id] || 0;
    if (sq > 0) {
      if (!playerOnSquare[sq]) playerOnSquare[sq] = [];
      playerOnSquare[sq].push(i);
    }
  });

  const cells: { gridRow: number; col: number; square: number }[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      cells.push({ gridRow: r, col: c, square: squareAt(r, c) });
    }
  }

  return (
    <div className="snake-layout">
      {/* Player turn strip */}
      <div className="snake-topbar">
        <div className="snake-players">
          {players.map((p, i) => {
            const pos = positions[p.id] || 0;
            const color = SNAKE_COLORS[i % SNAKE_COLORS.length];
            return (
              <div
                key={p.id}
                className={`snake-player-chip${i === turnIndex && status === 'playing' ? ' active' : ''}`}
                style={{ borderColor: color, color }}
              >
                <span className="snake-chip-avatar" style={{ background: color }}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="snake-chip-name">{p.name}</span>
                <span className="snake-chip-pos">sq {pos || '—'}</span>
              </div>
            );
          })}
        </div>

        {status === 'playing' && (
          <div className="snake-roll-area">
            <div className="snake-dice">
              {lastRoll ? DICE_EMOJI[lastRoll] : '🎲'}
            </div>
            {isMyTurn && (
              <button className="snake-roll-btn" onClick={rollDice}>Roll</button>
            )}
            {!isMyTurn && (
              <span className="snake-waiting">
                {players[turnIndex]?.name}'s turn…
              </span>
            )}
          </div>
        )}
      </div>

      {/* Last event log */}
      {lastEvent && (
        <div className="snake-event">{lastEvent}</div>
      )}

      {/* The board */}
      <div className="snake-board">
        {cells.map(({ gridRow, col, square }) => {
          const isSnakeHead = SNAKES[square] !== undefined;
          const isLadderBase = LADDERS[square] !== undefined;
          const playersHere = playerOnSquare[square] || [];
          const isStartSquare = square === 1;
          const isEndSquare = square === 100;

          let cellClass = 'snake-cell';
          if (isSnakeHead) cellClass += ' snake-cell-snake';
          else if (isLadderBase) cellClass += ' snake-cell-ladder';
          else if (isEndSquare) cellClass += ' snake-cell-end';
          else if (isStartSquare) cellClass += ' snake-cell-start';
          else if ((gridRow + col) % 2 === 0) cellClass += ' snake-cell-even';
          else cellClass += ' snake-cell-odd';

          return (
            <div key={square} className={cellClass}>
              <span className="snake-sq-num">{square}</span>

              {isSnakeHead && (
                <span className="snake-indicator" title={`Snake! → ${SNAKES[square]}`}>🐍</span>
              )}
              {isLadderBase && (
                <span className="snake-indicator" title={`Ladder! → ${LADDERS[square]}`}>🪜</span>
              )}
              {isEndSquare && <span className="snake-indicator">🏆</span>}
              {isStartSquare && <span className="snake-indicator">🚀</span>}

              {playersHere.length > 0 && (
                <div className="snake-tokens">
                  {playersHere.map((pi) => (
                    <span
                      key={pi}
                      className="snake-token"
                      style={{ background: SNAKE_COLORS[pi % SNAKE_COLORS.length] }}
                      title={players[pi]?.name}
                    >
                      {players[pi]?.name.charAt(0).toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="snake-legend">
        <span>🐍 Snake (slide down)</span>
        <span>🪜 Ladder (climb up)</span>
        <span>🏆 Square 100 = Win!</span>
      </div>

      {/* Game over */}
      {status === 'finished' && (
        <div className="pig-game-over">
          <p className="pig-go-emoji">🏆</p>
          <h2>Game Over!</h2>
          <p className="winner-text">
            {winner ? `Winner: ${winner.name}!` : 'Game finished!'}
          </p>
          {isHost
            ? <button className="play-again-btn" onClick={resetGame}>Play Again</button>
            : <p className="waiting-text">Waiting for host to restart...</p>
          }
        </div>
      )}
    </div>
  );
}
