const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');

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
    const text = mobile.matches ? ['I design', 'things'] : ['I design things'];
    const cssW = wrap.clientWidth;
    ctx.font = font(100);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking * 100}px`;
    const m = text.map((t) => ctx.measureText(t));
    const inkW = Math.max(...m.map((x) => x.actualBoundingBoxLeft + x.actualBoundingBoxRight));
    const size = (100 * cssW) / inkW;
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
}

function startContact() {
  if (!contact) return;
  const measure = () => contact.style.setProperty('--btn-w', `${Math.ceil(contactToggle.offsetWidth)}px`);
  measure();
  document.fonts.ready.then(measure);
  contactToggle.addEventListener('click', (e) => { e.stopPropagation(); setContact(!contactOpen()); });
  document.addEventListener('pointerdown', (e) => { if (contactOpen() && !contact.contains(e.target)) setContact(false); });
  contact.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const box = btn.closest('.email');
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        box.classList.add('copied');
        setTimeout(() => box.classList.remove('copied'), 1000);
      } catch { /* clipboard unavailable */ }
    });
  });
}

// ------------------------------------------------------------------ gallery
// Cards are ordered back (index 0, top of the pile) to front. `active` is a card
// index, BOOK for the about book, or null for the resting stack.
const BOOK = 'book';
const gallery = document.querySelector('[data-gallery]');
const header = document.querySelector('header');
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
    const y = cardY(k, next);
    if (y === null) card.style.removeProperty('--y');
    else card.style.setProperty('--y', y);
    if (!isActive || prev !== next) card.querySelector('.card-content').scrollLeft = 0;
  });

  if (book) {
    book.tabIndex = isBook ? -1 : 0;
    if (prev !== next && isBook) openBook(prev === null);
    else if (prev !== next && prev === BOOK) closeBook();
  }

  const hash = isBook ? '#about' : focused ? `#${cards[next].id}` : '';
  if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname);
  if (!focused && gallery.contains(document.activeElement)) document.activeElement.blur();
}

// Closing the open book folds the cover first, then the stack settles.
function focusGallery(next) {
  if (!gallery) return;
  if (next === null && active === BOOK && book.classList.contains('is-open')) {
    closeBook(() => { if (active === BOOK) setFocus(null); });
    return;
  }
  if (next !== null) setContact(false);
  setFocus(next);
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

function stepWork(delta) {
  if (typeof active !== 'number') return false;
  const content = cards[active].querySelector('.card-content');
  const items = workItems(cards[active]);
  const origin = content.getBoundingClientRect().left;
  let current = 0;
  let best = Infinity;
  items.forEach((item, i) => {
    const d = Math.abs(item.getBoundingClientRect().left - origin - 20);
    if (d < best) { best = d; current = i; }
  });
  const next = items[Math.max(0, Math.min(items.length - 1, current + delta))];
  const max = content.scrollWidth - content.clientWidth;
  const left = Math.max(0, Math.min(max, next.offsetLeft - parseFloat(getComputedStyle(next.parentElement).paddingLeft)));
  content.scrollTo({ left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
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
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card && active !== k) { e.preventDefault(); focusGallery(k); }
    });
    const content = card.querySelector('.card-content');
    content.addEventListener('wheel', (e) => {
      if (active !== k) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (content.scrollWidth <= content.clientWidth) return;
      e.preventDefault();
      content.scrollLeft += e.deltaY;
    }, { passive: false });
  });

  book?.addEventListener('click', () => { if (active !== BOOK) focusGallery(BOOK); });
  book?.addEventListener('keydown', (e) => {
    if (active !== BOOK && e.target === book && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); focusGallery(BOOK); }
  });
  document.querySelectorAll('[data-open-book]').forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); focusGallery(BOOK); }),
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
      if (stepWork(e.key === 'ArrowRight' ? 1 : -1)) e.preventDefault();
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    if (active === null && !gallery.contains(document.activeElement)) return;
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
// With a mouse, click and drag moves the open folder sideways, like a swipe on the phone. Links, buttons, the
// before/after slider and a live screen keep their own clicks, and the click that ends a drag does nothing.
function startDragScroll() {
  const own = 'a, button, input, select, textarea, iframe, [data-compare], .is-live';
  cards.forEach((card) => {
    const content = card.querySelector('.card-content');
    let drag = null;
    let dragged = false;
    content.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || mobile.matches || !card.classList.contains('is-active')) return;
      if (e.target.closest(own) || content.scrollWidth <= content.clientWidth) return;
      drag = { id: e.pointerId, x: e.clientX, left: content.scrollLeft, moved: false };
    });
    content.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        content.setPointerCapture(e.pointerId);
        content.classList.add('is-dragging');
        getSelection()?.removeAllRanges();
      }
      content.scrollLeft = drag.left - dx;
    });
    const end = () => {
      if (!drag) return;
      if (drag.moved) {
        content.classList.remove('is-dragging');
        dragged = true;
        setTimeout(() => { dragged = false; }, 0);
      }
      drag = null;
    };
    content.addEventListener('pointerup', end);
    content.addEventListener('pointercancel', end);
    content.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    // Images would otherwise start the browser's own drag and drop.
    content.addEventListener('dragstart', (e) => { if (card.classList.contains('is-active')) e.preventDefault(); });
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
// A wheel over a phone scrolls that screen. Once it reaches an end, a fresh gesture moves the folder sideways again.
function startScrollScreens() {
  document.querySelectorAll('.device-scroll, .beat-shot, .pm-pmid, .pm-wmid, .pm-bscroll').forEach((win) => {
    let last = 0;
    win.addEventListener('wheel', (e) => {
      if (!win.closest('.card.is-active') || !win.classList.contains('is-live')) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = win.scrollHeight - win.clientHeight;
      const canScroll = (e.deltaY > 0 && win.scrollTop < max - 0.5) || (e.deltaY < 0 && win.scrollTop > 0.5);
      if (canScroll) { last = e.timeStamp; e.stopPropagation(); return; }
      if (e.timeStamp - last < 400) { e.preventDefault(); e.stopPropagation(); last = e.timeStamp; }
    }, { passive: false });
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
  // Scrolling inside the panel should not drive the sideways strip.
  document.querySelectorAll('[data-details]').forEach((panel) => panel.addEventListener('wheel', (e) => e.stopPropagation()));
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
    ...cards.map((c) => c.querySelector('.work img')).filter(Boolean).map((img) => img.decode().catch(() => {})),
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

// The finished pages in src/content/playmate-frames are designed 700px tall; scale each to the strip's frame height.
function fitPlaymateFrames() {
  const fit = (target) => {
    const page = target.firstElementChild;
    if (!page || target.clientHeight <= 0) return;
    // On a phone a reflowed page (and the overview page) is laid out at reading size, never zoomed.
    if (mobile.matches && target.matches('.is-reflow, .is-sum, .is-chart')) return;
    let z = target.clientHeight / 700;
    // A chart (information architecture, user flow) is read whole, so on a laptop it also fits the screen width, if
    // that takes no more than 15% off. The whole folder shrinks with it, so every page keeps the same height.
    const work = target.closest('.work');
    if (!mobile.matches && work && innerWidth > 1024) {  // tablets get their own layout (responsive step 2)
      const avail = target.closest('.card-content').clientWidth - 2 * parseFloat(getComputedStyle(work).paddingLeft);
      let zc = z;
      work.querySelectorAll(':scope > figure.pmx > .pm-f-iat, :scope > figure.pmx > .pm-f-fm').forEach((chart) => {
        const w = parseFloat(chart.style.width);
        if (w) zc = Math.min(zc, avail / w);
      });
      z = Math.max(z * 0.85, zc);
    }
    setVar(page, '--pmz', String(z));
    // An embedded page (the Figma prototype) must not be zoomed with the rest, or it lays itself out at the wrong size:
    // undo the zoom on the frame and give it the zoomed size instead.
    page.querySelectorAll('iframe[data-w]').forEach((f) => {
      f.style.zoom = String(1 / z);
      f.style.width = `${f.dataset.w * z}px`;
      f.style.height = `${f.dataset.h * z}px`;
    });
  };
  const ro = new ResizeObserver((entries) => entries.forEach(({ target }) => fit(target)));
  document.querySelectorAll('figure.pmx').forEach((fig) => ro.observe(fig));
  // A narrower window leaves the frame height alone, so the pages are fitted again on resize.
  addEventListener('resize', () => document.querySelectorAll('figure.pmx').forEach(fit));
}
fitPlaymateFrames();

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


// Phone: a folder opens as one long page. Pages led by text (first page, problem, numbers, loop, screens, outcome …)
// reflow into one column at reading size (site.css, .is-reflow). The rest is scaled to the screen width (never below 70%);
// a frame still wider than the screen, like a chart, scrolls sideways inside its own box.
const reflowPages = '.pm-f-hero, .pm-f-problem, .pm-f-stats, .pm-f-cycle, .pm-f-result, .pm-f-final, .pm-f-board, .pm-f-comp2, .pm-f-proto, .pm-f-outcome, .pm-f-getit, .pm-ch, '
  + '.pm-f-plan, .pm-f-people, .pm-f-synth, .pm-f-empathy, .pm-f-lofi, .pm-f-ut, .pm-f-board2, .pm-f-cmp, .pm-f-ba, .pm-f-dec';
const chartPages = '.pm-f-iat, .pm-f-fm, .pm-f-wide, .pm-f-pers';
const reflowCases = '#healthbar, #ikeep, #chengel, #playmate';
// Phone: a row you swipe sideways (screens, before and after, the store screenshots) gets a dot per item under it and a
// "Swipe →" cue that goes once the row has moved, so it is clear there is more to the right.
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
    const marks = [...dots.querySelectorAll('i')];
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      dots.hidden = max < 4;
      const k = max > 0 ? Math.round((row.scrollLeft / max) * (items.length - 1)) : 0;
      marks.forEach((m, i) => m.classList.toggle('on', i === k));
      if (row.scrollLeft > 8) addClass(dots, 'moved');
    };
    row.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(row);
    update();
  });
}
// A page's width at zoom 1, measured once (it is a fixed-size board), so a refit has nothing to re-measure.
let naturalWidths = new WeakMap();
function naturalWidth(page) {
  if (!naturalWidths.has(page)) {
    setVar(page, '--pmz', '1');
    const w = page.getBoundingClientRect().width || page.scrollWidth;
    if (!w) return 0;
    naturalWidths.set(page, w);
  }
  return naturalWidths.get(page);
}
function fitFramesToWidth() {
  if (!mobile.matches) {
    document.querySelectorAll('figure.pmx.is-reflow, figure.pmx.is-chart').forEach((fig) => fig.classList.remove('is-reflow', 'is-chart'));
    return;
  }
  document.querySelectorAll('.card.is-active .card-content').forEach((content) => {
    const avail = content.clientWidth - 24;
    if (avail <= 0) return;
    content.querySelectorAll('figure.pmx').forEach((fig) => {
      const page = fig.firstElementChild;
      if (!page) return;
      if (page.classList.contains('pm-f-sum')) { addClass(fig, 'is-sum'); setVar(page, '--pmz', '1'); return; }
      // A chart keeps its drawing and scrolls sideways, a little larger than the rest; its title moves out above it at reading size.
      const wideBoard = page.matches('.pm-f-board') && parseFloat(page.querySelector('img.pm-bimg')?.style.width) > 900;
      if (fig.closest(reflowCases) && (page.matches(chartPages) || wideBoard)) {
        addClass(fig, 'is-chart');
        if (!fig.previousElementSibling?.classList.contains('chart-cap')) {
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
        }
        const w = naturalWidth(page);
        if (!w) return;
        const s = Math.min(1, Math.max(0.8, avail / w));
        setVar(page, '--pmz', String(s));
        fig.classList.toggle('is-wide', w * s > avail + 4);
        return;
      }
      if (fig.closest(reflowCases) && page.matches(reflowPages)) {
        // The loop's numbers and texts sit absolutely on a desktop, so their order there does not matter; on a phone
        // they become a list, so each number goes right before its text.
        page.querySelectorAll('.pm-cwrap').forEach((wrap) => {
          const nds = [...wrap.querySelectorAll(':scope > .pm-nd')];
          const nts = [...wrap.querySelectorAll(':scope > .pm-nt')];
          if (nds.length === nts.length && nds.some((nd, i) => nd.nextElementSibling !== nts[i])) nds.forEach((nd, i) => wrap.append(nd, nts[i]));
        });
        addClass(fig, 'is-reflow');
        addSwipeDots(page);
        fig.classList.toggle('is-wide', false);
        fig.style.removeProperty('--pm-h');
        setVar(page, '--pmz', '1');
        return;
      }
      const w = naturalWidth(page);
      if (!w) return;
      const s = Math.min(1, Math.max(0.7, avail / w));
      setVar(fig, '--pm-h', `${700 * s}px`);
      setVar(page, '--pmz', String(s));
      fig.classList.toggle('is-wide', w * s > avail + 4);
    });
  });
}
mobile.addEventListener('change', fitFramesToWidth);
window.addEventListener('resize', fitFramesToWidth);
// Fit again when a folder opens. Only the cards themselves are watched: the fitting changes classes inside them.
document.querySelectorAll('[data-card]').forEach((card) => {
  new MutationObserver(() => requestAnimationFrame(fitFramesToWidth)).observe(card, { attributes: true, attributeFilter: ['class'] });
});
window.addEventListener('load', () => { naturalWidths = new WeakMap(); fitFramesToWidth(); });
fitFramesToWidth();

// ------------------------------------------------------- reading progress
// A thin bar along the top of the open folder: how far through the case you have scrolled.
// Under it: Start, the numbered research steps and End. Each one is a button that scrolls there.
function startProgress() {
  document.querySelectorAll('[data-card]').forEach((card) => {
    const content = card.querySelector('.card-content');
    const bar = card.querySelector('.read-progress');
    if (!content || !bar) return;

    const nav = document.createElement('div');
    nav.className = 'read-nav';
    bar.after(nav);
    // On a phone the folder is one long page (scrolls down); on a screen it is a strip (scrolls sideways).
    const vert = () => mobile.matches;
    const maxOf = () => Math.max(vert() ? content.scrollHeight - content.clientHeight : content.scrollWidth - content.clientWidth, 0);
    const posOf = () => (vert() ? content.scrollTop : content.scrollLeft);
    let stops = [];
    const targets = () => {
      const figs = [...content.querySelectorAll('figure.pmx')];
      const cr = content.getBoundingClientRect();
      const at = (el) => { const r = el.getBoundingClientRect(); return vert() ? r.top - cr.top + content.scrollTop : r.left - cr.left + content.scrollLeft; };
      const first = figs.length ? at(figs[0]) : 0;
      const gap = vert() ? 56 : 0;
      const list = [{ label: 'Start', left: 0, kind: 'start' }];
      figs.forEach((fig) => {
        const n = fig.querySelector('.pm-hd > .pm-big, .pm-bhn > .pm-big, .pm-ph > .pm-big');
        if (n && /^\d+$/.test(n.textContent.trim())) list.push({ label: n.textContent.trim(), left: at(fig) - (vert() ? gap : first), kind: 'num' });
      });
      list.push({ label: 'End', left: Infinity, kind: 'end' });
      return list;
    };
    const place = () => {
      const max = maxOf();
      const t = targets();
      if (nav.children.length !== t.length) {
        nav.textContent = '';
        t.forEach((x, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = x.label;
          b.className = `read-stop ${x.kind}`;
          b.setAttribute('aria-label', x.kind === 'num' ? `Go to step ${x.label}` : `Go to the ${x.label.toLowerCase()}`);
          b.addEventListener('click', () => {
            const to = Math.max(0, Math.min(targets()[i].left, maxOf()));
            content.scrollTo(vert() ? { top: to, behavior: 'smooth' } : { left: to, behavior: 'smooth' });
          });
          nav.append(b);
        });
      }
      stops = t;
      if (vert()) { [...nav.children].forEach((b) => { b.style.left = ''; }); return; }
      // Where each stop sits along the bar, nudged apart so neighbouring labels never overlap.
      const w = nav.clientWidth;
      const px = t.map((x) => (max > 0 ? (Math.min(x.left, max) / max) * w : 0));
      const gap = (i) => (i === 1 ? 44 : 26);
      for (let i = 1; i < px.length - 1; i++) px[i] = Math.max(px[i], px[i - 1] + gap(i));
      for (let i = px.length - 2; i >= 1; i--) px[i] = Math.min(px[i], px[i + 1] - (i === px.length - 2 ? 44 : 26));
      t.forEach((x, i) => { nav.children[i].style.left = `${px[i]}px`; });
    };
    let last = -1;
    const update = () => {
      const max = maxOf();
      bar.style.setProperty('--p', max > 0 ? String(posOf() / max) : '0');
      if (max > 0 && stops.length) {
        let cur = 0;
        stops.forEach((x, i) => { if (Math.min(x.left, max) <= posOf() + 40) cur = i; });
        [...nav.children].forEach((b, i) => b.classList.toggle('is-on', i === cur));
        if (vert() && cur !== last) nav.scrollTo({ left: Math.max(0, nav.children[cur].offsetLeft - 40), behavior: 'smooth' });
        last = cur;
      }
    };
    content.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(() => { place(); update(); }).observe(content);
    new MutationObserver(() => { place(); update(); }).observe(content, { subtree: true, attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', () => { place(); update(); });
    place();
    update();
  });
}
startProgress();


// A screen inside a frame only scrolls after you click (or tap) it, and a yellow outline shows it is live. Until then the wheel
// (or a swipe) moves the folder. Click outside to let go. On a mouse, a small hint says so while you hover a scrollable screen.
const liveScreens = '.pm-pmid, .pm-wsc, .pm-wmid, .pm-bscroll, .device-scroll';
const scrollable = (el) => el.scrollHeight - el.clientHeight > 4;
const hint = document.createElement('div');
hint.className = 'scroll-hint';
hint.textContent = 'Click to scroll';
document.body.append(hint);
const hideHint = () => hint.classList.remove('is-on');
document.addEventListener('click', (e) => {
  const hit = e.target.closest?.(liveScreens);
  document.querySelectorAll('.is-live').forEach((el) => { if (el !== hit) el.classList.remove('is-live'); });
  if (hit) { hit.classList.add('is-live'); hideHint(); }
});
document.addEventListener('mouseover', (e) => {
  const hit = e.target.closest?.(liveScreens);
  if (!hit || hit.classList.contains('is-live') || !scrollable(hit) || !hit.closest('.card.is-active')) { hideHint(); return; }
  const r = hit.getBoundingClientRect();
  hint.style.left = `${r.left + r.width / 2}px`;
  hint.style.top = `${Math.max(r.top, 0) + 10}px`;
  hint.classList.add('is-on');
});
document.addEventListener('wheel', hideHint, { passive: true });
