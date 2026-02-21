import { create } from 'zustand';
import { ref, onValue, set, update, get } from 'firebase/database';
import { db } from './firebase';
import { GameStore, Card } from './types';

const INITIAL_STATE = {
  id: '',
  players: [],
  deck: [],
  turnIndex: 0,
  scores: {},
  status: 'waiting' as const,
  playerId: null,
  playerName: null,
};

// Helper to generate a random deck
const generateDeck = (): Card[] => {
  const pairs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // 8 pairs = 16 cards
  const deck: Card[] = [];
  
  pairs.forEach((pairId) => {
    deck.push({ id: `${pairId}-1`, pairId, flipped: false, matched: false });
    deck.push({ id: `${pairId}-2`, pairId, flipped: false, matched: false });
  });

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const useGameStore = create<GameStore>((setStore, getStore) => ({
  ...INITIAL_STATE,

  setPlayerInfo: (id, name) => setStore({ playerId: id, playerName: name }),

  createGame: async (playerName) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = Math.random().toString(36).substring(2, 10);
    
    const newGame = {
      id: gameId,
      players: [{ id: playerId, name: playerName }],
      deck: generateDeck(),
      turnIndex: 0,
      scores: { [playerId]: 0 },
      status: 'waiting' as const,
    };

    await set(ref(db, `games/${gameId}`), newGame);
    
    setStore({ ...newGame, playerId, playerName });
    
    // Listen for updates
    onValue(ref(db, `games/${gameId}`), (snapshot) => {
      const data = snapshot.val();
      if (data) setStore(data);
    });

    return gameId;
  },

  joinGame: async (gameId, playerName) => {
    const gameRef = ref(db, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }

    const gameData = snapshot.val();
    if (gameData.players.length >= 4) {
      throw new Error('Game is full (max 4 players)');
    }

    const playerId = Math.random().toString(36).substring(2, 10);
    const updatedPlayers = [...gameData.players, { id: playerId, name: playerName }];
    const updatedScores = { ...gameData.scores, [playerId]: 0 };
    
    // Start game automatically if 4 players joined
    const status = updatedPlayers.length === 4 ? 'playing' : gameData.status;

    await update(gameRef, {
      players: updatedPlayers,
      scores: updatedScores,
      status,
    });

    setStore({ playerId, playerName });

    // Listen for updates
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setStore(data);
    });
  },

  startGame: async () => {
    const state = getStore();
    if (state.id && state.players.length >= 2) {
      await update(ref(db, `games/${state.id}`), { status: 'playing' });
    }
  },

  flipCard: async (cardIndex) => {
    const state = getStore();
    if (state.status !== 'playing') return;
    
    const currentPlayer = state.players[state.turnIndex];
    if (currentPlayer.id !== state.playerId) return; // Not this player's turn

    const card = state.deck[cardIndex];
    if (card.flipped || card.matched) return;

    const newDeck = [...state.deck];
    newDeck[cardIndex] = { ...card, flipped: true };

    const flippedCards = newDeck.filter(c => c.flipped && !c.matched);
    
    let updates: any = { deck: newDeck };

    if (flippedCards.length === 2) {
      // Check for match
      if (flippedCards[0].pairId === flippedCards[1].pairId) {
        // Match found
        newDeck.forEach(c => {
          if (c.flipped && !c.matched) c.matched = true;
        });
        updates.scores = {
          ...state.scores,
          [state.playerId!]: (state.scores[state.playerId!] || 0) + 1
        };
        
        // Check win condition
        if (newDeck.every(c => c.matched)) {
          updates.status = 'finished';
        }
      } else {
        // No match, next turn
        updates.turnIndex = (state.turnIndex + 1) % state.players.length;
        
        // We need to flip them back after a delay, but we update Firebase immediately
        // to show the second card, then update again to hide them.
        // For a robust implementation, the server/host should handle the delay.
        // Here we use a simple client-side timeout for the authoritative player.
        setTimeout(async () => {
          const currentDbState = (await get(ref(db, `games/${state.id}`))).val();
          const resetDeck = currentDbState.deck.map((c: Card) => 
            (!c.matched && c.flipped) ? { ...c, flipped: false } : c
          );
          await update(ref(db, `games/${state.id}`), { deck: resetDeck });
        }, 1500);
      }
    }

    await update(ref(db, `games/${state.id}`), updates);
  },

  resetGame: async () => {
    const state = getStore();
    if (!state.id) return;

    const updates = {
      deck: generateDeck(),
      turnIndex: 0,
      status: 'playing',
      scores: Object.keys(state.scores).reduce((acc, playerId) => {
        acc[playerId] = 0;
        return acc;
      }, {} as Record<string, number>)
    };

    await update(ref(db, `games/${state.id}`), updates);
  }
}));