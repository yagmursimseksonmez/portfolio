// Draws the PlayMate case-study boards as SVG into public/images.
//
//   node tools/playmate-boards.mjs
//
// Research boards (affinity, insights, personas, journey, iterations) use the portfolio's own
// neutral palette: light grey board, white cards, ink text, one yellow accent.
// The design-system boards use PlayMate's own tokens, because they show the app itself.
// App screens and parts of them are cut from the final screens and embedded, so every file stands alone.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const sharp = createRequire(import.meta.url)('sharp');
const IMG = 'public/images';
const FONT = "Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const HEAD = "Epilogue, 'Arial Black', Inter, -apple-system, sans-serif";
const C = { bg: '#f2f2f2', card: '#fff', line: '#d6d6d6', ink: '#1b1b1b', mute: '#5f5f5f', faint: '#8a8a8a', accent: '#ffd100' };
const APP = { blue: '#aec8fb', yellow: '#ffe145', white: '#fff', royal: '#3d57f5', pink: '#f5a0c0', navy: '#1a1a3a', bg: '#e4ecfe' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Rough line breaking: Inter averages ~0.53em per character at 400 and ~0.57em at 600+.
function wrap(text, size, width, weight = 400) {
  const per = size * (weight >= 600 ? 0.57 : 0.53);
  const max = Math.max(4, Math.floor(width / per));
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

// Wrapped text; returns the svg and the height it takes.
function text(x, y, str, { size = 22, weight = 400, fill = C.ink, width = 400, lh = 1.3, anchor = 'start', family = FONT, italic = false } = {}) {
  const lines = wrap(str, size, width, weight);
  const step = size * lh;
  const svg = lines
    .map((l, i) => `<text x="${x}" y="${(y + size * 0.82 + i * step).toFixed(1)}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}>${esc(l)}</text>`)
    .join('');
  return { svg, h: lines.length * step };
}

const rect = (x, y, w, h, { r = 16, fill = C.card, stroke = 'none', sw = 2 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;

const pill = (x, y, label, { fill = C.accent, color = C.ink, size = 18, weight = 600, padX = 14, h = 34 } = {}) => {
  const w = Math.round(label.length * size * 0.6 + padX * 2);
  return { svg: `${rect(x, y, w, h, { r: h / 2, fill })}<text x="${x + w / 2}" y="${y + h / 2 + size * 0.35}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle">${esc(label)}</text>`, w };
};

const arrowDefs = (color = '#8a8a8a') =>
  `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
const arrow = (x1, y1, x2, y2, color = '#8a8a8a') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="2.5" fill="none" marker-end="url(#arr)"/>`;

const doc = (w, h, body, bg = C.bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}">\n${rect(0, 0, w, h, { r: 28, fill: bg })}\n${body}\n</svg>\n`;

const save = (name, svg) => { writeFileSync(`${IMG}/${name}`, svg); console.log(name, `${(svg.length / 1024).toFixed(0)} kB`); };

// A piece of a screen, embedded as PNG. `box` is [x, y, w, h] in the source's pixels.
async function cut(file, box) {
  const [x, y, w, h] = box;
  const buf = await sharp(`${IMG}/${file}`).extract({ left: x, top: y, width: w, height: h }).png().toBuffer();
  return { href: `data:image/png;base64,${buf.toString('base64')}`, w, h };
}
async function whole(file) {
  const m = await sharp(`${IMG}/${file}`).metadata();
  return cut(file, [0, 0, m.width, m.height]);
}
const image = (im, x, y, scale, { r = 0, clip } = {}) => {
  const w = im.w * scale, h = im.h * scale;
  if (!r) return `<image x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" href="${im.href}"/>`;
  return `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r}"/></clipPath><image x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" href="${im.href}" clip-path="url(#${clip})"/>`;
};

// ------------------------------------------------------------------ 1. affinity map
{
  const W = 1800, pad = 40, gap = 18;
  const themes = [
    { name: 'Why they play', notes: [['Meeting friends, well-being'], ['Learning a new technique'], ['Fun, sweat, a mood boost'], ['Progress and socialising'], ['A plan, so skipping is not an option', 1]] },
    { name: 'Who with', notes: [['Strangers at my level', 1, '×3'], ['Friends', 0, '×1']] },
    { name: 'Time and place', notes: [['WhatsApp group + poll', 1, '×3'], ['Turn up at the gym and find someone', 0, '×1']] },
    { name: 'Trust', notes: [['“Mindset matters more than looks. Ego is a red flag.”', 1], ['Wants people her age who talk with respect'], ['Reviews and ratings, like Airbnb', 1], ['“I don’t care if they’re trustworthy”']] },
    { name: 'Pain points', notes: [['Finding a time that suits everyone', 1], ['Finding a place for 12 people'], ['Bringing people together'], ['Finding someone of similar size and mindset', 1]] },
    { name: 'Wished for', notes: [['A favourite playmates list', 1], ['A set time every week', 1], ['Rate people on reliability, passion, respect…', 1], ['Skill level on the profile', 1], ['“Why do you do sports?” on the profile', 1], ['“At what time I’ll arrive”'], ['Reminders to play']] },
  ];
  const pw = (W - pad * 2 - gap * 5) / 6, top = pad + 56;
  let body = '', bottom = 0;
  // legend
  body += text(pad, pad + 2, '4 interviews · every note sorted into 6 themes', { size: 21, fill: C.mute, width: 900 }).svg;
  body += rect(W - pad - 560, pad, 28, 28, { r: 6, fill: C.card, stroke: C.line });
  body += text(W - pad - 520, pad + 2, 'Heard, not built', { size: 21, fill: C.mute, width: 220 }).svg;
  body += rect(W - pad - 300, pad, 28, 28, { r: 6, fill: C.accent });
  body += text(W - pad - 260, pad + 2, 'Turned into a feature', { size: 21, fill: C.mute, width: 300 }).svg;
  const panels = [];
  themes.forEach((t, i) => {
    const x = pad + i * (pw + gap);
    let svg = text(x + 20, top + 22, t.name, { size: 25, weight: 700, width: pw - 40 }).svg;
    let ny = top + 76;
    t.notes.forEach(([n, built, count]) => {
      const nw = pw - 32;
      const tb = text(x + 30, ny + 14, n, { size: 21, weight: built ? 600 : 400, width: nw - 28 - (count ? 34 : 0), lh: 1.25, fill: built ? C.ink : C.mute });
      const nh = tb.h + 28;
      svg += rect(x + 16, ny, nw, nh, { r: 12, fill: built ? C.accent : C.bg }) + tb.svg;
      if (count) svg += `<text x="${x + 16 + nw - 14}" y="${ny + 36}" font-size="21" font-weight="700" fill="${C.ink}" text-anchor="end">${count}</text>`;
      ny += nh + 12;
    });
    bottom = Math.max(bottom, ny + 8);
    panels.push([x, svg]);
  });
  panels.forEach(([x, svg]) => { body += rect(x, top, pw, bottom - top, { r: 20 }) + svg; });
  const Hf = Math.ceil(bottom + pad);
  save('playmate-affinity.svg', doc(W, Hf, body));
}

// ------------------------------------------------------------------ 2. insight → feature
{
  const W = 1800, H = 940, pad = 40;
  const rows = [
    ['3 of 4', 'organise games in WhatsApp groups with polls.', 'The plan lives in a chat nobody can follow.', 'Game rooms', 'Time, place, player limits and cost split in one room.'],
    ['3 of 4', 'would rather play with strangers at their level than with friends at any level.', 'Level matters more than knowing someone.', 'Skill levels', 'On every profile and game, and as a filter.'],
    ['3 of 4', 'want a sign of a stranger’s attitude before meeting. “Ego is a red flag.”', 'Trust has to be visible before the first game.', 'Peer ratings', 'Reliability, passion, respect and communication, after every game.'],
    ['Mcan', 'finds a cancelled game disrespectful.', 'A no-show costs the people who did show up.', 'Waitlist and no-show penalty', 'The next person fills the spot. A no-show lowers reliability.'],
    ['Andrea', 'plays with her “favourite playmates”.', 'A good match should be easy to repeat.', 'Friends and repeat games', 'Favourite playmates one tap away. Repeat a game every week.'],
  ];
  const cx = [pad, 760, 1180], cw = [640, 340, W - pad - 1180];
  let body = arrowDefs();
  ['What I heard', 'What it means', 'What I designed'].forEach((h, i) => { body += text(cx[i], pad, h.toUpperCase(), { size: 18, weight: 600, fill: C.faint, width: 400 }).svg; });
  const top = pad + 44, rh = (H - top - pad - 4 * 16) / 5;
  rows.forEach(([who, heard, means, feat, detail], i) => {
    const y = top + i * (rh + 16);
    body += rect(cx[0], y, cw[0], rh, { r: 18 });
    const p = pill(cx[0] + 22, y + 22, who, { fill: who.includes('of') ? C.accent : C.ink, color: who.includes('of') ? C.ink : '#fff', size: 18 });
    body += p.svg;
    body += text(cx[0] + 22, y + 66, heard, { size: 24, width: cw[0] - 44, lh: 1.3 }).svg;
    body += arrow(cx[0] + cw[0] + 14, y + rh / 2, cx[1] - 14, y + rh / 2);
    const m = text(cx[1], 0, means, { size: 23, width: cw[1], fill: C.mute, lh: 1.3 });
    body += text(cx[1], y + (rh - m.h) / 2, means, { size: 23, width: cw[1], fill: C.mute, lh: 1.3 }).svg;
    body += arrow(cx[1] + cw[1] + 6, y + rh / 2, cx[2] - 14, y + rh / 2);
    body += rect(cx[2], y, cw[2], rh, { r: 18, fill: C.ink });
    body += text(cx[2] + 24, y + 22, feat, { size: 26, weight: 700, fill: C.accent, width: cw[2] - 48 }).svg;
    body += text(cx[2] + 24, y + 64, detail, { size: 22, fill: '#e6e6e6', width: cw[2] - 48, lh: 1.3 }).svg;
  });
  save('playmate-insights.svg', doc(W, H, body));
}

// ------------------------------------------------------------------ 3. personas
{
  const W = 1800, H = 860, pad = 40, gap = 32, cw = (W - pad * 2 - gap) / 2;
  const people = [
    { init: 'S', name: 'Summer', role: 'Primary persona', kind: 'The social player', facts: '28 · interior designer · moved to Berlin 6 months ago', quote: 'The sport isn’t the hard part. Meeting strangers is.', from: 'Stands for the players who want a circle, not just a workout.', pains: ['Can’t tell if a stranger is respectful or there to dominate', 'Tired of looking for new people every time'], needs: ['Reviews and commitment ratings', 'Profiles that say why someone plays', 'A favourite playmates list'], primary: true },
    { init: 'L', name: 'Leo', role: 'Secondary persona', kind: 'The efficiency seeker', facts: '35 · psychologist · Berlin · little free time', quote: 'If the game feels unreliable, I stay home.', from: 'Stands for the players worn down by logistics and cancellations.', pains: ['Endless group chat to agree on a time', 'Last-minute cancellations and skill gaps'], needs: ['Scheduling from poll results', 'Reliability scores and skill filters', 'An “I’ll arrive at…” status'] },
  ];
  let body = '';
  people.forEach((p, i) => {
    const x = pad + i * (cw + gap), y = pad;
    body += rect(x, y, cw, H - pad * 2, { r: 24 });
    body += `<circle cx="${x + 80}" cy="${y + 86}" r="48" fill="${p.primary ? C.accent : C.ink}"/><text x="${x + 80}" y="${y + 104}" font-size="48" font-weight="700" fill="${p.primary ? C.ink : C.accent}" text-anchor="middle">${p.init}</text>`;
    body += text(x + 152, y + 36, p.name, { size: 44, weight: 700, width: 400 }).svg;
    const tag = pill(x + 154, y + 96, p.role, { fill: p.primary ? C.accent : C.ink, color: p.primary ? C.ink : '#fff', size: 17 });
    body += tag.svg;
    body += text(x + 154 + tag.w + 14, y + 101, p.kind, { size: 20, fill: C.mute, width: 300 }).svg;
    body += text(x + 40, y + 172, p.facts, { size: 20, fill: C.mute, width: cw - 80 }).svg;
    body += `<rect x="${x + 40}" y="${y + 222}" width="6" height="104" rx="3" fill="${C.accent}"/>`;
    body += text(x + 66, y + 222, `“${p.quote}”`, { size: 30, weight: 600, width: cw - 120, lh: 1.25 }).svg;
    body += text(x + 40, y + 352, p.from, { size: 21, fill: C.mute, width: cw - 80 }).svg;
    const colW = (cw - 80 - 24) / 2;
    [['Pain points', p.pains], ['Needs', p.needs]].forEach(([label, list], k) => {
      const lx = x + 40 + k * (colW + 24);
      let ly = y + 430;
      body += text(lx, ly, label.toUpperCase(), { size: 17, weight: 600, fill: C.faint, width: colW }).svg;
      ly += 40;
      list.forEach((item) => {
        const t = text(lx + 18, ly + 12, item, { size: 21, width: colW - 36, lh: 1.3, weight: k ? 600 : 400 });
        body += rect(lx, ly, colW, t.h + 24, { r: 12, fill: k ? (p.primary ? C.accent : '#ebebeb') : C.bg });
        body += t.svg;
        ly += t.h + 34;
      });
    });
  });
  save('playmate-personas.svg', doc(W, H, body));
}

// ------------------------------------------------------------------ 4. journey map
{
  const W = 1800, H = 1000, pad = 40, lw = 210;
  const phases = [
    { name: 'Planning', goal: 'Find a reliable game and partner', does: 'Picks a sport, looks for a game and a place', feel: 0.45, felt: 'Hopeful, but anxious about who she’ll meet', opp: 'Show mindset and level before meeting', app: 'Skill level · “I do sports because”' },
    { name: 'Coordination', goal: 'Organise or join with little effort', does: 'Checks who’s coming, books the court, reposts if short', feel: 0.15, felt: 'Annoyed by group chat chaos', opp: 'Automate polls and arrival updates', app: 'Game room · player limits · waitlist' },
    { name: 'The match', goal: 'A safe game at the right level', does: 'Shows up and checks in', feel: 0.85, felt: 'Relieved it started; curious about the others', opp: 'A check-in that counts towards reliability', app: 'Attended? yes / no · no-show penalty' },
    { name: 'After', goal: 'Build a circle, plan the next one', does: 'Rates partners, adds favourites', feel: 0.6, felt: 'Satisfied, but too many rating fields', opp: 'Favourite playmates to build a circle', app: 'Four ratings · friends' },
  ];
  const colW = (W - pad * 2 - lw) / 4;
  const rowsY = { head: pad, goal: pad + 80, does: pad + 210, feel: pad + 350, opp: pad + 610, app: pad + 790 };
  const rowH = { goal: 110, does: 120, feel: 240, opp: 160, app: 130 };
  let body = '';
  [['goal', 'Goal'], ['does', 'Does'], ['feel', 'Feels'], ['opp', 'Opportunity'], ['app', 'In the app']].forEach(([k, l]) => {
    body += text(pad, rowsY[k] + 10, l.toUpperCase(), { size: 18, weight: 600, fill: C.faint, width: lw - 20 }).svg;
    body += `<line x1="${pad}" y1="${rowsY[k] - 10}" x2="${W - pad}" y2="${rowsY[k] - 10}" stroke="${C.line}" stroke-width="1.5"/>`;
  });
  const pts = [];
  phases.forEach((p, i) => {
    const x = pad + lw + i * colW, cx = x + 12, w = colW - 24;
    body += rect(cx, rowsY.head, w, 52, { r: 26, fill: C.ink });
    body += `<text x="${cx + w / 2}" y="${rowsY.head + 34}" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}  ${esc(p.name)}</text>`;
    body += text(cx, rowsY.goal + 6, p.goal, { size: 23, weight: 600, width: w }).svg;
    body += text(cx, rowsY.does + 6, p.does, { size: 21, fill: C.mute, width: w }).svg;
    const fy = rowsY.feel + 20 + (1 - p.feel) * 120;
    pts.push([x + colW / 2, fy, p.felt, p.feel]);
    body += rect(cx, rowsY.opp, w, rowH.opp - 20, { r: 16, fill: C.accent });
    body += text(cx + 18, rowsY.opp + 18, p.opp, { size: 22, weight: 600, width: w - 36 }).svg;
    body += rect(cx, rowsY.app, w, 96, { r: 16, fill: C.card, stroke: C.line });
    body += text(cx + 18, rowsY.app + 16, p.app, { size: 20, width: w - 36 }).svg;
  });
  // the feelings line
  const d = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(0) + ' ' + y.toFixed(0)).join(' ');
  body += `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  pts.forEach(([x, y, felt, v]) => {
    body += `<circle cx="${x}" cy="${y}" r="11" fill="${v < 0.3 ? '#e2523b' : v > 0.7 ? C.accent : '#fff'}" stroke="${C.ink}" stroke-width="3"/>`;
    body += text(x, y + 22, felt, { size: 19, fill: C.mute, width: colW - 40, anchor: 'middle' }).svg;
  });
  save('playmate-journey.svg', doc(W, H, body));
}

// ------------------------------------------------------------------ 5. iterations: wireframe → final
async function evolution(name, lofiFile, items) {
  const W = 1560, H = 1080, pad = 40;
  const lofi = await whole(lofiFile);
  const ls = (H - pad * 2 - 60) / lofi.h;
  let body = arrowDefs();
  body += text(pad, pad, 'WIREFRAME · ROUND 1', { size: 18, weight: 600, fill: C.faint, width: 400 }).svg;
  body += rect(pad - 2, pad + 48, lofi.w * ls + 4, lofi.h * ls + 4, { r: 18, fill: '#fff', stroke: C.line });
  body += image(lofi, pad, pad + 50, ls, { r: 16, clip: 'lofi' });
  const fx = pad + lofi.w * ls + 120;
  body += arrow(fx - 92, H / 2, fx - 24, H / 2);
  body += text(fx, pad, 'FINAL · WHAT TESTERS CHANGED', { size: 18, weight: 600, fill: C.faint, width: 600 }).svg;
  let y = pad + 50;
  const avail = H - pad - y - (items.length - 1) * 28;
  const crops = await Promise.all(items.map((it) => cut(it.file, it.box)));
  const totalH = crops.reduce((s, c) => s + c.h, 0);
  const s = Math.min(1.45, avail / totalH);
  crops.forEach((c, i) => {
    const it = items[i];
    const h = c.h * s;
    body += image(c, fx, y, s, { r: 14, clip: `c${i}` });
    const tx = fx + c.w * s + 48, tw = W - pad - tx;
    body += `<circle cx="${tx + 22}" cy="${y + 24}" r="22" fill="${C.accent}"/><text x="${tx + 22}" y="${y + 32}" font-size="22" font-weight="700" fill="${C.ink}" text-anchor="middle">${i + 1}</text>`;
    const t1 = text(tx + 60, y + 6, it.title, { size: 28, weight: 700, width: tw - 60, lh: 1.2 });
    body += t1.svg;
    body += text(tx + 60, y + 16 + t1.h, it.text, { size: 22, fill: C.mute, width: tw - 60, lh: 1.4 }).svg;
    y += h + 28;
  });
  save(name, doc(W, H, body));
}
await evolution('playmate-evolution-game.svg', 'playmate-lofi-game.webp', [
  { file: 'playmate-screen-game.webp', box: [18, 434, 368, 276], title: 'The price, before you join', text: 'Testers expected to pay for the court. The venue fee now splits by the number of players and shows up front, next to how many have joined.' },
  { file: 'playmate-screen-game.webp', box: [18, 1376, 370, 266], title: 'The venue, one tap away', text: 'Testers wanted to book the court. Tapping the venue links out to its own app, so booking happens where the court is managed.' },
]);
await evolution('playmate-evolution-create.svg', 'playmate-lofi-create.webp', [
  { file: 'playmate-screen-create.webp', box: [17, 477, 370, 202], title: 'Minimum and maximum players', text: 'Creators set how many people a game needs. Extra players join a waitlist, and the next one in line fills a cancelled spot.' },
  { file: 'playmate-screen-create.webp', box: [17, 1061, 370, 300], title: 'Cost split, done for you', text: 'Enter the venue price once. Each player’s share is worked out from the player limit, so nobody has to chase money.' },
]);

// ------------------------------------------------------------------ 6. design system: foundations
{
  const W = 1800, H = 900, pad = 44;
  const shadow = (x, y, w, h, r = 14) => rect(x + 5, y + 5, w, h, { r, fill: APP.navy });
  const card = (x, y, w, h, fill = APP.white, r = 14) => shadow(x, y, w, h, r) + rect(x, y, w, h, { r, fill, stroke: APP.navy, sw: 2.5 });
  let body = '';
  const label = (x, y, s) => text(x, y, s.toUpperCase(), { size: 18, weight: 700, fill: APP.navy, width: 600 }).svg;
  // colour
  body += label(pad, pad, 'Colour · and how much of each');
  const sw = [
    ['Light blue', '#AEC8FB', 'Backgrounds', '35%', APP.blue, APP.navy],
    ['Yellow', '#FFE145', 'Primary, highlights', '30%', APP.yellow, APP.navy],
    ['White', '#FFFFFF', 'Cards, inputs', '15%', APP.white, APP.navy],
    ['Blue', '#3D57F5', 'Actions, navigation', '11%', APP.royal, '#fff'],
    ['Pink', '#F5A0C0', 'Badges, alerts', '6%', APP.pink, APP.navy],
    ['Dark navy', '#1A1A3A', 'Text, icons, strokes', '3%', APP.navy, '#fff'],
  ];
  const cw = 262, ch = 168, g = 22;
  sw.forEach(([n, hex, role, pct, fill, ink], i) => {
    const x = pad + (i % 3) * (cw + g), y = pad + 44 + Math.floor(i / 3) * (ch + g);
    body += card(x, y, cw, ch, fill);
    body += text(x + 20, y + 18, n, { size: 24, weight: 700, fill: ink, width: cw - 90 }).svg;
    body += text(x + cw - 20, y + 20, pct, { size: 22, weight: 700, fill: ink, width: 80, anchor: 'end' }).svg;
    body += text(x + 20, y + ch - 66, role, { size: 19, fill: ink, width: cw - 40 }).svg;
    body += text(x + 20, y + ch - 36, hex, { size: 17, fill: ink, width: cw - 40 }).svg;
  });
  // why it looks like this: each card is drawn in the style it describes
  const ry = pad + 44 + 2 * (ch + g) + 36;
  body += label(pad, ry, 'Why neo-brutalist');
  const rules = [
    ['Visual style', 'Thick strokes and hard, zero-blur shadows: retro pop-art.', APP.white],
    ['Feel', 'Game-like touches and isometric illustrations: energetic, social.', APP.yellow],
    ['Layout', 'Modular cards, so a screen is quick to scan.', APP.pink],
  ];
  rules.forEach(([t1, t2, fill], i) => {
    const x = pad + i * (cw + g), y = ry + 44;
    body += card(x, y, cw, 176, fill);
    const a = text(x + 20, y + 20, t1, { size: 23, weight: 700, fill: APP.navy, width: cw - 40 });
    body += a.svg + text(x + 20, y + 28 + a.h, t2, { size: 19, fill: APP.navy, width: cw - 40, lh: 1.35 }).svg;
  });
  body += text(pad, ry + 44 + 176 + 24, 'Testing tuned it: contrast raised, hot pink cut back, yellow toned down.', { size: 19, fill: '#4a4a68', width: 3 * cw + 2 * g }).svg;
  // type
  const tx = 940, tw = W - pad - tx;
  body += label(tx, pad, 'Type · Epilogue for headings, Inter for the rest');
  body += card(tx, pad + 44, tw, H - pad * 2 - 44, APP.white, 20);
  const specs = [
    ['App name', 'Epilogue 800 · caps', 'PLAYMATE', HEAD, 800, 40, APP.royal, true],
    ['Screen heading', 'Epilogue 800 · 26', 'Hello, Alex', HEAD, 800, 40, APP.navy],
    ['Section title', 'Epilogue 700 · 17', 'Upcoming Matches', HEAD, 700, 30, APP.navy],
    ['Card title', 'Inter 600 · 14', 'Friday Night Training', FONT, 600, 26, APP.navy],
    ['Body', 'Inter 400 · 13', 'Volkspark Hasenheide · 1.2 km away', FONT, 400, 22, '#4a4a68'],
    ['Label', 'Inter 700 · 10 · caps', 'SOCCER   OPEN   FREE', FONT, 700, 18, APP.navy],
  ];
  let y = pad + 84;
  const step = (H - pad - y - 30) / specs.length;
  specs.forEach(([n, spec, sample, fam, wt, size, fill, italic], i) => {
    body += text(tx + 30, y + 4, n, { size: 19, weight: 600, fill: APP.navy, width: 220 }).svg;
    body += text(tx + 30, y + 32, spec, { size: 16, fill: '#6b6b88', width: 220 }).svg;
    body += `<text x="${tx + 280}" y="${(y + 14 + size * 0.8).toFixed(0)}" font-family="${fam}" font-size="${size}" font-weight="${wt}" fill="${fill}"${italic ? ' font-style="italic" letter-spacing="1"' : ''}>${esc(sample)}</text>`;
    if (i < specs.length - 1) body += `<line x1="${tx + 30}" y1="${y + step - 14}" x2="${tx + tw - 30}" y2="${y + step - 14}" stroke="#d9def0" stroke-width="1.5"/>`;
    y += step;
  });
  save('playmate-ds-foundations.svg', doc(W, H, body, APP.bg));
}

// ------------------------------------------------------------------ 7. design system: atoms → organisms
{
  const W = 2000, H = 940, pad = 44;
  const P = {
    badge: ['playmate-screen-home.webp', [44, 268, 88, 37]],
    chips: ['playmate-screen-find.webp', [18, 112, 370, 50]],
    segment: ['playmate-screen-find.webp', [244, 176, 142, 52]],
    button: ['playmate-screen-find.webp', [146, 380, 230, 48]],
    toggle: ['playmate-screen-create.webp', [290, 608, 76, 46]],
    trophies: ['playmate-screen-friend-profile.webp', [44, 874, 318, 94]],
    stepper: ['playmate-screen-create.webp', [36, 548, 156, 42]],
    link: ['playmate-screen-home.webp', [18, 564, 370, 70]],
    input: ['playmate-screen-create.webp', [36, 282, 330, 60]],
    actions: ['playmate-screen-friend-profile.webp', [44, 388, 318, 40]],
    metric: ['playmate-screen-friend-profile.webp', [44, 1486, 318, 54]],
    gameCard: ['playmate-screen-find.webp', [12, 262, 382, 184]],
    skill: ['playmate-screen-friend-profile.webp', [16, 534, 372, 132]],
    rate: ['playmate-screen-feedback.webp', [17, 689, 370, 390]],
    nav: ['playmate-screen-find.webp', [0, 1588, 402, 116]],
  };
  const im = {};
  for (const [k, [f, b]] of Object.entries(P)) {
    im[k] = await cut(f, b);
    const px = await sharp(`${IMG}/${f}`).extract({ left: b[0] + 1, top: b[1] + 1, width: 1, height: 1 }).raw().toBuffer();
    im[k].bg = `rgb(${px[0]},${px[1]},${px[2]})`;
  }
  let body = arrowDefs(APP.navy);
  const head = (x, y, n, t, sub) => {
    body += `<circle cx="${x + 22}" cy="${y + 22}" r="22" fill="${APP.navy}"/><text x="${x + 22}" y="${y + 30}" font-size="22" font-weight="700" fill="${APP.yellow}" text-anchor="middle">${n}</text>`;
    body += text(x + 58, y + 4, t, { size: 30, weight: 800, fill: APP.navy, width: 400, family: HEAD }).svg;
    body += text(x + 58, y + 44, sub, { size: 18, fill: '#4a4a68', width: 420 }).svg;
  };
  const tag = (x, y, s) => text(x, y, s, { size: 17, weight: 600, fill: '#4a4a68', width: 420 }).svg;
  // Each part sits on a tile of the screen colour it was cut from, outlined like the app's own cards.
  const place = (k, x, y, s, name) => {
    const w = im[k].w * s, h = im[k].h * s, t = 12;
    body += tag(x, y, name);
    body += rect(x, y + 30, w + t * 2, h + t * 2, { r: 14, fill: im[k].bg, stroke: 'rgba(26,26,58,0.18)', sw: 1.5 });
    body += image(im[k], x + t, y + 30 + t, s);
    return y + 30 + h + t * 2 + 22;
  };
  // columns
  const col = [pad, 470, 1000, 1500];
  head(col[0], pad, 1, 'Atoms', 'The smallest parts');
  let y = pad + 100;
  y = place('badge', col[0], y, 1.5, 'Sport badge');
  y = place('button', col[0], y, 1.4, 'Primary button');
  y = place('segment', col[0], y, 1.4, 'Segmented switch');
  y = place('toggle', col[0], y, 1.5, 'Toggle');
  y = place('trophies', col[0], y, 1.15, 'Achievement icons');
  head(col[1], pad, 2, 'Molecules', 'Atoms that work together');
  y = pad + 100;
  y = place('chips', col[1], y, 1.2, 'Filter chips');
  y = place('stepper', col[1], y, 1.5, 'Stepper');
  y = place('input', col[1], y, 1.3, 'Input field');
  y = place('link', col[1], y, 1.2, 'Quick link');
  y = place('metric', col[1], y, 1.35, 'Rating bar');
  head(col[2], pad, 3, 'Organisms', 'Sections of a screen');
  y = pad + 100;
  y = place('gameCard', col[2], y, 1.18, 'Game card');
  y = place('skill', col[2], y, 1.18, 'Skill rating card');
  y = place('nav', col[2], y, 1.12, 'Tab bar, Create raised');
  y = pad + 100;
  y = place('rate', col[3], y, 1.12, 'Teammate rating card');
  // the last step points to the pages
  const ly = y + 6;
  body += rect(col[3], ly, W - pad - col[3], 64, { r: 32, fill: APP.navy });
  body += text(col[3] + 30, ly + 19, 'Templates and pages: the final screens', { size: 21, weight: 600, fill: APP.yellow, width: 460 }).svg;
  save('playmate-ds-components.svg', doc(W, H, body, APP.bg));
}

// ------------------------------------------------------------------ 8. research plan, in two boards
{
  const pad = 40, gap = 24;
  const badge = (x, y, n) => `<circle cx="${x + 22}" cy="${y + 22}" r="22" fill="${C.ink}"/><text x="${x + 22}" y="${y + 30}" font-size="22" font-weight="700" fill="${C.accent}" text-anchor="middle">${n}</text>`;
  // a note card: optional small label, then the text
  const note = (x, y, w, str, { label, size = 21, weight = 400, bg = C.bg, fill = C.ink, num } = {}) => {
    let h = 14, svg = '';
    const tx = x + 18 + (num ? 40 : 0), tw = w - 36 - (num ? 40 : 0);
    if (label) { const l = text(tx, y + 14, label.toUpperCase(), { size: 15, weight: 600, fill: C.faint, width: tw }); svg += l.svg; h += l.h + 6; }
    const t = text(tx, y + h, str, { size, weight, width: tw, lh: 1.3, fill });
    svg += t.svg; h += t.h + 14;
    const card = rect(x, y, w, h, { r: 12, fill: bg }) + (num ? `<circle cx="${x + 30}" cy="${y + 28}" r="15" fill="${C.accent}"/><text x="${x + 30}" y="${y + 34}" font-size="17" font-weight="700" fill="${C.ink}" text-anchor="middle">${num}</text>` : '');
    return { svg: card + svg, h };
  };
  // a column panel: number, title, then stacked pieces; the panel is as tall as the tallest column
  function board(name, W, top, cols, header) {
    let bottom = 0, body = '', y0 = top;
    const panels = [];
    cols.forEach((c, i) => {
      const x = pad + c.x, w = c.w;
      let svg = badge(x + 18, top + 18, c.n) + text(x + 70, top + 22, c.title, { size: 27, weight: 700, width: w - 90 }).svg;
      let y = top + 82;
      for (const part of c.parts) {
        if (part.sub) { svg += text(x + 18, y, part.sub.toUpperCase(), { size: 16, weight: 600, fill: C.faint, width: w - 36 }).svg; y += 30; continue; }
        const r = part.fn(x + 16, y, w - 32);
        svg += r.svg; y += r.h + 10;
      }
      bottom = Math.max(bottom, y + 8);
      panels.push([x, w, svg]);
    });
    panels.forEach(([x, w, svg]) => { body += rect(x, top, w, bottom - top, { r: 22 }) + svg; });
    const H = Math.ceil(bottom + pad);
    save(name, doc(W, H, (header ? header(H) : '') + body));
  }

  // board 1: what I wanted to know
  {
    const W = 1800;
    const c1 = 430, c2 = 430, c3 = W - pad * 2 - gap * 2 - c1 - c2;
    const q = [
      'How do people currently find sports partners?',
      'What stops people from finding and joining new sports communities in their city?',
      'What makes people stick to a sports routine, compared with doing it alone?',
      'What profile information (ratings, skill levels) makes a user trust a stranger for a match?',
      'What makes someone feel safe meeting a group for the first time?',
      'Does a reliability rating or attendance tracking make people more committed to showing up?',
      'What happens when a partner cancels, and how can the app soften that?',
    ];
    const hyp = [
      'People exercise more regularly when they feel a social commitment to a group.',
      'Newcomers hesitate to join local sports because they don’t trust the group.',
      'A map-based “game room” reduces organising friction better than a group chat.',
      'Sports groups are scattered across WhatsApp, Facebook and more, so they’re hard to find and join.',
    ];
    const goals = [
      'Understand what frustrates people when they use WhatsApp or Facebook to organise or join sports groups.',
      'Find out which profile information (ratings, skill levels, mutual friends) makes people feel safe enough to meet a stranger for a game.',
      'Find out which features (accountability scores, streaks, social rewards) best encourage regular participation.',
    ];
    board('playmate-plan-what.svg', W, pad, [
      { x: 0, w: c1, n: 1, title: 'Hypotheses to test', parts: hyp.map((h, i) => ({ fn: (x, y, w) => note(x, y, w, h, { num: i + 1 }) })) },
      { x: c1 + gap, w: c2, n: 2, title: 'Research goals', parts: goals.map((g, i) => ({ fn: (x, y, w) => note(x, y, w, g, { num: i + 1 }) })) },
      { x: c1 + c2 + gap * 2, w: c3, n: 3, title: 'Research questions', parts: q.map((s, i) => ({ fn: (x, y, w) => note(x, y, w, s, { num: i + 1 }) })) },
    ]);
  }

  // board 2: how I'd find out, condensed to three short lines a column
  {
    const W = 1800, cw = (W - pad * 2 - gap * 3) / 4;
    const colx = (i) => i * (cw + gap);
    const lines = (list) => list.map((s) => ({ fn: (x, y, w) => note(x, y, w, s) }));
    board('playmate-plan-how.svg', W, pad, [
      { x: colx(0), w: cw, n: 4, title: 'Participants', parts: lines(['People who already have a sport routine', '4 interviewed, 6 planned', '30 minutes each, on Zoom or in person']) },
      { x: colx(1), w: cw, n: 5, title: 'Constraints', parts: lines(['Older athletes may avoid apps', 'Skill levels are self-reported', 'New users have no rating yet']) },
      { x: colx(2), w: cw, n: 6, title: 'Data analysis', parts: lines(['Zoom, a phone recorder, paper notes', 'Excel to organise, FigJam to cluster', 'Kept on my own devices']) },
      { x: colx(3), w: cw, n: 7, title: 'Deliverables', parts: lines(['Discovery: report and personas', 'UX and UI: wireframes, design system', 'Prototype and final usability test']) },
    ]);
  }
}
