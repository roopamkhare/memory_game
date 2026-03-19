export interface Player {
  id: string;
  name: string;
}

export interface PigState {
  id: string;
  players: Player[];
  scores: Record<string, number>;   // banked totals
  turnScore: number;                // points accumulated this turn
  turnIndex: number;
  lastRoll: number | null;
  status: 'waiting' | 'playing' | 'finished';
  winnerId: string | null;
}

export interface PigStore extends PigState {
  playerId: string | null;
  playerName: string | null;
  createGame: (playerName: string) => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  roll: () => Promise<void>;
  hold: () => Promise<void>;
  resetGame: () => Promise<void>;
  leaveGame: () => void;
}
