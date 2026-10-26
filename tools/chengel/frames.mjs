// Writes the Chengel case-study pages (src/content/playmate-frames/chengel-*.html).
//
//   node tools/chengel/frames.mjs
//
// The pages use the same classes as the other cases (pm-*, defined in src/styles/playmate-frames.css).
// The two user flows and the cycle are drawn here from the app's own screens and copy.
import fs from 'node:fs';

const DIR = 'src/content/playmate-frames';
const write = (name, html) => { fs.writeFileSync(`${DIR}/chengel-${name}.html`, html.replace(/\n\s*/g, '') + '\n'); console.log('chengel-' + name); };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const phone = (src, alt, pw) =>
  `<div class="pm-phone pm-static" style="--pw:${pw}"><div class="pm-scr"><img src="/images/${src}.webp" alt="${esc(alt)}" loading="lazy"></div></div>`;
// every numbered page opens with the same header, so the numbers and titles are the same size on all of them
const head = (n, lab, h2, style = '') =>
  `<div class="pm-bh pm-bhn" style="${style}"><div class="pm-big">${n}</div><div><div class="pm-lab">${lab}</div><h2>${h2}</h2></div></div>`;
const page = (style, inner) => `<div class="pmf pm-ch" style="${style}">${inner}</div>`;

// ---------------------------------------------------------------- hero
write('hero', `
<div class="pmf pm-f-hero pm-narrow" style="width:1000px">
  <div class="pm-hero-v pm-ph" style="background:transparent;width:310px;justify-content:center">
    <div class="pm-phone pm-static" style="--pw:282;box-shadow:0 18px 40px rgba(0,0,0,.4)"><div class="pm-scr"><video src="/videos/chengel-demo.mp4" autoplay muted loop playsinline preload="metadata" aria-label="Chengel in dark mode: first launch, a puzzle in my handwriting, the word folders and flash cards, the awards and the garden" style="width:100%!important;height:100%!important;object-fit:cover;display:block;border-radius:0!important;box-shadow:none!important;margin:0!important"></video></div></div>
  </div>
  <div class="pm-hero-t">
    <div class="pm-lab">Chengel · iOS · submitted to the App Store</div>
    <h1>Learn words by solving crosswords.</h1>
    <p class="pm-lede">Chengel is an iOS app for learning vocabulary. The clue is in your language, the answer is in the one you are learning, and <strong>you write it in my own handwriting</strong>, like filling in a newspaper crossword.</p>
    <div class="pm-grid2">
      <div class="pm-card"><div class="pm-lab">ROLE</div><h4>Designer, with one iOS developer</h4><p>I designed the <strong>app, the design system, the icons and the illustrations</strong>. One iOS developer built it.</p></div>
      <div class="pm-card"><div class="pm-lab">PROBLEM</div><h4>Word apps feel like homework</h4><p>Lists and flash cards work, but they feel like <strong>studying</strong>. I wanted it to feel like a game you already know.</p></div>
      <div class="pm-card"><div class="pm-lab">SOLUTION</div><h4>A crossword with a garden</h4><p>Solve a puzzle, <strong>keep the words</strong> you learned, and plant a flower for every puzzle.</p></div>
      <div class="pm-card"><div class="pm-lab">IMPACT</div><h4>Built in 3 weeks, now in review</h4><p>Designed and built <strong>Oct 1–20, 2026</strong>. It is <strong>waiting for Apple’s review</strong>.</p></div>
    </div>
    <div class="pm-hfoot pm-wp"><div class="pm-chips"><span>iOS</span><span>Design system</span><span>Light and dark</span></div><span class="pm-pbtn pm-sm" style="background:transparent;border:1.5px solid rgba(214,214,214,.45);color:var(--pm-tx);margin-left:auto">In App Store review</span></div>
  </div>
</div>`);

// ---------------------------------------------------------------- result: four short steps, all in dark
const col = (lab, p, src, alt) => `<div class="pm-rcol" style="width:244px"><div class="pm-cap"><div class="pm-lab">${lab}</div><p>${p}</p></div>${phone(src, alt, 230)}</div>`;
write('result', `
<div class="pmf pm-f-result" style="width:1132px"><h2>Follow the path, solve the puzzle, practice your words and grow a garden.</h2>
<div class="pm-rrow">
${col('FOLLOW THE PATH', 'Every stop is a puzzle. <strong>Finish it and a flower grows.</strong>', 'chengel-dark-home', 'The Chengel path in dark mode with a finished puzzle and the next one to start')}
${col('SOLVE THE PUZZLE', 'Clues in your language. <strong>You write the answer in my handwriting.</strong>', 'chengel-dark-puzzle-4', 'A crossword in dark mode with the word NACHT written in handwriting')}
${col('PRACTICE IT', 'Solved words go into <strong>three folders</strong>. Practice them so you always remember.', 'chengel-dark-words', 'The word folders in dark mode: Knew it, Knew with letters and Mostly revealed')}
${col('GROW A GARDEN', 'Each level has its own <strong>unique flowers</strong>. Each milestone helps you bloom one.', 'chengel-dark-awards', 'The awards screen in dark mode with the flowers from common to rare')}
</div></div>`);

// ---------------------------------------------------------------- idea
write('problem', page('width:700px;flex-direction:column;gap:16px', `
${head(1, 'Idea', 'I wanted learning words to feel like an old <strong>newspaper crossword</strong>.')}
<div class="pm-stack">
<div class="pm-card pm-big-h"><h3>QUESTION</h3><p>How can learning vocabulary be fun, like we used to do in old times? <strong>Solving a crossword with a pencil.</strong></p></div>
<div class="pm-card pm-big-h"><h3>IDEA</h3><p>A crossword where <strong>the clue is in your language</strong> and the answer is the word you are learning.</p></div>
<div class="pm-card pm-big-h"><h3>REFERENCE</h3><p>We used to solve newspaper crosswords <strong>by hand</strong>. The app brings that back, down to the handwriting. But this time it helps you learn a language.</p></div>
</div>`));

// ---------------------------------------------------------------- handwriting
write('hand', page('width:1290px;flex-direction:column;gap:18px', `
${head(2, 'Handwriting', 'I took the typography of my handwriting.')}
<div style="display:flex;gap:22px;height:530px;flex:none;align-items:center">
  <div style="width:350px;flex:none;display:flex;flex-direction:column;gap:12px;justify-content:center">
    <div class="pm-card" style="display:flex;flex-direction:column;gap:12px;padding:28px 28px"><h3 style="font-size:26px;line-height:1.2;color:var(--pm-hd)">The letters you write are my own handwriting.</h3><p style="font-size:16px;line-height:1.55">Newspaper crosswords were filled in by hand, so I wanted that look back. I turned it into a typeface, <strong>Yagmur Hand</strong>. One font file covers German, Turkish and Spanish letters.</p></div>
    <p style="font-size:13.5px;color:var(--pm-tx2);padding:0 6px">Only the grid uses it. Everything else is a clean monospace.</p>
  </div>
  <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;justify-content:center">
    <img src="/images/chengel-grid-dark.webp" alt="The crossword grid in dark mode with NACHT written in handwriting" style="width:100%;border-radius:14px;display:block">
    <img src="/images/chengel-grid-light.webp" alt="The crossword grid in light mode" style="width:100%;border-radius:14px;display:block">
  </div>
  <img src="/images/chengel-hand-specimen.webp" alt="Yagmur Hand: the word NACHT, the alphabet and the accented letters" style="height:330px;width:auto;border-radius:14px;flex:none;align-self:center">
</div>`));

// ---------------------------------------------------------------- cycle (concept)
{
  const cx = 592, cy = 330, r = 170;
  const pt = (deg, rr = r) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  const angles = [-90, 0, 90, 180];
  const gap = 15;
  const arcs = angles.map((a, i) => {
    const b = angles[(i + 1) % 4] + (i === 3 ? 360 : 0);
    const [x1, y1] = pt(a + gap), [x2, y2] = pt(b - gap);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" marker-end="url(#ah)"/>`;
  }).join('');
  const nodes = angles.map((a, i) => { const [x, y] = pt(a); return `<div class="pm-nd" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px">${i + 1}</div>`; }).join('');
  write('cycle', `
<div class="pmf pm-f-cycle pm-thm" style="--cbg:#44086a;--cfg:#f6effc;--cnb:#94b7f8;--cnf:#000131"><div class="pm-cwrap">
<svg class="pm-ring" viewBox="0 0 1184 644"><defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L8 5 L1 9" fill="none" stroke="#f6effc" stroke-width="2"/></marker></defs>${arcs}</svg>
<div class="pm-cmid" style="left:442px;top:330px;transform:translateY(-50%)"><div class="pm-lab">CONCEPT</div><h2>One puzzle, four steps. Then again.</h2></div>
${nodes}
<div class="pm-nt pm-nt2" style="width:420px;left:382px;top:${cy - r - 150}px;text-align:center;height:112px;display:flex;flex-direction:column;justify-content:flex-end"><h3>Follow the path.</h3><p>It shows <strong>where you are</strong>. Tap the start node and the puzzle opens.</p></div>
<div class="pm-nt pm-nt2" style="width:350px;left:${cx + r + 44}px;top:${cy - 52}px;text-align:left"><h3>Solve the puzzle.</h3><p>Clues in <strong>your language</strong>, answers in the one you learn. Stuck? A letter costs 10 coins, a word 30.</p></div>
<div class="pm-nt pm-nt2" style="width:420px;left:382px;top:${cy + r + 44}px;text-align:center"><h3>Practice it.</h3><p>Solved words go into three folders: <strong>Knew it</strong>, <strong>Knew with letters</strong>, <strong>Mostly revealed</strong>. Flash cards bring them back.</p></div>
<div class="pm-nt pm-nt2" style="width:350px;right:${1184 - (cx - r - 44)}px;top:${cy - 52}px;text-align:right"><h3>Grow a garden.</h3><p>Each level, A1 to C1, has a garden with <strong>eight blooms</strong>. Learned words plant them.</p></div>
</div></div>`);
}

// ---------------------------------------------------------------- information architecture
const li = (t, kids) => `<li><span>${t}</span>${kids ? `<ul>${kids.map((k) => `<li><span>${k}</span></li>`).join('')}</ul>` : ''}</li>`;
const tcol = (tab, items, mid) => `<div class="pm-tcol2${mid ? ' pm-mid' : ''}"><div class="pm-tab2">${tab}</div><ul class="pm-tr">${items.join('')}</ul></div>`;
write('ia', `
<div class="pmf pm-f-iat pm-ch" style="width:1290px">${head(3, 'Information architecture', 'First launch, then four tabs.')}
<div class="pm-rootn"><span>Chengel</span></div><div class="pm-bus"></div>
<div class="pm-trees" style="grid-template-columns:repeat(5,1fr)">
${tcol('First launch', [li('Welcome'), li('How it works'), li('Never forget a word'), li('Languages and level', ['I speak', 'I’m learning', 'A1 to C1']), li('Daily goal', ['1, 3 or 5 puzzles'])])}
${tcol('Play', [li('Level path', ['A1 to C1 sections', 'Stops and chests']), li('Puzzle', ['Clue bar', 'Grid', 'Keyboard', 'Letter and word hints']), li('Result', ['Stars', 'New and review words']), li('Streak, reminder, new bloom')], true)}
${tcol('Words', [li('Three folders', ['Knew it', 'Knew with letters', 'Mostly revealed']), li('Word list', ['Deutsch and English']), li('Flash cards', ['Show meaning', 'Again, Good, Easy'])])}
${tcol('Awards', [li('Progress', ['Bloom card', 'Level ladder']), li('Garden', ['A1 to C1 terraces']), li('Badges')])}
${tcol('Profile', [li('Course and stats'), li('Languages', ['I speak, I’m learning, level']), li('Appearance', ['Theme: system, light, dark', 'Season theme']), li('Daily goal'), li('Feedback', ['Sounds, haptics', 'Daily reminder'])])}
</div></div>`);

// ---------------------------------------------------------------- user flows
function flow(n, lab, h2, W, H, nodes, edges) {
  const byId = Object.fromEntries(nodes.map((nd) => [nd.id, nd]));
  const box = (nd) => ({ l: nd.x - nd.w / 2, r: nd.x + nd.w / 2, t: nd.y - nd.h / 2, b: nd.y + nd.h / 2 });
  const side = (nd, s) => { const b = box(nd); return { r: [b.r, nd.y], l: [b.l, nd.y], t: [nd.x, b.t], b: [nd.x, b.b] }[s]; };
  const colour = { y: '#f2c200', g: '#2fcf7e', r: '#ee5a63' };
  const arrow = { y: 'ary', g: 'arg', r: 'arr' };
  let svg = `<defs>${['ary', 'arg', 'arr'].map((id, i) => `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="${Object.values(colour)[i]}" stroke-width="1.6"/></marker>`).join('')}</defs>`;
  let texts = '';
  for (const e of edges) {
    const a = byId[e.from], b = byId[e.to];
    const p0 = side(a, e.fs), p1 = side(b, e.ts);
    const pts = [p0, ...(e.via || []), p1];
    const c = e.c || 'y';
    svg += `<path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')}" fill="none" stroke="${colour[c]}" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#${arrow[c]})"/><circle cx="${p0[0].toFixed(1)}" cy="${p0[1].toFixed(1)}" r="3" fill="${colour[c]}"/>`;
    if (e.label) { const [lx, ly, anchor] = e.at || [p0[0] + 6, p0[1] - 7, 'start']; texts += `<text x="${lx}" y="${ly}" class="pm-fe" text-anchor="${anchor || 'start'}">${e.label}</text>`; }
  }
  const lines = (nd) => nd.lines.map((t, i) => `<text x="${nd.x}" y="${(nd.y + (i - (nd.lines.length - 1) / 2) * 14 + 4).toFixed(1)}" class="pm-ft" text-anchor="middle">${esc(t)}</text>`).join('');
  const shape = (nd) => {
    const b = box(nd);
    if (nd.type === 'decision') return `<polygon points="${nd.x},${b.t} ${b.r},${nd.y} ${nd.x},${b.b} ${b.l},${nd.y}" class="pm-n-decision"/>`;
    if (nd.type === 'screen') return `<polygon points="${b.l + 10},${b.t} ${b.r},${b.t} ${b.r - 10},${b.b} ${b.l},${b.b}" class="pm-n-screen"/>`;
    if (nd.type === 'pill') return `<rect x="${b.l}" y="${b.t}" width="${nd.w}" height="${nd.h}" rx="${nd.h / 2}" class="pm-n-pill"/>`;
    if (nd.type === 'ok') return `<rect x="${b.l}" y="${b.t}" width="${nd.w}" height="${nd.h}" rx="7" class="pm-n-ok"/>`;
    if (nd.type === 'err') return `<rect x="${b.l}" y="${b.t}" width="${nd.w}" height="${nd.h}" rx="7" class="pm-n-err"/>`;
    return `<rect x="${b.l}" y="${b.t}" width="${nd.w}" height="${nd.h}" rx="7" class="pm-n-action"/>`;
  };
  const shapes = nodes.map((nd) => shape(nd) + lines(nd)).join('');
  const ly = H - 30;
  const legend =
    `<polygon points="${60},${ly - 8} ${74},${ly - 8} ${70},${ly + 6} ${56},${ly + 6}" class="pm-n-screen"/><text x="82" y="${ly + 4}" class="pm-fl">Screen</text>` +
    `<rect x="150" y="${ly - 8}" width="20" height="14" rx="3" class="pm-n-action"/><text x="178" y="${ly + 4}" class="pm-fl">Action</text>` +
    `<polygon points="248,${ly - 8} 258,${ly - 1} 248,${ly + 6} 238,${ly - 1}" class="pm-n-decision"/><text x="266" y="${ly + 4}" class="pm-fl">Decision</text>` +
    `<rect x="340" y="${ly - 8}" width="20" height="14" rx="7" class="pm-n-pill"/><text x="368" y="${ly + 4}" class="pm-fl">Start or end</text>` +
    `<rect x="470" y="${ly - 8}" width="20" height="14" rx="3" class="pm-n-ok"/><text x="498" y="${ly + 4}" class="pm-fl">Success</text>` +
    `<rect x="570" y="${ly - 8}" width="20" height="14" rx="3" class="pm-n-err"/><text x="598" y="${ly + 4}" class="pm-fl">Problem</text>`;
  return `<div class="pmf pm-f-fm pm-ch" style="width:${W + 56}px">${head(n, lab, h2)}<div class="pm-fmc"><svg class="pm-fms" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${svg}${texts}${shapes}${legend}</svg></div></div>`;
}
const N = (id, type, x, y, lines, w, h) => ({ id, type, x, y, lines, w: w || (type === 'decision' ? 122 : 118), h: h || (type === 'decision' ? 80 : 52) });

write('userflow', flow(4, 'User flow example · first launch to a solved puzzle', 'From the first launch to a flower on the path.', 1900, 560, [
  N('s', 'pill', 80, 190, ['Open', 'the app']),
  N('d1', 'decision', 232, 190, ['First', 'time?']),
  N('a', 'screen', 392, 190, ['Welcome and', 'how it works'], 126),
  N('b', 'screen', 548, 190, ['Languages,', 'level, goal'], 122),
  N('p', 'screen', 704, 190, ['Level path', '(Play tab)']),
  N('t', 'action', 850, 190, ['Tap the', 'start node']),
  N('pz', 'screen', 1000, 190, ['Puzzle: clue,', 'grid, keyboard'], 130),
  N('w', 'action', 1150, 190, ['Write a', 'letter']),
  N('d2', 'decision', 1306, 190, ['Word', 'right?']),
  N('ok', 'ok', 1470, 190, ['Word locks,', 'cells turn', 'green']),
  N('d3', 'decision', 1626, 190, ['All words', 'solved?']),
  N('res', 'screen', 1790, 190, ['Result:', 'stars, new', 'words']),
  N('hint', 'pill', 1000, 330, ['Stuck? Hint:', 'letter 10 coins,', 'word 30']),
  N('bad', 'err', 1306, 330, ['Word shakes,', '“not right”']),
  N('nxt', 'action', 1626, 330, ['Pick the', 'next clue']),
  N('st', 'screen', 1790, 430, ['Streak, reminder,', 'new bloom'], 138),
  N('home', 'pill', 1626, 430, ['Back on the path:', 'a flower is planted'], 150),
], [
  { from: 's', fs: 'r', to: 'd1', ts: 'l' },
  { from: 'd1', fs: 'r', to: 'a', ts: 'l', label: 'Yes', at: [296, 183, 'start'] },
  { from: 'a', fs: 'r', to: 'b', ts: 'l' },
  { from: 'b', fs: 'r', to: 'p', ts: 'l' },
  { from: 'd1', fs: 'b', to: 'p', ts: 'b', label: 'No', via: [[232, 270], [704, 270]], at: [240, 262, 'start'] },
  { from: 'p', fs: 'r', to: 't', ts: 'l' },
  { from: 't', fs: 'r', to: 'pz', ts: 'l' },
  { from: 'pz', fs: 'r', to: 'w', ts: 'l' },
  { from: 'w', fs: 'r', to: 'd2', ts: 'l' },
  { from: 'd2', fs: 'r', to: 'ok', ts: 'l', c: 'g', label: 'Yes', at: [1370, 183, 'start'] },
  { from: 'ok', fs: 'r', to: 'd3', ts: 'l', c: 'g' },
  { from: 'd3', fs: 'r', to: 'res', ts: 'l', c: 'g', label: 'Yes', at: [1690, 183, 'start'] },
  { from: 'd2', fs: 'b', to: 'bad', ts: 't', c: 'r', label: 'No', at: [1314, 262, 'start'] },
  { from: 'bad', fs: 'l', to: 'w', ts: 'b', c: 'r', via: [[1150, 330]] },
  { from: 'pz', fs: 'b', to: 'hint', ts: 't' },
  { from: 'hint', fs: 'r', to: 'w', ts: 'b', via: [[1150, 330]] },
  { from: 'd3', fs: 'b', to: 'nxt', ts: 't', label: 'No', at: [1634, 262, 'start'] },
  { from: 'nxt', fs: 'b', to: 'w', ts: 'b', via: [[1626, 385], [1150, 385]] },
  { from: 'res', fs: 'b', to: 'st', ts: 't', c: 'g' },
  { from: 'st', fs: 'l', to: 'home', ts: 'r', c: 'g' },
]));

write('userflow2', flow(5, 'User flow example · words and flash cards', 'From a folder of words to a card you rate.', 1900, 520, [
  N('s', 'pill', 80, 180, ['Open the', 'Words tab']),
  N('f', 'screen', 236, 180, ['My words:', 'three folders'], 126),
  N('o', 'action', 392, 180, ['Open a', 'folder']),
  N('l', 'screen', 548, 180, ['Word list:', 'Deutsch, English'], 130),
  N('st', 'action', 704, 180, ['Tap', 'Study']),
  N('c', 'screen', 858, 180, ['Flash card:', 'the word in', 'my handwriting'], 130),
  N('m', 'action', 1012, 180, ['Show', 'meaning']),
  N('d', 'decision', 1170, 180, ['Did you', 'know it?'], 130),
  N('e', 'ok', 1370, 90, ['Easy: moves', 'up a folder'], 130),
  N('g', 'pill', 1370, 180, ['Good: stays', 'where it is'], 130),
  N('a', 'err', 1370, 270, ['Again: moves', 'down a folder'], 130),
  N('d2', 'decision', 1560, 180, ['Cards', 'left?']),
  N('end', 'pill', 1760, 180, ['Back to the', 'folders']),
], [
  { from: 's', fs: 'r', to: 'f', ts: 'l' },
  { from: 'f', fs: 'r', to: 'o', ts: 'l' },
  { from: 'o', fs: 'r', to: 'l', ts: 'l' },
  { from: 'l', fs: 'r', to: 'st', ts: 'l' },
  { from: 'st', fs: 'r', to: 'c', ts: 'l' },
  { from: 'c', fs: 'r', to: 'm', ts: 'l' },
  { from: 'm', fs: 'r', to: 'd', ts: 'l' },
  { from: 'd', fs: 't', to: 'e', ts: 'l', c: 'g', via: [[1170, 90]], label: 'Easily', at: [1176, 118, 'start'] },
  { from: 'd', fs: 'r', to: 'g', ts: 'l', label: 'Mostly', at: [1240, 173, 'start'] },
  { from: 'd', fs: 'b', to: 'a', ts: 'l', via: [[1170, 270]], label: 'Not yet', at: [1176, 246, 'start'] },
  { from: 'e', fs: 'r', to: 'd2', ts: 'l', c: 'g', via: [[1470, 90], [1470, 180]] },
  { from: 'g', fs: 'r', to: 'd2', ts: 'l' },
  { from: 'a', fs: 'r', to: 'd2', ts: 'l', via: [[1470, 270], [1470, 180]] },
  { from: 'd2', fs: 'b', to: 'c', ts: 'b', via: [[1560, 380], [858, 380]], label: 'Yes: next card', at: [1200, 372, 'middle'] },
  { from: 'd2', fs: 'r', to: 'end', ts: 'l', c: 'g', label: 'No', at: [1626, 173, 'start'] },
]));

// ---------------------------------------------------------------- iterations: the keyboard and the dark colours
write('keyboard', page('width:1640px;flex-direction:column;gap:16px', `
${head(6, 'Iterations · keyboard and dark mode', 'Two things I tuned: the keyboard was <strong>louder than the puzzle</strong>, and the dark colours <strong>tired the eyes</strong>.', 'width:1020px')}
<div style="display:flex;gap:20px;height:470px;flex:none">
  <div style="flex:none;display:flex;flex-direction:column;gap:8px"><img src="/images/chengel-kb-options.webp" alt="Four keyboard options in light and dark: soft keys, tonal keys, lilac keys and letters only. Tonal keys was chosen." style="height:446px;width:auto;border-radius:14px;display:block;background:#fff"><div class="pm-lab" style="font-size:11px">Four options. I chose number 2, tonal keys.</div></div>
  <div style="flex:none;width:560px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:10px 12px;align-content:start">
    <div><div class="pm-lab" style="margin-bottom:6px">BEFORE · DARK</div><img src="/images/chengel-kb-before-dark.webp" alt="Keyboard before: outlined keys, dark mode" style="width:100%;border-radius:12px;display:block"></div>
    <div><div class="pm-lab" style="margin-bottom:6px">AFTER · DARK</div><img src="/images/chengel-kb-after-dark.webp" alt="Keyboard after: tonal keys, dark mode" style="width:100%;border-radius:12px;display:block"></div>
    <div><div class="pm-lab" style="margin-bottom:6px">BEFORE · LIGHT</div><img src="/images/chengel-kb-before-light.webp" alt="Keyboard before: outlined keys with dark letters, light mode" style="width:100%;border-radius:12px;display:block"></div>
    <div><div class="pm-lab" style="margin-bottom:6px">AFTER · LIGHT</div><img src="/images/chengel-kb-after-light.webp" alt="Keyboard after: tonal keys, light mode" style="width:100%;border-radius:12px;display:block"></div>
  </div>
  <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px">
    <div class="pm-card" style="flex:1;display:flex;flex-direction:column;gap:10px;justify-content:center;padding:20px 22px">
      <div class="pm-lab">KEYBOARD</div>
      <p>Keys had a <strong>1px outline</strong> and full-ink letters, so the keyboard shouted louder than the crossword.</p>
      <p><strong>Now: no outline</strong>, keys one hair lighter than the panel, muted letters. Letter on key is <strong>8.4:1</strong> in light and <strong>6.8:1</strong> in dark.</p>
    </div>
    <div class="pm-card" style="flex:1;display:flex;flex-direction:column;gap:10px;justify-content:center;padding:20px 22px">
      <div class="pm-lab">DARK MODE</div>
      <p>I tried several dark colours. Some <strong>reflected and tired my eyes</strong>.</p>
      <p><strong>Now: a purple-tinted night grey</strong>, never pure black.</p>
      <div style="display:flex;gap:6px">${['#1a1923', '#272533', '#121118', '#0c0b11', '#38364b'].map((c) => `<span style="flex:1;height:26px;border-radius:7px;background:${c};box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)"></span>`).join('')}</div>
    </div>
  </div>
</div>`));

// ---------------------------------------------------------------- design system boards
const board = (n, lab, h2, img, alt, w, h) => page('flex-direction:column;gap:20px', `${head(n, lab, h2, `width:${w}px`)}<img class="pm-bimg pm-tr" style="width:${w}px;height:${h}px;object-fit:contain" src="/images/${img}.webp" alt="${esc(alt)}">`);
write('colour', board(7, 'Design system · colour', 'Three colours carry the brand: navy, purple and light blue. <strong>Purple acts, blue writes.</strong>', 'chengel-ds-colour', 'Chengel colour tokens in light and dark: surfaces, ink, brand, written and status colours with their values', 1000, 492));
write('type', board(8, 'Design system · type', 'One monospace face for the interface, and <strong>my handwriting turned into a typeface</strong> for the letters you write.', 'chengel-ds-type', 'Chengel type styles in JetBrains Mono, the puzzle letter style in my handwriting, and lines, corners, space and shadows', 1060, 424));
write('components', board(9, 'Design system · components', 'Built with atomic design: <strong>atoms, molecules, organisms</strong>, each drawn once and reused on every screen.', 'chengel-ds-components', 'Chengel components cut from the live design system, in dark mode: atoms, molecules and organisms', 1560, 459));
write('icons', board(10, 'Design system · icons and illustrations', 'I drew the icons, Cengo and the flowers <strong>by hand</strong>, then polished them with AI.', 'chengel-ds-icons', 'The 52 hand-drawn icons, the spot illustrations, Cengo in seven poses and 40 blooms, in dark mode', 1280, 436));

// ---------------------------------------------------------------- final screens, night first
const finals = (theme) => ['onb-1', 'home', 'puzzle-2', 'cards-2', 'garden', 'profile']
  .map((n, i) => phone(`chengel-${theme}-${n}`, `Chengel ${theme} screen ${i + 1}`, 236)).join('');
write('final-night', `<div class="pmf pm-f-final pm-ch" style="width:1690px">${head(11, 'Final screens · dark', 'Welcome, the path, a puzzle, a flash card, the garden and the profile, <strong>in dark</strong>.')}<div class="pm-prow">${finals('dark')}</div></div>`);
write('final-day', `<div class="pmf pm-f-final pm-ch" style="width:1690px">${head(12, 'Final screens · light', 'The same screens <strong>in light</strong>: a pale blue paper, navy ink and purple that acts.')}<div class="pm-prow">${finals('light')}</div></div>`);

// ---------------------------------------------------------------- App Store
write('getit', `
<div class="pmf" style="width:1370px;align-items:center;gap:44px;padding:28px 48px">
  <div style="width:340px;flex:none;display:flex;flex-direction:column;gap:16px">
    <div class="pm-lab">Download from the App Store</div>
    <div style="display:flex;align-items:center;gap:18px"><img src="/images/chengel-icon.webp" alt="Chengel app icon" style="width:112px;height:112px;border-radius:26px;box-shadow:0 0 0 1px rgba(255,255,255,.12)"><div><h2 style="font-size:34px;line-height:1.05">Chengel</h2><p style="font-size:14px;margin-top:4px">Learn words by solving crosswords</p></div></div>
    <p style="font-size:15px;line-height:1.5">I sent Chengel to the App Store. It is <strong>waiting for Apple’s review</strong> and should be out soon. I will put the link here.</p>
    <span class="pm-pbtn" style="align-self:flex-start;background:transparent;border:1.5px solid rgba(214,214,214,.45);color:var(--pm-tx);margin:0">In App Store review</span>
  </div>
  <div style="display:flex;gap:16px;flex:none">${[['dark-home', 'Path'], ['dark-puzzle-4', 'Puzzle'], ['dark-words', 'Words'], ['dark-garden', 'Garden']].map(([n, t]) => `<div style="width:205px"><img src="/images/chengel-${n}.webp" alt="Chengel ${t}" style="width:205px;height:430px;object-fit:cover;object-position:top;border-radius:28px;display:block;box-shadow:0 0 0 1px rgba(255,255,255,.1)"></div>`).join('')}</div>
</div>`);

// ---------------------------------------------------------------- prototype: an iPhone, with the theme switch beside it
{
  const k = 0.746; // 390 x 844 shown at 291 x 630
  write('prototype', `
<div class="pmf pm-f-proto" style="width:860px;align-items:center;gap:56px;padding:28px 56px"><div class="pm-pwrap"><div class="pm-proto-live"><div class="pm-phone" style="--pw:291;width:305px"><div class="pm-scr" style="width:291px;height:630px;background:#1a1923"><div style="width:390px;height:844px;transform:scale(${k});transform-origin:0 0"><iframe src="/prototypes/chengel/index.html" data-w="390" data-h="844" title="Chengel clickable prototype" loading="lazy" style="display:block;border:0;width:390px;height:844px;background:#1a1923"></iframe></div></div></div></div><div class="pm-proto-still"><div class="pm-phone pm-static" style="--pw:250"><div class="pm-scr"><img src="/images/chengel-dark-home-start.webp" alt="Chengel path" loading="lazy"></div></div></div></div>
<div class="pm-ptxt"><div class="pm-lab">Prototype</div><h2>Solve a puzzle yourself.</h2><p><strong>Tap the start node</strong> and type the words with your keyboard or the keys.</p><button type="button" class="pm-pbtn" data-chengel-theme style="cursor:pointer;border:0;font-family:inherit">Switch to light</button></div></div>`);
}

// ---------------------------------------------------------------- outcome
write('outcome', `
<div class="pmf pm-f-outcome pm-tight pm-side" style="width:1060px"><h2>What it achieved, and what I'd do next.</h2><div class="pm-oc2" style="align-content:start;margin-top:6px">
<section class="pm-oc-col"><div class="pm-lab">IMPACT</div><div class="pm-oc-list">
<div class="pm-oc-it"><b>Sent to the App Store</b><span>Designed and built in <strong>3 weeks</strong>, Oct 1–20, 2026, with one iOS developer. Now <strong>waiting for review</strong>.</span></div>
<div class="pm-oc-it"><b>One system, two looks</b><span>Light and dark come from <strong>the same tokens</strong>. Every text pair stays above 4.5:1 contrast.</span></div>
<div class="pm-oc-it"><b>Something people can try</b><span>The clickable prototype is on this page, so you can <strong>solve a puzzle yourself</strong>.</span></div>
</div></section>
<section class="pm-oc-col"><div class="pm-lab">NEXT</div><div class="pm-oc-grid">
<div class="pm-oc-nx"><i>1</i><div><b>Go live</b><span>Add the <strong>App Store link</strong> here when Apple approves it.</span></div></div>
<div class="pm-oc-nx"><i>2</i><div><b>Seasonal themes</b><span><strong>Christmas, New Year, Easter and Halloween</strong> are set up as colour overrides, still in design.</span></div></div>
<div class="pm-oc-nx"><i>3</i><div><b>More puzzles</b><span>The path already has scenery up to <strong>C1</strong>. It needs more puzzles to walk through.</span></div></div>
</div></section></div></div>`);

// ---------------------------------------------------------------- summary
write('summary', `
<div class="pmf pm-f-sum"><div class="pm-sumtop">
<div class="pm-card pm-sm"><h3>WHAT I DID</h3><p>I designed <strong>Chengel</strong>, an iOS crossword for learning words: the app, the design system, the icons and the illustrations.</p></div>
<div class="pm-card pm-sm"><h3>HOW I DID IT</h3><p>I took the typography of <strong>my own handwriting</strong> for the puzzle letters, drew the icons by hand, polished them with AI, and built the design in <strong>Claude Design</strong>.</p></div>
<div class="pm-card pm-sm"><h3>WHY I DID IT</h3><p>I wanted learning words to feel like the <strong>newspaper crosswords</strong> we used to fill in by hand.</p></div>
<div class="pm-card pm-sm"><h3>WHO WAS INVOLVED</h3><p>Me for the design, and <strong>one iOS developer</strong> who built it. It is now in <strong>App Store review</strong>.</p></div>
</div>
<div class="pm-pills"><div class="pm-pill"><span class="pm-lab">Position</span><b>Product Designer</b></div><div class="pm-pill"><span class="pm-lab">Time</span><b>3 weeks · Oct 1–20, 2026</b></div><div class="pm-pill"><span class="pm-lab">Tools</span><b>Claude Design</b></div></div></div>`);
