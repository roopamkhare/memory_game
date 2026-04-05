import { useState } from 'react';
import { useGameStore } from './store';
import { GameHub } from './components/GameHub';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { Scoreboard } from './components/Scoreboard';
import { SnakeLobby } from './snake/SnakeLobby';
import { SnakeBoard } from './snake/SnakeBoard';
import { useSnakeStore } from './snake/snakeStore';
import { BoggleGame } from './boggle/BoggleGame';
import { TicTacToeGame } from './tictactoe/TicTacToeGame';
import './App.css';

type Screen = 'hub' | 'memory' | 'snake' | 'boggle' | 'tictactoe';

function MemoryGame({ onBack }: { onBack: () => void }) {
  const { status, leaveGame } = useGameStore();
  const handleBack = () => { leaveGame(); onBack(); };

  return (
    <>
      <div className="game-topbar">
        <button className="back-btn" onClick={handleBack}>← Games</button>
        <span className="game-topbar-title">Memory Match</span>
      </div>
      {status === 'waiting' ? (
        <Lobby />
      ) : (
        <div className="game-area">
          <Board />
          <Scoreboard />
        </div>
      )}
    </>
  );
}

function SnakeGame({ onBack }: { onBack: () => void }) {
  const { status, leaveGame } = useSnakeStore();
  const handleBack = () => { leaveGame(); onBack(); };

  return (
    <>
      <div className="game-topbar">
        <button className="back-btn" onClick={handleBack}>← Games</button>
        <span className="game-topbar-title">Snake & Ladders</span>
      </div>
      {status === 'waiting' ? (
        <SnakeLobby />
      ) : (
        <SnakeBoard />
      )}
    </>
  );
}

function BoggleScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="game-topbar">
        <button className="back-btn" onClick={onBack}>← Games</button>
        <span className="game-topbar-title">Boggle</span>
      </div>
      <BoggleGame />
    </>
  );
}

function TicTacToeScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="game-topbar">
        <button className="back-btn" onClick={onBack}>← Games</button>
        <span className="game-topbar-title">Tic-Tac-Toe</span>
      </div>
      <TicTacToeGame />
    </>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('hub');

  return (
    <div className="app-container">
      {screen === 'hub' && (
        <header className="app-header">
          <h1>🎮 Party Games</h1>
          <p className="app-subtitle">Multiplayer games — play with friends in real time.</p>
        </header>
      )}

      {screen === 'hub'       && <GameHub onSelect={setScreen} />}
      {screen === 'memory'    && <MemoryGame    onBack={() => setScreen('hub')} />}
      {screen === 'snake'     && <SnakeGame     onBack={() => setScreen('hub')} />}
      {screen === 'boggle'    && <BoggleScreen   onBack={() => setScreen('hub')} />}
      {screen === 'tictactoe' && <TicTacToeScreen onBack={() => setScreen('hub')} />}
    </div>
  );
}

export default App;
