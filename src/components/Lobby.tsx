import { useState } from 'react';
import { useGameStore } from '../store';

export function Lobby() {
  const [playerName, setPlayerName] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const { createGame, joinGame, startGame, status, id, players, playerId } = useGameStore();

  const handleCreate = async () => {
    if (!playerName) return alert('Enter a name');
    await createGame(playerName);
  };

  const handleJoin = async () => {
    if (!playerName || !gameIdInput) return alert('Enter name and game ID');
    try {
      await joinGame(gameIdInput, playerName);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (status === 'waiting' && id) {
    const isHost = players[0]?.id === playerId;
    const canStart = isHost && players.length >= 2;

    return (
      <div className="lobby">
        <h2>Game ID: {id}</h2>
        <p>Waiting for players... ({players.length}/4)</p>
        <ul>
          {players.map((p) => (
            <li key={p.id}>
              {p.name} {p.id === players[0].id ? '(Host)' : ''}
            </li>
          ))}
        </ul>
        {canStart && (
          <button onClick={startGame} style={{ backgroundColor: '#4caf50', color: 'white' }}>
            Start Game Now
          </button>
        )}
        {!isHost && players.length < 4 && (
          <p>Waiting for host to start the game...</p>
        )}
        <p>Share the Game ID with your friends!</p>
      </div>
    );
  }

  return (
    <div className="lobby">
      <h2>Join or Create a Game</h2>
      <input
        type="text"
        placeholder="Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <div className="actions">
        <button onClick={handleCreate}>Create New Game</button>
        <div className="join-section">
          <input
            type="text"
            placeholder="Game ID"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
          />
          <button onClick={handleJoin}>Join Game</button>
        </div>
      </div>
    </div>
  );
}