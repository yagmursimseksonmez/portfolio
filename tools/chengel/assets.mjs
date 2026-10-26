// Turns the captured screens and boards into the web images the Chengel case page uses.
//
//   node tools/chengel/assets.mjs <shots-dir> <boards-dir> <zip-screens-dir>
import fs from 'node:fs';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const [, , shots, boards, zipScreens] = process.argv;
const OUT = 'public/images';

const screens = {
  light: ['onb-1', 'home-start', 'home', 'puzzle-1', 'puzzle-2', 'puzzle-4', 'result', 'streak', 'bloom', 'words', 'folder', 'cards-1', 'cards-2', 'awards', 'garden', 'badges', 'profile', 'seasons'],
  dark: ['onb-1', 'home-start', 'home', 'puzzle-1', 'puzzle-2', 'puzzle-4', 'result', 'streak', 'bloom', 'words', 'folder', 'cards-1', 'cards-2', 'awards', 'garden', 'badges', 'profile', 'seasons'],
};
for (const [theme, list] of Object.entries(screens))
  for (const name of list)
    await sharp(`${shots}/${theme}-${name}.png`).resize({ width: 780 }).webp({ quality: 88 }).toFile(`${OUT}/chengel-${theme}-${name}.webp`);

// the keyboard, before and after the tonal-keys change: the lower part of the puzzle screen
for (const theme of ['light', 'dark'])
  for (const state of ['before', 'after']) {
    const img = sharp(`${shots}/${theme}-kb-${state}.png`).resize({ width: 780 });
    await img.extract({ left: 0, top: 1130, width: 780, height: 508 }).webp({ quality: 90 }).toFile(`${OUT}/chengel-kb-${state}-${theme}.webp`);
  }
// the grid close-up for the handwriting page
await sharp(`${shots}/light-puzzle-4.png`).resize({ width: 780 }).extract({ left: 0, top: 486, width: 780, height: 520 }).webp({ quality: 90 }).toFile(`${OUT}/chengel-grid-light.webp`);
await sharp(`${shots}/dark-puzzle-4.png`).resize({ width: 780 }).extract({ left: 0, top: 486, width: 780, height: 520 }).webp({ quality: 90 }).toFile(`${OUT}/chengel-grid-dark.webp`);

for (const b of ['colour', 'type', 'components', 'icons'])
  await sharp(`${boards}/${b}.png`).webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/chengel-ds-${b}.webp`);
await sharp(`${boards}/hand.png`).webp({ quality: 92, alphaQuality: 100 }).toFile(`${OUT}/chengel-hand-specimen.webp`);
// the app icon: her logo file (chengel-logo-tight-2048.png), not a render
await sharp('tools/chengel/logo.png').resize({ width: 512 }).webp({ quality: 92, alphaQuality: 100 }).toFile(`${OUT}/chengel-icon.webp`);
await sharp(`${zipScreens}/options-compared.png`).webp({ quality: 90 }).toFile(`${OUT}/chengel-kb-options.webp`);
console.log('done');
