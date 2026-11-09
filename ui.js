/* ============================================================
   RR Hospitals — UI kit: formatting, icons, charts, blocks
   ============================================================ */
(function () {
  const RR = (window.RR = window.RR || {});

  /* ---------- formatting ---------- */
  RR.inr = n => (n < 0 ? '−' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  RR.inrShort = n => {
    const s = n < 0 ? '−' : '', a = Math.abs(Math.round(n));
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 1 : 2) + ' L';
    if (a >= 1e3) return s + '₹' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return s + '₹' + a;
  };
  RR.pct = (n, d = 0) => (n * 100).toFixed(d) + '%';
  RR.delta = (cur, prev) => (prev ? (cur - prev) / Math.abs(prev) : 0);
  RR.date = s => (s ? RR.parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  RR.dateShort = s => (s ? RR.parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  RR.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  /* minimal markdown: **bold** only, after escaping */
  RR.md = s => RR.esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  /* ---------- icons (Lucide geometry, 1.75 stroke) ---------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    spark: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    receipt: '<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/>',
    wallet: '<path d="M19 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 13h2M16 3H6a2 2 0 0 0-2 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 2 8.5c0 2.1 1.5 4 3 5.5l7 7Z"/>',
    building: '<path d="M3 21h18M5 21V5l7-2v18M19 21V9l-7-2"/><path d="M8 9h1M8 13h1M8 17h1"/>',
    scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 9h8M8 12h8M8 15h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    play: '<path d="m7 4 13 8-13 8Z"/>',
    arrowUp: '<path d="M7 17 17 7M9 7h8v8"/>',
    arrowDown: '<path d="M7 7l10 10M17 9v8H9"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5Z"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M15 3v18"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    steth: '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a5 5 0 0 0 10 0v-2"/><circle cx="21" cy="12" r="2"/>',
    camera: '<path d="M14.5 4h-5L7.5 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5Z"/><circle cx="12" cy="13" r="3.5"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    tally: '<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  };
  RR.icon = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- badges ---------- */
  const B = { paid: ['solid', 'Paid'], pending: ['soft', 'Pending'], overdue: ['danger', 'Overdue'], draft: ['outline', 'Draft'], void: ['outline', 'Void'],
    approved: ['solid', 'Approved'], processed: ['solid', 'Processed'], scheduled: ['soft', 'Scheduled'], digitised: ['solid', 'Digitised'], review: ['danger', 'Needs review'] };
  RR.badge = s => { const b = B[s] || ['soft', s]; return `<span class="badge badge-${b[0]}">${RR.esc(b[1])}</span>`; };

  /* ---------- charts (SVG, monochrome) ---------- */
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }

  /* grouped/single vertical bars. series: [{name, key, tone}] tone: ink|mid|light|ember */
  RR.barChart = function (rows, series, opt = {}) {
    const W = 640, H = opt.h || 220, L = 54, R = 8, T = 10, Bm = 26;
    const max = niceMax(Math.max(1, ...rows.flatMap(r => series.map(s => r[s.key] || 0))));
    const gw = (W - L - R) / rows.length, inner = gw * 0.62, bw = inner / series.length;
    let g = '';
    for (let t = 0; t <= 4; t++) {
      const y = T + (H - T - Bm) * (1 - t / 4);
      g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${RR.inrShort((max * t) / 4)}</text>`;
    }
    rows.forEach((r, i) => {
      const x0 = L + i * gw + (gw - inner) / 2;
      series.forEach((s, k) => {
        const v = r[s.key] || 0, h = ((H - T - Bm) * v) / max;
        const tone = typeof s.tone === 'function' ? s.tone(r, i) : s.tone;
        g += `<rect class="bar t-${tone}" x="${x0 + k * bw + 1}" y="${H - Bm - h}" width="${Math.max(2, bw - 2)}" height="${h}" rx="4" style="--d:${i * 40}ms"><title>${RR.esc(r.label)} · ${RR.esc(s.name)}: ${RR.inr(v)}</title></rect>`;
      });
      g += `<text class="ax" x="${L + i * gw + gw / 2}" y="${H - 8}" text-anchor="middle">${RR.esc(r.label)}</text>`;
    });
    const legend = series.length > 1 || opt.legend ? `<div class="legend">${(opt.legend || series).map(s => `<span><i class="sw t-${s.tone}"></i>${RR.esc(s.name)}</span>`).join('')}</div>` : '';
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${RR.esc(opt.label || 'Bar chart')}">${g}</svg>${legend}`;
  };

  /* SVG charts scale with their card; keep axis text at a readable 11px whatever the width */
  RR.fitCharts = function (root) {
    (root || document).querySelectorAll('svg.chart').forEach(s => {
      const w = s.clientWidth, vb = s.viewBox.baseVal.width; if (!w || !vb) return;
      s.style.setProperty('--ax', (11 * vb / w).toFixed(2) + 'px');
    });
  };
  if (typeof window !== 'undefined' && window.addEventListener) { let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => RR.fitCharts(), 100); }); }

  /* line with optional forecast point + band */
  RR.lineChart = function (pts, opt = {}) {
    const W = 640, H = opt.h || 220, L = 54, R = 16, T = 12, Bm = 26;
    const all = pts.map(p => p.v).concat(opt.forecast ? [opt.forecast.v + opt.forecast.band] : []);
    const max = niceMax(Math.max(1, ...all));
    const n = pts.length + (opt.forecast ? 1 : 0);
    const X = i => L + ((W - L - R) * i) / Math.max(1, n - 1);
    const Y = v => T + (H - T - Bm) * (1 - v / max);
    let g = '';
    for (let t = 0; t <= 4; t++) { const y = Y((max * t) / 4); g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${RR.inrShort((max * t) / 4)}</text>`; }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
    const area = d + ` L${X(pts.length - 1).toFixed(1)} ${H - Bm} L${X(0)} ${H - Bm} Z`;
    g += `<path class="area" d="${area}"/><path class="line" d="${d}" pathLength="1"/>`;
    pts.forEach((p, i) => { g += `<circle class="pt" cx="${X(i)}" cy="${Y(p.v)}" r="3"><title>${RR.esc(p.label)}: ${RR.inr(p.v)}</title></circle><text class="ax" x="${X(i)}" y="${H - 8}" text-anchor="middle">${RR.esc(p.label)}</text>`; });
    if (opt.forecast) {
      const f = opt.forecast, i = pts.length, last = pts[pts.length - 1];
      g += `<rect class="band" x="${X(i) - 10}" y="${Y(f.v + f.band)}" width="20" height="${Math.max(2, Y(Math.max(0, f.v - f.band)) - Y(f.v + f.band))}" rx="6"/>`;
      g += `<path class="line fc" d="M${X(i - 1)} ${Y(last.v)} L${X(i)} ${Y(f.v)}"/><circle class="pt fc" cx="${X(i)}" cy="${Y(f.v)}" r="4"><title>Forecast ${RR.esc(f.label)}: ${RR.inr(f.v)} ± ${RR.inrShort(f.band)}</title></circle>`;
      g += `<text class="ax" x="${X(i)}" y="${H - 8}" text-anchor="middle">${RR.esc(f.label)}</text>`;
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${RR.esc(opt.label || 'Line chart')}">${g}</svg>`;
  };

  /* horizontal bars — rows [{label, value, sub?, tone?}] ; diverging if any negative */
  RR.hbars = function (rows, opt = {}) {
    const max = Math.max(1, ...rows.map(r => Math.abs(r.value)));
    const div = rows.some(r => r.value < 0);
    return `<div class="hbars${div ? ' div' : ''}">${rows.map((r, i) => {
      const w = (Math.abs(r.value) / (opt.max || max)) * 100;
      const tone = r.tone || (r.value < 0 ? 'ember' : 'ink');
      const bar = div
        ? `<div class="track"><div class="half neg">${r.value < 0 ? `<i class="t-${tone}" style="width:${w}%;--d:${i * 40}ms"></i>` : ''}</div><div class="half pos">${r.value >= 0 ? `<i class="t-${tone}" style="width:${w}%;--d:${i * 40}ms"></i>` : ''}</div></div>`
        : `<div class="track"><i class="t-${tone}" style="width:${Math.min(100, w)}%;--d:${i * 40}ms"></i>${opt.marker ? `<b class="marker" style="left:${Math.min(100, opt.marker * 100)}%"></b>` : ''}</div>`;
      return `<div class="hrow"><div class="hl">${RR.esc(r.label)}${r.sub ? `<span>${RR.esc(r.sub)}</span>` : ''}</div>${bar}<div class="hv${r.value < 0 ? ' neg' : ''}">${r.display || RR.inrShort(r.value)}</div></div>`;
    }).join('')}</div>`;
  };

  /* KPI strip */
  RR.kpiStrip = items => `<div class="kpis">${items.map(k => `
    <div class="kpi"><div class="k-label">${RR.esc(k.label)}</div>
      <div class="k-value${k.neg ? ' neg' : ''}" ${k.count != null ? `data-count="${k.count}" data-fmt="${k.fmt || 'short'}"` : ''}>${k.value}</div>
      ${k.delta != null ? `<div class="k-delta ${k.good ? 'good' : 'bad'}">${RR.icon(k.delta >= 0 ? 'arrowUp' : 'arrowDown')}${RR.pct(Math.abs(k.delta), 1)} <span>${RR.esc(k.vs || 'vs prior 30 days')}</span></div>` : k.note ? `<div class="k-note">${RR.esc(k.note)}</div>` : ''}
    </div>`).join('')}</div>`;

  /* generic table: cols [{h, f(row), num?, cls?}] */
  RR.table = (rows, cols, opt = {}) => rows.length
    ? `<div class="table-wrap"><table${opt.compact ? ' class="compact"' : ''}><thead><tr>${cols.map(c => `<th${c.num ? ' class="num"' : ''}>${RR.esc(c.h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${opt.rowAttr ? ' ' + opt.rowAttr(r) : ''}>${cols.map(c => `<td class="${c.num ? 'num ' : ''}${c.cls || ''}" data-label="${RR.esc(c.h)}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : RR.emptyState(opt.empty || 'Nothing here yet', opt.art || 'ledger', opt.emptySub);

  /* empty / finished states: a quiet isometric illustration that plays once, then holds */
  RR.emptyState = (title, art, sub) => `<div class="empty">${art ? `<canvas class="iso" data-iso="${art}" aria-hidden="true"></canvas>` : ''}<div class="empty-t">${RR.esc(title)}</div>${sub ? `<div class="empty-s">${RR.esc(sub)}</div>` : ''}</div>`;
  const isoLive = new WeakSet();
  RR.mountIso = function (root) {
    if (!window.RRIso) return;
    (root || document).querySelectorAll('canvas[data-iso]').forEach(c => {
      if (isoLive.has(c)) return; isoLive.add(c);
      const icon = RRIso.ICONS[c.dataset.iso]; if (!icon) return;
      const p = RRIso.play(c, icon, { palette: RRIso.palette, loop: false });
      const stopWhenGone = new MutationObserver(() => { if (!c.isConnected) { p.stop(); stopWhenGone.disconnect(); } });
      stopWhenGone.observe(document.body, { childList: true, subtree: true });
    });
  };

  /* count-up for [data-count] inside root */
  RR.countUp = function (root) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count, fmt = el.dataset.fmt;
      const f = fmt === 'full' ? RR.inr : fmt === 'pct' ? v => RR.pct(v / 100) : fmt === 'int' ? v => Math.round(v).toLocaleString('en-IN') : fmt === 'days' ? v => Math.round(v) + ' days' : RR.inrShort;
      el.removeAttribute('data-count');
      if (reduce) { el.textContent = f(target); return; }
      const t0 = performance.now(), dur = 700;
      (function step(t) { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = f(target * e); if (p < 1) requestAnimationFrame(step); })(t0);
    });
  };
})();
