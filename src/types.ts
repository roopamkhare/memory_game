import { ThemeId } from './themes';

export interface Player {
  id: string;
  name: string;
}

export interface Card {
  id: string;
  pairId: string;
  label: string;
  image: string;
  flipped: boolean;
  matched: boolean;
  matchedBy?: string; // playerId who matched this card
}

export interface ActivityEntry {
  playerName: string;
  cardLabel: string;
  matched: boolean;
  ts: number;
}

export interface GameState {
  id: string;
  players: Player[];
  deck: Card[];
  turnIndex: number;
  scores: Record<string, number>;
  combos: Record<string, number>;
  activity: ActivityEntry[];
  turnStartTime: number;
  status: 'waiting' | 'playing' | 'finished';
  theme: ThemeId;
  pairsCount: number;
}

export interface GameStore extends GameState {
  playerId: string | null;
  playerName: string | null;
  setPlayerInfo: (id: string, name: string) => void;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  createGame: (playerName: string, theme: ThemeId, pairsCount: number) => Promise<string>;
  startGame: () => Promise<void>;
  flipCard: (cardIndex: number) => Promise<void>;
  skipTurn: () => Promise<void>;
  resetGame: () => Promise<void>;
  leaveGame: () => void;
}
