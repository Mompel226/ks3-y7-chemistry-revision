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
          cols (solid), hb (draw hydrogen bonds), seed,
          grow (how much wider the gaps of a solid get from cold to hot: 0.16), gap0 (the gap between neighbours in the
          coldest solid, as a part of a particle's width: 0), solidT (the temperature as the solid's own scale: the same),
          liqGap (the smallest gap between two particles of the liquid: 0, touching), liqKick (how hard the liquid's
          particles jiggle: 1; the ice-and-water zoom uses more, so its melt is seen sliding, 26 Oct 2026), smooth (the
          liquid drifts in slow, smooth currents instead of jittering: "more flowing", Daniel, 26 Oct 2026), exitTop
          (the box is a window on the water's surface: a gas particle rises out of its top and is gone for good, as steam
          leaves a beaker), section (the box is a piece of a bigger body of water: a liquid or gas particle that leaves
          one side comes back in at the other, out of sight first, so particles slide in and out of view and are held
          by neighbours, never by walls; Daniel, 26 Oct 2026), evap () → particles per second that evaporate from the
          surface at that moment (any temperature: Daniel, same message), refill () → true while an evaporated particle
          is replaced by one drifting in from the water around the window }
     Each particle has its own state (ph: s fixed in the regular pattern, l liquid, g gas), so a change of state happens a
     part at a time, the way it does (Daniel, 25 Oct 2026: a solid that melted all at once, in a burst, "makes absolute no
     sense"). Melting, sublimation and evaporation take the particles at the SURFACE first; freezing and deposition fill
     the pattern from its middle and bottom; condensing takes the lowest gas particles first. mix(a, b, f, ms) moves
     particles between two states (a has less energy) until the part f of them is in b, one after another over ms: a press
     of Heat at the melting point is a third more; toState(st, ms) is a whole change, one after another. */
  function PSim(o) {
    const rnd = D.rng(o.seed || 3), ps = [], layer = S('g', null, o.g), bonds = o.hb ? S('g', null, layer) : null;
    const box = { x0: o.x0, x1: o.x1, y0: o.y0, y1: o.y1 };
    let T = o.T == null ? .25 : o.T, Ts = T, t = 0, events = [];
    const r = o.r, n = o.n, cols = o.cols || Math.max(1, Math.floor((box.x1 - box.x0) / (2 * r))), rows = Math.ceil(n / cols);
    const GROW = o.grow == null ? .16 : o.grow, GAP0 = o.gap0 || 0, LGAP = o.liqGap || 0, LT = o.solidT || (v => v);
    for (let i = 0; i < n; i++) {
      const node = S('g', null, layer);
      if (o.kind === 'H2O') D.mol(node, 'H2O', 0, 0, r * .98, 0); else D.atom(node, 0, 0, r, o.el || 'X');
      ps.push({ node, x: 0, y: 0, vx: 0, vy: 0, a: rnd() * 360, va: 0, p1: rnd() * 6.3, p2: rnd() * 6.3, ph: 's', site: i, mv: null });
    }
    /* the regular pattern at a temperature (the solid expands smoothly towards the temperature it is at): each site, the
       spacing, and the outer edges of its particles; the bottom row rests on the floor */
    function sites(temp) {
      const s = 2 * r * (1 + GAP0 + GROW * LT(temp == null ? Ts : temp)), out = [], off = o.kind === 'H2O' ? s * .25 : 0;
      const left = (box.x0 + box.x1) / 2 - (cols - 1) * s / 2;
      for (let i = 0; i < n; i++) { const c = i % cols, rw = Math.floor(i / cols); out.push([left + c * s + (rw % 2 ? off : 0), box.y1 - r - rw * s]); }
      return { out, s, w: cols * s, h: rows * s, edge: { l: left - r, r: left + (cols - 1) * s + r + (rows > 1 ? off : 0), t: box.y1 - 2 * r - (rows - 1) * s, b: box.y1 } };
    }
    /* how deep each site lies below the surface of the pattern (0: nothing above it, or at a side), and the sites from the
       surface inwards: the top row first, then the sides */
    const depth = ps.map((_, i) => { const c = i % cols; return Math.min(Math.floor((n - 1 - i) / cols), c, cols - 1 - c); });
    const SURFACE = ps.map((_, i) => i).sort((i, j) => depth[i] - depth[j] || Math.floor(j / cols) - Math.floor(i / cols) || Math.abs(j % cols - (cols - 1) / 2) - Math.abs(i % cols - (cols - 1) / 2));
    const W = box.x1 - box.x0, sc = W / 360, stats = { evaps: 0, refills: 0 };   /* read by tools/particles-check.mjs */
    /* Slow motion (Daniel, 25 Oct 2026: gas particles "moving so fast" were unnerving). Real gas particles move at hundreds
       of metres every second, which no picture can show, so every picture is slowed down, by the same amount for every
       box: speeds scale with its width, so a small lens is as calm as the big box (a gas particle crosses its box in about
       two seconds). Hotter is still faster, and a gas is still faster than a liquid. */
    const speed = () => W * (.2 + .36 * T);
    const held = q => q.ph === 's' || !!q.mv;            /* fixed in the pattern, or on its way into it */
    function place(st) {
      events = [];
      const ph = st.charAt(0);
      ps.forEach((q, i) => { q.ph = ph; q.mv = null; q.site = i; q.gone = false; q.node.style.display = ''; });
      if (st === 'solid') { Ts = T; const s = sites().out; ps.forEach((q, i) => { q.x = s[i][0]; q.y = s[i][1]; q.vx = q.vy = 0; q.a = o.kind === 'H2O' ? (i % 2 ? 30 : -30) : q.a; }); return; }
      const pos = D.spots(n, box.x1 - box.x0, box.y1 - box.y0, 2 * r * (1 + (st === 'liquid' ? LGAP : 0)), st === 'liquid' ? 'liquid' : 'gas', (o.seed || 3) + 7);
      ps.forEach((q, i) => { const p = pos[i] || [rnd() * (box.x1 - box.x0), rnd() * (box.y1 - box.y0)]; q.x = box.x0 + p[0]; q.y = box.y0 + p[1]; });
      if (st === 'gas') ps.forEach(q => { const a = rnd() * 6.283, v = speed(); q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v; });
      else ps.forEach(q => { q.vx = q.vy = 0; });
    }
    /* one particle changes its state: leaving the pattern gently as a liquid (never a burst), flying off as a gas, or
       slowing down into the liquid */
    function go(q, ph) {
      if (ph === 'l' && q.ph === 's') {
        if (o.smooth) { q.vx = (rnd() - .5) * 8 * sc; q.vy = 0; q.va = (rnd() - .5) * 60; }   /* eases out of the pattern from rest */
        else { q.vx = (rnd() - .5) * 50 * sc; q.vy = (rnd() - .5) * 20 * sc; q.va = (rnd() - .5) * 200; }
      }
      else if (ph === 'g') { const a = -Math.PI / 2 + (rnd() - .5) * 2.4, v = speed(); q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v; q.va = (rnd() - .5) * 120; }
      else if (ph === 'l') { q.vx *= .4; q.vy = Math.max(q.vy * .4, 40 * sc); }
      q.ph = ph;
    }
    const LV = { s: 0, l: 1, g: 2 };
    const now = q => q.mv ? 's' : q.evap ? 'l' : q.ph;      /* an evaporating particle still counts as the liquid it will be replaced by */
    function mix(a, b, f, ms) {
      const target = Math.round(Math.max(0, Math.min(1, f)) * n);
      const count = () => ps.filter(q => now(q) === b).length + events.filter(e => e.to === b).length - events.filter(e => e.from === b).length;
      /* a press the other way first takes back what the last one had still to do, between these two states only: a gas
         particle still on its way into the liquid must still arrive when freezing begins (25 Oct 2026: cooled quickly,
         gas particles were left floating for good and the solid never formed) */
      if (count() > target) events = events.filter(e => !(e.from === a && e.to === b)); else if (count() < target) events = events.filter(e => !(e.from === b && e.to === a));
      let k = count();
      if (k === target) return;
      const busy = new Set(events.map(e => e.q).filter(Boolean)), taken = new Set(events.map(e => e.site).filter(x => x != null));
      const add = [];
      if (k < target) {                                 /* a → b */
        let list;
        if (a === 's') list = SURFACE.map(i => ps.find(q => held(q) && q.site === i && !busy.has(q))).filter(Boolean);
        else list = ps.filter(q => q.ph === a && !q.mv && !busy.has(q)).sort((p, q) => a === 'l' ? p.y - q.y : 0);
        list.slice(0, target - k).forEach(q => add.push({ q, from: a, to: b }));
      } else if (a === 's') {                           /* b → the pattern: the free sites, deepest first */
        const used = new Set(ps.filter(held).map(q => q.site).concat([...taken]));
        SURFACE.slice().reverse().filter(i => !used.has(i)).slice(0, k - target).forEach(site => add.push({ site, from: b, to: 's' }));
      } else {                                          /* gas → liquid: the lowest first */
        ps.filter(q => q.ph === b && !q.gone && !q.evap && !busy.has(q)).sort((p, q) => q.y - p.y).slice(0, k - target).forEach(q => add.push({ q, from: b, to: a }));
      }
      const start = Math.max(t, ...events.filter(e => (e.from === a && e.to === b) || (e.from === b && e.to === a)).map(e => e.at)), gap = (ms == null ? 700 : ms) / 1000 / Math.max(1, add.length);
      add.forEach((e, i) => { e.at = start + gap * (i + .5); events.push(e); });
    }
    function toState(st, ms) {
      const to = st.charAt(0), free = ps.filter(q => !q.mv), from = free.length ? free[0].ph : 's';
      if (from === to) return;
      const up = LV[from] < LV[to];
      mix(up ? from : to, up ? to : from, up ? 1 : 0, ms == null ? 1500 : ms);
    }
    function walls(q) {
      const top = box.y0 + r, bot = box.y1 - r, lft = box.x0 + r, rgt = box.x1 - r;
      if (o.section) { if (q.x < box.x0) q.x += W; else if (q.x > box.x1) q.x -= W; }
      else { if (q.x < lft) { q.x = lft; q.vx = Math.abs(q.vx); } if (q.x > rgt) { q.x = rgt; q.vx = -Math.abs(q.vx); } }
      if (o.exitTop && q.ph === 'g' && !q.mv) { if (q.y < box.y0 - r) { q.gone = true; q.node.style.display = 'none'; q.vx = q.vy = 0; if (q.evap && o.refill && o.refill()) q.back = t + .5 + rnd() * .6; } }
      else if (q.y < top) { q.y = top; q.vy = Math.abs(q.vy); }
      if (q.y > bot) { q.y = bot; q.vy = -Math.abs(q.vy) * (q.ph === 'g' ? 1 : .3); }
    }
    /* particles never overlap: two particles of the liquid keep at least their small gap; a particle held in the pattern
       does not move when another meets it */
    function collide() {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const A = ps[i], B = ps[j], fa = held(A), fb = held(B);
        if ((fa && fb) || A.gone || B.gone) continue;
        let dx = B.x - A.x; if (o.section) dx -= W * Math.round(dx / W);
        const dy = B.y - A.y, d = Math.hypot(dx, dy) || .01, m = 2 * r * (A.ph === 'l' && B.ph === 'l' ? 1 + LGAP : 1);
        if (d >= m) continue;
        const nx = dx / d, ny = dy / d, over = m - d, el = A.ph === 'g' || B.ph === 'g' ? 1 : .55;
        if (fa) { B.x += nx * over; B.y += ny * over; } else if (fb) { A.x -= nx * over; A.y -= ny * over; }
        else { A.x -= nx * over / 2; A.y -= ny * over / 2; B.x += nx * over / 2; B.y += ny * over / 2; }
        const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rv >= 0) continue;
        if (fa) { B.vx -= nx * rv * (1 + el); B.vy -= ny * rv * (1 + el); }
        else if (fb) { A.vx += nx * rv * (1 + el); A.vy += ny * rv * (1 + el); }
        else { A.vx += nx * rv * el; A.vy += ny * rv * el; B.vx -= nx * rv * el; B.vy -= ny * rv * el; }
      }
    }
    /* the room a particle takes: in the pattern, a square of the spacing; in a liquid, its area ÷ how tightly a liquid packs */
    const LIQ_A = Math.PI * r * r / (.72 / ((1 + LGAP) * (1 + LGAP)));
    /* the level of the liquid: with part still solid, the liquid fills the room beside the solid first; while the solid
       sticks out above that level, liquid on top of it runs off its edges, and once the liquid is deeper than the solid, it
       lies over it in a level layer (never stacked against a wall) */
    function level() {
      const area = ps.filter(q => q.ph === 'l' && !q.mv).length * LIQ_A, solid = ps.filter(held), solidLeft = solid.length > 0, S0 = sites().out;
      let band = box.y1 - area / W, bl = 0, br = 0, bt = 0, over = true;
      if (solidLeft) {
        bl = Math.min(...solid.map(q => q.mv ? S0[q.site][0] : q.x)) - r; br = Math.max(...solid.map(q => q.mv ? S0[q.site][0] : q.x)) + r;
        bt = Math.min(...solid.map(q => S0[q.site][1])) - r;
        const side = Math.max(2 * r, W - (br - bl)), low = side * (box.y1 - bt);
        over = area > low;
        band = over ? bt - (area - low) / W : box.y1 - area / side;
      }
      return { band, bl, br, bt, over, solidLeft, area };
    }
    function step(dt) {
      t += dt;
      Ts += (T - Ts) * Math.min(1, dt * 5);
      const S0 = sites().out;
      /* the changes whose time has come: a particle leaves, or the free particle nearest a site moves into it */
      events = events.filter(e => {
        if (e.at > t) return true;
        if (e.site == null) { go(e.q, e.to); return false; }
        const busy = new Set(events.map(x => x.q).filter(Boolean));
        let best = null, bd = Infinity;
        ps.forEach(q => { if (q.ph !== e.from || q.mv || busy.has(q)) return; const d = Math.hypot(q.x - S0[e.site][0], q.y - S0[e.site][1]); if (d < bd) { bd = d; best = q; } });
        if (!best) { e.at = t + .2; return true; }          /* none free yet (one still on its way): try again soon */
        best.site = e.site; best.mv = { fx: best.x, fy: best.y, t: 0, dur: .9 }; best.vx = best.vy = 0;
        return false;
      });
      ps.forEach(q => {
        if (!q.mv) return;
        q.mv.t = Math.min(1, q.mv.t + dt / q.mv.dur);
        const e = q.mv.t * q.mv.t * (3 - 2 * q.mv.t), [sx, sy] = S0[q.site];
        q.x = q.mv.fx + (sx - q.mv.fx) * e; q.y = q.mv.fy + (sy - q.mv.fy) * e;
        if (q.mv.t >= 1) { q.mv = null; q.ph = 's'; if (o.kind === 'H2O') q.a = q.site % 2 ? 30 : -30; }
      });
      /* the pattern: each particle vibrates about its own site, more when hotter */
      const amp = (.8 + 1.6 * LT(T)) * r / 16, w = 5 + 6 * LT(T);
      ps.forEach(q => { if (q.ph !== 's' || q.mv) return; const [sx, sy] = S0[q.site]; q.x = sx + amp * Math.sin(w * t + q.p1); q.y = sy + amp * Math.cos(w * 1.13 * t + q.p2); });
      const free = ps.filter(q => !held(q) && !q.gone);
      if (!free.length) return;
      /* a liquid fills the bottom of its container with a level top (the band its particles would fill, with a little
         room to spare: their area ÷ how tightly a liquid packs ÷ the width), while no part of it is still solid */
      const { band, bl, br, bt, over, solidLeft } = level();
      const kick = (900 + 1300 * T) * sc * .7 * (o.liqKick || 1), N = 3, h = dt / N;
      for (let k = 0; k < N; k++) {
        free.forEach(q => {
          if (q.ph === 'l') {
            if (o.smooth) {                                /* slow currents: each particle's own gentle, turning push */
              const ag = 1 + 4.5 * Math.max(0, T - .35);                       /* hotter: livelier currents (Daniel, 26 Oct 2026) */
              const fx = (Math.cos(t * .8 + q.p1) * .7 + Math.cos(t * .27 + 2 * q.p2) * .5) * ag, fy = Math.sin(t * 1.05 + q.p2) * .55 * ag;
              q.vx += (fx * 1.0 + (rnd() - .5) * .9) * kick * h; q.vy += (fy * .35 + (rnd() - .5) * .5) * kick * h + 160 * sc * h;
              if (q.vy < -45 * sc) q.vy = -45 * sc;       /* a liquid is never thrown up: only a gas rises */
            } else { q.vx += (rnd() - .5) * kick * h * 4; q.vy += (rnd() - .5) * kick * h * 4 + 160 * sc * h; }
            if (q.y < Math.min(band, solidLeft ? bt : band) - 2 * r) q.vy += 500 * sc * h;   /* far above the liquid: falls */
            const onTop = solidLeft && q.y < bt && q.x > bl && q.x < br;
            if (onTop && !over) q.vx += (q.x < (bl + br) / 2 ? -1 : 1) * (o.smooth ? 90 : 260) * sc * h;   /* runs off the ice */
            else if (q.y < band + r) q.vy += (band + r - q.y) * 60 * h;
            const damp = o.smooth ? 1.2 : 2.2;
            q.vx *= 1 - damp * h; q.vy *= 1 - damp * h;
            if (o.smooth) { const sp = Math.hypot(q.vx, q.vy), top = (95 + 400 * Math.max(0, T - .35)) * sc; if (sp > top) { q.vx *= top / sp; q.vy *= top / sp; } }   /* a liquid flows calmly */ q.va += (rnd() - .5) * (o.smooth ? 700 : 1400) * h; q.va *= 1 - 2.5 * h;
          } else {
            const v = speed(), sp = Math.hypot(q.vx, q.vy) || 1, f = 1 + (v / sp - 1) * Math.min(1, 2 * h);
            q.vx *= f; q.vy *= f; q.va = q.va || 60;
          }
          q.x += q.vx * h; q.y += q.vy * h; q.a += q.va * h;
        });
        collide(); collide(); collide();
        free.forEach(walls);
        /* in a section (no side walls), the liquid as a whole stays where it is: its shared sideways drift is taken out,
           so molecules slide past each other but the layer never flows along like a conveyor belt */
        if (o.section) { const L = free.filter(q => q.ph === 'l' && !q.evap); if (L.length > 1) { const m = L.reduce((t2, q) => t2 + q.vx, 0) / L.length; L.forEach(q => { q.vx -= m; }); } }
      }
      /* evaporation at any temperature: now and then the highest liquid particle escapes as a gas (o.evap per second);
         one that has left is replaced, after a moment, by a particle drifting in at a side, low down, from the water
         around the window (o.refill) */
      if (o.evap) {
        const rate = o.evap();
        if (rate > 0 && rnd() < rate * dt) {
          const c = ps.filter(q => q.ph === 'l' && !q.mv && !q.gone).sort((a, b) => a.y - b.y)[0];
          if (c) { c.evap = true; go(c, 'g'); stats.evaps++; }
        }
      }
      ps.forEach(q => {
        if (!q.gone || !q.back || t < q.back) return;
        const left = rnd() < .5;
        q.gone = false; q.back = null; q.evap = false; q.ph = 'l'; q.node.style.display = ''; stats.refills++;
        q.x = left ? box.x0 : box.x1; q.y = box.y1 - r * (1.2 + rnd() * 1.5); q.vx = (left ? 1 : -1) * 30 * sc; q.vy = 0;
      });
    }
    function draw() {
      ps.forEach(q => q.node.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(q.a % 360).toFixed(0)})`));
      if (!bonds) return;
      while (bonds.firstChild) bonds.removeChild(bonds.firstChild);
      /* a hydrogen bond: from a hydrogen atom of one molecule to the oxygen atom of a neighbour, each hydrogen at most once;
         molecules of the gas have none */
      const R = r * .98, used = new Set(), near = ps.filter(q => q.ph !== 'g' || q.mv);
      near.forEach((a, i) => {
        const ar = a.a * Math.PI / 180, hs = [[-.72 * R, .58 * R], [.72 * R, .58 * R]].map(([x, y]) => [a.x + x * Math.cos(ar) - y * Math.sin(ar), a.y + x * Math.sin(ar) + y * Math.cos(ar)]);
        hs.forEach((hp, hi) => {
          let best = null, bd = R * 1.9;
          near.forEach((b2, j) => { if (j === i) return; const d = Math.hypot(b2.x - hp[0], b2.y - hp[1]); if (d < bd) { bd = d; best = b2; } });
          if (best && !used.has(i + ':' + hi)) { used.add(i + ':' + hi); S('line', { x1: hp[0].toFixed(1), y1: hp[1].toFixed(1), x2: best.x.toFixed(1), y2: best.y.toFixed(1), stroke: 'var(--ink3)', 'stroke-width': 1.6, 'stroke-dasharray': '3 3', opacity: .85 }, bonds); }
        });
      });
    }
    place(o.state || 'solid');
    return {
      ps, layer, box, step, draw, toState, mix, sites, stats,
      set(st) { place(st); },
      state: () => { if (events.length || ps.some(q => q.mv)) return 'mixed'; const p = ps[0].ph; return ps.every(q => q.ph === p) ? { s: 'solid', l: 'liquid', g: 'gas' }[p] : 'mixed'; },
      busy: () => events.length > 0 || ps.some(q => q.mv),
      count: ph => ps.filter(q => now(q) === ph).length,
      /* the room the solid part and the liquid part take (square units), and how many particles are a gas: the picture's
         volume reading */
      areas: () => { const sp = sites().s; return { solid: ps.filter(held).length * sp * sp, liquid: ps.filter(q => q.ph === 'l' && !q.mv).length * LIQ_A, gas: ps.filter(q => q.ph === 'g' && !q.mv).length }; },
      /* the top of what is not a gas (the solid's top edge, or the liquid's level): where a lid pushed down comes to rest */
      surface: () => { const L = level(); if (!L.solidLeft && !L.area) return box.y1; return L.solidLeft ? Math.min(L.bt, L.area ? L.band : L.bt) : L.band; },
      depth: i => depth[i],
      temp(v) { if (v != null) T = v; return T; },
      top(y) { box.y0 = y; ps.forEach(q => { if (q.y < y + r) q.y = y + r; }); },
      highest() { return Math.min.apply(null, ps.map(q => q.y)) - r; }
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
         temperature one step. At the melting point three presses melt it, a third at a time, the particles at the surface
         first, while the thermometer stays at the melting point; boiling, freezing and condensing work the same way (a
         change of state takes energy at one temperature; Daniel, 25 Oct 2026: a solid that melted in one burst "makes
         absolute no sense"). Solid, Liquid and Gas take it to a temperature in that state; the thermometer has no numbers.
         It starts at the coldest, and the dashed line keeps the solid's size there, on the outer edges of its particles:
         its size before heating, shown from the first press of Heat (Daniel, the same day).
         The particles of the coldest solid touch; heated, they vibrate more and move a little apart (a tenth of their
         width at the melting point: far more than in a real solid, so that it shows, and never far apart like a gas). The
         particles of the liquid keep a little more room than those of the hot solid, so melting never packs them closer
         together: for most substances the liquid takes up a little more space than the solid (Daniel: the gaps must not
         shrink when it melts). */
      const g = k.g, X0 = 60, X1 = 420, YB = 440, TOP = 128;
      const MP = .34, BP = .68, STEP = .07, AT = { solid: 0, liquid: .51, gas: .86 };
      /* st: solid · sl (part solid, part liquid: melting or freezing) · liquid · lg (part liquid, part gas) · gas;
         f: the part in the state with more energy while it changes (a third at each press) */
      let pistonY = TOP, target = TOP, squeezed = false, T = AT.solid, st = 'solid', t0 = T, f = 0, dir = 0;   /* dir: the last press, +1 Heat, −1 Cool */
      S('text', { class: 'note', x: X0, y: 466 }, g, 'Each circle is one particle of one substance. It is not water.');
      const layer = S('g', null, g);
      const outline = S('rect', { x: 0, y: 0, width: 0, height: 0, fill: 'none', stroke: '#C2410C', 'stroke-width': 3, 'stroke-dasharray': '8 6', rx: 4, opacity: 0 }, g);
      const outlineT = S('text', { class: 'lbl-sm', x: 0, y: 0, 'text-anchor': 'middle', fill: '#C2410C', opacity: 0 }, g, 'size before heating');
      const sim = PSim({ g: layer, x0: X0 + 3, x1: X1 - 3, y0: TOP + 3, y1: YB - 3, n: 32, r: 16, cols: 8, state: 'solid', T, seed: 5,
                         gap0: .02, grow: .08, liqGap: .13, solidT: v => Math.min(1, v / MP) });
      k.svg.sim = sim;                                  /* read by tools/particles-check.mjs */
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
      /* while it changes state the thermometer waits at the melting or boiling point: three squares beside that point fill
         as the change goes on, so a press that leaves the temperature still visibly does something (Daniel, 25 Oct 2026:
         the red "seems to get stuck" — "I reach melting point and I'm not there yet") */
      const prog = S('g', null, g);
      /* Compress pushes the lid down with the SAME force every time (Daniel, 25 Oct 2026: a hot gas and a cold gas went down
         to the same place, Compress did nothing while it melted, and with no number nobody could compare). The picture
         reads what the lid measures, the volume under it (Daniel, the same night: a volume that grew with heating while
         nothing was compressed "doesn't make any sense"): 100 cm³ while the lid is up, whatever the temperature; pushed
         down, the lid stops on top of a solid or a liquid, or squeezes a gas to a volume that grows with its temperature
         (Charles's law, for a substance that boils at 350 K and is 520 K at "hot"; 58 cm³ at its boiling point), so the
         same push compresses a hot gas less; heated while pushed, a gas lifts the lid. */
      /* the reading rides on the lid, at its right end, clear of the rod and the handle: what the lid measures */
      S('text', { class: 'note', x: X1 - 8, y: -38, 'text-anchor': 'end' }, pis, 'volume under the lid');
      const volT = S('text', { class: 'lbl-sm', x: X1 - 8, y: -18, 'text-anchor': 'end' }, pis, '');
      const WIN = X1 - X0 - 6, Y1 = YB - 3, K = 100 / (WIN * (Y1 - (TOP + 2)));
      const Tabs = () => 350 + Math.max(0, T - BP) / (1 - BP) * 170;
      const vols = () => { const a = sim.areas(); return { s: a.solid * K, l: a.liquid * K, g: a.gas }; };
      const pushedGas = v => v.g / 32 * 58 * Tabs() / 350;
      const volAt = y => (Y1 - (y + 2)) * WIN * K;             /* the volume under the lid at y */
      const volNow = () => volAt(pistonY);
      function lidTarget() {
        if (!squeezed) return TOP;
        const v = vols();
        return v.g ? Math.max(TOP, Y1 - (v.s + v.l + pushedGas(v)) / (K * WIN) - 2) : Math.max(TOP, sim.surface() - 2);
      }
      /* after Heat or Cool with the lid pushed down on a gas: what the gas does to the lid */
      const pushedNote = () => ` Pushed with the same force, the ${dir > 0 ? 'hotter' : 'cooler'} gas now fills ${Math.round(pushedGas(vols()))} cm³: it pushes the lid ${dir > 0 ? 'up' : 'less, and the lid moves down'}.`;
      const SAY = {
        solid: '<b>Solid.</b> Below its melting point, the substance is a solid. The particles touch, in a regular pattern, and vibrate in one place. So a solid keeps its shape and its volume.',
        liquid: '<b>Liquid.</b> Between its melting point and its boiling point, the substance is a liquid. The particles are close together, with no pattern, and slide past each other. So a liquid flows and takes the shape of its container, but keeps its volume.',
        gas: '<b>Gas.</b> Above its boiling point, the substance is a gas. The particles are far apart and move fast in all directions, so a gas fills its whole container. (Slow motion: in air, the particles move at about 500 metres every second.)'
      };
      /* a change of state, a third at each press: [first, second, last] */
      const MELT = ['<b>Melting.</b> At the melting point, the heat energy breaks the particles at the surface out of the pattern; they slide past each other. The temperature stays at the melting point until all of it has melted.',
        '<b>Still melting.</b> More heat breaks more particles out of the pattern, so the temperature still stays at the melting point. Heat it again.',
        '<b>All melted.</b> The particles are close together, a little further apart than in the solid, with no pattern. Only now can heating make it hotter.'];
      const FREEZE = ['<b>Freezing.</b> At the freezing point (the same as the melting point), particles lose energy and become fixed in a regular pattern. The temperature stays there until all of it has frozen.',
        '<b>Still freezing.</b> More particles become fixed in the pattern; the temperature still stays at the freezing point. Cool it again.',
        '<b>All frozen.</b> It is all a solid again. Only now can cooling make it colder.'];
      const BOIL = ['<b>Boiling.</b> At the boiling point, the heat energy lets particles escape from the liquid and move far apart: a gas. The temperature stays at the boiling point until all of it has boiled.',
        '<b>Still boiling.</b> More heat lets more particles escape, so the temperature still stays at the boiling point. Heat it again.',
        '<b>All boiled.</b> It is all a gas. Only now can heating make it hotter.'];
      const COND = ['<b>Condensing.</b> At the boiling point, gas particles lose energy and come close together again: a liquid. The temperature stays there until all of it has condensed.',
        '<b>Still condensing.</b> More particles join the liquid; the temperature still stays at the boiling point. Cool it again.',
        '<b>All condensed.</b> It is all a liquid again. Only now can cooling make it colder.'];
      const EXPAND = '<b>Heated:</b> the particles vibrate more and the gaps between them get a little bigger, so the solid expands (a real solid expands much less). The dashed line shows its size before heating. <u>The particles do not get bigger.</u>';
      const DO = '<p><mark class="do">Press 🔥 Heat again and again, then ❄ Cool.</mark></p>';
      let lead = null;                             /* what the last press did, in place of the state's description */
      const say = () => k.say(`<p>${lead || SAY[st] || ''}</p>` + DO);
      function setT(v) { T = Math.max(0, Math.min(1, Math.round(v * 1000) / 1000)); sim.temp(T); }
      function release() { if (squeezed) { squeezed = false; sqz.set('Compress ⬇'); } }
      const sb = {};
      [['solid', 'Solid', 105], ['liquid', 'Liquid', 158], ['gas', 'Gas', 211]].forEach(([s, t, y]) => {
        sb[s] = k.btn(t, 640, y, () => { st = s; f = 0; T = AT[s]; release(); sim.temp(T); sim.set(s); t0 = T; lead = null; paint(); say(); }, { cls: 'ghost' });
      });
      const heat = k.btn('🔥 Heat', 690, 318, () => {
        lead = null; dir = 1;
        if (st === 'solid' && T + STEP >= MP - 1e-6) { setT(MP); st = 'sl'; f = 1 / 3; sim.mix('s', 'l', f); lead = MELT[0]; }
        else if (st === 'sl') { f = Math.min(1, f + 1 / 3); sim.mix('s', 'l', f); if (f > .99) { st = 'liquid'; lead = MELT[2]; } else lead = MELT[f > .5 ? 1 : 0]; }
        else if (st === 'liquid' && T + STEP >= BP - 1e-6) { setT(BP); st = 'lg'; f = 1 / 3; sim.mix('l', 'g', f); lead = BOIL[0]; }
        else if (st === 'lg') { f = Math.min(1, f + 1 / 3); sim.mix('l', 'g', f); if (f > .99) { st = 'gas'; lead = BOIL[2]; } else lead = BOIL[f > .5 ? 1 : 0]; }
        else { setT(T + STEP); lead = st === 'solid' ? EXPAND : '<b>Heated:</b> the particles gain energy and move faster.' + (squeezed && st === 'gas' ? pushedNote() : ''); }
        say(); paint();
      }, { cls: 'warm' });
      const cool = k.btn('❄ Cool', 690, 392, () => {
        lead = null; dir = -1;
        if (st === 'gas' && T - STEP <= BP + 1e-6) { setT(BP); st = 'lg'; f = 2 / 3; sim.mix('l', 'g', f); lead = COND[0]; }
        else if (st === 'lg') { f = Math.max(0, f - 1 / 3); sim.mix('l', 'g', f); if (f < .01) { st = 'liquid'; lead = COND[2]; } else lead = COND[f < .5 ? 1 : 0]; }
        else if (st === 'liquid' && T - STEP <= MP + 1e-6) { setT(MP); st = 'sl'; f = 2 / 3; sim.mix('s', 'l', f); lead = FREEZE[0]; }
        else if (st === 'sl') { f = Math.max(0, f - 1 / 3); sim.mix('s', 'l', f); if (f < .01) { st = 'solid'; t0 = T; lead = FREEZE[2]; } else lead = FREEZE[f < .5 ? 1 : 0]; }
        else {
          setT(T - STEP);
          if (st === 'solid') { t0 = Math.min(t0, T); lead = T > .005 ? '<b>Cooled:</b> the particles vibrate less and come a little closer: the solid contracts.' : '<b>Cooled:</b> the coldest this picture shows. The particles touch, and vibrate only a little.'; }
          else lead = '<b>Cooled:</b> the particles lose energy and move more slowly.' + (squeezed && st === 'gas' ? pushedNote() : '');
        }
        say(); paint();
      }, { cls: 'cold' });
      const sqz = k.btn('Compress ⬇', 292, 40, () => {
        lead = null;
        const v = vols(), before = Math.round(volNow());
        if (squeezed) {
          squeezed = false; sqz.set('Compress ⬇');
          lead = v.g ? '<b>Released:</b> the lid goes back up, and the gas fills the whole container again: 100 cm³ under the lid.' : '<b>Released:</b> the lid goes back up: 100 cm³ under it again.';
          say(); paint(); return;
        }
        squeezed = true; sqz.set('Release ⬆');
        const after = Math.round(volAt(lidTarget())), what = st === 'solid' ? 'solid' : st === 'liquid' ? 'liquid' : 'substance';
        if (v.g) lead = `<b>Compressed:</b> the lid pushes with the same force each time. The gas particles had space between them, so they are pushed closer together: the volume falls from ${before} cm³ to ${after} cm³. A hotter gas pushes back harder, so it is compressed less.`;
        else lead = `<b>The lid stops</b> on top of the ${what}, at ${after} cm³: it only pushed out the empty space above it. The ${what} itself is not squeezed: its particles are already close together. You cannot compress a solid or a liquid.`;
        say(); paint();
      }, { cls: 'r' });
      function paint() {
        /* while it changes state, both states are there: both their buttons are lit (Daniel, 25 Oct 2026: it looked all
           liquid while Liquid was not lit, "as if there was no state in between") */
        sb.solid.on(st === 'solid' || st === 'sl'); sb.liquid.on(st === 'liquid' || st === 'sl' || st === 'lg'); sb.gas.on(st === 'gas' || st === 'lg');
        heat.disabled = st === 'gas' && T >= 1 - 1e-6; cool.disabled = st === 'solid' && T <= 1e-6;
        while (prog.firstChild) prog.removeChild(prog.firstChild);
        if (st === 'sl' || st === 'lg') {
          const up = dir >= 0, done = Math.round((up ? f : 1 - f) * 3), col = up ? '#C2410C' : '#1D5FBF', y = th.yOf(st === 'sl' ? MP : BP) + 21;
          for (let i = 0; i < 3; i++) S('rect', { x: TX + 20 + i * 17, y: y - 11, width: 13, height: 13, rx: 2, fill: i < done ? col : 'none', stroke: i < done ? col : 'var(--ink3)', 'stroke-width': 1.6 }, prog);
          S('text', { class: 'note', x: TX + 76, y }, prog, st === 'sl' ? (up ? 'melted' : 'frozen') : (up ? 'boiled' : 'condensed'));
        }
        th.set(T);
        /* the solid's size at its coldest since it became a solid (at the start, the coldest of all), on the outer edges of
           its particles, once it is warmer: its size before heating. The label stays above the hottest solid's top, so the
           solid never covers it and it never moves with the solid. */
        const warmer = st === 'solid' && T > t0 + .005;
        if (warmer) {
          const e = sim.sites(t0).edge;
          outline.setAttribute('x', e.l); outline.setAttribute('y', e.t); outline.setAttribute('width', e.r - e.l); outline.setAttribute('height', e.b - e.t);
          outlineT.setAttribute('x', (X0 + X1) / 2); outlineT.setAttribute('y', sim.sites(MP).edge.t - 12);
        }
        /* the lid pushed down rests where the label is: the label waits until it goes up again (the dashed line stays) */
        outline.setAttribute('opacity', warmer ? 1 : 0); outlineT.setAttribute('opacity', warmer && !squeezed ? 1 : 0);
      }
      paint(); say();
      k.loop(dt => {
        target = lidTarget();
        if (Math.abs(pistonY - target) > .3) { pistonY += (target - pistonY) * Math.min(1, dt * 3.2); }
        else pistonY = target;
        pis.setAttribute('transform', `translate(0 ${pistonY.toFixed(1)})`);
        sim.top(pistonY + 2);
        sim.step(dt); sim.draw();
        const vt = Math.round(volNow()) + ' cm³';
        if (volT.textContent !== vt) volT.textContent = vt;
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
      /* the hot plate and the beaker, moved right as one group (BX), and the thermometer on the left (Daniel, 26 Oct
         2026: so the dashed lines from the beaker to the zoom are not interrupted) */
      const BX = 65, bg = S('g', { transform: `translate(${BX} 0)` }, g);
      S('rect', { class: 'metal', x: 70, y: 430, width: 250, height: 26, rx: 6 }, bg);
      const ring = S('rect', { x: 118, y: 421, width: 154, height: 10, rx: 4, fill: '#8C939C' }, bg);
      const bk = D.beaker(bg, 195, 420, 170, 220, { color: '#9CC8EE', level: .5, opacity: .7 });
      const ice = S('g', null, bg), blk = S('g', { opacity: 0 }, bg), bubbles = S('g', null, bg), steam = S('g', null, bg);
      let block = false;            /* ice cubes at first; water that freezes in the beaker becomes one block of ice */
      S('rect', { x: 113, y: 290, width: 164, height: 127, rx: 5, fill: '#E6F4FB', stroke: '#8DB8D3', 'stroke-width': 2 }, blk);
      [[140, 312, 60], [170, 352, 70], [200, 392, 48]].forEach(([x, y, w]) => S('line', { x1: x, y1: y, x2: x + w, y2: y - 14, stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .9 }, blk));
      const cubes = [[150, 316], [196, 324], [238, 314], [168, 352], [222, 356], [195, 388], [150, 392], [240, 390]];
      cubes.forEach(([x, y], i) => S('rect', { x: x - 20, y: y - 18, width: 40, height: 36, rx: 7, fill: '#E6F4FB', stroke: '#8DB8D3', 'stroke-width': 2, transform: `rotate(${(i * 23) % 30 - 15} ${x} ${y})` }, ice));
      /* where the zoom looks: a small square on the beaker at the SURFACE of the water (Daniel, 26 Oct 2026: a zoom
         drawn as an open beaker while it pointed at the floor "makes no sense"; near the surface, steam can be seen to
         leave). The zoom is the same square, magnified: a closed window, with the air at its top. Its dashed lines are
         drawn first, so they pass behind the thermometer. */
      const LX = 640, LY = 205, X0 = LX - 105, X1 = LX + 105, Y0 = LY - 45, Y1 = LY + 105;   /* wider than the ice; the water fills about half */
      /* the square follows the surface (the top of the ice, then the water's level as it rises, or falls as steam
         leaves), sitting so the surface crosses it about half way down, as in the zoom */
      const mk = S('rect', { x: 220 + BX, y: 276, width: 36, height: 26, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }, g);
      const mkl = S('path', { stroke: 'var(--accent)', 'stroke-width': 1.6, 'stroke-dasharray': '5 4', fill: 'none' }, g);
      const marker = sy => { const y = Math.round(sy - 14); mk.setAttribute('y', y); mkl.setAttribute('d', `M${256 + BX},${y} L${X0 - 4},${Y0 - 4} M${256 + BX},${y + 26} L${X0 - 4},${Y1 + 4}`); };
      const th = D.thermometer(g, 46, 60, 440, { min: -20, max: 110, ticks: [-20, 0, 20, 40, 60, 80, 100] });
      /* the zoom: the square at the surface, magnified, in a closed window (no glass walls: it is a piece of the water,
         not a beaker). The melt slides down beside the ice that is left and lies level; a molecule that becomes a gas
         rises out of the top of the window and is gone, as steam leaves the beaker (exitTop). */
      const cid = D.id('zoom'), defs = S('defs', null, g), cp = S('clipPath', { id: cid }, defs);
      S('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, rx: 8 }, cp);
      S('rect', { class: 'lens-ring', x: X0 - 3, y: Y0 - 3, width: X1 - X0 + 6, height: Y1 - Y0 + 6, rx: 11 }, g);
      const inner = S('g', { 'clip-path': `url(#${cid})` }, g);
      S('text', { class: 'note', x: X0 + 12, y: Y0 + 24 }, inner, 'air');
      /* the particles' box reaches just past the window's sides and bottom (a section of the water: molecules slide in
         and out of view, the lowest row runs on below); evaporation at any temperature while there is liquid below its
         boiling point, faster when hotter, each escaped molecule replaced by one drifting in from the water around */
      const lens = PSim({ g: inner, x0: X0 - 15, x1: X1 + 15, y0: Y0, y1: Y1 + 9, n: 15, r: 15, cols: 4, kind: 'H2O', hb: true, state: 'solid', T: .1, seed: 8, liqKick: 1.6,
        smooth: true, exitTop: true, section: true,
        evap: () => (phase === 'water' || phase === 'melting' || phase === 'freezing') ? .1 + .3 * Math.max(0, temp) / 100 : 0,
        refill: () => phase !== 'boiling' });
      k.svg.lens = lens;                                /* read by tools/particles-check.mjs */
      const lt = S('text', { class: 'ttl', x: LX, y: Y1 + 34, 'text-anchor': 'middle' }, g, 'Ice');
      S('text', { class: 'note', x: LX, y: Y1 + 56, 'text-anchor': 'middle' }, g, 'zoomed in: the surface, in the beaker');
      S('text', { class: 'note', x: LX, y: Y1 + 76, 'text-anchor': 'middle' }, g, 'water molecules · - - - hydrogen bonds');
      const rec = S('g', null, g);
      let temp = -20, phase = 'ice', frac = 0, lost = 0;
      const seen = {};
      function scene() {
        th.set(temp);
        ring.setAttribute('fill', heatOn ? '#E2572B' : '#8C939C');
        const solidPart = phase === 'ice' ? 1 : phase === 'melting' ? 1 - frac : phase === 'freezing' ? frac : 0;
        ice.setAttribute('opacity', block ? 0 : solidPart);
        blk.setAttribute('opacity', block ? solidPart : 0);
        if (phase === 'boiling') lost = Math.max(lost, frac);          /* steam that left the beaker does not come back */
        bk.liq.set((.58 - .14 * lost) * (phase === 'boiling' ? 1 : 1 - solidPart));
        marker(Math.min(solidPart > .01 ? 298 : Infinity, bk.liq.level() > .01 ? bk.liq.y() : Infinity));
        lt.textContent = { ice: 'Ice (solid)', melting: 'Ice melting', water: 'Water (liquid)', freezing: 'Water freezing', boiling: 'Water boiling' }[phase];
        const r = [];
        if (seen.melt) r.push('melting point 0 °C'); if (seen.freeze) r.push('freezing point 0 °C'); if (seen.boil) r.push('boiling point 100 °C');
        while (rec.firstChild) rec.removeChild(rec.firstChild);
        if (r.length) { S('text', { class: 'lbl-sm', x: 150, y: 40 }, rec, 'You saw:'); r.forEach((t, i) => S('text', { class: 'lbl-sm', x: 150, y: 66 + i * 24 }, rec, '✓ ' + t)); }
      }
      let heatOn = false;
      const SAY = {
        ice: () => temp < 0 ? `<b>Ice at ${temp === 0 ? 0 : '−' + (-temp)} °C.</b> The water molecules are held in a regular pattern by forces of attraction between them (the dashed lines: hydrogen bonds). They vibrate in place.` : '<b>Ice at 0 °C.</b> Heat it once more and it starts to melt.',
        melting: () => '<b>Melting at 0 °C.</b> The molecules at the surface of the ice gain energy and leave their fixed places in the pattern. They slide past each other and flow down beside the ice that is left, taking the shape of the bottom of the beaker. While the ice melts, the thermometer stays at 0 °C.',
        water: () => `<b>Liquid water at ${temp} °C.</b> The molecules touch and slide past each other; hydrogen bonds break and form again all the time. ${temp > 0 ? 'Hotter water moves faster. ' : ''}Even below 100 °C, now and then a molecule at the surface escapes as a gas: evaporation, faster when the water is hotter.`,
        freezing: () => '<b>Freezing at 0 °C.</b> The molecules lose energy and become fixed in a regular pattern again: the same temperature as melting.',
        boiling: () => '<b>Boiling at 100 °C.</b> Bubbles of steam form all through the water. Molecules escape from the liquid as a gas (steam) and leave the beaker, so the water level falls.'
      };
      const say = () => k.say('<p>' + SAY[phase]() + '</p><p><mark class="do">Press 🔥 Heat or ❄ Cool, one step at a time.</mark></p>');
      function heatStep() {
        heatOn = true;
        if (phase === 'ice' && temp < 0) temp += 10;
        else if (phase === 'ice') { phase = 'melting'; seen.melt = 1; frac = .34; }
        else if (phase === 'melting' || phase === 'freezing') { if (phase === 'freezing') { phase = 'melting'; frac = 1 - frac; } frac += .33; if (frac > .99) { phase = 'water'; frac = 0; } }
        else if (phase === 'water' && temp < 100) temp = Math.min(100, temp + 20);
        else if (phase === 'water') { phase = 'boiling'; frac = .34; seen.boil = 1; }
        else if (phase === 'boiling') frac = Math.min(1, frac + .33);
        lens.temp(phase === 'ice' ? .1 + (temp + 20) / 60 : phase === 'boiling' ? 1 : .35 + temp / 250);
        lensSync(); scene(); say(); btnState();
      }
      function coolStep() {
        heatOn = false;
        if (phase === 'boiling') { phase = 'water'; frac = 0; }
        else if (phase === 'water' && temp > 0) temp = Math.max(0, temp - 20);
        else if (phase === 'water') { phase = 'freezing'; frac = .34; seen.freeze = 1; block = true; }
        else if (phase === 'freezing' || phase === 'melting') { if (phase === 'melting') { phase = 'freezing'; frac = 1 - frac; seen.freeze = 1; block = true; } frac += .33; if (frac > .99) { phase = 'ice'; frac = 0; } }
        else if (phase === 'ice' && temp > -20) temp -= 10;
        lens.temp(phase === 'ice' ? .1 + (temp + 20) / 60 : phase === 'boiling' ? 1 : .35 + temp / 250);
        lensSync(); scene(); say(); btnState();
      }
      /* the lens shows what the beaker shows (25 Oct 2026; before, the whole lens turned to water at the first press while
         the beaker was still two thirds ice, and no molecule ever left as steam): the part of the ice melted or frozen, a
         third at each press, and while the water boils, a few molecules escaping as a gas (about as much as the level falls) */
      function lensSync() {
        const L = phase === 'ice' ? 0 : phase === 'melting' ? frac : phase === 'freezing' ? 1 - frac : 1, G = phase === 'boiling' ? .25 * frac : 0;
        if (L < 1 || lens.count('s')) lens.mix('s', 'l', L, 900);
        if (L >= 1) lens.mix('l', 'g', G, 900);
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
    /* Count the particles (Daniel, 26 Oct 2026: "salt is not a molecule because you cannot know the number of atoms
       exactly, while a molecule you can, same as for metals"). A bigger piece of water has MORE molecules, but each one
       has exactly 3 atoms; a bigger salt crystal or piece of copper is ONE lattice with more particles, so no number
       belongs to it: only salt's ratio (1 : 1) is fixed. Each lattice grows by a ring around the old one, centred, so
       the old particles stay where they were (and keep their colours: the pattern's parity does not change). */
    id: 'count', name: 'Count the particles', title: 'Molecules, and lattices with no fixed number',
    alt: 'Water molecules of 3 atoms each; a salt lattice of sodium and chloride ions and a copper lattice, which grow',
    draw(k) {
      const g = k.g, d = 25, SIDES = [2, 4, 6, 8], MOLS = [1, 2, 4, 8];
      const COL = [{ x: 135, t: 'Water, H₂O' }, { x: 400, t: 'Salt, NaCl' }, { x: 665, t: 'Copper, Cu' }];
      COL.forEach(c => S('text', { class: 'ttl', x: c.x, y: 36, 'text-anchor': 'middle' }, g, c.t));
      S('text', { class: 'note', x: 135, y: 60, 'text-anchor': 'middle' }, g, 'molecules');
      S('text', { class: 'note', x: 400, y: 60, 'text-anchor': 'middle' }, g, 'a lattice of ions');
      S('text', { class: 'note', x: 665, y: 60, 'text-anchor': 'middle' }, g, 'a lattice of atoms');
      [267, 533].forEach(x => S('line', { x1: x, y1: 20, x2: x, y2: 400, stroke: 'var(--rule2)', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, g));
      /* water: each molecule in its own dashed ring, so it is one thing you can count */
      const SLOT = [[95, 170], [175, 170], [95, 240], [175, 240], [95, 100], [175, 100], [95, 310], [175, 310]];   /* 2 × 4, rings never touch */
      const wat = S('g', null, g), mols = SLOT.map(([x, y], i) => {
        const m = S('g', { opacity: 0 }, wat);
        S('circle', { cx: x, cy: y, r: 32, fill: 'none', stroke: 'var(--ink2)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4' }, m);
        D.mol(m, 'H2O', x, y - 4, 24, [0, 40, -30, 15, -50, 70, -10, 25][i]);
        return m;
      });
      /* the two lattices: every place of the biggest one drawn now, each shown from the stage it joins */
      function grid(cx, cy, el) {
        const n = SIDES[SIDES.length - 1], out = [];
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          const ring = Math.max(Math.abs(i - (n - 1) / 2), Math.abs(j - (n - 1) / 2)) + .5;   /* 1 = the middle 2 × 2 */
          const kind = el || ((i + j) % 2 ? 'Cl' : 'Na');
          const a = D.atom(g, cx + (i - (n - 1) / 2) * d, cy + (j - (n - 1) / 2) * d, D.EL[kind].r * d * .55, kind,
            el ? null : { sign: kind === 'Na' ? '+' : '−' });
          a.setAttribute('opacity', 0); out.push({ a, stage: ring - 1 });
        }
        return out;
      }
      const salt = grid(400, 210), cu = grid(665, 210, 'Cu');
      const cnt = COL.map(c => S('text', { class: 'lbl', x: c.x, y: 364, 'text-anchor': 'middle' }, g, ''));
      const sub = COL.map(c => S('text', { class: 'note', x: c.x, y: 388, 'text-anchor': 'middle' }, g, ''));
      /* the key: every circle named by what it draws */
      [['H', 'hydrogen atom'], ['O', 'oxygen atom'], ['Na', 'sodium ion (+)'], ['Cl', 'chloride ion (−)'], ['Cu', 'copper atom']].forEach(([el, t], i) => {
        const x = 30 + i * 154; D.atom(g, x, 428, el === 'Na' || el === 'Cl' ? 12 : 9, el, el === 'Na' ? { sign: '+' } : el === 'Cl' ? { sign: '−' } : null);
        S('text', { class: 'note', x: x + 17, y: 434 }, g, t);
      });
      let st = 0;
      const SAY = [
        '<b>The smallest pieces.</b> One water molecule has exactly 3 atoms: 2 hydrogen and 1 oxygen. The salt and the copper are lattices: particles in a regular pattern.',
        '<b>A bigger piece.</b> More water means more molecules, but each molecule still has exactly 3 atoms. The salt crystal does not get more "molecules": it is one lattice, and it just has more ions.',
        '<b>Bigger again.</b> You can count the atoms in one water molecule: always 3. In salt there is no separate piece to count: the lattice continues, so the number of ions depends only on how big the crystal is. Copper is the same.',
        '<b>NaCl does not count ions.</b> It gives the ratio: 1 sodium ion for each chloride ion. Count them: always the same number of each. A small grain of table salt has about <span style="white-space:nowrap">1 000 000 000 000 000 000</span> ions.'
      ];
      function paint(from) {
        const fade = (el, show) => { if (show && el.getAttribute('opacity') === '0') { el.dataset.f = 1; } el.setAttribute('opacity', show ? (el.dataset.f ? 0 : 1) : 0); };
        mols.forEach((m, i) => fade(m, i < MOLS[st]));
        salt.concat(cu).forEach(p => fade(p.a, p.stage <= st));
        const n = SIDES[st] * SIDES[st];
        cnt[0].textContent = MOLS[st] === 1 ? '1 molecule' : MOLS[st] + ' molecules'; sub[0].textContent = 'each one: 3 atoms, always';
        cnt[1].textContent = n + ' ions'; sub[1].textContent = n / 2 + ' sodium (+), ' + n / 2 + ' chloride (−)';
        cnt[2].textContent = n + ' atoms'; sub[2].textContent = 'all copper';
        const fresh = [...g.querySelectorAll('[data-f]')];
        fresh.forEach(e => e.removeAttribute('data-f'));
        k.anim(from === undefined ? 0 : 700, t => fresh.forEach(e => e.setAttribute('opacity', t.toFixed(2))));
        k.say('<p>' + SAY[st] + '</p><p><mark class="do">' + (st < 3 ? 'Press ➕ Bigger piece.' : 'Press ↺ Smallest piece to start again.') + '</mark></p>');
        big.disabled = st === 3; small.disabled = st === 0;
      }
      const big = k.btn('➕ Bigger piece', 300, 470, () => { if (st < 3) { st++; paint(st - 1); } });
      const small = k.btn('↺ Smallest piece', 520, 470, () => { st = 0; paint(); }, { cls: 'ghost' });
      paint();
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
