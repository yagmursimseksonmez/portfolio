// Cuts each full-length PlayMate screen into three parts so the case study can scroll the middle
// while the top bar and the bottom tab bar stay put, like in the real app:
//   playmate-screen-<name>-head.webp  the top bar (plus the filter strip on the Find a Match screens)
//   playmate-screen-<name>-body.webp  everything in between, the part that scrolls
//   playmate-screen-<name>-foot.webp  the tab bar and its round Create button, on a transparent background
//
//   node tools/playmate-screens.mjs
//
// Sources are playmate-screen-<name>.webp in public/images (402 px wide, cut from the final design).
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const DIR = 'public/images';
const screens = ['find', 'game', 'feedback', 'my-profile', 'home', 'map', 'friends', 'friend-profile', 'no-show'];

const yellow = (r, g, b) => r > 235 && g > 200 && b < 130;
const strip = (r, g, b) => r < 200 && b > 230; // the blue filter strip under the top bar on Find a Match
const pink = (r, g, b) => r > 235 && g > 175 && g < 225 && b > 195 && r - g > 25;

for (const name of screens) {
  const file = `${DIR}/playmate-screen-${name}.webp`;
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };

  // top bar: yellow rows at the left edge, then the filter strip if the screen has one
  let headH = 0;
  while (headH < H && yellow(...px(3, headH))) headH++;
  headH += 2; // the row where yellow blends into what follows
  const stripAt = [0, 1, 2, 3, 4, 5, 6].find((k) => strip(...px(3, headH + k)));
  if (stripAt !== undefined) { headH += stripAt; while (headH < H && strip(...px(3, headH))) headH++; headH += 3; }

  // tab bar: pink rows at the bottom, plus the dark line above them
  let navTop = H - 8; // the last rows are the rounded screen corner
  while (navTop > 0 && pink(...px(3, navTop - 1))) navTop--;
  const dark = (y) => px(3, y).every((v) => v < 90);
  const gap = [0, 1, 2].find((k) => dark(navTop - 1 - k)); // a blended row sits between the pink and the line
  if (gap !== undefined) { navTop -= gap; while (navTop > 0 && dark(navTop - 1)) navTop--; navTop--; } // the line, plus the blended row above it
  const nav = H - navTop;

  // the round button: the yellow blob in the middle of the bar, which pokes above it
  const x0 = Math.round(W * 0.3), x1 = Math.round(W * 0.7);
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = navTop - 70; y < navTop + 40; y++)
    for (let x = x0; x < x1; x++)
      if (yellow(...px(x, y))) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, r = (maxX - minX) / 2 + 4; // + its dark outline
  const footTop = Math.max(0, Math.floor(cy - r - 2));

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H - footTop}"><rect width="${W}" height="${H - footTop}" fill="#000"/>` +
      `<rect y="${navTop - footTop}" width="${W}" height="${nav}" fill="#fff"/>` +
      `<circle cx="${cx + 5}" cy="${cy - footTop + 5}" r="${r}" fill="#fff"/><circle cx="${cx}" cy="${cy - footTop}" r="${r}" fill="#fff"/></svg>`,
  );
  const alpha = await sharp(mask).greyscale().raw().toBuffer();
  const foot = sharp(file).removeAlpha().extract({ left: 0, top: footTop, width: W, height: H - footTop });
  const rgb = await foot.raw().toBuffer();
  const out = Buffer.alloc(W * (H - footTop) * 4);
  for (let i = 0, n = W * (H - footTop); i < n; i++) { out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = alpha[i]; }
  await sharp(out, { raw: { width: W, height: H - footTop, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${DIR}/playmate-screen-${name}-foot.webp`);

  await sharp(file).extract({ left: 0, top: 0, width: W, height: headH }).webp({ quality: 90 }).toFile(`${DIR}/playmate-screen-${name}-head.webp`);
  await sharp(file).extract({ left: 0, top: headH, width: W, height: navTop - headH }).webp({ quality: 88 }).toFile(`${DIR}/playmate-screen-${name}-body.webp`);

  console.log(`${name}: ${W}x${H}  head ${headH}  body ${navTop - headH}  foot ${H - footTop} (nav ${nav})  button r=${r.toFixed(1)} at ${cx},${cy}`);
}
