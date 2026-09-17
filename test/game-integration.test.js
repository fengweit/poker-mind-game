import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../src/scene.js', import.meta.url), 'utf8');

test('browser AI consults engine raise eligibility before choosing a raise', () => {
  assert.match(game, /canRaise\(bettingSnapshot\(\),\s*'ai'\)/);
});

test('browser AI is invoked through the narrow policy observation API', () => {
  assert.match(game, /import\s*\{[^}]*createPolicyObservation[^}]*createHeuristicPolicy[^}]*\}\s*from\s*['"]\.\/ai\.js['"]/s);
  assert.match(game, /createPolicyObservation\(\s*state\.ai,\s*state\.board,/s);
  assert.match(game, /browserAiPolicy\(observation,\s*aiDecisionRng\)/);
  assert.doesNotMatch(game, /browserAiPolicy\(state/);
});

test('browser runout bypasses actions, cancels stale hands, and reaches showdown', () => {
  assert.match(game, /while\s*\(state\.street\s*<\s*3\s*&&\s*epoch\s*===\s*state\.handEpoch\)\s*await advanceStreet\(true,\s*epoch\)/);
  assert.match(game, /if\s*\(epoch\s*===\s*state\.handEpoch\)\s*showdown\(\)/);
  assert.match(game, /if\s*\(runoutOnly\)\s*return/);
});

test('cinematic effects bind to actual deal, chip, board, showdown, and reset paths', () => {
  assert.match(game, /emitScene\('deal'/);
  assert.match(game, /emitScene\('committed',\s*\{\s*actor:\s*who,\s*amount:\s*committed,\s*pot:\s*state\.pot/s);
  assert.match(game, /emitScene\('boardReveal'/);
  assert.match(game, /function\s+showdown\(\)[\s\S]*emitScene\('showdown'/);
  assert.match(game, /function\s+newHand\(\)[\s\S]*resetScene\(\)/);
  assert.match(game, /function\s+resetMatch\(\)[\s\S]*resetScene\(\)/);
});

test('scene module stays presentation-only and lazy-loads its renderer', () => {
  assert.doesNotMatch(scene, /from ['"]\.\/(?:core|betting|ai)\.js['"]/);
  assert.doesNotMatch(scene, /settlePot|applyBetAction|state\.stacks/);
  assert.match(scene, /await import\('three'\)/);
});