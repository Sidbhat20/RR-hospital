/* ============================================================
   RR Hospitals — what the copilot understands.
   Plain answers by default. Charts only when asked for a chart,
   tables only when asked to list or show. No suggestions.
   Every figure is computed from the ledger for the period asked
   (today / this week / this month / this year) or, if none is
   named, the period selected in the top bar.
   ============================================================ */
(function () {
  const RR = window.RR;
  const { icon, esc, inr, inrShort, pct } = RR;

  /* ---------- blocks ---------- */
  const blk = (title, sub, body, opt = {}) => ({ html: `<div class="block${opt.flush ? ' flush' : ''}"><div class="block-h"><b>${esc(title)}</b>${sub ? `<span>${sub}</span>` : ''}</div>${body}</div>` });
  const openLink = (page, label) => `<button class="link-btn" data-go="${page}">${esc(label)} ${icon('arrowRight')}</button>`;
  const action = a => ({ action: a });

  /* ---------- what the person asked to see ---------- */
  const wantsChart = s => /\b(chart|graph|plot|visual|visualise|visualize|trend|pull up|pull-up|draw|bar|line)\b/.test(s);
  const wantsTable = s => /\b(table|list|show|which|who|pull up|pull-up|breakdown|details?|all|every|entries|bills|invoices|open)\b/.test(s);

  /* ---------- entity lookup ---------- */
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9₹\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  function findPatient(q) {
    const t = ' ' + norm(q) + ' ', P = RR.db.patients;
    let hit = P.find(p => t.includes(' ' + norm(p.name) + ' '));
    if (hit) return hit;
    hit = P.filter(p => { const [f, ...l] = norm(p.name).split(' '); return t.includes(' ' + f + ' ') && l.length && t.includes(' ' + l[l.length - 1] + ' '); });
    if (hit.length === 1) return hit[0];
    const first = P.filter(p => t.includes(' ' + norm(p.name).split(' ')[0] + ' '));
    return first.length === 1 ? first[0] : null;
  }
  const findInvoice = q => { const m = q.match(/inv[-\s]?(\d{3,5})/i); return m ? RR.db.invoices.find(i => i.id === 'INV-' + m[1]) || { missing: 'INV-' + m[1] } : null; };
  const findDept = q => RR.DEPTS.find(d => new RegExp('\\b' + d.slice(0, 5), 'i').test(q));

  /* ---------- shared pieces ---------- */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const vs = (cur, prev, p) => {
    if (prev == null || !RR.prevPhrase(p)) return '';
    if (!prev) return cur ? '' : '';
    const d = RR.delta(cur, prev);
    return ` (${d >= 0 ? 'up' : 'down'} ${pct(Math.abs(d))} on ${RR.prevPhrase(p)})`;
  };
  function invoiceTable(rows, withDate) {
    return RR.table(rows, [
      { h: 'Invoice', f: i => esc(i.id) + (withDate ? `<span class="sub">${RR.dateShort(i.date)}</span>` : ''), cls: 'id' },
      { h: 'Patient', f: i => `${esc(i.patient)}<span class="sub">${esc(i.service)} · ${esc(i.dept)}</span>` },
      { h: 'Status', f: i => RR.badge(i.status) }, { h: 'Amount', f: i => inr(i.amount), num: 1 }], { compact: 1, empty: 'No bills in this period' });
  }
  const seriesChart = (p, label) => RR.barChart(RR.series(p), [{ name: 'Billed', key: 'billed', tone: 'light' }, { name: 'Collected', key: 'collected', tone: 'ink' }], { label });
  const chartSub = p => (p === 'today' || p === 'week' ? 'last 7 days' : p === 'month' ? 'by day' : 'by month, FY');

  /* ---------- overview ---------- */
  function overview(p, s) {
    const k = RR.kpis(p), ph = RR.periodPhrase(p);
    const text = [
      `${cap(ph)} RR Hospitals billed **${inr(k.billed)}** across ${k.bills} bills${vs(k.billed, k.billedPrev, p)} and collected **${inr(k.collected)}**.`,
      `Costs ${p === 'year' ? 'so far' : 'for the period'} come to **${inr(k.cost)}** (${inr(k.payroll)} payroll, ${inr(k.expenses)} spend), so net is **${inr(k.net)}**. Total still owed is ${inr(k.outstanding)}, of which ${inr(k.overdue)} is overdue.`,
    ];
    const blocks = [blk(RR.PERIODS[p], RR.range(p).from === RR.todayISO ? RR.date(RR.todayISO) : `${RR.dateShort(RR.range(p).from)} – ${RR.dateShort(RR.todayISO)}`, RR.kpiStrip([
      { label: 'Billed', value: inrShort(k.billed), count: k.billed }, { label: 'Collected', value: inrShort(k.collected), count: k.collected },
      { label: 'Net', value: inrShort(k.net), count: k.net, neg: k.net < 0 }, { label: 'Overdue', value: inrShort(k.overdue), count: k.overdue, neg: k.overdue > 0 }]))];
    if (wantsChart(s)) blocks.push(blk('Billed vs collected', chartSub(p), seriesChart(p, 'Billed versus collected')));
    return { text, blocks };
  }

  /* ---------- billing for a period ---------- */
  function billing(p, s) {
    const k = RR.kpis(p), list = RR.bills(p), ph = RR.periodPhrase(p);
    const text = [list.length
      ? `${cap(ph)}: **${k.bills} bills** for **${inr(k.billed)}**${vs(k.billed, k.billedPrev, p)}. ${inr(k.collected)} collected, ${pct(k.collectRate)} of what was billed.`
      : `No bills have been raised ${ph} yet.`];
    const blocks = [];
    if (wantsChart(s)) blocks.push(blk('Billing', chartSub(p), seriesChart(p, 'Billing by period')));
    if (wantsTable(s) && list.length) blocks.push(blk(`Bills · ${RR.PERIODS[p].toLowerCase()}`, openLink('billing', 'Open billing'), invoiceTable(list.slice(0, 12), p !== 'today') + (list.length > 12 ? `<div class="block-foot">${list.length - 12} more in Billing</div>` : ''), { flush: 1 }));
    return { text, blocks };
  }

  /* ---------- departments ---------- */
  function deptPL(p, s) {
    const rows = RR.deptPL(p), losers = rows.filter(r => r.net < 0), best = rows[0];
    const text = [losers.length
      ? `${losers.length === 1 ? 'One department is' : losers.length + ' departments are'} below break-even ${RR.periodPhrase(p)}: ${losers.map(r => `**${r.dept}** (${inr(r.net)})`).join(', ')}.`
      : `Every department covered its costs ${RR.periodPhrase(p)}.`, `**${best.dept}** is strongest at ${inr(best.net)} net.`];
    const blocks = [];
    if (wantsChart(s)) blocks.push(blk('Net by department', RR.periodPhrase(p), RR.hbars(rows.map(r => ({ label: r.dept, value: r.net })))));
    if (wantsTable(s)) blocks.push(blk('Department P&L', openLink('departments', 'Open departments'), RR.table(rows, [
      { h: 'Department', f: r => esc(r.dept), cls: 'strong' }, { h: 'Collected', f: r => inr(r.revenue), num: 1 },
      { h: 'Costs', f: r => inr(r.cost), num: 1 }, { h: 'Net', f: r => `<span class="${r.net < 0 ? 'neg' : ''}">${inr(r.net)}</span>`, num: 1 }], { compact: 1 }), { flush: 1 }));
    return { text, blocks };
  }
  function deptDetail(d, p, s) {
    const r = RR.deptPL(p).find(x => x.dept === d);
    const list = RR.bills(p).filter(i => i.dept === d);
    const blocks = [];
    if (wantsTable(s)) blocks.push(blk(`${d} bills`, RR.periodPhrase(p), invoiceTable(list.slice(0, 10), true), { flush: 1 }));
    return { text: [`**${d}** ${RR.periodPhrase(p)}: ${list.length} bills, ${inr(r.revenue)} collected against ${inr(r.cost)} in costs. Net **${inr(r.net)}**.`], blocks };
  }

  /* ---------- receivables ---------- */
  function overdue(q, s) {
    const d = findDept(q || '');
    const list = RR.db.invoices.filter(i => i.status === 'overdue' && (!d || i.dept === d)).sort((a, b) => b.amount - a.amount);
    const total = list.reduce((x, i) => x + i.amount, 0), unreminded = list.filter(i => !i.remindedOn);
    const blocks = [];
    if (wantsChart(s) && !d) blocks.push(blk('Receivables aging', 'by days past due', RR.hbars(RR.aging().map((a, i) => ({ label: a.label, sub: a.count + ' invoices', value: a.value, tone: i >= 3 ? 'ember' : i === 0 ? 'light' : 'ink' })))));
    if (wantsTable(s) && list.length) blocks.push(blk('Overdue', openLink('billing', 'Open billing'), invoiceTable(list.slice(0, 10), true), { flush: 1 }));
    if (/remind|chase|follow.?up|send/.test(s) && unreminded.length) blocks.push(action({
      title: 'Send payment reminders', rows: [['Invoices', unreminded.length + ''], ['Amount', inr(unreminded.reduce((x, i) => x + i.amount, 0))], ['Channel', 'SMS + WhatsApp']],
      confirm: `Send ${unreminded.length} reminders`,
      run: () => { unreminded.forEach(i => (i.remindedOn = RR.todayISO)); return { text: `Reminders logged on ${unreminded.length} invoices`, go: 'billing' }; },
    }));
    return { text: [list.length ? `**${inr(total)}** is overdue across ${list.length} invoices${d ? ' in ' + d : ''}. Largest is ${list[0].id}, ${list[0].patient}, ${inr(list[0].amount)}.` : `Nothing is overdue${d ? ' in ' + d : ''}.`], blocks };
  }

  function risk(s) {
    const r = RR.claimRisk(), high = r.filter(x => x.score >= 60), exposure = high.reduce((x, i) => x + i.insurance, 0);
    const blocks = [];
    if (wantsTable(s) || wantsChart(s)) blocks.push(blk('Denial risk', 'rules-based score', RR.table(r.slice(0, 8), [
      { h: 'Invoice', f: i => esc(i.id), cls: 'id' }, { h: 'Payer', f: i => `${esc(i.payer)}<span class="sub">${esc(i.reasons.join(' · ') || 'routine')}</span>` },
      { h: 'Score', f: i => `<span class="${i.score >= 60 ? 'neg' : ''}">${i.score}</span>`, num: 1 }, { h: 'At risk', f: i => inr(i.insurance), num: 1 }], { compact: 1 }), { flush: 1 }));
    return { text: [`${r.length} insurance claims are open. **${high.length}** score 60 or more on the denial rules (past due, days late, high insured share, pre-auth services), covering **${inr(exposure)}**.`], blocks };
  }

  function forecast(s) {
    const f = RR.forecast();
    const nm = new Date(RR.TODAY.getFullYear(), RR.TODAY.getMonth(), 1).toLocaleDateString('en-IN', { month: 'long' });
    const blocks = wantsChart(s) ? [blk('Monthly billing', 'actuals + projection', RR.lineChart(f.months.map(m => ({ label: m.label, v: m.billed })), { forecast: { label: nm.slice(0, 3), v: f.next, band: f.band }, label: 'Monthly billing with projection' }))] : [];
    return { text: [`${nm} billing is projected at **${inr(f.next)}**, ± ${inrShort(f.band)}, from a straight-line fit over the last 12 months (${f.slope >= 0 ? 'rising' : 'falling'} about ${inrShort(Math.abs(f.slope))} a month).`], blocks };
  }

  function budgetBars(b) {
    const max = Math.max(1.25, ...b.map(x => x.ratio));
    return RR.hbars(b.map(x => ({ label: x.category, sub: inrShort(x.spent) + ' of ' + inrShort(x.budget), value: x.ratio, display: pct(x.ratio), tone: x.ratio > 1 ? 'ember' : 'ink' })), { max, marker: 1 / max });
  }
  RR.budgetBars = budgetBars;

  function expenses(p, s) {
    const k = RR.kpis(p), list = RR.db.expenses.filter(e => RR.inPeriod(e.date, p)).sort((a, b) => b.amount - a.amount);
    const b = RR.budget(), over = b.filter(x => x.ratio > 1);
    const text = [`Spend ${RR.periodPhrase(p)} is **${inr(k.expenses)}** across ${list.length} ${list.length === 1 ? "entry" : "entries"}${vs(k.expenses, k.expensesPrev, p)}.`];
    if (/budget/.test(s)) text.push(over.length ? `Over budget (last 30 days): ${over.map(x => `**${x.category}** at ${pct(x.ratio)}`).join(', ')}.` : 'All categories are within budget over the last 30 days.');
    const blocks = [];
    if (wantsChart(s) || /budget/.test(s) && wantsTable(s)) blocks.push(blk('Budget vs actual', 'last 30 days · line = 100%', budgetBars(b)));
    if (wantsTable(s) && list.length) blocks.push(blk('Expenses', openLink('expenses', 'Open expenses'), RR.table(list.slice(0, 10), [
      { h: 'Expense', f: e => `${esc(e.desc)}<span class="sub">${esc(e.vendor)} · ${RR.dateShort(e.date)}</span>` }, { h: 'Category', f: e => esc(e.category) }, { h: 'Amount', f: e => inr(e.amount), num: 1 }], { compact: 1 }), { flush: 1 }));
    return { text, blocks };
  }

  function duplicates(s) {
    const d = RR.duplicates();
    if (!d.length) return { text: ['No duplicate charges. Checked every unpaid bill for the same patient, service and amount within 7 days.'] };
    const blocks = [];
    if (wantsTable(s)) blocks.push(blk('Possible duplicates', '', RR.table(d, [
      { h: 'Duplicate', f: x => esc(x.dup.id), cls: 'id' }, { h: 'Original', f: x => esc(x.original.id), cls: 'id' },
      { h: 'Patient', f: x => `${esc(x.dup.patient)}<span class="sub">${esc(x.dup.service)}</span>` }, { h: 'Amount', f: x => inr(x.dup.amount), num: 1 }], { compact: 1 }), { flush: 1 }));
    if (/void|remove|cancel|delete|fix/.test(s)) d.forEach(x => blocks.push(action({
      title: `Void ${x.dup.id}`, rows: [['Patient', x.dup.patient], ['Amount', inr(x.dup.amount)], ['Keeps', x.original.id]], confirm: 'Void duplicate', danger: true,
      run: () => { RR.db.invoices.find(v => v.id === x.dup.id).status = 'void'; return { text: `${x.dup.id} voided`, go: 'billing' }; },
    })));
    return { text: [`**${d.length}** likely duplicate charge${d.length > 1 ? 's' : ''} worth **${inr(d.reduce((a, x) => a + x.dup.amount, 0))}**: ${d.map(x => `${x.dup.id} repeats ${x.original.id} (${x.dup.patient})`).join('; ')}.`], blocks };
  }

  function payers(p, s) {
    const m = RR.payerMix(p), tot = m.reduce((a, x) => a + x.value, 0);
    if (!tot) return { text: [`Nothing has been collected ${RR.periodPhrase(p)} yet.`] };
    const self = (m.find(x => x.payer === 'Self-pay') || { value: 0 }).value, top = m.find(x => x.payer !== 'Self-pay');
    const blocks = wantsChart(s) || wantsTable(s) ? [blk('Collected by payer', RR.periodPhrase(p), RR.hbars(m.map(x => ({ label: x.payer, value: x.value }))))] : [];
    return { text: [`${cap(RR.periodPhrase(p))}, insurers and schemes paid **${pct(1 - self / tot)}** of ${inr(tot)} collected${top ? `; **${top.payer}** is the largest at ${inr(top.value)}` : ''}. Average time to pay is ${RR.avgDaysToPay()} days.`], blocks };
  }

  function payroll(s) {
    const tot = RR.payrollMonthly(), month = RR.todayISO.slice(0, 7), ran = RR.db.runs.find(r => r.month === month);
    const mname = RR.TODAY.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const blocks = [];
    if (/\brun|process|pay\b/.test(s) && !ran) blocks.push(action({
      title: 'Run payroll', rows: [['Month', mname], ['Staff', RR.db.staff.length + ''], ['Net disbursement', inr(tot * 0.78)]], confirm: 'Run payroll',
      run: () => { RR.db.runs.unshift({ month, date: RR.todayISO, total: tot, staff: RR.db.staff.length }); RR.db.staff.forEach(x => (x.status = 'processed')); return { text: 'Payroll processed for ' + RR.db.staff.length + ' staff', go: 'payroll' }; },
    }));
    return { text: [`Payroll is **${inr(tot)}** gross a month for ${RR.db.staff.length} staff (about ${inr(tot * 0.78)} net after TDS and PF). ${mname} ${ran ? `was run on ${RR.date(ran.date)}.` : 'has not been run yet.'}`], blocks };
  }

  function patientProfile(p, s) {
    const inv = RR.db.invoices.filter(i => i.patientId === p.id && i.status !== 'void').sort((a, b) => b.date.localeCompare(a.date));
    const bal = RR.patientBalance(p.id), paid = inv.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
    return {
      text: [`**${p.name}** (${p.sex}, ${p.age ?? '—'}) · ${p.mrn} · ${p.dept}. ${inv.length} bills, ${inr(paid)} paid${bal ? `, **${inr(bal)}** outstanding` : ', nothing outstanding'}. Last visit ${inv[0] ? RR.date(inv[0].date) : '—'}.`],
      blocks: wantsTable(s) ? [blk('Bills', openLink('patients', 'Open patients'), invoiceTable(inv.slice(0, 8), true), { flush: 1 })] : [],
    };
  }

  function invoiceDetail(i) {
    const blocks = [blk(i.id, RR.badge(i.status), `<dl class="act-rows"><dt>Patient</dt><dd>${esc(i.patient)}</dd><dt>Service</dt><dd>${esc(i.service)} · ${esc(i.dept)}</dd><dt>Billed</dt><dd>${RR.date(i.date)} · due ${RR.date(i.due)}</dd><dt>Amount</dt><dd>${inr(i.amount)}</dd><dt>Payer</dt><dd>${esc(i.payer)}${i.insurance ? ' · covers ' + inr(i.insurance) : ''}</dd>${i.paidOn ? `<dt>Paid</dt><dd>${RR.date(i.paidOn)} · ${esc(i.method)}</dd>` : ''}</dl>`)];
    return { text: [`${i.id} · ${i.patient} · ${inr(i.amount)}.`], blocks };
  }
  function markPaidAction(i) {
    return action({ title: `Record payment on ${i.id}`, rows: [['Patient', i.patient], ['Amount', inr(i.amount)], ['Method', i.insurance ? 'Insurance' : 'UPI']], confirm: 'Mark as paid',
      run: () => { const v = RR.db.invoices.find(x => x.id === i.id); Object.assign(v, { status: 'paid', paidOn: RR.todayISO, method: v.insurance ? 'Insurance' : 'UPI' }); return { text: `${i.id} marked paid`, go: 'billing' }; } });
  }

  function createInvoice(q) {
    const p = findPatient(q), amount = RR.parseAmount(q), service = RR.matchService(q) || 'Consultation';
    if (!p) return { text: ['Which patient? Use the full name, e.g. “Bill Priya Shah ₹12,000 for an MRI”.'] };
    if (!amount) return { text: [`How much should ${p.name} be billed?`] };
    const dept = RR.matchDept(q) || p.dept, due = RR.iso(RR.addDays(RR.TODAY, 15));
    return {
      text: [`Invoice for **${p.name}** is ready. It is saved only when you confirm.`],
      blocks: [action({ title: 'New invoice', rows: [['Patient', `${p.name} · ${p.mrn}`], ['Service', `${service} · ${dept}`], ['Amount', inr(amount)], ['Due', RR.date(due)]], confirm: 'Create invoice',
        run: () => { const id = RR.nextInvoiceId(); RR.db.invoices.push({ id, patientId: p.id, patient: p.name, dept, service, date: RR.todayISO, due, amount, insurance: 0, payer: 'Self-pay', status: 'pending', paidOn: null, method: null }); return { text: `${id} created`, go: 'billing' }; } })],
    };
  }

  function logExpense(q) {
    const amount = RR.parseAmount(q), category = RR.matchCategory(q) || 'Supplies', dept = RR.matchDept(q) || 'Emergency';
    if (!amount) return { text: ['What was the amount?'] };
    const raw = q.replace(/log|record|add|an?|expense|for|of|₹?\s*[\d,]+(\.\d+)?\s*(k|l|lakh|lakhs|cr)?\b|rs\.?|inr/gi, ' ').replace(/\s+/g, ' ').trim() || 'Expense';
    const d = cap(raw);
    return {
      text: [`Logging **${inr(amount)}** as ${category} for ${dept}. It stays pending until approved.`],
      blocks: [action({ title: 'Log expense', rows: [['Description', d], ['Category', category], ['Department', dept], ['Amount', inr(amount)]], confirm: 'Log expense',
        run: () => { const id = RR.nextId(RR.db.expenses, 'EXP-', 5000); RR.db.expenses.unshift({ id, desc: d, category, dept, vendor: '—', amount, date: RR.todayISO, status: 'pending' }); return { text: `${id} logged`, go: 'expenses' }; } })],
    };
  }

  function digitise(s) {
    const pending = RR.db.paper.filter(p => p.status === 'pending'), dg = RR.digitisation();
    if (!pending.length) return { text: [`All ${dg.total} register lines are digitised.`] };
    const parsed = pending.map(p => ({ p, f: RR.parsePaper(p.text) })), clean = parsed.filter(x => !x.f.missing.length);
    const blocks = [];
    if (wantsTable(s)) blocks.push(blk('Read from paper', openLink('records', 'Open records'), RR.table(parsed, [
      { h: 'Register', f: x => `${esc(x.p.source)}<span class="sub">${esc(x.p.text.slice(0, 54))}${x.p.text.length > 54 ? '…' : ''}</span>` },
      { h: 'Read as', f: x => `${esc(x.f.name || '?')}<span class="sub">${esc(x.f.service || '?')} · ${x.f.amount ? inr(x.f.amount) : '?'}</span>` },
      { h: 'Fields', f: x => `<span class="${x.f.missing.length ? 'neg' : ''}">${x.f.confidence}%</span>`, num: 1 }], { compact: 1 }), { flush: 1 }));
    if (/digiti|convert|import|move|migrate|enter/.test(s) && clean.length) blocks.push(action({ title: `Digitise ${clean.length} complete records`, rows: [['Creates', `${clean.length} patients + ${clean.length} invoices`], ['Total value', inr(clean.reduce((a, x) => a + x.f.amount, 0))], ['Held for review', (pending.length - clean.length) + ' records']], confirm: `Digitise ${clean.length}`,
      run: () => { clean.forEach(x => RR.commitPaper(x.p.id)); return { text: `${clean.length} records digitised`, go: 'records' }; } }));
    return { text: [`**${pending.length}** paper register lines are waiting. ${clean.length} read cleanly; ${pending.length - clean.length} have gaps and need someone to check the original page.`], blocks };
  }

  function help() {
    return { text: ['Ask the way you’d ask a colleague: “How much did we bill today?”, “Who still owes us?”, “What’s Priya Shah’s balance?” or “Bill Priya Shah ₹12,000 for an MRI.”', 'Answers come back as text. Say “show the chart” or “list them” when you want to see the numbers laid out.'] };
  }

  /* ---------- claims, closing, Tally ---------- */
  function claims(s) {
    const c = RR.claims(), out = { text: [`**${inr(c.stuckValue)}** is stuck with TPAs for over 30 days, across ${c.stuck.length} claims. In all, ${inr(c.openValue)} is open with insurers on ${c.open.length} claims${c.queried.length ? `, and ${c.queried.length} are queried and waiting on us` : ''}.`] };
    const slow = c.payers.slice().sort((a, b) => b.avgDays - a.avgDays)[0];
    if (slow) out.text.push(`${slow.payer} is the slowest, ${slow.avgDays} days on average. Deductions on short-paid claims have cost ${inr(c.shortValue)}.`);
    out.blocks = [];
    if (wantsChart(s)) out.blocks.push(blk('Open claims by insurer', 'Amount waiting', RR.hbars(c.payers.map(p => ({ label: p.payer, sub: p.avgDays + ' days avg', value: p.open })))));
    if (wantsTable(s)) out.blocks.push(blk('Stuck over 30 days', c.stuck.length + ' claims', RR.table(c.stuck.slice().sort((a, b) => b.amount - a.amount).slice(0, 10), [{ h: 'Claim', f: x => `${esc(x.id)}<span class="sub">${esc(x.patient)}</span>` }, { h: 'Insurer', f: x => esc(x.payer) }, { h: 'Days', num: 1, f: x => RR.claimAge(x) }, { h: 'Amount', num: 1, f: x => inr(x.amount) }], { compact: 1 }), { flush: 1 }));
    out.blocks.push({ html: openLink('claims', 'Open claims') });
    return out;
  }
  function closing(s) {
    const c = RR.closing(), r = c.rec;
    const t = [`Today the desk took **${inr(c.desk)}**: cash ${inr(c.ledger.cash)}, UPI ${inr(c.ledger.upi)}, card ${inr(c.ledger.card)}, against ${inr(c.billed)} billed. ${inr(c.dueFromPatients)} is still owed by patients and ${inr(c.withInsurers)} goes to insurers.`];
    t.push(r ? (c.diff ? `The day was closed **${c.diff > 0 ? 'over' : 'short'} by ${inr(Math.abs(c.diff))}**.` : 'The day is closed and everything matched.') : 'The day hasn’t been closed yet.');
    const miss = RR.recentClosings(8).slice(1).filter(x => x.rec && x.diff);
    if (miss.length) t.push(`In the last week the drawer didn’t match on ${miss.length === 1 ? RR.date(miss[0].day) : miss.length + ' days'}${miss.length === 1 ? ` (${miss[0].diff > 0 ? 'over' : 'short'} ${inr(Math.abs(miss[0].diff))})` : ''}.`);
    return { text: t, blocks: [{ html: openLink('closing', 'Open daily closing') }] };
  }
  function tally(p) {
    const e = RR.tallyExport(p);
    return { text: [`For ${RR.periodPhrase(p)} that’s ${e.sales} sales vouchers and ${e.receipts} receipts, ${inr(e.total)} billed, as a file TallyPrime imports directly.`], blocks: [{ html: `<div><button class="btn btn-outline btn-sm" data-tally-dl="${p}">${icon('download')}Download for Tally</button></div>` }] };
  }

  /* ---------- router ----------
     ctx remembers the last topic + period, so follow-ups like
     "pull up the chart", "and this week?" or "list them" continue it. */
  const ctx = (RR.chatCtx = { topic: null, period: null });
  const FOLLOW = /^(and |what about |how about |now |ok |also )?(pull (it |that |them )?up|show (it|that|them|me)|chart( it)?|graph( it)?|plot it|as a (chart|graph|table|list)|list (them|those|it)|the (chart|graph|list|table)|break ?down|details|more|(for |in )?(today|this week|this month|this year|the week|the month|the year|week|month|year))\b/;
  function route(q) {
    const s = q.toLowerCase().trim(), named = RR.periodFrom(s);
    const follow = ctx.topic && FOLLOW.test(s) && s.split(/\s+/).length <= 8 && !(named && !ctx.periodic);
    const p = named || (follow && ctx.period) || RR.period;
    if (follow) { ctx.period = p; return ctx.topic(p, s); }
    const out = dispatch(q, s, p, named);
    return out;
  }
  const remember = (fn, p) => (ctx.topic = fn, ctx.period = p, ctx.periodic = [overview, billing, deptPL, payers, expenses].includes(fn) || fn.periodic);
  function dispatch(q, s, p, named) {
    if (/^(help|hi|hello|hey|what can you|how do i)/.test(s)) { ctx.topic = null; return help(); }
    const inv = findInvoice(q);
    if (inv) {
      if (inv.missing) return { text: [`There is no **${inv.missing}** in the ledger.`] };
      if (/\b(paid|settle|received|collect|mark)/.test(s) && (inv.status === 'pending' || inv.status === 'overdue')) return { text: [`Recording a payment on **${inv.id}** for ${inv.patient}.`], blocks: [markPaidAction(inv)] };
      return invoiceDetail(inv);
    }
    if (/^(bill|charge|raise|invoice)\b.*(₹|rs|\d)/.test(s) || /\b(bill|charge)\b [a-z]+ [a-z]+ .*(₹|rs\.?\s?\d|\d)/.test(s) && !/\bbills?\b (today|this)/.test(s)) return createInvoice(q);
    if (/^(log|record|add)\b.*(expense|spend|purchase|restock|₹|\d)/.test(s)) return logExpense(q);
    if (/payroll|salar|staff cost/.test(s)) return payroll(s);
    if (/\btally\b|accountant|\bxml\b|export (to|for) (the )?account/.test(s)) return tally(p);
    if (/\bclaims?\b|\btpa\b|stuck|short.?paid|quer(y|ied)|settle/.test(s)) { remember((pp, ss) => claims(ss), p); return claims(s); }
    if (/clos(e|ing)|drawer|cash ?(in|at) (the )?(hand|desk|counter)|reconcil|tally up|match(es|ed)? the|counter/.test(s)) { remember((pp, ss) => closing(ss), p); return closing(s); }
    if (/\b(photo|picture|camera|scan) (a |the |of )?(page|register)|scan a page/.test(s)) return { text: ['Open **Scan a page**, take a photo of the register and each line comes back as a draft bill to check and approve.'], blocks: [{ html: openLink('scan', 'Scan a page') }] };
    if (/digiti|paper|register|scan|handwritten/.test(s)) return digitise(s);
    if (/duplicate|double.?(bill|charg)/.test(s)) { remember((pp, ss) => duplicates(ss), p); return duplicates(s); }
    if (/denial|risk|reject/.test(s)) { remember((pp, ss) => risk(ss), p); return risk(s); }
    if (/forecast|predict|next month|projection|project\b/.test(s)) { remember((pp, ss) => forecast(ss), p); return forecast(s); }
    if (/overdue|owed|outstanding|receivable|aging|ageing|unpaid|remind|chase/.test(s)) { remember((pp, ss) => overdue(q, ss), p); return overdue(q, s); }
    if (/budget|spend|expense|pharmac|vendor|purchase|cost/.test(s) && !/overview|summar/.test(s)) { remember(expenses, p); return expenses(p, s); }
    if (/payer|\bpays?\b|paid by|how fast|insur|upi|method|tpa|pm-?jay|cghs|days to pay|collection/.test(s)) { remember(payers, p); return payers(p, s); }
    if (/losing|profit|margin|p&l|loss|departments\b|by department/.test(s)) { remember(deptPL, p); return deptPL(p, s); }
    const pt = findPatient(q);
    if (pt) { remember((pp, ss) => patientProfile(pt, ss), p); return patientProfile(pt, s); }
    const d = findDept(q);
    if (d) { const f = (pp, ss) => deptDetail(d, pp, ss); f.periodic = true; remember(f, p); return deptDetail(d, p, s); }
    if (/\bbill(s|ing|ed)?\b|invoice|revenue|sales|income/.test(s)) { remember(billing, p); return billing(p, s); }
    if (/overview|summar|how are we|how did we|doing|brief|status|cash|numbers|report|dashboard/.test(s) || named) { remember(overview, p); return overview(p, s); }
    if (wantsChart(s)) { remember(overview, p); return overview(p, s); }
    return { text: ['I couldn’t match that to the ledger. Try “billing today”, “overview this month”, a patient name or an invoice number.'] };
  }
  RR.route = route;
})();
