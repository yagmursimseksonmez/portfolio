const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 1024px)');
// A case reads as on a screen from 940px (the list of pages beside its column, site.css), before the rest of the site does.
const caseScreen = matchMedia('(min-width: 940px)');

function cssMs(el, name) {
  if (reduceMotion.matches) return 0;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('ms') ? n : n * 1000;
}

// ------------------------------------------------------------ Berlin clock
const TZ = 'Europe/Berlin';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
});
const shortFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' });

function berlinNow() {
  const parts = partsFmt.formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { day: DAYS.indexOf(get('weekday')) + 1, h: +get('hour'), m: +get('minute'), s: +get('second') };
}
const isWorkday = (day) => day >= 1 && day <= 5;
const isOpen = (t) => isWorkday(t.day) && t.h >= 9 && t.h < 18;

function hoursUntilOpen(t) {
  let days = isWorkday(t.day) && t.h < 9 ? 0 : 1;
  let day = ((t.day - 1 + days) % 7) + 1;
  while (!isWorkday(day)) { days += 1; day = (day % 7) + 1; }
  const hours = days * 24 + 9 - t.h - t.m / 60;
  return Math.max(1, Math.round(hours));
}

function startClock() {
  const label = document.querySelector('[data-clock]');
  const card = document.querySelector('[data-hours]');
  const openLabel = card?.querySelector('[data-open-label]');
  const reopens = card?.querySelector('[data-reopens]');
  const hands = Object.fromEntries([...document.querySelectorAll('[data-hand]')].map((el) => [el.dataset.hand, el]));
  const tick = () => {
    const t = berlinNow();
    if (label) label.textContent = shortFmt.format(new Date());
    if (hands.h) {
      hands.h.style.transform = `rotate(${(t.h % 12) * 30 + t.m * 0.5}deg)`;
      hands.m.style.transform = `rotate(${t.m * 6 + t.s * 0.1}deg)`;
      hands.s.style.transform = `rotate(${t.s * 6}deg)`;
    }
    if (card) {
      const open = isOpen(t);
      card.classList.toggle('is-open-hours', open);
      openLabel.textContent = open ? 'Open' : 'Closed';
      reopens.hidden = open;
      if (!open) {
        const n = hoursUntilOpen(t);
        reopens.textContent = `Opens in ${n} ${n === 1 ? 'hour' : 'hours'}`;
      }
    }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();
}

// ------------------------------------------------------- particle hero type
// Coloured discs drift up behind the lettering; the pointer pulls nearby ones in.
function startHero() {
  const wrap = document.querySelector('[data-hero]');
  const canvas = wrap?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return null;

  const colors = ['#FFD100', '#FFEE32', '#D6D6D6', '#333533'];
  const base = '#FAFAF8';
  const font = (size) => `700 ${size}px Inter, system-ui, sans-serif`;
  const tracking = -0.045;
  const particles = [];
  const pointer = { x: 0, y: 0, inside: false };
  let lines = [];
  let w = 0;
  let h = 0;
  let unit = 1;
  let magnet = 110;
  let running = false;
  let raf = 0;
  let covered = false;
  let onScreen = true;

  const rand = (a, b) => Math.random() * (b - a) + a;
  function spawn(fromBottom) {
    const r = rand(30, 60) * unit;
    const speed = rand(2, 8) * unit;
    return { x: rand(0, w), y: fromBottom ? h + r : rand(0, h), vx: 0, vy: speed, speed, r, color: colors[Math.floor(rand(0, colors.length))] };
  }

  function layout() {
    const text = ['I design things'];
    const cssW = wrap.clientWidth;
    ctx.font = font(100);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking * 100}px`;
    const m = text.map((t) => ctx.measureText(t));
    const inkW = Math.max(...m.map((x) => x.actualBoundingBoxLeft + x.actualBoundingBoxRight));
    // The lettering spans the width, unless that would make it taller than the CSS max-height allows (a short window
    // on a screen, so the projects below still fit): then it is smaller and starts on the left.
    const inkH = m[0].actualBoundingBoxAscent + Math.max(...m.map((x) => x.actualBoundingBoxDescent));
    const maxH = parseFloat(getComputedStyle(wrap).maxHeight) || Infinity;
    const size = Math.min((100 * cssW) / inkW, (100 * maxH) / inkH);
    const k = size / 100;
    const ascent = m[0].actualBoundingBoxAscent * k;
    const descent = Math.max(...m.map((x) => x.actualBoundingBoxDescent)) * k;
    const leading = size * 0.86;
    const cssH = ascent + descent + leading * (text.length - 1);
    wrap.style.height = `${cssH}px`;

    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = cssW;
    h = cssH;
    unit = Math.max(0.35, w / 1240);
    magnet = Math.min(180, Math.max(90, Math.min(w, h) * 0.42));
    lines = text.map((t, i) => ({ t, x: m[i].actualBoundingBoxLeft * k, y: ascent + i * leading, size }));

    const want = Math.round(40 * Math.max(0.5, (w * h) / (1240 * 230)));
    while (particles.length < want) particles.push(spawn(false));
    particles.length = Math.min(particles.length, want);
    for (const p of particles) { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); }
  }

  function draw() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    // The letters first, in the base colour; the discs are then painted only where there is a letter.
    // (Masking each line in turn would erase the line before it, so two lines on a phone came out empty.)
    ctx.fillStyle = base;
    for (const l of lines) {
      ctx.font = font(l.size);
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking * l.size}px`;
      ctx.fillText(l.t, l.x, l.y);
    }
    ctx.globalCompositeOperation = 'source-atop';
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    if (!running) return;
    const r2 = magnet * magnet;
    for (const p of particles) {
      let pull = 0;
      if (pointer.inside) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2) pull = (1 - Math.sqrt(d2) / magnet) ** 2;
      }
      if (pull > 0) {
        p.vx += (pointer.x - p.x) * 0.14 * pull;
        p.vx *= 1 - 0.22 * pull;
        p.vy = p.speed * (1 - pull * 0.9);
      } else {
        p.vx *= 0.9;
        if (Math.abs(p.vx) < 0.04) p.vx = 0;
        p.vy += (p.speed - p.vy) * 0.1;
      }
      p.x += p.vx;
      p.y -= p.vy;
      if (p.y < -p.r * 2) Object.assign(p, spawn(true));
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function sync() {
    const go = onScreen && !covered && !reduceMotion.matches && document.visibilityState === 'visible';
    if (go && !running) { running = true; raf = requestAnimationFrame(step); }
    if (!go) { running = false; cancelAnimationFrame(raf); draw(); }
  }

  const setPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.inside = true;
  };
  canvas.addEventListener('pointermove', setPointer, { passive: true });
  canvas.addEventListener('pointerenter', setPointer, { passive: true });
  canvas.addEventListener('pointerleave', () => (pointer.inside = false), { passive: true });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  reduceMotion.addEventListener('change', sync);

  const relayout = () => { layout(); if (!running) draw(); };
  new ResizeObserver(relayout).observe(wrap.parentElement);
  // The height cap follows the window's height, which the observer above does not see.
  addEventListener('resize', relayout, { passive: true });
  mobile.addEventListener('change', relayout);
  document.fonts.ready.then(relayout);
  layout();
  sync();

  let coverTimer = 0;
  return {
    setCovered(next) {
      clearTimeout(coverTimer);
      if (!next) { covered = false; sync(); return; }
      coverTimer = setTimeout(() => { covered = true; sync(); }, cssMs(root, '--time-cards'));
    },
  };
}

// ------------------------------------------------------------------ contact
const contact = document.querySelector('[data-contact]');
const contactToggle = contact?.querySelector('[data-contact-toggle]');
const contactMenu = contact?.querySelector('.contact-menu');
const contactOpen = () => !!contact?.classList.contains('is-open');

function setContact(open) {
  if (!contact || open === contactOpen()) return;
  if (open) focusGallery(null);
  contact.classList.toggle('is-open', open);
  contactToggle.setAttribute('aria-expanded', String(open));
  contactMenu.setAttribute('aria-hidden', String(!open));
  floatAvatar(open);
}

// While the panel is open the illustration floats like a balloon: a slow swing sideways and a quicker bob, leaning a
// little into its way, and her eyes look where it is going. It eases in from rest each time the panel opens. The eyes
// follow the drift slowly (smoothed over 2 s, so about a second behind) and mostly sideways (her "gozler biraz daha yavas
// hareket etmeli").
const balloon = contact?.querySelector('.avatar-wrap');
const balloonFace = balloon?.querySelector('.avatar');
let balloonFrame = 0;
function floatAvatar(open) {
  cancelAnimationFrame(balloonFrame);
  if (!open || !balloonFace || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now(), wx = (2 * Math.PI) / 7.4, wy = (2 * Math.PI) / 4.9;
  let last = t0, lx = 0, ly = 0;
  const frame = (now) => {
    const t = Math.max(0, now - t0) / 1000, e = Math.min(1, t / 1.6), k = e * e * (3 - 2 * e), size = balloon.offsetWidth;
    const x = 0.024 * size * Math.sin(wx * t), y = 0.028 * size * Math.sin(wy * t + 0.6);
    const vx = Math.cos(wx * t), vy = Math.cos(wy * t + 0.6);
    // (a long pause between frames, a hidden tab, counts as a tenth of a second, so the eyes never jump)
    const lag = 1 - Math.exp(-Math.min(100, Math.max(0, now - last)) / 2000);
    last = now;
    lx += (vx * k - lx) * lag;
    ly += (0.6 * vy * k - ly) * lag;
    balloon.style.transform = `translate(${(x * k).toFixed(2)}px, ${(y * k).toFixed(2)}px) rotate(${(2 * vx * k).toFixed(2)}deg)`;
    balloonFace.style.setProperty('--look-x', lx.toFixed(3));
    balloonFace.style.setProperty('--look-y', ly.toFixed(3));
    balloonFrame = requestAnimationFrame(frame);
  };
  balloonFrame = requestAnimationFrame(frame);
}

function startContact() {
  if (!contact) return;
  // The closed panel is clipped to the button; measured again whenever the button's width changes (the font loading,
  // the window crossing a breakpoint).
  // (the observer's box size, not the on-screen one: the panel is scaled down while a folder is open)
  const measure = (w) => contact.style.setProperty('--btn-w', `${Math.ceil(w)}px`);
  measure(contactToggle.getBoundingClientRect().width);
  new ResizeObserver(([e]) => measure(e.borderBoxSize[0].inlineSize)).observe(contactToggle);
  contactToggle.addEventListener('click', (e) => { e.stopPropagation(); setContact(!contactOpen()); });
  document.addEventListener('pointerdown', (e) => { if (contactOpen() && !contact.contains(e.target)) setContact(false); });
  // The address in the contact menu and the one under "Say hello" in the book. "Copied" shows on the button and is read
  // out from one hidden status line; with no clipboard (an older browser, no permission) the click writes an email.
  const copyStatus = document.querySelector('[data-copy-status]');
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const box = btn.closest('.email') || btn;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        box.classList.add('copied');
        if (copyStatus) copyStatus.textContent = 'Email address copied';
        setTimeout(() => {
          box.classList.remove('copied');
          if (copyStatus) copyStatus.textContent = '';
        }, 1000);
      } catch {
        location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });
}

// ------------------------------------------------------------------ gallery
// Cards are ordered back (index 0, top of the pile) to front. `active` is a card
// index, BOOK for the about book, or null for the resting stack.
const BOOK = 'book';
const gallery = document.querySelector('[data-gallery]');
const header = document.querySelector('header');
const home = document.querySelector('[data-home]');
const cards = gallery ? [...gallery.querySelectorAll('[data-card]')] : [];
const book = gallery?.querySelector('[data-book]');
const bookScroll = book?.querySelector('[data-book-scroll]');
const count = cards.length;
let active = null;
let hero = null;

const tabSize = () => parseFloat(getComputedStyle(gallery).getPropertyValue('--tab')) || 60;

// Folder pitch in the resting stack is the tab plus this much. A sheet's content starts 40px
// below its top edge, so only a thin sliver of each strip shows between the folders.
const SLIVER = 16;
const REST_TOP = 40; // padding above a sheet's content
const REVEAL = 36; // strip of content shown in each band

// The resting folders are tilted back (CSS: rotateX(-20deg) about the top edge) and seen through the
// stage's 1400px perspective, so a point v px below a folder's top edge lands at this screen y, and back.
const PERSPECTIVE = 1400;
const TILT = (20 * Math.PI) / 180;
const restingY = (cardY, v) => {
  const cy = innerHeight / 2;
  return cy + ((cardY + v * Math.cos(TILT) - cy) * PERSPECTIVE) / (PERSPECTIVE + v * Math.sin(TILT));
};
const restingV = (cardY, y) => {
  const cy = innerHeight / 2;
  const c = cardY - cy;
  const d = y - cy;
  return (PERSPECTIVE * (d - c)) / (PERSPECTIVE * Math.cos(TILT) - d * Math.sin(TILT));
};

function measureGallery() {
  const origin = header.getBoundingClientRect().bottom;
  const tab = tabSize();
  const peek = Math.max(tab, Math.min((innerHeight - origin) / count, tab + SLIVER));
  gallery.style.setProperty('--origin', `${origin}px`);
  gallery.style.setProperty('--peek', `${peek}px`);
  // In the resting stack every folder shows the same thin strip of its content: its top edge ends
  // REVEAL px above the folder in front, or above the bottom of the screen for the front folder.
  cards.forEach((card, k) => {
    const work = card.querySelector('.work');
    const fig = work?.querySelector('figure');
    // Where the strip starts inside its sheet. `.work` is transformed, so it is its own offset parent.
    const top = work && fig ? work.offsetTop + fig.offsetTop : REST_TOP;
    const target = k === count - 1 ? innerHeight - REVEAL : restingY(origin + (k + 1) * peek, tab) - REVEAL;
    // Negative when a tall window centres the strip lower than the band: pull it up, but never past the sheet's top edge.
    const shift = Math.max(8 - top, restingV(origin + k * peek, target) - tab - top);
    card.style.setProperty('--rest-shift', `${shift}px`);
  });
}

function cardY(k, next) {
  if (next === null) return null; // resting position comes from CSS
  const tab = tabSize();
  const front = next === BOOK || k > next;
  if (mobile.matches) {
    if (next === BOOK) return `${innerHeight}px`;
    if (!front) return `${k * tab}px`;
    return `${innerHeight - (count - k) * tab}px`;
  }
  return front ? `${innerHeight - tab}px` : '0px';
}

function setFocus(next) {
  const prev = active;
  // (asked before anything changes: a folder that hides at once, as one does while its balloon swells, drops the focus
  // as soon as the styles are worked out again)
  const inside = gallery.contains(document.activeElement);
  active = next;
  if (prev !== next) document.querySelectorAll('[data-details].is-open').forEach((p) => setDetails(p, false));
  if (prev !== next) {
    document.querySelectorAll('[data-tall].is-open').forEach((f) => f.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })));
    gallery.classList.remove('is-peeking');
  }
  const focused = next !== null;
  const isBook = next === BOOK;
  gallery.classList.toggle('is-focused', focused);
  gallery.classList.toggle('is-book', isBook);
  gallery.classList.toggle('has-front', focused && !isBook && next < count - 1);
  if (prev !== next) hero?.setCovered(focused);

  cards.forEach((card, k) => {
    const isActive = k === next;
    card.classList.toggle('is-active', isActive);
    card.classList.toggle('is-front', focused && (isBook || k > next));
    card.classList.toggle('is-back', focused && !isBook && k < next);
    card.setAttribute('aria-current', String(isActive));
    card.tabIndex = isActive ? -1 : 0;
    // A closed folder is one Tab stop (the card); its links and frames sit under the other folders, so Tab skips them.
    // Clicks on it still reach the sheet, which opens it.
    card.querySelector('.card-content').inert = !isActive;
    const y = cardY(k, next);
    if (y === null) card.style.removeProperty('--y');
    else card.style.setProperty('--y', y);
  });

  if (book) {
    book.tabIndex = isBook ? -1 : 0;
    book.querySelector('.book-stage').inert = !isBook; // the same for the closed book: its links wait until it opens
    if (prev !== next && isBook) openBook(prev === null);
    else if (prev !== next && prev === BOOK) closeBook();
  }

  const hash = isBook ? '#about' : focused ? `#${cards[next].id}` : '';
  if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname);
  // The homepage sits faded out behind an open folder: Tab must not walk through it, and a keyboard user who opened a
  // card from there carries on inside the folder.
  if (home) {
    const leaving = home.contains(document.activeElement);
    home.inert = focused;
    if (focused && prev !== next && leaving) (isBook ? book : cards[next]).focus({ preventScroll: true });
  }
  if (!focused && inside) {
    // Closing hands the focus back to what opened it (the project on the homepage, or "Wanna know me better?"), so a
    // keyboard user sees where they are.
    const back = prev === BOOK ? document.querySelector('.subheader [data-open-book]') : prev !== null ? document.querySelector(`[data-open-case="${prev}"]`) : null;
    if (back && prev !== next) back.focus({ preventScroll: true });
    else document.activeElement.blur();
  }
}

// Closing the open book folds the cover first, then the stack settles.
function focusGallery(next) {
  if (!gallery) return;
  if (next === null && active === BOOK && book.classList.contains('is-open')) {
    closeBook(() => { if (active === BOOK) setFocus(null); });
    return;
  }
  if (next === null && popBack()) return;
  if (next !== null) setContact(false);
  setFocus(next);
}

// The next-project card: on a screen its title flies up to that folder's tab while the folders move (a View Transition).
// The folders travel as snapshots with their own timing (motion.css); without View Transitions, on a phone or with
// reduced motion, they simply move as always.
function openNext(to, title) {
  if (!document.startViewTransition || reduceMotion.matches || mobile.matches || !title) { focusGallery(to); return; }
  const tab = cards[to].querySelector('.card-tab h2');
  title.style.viewTransitionName = 'case-title';
  // The folder being left keeps its last picture (the card) as it goes; the others show where they are going.
  cards.forEach((c, k) => { c.style.viewTransitionName = k === active ? 'folder-out' : `folder-${c.id}`; });
  const swap = document.startViewTransition(() => {
    title.style.viewTransitionName = '';
    tab.style.viewTransitionName = 'case-title';
    gallery.classList.add('is-swapping');
    focusGallery(to);
  });
  swap.finished.finally(() => {
    tab.style.viewTransitionName = '';
    cards.forEach((c) => { c.style.viewTransitionName = ''; });
    gallery.classList.remove('is-swapping');
  });
}

// ------------------------------------------------------------------ balloon
// A disc opens its project like a balloon (her "sanki bi balon büyüsün patlasın ve sayfaya donuserek case açılsın", then
// "dogal bir balon şişmesi ve patlaması olsun. caselerin bulundugu küçük daireleri merkez al"): the disc blows up from its
// own middle, faster as it goes, stretching a little one way and the other, trembles at its fullest and pops, gone at
// once, its scraps flying out from that middle; the page grows out of the same point. Closing draws the page back into
// that point and the disc blows up again in its place. Everything is a transform or opacity, run by the compositor. (The
// page used to spread as a growing circle; from a disc near the right edge only its left side was ever in view, so it
// looked as if it came in from the left.) With reduced motion the page simply opens and closes.
const tilesEl = document.querySelector('.tiles');
let popped = null; // { k, x, y }: the disc the open page came from, for the way back
let popping = false;

const circle = (r, x, y) => `circle(${r}px at ${x}px ${y}px)`;
const origin = (x, y) => `${x}px ${y}px`;

// The cover's average colour, for the scraps.
function coverColour(img) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r} ${g} ${b})`;
  } catch { return 'var(--primary)'; }
}

// The pop: a ring that rushes out and fades, and a dozen scraps of the balloon flung out from its middle, tumbling and
// dropping a little as they go.
function burst(x, y, r, colour) {
  const pop = document.createElement('div');
  pop.className = 'balloon-pop';
  pop.style.cssText = `left:${x}px;top:${y}px;--c:${colour}`;
  const ring = document.createElement('i');
  ring.className = 'pop-ring';
  ring.style.cssText = `width:${2 * r}px;height:${2 * r}px;margin:${-r}px 0 0 ${-r}px`;
  pop.append(ring);
  const parts = [ring.animate([{ opacity: 0.85, scale: 0.9 }, { opacity: 0, scale: 1.6 }], { duration: 380, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' })];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = ((i + Math.random() * 0.6) / n) * Math.PI * 2;
    const from = r * 0.7;
    const far = r + 40 + Math.random() * 80;
    const turn = (a * 180) / Math.PI + 90;
    const bit = document.createElement('i');
    bit.className = i % 4 === 1 ? 'pop-bit is-accent' : 'pop-bit';
    pop.append(bit);
    parts.push(bit.animate([
      { transform: `translate(${Math.cos(a) * from}px, ${Math.sin(a) * from}px) rotate(${turn}deg) scale(1)`, opacity: 1 },
      { transform: `translate(${Math.cos(a) * far}px, ${Math.sin(a) * far + 30}px) rotate(${turn + 200}deg) scale(.55)`, opacity: 0 },
    ], { duration: 480 + Math.random() * 180, easing: 'cubic-bezier(.12,.75,.35,1)', fill: 'forwards' }));
  }
  document.body.append(pop);
  Promise.all(parts.map((p) => p.finished)).finally(() => pop.remove());
}

async function popOpen(k, link) {
  const shot = link.querySelector('.tile-shot');
  if (reduceMotion.matches || !shot || !gallery || !document.body.animate) { focusGallery(k); return; }
  if (popping) return;
  popping = true;
  const tile = link.closest('.tile');
  const rect = shot.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const r = rect.width / 2;
  // The disc itself is the balloon (a copy laid over it had to decode its picture again, and showed a dark ball until it
  // had). It starts from where it is (a disc under the pointer is already a little larger) and blows up to 1.55 times
  // its size, less near an edge of the window, so the whole balloon stays in view.
  const S = rect.width / shot.offsetWidth || 1;
  const room = Math.min(x, innerWidth - x, y, innerHeight - y) - 6;
  const PEAK = Math.max(1.2, Math.min(1.55, room / r));
  const d = PEAK - 1;
  const at = (sx, sy) => `scale(${S * (1 + sx * d)}, ${S * (1 + (sy ?? sx) * d)})`;
  tile?.classList.add('is-popped');
  tilesEl?.classList.add('is-popping');
  // The blowing up and the page growing take 0.86 s together (her "balon açılışını biraz kısaltabilirsin").
  const swell = shot.animate([
    { transform: at(0) },
    { transform: at(0.2, 0.1), offset: 0.3 },
    { transform: at(0.38, 0.5), offset: 0.55 },
    { transform: at(0.8, 0.7), offset: 0.78 },
    { transform: at(1, 1), offset: 0.9 },
    { transform: at(0.97, 1.02), offset: 0.95 },
    { transform: at(1.03, 0.99) },
  ], { duration: 420, easing: 'cubic-bezier(.45,0,.75,.55)', fill: 'forwards' });
  // The page opens under it, out of sight (clipped to nothing, the homepage left as it is): laying out and fitting a case
  // takes the main thread for 100-200 ms, which the swell (run by the compositor) does not feel (her "biraz kasıyor gibi
  // gozukuyor"). Two frames on, so the swell is already running.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cards[k].style.clipPath = circle(0, x, y);
    gallery.classList.add('is-popping', 'is-inflating');
    focusGallery(k);
    fitFramesToWidth(); // (now, not a frame later, so the page has nothing left to wait for)
  }));
  const done = () => {
    gallery.classList.remove('is-popping', 'is-inflating');
    tilesEl?.classList.remove('is-popping');
    tile?.classList.remove('is-popped');
    shot.getAnimations().forEach((a) => a.cancel());
    popping = false;
  };
  swell.finished.then(() => {
    // (closed again while it swelled, with Escape: the disc settles back)
    if (active !== k) {
      cards[k].style.clipPath = '';
      shot.animate([{ transform: at(1) }, { transform: 'scale(1)' }], { duration: 240, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' })
        .finished.then(done);
      return;
    }
    const cover = shot.querySelector('img');
    burst(x, y, r * PEAK, cover ? coverColour(cover) : 'var(--primary)');
    // A balloon is gone the moment it pops; the homepage starts to go once it is.
    shot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 40, fill: 'forwards' })
      .finished.then(() => gallery.classList.remove('is-inflating'));
    popped = { k, x, y };
    cards[k].style.clipPath = '';
    const grow = cards[k].animate([
      { transformOrigin: origin(x, y), scale: 0.62, opacity: 0 },
      { transformOrigin: origin(x, y), opacity: 1, offset: 0.4 },
      { transformOrigin: origin(x, y), scale: 1, opacity: 1 },
    ], { duration: 440, easing: 'cubic-bezier(.2,.8,.25,1)' });
    grow.finished.finally(done);
  });
}

// The way back: the page shrinks into the disc it came from while the homepage returns behind it, and the disc blows up
// again in its place. Only for a page opened from a disc, while no other project has been opened in between.
function popBack() {
  if (!popped || popped.k !== active || reduceMotion.matches || popping) return false;
  const { k } = popped;
  let { x, y } = popped;
  popped = null;
  popping = true;
  gallery.classList.add('is-shrinking');
  // The disc may have drifted, or the window changed size, since it opened: aim at where it is now.
  const shot = document.querySelector(`[data-open-case="${k}"] .tile-shot`);
  const now = shot?.getBoundingClientRect();
  if (now?.width) ({ x, y } = { x: now.left + now.width / 2, y: now.top + now.height / 2 });
  shot?.animate([{ scale: 0.3, opacity: 0 }, { scale: 1.12, opacity: 1, offset: 0.65 }, { scale: 0.97, offset: 0.85 }, { scale: 1, opacity: 1 }],
    { duration: 460, delay: 180, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
  cards[k].animate([
    { transformOrigin: origin(x, y), scale: 1, opacity: 1 },
    { transformOrigin: origin(x, y), opacity: 1, offset: 0.45 },
    { transformOrigin: origin(x, y), scale: 0.6, opacity: 0 },
  ], { duration: 300, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })
    .finished.then((shrink) => {
      // The page hides at once here (no fade), which drops the focus before setFocus could hand it back, so do it here.
      const back = gallery.contains(document.activeElement) ? document.querySelector(`[data-open-case="${k}"]`) : null;
      gallery.classList.add('is-popping');
      setFocus(null);
      back?.focus({ preventScroll: true });
      gallery.classList.remove('is-shrinking');
      shrink.cancel();
      requestAnimationFrame(() => { gallery.classList.remove('is-popping'); popping = false; });
    });
  return true;
}

let bookTimer = 0;
let afterClose = null;
function openBook(waitForArrival) {
  clearTimeout(bookTimer);
  book.classList.remove('is-closing');
  afterClose = null;
  bookScroll.scrollTop = 0;
  const start = () => {
    if (active !== BOOK) return;
    book.classList.add('is-open');
    requestAnimationFrame(updateTimeline);
  };
  const wait = waitForArrival ? cssMs(root, '--time-cards') : 0;
  if (wait) bookTimer = setTimeout(start, wait + 20);
  else start();
}

function closeBook(done) {
  if (book.classList.contains('is-closing')) { if (done) afterClose = done; return; }
  clearTimeout(bookTimer);
  if (!book.classList.contains('is-open')) { done?.(); return; }
  afterClose = done ?? null;
  book.classList.remove('is-open');
  book.classList.add('is-closing');
  bookTimer = setTimeout(() => {
    book.classList.remove('is-closing');
    const fn = afterClose;
    afterClose = null;
    fn?.();
  }, cssMs(book, '--close-dur') + 40);
}

function workItems(card) {
  return [...card.querySelector('.work').children];
}

// Left and right step through the open case a page at a time (a chart with its caption), landing where the progress stops
// land a page. Left from the middle of a page goes back to its top first.
function stepWork(delta) {
  if (typeof active !== 'number') return false;
  const content = cards[active].querySelector('.card-content');
  const origin = content.getBoundingClientRect().top + parseFloat(getComputedStyle(content).paddingTop) + 7;
  const pages = workItems(cards[active]).filter((item) => !item.previousElementSibling?.classList.contains('chart-cap'));
  const tops = pages.map((item) => item.getBoundingClientRect().top - origin);
  const current = Math.max(0, tops.findLastIndex((t) => t <= 4));
  const to = Math.max(0, Math.min(tops.length - 1, delta > 0 ? current + 1 : tops[current] < -4 ? current : current - 1));
  const top = Math.max(0, Math.min(content.scrollHeight - content.clientHeight, content.scrollTop + tops[to]));
  content.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  return true;
}

function startGallery() {
  if (!gallery) return;
  // Focus moves inside a folder must never scroll the stage itself; the layout is driven by transforms.
  const stage = gallery.querySelector('.gallery-stage');
  stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; });
  cards.forEach((card, k) => {
    card.querySelector('.card-tab h2').addEventListener('click', () => { if (active !== k) focusGallery(k); });
    card.querySelector('.card-sheet').addEventListener('click', () => { if (active !== k) focusGallery(k); });
    // The card at the end of a case opens the next folder from its first page. It stops here, or the sheet's own click
    // would bring this folder back.
    card.querySelectorAll('[data-next]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const to = cards.findIndex((c) => c.id === a.dataset.next);
      if (to < 0) return;
      cards[to].querySelector('.card-content').scrollTop = 0;
      openNext(to, a.querySelector('h3'));
    }));
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card && active !== k) { e.preventDefault(); focusGallery(k); }
    });
  });

  book?.addEventListener('click', () => { if (active !== BOOK) focusGallery(BOOK); });
  book?.addEventListener('keydown', (e) => {
    if (active !== BOOK && e.target === book && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); focusGallery(BOOK); }
  });
  document.querySelectorAll('[data-open-book]').forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); focusGallery(BOOK); }),
  );
  // The discs on the homepage open their projects, as a balloon that pops.
  document.querySelectorAll('[data-open-case]').forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); popOpen(Number(a.dataset.openCase), a); }),
  );
  gallery.querySelector('[data-dismiss]').addEventListener('click', () => focusGallery(null));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (openDetails()) { e.preventDefault(); setDetails(openDetails(), false); return; }
      if (active !== null) { e.preventDefault(); focusGallery(null); }
      else if (contactOpen()) setContact(false);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // A box that scrolls sideways (a wide chart) and a text field keep these arrows for themselves.
      if (document.activeElement?.closest('figure.pmx.is-wide, input, select, textarea, [contenteditable]:not([contenteditable="false"])')) return;
      if (stepWork(e.key === 'ArrowRight' ? 1 : -1)) e.preventDefault();
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    if (active === null && !gallery.contains(document.activeElement)) return;
    // An open case reads downward, so there up and down scroll it: the browser does that while the focus is inside the
    // page; from the folder itself (where opening it leaves the focus) or a progress stop, this does.
    if (typeof active === 'number') {
      const content = cards[active].querySelector('.card-content');
      if (content.contains(document.activeElement)) return;
      e.preventDefault();
      content.scrollBy({ top: e.key === 'ArrowDown' ? 80 : -80, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      return;
    }
    e.preventDefault();
    // Up walks toward the back of the pile and finally the book; down comes forward.
    if (e.key === 'ArrowUp') {
      if (active === BOOK) return;
      if (active === null) focusGallery(count - 1);
      else if (active === 0) focusGallery(BOOK);
      else focusGallery(active - 1);
    } else if (active === null || active === BOOK) focusGallery(0);
    else focusGallery(Math.min(count - 1, active + 1));
  });

  const relayout = () => { measureGallery(); setFocus(active); };
  addEventListener('resize', relayout);
  mobile.addEventListener('change', relayout);
  new ResizeObserver(relayout).observe(header);
  measureGallery();
}

// ---------------------------------------------------------- drag to scroll
// With a mouse, click and drag moves a chart wider than the column sideways, like a swipe on the phone. Links, buttons and
// a live screen keep their own clicks, and the click that ends a drag does nothing.
function startDragScroll() {
  const own = 'a, button, input, select, textarea, iframe, .is-live';
  document.querySelectorAll('.work figure.pmx').forEach((fig) => {
    let drag = null;
    let dragged = false;
    fig.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !fig.classList.contains('is-wide') || !fig.closest('.card.is-active')) return;
      if (e.target.closest(own)) return;
      drag = { id: e.pointerId, x: e.clientX, left: fig.scrollLeft, moved: false };
    });
    fig.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        fig.setPointerCapture(e.pointerId);
        fig.classList.add('is-dragging');
        getSelection()?.removeAllRanges();
      }
      fig.scrollLeft = drag.left - dx;
    });
    const end = () => {
      if (!drag) return;
      if (drag.moved) {
        fig.classList.remove('is-dragging');
        dragged = true;
        setTimeout(() => { dragged = false; }, 0);
      }
      drag = null;
    };
    fig.addEventListener('pointerup', end);
    fig.addEventListener('pointercancel', end);
    fig.addEventListener('scroll', () => fig.classList.toggle('at-end', fig.scrollLeft >= fig.scrollWidth - fig.clientWidth - 2), { passive: true });
    fig.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    // Images would otherwise start the browser's own drag and drop.
    fig.addEventListener('dragstart', (e) => { if (fig.classList.contains('is-wide')) e.preventDefault(); });
  });
}

// ------------------------------------------------------------ tall boards
// Hovering a tall board opens it down to the bottom of the folder and pans the screens to their end.
function startTallBoards() {
  document.querySelectorAll('[data-tall]').forEach((fig) => {
    const shots = fig.querySelector('.board-shots');
    const wins = [...shots.querySelectorAll('.screen-window')];
    const imgs = wins.map((w) => w.querySelector('img'));
    const pans = imgs.map(() => 0);
    let travels = imgs.map(() => 0);
    const setPan = (i, px, ms) => {
      pans[i] = px;
      imgs[i].style.setProperty('--pan-dur', `${reduceMotion.matches ? 0 : ms}ms`);
      imgs[i].style.setProperty('--pan', `${-px}px`);
    };
    const measure = () => {
      const winH = shots.getBoundingClientRect().height;
      travels = imgs.map((img) => Math.max(0, img.getBoundingClientRect().height - winH));
    };
    const open = () => {
      if (!fig.closest('.card.is-active') || fig.classList.contains('is-open')) return;
      const content = fig.closest('.card-content');
      // The tabs of the folders in front slide out of view, so the board can open to the bottom edge.
      gallery.classList.add('is-peeking');
      const limit = content.getBoundingClientRect().bottom - 12;
      const figRect = fig.getBoundingClientRect();
      const grow = Math.max(0, limit - figRect.bottom);
      const winH = shots.getBoundingClientRect().height + grow;
      fig.style.height = `${figRect.height + grow}px`;
      fig.classList.add('is-open');
      shots.style.setProperty('--win-h', `${winH}px`);
      travels = imgs.map((img) => Math.max(0, img.getBoundingClientRect().height - winH));
    };
    const close = () => {
      if (!fig.classList.contains('is-open')) return;
      imgs.forEach((_, i) => setPan(i, 0, 600));
      shots.style.removeProperty('--win-h');
      fig.style.removeProperty('height');
      fig.classList.remove('is-open');
      gallery.classList.remove('is-peeking');
    };
    // The wheel scrolls the screen under the pointer, like scrolling on the phone. A gesture that
    // reaches the end of a screen stops there; a fresh gesture at the end moves the folder sideways.
    let lastScreenWheel = 0;
    wins.forEach((win, i) => {
      win.addEventListener('wheel', (e) => {
        if (!fig.closest('.card.is-active')) return;
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        if (!fig.classList.contains('is-open')) open();
        if (!travels[i]) measure();
        const next = Math.min(travels[i], Math.max(0, pans[i] + e.deltaY));
        const now = e.timeStamp;
        if (next === pans[i]) {
          if (now - lastScreenWheel < 400) { e.preventDefault(); e.stopPropagation(); lastScreenWheel = now; }
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        lastScreenWheel = now;
        setPan(i, next, 90);
      }, { passive: false });
    });
    // Keyboard and touch have no wheel over a screen, so every screen scrolls to its end.
    const revealAll = () => imgs.forEach((_, i) => setPan(i, travels[i], Math.min(4200, Math.max(900, travels[i] * 3.2))));
    fig.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(); });
    fig.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') close(); });
    fig.addEventListener('focus', () => { if (fig.matches(':focus-visible')) { open(); revealAll(); } });
    fig.addEventListener('blur', close);
    // Touch: tap toggles.
    fig.addEventListener('click', (e) => {
      if (e.pointerType === 'mouse') return;
      if (fig.classList.contains('is-open')) close();
      else { open(); revealAll(); }
    });
  });
}

// ------------------------------------------------------- scrolling screens
// A wheel over a phone screen scrolls that screen (with a mouse it does so on hover, site.css; on a touch screen after a
// tap). Once it reaches an end, the rest of that gesture stops there and a fresh one moves the case again.
const hoverScroll = matchMedia('(hover: hover) and (pointer: fine)');
function startScrollScreens() {
  document.querySelectorAll('.device-scroll, .beat-shot, .pm-pmid, .pm-wsc, .pm-wmid, .pm-bscroll').forEach((win) => {
    let last = 0;
    win.addEventListener('wheel', (e) => {
      if (!win.closest('.card.is-active') || win.closest('.card-content.is-moving')) return;
      if (!win.classList.contains('is-live') && !hoverScroll.matches) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = win.scrollHeight - win.clientHeight;
      const canScroll = (e.deltaY > 0 && win.scrollTop < max - 0.5) || (e.deltaY < 0 && win.scrollTop > 0.5);
      if (canScroll) { last = e.timeStamp; win.dataset.moved = '1'; e.stopPropagation(); return; }
      if (e.timeStamp - last < 400) { e.preventDefault(); e.stopPropagation(); last = e.timeStamp; }
    }, { passive: false });
  });
  // A long screen can open part way down (data-start = share of its height), until someone scrolls it.
  const startAt = new ResizeObserver((entries) => entries.forEach(({ target: win }) => {
    if (!win.dataset.moved && win.scrollHeight) win.scrollTop = win.scrollHeight * win.dataset.start;
  }));
  document.querySelectorAll('.pm-pmid[data-start]').forEach((win) => {
    startAt.observe(win);
    win.addEventListener('scroll', () => { if (win.classList.contains('is-live')) win.dataset.moved = '1'; }, { passive: true });
  });
}

// --------------------------------------------------------- "See more" panel
function setDetails(panel, open) {
  if (!panel) return;
  panel.classList.toggle('is-open', open);
  panel.setAttribute('aria-hidden', String(!open));
  const opener = panel.closest('[data-card]').querySelector('[data-details-open]');
  opener?.setAttribute('aria-expanded', String(open));
  if (open) panel.querySelector('[data-details-close]').focus({ preventScroll: true });
  else if (panel.contains(document.activeElement)) opener?.focus({ preventScroll: true });
}
const openDetails = () => document.querySelector('[data-details].is-open');

function startDetails() {
  document.querySelectorAll('[data-details-open]').forEach((btn) => {
    const panel = btn.closest('[data-card]').querySelector('[data-details]');
    btn.addEventListener('click', (e) => { e.stopPropagation(); setDetails(panel, !panel.classList.contains('is-open')); });
  });
  document.querySelectorAll('[data-details-close]').forEach((btn) =>
    btn.addEventListener('click', (e) => { e.stopPropagation(); setDetails(btn.closest('[data-details]'), false); }),
  );
}

// -------------------------------------------------- before / after slider
function startCompare() {
  document.querySelectorAll('[data-compare]').forEach((box) => {
    const knob = box.querySelector('.compare-knob');
    const set = (pct) => {
      pct = Math.min(100, Math.max(0, pct));
      box.style.setProperty('--pos', `${pct}%`);
      knob.setAttribute('aria-valuenow', String(Math.round(pct)));
    };
    const fromEvent = (e) => {
      const r = box.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    box.addEventListener('pointerdown', (e) => {
      if (!box.closest('.card.is-active')) return;
      e.stopPropagation();
      box.setPointerCapture(e.pointerId);
      fromEvent(e);
      const up = () => {
        box.removeEventListener('pointermove', fromEvent);
        box.removeEventListener('pointerup', up);
        box.removeEventListener('pointercancel', up);
      };
      box.addEventListener('pointermove', fromEvent);
      box.addEventListener('pointerup', up);
      box.addEventListener('pointercancel', up);
    });
    knob.addEventListener('keydown', (e) => {
      const now = Number(knob.getAttribute('aria-valuenow'));
      const map = { ArrowLeft: now - 5, ArrowRight: now + 5, Home: 0, End: 100 };
      if (!(e.key in map)) return;
      e.preventDefault();
      e.stopPropagation();
      set(map[e.key]);
    });
  });
}

// ---------------------------------------------------------- book timeline
// Month dashes swell near the middle of the page; the current role rolls past on a drum.
let updateTimeline = () => {};
function startTimeline() {
  const tl = document.querySelector('[data-timeline]');
  if (!tl || !bookScroll) return;
  const dashRoot = tl.querySelector('[data-dashes]');
  const yearItems = [...tl.querySelectorAll('.timeline-years li')];
  const jobItems = [...tl.querySelectorAll('.timeline-job')];
  const spans = jobItems.map((j) => Math.max(1, Number(j.dataset.years) || 1));
  const starts = spans.map((_, i) => spans.slice(0, i).reduce((a, b) => a + b, 0));
  const months = yearItems.length * 12;
  for (let i = 0; i < months; i++) {
    const dash = document.createElement('div');
    dash.className = 'timeline-dash';
    dash.appendChild(document.createElement('span'));
    dashRoot.appendChild(dash);
  }
  const marks = [...dashRoot.querySelectorAll('span')];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

  function jobAt(month) {
    const year = month / 12;
    const last = jobItems.length - 1;
    for (let i = 0; i <= last; i++) {
      const end = i === last ? yearItems.length : starts[i] + spans[i];
      if (year < end || i === last) {
        if (i < last && year > end - 0.35) return i + smooth((year - (end - 0.35)) / 0.35);
        return i;
      }
    }
    return last;
  }

  function styleJob(item, offset) {
    const abs = Math.abs(offset);
    item.style.visibility = abs > 2.55 ? 'hidden' : 'visible';
    const [company, title] = item.children;
    company.style.opacity = String(clamp(Math.exp(-abs * 1.05), 0.04, 1));
    title.style.opacity = String(clamp(Math.exp(-abs * 0.78), 0.06, 1));
    if (reduceMotion.matches) {
      item.style.transform = `translateY(calc(-50% + ${offset * 98}px))`;
      return;
    }
    item.style.transform = `translateY(calc(-50% + ${offset * 24}px)) rotateX(${offset * -20}deg) translateZ(200px)`;
    company.style.transform = `translateY(${offset * -3}px) rotateX(${offset * -5}deg)`;
    title.style.transform = `translateY(${offset * -1}px) rotateX(${offset * -3}deg)`;
  }

  updateTimeline = () => {
    const pane = bookScroll.getBoundingClientRect();
    const center = pane.top + pane.height / 2;
    const slot = marks[0].parentElement.offsetHeight || 32;
    const first = marks[0].parentElement.getBoundingClientRect().top + slot / 2;
    const month = clamp((center - first) / slot, 0, months - 1);
    const range = slot * 4.5;
    marks.forEach((mark, i) => {
      const p = clamp(1 - Math.abs(first + i * slot - center) / range, 0, 1) ** 2;
      mark.style.transform = `scaleX(${1 + p * 0.875}) scaleY(${1 + p * 0.5})`;
    });
    const year = clamp(Math.floor(month / 12), 0, yearItems.length - 1);
    yearItems.forEach((li, i) => li.classList.toggle('is-current', i === year));
    const job = jobAt(month);
    jobItems.forEach((item, i) => styleJob(item, i - job));
  };

  let frame = 0;
  const request = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; updateTimeline(); }); };
  bookScroll.addEventListener('scroll', request, { passive: true });
  new ResizeObserver(request).observe(bookScroll);
  updateTimeline();
}

// -------------------------------------------------------------------- intro
function playIntro() {
  if (!root.classList.contains('is-intro')) return;
  const finish = () => {
    root.classList.remove('is-intro', 'is-intro-play', 'is-intro-chrome');
    document.querySelector('.hero')?.style.removeProperty('--intro-y');
  };
  const heroEl = document.querySelector('.hero');
  const ready = Promise.all([
    document.fonts.ready,
    ...[...document.querySelectorAll('.tile img')].map((img) => img.decode().catch(() => {})),
  ]);
  const timeout = new Promise((r) => setTimeout(r, 3000));
  // Never leave the page blank: a hidden tab gets no animation frames, so finish on a timer regardless.
  const safety = setTimeout(finish, 5000);
  Promise.race([ready, timeout]).then(() => {
    measureGallery();
    const r = heroEl.getBoundingClientRect();
    heroEl.style.setProperty('--intro-y', `${innerHeight / 2 - (r.top + r.height / 2)}px`);
    setTimeout(() => {
      root.classList.add('is-intro-play');
      const lastCard = cssMs(root, '--intro-start') + Math.max(0, count - 1) * cssMs(root, '--intro-stagger') + cssMs(root, '--intro-card');
      const chromeAt = Math.max(0, cssMs(root, '--intro-hero') - 80);
      setTimeout(() => root.classList.add('is-intro-chrome'), chromeAt);
      setTimeout(() => { clearTimeout(safety); finish(); }, Math.max(lastCard, chromeAt + cssMs(root, '--intro-chrome')) + 40);
    }, 32);
  });
}

// "How I work with AI" (screens only; on a phone and a tablet the band is on the page): the homepage does not scroll on a
// screen, so the band moves into a panel while it is open and goes back in place when it closes. The panel hands the
// focus back to the link itself.
function startAi() {
  const band = document.getElementById('ai');
  const dialog = document.querySelector('[data-ai-dialog]');
  const link = document.querySelector('[data-to-ai]');
  if (!band || !dialog?.showModal || !link) return;
  const home = band.parentElement;
  const after = band.nextSibling;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    dialog.append(band);
    dialog.showModal();
  });
  dialog.querySelector('[data-ai-close]').addEventListener('click', () => dialog.close());
  // A click on the dimmed page around the panel closes it too.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => home.insertBefore(band, after));
}

startClock();
hero = startHero();

// Phone: the folder list (and "Selected work" above it) starts below the intro text, however far the text runs on a
// short screen (site.css, --list-top).
const subText = document.querySelector('.subheader p');
const markSubBottom = () => {
  if (subText && !root.querySelector('.gallery.is-focused')) root.style.setProperty('--sub-bottom', `${Math.round(subText.getBoundingClientRect().bottom + scrollY)}px`);
};
if (subText) new ResizeObserver(markSubBottom).observe(subText);
addEventListener('resize', markSubBottom);
document.fonts.ready.then(markSubBottom);
markSubBottom();
startContact();
startAi();
startGallery();
startDragScroll();
startCompare();
startTallBoards();
startScrollScreens();
startDetails();
startTimeline();
playIntro();

// Deep links: /#ikeep opens that folder, /#about opens the book.
const linked = location.hash.slice(1);
if (linked) {
  const k = cards.findIndex((c) => c.id === linked);
  const target = linked === 'about' ? BOOK : k >= 0 ? k : null;
  if (target !== null) setTimeout(() => focusGallery(target), root.classList.contains('is-intro') ? 1400 : 0);
}


// ------------------------------------------------------- PlayMate pages
// Write a class or a style value only when it changes. Setting the same value again still reports a change to the observers
// below, and on a phone that re-fitted the open folder every frame until Safari closed the tab.
const setVar = (el, name, v) => { if (el.style.getPropertyValue(name) !== v) el.style.setProperty(name, v); };
const addClass = (el, c) => { if (!el.classList.contains(c)) el.classList.add(c); };

// An embedded page (the Figma prototype) must not be zoomed with the rest, or it lays itself out at the wrong size: undo
// the zoom on the frame and give it the zoomed size instead.
function zoomFrames(page, z) {
  page.querySelectorAll('iframe[data-w]').forEach((f) => {
    if (f.style.zoom === String(1 / z) && f.style.width === `${f.dataset.w * z}px`) return;
    f.style.zoom = String(1 / z);
    f.style.width = `${f.dataset.w * z}px`;
    f.style.height = `${f.dataset.h * z}px`;
  });
}

// Chengel prototype: the button on the page flips the prototype between light and dark.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-chengel-theme]');
  if (!btn) return;
  const frame = btn.closest('.pmf')?.querySelector('iframe');
  const win = frame?.contentWindow;
  const toggle = win?.document.getElementById('themebtn')?.querySelector('button');
  if (!toggle) return;
  toggle.click();
  const label = win.document.querySelector('#themebtn button')?.textContent.trim() || '';
  btn.textContent = /^Light/.test(label) ? 'Switch to light' : 'Switch to dark';
});


// A case is one long page. Pages led by text (first page, problem, numbers, loop, screens, outcome …) reflow into one
// column at reading size (site.css, .is-reflow). The rest is scaled to the column's width (never below 70%); a frame still
// wider than the column, like a chart, scrolls sideways inside its own box.
const reflowPages = '.pm-f-hero, .pm-f-problem, .pm-f-stats, .pm-f-cycle, .pm-f-result, .pm-f-final, .pm-f-board, .pm-f-comp2, .pm-f-proto, .pm-f-outcome, .pm-f-getit, .pm-ch, '
  + '.pm-f-plan, .pm-f-people, .pm-f-synth, .pm-f-empathy, .pm-f-lofi, .pm-f-ut, .pm-f-board2, .pm-f-cmp, .pm-f-ba, .pm-f-dec';
const chartPages = '.pm-f-iat, .pm-f-fm, .pm-f-wide, .pm-f-pers';
const reflowCases = '#healthbar, #ikeep, #chengel, #playmate';
// Phone and tablet: a row you swipe sideways (screens, before and after, the store screenshots) gets a dot per item under
// it and a "Swipe →" cue that goes once the row has moved, so it is clear there is more to the right. (A screen wraps the
// row instead and hides the dots, site.css.)
function addSwipeDots(page) {
  page.querySelectorAll('.pm-rrow, .pm-prow, .pm-wrow, .pm-cpp, .pm-ba, .pm-shots').forEach((row) => {
    if (row.dataset.dots) return;
    const items = [...row.children].filter((el) => !el.matches('.pm-ar, i'));
    if (items.length < 2) return;
    row.dataset.dots = '1';
    const dots = document.createElement('div');
    dots.className = 'swipe-dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = `${items.map(() => '<i></i>').join('')}<span>Swipe →</span>`;
    row.after(dots);
    dots.hidden = true; // (until the row is measured; on a screen, where rows wrap, it stays so without a write)
    const marks = [...dots.querySelectorAll('i')];
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      if (dots.hidden !== max < 4) dots.hidden = max < 4;
      const k = max > 0 ? Math.round((row.scrollLeft / max) * (items.length - 1)) : 0;
      marks.forEach((m, i) => m.classList.toggle('on', i === k));
      if (row.scrollLeft > 8) addClass(dots, 'moved');
    };
    row.addEventListener('scroll', update, { passive: true });
    // (the observer's first call measures the row once it is laid out; measuring here, between writes, forced a layout for
    // every row as a folder opened)
    new ResizeObserver(update).observe(row);
  });
}
// A page's width at zoom 1, measured once (it is a fixed-size board), so a refit has nothing to re-measure. (offsetWidth:
// a closed folder is tilted, which bends its boxes on screen.)
let naturalWidths = new WeakMap();
function naturalWidth(page) {
  if (!naturalWidths.has(page)) {
    setVar(page, '--pmz', '1');
    const w = page.offsetWidth || page.scrollWidth;
    if (!w) return 0;
    naturalWidths.set(page, w);
  }
  return naturalWidths.get(page);
}
// The charts' widths, all at zoom 1 first and then read in one go, so the page is laid out once for all of them.
function measureCharts() {
  const pages = [...document.querySelectorAll('.work figure.pmx.is-chart > .pmf')];
  naturalWidths = new WeakMap();
  pages.forEach((page) => setVar(page, '--pmz', '1'));
  pages.forEach((page) => naturalWidth(page));
}
// A frame wider than its box scrolls sideways: it is then a Tab stop, so the arrow keys can scroll it, and it is told when
// it has been scrolled to its end (its right edge fades until then, site.css; startDragScroll).
function setWide(fig, on) {
  if (on === fig.classList.contains('is-wide')) return;
  fig.classList.toggle('is-wide', on);
  fig.classList.remove('at-end');
  if (on) fig.tabIndex = 0;
  else fig.removeAttribute('tabindex');
}
// What each page is never changes, so it is decided once for every case, before any opens: reflowed into the column, a
// chart with its caption above it, the overview or the next-project card. (The classes only take effect in an open folder,
// site.css. Deciding them as a folder opened laid the whole case out twice, once before and once after.)
function prepareFrames() {
  document.querySelectorAll('.work figure.pmx').forEach((fig) => {
    const page = fig.firstElementChild;
    if (!page) return;
    if (page.classList.contains('pm-f-sum')) { addClass(fig, 'is-sum'); return; }
    if (page.classList.contains('pm-f-next')) { addClass(fig, 'is-next'); return; }
    if (!fig.closest(reflowCases)) return;
    // A chart keeps its drawing and scrolls sideways if it must, a little larger than the rest; its title moves out above
    // it at reading size.
    const wideBoard = page.matches('.pm-f-board') && parseFloat(page.querySelector('img.pm-bimg')?.style.width) > 900;
    if (page.matches(chartPages) || wideBoard) {
      addClass(fig, 'is-chart');
      const cap = document.createElement('div');
      cap.className = 'chart-cap';
      const num = page.querySelector('.pm-big')?.textContent.trim();
      cap.innerHTML = `${num ? `<span>${num}</span>` : ''}<div><small></small><h3></h3></div>`;
      cap.querySelector('small').textContent = page.querySelector('.pm-lab')?.textContent.trim() ?? '';
      cap.querySelector('h3').textContent = page.querySelector('h2')?.textContent.trim() ?? '';
      // a link in the hidden header (Chengel's View in Figma) comes along
      page.querySelectorAll('.pm-bh a[href]').forEach((a) => {
        const link = document.createElement('a');
        link.href = a.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = a.textContent;
        cap.querySelector('div').append(link);
      });
      fig.before(cap);
      return;
    }
    if (page.matches(reflowPages)) {
      // The loop's numbers and texts sit absolutely on the designed page, so their order there does not matter; reflowed
      // they become a list, so each number goes right before its text.
      page.querySelectorAll('.pm-cwrap').forEach((wrap) => {
        const nds = [...wrap.querySelectorAll(':scope > .pm-nd')];
        const nts = [...wrap.querySelectorAll(':scope > .pm-nt')];
        if (nds.length === nts.length && nds.some((nd, i) => nd.nextElementSibling !== nts[i])) nds.forEach((nd, i) => wrap.append(nd, nts[i]));
      });
      addClass(fig, 'is-reflow');
      addSwipeDots(page);
      zoomFrames(page, 1);
    }
  });
}
// In the open folder a chart is scaled to its box (on a screen wider than the column, site.css), down to 0.72 when that
// shows the whole chart. One that does not fit even then scrolls sideways: at 0.8 on a phone or a tablet, at full size
// where the case reads as on a screen (from 940px), where shrinking it only made its text smaller (8.5px on PlayMate's
// journey map) without sparing the scroll. A page that is none of the kinds above is scaled to the column (never below
// 70%). Everything is measured first and written after, so the case is laid out once.
function fitFramesToWidth() {
  document.querySelectorAll('.card.is-active .work').forEach((work) => {
    const figs = [...work.querySelectorAll('figure.pmx:not(.is-reflow, .is-sum, .is-next)')];
    if (!figs.length) return;
    const pad = getComputedStyle(work);
    const avail = work.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
    if (avail <= 0) return;
    const fits = figs.map((fig) => {
      const page = fig.firstElementChild;
      const box = getComputedStyle(fig);
      const room = fig.classList.contains('is-chart') ? fig.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight) : avail;
      return { fig, page, room, w: page ? naturalWidth(page) : 0 };
    });
    fits.forEach(({ fig, page, room, w }) => {
      if (!w) return;
      if (fig.classList.contains('is-chart')) {
        const s = room / w >= 0.72 ? Math.min(1, room / w) : caseScreen.matches ? 1 : 0.8;
        setVar(page, '--pmz', String(s));
        setWide(fig, w * s > room + 4);
        return;
      }
      const s = Math.min(1, Math.max(0.7, room / w));
      setVar(fig, '--pm-h', `${700 * s}px`);
      setVar(page, '--pmz', String(s));
      zoomFrames(page, s);
      setWide(fig, w * s > room + 4);
    });
  });
}
prepareFrames();
measureCharts();
window.addEventListener('resize', fitFramesToWidth);
// Fit again when a folder opens. Only the cards themselves are watched: the fitting changes classes inside them.
document.querySelectorAll('[data-card]').forEach((card) => {
  new MutationObserver(() => requestAnimationFrame(fitFramesToWidth)).observe(card, { attributes: true, attributeFilter: ['class'] });
});
// Pictures can widen a board, so the charts are measured again once they have loaded.
window.addEventListener('load', () => { measureCharts(); fitFramesToWidth(); });
fitFramesToWidth();

// ------------------------------------------------------- reading progress
// A thin line along the top of the open case: how far down you have read. Above it Start and End, on it a dot for every
// page after the first; on a wide screen these are a list of the case's pages beside the column (site.css). Each one is a
// button that scrolls there.
function startProgress() {
  document.querySelectorAll('[data-card]').forEach((card) => {
    const content = card.querySelector('.card-content');
    const bar = card.querySelector('.read-progress');
    if (!content || !bar) return;

    const nav = document.createElement('div');
    nav.className = 'read-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Pages in this case');
    bar.after(nav);
    const work = content.querySelector('.work');
    const maxOf = () => Math.max(content.scrollHeight - content.clientHeight, 0);
    let stops = [];
    const targets = () => {
      const figs = [...content.querySelectorAll('figure.pmx')];
      // A page lands just under the top padding (the band of the progress row), with its chart caption if it has one.
      // Measured from the layout, not the screen, so nothing that moves the folder as it opens (the column sliding up from
      // where it rested, the page growing out of its disc) counts.
      const gap = parseFloat(getComputedStyle(content).paddingTop) + 7;
      const at = (fig) => {
        let top = 0;
        for (let el = fig.previousElementSibling?.classList.contains('chart-cap') ? fig.previousElementSibling : fig; el && el !== content; el = el.offsetParent) top += el.offsetTop;
        return top - gap;
      };
      const list = [{ label: 'Start', name: figs[0]?.getAttribute('aria-label') || '', top: 0, kind: 'start' }];
      figs.forEach((fig, k) => {
        if (k === 0) return;
        const n = fig.querySelector('.pm-hd > .pm-big, .pm-bhn > .pm-big, .pm-ph > .pm-big')?.textContent.trim();
        const num = n && /^\d+$/.test(n);
        list.push({ label: num ? n : '', name: fig.getAttribute('aria-label') || '', top: at(fig), kind: num ? 'num' : 'dot' });
      });
      list.push({ label: 'End', name: '', top: Infinity, kind: 'end' });
      return list;
    };
    // Pictures that load on the way down can move a page after the scroll has set off: each time the scroll stops where
    // it was aimed, it aims again (up to three times), so it lands on the page.
    const land = (i, tries = 3) => {
      const top = Math.max(0, Math.min(targets()[i].top, maxOf()));
      if (tries < 3 && Math.abs(top - content.scrollTop) <= 2) return;
      content.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      if (!tries) return;
      let still = 0;
      const settle = () => {
        clearTimeout(still);
        still = setTimeout(() => {
          content.removeEventListener('scroll', settle);
          if (Math.abs(content.scrollTop - top) <= 2) land(i, tries - 1);
        }, 160);
      };
      content.addEventListener('scroll', settle, { passive: true });
    };
    const place = () => {
      const t = targets();
      if (nav.children.length !== t.length) {
        nav.textContent = '';
        t.forEach((x, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `read-stop ${x.kind}`;
          // Start and End say so; a page's dot shows its name only in the list on a wide screen.
          const add = (cls, text) => { const span = document.createElement('span'); span.className = cls; span.textContent = text; b.append(span); };
          if (x.kind === 'start' || x.kind === 'end') add('read-label', x.label);
          if (x.name) add('read-name', x.name);
          b.setAttribute('aria-label', x.kind === 'num' ? `Go to step ${x.label}: ${x.name}` : x.kind === 'dot' ? `Go to ${x.name}`
            : x.kind === 'start' ? `Go to the start: ${x.name}` : 'Go to the end');
          b.addEventListener('click', () => land(i));
          nav.append(b);
        });
      }
      stops = t;
    };
    const update = () => {
      const max = maxOf();
      const pos = content.scrollTop;
      if (!(max > 0 && stops.length)) { setVar(bar, '--p', '0'); return; }
      let cur = 0;
      stops.forEach((x, i) => { if (Math.min(x.top, max) <= pos + 40) cur = i; });
      // How far through page i the reader is, 0 to 1. Nothing counts as read at the very start.
      const read = (i) => {
        const from = Math.min(stops[i].top, max);
        const to = Math.min(stops[i + 1]?.top ?? max, max);
        return Math.max(0, Math.min(1, (pos + Math.min(40, pos) - from) / Math.max(1, to - from)));
      };
      const stopsEls = [...nav.children];
      // A page's dot goes from faint to solid as the reader moves through that page. At the very end the last page stays
      // marked too (the list on a wide screen has no End).
      stopsEls.forEach((b, i) => {
        b.classList.toggle('is-on', i === cur || (stops[cur].kind === 'end' && i === cur - 1));
        if (stops[i].kind !== 'end') setVar(b, '--a', (0.2 + 0.8 * read(i)).toFixed(2));
      });
      // The page you are on is also said, not only shown in colour; a list taller than a short window scrolls itself so it
      // stays in view.
      const on = stopsEls[stops[cur].kind === 'end' ? cur - 1 : cur];
      stopsEls.forEach((b) => { if (b === on) { if (b.getAttribute('aria-current') !== 'location') b.setAttribute('aria-current', 'location'); } else if (b.hasAttribute('aria-current')) b.removeAttribute('aria-current'); });
      if (on && nav.scrollHeight > nav.clientHeight + 1 && (on.offsetTop < nav.scrollTop || on.offsetTop + on.offsetHeight > nav.scrollTop + nav.clientHeight)) {
        nav.scrollTop = on.offsetTop - nav.clientHeight / 2;
      }
      // The line has no track: it grows from dot to dot, reaching a page's dot as that page begins.
      const w = nav.clientWidth;
      const at = (i) => (i >= stops.length - 1 ? w : i === 0 ? 0 : stopsEls[i].offsetLeft + stopsEls[i].offsetWidth / 2);
      const x = cur >= stops.length - 1 ? w : at(cur) + read(cur) * (at(cur + 1) - at(cur));
      setVar(bar, '--p', w > 0 ? Math.max(0, Math.min(1, x / w)).toFixed(4) : '0');
    };
    content.addEventListener('scroll', update, { passive: true });
    // The list beside the column is not inside the page it lists, so a wheel over it would scroll nothing: it scrolls the
    // page, unless the list itself is taller than the window and can go that way.
    nav.addEventListener('wheel', (e) => {
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? content.clientHeight : 1);
      if (!dy || (dy > 0 ? nav.scrollTop < nav.scrollHeight - nav.clientHeight - 1 : nav.scrollTop > 0)) return;
      e.preventDefault();
      content.scrollTop += dy;
    }, { passive: false });
    // (the page grows as its pictures load, which moves the stops further down; and once the folder has turned upright
    // as it opens, everything is measured again)
    const resized = new ResizeObserver(() => { place(); update(); });
    resized.observe(content);
    resized.observe(work);
    card.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'transform' && (e.target === card || e.target === work) && card.classList.contains('is-active')) { place(); update(); }
    });
    new MutationObserver(() => { place(); update(); }).observe(content, { subtree: true, attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', () => { place(); update(); });
    place();
    update();
  });
}
startProgress();

// ------------------------------------------------------- moving past screens
// While the case scrolls, a prototype it carries under the pointer lets the wheel through (site.css, .is-moving), so a
// gesture never stops halfway over one; scrolling also lets go of a screen or a prototype that was clicked. The Chengel
// prototype is a page of this site: the wheel over it scrolls the case unless its own screen can scroll that way. PlayMate's
// is Figma's page, which this page cannot reach into, so it takes the pointer only after a click, like a phone screen.
function passWheel(frame, content) {
  const hook = () => {
    const win = frame.contentWindow;
    if (!win || win.passesWheel) return;
    win.passesWheel = true;
    win.addEventListener('wheel', (e) => {
      if (!frame.closest('.card.is-active') || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const d = e.deltaY;
      const room = (el, s) => (!s || /auto|scroll/.test(s.overflowY)) && (d > 0 ? el.scrollTop < el.scrollHeight - el.clientHeight - 1 : el.scrollTop > 0);
      for (let el = e.target; el?.nodeType === 1; el = el.parentElement) if (room(el, win.getComputedStyle(el))) return;
      const page = win.document.scrollingElement;
      if (page && room(page)) return;
      e.preventDefault();
      content.scrollTop += d;
    }, { passive: false });
  };
  frame.addEventListener('load', hook);
  hook();
}
function startStripMotion() {
  cards.forEach((card) => {
    const content = card.querySelector('.card-content');
    let timer = 0;
    content.addEventListener('scroll', () => {
      if (!content.classList.contains('is-moving')) {
        content.classList.add('is-moving');
        content.querySelectorAll('.is-live, .proto-gate.is-on').forEach((el) => el.classList.remove('is-live', 'is-on'));
      }
      clearTimeout(timer);
      timer = setTimeout(() => content.classList.remove('is-moving'), 300);
    }, { passive: true });
  });
  document.querySelectorAll('.work iframe').forEach((frame) => {
    const content = frame.closest('.card-content');
    if (!content) return;
    if (new URL(frame.src, location.href).origin === location.origin) { passWheel(frame, content); return; }
    const box = frame.parentElement;
    box.classList.add('proto-gate');
    box.addEventListener('click', () => addClass(box, 'is-on'));
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) box.classList.remove('is-on'); });
  });
}
startStripMotion();

// ------------------------------------------------------------ pointer tag
// With a mouse, a small tag beside the pointer says what a press does: "Open" over a closed folder, "Drag" over a chart
// wider than the column until the reader has moved one. The pointer itself stays as it is.
function startPointerTag() {
  if (!gallery || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const tag = document.createElement('div');
  tag.className = 'pointer-tag';
  tag.setAttribute('aria-hidden', 'true');
  document.body.append(tag);
  let moved = false;
  let label = '';
  document.querySelectorAll('.work figure.pmx').forEach((fig) => fig.addEventListener('scroll', () => {
    if (fig.scrollLeft > 120) moved = true;
  }, { passive: true }));
  const own = 'a, button, input, select, textarea, iframe, .is-live, .pm-pmid, .pm-wsc, .pm-wmid, .pm-bscroll, .device-scroll';
  const show = (next) => {
    if (next === label) return;
    label = next;
    if (next) tag.textContent = next;
    tag.classList.toggle('is-on', !!next);
  };
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target;
    const card = t.closest?.('[data-card]');
    let next = '';
    if (card && !card.classList.contains('is-active') && t.closest('.card-tab h2, .card-sheet')) next = 'Open';
    else if (book && active !== BOOK && t.closest?.('[data-book]')) next = 'Open';
    else if (card?.classList.contains('is-active') && !moved && t.closest('figure.pmx.is-wide') && !t.closest(own)) next = 'Drag';
    show(next);
    if (next) tag.style.transform = `translate3d(${e.clientX + 14}px, ${e.clientY + 18}px, 0)`;
  }, { passive: true });
  root.addEventListener('mouseleave', () => show(''));
  // A click opens or closes something under the pointer: drop the tag until the pointer moves again.
  document.addEventListener('pointerdown', () => show(''), { passive: true });
}

// ------------------------------------------------------ prototype hint
// Chengel's prototype: once its page is in view a small tag says it can be played (it comes in with the reveals below); the
// first tap or key inside the prototype sends it away.
function startProtoHint() {
  document.querySelectorAll('#chengel .pm-proto-live, #playmate .pm-proto-live').forEach((live) => {
    const frame = live.querySelector('iframe');
    if (!frame) return;
    const tip = document.createElement('span');
    tip.className = 'proto-tip';
    tip.textContent = 'Try it here';
    tip.setAttribute('aria-hidden', 'true');
    (live.querySelector('.pm-phone') || live.parentElement).append(tip); // PlayMate's box clips, so its tip sits on the wrap
    const gone = () => addClass(tip, 'is-gone');
    // PlayMate's prototype opens with a click on it (startStripMotion); Chengel's is reached inside.
    live.addEventListener('click', gone, { once: true });
    const listen = () => {
      try {
        frame.contentWindow.addEventListener('pointerdown', gone, { once: true });
        frame.contentWindow.addEventListener('keydown', gone, { once: true });
      } catch { /* not reachable */ }
    };
    if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.URL !== 'about:blank') listen();
    frame.addEventListener('load', listen);
  });
}

// ---------------------------------------------------------------- reveals
// A few pages build up the first time they come into view in the open folder (motion.css): the steps of a decision, the
// test rounds, an A/B pair, HealthBar's numbers, the line under iKeep's result. A group can be taller than the screen, so
// each item starts as it scrolls in. With reduced motion nothing is ever hidden.
const revealItems = '.pm-dec-s, .pm-dec-ph, .pm-ut-r, .pm-stv, .mo-mark, .proto-tip';

// "8 of 13" counts up from 0; "4 → 8 of 9" and "13s → 4s" run from the first number to the second. The page's own text is
// where it ends, so without the script, or with reduced motion, the numbers simply stand.
function countUp(el) {
  const m = el.textContent.match(/^(\d+)(s?\s*→\s*)(\d+)(.*)$/) || el.textContent.match(/^()()(\d+)(\s.*)$/);
  if (!m) return;
  const from = m[1] ? +m[1] : 0;
  const to = +m[3];
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / 900);
    el.textContent = `${m[1]}${m[2]}${Math.round(from + (to - from) * (1 - (1 - p) ** 3))}${m[4]}`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function startReveals() {
  // The result that gets a line under it (the line itself stays with reduced motion; only its opening is skipped).
  document.querySelectorAll('#ikeep .pmf strong').forEach((el) => { if (el.textContent.trim() === '52% more views') addClass(el, 'mo-mark'); });
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  addClass(root, 'has-reveals');
  const reveal = (el) => {
    if (el.classList.contains('is-seen')) return;
    el.classList.add('is-seen');
    if (el.matches('.pm-stv')) countUp(el);
  };
  cards.forEach((card) => {
    const content = card.querySelector('.card-content');
    const all = [...content.querySelectorAll(revealItems)];
    let io = null;
    // Watch only while the folder is open: a closed folder's pages are not being read.
    const watch = () => {
      const open = card.classList.contains('is-active');
      if (open === !!io) return;
      io?.disconnect();
      io = null;
      if (!open) return;
      io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        // Everything before it shows too: a jump (a progress stop) can carry the reader past items they never saw.
        all.slice(0, all.indexOf(e.target) + 1).forEach(reveal);
        io.unobserve(e.target);
      }), { root: content, rootMargin: '0px 0px -12% 0px' });
      all.forEach((el) => { if (!el.classList.contains('is-seen')) io.observe(el); });
    };
    new MutationObserver(watch).observe(card, { attributes: true, attributeFilter: ['class'] });
    watch();
  });
}
startPointerTag();
startProtoHint();
startReveals();

// ----------------------------------------------------------------- videos
// A video plays only while it is on screen in the open folder; eight of them would otherwise run behind the stack. Until
// its first frame is ready it shows a dark box, and a picture that arrives late comes up from dark (motion.css).
function startVideos() {
  const onScreen = new WeakMap();
  const sync = (v) => {
    const go = onScreen.get(v) && v.closest('[data-card]').classList.contains('is-active');
    if (go && v.paused) v.play().catch(() => {});
    else if (!go && !v.paused) v.pause();
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { onScreen.set(e.target, e.isIntersecting); sync(e.target); }));
  cards.forEach((card) => {
    const vids = [...card.querySelectorAll('video')];
    vids.forEach((v) => {
      if (v.autoplay) { v.autoplay = false; v.preload = 'auto'; }
      if (v.readyState < 2) v.addEventListener('loadeddata', () => addClass(v, 'is-loaded'), { once: true });
      io.observe(v);
    });
    new MutationObserver(() => vids.forEach(sync)).observe(card, { attributes: true, attributeFilter: ['class'] });
  });
}
startVideos();


// A screen inside a frame scrolls under the mouse (site.css). While the pointer rests on one that has more to show and has
// not been scrolled yet, a yellow tag in its middle says so (her "sarı renkli ve daha büyük yap ekranın ortasında olsun ve
// dikkat çeksin"). On a touch screen a tap lets a screen scroll, until the case moves; no frame marks it.
const liveScreens = '.pm-pmid, .pm-wsc, .pm-wmid, .pm-bscroll, .device-scroll';
const scrollable = (el) => el.scrollHeight - el.clientHeight > 4;
const hint = document.createElement('div');
hint.className = 'scroll-hint';
hint.setAttribute('aria-hidden', 'true');
hint.innerHTML = 'Scroll <i>↓</i>';
document.body.append(hint);
const hideHint = () => hint.classList.remove('is-on');
document.addEventListener('click', (e) => {
  if (hoverScroll.matches) return;
  const hit = e.target.closest?.(liveScreens);
  document.querySelectorAll('.is-live').forEach((el) => { if (el !== hit) el.classList.remove('is-live'); });
  if (hit) hit.classList.add('is-live');
});
document.addEventListener('mouseover', (e) => {
  const hit = e.target.closest?.(liveScreens);
  if (!hit || hit.dataset.moved || !scrollable(hit) || !hit.closest('.card.is-active') || hit.closest('.card-content.is-moving')) { hideHint(); return; }
  // the middle of the part of the screen that is in view
  const r = hit.getBoundingClientRect();
  hint.style.left = `${r.left + r.width / 2}px`;
  hint.style.top = `${(Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2}px`;
  hint.classList.add('is-on');
});
// (on the way down: a screen that scrolls keeps its wheel to itself)
document.addEventListener('wheel', hideHint, { passive: true, capture: true });
