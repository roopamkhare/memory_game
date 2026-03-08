import { useGameStore, PLAYER_COLORS } from '../store';

const MEDALS = ['🥇', '🥈', '🥉', '🎮'];

// Deterministic confetti pieces (no random at render time)
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 4.1) % 100}%`,
  delay: `${(i * 0.09) % 2}s`,
  duration: `${1.4 + (i % 5) * 0.18}s`,
  color: ['#e63946', '#2a9d8f', '#f4a261', '#7b2cbf', '#ffbe0b', '#06d6a0'][i % 6],
  size: `${8 + (i % 3) * 4}px`,
}));

export function Scoreboard() {
  const { players, scores, combos, activity, status, resetGame, playerId } = useGameStore();

  if (status === 'waiting') return null;

  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const topScore = sortedPlayers.length > 0 ? (scores[sortedPlayers[0].id] || 0) : 0;
  const winners = sortedPlayers.filter(p => (scores[p.id] || 0) === topScore && topScore > 0);
  const isHost = players[0]?.id === playerId;

  return (
    <div className="scoreboard">
      <h2 className="scoreboard-title">Scores</h2>

      <ul className="score-list">
        {sortedPlayers.map((p, rank) => {
          const playerIndex = players.findIndex(pl => pl.id === p.id);
          const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
          const combo = combos[p.id] || 0;
          const isMe = p.id === playerId;
          const isLeader = topScore > 0 && (scores[p.id] || 0) === topScore;

          return (
            <li
              key={p.id}
              className={['score-item', isLeader ? 'leader' : '', isMe ? 'me' : ''].filter(Boolean).join(' ')}
              style={{ borderLeftColor: color }}
            >
              <span className="score-medal">{MEDALS[rank] ?? '🎮'}</span>
              <span className="score-name">
                {p.name}
                {isMe && <span className="score-you"> (you)</span>}
              </span>
              {combo >= 2 && status === 'playing' && (
                <span className="score-combo" title={`${combo}-match streak!`}>
                  🔥{combo}
                </span>
              )}
              <span className="score-pts">{scores[p.id] || 0} pts</span>
            </li>
          );
        })}
      </ul>

      {activity && activity.length > 0 && (
        <div className="activity-feed">
          <h3 className="activity-title">Recent</h3>
          {activity.slice(0, 5).map((entry, i) => (
            <div
              key={`${entry.ts}-${i}`}
              className={`activity-entry ${entry.matched ? 'activity-match' : 'activity-miss'}`}
            >
              <span className="activity-icon">{entry.matched ? '✅' : '❌'}</span>
              <span>
                <strong>{entry.playerName}</strong>{' '}
                {entry.matched ? 'matched' : 'missed'}{' '}
                <em>{entry.cardLabel}</em>
              </span>
            </div>
          ))}
        </div>
      )}

      {status === 'finished' && (
        <div className="game-over">
          <div className="confetti-container" aria-hidden="true">
            {CONFETTI_PIECES.map((p, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: p.left,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                  background: p.color,
                  width: p.size,
                  height: p.size,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <p className="game-over-emoji">🎉</p>
          <h2 className="game-over-title">Game Over!</h2>
          <p className="winner-text">
            {winners.length === 0
              ? "It's a tie — no points scored!"
              : winners.length > 1
              ? `Tie: ${winners.map(p => p.name).join(' & ')}`
              : `Winner: ${winners[0]?.name}`}
          </p>
          {isHost ? (
            <button className="play-again-btn" onClick={resetGame}>
              Play Again
            </button>
          ) : (
            <p className="waiting-text">Waiting for host to start a new round...</p>
          )}
        </div>
      )}
    </div>
  );
}
