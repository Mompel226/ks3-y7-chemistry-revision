/* ============================================================
   panel.js — Chemistry revision (25 Oct 2026): the picture on the left.
   Each part has one or more pictures to explore (scenes). A scene draws itself into one SVG (800 × 500 units) and puts
   its buttons ON the picture, scaled with it (memory year7-text-and-instructions: what to press sits beside the button);
   the line under the picture says what you see. A question or a box of notes that needs a picture names it
   (data-scene="…"): when the pupil scrolls to it, that picture comes up (memory questions-show-their-animation), as on
   Separating mixtures: the last one whose top has passed 55 % of the window and that is still on screen; it switches only
   when that one changes, so a picture the pupil chose by hand stays while they read.
   A scene: PANEL.define(part, [{ id, name, draw(k) }]). k gives the scene its tools:
     k.S(tag, attrs, parent, text)   draw into the picture (k.g is the scene's own group)
     k.btn(label, x, y, fn, o)       a button at (x, y) in picture units; o.cls ('warm', 'cold', 'ghost', 'small', 'pulse'),
                                     o.at ('l' = to the left of x, 'r' = to the right, 't' above, 'b' below), o.aria
     k.say(html)                     the line under the picture
     k.hit(x, y, w, h)               an area of the picture (picture units) that takes a mouse or finger drag, such as a
                                     graph's ruler: a page element over the picture, so that on a phone the drag moves the
                                     ruler and never scrolls the picture (touch-action is ignored inside an SVG)
     k.loop(fn)                      fn(dt in s, time in s) every frame until the scene changes (or fn returns false)
     k.anim(ms, fn)                  fn(t from 0 to 1) over ms; a promise. With ?still=1 it jumps to the end
     k.wait(ms), k.alive()           pauses that end when the scene changes
   ============================================================ */
(function () {
  'use strict';
  const R = window.REV, D = window.DRAW, S = D.S;
  const VW = 800, VH = 500;
  const SCENES = {};
  let host, head, title, bar, svg, hots, cap, curPart = 0, cur = null, gen = 0;

  function frame() {
    host = R.$('#panel'); if (!host) return;
    host.innerHTML = '';
    head = R.h('div', { class: 'panel__head' });
    title = R.h('div', { class: 'panel__title' });
    bar = R.h('div', { class: 'scenes', role: 'group', 'aria-label': 'Pictures in this part' });
    head.append(title, bar); host.appendChild(head);
    const stage = R.h('div', { class: 'stage' }), canvas = R.h('div', { class: 'canvas' });
    svg = S('svg', { class: 'pic', viewBox: `0 0 ${VW} ${VH}`, role: 'img' });
    canvas.appendChild(svg);
    hots = R.h('div', { class: 'hots' }); canvas.appendChild(hots);
    stage.appendChild(canvas); host.appendChild(stage);
    host.appendChild(R.h('p', { class: 'swipe' }, 'Swipe the picture sideways to see all of it.'));   /* phones only (css/app.css) */
    cap = R.h('div', { class: 'cap', 'aria-live': 'polite' }); host.appendChild(cap);
    /* any button added, renamed or moved, and any change of the picture's size: fit the buttons again */
    new MutationObserver(ms => { if (ms.some(m => m.target !== hots)) fitSoon(); })
      .observe(hots, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });
    if (window.ResizeObserver) new ResizeObserver(fitSoon).observe(canvas);
  }

  /* ---------- the buttons fit the picture ----------
     The words on a button never go below 13–14 px, so on a small picture (a short laptop window: the picture keeps the
     whole panel inside the window) two buttons could touch, or one could hang off the edge. Only then do all the
     picture's buttons shrink together, a step at a time, as far as needed and never below 85 % (--hk in css/app.css). */
  let fitT = 0;
  function clash() {
    const c = hots.getBoundingClientRect(), rs = [...hots.children].filter(b => b.classList.contains('hot') && b.offsetParent).map(b => b.getBoundingClientRect());
    for (let i = 0; i < rs.length; i++) {
      const a = rs[i];
      if (a.left < c.left - 1 || a.right > c.right + 1 || a.top < c.top - 1 || a.bottom > c.bottom + 1) return true;
      for (let j = i + 1; j < rs.length; j++) {
        const b = rs[j];
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > .5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > .5) return true;
      }
    }
    return false;
  }
  function fitHots() {
    fitT = 0;
    if (!hots || !hots.querySelector('.hot')) return;
    let k = 1;
    hots.style.setProperty('--hk', '1');
    while (k > .85 && clash()) { k = Math.round((k - .03) * 100) / 100; hots.style.setProperty('--hk', String(k)); }
  }
  function fitSoon() { if (!fitT) fitT = requestAnimationFrame(fitHots); }

  function paintBar() {
    bar.innerHTML = '';
    const list = SCENES[curPart] || [];
    if (list.length < 2) { head.classList.remove('tight'); return; }
    list.forEach(sc => {
      const b = R.h('button', { type: 'button', 'aria-pressed': String(sc === cur) }, R.esc(sc.name));
      if (sc._call && sc !== cur) b.classList.add('call');
      b.addEventListener('click', () => { sc._call = false; if (sc !== cur) run(sc, true); });
      bar.appendChild(b);
    });
    /* the title steps aside when the row is full (as on Separating mixtures) */
    head.classList.remove('tight');
    if (head.scrollWidth > head.clientWidth + 1 || title.scrollWidth > title.clientWidth + 2) head.classList.add('tight');
  }

  function run(sc, byHand) {
    gen++;
    const my = gen;
    cur = sc;
    if (byHand) R.store.set('scene.' + curPart, sc.id);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    hots.innerHTML = '';
    cap.innerHTML = '';
    title.textContent = sc.title || sc.name;
    svg.setAttribute('aria-label', sc.alt || sc.name);
    S('rect', { class: 'bg', x: -400, y: -100, width: VW + 800, height: VH + 200 }, svg);
    const g = S('g', null, svg);
    const alive = () => my === gen;
    /* less motion (?still=1, or the computer asks for it): a scene's moving parts jump to where they would end, at the
       start and after every press, instead of moving */
    const loops = [];
    const settle = () => { if (!alive()) return; for (let i = 0; i < 160; i++) loops.forEach(f => f(1 / 60, i / 60)); };
    const k = {
      S, D, g, svg, VW, VH, FAST: R.FAST, alive,
      btn(label, x, y, fn, o) {
        o = o || {};
        const b = R.h('button', { type: 'button', class: 'hot' + (o.cls ? ' ' + o.cls : '') + (o.at ? ' ' + o.at : '') }, label);
        if (o.aria) b.setAttribute('aria-label', o.aria);
        b.style.left = (100 * x / VW) + '%'; b.style.top = (100 * y / VH) + '%';
        b.addEventListener('click', e => { e.stopPropagation(); if (alive() && !b.disabled) { fn(b); if (R.FAST) setTimeout(settle, 0); } });
        hots.appendChild(b);
        b.set = t => { b.innerHTML = t; return b; };
        b.on = v => { b.classList.toggle('on', !!v); b.setAttribute('aria-pressed', String(!!v)); return b; };
        b.move = (nx, ny) => { b.style.left = (100 * nx / VW) + '%'; b.style.top = (100 * ny / VH) + '%'; return b; };
        return b;
      },
      clearBtns() { hots.innerHTML = ''; },
      hit(x, y, w, h) {
        const d = R.h('div', { class: 'hit' });
        Object.assign(d.style, { left: (100 * x / VW) + '%', top: (100 * y / VH) + '%', width: (100 * w / VW) + '%', height: (100 * h / VH) + '%' });
        hots.insertBefore(d, hots.firstChild);   /* under the buttons */
        return d;
      },
      say(html) { if (alive()) cap.innerHTML = html; },
      loop(fn) {
        if (R.FAST) { loops.push(fn); settle(); return; }
        let last = performance.now(), t0 = last;
        const tick = now => {
          if (!alive()) return;
          const dt = Math.min(.05, (now - last) / 1000); last = now;
          if (fn(dt, (now - t0) / 1000) === false) return;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      anim(ms, fn) {
        return new Promise(res => {
          if (R.FAST || !ms) { if (alive()) fn(1); res(alive()); return; }
          const t0 = performance.now();
          const tick = now => {
            if (!alive()) { res(false); return; }
            const t = Math.min(1, (now - t0) / ms);
            fn(t);
            if (t < 1) requestAnimationFrame(tick); else res(true);
          };
          requestAnimationFrame(tick);
        });
      },
      wait(ms) { return new Promise(res => { if (R.FAST) { res(alive()); return; } setTimeout(() => res(alive()), ms); }); },
      settle
    };
    try { sc.draw(k); } catch (e) { console.error('scene ' + sc.id, e); cap.textContent = 'This picture could not be drawn.'; }
    paintBar();
  }

  /* ---------- which picture the pupil is reading about ---------- */
  let watched = [], reading = null, watchT = 0;
  function checkScroll() {
    watchT = 0;
    let now = null;
    watched.forEach(el => { const r = el.getBoundingClientRect(); if (r.height && r.top <= innerHeight * .55 && r.bottom >= 80) now = el; });
    if (!now || now === reading) return;
    reading = now;
    const sc = (SCENES[curPart] || []).find(x => x.id === now.dataset.scene);
    if (!sc || sc === cur) return;
    if (cur && cur._busy) { sc._call = true; paintBar(); return; }   /* never cut a running experiment short: its button calls */
    run(sc);
  }
  addEventListener('scroll', () => { if (watched.length && !watchT) watchT = setTimeout(checkScroll, 120); }, { passive: true });

  function mount(part) {
    curPart = part;
    watched = R.$$(`#part-${part} [data-scene]`); reading = null;
    const list = SCENES[part] || [];
    if (!list.length) return;
    const want = R.store.get('scene.' + part, null);
    run(list.find(s => s.id === want) || list[0]);
  }

  window.PANEL = {
    define(part, list) { SCENES[part] = list; },
    open(part, id) { const sc = (SCENES[part] || []).find(s => s.id === id); if (sc) { R.openPart(part, true); run(sc, true); } },
    current: () => cur, VW, VH
  };
  document.addEventListener('chemrev:build', frame);
  document.addEventListener('part', e => { mount(e.detail); });
  document.addEventListener('themechange', () => { if (cur) run(cur); });
})();
