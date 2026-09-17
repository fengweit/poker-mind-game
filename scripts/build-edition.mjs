import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildDist, PUBLIC_FILES, resetBuildDestination } from './build.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export const EDITION_FILES = Object.freeze([...PUBLIC_FILES, 'OFFLINE_README.txt']);

const README = `THE TELL — CHALLENGE EDITION
=================================

A cinematic heads-up poker decision game with three disclosed opponent styles
and local challenge progress. Virtual chips only. No purchases, prizes,
cash-out, wagering, or real-money gambling.

REQUIREMENTS
- Python 3 (only to serve these static local files)
- A current browser with WebGL; a CSS fallback is included

START OFFLINE
1. Open a terminal in this folder.
2. Run: python3 -m http.server 4173
3. Open: http://127.0.0.1:4173/
4. After the page loads, the game needs no internet connection.
5. Stop the server with Control-C.

PLAY
Choose Vesper, Ember, or Slate before a match. Each profile discloses its
strategy tendency and one bounded challenge. Challenge completion is stored
only in this browser's local storage. Use RESET LOCAL PROGRESS to delete it.
Changing opponents starts a fresh virtual-chip match.

SUPPORT / AVAILABILITY
This tested package is a fulfillment candidate, not a product currently for
sale. No checkout or payment is included. Feedback:
https://github.com/fengweit/poker-mind-game/issues/new
`;

export async function buildEdition({ outDir = join(ROOT, 'release', 'the-tell-challenge-edition') } = {}) {
  const destination = await buildDist({ outDir });
  await writeFile(join(destination, 'OFFLINE_README.txt'), README, { encoding: 'utf8', flag: 'wx' });
  return destination;
}

async function main() {
  const outDir = join(ROOT, 'release', 'the-tell-challenge-edition');
  await resetBuildDestination(outDir);
  await buildEdition({ outDir });
  console.log(`Built ${EDITION_FILES.length} allowlisted challenge-edition files in release/the-tell-challenge-edition/`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
