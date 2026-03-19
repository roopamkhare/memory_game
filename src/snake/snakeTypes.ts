export interface Player {
  id: string;
  name: string;
}

export interface SnakeState {
  id: string;
  players: Player[];
  positions: Record<string, number>; // playerId → square 0–100 (0 = not started)
  turnIndex: number;
  lastRoll: number | null;
  lastEvent: string | null;          // description of the last move (snake/ladder/normal)
  status: 'waiting' | 'playing' | 'finished';
  winnerId: string | null;
}

export interface SnakeStore extends SnakeState {
  playerId: string | null;
  playerName: string | null;
  createGame: (playerName: string) => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  rollDice: () => Promise<void>;
  resetGame: () => Promise<void>;
  leaveGame: () => void;
}
