import { useGameStore } from '../store';

export function Board() {
  const { deck, flipCard, status, turnIndex, players, playerId, pairsCount } = useGameStore();

  if (status !== 'playing') return null;

  const isMyTurn = players[turnIndex]?.id === playerId;

  // Determine grid columns based on number of cards
  const totalCards = pairsCount * 2;
  let columns = 4;
  if (totalCards >= 20) columns = 5;
  if (totalCards >= 24) columns = 6;

  return (
    <div className="board-container">
      <div className="turn-indicator">
        {isMyTurn ? "It's your turn!" : `Waiting for ${players[turnIndex]?.name}...`}
      </div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {deck.map((card, index) => (
          <div
            key={card.id}
            className={`card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => isMyTurn && !card.flipped && !card.matched && flipCard(index)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">
                <span className="card-text">{card.pairId}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}