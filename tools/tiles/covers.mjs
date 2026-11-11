// The phone covers for the homepage cards: the app's real screen in a phone, on the project's own colour, some with a
// quiet motif from the case. Renders public/images/tiles/<id>.webp (600 x 600) with headless Chrome.
// Run from the repo root: node tools/tiles/covers.mjs (Chrome starts through tools/chengel/cdp.mjs).
import fs from 'node:fs';
import sharp from 'sharp';
import { launch } from '../chengel/cdp.mjs';

const root = new URL('../../', import.meta.url).pathname;
const img = (p) => `file://${root}public/images/${p}`;

// Motifs are drawn in CSS so nothing of hers is redrawn: a crossword grid, pixels, court lines, password dots. iKeep sits on
// the app's own cream.
const covers = [
  // `island`: the screenshot has a status bar, so the phone gets its Dynamic Island over it.
  { id: 'chengel', bg: '#b4c4e3', screen: 'chengel-dark-home.webp', motif: 'grid' },
  { id: 'healthbar', bg: '#a66759', screen: 'healthbar-home-1.webp', motif: 'pixels', island: true },
  { id: 'playmate', bg: '#d0c78b', screen: 'playmate-app-home-1.webp', motif: 'court' },
  { id: 'ikeep', bg: '#f4f1ea', screen: 'ikeep21-all-light.webp', motif: 'dots', island: true },
];

const motif = {
  grid: `<div class="m grid"></div><b class="cell" style="left:14px;top:74px"></b><b class="cell" style="left:494px;top:134px"></b><b class="cell" style="left:74px;top:434px"></b><b class="cell" style="left:494px;top:494px"></b>`,
  pixels: `<div class="m pixels"></div>`,
  // A tennis court seen from above; the phone stands on the centre line, so the sides show the tramlines and the service and net lines.
  court: `<svg class="m court" viewBox="0 0 600 600"><path d="M60 0V600M120 0V600M480 0V600M540 0V600M120 140H480M120 460H480M40 300H560"/></svg>`,
  dots: `<div class="m dots">${'<i>••••••</i>'.repeat(12)}</div>`,
};

const page = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 600px; height: 600px; overflow: hidden; }
  body { position: relative; background: ${c.bg}; }
  .m { position: absolute; inset: 0; }
  .grid { background-image: linear-gradient(rgba(255,255,255,.45) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.45) 2px, transparent 2px); background-size: 60px 60px; background-position: 14px 14px; }
  .pixels { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='16' y='16' width='8' height='8' fill='rgba(0,0,0,.16)'/%3E%3C/svg%3E"); }
  .cell { position: absolute; width: 58px; height: 58px; background: #2e3a63; }
  .court path { fill: none; stroke: rgba(255,255,255,.4); stroke-width: 3; }
  .dots { display: grid; grid-template-columns: repeat(3, 1fr); align-content: space-around; padding: 10px 0; color: rgba(22,23,26,.08); font-size: 42px; letter-spacing: .1em; text-align: center; }
  .dots i { font-style: normal; }
  .phone { position: absolute; left: 50%; top: 64px; width: 292px; height: 632px; transform: translateX(-50%); padding: 11px; border-radius: 52px; background: #0d0d0f;
    box-shadow: 0 0 0 2px rgba(255,255,255,.12) inset, 0 30px 60px rgba(0,0,0,.35); }
  .scr { position: relative; width: 100%; height: 100%; border-radius: 42px; overflow: hidden; background: #000; }
  .scr img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
  .island { position: absolute; left: 50%; top: 10px; width: 92px; height: 26px; transform: translateX(-50%); border-radius: 99px; background: #0d0d0f; }
</style></head><body>${motif[c.motif] ?? ''}
<div class="phone"><div class="scr"><img src="${img(c.screen)}" alt="">${c.island ? '<span class="island"></span>' : ''}</div></div>
</body></html>`;

const tmp = fs.mkdtempSync('/tmp/covers-');
const b = await launch({ port: 9590, width: 600, height: 600, scale: 2 });
await b.send('Emulation.setDeviceMetricsOverride', { width: 600, height: 600, deviceScaleFactor: 1, mobile: false });
for (const c of covers) {
  const file = `${tmp}/${c.id}.html`;
  fs.writeFileSync(file, page(c));
  await b.goto(`file://${file}`);
  await b.sleep(1500);
  const { data } = await b.send('Page.captureScreenshot', { format: 'png' });
  await sharp(Buffer.from(data, 'base64')).webp({ quality: 84 }).toFile(`${root}public/images/tiles/${c.id}.webp`);
  console.log('wrote', c.id);
}
process.exit(0);
