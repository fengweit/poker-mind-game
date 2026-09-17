import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const game = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function declarations(selector, source = css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^{}]*)\\}`));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

function mediaBlock(query) {
  const start = css.indexOf(`@media(${query})`);
  assert.notEqual(start, -1, `missing @media(${query})`);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  assert.fail(`unterminated @media(${query})`);
}

test('result overlay owns a readable stacking context above table effects', () => {
  const overlay = declarations('#resultOverlay');
  const scanlines = declarations('.scanlines');
  const overlayZ = Number(overlay.match(/z-index:\s*(\d+)/)?.[1]);
  const scanlineZ = Number(scanlines.match(/z-index:\s*(\d+)/)?.[1]);

  assert.match(overlay, /position:\s*fixed/);
  assert.match(overlay, /isolation:\s*isolate/);
  assert.ok(overlayZ > scanlineZ, `result overlay z-index ${overlayZ} must exceed scanlines ${scanlineZ}`);
  assert.match(overlay, /opacity:\s*1(?:[;}])/);
  const overlayBackground = overlay.match(/background:\s*([^;}]+)/)?.[1];
  assert.ok(overlayBackground, 'result overlay needs an explicit background');
  assert.doesNotMatch(
    overlayBackground,
    /rgba\(|hsla\(|#[0-9a-f]{4}(?:\b|$)|#[0-9a-f]{8}(?:\b|$)|\btransparent\b/i,
    'result overlay background colors must be fully opaque'
  );

  const card = declarations('#resultOverlay .result-card');
  assert.match(card, /position:\s*relative/);
  assert.match(card, /z-index:\s*1(?:[;}])/);
  assert.match(card, /opacity:\s*1(?:[;}])/);
  assert.match(card, /background:\s*#[0-9a-f]{6}(?:;|$)/i);
});

test('hidden overlays remain fully hidden and inert', () => {
  for (const selector of ['.overlay.hidden', '#resultOverlay.hidden']) {
    const hidden = declarations(selector);
    assert.match(hidden, /opacity:\s*0(?:[;}])/);
    assert.match(hidden, /visibility:\s*hidden/);
    assert.match(hidden, /pointer-events:\s*none/);
  }
});

test('reduced motion disables result and table motion', () => {
  const reduced = mediaBlock('prefers-reduced-motion:reduce');
  assert.match(reduced, /#resultOverlay\s*\{[^{}]*transition:\s*none\s*!important/);
  assert.match(reduced, /(?:\.table \.card|\.slow \.card)[^{]*\{[^{}]*animation:\s*none\s*!important/);
});

test('motion control label is synchronized on startup and after toggles', () => {
  const helper = game.match(/function (\w*Motion\w*)\(\)\s*\{([\s\S]*?)\n\}/i);
  assert.ok(helper, 'missing a motion-control synchronization helper');
  assert.match(helper[2], /motionBtn/);
  assert.match(helper[2], /state\.motion\s*\?\s*'ON'\s*:\s*'OFF'/);

  const helperName = helper[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clickHandler = game.match(/motionBtn'\)\.addEventListener\('click',\s*\(\)\s*=>\s*\{([^}]+)\}/)?.[1];
  assert.ok(clickHandler, 'missing motion click handler');
  assert.match(clickHandler, /state\.motion\s*=\s*!state\.motion/);
  assert.match(clickHandler, new RegExp(`${helperName}\\(\\)`));
  assert.match(game, new RegExp(`\\n${helperName}\\(\\);\\s*setupAtmosphere\\(\\);`));
});

test('reduced-motion preference keeps the motion control off and disabled', () => {
  assert.match(game, /const\s+(\w+)\s*=\s*matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  const mediaName = game.match(/const\s+(\w+)\s*=\s*matchMedia\('\(prefers-reduced-motion: reduce\)'\)/)?.[1];
  assert.ok(mediaName);
  assert.match(game, new RegExp(`motion:\\s*!${mediaName}\\.matches`));

  const helper = game.match(/function (\w*Motion\w*)\(\)\s*\{([\s\S]*?)\n\}/i);
  assert.ok(helper);
  assert.match(helper[2], /motionBtn/);
  assert.match(helper[2], new RegExp(`\\.disabled\\s*=\\s*${mediaName}\\.matches`));

  const clickHandler = game.match(/motionBtn'\)\.addEventListener\('click',\s*\(\)\s*=>\s*\{([^}]+)\}/)?.[1];
  assert.ok(clickHandler, 'missing motion click handler');
  assert.match(clickHandler, new RegExp(`if\\s*\\(${mediaName}\\.matches\\)\\s*return`));
});

test('page declares an inline icon so startup has no favicon 404', () => {
  assert.match(html, /<link\s+rel="icon"\s+href="data:image\/svg\+xml,[^"]+">/);
});

test('Three.js is self-hosted and the semantic action controls remain native buttons', () => {
  assert.match(html, /<script type="importmap">[\s\S]*"three"\s*:\s*"\.\/vendor\/three\.module\.js"/);
  assert.doesNotMatch(html, /https?:\/\/[^"']*(?:three|unpkg|jsdelivr)/i);
  assert.equal(existsSync(new URL('../vendor/three.module.js', import.meta.url)), true);
  assert.equal(existsSync(new URL('../vendor/three.core.js', import.meta.url)), true);
  assert.equal(existsSync(new URL('../vendor/THREE-LICENSE.txt', import.meta.url)), true);
  for (const action of ['fold', 'check', 'raise']) {
    assert.match(html, new RegExp(`<button[^>]+data-action="${action}"`));
  }
});

test('cinematic canvas remains decorative and falls back to the CSS atmosphere', () => {
  assert.match(game, /createCinematicScene\(ui\.table/);
  assert.match(css, /\.cinematic-canvas\s*\{[^{}]*pointer-events:\s*none/);
  assert.match(css, /\[data-renderer="fallback"\]/);
});

test('reset control restores a fresh started match and invalidates pending hand work', () => {
  assert.match(html, /<button\s+id="resetBtn"[^>]*disabled[^>]*>RESET MATCH<\/button>/);
  assert.match(game, /function\s+resetMatch\(\)\s*\{\s*if\s*\(!state\.started\)\s*return/);
  assert.match(game, /state\.stacks\s*=\s*\{\s*player:\s*1000,\s*ai:\s*1000\s*\}/);
  assert.match(game, /state\.stats\s*=\s*createEmptyStats\(\)/);
  assert.match(game, /state\.dealer\s*=\s*'player'/);
  assert.match(game, /startBtn'\)\.addEventListener\('click',[\s\S]*resetBtn'\)\.disabled\s*=\s*false/);
  assert.match(game, /resetBtn'\)\.addEventListener\('click',\s*resetMatch\)/);
  assert.match(game, /handEpoch/);
});
