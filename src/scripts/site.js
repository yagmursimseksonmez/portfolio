// ------------------------------------------------------------------ clock
function initClock() {
  const el = document.querySelector('[data-clock]');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
}

// ------------------------------------------------------------ hero mural
// Scale the mural so its widest line spans the content column exactly.
function initMural() {
  const el = document.querySelector('[data-mural]');
  if (!el) return;
  const fit = () => {
    el.style.fontSize = '';
    const lines = [...el.querySelectorAll('.mural__line')];
    const stacked = getComputedStyle(lines[0]).display === 'block';
    const range = document.createRange();
    let widest = 0;
    for (const target of stacked ? lines : [el]) {
      range.selectNodeContents(target);
      widest = Math.max(widest, range.getBoundingClientRect().width);
    }
    if (!widest) return;
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${(size * el.clientWidth) / widest}px`;
  };
  document.fonts.ready.then(fit);
  new ResizeObserver(fit).observe(el.parentElement);
}

// ----------------------------------------------------- before/after slider
function initCompare() {
  document.querySelectorAll('[data-compare]').forEach((box) => {
    const knob = box.querySelector('.compare__knob');
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
      box.setPointerCapture(e.pointerId);
      fromEvent(e);
      const move = (ev) => fromEvent(ev);
      const up = () => {
        box.removeEventListener('pointermove', move);
        box.removeEventListener('pointerup', up);
        box.removeEventListener('pointercancel', up);
      };
      box.addEventListener('pointermove', move);
      box.addEventListener('pointerup', up);
      box.addEventListener('pointercancel', up);
    });
    knob.addEventListener('keydown', (e) => {
      const now = Number(knob.getAttribute('aria-valuenow'));
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') set(now - step);
      else if (e.key === 'ArrowRight') set(now + step);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else return;
      e.preventDefault();
    });
  });
}

initClock();
initMural();
initCompare();
