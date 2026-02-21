import { useGameStore } from '../store';

export function Scoreboard() {
  const { players, scores, status, resetGame } = useGameStore();

  if (status === 'waiting') return null;

  return (
    <div className="scoreboard">
      <h2>Scores</h2>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.name}: {scores[p.id] || 0}
          </li>
        ))}
      </ul>
      {status === 'finished' && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}