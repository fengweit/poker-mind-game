import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  OPPONENT_PROFILES,
  createChallengeProgress,
  recordChallengeEvent,
  resetChallengeProgress
} from '../src/challenges.js';
import { buildEdition, EDITION_FILES } from '../scripts/build-edition.mjs';
import { createHeuristicPolicy, createPolicyObservation } from '../src/ai.js';

async function filesUnder(root, dir = root) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(root, path));
    else result.push(relative(root, path).replaceAll('\\', '/'));
  }
  return result.sort();
}

test('challenge edition exposes three distinct disclosed opponent styles', () => {
  assert.deepEqual(Object.keys(OPPONENT_PROFILES), ['vesper', 'ember', 'slate']);
  const profiles = Object.values(OPPONENT_PROFILES);
  assert.deepEqual(profiles.map(profile => profile.name), ['Vesper', 'Ember', 'Slate']);
  assert.equal(new Set(profiles.map(profile => profile.style)).size, 3);
  for (const profile of profiles) {
    assert.ok(profile.disclosure.length >= 30);
    assert.ok(profile.challenge.title.length > 0);
    assert.ok(profile.challenge.event.length > 0);
    assert.ok(Number.isSafeInteger(profile.challenge.target) && profile.challenge.target > 0);
    assert.ok(profile.policy.raiseThreshold > 0 && profile.policy.raiseThreshold < 1);
    assert.ok(profile.policy.raiseFraction > 0 && profile.policy.raiseFraction <= 1);
    assert.ok(Object.isFrozen(profile));
  }
});

test('challenge progress is bounded, profile-specific, persistent-data-safe, and resettable', () => {
  let progress = createChallengeProgress();
  assert.deepEqual(progress, { vesper: 0, ember: 0, slate: 0 });

  progress = recordChallengeEvent(progress, 'ember', 'fold-facing-bet');
  assert.equal(progress.ember, 1);
  assert.equal(progress.vesper, 0);
  progress = recordChallengeEvent(progress, 'ember', 'fold-facing-bet');
  progress = recordChallengeEvent(progress, 'ember', 'fold-facing-bet');
  assert.equal(progress.ember, OPPONENT_PROFILES.ember.challenge.target);
  assert.equal(progress.unknown, undefined);
  assert.throws(() => recordChallengeEvent(progress, 'missing', 'hand-complete'), /unknown opponent profile/);
  assert.deepEqual(resetChallengeProgress(), { vesper: 0, ember: 0, slate: 0 });
});

test('opponent style settings produce distinct legal pressure sizing without hidden cards', () => {
  const betting = {
    street: 0, ownStack: 180, opponentStack: 160, ownBet: 20, opponentBet: 40,
    pot: 80, toCall: 20, currentBet: 40, lastFullRaise: 20, canRaise: true,
    minRaiseTarget: 60, maxRaiseTarget: 200
  };
  const policy = createHeuristicPolicy({ advisorSamples: 0 });
  const decisionRng = () => 0.5;
  const decisions = ['ember', 'slate'].map(id => {
    const profile = OPPONENT_PROFILES[id];
    const observation = createPolicyObservation(
      [{ rank: 14, suit: 's' }, { rank: 14, suit: 'h' }],
      [],
      betting,
      profile.policy
    );
    return policy(observation, decisionRng);
  });
  assert.deepEqual(decisions.map(decision => decision.type), ['raise', 'raise']);
  assert.ok(decisions[0].target > decisions[1].target);
  for (const decision of decisions) {
    assert.ok(decision.target >= betting.minRaiseTarget && decision.target <= betting.maxRaiseTarget);
  }
});

test('adaptive profile actually reacts to an observed high player raise rate', () => {
  const betting = {
    street: 0, ownStack: 180, opponentStack: 160, ownBet: 20, opponentBet: 40,
    pot: 80, toCall: 20, currentBet: 40, lastFullRaise: 20, canRaise: true,
    minRaiseTarget: 60, maxRaiseTarget: 200
  };
  const policy = createHeuristicPolicy({ advisorSamples: 0 });
  let changed = false;
  const ranks = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  for (const a of ranks) for (const b of ranks) {
    if (a === b) continue;
    const hole = [{ rank: a, suit: 's' }, { rank: b, suit: 'h' }];
    const base = createPolicyObservation(hole, [], betting, OPPONENT_PROFILES.vesper.policy);
    const cautious = createPolicyObservation(hole, [], betting, { ...OPPONENT_PROFILES.vesper.policy, trap: true });
    if (policy(base, () => 0.5).type !== policy(cautious, () => 0.5).type) changed = true;
  }
  assert.equal(changed, true);
});

test('offline challenge package is an exact allowlist with instructions and no network dependency', async () => {
  const out = await mkdtemp(join(tmpdir(), 'the-tell-edition-'));
  try {
    await buildEdition({ outDir: out });
    const files = await filesUnder(out);
    assert.deepEqual(files, [...EDITION_FILES].sort());
    assert.ok(files.includes('OFFLINE_README.txt'));
    assert.ok(files.includes('src/challenges.js'));
    assert.deepEqual(files.filter(file => /(^|\/)(?:\.env|\.git|research|docs|artifacts|node_modules)(?:\/|$)/.test(file)), []);
    const readme = await readFile(join(out, 'OFFLINE_README.txt'), 'utf8');
    assert.match(readme, /python3 -m http\.server 4173/);
    assert.match(readme, /http:\/\/127\.0\.0\.1:4173/);
    assert.match(readme, /virtual chips only/i);
    const html = await readFile(join(out, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
