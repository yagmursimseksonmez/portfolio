// Renders tools/ikeep-demo/app.html (a scripted, demo-data-only walkthrough of the iKeep UI) frame by
// frame with headless Chrome and encodes public/videos/ikeep-demo.mp4.
//
//   node tools/ikeep-demo/render.mjs            # needs Google Chrome and ffmpeg
//   CHROME=/path/to/chrome node tools/ikeep-demo/render.mjs
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const chromePath = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const here = resolve(import.meta.dirname);
const out = resolve(here, '../../public/videos/ikeep-demo.mp4');
const frames = mkdtempSync(join(tmpdir(), 'ikeep-frames-'));
const profile = mkdtempSync(join(tmpdir(), 'ikeep-chrome-'));
const FPS = 30;

const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(250); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result;

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: false });
await send('Page.navigate', { url: 'file://' + join(here, 'app.html') });
await sleep(1500);
await evaluate('document.fonts.ready.then(() => 1)'); // the UI font comes from Google Fonts
const duration = (await evaluate('window.DURATION')).result.value;
const count = Math.round(duration * FPS) + 1;
for (let n = 0; n < count; n++) {
  const r = await evaluate(`render(${n / FPS}); 1`);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'render failed');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(frames, `f${String(n).padStart(4, '0')}.png`), Buffer.from(shot.result.data, 'base64'));
}
ws.close(); chrome.kill();

mkdirSync(resolve(out, '..'), { recursive: true });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'), '-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
rmSync(frames, { recursive: true, force: true }); rmSync(profile, { recursive: true, force: true });
console.log(`wrote ${out} (${count} frames, ${duration}s)`);
