const PLAYERS = ['player', 'ai'];

function other(who) {
  return who === 'player' ? 'ai' : 'player';
}

function assertPlayer(who) {
  if (!PLAYERS.includes(who)) throw new Error(`unknown player: ${who}`);
}

function assertChips(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
}

function normalizePlayers(value = {}, fallback = 0) {
  const result = {
    player: value.player ?? fallback,
    ai: value.ai ?? fallback
  };
  for (const who of PLAYERS) assertChips(result[who], `${who} chips`);
  return result;
}

function cloneState(state) {
  return {
    ...state,
    stacks: { ...state.stacks },
    bets: { ...state.bets },
    acted: [...state.acted],
    raiseLocked: [...state.raiseLocked]
  };
}

function addOnce(items, value) {
  return items.includes(value) ? [...items] : [...items, value];
}

function commit(state, who, amount) {
  assertChips(amount, 'commit amount');
  if (amount > state.stacks[who]) throw new Error('commit amount exceeds stack');
  state.stacks[who] -= amount;
  state.bets[who] += amount;
  state.pot += amount;
}

function refundUnmatched(state) {
  const high = state.bets.player > state.bets.ai ? 'player' : 'ai';
  const low = other(high);
  const refund = state.bets[high] - state.bets[low];
  if (refund <= 0) return;
  state.bets[high] -= refund;
  state.stacks[high] += refund;
  state.pot -= refund;
  state.currentBet = state.bets[low];
}

function validateState(state) {
  normalizePlayers(state.stacks);
  normalizePlayers(state.bets);
  assertChips(state.pot, 'pot');
  assertChips(state.currentBet, 'current bet');
  assertChips(state.lastFullRaise, 'last full raise');
}

export function actorForStreet(dealer, street) {
  assertPlayer(dealer);
  assertChips(street, 'street');
  return street === 0 ? dealer : other(dealer);
}

export function createBettingState({
  stacks,
  dealer,
  bets = { player: 0, ai: 0 },
  pot = 0,
  currentBet = 0,
  actor = null,
  lastFullRaise = 20,
  acted = [],
  raiseLocked = [],
  roundComplete = false,
  handOver = false,
  winner = null,
  paid = false
}) {
  assertPlayer(dealer);
  const state = {
    stacks: normalizePlayers(stacks),
    bets: normalizePlayers(bets),
    pot,
    currentBet,
    actor,
    dealer,
    lastFullRaise,
    acted: [...acted],
    raiseLocked: [...raiseLocked],
    roundComplete,
    handOver,
    winner,
    paid
  };
  if (actor !== null) assertPlayer(actor);
  for (const who of [...state.acted, ...state.raiseLocked]) assertPlayer(who);
  validateState(state);
  return state;
}

export function postBlinds(state, smallBlind = 10, bigBlind = 20) {
  assertChips(smallBlind, 'small blind');
  assertChips(bigBlind, 'big blind');
  if (smallBlind <= 0 || bigBlind <= smallBlind) throw new Error('blinds must increase');
  const next = cloneState(state);
  if (next.pot !== 0 || next.bets.player !== 0 || next.bets.ai !== 0) {
    throw new Error('blinds require a fresh betting state');
  }
  const small = next.dealer;
  const big = other(small);
  commit(next, small, Math.min(smallBlind, next.stacks[small]));
  commit(next, big, Math.min(bigBlind, next.stacks[big]));
  next.currentBet = Math.max(next.bets.player, next.bets.ai);
  next.lastFullRaise = bigBlind;
  next.actor = actorForStreet(next.dealer, 0);
  next.acted = [];
  next.raiseLocked = [];
  next.roundComplete = false;
  if (PLAYERS.some(player => next.stacks[player] === 0)) {
    const allInPlayer = PLAYERS.find(player => next.stacks[player] === 0);
    const opponent = other(allInPlayer);
    const opponentStillOwes = next.bets[allInPlayer] > next.bets[opponent]
      && next.stacks[opponent] > 0;
    if (opponentStillOwes) {
      next.actor = opponent;
    } else {
      refundUnmatched(next);
      next.roundComplete = true;
      next.actor = null;
    }
  }
  return next;
}

export function toCall(state, who) {
  assertPlayer(who);
  return Math.max(0, state.currentBet - state.bets[who]);
}

export function formatStackDelta(value) {
  if (!Number.isSafeInteger(value)) throw new Error('stack delta must be an integer');
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toLocaleString()}`;
}

export function canRaise(state, who) {
  assertPlayer(who);
  const opponent = other(who);
  return !state.handOver
    && !state.paid
    && state.actor === who
    && state.stacks[opponent] > 0
    && state.bets[who] + state.stacks[who] > state.currentBet
    && !state.raiseLocked.includes(who);
}

export function applyBetAction(state, who, action) {
  assertPlayer(who);
  if (!action || typeof action.type !== 'string') throw new Error('action type is required');
  validateState(state);
  if (state.handOver || state.paid) throw new Error('hand is already complete');
  if (state.actor !== who) throw new Error(`it is not ${who}'s turn`);

  const next = cloneState(state);
  const opponent = other(who);
  const owed = toCall(next, who);

  if (action.type === 'fold') {
    next.handOver = true;
    next.winner = opponent;
    next.actor = null;
    return next;
  }

  if (action.type === 'check') {
    if (owed > 0) throw new Error(`cannot check facing ${owed}`);
    next.acted = addOnce(next.acted, who);
  } else if (action.type === 'call') {
    const amount = Math.min(owed, next.stacks[who]);
    commit(next, who, amount);
    next.acted = addOnce(next.acted, who);
    if (amount < owed) refundUnmatched(next);
  } else if (action.type === 'raise') {
    const target = action.target;
    assertChips(target, 'raise target');
    if (next.stacks[opponent] === 0) throw new Error('cannot raise while opponent is all-in');
    const maximum = next.bets[who] + next.stacks[who];
    if (target > maximum) throw new Error('raise target exceeds stack');
    if (target <= next.currentBet) throw new Error('raise target must exceed current bet');
    if (next.raiseLocked.includes(who)) throw new Error('betting was not reopened for this player');

    const raiseSize = target - next.currentBet;
    const fullRaise = raiseSize >= next.lastFullRaise;
    if (!fullRaise && target !== maximum) {
      throw new Error(`raise target must be at least ${next.currentBet + next.lastFullRaise} unless all-in`);
    }

    commit(next, who, target - next.bets[who]);
    next.currentBet = target;
    if (fullRaise) {
      next.lastFullRaise = raiseSize;
      next.raiseLocked = [];
    } else {
      next.raiseLocked = next.acted.filter(player => player !== who);
    }
    next.acted = [who];
  } else {
    throw new Error(`unknown action: ${action.type}`);
  }

  const matched = next.bets.player === next.bets.ai;
  const allIn = PLAYERS.some(player => next.stacks[player] === 0);
  next.roundComplete = matched
    && (allIn || PLAYERS.every(player => next.acted.includes(player)));
  next.actor = next.roundComplete ? null : opponent;
  return next;
}

export function settlePot(state, winner = state.winner) {
  if (state.paid) return cloneState(state);
  assertPlayer(winner);
  const next = cloneState(state);
  refundUnmatched(next);
  next.stacks[winner] += next.pot;
  next.pot = 0;
  next.handOver = true;
  next.winner = winner;
  next.paid = true;
  next.actor = null;
  return next;
}

export function splitPot(state) {
  if (state.paid) return cloneState(state);
  const next = cloneState(state);
  refundUnmatched(next);
  const playerShare = Math.floor(next.pot / 2);
  next.stacks.player += playerShare;
  next.stacks.ai += next.pot - playerShare;
  next.pot = 0;
  next.handOver = true;
  next.winner = null;
  next.paid = true;
  next.actor = null;
  return next;
}
