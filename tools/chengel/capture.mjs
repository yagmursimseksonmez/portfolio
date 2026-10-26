// Renders the Chengel HTML prototype at phone size and saves every screen as a PNG, in light and dark.
//
//   node tools/chengel/capture.mjs <prototype.html> <out-dir>
//
// The prototype is the one the app was built from. Nothing is drawn by hand here: this only
// clicks through it and takes pictures.
import fs from 'node:fs';
import { launch } from './cdp.mjs';

const [, , proto, out] = process.argv;
fs.mkdirSync(out, { recursive: true });
const c = await launch();

const q = JSON.stringify;
const click = (sel) => c.eval(`document.querySelector(${q(sel)}).click()`);
const clickText = (sel, text) => c.eval(`[...document.querySelectorAll(${q(sel)})].find(e=>e.textContent.trim().startsWith(${q(text)})).click()`);
const key = (k) => c.eval(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${q(k)},bubbles:true}))`);
const type = async (word) => { for (const k of word) { await key(k); await c.sleep(90); } };
const tab = (i) => c.eval(`document.querySelectorAll('.wc-tab')[${i}].click()`);
const acts = () => c.eval(`[...document.querySelectorAll('#screen [data-act], #overlay [data-act]')].map(e=>e.dataset.act).join(',')`);

for (const theme of ['light', 'dark']) {
  const shot = async (name) => { await c.sleep(550); await c.shot('#phone', `${out}/${theme}-${name}.png`, fs); console.log(theme, name); };
  const step = async (name, fn) => { try { await fn(); } catch (e) { console.log('  !', theme, name, e.message.split('\n')[0]); } };
  await c.goto('file://' + proto);
  await c.eval(`document.documentElement.setAttribute('data-theme', ${q(theme)}); document.querySelector('.bar').style.display='none';
    const st=document.createElement('style'); st.textContent='.phone{height:819px!important;max-height:none!important;min-height:0!important;border-radius:0!important;border:0!important;box-shadow:none!important} body{background:transparent!important} #toast{display:none!important}'; document.head.appendChild(st);`);
  await c.sleep(300);

  // first run
  await shot('onb-1');
  for (let i = 2; i <= 5; i++) { await click('[data-act=onbnext]'); await shot('onb-' + i); }
  await click('[data-act=onbnext]');
  await shot('home-start');

  // one puzzle, from empty to solved
  await click('.wc-node--current');
  await shot('puzzle-1');
  await type('NAC'); await shot('puzzle-2');
  // the keyboard as it was before the tonal-keys change (outlined keys, full-ink letters), then as it is now
  await c.eval(`(()=>{const st=document.createElement('style');st.id='kb-before';st.textContent='.key{border:1px solid var(--ink-faint)!important;background:var(--paper-raised)!important;color:var(--ink)!important}';document.head.appendChild(st)})()`);
  await shot('kb-before');
  await c.eval(`document.getElementById('kb-before').remove()`);
  await shot('kb-after');
  await type('HT'); await shot('puzzle-3');
  for (const [w, clue] of [['NIE', 'never'], ['TAG', 'day'], ['EINIG', 'agreed']]) {
    await c.eval(`[...document.querySelectorAll('.wc-cell--clue')].find(e=>e.textContent.includes(${q(clue)})).click()`);
    await c.sleep(250); await type(w); await c.sleep(500);
    if (w === 'TAG') await shot('puzzle-4');
  }
  await c.sleep(1300);
  await shot('result');
  await click('[data-act=home]');
  await c.sleep(900);
  await shot('streak');
  await step('dismiss streak', async () => { await c.eval(`document.querySelector('#overlay button').click()`); await c.sleep(900); });
  await shot('reminder');
  await step('dismiss reminder', async () => { await click('[data-act=remindno]'); await c.sleep(900); });
  await shot('bloom');
  await step('dismiss bloom', async () => { await click('[data-act=afterbloom]'); await c.sleep(900); });
  await shot('home');

  // words and flash cards
  await tab(1); await shot('words');
  await step('folder', async () => { await c.eval(`document.querySelector('.list').children[0].click()`); await c.sleep(500); await shot('folder'); console.log('  acts:', await acts()); });
  await step('cards', async () => { await c.eval(`document.querySelector('[data-act=study], [data-act=studyall]').click()`); await c.sleep(500); await shot('cards-1'); await click('[data-act=flip]'); await c.sleep(800); await shot('cards-2'); console.log('  acts:', await acts()); });

  // back to the tabs
  await step('leave cards', async () => { for (const a of ['folder', 'words']) { const has = await c.eval(`!!document.querySelector('[data-act=${a}]')`); if (has) { await click(`[data-act=${a}]`); await c.sleep(500); } } });
  await step('awards', async () => {
    await tab(2); await shot('awards');
    await clickText('.wc-seg__o', 'Garden'); await shot('garden');
    await clickText('.wc-seg__o', 'Badges'); await shot('badges');
  });
  await step('profile', async () => {
    await tab(3); await shot('profile');
    await c.eval(`document.querySelector('.scroll').scrollTop=520`); await shot('profile-2');
    await clickText('.wc-set__row', 'Season theme'); await shot('seasons');
  });
}
await c.close();
