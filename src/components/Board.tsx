import { useEffect, useRef, useState } from 'react';
import { useGameStore, PLAYER_COLORS, TURN_DURATION } from '../store';
import { resolveTheme } from '../themes';

export function Board() {
  const {
    deck, flipCard, skipTurn, status,
    turnIndex, players, playerId, pairsCount, theme, combos, turnStartTime,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [shakingIndices, setShakingIndices] = useState<Set<number>>(new Set());
  const prevFlippedRef = useRef<number[]>([]);
  const skipFiredRef = useRef(false);

  const isMyTurn = players[turnIndex]?.id === playerId;
  const activeTheme = resolveTheme(theme);
  const matchedPairs = deck.filter(c => c.matched).length / 2;
  const progressPct = pairsCount > 0 ? matchedPairs / pairsCount : 0;
  const currentPlayerColor = PLAYER_COLORS[turnIndex % PLAYER_COLORS.length];
  const myCombo = combos[playerId || ''] || 0;

  const totalCards = pairsCount * 2;
  let columns = 4;
  if (totalCards >= 20) columns = 5;
  if (totalCards >= 24) columns = 6;

  // Turn countdown timer — resets whenever turnStartTime changes
  useEffect(() => {
    if (status !== 'playing') return;
    skipFiredRef.current = false;

    const computeRemaining = () => {
      if (!turnStartTime) return TURN_DURATION;
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      return Math.max(0, TURN_DURATION - elapsed);
    };

    setTimeLeft(computeRemaining());

    const interval = setInterval(() => {
      const remaining = computeRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0 && isMyTurn && !skipFiredRef.current) {
        skipFiredRef.current = true;
        clearInterval(interval);
        skipTurn();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [turnStartTime, status, isMyTurn, skipTurn]);

  // Detect mismatch → trigger shake animation
  useEffect(() => {
    const flipped = deck.reduce<number[]>((acc, c, i) => {
      if (c.flipped && !c.matched) acc.push(i);
      return acc;
    }, []);

    if (
      flipped.length === 2 &&
      prevFlippedRef.current.length !== 2 &&
      deck[flipped[0]].pairId !== deck[flipped[1]].pairId
    ) {
      setTimeout(() => {
        setShakingIndices(new Set(flipped));
        setTimeout(() => setShakingIndices(new Set()), 620);
      }, 250);
    }
    prevFlippedRef.current = flipped;
  }, [deck]);

  if (status !== 'playing') return null;

  const timerPct = timeLeft / TURN_DURATION;
  const timerColor = timerPct > 0.5 ? '#2a9d8f' : timerPct > 0.25 ? '#f4a261' : '#e63946';
  const timerUrgent = timerPct <= 0.25;

  return (
    <div className="board-container">
      {/* Turn indicator */}
      <div className="turn-indicator" style={{ borderColor: currentPlayerColor }}>
        <span className="turn-player" style={{ color: currentPlayerColor }}>
          {isMyTurn ? 'Your turn!' : `${players[turnIndex]?.name}'s turn`}
        </span>
        {myCombo >= 2 && isMyTurn && (
          <span className="combo-badge">
            {myCombo >= 4 ? '🔥🔥' : '🔥'} x{myCombo} Combo!
          </span>
        )}
      </div>

      {/* Timer bar */}
      <div className="timer-bar-wrap">
        <div
          className={`timer-bar${timerUrgent ? ' urgent' : ''}`}
          style={{ width: `${timerPct * 100}%`, background: timerColor }}
        />
        <span className="timer-label" style={{ color: timerColor }}>
          {timeLeft}s
        </span>
      </div>

      {/* Board meta + progress */}
      <div className="board-meta">
        <span>{activeTheme.icon} {activeTheme.name}</span>
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct * 100}%` }} />
          </div>
          <span className="progress-label">{matchedPairs}/{pairsCount} pairs</span>
        </div>
      </div>

      {/* Player turn avatars */}
      <div className="player-turns">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`player-pip${i === turnIndex ? ' active' : ''}`}
            style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            title={p.name}
          >
            {p.name.charAt(0).toUpperCase()}
            {combos[p.id] >= 2 && <span className="pip-combo">{combos[p.id]}</span>}
          </div>
        ))}
      </div>

      {/* Card grid */}
      <div className="board" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {deck.map((card, index) => {
          const matcherIndex = card.matchedBy
            ? players.findIndex(p => p.id === card.matchedBy)
            : -1;
          const matchColor = matcherIndex >= 0
            ? PLAYER_COLORS[matcherIndex % PLAYER_COLORS.length]
            : undefined;

          const isClickable = isMyTurn && !card.flipped && !card.matched;

          return (
            <div
              key={card.id}
              className={[
                'card',
                card.flipped || card.matched ? 'flipped' : '',
                card.matched ? 'matched' : '',
                shakingIndices.has(index) ? 'shake' : '',
                isClickable ? 'clickable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => isClickable && flipCard(index)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <div className="card-front-dots" />
                  <span className="card-front-mark">?</span>
                </div>
                <div
                  className="card-back"
                  style={matchColor ? { boxShadow: `0 0 0 3px ${matchColor}, 0 8px 20px rgba(0,0,0,0.15)` } : undefined}
                >
                  <img className="card-image" src={card.image} alt={card.label} loading="lazy" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
