import { calculatePotOdds, estimateEquity, bestOfSeven, preflopStrength } from './core.js';

const BETTING_KEYS = [
  'street', 'ownStack', 'opponentStack', 'ownBet', 'opponentBet', 'pot', 'toCall',
  'currentBet', 'lastFullRaise', 'canRaise', 'minRaiseTarget', 'maxRaiseTarget'
];

function cloneCards(cards, label) {
  if (!Array.isArray(cards)) throw new Error(`${label} must be an array`);
  return cards.map(card => Object.freeze({ rank: card.rank, suit: card.suit }));
}

function finiteInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
  return value;
}

export function createPolicyObservation(holeCards, board, observableBetting, profile = {}) {
  if (!observableBetting || typeof observableBetting !== 'object') throw new Error('observable betting state is required');
  const betting = {};
  for (const key of BETTING_KEYS) {
    const value = observableBetting[key];
    if (key === 'canRaise') {
      if (typeof value !== 'boolean') throw new Error('canRaise must be boolean');
      betting[key] = value;
    } else {
      betting[key] = finiteInteger(value, key);
    }
  }
  const profileCopy = {};
  for (const [key, value] of Object.entries(profile)) {
    if (typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'string') {
      throw new Error(`profile ${key} must be scalar`);
    }
    profileCopy[key] = value;
  }
  return Object.freeze({
    holeCards: Object.freeze(cloneCards(holeCards, 'holeCards')),
    board: Object.freeze(cloneCards(board, 'board')),
    betting: Object.freeze(betting),
    profile: Object.freeze(profileCopy)
  });
}

function raiseTarget(betting, fraction = 0.55) {
  const desired = betting.currentBet + Math.max(
    betting.lastFullRaise,
    Math.round((betting.pot * fraction) / 10) * 10
  );
  return Math.max(betting.minRaiseTarget, Math.min(betting.maxRaiseTarget, desired));
}

export function decideRandom(observation, rng) {
  if (typeof rng !== 'function') throw new Error('policy RNG is required');
  const { betting } = observation;
  const actions = betting.toCall > 0 ? [{ type: 'fold' }, { type: 'call' }] : [{ type: 'check' }];
  if (betting.canRaise) actions.push({ type: 'raise', target: raiseTarget(betting, 0.35 + rng() * 0.65) });
  return actions[Math.floor(rng() * actions.length)];
}

function visibleStrength(observation, advisorSamples, advisorRng) {
  if (observation.board.length === 0) return preflopStrength(observation.holeCards);
  if (advisorSamples > 0) {
    return estimateEquity(observation.holeCards, observation.board, [], advisorSamples, advisorRng).equity;
  }
  const hand = bestOfSeven([...observation.holeCards, ...observation.board]);
  return Math.min(0.99, (hand.score[0] + 0.3 + hand.score[1] / 50) / 8.6);
}

export function createHeuristicPolicy({ advisorSamples = 24, advisorRng } = {}) {
  if (!Number.isSafeInteger(advisorSamples) || advisorSamples < 0) throw new Error('advisorSamples must be a nonnegative integer');
  if (advisorSamples > 0 && typeof advisorRng !== 'function') throw new Error('separate advisor RNG is required when sampling');
  return (observation, decisionRng) => {
    if (typeof decisionRng !== 'function') throw new Error('decision RNG is required');
    const { betting, profile } = observation;
    const strength = visibleStrength(observation, advisorSamples, advisorRng);
    const noisyStrength = strength + (decisionRng() - 0.5) * 0.08;
    const potOdds = calculatePotOdds(betting.toCall, betting.pot) / 100;
    if (betting.toCall > 0 && noisyStrength < potOdds - 0.06 && decisionRng() > 0.1) return { type: 'fold' };
    const bluffBoost = profile.exploitBluff ? 0.1 : 0;
    if (betting.canRaise && noisyStrength + bluffBoost > 0.67) {
      return { type: 'raise', target: raiseTarget(betting) };
    }
    return { type: betting.toCall > 0 ? 'call' : 'check' };
  };
}
