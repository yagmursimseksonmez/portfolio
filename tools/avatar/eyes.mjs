// Lets the eyes in the contact illustration look around: lifts the two irises out of avatar-base.webp. Writes
//   public/images/avatar-face.webp   the illustration with white where the irises were (inside the eye openings only)
//   public/images/avatar-eyes.webp   the two eye openings as an alpha mask, for the irises moving under it
//   src/components/avatar-eyes.json  each iris as a circle (cx, cy, r) in the 1105 x 1105 artwork
// The iris is a solid disc in her drawing, so it is kept as one. The lids it hides are found from their outer edge, which
// shows, and the line width seen beside the iris; at rest the face looks exactly as drawn.
// Run from the repo root: node tools/avatar/eyes.mjs (add --debug for overlays in /tmp/avatar-eyes/).
import fs from 'node:fs';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url).pathname;
const debug = process.argv.includes('--debug');
const { data, info } = await sharp(`${root}public/images/avatar-base.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const at = (x, y) => (y * W + x) * 4;
const lum = (x, y) => { const i = at(x, y); return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
const white = (x, y) => { const i = at(x, y); return data[i] >= 250 && data[i + 1] >= 250 && data[i + 2] >= 250; };
const dark = (x, y) => lum(x, y) < 128;
// the face's own colour; the warm fringe the artwork has around its ink is not skin
const skin = (x, y) => { const i = at(x, y); return Math.abs(data[i] - 246) < 12 && Math.abs(data[i + 1] - 238) < 12 && Math.abs(data[i + 2] - 232) < 14; };
const INK = [31, 31, 31];

// Search boxes around each eye; small white components (the highlight dots beside the eyes) are left out by size.
const boxes = [[340, 360, 570, 530], [585, 340, 800, 510]];

function components([x0, y0, x1, y1], test) {
  const w = x1 - x0, seen = new Uint8Array(w * (y1 - y0)), out = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (seen[(y - y0) * w + x - x0] || !test(x, y)) continue;
    const px = [], st = [[x, y]]; seen[(y - y0) * w + x - x0] = 1;
    while (st.length) {
      const [a, b] = st.pop(); px.push([a, b]);
      for (const [u, v] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) {
        if (u < x0 || u >= x1 || v < y0 || v >= y1 || seen[(v - y0) * w + u - x0] || !test(u, v)) continue;
        seen[(v - y0) * w + u - x0] = 1; st.push([u, v]);
      }
    }
    out.push(px);
  }
  return out;
}

// Least-squares circle through points (Kasa), refitted without the points that sit off it.
function fitCircle(pts) {
  let c;
  for (let pass = 0; pass < 3; pass++) {
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
    for (const [x, y] of pts) { const z = x * x + y * y; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z; }
    const n = pts.length, A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], B = [sxz, syz, sz];
    const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(A), sol = [0, 1, 2].map((k) => det(A.map((row, r) => row.map((v, j) => (j === k ? B[r] : v)))) / D);
    const cx = sol[0] / 2, cy = sol[1] / 2;
    c = { cx, cy, r: Math.sqrt(sol[2] + cx * cx + cy * cy) };
    pts = pts.filter(([x, y]) => Math.abs(Math.hypot(x - c.cx, y - c.cy) - c.r) < 2);
  }
  return c;
}

// Where a white run meets the lid, to a fraction of a pixel: halfway between the white and the ink.
const edge = (x, y, dir) => {
  let s = 1; while (s < 4 && lum(x, y + dir * s) >= 143) s++;
  const a = lum(x, y + dir * (s - 1)), b = lum(x, y + dir * s);
  return y + dir * (s - 1 + Math.min(1, Math.max(0, (a - 143) / Math.max(1, a - b))));
};

const face = Buffer.from(data);
const mask = Buffer.alloc(W * H);
const eyes = [], curves = [];
for (const box of boxes) {
  const sclera = components(box, white).filter((c) => c.length > 300);
  const inW = new Set(sclera.flat().map(([x, y]) => y * W + x));
  // The iris edge: white pixels next to ink that is part of a big blob (the lids are thin lines, the iris a disc).
  const near = (x, y, r) => { for (let v = -r; v <= r; v++) for (let u = -r; u <= r; u++) if (u * u + v * v <= r * r && !dark(x + u, y + v)) return false; return true; };
  const rim = [];
  for (const [x, y] of sclera.flat()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (inW.has((y + dy) * W + x + dx)) continue;
    // the first ink within 3px, then a disc of ink a little further in: that is the iris, not a lid line
    let s = 1; while (s <= 3 && !dark(x + dx * s, y + dy * s)) s++;
    if (s > 3 || !near(x + dx * (s + 10), y + dy * (s + 10), 7)) continue;
    rim.push([x + dx * (s - 0.5), y + dy * (s - 0.5)]);
  }
  const iris = fitCircle(rim);
  const inIris = (x, y, pad = 0) => Math.hypot(x - iris.cx, y - iris.cy) <= iris.r + pad;
  // Under the iris a lid's inner edge cannot be seen, but its outer edge (ink to skin) can: the inner edge is found from it
  // and the lid's thickness, which is measured where the white shows and carried across the gap.
  const lid = (seen, dir) => {
    const outer = [], inner = [], cols = [...seen.keys()].sort((a, b) => a - b);
    const from = cols[0], to = cols[cols.length - 1];
    for (let x = from; x <= to; x++) {
      let y = seen.has(x) ? Math.round(seen.get(x)) + dir : Math.abs(x - iris.cx) < iris.r - 3 ? Math.round(iris.cy) : null;
      if (y == null) continue;
      // out through the ink (and any white between the iris and the lid) until the skin
      let n = 0; while (!skin(x, y) && n++ < 120) y += dir;
      const a = lum(x, y - dir), b = lum(x, y);
      outer[x] = y - dir + dir * Math.min(1, Math.max(0, (143 - a) / Math.max(1, b - a)));
    }
    // lashes leave the upper lid as spikes: a running median takes them out
    const med = [];
    for (let x = from; x <= to; x++) { const w = []; for (let k = x - 4; k <= x + 4; k++) if (outer[k] != null) w.push(outer[k]); if (w.length) med[x] = w.sort((p, q) => p - q)[w.length >> 1]; }
    // The stroke's width beside a gap (measured square to the line, so a steep stretch does not read as thick): the
    // nearest 4 columns where there is a lid line at all (where the white meets the skin through a break in the line,
    // there is none). The lid only tapers at its ends, so the wider side is kept; it is laid back along the outer edge.
    const tilt = (x) => { const a = med[x - 3] ?? med[x], b = med[x + 3] ?? med[x]; return Math.cos(Math.atan((b - a) / 6)); };
    const lined = cols.filter((x) => med[x] != null && Math.abs(seen.get(x) - med[x]) > 2);
    const width = (xa, side) => {
      const xs = (side < 0 ? lined.filter((x) => x <= xa).slice(-4) : lined.filter((x) => x >= xa).slice(0, 4));
      const t = xs.map((x) => Math.abs(seen.get(x) - med[x]) * tilt(x)).sort((p, q) => p - q);
      return t.length ? t[t.length >> 1] : 0;
    };
    for (let k = 0; k < cols.length; k++) {
      const xa = cols[k], xb = cols[k + 1];
      inner[xa] = seen.get(xa);
      if (xb == null || xb - xa < 2) continue;
      const w = Math.max(width(xa, -1), width(xb, 1)), est = (x) => med[x] - (dir * w) / tilt(x);
      // shifted to meet the white exactly at both ends, then smoothed over 13 columns
      const da = seen.get(xa) - est(xa), db = seen.get(xb) - est(xb), run = [];
      for (let x = xa + 1; x < xb; x++) run[x] = med[x] == null ? null : est(x) + da + ((db - da) * (x - xa)) / (xb - xa);
      run[xa] = seen.get(xa); run[xb] = seen.get(xb);
      for (let x = xa + 1; x < xb; x++) {
        const near = []; for (let j = Math.max(xa, x - 6); j <= Math.min(xb, x + 6); j++) if (run[j] != null) near.push(run[j]);
        if (!near.length) continue;
        // where the white does not show, the iris touches the lid: the lid's edge is no further out than the disc's (kept
        // a pixel inside it, so at rest the iris's own soft edge covers the white's)
        const h = Math.sqrt(Math.max(0, iris.r ** 2 - (x - iris.cx) ** 2)), rim = iris.cy + dir * (h - 1);
        const y = near.reduce((a, b) => a + b, 0) / near.length;
        inner[x] = h > 1 ? (dir < 0 ? Math.max(y, rim) : Math.min(y, rim)) : y;
      }
    }
    return inner;
  };
  // Each lid, column by column: where the white meets it, exactly.
  // Only the topmost and bottommost white in a column can touch a lid; where the iris is over (or under) it, that column
  // is a gap.
  const ends = new Map();
  for (const [x, y] of sclera.flat()) { const e = ends.get(x) ?? [y, y]; ends.set(x, [Math.min(e[0], y), Math.max(e[1], y)]); }
  const top = new Map(), bottom = new Map();
  for (const [x, [a, b]] of ends) {
    if (!inIris(x, a - 3, 3)) top.set(x, edge(x, a, -1));
    if (!inIris(x, b + 3, 3)) bottom.set(x, edge(x, b, 1));
  }
  const xs = sclera.flat().map(([x]) => x), span = [Math.min(...xs), Math.max(...xs)];
  const upper = lid(top, -1), lower = lid(bottom, 1);
  if (debug) curves.push({ upper, lower, top, bottom, iris });
  // The opening is the band between the lids; only the iris inside it is painted white.
  const [x0, y0, x1, y1] = box;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = y * W + x;
    const open = inW.has(i) ? 1 : upper[x] == null || lower[x] == null ? 0
      : Math.min(1, Math.max(0, y - upper[x] + 0.5)) * Math.min(1, Math.max(0, lower[x] - y + 0.5));
    if (open > 0 && !inW.has(i) && inIris(x, y, 2)) { const j = at(x, y); for (let k = 0; k < 3; k++) face[j + k] = Math.round(data[j + k] + (255 - data[j + k]) * open); }
    mask[i] = Math.max(mask[i], Math.round(open * 255));
  }
  eyes.push({ cx: +iris.cx.toFixed(1), cy: +iris.cy.toFixed(1), r: +iris.r.toFixed(1), span, rim: rim.length, lids: [top.size, bottom.size] });
}
// The mask reaches 3px into the ink and its soft edge around each opening, so the moving iris meets the lid line with no
// light seam; never onto the face outside the lines (skin reached from the edge of each box; the pale fringe inside the
// lines has the skin's colour too, but cannot be reached).
const outside = new Uint8Array(W * H);
for (const [x0, y0, x1, y1] of boxes) {
  const st = [];
  for (let x = x0; x < x1; x++) st.push([x, y0], [x, y1 - 1]);
  for (let y = y0; y < y1; y++) st.push([x0, y], [x1 - 1, y]);
  while (st.length) {
    const [x, y] = st.pop();
    if (x < x0 || x >= x1 || y < y0 || y >= y1 || outside[y * W + x] || !skin(x, y)) continue;
    outside[y * W + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}
const grown = Buffer.from(mask);
for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
  if (mask[y * W + x] === 255 || outside[y * W + x]) continue;
  let m = mask[y * W + x]; for (let v = -3; v <= 3; v++) for (let u = -3; u <= 3; u++) m = Math.max(m, mask[(y + v) * W + x + u]);
  grown[y * W + x] = m;
}
const alpha = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) { alpha[i * 4 + 3] = grown[i]; }

await sharp(face, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${root}public/images/avatar-face.webp`);
await sharp(alpha, { raw: { width: W, height: H, channels: 4 } }).webp({ lossless: true }).toFile(`${root}public/images/avatar-eyes.webp`);
fs.writeFileSync(`${root}src/components/avatar-eyes.json`, JSON.stringify(eyes.map(({ cx, cy, r }) => ({ cx, cy, r })), null, 2) + '\n');
console.log(JSON.stringify(eyes));

if (debug) {
  fs.mkdirSync('/tmp/avatar-eyes', { recursive: true });
  // The traced lids on the original: seen in green, carried under the iris in red, the iris circle in blue.
  const over = Buffer.from(data);
  const dot = (x, y, c) => { const j = at(Math.round(x), Math.round(y)); [over[j], over[j + 1], over[j + 2]] = c; };
  for (const { upper, lower, top, bottom, iris } of curves) {
    for (const [arr, seen] of [[upper, top], [lower, bottom]]) arr.forEach((y, x) => y != null && dot(x, y, seen.has(x) ? [0, 200, 0] : [230, 0, 0]));
    for (let a = 0; a < 6.283; a += 0.01) dot(iris.cx + iris.r * Math.cos(a), iris.cy + iris.r * Math.sin(a), [0, 90, 255]);
  }
  for (const [n, l, t] of [['lidsL', 380, 395], ['lidsR', 600, 370]]) await sharp(over, { raw: { width: W, height: H, channels: 4 } }).extract({ left: l, top: t, width: 170, height: 115 }).resize(1020, null, { kernel: 'nearest' }).png().toFile(`/tmp/avatar-eyes/${n}.png`);
  // The face with each iris drawn back at a given offset, to compare with the original.
  for (const [name, dx, dy] of [['still', 0, 0], ['left', -16, 0], ['right', 16, 0], ['up', 0, -6]]) {
    const out = Buffer.from(face);
    for (const e of eyes) for (let y = Math.floor(e.cy - e.r - 30); y < e.cy + e.r + 30; y++) for (let x = Math.floor(e.cx - e.r - 40); x < e.cx + e.r + 40; x++) {
      const d = Math.hypot(x - e.cx - dx, y - e.cy - dy) - e.r, cover = Math.min(1, Math.max(0, 0.5 - d)) * (grown[y * W + x] / 255);
      const j = at(x, y); for (let k = 0; k < 3; k++) out[j + k] = Math.round(out[j + k] + (INK[k] - out[j + k]) * cover);
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 340, top: 340, width: 460, height: 190 }).resize(1380, null, { kernel: 'nearest' }).png().toFile(`/tmp/avatar-eyes/${name}.png`);
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 600, top: 370, width: 160, height: 110 }).resize(800, null, { kernel: 'nearest' }).png().toFile(`/tmp/avatar-eyes/r-${name}.png`);
  }
}
process.exit(0);
