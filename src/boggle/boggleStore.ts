import { create } from 'zustand';
import { ref, onValue, set, update, get } from 'firebase/database';
import { db } from '../firebase';
import { BoggleStore } from './boggleTypes';

export const BOGGLE_COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#7b2cbf'];
export const BOGGLE_DURATION = 120; // seconds

const BOGGLE_DICE = [
  'AAEEGN', 'ELRTTY', 'AOOTTW', 'ABBJOO',
  'EHRTVW', 'CIMOTU', 'DISTTY', 'EIOSST',
  'DELRVY', 'ACHOPS', 'HIMNQU', 'EEINSU',
  'EEGHNW', 'AFFKPS', 'HLNNRZ', 'DEILRX',
];

function generateGrid(): string[] {
  const shuffled = [...BOGGLE_DICE].sort(() => Math.random() - 0.5);
  return shuffled.map(die => die[Math.floor(Math.random() * die.length)]);
}

const INITIAL: Omit<BoggleStore,
  'createGame' | 'joinGame' | 'startGame' | 'submitWord' | 'finishGame' | 'playAgain' | 'leaveGame'
> = {
  id: '',
  status: 'waiting',
  players: [],
  grid: [],
  timeStart: 0,
  words: {},
  playerId: null,
  playerName: null,
};

let unsub: (() => void) | null = null;

const listen = (
  gameId: string,
  set_: (p: Partial<BoggleStore> | ((s: BoggleStore) => Partial<BoggleStore>)) => void
) => {
  if (unsub) unsub();
  unsub = onValue(ref(db, `boggle/${gameId}`), (snap) => {
    const data = snap.val();
    if (!data) return;
    set_((s) => ({ ...s, ...data, words: data.words || {} }));
  });
};

export const useBoggleStore = create<BoggleStore>((set_, get_) => ({
  ...INITIAL,

  createGame: async (playerName) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = Math.random().toString(36).substring(2, 10);
    const game = {
      id: gameId,
      status: 'waiting' as const,
      players: [{ id: playerId, name: playerName }],
      grid: [],
      timeStart: 0,
      words: {},
    };
    await set(ref(db, `boggle/${gameId}`), game);
    set_({ ...game, playerId, playerName });
    listen(gameId, set_);
    return gameId;
  },

  joinGame: async (gameId, playerName) => {
    const id = gameId.trim().toUpperCase();
    const snap = await get(ref(db, `boggle/${id}`));
    if (!snap.exists()) throw new Error('Game not found');
    const data = snap.val();
    if (data.status !== 'waiting') throw new Error('Game already started');
    if (data.players.length >= 4) throw new Error('Game is full (max 4 players)');

    const playerId = Math.random().toString(36).substring(2, 10);
    const players = [...data.players, { id: playerId, name: playerName }];
    await update(ref(db, `boggle/${id}`), { players });
    set_({ playerId, playerName });
    listen(id, set_);
  },

  startGame: async () => {
    const s = get_();
    if (s.players[0]?.id !== s.playerId) return;
    if (s.players.length < 2) return;
    const grid = generateGrid();
    await update(ref(db, `boggle/${s.id}`), {
      grid,
      timeStart: Date.now(),
      status: 'playing',
      words: {},
    });
  },

  submitWord: async (word) => {
    const s = get_();
    if (s.status !== 'playing' || !s.playerId) return;
    // Write the word as a key under this player's words object
    await update(ref(db, `boggle/${s.id}/words/${s.playerId}`), { [word]: true });
  },

  finishGame: async () => {
    const s = get_();
    if (s.status !== 'playing') return;
    await update(ref(db, `boggle/${s.id}`), { status: 'finished' });
  },

  playAgain: async () => {
    const s = get_();
    if (s.players[0]?.id !== s.playerId) return;
    const grid = generateGrid();
    await update(ref(db, `boggle/${s.id}`), {
      grid,
      timeStart: Date.now(),
      status: 'playing',
      words: {},
    });
  },

  leaveGame: () => {
    if (unsub) { unsub(); unsub = null; }
    set_({ ...INITIAL });
  },
}));
