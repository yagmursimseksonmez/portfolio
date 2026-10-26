// Records a walk through the Chengel prototype in dark mode: first run, a puzzle, the words, the flash cards,
// the awards and the garden. Frames come from Chrome's screencast; ffmpeg turns them into one sped-up clip.
//
//   node tools/chengel/record.mjs <prototype.html> <out.mp4> [speed]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { launch } from './cdp.mjs';

const [, , proto, out, speedArg] = process.argv;
const speed = Number(speedArg || 2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chengel-rec-'));
// 780x1688 pixels at scale 1, with the page zoomed 2x, so the clip is sharp
const c = await launch({ width: 780, height: 1688, scale: 1 });
const q = JSON.stringify;
const click = (sel) => c.eval(`document.querySelector(${q(sel)}).click()`);
const clickText = (sel, text) => c.eval(`[...document.querySelectorAll(${q(sel)})].find(e=>e.textContent.trim().startsWith(${q(text)})).click()`);
const key = (k) => c.eval(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${q(k)},bubbles:true}))`);
const type = async (w, gap = 170) => { for (const k of w) { await key(k); await c.sleep(gap); } };
const tab = (i) => c.eval(`document.querySelectorAll('.wc-tab')[${i}].click()`);

await c.goto('file://' + proto);
await c.eval(`document.documentElement.setAttribute('data-theme','dark'); document.documentElement.style.zoom='2';
  const st=document.createElement('style'); st.textContent='.bar{display:none!important} body{background:var(--paper)!important} .stage{padding:0!important} .phone{position:fixed!important;inset:0!important;width:390px!important;height:844px!important;max-height:none!important;min-height:0!important;border:0!important;border-radius:0!important;box-shadow:none!important} #toast{display:none!important}'; document.head.appendChild(st);`);
await c.sleep(400);

const frames = [];
c.on('Page.screencastFrame', (p) => {
  const i = frames.length;
  fs.writeFileSync(path.join(tmp, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(p.data, 'base64'));
  frames.push(p.metadata.timestamp);
  c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
});
await c.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });

// first run
await c.sleep(1500);
for (let i = 0; i < 5; i++) { await click('[data-act=onbnext]'); await c.sleep(i === 3 ? 1500 : 1100); }
await c.sleep(1600);
// a puzzle
await click('.wc-node--current'); await c.sleep(1200);
await type('NACHT', 220); await c.sleep(700);
for (const [w, clue] of [['NIE', 'never'], ['TAG', 'day'], ['EINIG', 'agreed']]) {
  await c.eval(`[...document.querySelectorAll('.wc-cell--clue')].find(e=>e.textContent.includes(${q(clue)})).click()`);
  await c.sleep(450); await type(w, 220); await c.sleep(600);
}
await c.sleep(2200);
await click('[data-act=home]'); await c.sleep(1700);
await c.eval(`document.querySelector('#overlay button').click()`); await c.sleep(1400);
await click('[data-act=remindno]'); await c.sleep(1300);
await click('[data-act=afterbloom]'); await c.sleep(2000);
// words and flash cards
await tab(1); await c.sleep(1700);
await c.eval(`document.querySelector('.list').children[0].click()`); await c.sleep(1700);
await c.eval(`document.querySelector('[data-act=study], [data-act=studyall]').click()`); await c.sleep(1400);
await click('[data-act=flip]'); await c.sleep(1400);
await click('[data-act=easy]'); await c.sleep(1300);
await click('[data-act=flip]'); await c.sleep(1300);
await click('[data-act=good]'); await c.sleep(1200);
for (const a of ['folder', 'words']) { const has = await c.eval(`!!document.querySelector('[data-act=${a}]')`); if (has) { await click(`[data-act=${a}]`); await c.sleep(600); } }
// awards: the blooms from common to rare, then the garden
await tab(2); await c.sleep(2200);
await clickText('.wc-seg__o', 'Garden'); await c.sleep(2600);
await tab(0); await c.sleep(1500);

await c.send('Page.stopScreencast');
await c.close();

// constant-rate list with each frame held for as long as it was on screen
let list = '';
frames.forEach((t, i) => {
  const d = i + 1 < frames.length ? Math.min(Math.max(frames[i + 1] - t, 0.016), 2.5) : 1.2;
  list += `file 'f${String(i).padStart(5, '0')}.jpg'\nduration ${d.toFixed(4)}\n`;
});
list += `file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`;
fs.writeFileSync(path.join(tmp, 'list.txt'), list);
const r = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', `setpts=PTS/${speed},fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
console.log(`${frames.length} frames, speed ${speed}x, exit ${r.status}`);
