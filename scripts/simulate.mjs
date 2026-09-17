#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDeck, createSeededRandom, shuffle, bestOfSeven, compareHands } from '../src/core.js';
import {
  actorForStreet, applyBetAction, canRaise, createBettingState, postBlinds,
  settlePot, splitPot, toCall
} from '../src/betting.js';
import { createPolicyObservation, createHeuristicPolicy, decideRandom } from '../src/ai.js';

const PLAYERS = ['player', 'ai'];
const other = who => who === 'player' ? 'ai' : 'player';
const cardId = card => `${card.rank}${card.suit}`;

function mixSeed(seed, index, stream) {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(stream + 1, 0x85ebca6b)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  return value >>> 0;
}

function stateIsFiniteInteger(state) {
  return [
    state.stacks.player, state.stacks.ai, state.bets.player, state.bets.ai,
    state.pot, state.currentBet, state.lastFullRaise
  ].every(Number.isSafeInteger);
}

function observableState(state, who, street) {
  const opponent = other(who);
  const maximum = state.bets[who] + state.stacks[who];
  const raiseAllowed = canRaise(state, who);
  return {
    street,
    ownStack: state.stacks[who],
    opponentStack: state.stacks[opponent],
    ownBet: state.bets[who],
    opponentBet: state.bets[opponent],
    pot: state.pot,
    toCall: toCall(state, who),
    currentBet: state.currentBet,
    lastFullRaise: state.lastFullRaise,
    canRaise: raiseAllowed,
    minRaiseTarget: raiseAllowed ? Math.min(maximum, state.currentBet + state.lastFullRaise) : maximum,
    maxRaiseTarget: maximum
  };
}

function runHand({ deckSeed, dealer, policyBySeat, policySeeds, advisorSeeds, advisorSamples }) {
  const deck = shuffle(createDeck(), createSeededRandom(deckSeed));
  const uniqueDeck = deck.length === 52 && new Set(deck.map(cardId)).size === 52;
  let cursor = 0;
  const holes = {
    player: [deck[cursor++], deck[cursor++]],
    ai: [deck[cursor++], deck[cursor++]]
  };
  const board = [];
  const totalChips = 2000;
  let conserved = true;
  let finiteIntegers = true;
  let street = 0;
  let transitions = 0;
  const decisionRng = {
    player: createSeededRandom(policySeeds.player),
    ai: createSeededRandom(policySeeds.ai)
  };
  const policies = {};
  for (const who of PLAYERS) {
    policies[who] = policyBySeat[who] === 'heuristic'
      ? createHeuristicPolicy({ advisorSamples, advisorRng: createSeededRandom(advisorSeeds[who]) })
      : decideRandom;
  }
  const check = state => {
    conserved &&= state.stacks.player + state.stacks.ai + state.pot === totalChips;
    finiteIntegers &&= stateIsFiniteInteger(state);
  };

  let state = postBlinds(createBettingState({ stacks: { player: 1000, ai: 1000 }, dealer }));
  check(state);
  let finish = null;
  while (!finish) {
    if (state.handOver) {
      const winner = state.winner;
      state = settlePot(state, winner);
      check(state);
      finish = { winner, reason: 'fold' };
      break;
    }

    if (state.roundComplete) {
      if (state.stacks.player === 0 || state.stacks.ai === 0) {
        while (board.length < 5) board.push(deck[cursor++]);
        street = 3;
      } else if (street < 3) {
        street++;
        const count = street === 1 ? 3 : 1;
        for (let index = 0; index < count; index++) board.push(deck[cursor++]);
        state = createBettingState({
          stacks: state.stacks,
          dealer,
          pot: state.pot,
          actor: actorForStreet(dealer, street),
          lastFullRaise: 20
        });
        check(state);
        continue;
      }

      if (street === 3) {
        while (board.length < 5) board.push(deck[cursor++]);
        const result = compareHands(
          bestOfSeven([...holes.player, ...board]),
          bestOfSeven([...holes.ai, ...board])
        );
        if (result === 0) {
          state = splitPot(state);
          finish = { winner: null, reason: 'showdown-tie' };
        } else {
          const winner = result > 0 ? 'player' : 'ai';
          state = settlePot(state, winner);
          finish = { winner, reason: 'showdown' };
        }
        check(state);
        break;
      }
    }

    const who = state.actor;
    if (!who) throw new Error('nonterminal hand has no actor');
    const observation = createPolicyObservation(
      holes[who],
      board,
      observableState(state, who, street),
      { exploitBluff: false }
    );
    const action = policies[who](observation, decisionRng[who]);
    state = applyBetAction(state, who, action);
    transitions++;
    check(state);
    if (transitions > 100) throw new Error('hand exceeded transition limit');
  }

  return {
    terminal: state.handOver && state.paid && state.pot === 0 && state.actor === null,
    chipConserved: conserved,
    finiteIntegerState: finiteIntegers,
    uniqueDeck,
    evaluatorUsed: finish.reason.startsWith('showdown'),
    winner: finish.winner,
    reason: finish.reason,
    net: { player: state.stacks.player - 1000, ai: state.stacks.ai - 1000 },
    transitions,
    deckFingerprint: deck.slice(0, 12).map(cardId).join(' ')
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pairedStatistics(values) {
  const average = mean(values);
  if (values.length < 2) {
    return {
      seedSets: values.length,
      mean: average,
      standardError: null,
      confidence95: null
    };
  }
  const variance = values.reduce(
    (sum, value) => sum + (value - average) ** 2,
    0
  ) / (values.length - 1);
  const standardError = Math.sqrt(variance / values.length);
  return {
    seedSets: values.length,
    mean: average,
    standardError,
    confidence95: [average - 1.96 * standardError, average + 1.96 * standardError]
  };
}

export function runSimulation({ hands, seed, advisorSamples = 12 }) {
  if (!Number.isSafeInteger(hands) || hands <= 0 || hands % 2 !== 0) {
    throw new Error('--hands must be a positive even integer (two seat-swapped hands per paired seed set)');
  }
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('--seed must be an integer from 0 to 4294967295');
  if (!Number.isSafeInteger(advisorSamples) || advisorSamples < 0) throw new Error('advisorSamples must be a nonnegative integer');

  const summary = {
    completedHands: 0,
    terminalHands: 0,
    chipConservedHands: 0,
    finiteIntegerStateHands: 0,
    uniqueDeckHands: 0,
    evaluatorHands: 0,
    showdownHands: 0,
    foldHands: 0,
    invalidHands: 0
  };
  const samples = [];
  const pairedDifferences = [];
  let heuristicTotal = 0;

  for (let pair = 0; pair < hands / 2; pair++) {
    const deckSeed = mixSeed(seed, pair, 0);
    const dealer = pair % 2 === 0 ? 'player' : 'ai';
    const pairHeuristicNets = [];
    const configurations = [
      { player: 'heuristic', ai: 'random' },
      { player: 'random', ai: 'heuristic' }
    ];
    for (let side = 0; side < configurations.length; side++) {
      const policyBySeat = configurations[side];
      const result = runHand({
        deckSeed,
        dealer,
        policyBySeat,
        policySeeds: {
          player: mixSeed(seed, pair, 10 + side * 2),
          ai: mixSeed(seed, pair, 11 + side * 2)
        },
        advisorSeeds: {
          player: mixSeed(seed, pair, 20 + side * 2),
          ai: mixSeed(seed, pair, 21 + side * 2)
        },
        advisorSamples
      });
      summary.completedHands++;
      summary.terminalHands += Number(result.terminal);
      summary.chipConservedHands += Number(result.chipConserved);
      summary.finiteIntegerStateHands += Number(result.finiteIntegerState);
      summary.uniqueDeckHands += Number(result.uniqueDeck);
      summary.evaluatorHands += Number(result.evaluatorUsed);
      summary.showdownHands += Number(result.reason.startsWith('showdown'));
      summary.foldHands += Number(result.reason === 'fold');
      const valid = result.terminal && result.chipConserved && result.finiteIntegerState && result.uniqueDeck;
      summary.invalidHands += Number(!valid);
      const heuristicSeat = policyBySeat.player === 'heuristic' ? 'player' : 'ai';
      const heuristicNet = result.net[heuristicSeat];
      heuristicTotal += heuristicNet;
      pairHeuristicNets.push(heuristicNet);
      if (samples.length < 8) samples.push({
        hand: summary.completedHands,
        pairedSeedSet: pair + 1,
        deckSeed,
        dealer,
        heuristicSeat,
        terminal: result.terminal,
        winner: result.winner,
        reason: result.reason,
        heuristicNet,
        transitions: result.transitions,
        deckFingerprint: result.deckFingerprint
      });
    }
    pairedDifferences.push(pairHeuristicNets.reduce((sum, value) => sum + value, 0));
  }

  const requestedCounts = [
    summary.completedHands, summary.terminalHands, summary.chipConservedHands,
    summary.finiteIntegerStateHands, summary.uniqueDeckHands
  ];
  if (requestedCounts.some(count => count !== hands) || summary.invalidHands !== 0) {
    throw new Error(`simulation invariant failure: ${JSON.stringify(summary)}`);
  }

  const report = {
    schemaVersion: 1,
    disclaimer: 'Test/replay evidence using virtual chips only; this is not real-world profit evidence.',
    config: {
      requestedHands: hands,
      seed,
      pairedSeedSets: hands / 2,
      startingStackPerSeat: 1000,
      blinds: [10, 20],
      advisorSamples
    },
    rngStreams: {
      deck: 'separate seeded stream per paired seed set',
      policy: 'separate seeded stream per policy and hand',
      advisor: 'separate seeded stream per heuristic hand'
    },
    summary,
    comparison: {
      unit: 'virtual chips per completed hand',
      heuristic: { totalNet: heuristicTotal, meanNet: heuristicTotal / hands },
      random: { totalNet: -heuristicTotal, meanNet: -heuristicTotal / hands },
      pairedDifference: pairedStatistics(pairedDifferences)
    },
    limitations: [
      'The heuristic is a small rule-based policy, not a trained or equilibrium poker agent.',
      'Both policies play fixed-stack independent heads-up hands; table selection, rake, bankroll risk, and adaptation are absent.',
      'The paired 95% interval describes Monte Carlo uncertainty for these seeded virtual-chip replays, not future profit or real-world performance.',
      'Policy and advisor choices depend on finite pseudorandom streams and the configured advisor sample count.'
    ],
    samples
  };
  return report;
}

function parseCli(argv) {
  const values = { hands: null, seed: null, out: null };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!Object.hasOwn(values, flag?.replace(/^--/, '')) || index + 1 >= argv.length) {
      throw new Error(`unknown or incomplete argument: ${flag ?? '(missing)'}`);
    }
    values[flag.slice(2)] = argv[index + 1];
  }
  const hands = Number(values.hands);
  const seed = Number(values.seed);
  if (!Number.isSafeInteger(hands) || hands <= 0 || hands % 2 !== 0) {
    throw new Error('--hands must be a positive even integer (two seat-swapped hands per paired seed set)');
  }
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('--seed must be an integer from 0 to 4294967295');
  if (!values.out) throw new Error('--out is required');
  return { hands, seed, out: values.out };
}

function main() {
  try {
    const options = parseCli(process.argv.slice(2));
    const report = runSimulation(options);
    const output = resolve(options.out);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`completed ${report.summary.completedHands}/${report.config.requestedHands} hands; wrote ${output}\n`);
  } catch (error) {
    process.stderr.write(`simulation error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
