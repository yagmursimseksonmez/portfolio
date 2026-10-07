// Converts PNG/JPG in public/images (and private/crypto-images) to WebP, keeping pixel dimensions,
// rewrites references in src/ and private/crypto-main.html, adds width/height to <img>, and
// builds 1200x630 JPEG share images in public/og/.
//
//   npm run optimize-images
//
// Per file it picks the smaller of "lossy q90" (only if it stays visually near-identical) and
// "near-lossless", and keeps the original if neither saves at least 10%.
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const sharp = createRequire(import.meta.url)('sharp');
const dirs = ['public/images', 'private/crypto-images'];
const flat = { background: '#808080' };

async function psnr(a, b) {
  const A = await sharp(a).flatten(flat).raw().toBuffer();
  const B = await sharp(b).flatten(flat).raw().toBuffer();
  let s = 0;
  for (let i = 0; i < A.length; i++) { const d = A[i] - B[i]; s += d * d; }
  const mse = s / A.length;
  return mse ? 10 * Math.log10((255 * 255) / mse) : 99;
}

// 1) share images, made from the originals before they are replaced
const og = { healthbar: 'healthbar_card.png', playmate: 'playmate-cover-v6.png', ikeep: 'ikeep-cover-v2.jpg', kitbox: 'kitbox-card-hero-final.jpg',
  'ai-claim': 'ai-claim-cover-v4.png', pagepals: 'pagepals-hero.png', 'urban-sports-vs-classpass': 'usc-cover.png' };
mkdirSync('public/og', { recursive: true });
for (const [slug, file] of Object.entries(og)) {
  const src = `public/images/${file}`;
  if (existsSync(src)) await sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 86, mozjpeg: true }).toFile(`public/og/${slug}.jpg`);
}

// 2) conversion
const renamed = {}; // old file name -> new file name
const dims = {};    // file name -> [w, h]
let before = 0, after = 0;
for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    const path = join(dir, file);
    const meta = /\.(png|jpe?g)$/i.test(file) ? await sharp(path).metadata() : null;
    if (/\.(webp|svg)$/i.test(file)) { if (/\.webp$/i.test(file)) { const m = await sharp(path).metadata(); dims[file] = [m.width, m.height]; } continue; }
    if (!meta) continue;
    const orig = statSync(path).size;
    const base = path.replace(/\.\w+$/, '');
    const candidates = [];
    await sharp(path).webp({ quality: 90, smartSubsample: true, effort: 6 }).toFile(base + '.lossy.tmp');
    if ((await psnr(path, base + '.lossy.tmp')) >= 37) candidates.push([base + '.lossy.tmp', statSync(base + '.lossy.tmp').size]);
    await sharp(path).webp({ nearLossless: true, quality: 90, effort: 6 }).toFile(base + '.nl.tmp');
    candidates.push([base + '.nl.tmp', statSync(base + '.nl.tmp').size]);
    candidates.sort((a, b) => a[1] - b[1]);
    const [best, size] = candidates[0];
    before += orig;
    if (size <= orig * 0.9) {
      await sharp(best).toFile(base + '.webp');
      renamed[file] = file.replace(/\.\w+$/, '.webp');
      dims[renamed[file]] = [meta.width, meta.height];
      unlinkSync(path);
      after += size;
    } else {
      dims[file] = [meta.width, meta.height];
      after += orig;
    }
    for (const [tmp] of candidates) unlinkSync(tmp);
    if (existsSync(base + '.lossy.tmp')) unlinkSync(base + '.lossy.tmp');
  }
}
console.log(`images: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB (${Object.keys(renamed).length} converted)`);

// 3) rewrite references and add width/height
function rewrite(file) {
  let s = readFileSync(file, 'utf8');
  const orig = s;
  for (const [o, n] of Object.entries(renamed)) s = s.replaceAll(`/images/${o}`, `/images/${n}`);
  s = s.replace(/<img\b[^>]*>/g, (tag) => {
    const m = tag.match(/src="\/images\/([^"]+)"/);
    // only images that flow at their natural ratio (h-auto); filled boxes (h-full/object-cover) must keep their layout
    if (!m || /\swidth=/.test(tag) || !/\bh-auto\b/.test(tag) || !dims[m[1]]) return tag;
    return tag.replace('<img ', `<img width="${dims[m[1]][0]}" height="${dims[m[1]][1]}" `);
  });
  if (s !== orig) writeFileSync(file, s);
}
for (const f of readdirSync('src/content')) rewrite(join('src/content', f));
for (const f of ['src/data/person.ts', 'private/crypto-main.html']) if (existsSync(f)) rewrite(f);

// 4) point page metadata at the share images
const sitePath = 'src/data/site.json';
const site = JSON.parse(readFileSync(sitePath, 'utf8'));
for (const slug of Object.keys(og)) site.pages[slug].image = `/og/${slug}.jpg`;
writeFileSync(sitePath, JSON.stringify(site, null, 1));
