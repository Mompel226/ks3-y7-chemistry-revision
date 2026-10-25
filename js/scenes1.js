/* ============================================================
   scenes1.js — Chemistry revision (25 Oct 2026): the pictures of parts 1–4.
   1 Particles: one substance (not water), whose temperature decides its state; heat it, cool it, compress it.
   2 Six changes of state on an energy ladder (the pupils' own slide: solid, liquid, gas up an energy arrow), and water
     heated and cooled: it melts and freezes at 0 °C.
   3 Inside an atom (helium and carbon), and the elements to know on a simple periodic table.
   4 Boxes of particles (element, compound, mixture), and iron and sulfur: a mixture, then a compound.
   Particles follow the pupils' model (memory particle-model-in-diagrams): liquid water's molecules touch and slide,
   held by hydrogen bonds (dashed) that break and form again; a solid is a regular pattern; a gas is far apart.
   ============================================================ */
(function () {
  'use strict';
  const P = window.PANEL, D = window.DRAW, S = D.S;

  /* ---------------- a box of moving particles ----------------
     o: { g, x0, x1, y0, y1 (the box), n, r, kind ('X' a particle, 'H2O' a water molecule), state, T (0 cold … 1 hot),
          cols (solid), hb (draw hydrogen bonds), seed, grow (how much wider the gaps of a solid get from cold to hot:
          0.16, or more where expansion is the lesson) } */
  function PSim(o) {
    const rnd = D.rng(o.seed || 3), ps = [], layer = S('g', null, o.g), bonds = o.hb ? S('g', null, layer) : null;
    const box = { x0: o.x0, x1: o.x1, y0: o.y0, y1: o.y1 };
    let state = o.state || 'solid', T = o.T == null ? .25 : o.T, morph = null, t = 0;
    const r = o.r, cols = o.cols || Math.max(1, Math.floor((box.x1 - box.x0) / (2 * r)));
    for (let i = 0; i < o.n; i++) {
      const node = S('g', null, layer);
      if (o.kind === 'H2O') D.mol(node, 'H2O', 0, 0, r * .98, 0); else D.atom(node, 0, 0, r, o.el || 'X');
      ps.push({ node, x: 0, y: 0, vx: 0, vy: 0, a: rnd() * 360, va: 0, sx: 0, sy: 0, p1: rnd() * 6.3, p2: rnd() * 6.3 });
    }
    function sites(temp) {
      const s = 2 * r * (1 + (o.grow || .16) * (temp == null ? T : temp)), rows = Math.ceil(ps.length / cols), out = [];
      const w = cols * s, left = (box.x0 + box.x1) / 2 - w / 2 + s / 2;
      for (let i = 0; i < ps.length; i++) { const c = i % cols, rw = Math.floor(i / cols); out.push([left + c * s + (o.kind === 'H2O' && rw % 2 ? s * .25 : 0), box.y1 - s / 2 - rw * s]); }
      return { out, w, h: rows * s, s };
    }
    function place(st) {
      if (st === 'solid') { const s = sites().out; ps.forEach((q, i) => { q.sx = s[i][0]; q.sy = s[i][1]; q.x = q.sx; q.y = q.sy; q.a = o.kind === 'H2O' ? (i % 2 ? 30 : -30) : q.a; }); return; }
      const pos = D.spots(ps.length, box.x1 - box.x0, box.y1 - box.y0, 2 * r, st === 'liquid' ? 'liquid' : 'gas', (o.seed || 3) + 7);
      ps.forEach((q, i) => { const p = pos[i] || [rnd() * (box.x1 - box.x0), rnd() * (box.y1 - box.y0)]; q.x = box.x0 + p[0]; q.y = box.y0 + p[1]; });
      if (st === 'gas') ps.forEach(q => { const a = rnd() * 6.283, v = speed(); q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v; });
      else ps.forEach(q => { q.vx = q.vy = 0; });
    }
    /* Slow motion (Daniel, 25 Oct 2026: gas particles "moving so fast" were unnerving). Real gas particles move at hundreds
       of metres every second, which no picture can show, so every picture is slowed down, by the same amount for every
       box: speeds scale with its width, so a small lens is as calm as the big box (a gas particle crosses its box in about
       two seconds). Hotter is still faster, and a gas is still faster than a liquid. */
    const W = box.x1 - box.x0, sc = W / 360;
    const speed = () => W * (.2 + .36 * T);
    function walls(q) {
      const top = box.y0 + r, bot = box.y1 - r, lft = box.x0 + r, rgt = box.x1 - r;
      if (q.x < lft) { q.x = lft; q.vx = Math.abs(q.vx); } if (q.x > rgt) { q.x = rgt; q.vx = -Math.abs(q.vx); }
      if (q.y < top) { q.y = top; q.vy = Math.abs(q.vy); } if (q.y > bot) { q.y = bot; q.vy = -Math.abs(q.vy) * (state === 'gas' ? 1 : .3); }
    }
    function collide(elastic, h) {
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, m = 2 * r;
        if (d >= m) continue;
        const nx = dx / d, ny = dy / d, push = (m - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) { const k = elastic ? 1 : .55; a.vx += nx * rv * k; a.vy += ny * rv * k; b.vx -= nx * rv * k; b.vy -= ny * rv * k; }
      }
    }
    function step(dt) {
      t += dt;
      if (morph) {                                  /* moving into a regular pattern (freezing, deposition) */
        morph.t = Math.min(1, morph.t + dt / morph.dur);
        const e = morph.t * morph.t * (3 - 2 * morph.t);
        ps.forEach((q, i) => { q.x = morph.from[i][0] + (morph.to[i][0] - morph.from[i][0]) * e; q.y = morph.from[i][1] + (morph.to[i][1] - morph.from[i][1]) * e; });
        if (morph.t >= 1) { morph = null; }
        return;
      }
      if (state === 'solid') {
        const amp = (.8 + 1.6 * T) * r / 16, w = 5 + 6 * T, s = sites().out;
        ps.forEach((q, i) => { q.sx = s[i][0]; q.sy = s[i][1]; q.x = q.sx + amp * Math.sin(w * t + q.p1); q.y = q.sy + amp * Math.cos(w * 1.13 * t + q.p2); });
        return;
      }
      const n = 3, h = dt / n;
      for (let k = 0; k < n; k++) {
        if (state === 'liquid') {
          const kick = (900 + 1300 * T) * sc * .7;
          /* a liquid fills the bottom of its container with a level top: the band its particles would fill, with a
             little room to spare, so they touch, slide past each other and never settle into neat rows */
          const band = box.y1 - ps.length * Math.PI * r * r / .72 / (box.x1 - box.x0);   /* the height the liquid fills: its particles' area ÷ 0.72 (how tightly a liquid packs) ÷ the width */
          ps.forEach(q => { q.vx += (rnd() - .5) * kick * h * 4; q.vy += (rnd() - .5) * kick * h * 4 + 160 * sc * h; if (q.y < band + r) q.vy += (band + r - q.y) * 60 * h; q.vx *= 1 - 2.2 * h; q.vy *= 1 - 2.2 * h; q.va += (rnd() - .5) * 1400 * h; q.va *= 1 - 2.5 * h; });
        } else {
          const v = speed();
          ps.forEach(q => { const sp = Math.hypot(q.vx, q.vy) || 1; const f = 1 + (v / sp - 1) * Math.min(1, 2 * h); q.vx *= f; q.vy *= f; q.va = (q.va || 60) ; });
        }
        ps.forEach(q => { q.x += q.vx * h; q.y += q.vy * h; q.a += q.va * h; });
        collide(state === 'gas', h); collide(state === 'gas'); collide(state === 'gas');
        ps.forEach(walls);
      }
    }
    function draw() {
      ps.forEach(q => q.node.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(q.a % 360).toFixed(0)})`));
      if (!bonds) return;
      while (bonds.firstChild) bonds.removeChild(bonds.firstChild);
      if (state === 'gas' && !morph) return;
      /* a hydrogen bond: from a hydrogen atom of one molecule to the oxygen atom of a neighbour, each hydrogen at most once */
      const R = r * .98, used = new Set();
      ps.forEach((a, i) => {
        const ar = a.a * Math.PI / 180, hs = [[-.72 * R, .58 * R], [.72 * R, .58 * R]].map(([x, y]) => [a.x + x * Math.cos(ar) - y * Math.sin(ar), a.y + x * Math.sin(ar) + y * Math.cos(ar)]);
        hs.forEach((hp, hi) => {
          let best = null, bd = R * 1.9;
          ps.forEach((b, j) => { if (j === i) return; const d = Math.hypot(b.x - hp[0], b.y - hp[1]); if (d < bd) { bd = d; best = b; } });
          if (best && !used.has(i + ':' + hi)) { used.add(i + ':' + hi); S('line', { x1: hp[0].toFixed(1), y1: hp[1].toFixed(1), x2: best.x.toFixed(1), y2: best.y.toFixed(1), stroke: 'var(--ink3)', 'stroke-width': 1.6, 'stroke-dasharray': '3 3', opacity: .85 }, bonds); }
        });
      });
    }
    function toState(st, dur) {
      if (st === 'solid') {
        const from = ps.map(q => [q.x, q.y]);
        const s = sites().out.slice();
        /* each particle to a near place in the pattern: both lists in the same order, bottom row first */
        const ord = ps.map((q, i) => i).sort((i, j) => (ps[j].y - ps[i].y) || (ps[i].x - ps[j].x));
        const sord = s.map((p, i) => i).sort((i, j) => (s[j][1] - s[i][1]) || (s[i][0] - s[j][0]));
        const to = new Array(ps.length);
        ord.forEach((pi, k) => { to[pi] = s[sord[k]]; });
        state = 'solid';
        morph = { from, to, t: 0, dur: (dur || 1500) / 1000 };
        ps.forEach(q => { q.vx = q.vy = 0; });
        return;
      }
      if (st === 'gas' && state !== 'gas') ps.forEach(q => { const a = -Math.PI / 2 + (rnd() - .5) * 2.4, v = speed(); q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v; });
      if (st === 'liquid' && state === 'gas') ps.forEach(q => { q.vx *= .4; q.vy *= .4; });
      if (st === 'liquid' && state === 'solid') ps.forEach(q => { q.vx = (rnd() - .5) * 320; q.vy = (rnd() - .5) * 220; q.va = (rnd() - .5) * 400; });   /* the pattern breaks up */
      state = st; morph = null;
    }
    place(state);
    return {
      ps, layer, box, step, draw, toState,
      set(st) { state = st; morph = null; place(st); },
      state: () => state, busy: () => !!morph,
      temp(v) { if (v != null) T = v; return T; },
      top(y) { box.y0 = y; ps.forEach(q => { if (q.y < y + r) q.y = y + r; }); },
      highest() { return Math.min.apply(null, ps.map(q => q.y)) - r; },
      sites
    };
  }
  window.PSIM = PSim;

  /* ================= Part 1 · Particles ================= */
  P.define(1, [{
    id: 'particles', name: 'Particles', title: 'Particles of one substance',
    alt: 'A box of particles of one substance, with a lid that can compress them, and a thermometer marked with its melting point and its boiling point',
    draw(k) {
      /* ONE substance (not water: Part 2 shows water), so its temperature decides its state (Daniel, 25 Oct 2026: a solid
         that never melted however hot it got, and three buttons that changed the state while the thermometer stood
         still, made each state look like a different substance). Below its melting point it is a solid; between its
         melting point and its boiling point, a liquid; above its boiling point, a gas. 🔥 Heat and ❄ Cool move the
         temperature one step; reaching the melting point melts it, reaching the boiling point boils it, and the
         temperature stays there while the state changes. Solid, Liquid and Gas take it to a temperature in that state.
         The thermometer has no numbers: each substance has its own melting point and boiling point. */
      const g = k.g, X0 = 60, X1 = 420, YB = 440, TOP = 128;
      const MP = .34, BP = .68, STEP = .07, AT = { solid: .1, liquid: .51, gas: .86 };
      let pistonY = TOP, target = TOP, squeezed = false, T = AT.solid, st = 'solid', t0 = AT.solid / MP;
      const inner = () => st === 'solid' ? T / MP : T;            /* the box's own scale: a solid from cold to its melting point */
      S('text', { class: 'note', x: X0, y: 466 }, g, 'Each circle is one particle of one substance. It is not water.');
      const layer = S('g', null, g);
      const outline = S('rect', { x: 0, y: 0, width: 0, height: 0, fill: 'none', stroke: '#C2410C', 'stroke-width': 3, 'stroke-dasharray': '8 6', rx: 4, opacity: 0 }, g);
      const outlineT = S('text', { class: 'lbl-sm', x: 0, y: 0, 'text-anchor': 'middle', fill: '#C2410C', opacity: 0 }, g, 'size before heating');
      const sim = PSim({ g: layer, x0: X0 + 3, x1: X1 - 3, y0: TOP + 3, y1: YB - 3, n: 32, r: 16, cols: 8, state: 'solid', T: inner(), seed: 5, grow: .3 });   /* expansion exaggerated so that it shows (Daniel, 25 Oct 2026: the dashed line looked as if it grew with the solid) */
      S('path', { d: `M${X0},${TOP - 50} L${X0},${YB} L${X1},${YB} L${X1},${TOP - 50}`, fill: 'none', stroke: 'var(--glass)', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
      const pis = S('g', null, g);
      S('rect', { x: X0 + 4, y: -14, width: X1 - X0 - 8, height: 14, rx: 3, fill: 'var(--metal-2)', stroke: 'var(--bench-edge)', 'stroke-width': 1.5 }, pis);
      S('rect', { x: (X0 + X1) / 2 - 6, y: -96, width: 12, height: 82, fill: 'var(--metal)' }, pis);
      S('rect', { x: (X0 + X1) / 2 - 30, y: -110, width: 60, height: 16, rx: 8, fill: 'var(--metal)' }, pis);
      const TX = 470, th = D.thermometer(g, TX, 270, 440, { min: 0, max: 1 });
      [[1, 'hot', 'note'], [BP, 'boiling point', 'lbl-sm'], [MP, 'melting point', 'lbl-sm'], [0, 'cold', 'note']].forEach(([v, txt, cls]) => {
        const y = th.yOf(v);
        if (cls === 'lbl-sm') S('line', { x1: TX - 9, y1: y, x2: TX + 14, y2: y, stroke: 'var(--ink2)', 'stroke-width': 2 }, g);
        S('text', { class: cls, x: TX + 20, y: y + 5 }, g, txt);
      });
      const SAY = {
        solid: '<b>Solid.</b> Below its melting point, the substance is a solid. The particles touch, in a regular pattern, and vibrate in one place. So a solid keeps its shape and its volume.',
        liquid: '<b>Liquid.</b> Between its melting point and its boiling point, the substance is a liquid. The particles touch, with no pattern, and slide past each other. So a liquid flows and takes the shape of its container, but keeps its volume.',
        gas: '<b>Gas.</b> Above its boiling point, the substance is a gas. The particles are far apart and move fast in all directions, so a gas fills its whole container. (Slow motion: in air, the particles move at about 500 metres every second.)'
      };
      const CHANGE = {
        melt: '<b>Melting.</b> At its melting point, the particles have enough energy to leave their fixed places: the solid becomes a liquid. While it melts, the temperature stays at the melting point.',
        boil: '<b>Boiling.</b> At its boiling point, the particles have enough energy to escape from the liquid and move far apart: it becomes a gas. While it boils, the temperature stays at the boiling point.',
        condense: '<b>Condensing.</b> At the boiling point, the particles lose energy and come close together again: the gas becomes a liquid.',
        freeze: '<b>Freezing.</b> At the melting point (also its freezing point), the particles lose energy and become fixed in a regular pattern: the liquid becomes a solid.'
      };
      const EXPAND = '<b>Heated:</b> the particles vibrate more and the gaps between them get bigger, so the solid expands. The orange dashed line shows its size before heating. <u>The particles do not get bigger.</u>';
      const DO = '<p><mark class="do">Press 🔥 Heat again and again, then ❄ Cool.</mark></p>';
      let lead = null;                             /* what the last press did, in place of the state's description */
      const say = () => k.say(`<p>${lead || SAY[st]}</p>` + DO);
      function setT(v) { T = Math.max(0, Math.min(1, Math.round(v * 1000) / 1000)); sim.temp(inner()); }
      function release() { if (squeezed) { squeezed = false; target = TOP; sqz.set('Compress ⬇'); } }
      function change(to, word) {
        st = to; release(); sim.temp(inner());
        sim.toState(to, to === 'solid' ? 1500 : undefined);
        if (to === 'solid') t0 = inner();
        lead = CHANGE[word];
      }
      const sb = {};
      [['solid', 'Solid', 105], ['liquid', 'Liquid', 158], ['gas', 'Gas', 211]].forEach(([s, t, y]) => {
        sb[s] = k.btn(t, 640, y, () => { st = s; T = AT[s]; release(); sim.temp(inner()); sim.set(s); t0 = inner(); lead = null; paint(); say(); }, { cls: 'ghost' });
      });
      const heat = k.btn('🔥 Heat', 690, 318, () => {
        lead = null;
        if (st === 'solid' && T + STEP >= MP - 1e-6) { setT(MP); change('liquid', 'melt'); }
        else if (st === 'liquid' && T + STEP >= BP - 1e-6) { setT(BP); change('gas', 'boil'); }
        else { setT(T + STEP); lead = st === 'solid' ? EXPAND : '<b>Heated:</b> the particles gain energy and move faster.'; }
        say(); paint();
      }, { cls: 'warm' });
      const cool = k.btn('❄ Cool', 690, 392, () => {
        lead = null;
        if (st === 'gas' && T - STEP <= BP + 1e-6) { setT(BP); change('liquid', 'condense'); }
        else if (st === 'liquid' && T - STEP <= MP + 1e-6) { setT(MP); change('solid', 'freeze'); }
        else {
          setT(T - STEP);
          if (st === 'solid') { t0 = Math.min(t0, inner()); lead = T > .005 ? '<b>Cooled:</b> the particles vibrate less and come closer: the solid contracts.' : '<b>Cooled:</b> the particles vibrate as little as they can here.'; }
          else lead = '<b>Cooled:</b> the particles lose energy and move more slowly.';
        }
        say(); paint();
      }, { cls: 'cold' });
      const sqz = k.btn('Compress ⬇', 292, 40, () => {
        lead = null;
        if (squeezed) { squeezed = false; target = TOP; sqz.set('Compress ⬇'); say(); return; }
        squeezed = true; sqz.set('Release ⬆');
        if (st === 'gas') { target = TOP + 150; lead = '<b>Compressed:</b> the gas now fills a smaller volume. There was empty space between the particles, so they could be pushed closer together. You can compress a gas.'; }
        else { target = Math.max(TOP, sim.highest() - 2); lead = '<b>The lid stops.</b> The particles already touch, so there is no empty space between them. You cannot compress a solid or a liquid.'; }
        say();
      }, { cls: 'r' });
      function paint() {
        Object.keys(sb).forEach(s => sb[s].on(s === st));
        heat.disabled = T >= 1 - 1e-6; cool.disabled = T <= 1e-6;
        th.set(T);
        /* the solid's size before heating (its coldest since it became a solid), as a dashed line, once it is warmer */
        const warmer = st === 'solid' && inner() > t0 + .02;
        if (warmer) {
          const s0 = sim.sites(t0);
          outline.setAttribute('x', (X0 + X1) / 2 - s0.w / 2 - 3); outline.setAttribute('y', YB - 3 - s0.h - 3);
          outline.setAttribute('width', s0.w + 6); outline.setAttribute('height', s0.h + 3);
          /* the label belongs to the dashed line (the size BEFORE heating), so it stays where that size was, above the
             hottest solid's top, never moving with the solid */
          outlineT.setAttribute('x', (X0 + X1) / 2); outlineT.setAttribute('y', YB - 3 - sim.sites(1).h - 12);
          outlineT.setAttribute('fill', '#C2410C');
        }
        outline.setAttribute('opacity', warmer ? 1 : 0); outlineT.setAttribute('opacity', warmer ? 1 : 0);
      }
      paint(); say();
      k.loop(dt => {
        if (Math.abs(pistonY - target) > .3) { pistonY += (target - pistonY) * Math.min(1, dt * 3.2); }
        else pistonY = target;
        pis.setAttribute('transform', `translate(0 ${pistonY.toFixed(1)})`);
        sim.top(pistonY + 2);
        sim.step(dt); sim.draw();
      });
    }
  }]);

  /* ================= Part 2 · Changes of state ================= */
  const CH = [
    { id: 'melt', name: 'melting', from: 'solid', to: 'liquid', up: true, y: 342, say: '<b>Melting</b>: a solid changes to a liquid. You heat it: the particles gain energy and vibrate faster, until they leave their fixed places in the regular pattern. They still touch, but now they slide past each other. Ice melts at 0 °C.' },
    { id: 'freeze', name: 'freezing', from: 'liquid', to: 'solid', up: false, y: 392, say: '<b>Freezing</b>: a liquid changes to a solid. It cools: the particles lose energy, move more slowly and become fixed in a regular pattern. Water freezes at 0 °C: the same temperature at which ice melts.' },
    { id: 'evap', name: 'evaporating', from: 'liquid', to: 'gas', up: true, y: 152, say: '<b>Evaporating</b> (or <b>boiling</b>): a liquid changes to a gas. The particles gain energy, escape from the liquid and move far apart. A puddle evaporates slowly from its surface; at its boiling point a liquid boils, with bubbles all through it.' },
    { id: 'cond', name: 'condensing', from: 'gas', to: 'liquid', up: false, y: 202, say: '<b>Condensing</b>: a gas changes to a liquid. It cools: the particles lose energy and come close together again. Drops of water on a cold window are water vapour from the air that has condensed.' },
    { id: 'subl', name: 'sublimation', from: 'solid', to: 'gas', up: true, y: 252, say: '<b>Sublimation</b>: a solid changes directly to a gas, with no liquid in between. Dry ice (solid carbon dioxide) does this: it never makes a puddle.' },
    { id: 'depo', name: 'deposition', from: 'gas', to: 'solid', up: false, y: 297, say: '<b>Deposition</b>: a gas changes directly to a solid, with no liquid in between. On a very cold night, water vapour in the air forms frost (a thin layer of ice) on leaves and windows.' }
  ];
  P.define(2, [{
    id: 'changes', name: 'Six changes', title: 'The six changes of state',
    alt: 'Solid, liquid and gas up an energy arrow, joined by six arrows; a lens shows the particles change',
    draw(k) {
      const g = k.g, CX = 180, Y = { gas: 92, liquid: 252, solid: 412 };
      /* the energy arrow (the pupils' own slide: states up an energy arrow) */
      S('line', { x1: 34, y1: 470, x2: 34, y2: 46, stroke: 'var(--ink3)', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
      D.arrowHead(g, 34, 34, -Math.PI / 2, 16, 'var(--ink3)');
      S('text', { class: 'note', x: 0, y: 0, transform: 'translate(24 260) rotate(-90)', 'text-anchor': 'middle' }, g, 'more energy ↑');
      /* the three states, each a small box of moving particles */
      const mini = {};
      ['gas', 'liquid', 'solid'].forEach((s, i) => {
        const y = Y[s];
        S('rect', { class: 'card', x: CX - 78, y: y - 62, width: 156, height: 124, rx: 12 }, g);
        S('rect', { class: 'box', x: CX - 64, y: y - 52, width: 128, height: 78, rx: 6, 'stroke-width': 2 }, g);
        const lay = S('g', null, g);
        mini[s] = PSim({ g: lay, x0: CX - 62, x1: CX + 62, y0: y - 50, y1: y + 24, n: 12, r: 7.5, cols: 6, state: s, T: .3, seed: 11 + i });
        S('text', { class: 'ttl', x: CX, y: y + 52, 'text-anchor': 'middle' }, g, s.toUpperCase());
      });
      /* the six arrows: up = heating (red), down = cooling (blue) */
      const AX = { melt: 282, freeze: 312, evap: 282, cond: 312, subl: 352, depo: 384 };
      const ends = { melt: [Y.solid - 18, Y.liquid + 22], freeze: [Y.liquid + 22, Y.solid - 18], evap: [Y.liquid - 18, Y.gas + 22], cond: [Y.gas + 22, Y.liquid - 18], subl: [Y.solid + 10, Y.gas - 10], depo: [Y.gas - 10, Y.solid + 10] };
      const arrows = {};
      CH.forEach(c => {
        const x = AX[c.id], [y1, y2] = ends[c.id], col = c.up ? '#C2410C' : '#1D5FBF';
        const a = S('g', { opacity: .85 }, g);
        S('line', { x1: x, y1, x2: x, y2: y2 + (c.up ? 12 : -12), stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round' }, a);
        D.arrowHead(a, x, y2, c.up ? -Math.PI / 2 : Math.PI / 2, 16, col);
        arrows[c.id] = a;
      });
      /* the lens where the chosen change happens */
      const LX = 682, LY = 262, LR = 102;
      const cid = D.id('lens'), defs = S('defs', null, g), cp = S('clipPath', { id: cid }, defs);
      S('circle', { cx: LX, cy: LY, r: LR - 3 }, cp);
      S('circle', { class: 'lens-ring', cx: LX, cy: LY, r: LR }, g);
      const inner = S('g', { 'clip-path': `url(#${cid})` }, g);
      const lens = PSim({ g: inner, x0: LX - 70, x1: LX + 70, y0: LY - 66, y1: LY + 60, n: 20, r: 10.5, cols: 6, state: 'solid', T: .3, seed: 4 });
      const lt = S('text', { class: 'ttl', x: LX, y: LY - LR - 16, 'text-anchor': 'middle' }, g, 'Press a change');
      const ls = S('text', { class: 'note', x: LX, y: LY + LR + 28, 'text-anchor': 'middle' }, g, 'Each circle is one particle.');
      const le = S('text', { class: 'note', x: LX, y: LY + LR + 50, 'text-anchor': 'middle' }, g, '');
      const btns = {};
      let playing = null;
      CH.forEach(c => {
        btns[c.id] = k.btn((c.up ? '▲ ' : '▼ ') + c.name, 412, c.y, () => play(c), { cls: (c.up ? 'warm' : 'cold') + ' r small' });
      });
      async function play(c) {
        playing = c;
        Object.keys(arrows).forEach(id => { arrows[id].setAttribute('opacity', id === c.id ? 1 : .25); });
        Object.keys(btns).forEach(id => btns[id].on(id === c.id));
        lt.textContent = c.name.charAt(0).toUpperCase() + c.name.slice(1);
        ls.textContent = c.from + ' → ' + c.to;
        le.textContent = c.up ? '🔥 heating: energy in' : '❄ cooling: energy out';
        k.say('<p>' + c.say + '</p><p><mark class="do">Press another change.</mark> Red arrows need heating; blue arrows happen on cooling.</p>');
        lens.temp(c.from === 'solid' ? .2 : c.from === 'liquid' ? .4 : .7);
        lens.set(c.from);
        if (!(await k.wait(900)) || playing !== c) return;
        lens.temp(c.to === 'solid' ? .2 : c.to === 'liquid' ? .4 : .7);
        lens.toState(c.to, 1600);
      }
      k.say('<p>Heating gives the particles more energy, so the substance moves UP the arrow; cooling moves it down.</p><p><mark class="do">Press each change on the right to see what happens to the particles.</mark></p>');
      k.loop(dt => { Object.values(mini).forEach(m => { m.step(dt); m.draw(); }); lens.step(dt); lens.draw(); });
    }
  }, {
    id: 'water', name: 'Heat and cool water', title: 'Heat and cool water',
    alt: 'A beaker of ice on a hot plate, a thermometer, and a lens showing water molecules',
    draw(k) {
      const g = k.g;
      /* the hot plate, the beaker and the thermometer */
      S('rect', { class: 'metal', x: 70, y: 430, width: 250, height: 26, rx: 6 }, g);
      const ring = S('rect', { x: 118, y: 421, width: 154, height: 10, rx: 4, fill: '#8C939C' }, g);
      const bk = D.beaker(g, 195, 420, 170, 220, { color: '#9CC8EE', level: .5, opacity: .7 });
      const ice = S('g', null, g), blk = S('g', { opacity: 0 }, g), bubbles = S('g', null, g), steam = S('g', null, g);
      let block = false;            /* ice cubes at first; water that freezes in the beaker becomes one block of ice */
      S('rect', { x: 113, y: 290, width: 164, height: 127, rx: 5, fill: '#E6F4FB', stroke: '#8DB8D3', 'stroke-width': 2 }, blk);
      [[140, 312, 60], [170, 352, 70], [200, 392, 48]].forEach(([x, y, w]) => S('line', { x1: x, y1: y, x2: x + w, y2: y - 14, stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .9 }, blk));
      const cubes = [[150, 316], [196, 324], [238, 314], [168, 352], [222, 356], [195, 388], [150, 392], [240, 390]];
      cubes.forEach(([x, y], i) => S('rect', { x: x - 20, y: y - 18, width: 40, height: 36, rx: 7, fill: '#E6F4FB', stroke: '#8DB8D3', 'stroke-width': 2, transform: `rotate(${(i * 23) % 30 - 15} ${x} ${y})` }, ice));
      const th = D.thermometer(g, 380, 60, 440, { min: -20, max: 110, ticks: [-20, 0, 20, 40, 60, 80, 100] });
      /* the lens: water molecules */
      const LX = 640, LY = 205, LR = 118;
      const cid = D.id('lens'), defs = S('defs', null, g), cp = S('clipPath', { id: cid }, defs);
      S('circle', { cx: LX, cy: LY, r: LR - 3 }, cp);
      S('circle', { class: 'lens-ring', cx: LX, cy: LY, r: LR }, g);
      const inner = S('g', { 'clip-path': `url(#${cid})` }, g);
      const lens = PSim({ g: inner, x0: LX - 86, x1: LX + 86, y0: LY - 84, y1: LY + 74, n: 15, r: 15, cols: 5, kind: 'H2O', hb: true, state: 'solid', T: .1, seed: 8 });
      const lt = S('text', { class: 'ttl', x: LX, y: LY + LR + 28, 'text-anchor': 'middle' }, g, 'Ice');
      S('text', { class: 'note', x: LX, y: LY + LR + 50, 'text-anchor': 'middle' }, g, 'water molecules · - - - hydrogen bonds');
      const rec = S('g', null, g);
      let temp = -20, phase = 'ice', frac = 0;
      const seen = {};
      function scene() {
        th.set(temp);
        ring.setAttribute('fill', heatOn ? '#E2572B' : '#8C939C');
        const solidPart = phase === 'ice' ? 1 : phase === 'melting' ? 1 - frac : phase === 'freezing' ? frac : 0;
        ice.setAttribute('opacity', block ? 0 : solidPart);
        blk.setAttribute('opacity', block ? solidPart : 0);
        bk.liq.set(phase === 'boiling' ? .58 - .14 * frac : .58 * (1 - solidPart));
        lt.textContent = { ice: 'Ice (solid)', melting: 'Ice melting', water: 'Water (liquid)', freezing: 'Water freezing', boiling: 'Water boiling' }[phase];
        const r = [];
        if (seen.melt) r.push('melting point 0 °C'); if (seen.freeze) r.push('freezing point 0 °C'); if (seen.boil) r.push('boiling point 100 °C');
        while (rec.firstChild) rec.removeChild(rec.firstChild);
        if (r.length) { S('text', { class: 'lbl-sm', x: 40, y: 40 }, rec, 'You saw:'); r.forEach((t, i) => S('text', { class: 'lbl-sm', x: 40, y: 66 + i * 24 }, rec, '✓ ' + t)); }
      }
      let heatOn = false;
      const SAY = {
        ice: () => temp < 0 ? `<b>Ice at ${temp === 0 ? 0 : '−' + (-temp)} °C.</b> The water molecules are held in a regular pattern by forces of attraction between them (the dashed lines: hydrogen bonds). They vibrate in place.` : '<b>Ice at 0 °C.</b> Heat it once more and it starts to melt.',
        melting: () => '<b>Melting at 0 °C.</b> The molecules gain energy and leave their fixed places in the pattern. While the ice melts, the thermometer stays at 0 °C.',
        water: () => `<b>Liquid water at ${temp} °C.</b> The molecules touch and slide past each other; hydrogen bonds break and form again all the time.`,
        freezing: () => '<b>Freezing at 0 °C.</b> The molecules lose energy and become fixed in a regular pattern again: the same temperature as melting.',
        boiling: () => '<b>Boiling at 100 °C.</b> Molecules escape from the liquid as a gas (steam). Bubbles of steam form all through the water.'
      };
      const say = () => k.say('<p>' + SAY[phase]() + '</p><p><mark class="do">Press 🔥 Heat or ❄ Cool, one step at a time.</mark></p>');
      function heatStep() {
        heatOn = true;
        if (phase === 'ice' && temp < 0) temp += 10;
        else if (phase === 'ice') { phase = 'melting'; frac = 0; lens.temp(.4); lens.toState('liquid'); seen.melt = 1; frac = .34; }
        else if (phase === 'melting' || phase === 'freezing') { if (phase === 'freezing') { phase = 'melting'; frac = 1 - frac; lens.toState('liquid'); } frac += .33; if (frac > .99) { phase = 'water'; frac = 0; } }
        else if (phase === 'water' && temp < 100) temp = Math.min(100, temp + 20);
        else if (phase === 'water') { phase = 'boiling'; frac = .34; seen.boil = 1; }
        else if (phase === 'boiling') frac = Math.min(1, frac + .33);
        lens.temp(phase === 'ice' ? .1 + (temp + 20) / 60 : phase === 'boiling' ? 1 : .35 + temp / 250);
        scene(); say(); btnState();
      }
      function coolStep() {
        heatOn = false;
        if (phase === 'boiling') { phase = 'water'; frac = 0; }
        else if (phase === 'water' && temp > 0) temp = Math.max(0, temp - 20);
        else if (phase === 'water') { phase = 'freezing'; frac = .34; seen.freeze = 1; block = true; lens.temp(.15); lens.toState('solid', 1800); }
        else if (phase === 'freezing' || phase === 'melting') { if (phase === 'melting') { phase = 'freezing'; frac = 1 - frac; seen.freeze = 1; block = true; lens.temp(.15); lens.toState('solid', 1800); } frac += .33; if (frac > .99) { phase = 'ice'; frac = 0; } }
        else if (phase === 'ice' && temp > -20) temp -= 10;
        lens.temp(phase === 'ice' ? .1 + (temp + 20) / 60 : phase === 'boiling' ? 1 : .35 + temp / 250);
        scene(); say(); btnState();
      }
      const hb = k.btn('🔥 Heat', 560, 462, heatStep, { cls: 'warm' });
      const cb = k.btn('❄ Cool', 700, 462, coolStep, { cls: 'cold' });
      function btnState() { hb.disabled = phase === 'boiling' && frac >= 1; cb.disabled = phase === 'ice' && temp <= -20; }
      scene(); say(); btnState();
      let acc = 0;
      k.loop(dt => {
        lens.step(dt); lens.draw();
        /* bubbles and steam while boiling */
        acc += dt;
        if (acc > .12) {
          acc = 0;
          while (bubbles.firstChild) bubbles.removeChild(bubbles.firstChild);
          while (steam.firstChild) steam.removeChild(steam.firstChild);
          if (phase === 'boiling') {
            const top = bk.liq.y();
            for (let i = 0; i < 9; i++) { const x = 130 + Math.random() * 130, y = top + 10 + Math.random() * (410 - top); S('circle', { cx: x, cy: y, r: 3 + Math.random() * 4, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.6, opacity: .9 }, bubbles); }
            for (let i = 0; i < 4; i++) { const x = 140 + i * 30 + Math.random() * 10, y = 180 - Math.random() * 30; S('path', { d: `M${x},${y} q-10,-14 0,-28 q10,-14 0,-28`, fill: 'none', stroke: 'var(--ink3)', 'stroke-width': 2.2, opacity: .5, 'stroke-linecap': 'round' }, steam); }
          }
        }
      });
    }
  }]);

  /* ================= Part 3 · Inside an atom, and the elements ================= */
  P.define(3, [{
    id: 'atom', name: 'Inside an atom', title: 'Inside an atom',
    alt: 'An atom: protons and neutrons in the nucleus, electrons moving around it',
    draw(k) {
      const g = k.g, AX = 270, AY = 250;
      const ATOMS = { He: { name: 'Helium', p: 2, n: 2, shells: [2] }, C: { name: 'Carbon', p: 6, n: 6, shells: [2, 4] } };
      let which = 'He', focus = null, electrons = [];
      const lay = S('g', null, g);
      function build() {
        while (lay.firstChild) lay.removeChild(lay.firstChild);
        const A = ATOMS[which];
        electrons = [];
        A.shells.forEach((n, si) => {
          const R = 105 + si * 75;
          S('circle', { cx: AX, cy: AY, r: R, fill: 'none', stroke: 'var(--ink3)', 'stroke-width': 1.6, 'stroke-dasharray': '5 6', opacity: .7 }, lay);
          for (let i = 0; i < n; i++) electrons.push({ R, a: i * 2 * Math.PI / n + si * .5, w: .55 - si * .15 });
        });
        /* the nucleus: protons (+) and neutrons packed together */
        const nuc = S('g', { class: 'nuc' }, lay), parts = [];
        for (let i = 0; i < A.p; i++) parts.push('p'); for (let i = 0; i < A.n; i++) parts.push('n');
        const rr = 13, rnd = D.rng(which === 'He' ? 3 : 9);
        parts.sort(() => rnd() - .5);
        const pos = which === 'He' ? [[-11, -9], [11, -9], [-11, 10], [11, 10]] : [[0, 0], [-22, -6], [22, -6], [-11, -24], [11, -24], [-11, 16], [11, 16], [-26, 16], [26, 16], [0, 32], [0, -38], [-28, -26]];
        parts.forEach((t, i) => {
          const [x, y] = pos[i];
          const gg = S('g', { class: t === 'p' ? 'proton' : 'neutron' }, nuc);
          S('circle', { cx: AX + x, cy: AY + y, r: rr, fill: t === 'p' ? '#D9483B' : '#9AA3AE', stroke: t === 'p' ? '#8E2A1D' : '#5B6573', 'stroke-width': 1.4 }, gg);
          S('text', { x: AX + x, y: AY + y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 900, fill: '#FFFFFF' }, gg, t === 'p' ? '+' : '');
        });
        electrons.forEach(e => {
          e.node = S('g', { class: 'electron' }, lay);
          S('circle', { cx: 0, cy: 0, r: 11, fill: '#2E7FD9', stroke: '#174C88', 'stroke-width': 1.4 }, e.node);
          S('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 900, fill: '#FFFFFF' }, e.node, '−');
        });
        paintFocus(); count();
      }
      /* the key and the count, on the right */
      S('text', { class: 'ttl', x: 540, y: 196 }, g, 'Key');
      const key = [['#D9483B', '+', 'proton: + charge (nucleus)'], ['#9AA3AE', '', 'neutron: no charge (nucleus)'], ['#2E7FD9', '−', 'electron: − charge (around it)']];
      key.forEach(([c, sgn, t], i) => {
        const y = 226 + i * 34;
        S('circle', { cx: 552, cy: y, r: 11, fill: c }, g); S('text', { x: 552, y: y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 900, fill: '#FFF' }, g, sgn);
        S('text', { class: 'note', x: 572, y: y + 5 }, g, t);
      });
      const cnt = S('text', { class: 'lbl-sm', x: 540, y: 350 }, g, ''), cnt2 = S('text', { class: 'lbl-sm', x: 540, y: 376 }, g, ''), cnt3 = S('text', { class: 'lbl-sm', x: 540, y: 402 }, g, '');
      S('text', { class: 'note', x: 40, y: 486 }, g, 'Not to scale: a real nucleus is about 100 000 times smaller than its atom.');
      function count() {
        const A = ATOMS[which];
        cnt.textContent = `${A.name}: ${A.p} protons: +${A.p}`;
        cnt2.textContent = `${A.p} electrons: −${A.p} · ${A.n} neutrons: 0`;
        cnt3.textContent = 'Overall charge: 0';
      }
      function paintFocus() {
        lay.querySelectorAll('.proton').forEach(e => e.setAttribute('opacity', !focus || focus === 'p' ? 1 : .2));
        lay.querySelectorAll('.neutron').forEach(e => e.setAttribute('opacity', !focus || focus === 'n' ? 1 : .2));
        electrons.forEach(e => e.node.setAttribute('opacity', !focus || focus === 'e' ? 1 : .2));
      }
      const SAYF = {
        p: '<b>Protons</b> are in the nucleus, the tiny centre of the atom. Each has a <b>positive charge (+)</b>. The number of protons decides the element: every helium atom has 2, every carbon atom has 6.',
        n: '<b>Neutrons</b> are in the nucleus too. They have <b>no charge</b>: they are neutral.',
        e: '<b>Electrons</b> move around the nucleus. Each has a <b>negative charge (−)</b>. An atom has as many electrons as protons, so the charges cancel: the atom has no overall charge.'
      };
      const tb = {};
      [['He', 'Helium', 560], ['C', 'Carbon', 680]].forEach(([s, t, x]) => { tb[s] = k.btn(t, x, 60, () => { which = s; build(); paintT(); }, { cls: 'ghost' }); });
      const fb = {};
      [['p', 'Protons', 532], ['n', 'Neutrons', 632], ['e', 'Electrons', 740]].forEach(([s, t, x]) => { fb[s] = k.btn(t, x, 130, () => { focus = focus === s ? null : s; paintFocus(); paintT(); k.say('<p>' + (focus ? SAYF[focus] : 'All three kinds of particle.') + '</p><p><mark class="do">Press Protons, Neutrons or Electrons. Then compare helium and carbon.</mark></p>'); }, { cls: 'small' }); });
      function paintT() { Object.keys(tb).forEach(s => tb[s].on(s === which)); Object.keys(fb).forEach(s => fb[s].on(s === focus)); }
      build(); paintT();
      k.say('<p>An atom is the smallest particle of an element. In its centre is the nucleus: protons and neutrons. Electrons move around it.</p><p><mark class="do">Press Protons, Neutrons or Electrons. Then compare helium and carbon.</mark></p>');
      k.loop((dt, t) => { electrons.forEach(e => { const a = e.a + t * e.w; e.node.setAttribute('transform', `translate(${(AX + e.R * Math.cos(a)).toFixed(1)} ${(AY + e.R * Math.sin(a)).toFixed(1)})`); }); });
    }
  }, {
    id: 'table', name: 'The elements', title: 'The elements to know, on the periodic table',
    alt: 'A simple periodic table with the thirteen elements to know coloured: metals blue, non-metals green',
    draw(k) {
      const g = k.g, X = 40, Y = 64, CW = 40, CH = 44;
      /* where each element sits (row, column) in the periodic table */
      const EL = {
        H: [1, 1, 'hydrogen', 'nm', 'gas'], He: [1, 18, 'helium', 'nm', 'gas'], C: [2, 14, 'carbon', 'nm', 'solid'], N: [2, 15, 'nitrogen', 'nm', 'gas'],
        O: [2, 16, 'oxygen', 'nm', 'gas'], Na: [3, 1, 'sodium', 'm', 'solid'], Al: [3, 13, 'aluminium', 'm', 'solid'], Cl: [3, 17, 'chlorine', 'nm', 'gas'],
        Ca: [4, 2, 'calcium', 'm', 'solid'], Fe: [4, 8, 'iron', 'm', 'solid'], Cu: [4, 11, 'copper', 'm', 'solid'], Ag: [5, 11, 'silver', 'm', 'solid'],
        Au: [6, 11, 'gold', 'm', 'solid'], Br: [4, 17, 'bromine', 'nm', 'liquid', 1], Hg: [6, 12, 'mercury', 'm', 'liquid', 1]
      };
      const cell = (r, c) => [X + (c - 1) * CW, Y + (r - 1) * CH];
      const exists = (r, c) => r === 1 ? (c === 1 || c === 18) : r <= 3 ? (c <= 2 || c >= 13) : true;
      for (let r = 1; r <= 6; r++) for (let c = 1; c <= 18; c++) if (exists(r, c)) { const [x, y] = cell(r, c); S('rect', { x: x + 1, y: y + 1, width: CW - 2, height: CH - 2, rx: 4, fill: 'var(--surface)', stroke: 'var(--rule2)', 'stroke-width': 1 }, g); }
      /* the zigzag line between metals (left) and non-metals (right) */
      const zig = [[2, 13], [3, 14], [4, 15], [5, 16], [6, 17]];
      let d = `M${X + 12 * CW},${Y + CH}`;
      zig.forEach(([r, c]) => { d += ` L${X + (c - 1) * CW},${Y + (r - 1) * CH} L${X + (c - 1) * CW},${Y + r * CH}`; });
      S('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
      const info = S('g', null, g);
      function show(sym) {
        while (info.firstChild) info.removeChild(info.firstChild);
        const e = EL[sym];
        S('rect', { class: 'card', x: 40, y: 352, width: 720, height: 104, rx: 12 }, info);
        S('rect', { x: 58, y: 366, width: 76, height: 76, rx: 10, fill: e[3] === 'm' ? '#3F6FD8' : '#2E8B57' }, info);
        S('text', { x: 96, y: 418, 'text-anchor': 'middle', 'font-size': 36, 'font-weight': 900, fill: '#FFFFFF' }, info, sym);
        S('text', { class: 'ttl', x: 152, y: 396 }, info, e[2].charAt(0).toUpperCase() + e[2].slice(1));
        S('text', { class: 'note', x: 152, y: 424 }, info, (e[3] === 'm' ? 'a metal' : 'a non-metal') + ' · ' + e[4] + ' at room temperature' + (e[5] ? ' · not on your list: one of only two liquid elements' : ''));
      }
      Object.keys(EL).forEach(sym => {
        const e = EL[sym], [x, y] = cell(e[0], e[1]), extra = !!e[5];
        const gg = S('g', { tabindex: 0, role: 'button', 'aria-label': e[2], style: 'cursor:pointer' }, g);
        S('rect', { x: x + 1, y: y + 1, width: CW - 2, height: CH - 2, rx: 4, fill: extra ? 'var(--sheet)' : e[3] === 'm' ? '#3F6FD8' : '#2E8B57', stroke: extra ? 'var(--ink3)' : 'none', 'stroke-dasharray': extra ? '3 3' : null }, gg);
        S('text', { x: x + CW / 2, y: y + 28, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 900, fill: extra ? 'var(--ink2)' : '#FFFFFF' }, gg, sym);
        const go = () => { show(sym); k.say('<p><b>' + sym + ' = ' + e[2] + '.</b> A symbol has one capital letter, sometimes followed by one small letter.</p><p><mark class="do">Press another element.</mark></p>'); };
        gg.addEventListener('click', go); gg.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
      });
      /* the key */
      S('rect', { x: 120, y: 18, width: 18, height: 18, rx: 4, fill: '#3F6FD8' }, g); S('text', { class: 'note', x: 144, y: 33 }, g, 'metal');
      S('rect', { x: 210, y: 18, width: 18, height: 18, rx: 4, fill: '#2E8B57' }, g); S('text', { class: 'note', x: 234, y: 33 }, g, 'non-metal');
      S('line', { x1: 330, y1: 27, x2: 360, y2: 27, stroke: 'var(--ink)', 'stroke-width': 4 }, g); S('text', { class: 'note', x: 366, y: 33 }, g, 'metals to the left, non-metals to the right');
      show('Fe');
      k.say('<p>The 13 elements you need are coloured. Metals are to the left of the zigzag line; non-metals are to the right (hydrogen is a non-metal at the top left).</p><p><mark class="do">Press each coloured element to see its name, and whether it is a metal.</mark></p>');
    }
  }]);

  /* ================= Part 4 · Boxes of particles, and iron and sulfur ================= */
  P.define(4, [{
    id: 'boxes', name: 'Boxes of particles', title: 'Element, compound or mixture?',
    alt: 'Six boxes of particles: helium, oxygen, steam, carbon dioxide, air and salt',
    draw(k) {
      const g = k.g, L = 150;
      const BOX = [
        { n: 'helium', parts: [['He', 9]], o: { R: 17, seed: 7 }, say: '<b>Helium: an element.</b> Every particle is a single atom, and every atom is the same: helium.' },
        { n: 'oxygen', parts: [['O2', 7]], o: { R: 16, seed: 3 }, say: '<b>Oxygen: an element.</b> Each molecule has two atoms joined (O₂), but both are oxygen: only one type of atom. Oxygen is diatomic.' },
        { n: 'steam (water)', parts: [['H2O', 7]], o: { R: 16, seed: 12 }, say: '<b>Water: a compound.</b> Every molecule is the same, and each has two different elements joined: 2 hydrogen atoms and 1 oxygen atom (H₂O).' },
        { n: 'carbon dioxide', parts: [['CO2', 6]], o: { R: 14, seed: 5, gap: 3.4 }, say: '<b>Carbon dioxide: a compound.</b> Every molecule has 1 carbon atom joined to 2 oxygen atoms (CO₂).' },
        { n: 'air', parts: [['N2', 5], ['O2', 2], ['Ar', 1]], o: { R: 15, seed: 21 }, say: '<b>Air: a mixture.</b> Nitrogen molecules, oxygen molecules and argon atoms: different particles, not joined to each other.' },
        { n: 'salt', lattice: true, say: '<b>Salt (sodium chloride): a compound.</b> Two different elements, joined in a fixed ratio: one sodium for each chlorine. It is made of ions (+ and −) in a lattice, not molecules.' }
      ];
      const sel = S('rect', { x: 0, y: 0, width: L + 16, height: L + 16, rx: 14, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 4, opacity: 0 }, g);
      BOX.forEach((b, i) => {
        const x = 60 + (i % 3) * 240, y = 30 + Math.floor(i / 3) * 222;
        const gg = S('g', { tabindex: 0, role: 'button', 'aria-label': b.n, style: 'cursor:pointer' }, g);
        if (b.lattice) { S('rect', { class: 'box', x, y, width: L, height: L, rx: 8 }, gg); D.lattice(gg, x + 27, y + 27, 5, 5, 24, 'Na', 'Cl', { signs: true }); }
        else D.particleBox(gg, x, y, L, b.parts, b.o);
        S('text', { class: 'lbl', x: x + L / 2, y: y + L + 28, 'text-anchor': 'middle' }, gg, b.n);
        const go = () => { sel.setAttribute('x', x - 8); sel.setAttribute('y', y - 8); sel.setAttribute('opacity', 1); k.say('<p>' + b.say + '</p><p><mark class="do">Press another box.</mark></p>'); };
        gg.addEventListener('click', go); gg.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
      });
      /* the key: every circle named by what it draws */
      const KEYS = [['H', 'hydrogen'], ['O', 'oxygen'], ['C', 'carbon'], ['N', 'nitrogen'], ['He', 'helium'], ['Ar', 'argon'], ['Na', 'sodium ion (+)'], ['Cl', 'chloride ion (−)']];
      KEYS.forEach(([el, t], i) => { const x = 40 + (i % 4) * 190, y = i < 4 ? 452 : 484; D.atom(g, x, y, 9, el); S('text', { class: 'note', x: x + 16, y: y + 6 }, g, t); });
      k.say('<p>Every circle is one atom (or ion). Atoms touching are joined in a molecule.</p><p><mark class="do">Press each box: is it an element, a compound or a mixture?</mark></p>');
    }
  }, {
    id: 'fes', name: 'Iron and sulfur', title: 'Iron and sulfur: a mixture, then a compound',
    alt: 'Iron filings and sulfur powder mixed in a dish; a magnet; after heating, iron sulfide',
    draw(k) {
      const g = k.g;
      let stage = 'mix';
      const dish = S('g', null, g), prod = S('g', null, g), mag = S('g', null, g);
      /* the dish of the mixture: grey iron filings and yellow sulfur powder */
      S('ellipse', { cx: 230, cy: 380, rx: 160, ry: 40, fill: 'var(--glass-fill)', stroke: 'var(--glass)', 'stroke-width': 2.4 }, dish);
      const rnd = D.rng(13), filings = [], sulfur = [];
      for (let i = 0; i < 70; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()); const x = 230 + Math.cos(a) * rr * 130, y = 380 + Math.sin(a) * rr * 28; sulfur.push(S('circle', { cx: x, cy: y, r: 3.4, fill: '#E5C53A' }, dish)); }
      for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()); const x = 230 + Math.cos(a) * rr * 128, y = 378 + Math.sin(a) * rr * 26, ang = rnd() * 180; filings.push({ x, y, ang, n: S('rect', { x: -5, y: -1.4, width: 10, height: 2.8, rx: 1.2, fill: '#4A4F57', transform: `translate(${x} ${y}) rotate(${ang})` }, dish) }); }
      /* the product: a dark grey lump in a test tube */
      const tube = S('g', { opacity: 0 }, prod);
      S('path', { d: 'M560,140 L560,350 Q560,384 590,384 Q620,384 620,350 L620,140', fill: 'var(--glass-fill)', stroke: 'var(--glass)', 'stroke-width': 2.4 }, tube);
      const lump = S('path', { d: 'M564,330 Q590,318 616,330 L616,350 Q616,380 590,380 Q564,380 564,350 Z', fill: '#E5C53A' }, tube);
      const glow = S('circle', { cx: 590, cy: 352, r: 0, fill: '#FF7A1A', opacity: .0 }, tube);
      const burner = D.bunsen(tube, 590, 470, { h: 60, flame: 48 });
      /* the magnet */
      S('path', { d: 'M-34,-60 L-34,0 A34,34 0 0 0 34,0 L34,-60 L18,-60 L18,0 A18,18 0 0 1 -18,0 L-18,-60 Z', fill: '#D22F27', stroke: '#7A1712', 'stroke-width': 1.5 }, mag);
      S('rect', { x: -34, y: -76, width: 16, height: 16, fill: '#C9CFD6' }, mag); S('rect', { x: 18, y: -76, width: 16, height: 16, fill: '#C9CFD6' }, mag);
      mag.setAttribute('transform', 'translate(230 120) rotate(180)');
      const lt = S('text', { class: 'ttl', x: 40, y: 40 }, g, 'The mixture: iron filings and sulfur powder');
      const SAY = {
        mix: '<b>A mixture.</b> The grey iron and the yellow sulfur are not joined. Each keeps its own properties.',
        pulled: '<b>The magnet pulls out the iron.</b> In a mixture, iron is still magnetic, so a magnet can separate it from the sulfur.',
        heated: '<b>Heated: a chemical reaction.</b> The iron and sulfur join and make a new substance, iron sulfide (FeS), a dark grey solid.',
        tested: '<b>Nothing moves.</b> Iron sulfide is a compound with new properties: it is not magnetic, and it is not yellow. A magnet cannot separate the iron from it.'
      };
      const DO = { mix: 'Press Magnet, or Heat it.', pulled: 'Press Mix again, then Heat it.', heated: 'Press Magnet to test the new substance.', tested: 'Press Start again to repeat.' };
      const say = () => k.say(`<p>${SAY[stage]}</p><p><mark class="do">${DO[stage]}</mark></p>`);
      async function magnetDish() {
        await k.anim(700, t => mag.setAttribute('transform', `translate(230 ${120 + 150 * t}) rotate(180)`));
        await k.anim(900, t => filings.forEach((f, i) => { const tx = 230 + (i % 2 ? 26 : -26) + (i % 5 - 2) * 3, ty = 350 + (i % 7) * 2.2; f.n.setAttribute('transform', `translate(${f.x + (tx - f.x) * t} ${f.y + (ty - f.y) * t}) rotate(${f.ang * (1 - t) + 90 * t})`); }));
        stage = 'pulled'; say(); paint();
      }
      async function mixAgain() {
        filings.forEach(f => f.n.setAttribute('transform', `translate(${f.x} ${f.y}) rotate(${f.ang})`));
        mag.setAttribute('transform', 'translate(230 120) rotate(180)');
        stage = 'mix'; say(); paint();
      }
      async function heat() {
        dish.setAttribute('opacity', 0); tube.setAttribute('opacity', 1); burner.on(true);
        lt.textContent = 'Heating the mixture in a test tube';
        await k.anim(2200, t => { glow.setAttribute('r', 6 + 22 * t); glow.setAttribute('opacity', (Math.sin(t * Math.PI) * .9).toFixed(2)); lump.setAttribute('fill', t < .5 ? '#E5C53A' : '#2F3136'); });
        burner.on(false); glow.setAttribute('opacity', 0);
        lt.textContent = 'The new substance: iron sulfide';
        stage = 'heated'; say(); paint();
        mag.setAttribute('transform', 'translate(590 60) rotate(180)');
      }
      async function testProduct() {
        await k.anim(700, t => mag.setAttribute('transform', `translate(590 ${60 + 150 * t}) rotate(180)`));
        stage = 'tested'; say(); paint();
      }
      const bm = k.btn('🧲 Magnet', 470, 170, () => { if (stage === 'mix') magnetDish(); else if (stage === 'heated') testProduct(); });
      const bx = k.btn('Mix again', 470, 230, mixAgain, { cls: 'ghost' });
      const bh = k.btn('🔥 Heat it', 470, 290, heat, { cls: 'warm' });
      const br = k.btn('↺ Start again', 470, 350, () => { tube.setAttribute('opacity', 0); dish.setAttribute('opacity', 1); lump.setAttribute('fill', '#E5C53A'); lt.textContent = 'The mixture: iron filings and sulfur powder'; mixAgain(); }, { cls: 'ghost' });
      function paint() {
        bm.disabled = !(stage === 'mix' || stage === 'heated');
        bx.disabled = stage !== 'pulled'; bh.disabled = stage !== 'mix'; br.disabled = !(stage === 'tested' || stage === 'heated');
      }
      say(); paint();
    }
  }]);
})();
