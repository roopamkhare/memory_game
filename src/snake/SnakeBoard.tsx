import { useState, useEffect, useRef } from 'react';
import { useSnakeStore, SNAKE_COLORS, SNAKES, LADDERS } from './snakeStore';

const ANIMAL_ICONS = ['🐶', '🐱', '🦊', '🐻', '🐸', '🐧'];
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Maps grid position (row from top 0-9, col 0-9) → board square number 1-100
function squareAt(gridRow: number, col: number): number {
  const rowFromBottom = 9 - gridRow;
  return rowFromBottom % 2 === 0
    ? rowFromBottom * 10 + col + 1
    : rowFromBottom * 10 + (9 - col) + 1;
}

// Convert square number (1-100) to SVG center coordinate (viewBox 0-100)
function squareToPos(sq: number): { x: number; y: number } {
  const rowFromBottom = Math.floor((sq - 1) / 10);
  const gridRow = 9 - rowFromBottom;
  const col =
    rowFromBottom % 2 === 0
      ? (sq - 1) % 10
      : 9 - ((sq - 1) % 10);
  return { x: col * 10 + 5, y: gridRow * 10 + 5 };
}

function SnakeSvgPath({ from, to }: { from: number; to: number }) {
  const p1 = squareToPos(from);
  const p2 = squareToPos(to);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // S-curve control points for a wiggly snake look
  const cx1 = p1.x + dy * 0.4 - dx * 0.1;
  const cy1 = p1.y - dx * 0.4 - dy * 0.1;
  const cx2 = p2.x + dy * 0.4 + dx * 0.1;
  const cy2 = p2.y - dx * 0.4 + dy * 0.1;
  return (
    <g>
      {/* glow shadow */}
      <path
        d={`M ${p1.x} ${p1.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${p2.x} ${p2.y}`}
        fill="none" stroke="rgba(180,0,0,0.2)" strokeWidth="5" strokeLinecap="round"
      />
      {/* main snake body */}
      <path
        d={`M ${p1.x} ${p1.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${p2.x} ${p2.y}`}
        fill="none" stroke="rgba(210,40,40,0.82)" strokeWidth="2.4" strokeLinecap="round"
      />
      {/* head dot */}
      <circle cx={p1.x} cy={p1.y} r="2.8" fill="#e63946" />
      {/* tail dot */}
      <circle cx={p2.x} cy={p2.y} r="1.6" fill="#e63946" opacity="0.55" />
    </g>
  );
}

function LadderSvgPath({ from, to }: { from: number; to: number }) {
  const p1 = squareToPos(from);
  const p2 = squareToPos(to);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const px = (-dy / len) * 1.5;
  const py = (dx / len) * 1.5;
  const rungCount = Math.max(2, Math.floor(len / 8));
  const rungs = Array.from({ length: rungCount }, (_, i) => {
    const t = (i + 1) / (rungCount + 1);
    return { rx: p1.x + dx * t, ry: p1.y + dy * t };
  });
  return (
    <g>
      {/* shadow */}
      <line x1={p1.x + px} y1={p1.y + py} x2={p2.x + px} y2={p2.y + py}
        stroke="rgba(0,0,0,0.12)" strokeWidth="4" strokeLinecap="round" />
      <line x1={p1.x - px} y1={p1.y - py} x2={p2.x - px} y2={p2.y - py}
        stroke="rgba(0,0,0,0.12)" strokeWidth="4" strokeLinecap="round" />
      {/* rails */}
      <line x1={p1.x + px} y1={p1.y + py} x2={p2.x + px} y2={p2.y + py}
        stroke="rgba(245,158,11,0.88)" strokeWidth="2.2" strokeLinecap="round" />
      <line x1={p1.x - px} y1={p1.y - py} x2={p2.x - px} y2={p2.y - py}
        stroke="rgba(245,158,11,0.88)" strokeWidth="2.2" strokeLinecap="round" />
      {/* rungs */}
      {rungs.map((r, i) => (
        <line key={i}
          x1={r.rx + px} y1={r.ry + py} x2={r.rx - px} y2={r.ry - py}
          stroke="rgba(253,211,77,0.9)" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {/* base dot */}
      <circle cx={p1.x} cy={p1.y} r="2.2" fill="#f59e0b" />
      {/* top dot */}
      <circle cx={p2.x} cy={p2.y} r="2.2" fill="#2a9d8f" />
    </g>
  );
}

export function SnakeBoard() {
  const {
    players, positions, turnIndex, lastRoll, lastEvent,
    status, winnerId, playerId, rollDice, resetGame,
  } = useSnakeStore();

  const isMyTurn = players[turnIndex]?.id === playerId;
  const isHost = players[0]?.id === playerId;
  const winner = winnerId ? players.find(p => p.id === winnerId) : null;
  const winnerIndex = winnerId ? players.findIndex(p => p.id === winnerId) : -1;

  // Dice roll animation state
  const [rolling, setRolling] = useState(false);
  const [displayFace, setDisplayFace] = useState(0);
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRollRef = useRef(lastRoll);

  useEffect(() => {
    if (lastRoll !== lastRollRef.current && rolling) {
      // Firebase result arrived — stop animation shortly after
      setTimeout(() => {
        if (rollInterval.current) clearInterval(rollInterval.current);
        setRolling(false);
      }, 350);
    }
    lastRollRef.current = lastRoll;
  }, [lastRoll, rolling]);

  const handleRoll = async () => {
    if (rolling) return;
    setRolling(true);
    setDisplayFace(Math.floor(Math.random() * 6));
    rollInterval.current = setInterval(() => {
      setDisplayFace(Math.floor(Math.random() * 6));
    }, 75);
    await rollDice();
  };

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

  const diceFace = rolling
    ? DICE_FACES[displayFace]
    : lastRoll ? DICE_FACES[lastRoll - 1] : '🎲';

  return (
    <div className="snake-layout">

      {/* Player chips row */}
      <div className="snake-players">
        {players.map((p, i) => {
          const pos = positions[p.id] || 0;
          const color = SNAKE_COLORS[i % SNAKE_COLORS.length];
          const isActive = i === turnIndex && status === 'playing';
          return (
            <div
              key={p.id}
              className={`snake-player-chip${isActive ? ' active' : ''}${p.id === playerId ? ' mine' : ''}`}
              style={{ '--player-color': color } as React.CSSProperties}
            >
              <span className="snake-chip-avatar">{ANIMAL_ICONS[i % ANIMAL_ICONS.length]}</span>
              <div className="snake-chip-info">
                <span className="snake-chip-name">{p.name}</span>
                <span className="snake-chip-pos">sq {pos || '—'}</span>
              </div>
              {isActive && <span className="snake-chip-turn-dot" />}
            </div>
          );
        })}
      </div>

      {/* Turn banner */}
      {status === 'playing' && (
        <div className={`snake-turn-banner${isMyTurn ? ' my-turn' : ''}`}>
          <span className="snake-turn-animal">
            {ANIMAL_ICONS[turnIndex % ANIMAL_ICONS.length]}
          </span>
          <span className={`snake-turn-label${isMyTurn ? ' my-turn-label' : ''}`}>
            {isMyTurn ? '⚡ Your Turn!' : `${players[turnIndex]?.name}'s turn…`}
          </span>
          <div className="snake-roll-area">
            <span className={`snake-dice${rolling ? ' rolling' : ''}`}>{diceFace}</span>
            {isMyTurn ? (
              <button
                className={`snake-roll-btn${rolling ? ' rolling' : ''}`}
                onClick={handleRoll}
                disabled={rolling}
              >
                {rolling ? 'Rolling…' : '🎲 Roll!'}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Last event */}
      {lastEvent && <div className="snake-event">{lastEvent}</div>}

      {/* Board + SVG overlay */}
      <div className="snake-board-wrapper">
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

            const snakeDest = SNAKES[square];
            const ladderDest = LADDERS[square];

            return (
              <div
                key={square}
                className={cellClass}
                title={
                  isSnakeHead ? `🐍 Snake! Slides to ${snakeDest}` :
                  isLadderBase ? `🪜 Ladder! Climbs to ${ladderDest}` :
                  undefined
                }
              >
                <span className="snake-sq-num">{square}</span>

                {isSnakeHead && (
                  <div className="snake-indicator-group">
                    <span className="snake-indicator">🐍</span>
                    <span className="snake-dest-label">↓{snakeDest}</span>
                  </div>
                )}
                {isLadderBase && (
                  <div className="snake-indicator-group">
                    <span className="snake-indicator">🪜</span>
                    <span className="snake-dest-label">↑{ladderDest}</span>
                  </div>
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
                        {ANIMAL_ICONS[pi % ANIMAL_ICONS.length]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SVG overlay — snakes and ladders drawn as paths across the board */}
        <svg
          className="snake-svg-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Object.entries(LADDERS).map(([from, to]) => (
            <LadderSvgPath key={`l-${from}`} from={Number(from)} to={to} />
          ))}
          {Object.entries(SNAKES).map(([from, to]) => (
            <SnakeSvgPath key={`s-${from}`} from={Number(from)} to={to} />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="snake-legend">
        <span><span style={{ color: '#e63946' }}>●</span> Snake: slide down</span>
        <span><span style={{ color: '#f59e0b' }}>●</span> Ladder: climb up</span>
        <span>🏆 Square 100 = Win!</span>
      </div>

      {/* Game over */}
      {status === 'finished' && (
        <div className="pig-game-over">
          <div className="snake-win-burst">
            {['🎉', '🎊', '⭐', '🎈', '✨'].map((e, i) => (
              <span key={i} className="snake-burst-emoji" style={{ '--burst-i': i } as React.CSSProperties}>{e}</span>
            ))}
          </div>
          <p className="pig-go-emoji">
            {winnerIndex >= 0 ? ANIMAL_ICONS[winnerIndex % ANIMAL_ICONS.length] : '🏆'}
          </p>
          <h2>Game Over!</h2>
          <p className="winner-text">{winner ? `${winner.name} wins! 🎉` : 'Game finished!'}</p>
          {isHost
            ? <button className="play-again-btn" onClick={resetGame}>Play Again</button>
            : <p className="waiting-text">Waiting for host to restart…</p>
          }
        </div>
      )}
    </div>
  );
}
