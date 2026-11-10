/* RR Hospitals — Scan a register page, Insurance claims, Daily closing, Proposal */
(function () {
  const RR = window.RR;
  const { icon, esc, inr, inrShort, pct } = RR;
  const P = RR.pages;
  const head = (title, sub, actions) => `<div class="head"><div><h1>${esc(title)}</h1><p>${sub}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
  const card = (title, sub, body, opt = {}) => `<section class="card${opt.flush ? ' flush' : ''}${opt.cls ? ' ' + opt.cls : ''}"><div class="card-h"><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${opt.right || ''}</div>${body}</section>`;
  const S = RR.pageState;
  Object.assign(S, { claimFilter: 'open', closeDay: null });

  /* ================= Scan a register page =================
     stage: pick → reading → draft → done. Readings are prepared
     in samples/scans.js, matched by file name or image hash. */
  const scan = (RR.scanState = { stage: 'pick', sheet: null, img: null, rows: [], unknown: false, posted: null });
  const PAY = ['Cash', 'UPI', 'Card', 'Due'];

  P.scan = () => {
    const s = scan;
    if (s.stage === 'pick') return `<div class="page">${head('Scan a register page', 'Photograph a page from any ward or OPD register. Each line becomes a draft bill for you to check and approve.')}
      <label class="drop" id="scan-drop"><input type="file" accept="image/*" capture="environment" id="scan-file" hidden>
        ${icon('scan')}<b>Take a photo or upload a page</b><span>JPG or PNG · the whole page, flat, in good light</span></label>
      <div class="sec-label">Or use a sample page</div>
      <div class="samples">${RR.SCANS.map(x => `<button class="sample" data-scan-sample="${x.id}"><img src="${x.img}" alt="" loading="lazy"><b>${esc(x.title)}</b><span>${esc(x.sub)} · ${x.rows.length} lines</span></button>`).join('')}</div></div>`;

    const img = `<figure class="scan-img${s.stage === 'reading' ? ' reading' : ''}"><img src="${s.img}" alt="Photo of ${esc(s.sheet ? s.sheet.title : 'register page')}">${s.stage === 'reading' ? '<i class="scan-line" aria-hidden="true"></i>' : ''}</figure>`;
    if (s.stage === 'reading') return `<div class="page">${head('Reading the page', s.sheet ? esc(s.sheet.title) : 'Uploaded page')}<div class="scan-grid">${img}
      <section class="card"><div class="reading-steps" role="status" aria-live="polite">${['Straightening the page', 'Finding the rows', 'Reading the handwriting', 'Matching patients and services'].map((t, i) => `<div class="rstep" style="--i:${i}"><span class="dot"></span>${t}</div>`).join('')}</div></section></div></div>`;

    if (s.stage === 'done') {
      const p = s.posted;
      return `<div class="page">${head('Page posted to the ledger', `${p.count} bills from ${esc(s.sheet.title)} · ${esc(s.sheet.page)}`)}
        <section class="card">${RR.emptyState(`${p.count} bills · ${inr(p.total)}`, 'folder', `${inr(p.paid)} already paid at the desk, ${inr(p.total - p.paid)} still owed. The page is kept with each bill.`)}
        <div class="done-act"><button class="btn btn-outline" data-act="scan-undo">Undo</button><button class="btn btn-outline" data-nav="billing">See in Billing</button><button class="btn btn-primary" data-act="scan-again">${icon('scan')}Scan another page</button></div></section></div>`;
    }

    /* draft */
    if (s.unknown) return `<div class="page">${head('Couldn’t read this page clearly', 'The photo is too blurred, angled or dark to read the lines reliably.', '<button class="btn btn-outline" data-act="scan-again">Try another photo</button>')}
      <div class="scan-grid">${img}<section class="card"><p class="lead">For the best read, lay the register flat, fill the frame with one page, and take the photo in good light without a shadow across it.</p>
      <ul class="scan-tips"><li>Hold the phone straight above the page, not at an angle</li><li>Turn off the flash if it leaves a white glare</li><li>One page per photo; avoid catching the facing page</li></ul>
      <div class="done-act"><button class="btn btn-primary" data-act="scan-again">${icon('camera')}Take another photo</button><button class="btn btn-outline" data-act="new-paper">${icon('plus')}Enter the lines by hand</button></div></section></div></div>`;
    const rows = s.rows, checks = rows.filter(r => r.check && r.check.length && !r.ok).length;
    const total = rows.filter(r => r.on).reduce((a, r) => a + (+r.amount || 0), 0);
    const cell = (r, i, k, input) => `<td data-label="${k[1]}" class="${r.check && r.check.includes(k[0]) && !r.ok ? 'unsure' : ''}">${input}</td>`;
    const opt = (list, v) => list.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('');
    return `<div class="page">${head('Check the draft', `${esc(s.sheet.title)} · ${esc(s.sheet.page)} · ${RR.date(s.sheet.date)}`, '<button class="btn btn-outline" data-act="scan-again">Discard</button>')}
      <div class="scan-grid">${img}
      <section class="card flush draft">
        <div class="card-h"><div><h2>${rows.length} lines read</h2><p>${checks ? `${checks} ${checks === 1 ? 'field is' : 'fields are'} unclear on the page and marked. Check them against the photo.` : 'Every field read clearly. Untick a line to leave it out.'}</p></div></div>
        <div class="table-wrap"><table class="compact edit"><thead><tr><th></th><th>Patient</th><th>Age</th><th>Department</th><th>Service</th><th class="num">₹</th><th>Paid</th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr class="${r.on ? '' : 'off'}" style="--i:${i}"><td class="tick" data-label="Line ${i + 1}"><input type="checkbox" data-scan-on="${i}" ${r.on ? 'checked' : ''} aria-label="Include line ${i + 1}"></td>
          ${cell(r, i, ['name', 'Patient'], `<input class="input" data-scan-f="${i}.name" value="${esc(r.name)}" aria-label="Patient, line ${i + 1}">${r.hand.split('|')[0].trim() !== r.name ? `<span class="hand">On the page: ${esc(r.hand.split('|')[0].trim())}</span>` : ''}`)}
          ${cell(r, i, ['age', 'Age'], `<input class="input w-age" data-scan-f="${i}.age" value="${esc(r.age)}" inputmode="numeric" aria-label="Age, line ${i + 1}">`)}
          ${cell(r, i, ['dept', 'Department'], `<select class="select" data-scan-f="${i}.dept" aria-label="Department, line ${i + 1}">${opt(RR.DEPTS, r.dept)}</select>`)}
          ${cell(r, i, ['service', 'Service'], `<select class="select" data-scan-f="${i}.service" aria-label="Service, line ${i + 1}">${opt(Object.keys(RR.SERVICES), r.service)}</select>`)}
          ${cell(r, i, ['amount', 'Amount'], `<input class="input num" data-scan-f="${i}.amount" value="${esc(r.amount)}" inputmode="numeric" aria-label="Amount, line ${i + 1}">`)}
          ${cell(r, i, ['pay', 'Paid'], `<select class="select" data-scan-f="${i}.pay" aria-label="Payment, line ${i + 1}">${opt(PAY, r.pay)}</select>`)}</tr>`).join('')}
        </tbody></table></div>
        <div class="draft-f"><span><b>${rows.filter(r => r.on).length} bills</b> · ${inr(total)}</span><button class="btn btn-primary" data-act="scan-post" ${checks ? 'aria-describedby="scan-hint"' : ''}>${icon('check')}Approve and post</button></div>
        ${checks ? `<p class="f-hint draft-hint" id="scan-hint">Posting confirms the marked fields as they are now.</p>` : ''}
      </section></div></div>`;
  };

  async function hash(file) {
    try { const b = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return ''; }
  }
  const hashes = {};
  async function sampleHash(sh) {
    if (hashes[sh.id]) return hashes[sh.id];
    try { const r = await fetch(sh.img); const b = await crypto.subtle.digest('SHA-256', await r.arrayBuffer()); return (hashes[sh.id] = [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')); } catch (e) { return ''; }
  }
  function read(sheet, img) {
    Object.assign(scan, { stage: 'reading', sheet, img, unknown: !sheet, rows: sheet ? sheet.rows.map(r => ({ ...r, on: true, ok: false })) : [] });
    RR.App.refresh();
    const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 600 : 2600;
    setTimeout(() => { if (scan.stage === 'reading') { scan.stage = 'draft'; RR.App.refresh(); } }, ms);
  }
  RR.scanSample = id => { const sh = RR.SCANS.find(x => x.id === id); read(sh, sh.img); };
  RR.scanFile = async file => {
    const url = URL.createObjectURL(file), name = file.name.toLowerCase(), h = await hash(file);
    let sheet = RR.SCANS.find(x => x.files.some(f => name === f.toLowerCase() || name.endsWith('/' + f.toLowerCase())));
    if (!sheet) for (const x of RR.SCANS) if (h && (await sampleHash(x)) === h) { sheet = x; break; }
    if (!sheet) sheet = RR.SCANS.find(x => name.includes(x.id)); // e.g. "opd (1).jpg"
    read(sheet || null, url);
  };
  RR.scanEdit = (key, v) => { const [i, f] = key.split('.'); const r = scan.rows[+i]; r[f] = f === 'age' || f === 'amount' ? String(v).replace(/[^\d]/g, '') : v; if (r.check && r.check.includes(f)) r.ok = true; };
  RR.scanPost = () => {
    const snap = RR.snapshot(), sh = scan.sheet, rows = scan.rows.filter(r => r.on);
    const bad = rows.find(r => !(r.name || '').trim() || !(+r.amount > 0));
    if (bad) return RR.toast('Line ' + (scan.rows.indexOf(bad) + 1) + ' needs a name and an amount');
    let total = 0, paid = 0;
    rows.forEach(r => {
      const name = r.name.trim();
      let p = RR.db.patients.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (!p) { p = { id: RR.nextId(RR.db.patients, 'PT-', 1000), name, sex: r.sex, age: +r.age || null, dept: r.dept, mrn: 'RR' + (240100 + RR.db.patients.length), source: 'paper' }; RR.db.patients.push(p); }
      const date = sh.date > RR.todayISO ? RR.todayISO : sh.date, isPaid = r.pay !== 'Due', amt = +r.amount;
      RR.db.invoices.push({ id: RR.nextInvoiceId(), patientId: p.id, patient: p.name, dept: r.dept, service: r.service, date, due: RR.iso(RR.addDays(RR.parse(date), 15)), amount: amt, insurance: 0, payer: 'Self-pay',
        status: isPaid ? 'paid' : 'pending', paidOn: isPaid ? date : null, method: isPaid ? r.pay : null, legacy: true, source: `${sh.title} · ${sh.page}` });
      total += amt; if (isPaid) paid += amt;
    });
    RR.save();
    scan.posted = { count: rows.length, total, paid, snap };
    scan.stage = 'done'; RR.App.refresh();
  };
  RR.scanUndo = () => { if (scan.posted) { RR.restore(scan.posted.snap); scan.stage = 'draft'; scan.posted = null; RR.App.refresh(); RR.toast('Page taken back out of the ledger'); } };
  RR.scanReset = () => { Object.assign(scan, { stage: 'pick', sheet: null, img: null, rows: [], unknown: false, posted: null }); RR.App.refresh(); };

  /* ================= Insurance claims ================= */
  const CB = { pending: ['soft', 'With TPA'], queried: ['danger', 'Queried'], settled: ['solid', 'Settled'], short: ['outline', 'Short-paid'] };
  const cbadge = s => `<span class="badge badge-${CB[s][0]}">${CB[s][1]}</span>`;
  P.claims = () => {
    const c = RR.claims();
    const list = (S.claimFilter === 'open' ? c.open : S.claimFilter === 'stuck' ? c.stuck : S.claimFilter === 'queried' ? c.queried : S.claimFilter === 'short' ? c.short : c.all)
      .slice().sort((a, b) => (S.claimFilter === 'short' ? (b.amount - b.settled) - (a.amount - a.settled) : RR.claimAge(b) - RR.claimAge(a)));
    const seg = [['open', 'Open', c.open.length], ['stuck', 'Over 30 days', c.stuck.length], ['queried', 'Queried', c.queried.length], ['short', 'Short-paid', c.short.length], ['all', 'All', c.all.length]];
    return `<div class="page">${head('Insurance claims', 'Every insured bill, from submission to the TPA to the money in the bank.')}
      <div class="callout"><b>${inr(c.stuckValue)}</b> is stuck with TPAs for over 30 days, across ${c.stuck.length} claims.${c.queried.length ? ` ${c.queried.length} of the open claims are waiting on a reply from us.` : ''}</div>
      ${RR.kpiStrip([{ label: 'Open with insurers', value: inrShort(c.openValue), count: c.openValue, note: c.open.length + ' claims' }, { label: 'Over 30 days', value: inrShort(c.stuckValue), count: c.stuckValue, neg: true, note: c.stuck.length + ' claims' },
        { label: 'Queried', value: c.queried.length + '', note: inrShort(c.queried.reduce((a, x) => a + x.amount, 0)) + ' held' }, { label: 'Lost to deductions', value: inrShort(c.shortValue), count: c.shortValue, note: c.short.length + ' short-paid claims' }])}
      <div class="grid g-12">
        ${card('By insurer', 'Open claims · average days waiting', RR.hbars(c.payers.map(p => ({ label: p.payer, sub: `${p.count} open · ${p.avgDays} days avg`, value: p.open }))))}
        ${card('How long they’ve waited', 'Open claims by age', RR.hbars(c.buckets.map((b, i) => ({ label: b.label, sub: b.count + ' claims', value: b.value, tone: i >= 2 ? 'ember' : 'ink' }))))}
      </div>
      <section class="card flush"><div class="toolbar"><div class="seg" role="group" aria-label="Filter claims">${seg.map(([k, l, n]) => `<button data-claim-filter="${k}" aria-pressed="${S.claimFilter === k}">${l} <span class="n">${n}</span></button>`).join('')}</div></div>
      ${RR.table(list.slice(0, 60), [
        { h: 'Claim', f: x => `${esc(x.id)}<span class="sub">${esc(x.invoiceId)}</span>` },
        { h: 'Patient', f: x => `${esc(x.patient)}<span class="sub">${esc(x.dept)}</span>` },
        { h: 'Insurer', f: x => esc(x.payer) },
        { h: 'Submitted', f: x => `${RR.dateShort(x.submitted)}<span class="sub${RR.claimAge(x) > 30 && (x.status === 'pending' || x.status === 'queried') ? ' neg' : ''}">${RR.claimAge(x)} days${x.settledOn ? ' to settle' : ''}</span>` },
        { h: 'Status', f: x => cbadge(x.status) + (x.note ? `<span class="sub">${esc(x.note)}</span>` : '') },
        { h: 'Claimed', num: 1, f: x => inr(x.amount) + (x.status === 'short' ? `<span class="sub neg">−${inr(x.amount - x.settled)}</span>` : '') },
        { h: '', cls: 'row-act', f: x => (x.status === 'pending' || x.status === 'queried' ? `<button class="btn btn-ghost btn-sm" data-settle="${x.id}">Record settlement</button>` : '') }],
        { empty: S.claimFilter === 'stuck' ? 'Nothing stuck over 30 days' : 'No claims here', art: 'calendar', emptySub: S.claimFilter === 'stuck' ? 'Every open claim is under a month old.' : '' })}
      ${list.length > 60 ? `<div class="foot-row"><span>Showing the 60 oldest of ${list.length}</span></div>` : ''}</section></div>`;
  };

  /* ================= Daily closing ================= */
  P.closing = () => {
    const day = S.closeDay || RR.todayISO, c = RR.closing(day), past = RR.recentClosings(8).slice(1);
    const isToday = day === RR.todayISO, rec = c.rec;
    const rows = RR.CLOSE_METHODS.map(([k, label]) => {
      const d = rec ? rec.diff[k] || 0 : null;
      return `<tr><td data-label="Method">${label}</td><td class="num" data-label="In the ledger">${inr(c.ledger[k])}</td>
        <td class="num" data-label="Counted at the desk">${rec ? inr(c.counted[k]) : `<input class="input num" name="${k}" value="${c.ledger[k]}" inputmode="numeric" aria-label="${label} counted">`}</td>
        <td class="num ${d ? 'neg' : ''}" data-label="Difference">${rec ? (d ? (d > 0 ? '+' : '−') + inr(Math.abs(d)) : 'Matches') : '<span class="muted">—</span>'}</td></tr>`;
    }).join('');
    const diffMsg = rec ? (c.diff ? `<div class="callout ember"><b>${c.diff > 0 ? 'Over' : 'Short'} by ${inr(Math.abs(c.diff))}</b> at the desk. Closed by ${esc(rec.by)} at ${esc(rec.at)}.</div>` : `<div class="callout ok">Cash, UPI and card all match the ledger. Closed by ${esc(rec.by)} at ${esc(rec.at)}.</div>`) : '';
    return `<div class="page">${head('Daily closing', `${isToday ? 'Today' : RR.date(day)} · what was billed against what came in at the desk`, !isToday ? '<button class="btn btn-outline" data-close-day="">Back to today</button>' : '')}
      ${RR.kpiStrip([{ label: 'Billed', value: inrShort(c.billed), count: c.billed, note: c.bills + ' bills' }, { label: 'Collected at the desk', value: inrShort(c.desk), count: c.desk, note: 'Cash, UPI and card' },
        { label: 'Owed by patients', value: inrShort(c.dueFromPatients), count: c.dueFromPatients, note: 'From ' + (isToday ? 'today’s' : 'the day’s') + ' bills' }, { label: 'Billed to insurers', value: inrShort(c.withInsurers), count: c.withInsurers, note: 'Goes to Claims' }])}
      ${diffMsg}
      <form class="card flush close-form" id="close-form" novalidate><div class="card-h"><div><h2>${rec ? 'Closed' : 'Count the drawer'}</h2><p>${rec ? 'Counted amounts are locked for the day.' : 'Enter what the cashier counted. Anything that doesn’t match the ledger is flagged.'}</p></div></div>
        <div class="table-wrap"><table class="compact"><thead><tr><th>Method</th><th class="num">In the ledger</th><th class="num">Counted at the desk</th><th class="num">Difference</th></tr></thead><tbody>${rows}
        <tr class="tot"><td>Total</td><td class="num">${inr(c.desk)}</td><td class="num">${rec ? inr(c.desk + c.diff) : ''}</td><td class="num ${c.diff ? 'neg' : ''}">${rec ? (c.diff ? (c.diff > 0 ? '+' : '−') + inr(Math.abs(c.diff)) : 'Matches') : ''}</td></tr></tbody></table></div>
        ${!rec ? `<div class="draft-f"><span class="muted">${c.payments} payments today${c.other ? ` · ${inr(c.other)} by insurance or NEFT, not counted here` : ''}</span><button class="btn btn-primary" type="submit">${icon('check')}Close the day</button></div>` : c.other ? `<div class="foot-row"><span>${inr(c.other)} by insurance or NEFT, not counted at the desk</span></div>` : ''}
      </form>
      ${card('Last 7 days', '', RR.table(past, [
        { h: 'Day', f: x => `<button class="link-btn" data-close-day="${x.day}">${RR.date(x.day)}</button>` },
        { h: 'Billed', num: 1, f: x => inr(x.billed) }, { h: 'Collected', num: 1, f: x => inr(x.desk) },
        { h: 'Desk', f: x => (x.rec ? (x.diff ? `<span class="badge badge-danger">${x.diff > 0 ? '+' : '−'}${inr(Math.abs(x.diff))}</span>` : '<span class="badge badge-solid">Matched</span>') : '<span class="badge badge-outline">Not closed</span>') }], { compact: 1 }), { flush: 1 })}
    </div>`;
  };
  RR.submitClosing = form => {
    const day = S.closeDay || RR.todayISO, d = Object.fromEntries(new FormData(form)), counted = {};
    for (const [k, label] of RR.CLOSE_METHODS) { const n = Math.round(parseFloat(String(d[k] || '0').replace(/[₹,\s]/g, ''))); if (!(n >= 0)) return RR.toast('Enter the ' + label + ' amount counted'); counted[k] = n; }
    const snap = RR.snapshot(); RR.closeDay(day, counted, 'Asim');
    const c = RR.closing(day);
    RR.App.commit(c.diff ? `Day closed · ${c.diff > 0 ? 'over' : 'short'} by ${inr(Math.abs(c.diff))}` : 'Day closed · everything matches', snap);
  };

  /* ================= Proposal (closing slide) ================= */
  P.proposal = () => {
    const p = RR.CONFIG.proposal;
    return `<div class="page slide"><div class="slide-in">
      <div class="slide-k">${esc(RR.CONFIG.hospital)}</div>
      <h1>Phase 1 live in ${p.weeks} weeks.</h1>
      <p class="slide-price"><b>${esc(p.price)}</b> ${esc(p.priceNote)}</p>
      <ul>${p.phase1.map(x => `<li>${icon('check')}${esc(x)}</li>`).join('')}</ul>
      <p class="slide-foot">${esc(p.contact)}</p></div><button class="slide-x" data-nav="overview" aria-label="Close slide">${icon('x')}</button></div>`;
  };
})();

/* ================= Doctors: shifts and who saw whom ================= */
(function () {
  const RR = window.RR, { icon, esc, inr } = RR, P = RR.pages, S = RR.pageState;
  S.docId = S.docId || null; S.docDay = S.docDay || null;
  const head = (t, sub, a) => `<div class="head"><div><h1>${esc(t)}</h1><p>${sub}</p></div>${a ? `<div class="actions">${a}</div>` : ''}</div>`;
  P.doctors = () => {
    const docs = RR.doctors(), sel = docs.find(d => d.id === S.docId) || docs[0];
    const day = S.docDay || RR.currentShiftDay(sel), sum = RR.shiftSummary(sel, day), w = sum.win;
    const all = docs.map(d => RR.shiftSummary(d, RR.currentShiftDay(d)));
    const days = Array.from({ length: 7 }, (_, k) => RR.iso(RR.addDays(RR.parse(RR.currentShiftDay(sel)), -k)));
    const live = day === RR.currentShiftDay(sel) && RR.onShiftNow(sel);
    return `<div class="page">${head('Doctors', 'Who is on shift, and which patients each doctor has seen.', `<button class="btn btn-primary" data-act="log-visit">${icon('plus')}Log a visit</button>`)}
      ${RR.kpiStrip([{ label: 'Seen this shift', value: all.reduce((a, r) => a + r.seen.length, 0) + '', note: 'All doctors, current or last shift' }, { label: 'Waiting now', value: all.reduce((a, r) => a + r.waiting.length, 0) + '' },
        { label: 'On shift now', value: docs.filter(RR.onShiftNow).length + ' of ' + docs.length }, { label: 'Busiest', value: esc(all.slice().sort((a, b) => b.seen.length - a.seen.length)[0].doc.name.replace(/^Dr\.?\s*/, 'Dr ')), note: all.slice().sort((a, b) => b.seen.length - a.seen.length)[0].seen.length + ' patients' }])}
      <div class="doc-grid">
        <section class="card flush doc-list" aria-label="Doctors">${all.map(r => `<button class="doc-row${r.doc.id === sel.id ? ' on' : ''}" data-doc="${r.doc.id}" aria-pressed="${r.doc.id === sel.id}">
          <span class="doc-n"><b>${esc(r.doc.name)}</b><span>${esc(r.doc.dept)} · ${r.win.label} ${r.win.fromLabel}–${r.win.toLabel}</span></span>
          <span class="doc-c">${RR.onShiftNow(r.doc) ? '<i class="live" aria-label="On shift"></i>' : ''}<b>${r.seen.length}</b><span>seen</span></span></button>`).join('')}</section>
        <section class="card flush">
          <div class="card-h"><div><h2>${esc(sel.name)} · ${w.label} shift</h2><p>${live ? 'On shift now · ' : ''}${RR.date(day)} · ${w.fromLabel}–${w.toLabel}${sum.seen.length ? ` · ${sum.seen.length} seen${sum.waiting.length ? `, ${sum.waiting.length} waiting` : ''}` : ''}</p></div>
            <select class="select doc-day" data-doc-day aria-label="Shift day">${days.map(d => `<option value="${d}"${d === day ? ' selected' : ''}>${d === RR.currentShiftDay(sel) ? (live ? 'Current shift' : 'Latest shift') : RR.date(d)}</option>`).join('')}</select></div>
          ${RR.table(sum.visits, [{ h: 'Time', f: v => esc(v.time) }, { h: 'Patient', f: v => `${esc(v.patient)}<span class="sub">${esc(v.type)}</span>` }, { h: 'Reason', f: v => esc(v.reason) }, { h: 'Status', f: v => RR.visitBadge(v.status) }],
            { compact: 1, empty: RR.parse(day).getDay() === 0 && sel.dept !== 'Emergency' && sel.dept !== 'Maternity' ? 'Not on shift · Sunday' : 'No patients yet this shift', art: 'calendar' })}
        </section></div></div>`;
  };
  RR.visitForm = () => {
    const docs = RR.doctors(), on = docs.find(RR.onShiftNow) || docs[0];
    const f = (n, l, i) => `<div class="f"><label for="f-${n}">${l}</label>${i}<div class="err" id="err-${n}"></div></div>`;
    RR.drawer('Log a visit', 'Records that a doctor has seen a patient, in their current shift',
      f('doc', 'Doctor', `<select class="select" id="f-doc" name="doc">${docs.map(d => `<option value="${d.id}"${d.id === (S.docId || on.id) ? ' selected' : ''}>${esc(d.name)} · ${esc(d.dept)}</option>`).join('')}</select>`) +
      f('pt', 'Patient', `<select class="select" id="f-pt" name="pt">${RR.db.patients.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => `<option value="${p.id}">${esc(p.name)} · ${p.mrn}</option>`).join('')}</select>`) +
      `<div class="f-row">${f('reason', 'Reason', '<input class="input" id="f-reason" name="reason" placeholder="e.g. Chest pain">')}${f('type', 'Type', '<select class="select" id="f-type" name="type"><option>OPD</option><option>Follow-up</option><option>Admitted</option></select>')}</div>`,
      'Log visit', d => { const snap = RR.snapshot(), v = RR.logVisit(d.doc, d.pt, d.reason.trim(), d.type); S.docId = d.doc; S.docDay = null; RR.App.commit(`${v.patient} logged with ${v.doctor}`, snap); });
  };
})();
