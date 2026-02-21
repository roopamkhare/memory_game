import { useGameStore } from '../store';

export function Board() {
  const { deck, flipCard, status, turnIndex, players, playerId } = useGameStore();

  if (status !== 'playing') return null;

  const isMyTurn = players[turnIndex]?.id === playerId;

  return (
    <div className="board-container">
      <div className="turn-indicator">
        {isMyTurn ? "It's your turn!" : `Waiting for ${players[turnIndex]?.name}...`}
      </div>
      <div className="board">
        {deck.map((card, index) => (
          <div
            key={card.id}
            className={`card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => isMyTurn && !card.flipped && !card.matched && flipCard(index)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.pairId}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}