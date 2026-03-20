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

// Square number → grid position {gridRow, col}
function squareToGrid(sq: number): { gridRow: number; col: number } {
  const rowFromBottom = Math.floor((sq - 1) / 10);
  const gridRow = 9 - rowFromBottom;
  const col =
    rowFromBottom % 2 === 0
      ? (sq - 1) % 10
      : 9 - ((sq - 1) % 10);
  return { gridRow, col };
}

// Grid position → exact pixel center, given actual board outer pixel dimensions
function gridToPixel(
  gridRow: number,
  col: number,
  boardW: number,
  boardH: number,
): { x: number; y: number } {
  const border = 2;
  const gap = 2;
  const cellW = (boardW - 2 * border - 9 * gap) / 10;
  const cellH = (boardH - 2 * border - 9 * gap) / 10;
  return {
    x: border + col * (cellW + gap) + cellW / 2,
    y: border + gridRow * (cellH + gap) + cellH / 2,
  };
}

function squareToPixel(sq: number, bw: number, bh: number) {
  const { gridRow, col } = squareToGrid(sq);
  return gridToPixel(gridRow, col, bw, bh);
}

// ─── Snake SVG path ──────────────────────────────────────────────────────────
// Proper S-curve: control points on opposite sides of the path (perpendicular)
function SnakeSvgPath({
  from, to, bw, bh,
}: { from: number; to: number; bw: number; bh: number }) {
  const p1 = squareToPixel(from, bw, bh);
  const p2 = squareToPixel(to, bw, bh);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Perpendicular offsets on opposite sides → true S-curve
  const k = 0.28;
  const cx1 = p1.x - dy * k;
  const cy1 = p1.y + dx * k;
  const cx2 = p2.x + dy * k;
  const cy2 = p2.y - dx * k;
  const d = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

  return (
    <g>
      {/* outer glow */}
      <path d={d} fill="none" stroke="rgba(150,0,0,0.18)" strokeWidth="8" strokeLinecap="round" />
      {/* body outline */}
      <path d={d} fill="none" stroke="#7b1010" strokeWidth="5" strokeLinecap="round" />
      {/* body fill */}
      <path d={d} fill="none" stroke="#e63946" strokeWidth="3.5" strokeLinecap="round" />
      {/* scale dashes */}
      <path d={d} fill="none" stroke="rgba(255,120,120,0.55)"
        strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 7" />
      {/* head */}
      <circle cx={p1.x} cy={p1.y} r="5" fill="#7b1010" />
      <circle cx={p1.x} cy={p1.y} r="3.5" fill="#e63946" />
      {/* eyes */}
      <circle cx={p1.x - 1.2} cy={p1.y - 1.2} r="0.9" fill="white" />
      <circle cx={p1.x + 1.2} cy={p1.y - 1.2} r="0.9" fill="white" />
      {/* tail tip */}
      <circle cx={p2.x} cy={p2.y} r="2.8" fill="#7b1010" />
      <circle cx={p2.x} cy={p2.y} r="1.8" fill="#e63946" opacity="0.7" />
    </g>
  );
}

// ─── Ladder SVG path ─────────────────────────────────────────────────────────
function LadderSvgPath({
  from, to, bw, bh,
}: { from: number; to: number; bw: number; bh: number }) {
  const p1 = squareToPixel(from, bw, bh);
  const p2 = squareToPixel(to, bw, bh);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  // perpendicular unit vector, scaled by rail half-width
  const railHalf = 3;
  const px = (-dy / len) * railHalf;
  const py = (dx / len) * railHalf;

  const rungCount = Math.max(2, Math.floor(len / 20));
  const rungs = Array.from({ length: rungCount }, (_, i) => {
    const t = (i + 1) / (rungCount + 1);
    return { rx: p1.x + dx * t, ry: p1.y + dy * t };
  });

  return (
    <g>
      {/* rail shadows */}
      <line x1={p1.x + px + 0.8} y1={p1.y + py + 0.8} x2={p2.x + px + 0.8} y2={p2.y + py + 0.8}
        stroke="rgba(0,0,0,0.18)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1={p1.x - px + 0.8} y1={p1.y - py + 0.8} x2={p2.x - px + 0.8} y2={p2.y - py + 0.8}
        stroke="rgba(0,0,0,0.18)" strokeWidth="4.5" strokeLinecap="round" />
      {/* rails */}
      <line x1={p1.x + px} y1={p1.y + py} x2={p2.x + px} y2={p2.y + py}
        stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      <line x1={p1.x - px} y1={p1.y - py} x2={p2.x - px} y2={p2.y - py}
        stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      {/* rail highlights */}
      <line x1={p1.x + px} y1={p1.y + py} x2={p2.x + px} y2={p2.y + py}
        stroke="rgba(253,186,116,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={p1.x - px} y1={p1.y - py} x2={p2.x - px} y2={p2.y - py}
        stroke="rgba(253,186,116,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      {/* rungs */}
      {rungs.map((r, i) => (
        <g key={i}>
          <line x1={r.rx + px + 0.5} y1={r.ry + py + 0.5} x2={r.rx - px + 0.5} y2={r.ry - py + 0.5}
            stroke="rgba(0,0,0,0.15)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1={r.rx + px} y1={r.ry + py} x2={r.rx - px} y2={r.ry - py}
            stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={r.rx + px} y1={r.ry + py} x2={r.rx - px} y2={r.ry - py}
            stroke="rgba(253,211,77,0.5)" strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}
      {/* base dot */}
      <circle cx={p1.x} cy={p1.y} r="4" fill="#92400e" />
      <circle cx={p1.x} cy={p1.y} r="2.5" fill="#fbbf24" />
      {/* top dot */}
      <circle cx={p2.x} cy={p2.y} r="4" fill="#92400e" />
      <circle cx={p2.x} cy={p2.y} r="2.5" fill="#34d399" />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SnakeBoard() {
  const {
    players, positions, turnIndex, lastRoll, lastEvent,
    status, winnerId, playerId, rollDice, resetGame,
  } = useSnakeStore();

  const isMyTurn = players[turnIndex]?.id === playerId;
  const isHost = players[0]?.id === playerId;
  const winner = winnerId ? players.find(p => p.id === winnerId) : null;
  const winnerIndex = winnerId ? players.findIndex(p => p.id === winnerId) : -1;

  // ── Measure the real board pixel dimensions ──────────────────────────────
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardDims, setBoardDims] = useState({ w: 520, h: 520 });

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setBoardDims({ w: rect.width, h: rect.height });
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Dice roll animation ───────────────────────────────────────────────────
  const [rolling, setRolling] = useState(false);
  const [displayFace, setDisplayFace] = useState(0);
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRollRef = useRef(lastRoll);

  useEffect(() => {
    if (lastRoll !== lastRollRef.current && rolling) {
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

  // ── Player-on-square map ──────────────────────────────────────────────────
  const playerOnSquare: Record<number, number[]> = {};
  players.forEach((p, i) => {
    const sq = positions[p.id] || 0;
    if (sq > 0) {
      if (!playerOnSquare[sq]) playerOnSquare[sq] = [];
      playerOnSquare[sq].push(i);
    }
  });

  const cells: { gridRow: number; col: number; square: number }[] = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++)
      cells.push({ gridRow: r, col: c, square: squareAt(r, c) });

  const diceFace = rolling
    ? DICE_FACES[displayFace]
    : lastRoll ? DICE_FACES[lastRoll - 1] : '🎲';

  return (
    <div className="snake-layout">

      {/* Player chips */}
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
            {isMyTurn && (
              <button
                className={`snake-roll-btn${rolling ? ' rolling' : ''}`}
                onClick={handleRoll}
                disabled={rolling}
              >
                {rolling ? 'Rolling…' : '🎲 Roll!'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Last event */}
      {lastEvent && <div className="snake-event">{lastEvent}</div>}

      {/* Board + SVG overlay */}
      <div className="snake-board-wrapper">
        <div className="snake-board" ref={boardRef}>
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

        {/* SVG overlay — exact pixel coordinates via ResizeObserver */}
        <svg
          className="snake-svg-overlay"
          viewBox={`0 0 ${boardDims.w} ${boardDims.h}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {Object.entries(LADDERS).map(([from, to]) => (
            <LadderSvgPath
              key={`l-${from}`}
              from={Number(from)} to={to}
              bw={boardDims.w} bh={boardDims.h}
            />
          ))}
          {Object.entries(SNAKES).map(([from, to]) => (
            <SnakeSvgPath
              key={`s-${from}`}
              from={Number(from)} to={to}
              bw={boardDims.w} bh={boardDims.h}
            />
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
