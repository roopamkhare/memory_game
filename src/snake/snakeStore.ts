import { create } from 'zustand';
import { ref, onValue, set, update, get } from 'firebase/database';
import { db } from '../firebase';
import { SnakeStore } from './snakeTypes';

export const SNAKE_COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#7b2cbf'];

// Classic snake and ladder positions
// SNAKES: land on key → slide to value (head → tail)
export const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  99: 18,
};

// LADDERS: land on key → climb to value (bottom → top)
export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const INITIAL: Omit<SnakeStore, 'createGame' | 'joinGame' | 'startGame' | 'rollDice' | 'resetGame' | 'leaveGame'> = {
  id: '',
  players: [],
  positions: {},
  turnIndex: 0,
  lastRoll: null,
  lastEvent: null,
  status: 'waiting',
  winnerId: null,
  playerId: null,
  playerName: null,
};

let unsub: (() => void) | null = null;

const listen = (
  gameId: string,
  set_: (p: Partial<SnakeStore> | ((s: SnakeStore) => Partial<SnakeStore>)) => void
) => {
  if (unsub) unsub();
  unsub = onValue(ref(db, `snake/${gameId}`), (snap) => {
    const data = snap.val();
    if (!data) return;
    set_((s) => ({ ...s, ...data }));
  });
};

export const useSnakeStore = create<SnakeStore>((set_, get_) => ({
  ...INITIAL,

  createGame: async (playerName) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = Math.random().toString(36).substring(2, 10);
    const game = {
      id: gameId,
      players: [{ id: playerId, name: playerName }],
      positions: { [playerId]: 0 },
      turnIndex: 0,
      lastRoll: null,
      lastEvent: null,
      status: 'waiting' as const,
      winnerId: null,
    };
    await set(ref(db, `snake/${gameId}`), game);
    set_({ ...game, playerId, playerName });
    listen(gameId, set_);
    return gameId;
  },

  joinGame: async (gameId, playerName) => {
    const id = gameId.trim().toUpperCase();
    const snap = await get(ref(db, `snake/${id}`));
    if (!snap.exists()) throw new Error('Game not found');
    const data = snap.val();
    if (data.players.length >= 4) throw new Error('Game is full (max 4 players)');

    const playerId = Math.random().toString(36).substring(2, 10);
    const players = [...data.players, { id: playerId, name: playerName }];
    const positions = { ...data.positions, [playerId]: 0 };
    const status = players.length === 4 ? 'playing' : data.status;

    await update(ref(db, `snake/${id}`), { players, positions, status });
    set_({ playerId, playerName });
    listen(id, set_);
  },

  startGame: async () => {
    const s = get_();
    if (s.players[0]?.id !== s.playerId) return;
    if (s.players.length < 2) return;
    await update(ref(db, `snake/${s.id}`), { status: 'playing' });
  },

  rollDice: async () => {
    const s = get_();
    if (s.status !== 'playing') return;
    const currentPlayer = s.players[s.turnIndex];
    if (currentPlayer?.id !== s.playerId) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    const currentPos = s.positions[currentPlayer.id] || 0;
    let newPos = currentPos + roll;

    let event = `${currentPlayer.name} rolled ${roll}`;

    if (newPos > 100) {
      // Bounce back
      newPos = 100 - (newPos - 100);
      event += ` → bounced to ${newPos}`;
    }

    if (SNAKES[newPos] !== undefined) {
      const tail = SNAKES[newPos];
      event += ` → 🐍 Snake! Slid from ${newPos} to ${tail}`;
      newPos = tail;
    } else if (LADDERS[newPos] !== undefined) {
      const top = LADDERS[newPos];
      event += ` → 🪜 Ladder! Climbed from ${newPos} to ${top}`;
      newPos = top;
    }

    const positions = { ...s.positions, [currentPlayer.id]: newPos };
    const updates: Record<string, unknown> = {
      lastRoll: roll,
      lastEvent: event,
      positions,
    };

    if (newPos === 100) {
      updates.status = 'finished';
      updates.winnerId = currentPlayer.id;
    } else {
      updates.turnIndex = (s.turnIndex + 1) % s.players.length;
    }

    await update(ref(db, `snake/${s.id}`), updates);
  },

  resetGame: async () => {
    const s = get_();
    if (s.players[0]?.id !== s.playerId) return;
    const positions = s.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);
    await update(ref(db, `snake/${s.id}`), {
      positions, turnIndex: 0, lastRoll: null, lastEvent: null, status: 'playing', winnerId: null,
    });
  },

  leaveGame: () => {
    if (unsub) { unsub(); unsub = null; }
    set_({ ...INITIAL });
  },
}));
