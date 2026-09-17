export const SUITS = ['s', 'h', 'd', 'c'];
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function createDeck() {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit })));
}

export function createSeededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(cards, rng = Math.random) {
  const copy = cards.map(card => ({ ...card }));
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const categoryNames = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];

export function evaluate(cards) {
  if (!Array.isArray(cards) || cards.length !== 5) throw new Error('evaluate requires exactly five cards');
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const groups = [...new Map(ranks.map(rank => [rank, ranks.filter(r => r === rank).length])).entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every(c => c.suit === cards[0].suit);
  const unique = [...new Set(ranks)];
  let straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) straightHigh = unique[0];
    else if (unique.join(',') === '14,5,4,3,2') straightHigh = 5;
  }

  let score;
  if (straightHigh && flush) score = [8, straightHigh];
  else if (groups[0][1] === 4) score = [7, groups[0][0], groups[1][0]];
  else if (groups[0][1] === 3 && groups[1][1] === 2) score = [6, groups[0][0], groups[1][0]];
  else if (flush) score = [5, ...ranks];
  else if (straightHigh) score = [4, straightHigh];
  else if (groups[0][1] === 3) score = [3, groups[0][0], ...groups.slice(1).map(g => g[0]).sort((a,b) => b-a)];
  else if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairs = groups.filter(g => g[1] === 2).map(g => g[0]).sort((a,b) => b-a);
    score = [2, ...pairs, groups.find(g => g[1] === 1)[0]];
  } else if (groups[0][1] === 2) score = [1, groups[0][0], ...groups.slice(1).map(g => g[0]).sort((a,b) => b-a)];
  else score = [0, ...ranks];

  const name = score[0] === 8 && score[1] === 14 ? 'Royal Flush' : categoryNames[score[0]];
  return { name, score, cards: [...cards] };
}

export function compareHands(a, b) {
  const length = Math.max(a.score.length, b.score.length);
  for (let i = 0; i < length; i++) {
    const delta = (a.score[i] || 0) - (b.score[i] || 0);
    if (delta) return Math.sign(delta);
  }
  return 0;
}

function combinations(cards, size) {
  const result = [];
  const choose = (start, picked) => {
    if (picked.length === size) { result.push(picked); return; }
    for (let i = start; i <= cards.length - (size - picked.length); i++) choose(i + 1, [...picked, cards[i]]);
  };
  choose(0, []);
  return result;
}

export function bestOfSeven(cards) {
  if (cards.length < 5 || cards.length > 7) throw new Error('bestOfSeven requires five to seven cards');
  return combinations(cards, 5).map(evaluate).reduce((best, hand) => compareHands(hand, best) > 0 ? hand : best);
}

export function calculatePotOdds(callAmount, pot) {
  if (callAmount <= 0) return 0;
  return (callAmount / (pot + callAmount)) * 100;
}

const id = c => `${c.rank}${c.suit}`;
export function estimateEquity(hero, board = [], villain = [], samples = 500, rng = Math.random) {
  const known = new Set([...hero, ...board, ...villain].map(id));
  const available = createDeck().filter(card => !known.has(id(card)));
  let wins = 0, ties = 0;
  for (let n = 0; n < samples; n++) {
    const deck = shuffle(available, rng);
    let cursor = 0;
    const opponent = villain.length === 2 ? villain : [deck[cursor++], deck[cursor++]];
    const runout = [...board];
    while (runout.length < 5) runout.push(deck[cursor++]);
    const result = compareHands(bestOfSeven([...hero, ...runout]), bestOfSeven([...opponent, ...runout]));
    if (result > 0) wins++;
    else if (result === 0) ties++;
  }
  return { equity: (wins + ties / 2) / samples, wins, ties, samples };
}

export function preflopStrength(cards) {
  const [a, b] = [...cards].sort((x, y) => y.rank - x.rank);
  let value = (a.rank + b.rank) / 28;
  if (a.rank === b.rank) value += .28 + a.rank / 100;
  if (a.suit === b.suit) value += .06;
  const gap = a.rank - b.rank;
  if (gap <= 1) value += .06;
  else if (gap >= 4) value -= .08;
  return Math.max(.05, Math.min(.98, value));
}
