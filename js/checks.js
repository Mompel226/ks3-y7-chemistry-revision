/* ============================================================
   checks.js — the checks of Chemistry revision (25 Oct 2026): how each kind is drawn, marked and kept.
   Built on the checks of Separating mixtures (its js/checks.js), with Daniel's help for revision (25 Oct 2026):
   - Key words are TYPED into gaps: spelling counts, capitals do not (chemical symbols: capitals count too). A gap
     accepts every scientific word that makes its sentence right ("reversible" or "physical"), never an everyday word
     ("shrinks" for contracts); the first word listed is the one the first letter, the word list and the answers show. The pupil
     types first; "Show the first letter" puts in the first letter of the gap they are working on, one gap at a time.
     "Show the word list" (Daniel, 26 Oct 2026: "two options, first letter or all the words in random order") shows every
     gap's word once, in a random order kept for that pupil, under the sentence; it does not say which gap takes which.
   - Some checks have a 💡 Hint: an idea to think about, never the answer.
   - A first letter, the word list or a hint counts as a try on the teacher's board, so "right first time" stays honest:
     it is sent as a check that was not right, with the help named ("first letter, gap 2", "word list", "hint") among the
     answers it struggled with.
   - Multiple choice: a new random order each time it is drawn; a wrong choice says only "Not this one"; the reason
     comes with the right answer. The record keeps each option by its place in the list (o0 = the first written).
   - "Show the answers" only after two complete tries. A sorted, ordered or labelled answer is kept as the pupil left it
     and marked as one whole: the page never says which piece is wrong.
   - A written answer is compared with a mark list that the pupil ticks; opening the list is what the board records.
   Each question is drawn into <div class="q" data-q="<id>"> from window.QS (js/questions.js) and registered for the
   teacher's board (REV.reg).
   ============================================================ */
(function () {
  'use strict';
  const S = window.REV, { $, $$, h, esc, ans, L, reg, NS } = S;

  /* ---------- typed words: one canonical form ---------- */
  function canon(s, keepCase) {
    s = String(s == null ? '' : s).normalize('NFKC');
    if (!keepCase) s = s.toLowerCase();
    s = s.replace(/[‘’`]/g, "'").replace(/[-‐-―_/]/g, ' ').replace(/[.,;:!?"()]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!keepCase) s = s.replace(/^(the|a|an) /, '');
    s = s.replace(/crystalliz/g, 'crystallis').replace(/vaporiz/g, 'vaporis').replace(/sulph/g, 'sulf');
    s = s.replace(/\s*°\s*c$/i, '').trim();
    return s;
  }
  /* "[[residue]] … [[size|sizes]]": each gap's accepted answers, the first one shown when the answers are shown */
  function parseGaps(text) {
    const gaps = [];
    const html = esc(text).replace(/\[\[([^\]]+)\]\]/g, (m, inner) => {
      const opts = inner.split('|').map(x => x.replace(/&amp;/g, '&').replace(/&#39;/g, "'"));
      gaps.push(opts);
      const w = Math.max(6, Math.min(24, Math.max(...opts.map(o => o.length)) + 3));
      return `<input class="gap" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-g="${gaps.length - 1}" style="width:${w}ch" aria-label="gap ${gaps.length}">`;
    });
    return { html: html.replace(/\n/g, '<br>'), gaps };
  }
  /* Gaps listed together in q.anyOrder (numbered from 1, as on Separating mixtures) are the items of a list: their
     words may come in any order (Daniel, 25 Oct 2026). Each gap must hold a DIFFERENT item of its group, so marking is
     a matching, as in the labs' engine (labs-shared/engine/marking.js), never each word looked up on its own.
     A gap given its first letter keeps it: there, only a word that starts with that letter counts, so the letter
     fixes which word goes in that gap, unless both words start with it ("liquid", "lattice": either order is right).
     pairGroup returns, for each item of the group (by its gap index), the gap that holds it. */
  function pairGroup(idx, vals, gaps, keepCase, letters) {
    const c = v => canon(v, keepCase);
    const can = i => idx.filter(k => gaps[k].some(a => c(a) === c(vals[i])) && (!letters[i] || c(vals[i]).charAt(0) === c(letters[i]).charAt(0)));
    const heldBy = {};
    const pair = (i, seen) => can(i).some(k => {
      if (seen.has(k)) return false;
      seen.add(k);
      if (heldBy[k] === undefined || pair(heldBy[k], seen)) { heldBy[k] = i; return true; }
      return false;
    });
    idx.forEach(i => { if (String(vals[i] || '').trim()) pair(i, new Set()); });
    return heldBy;
  }
  function markGaps(vals, gaps, groups, keepCase, letters) {
    letters = letters || {};
    /* a gap given its first letter takes only an accepted word with that letter (Daniel, 26 Oct 2026: "physical" is
       also right for a reversible change, but not once the pupil has been shown the "r") */
    const fits = (v, i) => !letters[i] || canon(v, keepCase).charAt(0) === canon(letters[i], keepCase).charAt(0);
    const ok = vals.map((v, i) => gaps[i].some(a => canon(a, keepCase) === canon(v, keepCase)) && fits(v, i));
    (groups || []).forEach(gr => {
      const idx = gr.map(n => n - 1), held = pairGroup(idx, vals, gaps, keepCase, letters);
      idx.forEach(i => { ok[i] = false; });
      Object.keys(held).forEach(k => { ok[held[k]] = true; });
    });
    return ok;
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const LET = 'ABCDEFGH';

  /* ---------- a figure drawn by js/draw.js (FIG) ---------- */
  function figure(name, cls) {
    const F = window.FIG && window.FIG[name];
    const wrap = h('div', { class: 'q__fig' + (cls ? ' ' + cls : '') });
    if (!F) { wrap.textContent = 'Missing figure ' + name; return wrap; }
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${F.vb[0]} ${F.vb[1]}`); svg.setAttribute('class', 'fig'); svg.setAttribute('role', 'img');
    if (F.alt) svg.setAttribute('aria-label', F.alt);
    F.draw(svg);
    wrap.appendChild(svg);
    return wrap;
  }

  /* ---------- the shell every check shares ---------- */
  const KIND_LABEL = { mcq: 'Quick check', gaps: 'Fill the gaps', sort: 'Sort', order: 'Put in order', num: 'Read the graph', label: 'Label the diagram', write: 'Write your answer', faults: 'Find the faults' };
  function shell(box, q) {
    box.innerHTML = '';
    box.appendChild(h('div', { class: 'q__k' }, `<span>${esc(q.label || KIND_LABEL[q.kind] || 'Quick check')}</span><span class="st" aria-live="polite"></span>`));
    /* where to look on the picture before answering (memory questions-show-their-animation) */
    if (q.look) box.appendChild(h('p', { class: 'q__look' }, '<span aria-hidden="true">👀</span> <span><b>On the picture</b> · ' + q.look + '</span>'));
    if (q.fig) box.appendChild(figure(q.fig, q.figClass));
    return {
      status(t, ok) { const s = $('.q__k .st', box); s.textContent = t || ''; box.classList.toggle('ok', !!ok); },
      say(el, text, cls) { el.className = 'say' + (cls ? ' ' + cls : ''); el.textContent = text || ''; },
      why(text, shown) {
        let w = $('.why', box);
        if (!text) { if (w) w.remove(); return; }
        if (!w) { w = h('div', { class: 'why' }); box.appendChild(w); }
        w.className = 'why' + (shown ? ' shown' : ''); w.innerHTML = text;
      }
    };
  }
  const RIGHT = '✓ Right';
  /* 💡 Hint: an idea, never the answer; it counts as a try on the board (once) */
  function addHint(box, row, id, q, isLocked) {
    if (!q.hint) return null;
    const A = ans.get(id) || {};
    const showBox = () => { if (!$('.hintbox', box)) row.insertAdjacentElement('afterend', h('div', { class: 'hintbox' }, '<b>💡 Hint:</b> ' + q.hint)); };
    if (A.hinted) { showBox(); return null; }
    if (isLocked) return null;
    const b = h('button', { class: 'btn help', type: 'button' }, '💡 Hint');
    row.insertBefore(b, $('.say', row));
    b.addEventListener('click', () => {
      L.check(id, false, ['hint']); ans.put(id, { hinted: 1 });
      b.remove(); showBox();
    });
    return b;
  }

  /* ---------- gaps ---------- */
  function drawGaps(box, id, q) {
    const ui = shell(box, q), A = ans.get(id) || {}, keepCase = !!q.case;
    const { html, gaps } = parseGaps(q.text);
    if (q.stem) box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    const body = h('p', { class: 'q__stem gapline' }, html); box.appendChild(body);
    const ins = $$('input.gap', body);
    const row = h('div', { class: 'q__row' }, '<button class="btn" type="button">Check</button><button class="btn help fl" type="button">Show the first letter</button><button class="btn help wlb" type="button">Show the word list</button><span class="say"></span>');
    box.appendChild(row);
    const btn = $('.btn:not(.help)', row), flb = $('.fl', row), wlb = $('.wlb', row), say = $('.say', row);
    let tries = A.tries || 0, last = 0;
    /* the word list: each gap's own word (the first one it accepts), in a random order that stays for this pupil.
       ✕ closes it (Daniel, 26 Oct 2026: a pupil may press it by accident and not want to see it); the button then comes
       back and opens the same list again. Only the first opening is sent to the board: the help was already seen. */
    let wl = null, wlOrder = Array.isArray(A.wl) && A.wl.length === gaps.length ? A.wl : null;
    function wordList(order, shut) {
      const words = order.map(i => gaps[i] ? gaps[i][0] : '').filter(Boolean);
      wl = h('div', { class: 'q__wl', role: 'note', 'aria-label': 'Word list' },
        '<span class="q__wl-k">Word list</span>' + words.map(w => '<span class="q__wl-w">' + esc(w) + '</span>').join('') +
        '<button type="button" class="q__wl-x" aria-label="Close the word list">✕ Close</button>');
      body.insertAdjacentElement('afterend', wl);
      $('.q__wl-x', wl).addEventListener('click', () => { showList(false); ans.put(id, { wlShut: 1 }); });
      showList(!shut);
    }
    function showList(on) {
      if (wl) wl.hidden = !on;
      wlb.hidden = on || !!(A.ok || A.shown) || !wlb.isConnected;
    }
    function shuffled() {
      const o = gaps.map((g, i) => i);
      for (let t = 0; t < 20; t++) {
        for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
        if (o.length < 2 || o.some((x, i) => gaps[x][0] !== gaps[i][0])) break;   /* never the order of the gaps */
      }
      return o;
    }
    if (wlOrder) wordList(wlOrder, !!A.wlShut);
    /* the gaps given their first letter: gap → that letter (a save from before 25 Oct 2026 kept only the gap) */
    const hinted = new Map((A.hl || []).map(x => Array.isArray(x) ? x : [x, gaps[x] ? gaps[x][0].charAt(0) : '']));
    const groupOf = i => (q.anyOrder || []).map(g => g.map(n => n - 1)).find(g => g.indexOf(i) >= 0);
    (A.v || []).forEach((v, i) => { if (ins[i]) ins[i].value = v; });
    hinted.forEach((l, i) => { if (ins[i]) ins[i].classList.add('hinted'); });
    function lock(shown) {
      ins.forEach(i => { i.readOnly = true; }); btn.remove(); flb.remove(); wlb.remove();
      const sb = $('.show', row); if (sb) sb.remove();
      const hb = $('.btn.help', row); if (hb) hb.remove();
      ui.status(shown ? 'Answers shown' : RIGHT, !shown);
      ui.say(say, shown ? 'These are the answers. Read them, then continue.' : 'All right.', shown ? '' : 'ok');
      if (q.why) ui.why(q.why, shown);
    }
    function paint(ok) { ins.forEach((inp, i) => { inp.classList.toggle('right', !!ok[i]); inp.classList.toggle('wrong', !ok[i] && !!inp.value.trim()); }); }
    function rightNow() { return markGaps(ins.map(i => i.value), gaps, q.anyOrder, keepCase, Object.fromEntries(hinted)); }
    /* The letter for gap i: its own word's. In an anyOrder group, a word another gap already holds (typed right), or
       keeps with its own first letter, is taken: then the letter of a word of the group that is still free. */
    function letterFor(i) {
      const gr = groupOf(i);
      if (!gr) return gaps[i][0].charAt(0);
      const vals = ins.map(x => x.value), lt = Object.fromEntries(hinted);
      vals[i] = ''; delete lt[i];
      const held = pairGroup(gr, vals, gaps, keepCase, lt), holders = Object.values(held);
      const taken = new Set(Object.keys(held).map(Number)), first = s => canon(s, keepCase).charAt(0);
      gr.forEach(j => {
        if (!lt[j] || holders.indexOf(j) >= 0) return;
        const k = [j].concat(gr).find(m => !taken.has(m) && first(gaps[m][0]) === first(lt[j]));
        if (k !== undefined) taken.add(k);
      });
      const k = [i].concat(gr).find(m => !taken.has(m));
      return gaps[k === undefined ? i : k][0].charAt(0);
    }
    /* the answers shown after two tries; in a group, a gap given its first letter shows the word with that letter */
    function shownAnswers() {
      const out = gaps.map(g => g[0]), first = s => canon(s, keepCase).charAt(0);
      (q.anyOrder || []).forEach(g => {
        const idx = g.map(n => n - 1), free = new Set(idx), done = new Set();
        idx.forEach(i => {
          if (!hinted.get(i)) return;
          const k = [i].concat(idx).find(m => free.has(m) && first(gaps[m][0]) === first(hinted.get(i)));
          if (k !== undefined) { out[i] = gaps[k][0]; free.delete(k); done.add(i); }
        });
        idx.forEach(i => {
          if (done.has(i)) return;
          const k = free.has(i) ? i : idx.find(m => free.has(m));
          if (k !== undefined) { out[i] = gaps[k][0]; free.delete(k); }
        });
      });
      return out;
    }
    function flState() {
      const ok = rightNow(), left = ins.filter((inp, i) => !hinted.has(i) && !(ok[i] && inp.classList.contains('right')));
      flb.disabled = !left.length;
      flb.textContent = left.length ? 'Show the first letter' : 'No more first letters';
    }
    function showBtn() {
      if (tries < 2 || $('.show', row)) return;
      const sb = h('button', { class: 'btn ghost show', type: 'button' }, 'Show the answers'); row.insertBefore(sb, say);
      sb.addEventListener('click', () => { const sh = shownAnswers(); ins.forEach((inp, i) => { inp.value = sh[i]; }); paint(gaps.map(() => true)); ans.put(id, { v: ins.map(i => i.value), shown: 1 }); lock(true); });
    }
    if (A.ok || A.shown) { paint(rightNow()); if (A.shown) paint(gaps.map(() => true)); lock(!!A.shown); addHint(box, row, id, q, true); return; }
    if (A.marked) paint(rightNow());
    if (tries) ui.status('Try ' + (tries + 1));
    showBtn(); flState();
    addHint(box, row, id, q, false);
    ins.forEach((inp, i) => {
      inp.addEventListener('focus', () => { last = i; });
      inp.addEventListener('pointerdown', () => { last = i; });     /* the gap the pupil is working on: tapped, or typed in */
      inp.addEventListener('input', () => { last = i; inp.classList.remove('right', 'wrong'); ans.put(id, { v: ins.map(x => x.value), marked: 0 }); flState(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    });
    /* the first letter of the gap the pupil is working on (the last one they were in), else the first gap not right yet */
    flb.addEventListener('click', () => {
      const ok = rightNow();
      const open = i => !hinted.has(i) && !(ok[i] && ins[i].classList.contains('right'));
      let i = open(last) ? last : ins.findIndex((x, j) => open(j));
      if (i < 0) { flState(); return; }
      const letter = letterFor(i);
      ins[i].value = letter;                       /* the gap shows only the first letter: the pupil types the rest */
      hinted.set(i, letter); ins[i].classList.add('hinted'); ins[i].classList.remove('wrong');
      L.check(id, false, ['first letter, gap ' + (i + 1)]);
      ans.put(id, { v: ins.map(x => x.value), hl: Array.from(hinted) });
      ins[i].focus(); const n = ins[i].value.length; try { ins[i].setSelectionRange(n, n); } catch (e) {}
      ui.say(say, 'The first letter is in gap ' + (i + 1) + '. Type the rest of the word.', '');
      flState();
    });
    wlb.addEventListener('click', () => {
      if (wlOrder) { showList(true); ans.put(id, { wlShut: 0 }); return; }        /* open again: the same list, no new record */
      wlOrder = shuffled();
      wordList(wlOrder);
      L.check(id, false, ['word list']);
      ans.put(id, { v: ins.map(x => x.value), wl: wlOrder, wlShut: 0 });
      ui.say(say, 'The words for the gaps are under the sentence, in a random order. Type each one into its gap.', '');
    });
    btn.addEventListener('click', check);
    function check() {
      const vals = ins.map(i => i.value);
      if (vals.some(v => !v.trim())) { ui.say(say, 'Fill every gap first.', 'no'); return; }
      const ok = rightNow(), all = ok.every(Boolean);
      tries++; paint(ok);
      L.check(id, all, all ? [] : vals.map((v, i) => ok[i] ? null : (i + 1) + '=' + v.trim()).filter(Boolean));
      ans.put(id, { v: vals, tries, ok: all ? 1 : 0, marked: 1 });
      if (all) { lock(false); return; }
      ui.status('Try ' + (tries + 1));
      let msg = ok.some(Boolean) ? 'Not right yet: change the ones in amber. Spelling counts.' : 'Not right yet. Spelling counts: check the word bank.';
      if (keepCase && vals.some((v, i) => !ok[i] && gaps[i].some(a => canon(a) === canon(v)))) msg = 'Nearly: check the capital letters. A symbol starts with a capital letter; a second letter is small.';
      /* a gap given its first letter, holding a word (of its list, or another right word) that does not start with it */
      const off = ins.findIndex((x, i) => !ok[i] && hinted.get(i) && canon(vals[i], keepCase).charAt(0) !== canon(hinted.get(i), keepCase).charAt(0)
        && (groupOf(i) || gaps[i].some(a => canon(a, keepCase) === canon(vals[i], keepCase))));
      if (off >= 0) msg = 'Gap ' + (off + 1) + ' was given its first letter, "' + hinted.get(off) + '": the word in that gap must start with it.';
      ui.say(say, msg, 'no');
      showBtn(); flState();
    }
  }

  /* ---------- multiple choice ---------- */
  function drawMcq(box, id, q) {
    const ui = shell(box, q), A = ans.get(id) || {}, out = new Set(A.out || []);
    box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    const ol = h('ol', { class: 'opts' }); box.appendChild(ol);
    const row = h('div', { class: 'q__row' }, '<span class="say"></span>'); box.appendChild(row);
    const order = shuffle(q.a.map((_, i) => i));
    order.forEach((oi, k) => {
      const li = h('li'), b = h('button', { type: 'button', 'data-o': oi }, `<span class="lt">${LET[k]}</span><span>${esc(q.a[oi])}<span class="nt"></span></span>`);
      li.appendChild(b); ol.appendChild(li);
      b.addEventListener('click', () => choose(oi, b));
    });
    let hintBtn = null;
    function mark(oi, b) {
      if (oi === 0) {
        b.classList.add('yes'); $$('button', ol).forEach(x => { x.disabled = true; }); ui.status(RIGHT, true);
        if (hintBtn) { hintBtn.remove(); hintBtn = null; }
        if (q.why) ui.why('<b>Why:</b> ' + q.why);
      }
      else { b.classList.add('no'); b.disabled = true; $('.nt', b).textContent = 'Not this one'; }
    }
    function choose(oi, b) {
      if (b.disabled) return;
      const right = oi === 0;
      L.check(id, right, right ? [] : ['o' + oi]);
      if (right) ans.put(id, { ok: 1 }); else { out.add(oi); ans.put(id, { out: Array.from(out) }); }
      mark(oi, b);
    }
    hintBtn = addHint(box, row, id, q, !!A.ok);
    out.forEach(oi => { const b = $(`button[data-o="${oi}"]`, ol); if (b) mark(oi, b); });
    if (A.ok) mark(0, $('button[data-o="0"]', ol));
  }

  /* ---------- a number (read from a graph) ---------- */
  function drawNum(box, id, q) {
    const ui = shell(box, q), A = ans.get(id) || {};
    box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    const row = h('div', { class: 'q__row' }, `<input class="gap" type="text" inputmode="decimal" autocomplete="off" style="width:9ch" aria-label="your answer"> <span>${esc(q.unit || '')}</span><button class="btn" type="button">Check</button><span class="say"></span>`);
    box.appendChild(row);
    const inp = $('input', row), btn = $('.btn', row), say = $('.say', row);
    let tries = A.tries || 0;
    if (A.v != null) inp.value = A.v;
    const val = () => parseFloat(String(inp.value).replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.\-]/g, ''));
    const isOk = () => { const v = val(); return isFinite(v) && Math.abs(v - q.ans) <= (q.tol || 0) + 1e-9; };
    function lock(shown) {
      inp.readOnly = true; btn.remove(); const sb = $('.show', row); if (sb) sb.remove();
      const hb = $('.btn.help', row); if (hb) hb.remove();
      inp.classList.add('right'); ui.status(shown ? 'Answer shown' : RIGHT, !shown);
      ui.say(say, shown ? 'This is the answer.' : 'Right.', shown ? '' : 'ok');
      if (q.why) ui.why(q.why, shown);
    }
    function showBtn() {
      if (tries < 2 || $('.show', row)) return;
      const sb = h('button', { class: 'btn ghost show', type: 'button' }, 'Show the answer'); row.insertBefore(sb, say);
      sb.addEventListener('click', () => { inp.value = q.show || String(q.ans); ans.put(id, { v: inp.value, shown: 1 }); lock(true); });
    }
    if (A.ok || A.shown) { lock(!!A.shown); addHint(box, row, id, q, true); return; }
    if (tries) ui.status('Try ' + (tries + 1));
    showBtn(); addHint(box, row, id, q, false);
    inp.addEventListener('input', () => { inp.classList.remove('right', 'wrong'); ans.put(id, { v: inp.value }); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    btn.addEventListener('click', check);
    function check() {
      if (!inp.value.trim() || !isFinite(val())) { ui.say(say, 'Type a number first.', 'no'); return; }
      const ok = isOk(); tries++;
      L.check(id, ok, ok ? [] : [inp.value.trim()]);
      ans.put(id, { v: inp.value, tries, ok: ok ? 1 : 0 });
      if (ok) { lock(false); return; }
      inp.classList.add('wrong'); ui.status('Try ' + (tries + 1));
      ui.say(say, q.again && tries === 1 ? q.again : 'Not right yet. Read the scale on the axis again.', 'no'); showBtn();
    }
  }

  /* ---------- sort into boxes (press a card, then a box; or drag it) ---------- */
  function chipHtml(it) {
    if (it.pic && window.FIG && window.FIG[it.pic]) {
      const F = window.FIG[it.pic];
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${F.vb[0]} ${F.vb[1]}`); svg.setAttribute('aria-hidden', 'true');
      F.draw(svg);
      return { cls: 'chip pic', html: svg.outerHTML + `<span>${esc(it.t)}</span>` };
    }
    return { cls: 'chip', html: esc(it.t) };
  }
  function drawSort(box, id, q) {
    const ui = shell(box, q), A = ans.get(id) || {};
    box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    const tray = h('div', { class: 'tray', 'aria-label': 'Cards to sort' }); box.appendChild(tray);
    const bins = h('div', { class: 'bins' }); bins.style.setProperty('--n', q.cols || q.bins.length); box.appendChild(bins);
    q.bins.forEach((b, i) => {
      const d = h('div', { class: 'bin', 'data-b': i, role: 'button', tabindex: '0', 'aria-label': 'Put the chosen card in: ' + b.t }, `<h4>${esc(b.t)}${b.s ? `<small>${esc(b.s)}</small>` : ''}</h4><div class="in"></div>`);
      bins.appendChild(d);
    });
    const row = h('div', { class: 'q__row' }, '<button class="btn" type="button">Check</button><span class="say"></span>'); box.appendChild(row);
    const btn = $('.btn', row), say = $('.say', row);
    let tries = A.tries || 0, sel = null, locked = false;
    const place = Object.assign({}, A.place || {});
    const items = q.items.map(it => Array.isArray(it) ? { t: it[0], b: it[1], pic: it[2] } : it);
    const chips = items.map((it, i) => { const c = chipHtml(it); return h('button', { type: 'button', class: c.cls, 'data-i': i, 'aria-label': it.t }, c.html); });
    const order = shuffle(chips.map((_, i) => i));      /* a new random order each time it is drawn */
    function layout() { order.forEach(i => { const b = place[i]; (b == null ? tray : $(`.bin[data-b="${b}"] .in`, bins)).appendChild(chips[i]); }); }
    layout();
    function select(c) { if (locked) return; if (sel) sel.classList.remove('sel'); sel = (sel === c) ? null : c; if (sel) sel.classList.add('sel'); $$('.bin', bins).forEach(b => b.classList.toggle('target', !!sel)); }
    function put(c, b) {
      const i = +c.dataset.i; if (b == null) delete place[i]; else place[i] = b;
      layout(); chips.forEach(x => x.classList.remove('right', 'wrong'));
      ans.put(id, { place: Object.assign({}, place) }); ui.say(say, '');
      if (sel) sel.classList.remove('sel'); sel = null; $$('.bin', bins).forEach(x => x.classList.remove('target'));
    }
    $$('.bin', bins).forEach(bn => {
      const go = () => { if (sel && !locked) put(sel, +bn.dataset.b); };
      bn.addEventListener('click', e => { if (e.target.closest('.chip') && e.target.closest('.chip') !== sel) return; go(); });
      bn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    tray.addEventListener('click', e => { if (sel && !e.target.closest('.chip') && !locked) put(sel, null); });
    dragify(chips, c => select(c), (c, target) => { if (locked) return; const bn = target && target.closest('.bin'); if (bn) put(c, +bn.dataset.b); else if (target && target.closest('.tray')) put(c, null); });
    function lock(shown) {
      locked = true; btn.remove(); const sb = $('.show', row); if (sb) sb.remove();
      const hb = $('.btn.help', row); if (hb) hb.remove();
      chips.forEach(c => { c.classList.add('right'); c.disabled = true; });
      ui.status(shown ? 'Answers shown' : RIGHT, !shown); ui.say(say, shown ? 'This is where each one goes.' : 'All in the right boxes.', shown ? '' : 'ok');
      if (q.why) ui.why(q.why, shown);
    }
    function showBtn() {
      if (tries < 2 || $('.show', row)) return;
      const sb = h('button', { class: 'btn ghost show', type: 'button' }, 'Show the answers'); row.insertBefore(sb, say);
      sb.addEventListener('click', () => { items.forEach((it, i) => { place[i] = it.b; }); layout(); ans.put(id, { place: Object.assign({}, place), shown: 1 }); lock(true); });
    }
    if (A.ok || A.shown) { lock(!!A.shown); addHint(box, row, id, q, true); return; }
    if (tries) ui.status('Try ' + (tries + 1));
    showBtn(); addHint(box, row, id, q, false);
    btn.addEventListener('click', () => {
      if (Object.keys(place).length < items.length) { ui.say(say, 'Put every card in a box first.', 'no'); return; }
      const wrong = items.map((it, i) => place[i] === it.b ? null : it.t + ' → ' + q.bins[place[i]].t).filter(Boolean);
      tries++; L.check(id, !wrong.length, wrong);
      ans.put(id, { place: Object.assign({}, place), tries, ok: wrong.length ? 0 : 1 });
      if (!wrong.length) { lock(false); return; }
      ui.status('Try ' + (tries + 1));
      ui.say(say, 'Not right yet. Your answer is kept as you left it: think again about each card.', 'no');
      showBtn();
    });
  }
  /* press = choose; press and move = drag (mouse, pen or finger) */
  function dragify(chips, onTap, onDrop) {
    chips.forEach(c => {
      c.addEventListener('pointerdown', e => {
        if (c.disabled || e.button > 0) return;
        const x0 = e.clientX, y0 = e.clientY; let ghost = null;
        const move = ev => {
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 7) { ghost = c.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); c.classList.add('dragging'); }
          if (ghost) { ghost.style.left = (ev.clientX - ghost.offsetWidth / 2) + 'px'; ghost.style.top = (ev.clientY - ghost.offsetHeight / 2) + 'px'; }
        };
        const up = ev => {
          removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
          if (ghost) { ghost.remove(); c.classList.remove('dragging'); onDrop(c, document.elementFromPoint(ev.clientX, ev.clientY)); c._dragged = true; setTimeout(() => { c._dragged = false; }, 0); }
        };
        addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
      });
      c.addEventListener('click', e => { e.stopPropagation(); if (!c._dragged) onTap(c); });
    });
  }

  /* ---------- labels on a diagram: one word in each numbered box ---------- */
  function drawLabel(box, id, q) {
    const ui = shell(box, Object.assign({}, q, { fig: null })), A = ans.get(id) || {};
    box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    const tray = h('div', { class: 'tray', 'aria-label': 'Labels' }); box.appendChild(tray);
    const lab = h('div', { class: 'lab' }); box.appendChild(lab);
    const F = window.FIG[q.fig];
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${F.vb[0]} ${F.vb[1]}`); svg.setAttribute('class', 'fig'); svg.setAttribute('role', 'img');
    if (F.alt) svg.setAttribute('aria-label', F.alt);
    F.draw(svg); lab.appendChild(svg);
    const slots = q.slots.map((s, i) => {
      const d = h('div', { class: 'slot', 'data-s': i, role: 'button', tabindex: '0', 'aria-label': 'Box ' + (i + 1) + ': put the chosen label here' }, `<span class="n">${i + 1}</span>`);
      const [sx, sy] = s.x != null ? [s.x, s.y] : (F.slots || {})[s.k] || [F.vb[0] / 2, F.vb[1] / 2];
      d.style.left = (100 * sx / F.vb[0]) + '%'; d.style.top = (100 * sy / F.vb[1]) + '%';
      lab.appendChild(d); return d;
    });
    const row = h('div', { class: 'q__row' }, '<button class="btn" type="button">Check</button><span class="say"></span>'); box.appendChild(row);
    const btn = $('.btn', row), say = $('.say', row);
    let tries = A.tries || 0, sel = null, locked = false;
    const at = Object.assign({}, A.at || {});            /* slot → word index */
    const words = q.words.slice();
    const chips = words.map((w, i) => h('button', { type: 'button', class: 'chip', 'data-i': i }, esc(w)));
    const order = shuffle(chips.map((_, i) => i));
    function layout() {
      const used = new Set(Object.values(at).map(Number));
      order.forEach(i => { if (!used.has(i)) tray.appendChild(chips[i]); });
      slots.forEach((d, s) => { const wi = at[s]; const n = $('.n', d); if (wi != null) { d.appendChild(chips[wi]); n.hidden = true; } else n.hidden = false; });
    }
    layout();
    function select(c) { if (locked) return; if (sel) sel.classList.remove('sel'); sel = (sel === c) ? null : c; if (sel) sel.classList.add('sel'); slots.forEach(d => d.classList.toggle('target', !!sel)); }
    function put(c, s) {
      const i = +c.dataset.i;
      Object.keys(at).forEach(k => { if (+at[k] === i) delete at[k]; });
      if (s != null) at[s] = i;
      layout(); chips.forEach(x => x.classList.remove('right', 'wrong'));
      ans.put(id, { at: Object.assign({}, at) }); ui.say(say, '');
      if (sel) sel.classList.remove('sel'); sel = null; slots.forEach(d => d.classList.remove('target'));
    }
    slots.forEach((d, s) => {
      const go = () => { if (sel && !locked) put(sel, s); };
      d.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c && c !== sel && !sel) return; go(); });
      d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    tray.addEventListener('click', e => { if (sel && !e.target.closest('.chip') && !locked) put(sel, null); });
    dragify(chips, c => select(c), (c, target) => { if (locked) return; const d = target && target.closest('.slot'); if (d) put(c, +d.dataset.s); else if (target && target.closest('.tray')) put(c, null); });
    function lock(shown) {
      locked = true; btn.remove(); const sb = $('.show', row); if (sb) sb.remove();
      const hb = $('.btn.help', row); if (hb) hb.remove();
      chips.forEach(c => { c.classList.add('right'); c.disabled = true; });
      ui.status(shown ? 'Answers shown' : RIGHT, !shown); ui.say(say, shown ? 'This is where each label goes.' : 'Every label in the right box.', shown ? '' : 'ok');
      if (q.why) ui.why(q.why, shown);
    }
    function showBtn() {
      if (tries < 2 || $('.show', row)) return;
      const sb = h('button', { class: 'btn ghost show', type: 'button' }, 'Show the answers'); row.insertBefore(sb, say);
      sb.addEventListener('click', () => { Object.keys(at).forEach(k => delete at[k]); q.slots.forEach((s, i) => { at[i] = words.indexOf(s.w); }); layout(); ans.put(id, { at: Object.assign({}, at), shown: 1 }); lock(true); });
    }
    if (A.ok || A.shown) { lock(!!A.shown); addHint(box, row, id, q, true); return; }
    if (tries) ui.status('Try ' + (tries + 1));
    showBtn(); addHint(box, row, id, q, false);
    btn.addEventListener('click', () => {
      if (Object.keys(at).length < q.slots.length) { ui.say(say, 'Put a label in every box first.', 'no'); return; }
      const wrong = q.slots.map((s, i) => words[at[i]] === s.w ? null : (i + 1) + ': ' + words[at[i]]).filter(Boolean);
      tries++; L.check(id, !wrong.length, wrong);
      ans.put(id, { at: Object.assign({}, at), tries, ok: wrong.length ? 0 : 1 });
      if (!wrong.length) { lock(false); return; }
      ui.status('Try ' + (tries + 1));
      ui.say(say, 'Not right yet. Your labels are kept as you left them: think again about each box.', 'no');
      showBtn();
    });
  }

  /* ---------- find the faults: a student's graph; tap each part that is wrong (25 Oct 2026) ----------
     Daniel: check that pupils "remember the rules of how to make a perfect graph", as the Write-Up Lab's graph doctor
     does. The figure (draw.js) draws the student's graph and returns its parts as boxes; a button lies over each box.
     A fault the pupil taps is ringed in red pen with its number, and its reason shows. A part that is right says so, and
     counts on the board as a try that was not right (once for each part), so "right first time" means every fault found
     without tapping a part that is right. "Show the faults" only after two right parts were tapped. Once every fault is
     found (or shown), "Fix every fault" draws the same graph done perfectly, and back. Kept: found (in the order found),
     wrong, shown, fixed, ok. */
  function drawFaults(box, id, q) {
    const ui = shell(box, Object.assign({}, q, { fig: null })), A = ans.get(id) || {}, F = window.FIG[q.fig];
    const FAULT = {}; q.faults.forEach(f => { FAULT[f.part] = f; });
    const N = q.faults.length, NAME = q.names || {};
    const name = k => NAME[k] || k;
    box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    const count = h('p', { class: 'flt__n', 'aria-live': 'polite' }); box.appendChild(count);
    const wrap = h('div', { class: 'flt' }); box.appendChild(wrap);
    const msg = h('div', { class: 'flt__msg', 'aria-live': 'polite' }); box.appendChild(msg);
    const list = h('ol', { class: 'flt__list' }); box.appendChild(list);
    const row = h('div', { class: 'q__row' }, '<span class="say"></span>'); box.appendChild(row);
    const say = $('.say', row);
    const found = (A.found || []).filter(k => FAULT[k]), wrong = new Set(A.wrong || []);
    let shown = !!A.shown, fixed = !!A.fixed, ok = !!A.ok, hintBtn = null;
    const done = () => ok || shown;
    /* the faults in the order the pupil found them, then (shown) the rest */
    const marked = () => found.concat(shown ? q.faults.map(f => f.part).filter(k => !found.includes(k)) : []);
    function put() { ans.put(id, { found: found.slice(), wrong: Array.from(wrong), shown: shown ? 1 : 0, fixed: fixed ? 1 : 0, ok: ok ? 1 : 0 }); }
    let svg = null, parts = {}, pen = null;
    function draw() {
      wrap.innerHTML = '';
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${F.vb[0]} ${F.vb[1]}`); svg.setAttribute('class', 'fig'); svg.setAttribute('role', 'img');
      if (F.alt) svg.setAttribute('aria-label', F.alt + (fixed ? ', with every fault fixed' : ''));
      parts = F.draw(svg, { fixed }) || {};
      pen = window.DRAW.S('g', { class: 'pens' }, svg);
      wrap.appendChild(svg);
      /* a button over every part: the grid first, so the smaller parts lie on top of it */
      Object.keys(parts).sort((x, y) => (y === 'plot') - (x === 'plot')).forEach(k => parts[k].forEach((b, j) => {
        /* one button for each part (the keyboard reaches it); its other boxes are plain areas for a mouse or a finger */
        const t = j ? h('div', { class: 'tap', 'data-p': k, 'aria-hidden': 'true' }) : h('button', { type: 'button', class: 'tap', 'data-p': k, 'aria-label': name(k) });
        Object.assign(t.style, { left: (100 * b[0] / F.vb[0]) + '%', top: (100 * b[1] / F.vb[1]) + '%', width: (100 * b[2] / F.vb[0]) + '%', height: (100 * b[3] / F.vb[1]) + '%' });
        t.addEventListener('click', () => tap(k));
        wrap.appendChild(t);
      }));
      rings();
    }
    /* red pen round each fault marked, with its number; once fixed, a green number where each fault was. A number goes to
       the first of five places round its part (top left, left, top right, right, below; a line of words: left first) that covers no words of the
       graph and no other number; the words are measured on the screen, so a part hidden in another tab measures again
       when it opens. */
    function rings() {
      const S = window.DRAW.S, R = svg.getBoundingClientRect(), kx = F.vb[0] / (R.width || 1), ky = F.vb[1] / (R.height || 1);
      while (pen.firstChild) pen.removeChild(pen.firstChild);
      const words = R.width ? [...svg.querySelectorAll('text')].map(t => { const r = t.getBoundingClientRect(); return [(r.left - R.left) * kx, (r.top - R.top) * ky, r.width * kx, r.height * ky]; }) : [];
      const placed = [], clear = (x, y) => ![...words, ...placed].some(o => x - 12 < o[0] + o[2] && o[0] < x + 12 && y - 12 < o[1] + o[3] && o[1] < y + 12);
      marked().forEach((k, i) => (parts[k] || []).forEach((b, j) => {
        if (!fixed) S('rect', { x: b[0] - 4, y: b[1] - 4, width: b[2] + 8, height: b[3] + 8, rx: 9, fill: 'none', stroke: '#D22F27', 'stroke-width': 3 }, pen);
        if (j) return;
        const at = [[b[0] - 4, b[1] - 4], [b[0] - 16, b[1] + b[3] / 2], [b[0] + b[2] + 4, b[1] - 4], [b[0] + b[2] + 16, b[1] + b[3] / 2], [b[0] - 4, b[1] + b[3] + 4]]
          .map(([x, y]) => [Math.max(12, Math.min(F.vb[0] - 12, x)), Math.max(12, Math.min(F.vb[1] - 12, y))]);
        if (b[2] > 4 * b[3]) at.unshift(at.splice(1, 1)[0]);   /* a line of words (a title, a label): its number goes before it */
        const [tx, ty] = at.find(([x, y]) => clear(x, y)) || at[0];
        placed.push([tx - 12, ty - 12, 24, 24]);
        S('circle', { cx: tx, cy: ty, r: 11, fill: fixed ? '#167A3E' : '#D22F27' }, pen);
        S('text', { x: tx, y: ty + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 900, fill: '#FFFFFF' }, pen, String(i + 1));
      }));
    }
    document.addEventListener('part', e => { if (e.detail === q.part) requestAnimationFrame(rings); });
    function paint() {
      const m = marked();
      count.innerHTML = shown && !ok ? `Faults shown: <b>${N}</b>` : `Faults found: <b>${found.length} of ${N}</b>`;
      list.innerHTML = m.map(k => `<li><b>${esc(name(k))}</b>: ${FAULT[k].tag}${!found.includes(k) ? ' <span class="nt">(shown)</span>' : ''}</li>`).join('');
      ui.status(ok ? RIGHT : shown ? 'Faults shown' : '', ok);
      let fx = $('.fixall', row);
      if (done()) {
        if (hintBtn) { hintBtn.remove(); hintBtn = null; }
        const sb = $('.show', row); if (sb) sb.remove();
        if (!fx) { fx = h('button', { class: 'btn fixall', type: 'button' }); row.insertBefore(fx, say); fx.addEventListener('click', () => { fixed = !fixed; put(); draw(); paint(); msgFixed(); }); }
        fx.textContent = fixed ? '↺ Show the student’s ' + (q.thing || 'graph') : '✓ Fix every fault';
        ui.say(say, ok ? `You found all ${N} faults.` : '', ok ? 'ok' : '');
        if (q.why) ui.why(q.why, shown && !ok);
      } else if (wrong.size >= 2 && !$('.show', row)) {
        const sb = h('button', { class: 'btn ghost show', type: 'button' }, 'Show the faults'); row.insertBefore(sb, say);
        sb.addEventListener('click', () => { shown = true; put(); rings(); paint(); msg.className = 'flt__msg'; msg.innerHTML = ''; });
      }
    }
    function msgFixed() {
      msg.className = 'flt__msg good';
      msg.innerHTML = fixed ? `<b>Every fault is fixed:</b> this is the perfect ${esc(q.thing || 'graph')}. Tap any part to see why it is right.` : `<b>The student’s ${esc(q.thing || 'graph')} again,</b> with each fault ringed.`;
    }
    function tap(k) {
      const f = FAULT[k];
      if (k === 'plot' && !f) {                      /* the empty grid: a tap that missed, never counted */
        msg.className = 'flt__msg';
        msg.innerHTML = (q.fine || {}).plot || 'This is the grid. Tap a label, a scale, the values or the title.';
        return;
      }
      if (fixed) {                                  /* the perfect graph: every part is right */
        msg.className = 'flt__msg good';
        msg.innerHTML = `<b>✓ ${esc(name(k))}:</b> ` + (f ? f.fixed : (q.fine || {})[k] || 'this part is right.');
        return;
      }
      if (f) {
        if (!done() && !found.includes(k)) { found.push(k); }
        const n = marked().indexOf(k) + 1;
        msg.className = 'flt__msg pen';
        msg.innerHTML = `<b>✓ ${n ? 'Fault ' + n : 'A fault'}: ${esc(name(k))}.</b> ${f.why}`;
        if (!done() && found.length === N) { ok = true; L.check(id, true); }
        put(); rings(); paint();
        return;
      }
      msg.className = 'flt__msg no';
      msg.innerHTML = `<b>Not a fault: ${esc(name(k))} is right.</b> ` + ((q.fine || {})[k] || '');
      if (!done() && !wrong.has(k)) { wrong.add(k); L.check(id, false, [name(k) + ' (right)']); put(); paint(); }
    }
    hintBtn = addHint(box, row, id, q, done());
    draw(); paint();
  }

  /* ---------- put in order ---------- */
  function drawOrder(box, id, q) {
    const ui = shell(box, q), A = ans.get(id) || {};
    box.appendChild(h('p', { class: 'q__stem' }, q.stem));
    if (q.table) box.appendChild(h('div', null, q.table));
    const ol = h('ol', { class: 'order' }); box.appendChild(ol);
    const row = h('div', { class: 'q__row' }, '<button class="btn" type="button">Check</button><span class="say"></span>'); box.appendChild(row);
    const btn = $('.btn', row), say = $('.say', row);
    let tries = A.tries || 0, locked = false;
    let ord = (A.ord && A.ord.length === q.items.length) ? A.ord.slice() : (() => { let o; do { o = shuffle(q.items.map((_, i) => i)); } while (o.every((v, i) => v === i)); return o; })();
    /* The numbers are PLACES (1 = first) and stay where they are; only the card moves (21 Oct 2026). */
    function draw(moved) {
      const was = {}; $$('.oc', ol).forEach(c => { was[c.dataset.i] = c.getBoundingClientRect().top; });
      ol.innerHTML = '';
      ord.forEach((oi, k) => {
        const li = h('li', null, `<span class="n">${k + 1}</span><span class="oc" data-i="${oi}"><span class="tx">${esc(q.items[oi])}</span>` + (locked ? '' :
          `<span class="mv"><button type="button" aria-label="Move up" ${k === 0 ? 'disabled' : ''}>↑</button><button type="button" aria-label="Move down" ${k === ord.length - 1 ? 'disabled' : ''}>↓</button></span>`) + '</span>');
        if (locked) li.classList.add('right');
        ol.appendChild(li);
        if (!locked) {
          const [up, dn] = $$('.mv button', li);
          up.addEventListener('click', () => { swap(k, k - 1); const b = $$('.mv button', ol)[(k - 1) * 2]; if (b && !b.disabled) b.focus(); });
          dn.addEventListener('click', () => { swap(k, k + 1); const b = $$('.mv button', ol)[(k + 1) * 2 + 1]; if (b && !b.disabled) b.focus(); });
        }
      });
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      $$('.oc', ol).forEach(c => {
        const dy = was[c.dataset.i] != null ? was[c.dataset.i] - c.getBoundingClientRect().top : 0;
        if (dy && c.animate && !still) c.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
        if (c.dataset.i === String(moved)) { c.classList.add('is-moved'); setTimeout(() => c.classList.remove('is-moved'), 900); }
      });
    }
    function swap(a, b) { if (b < 0 || b >= ord.length) return; const m = ord[a]; [ord[a], ord[b]] = [ord[b], ord[a]]; ans.put(id, { ord: ord.slice() }); ui.say(say, ''); draw(m); }
    function lock(shown) { locked = true; btn.remove(); const sb = $('.show', row); if (sb) sb.remove(); const hb = $('.btn.help', row); if (hb) hb.remove(); draw(); ui.status(shown ? 'Order shown' : RIGHT, !shown); ui.say(say, shown ? 'This is the order.' : 'The right order.', shown ? '' : 'ok'); if (q.why) ui.why(q.why, shown); }
    function showBtn() {
      if (tries < 2 || $('.show', row)) return;
      const sb = h('button', { class: 'btn ghost show', type: 'button' }, 'Show the order'); row.insertBefore(sb, say);
      sb.addEventListener('click', () => { ord = q.items.map((_, i) => i); ans.put(id, { ord: ord.slice(), shown: 1 }); lock(true); });
    }
    if (A.ok || A.shown) { if (A.shown) ord = q.items.map((_, i) => i); lock(!!A.shown); addHint(box, row, id, q, true); return; }
    draw(); if (tries) ui.status('Try ' + (tries + 1)); showBtn(); addHint(box, row, id, q, false);
    btn.addEventListener('click', () => {
      const ok = ord.every((v, i) => v === i); tries++;
      L.check(id, ok, ok ? [] : ['order ' + ord.map(v => v + 1).join('-')]);
      ans.put(id, { ord: ord.slice(), tries, ok: ok ? 1 : 0 });
      if (ok) { lock(false); return; }
      ui.status('Try ' + (tries + 1)); ui.say(say, 'Not right yet. Your order is kept as you left it.', 'no'); showBtn();
    });
  }

  /* ---------- a written answer, then the mark list ---------- */
  function drawWrite(box, id, q) {
    const ui = shell(box, q), A = ans.get(id) || {};
    box.classList.add('write');
    box.appendChild(h('p', { class: 'q__stem' }, q.stem + (q.marks ? ` <b>[${q.marks} marks]</b>` : '')));
    const ta = h('textarea', { 'aria-label': 'Your answer', placeholder: 'Write your answer here, in full sentences.' }); box.appendChild(ta);
    const row = h('div', { class: 'q__row' }, '<button class="btn" type="button">Compare with the mark list</button><span class="wc"></span><span class="say"></span>');
    box.appendChild(row);
    const btn = $('.btn', row), wc = $('.wc', row), say = $('.say', row);
    ta.value = A.text || '';
    const NEED = q.need || 15;
    const words = () => (ta.value.trim().match(/\S+/g) || []).length;
    const count = () => { const n = words(); wc.textContent = n + (n === 1 ? ' word' : ' words'); };
    count();
    ta.addEventListener('input', () => { ans.put(id, { text: ta.value }); count(); ui.say(say, ''); });
    function showList() {
      btn.remove();
      const ticks = new Set(A.ticks || []);
      const list = h('div', { class: 'list' }, `<p><b>Mark list.</b> Tick each point that your answer says, in your own words. ${esc(q.rule || '')}</p>` +
        q.points.map((p, i) => `<label><input type="checkbox" data-i="${i}"${ticks.has(i) ? ' checked' : ''}><span>${p}</span></label>`).join('') + '<div class="score"></div>');
      box.appendChild(list);
      const score = $('.score', list);
      const paint = () => {
        const n = ticks.size, m = Math.min(n, q.marks || n);
        score.textContent = `You ticked ${n} of ${q.points.length} points: about ${m} of ${q.marks} marks.` + (m < q.marks ? ' Add what is missing to your answer.' : '');
      };
      $$('input', list).forEach(c => c.addEventListener('change', () => { const i = +c.dataset.i; if (c.checked) ticks.add(i); else ticks.delete(i); ans.put(id, { ticks: Array.from(ticks) }); paint(); }));
      paint();
      ui.status('Answer written ✓', true);
      if (q.why) ui.why(q.why, true);
    }
    if (A.listed) { showList(); return; }
    btn.addEventListener('click', () => {
      if (words() < NEED) { ui.say(say, `Write your answer first: at least ${NEED} words.`, 'no'); ta.focus(); return; }
      L.done(id); ans.put(id, { listed: 1, text: ta.value }); A.listed = 1; showList();
    });
  }

  const DRAW = { gaps: drawGaps, mcq: drawMcq, num: drawNum, sort: drawSort, order: drawOrder, label: drawLabel, write: drawWrite, faults: drawFaults };
  /* the board's own words for each kind (Teacher.html reads mcq opts and gaps to say a wrong answer in words) */
  function regQ(id, q) {
    const r = { id, part: q.part, title: q.title, short: q.short, kind: q.kind };
    if (q.kind === 'mcq') r.opts = q.a.slice();
    if (q.kind === 'gaps') r.gaps = q.text.match(/\[\[([^\]]+)\]\]/g).map(m => m.slice(2, -2).split('|')[0]);
    if (q.ext) r.ext = 1;
    reg(r);
  }
  function drawAll() {
    const QS = window.QS || {};
    $$('.q[data-q]').forEach(box => {
      const id = box.dataset.q, q = QS[id];
      if (!q) { box.textContent = 'Missing question ' + id; return; }
      regQ(id, q);
      DRAW[q.kind](box, id, q);
    });
  }
  document.addEventListener('chemrev:build', drawAll);
  window.REVchecks = { canon, markGaps, parseGaps };
})();
