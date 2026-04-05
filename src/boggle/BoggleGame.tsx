import { useState, useEffect, useRef } from 'react';

// Standard Boggle 16 dice (each string = faces of one die)
const BOGGLE_DICE = [
  'AAEEGN', 'ELRTTY', 'AOOTTW', 'ABBJOO',
  'EHRTVW', 'CIMOTU', 'DISTTY', 'EIOSST',
  'DELRVY', 'ACHOPS', 'HIMNQU', 'EEINSU',
  'EEGHNW', 'AFFKPS', 'HLNNRZ', 'DEILRX',
];

function generateGrid(): string[] {
  const shuffled = [...BOGGLE_DICE].sort(() => Math.random() - 0.5);
  return shuffled.map(die => die[Math.floor(Math.random() * die.length)]);
}

function isAdjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / 4), ac = a % 4;
  const br = Math.floor(b / 4), bc = b % 4;
  return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1 && a !== b;
}

function wordScore(len: number): number {
  if (len < 3) return 0;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
}

function totalScore(words: string[], shared: Set<string>): number {
  return words.filter(w => !shared.has(w)).reduce((s, w) => s + wordScore(w.length), 0);
}

const TURN_SECONDS = 120;
type Phase = 'setup' | 'p1turn' | 'handoff' | 'p2turn' | 'results';

export function BoggleGame() {
  const [names, setNames] = useState(['', '']);
  const [phase, setPhase] = useState<Phase>('setup');
  const [grid, setGrid] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [p1Words, setP1Words] = useState<string[]>([]);
  const [p2Words, setP2Words] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [flash, setFlash] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextPhaseRef = useRef<Phase>('handoff');

  const currentWord = selected.map(i => grid[i]).join('');

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = (next: Phase) => {
    stopTimer();
    nextPhaseRef.current = next;
    let t = TURN_SECONDS;
    setTimeLeft(t);
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        stopTimer();
        setPhase(nextPhaseRef.current);
      }
    }, 1000);
  };

  useEffect(() => () => stopTimer(), []);

  const handleStart = () => {
    if (!names[0].trim() || !names[1].trim()) { alert('Enter both player names!'); return; }
    setGrid(generateGrid());
    setP1Words([]);
    setP2Words([]);
    setSelected([]);
    setFlash('');
    setPhase('p1turn');
    startTimer('handoff');
  };

  const handleCellClick = (idx: number) => {
    if (phase !== 'p1turn' && phase !== 'p2turn') return;

    if (selected.includes(idx)) {
      if (idx === selected[selected.length - 1]) {
        setSelected(s => s.slice(0, -1));
      } else {
        setSelected([idx]);
      }
      return;
    }

    if (selected.length === 0) { setSelected([idx]); return; }

    const last = selected[selected.length - 1];
    if (!isAdjacent(last, idx)) {
      setFlash('Not adjacent!');
      setTimeout(() => setFlash(''), 1200);
      return;
    }
    setSelected(s => [...s, idx]);
  };

  const submitWord = () => {
    if (phase !== 'p1turn' && phase !== 'p2turn') return;
    const word = currentWord.toLowerCase();
    const words = phase === 'p1turn' ? p1Words : p2Words;
    const setWords = phase === 'p1turn' ? setP1Words : setP2Words;

    if (word.length < 3) {
      setFlash('Too short! (min 3 letters)');
    } else if (words.includes(word)) {
      setFlash('Already found!');
    } else {
      setWords(prev => [...prev, word]);
      setFlash(`✓ +${wordScore(word.length)} pts`);
    }
    setSelected([]);
    setTimeout(() => setFlash(''), 1200);
  };

  const handleP2Start = () => {
    setSelected([]);
    setFlash('');
    setPhase('p2turn');
    startTimer('results');
  };

  const resetGame = () => {
    stopTimer();
    setPhase('setup');
    setGrid([]);
    setSelected([]);
    setP1Words([]);
    setP2Words([]);
    setFlash('');
  };

  // ── Setup ──────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="boggle-setup">
        <p className="boggle-setup-desc">
          Find words on a 4×4 grid — letters must be adjacent (including diagonal).
          Each player gets 2 minutes. Shared words don't count!
        </p>
        <div className="boggle-setup-players">
          {[0, 1].map(i => (
            <div key={i} className="boggle-setup-player">
              <label className="boggle-setup-label">Player {i + 1}</label>
              <input
                className="boggle-setup-input"
                type="text"
                placeholder={`Player ${i + 1} name`}
                value={names[i]}
                maxLength={18}
                onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); }}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
            </div>
          ))}
        </div>
        <button className="boggle-start-btn" onClick={handleStart}>Start Game!</button>
        <div className="boggle-scoring-legend">
          <span>3–4 letters: 1pt</span>
          <span>5: 2pts</span>
          <span>6: 3pts</span>
          <span>7: 5pts</span>
          <span>8+: 11pts</span>
        </div>
      </div>
    );
  }

  // ── Handoff ────────────────────────────────────────────────────
  if (phase === 'handoff') {
    return (
      <div className="boggle-handoff">
        <div className="boggle-handoff-icon">🔄</div>
        <h3 className="boggle-handoff-title">Time's up, {names[0]}!</h3>
        <p className="boggle-handoff-msg">
          Pass the device to <strong>{names[1]}</strong>.
        </p>
        <p className="boggle-handoff-hint">Don't peek at the words list!</p>
        <button className="boggle-next-btn" onClick={handleP2Start}>
          I'm {names[1]} — Ready!
        </button>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────
  if (phase === 'results') {
    const shared = new Set(p1Words.filter(w => p2Words.includes(w)));
    const p1Score = totalScore(p1Words, shared);
    const p2Score = totalScore(p2Words, shared);
    const winner = p1Score > p2Score ? names[0] : p2Score > p1Score ? names[1] : null;

    return (
      <div className="boggle-results">
        <div className="boggle-results-banner">
          <span className="boggle-trophy">{winner ? '🏆' : '🤝'}</span>
          <span className="boggle-results-headline">
            {winner ? `${winner} wins!` : "It's a tie!"}
          </span>
        </div>
        <div className="boggle-results-cols">
          {[
            { name: names[0], words: p1Words, score: p1Score },
            { name: names[1], words: p2Words, score: p2Score },
          ].map(({ name, words, score }) => (
            <div key={name} className="boggle-results-col">
              <div className="boggle-results-col-head">
                <span className="boggle-results-name">{name}</span>
                <span className="boggle-results-score">{score} pts</span>
              </div>
              <ul className="boggle-word-list">
                {words.map(w => (
                  <li key={w} className={`boggle-word-item${shared.has(w) ? ' shared' : ''}`}>
                    <span className="boggle-word-text">{w}</span>
                    {shared.has(w)
                      ? <span className="boggle-word-pts shared">shared</span>
                      : <span className="boggle-word-pts">+{wordScore(w.length)}</span>
                    }
                  </li>
                ))}
                {words.length === 0 && (
                  <li className="boggle-word-empty">No words found</li>
                )}
              </ul>
            </div>
          ))}
        </div>
        {shared.size > 0 && (
          <p className="boggle-shared-note">
            Shared words don't count for either player.
          </p>
        )}
        <div className="boggle-results-actions">
          <button className="boggle-again-btn" onClick={handleStart}>Play Again</button>
          <button className="boggle-reset-btn" onClick={resetGame}>Change Names</button>
        </div>
      </div>
    );
  }

  // ── Game Turn (p1turn / p2turn) ────────────────────────────────
  const isP1 = phase === 'p1turn';
  const currentWords = isP1 ? p1Words : p2Words;
  const playerName = names[isP1 ? 0 : 1];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerUrgent = timeLeft <= 30;

  return (
    <div className="boggle-game">
      {/* Header bar */}
      <div className="boggle-header">
        <span className="boggle-player-label">{playerName}'s turn</span>
        <span className={`boggle-timer${timerUrgent ? ' urgent' : ''}`}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      {/* 4×4 grid */}
      <div className="boggle-grid">
        {grid.map((letter, i) => {
          const selIdx = selected.indexOf(i);
          const isSelected = selIdx !== -1;
          const isLast = isSelected && selIdx === selected.length - 1;
          return (
            <button
              key={i}
              className={`boggle-cell${isSelected ? ' selected' : ''}${isLast ? ' last' : ''}`}
              onClick={() => handleCellClick(i)}
            >
              <span className="boggle-letter">{letter === 'Q' ? 'Qu' : letter}</span>
              {isSelected && (
                <span className="boggle-cell-order">{selIdx + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Word builder */}
      <div className="boggle-builder">
        <div className="boggle-current-word">
          {currentWord
            ? currentWord
            : <span className="boggle-placeholder">Click tiles to build a word</span>
          }
        </div>
        <div className="boggle-builder-btns">
          <button className="boggle-clear-btn" onClick={() => setSelected([])}>Clear</button>
          <button
            className="boggle-submit-btn"
            onClick={submitWord}
            disabled={currentWord.length < 3}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Flash feedback */}
      {flash && <div className="boggle-flash">{flash}</div>}

      {/* Found words */}
      <div className="boggle-found">
        <div className="boggle-found-header">
          {currentWords.length} word{currentWords.length !== 1 ? 's' : ''} ·{' '}
          {currentWords.reduce((s, w) => s + wordScore(w.length), 0)} pts
        </div>
        <div className="boggle-found-chips">
          {currentWords.map(w => (
            <span key={w} className="boggle-found-chip">
              {w}
              <span className="boggle-chip-pts">+{wordScore(w.length)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
