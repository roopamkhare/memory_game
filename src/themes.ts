export type ThemeId = 'disney' | 'avengers' | 'socks' | 'animals' | 'space' | 'snacks';

export interface ThemeCardSeed {
  id: string;
  label: string;
  emoji: string;
  colors: [string, string];
}

export interface ThemeCardItem extends ThemeCardSeed {
  image: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  items: ThemeCardItem[];
}

const svgToDataUri = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const buildCardArt = (seed: ThemeCardSeed): string => {
  const [startColor, endColor] = seed.colors;

  return svgToDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 360'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='${startColor}' />
      <stop offset='100%' stop-color='${endColor}' />
    </linearGradient>
  </defs>
  <rect width='280' height='360' rx='30' fill='url(#bg)' />
  <circle cx='140' cy='145' r='78' fill='rgba(255,255,255,0.22)' />
  <text x='140' y='175' text-anchor='middle' font-size='88'>${seed.emoji}</text>
  <rect x='24' y='274' width='232' height='56' rx='14' fill='rgba(0,0,0,0.28)' />
  <text x='140' y='312' text-anchor='middle' font-family='Verdana, Geneva, sans-serif' font-size='30' fill='white'>${seed.label}</text>
</svg>`);
};

const themedItems = (items: ThemeCardSeed[]): ThemeCardItem[] =>
  items.map((item) => ({ ...item, image: buildCardArt(item) }));

export const THEME_CATALOG: Record<ThemeId, ThemeConfig> = {
  disney: {
    id: 'disney',
    name: 'Disney',
    icon: '🏰',
    description: 'Princesses, heroes, and classic Disney favorites.',
    items: themedItems([
      { id: 'mickey', label: 'Mickey', emoji: '🐭', colors: ['#4b2d2d', '#da2c38'] },
      { id: 'minnie', label: 'Minnie', emoji: '🎀', colors: ['#d72678', '#ff7eb6'] },
      { id: 'donald', label: 'Donald', emoji: '🦆', colors: ['#2f74c0', '#8cc9ff'] },
      { id: 'goofy', label: 'Goofy', emoji: '🐶', colors: ['#278f52', '#6bcf86'] },
      { id: 'pluto', label: 'Pluto', emoji: '🦴', colors: ['#c58b2b', '#ffd37a'] },
      { id: 'elsa', label: 'Elsa', emoji: '❄️', colors: ['#5bc0eb', '#9be7ff'] },
      { id: 'anna', label: 'Anna', emoji: '🌹', colors: ['#9b2f72', '#ef709d'] },
      { id: 'olaf', label: 'Olaf', emoji: '⛄', colors: ['#7ec8e3', '#dff5ff'] },
      { id: 'simba', label: 'Simba', emoji: '🦁', colors: ['#e77f2f', '#ffbd59'] },
      { id: 'ariel', label: 'Ariel', emoji: '🧜‍♀️', colors: ['#22a699', '#64d6ca'] },
      { id: 'mulan', label: 'Mulan', emoji: '🐉', colors: ['#ae2012', '#f48c06'] },
      { id: 'belle', label: 'Belle', emoji: '🌼', colors: ['#c6972b', '#f4d35e'] },
      { id: 'jasmine', label: 'Jasmine', emoji: '💎', colors: ['#208b7d', '#6bd0c1'] },
      { id: 'aladdin', label: 'Aladdin', emoji: '🪔', colors: ['#5f0f40', '#9a031e'] },
      { id: 'stitch', label: 'Stitch', emoji: '🛸', colors: ['#22577a', '#38a3a5'] },
      { id: 'moana', label: 'Moana', emoji: '🌊', colors: ['#227c9d', '#17c3b2'] },
    ]),
  },
  avengers: {
    id: 'avengers',
    name: 'Avengers',
    icon: '🛡️',
    description: 'Assemble your heroes and match fast.',
    items: themedItems([
      { id: 'ironman', label: 'Iron Man', emoji: '🤖', colors: ['#8d0801', '#bf0603'] },
      { id: 'cap', label: 'Cap', emoji: '🛡️', colors: ['#003049', '#669bbc'] },
      { id: 'thor', label: 'Thor', emoji: '⚡', colors: ['#2b2d42', '#8d99ae'] },
      { id: 'hulk', label: 'Hulk', emoji: '💚', colors: ['#31572c', '#4f772d'] },
      { id: 'widow', label: 'Widow', emoji: '🕷️', colors: ['#7f1d1d', '#b91c1c'] },
      { id: 'hawkeye', label: 'Hawkeye', emoji: '🏹', colors: ['#4a2c6f', '#9d4edd'] },
      { id: 'spiderman', label: 'Spidey', emoji: '🕸️', colors: ['#9d0208', '#dc2f02'] },
      { id: 'panther', label: 'Panther', emoji: '🐾', colors: ['#240046', '#5a189a'] },
      { id: 'strange', label: 'Strange', emoji: '🌀', colors: ['#1d3557', '#457b9d'] },
      { id: 'antman', label: 'Ant-Man', emoji: '🐜', colors: ['#6c757d', '#adb5bd'] },
      { id: 'captainmarvel', label: 'Marvel', emoji: '⭐', colors: ['#9a031e', '#fb8b24'] },
      { id: 'wanda', label: 'Wanda', emoji: '🔮', colors: ['#5f0f40', '#9a031e'] },
      { id: 'vision', label: 'Vision', emoji: '💠', colors: ['#2c3e50', '#4ca1af'] },
      { id: 'falcon', label: 'Falcon', emoji: '🪽', colors: ['#3a506b', '#5bc0be'] },
      { id: 'winter', label: 'Bucky', emoji: '🦾', colors: ['#495057', '#868e96'] },
      { id: 'groot', label: 'Groot', emoji: '🌱', colors: ['#6f4518', '#99582a'] },
    ]),
  },
  socks: {
    id: 'socks',
    name: 'Sock Drawer',
    icon: '🧦',
    description: 'Chaos laundry mode: match every sock pair.',
    items: themedItems([
      { id: 'stripe-red', label: 'Stripe', emoji: '🧦', colors: ['#bc4749', '#f28482'] },
      { id: 'stripe-blue', label: 'Navy', emoji: '🧦', colors: ['#1d3557', '#457b9d'] },
      { id: 'polka-pink', label: 'Polka', emoji: '🧦', colors: ['#d81159', '#ff5d8f'] },
      { id: 'mint', label: 'Mint', emoji: '🧦', colors: ['#2a9d8f', '#8bd3c7'] },
      { id: 'sunny', label: 'Sunny', emoji: '🧦', colors: ['#f48c06', '#ffbe0b'] },
      { id: 'violet', label: 'Violet', emoji: '🧦', colors: ['#6a4c93', '#b298dc'] },
      { id: 'lava', label: 'Lava', emoji: '🧦', colors: ['#9d0208', '#ff5400'] },
      { id: 'aqua', label: 'Aqua', emoji: '🧦', colors: ['#0077b6', '#90e0ef'] },
      { id: 'forest', label: 'Forest', emoji: '🧦', colors: ['#386641', '#6a994e'] },
      { id: 'grape', label: 'Grape', emoji: '🧦', colors: ['#7209b7', '#b5179e'] },
      { id: 'peach', label: 'Peach', emoji: '🧦', colors: ['#f3722c', '#f9c74f'] },
      { id: 'slate', label: 'Slate', emoji: '🧦', colors: ['#495057', '#adb5bd'] },
      { id: 'berry', label: 'Berry', emoji: '🧦', colors: ['#c9184a', '#ff4d6d'] },
      { id: 'lime', label: 'Lime', emoji: '🧦', colors: ['#70e000', '#b5e48c'] },
      { id: 'ocean', label: 'Ocean', emoji: '🧦', colors: ['#023e8a', '#48cae4'] },
      { id: 'storm', label: 'Storm', emoji: '🧦', colors: ['#353535', '#8d99ae'] },
    ]),
  },
  animals: {
    id: 'animals',
    name: 'Wild Animals',
    icon: '🐾',
    description: 'Cute creatures and jungle chaos.',
    items: themedItems([
      { id: 'lion', label: 'Lion', emoji: '🦁', colors: ['#e76f51', '#f4a261'] },
      { id: 'fox', label: 'Fox', emoji: '🦊', colors: ['#d62828', '#f77f00'] },
      { id: 'panda', label: 'Panda', emoji: '🐼', colors: ['#343a40', '#adb5bd'] },
      { id: 'koala', label: 'Koala', emoji: '🐨', colors: ['#6c757d', '#dee2e6'] },
      { id: 'tiger', label: 'Tiger', emoji: '🐯', colors: ['#fb8500', '#ffb703'] },
      { id: 'monkey', label: 'Monkey', emoji: '🐵', colors: ['#99582a', '#dda15e'] },
      { id: 'rabbit', label: 'Rabbit', emoji: '🐰', colors: ['#ffafcc', '#ffc8dd'] },
      { id: 'bear', label: 'Bear', emoji: '🐻', colors: ['#7f5539', '#b08968'] },
      { id: 'penguin', label: 'Penguin', emoji: '🐧', colors: ['#1d3557', '#457b9d'] },
      { id: 'frog', label: 'Frog', emoji: '🐸', colors: ['#2d6a4f', '#95d5b2'] },
      { id: 'owl', label: 'Owl', emoji: '🦉', colors: ['#774936', '#b08968'] },
      { id: 'dolphin', label: 'Dolphin', emoji: '🐬', colors: ['#0077b6', '#90e0ef'] },
      { id: 'whale', label: 'Whale', emoji: '🐳', colors: ['#023e8a', '#0096c7'] },
      { id: 'wolf', label: 'Wolf', emoji: '🐺', colors: ['#6b705c', '#a5a58d'] },
      { id: 'cat', label: 'Cat', emoji: '🐱', colors: ['#f4a261', '#e9c46a'] },
      { id: 'dog', label: 'Dog', emoji: '🐶', colors: ['#9c6644', '#ddb892'] },
    ]),
  },
  space: {
    id: 'space',
    name: 'Space Quest',
    icon: '🚀',
    description: 'Planets, stars, and cosmic powerups.',
    items: themedItems([
      { id: 'sun', label: 'Sun', emoji: '☀️', colors: ['#ee9b00', '#ffdd00'] },
      { id: 'moon', label: 'Moon', emoji: '🌙', colors: ['#495057', '#adb5bd'] },
      { id: 'earth', label: 'Earth', emoji: '🌍', colors: ['#0077b6', '#00b4d8'] },
      { id: 'mars', label: 'Mars', emoji: '🪐', colors: ['#9d0208', '#dc2f02'] },
      { id: 'rocket', label: 'Rocket', emoji: '🚀', colors: ['#5f0f40', '#9a031e'] },
      { id: 'star', label: 'Star', emoji: '🌟', colors: ['#f4a261', '#e9c46a'] },
      { id: 'satellite', label: 'Satellite', emoji: '🛰️', colors: ['#3a506b', '#5bc0be'] },
      { id: 'astronaut', label: 'Astronaut', emoji: '👨‍🚀', colors: ['#1d3557', '#457b9d'] },
      { id: 'alien', label: 'Alien', emoji: '👽', colors: ['#386641', '#6a994e'] },
      { id: 'galaxy', label: 'Galaxy', emoji: '🌌', colors: ['#240046', '#5a189a'] },
      { id: 'comet', label: 'Comet', emoji: '☄️', colors: ['#335c67', '#9e2a2b'] },
      { id: 'ufo', label: 'UFO', emoji: '🛸', colors: ['#2a9d8f', '#52b788'] },
      { id: 'meteor', label: 'Meteor', emoji: '🪨', colors: ['#6c584c', '#a98467'] },
      { id: 'telescope', label: 'Scope', emoji: '🔭', colors: ['#3d405b', '#81b29a'] },
      { id: 'nebula', label: 'Nebula', emoji: '✨', colors: ['#7b2cbf', '#c77dff'] },
      { id: 'planet', label: 'Planet', emoji: '🪐', colors: ['#8d99ae', '#edf2f4'] },
    ]),
  },
  snacks: {
    id: 'snacks',
    name: 'Snack Attack',
    icon: '🍿',
    description: 'Hungry mode with tasty matchups.',
    items: themedItems([
      { id: 'pizza', label: 'Pizza', emoji: '🍕', colors: ['#bc4749', '#f4a261'] },
      { id: 'burger', label: 'Burger', emoji: '🍔', colors: ['#99582a', '#dda15e'] },
      { id: 'fries', label: 'Fries', emoji: '🍟', colors: ['#f77f00', '#fcbf49'] },
      { id: 'taco', label: 'Taco', emoji: '🌮', colors: ['#ca6702', '#ee9b00'] },
      { id: 'donut', label: 'Donut', emoji: '🍩', colors: ['#d81159', '#ff5d8f'] },
      { id: 'icecream', label: 'Ice Cream', emoji: '🍨', colors: ['#80ed99', '#c7f9cc'] },
      { id: 'cookie', label: 'Cookie', emoji: '🍪', colors: ['#7f5539', '#b08968'] },
      { id: 'popcorn', label: 'Popcorn', emoji: '🍿', colors: ['#b5179e', '#f72585'] },
      { id: 'ramen', label: 'Ramen', emoji: '🍜', colors: ['#9d0208', '#e85d04'] },
      { id: 'sushi', label: 'Sushi', emoji: '🍣', colors: ['#1d3557', '#457b9d'] },
      { id: 'banana', label: 'Banana', emoji: '🍌', colors: ['#e9c46a', '#f4a261'] },
      { id: 'strawberry', label: 'Berry', emoji: '🍓', colors: ['#ae2012', '#d00000'] },
      { id: 'grapes', label: 'Grapes', emoji: '🍇', colors: ['#5a189a', '#7b2cbf'] },
      { id: 'cupcake', label: 'Cupcake', emoji: '🧁', colors: ['#ffafcc', '#ffc8dd'] },
      { id: 'pretzel', label: 'Pretzel', emoji: '🥨', colors: ['#9c6644', '#ddb892'] },
      { id: 'cherry', label: 'Cherry', emoji: '🍒', colors: ['#9a031e', '#bb3e03'] },
    ]),
  },
};

export const THEME_OPTIONS = Object.values(THEME_CATALOG);

export const resolveTheme = (themeId: string): ThemeConfig =>
  THEME_CATALOG[themeId as ThemeId] ?? THEME_CATALOG.disney;
