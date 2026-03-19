type GameId = 'memory' | 'snake' | 'pig';

interface GameInfo {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  players: string;
  emoji: string;
  badge: string;
  colors: [string, string];
  accentEmojis: string[];
}

const GAMES: GameInfo[] = [
  {
    id: 'memory',
    name: 'Memory Match',
    tagline: 'Flip. Match. Combo!',
    description: 'Race to match card pairs across 6 themed decks. Chain matches for bonus points.',
    players: '2–4 players',
    emoji: '🃏',
    badge: 'Combo scoring',
    colors: ['#15335f', '#2a9d8f'],
    accentEmojis: ['❄️', '🦁', '🧜‍♀️', '🛸'],
  },
  {
    id: 'snake',
    name: 'Snake & Ladders',
    tagline: 'Roll. Climb. Slide!',
    description: 'Classic race to 100. Climb ladders for shortcuts, dodge snakes that send you back.',
    players: '2–4 players',
    emoji: '🐍',
    badge: 'Classic',
    colors: ['#1b4332', '#52b788'],
    accentEmojis: ['🪜', '🎲', '🎲'],
  },
  {
    id: 'pig',
    name: 'Pig',
    tagline: 'Roll. Risk. Bank!',
    description: 'Keep rolling to pile up points — but roll a 1 and you lose it all. First to 100 wins.',
    players: '2–4 players',
    emoji: '🐷',
    badge: 'Press your luck',
    colors: ['#9a031e', '#fb8b24'],
    accentEmojis: ['⚀', '⚃', '⚅'],
  },
];

const svgThumbnail = (game: GameInfo): string => {
  const [c1, c2] = game.colors;
  const dots = game.accentEmojis
    .map((e, i) => `<text x="${55 + i * 70}" y="52" font-size="28" text-anchor="middle" opacity="0.55">${e}</text>`)
    .join('');

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 160">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="280" height="160" fill="url(#g)"/>
  <circle cx="140" cy="90" r="64" fill="rgba(255,255,255,0.08)"/>
  <circle cx="20" cy="20" r="30" fill="rgba(255,255,255,0.06)"/>
  <circle cx="260" cy="140" r="40" fill="rgba(0,0,0,0.1)"/>
  ${dots}
  <text x="140" y="108" font-size="62" text-anchor="middle">${game.emoji}</text>
</svg>`)}`;
};

interface Props {
  onSelect: (game: GameId) => void;
}

export function GameHub({ onSelect }: Props) {
  return (
    <div className="hub">
      <div className="hub-header">
        <h2 className="hub-title">Pick a Game</h2>
        <p className="hub-subtitle">Multiplayer · No sign-up needed · Share a code with friends</p>
      </div>

      <div className="hub-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className="hub-card"
            onClick={() => onSelect(game.id)}
          >
            <div className="hub-card-thumb">
              <img src={svgThumbnail(game)} alt={game.name} className="hub-thumb-img" />
              <span className="hub-card-badge">{game.badge}</span>
            </div>
            <div className="hub-card-body">
              <div className="hub-card-top">
                <h3 className="hub-card-name">{game.name}</h3>
                <span className="hub-card-players">{game.players}</span>
              </div>
              <p className="hub-card-tagline">{game.tagline}</p>
              <p className="hub-card-desc">{game.description}</p>
              <span className="hub-play-btn">Play Now →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
