/* ============================================================
   lens.js — Chemistry revision (26 Oct 2026): a round lens of liquid water, for the extension "why water dissolves sugar
   and salt" (Part 6). A copy of liquidLens and lens from Separating mixtures (js/kit.js, 15 Oct 2026), so both pages
   draw water as the pupils' particle model does; two additions:
   - hug: 'both' (a molecule with slightly positive AND slightly negative parts, such as sugar): its four water molecules
     take turns, oxygen end inwards (slots 0 and 2, at the molecule's slightly positive parts) and a hydrogen end inwards
     (slots 1 and 3, at its slightly negative parts);
   - draw(g, r) draws a particle of its own (the sugar molecule), and spin: true turns it with its water molecules;
   - o.halo: a dashed blue ring round each dissolved particle and the water molecules holding it, so the eye finds them.
   Any change to the water's drawing or motion belongs in BOTH copies.
   ============================================================ */
(function () {
  'use strict';
  const D = window.DRAW, S = D.S, id = D.id;
  /* ---------------- the particles of liquid water (15 Oct 2026, Daniel: "if you're showing water as a liquid, you show
     the molecules moving past each other, but still with a hydrogen bond … if it's a solid, they're in a lattice … if it's
     a gas, they're passing past each other, but not bonding … otherwise you're gonna confuse the students"; and fewer,
     bigger particles, so a lens is never crowded). The pupils' particle model, as they drew it in class.
     liquidLens(k, lz, o) fills a lens with water particles that TOUCH and slide past each other: each frame they jiggle,
     then any two that overlap are pushed apart and the walls keep them in, so they stay packed but never fixed in place.
     Dashed hydrogen bonds join a hydrogen atom of one particle to the oxygen atom of a neighbour; they break and form
     again as the particles move.
     Dissolved particles (Daniel, same day: "the solvent … hugs … the solute … water will hug … ions of sodium and …
     chloride") are each held by four water particles that move with them: around a positive ion (sodium, the minerals)
     the water particles turn their OXYGEN atom inwards; around a negative ion (chloride) each turns ONE HYDROGEN atom
     inwards. add() shows it happening: the four nearest water particles turn and close round the new ion.
       o.scale   size (1: oxygen radius 12)      o.fill   share of the space the particles fill (.68: touching)
       o.box     the lens's square is the container (for a flow), not its circle
       o.flow    px/s downwards; a particle that leaves at the bottom comes back in at the top (filtration)
       o.drain   { x, y, w }: a hole w wide at (x, y) in a paper: the liquid above the paper slides sideways to it
       o.solids  [{ rect: [x0, y0, x1, y1] } | { circle: [x, y, r] } | { floor: x => y }]: places no particle enters
       o.extra   [{ kind, n, r, fill, hug: '+' | '-', sign, at: [[x, y]] }]: other particles among the water (held by water if hug
                 is set), at the places given or anywhere
     Returns { add(extra, at), setSolids(list), count(kind), destroy() }. */
  function liquidLens(k, lz, o) {
    o = o || {};
    const p = lz.inner, cx = lz.x, cy = lz.y, R = lz.r, s = o.scale || 1;
    const rO = 12 * s, rH = 7 * s, hx = 10 * s, hy = 8 * s, RW = 20 * s, reach = rH + rO + 10 * s, T = (o.speed || 24) * s;
    const DEG = Math.PI / 180, HA = Math.atan2(hy, hx) / DEG, HL = Math.hypot(hx, hy);
    let solids = o.solids || [];
    const rnd = (() => { let q = o.seed || 3; return () => (q = (q * 9301 + 49297) % 233280) / 233280; })();
    const root = S('g', null, p), halos = S('g', null, root), bonds = S('g', null, root), layer = S('g', null, root), pool = [], ps = [];
    let stopped = false;
    const inSolid = (x, y, r) => solids.some(sh => sh.rect ? x > sh.rect[0] - r && x < sh.rect[2] + r && y > sh.rect[1] - r && y < sh.rect[3] + r
      : sh.circle ? Math.hypot(x - sh.circle[0], y - sh.circle[1]) < sh.circle[2] + r : sh.floor ? y > sh.floor(x) - r : false);
    const inside = (x, y, r) => o.box ? Math.abs(x - cx) <= R - r * .5 && Math.abs(y - cy) <= R - r * .5 : Math.hypot(x - cx, y - cy) < R - r - 2;
    const atom = (g, x, y, r, fill) => S('circle', { cx: x, cy: y, r, fill, stroke: 'rgba(0,0,0,.35)', 'stroke-width': .9 }, g);
    const makeWater = () => { const g = S('g', null, layer); atom(g, -hx, hy, rH, '#F4F6F8'); atom(g, hx, hy, rH, '#F4F6F8'); atom(g, 0, 0, rO, '#E0533F'); return g; };
    const water = (x, y, a) => ({ g: makeWater(), x, y, vx: 0, vy: 0, a, va: 0, r: RW, water: true });
    /* the four places round an ion, in the ion's own frame: [x, y, angle of the water particle] */
    const slots = (e, n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const th = (i * 360 / n + 45) * DEG;
        if (e.hug === '-' || (e.hug === 'both' && i % 2)) { const d = e.r + rH + 1 * s + HL; out.push([Math.cos(th) * d, Math.sin(th) * d, th / DEG + 180 - HA]); }   /* one H inwards */
        else { const d = e.r + rO + 1 * s; out.push([Math.cos(th) * d, Math.sin(th) * d, th / DEG - 90]); }                             /* O inwards */
      }
      return out;
    };
    const hR = e => e.r + rH + 1 * s + HL + rO + 1 * s, oR = e => Math.hypot(e.r + rO + 1 * s + hy, hx) + rH;
    const hugR = e => e.hug === '-' ? hR(e) : e.hug === 'both' ? Math.max(hR(e), oR(e)) : oR(e);
    const other = (e, x, y) => {
      const q = { g: S('g', null, layer), x, y, vx: 0, vy: 0, a: rnd() * 360, va: 0, r: e.r + 3 * s, water: false, kind: e.kind, full: e.hug ? hugR(e) : e.r + 3 * s, form: 1, shell: [] };
      q.spin = !!e.spin;
      if (e.draw) e.draw(q.g, e.r); else atom(q.g, 0, 0, e.r, e.fill);
      if (e.sign) S('text', { x: 0, y: e.r * .42, 'text-anchor': 'middle', 'font-size': Math.max(13, e.r * 1.25), 'font-weight': 900, fill: '#FFFFFF' }, q.g, e.sign);   /* a small ion's sign stays readable */
      if (e.hug) { q.r = q.full; slots(e, 4).forEach(sl => q.shell.push({ w: water(0, 0, 0), sl, from: null })); }
      if (e.hug && o.halo) q.halo = S('circle', { r: q.full + 2 * s, fill: '#1D5FBF', 'fill-opacity': .07, stroke: '#1D5FBF', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, halos);
      return q;
    };
    /* how many: o.fill of the free space (the container less its solids), counted on a fine grid; they start on a loose
       honeycomb (any left over at random), then jiggle into a liquid's random packing */
    const capacity = () => { let free = 0; for (let y = cy - R; y < cy + R; y += 4) for (let x = cx - R; x < cx + R; x += 4) if (inside(x, y, 0) && !inSolid(x, y, 0)) free += 16; return (o.fill || .68) * free; };
    const used = () => ps.reduce((t, q) => t + Math.PI * (q.full || q.r) * (q.full || q.r), 0);
    const d = 2 * RW * 1.04, cand = [];
    for (let row = 0, y = cy - R + RW * .6; y < cy + R; row++, y += d * .866)
      for (let x = cx - R + RW * .6 + (row % 2) * d / 2; x < cx + R; x += d) if (inside(x, y, RW) && !inSolid(x, y, RW * .9)) cand.push([x, y]);
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    const spot = () => { for (let t = 0; t < 200; t++) { const x = cx - R + rnd() * 2 * R, y = cy - R + rnd() * 2 * R; if (inside(x, y, RW * .5) && !inSolid(x, y, RW * .5)) return [x, y]; } return [cx, cy]; };
    const cap0 = capacity();
    let c = 0;
    (o.extra || []).forEach(e => { for (let i = 0; i < e.n; i++) { const [x, y] = (e.at && e.at[i]) || cand[c++] || spot(); ps.push(other(e, x, y)); } });
    while (used() + Math.PI * RW * RW <= cap0) { const [x, y] = cand[c++] || spot(); ps.push(water(x, y, rnd() * 360)); }
    function wall(q) {
      const r = q.r;
      if (o.box) { q.x = Math.max(cx - R + r * .5, Math.min(cx + R - r * .5, q.x)); if (!o.flow) q.y = Math.max(cy - R + r * .5, Math.min(cy + R - r * .5, q.y)); }
      else { const dx = q.x - cx, dy = q.y - cy, dd = Math.hypot(dx, dy), lim = R - r - 1; if (dd > lim) { q.x = cx + dx / dd * lim; q.y = cy + dy / dd * lim; q.vx *= -.5; q.vy *= -.5; } }
      solids.forEach(sh => {
        if (sh.rect) {
          const [x0, y0, x1, y1] = sh.rect, nx = Math.max(x0, Math.min(x1, q.x)), ny = Math.max(y0, Math.min(y1, q.y)), dx = q.x - nx, dy = q.y - ny, dd = Math.hypot(dx, dy);
          if (dd > 0 && dd < r) { q.x = nx + dx / dd * r; q.y = ny + dy / dd * r; }       /* touching an edge or a corner: out along the nearest point */
          else if (dd === 0) { const l = q.x - x0 + r, rr = x1 + r - q.x, t = q.y - y0 + r, b = y1 + r - q.y, m = Math.min(l, rr, t, b); if (m === l) q.x -= l; else if (m === rr) q.x += rr; else if (m === t) q.y -= t; else q.y += b; }
        }
        else if (sh.circle) { const [sx, sy, sr] = sh.circle, dx = q.x - sx, dy = q.y - sy, dd = Math.hypot(dx, dy) || 1, m = sr + r; if (dd < m) { q.x = sx + dx / dd * m; q.y = sy + dy / dd * m; } }
        else if (sh.floor) { const f = sh.floor(q.x) - r; if (q.y > f) q.y = f; }
      });
    }
    function relax(times) {
      for (let t = 0; t < times; t++) {
        for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r, d2 = dx * dx + dy * dy;
          if (d2 < m * m && d2 > 1e-6) { const dd = Math.sqrt(d2), push = (m - dd) / 2, ux = dx / dd, uy = dy / dd; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
        }
        ps.forEach(wall);
      }
    }
    function step(dt, rand) {
      ps.forEach(q => {
        const slow = q.shell && q.shell.length ? .6 : 1;                 /* an ion with its water moves a little slower */
        q.vx += (rand() - .5) * T * 8 * dt; q.vy += (rand() - .5) * T * 8 * dt;
        const sp = Math.hypot(q.vx, q.vy), top = T * slow; if (sp > top) { q.vx *= top / sp; q.vy *= top / sp; }
        /* a hole: over the paper the liquid slides sideways towards it; in the hole it flows faster, as much per second as
           flows below the paper (a flow speeds up where it narrows), so nothing piles up */
        let down = o.flow || 0;
        if (o.drain && q.y < o.drain.y + 30) {
          const dx = q.x - o.drain.x, half = o.drain.w / 2;
          if (Math.abs(dx) < half - q.r * .5) down *= 2 * R / o.drain.w;
          else if (q.y < o.drain.y) { down *= .15; q.x -= Math.sign(dx) * (o.flow || 0) * 1.6 * dt; }
          /* a big particle (an ion with its water) is carried along the middle of the stream, so it meets the hole square on */
          if (!q.water && q.y > o.drain.y - 160) q.x -= dx * Math.min(1, dt * 1.6);
        }
        q.x += q.vx * dt; q.y += (q.vy + down) * dt;
        q.va = Math.max(-50, Math.min(50, (q.va + (rand() - .5) * 240 * dt) * .98)); q.a += q.va * dt * slow;
        if (q.form < 1) { q.form = Math.min(1, q.form + dt / 2); q.r = q.r0 + (q.full - q.r0) * q.form; }
        if (o.flow && q.y > cy + R + q.r) { q.y = cy - R - q.r; q.x = cx - R + q.r + rand() * (2 * R - 2 * q.r); }
      });
      relax(3);
    }
    /* every water particle in the lens, with where it is drawn now: the free ones, and the ones holding an ion */
    function bodies() {
      const out = [];
      ps.forEach(q => {
        if (q.water) { out.push(q); return; }
        const co = Math.cos(q.a * DEG), sn = Math.sin(q.a * DEG), e = q.form < 1 ? q.form * q.form * (3 - 2 * q.form) : 1;
        q.shell.forEach(sh => {
          const tx = q.x + sh.sl[0] * co - sh.sl[1] * sn, ty = q.y + sh.sl[0] * sn + sh.sl[1] * co, ta = q.a + sh.sl[2];
          if (sh.from && e < 1) { let da = ((ta - sh.from[2]) % 360 + 540) % 360 - 180; sh.w.x = sh.from[0] + (tx - sh.from[0]) * e; sh.w.y = sh.from[1] + (ty - sh.from[1]) * e; sh.w.a = sh.from[2] + da * e; }
          else { sh.w.x = tx; sh.w.y = ty; sh.w.a = ta; }
          out.push(sh.w);
        });
      });
      return out;
    }
    function draw() {
      ps.forEach(q => { if (q.halo) { q.halo.setAttribute('cx', q.x.toFixed(1)); q.halo.setAttribute('cy', q.y.toFixed(1)); q.halo.setAttribute('r', (q.r + 2 * s).toFixed(1)); } });
      ps.forEach(q => q.g.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})` + (q.water || q.spin ? ` rotate(${q.a.toFixed(0)})` : '')));
      const W = bodies();
      W.forEach(w => { if (!w.water || !ps.includes(w)) w.g.setAttribute('transform', `translate(${w.x.toFixed(1)} ${w.y.toFixed(1)}) rotate(${w.a.toFixed(0)})`); });
      let n = 0;
      W.forEach(q => {
        const co = Math.cos(q.a * DEG), sn = Math.sin(q.a * DEG);
        [-1, 1].forEach(sd => {
          const x = q.x + sd * hx * co - hy * sn, y = q.y + sd * hx * sn + hy * co;
          let best = null, bd = reach;
          W.forEach(w => { if (w === q) return; const dd = Math.hypot(w.x - x, w.y - y); if (dd < bd) { bd = dd; best = w; } });
          if (!best) return;
          const ux = (best.x - x) / bd, uy = (best.y - y) / bd;
          const ln = pool[n] || (pool[n] = S('line', { stroke: '#2F4A66', 'stroke-width': 1.8 * Math.max(.8, s), 'stroke-dasharray': '3 2.5', 'stroke-linecap': 'round' }, bonds));
          ln.style.display = '';
          ln.setAttribute('x1', (x + ux * rH).toFixed(1)); ln.setAttribute('y1', (y + uy * rH).toFixed(1));
          ln.setAttribute('x2', (best.x - ux * rO).toFixed(1)); ln.setAttribute('y2', (best.y - uy * rO).toFixed(1));
          n++;
        });
      });
      for (let i = n; i < pool.length; i++) pool[i].style.display = 'none';
    }
    /* fit what is there into the space: free water particles leave (those inside a solid first) until it fits */
    function fit() {
      const cap = capacity();
      ps.filter(q => q.water && inSolid(q.x, q.y, 0)).forEach(q => { q.g.remove(); ps.splice(ps.indexOf(q), 1); });
      while (used() > cap) { const W = ps.filter(q => q.water); if (!W.length) break; const q = W[Math.floor(rnd() * W.length)]; q.g.remove(); ps.splice(ps.indexOf(q), 1); }
    }
    relax(30); for (let i = 0; i < 40; i++) step(1 / 30, rnd);
    draw();
    if (!k.FAST) k.loop(dt => { if (stopped || !root.isConnected) return false; step(dt, Math.random); draw(); return true; });
    return {
      /* a new particle among the water, at [x, y] (or a random place); one that is held by water takes the four nearest
         water particles, which turn and close round it */
      add(e, at) {
        const [x, y] = at || spot(), q = other(e, x, y);
        if (e.hug) {
          const free = ps.filter(w => w.water).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
          q.shell.forEach((sh, i) => { const w = free[i]; if (!w) return; sh.w.g.remove(); sh.w = w; sh.from = [w.x, w.y, w.a]; ps.splice(ps.indexOf(w), 1); });
          q.r0 = e.r + 3 * s; q.r = q.r0; q.form = k.FAST ? 1 : 0; if (k.FAST) q.r = q.full;
        }
        ps.push(q); fit(); relax(4); draw();
      },
      setSolids(list) { solids = list; fit(); relax(20); draw(); },
      count(kind) { return ps.filter(q => q.kind === kind).length; },
      destroy() { stopped = true; root.remove(); }
    };
  }
  /* a round "zoom" lens drawn at (x, y): returns its inner group, clipped to the circle */
  function lens(p, x, y, r, title, sub) {
    const g = S('g', { class: 'lens' }, p), cid = id('lens');
    const defs = S('defs', null, g), cp = S('clipPath', { id: cid }, defs);
    S('circle', { cx: x, cy: y, r: r - 2 }, cp);
    S('circle', { class: 'zoom-ring', cx: x, cy: y, r }, g);
    const inner = S('g', { 'clip-path': `url(#${cid})` }, g);
    if (title) S('text', { class: 'zoom-cap', x, y: y + r + 21, 'text-anchor': 'middle' }, g, title);
    if (sub) { const parts = String(sub).split(' · '); parts.forEach((t, i) => S('text', { class: 'zoom-sub', x, y: y + r + (title ? 42 : 21) + i * 19, 'text-anchor': 'middle' }, g, t)); }   /* 19 apart at 15 units (16 Oct 2026: bigger words) */
    return { g, inner, x, y, r };
  }
  window.LENS = { lens, liquidLens };
})();
