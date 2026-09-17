import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPolicyObservation,
  createHeuristicPolicy,
  decideRandom
} from '../src/ai.js';
import { createDeck, createSeededRandom, shuffle } from '../src/core.js';

const C = (rank, suit = 's') => ({ rank, suit });

function observable(overrides = {}) {
  return {
    street: 1,
    ownStack: 180,
    opponentStack: 160,
    ownBet: 20,
    opponentBet: 40,
    pot: 80,
    toCall: 20,
    currentBet: 40,
    lastFullRaise: 20,
    canRaise: true,
    minRaiseTarget: 60,
    maxRaiseTarget: 200,
    ...overrides
  };
}

test('policy observation has an exact narrow public/private-own contract', () => {
  const hole = [C(14, 'h'), C(13, 'h')];
  const board = [C(12, 'h'), C(7, 'c'), C(2, 'd')];
  const observation = createPolicyObservation(hole, board, observable(), { foldRate: 0.2 });

  assert.deepEqual(Object.keys(observation).sort(), ['betting', 'board', 'holeCards', 'profile']);
  assert.deepEqual(Object.keys(observation.betting).sort(), [
    'canRaise', 'currentBet', 'lastFullRaise', 'maxRaiseTarget', 'minRaiseTarget',
    'opponentBet', 'opponentStack', 'ownBet', 'ownStack', 'pot', 'street', 'toCall'
  ]);
  assert.ok(Object.isFrozen(observation));
  hole[0].rank = 2;
  board.length = 0;
  assert.equal(observation.holeCards[0].rank, 14);
  assert.equal(observation.board.length, 3);
});

test('replacing unseen opponent cards and future runout cannot change a policy decision', () => {
  const dealA = {
    playerHole: [C(14, 'h'), C(13, 'h')],
    opponentHole: [C(2, 's'), C(3, 's')],
    flop: [C(12, 'h'), C(7, 'c'), C(2, 'd')],
    turn: C(4, 's'),
    river: C(5, 's')
  };
  const dealB = {
    playerHole: [C(14, 'h'), C(13, 'h')],
    opponentHole: [C(14, 'c'), C(14, 'd')],
    flop: [C(12, 'h'), C(7, 'c'), C(2, 'd')],
    turn: C(11, 'h'),
    river: C(10, 'h')
  };
  const observationFromFullDeal = deal => createPolicyObservation(
    deal.playerHole,
    deal.flop,
    observable(),
    { foldRate: 0.2 }
  );

  assert.notDeepEqual(dealA.opponentHole, dealB.opponentHole);
  assert.notDeepEqual([dealA.turn, dealA.river], [dealB.turn, dealB.river]);
  const observationA = observationFromFullDeal(dealA);
  const observationB = observationFromFullDeal(dealB);
  assert.deepEqual(observationA, observationB);
  for (const observation of [observationA, observationB]) {
    assert.deepEqual(Object.keys(observation).sort(), ['betting', 'board', 'holeCards', 'profile']);
    assert.equal(Object.hasOwn(observation, 'opponentHole'), false);
    assert.equal(Object.hasOwn(observation, 'turn'), false);
    assert.equal(Object.hasOwn(observation, 'river'), false);
  }

  const policyA = createHeuristicPolicy({ advisorSamples: 24, advisorRng: createSeededRandom(71) });
  const policyB = createHeuristicPolicy({ advisorSamples: 24, advisorRng: createSeededRandom(71) });
  const decisionA = policyA(observationA, createSeededRandom(19));
  const decisionB = policyB(observationB, createSeededRandom(19));
  assert.deepEqual(decisionA, decisionB);
});

test('advisor sampling has its own RNG and never mutates an already-dealt deck', () => {
  const dealtDeck = shuffle(createDeck(), createSeededRandom(99));
  const before = structuredClone(dealtDeck);
  const observation = createPolicyObservation(
    dealtDeck.slice(0, 2), dealtDeck.slice(4, 7), observable(), {}
  );

  createHeuristicPolicy({ advisorSamples: 4, advisorRng: createSeededRandom(1) })(observation, createSeededRandom(8));
  assert.deepEqual(dealtDeck, before);
  createHeuristicPolicy({ advisorSamples: 60, advisorRng: createSeededRandom(999) })(observation, createSeededRandom(8));
  assert.deepEqual(dealtDeck, before);
});

test('random policy emits only legal actions from the narrow observation', () => {
  const observation = createPolicyObservation([C(8), C(7)], [], observable(), {});
  const legal = new Set(['fold', 'call', 'raise']);
  for (let seed = 1; seed <= 40; seed++) {
    const action = decideRandom(observation, createSeededRandom(seed));
    assert.ok(legal.has(action.type));
    if (action.type === 'raise') {
      assert.ok(action.target >= observation.betting.minRaiseTarget);
      assert.ok(action.target <= observation.betting.maxRaiseTarget);
    }
  }
});
