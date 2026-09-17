import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actorForStreet,
  applyBetAction,
  canRaise,
  createBettingState,
  formatStackDelta,
  postBlinds,
  settlePot,
  splitPot,
  toCall
} from '../src/betting.js';

function fresh(overrides = {}) {
  return createBettingState({
    stacks: { player: 1000, ai: 1000 },
    dealer: 'player',
    ...overrides
  });
}

test('heads-up blinds and actor order follow dealer rules', () => {
  const preflop = postBlinds(fresh());
  assert.deepEqual(preflop.stacks, { player: 990, ai: 980 });
  assert.deepEqual(preflop.bets, { player: 10, ai: 20 });
  assert.equal(preflop.pot, 30);
  assert.equal(preflop.currentBet, 20);
  assert.equal(preflop.actor, 'player');
  assert.equal(actorForStreet('player', 0), 'player');
  assert.equal(actorForStreet('player', 1), 'ai');
  assert.equal(actorForStreet('ai', 0), 'ai');
  assert.equal(actorForStreet('ai', 3), 'player');
});

test('check is prohibited facing a bet without mutating state', () => {
  const state = postBlinds(fresh());
  const snapshot = structuredClone(state);
  assert.throws(() => applyBetAction(state, 'player', { type: 'check' }), /cannot check facing 10/i);
  assert.deepEqual(state, snapshot);
});

test('legal call, full raise, and fold preserve chips and action order', () => {
  let state = postBlinds(fresh());
  state = applyBetAction(state, 'player', { type: 'call' });
  assert.equal(state.pot, 40);
  assert.equal(state.actor, 'ai');
  assert.equal(toCall(state, 'ai'), 0);

  state = applyBetAction(state, 'ai', { type: 'raise', target: 60 });
  assert.equal(state.pot, 80);
  assert.equal(state.currentBet, 60);
  assert.equal(state.lastFullRaise, 40);
  assert.equal(state.actor, 'player');

  state = applyBetAction(state, 'player', { type: 'fold' });
  assert.equal(state.handOver, true);
  assert.equal(state.winner, 'ai');
  assert.equal(state.actor, null);
  assert.equal(state.stacks.player + state.stacks.ai + state.pot, 2000);
});

test('an all-in below the call amount is treated as a call, not a raise', () => {
  const state = createBettingState({
    stacks: { player: 900, ai: 35 },
    bets: { player: 100, ai: 0 },
    pot: 100,
    currentBet: 100,
    actor: 'ai',
    dealer: 'player',
    lastFullRaise: 80,
    acted: ['player']
  });

  assert.throws(
    () => applyBetAction(state, 'ai', { type: 'raise', target: 35 }),
    /raise target must exceed/i
  );
});

test('short all-in raise does not reopen a prior actor raise right', () => {
  let state = createBettingState({
    stacks: { player: 900, ai: 30 },
    bets: { player: 100, ai: 100 },
    pot: 200,
    currentBet: 100,
    actor: 'ai',
    dealer: 'player',
    lastFullRaise: 100,
    acted: ['player']
  });
  state = applyBetAction(state, 'ai', { type: 'raise', target: 130 });
  assert.equal(state.currentBet, 130);
  assert.deepEqual(state.raiseLocked, ['player']);
  assert.equal(state.actor, 'player');
  assert.equal(canRaise(state, 'player'), false);
  assert.throws(
    () => applyBetAction(state, 'player', { type: 'raise', target: 230 }),
    /not reopened|opponent is all-in/i
  );
  state = applyBetAction(state, 'player', { type: 'call' });
  assert.equal(state.pot, 260);
  assert.equal(state.roundComplete, true);
});

test('short all-in call refunds unmatched heads-up contribution', () => {
  let state = createBettingState({
    stacks: { player: 900, ai: 60 },
    bets: { player: 100, ai: 0 },
    pot: 100,
    currentBet: 100,
    actor: 'ai',
    dealer: 'player',
    lastFullRaise: 80,
    acted: ['player']
  });
  state = applyBetAction(state, 'ai', { type: 'call' });
  assert.deepEqual(state.bets, { player: 60, ai: 60 });
  assert.deepEqual(state.stacks, { player: 940, ai: 0 });
  assert.equal(state.pot, 120);
  assert.equal(state.currentBet, 60);
  assert.equal(state.roundComplete, true);
  assert.equal(state.stacks.player + state.stacks.ai + state.pot, 1060);
});

test('matching an all-in blind completes the round without a redundant check', () => {
  let state = postBlinds(fresh({ stacks: { player: 1000, ai: 20 } }));
  assert.equal(state.actor, 'player');
  state = applyBetAction(state, 'player', { type: 'call' });
  assert.equal(state.stacks.ai, 0);
  assert.equal(state.roundComplete, true);
  assert.equal(state.actor, null);
});

test('raising into an all-in opponent is rejected without mutation', () => {
  const state = createBettingState({
    stacks: { player: 0, ai: 900 },
    bets: { player: 100, ai: 100 },
    pot: 200,
    currentBet: 100,
    actor: 'ai',
    dealer: 'player',
    lastFullRaise: 80
  });
  const snapshot = structuredClone(state);
  assert.equal(canRaise(state, 'ai'), false);
  assert.throws(() => applyBetAction(state, 'ai', { type: 'raise', target: 200 }), /opponent is all-in/i);
  assert.deepEqual(state, snapshot);
});

test('short blind all-in refunds unmatched chips and closes action', () => {
  for (const [stacks, expected] of [
    [{ player: 5, ai: 1000 }, { player: 0, ai: 995 }],
    [{ player: 1000, ai: 5 }, { player: 995, ai: 0 }]
  ]) {
    const state = postBlinds(fresh({ stacks }));
    assert.deepEqual(state.stacks, expected);
    assert.deepEqual(state.bets, { player: 5, ai: 5 });
    assert.equal(state.pot, 10);
    assert.equal(state.currentBet, 5);
    assert.equal(state.roundComplete, true);
    assert.equal(state.actor, null);
    assert.equal(state.stacks.player + state.stacks.ai + state.pot, 1005);
  }
});

test('terminal payout is idempotent and conserves chips', () => {
  const folded = applyBetAction(postBlinds(fresh()), 'player', { type: 'fold' });
  const paid = settlePot(folded, 'ai');
  const repeated = settlePot(paid, 'ai');
  assert.deepEqual(paid.stacks, { player: 990, ai: 1010 });
  assert.equal(paid.pot, 0);
  assert.equal(paid.paid, true);
  assert.deepEqual(repeated, paid);
  assert.equal(repeated.stacks.player + repeated.stacks.ai, 2000);
});

test('whole-hand stack delta includes posted blinds and preserves a loss sign', () => {
  const initialStack = 1000;
  const folded = applyBetAction(postBlinds(fresh()), 'player', { type: 'fold' });
  const paid = settlePot(folded, 'ai');
  assert.equal(paid.stacks.player - initialStack, -10);
  assert.equal(formatStackDelta(paid.stacks.player - initialStack), '-10');
  assert.equal(formatStackDelta(10), '+10');
});

test('split pot pays exactly once including an odd chip', () => {
  const state = createBettingState({
    stacks: { player: 900, ai: 899 },
    bets: { player: 100, ai: 100 },
    pot: 201,
    currentBet: 100,
    actor: null,
    dealer: 'player',
    handOver: true
  });
  const paid = splitPot(state);
  assert.deepEqual(paid.stacks, { player: 1000, ai: 1000 });
  assert.equal(paid.pot, 0);
  assert.equal(paid.paid, true);
  assert.deepEqual(splitPot(paid), paid);
});

test('invalid nonfinite, negative, fractional, and over-stack raise targets do not mutate', () => {
  for (const target of [NaN, Infinity, -1, 60.5, 2001]) {
    const state = postBlinds(fresh());
    const snapshot = structuredClone(state);
    assert.throws(() => applyBetAction(state, 'player', { type: 'raise', target }), /target/i);
    assert.deepEqual(state, snapshot);
  }
});
