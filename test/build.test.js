import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { buildDist, PUBLIC_FILES } from '../scripts/build.mjs';

async function filesUnder(root, dir = root) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(root, path));
    else result.push(relative(root, path).replaceAll('\\', '/'));
  }
  return result.sort();
}

test('public build copies only the explicit runtime allowlist', async () => {
  const out = await mkdtemp(join(tmpdir(), 'the-tell-dist-'));
  try {
    await buildDist({ outDir: out });
    const files = await filesUnder(out);
    assert.deepEqual(files, [...PUBLIC_FILES].sort());
    const forbidden = /(^|\/)(?:\.env(?:\.|$)|\.git(?:\/|$)|research(?:\/|$)|docs(?:\/|$)|artifacts(?:\/|$)|node_modules(?:\/|$))/;
    assert.deepEqual(files.filter(file => forbidden.test(file)), []);
    assert.equal((await readFile(join(out, 'index.html'), 'utf8')).includes('src/game.js'), true);
    assert.equal((await readFile(join(out, 'vendor/three.module.js'), 'utf8')).length > 1000, true);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('public build rejects a nonempty destination instead of preserving unknown files', async () => {
  const out = await mkdtemp(join(tmpdir(), 'the-tell-dist-'));
  try {
    await writeFile(join(out, '.env'), 'must-not-survive');
    await assert.rejects(() => buildDist({ outDir: out }), /destination must be empty/);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('public build rejects a symlink destination', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'the-tell-link-'));
  try {
    const target = join(parent, 'target');
    const link = join(parent, 'dist-link');
    await symlink(target, link);
    await assert.rejects(() => buildDist({ outDir: link }), /cannot be a symlink/);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('Pages workflow uploads dist only and grants deploy credentials only to deploy', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /upload-pages-artifact@[0-9a-f]{40}[\s\S]*path:\s*dist/);
  const buildBlock = workflow.match(/\n  build:\n([\s\S]*?)\n  deploy:\n/)?.[1];
  const deployBlock = workflow.match(/\n  deploy:\n([\s\S]*)/)?.[1];
  assert.ok(buildBlock && deployBlock);
  assert.doesNotMatch(buildBlock, /pages:\s*write|id-token:\s*write/);
  assert.match(deployBlock, /pages:\s*write/);
  assert.match(deployBlock, /id-token:\s*write/);
});
