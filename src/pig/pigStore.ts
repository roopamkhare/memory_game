import { create } from 'zustand';

export const PIG_WIN = 100;
export const PIG_COLORS = ['#e63946', '#2a9d8f'];

interface Player {
  id: string;
  name: string;
}

type PigStatus = 'setup' | 'playing' | 'handoff' | 'finished';

interface PigStore {
  players: Player[];
  scores: Record<string, number>;
  turnScore: number;
  turnIndex: number;
  lastRoll: number | null;
  status: PigStatus;
  winnerId: string | null;
  piggedOut: boolean;
  setupPlayers: (names: [string, string]) => void;
  roll: () => void;
  hold: () => void;
  confirmHandoff: () => void;
  resetGame: () => void;
}

export const usePigStore = create<PigStore>((set, get) => ({
  players: [],
  scores: {},
  turnScore: 0,
  turnIndex: 0,
  lastRoll: null,
  status: 'setup',
  winnerId: null,
  piggedOut: false,

  setupPlayers: (names) => {
    const players = names.map((name, i) => ({ id: `p${i}`, name }));
    const scores = players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);
    set({ players, scores, turnScore: 0, turnIndex: 0, lastRoll: null, status: 'playing', winnerId: null, piggedOut: false });
  },

  roll: () => {
    const s = get();
    if (s.status !== 'playing') return;
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll === 1) {
      set({ lastRoll: 1, turnScore: 0, status: 'handoff', piggedOut: true });
    } else {
      set({ lastRoll: roll, turnScore: s.turnScore + roll, piggedOut: false });
    }
  },

  hold: () => {
    const s = get();
    if (s.status !== 'playing' || s.turnScore === 0) return;
    const currentPlayer = s.players[s.turnIndex];
    const newBanked = (s.scores[currentPlayer.id] || 0) + s.turnScore;
    if (newBanked >= PIG_WIN) {
      set({
        scores: { ...s.scores, [currentPlayer.id]: newBanked },
        status: 'finished',
        winnerId: currentPlayer.id,
        turnScore: 0,
        lastRoll: null,
      });
    } else {
      set({
        scores: { ...s.scores, [currentPlayer.id]: newBanked },
        status: 'handoff',
        piggedOut: false,
        turnScore: 0,
        lastRoll: null,
      });
    }
  },

  confirmHandoff: () => {
    const s = get();
    const nextIndex = (s.turnIndex + 1) % s.players.length;
    set({ turnIndex: nextIndex, turnScore: 0, lastRoll: null, status: 'playing', piggedOut: false });
  },

  resetGame: () => {
    const s = get();
    const scores = s.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);
    set({ scores, turnScore: 0, turnIndex: 0, lastRoll: null, status: 'playing', winnerId: null, piggedOut: false });
  },
}));
