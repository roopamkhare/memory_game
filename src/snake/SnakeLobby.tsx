import { useState } from 'react';
import { useSnakeStore, SNAKE_COLORS } from './snakeStore';

export function SnakeLobby() {
  const [name, setName] = useState('');
  const [joinId, setJoinId] = useState('');
  const { createGame, joinGame, startGame, id, players, playerId, status } = useSnakeStore();

  const handleCreate = async () => {
    if (!name.trim()) return alert('Enter your name');
    await createGame(name.trim());
  };

  const handleJoin = async () => {
    if (!name.trim() || !joinId.trim()) return alert('Enter name and game ID');
    try { await joinGame(joinId, name.trim()); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to join'); }
  };

  if (status === 'waiting' && id) {
    const isHost = players[0]?.id === playerId;
    const canStart = isHost && players.length >= 2;

    return (
      <div className="lobby waiting-room">
        <div className="game-id-banner">
          <span className="game-id-label">Game ID</span>
          <strong className="game-code">{id}</strong>
          <span className="game-id-hint">Share with friends!</span>
        </div>
        <p className="theme-description">
          🐍 Race to square 100. Climb ladders, avoid snakes!
        </p>
        <div className="player-list">
          {players.map((p, i) => (
            <div key={p.id} className="player-slot filled" style={{ borderColor: SNAKE_COLORS[i % SNAKE_COLORS.length] }}>
              <span className="player-avatar" style={{ background: SNAKE_COLORS[i % SNAKE_COLORS.length] }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="player-slot-name">{p.name}</span>
              {i === 0 && <span className="host-tag">Host</span>}
            </div>
          ))}
          {Array.from({ length: 4 - players.length }, (_, i) => (
            <div key={`e${i}`} className="player-slot empty">
              <span className="player-avatar empty-avatar">?</span>
              <span className="player-slot-name">Waiting...</span>
            </div>
          ))}
        </div>
        {canStart
          ? <button className="start-btn" onClick={startGame}>Start Game ({players.length}/4)</button>
          : <p className="waiting-hint">{isHost ? 'Need at least 2 players.' : 'Waiting for host...'}</p>
        }
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-name-row">
        <input className="name-input" type="text" placeholder="Your name" value={name} maxLength={18}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
      </div>
      <div className="actions">
        <div className="create-section">
          <h3 className="section-title">Create Game</h3>
          <p className="theme-description">🐍🪜 Classic Snake & Ladders — race to square 100 first!</p>
          <button onClick={handleCreate}>Create Game</button>
        </div>
        <div className="divider"><span>or</span></div>
        <div className="join-section">
          <h3 className="section-title">Join Game</h3>
          <input type="text" placeholder="Game ID" value={joinId} maxLength={8}
            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()} />
          <button onClick={handleJoin}>Join Game</button>
        </div>
      </div>
    </div>
  );
}
