import { useGameStore } from './store'
import { Lobby } from './components/Lobby'
import { Board } from './components/Board'
import { Scoreboard } from './components/Scoreboard'
import './App.css'

function App() {
  const { status } = useGameStore();

  return (
    <div className="app-container">
      <h1>Memory Game (3-Player)</h1>
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