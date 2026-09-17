import { copyFile, lstat, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export const PUBLIC_FILES = Object.freeze([
  'index.html',
  'styles.css',
  'social-preview.svg',
  'src/ai.js',
  'src/betting.js',
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

export async function buildDist({ outDir = join(ROOT, 'dist') } = {}) {
  const destination = resolve(outDir);
  if (destination === ROOT) throw new Error('refusing unsafe public-build destination');
  await rejectSymlink(destination);
  if (await isNonempty(destination)) throw new Error('public build destination must be empty');
  await mkdir(destination, { recursive: true });

  for (const relative of PUBLIC_FILES) {
    const source = join(ROOT, relative);
    const info = await stat(source);
    if (!info.isFile()) throw new Error(`allowlisted runtime asset is not a file: ${relative}`);
    const target = join(destination, relative);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  return destination;
}

async function main() {
  const outDir = join(ROOT, 'dist');
  await rm(outDir, { recursive: true, force: true });
  await buildDist({ outDir });
  console.log(`Built ${PUBLIC_FILES.length} allowlisted runtime files in dist/`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
