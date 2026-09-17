import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneController } from '../src/scene.js';

function fakeAdapter() {
  const calls = [];
  return {
    calls,
    setMotion(enabled) { calls.push(['motion', enabled]); },
    async play(name, detail, context) {
      calls.push(['play', name, detail, context.epoch]);
      await Promise.resolve();
    },
    cancelAll() { calls.push(['cancel']); },
    dispose() { calls.push(['dispose']); }
  };
}

test('scene controller maps real game events to renderer effects without game mutation hooks', async () => {
  const adapter = fakeAdapter();
  const scene = new SceneController(adapter, { motion: true });
  const events = [
    ['deal', { playerCount: 2, opponentCount: 2 }],
    ['committed', { actor: 'player', amount: 40, pot: 70 }],
    ['boardReveal', { street: 1, cards: 3 }],
    ['showdown', { winner: 'ai' }]
  ];
  for (const [name, detail] of events) scene.emit(name, detail);
  await scene.idle();

  assert.deepEqual(adapter.calls.filter(call => call[0] === 'play').map(call => call[1]), events.map(([name]) => name));
  assert.equal('settlePot' in scene, false);
  assert.equal('state' in scene, false);
});

test('reset cancels queued scene work and starts a new animation epoch', async () => {
  let release;
  const calls = [];
  const adapter = {
    setMotion() {},
    async play(name, detail, context) {
      calls.push(['start', name, context.epoch]);
      if (name === 'deal') await new Promise(resolve => { release = resolve; });
      calls.push(['finish', name, context.epoch, context.cancelled()]);
    },
    cancelAll() { calls.push(['cancel']); release?.(); },
    dispose() {}
  };
  const scene = new SceneController(adapter);
  scene.emit('deal', {});
  scene.emit('boardReveal', {});
  await Promise.resolve();
  scene.reset();
  await scene.idle();

  assert.deepEqual(calls.filter(call => call[0] === 'start').map(call => call[1]), ['deal']);
  assert.ok(calls.some(call => call[0] === 'cancel'));
  assert.equal(calls.find(call => call[0] === 'finish')?.[3], true);
});

test('reduced motion is forwarded and collapses dramatic effects to immediate adapter state', async () => {
  const adapter = fakeAdapter();
  const scene = new SceneController(adapter, { motion: false });
  scene.emit('deal', { playerCount: 2 });
  await scene.idle();

  assert.deepEqual(adapter.calls[0], ['motion', false]);
  assert.equal(adapter.calls.find(call => call[0] === 'play')?.[3], 0);
  scene.setMotion(true);
  assert.deepEqual(adapter.calls.at(-1), ['motion', true]);
});

test('dispose cancels work and prevents later event playback', async () => {
  const adapter = fakeAdapter();
  const scene = new SceneController(adapter);
  scene.dispose();
  scene.emit('deal', {});
  await scene.idle();
  assert.deepEqual(adapter.calls.slice(-2), [['cancel'], ['dispose']]);
});
