import { copyFile, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export const PUBLIC_FILES = Object.freeze([
  'index.html',
  'styles.css',
  'social-preview.svg',
  'src/ai.js',
  'src/betting.js',
  'src/challenges.js',
  'src/core.js',
  'src/game.js',
  'src/scene.js',
  'vendor/three.core.js',
  'vendor/three.module.js',
  'vendor/THREE-LICENSE.txt'
]);

async function isNonempty(path) {
  try {
    return (await readdir(path)).length > 0;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function rejectSymlink(path) {
  try {
    if ((await lstat(path)).isSymbolicLink()) throw new Error('public build destination cannot be a symlink');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function rejectSymlinkComponents(path, stopAt, message) {
  let current = resolve(path);
  const boundary = resolve(stopAt);
  while (true) {
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(message);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (current === boundary) return;
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

export async function assertRegularSource(rootDir, relativePath) {
  const root = resolve(rootDir);
  const source = resolve(root, relativePath);
  const fromRoot = relative(root, source);
  if (fromRoot.startsWith('..') || fromRoot === '') throw new Error(`invalid allowlisted source: ${relativePath}`);
  await rejectSymlinkComponents(source, root, 'allowlisted source cannot contain symlinks');
  const info = await lstat(source);
  if (!info.isFile()) throw new Error(`allowlisted runtime asset is not a file: ${relativePath}`);
  return source;
}

function containsPath(boundary, path) {
  const fromBoundary = relative(resolve(boundary), resolve(path));
  return fromBoundary === '' || (!fromBoundary.startsWith('..') && !fromBoundary.startsWith('/'));
}

function destinationBoundary(destination) {
  const candidates = [ROOT, resolve(tmpdir())].filter(boundary => containsPath(boundary, destination));
  return candidates.sort((a, b) => b.length - a.length)[0] || null;
}

export async function assertSafeDestination(outDir) {
  const destination = resolve(outDir);
  const boundary = destinationBoundary(destination);
  if (!boundary || destination === boundary) throw new Error('refusing destination outside an allowed build root');
  await rejectSymlink(destination);
  await rejectSymlinkComponents(dirname(destination), boundary, 'destination path cannot contain symlinks');
  return destination;
}

export async function resetBuildDestination(outDir) {
  const destination = await assertSafeDestination(outDir);
  await rm(destination, { recursive: true, force: true });
  return destination;
}

export async function buildDist({ outDir = join(ROOT, 'dist') } = {}) {
  const destination = await assertSafeDestination(outDir);
  if (await isNonempty(destination)) throw new Error('public build destination must be empty');
  await mkdir(destination, { recursive: true });

  for (const relative of PUBLIC_FILES) {
    const source = await assertRegularSource(ROOT, relative);
    const target = join(destination, relative);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  return destination;
}

async function main() {
  const outDir = join(ROOT, 'dist');
  await resetBuildDestination(outDir);
  await buildDist({ outDir });
  console.log(`Built ${PUBLIC_FILES.length} allowlisted runtime files in dist/`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
