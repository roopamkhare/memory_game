import { useState } from 'react';
import { useGameStore } from '../store';
import { PLAYER_COLORS } from '../store';
import { THEME_OPTIONS, ThemeId, resolveTheme } from '../themes';

export function Lobby() {
  const [playerName, setPlayerName] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [theme, setTheme] = useState<ThemeId>('disney');
  const [pairsCount, setPairsCount] = useState(8);
  const {
    createGame, joinGame, startGame,
    status, id, players, playerId,
    theme: gameTheme, pairsCount: gamePairsCount,
  } = useGameStore();
  const selectedTheme = resolveTheme(theme);

  const handleCreate = async () => {
    if (!playerName.trim()) return alert('Enter your name first');
    await createGame(playerName.trim(), theme, pairsCount);
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !gameIdInput.trim()) return alert('Enter your name and a game ID');
    try {
      await joinGame(gameIdInput, playerName.trim());
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to join game');
    }
  };

  // Waiting room view
  if (status === 'waiting' && id) {
    const isHost = players[0]?.id === playerId;
    const canStart = isHost && players.length >= 2;
    const waitingTheme = resolveTheme(gameTheme);

    return (
      <div className="lobby waiting-room">
        <div className="game-id-banner">
          <span className="game-id-label">Game ID</span>
          <strong className="game-code">{id}</strong>
          <span className="game-id-hint">Share with friends!</span>
        </div>

        <div className="waiting-meta">
          <span>{waitingTheme.icon} {waitingTheme.name}</span>
          <span>·</span>
          <span>{gamePairsCount * 2} cards</span>
        </div>
        <p className="theme-description">{waitingTheme.description}</p>

        <div className="player-list">
          {players.map((p, i) => (
            <div
              key={p.id}
              className="player-slot filled"
              style={{ borderColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            >
              <span
                className="player-avatar"
                style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="player-slot-name">{p.name}</span>
              {i === 0 && <span className="host-tag">Host</span>}
            </div>
          ))}
          {Array.from({ length: 4 - players.length }, (_, i) => (
            <div key={`empty-${i}`} className="player-slot empty">
              <span className="player-avatar empty-avatar">?</span>
              <span className="player-slot-name">Waiting...</span>
            </div>
          ))}
        </div>

        {canStart ? (
          <button className="start-btn" onClick={startGame}>
            Start Game ({players.length}/4)
          </button>
        ) : isHost ? (
          <p className="waiting-hint">Need at least 2 players to start.</p>
        ) : (
          <p className="waiting-hint">Waiting for host to start...</p>
        )}
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-name-row">
        <input
          type="text"
          className="name-input"
          placeholder="Your name"
          value={playerName}
          maxLength={18}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
      </div>

      <div className="actions">
        <div className="create-section">
          <h3 className="section-title">Create Game</h3>
          <div className="settings">
            <label>
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeId)}>
                {THEME_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.icon} {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pairs
              <select value={pairsCount} onChange={(e) => setPairsCount(Number(e.target.value))}>
                <option value={6}>6 pairs · 12 cards</option>
                <option value={8}>8 pairs · 16 cards</option>
                <option value={10}>10 pairs · 20 cards</option>
                <option value={12}>12 pairs · 24 cards</option>
                <option value={16}>16 pairs · 32 cards</option>
              </select>
            </label>
          </div>
          <p className="theme-description">
            {selectedTheme.icon} {selectedTheme.description}
          </p>
          <button onClick={handleCreate}>Create Game</button>
        </div>

        <div className="divider"><span>or</span></div>

        <div className="join-section">
          <h3 className="section-title">Join Game</h3>
          <input
            type="text"
            placeholder="Game ID (e.g. AB12CD)"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={8}
          />
          <button onClick={handleJoin}>Join Game</button>
        </div>
      </div>

      <p className="lobby-hint">
        Combo bonus: consecutive matches earn more points! (1pt → 2pt → 3pt...)
      </p>
    </div>
  );
}
