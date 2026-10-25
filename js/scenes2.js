/* ============================================================
   scenes2.js — Chemistry revision (25 Oct 2026): the pictures of parts 5–8.
   5 Three test tubes (a solution, a suspension, a colloid): shine a torch, leave them to stand, look under a microscope;
     and a graph to read with a ruler: salt on icy roads.
   6 A glass of fruit drink to make stronger or weaker; a solubility curve to read; a chart to choose a nail-varnish remover.
   7 Filtration (chalky water, then salt water), a sieve (rice and salt, then salt water), layers of liquids.
   8 Simple distillation, evaporation, chromatography of food colourings, and boiling salty water under a cold tray.
   Every outcome is what you would see in the lab (memory bench-sims-show-the-truth).
   ============================================================ */
(function () {
  'use strict';
  const P = window.PANEL, D = window.DRAW, S = D.S;

  /* ---------- a graph with a ruler the pupil drags along the x-axis ----------
     The ruler is a vertical line; where it meets the curve, a dashed line runs across to the y-axis. It never prints a
     value: the pupil reads the scale on the axis, as with a ruler on paper. */
  function rulerGraph(k, o) {
    const g = k.g, sc = D.axes(g, o.x, o.y, o.w, o.h, o.xr, o.yr, o.ax);
    D.line(g, sc, o.pts, o.color || '#2E7FD9', { smooth: o.smooth });
    if (o.title) S('text', { class: 'ttl', x: o.x, y: o.y - 22 }, g, o.title);
    const rl = S('g', { class: 'ruler' }, g);
    const vline = S('line', { stroke: '#D22F27', 'stroke-width': 3 }, rl);
    const hline = S('line', { stroke: '#D22F27', 'stroke-width': 2.2, 'stroke-dasharray': '7 5' }, rl);
    const dot = S('circle', { r: 7, fill: '#D22F27', stroke: 'var(--sheet)', 'stroke-width': 2 }, rl);
    const grip = S('rect', { width: 34, height: 26, rx: 8, fill: '#D22F27' }, rl);
    const gripT = S('text', { 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 900, fill: '#FFFFFF' }, rl, '↔');
    let xv = o.start == null ? (o.xr[0] + o.xr[1]) / 2 : o.start;
    function set(v) {
      xv = Math.max(o.xr[0], Math.min(o.xr[1], Math.round(v / (o.snap || 1)) * (o.snap || 1)));
      const X = sc.X(xv), yv = D.interp(o.pts, xv), Yp = sc.Y(yv);
      vline.setAttribute('x1', X); vline.setAttribute('x2', X); vline.setAttribute('y1', o.y - 4); vline.setAttribute('y2', o.y + o.h);
      hline.setAttribute('x1', o.x); hline.setAttribute('x2', X); hline.setAttribute('y1', Yp); hline.setAttribute('y2', Yp);
      dot.setAttribute('cx', X); dot.setAttribute('cy', Yp);
      grip.setAttribute('x', X - 17); grip.setAttribute('y', o.y + o.h + 62);
      gripT.setAttribute('x', X); gripT.setAttribute('y', o.y + o.h + 81);
      if (o.onMove) o.onMove(xv);
    }
    /* drag with a mouse, pen or finger anywhere on the plot (k.hit: on a phone the finger moves the ruler, not the picture);
       ◀ ▶ move it one step, from the keyboard too */
    const svg = k.svg;
    function toX(ev) { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return o.xr[0] + (p.x - o.x) / o.w * (o.xr[1] - o.xr[0]); }
    const area = k.hit(o.x - 10, o.y - 10, o.w + 20, o.h + 100);
    let drag = false;
    area.addEventListener('pointerdown', ev => { drag = true; if (area.setPointerCapture) area.setPointerCapture(ev.pointerId); set(toX(ev)); ev.preventDefault(); });
    area.addEventListener('pointermove', ev => { if (drag) set(toX(ev)); });
    ['pointerup', 'pointercancel'].forEach(t => area.addEventListener(t, () => { drag = false; }));
    const kb = k.btn('◀', o.x + o.w - 56, o.y - 30, () => set(xv - (o.snap || 1)), { cls: 'small ghost', aria: 'Move the ruler left' });
    const kf = k.btn('▶', o.x + o.w, o.y - 30, () => set(xv + (o.snap || 1)), { cls: 'small ghost', aria: 'Move the ruler right' });
    set(xv);
    return { sc, set, kb, kf };
  }

  /* ================= Part 5 · Three mixtures, and a graph ================= */
  P.define(5, [{
    id: 'tubes', name: 'Three mixtures', title: 'A solution, a suspension and a colloid',
    alt: 'Three test tubes: copper sulfate in water, chalk powder in water, and a little milk in water',
    draw(k) {
      const g = k.g;
      const T = [
        { x: 190, n: 'A', what: 'copper sulfate in water', c: '#3D8BEA', op: .55, kind: 'sol' },
        { x: 400, n: 'B', what: 'chalk powder in water', c: '#E2DDD2', op: .97, kind: 'sus' },
        { x: 610, n: 'C', what: 'a little milk in water', c: '#F2F2EE', op: .82, kind: 'col' }
      ];
      const top = 150, bot = 400, w = 64;
      S('rect', { x: 110, y: 112, width: 580, height: 300, rx: 16, fill: 'var(--grid)', opacity: .9 }, g);   /* a backdrop: white liquids show against it */
      const beams = S('g', null, g);
      T.forEach(t => {
        t.g = S('g', null, g);
        const x0 = t.x - w / 2, x1 = t.x + w / 2;
        const inner = `M${x0 + 2},${top} L${x0 + 2},${bot - 30} A${w / 2 - 2},${w / 2 - 2} 0 0 0 ${x1 - 2},${bot - 30} L${x1 - 2},${top} Z`;
        t.liq = D.liquid(t.g, inner, top + 20, bot, t.c, { level: .9, opacity: t.op });
        if (t.kind === 'sus') { t.grain = S('g', null, t.g); const r = D.rng(5); for (let i = 0; i < 70; i++) S('circle', { cx: x0 + 6 + r() * (w - 12), cy: top + 30 + r() * (bot - top - 40), r: 1.6, fill: '#CFC9BC' }, t.grain); }
        t.settled = S('path', { d: `M${x0 + 2},${bot - 30} A${w / 2 - 2},${w / 2 - 2} 0 0 0 ${x1 - 2},${bot - 30} L${x1 - 2},${bot - 52} L${x0 + 2},${bot - 52} Z`, fill: '#E4DFD3', stroke: '#B9B19E', 'stroke-width': 1, opacity: 0 }, t.g);
        S('path', { class: 'glass', d: `M${x0 - 5},${top - 4} L${x0},${top} L${x0},${bot - 30} A${w / 2},${w / 2} 0 0 0 ${x1},${bot - 30} L${x1},${top} L${x1 + 5},${top - 4}` }, t.g);
        S('path', { class: 'shine', d: `M${x0 + 8},${top + 16} L${x0 + 8},${bot - 40}`, opacity: .8 }, t.g);
        S('text', { class: 'ttl', x: t.x, y: 132, 'text-anchor': 'middle' }, g, t.n);
        S('text', { class: 'lbl-sm', x: t.x, y: 432, 'text-anchor': 'middle' }, g, t.what);
      });
      /* the rack */
      S('rect', { class: 'metal', x: 110, y: 340, width: 580, height: 12, rx: 3 }, g);
      const scope = S('g', { opacity: 0 }, g);
      let torch = false, stood = false, looked = false;
      function drawBeams() {
        while (beams.firstChild) beams.removeChild(beams.firstChild);
        if (!torch) return;
        T.forEach(t => {
          const y = 250, x0 = t.x - 92, xs = t.x - w / 2, xe = t.x + w / 2;
          /* a small torch to the left of each tube */
          S('rect', { x: x0 - 34, y: y - 10, width: 30, height: 20, rx: 4, fill: '#3A3F47' }, beams);
          S('path', { d: `M${x0 - 4},${y - 13} L${x0 + 6},${y - 16} L${x0 + 6},${y + 16} L${x0 - 4},${y + 13} Z`, fill: '#5B6573' }, beams);
          const beam = (a, b, op) => S('rect', { x: a, y: y - 9, width: b - a, height: 18, fill: '#FFE36E', opacity: op }, beams);
          beam(x0 + 6, xs, .75);
          if (t.kind === 'sol') beam(xe, xe + 26, .7);                               /* passes straight through, unseen inside */
          if (t.kind === 'sus') beam(xs, xs + 10, .5);                               /* blocked at once */
          if (t.kind === 'col') { S('rect', { x: xs, y: y - 11, width: xe - xs, height: 22, fill: '#FFC400', opacity: .85 }, beams); beam(xe, xe + 26, .3); }       /* the beam shows inside: scattered */
        });
      }
      function drawScope() {
        while (scope.firstChild) scope.removeChild(scope.firstChild);
        T.forEach(t => {
          const cx = t.x, cy = 62, r = 46, cid = D.id('sc'), defs = S('defs', null, scope), cp = S('clipPath', { id: cid }, defs);
          S('circle', { cx, cy, r: r - 2 }, cp);
          S('circle', { class: 'lens-ring', cx, cy, r, 'stroke-width': 3 }, scope);
          const inn = S('g', { 'clip-path': `url(#${cid})` }, scope);
          S('rect', { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, fill: t.kind === 'sol' ? '#9CC5F2' : '#EEF4F8' }, inn);
          const rr = D.rng(t.x);
          if (t.kind === 'sus') for (let i = 0; i < 6; i++) { const x = cx - 30 + rr() * 60, y = cy - 30 + rr() * 60, s = 8 + rr() * 9; S('path', { d: `M${x - s},${y} L${x - s * .3},${y - s * .8} L${x + s * .9},${y - s * .4} L${x + s * .6},${y + s * .7} L${x - s * .5},${y + s * .6} Z`, fill: '#D9D3C4', stroke: '#9C9584', 'stroke-width': 1.2 }, inn); }
          if (t.kind === 'col') for (let i = 0; i < 34; i++) S('circle', { cx: cx - 40 + rr() * 80, cy: cy - 40 + rr() * 80, r: 2 + rr() * 2.5, fill: '#FFFFFF', stroke: '#C9C4B5', 'stroke-width': .8 }, inn);
          if (t.kind === 'sol') S('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#174C88' }, inn, 'no pieces');
        });
      }
      function say() {
        const bits = [];
        if (!torch && !stood && !looked) bits.push('Three mixtures that look almost the same at first. One is a solution, one is a suspension and one is a colloid.');
        if (torch) bits.push('<b>Torch:</b> in A the light passes straight through: a solution is transparent. In B the chalk pieces block the light. In C you can see the beam inside the cloudy liquid: its tiny droplets scatter the light.');
        if (stood) bits.push('<b>One day later:</b> only the chalk in B has settled to the bottom. A solution and a colloid never settle.');
        if (looked) bits.push('<b>Microscope:</b> A shows no pieces (the dissolved particles are far too small to see). B shows big pieces of chalk. C shows many tiny droplets of fat.');
        k.say('<p>' + bits.join(' ') + '</p><p><mark class="do">Press 🔦 Torch, ⏱ Leave to stand and 🔬 Microscope.</mark></p>');
      }
      const bt = k.btn('🔦 Torch', 92, 470, () => { torch = !torch; bt.on(torch); drawBeams(); say(); }, { cls: 'small' });
      const bs = k.btn('⏱ Leave to stand', 250, 470, async () => {
        if (stood) return;
        bs.disabled = true; bs.set('⏱ One day later');
        const t = T[1];
        await k.anim(1800, u => { t.settled.setAttribute('opacity', u); t.liq.opacity(.96 - .7 * u); t.grain.setAttribute('opacity', 1 - u); });
        stood = true; say();
      }, { cls: 'small' });
      const bm = k.btn('🔬 Microscope', 560, 470, () => { looked = !looked; bm.on(looked); scope.setAttribute('opacity', looked ? 1 : 0); say(); }, { cls: 'small' });
      k.btn('↺', 720, 470, () => P.open(5, 'tubes'), { cls: 'small ghost', aria: 'Start again' });
      drawScope(); say();
    }
  }, {
    id: 'saltgraph', name: 'Graph: salt on roads', title: 'Freezing point of salt water',
    alt: 'A line graph: the freezing point of salt water falls from 0 °C to about −21 °C as the mass of salt rises from 0 to 30 g',
    draw(k) {
      rulerGraph(k, {
        x: 130, y: 64, w: 600, h: 300, xr: [0, 30, 5], yr: [-25, 0, 5], ax: { minorY: 1, minorX: 1, xTitle: 'Mass of salt dissolved in 100 g of water (g)', yTitle: 'Freezing point (°C)', yTitleGap: 64 },
        pts: D.SALT_FP, smooth: true, color: '#2E7FD9', snap: 1, start: 10,
        title: 'Freezing point of salt water'
      });
      k.say('<p>In winter, salt is spread on icy roads. Salt water freezes at a lower temperature than pure water.</p><p><mark class="do">Drag the red ruler along the graph, or press ◀ ▶. Read the value on the axis, not from the ruler.</mark></p>');
    }
  }]);

  /* ================= Part 6 · Concentration, solubility, choosing a solvent ================= */
  P.define(6, [{
    id: 'drink', name: 'Stronger or weaker', title: 'Making a drink stronger or weaker',
    alt: 'A beaker of fruit drink: solute particles as dots in the liquid; buttons add drink powder or water',
    draw(k) {
      const g = k.g, cx = 230, by = 440, w = 230, hh = 360;
      const bk = D.beaker(g, cx, by, w, hh, { color: '#F4D9E6', level: .3, opacity: .85 });
      for (let v = 100; v <= 500; v += 100) { const y = by - 2 - v / 550 * (hh - 6); S('line', { x1: cx + w / 2 - 22, y1: y, x2: cx + w / 2 - 4, y2: y, stroke: 'var(--glass)', 'stroke-width': 1.6 }, g); S('text', { class: 'note', x: cx + w / 2 + 8, y: y + 5 }, g, v + ' cm³'); }
      const dots = S('g', null, g);
      let vol = 150, n = 12;
      const rnd = D.rng(4), spots = [];
      for (let i = 0; i < 120; i++) spots.push([rnd(), rnd()]);
      const info = S('g', null, g);
      function draw() {
        const lev = vol / 550, top = by - 2 - lev * (hh - 6);
        bk.liq.set(lev);
        const c = Math.min(1, n / vol * 100 / 40);               /* the colour: paler when dilute */
        bk.liq.color(`rgb(${Math.round(244 - 88 * c)},${Math.round(217 - 175 * c)},${Math.round(230 - 120 * c)})`);
        while (dots.firstChild) dots.removeChild(dots.firstChild);
        const W = w - 32, Hh = by - top - 24, cols = Math.max(1, Math.round(Math.sqrt(n * W / Math.max(1, Hh)))), rows = Math.ceil(n / cols), cw = W / cols, ch = Hh / rows;
        for (let i = 0; i < n; i++) { const [a, b] = spots[i], c = i % cols, rw = Math.floor(i / cols); S('circle', { cx: cx - w / 2 + 16 + (c + .5 + (a - .5) * .5) * cw, cy: top + 12 + (rw + .5 + (b - .5) * .5) * ch, r: 7, fill: '#9C2A6B', stroke: '#5A1440', 'stroke-width': 1 }, dots); }
        while (info.firstChild) info.removeChild(info.firstChild);
        S('text', { class: 'ttl', x: 440, y: 120 }, info, `${n} solute particles`);
        S('text', { class: 'ttl', x: 440, y: 152 }, info, `in ${vol} cm³ of drink`);
        const per = (n / vol * 100);
        S('text', { class: 'note', x: 440, y: 184 }, info, `= ${per % 1 ? per.toFixed(1) : per} particles in each 100 cm³`);
        /* a meter: more dilute … more concentrated */
        S('rect', { x: 440, y: 220, width: 320, height: 22, rx: 11, fill: 'var(--surface)', stroke: 'var(--rule2)' }, info);
        S('rect', { x: 440, y: 220, width: Math.max(14, 320 * Math.min(1, per / 30)), height: 22, rx: 11, fill: '#9C2A6B' }, info);
        S('text', { class: 'note', x: 440, y: 266 }, info, 'more dilute');
        S('text', { class: 'note', x: 760, y: 266, 'text-anchor': 'end' }, info, 'more concentrated');
      }
      let last = '';
      const SAY = { start: 'Drink powder (the solute) is dissolved in water (the solvent).', squash: '<b>More powder, same volume:</b> more solute particles in each part of the drink. It is more concentrated.', water: '<b>More water:</b> the same solute particles spread through a bigger volume. It is more dilute.' };
      const say = () => k.say(`<p>${SAY[last || 'start']} Each dot stands for many solute particles; the water is shown as a plain colour.</p><p><mark class="do">Press + Powder or + Water, then compare the number in each 100 cm³.</mark></p>`);
      const bsq = k.btn('+ Powder', 480, 330, () => { if (n < 60) n += 6; last = 'squash'; draw(); say(); paint(); });
      const bw = k.btn('+ Water', 640, 330, () => { if (vol < 500) vol += 50; last = 'water'; draw(); say(); paint(); }, { cls: 'cold' });
      k.btn('↺ Start again', 560, 400, () => { vol = 150; n = 12; last = ''; draw(); say(); paint(); }, { cls: 'ghost small' });
      function paint() { bsq.disabled = n >= 60; bw.disabled = vol >= 500; }
      draw(); say(); paint();
    }
  }, {
    id: 'solgraph', name: 'Graph: solubility', title: 'Solubility of potassium nitrate',
    alt: 'A curve: the solubility of potassium nitrate in 100 g of water rises from about 13 g at 0 °C to about 169 g at 80 °C',
    draw(k) {
      rulerGraph(k, {
        x: 130, y: 64, w: 600, h: 300, xr: [0, 80, 10], yr: [0, 180, 20], ax: { minorY: 10, minorX: 5, xTitle: 'Temperature of the water (°C)', yTitle: 'Solubility (g in 100 g of water)', yTitleGap: 70 },
        pts: D.KNO3, smooth: true, color: '#7B3FA0', snap: 1, start: 20, title: 'Solubility of potassium nitrate'
      });
      k.say('<p>A scientist chose each temperature, then measured the greatest mass of potassium nitrate that could dissolve in 100 g of water: its solubility.</p><p><mark class="do">Drag the red ruler, or press ◀ ▶. Read the value on the axis.</mark></p>');
    }
  }, {
    id: 'solvents', name: 'Chart: solvents', title: 'Choosing a nail-varnish remover',
    alt: 'A bar chart of the boiling points of water 100 °C, ethanol 78 °C, ethyl ethanoate 77 °C and propanone 56 °C, with whether each dissolves nail varnish',
    draw(k) {
      const g = k.g, sc = D.axes(g, 130, 60, 600, 280, [0, 4, 1], [0, 120, 20], { yTitle: 'Boiling point (°C)', yTitleGap: 62 });
      /* the axes helper drew x ticks for 0…4: hide them under the bars' own names */
      g.querySelectorAll('.graph text').forEach(t => { if (+t.getAttribute('y') > 360) t.remove(); });
      const COL = ['#2E7FD9', '#16A34A', '#D97706', '#9333EA'];
      D.SOLVENTS.forEach((s, i) => {
        const x = 130 + 75 * (2 * i + 1) - 45, y = sc.Y(s.bp);
        S('rect', { x, y, width: 90, height: 340 - y, rx: 4, fill: COL[i] }, g);
        S('text', { class: 'lbl-sm', x: x + 45, y: 368, 'text-anchor': 'middle' }, g, s.n);
        const ok = s.dis === 'yes', some = s.dis === 'a little';
        S('text', { x: x + 45, y: 404, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 900, fill: ok ? '#167A3E' : some ? '#9A5B05' : '#B42318' }, g, ok ? '✓' : some ? '~' : '✗');
        S('text', { class: 'note', x: x + 45, y: 428, 'text-anchor': 'middle' }, g, s.dis);
      });
      S('text', { class: 'note', x: 40, y: 404 }, g, 'dissolves');
      S('text', { class: 'note', x: 40, y: 424 }, g, 'nail varnish?');
      S('text', { class: 'note', x: 130, y: 470 }, g, 'A lower boiling point means the liquid evaporates more quickly.');
      k.say('<p>A nail-varnish remover must dissolve nail varnish <u>and</u> evaporate quickly from the nails. Use both: the bars and the row of ticks.</p>');
    }
  }]);

  /* ================= Part 7 · Filtration, sieve, layers ================= */
  P.define(7, [{
    id: 'filter', name: 'Filtration', title: 'Filtration',
    alt: 'A beaker pours a mixture into a funnel lined with filter paper over a conical flask',
    draw(k) {
      const g = k.g, FX = 360;
      const fl = D.conical(g, FX, 460, 180, 170, { color: '#9CC8EE', level: 0, opacity: .65 });
      const f = D.funnel(g, FX, 176, 180, 112, 100);
      S('path', { class: 'paper', d: `M${f.x0 + 12},${f.ty + 4} L${f.cx},${f.yS + 2} L${f.x1 - 12},${f.ty + 4} Z` }, g);
      const res = S('path', { d: `M${f.cx},${f.yS - 2} Z`, fill: '#D9D3C4', stroke: '#9C9584', 'stroke-width': 1.2 }, g);
      const inF = S('path', { d: '', fill: '#E9E6DF', opacity: .85 }, g);
      const drips = S('g', null, g);
      const beakerG = S('g', null, g);
      const bk = D.beaker(beakerG, 0, 0, 110, 120, { color: '#E9E6DF', level: .7, opacity: .95 });
      const lbls = S('g', { opacity: 0 }, g);
      D.label(lbls, 530, 202, 'filter paper', { to: [418, 207] });
      D.label(lbls, 530, 256, 'funnel', { to: [398, 250] });
      const resL = D.label(lbls, 250, 268, 'residue', { anchor: 'end', to: [342, 270] });
      D.label(lbls, 560, 446, 'filtrate', { to: [402, 440] });
      D.label(lbls, 560, 392, 'conical flask', { to: [424, 398] });
      let mixture = 'chalk', busy = false;
      function placeBeaker(t) {           /* t 0: resting on the right; 1: tipped over the funnel */
        const x = 640 - 220 * t, y = 300 - 160 * t, a = -95 * t;
        beakerG.setAttribute('transform', `translate(${x} ${y}) rotate(${a})`);
      }
      placeBeaker(0);
      async function pour() {
        if (busy) return; busy = true; P.current()._busy = true;
        lbls.setAttribute('opacity', 0);
        await k.anim(800, t => placeBeaker(t));
        const stream = S('path', { d: '', stroke: mixture === 'chalk' ? '#E9E6DF' : '#BFE0F7', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, g);
        await k.anim(2600, t => {
          stream.setAttribute('d', t < .85 ? `M${FX - 62},${152} Q${FX - 40},${160} ${FX - 20},${198}` : '');
          bk.liq.set(.7 * (1 - t));
          const lv = Math.sin(Math.min(1, t * 1.4) * Math.PI) * 50;
          inF.setAttribute('d', lv > 2 ? `M${f.cx - lv * .78},${f.yS - lv} L${f.cx + lv * .78},${f.yS - lv} L${f.cx},${f.yS} Z` : '');
          inF.setAttribute('fill', mixture === 'chalk' ? '#E9E6DF' : '#BFE0F7');
          if (mixture === 'chalk') { const rh = 26 * Math.min(1, t * 1.2); res.setAttribute('d', `M${f.cx - rh * .78},${f.yS - rh} Q${f.cx},${f.yS - rh - 6} ${f.cx + rh * .78},${f.yS - rh} L${f.cx},${f.yS - 1} Z`); }
          fl.liq.set(.04 + .3 * t);
          while (drips.firstChild) drips.removeChild(drips.firstChild);
          if (t > .1 && t < .98) { const yy = f.yE + 6 + ((t * 2000) % 60); S('circle', { cx: f.cx, cy: yy, r: 3.6, fill: '#7EB8EA' }, drips); }
        });
        stream.remove();
        await k.anim(700, t => placeBeaker(1 - t));
        lbls.setAttribute('opacity', 1);
        resL.setAttribute('opacity', mixture === 'chalk' ? 1 : 0);
        busy = false; P.current()._busy = false;
        k.say(mixture === 'chalk'
          ? '<p><b>The chalk stays on the paper:</b> it is the residue. Chalk is insoluble, and its pieces are too big to pass through the tiny holes. The clear water that passes through is the filtrate.</p><p><mark class="do">Now press Filter salt water.</mark></p>'
          : '<p><b>Nothing stays on the paper.</b> The salt is dissolved: its particles are far smaller than the holes, so they pass through with the water. The filtrate is still salt water. Filtration cannot separate a dissolved solid.</p><p><mark class="do">Press Filter chalky water to compare.</mark></p>');
      }
      function reset(m) {
        mixture = m; bk.liq.set(.7); bk.liq.color(m === 'chalk' ? '#E9E6DF' : '#BFE0F7'); bk.liq.opacity(m === 'chalk' ? .95 : .7);
        fl.liq.set(0); res.setAttribute('d', ''); inF.setAttribute('d', ''); lbls.setAttribute('opacity', 0);
        b1.on(m === 'chalk'); b2.on(m === 'salt');
      }
      const b1 = k.btn('Filter chalky water', 600, 40, () => { if (!busy) { reset('chalk'); pour(); } });
      const b2 = k.btn('Filter salt water', 600, 92, () => { if (!busy) { reset('salt'); pour(); } }, { cls: 'cold' });
      reset('chalk');
      k.say('<p>The beaker holds chalk powder stirred into water. Chalk is insoluble in water.</p><p><mark class="do">Press Filter chalky water.</mark></p>');
    }
  }, {
    id: 'sieve', name: 'Sieve', title: 'A sieve: rice and salt, then salt water',
    alt: 'A wire-mesh sieve over a bowl, holding rice grains mixed with salt grains',
    draw(k) {
      const g = k.g, cx = 300, rimY = 196, depth = 92, R = 140;
      /* the bowl underneath */
      const bowlD = `M${cx - 160},${372} Q${cx},${478} ${cx + 160},${372} Z`;
      const water = D.liquid(g, bowlD, 380, 425, '#8EC3EE', { opacity: .9 });
      S('path', { d: bowlD, fill: 'var(--glass-fill)', stroke: 'var(--glass)', 'stroke-width': 2.6 }, g);
      const floorAt = x => { const t = (1 + (x - cx) / 160) / 2; return 372 + 212 * t * (1 - t); };   /* the inside of the bowl at x */
      const fallen = S('g', null, g);
      /* the sieve: a bowl of wire mesh with a rim and a handle; the mesh drawn inside its outline */
      const sieve = S('g', null, g);
      const shape = `M${cx - R},${rimY} Q${cx},${rimY + 2 * depth} ${cx + R},${rimY} Z`;
      const cid = D.id('mesh'), defs = S('defs', null, sieve), cp = S('clipPath', { id: cid }, defs);
      S('path', { d: shape }, cp);
      S('path', { d: shape, fill: 'rgba(160,170,182,.12)' }, sieve);
      const mesh = S('g', { 'clip-path': `url(#${cid})` }, sieve);
      for (let x = cx - R - depth * 2; x <= cx + R + depth * 2; x += 13) {
        S('line', { x1: x, y1: rimY, x2: x + 2 * depth, y2: rimY + 2 * depth, stroke: 'var(--metal-2)', 'stroke-width': 1.2 }, mesh);
        S('line', { x1: x, y1: rimY, x2: x - 2 * depth, y2: rimY + 2 * depth, stroke: 'var(--metal-2)', 'stroke-width': 1.2 }, mesh);
      }
      S('path', { d: `M${cx - R},${rimY} Q${cx},${rimY + 2 * depth} ${cx + R},${rimY}`, fill: 'none', stroke: 'var(--metal)', 'stroke-width': 3 }, sieve);
      S('line', { x1: cx - R - 6, y1: rimY, x2: cx + R + 6, y2: rimY, stroke: 'var(--metal)', 'stroke-width': 7, 'stroke-linecap': 'round' }, sieve);
      S('line', { x1: cx + R + 4, y1: rimY - 2, x2: cx + R + 110, y2: rimY - 34, stroke: 'var(--metal)', 'stroke-width': 9, 'stroke-linecap': 'round' }, sieve);
      const rice = S('g', null, sieve), salt = S('g', null, sieve);
      const r = D.rng(3), saltG = [];
      const inBowl = (u, v) => [cx + (u - .5) * 180, rimY + depth * .62 + v * depth * .32];
      for (let i = 0; i < 30; i++) { const [x, y] = inBowl(r(), r()); S('ellipse', { cx: x, cy: y, rx: 11, ry: 4.5, fill: '#FBFAF4', stroke: '#9C978A', 'stroke-width': 1.2, transform: `rotate(${r() * 180} ${x} ${y})` }, rice); }
      for (let i = 0; i < 46; i++) { const [x, y] = inBowl(r(), r()); saltG.push({ x, y, n: S('rect', { x: x - 2.4, y: y - 2.4, width: 4.8, height: 4.8, fill: '#FFFFFF', stroke: '#7D8794', 'stroke-width': .8 }, salt) }); }
      D.label(g, 40, 150, 'sieve (a wire mesh)', { cls: 'lbl-sm', to: [cx - 92, rimY + 22] });
      D.label(g, 520, 452, 'bowl', { cls: 'lbl-sm', to: [cx + 120, 420] });
      let mode = 'rice', shaken = false;
      k.btn('Shake the sieve', 640, 250, async b => {
        if (mode !== 'rice' || shaken) return;
        b.disabled = true;
        await k.anim(1700, t => {
          sieve.setAttribute('transform', `translate(${(Math.sin(t * 40) * 7 * (1 - t)).toFixed(1)} 0)`);
          saltG.forEach((sg, i) => { const f = Math.max(0, Math.min(1, t * 1.6 - (i % 10) * .06)); sg.n.setAttribute('transform', `translate(0 ${(f * (floorAt(sg.x) - 5 - (i % 3) * 4 - sg.y)).toFixed(1)})`); });
        });
        shaken = true;
        k.say('<p><b>The salt grains fall through the holes into the bowl; the rice grains are too big and stay in the sieve.</b> A sieve separates solid pieces by their size.</p><p><mark class="do">Now press Sieve salt water.</mark></p>');
      });
      k.btn('Sieve salt water', 640, 310, async b => {
        if (mode === 'water') return;
        mode = 'water'; b.disabled = true;
        rice.setAttribute('opacity', 0); salt.setAttribute('opacity', 0);
        const stream = S('path', { d: '', stroke: '#BFE0F7', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, g);
        await k.anim(2000, t => {
          stream.setAttribute('d', t < .9 ? `M${cx},${rimY + 2 * depth * .5 + 6} L${cx},${400}` : '');
          water.set(.85 * t);
        });
        stream.remove();
        k.say('<p><b>All the salt water passes through the sieve.</b> The dissolved salt particles are far smaller than the holes, so they pass through with the water: nothing stays in the sieve. A sieve cannot separate a dissolved solid from a solution.</p><p><mark class="do">Press Start again to repeat.</mark></p>');
      }, { cls: 'cold' });
      k.btn('↺ Start again', 640, 370, () => P.open(7, 'sieve'), { cls: 'ghost small' });
      k.say('<p>The sieve holds rice grains mixed with salt grains. The holes in the mesh are bigger than a salt grain but smaller than a rice grain.</p><p><mark class="do">Press Shake the sieve.</mark></p>');
    }
  }, {
    id: 'layers', name: 'Layers of liquids', title: 'Liquids that float on each other',
    alt: 'A tall cylinder with four layers: vegetable oil on water, on washing-up liquid, on honey',
    draw(k) {
      const g = k.g, x0 = 250, x1 = 410, top = 70, bot = 450;
      const L = [{ n: 'vegetable oil', d: .92, c: '#E9BC34' }, { n: 'water', d: 1.0, c: '#7EB8EA' }, { n: 'washing-up liquid', d: 1.05, c: '#7CC36A' }, { n: 'honey', d: 1.4, c: '#C9822B' }];
      const hh = (bot - top - 20) / 4;
      L.forEach((l, i) => {
        l.y0 = top + 20 + i * hh; l.y1 = l.y0 + hh;
        S('rect', { x: x0 + 3, y: l.y0, width: x1 - x0 - 6, height: hh, fill: l.c, opacity: .8 }, g);
        D.label(g, x1 + 30, (l.y0 + l.y1) / 2 + 6, `${l.n}: ${l.d.toFixed(2)} g/cm³`, { cls: 'lbl-sm' });
      });
      S('path', { d: `M${x0},${top} L${x0},${bot} L${x1},${bot} L${x1},${top}`, fill: 'none', stroke: 'var(--glass)', 'stroke-width': 3.5 }, g);
      S('text', { class: 'note', x: x0 - 20, y: top + 30, 'text-anchor': 'end' }, g, 'top');
      S('text', { class: 'note', x: x0 - 20, y: bot - 8, 'text-anchor': 'end' }, g, 'bottom');
      const objs = S('g', null, g);
      const ITEMS = [{ n: 'cork', d: .24, c: '#B5875A', x: 290 }, { n: 'bead 0.95', d: .95, c: '#E04F9C', x: 330 }, { n: 'bead 1.02', d: 1.02, c: '#5B4396', x: 370 }];
      const where = d => { let y = top; for (const l of L) { if (l.d > d) return l.y0; } return bot; };
      async function drop(it, b) {
        b.disabled = true;
        const node = S('circle', { cx: it.x, cy: top - 30, r: 13, fill: it.c, stroke: 'rgba(0,0,0,.45)', 'stroke-width': 1.4 }, objs);
        /* it floats where its weight is held: the part in the lower liquid is (d − d above) ÷ (d below − d above) */
        const lo = L.find(l => l.d > it.d), up = L[L.indexOf(lo) - 1], dUp = up ? up.d : 0, f = (it.d - dUp) / (lo.d - dUp);
        const yEnd = lo.y0 + 13 * (2 * f - 1);
        await k.anim(1400, t => node.setAttribute('cy', (top - 30 + (yEnd - top + 30) * (1 - Math.pow(1 - t, 2))).toFixed(1)));
        const on = L.find(l => l.d > it.d), through = L.filter(l => l.d < it.d);
        k.say(`<p><b>The ${it.n === 'cork' ? 'cork' : 'bead'} (${it.d.toFixed(2)} g/cm³)</b> ${through.length ? 'sinks through the ' + through.map(l => l.n + ' (' + l.d.toFixed(2) + ')').join(' and the ') + ', because it is denser than ' + (through.length > 1 ? 'them' : 'it') + ', and ' : ''}floats on the ${on.n} (${on.d.toFixed(2)}), because it is less dense than it.</p><p><mark class="do">Drop the other objects.</mark></p>`);
      }
      S('text', { class: 'lbl-sm', x: 125, y: 166, 'text-anchor': 'middle' }, g, 'Drop each object:');
      ITEMS.forEach((it, i) => { const b = k.btn(`⬇ ${it.n === 'cork' ? 'cork: 0.24' : it.n.replace('bead ', 'bead: ')} g/cm³`, 125, 200 + i * 56, () => drop(it, b), { cls: 'small' }); });
      k.btn('↺', 770, 40, () => P.open(7, 'layers'), { cls: 'small ghost', aria: 'Start again' });
      k.say('<p>The liquids were poured in slowly, one at a time, without stirring, so they form layers: the less dense liquid floats on the denser one. An object floats on a liquid that is denser than it, and sinks through a liquid that is less dense.</p><p><mark class="do">Drop each object and see where it stops.</mark></p>');
    }
  }]);

  /* ================= Part 8 · Distillation, evaporation, chromatography, the cold tray ================= */
  P.define(8, [{
    id: 'distil', name: 'Distillation', title: 'Simple distillation of salt water',
    alt: 'Salt water in a flask over a Bunsen burner; a thermometer; a condenser sloping down to a beaker',
    draw(k) {
      const g = k.g;
      const tri = D.tripod(g, 170, 470, 360, 120);
      const bun = D.bunsen(g, 170, 470, { h: 62, flame: 54 });
      const fl = D.rbFlask(g, 170, 290, 66, 170, { color: '#6FB3C9', level: .55 });
      /* the thermometer at the top of the flask, beside the side arm */
      const th = D.thermometer(g, 170, 92, 200, { min: 0, max: 110 });
      /* the condenser: an inner tube inside a cooling jacket, sloping down to the right */
      const ax = 183, ay = 190, bx = 560, byy = 330;
      const ang = Math.atan2(byy - ay, bx - ax) * 180 / Math.PI, Lc = Math.hypot(bx - ax, byy - ay);
      const cond = S('g', { transform: `translate(${ax} ${ay}) rotate(${ang})` }, g);
      S('rect', { x: 80, y: -26, width: Lc - 140, height: 52, rx: 14, fill: 'rgba(126,184,234,.35)', stroke: 'var(--glass)', 'stroke-width': 2.4 }, cond);
      S('rect', { x: 0, y: -7, width: Lc, height: 14, rx: 6, fill: 'var(--glass-fill)', stroke: 'var(--glass)', 'stroke-width': 2 }, cond);
      const vap = S('rect', { x: 0, y: -5, width: 0, height: 10, fill: '#FFFFFF', opacity: .0 }, cond);
      S('path', { d: `M${Lc - 120},26 l0,26 M100,-26 l0,-26`, stroke: 'var(--glass)', 'stroke-width': 2.4 }, cond);
      const beaker = D.beaker(g, 600, 470, 110, 110, { color: '#7EB8EA', level: 0, opacity: .7 });
      const drip = S('circle', { cx: 586, cy: 360, r: 4, fill: '#7EB8EA', opacity: 0 }, g);
      const bub = S('g', null, g), wisp = S('g', null, g);
      const lbl = S('g', { opacity: 0 }, g);
      D.label(lbl, 300, 70, 'thermometer', { to: [182, 110] });
      D.label(lbl, 430, 190, 'condenser', { to: [400, 250] });
      D.label(lbl, 470, 140, 'cold water out', { cls: 'lbl-sm', to: [287, 205] });
      D.label(lbl, 620, 300, 'cold water in', { cls: 'lbl-sm', to: [520, 334] });
      D.label(lbl, 690, 410, 'distillate', { to: [640, 430] });
      D.label(lbl, 300, 330, 'salt water', { to: [214, 316] });
      const temp = S('text', { class: 'lbl-sm', x: 30, y: 60 }, g, '');
      let running = false;
      const STEPS = [
        '<b>1.</b> The salt water is heated and boils.',
        '<b>2.</b> Water vapour (steam) rises and moves into the condenser. The thermometer reads 100 °C, the boiling point of water.',
        '<b>3.</b> Cold water flows around the condenser. It cools the vapour, and the vapour condenses into liquid water.',
        '<b>4.</b> Pure water, the distillate, drips into the beaker.',
        '<b>5.</b> The salt does not evaporate: it stays in the flask. Distillation keeps both the water and the salt.'
      ];
      const sayTo = n => k.say('<p>' + STEPS.slice(0, n).join(' ') + '</p>' + (n < 5 ? '' : '<p><mark class="do">Press Start again to watch it again.</mark></p>'));
      async function go() {
        if (running) return; running = true; P.current()._busy = true; start.disabled = true;
        bun.on(true); sayTo(1);
        const boil = setInterval(() => {
          if (!k.alive()) { clearInterval(boil); return; }
          while (bub.firstChild) bub.removeChild(bub.firstChild);
          while (wisp.firstChild) wisp.removeChild(wisp.firstChild);
          for (let i = 0; i < 7; i++) S('circle', { cx: 132 + Math.random() * 76, cy: 300 + Math.random() * 46, r: 2.5 + Math.random() * 3, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4 }, bub);
          for (let i = 0; i < 2; i++) S('path', { d: `M${163 + i * 12},${226 - Math.random() * 10} q-6,-10 0,-20`, fill: 'none', stroke: 'var(--ink3)', 'stroke-width': 2, opacity: .45 }, wisp);
        }, 160);
        await k.anim(1600, t => { th.set(20 + 80 * t); temp.textContent = 'Thermometer: ' + Math.round(20 + 80 * t) + ' °C'; });
        sayTo(2);
        await k.anim(1400, t => { vap.setAttribute('width', Lc * t); vap.setAttribute('opacity', .75); });
        sayTo(3);
        await k.wait(900);
        sayTo(4);
        await k.anim(3600, t => { beaker.liq.set(.45 * t); fl.liq.set(.55 - .3 * t); drip.setAttribute('opacity', 1); drip.setAttribute('cy', (352 + ((t * 3600) % 400) / 400 * 50).toFixed(1)); });
        drip.setAttribute('opacity', 0);
        clearInterval(boil); bun.on(false);
        while (bub.firstChild) bub.removeChild(bub.firstChild); while (wisp.firstChild) wisp.removeChild(wisp.firstChild);
        /* the salt left in the flask, as white crystals at the bottom */
        for (let i = 0; i < 16; i++) S('rect', { x: 140 + (i * 37) % 60, y: 344 + (i * 11) % 9, width: 6, height: 6, fill: '#FFFFFF', stroke: '#9AA3AE', 'stroke-width': .8, transform: `rotate(${i * 25} ${143 + (i * 37) % 60} ${347 + (i * 11) % 9})` }, g);
        lbl.setAttribute('opacity', 1); sayTo(5);
        running = false; P.current()._busy = false;
      }
      const start = k.btn('🔥 Light the Bunsen burner', 400, 470, go, { cls: 'warm' });
      k.btn('↺ Start again', 650, 40, () => P.open(8, 'distil'), { cls: 'ghost small' });
      k.say('<p>The flask holds salt water. The condenser is a tube with cold water flowing around it.</p><p><mark class="do">Press Light the Bunsen burner and watch each step.</mark></p>');
    }
  }, {
    id: 'evap', name: 'Evaporation', title: 'Evaporation of salt water',
    alt: 'An evaporating basin of salt water on a tripod and gauze over a Bunsen burner',
    draw(k) {
      const g = k.g, cx = 300;
      D.tripod(g, cx, 470, 330, 150);
      const bun = D.bunsen(g, cx, 470, { h: 62, flame: 60 });
      const inner = `M${cx - 110},${300} Q${cx},${360} ${cx + 110},${300} Z`;
      const liq = D.liquid(g, inner, 296, 330, '#6FB3C9', { level: .9, opacity: .8 });
      S('path', { d: `M${cx - 120},${296} Q${cx},${372} ${cx + 120},${296}`, fill: 'none', stroke: 'var(--glass)', 'stroke-width': 3 }, g);
      const wisp = S('g', null, g), crys = S('g', { opacity: 0 }, g);
      for (let i = 0; i < 24; i++) { const x = cx - 70 + (i * 41) % 140, y = 322 + (i * 13) % 12; S('rect', { x: x - 3, y: y - 3, width: 6, height: 6, fill: '#FFFFFF', stroke: '#9AA3AE', 'stroke-width': .8, transform: `rotate(${i * 21} ${x} ${y})` }, crys); }
      D.label(g, 470, 300, 'evaporating basin', { to: [cx + 100, 306] });
      const vl = D.label(g, 470, 170, 'water vapour into the air', { to: [cx + 30, 200] });
      vl.setAttribute('opacity', 0);
      async function go(b) {
        b.disabled = true; bun.on(true); P.current()._busy = true;
        const tm = setInterval(() => {
          if (!k.alive()) { clearInterval(tm); return; }
          while (wisp.firstChild) wisp.removeChild(wisp.firstChild);
          for (let i = 0; i < 5; i++) { const x = cx - 70 + i * 34 + Math.random() * 10, y = 270 - Math.random() * 30; S('path', { d: `M${x},${y} q-10,-14 0,-28 q10,-14 0,-28`, fill: 'none', stroke: 'var(--ink3)', 'stroke-width': 2.2, opacity: .5, 'stroke-linecap': 'round' }, wisp); }
        }, 160);
        vl.setAttribute('opacity', 1);
        k.say('<p><b>The water evaporates</b>: it changes to water vapour and mixes with the air. Nothing collects it: the water is lost.</p>');
        await k.anim(4200, t => { liq.set(.9 * (1 - t)); crys.setAttribute('opacity', Math.max(0, (t - .55) / .45)); });
        clearInterval(tm); bun.on(false); while (wisp.firstChild) wisp.removeChild(wisp.firstChild); vl.setAttribute('opacity', 0);
        P.current()._busy = false;
        k.say('<p><b>Salt crystals are left in the basin.</b> Evaporation recovers the dissolved solid, but the solvent (the water) is lost into the air. Distillation collects the water as well.</p><p><mark class="do">Press Start again to repeat.</mark></p>');
      }
      k.btn('🔥 Heat the salt water', 560, 440, go, { cls: 'warm' });
      k.btn('↺ Start again', 650, 40, () => P.open(8, 'evap'), { cls: 'ghost small' });
      k.say('<p>The evaporating basin holds salt water.</p><p><mark class="do">Press Heat the salt water.</mark></p>');
    }
  }, {
    id: 'chroma', name: 'Chromatography', title: 'Chromatography of food colourings',
    alt: 'A chromatography paper in a beaker of solvent, with six spots on a pencil start line',
    draw(k) {
      const g = k.g, px0 = 300, px1 = 660, base = 420, solv = 444, frontEnd = 96;
      const LANES = [
        { n: 'Y', key: 'yellow dye (E102)', dyes: ['y'] }, { n: 'R', key: 'red dye (E129)', dyes: ['r'] }, { n: 'B', key: 'blue dye (E133)', dyes: ['b'] },
        { n: '1', key: 'brown sweet', dyes: ['y', 'r', 'b'] }, { n: '2', key: 'orange sweet', dyes: ['y', 'r'] }, { n: '3', key: 'orange drink', dyes: ['y', 'r', 'p'] }
      ];
      const DYE = { y: { c: '#E8B90F', rf: .8 }, b: { c: '#2563EB', rf: .55 }, r: { c: '#DC2626', rf: .36 }, p: { c: '#C026D3', rf: .17 } };
      const MIXC = { Y: '#E8B90F', R: '#DC2626', B: '#2563EB', 1: '#7A4A2B', 2: '#EA7A12', 3: '#C2410C' };
      /* the beaker and the paper */
      D.beaker(g, (px0 + px1) / 2, 480, px1 - px0 + 60, 430, { color: '#BFE0F7', level: .1, opacity: .7 });
      S('rect', { class: 'paper', x: px0, y: 60, width: px1 - px0, height: base + 50 - 60 }, g);
      S('rect', { x: px0 - 30, y: 46, width: px1 - px0 + 60, height: 10, rx: 3, fill: 'var(--metal)' }, g);
      const wet = S('rect', { x: px0 + 1, y: solv, width: px1 - px0 - 2, height: 0, fill: '#BFE0F7', opacity: .35 }, g);
      S('line', { x1: px0 + 6, y1: base, x2: px1 - 6, y2: base, stroke: '#7A7F87', 'stroke-width': 2 }, g);
      const frontL = S('line', { x1: px0 + 4, y1: solv, x2: px1 - 4, y2: solv, stroke: '#3B82F6', 'stroke-width': 2, 'stroke-dasharray': '7 6', opacity: 0 }, g);
      const spots = [], dx = (px1 - px0) / (LANES.length + 1);
      LANES.forEach((l, i) => {
        const x = px0 + dx * (i + 1);
        S('text', { class: 'lbl-sm', x, y: base + 34, 'text-anchor': 'middle', style: 'fill:#1F2937' }, g, l.n);   /* on the paper, which stays light in the dark version */
        l.start = S('ellipse', { cx: x, cy: base, rx: 9, ry: 8, fill: MIXC[l.n] }, g);
        l.dyes.forEach(d => spots.push({ x, d, n: S('ellipse', { cx: x, cy: base, rx: 9, ry: 8, fill: DYE[d].c, opacity: 0 }, g) }));
      });
      /* the key, on the left */
      S('text', { class: 'ttl', x: 30, y: 96 }, g, 'Key');
      LANES.forEach((l, i) => { S('text', { class: 'lbl-sm', x: 30, y: 128 + i * 30 }, g, l.n + ' = ' + l.key); });
      D.label(g, px0 - 14, base + 6, 'start line (pencil)', { anchor: 'end', cls: 'lbl-sm' });
      const fl = D.label(g, px0 - 14, frontEnd + 6, 'solvent front', { anchor: 'end', cls: 'lbl-sm' }); fl.setAttribute('opacity', 0);
      D.label(g, px0 - 14, 466, 'solvent', { anchor: 'end', cls: 'lbl-sm' });
      let ran = false;
      async function run(b) {
        if (ran) return; b.disabled = true; P.current()._busy = true;
        frontL.setAttribute('opacity', 1);
        await k.anim(4200, t => {
          const fy = solv - (solv - frontEnd) * t;
          frontL.setAttribute('y1', fy); frontL.setAttribute('y2', fy);
          wet.setAttribute('y', fy); wet.setAttribute('height', solv - fy);
          const dist = (base - frontEnd) * Math.max(0, (solv - fy - (solv - base)) / (base - frontEnd));
          spots.forEach(s => { s.n.setAttribute('opacity', .92); s.n.setAttribute('cy', (base - DYE[s.d].rf * dist).toFixed(1)); s.n.setAttribute('ry', 8 + 3 * t); });
          LANES.forEach(l => l.start.setAttribute('opacity', 1 - t));
        });
        fl.setAttribute('opacity', 1); ran = true; P.current()._busy = false;
        k.say('<p><b>The chromatogram.</b> Each dye travelled its own distance. Compare each sample with the dyes Y, R and B: a spot at the same height, with the same colour, is the same dye.</p>');
      }
      k.btn('▶ Run the chromatography', 480, 30, run);
      k.btn('↺', 770, 30, () => P.open(8, 'chroma'), { cls: 'small ghost', aria: 'Start again' });
      k.say('<p>A spot of each colouring sits on the pencil start line. The solvent is below the line.</p><p><mark class="do">Press Run the chromatography.</mark></p>');
    }
  }, {
    id: 'tray', name: 'Cold tray', title: 'Boiling salty water under a cold tray',
    alt: 'A pan of boiling salty water on a hot plate; a cold tray with ice slopes above it; drops slide down the tray and drip into a cup',
    draw(k) {
      const g = k.g;
      const gg = S('g', { transform: 'translate(120 30)' }, g);
      const parts = D.trayPic(gg);
      const drops = S('g', null, gg);
      k.say('<p>Look at the picture. Where does the water <b>evaporate</b>? Where does it <b>condense</b>? Where is it <b>collected</b>? What <b>remains</b> in the pan?</p><p><mark class="do">Use these four words in your written answer.</mark></p>');
      let tt = 0;
      k.loop(dt => {
        tt += dt;
        while (drops.firstChild) drops.removeChild(drops.firstChild);
        for (let i = 0; i < 3; i++) { const f = ((tt * .35 + i / 3) % 1); const x = 100 + f * 300, y = 172 + f * 42 + 4; S('circle', { cx: x, cy: y, r: 3.6, fill: '#7EB8EA' }, drops); }
        const f2 = (tt * .9) % 1; S('circle', { cx: 402, cy: 212 + f2 * 70, r: 3.6, fill: '#7EB8EA' }, drops);
        parts.cup.liq.set(Math.min(.65, .3 + tt * .006));
      });
    }
  }]);
})();
