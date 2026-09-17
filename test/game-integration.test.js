import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');

test('browser AI consults engine raise eligibility before choosing a raise', () => {
  assert.match(game, /canRaise\(bettingSnapshot\(\),\s*'ai'\)/);
});

test('browser runout bypasses further actions and reaches showdown', () => {
  assert.match(game, /while\s*\(state\.street\s*<\s*3\)\s*await advanceStreet\(true\);\s*showdown\(\)/);
  assert.match(game, /if\s*\(runoutOnly\)\s*return/);
});