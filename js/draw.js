/* ============================================================
   draw.js — Chemistry revision (25 Oct 2026): everything the page draws.
   - Particles as the pupils draw them (memory particle-model-in-diagrams): a solid is a regular pattern of touching
     particles, a liquid is touching particles with no pattern, a gas is particles far apart. Atoms have one colour per
     element, the same everywhere on the page (KEY below), and every key names exactly what its circle draws.
   - The glassware is the Separating mixtures kit (practicals/ks3-separating-mixtures-pract/js/kit.js), ported here so
     this page runs on its own: glass as an outline with a pale fill and a highlight, liquids that rise and fall inside.
   - FIG: the figures inside questions, each { vb: [width, height], alt, draw(svg) }. An <svg data-fig="name"> in the page
     is drawn by fillFigures() when the page is built.
   Every figure was drawn for this page.
   ============================================================ */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  function S(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  let uid = 0;
  const id = p => (p || 'd') + (++uid);

  /* ---------------- atoms and molecules ---------------- */
  const EL = {
    H: { c: '#F4F6F8', s: '#7D8794', n: 'hydrogen', r: .62 }, C: { c: '#3B4049', s: '#1C1F24', n: 'carbon', r: .9 },
    O: { c: '#E0533F', s: '#8E2A1D', n: 'oxygen', r: .92 },   N: { c: '#3F6FD8', s: '#1F3F8A', n: 'nitrogen', r: .9 },
    Cl: { c: '#43A047', s: '#1F5E22', n: 'chlorine', r: 1 },  S: { c: '#E5C53A', s: '#8A7310', n: 'sulfur', r: 1 },
    Fe: { c: '#B5653A', s: '#6B3416', n: 'iron', r: .95 },    Na: { c: '#8E5BD6', s: '#4B2A86', n: 'sodium', r: .72 },
    He: { c: '#8FD8E8', s: '#2F7F92', n: 'helium', r: .7 },   Ne: { c: '#F29BC0', s: '#9A3A64', n: 'neon', r: .74 },
    Ar: { c: '#B9A3E8', s: '#5B4396', n: 'argon', r: .82 },   Cu: { c: '#D88A4E', s: '#7A4214', n: 'copper', r: .9 },
    X: { c: '#8B95A1', s: '#4E5866', n: 'particle', r: 1 }   /* any one substance: grey, never water's blue (25 Oct 2026) */
  };
  /* one atom: a ball with a soft highlight, so it reads as a ball in bright and dark */
  function atom(p, x, y, r, el, o) {
    const e = EL[el] || EL.X, g = S('g', { class: 'atom' }, p);
    S('circle', { cx: x, cy: y, r, fill: (o && o.fill) || e.c, stroke: e.s, 'stroke-width': Math.max(1, r * .09) }, g);
    S('circle', { cx: x - r * .32, cy: y - r * .34, r: r * .3, fill: '#FFFFFF', opacity: el === 'H' ? .55 : .35 }, g);
    if (o && o.sign) S('text', { x, y: y + r * .45, 'text-anchor': 'middle', 'font-size': r * 1.35, 'font-weight': 900, fill: o.signFill || '#FFFFFF' }, g, o.sign);
    return g;
  }
  /* molecule shapes in 2D: [element, dx, dy] in units of R (the size of one big atom), drawn back to front */
  const MOL = {
    H2: [['H', -.36, 0], ['H', .36, 0]],
    O2: [['O', -.55, 0], ['O', .55, 0]],
    N2: [['N', -.54, 0], ['N', .54, 0]],
    Cl2: [['Cl', -.6, 0], ['Cl', .6, 0]],
    H2O: [['H', -.72, .58], ['H', .72, .58], ['O', 0, 0]],
    CO2: [['O', -1.2, 0], ['O', 1.2, 0], ['C', 0, 0]],
    CH4: [['H', -.74, -.74], ['H', .74, -.74], ['H', -.74, .74], ['H', .74, .74], ['C', 0, 0]],
    NH3: [['H', 0, -.98], ['H', -.86, .52], ['H', .86, .52], ['N', 0, 0]],
    He: [['He', 0, 0]], Ne: [['Ne', 0, 0]], Ar: [['Ar', 0, 0]], X: [['X', 0, 0]]
  };
  function mol(p, kind, x, y, R, rot) {
    const g = S('g', { transform: `translate(${x} ${y}) rotate(${rot || 0})` }, p);
    (MOL[kind] || MOL.X).forEach(([el, dx, dy]) => atom(g, dx * R, dy * R, (EL[el] || EL.X).r * R * .62, el));
    return g;
  }
  /* a seeded random number list, so a drawing is the same every time */
  function rng(seed) { let q = seed || 7; return () => (q = (q * 9301 + 49297) % 233280) / 233280; }
  /* places for n particles in a w × h box: far apart (gas), touching with no pattern (liquid), or a lattice (solid) */
  function spots(n, w, h, d, kind, seed) {
    const r = rng(seed), out = [];
    if (kind === 'solid') {
      const cols = Math.max(1, Math.floor(w / d)), rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) { const c = i % cols, rw = Math.floor(i / cols); out.push([(w - cols * d) / 2 + d / 2 + c * d, h - d / 2 - rw * d]); }
      return out.slice(0, n);
    }
    const minD = kind === 'liquid' ? d * .98 : d * 1.25;
    for (let t = 0; out.length < n && t < 6000; t++) {
      const x = d / 2 + r() * (w - d), y = kind === 'liquid' ? h - d / 2 - r() * Math.min(h - d, d * Math.ceil(n / Math.max(1, Math.floor(w / d))) * 1.15) : d / 2 + r() * (h - d);
      if (out.every(([a, b]) => Math.hypot(a - x, b - y) >= minD)) out.push([x, y]);
    }
    return out;
  }
  /* a box of particles, drawn at (x, y) with side L; parts = [[kind, count], …] */
  function particleBox(p, x, y, L, parts, o) {
    o = o || {};
    const g = S('g', null, p), R = o.R || L / 9;
    S('rect', { class: 'box', x, y, width: L, height: L, rx: 8 }, g);
    const total = parts.reduce((t, [, n]) => t + n, 0), list = [];
    parts.forEach(([k, n]) => { for (let i = 0; i < n; i++) list.push(k); });
    const r = rng(o.seed || 11);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    const pos = spots(total, L - 12, L - 12, R * (o.gap || 2.6), o.state || 'gas', o.seed || 5);
    list.forEach((k, i) => { const q = pos[i]; if (q) mol(g, k, x + 6 + q[0], y + 6 + q[1], R, Math.round(r() * 360)); });
    return g;
  }
  /* an ionic lattice (salt): rows of + and − ions in a pattern */
  function lattice(p, x, y, cols, rows, d, a, b, o) {
    const g = S('g', null, p);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const el = (i + j) % 2 ? b : a;
      atom(g, x + i * d, y + j * d, (EL[el].r) * d * .55, el, o && o.signs ? { sign: el === 'Na' ? '+' : el === 'Cl' ? '−' : null } : null);
    }
    return g;
  }

  /* ---------------- labels and arrows ---------------- */
  function label(p, x, y, text, o) {
    o = o || {};
    const g = S('g', { class: 'label' }, p), a = o.anchor || 'start';
    if (o.to) S('path', { class: 'lead', d: `M${o.to[0]},${o.to[1]} L${x + (a === 'end' ? 6 : a === 'start' ? -6 : 0)},${y - 6}` }, g);
    const t = S('text', { class: o.cls || 'lbl', x, y, 'text-anchor': a }, null, text);
    g.appendChild(t);
    if (o.bg !== false) {
      const w = (o.w || text.length * (o.cls === 'lbl-sm' ? 8.4 : 9.6)) + 12, hh = o.cls === 'lbl-sm' ? 22 : 26;
      const bx = a === 'end' ? x - w + 6 : a === 'middle' ? x - w / 2 : x - 6;
      g.insertBefore(S('rect', { class: 'lbl-bg', x: bx, y: y - hh + 6, width: w, height: hh, rx: 6 }), t);
    }
    return g;
  }
  function arrowHead(p, x, y, ang, size, color) {
    const s = size || 12, a = ang;
    S('path', { d: `M${x},${y} L${x - s * Math.cos(a - .45)},${y - s * Math.sin(a - .45)} L${x - s * Math.cos(a + .45)},${y - s * Math.sin(a + .45)} Z`, fill: color || 'var(--ink2)' }, p);
  }
  /* a curved arrow from (x1, y1) to (x2, y2), bent by `bend` (pixels to the left of the direction of travel) */
  function curveArrow(p, x1, y1, x2, y2, bend, cls, color) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    const cx = mx - dy / L * bend, cy = my + dx / L * bend;
    const g = S('g', null, p);
    S('path', { class: 'arrow ' + (cls || ''), d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, stroke: color || null }, g);
    arrowHead(g, x2, y2, Math.atan2(y2 - cy, x2 - cx), 16, color || (cls === 'hot-a' ? '#C2410C' : cls === 'cold-a' ? '#1D5FBF' : null));
    return { g, mid: [(x1 + 2 * cx + x2) / 4, (y1 + 2 * cy + y2) / 4] };
  }

  /* ---------------- glassware (from the Separating mixtures kit) ---------------- */
  const C = { water: '#7EB8EA', sea: '#6FB3C9', salt: '#F4F1E8', cuso4: '#2E7FD9', oil: '#E9BC34', chalk: '#E9E6DF', milk: '#F3F1EA', honey: '#D9902B', soap: '#7CC36A', syrup: '#B5651D' };
  function liquid(p, innerD, yTop, yBot, color, o) {
    o = o || {};
    const cid = id('clip'), defs = S('defs', null, p), cp = S('clipPath', { id: cid }, defs);
    S('path', { d: innerD }, cp);
    const g = S('g', { 'clip-path': `url(#${cid})` }, p);
    const r = S('rect', { x: -1000, y: yBot, width: 3000, height: 0, fill: color, opacity: o.opacity == null ? .78 : o.opacity }, g);
    const men = S('rect', { x: -1000, y: yBot, width: 3000, height: 2.2, fill: '#FFFFFF', opacity: .45 }, g);
    let lev = 0;
    const api = {
      g, rect: r, men,
      set(f) { lev = Math.max(0, Math.min(1, f)); const y = yBot - lev * (yBot - yTop); r.setAttribute('y', y); r.setAttribute('height', lev > .001 ? 1000 : 0); men.setAttribute('y', y); men.style.display = lev > .01 ? '' : 'none'; return api; },
      color(c) { r.setAttribute('fill', c); return api; },
      opacity(v) { r.setAttribute('opacity', v); return api; },
      level: () => lev,
      y: () => yBot - lev * (yBot - yTop)
    };
    return api.set(o.level || 0);
  }
  function beaker(p, cx, by, w, hh, o) {
    o = o || {};
    const g = S('g', { class: 'beaker' }, p), x0 = cx - w / 2, x1 = cx + w / 2, ty = by - hh, r = 7;
    const inner = `M${x0 + 2},${ty} L${x0 + 2},${by - r} Q${x0 + 2},${by - 2} ${x0 + r},${by - 2} L${x1 - r},${by - 2} Q${x1 - 2},${by - 2} ${x1 - 2},${by - r} L${x1 - 2},${ty} Z`;
    const liq = liquid(g, inner, ty + 4, by - 2, o.color || C.water, { level: o.level || 0, opacity: o.opacity });
    S('path', { class: 'glass', d: `M${x0 - 6},${ty - 3} Q${x0},${ty} ${x0},${ty + 6} L${x0},${by - r} Q${x0},${by} ${x0 + r},${by} L${x1 - r},${by} Q${x1},${by} ${x1},${by - r} L${x1},${ty}` }, g);
    S('path', { class: 'shine', d: `M${x0 + 7},${ty + 14} L${x0 + 7},${by - 14}`, opacity: .8 }, g);
    return { g, liq, x0, x1, ty, by, cx, w, h: hh, inner };
  }
  function conical(p, cx, by, w, hh, o) {
    o = o || {};
    const g = S('g', { class: 'conical' }, p), nw = o.neck || w * .3, nh = hh * .32, ty = by - hh, r = 6;
    const a = cx - nw / 2, b = cx + nw / 2, l = cx - w / 2, rr = cx + w / 2;
    const outer = `M${a - 4},${ty} L${a},${ty + 3} L${a},${ty + nh} L${l},${by - r} Q${l},${by} ${l + r},${by} L${rr - r},${by} Q${rr},${by} ${rr},${by - r} L${b},${ty + nh} L${b},${ty + 3} L${b + 4},${ty}`;
    const inner = `M${a + 2},${ty} L${a + 2},${ty + nh} L${l + 2.5},${by - r} L${l + 3},${by - 2} L${rr - 3},${by - 2} L${rr - 2.5},${by - r} L${b - 2},${ty + nh} L${b - 2},${ty} Z`;
    const liq = liquid(g, inner, ty + 4, by - 2, o.color || C.water, { level: o.level || 0, opacity: o.opacity });
    S('path', { class: 'glass', d: outer }, g);
    S('path', { class: 'shine', d: `M${l + 10},${by - 14} L${a + 4},${ty + nh + 10}`, opacity: .8 }, g);
    return { g, liq, ty, by, cx, w, h: hh, neckY: ty + nh, a, b };
  }
  function rbFlask(p, cx, cy, R, ty, o) {
    o = o || {};
    const g = S('g', { class: 'rbflask' }, p), nw = o.neck || 26, a = cx - nw / 2, b = cx + nw / 2;
    const ang = Math.asin((nw / 2) / R), yJ = cy - R * Math.cos(ang);
    const outer = `M${a},${ty} L${a},${yJ} A${R},${R} 0 1 0 ${b},${yJ} L${b},${ty}`;
    const innerR = R - 2.2;
    const inner = `M${a + 2},${ty} L${a + 2},${yJ + 2} A${innerR},${innerR} 0 1 0 ${b - 2},${yJ + 2} L${b - 2},${ty} Z`;
    const liq = liquid(g, inner, cy - R * .2, cy + R - 2, o.color || C.water, { level: o.level || 0, opacity: o.opacity });
    S('path', { class: 'glass', d: outer }, g);
    S('path', { class: 'shine', d: `M${cx - R * .62},${cy - R * .3} A${R * .7},${R * .7} 0 0 0 ${cx - R * .3},${cy + R * .55}`, opacity: .8 }, g);
    return { g, liq, cx, cy, R, ty, a, b, bottom: cy + R };
  }
  function funnel(p, cx, ty, w, coneH, stemL) {
    const g = S('g', { class: 'funnel' }, p), sw = 9, x0 = cx - w / 2, x1 = cx + w / 2;
    const yS = ty + coneH, yE = yS + stemL;
    S('path', { class: 'glass', d: `M${x0 - 3},${ty - 2} L${x0},${ty} L${cx - sw / 2},${yS} L${cx - sw / 2},${yE - 6} L${cx + sw / 2},${yE} L${cx + sw / 2},${yS} L${x1},${ty} L${x1 + 3},${ty - 2}` }, g);
    S('path', { class: 'shine', d: `M${x0 + 10},${ty + 6} L${cx - sw / 2 - 2},${yS - 10}`, opacity: .7 }, g);
    return { g, cx, ty, w, x0, x1, yS, yE, sw };
  }
  function bunsen(p, cx, by, o) {
    o = o || {};
    const g = S('g', { class: 'bunsen' }, p), bh = o.h || 70, t = by - bh;
    S('path', { class: 'metal', d: `M${cx - 30},${by} L${cx - 22},${by - 10} L${cx + 22},${by - 10} L${cx + 30},${by} Z` }, g);
    S('rect', { class: 'metal', x: cx - 8, y: t, width: 16, height: bh - 8, rx: 2 }, g);
    S('rect', { x: cx - 10, y: by - Math.min(34, bh * .5), width: 20, height: 10, rx: 2, fill: 'var(--metal-2)', stroke: 'var(--bench-edge)', 'stroke-width': 1 }, g);
    S('path', { d: `M${cx + 22},${by - 6} L${cx + 46},${by - 6}`, stroke: '#D6602A', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    const fl = S('g', { class: 'flame', opacity: 0 }, g);
    const fh = o.flame || 52;
    S('path', { d: `M${cx - 9},${t} C${cx - 14},${t - fh * .45} ${cx - 3},${t - fh * .8} ${cx},${t - fh} C${cx + 3},${t - fh * .8} ${cx + 14},${t - fh * .45} ${cx + 9},${t} Z`, fill: '#4F8DF5', opacity: .55 }, fl);
    S('path', { d: `M${cx - 5},${t} C${cx - 7},${t - fh * .3} ${cx - 1},${t - fh * .5} ${cx},${t - fh * .56} C${cx + 1},${t - fh * .5} ${cx + 7},${t - fh * .3} ${cx + 5},${t} Z`, fill: '#A9D3FF', opacity: .95 }, fl);
    return { g, top: t, on(v) { fl.setAttribute('opacity', v ? 1 : 0); fl.classList.toggle('lit', !!v); } };
  }
  function tripod(p, cx, by, top, w) {
    const g = S('g', { class: 'tripod' }, p);
    S('line', { class: 'metal-line', x1: cx - w / 2 + 8, y1: top, x2: cx - w / 2 - 10, y2: by, 'stroke-width': 4.5 }, g);
    S('line', { class: 'metal-line', x1: cx + w / 2 - 8, y1: top, x2: cx + w / 2 + 10, y2: by, 'stroke-width': 4.5 }, g);
    S('rect', { class: 'metal', x: cx - w / 2 - 6, y: top - 3, width: w + 12, height: 6, rx: 2 }, g);
    const gz = S('g', null, g);
    for (let x = cx - w / 2 - 4; x <= cx + w / 2 + 4; x += 6) S('line', { x1: x, y1: top - 7, x2: x + 4, y2: top - 3, stroke: 'var(--metal-2)', 'stroke-width': 1 }, gz);
    S('rect', { x: cx - w / 2 - 6, y: top - 8, width: w + 12, height: 5, fill: 'none', stroke: 'var(--metal)', 'stroke-width': 1.4 }, g);
    return { g, top: top - 8 };
  }
  function thermometer(p, x, y1, y2, o) {
    o = o || {};
    const g = S('g', { class: 'thermo' }, p), t0 = o.min == null ? 0 : o.min, t1 = o.max == null ? 110 : o.max;
    S('rect', { x: x - 6, y: y1, width: 12, height: y2 - y1, rx: 6, fill: 'var(--sheet)', stroke: 'var(--glass)', 'stroke-width': 1.8 }, g);
    S('circle', { cx: x, cy: y2, r: 9, fill: '#D22F27', stroke: 'var(--glass)', 'stroke-width': 1.6 }, g);
    const col = S('rect', { x: x - 2.4, y: y2 - 8, width: 4.8, height: 8, fill: '#D22F27' }, g);
    const yOf = t => y2 - 14 - (t - t0) / (t1 - t0) * (y2 - y1 - 24);
    if (o.ticks) o.ticks.forEach(t => {
      const yy = yOf(t);
      S('line', { x1: x + 6, y1: yy, x2: x + 14, y2: yy, stroke: 'var(--glass)', 'stroke-width': 1.4 }, g);
      S('text', { class: 'axlbl', x: x + 18, y: yy + 5 }, g, (t < 0 ? '−' + (-t) : t) + ' °C');
    });
    return { g, yOf, set(t) { const yy = yOf(Math.max(t0, Math.min(t1, t))); col.setAttribute('y', yy); col.setAttribute('height', y2 - yy); } };
  }
  function stand(p, x, by, hh, armY, armTo) {
    const g = S('g', { class: 'stand' }, p);
    S('rect', { class: 'metal', x: x - 50, y: by - 10, width: 100, height: 10, rx: 3 }, g);
    S('line', { class: 'metal-line', x1: x, y1: by - 8, x2: x, y2: by - hh }, g);
    if (armY != null) {
      S('rect', { class: 'metal', x: x - 9, y: armY - 9, width: 18, height: 18, rx: 3 }, g);
      S('line', { class: 'metal-line', x1: x, y1: armY, x2: armTo, y2: armY, 'stroke-width': 4 }, g);
    }
    return g;
  }

  /* ---------------- graphs ---------------- */
  /* axes in the box (x, y, w, h) with ranges xr = [min, max, step], yr likewise; returns the scales */
  function axes(p, x, y, w, h, xr, yr, o) {
    o = o || {};
    const g = S('g', { class: 'graph' }, p);
    const X = v => x + (v - xr[0]) / (xr[1] - xr[0]) * w, Y = v => y + h - (v - yr[0]) / (yr[1] - yr[0]) * h;
    const fmt = v => (v < 0 ? '−' + Math.abs(v) : String(v));
    if (o.minorY) for (let v = yr[0]; v <= yr[1] + 1e-9; v += o.minorY) S('line', { class: 'gridl', x1: x, y1: Y(v), x2: x + w, y2: Y(v), opacity: .55 }, g);
    if (o.minorX) for (let v = xr[0]; v <= xr[1] + 1e-9; v += o.minorX) S('line', { class: 'gridl', x1: X(v), y1: y, x2: X(v), y2: y + h, opacity: .55 }, g);
    for (let v = yr[0]; v <= yr[1] + 1e-9; v += yr[2]) { S('line', { class: 'gridl', x1: x, y1: Y(v), x2: x + w, y2: Y(v), 'stroke-width': 1.4 }, g); S('line', { class: 'tick', x1: x - 6, y1: Y(v), x2: x, y2: Y(v) }, g); S('text', { class: 'axlbl', x: x - 10, y: Y(v) + 5, 'text-anchor': 'end' }, g, fmt(v)); }
    for (let v = xr[0]; v <= xr[1] + 1e-9; v += xr[2]) { S('line', { class: 'gridl', x1: X(v), y1: y, x2: X(v), y2: y + h, 'stroke-width': 1.4 }, g); S('line', { class: 'tick', x1: X(v), y1: y + h, x2: X(v), y2: y + h + 6 }, g); S('text', { class: 'axlbl', x: X(v), y: y + h + 24, 'text-anchor': 'middle' }, g, fmt(v)); }
    const ax0 = o.xAxisAt != null ? Y(o.xAxisAt) : y + h;
    S('path', { class: 'axis', d: `M${x},${y - 6} L${x},${y + h} M${x},${ax0} L${x + w + 6},${ax0}` }, g);
    if (o.xTitle) S('text', { class: 'axttl', x: x + w / 2, y: y + h + 52, 'text-anchor': 'middle' }, g, o.xTitle);
    if (o.yTitle) S('text', { class: 'axttl', x: 0, y: 0, 'text-anchor': 'middle', transform: `translate(${x - (o.yTitleGap || 58)} ${y + h / 2}) rotate(-90)` }, g, o.yTitle);
    return { g, X, Y };
  }
  /* a line through the points, with a dot at each */
  function line(p, sc, pts, color, o) {
    o = o || {};
    const g = S('g', null, p);
    const d = o.smooth ? smoothPath(pts.map(([a, b]) => [sc.X(a), sc.Y(b)])) : 'M' + pts.map(([a, b]) => sc.X(a) + ',' + sc.Y(b)).join(' L');
    S('path', { d, fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    if (o.dots !== false) pts.forEach(([a, b]) => S('circle', { cx: sc.X(a), cy: sc.Y(b), r: 5, fill: color, stroke: 'var(--sheet)', 'stroke-width': 1.5 }, g));
    return g;
  }
  function smoothPath(P) {
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  /* the y of a polyline at x (the points sorted by x) */
  function interp(pts, x) {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, b] = pts[i - 1], [c, d] = pts[i]; return b + (d - b) * (x - a) / (c - a); }
    return pts[pts.length - 1][1];
  }

  /* ---------------- the data the graphs show ---------------- */
  /* freezing point of salt water (°C) against the mass of salt (g) dissolved in 100 g of water. From the freezing points of
     sodium chloride solutions by mass (CRC Handbook: 4.8 % −2.9 °C … 23.1 % −20.7 °C), recalculated per 100 g of water and
     rounded; 30 g in 100 g of water is near the lowest freezing point any salt water can have (about −21 °C). */
  const SALT_FP = [[0, 0], [5, -2.9], [10, -5.9], [15, -9.1], [20, -12.4], [25, -16.5], [30, -20.7]];
  /* solubility of potassium nitrate (g in 100 g of water) against temperature (°C): published solubility tables */
  const KNO3 = [[0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8], [40, 63.9], [50, 85.5], [60, 106], [70, 138], [80, 169]];
  /* boiling points (°C) of four liquids, and how well each dissolves nail varnish */
  const SOLVENTS = [{ n: 'water', bp: 100, dis: 'no' }, { n: 'ethanol', bp: 78, dis: 'a little' }, { n: 'ethyl ethanoate', bp: 77, dis: 'yes' }, { n: 'propanone', bp: 56, dis: 'yes' }];

  /* ---------------- figures inside questions ---------------- */
  const FIG = {};
  /* part 1: the three states as small icons for the table (particles of one substance) */
  function stateIcon(svg, kind) {
    S('rect', { class: 'box', x: 3, y: 3, width: 54, height: 54, rx: 6, 'stroke-width': 2 }, svg);
    const P = kind === 'solid' ? [[15, 45], [27, 45], [39, 45], [15, 33], [27, 33], [39, 33], [15, 21], [27, 21], [39, 21]].map(([a, b]) => [a + 3, b])
      : kind === 'liquid' ? [[14, 47], [26, 47], [38, 46], [49, 47], [20, 36], [32, 36], [44, 35.5], [14, 25.5], [27, 25]]
      : [[14, 15], [44, 13], [30, 30], [12, 45], [47, 44], [26, 48]];
    P.forEach(([a, b]) => atom(svg, a, b, 5.6, 'X'));
  }
  FIG.icoSolid = { vb: [60, 60], alt: 'particles in a solid', draw: s => stateIcon(s, 'solid') };
  FIG.icoLiquid = { vb: [60, 60], alt: 'particles in a liquid', draw: s => stateIcon(s, 'liquid') };
  FIG.icoGas = { vb: [60, 60], alt: 'particles in a gas', draw: s => stateIcon(s, 'gas') };

  /* part 2: the triangle of changes of state, with numbered boxes on the six arrows (a label question) */
  const TRI = { s: [150, 360], l: [550, 360], g: [350, 92] };
  function triangle(svg, o) {
    const box = (x, y, kind, name) => {
      S('rect', { class: 'card', x: x - 62, y: y - 58, width: 124, height: 116, rx: 12 }, svg);
      const g = S('g', { transform: `translate(${x - 38} ${y - 50}) scale(1.27)` }, svg); stateIcon(g, kind);
      S('text', { class: 'ttl', x, y: y + 48, 'text-anchor': 'middle' }, svg, name);
    };
    const A = (a, b, bend, cls) => curveArrow(svg, a[0], a[1], b[0], b[1], bend, cls);
    /* each pair of opposite changes: two arrows, one each side of the line between the states */
    const s = TRI.s, l = TRI.l, g = TRI.g;
    const out = {};
    out.melt = A([216, 338], [484, 338], -34, 'hot-a');
    out.freeze = A([484, 382], [216, 382], -34, 'cold-a');
    out.evap = A([575, 300], [420, 92], 34, 'hot-a');      /* outside the triangle */
    out.cond = A([418, 145], [510, 298], 34, 'cold-a');    /* inside it, so the two never cross */
    out.subl = A([125, 300], [280, 92], -34, 'hot-a');
    out.depo = A([282, 145], [190, 298], -34, 'cold-a');
    box(s[0], s[1], 'solid', 'SOLID'); box(l[0], l[1], 'liquid', 'LIQUID'); box(g[0], g[1], 'gas', 'GAS');
    if (o && o.key) {
      S('path', { class: 'arrow hot-a', d: 'M14,30 L50,30' }, svg); arrowHead(svg, 54, 30, 0, 12, '#C2410C');
      S('text', { class: 'note', x: 60, y: 35 }, svg, 'heating: energy in');
      S('path', { class: 'arrow cold-a', d: 'M14,58 L50,58' }, svg); arrowHead(svg, 54, 58, 0, 12, '#1D5FBF');
      S('text', { class: 'note', x: 60, y: 63 }, svg, 'cooling: energy out');
    }
    return out;
  }
  FIG.cycle = { vb: [700, 450], alt: 'Solid, liquid and gas joined by six arrows, each with an empty numbered box', draw: s => triangle(s, { key: true }) };
  /* the places of the six boxes on FIG.cycle (label question p2-label-cycle), in the order of q.slots */
  FIG.cycle.slots = { melt: [350, 300], freeze: [350, 426], evap: [588, 172], cond: [452, 242], subl: [112, 172], depo: [248, 242] };

  /* part 4: boxes of particles for sorting (Box A … F); the key is in the question's words */
  const box6 = (parts, o) => ({ vb: [120, 120], draw: s => particleBox(s, 4, 4, 112, parts, Object.assign({ R: 12, gap: 2.3 }, o)) });
  FIG.pA = box6([['H2', 6]], { seed: 21 });
  FIG.pB = box6([['Ne', 6]], { seed: 9, R: 14 });
  FIG.pC = box6([['NH3', 4]], { seed: 33, gap: 2.6 });
  FIG.pD = box6([['CH4', 4]], { seed: 41, gap: 2.6 });
  FIG.pE = box6([['H2', 3], ['O2', 3]], { seed: 17 });
  FIG.pF = box6([['Ne', 3], ['CO2', 3]], { seed: 29, gap: 2.7 });

  /* part 6: two glasses of fruit drink with the same volume; B has more solute particles */
  FIG.glasses = { vb: [560, 296], alt: 'Two glasses with the same volume of fruit drink. Glass A has 6 solute particles; glass B has 15.', draw(s) {
    const glass = (cx, n, name, seed) => {
      const by = 236, w = 150, hh = 190, g = beaker(s, cx, by, w, hh, { color: '#F4D9E6', level: .82, opacity: .55 });
      const r = rng(seed), pts = [];
      for (let t = 0; pts.length < n && t < 4000; t++) { const x = cx - w / 2 + 18 + r() * (w - 36), y = by - 14 - r() * (hh * .82 - 26); if (pts.every(([a, b]) => Math.hypot(a - x, b - y) > 26)) pts.push([x, y]); }
      pts.forEach(([x, y]) => atom(s, x, y, 8.5, 'X', { fill: '#9C2A6B' }));
      S('text', { class: 'ttl', x: cx, y: 30, 'text-anchor': 'middle' }, s, name);
    };
    glass(150, 6, 'Glass A', 3); glass(410, 15, 'Glass B', 8);
    atom(s, 170, 264, 7, 'X', { fill: '#9C2A6B' }); S('text', { class: 'note', x: 183, y: 269 }, s, '= a solute particle');
    S('text', { class: 'note', x: 280, y: 290, 'text-anchor': 'middle' }, s, 'The water is shown as a plain colour.');
  } };

  /* part 7: a filtration set-up with five numbered boxes (a label question) */
  FIG.filter = { vb: [560, 420], alt: 'A funnel with filter paper resting in a conical flask; a solid sits on the paper and a clear liquid is in the flask', draw(s) {
    conical(s, 280, 404, 170, 170, { color: C.water, level: .32, opacity: .6 });
    const f = funnel(s, 280, 124, 170, 108, 92);
    /* the filter paper: a cone of paper inside the funnel, with the pale residue at its bottom */
    S('path', { class: 'paper', d: `M${f.x0 + 12},${f.ty + 4} L${f.cx},${f.yS + 2} L${f.x1 - 12},${f.ty + 4} Z` }, s);
    S('path', { d: `M${f.cx - 32},${f.yS - 42} Q${f.cx},${f.yS - 52} ${f.cx + 32},${f.yS - 42} L${f.cx},${f.yS - 2} Z`, fill: '#D9D3C4', stroke: '#9C9584', 'stroke-width': 1.2 }, s);
    for (let i = 0; i < 18; i++) S('circle', { cx: f.cx - 22 + (i * 37 % 44), cy: f.yS - 40 + (i * 13 % 30), r: 2.2, fill: '#B9B19E' }, s);
    S('path', { d: `M${f.cx},${f.yE + 6} L${f.cx},${f.yE + 24}`, stroke: C.water, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '5 7' }, s);
    [[386, 112, 340, 150], [386, 262, 289, 270], [155, 182, 258, 205], [415, 385, 340, 385], [435, 330, 332, 332]].forEach(([a, b, c, d]) => S('line', { class: 'lead', x1: a, y1: b, x2: c, y2: d }, s));
  } };
  FIG.filter.slots = { paper: [440, 110], funnel: [440, 262], residue: [100, 182], filtrate: [470, 385], flask: [490, 330] };

  /* part 8: boiling salty water under a cold tray (the written answer about distillation) */
  function trayPic(s) {
    /* the hot plate and the pan */
    S('rect', { class: 'metal', x: 70, y: 380, width: 250, height: 26, rx: 6 }, s);
    S('rect', { x: 120, y: 372, width: 150, height: 9, rx: 4, fill: '#E2572B' }, s);
    const pan = beaker(s, 195, 370, 200, 92, { color: C.sea, level: .62, opacity: .75 });
    S('path', { d: 'M95,282 L60,276', stroke: 'var(--metal)', 'stroke-width': 9, 'stroke-linecap': 'round' }, s);
    for (let i = 0; i < 6; i++) S('circle', { cx: 130 + i * 26, cy: 352 - (i % 3) * 8, r: 4 + (i % 2) * 2, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.6, opacity: .8 }, s);
    for (let i = 0; i < 4; i++) S('path', { d: `M${130 + i * 34},262 q-10,-16 0,-32 q10,-16 0,-32`, fill: 'none', stroke: 'var(--ink3)', 'stroke-width': 2.2, opacity: .55, 'stroke-linecap': 'round' }, s);
    /* the cold tray, with ice on it, sloping down to the right */
    S('path', { d: 'M70,150 L400,196 L400,206 L70,160 Z', fill: '#B8C2CC', stroke: '#5B6573', 'stroke-width': 1.6 }, s);
    for (let i = 0; i < 5; i++) S('rect', { x: 110 + i * 56, y: 128 + i * 7.8, width: 30, height: 24, rx: 5, fill: '#E3F3FC', stroke: '#8DB8D3', 'stroke-width': 1.4, transform: `rotate(8 ${125 + i * 56} ${140 + i * 7.8})` }, s);
    for (let i = 0; i < 9; i++) S('circle', { cx: 100 + i * 33, cy: 166 + i * 4.6 + 4, r: 3.2, fill: C.water }, s);
    S('path', { d: 'M402,212 L402,232 M402,246 L402,258', stroke: C.water, 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
    /* the cup */
    const cup = beaker(s, 420, 400, 70, 112, { color: C.water, level: .3, opacity: .7 });
    S('text', { class: 'note', x: 70, y: 112 }, s, 'ice keeps the tray cold');
    S('text', { class: 'note', x: 70, y: 430 }, s, 'salty water, boiling');
    S('text', { class: 'note', x: 392, y: 430 }, s, 'cup');
    return { pan, cup };
  }
  FIG.tray = { vb: [520, 440], alt: 'A pan of boiling salty water on a hot plate; a cold metal tray with ice on it slopes above the pan; drops of water slide down the tray and drip into a cup', draw: trayPic };

  /* part 8: a chromatogram of the banned dye Red X and a cherry drink (the written answer about chromatography) */
  FIG.redx = { vb: [420, 330], alt: 'A chromatogram: Red X gives one red spot; the cherry drink gives a red spot at the same height as Red X and a purple spot lower down', draw(s) {
    S('rect', { class: 'paper', x: 140, y: 20, width: 230, height: 290, rx: 3 }, s);
    const base = 270, front = 46;
    S('line', { x1: 148, y1: base, x2: 362, y2: base, stroke: '#7A7F87', 'stroke-width': 2 }, s);
    S('line', { x1: 148, y1: front, x2: 362, y2: front, stroke: '#7A7F87', 'stroke-width': 1.6, 'stroke-dasharray': '7 6' }, s);
    const yOf = f => base - f * (base - front);
    [[205, '#C62828', .62]].forEach(([x, c, f]) => S('ellipse', { cx: x, cy: yOf(f), rx: 11, ry: 9, fill: c, opacity: .9 }, s));
    [[305, '#C62828', .62], [305, '#7B3FA0', .30]].forEach(([x, c, f]) => S('ellipse', { cx: x, cy: yOf(f), rx: 11, ry: 9, fill: c, opacity: .9 }, s));
    S('text', { class: 'lbl-sm', x: 205, y: base + 26, 'text-anchor': 'middle' }, s, 'Red X');
    S('text', { class: 'lbl-sm', x: 305, y: base + 26, 'text-anchor': 'middle' }, s, 'cherry drink');
    S('text', { class: 'note', x: 132, y: base + 5, 'text-anchor': 'end' }, s, 'start line');
    S('text', { class: 'note', x: 132, y: front + 5, 'text-anchor': 'end' }, s, 'solvent front');
  } };

  /* draw every <svg data-fig> in the page (icons in the notes) */
  function fillFigures() {
    document.querySelectorAll('svg[data-fig]').forEach(svg => {
      const F = FIG[svg.dataset.fig]; if (!F || svg.childNodes.length) return;
      svg.setAttribute('viewBox', `0 0 ${F.vb[0]} ${F.vb[1]}`); svg.classList.add('fig');
      svg.setAttribute('aria-hidden', 'true'); F.draw(svg);
    });
  }
  document.addEventListener('chemrev:build', fillFigures);

  window.DRAW = { S, id, EL, atom, MOL, mol, rng, spots, particleBox, lattice, label, arrowHead, curveArrow, C, liquid, beaker, conical, rbFlask, funnel, bunsen, tripod, thermometer, stand,
                  axes, line, smoothPath, interp, SALT_FP, KNO3, SOLVENTS, stateIcon, triangle, TRI, trayPic };
  window.FIG = FIG;
})();
