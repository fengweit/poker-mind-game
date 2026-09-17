import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDeck, shuffle, evaluate, compareHands, bestOfSeven,
  calculatePotOdds, estimateEquity, createSeededRandom
} from '../src/core.js';

const C = (rank, suit = 's') => ({ rank, suit });

test('deck contains 52 unique cards', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map(c => `${c.rank}${c.suit}`)).size, 52);
});

test('seeded shuffle is deterministic and preserves cards', () => {
  const a = shuffle(createDeck(), createSeededRandom(42));
  const b = shuffle(createDeck(), createSeededRandom(42));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, createDeck());
});

test('evaluates every hand category', () => {
  const cases = [
    ['Royal Flush', [C(14,'h'),C(13,'h'),C(12,'h'),C(11,'h'),C(10,'h')]],
    ['Straight Flush', [C(9,'d'),C(8,'d'),C(7,'d'),C(6,'d'),C(5,'d')]],
    ['Four of a Kind', [C(7),C(7,'h'),C(7,'d'),C(7,'c'),C(2)]],
    ['Full House', [C(10),C(10,'h'),C(10,'d'),C(4),C(4,'h')]],
    ['Flush', [C(14,'c'),C(10,'c'),C(8,'c'),C(4,'c'),C(2,'c')]],
    ['Straight', [C(6),C(5,'h'),C(4,'d'),C(3,'c'),C(2)]],
    ['Three of a Kind', [C(9),C(9,'h'),C(9,'d'),C(5),C(2)]],
    ['Two Pair', [C(11),C(11,'h'),C(3,'d'),C(3,'c'),C(8)]],
    ['Pair', [C(12),C(12,'h'),C(9,'d'),C(5,'c'),C(2)]],
    ['High Card', [C(14),C(11,'h'),C(8,'d'),C(5,'c'),C(2)]]
  ];
  for (const [name, cards] of cases) assert.equal(evaluate(cards).name, name);
});

test('ace can play low in a wheel straight', () => {
  const hand = evaluate([C(14),C(2,'h'),C(3,'d'),C(4,'c'),C(5)]);
  assert.equal(hand.name, 'Straight');
  assert.deepEqual(hand.score.slice(0, 2), [4, 5]);
});

test('wheel straight loses to a six-high straight', () => {
  const wheel = evaluate([C(14),C(2,'h'),C(3,'d'),C(4,'c'),C(5)]);
  const sixHigh = evaluate([C(6),C(5,'h'),C(4,'d'),C(3,'c'),C(2)]);
  assert.deepEqual(wheel.score, [4, 5]);
  assert.deepEqual(sixHigh.score, [4, 6]);
  assert.equal(compareHands(wheel, sixHigh), -1);
});

test('best of seven selects strongest five-card hand', () => {
  const result = bestOfSeven([C(14,'h'),C(13,'h'),C(12,'h'),C(11,'h'),C(10,'h'),C(2),C(2,'d')]);
  assert.equal(result.name, 'Royal Flush');
  assert.equal(result.cards.length, 5);
});

test('best of seven full house chooses higher trips when two trip ranks exist', () => {
  const result = bestOfSeven([
    C(14,'s'), C(14,'h'), C(14,'d'),
    C(13,'s'), C(13,'h'), C(13,'d'),
    C(2,'c')
  ]);
  assert.equal(result.name, 'Full House');
  assert.deepEqual(result.score, [6, 14, 13]);
});

test('compareHands resolves kickers and ties', () => {
  assert.equal(compareHands(evaluate([C(10),C(10,'h'),C(14),C(7),C(3)]), evaluate([C(10,'d'),C(10,'c'),C(13),C(7,'h'),C(3,'d')])), 1);
  assert.equal(compareHands(evaluate([C(14),C(13),C(9),C(6),C(2)]), evaluate([C(14,'h'),C(13,'h'),C(9,'h'),C(6,'h'),C(2,'h')])), 0);
});

test('four of a kind compares by kicker', () => {
  const aceKicker = evaluate([C(7,'s'),C(7,'h'),C(7,'d'),C(7,'c'),C(14)]);
  const kingKicker = evaluate([C(7,'s'),C(7,'h'),C(7,'d'),C(7,'c'),C(13)]);
  assert.deepEqual(aceKicker.score, [7, 7, 14]);
  assert.deepEqual(kingKicker.score, [7, 7, 13]);
  assert.equal(compareHands(aceKicker, kingKicker), 1);
});

test('seven-card hands tie when the best five cards are all on the board', () => {
  const board = [C(14,'h'),C(13,'h'),C(12,'h'),C(11,'h'),C(10,'h')];
  const hero = bestOfSeven([...board, C(2,'s'), C(3,'d')]);
  const villain = bestOfSeven([...board, C(9,'c'), C(9,'d')]);
  assert.equal(hero.name, 'Royal Flush');
  assert.equal(villain.name, 'Royal Flush');
  assert.equal(compareHands(hero, villain), 0);
});

test('flush comparison is lexicographic across every kicker', () => {
  const threeKicker = evaluate([C(14,'h'),C(13,'h'),C(9,'h'),C(5,'h'),C(3,'h')]);
  const twoKicker = evaluate([C(14,'d'),C(13,'d'),C(9,'d'),C(5,'d'),C(2,'d')]);
  assert.deepEqual(threeKicker.score, [5, 14, 13, 9, 5, 3]);
  assert.deepEqual(twoKicker.score, [5, 14, 13, 9, 5, 2]);
  assert.equal(compareHands(threeKicker, twoKicker), 1);
});

test('pot odds calculates call break-even percentage', () => {
  assert.equal(calculatePotOdds(20, 80), 20);
  assert.equal(calculatePotOdds(0, 100), 0);
});

test('equity simulation is deterministic with seeded RNG and finds locked win', () => {
  const hero = [C(14,'h'), C(14,'d')];
  const board = [C(14,'s'), C(13,'s'), C(13,'h'), C(2,'c'), C(3,'d')];
  const result = estimateEquity(hero, board, [], 300, createSeededRandom(7));
  assert.ok(result.equity > 0.98);
  assert.equal(result.samples, 300);
});
