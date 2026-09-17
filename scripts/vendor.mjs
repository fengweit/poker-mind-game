import { copyFile, mkdir } from 'node:fs/promises';

const targetDirectory = new URL('../vendor/', import.meta.url);

await mkdir(targetDirectory, { recursive: true });
for (const file of ['three.module.js', 'three.core.js']) {
  await copyFile(new URL(`../node_modules/three/build/${file}`, import.meta.url), new URL(file, targetDirectory));
}
await copyFile(new URL('../node_modules/three/LICENSE', import.meta.url), new URL('THREE-LICENSE.txt', targetDirectory));
console.log('Vendored pinned Three.js runtime and license into vendor/');
