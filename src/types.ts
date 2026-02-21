export interface Player {
  id: string;
  name: string;
}

export interface Card {
  id: string;
  pairId: string;
  flipped: boolean;
  matched: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  deck: Card[];
  turnIndex: number;
  scores: Record<string, number>;
  status: 'waiting' | 'playing' | 'finished';
  theme: string;
  pairsCount: number;
}

export interface GameStore extends GameState {
  playerId: string | null;
  playerName: string | null;
  setPlayerInfo: (id: string, name: string) => void;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  createGame: (playerName: string, theme: string, pairsCount: number) => Promise<string>;
  startGame: () => Promise<void>;
  flipCard: (cardIndex: number) => Promise<void>;
  resetGame: () => Promise<void>;
}