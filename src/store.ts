import { create } from 'zustand';
import { ref, onValue, set, update, get } from 'firebase/database';
import { db } from './firebase';
import { GameStore, Card, ActivityEntry } from './types';
import { ThemeId, resolveTheme } from './themes';

export const PLAYER_COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#7b2cbf'];
export const TURN_DURATION = 30; // seconds per turn

const INITIAL_STATE = {
  id: '',
  players: [],
  deck: [],
  turnIndex: 0,
  scores: {},
  combos: {},
  activity: [],
  turnStartTime: 0,
  status: 'waiting' as const,
  theme: 'disney' as ThemeId,
  pairsCount: 8,
  playerId: null,
  playerName: null,
};

let unsubscribeGame: (() => void) | null = null;
let flipBackTimeout: ReturnType<typeof setTimeout> | null = null;

const clampPairsCount = (themeId: ThemeId, requestedPairs: number) => {
  const maxPairs = resolveTheme(themeId).items.length;
  return Math.min(Math.max(requestedPairs, 6), maxPairs);
};

const generateDeck = (themeId: ThemeId, requestedPairsCount: number): Card[] => {
  const theme = resolveTheme(themeId);
  const pairsCount = clampPairsCount(theme.id, requestedPairsCount);
  const shuffledItems = [...theme.items];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }

  const selectedPairs = shuffledItems.slice(0, pairsCount);
  const deck: Card[] = [];

  selectedPairs.forEach((item) => {
    deck.push({
      id: `${item.id}-1`,
      pairId: item.id,
      label: item.label,
      image: item.image,
      flipped: false,
      matched: false,
    });
    deck.push({
      id: `${item.id}-2`,
      pairId: item.id,
      label: item.label,
      image: item.image,
      flipped: false,
      matched: false,
    });
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

const attachGameListener = (
  gameId: string,
  setStore: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void
) => {
  if (unsubscribeGame) unsubscribeGame();
  unsubscribeGame = onValue(ref(db, `games/${gameId}`), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const themeId = resolveTheme(data.theme).id;
    const pairsCount = clampPairsCount(themeId, Number(data.pairsCount) || 8);
    setStore((state) => ({
      ...state,
      ...data,
      theme: themeId,
      pairsCount,
      combos: data.combos || {},
      activity: data.activity || [],
      turnStartTime: data.turnStartTime || Date.now(),
    }));
  });
};

export const useGameStore = create<GameStore>((setStore, getStore) => ({
  ...INITIAL_STATE,

  setPlayerInfo: (id, name) => setStore({ playerId: id, playerName: name }),

  createGame: async (playerName, theme, requestedPairsCount) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = Math.random().toString(36).substring(2, 10);
    const themeId = resolveTheme(theme).id;
    const pairsCount = clampPairsCount(themeId, requestedPairsCount);

    const newGame = {
      id: gameId,
      players: [{ id: playerId, name: playerName }],
      deck: generateDeck(themeId, pairsCount),
      turnIndex: 0,
      scores: { [playerId]: 0 },
      combos: { [playerId]: 0 },
      activity: [],
      turnStartTime: Date.now(),
      status: 'waiting' as const,
      theme: themeId,
      pairsCount,
    };

    await set(ref(db, `games/${gameId}`), newGame);
    setStore({ ...newGame, playerId, playerName });
    attachGameListener(gameId, setStore);

    return gameId;
  },

  joinGame: async (gameId, playerName) => {
    const normalizedGameId = gameId.trim().toUpperCase();
    const gameRef = ref(db, `games/${normalizedGameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) throw new Error('Game not found');

    const gameData = snapshot.val();
    if (gameData.players.length >= 4) throw new Error('Game is full (max 4 players)');

    const playerId = Math.random().toString(36).substring(2, 10);
    const updatedPlayers = [...gameData.players, { id: playerId, name: playerName }];
    const updatedScores = { ...gameData.scores, [playerId]: 0 };
    const updatedCombos = { ...(gameData.combos || {}), [playerId]: 0 };
    const status = updatedPlayers.length === 4 ? 'playing' : gameData.status;

    await update(gameRef, {
      players: updatedPlayers,
      scores: updatedScores,
      combos: updatedCombos,
      status,
    });

    setStore({ playerId, playerName });
    attachGameListener(normalizedGameId, setStore);
  },

  startGame: async () => {
    const state = getStore();
    const isHost = state.players[0]?.id === state.playerId;
    if (state.id && state.players.length >= 2 && isHost) {
      await update(ref(db, `games/${state.id}`), {
        status: 'playing',
        turnStartTime: Date.now(),
      });
    }
  },

  flipCard: async (cardIndex) => {
    const state = getStore();
    if (state.status !== 'playing') return;

    const currentPlayer = state.players[state.turnIndex];
    if (currentPlayer.id !== state.playerId) return;

    const card = state.deck[cardIndex];
    if (card.flipped || card.matched) return;
    const currentlyOpen = state.deck.filter(c => c.flipped && !c.matched).length;
    if (currentlyOpen >= 2) return;

    // Immutably flip the card
    const newDeck = state.deck.map((c, i) => i === cardIndex ? { ...c, flipped: true } : c);
    const flippedUnmatched = newDeck.filter(c => c.flipped && !c.matched);

    const updates: Record<string, unknown> = { deck: newDeck };

    if (flippedUnmatched.length === 2) {
      const isMatch = flippedUnmatched[0].pairId === flippedUnmatched[1].pairId;

      const activityEntry: ActivityEntry = {
        playerName: currentPlayer.name,
        cardLabel: flippedUnmatched[1].label,
        matched: isMatch,
        ts: Date.now(),
      };
      updates.activity = [activityEntry, ...(state.activity || [])].slice(0, 8);

      if (isMatch) {
        const updatedDeck = newDeck.map(c =>
          c.flipped && !c.matched ? { ...c, matched: true, matchedBy: currentPlayer.id } : c
        );
        updates.deck = updatedDeck;

        // Combo: first consecutive match = 1pt, second = 2pts, etc.
        const newCombo = (state.combos[currentPlayer.id] || 0) + 1;
        updates.combos = { ...state.combos, [currentPlayer.id]: newCombo };
        updates.scores = {
          ...state.scores,
          [currentPlayer.id]: (state.scores[currentPlayer.id] || 0) + newCombo,
        };

        if (updatedDeck.every(c => c.matched)) {
          updates.status = 'finished';
        } else {
          // Matched — same player goes again, reset timer
          updates.turnStartTime = Date.now();
        }
      } else {
        // Mismatch — advance turn, reset this player's combo
        const nextTurnIndex = (state.turnIndex + 1) % state.players.length;
        updates.turnIndex = nextTurnIndex;
        updates.turnStartTime = Date.now();
        updates.combos = { ...state.combos, [currentPlayer.id]: 0 };

        if (flipBackTimeout) clearTimeout(flipBackTimeout);
        flipBackTimeout = setTimeout(async () => {
          const snap = await get(ref(db, `games/${state.id}`));
          const currentDbState = snap.val();
          if (!currentDbState || currentDbState.status !== 'playing') return;
          const resetDeck = currentDbState.deck.map((c: Card) =>
            !c.matched && c.flipped ? { ...c, flipped: false } : c
          );
          await update(ref(db, `games/${state.id}`), { deck: resetDeck });
        }, 1100);
      }
    }

    await update(ref(db, `games/${state.id}`), updates);
  },

  skipTurn: async () => {
    const state = getStore();
    if (state.status !== 'playing') return;
    const currentPlayer = state.players[state.turnIndex];
    if (currentPlayer.id !== state.playerId) return;

    const resetDeck = state.deck.map((c: Card) =>
      !c.matched && c.flipped ? { ...c, flipped: false } : c
    );
    const nextTurnIndex = (state.turnIndex + 1) % state.players.length;

    await update(ref(db, `games/${state.id}`), {
      deck: resetDeck,
      turnIndex: nextTurnIndex,
      turnStartTime: Date.now(),
      combos: { ...state.combos, [currentPlayer.id]: 0 },
    });
  },

  resetGame: async () => {
    const state = getStore();
    if (!state.id) return;
    const isHost = state.players[0]?.id === state.playerId;
    if (!isHost) return;

    const themeId = resolveTheme(state.theme).id;
    const pairsCount = clampPairsCount(themeId, state.pairsCount);
    const playerIds = Object.keys(state.scores);

    await update(ref(db, `games/${state.id}`), {
      deck: generateDeck(themeId, pairsCount),
      turnIndex: 0,
      status: 'playing',
      turnStartTime: Date.now(),
      activity: [],
      pairsCount,
      scores: playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<string, number>),
      combos: playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<string, number>),
    });
  },
}));
