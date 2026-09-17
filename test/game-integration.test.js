import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');

test('browser AI consults engine raise eligibility before choosing a raise', () => {
  assert.match(game, /canRaise\(bettingSnapshot\(\),\s*'ai'\)/);
});

test('browser AI is invoked through the narrow policy observation API', () => {
  assert.match(game, /import\s*\{[^}]*createPolicyObservation[^}]*createHeuristicPolicy[^}]*\}\s*from\s*['"]\.\/ai\.js['"]/s);
  assert.match(game, /createPolicyObservation\(\s*state\.ai,\s*state\.board,/s);
  assert.match(game, /browserAiPolicy\(observation,\s*aiDecisionRng\)/);
  assert.doesNotMatch(game, /browserAiPolicy\(state/);
});

test('browser runout bypasses further actions and reaches showdown', () => {
  assert.match(game, /while\s*\(state\.street\s*<\s*3\)\s*await advanceStreet\(true\);\s*showdown\(\)/);
  assert.match(game, /if\s*\(runoutOnly\)\s*return/);
});