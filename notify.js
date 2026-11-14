/* =========================================================
   notify.js — in-app pop-up notifications (NOT system/PWA notifications)
   API:  OSNotify.push({ icon, img, title, body, key, onTap, count })
         OSNotify.clear(key)     OSNotify.clearAll()
   - same key  -> updates the existing pop-up in place (shows a ×N counter)
   - hidden tab -> held back and shown (merged per key) when you return
   - swipe sideways / up to dismiss, tap to open, hold to pause the timer
   ========================================================= */
(() => {
  if (window.OSNotify) return;
  const MAX = 3, LIFE = 6500;
  const live = new Map();      // key -> entry (visible)
  const held = new Map();      // key -> options (arrived while the page was hidden)
  let wrap = null, seq = 0;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeImg = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) ? s : '';

  function ensureWrap() {
    if (wrap && wrap.isConnected) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'ntf-wrap';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);
    return wrap;
  }

  function paint(en) {
    const o = en.o, img = safeImg(o.img);
    en.el.innerHTML =
      `<span class="ntf-ic${img ? ' has-img' : ''}">${img ? `<img src="${img}" alt="">` : esc(o.icon || '🔔')}</span>` +
      `<span class="ntf-tx"><b>${esc(o.title)}${en.count > 1 ? `<em class="ntf-cnt">${en.count > 99 ? '99+' : en.count}</em>` : ''}</b>` +
      `<i>${esc(o.body)}</i></span>` +
      `<button type="button" class="ntf-x" aria-label="Dismiss">✕</button>` +
      `<span class="ntf-bar"></span>`;
    en.bar = en.el.querySelector('.ntf-bar');
    en.bar.style.setProperty('--life', LIFE + 'ms');
  }

  function arm(en, ms) {
    clearTimeout(en.t);
    en.left = ms; en.t0 = Date.now();
    en.t = setTimeout(() => close(en), ms);
  }
  function restartBar(en) { en.bar.style.animation = 'none'; void en.bar.offsetWidth; en.bar.style.animation = ''; }
  function pause(en) { if (en.paused || en.gone) return; en.paused = true; clearTimeout(en.t); en.left = Math.max(800, en.left - (Date.now() - en.t0)); en.el.classList.add('hold'); }
  function resume(en) { if (!en.paused || en.gone) return; en.paused = false; en.el.classList.remove('hold'); arm(en, en.left); }

  function close(en, dir) {
    if (en.gone) return; en.gone = true; clearTimeout(en.t);
    if (live.get(en.key) === en) live.delete(en.key);
    en.el.classList.add('leaving');
    if (dir) en.el.style.setProperty('--out', dir);
    setTimeout(() => en.el.remove(), 320);
  }

  function tap(en) {
    const fn = en.o.onTap; close(en);
    try { const r = fn && fn(); if (r && r.catch) r.catch(() => {}); } catch {}
  }

  function wire(en) {
    const el = en.el; let x0 = 0, y0 = 0, dx = 0, dy = 0, down = false, moved = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.ntf-x')) return;
      down = true; moved = false; x0 = e.clientX; y0 = e.clientY; dx = dy = 0;
      try { el.setPointerCapture(e.pointerId); } catch {}
      pause(en);
    });
    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      dx = e.clientX - x0; dy = Math.min(0, e.clientY - y0);
      if (Math.abs(dx) > 6 || dy < -6) moved = true;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.opacity = String(Math.max(.25, 1 - Math.abs(dx) / 260 - Math.abs(dy) / 140));
    });
    const up = () => {
      if (!down) return; down = false;
      el.style.transition = '';
      if (Math.abs(dx) > 70) { close(en, dx > 0 ? '120%' : '-120%'); return; }
      if (dy < -40) { close(en, '0'); return; }
      el.style.transform = ''; el.style.opacity = '';
      if (!moved) { tap(en); return; }
      resume(en);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => { down = false; el.style.transform = ''; el.style.opacity = ''; el.style.transition = ''; resume(en); });
    el.addEventListener('mouseenter', () => pause(en));
    el.addEventListener('mouseleave', () => { if (!down) resume(en); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(en); } else if (e.key === 'Escape') close(en); });
    el.addEventListener('click', (e) => { if (e.target.closest('.ntf-x')) { e.stopPropagation(); close(en, '0'); } });
  }

  function show(o) {
    const key = o.key || ('n' + (++seq)), add = Math.max(1, o.count | 0 || 1);
    const w = ensureWrap(), ex = live.get(key);
    if (ex && !ex.gone) {                                   // same conversation / request: update, don't stack
      ex.o = { ...ex.o, ...o }; ex.count += add; paint(ex);
      ex.paused = false; ex.el.classList.remove('hold');
      w.prepend(ex.el);
      ex.el.classList.remove('bump'); void ex.el.offsetWidth; ex.el.classList.add('bump');
      arm(ex, LIFE); navigator.vibrate?.(10);
      return key;
    }
    while (live.size >= MAX) close(live.values().next().value);
    const el = document.createElement('div');
    el.className = 'ntf'; el.setAttribute('role', 'button'); el.tabIndex = 0;
    const en = { key, o, el, count: add, t: null, left: LIFE, t0: 0, paused: false, gone: false, bar: null };
    live.set(key, en); paint(en); wire(en);
    w.prepend(el); arm(en, LIFE); navigator.vibrate?.(12);
    return key;
  }

  function push(o) {
    if (!o || (!o.title && !o.body)) return null;
    o = { icon: '🔔', title: '', body: '', ...o };
    if (document.hidden) {                                   // nobody can see it now -> keep the latest, merged per key
      const k = o.key || ('n' + (++seq)), prev = held.get(k);
      held.set(k, { ...o, key: k, count: (prev?.count || 0) + Math.max(1, o.count | 0 || 1) });
      return k;
    }
    return show(o);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !held.size) return;
    const items = [...held.values()].slice(-MAX); held.clear();
    items.forEach((o, i) => setTimeout(() => show(o), 220 * i));
  });

  window.OSNotify = {
    push,
    clear(key) { held.delete(key); const en = live.get(key); if (en) close(en, '0'); },
    clearAll() { held.clear(); [...live.values()].forEach((en) => close(en, '0')); }
  };
})();
