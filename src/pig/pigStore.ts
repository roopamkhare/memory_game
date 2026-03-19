import { create } from 'zustand';
import { ref, onValue, set, update, get } from 'firebase/database';
import { db } from '../firebase';
import { PigStore } from './pigTypes';

export const PIG_WIN = 100;
export const PIG_COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#7b2cbf'];

const INITIAL: Omit<PigStore, 'createGame' | 'joinGame' | 'startGame' | 'roll' | 'hold' | 'resetGame' | 'leaveGame'> = {
  id: '',
  players: [],
  scores: {},
  turnScore: 0,
  turnIndex: 0,
  lastRoll: null,
  status: 'waiting',
  winnerId: null,
  playerId: null,
  playerName: null,
};

let unsub: (() => void) | null = null;

const listen = (
  gameId: string,
  set_: (p: Partial<PigStore> | ((s: PigStore) => Partial<PigStore>)) => void
) => {
  if (unsub) unsub();
  unsub = onValue(ref(db, `pig/${gameId}`), (snap) => {
    const data = snap.val();
    if (!data) return;
    set_((s) => ({ ...s, ...data }));
  });
};

export const usePigStore = create<PigStore>((set_, get_) => ({
  ...INITIAL,

  createGame: async (playerName) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = Math.random().toString(36).substring(2, 10);
    const game = {
      id: gameId,
      players: [{ id: playerId, name: playerName }],
      scores: { [playerId]: 0 },
      turnScore: 0,
      turnIndex: 0,
      lastRoll: null,
      status: 'waiting' as const,
      winnerId: null,
    };
    await set(ref(db, `pig/${gameId}`), game);
    set_({ ...game, playerId, playerName });
    listen(gameId, set_);
    return gameId;
  },

  joinGame: async (gameId, playerName) => {
    const id = gameId.trim().toUpperCase();
    const snap = await get(ref(db, `pig/${id}`));
    if (!snap.exists()) throw new Error('Game not found');
    const data = snap.val();
    if (data.players.length >= 4) throw new Error('Game is full (max 4 players)');

    const playerId = Math.random().toString(36).substring(2, 10);
    const players = [...data.players, { id: playerId, name: playerName }];
    const scores = { ...data.scores, [playerId]: 0 };
    const status = players.length === 4 ? 'playing' : data.status;

    await update(ref(db, `pig/${id}`), { players, scores, status });
    set_({ playerId, playerName });
    listen(id, set_);
  },

  startGame: async () => {
    const s = get_();
    if (s.players[0]?.id !== s.playerId) return;
    if (s.players.length < 2) return;
    await update(ref(db, `pig/${s.id}`), { status: 'playing' });
  },

  roll: async () => {
    const s = get_();
    if (s.status !== 'playing') return;
    if (s.players[s.turnIndex]?.id !== s.playerId) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    const updates: Record<string, unknown> = { lastRoll: roll };

    if (roll === 1) {
      // Pig! Lose turn score, pass turn
      updates.turnScore = 0;
      updates.turnIndex = (s.turnIndex + 1) % s.players.length;
    } else {
      updates.turnScore = s.turnScore + roll;
    }

    await update(ref(db, `pig/${s.id}`), updates);
  },

  hold: async () => {
    const s = get_();
    if (s.status !== 'playing') return;
    if (s.players[s.turnIndex]?.id !== s.playerId) return;
    if (s.turnScore === 0) return;

    const currentPlayer = s.players[s.turnIndex];
    const newBanked = (s.scores[currentPlayer.id] || 0) + s.turnScore;
    const updates: Record<string, unknown> = {
      scores: { ...s.scores, [currentPlayer.id]: newBanked },
      turnScore: 0,
      lastRoll: null,
    };

    if (newBanked >= PIG_WIN) {
      updates.status = 'finished';
      updates.winnerId = currentPlayer.id;
    } else {
      updates.turnIndex = (s.turnIndex + 1) % s.players.length;
    }

    await update(ref(db, `pig/${s.id}`), updates);
  },

  resetGame: async () => {
    const s = get_();
    if (s.players[0]?.id !== s.playerId) return;
    const scores = s.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);
    await update(ref(db, `pig/${s.id}`), {
      scores, turnScore: 0, turnIndex: 0, lastRoll: null, status: 'playing', winnerId: null,
    });
  },

  leaveGame: () => {
    if (unsub) { unsub(); unsub = null; }
    set_({ ...INITIAL });
  },
}));
