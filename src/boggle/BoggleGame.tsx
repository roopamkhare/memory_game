import { useState, useEffect, useRef } from 'react';
import { useBoggleStore, BOGGLE_COLORS, BOGGLE_DURATION } from './boggleStore';

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

function wordsFromFirebase(raw: Record<string, true> | undefined): string[] {
  return raw ? Object.keys(raw) : [];
}

function totalScore(words: string[], shared: Set<string>): number {
  return words.filter(w => !shared.has(w)).reduce((s, w) => s + wordScore(w.length), 0);
}

export function BoggleGame() {
  const {
    status, players, grid, timeStart, words,
    playerId, submitWord, finishGame, playAgain, leaveGame,
  } = useBoggleStore();

  const [selected, setSelected] = useState<number[]>([]);
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState<'ok' | 'err' | 'info'>('info');
  const [timeLeft, setTimeLeft] = useState(BOGGLE_DURATION);

  const selectedRef = useRef<number[]>([]);
  const isDragging = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  const updateSelected = (s: number[]) => { selectedRef.current = s; setSelected(s); };

  // Derive my words from Firebase
  const myWords = playerId ? wordsFromFirebase(words[playerId]) : [];
  const myWordsRef = useRef<string[]>([]);
  myWordsRef.current = myWords;

  // Timer — driven by timeStart from Firebase
  useEffect(() => {
    if (status !== 'playing') return;
    finishedRef.current = false;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - timeStart) / 1000);
      const remaining = Math.max(0, BOGGLE_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0 && !finishedRef.current) {
        finishedRef.current = true;
        void finishGame();
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [status, timeStart, finishGame]);

  // ── Pointer drag handlers ──────────────────────────────────────
  const getCellIndex = (clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const cells = gridRef.current.querySelectorAll<HTMLElement>('.boggle-cell');
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return i;
      }
    }
    return null;
  };

  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status !== 'playing') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    const idx = getCellIndex(e.clientX, e.clientY);
    updateSelected(idx !== null ? [idx] : []);
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const idx = getCellIndex(e.clientX, e.clientY);
    if (idx === null) return;
    const prev = selectedRef.current;
    if (prev.includes(idx)) {
      if (prev.length >= 2 && prev[prev.length - 2] === idx) {
        updateSelected(prev.slice(0, -1));
      }
      return;
    }
    if (prev.length > 0 && !isAdjacent(prev[prev.length - 1], idx)) return;
    updateSelected([...prev, idx]);
  };

  const handleGridPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    void submitWordFromSelected();
  };

  const handleGridPointerCancel = () => {
    isDragging.current = false;
    updateSelected([]);
  };

  const submitWordFromSelected = async () => {
    const sel = selectedRef.current;
    if (status !== 'playing' || sel.length === 0) return;

    const word = sel.map(i => grid[i]).join('').toLowerCase();
    updateSelected([]);

    if (word.length < 3) {
      setFlash('Too short! (min 3 letters)'); setFlashType('err');
      setTimeout(() => setFlash(''), 1200);
      return;
    }
    if (myWordsRef.current.includes(word)) {
      setFlash('Already found!'); setFlashType('err');
      setTimeout(() => setFlash(''), 1200);
      return;
    }

    setFlash('Checking…'); setFlashType('info');
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (res.ok) {
        await submitWord(word);
        setFlash(`✓ +${wordScore(word.length)} pts`); setFlashType('ok');
      } else {
        setFlash('Not a word!'); setFlashType('err');
      }
    } catch {
      // Offline — accept the word
      await submitWord(word);
      setFlash(`✓ +${wordScore(word.length)} pts`); setFlashType('ok');
    }
    setTimeout(() => setFlash(''), 1400);
  };

  // ── Results ────────────────────────────────────────────────────
  if (status === 'finished') {
    const playerWordLists = players.map(p => ({
      player: p,
      wordList: wordsFromFirebase(words[p.id]),
      color: BOGGLE_COLORS[players.indexOf(p) % BOGGLE_COLORS.length],
    }));

    // Words found by more than one player are shared
    const wordCounts: Record<string, number> = {};
    playerWordLists.forEach(({ wordList }) =>
      wordList.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; })
    );
    const shared = new Set(Object.entries(wordCounts).filter(([, c]) => c > 1).map(([w]) => w));

    const scored = playerWordLists
      .map(p => ({ ...p, score: totalScore(p.wordList, shared) }))
      .sort((a, b) => b.score - a.score);

    const winner = scored[0].score > scored[1].score ? scored[0].player.name : null;
    const isHost = players[0]?.id === playerId;

    return (
      <div className="boggle-results">
        <div className="boggle-results-banner">
          <span className="boggle-trophy">{winner ? '🏆' : '🤝'}</span>
          <span className="boggle-results-headline">
            {winner ? `${winner} wins!` : "It's a tie!"}
          </span>
        </div>

        {/* Leaderboard */}
        <div className="boggle-leaderboard">
          {scored.map((p, rank) => (
            <div key={p.player.id} className="boggle-lb-row" style={{ borderColor: p.color }}>
              <span className="boggle-lb-rank">#{rank + 1}</span>
              <span className="boggle-lb-avatar" style={{ background: p.color }}>
                {p.player.name.charAt(0).toUpperCase()}
              </span>
              <span className="boggle-lb-name">{p.player.name}</span>
              <span className="boggle-lb-score" style={{ color: p.color }}>{p.score} pts</span>
              <span className="boggle-lb-count">{p.wordList.filter(w => !shared.has(w)).length} words</span>
            </div>
          ))}
        </div>

        {/* Per-player word lists */}
        <div className={`boggle-results-cols cols-${players.length}`}>
          {scored.map(({ player, wordList, color }) => (
            <div key={player.id} className="boggle-results-col">
              <div className="boggle-results-col-head">
                <span className="boggle-results-name" style={{ color }}>{player.name}</span>
                <span className="boggle-results-score">{totalScore(wordList, shared)} pts</span>
              </div>
              <ul className="boggle-word-list">
                {wordList.map(w => (
                  <li key={w} className={`boggle-word-item${shared.has(w) ? ' shared' : ''}`}>
                    <span className="boggle-word-text">{w}</span>
                    {shared.has(w)
                      ? <span className="boggle-word-pts shared">shared</span>
                      : <span className="boggle-word-pts">+{wordScore(w.length)}</span>
                    }
                  </li>
                ))}
                {wordList.length === 0 && <li className="boggle-word-empty">No words found</li>}
              </ul>
            </div>
          ))}
        </div>

        {shared.size > 0 && (
          <p className="boggle-shared-note">Shared words (found by multiple players) don't count.</p>
        )}

        <div className="boggle-results-actions">
          {isHost
            ? <button className="boggle-again-btn" onClick={playAgain}>Play Again</button>
            : <p className="waiting-hint">Waiting for host to start a new round...</p>
          }
          <button className="boggle-reset-btn" onClick={leaveGame}>Leave Game</button>
        </div>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────
  const currentWord = selected.map(i => grid[i]).join('');
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerUrgent = timeLeft <= 30;
  const myScore = myWords.reduce((s, w) => s + wordScore(w.length), 0);

  return (
    <div className="boggle-game">
      {/* Header */}
      <div className="boggle-header">
        <span className="boggle-player-label">
          {myWords.length} word{myWords.length !== 1 ? 's' : ''} · {myScore} pts
        </span>
        <span className={`boggle-timer${timerUrgent ? ' urgent' : ''}`}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Other players' live word counts */}
      <div className="boggle-rivals">
        {players.filter(p => p.id !== playerId).map((p) => {
          const count = wordsFromFirebase(words[p.id]).length;
          const color = BOGGLE_COLORS[(players.indexOf(p)) % BOGGLE_COLORS.length];
          return (
            <div key={p.id} className="boggle-rival-chip" style={{ borderColor: color }}>
              <span className="boggle-rival-avatar" style={{ background: color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="boggle-rival-name">{p.name}</span>
              <span className="boggle-rival-count" style={{ color }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* 4×4 grid */}
      <div
        ref={gridRef}
        className="boggle-grid"
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerCancel}
      >
        {grid.map((letter, i) => {
          const selIdx = selected.indexOf(i);
          const isSelected = selIdx !== -1;
          const isLast = isSelected && selIdx === selected.length - 1;
          return (
            <div
              key={i}
              className={`boggle-cell${isSelected ? ' selected' : ''}${isLast ? ' last' : ''}`}
            >
              <span className="boggle-letter">{letter === 'Q' ? 'Qu' : letter}</span>
              {isSelected && <span className="boggle-cell-order">{selIdx + 1}</span>}
            </div>
          );
        })}
      </div>

      {/* Word display */}
      <div className="boggle-current-word">
        {currentWord
          ? currentWord
          : <span className="boggle-placeholder">Drag across tiles to build a word</span>
        }
      </div>

      {/* Flash */}
      {flash && <div className={`boggle-flash boggle-flash-${flashType}`}>{flash}</div>}

      {/* My found words */}
      <div className="boggle-found">
        <div className="boggle-found-header">
          My words · {myWords.length} found · {myScore} pts
        </div>
        <div className="boggle-found-chips">
          {myWords.map(w => (
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
