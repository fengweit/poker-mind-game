import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runSimulation } from '../scripts/simulate.mjs';

const root = new URL('..', import.meta.url);

test('simulation completes exactly the requested real-engine hands with invariants', () => {
  const report = runSimulation({ hands: 40, seed: 42 });
  assert.equal(report.config.requestedHands, 40);
  assert.equal(report.summary.completedHands, 40);
  assert.equal(report.summary.terminalHands, 40);
  assert.equal(report.summary.chipConservedHands, 40);
  assert.equal(report.summary.finiteIntegerStateHands, 40);
  assert.equal(report.summary.uniqueDeckHands, 40);
  assert.equal(report.summary.invalidHands, 0);
  assert.equal(report.comparison.pairedDifference.seedSets, 20);
  assert.equal(report.comparison.heuristic.totalNet + report.comparison.random.totalNet, 0);
  assert.equal(
    report.comparison.pairedDifference.mean,
    report.comparison.heuristic.meanNet - report.comparison.random.meanNet
  );
  assert.ok(Number.isFinite(report.comparison.pairedDifference.standardError));
  assert.equal(report.comparison.pairedDifference.confidence95.length, 2);
  assert.ok(report.samples.length > 0 && report.samples.length <= 8);
  assert.match(report.disclaimer, /test\/replay evidence/i);
  assert.ok(report.limitations.some(text => /profit/i.test(text)));
});

test('one paired seed set reports uncertainty as unavailable', () => {
  const report = runSimulation({ hands: 2, seed: 42 });
  const statistics = report.comparison.pairedDifference;

  assert.equal(statistics.seedSets, 1);
  assert.ok(Number.isFinite(statistics.mean));
  assert.equal(statistics.standardError, null);
  assert.equal(statistics.confidence95, null);
});

test('simulation is deterministic and isolates the policy streams from deck seeds', () => {
  const first = runSimulation({ hands: 20, seed: 7, advisorSamples: 0 });
  const repeat = runSimulation({ hands: 20, seed: 7, advisorSamples: 0 });
  const changed = runSimulation({ hands: 20, seed: 8, advisorSamples: 0 });
  assert.deepEqual(first, repeat);
  assert.notDeepEqual(first.samples.map(sample => sample.deckFingerprint), changed.samples.map(sample => sample.deckFingerprint));
  assert.equal(first.rngStreams.deck, 'separate seeded stream per paired seed set');
  assert.equal(first.rngStreams.policy, 'separate seeded stream per policy and hand');
  assert.equal(first.rngStreams.advisor, 'separate seeded stream per heuristic hand');
});

test('CLI creates output parents and writes nonempty valid JSON', () => {
  const directory = mkdtempSync(join(tmpdir(), 'poker-simulation-'));
  const output = join(directory, 'nested', 'simulation.json');
  const result = spawnSync(process.execPath, ['scripts/simulate.mjs', '--hands', '12', '--seed', '42', '--out', output], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  const raw = readFileSync(output, 'utf8');
  assert.ok(raw.length > 0);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.config.requestedHands, 12);
  assert.equal(parsed.summary.completedHands, 12);
});

test('CLI rejects malformed arguments clearly', () => {
  const result = spawnSync(process.execPath, ['scripts/simulate.mjs', '--hands', 'nope'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--hands must be a positive even integer/i);
});
