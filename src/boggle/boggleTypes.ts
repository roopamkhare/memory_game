export interface BogglePlayer {
  id: string;
  name: string;
}

export interface BoggleState {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  players: BogglePlayer[];
  grid: string[];
  timeStart: number;
  // words[playerId] = { word: true } — object avoids array-index conflicts on concurrent writes
  words: Record<string, Record<string, true>>;
  playerId: string | null;
  playerName: string | null;
}

export interface BoggleStore extends BoggleState {
  createGame: (playerName: string) => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  submitWord: (word: string) => Promise<void>;
  finishGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  leaveGame: () => void;
}
