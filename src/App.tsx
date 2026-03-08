import { useGameStore } from './store'
import { Lobby } from './components/Lobby'
import { Board } from './components/Board'
import { Scoreboard } from './components/Scoreboard'
import './App.css'

function App() {
  const { status } = useGameStore();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Memory Match Party</h1>
        <p className="app-subtitle">Flip cards, chain combos, and outlast your friends.</p>
      </header>
      {status === 'waiting' ? (
        <Lobby />
      ) : (
        <div className="game-area">
          <Board />
          <Scoreboard />
        </div>
      )}
    </div>
  )
}

export default App
