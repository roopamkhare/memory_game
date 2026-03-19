import { usePigStore, PIG_COLORS, PIG_WIN } from './pigStore';

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function PigBoard() {
  const { players, scores, turnScore, turnIndex, lastRoll, status, winnerId, piggedOut, roll, hold, confirmHandoff, resetGame } = usePigStore();

  const currentPlayer = players[turnIndex];
  const currentColor = PIG_COLORS[turnIndex % PIG_COLORS.length];
  const winner = winnerId ? players.find((p) => p.id === winnerId) : null;

  // Handoff screen — shown between turns
  if (status === 'handoff') {
    const nextIndex = (turnIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];
    const nextColor = PIG_COLORS[nextIndex % PIG_COLORS.length];
    return (
      <div className="pig-handoff">
        {piggedOut ? (
          <>
            <div className="pig-handoff-icon">🐷</div>
            <h2 className="pig-handoff-title" style={{ color: currentColor }}>
              {currentPlayer?.name} rolled a 1!
            </h2>
            <p className="pig-handoff-msg">No points this turn. Pass the device!</p>
          </>
        ) : (
          <>
            <div className="pig-handoff-icon">✋</div>
            <h2 className="pig-handoff-title" style={{ color: currentColor }}>
              {currentPlayer?.name} banked their points!
            </h2>
            <p className="pig-handoff-msg">Good move! Pass the device.</p>
          </>
        )}
        <div className="pig-handoff-scores">
          {players.map((p, i) => (
            <div key={p.id} className="pig-handoff-score-row">
              <span style={{ color: PIG_COLORS[i] }}>{p.name}</span>
              <span className="pig-handoff-pts">{scores[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
        <button className="pig-next-btn" style={{ background: nextColor }} onClick={confirmHandoff}>
          {nextPlayer?.name}'s Turn! →
        </button>
      </div>
    );
  }

  // Game over screen
  if (status === 'finished') {
    return (
      <div className="pig-game-over">
        <p className="pig-go-emoji">🏆</p>
        <h2 style={{ margin: '0.3rem 0', color: '#ffdd57' }}>Game Over!</h2>
        <p className="winner-text">{winner ? `🎉 ${winner.name} wins!` : 'Game finished!'}</p>
        <div className="pig-final-scores">
          {players.map((p, i) => (
            <div key={p.id} className="pig-final-row">
              <span style={{ color: PIG_COLORS[i] }}>{p.name}</span>
              <span>{scores[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
        <button className="play-again-btn" onClick={resetGame}>Play Again</button>
      </div>
    );
  }

  // Playing screen
  return (
    <div className="pig-board">
      {/* Score cards */}
      <div className="pig-scores">
        {players.map((p, i) => {
          const color = PIG_COLORS[i % PIG_COLORS.length];
          const isActive = i === turnIndex;
          const banked = scores[p.id] || 0;
          const pct = Math.min(banked / PIG_WIN, 1);
          return (
            <div key={p.id} className={`pig-player-card${isActive ? ' active' : ''}`} style={{ borderColor: isActive ? color : 'transparent' }}>
              <div className="pig-player-name" style={{ color }}>{p.name}</div>
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
      <div className="pig-dice-area">
        <div className="pig-turn-label" style={{ color: currentColor }}>
          {currentPlayer?.name}'s turn!
        </div>

        <div className="pig-dice-display">
          {lastRoll === null
            ? <span className="pig-dice pig-dice-idle">🎲</span>
            : <span className={`pig-dice${lastRoll === 1 ? ' pig-dice-pig' : ''}`}>{DICE_FACES[lastRoll]}</span>
          }
        </div>

        {lastRoll === 1 && (
          <div className="pig-oops">🐷 PIG! Turn lost!</div>
        )}

        <div className="pig-turn-score">
          Turn total: <strong>{turnScore}</strong> pts
        </div>

        <div className="pig-actions">
          <button className="pig-roll-btn" onClick={roll}>
            🎲 Roll
          </button>
          <button className="pig-hold-btn" onClick={hold} disabled={turnScore === 0}>
            ✋ Bank +{turnScore}
          </button>
        </div>
      </div>
    </div>
  );
}
