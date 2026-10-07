const finePointer = () => !window.matchMedia('(hover: none)').matches;

// ---------------------------------------------------------------- theme
function initTheme() {
  const toggle = document.querySelector('[role="switch"][aria-label$="theme on"]');
  if (!toggle) return;
  const track = toggle.querySelector('span');
  const knob = track.querySelector('span');
  const label = [...toggle.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);

  const render = (theme) => {
    const dark = theme === 'dark';
    toggle.setAttribute('aria-checked', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Dark theme on' : 'Light theme on');
    track.classList.toggle('bg-primary/20', dark);
    track.classList.toggle('bg-transparent', !dark);
    knob.classList.toggle('left-[calc(100%-1rem)]', dark);
    knob.classList.toggle('left-1', !dark);
    if (label) label.textContent = dark ? 'DARK' : 'LIGHT';
  };

  render(document.documentElement.dataset.theme);
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('portfolio-theme', next); } catch (e) {}
    render(next);
  });
}

// ------------------------------------------------- sidebar nav + scroll spy
function initNav() {
  const buttons = [...document.querySelectorAll('[data-nav]')];
  if (!buttons.length) return;
  const setActive = (id) => {
    buttons.forEach((btn) => {
      const on = btn.dataset.nav === id;
      btn.classList.toggle('text-primary', on);
      btn.classList.toggle('text-muted-foreground', !on);
      const line = btn.querySelector('span');
      line.classList.toggle('w-10', on);
      line.classList.toggle('w-4', !on);
      line.classList.toggle('group-hover:w-10', !on);
    });
  };
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      setActive(btn.dataset.nav);
      document.getElementById(btn.dataset.nav)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );
  const sections = buttons.map((b) => document.getElementById(b.dataset.nav)).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (top) setActive(top.target.id);
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  sections.forEach((s) => io.observe(s));
}

// ------------------------------------------------------------ sidebar cursor
const HAND =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35))"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';

function makeDot(id, css) {
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = css;
  document.body.appendChild(el);
  return el;
}

function initAsideCursor() {
  const aside = document.querySelector('aside');
  if (!aside) return;
  const css =
    'position:fixed;top:0;left:0;width:18px;height:18px;background:var(--primary);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width 0.18s ease,height 0.18s ease;';
  const get = () => document.getElementById('aside-cursor') || makeDot('aside-cursor', css);

  aside.addEventListener('mouseenter', () => { if (finePointer()) get(); });
  aside.addEventListener('mouseleave', () => document.getElementById('aside-cursor')?.remove());
  aside.addEventListener('mousemove', (e) => {
    if (!finePointer()) return;
    const dot = get();
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    const hand = e.target.closest('[data-cursor-hand]');
    const ring = e.target.closest('button, a, input, textarea, [data-cursor-ring]');
    if (hand) {
      if (dot.dataset.hand !== '1') { dot.dataset.hand = '1'; dot.innerHTML = HAND; }
      Object.assign(dot.style, { width: '32px', height: '32px', background: 'transparent', border: 'none' });
    } else {
      if (dot.dataset.hand) { dot.dataset.hand = ''; dot.innerHTML = ''; }
      if (ring) Object.assign(dot.style, { width: '44px', height: '44px', background: 'transparent', border: '2px solid var(--primary)' });
      else Object.assign(dot.style, { width: '18px', height: '18px', background: 'var(--primary)', border: 'none' });
    }
  });
}

// --------------------------------------------------- project cards hover pill
function initProjectPill() {
  const pill = document.getElementById('project-pill');
  const grid = document.querySelector('#projects [data-project-card]')?.parentElement;
  if (!pill || !grid) return;
  const data = JSON.parse(pill.dataset.projects);
  const inner = pill.querySelector('.project-cursor-pill');
  const title = pill.querySelector('[data-pill-title]');
  const tagline = pill.querySelector('[data-pill-tagline]');
  let slug = null;
  let timer;

  grid.addEventListener('mousemove', (e) => {
    if (!finePointer()) return;
    pill.style.display = 'block';
    pill.style.left = e.clientX + 18 + 'px';
    pill.style.top = e.clientY + 18 + 'px';
    const next = e.target.closest('[data-project-card]')?.dataset.slug ?? null;
    if (next === slug) return;
    slug = next;
    clearTimeout(timer);
    inner.classList.remove('is-active');
    if (next && data[next]) {
      title.textContent = data[next].title;
      tagline.textContent = data[next].tagline;
      timer = setTimeout(() => inner.classList.add('is-active'), 30);
    } else {
      pill.style.display = 'none';
    }
  });
  grid.addEventListener('mouseleave', () => {
    slug = null;
    inner.classList.remove('is-active');
    pill.style.display = 'none';
  });
}

// ------------------------------------------------------------------ marquee
function initMarquee() {
  const track = document.querySelector('[data-marquee-track]');
  const wrap = track?.parentElement;
  if (!wrap) return;
  wrap.addEventListener('mouseenter', () => {
    if (!finePointer()) return;
    makeDot(
      'carousel-cursor',
      'position:fixed;top:0;left:0;width:22px;height:22px;background:#F26B5E;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform 0.1s ease-out;',
    );
    track.style.animationPlayState = 'paused';
  });
  wrap.addEventListener('mousemove', (e) => {
    const dot = document.getElementById('carousel-cursor');
    if (dot) { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }
  });
  wrap.addEventListener('mouseleave', () => {
    document.getElementById('carousel-cursor')?.remove();
    track.style.animationPlayState = 'running';
  });
}

// ------------------------------------------------------------------- go up
function initGoUp() {
  document.querySelectorAll('[data-go-up]').forEach((btn) =>
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })),
  );
}

// ------------------------------------------------- password-protected study
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function decryptBundle(bundle, password) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(bundle.salt), iterations: bundle.iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(bundle.iv) }, key, b64(bundle.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

function renderUnlocked(payload) {
  const urls = {};
  for (const [name, img] of Object.entries(payload.images)) {
    urls[name] = URL.createObjectURL(new Blob([b64(img.data)], { type: img.type }));
  }
  const root = document.querySelector('[data-crypto-root]');
  const html = payload.html.replace(/src="\/images\/crypto\/([^"]+)"/g, (m, n) => (urls[n] ? `src="${urls[n]}"` : m));
  root.outerHTML = html;
  window.scrollTo(0, 0);
}

function initCryptoGate() {
  const form = document.querySelector('[data-crypto-form]');
  if (!form) return;
  const input = form.querySelector('input');
  const error = form.querySelector('[data-crypto-error]');
  const button = form.querySelector('button');
  let bundlePromise;
  const loadBundle = () => (bundlePromise ??= fetch('/crypto.enc.json').then((r) => r.json()));

  async function attempt(password) {
    const payload = await decryptBundle(await loadBundle(), password);
    try { sessionStorage.setItem('crypto-pw', password); } catch (e) {}
    renderUnlocked(payload);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    button.disabled = true;
    try {
      await attempt(input.value);
    } catch (err) {
      error.hidden = false;
      button.disabled = false;
      input.select();
    }
  });

  try {
    const saved = sessionStorage.getItem('crypto-pw');
    if (saved) attempt(saved).catch(() => sessionStorage.removeItem('crypto-pw'));
  } catch (e) {}
}

initTheme();
initNav();
initAsideCursor();
initProjectPill();
initMarquee();
initGoUp();
initCryptoGate();
