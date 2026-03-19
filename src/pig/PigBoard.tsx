import { usePigStore, PIG_COLORS, PIG_WIN } from './pigStore';

const DICE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function PigBoard() {
  const { players, scores, turnScore, turnIndex, lastRoll, status, winnerId, playerId, roll, hold, resetGame } = usePigStore();

  const currentPlayer = players[turnIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const isHost = players[0]?.id === playerId;
  const winner = winnerId ? players.find(p => p.id === winnerId) : null;

  return (
    <div className="pig-board">
      {/* Player score cards */}
      <div className="pig-scores">
        {players.map((p, i) => {
          const color = PIG_COLORS[i % PIG_COLORS.length];
          const isActive = i === turnIndex && status === 'playing';
          const banked = scores[p.id] || 0;
          const pct = Math.min(banked / PIG_WIN, 1);
          return (
            <div key={p.id} className={`pig-player-card${isActive ? ' active' : ''}`} style={{ borderColor: isActive ? color : 'transparent' }}>
              <div className="pig-player-name" style={{ color }}>
                {p.name} {p.id === playerId ? '(you)' : ''}
              </div>
              <div className="pig-banked">{banked} pts</div>
              <div className="pig-bank-track">
                <div className="pig-bank-fill" style={{ width: `${pct * 100}%`, background: color }} />
              </div>
              <div className="pig-bank-goal">{banked}/{PIG_WIN}</div>
            </div>
          );
        })}
      </div>

      {/* Dice area */}
      {status === 'playing' && (
        <div className="pig-dice-area">
          <div className="pig-turn-label" style={{ color: PIG_COLORS[turnIndex % PIG_COLORS.length] }}>
            {isMyTurn ? 'Your turn!' : `${currentPlayer?.name}'s turn`}
          </div>

          <div className="pig-dice-display">
            {lastRoll === null
              ? <span className="pig-dice pig-dice-idle">🎲</span>
              : <span className={`pig-dice${lastRoll === 1 ? ' pig-dice-pig' : ''}`}>{DICE[lastRoll]}</span>
            }
          </div>

          {lastRoll === 1 && (
            <div className="pig-oops">🐷 PIG! Turn lost!</div>
          )}

          <div className="pig-turn-score">
            Turn: <strong>{turnScore}</strong> pts
          </div>

          {isMyTurn && (
            <div className="pig-actions">
              <button className="pig-roll-btn" onClick={roll}>
                🎲 Roll
              </button>
              <button className="pig-hold-btn" onClick={hold} disabled={turnScore === 0}>
                ✋ Hold (+{turnScore})
              </button>
            </div>
          )}
        </div>
      )}

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
