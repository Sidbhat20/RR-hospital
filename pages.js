/* RR Hospitals — workspace pages. Money pages follow the period chosen in the top bar. */
(function () {
  const RR = window.RR;
  const { icon, esc, inr, inrShort, pct, badge } = RR;
  const S = (RR.pageState = { billFilter: 'all', billQuery: '', billLimit: 40, recFilter: 'pending' });
  const head = (title, sub, actions) => `<div class="head"><div><h1>${esc(title)}</h1><p>${sub}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
  const card = (title, sub, body, opt = {}) => `<section class="card${opt.flush ? ' flush' : ''}"><div class="card-h"><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${opt.right || ''}</div>${body}</section>`;
  const P = (RR.pages = {});

  const per = () => RR.period;
  const span = () => { const r = RR.range(); return r.from === r.to ? RR.date(r.to) : `${RR.date(r.from)} – ${RR.date(r.to)}`; };
  const vsLabel = () => ({ today: 'vs yesterday', week: 'vs last week', month: 'vs last month' })[per()];
  const deltaK = (label, cur, prev, goodUp, extra = {}) => {
    const k = Object.assign({ label, value: inrShort(cur), count: cur, neg: cur < 0 }, extra);
    if (prev != null && prev !== 0 && prev !== cur && vsLabel()) { const d = RR.delta(cur, prev); Object.assign(k, { delta: d, good: goodUp ? d >= 0 : d <= 0, vs: vsLabel() }); }
    return k;
  };
  const chartTitle = () => ({ today: 'Last 7 days', week: 'Last 7 days', month: 'This month, by day', year: 'This financial year, by month' })[per()];
  const billsChart = () => RR.barChart(RR.series(), [{ name: 'Billed', key: 'billed', tone: 'light' }, { name: 'Collected', key: 'collected', tone: 'ink' }], { label: 'Billed and collected' });

  /* ---------- Overview ---------- */
  P.overview = () => {
    const k = RR.kpis(), dg = RR.digitisation(), recent = RR.bills().slice(0, 8);
    return `<div class="page">${head('Overview', `${RR.PERIODS[per()]} · ${span()}`)}
      ${RR.kpiStrip([deltaK('Billed', k.billed, k.billedPrev, true, { note: k.bills + ' bills' }), deltaK('Collected', k.collected, k.collectedPrev, true),
        deltaK('Costs', k.cost, k.costPrev, false), deltaK('Net', k.net, null, true)])}
      <div class="grid g-21">
        ${card('Billed vs collected', chartTitle(), billsChart())}
        ${card('Owed to the hospital', 'All open bills', `<div class="stat-line"><b>${inr(k.outstanding)}</b><span class="muted">${k.unpaidCount} bills</span></div>
          <dl class="kv"><dt>Overdue</dt><dd class="${k.overdue ? 'neg' : ''}">${inr(k.overdue)}</dd><dt>Overdue bills</dt><dd>${k.overdueCount}</dd><dt>Avg days to pay</dt><dd>${RR.avgDaysToPay()}</dd><dt>Paper lines left</dt><dd>${dg.pending}</dd></dl>`)}
      </div>
      <div class="grid g-21">
        ${card('Latest bills', RR.PERIODS[per()], RR.table(recent, [
          { h: 'Invoice', f: i => esc(i.id), cls: 'id' }, { h: 'Patient', f: i => `${esc(i.patient)}<span class="sub">${esc(i.service)}</span>`, cls: 'strong' },
          { h: 'Status', f: i => badge(i.status) }, { h: 'Amount', f: i => inr(i.amount), num: 1 }], { compact: 1, empty: 'No bills in this period', emptySub: 'Bills raised today will appear here.' }), { flush: 1, right: `<button class="btn btn-ghost btn-sm" data-nav="billing">All bills</button>` })}
        ${card('Net by department', RR.PERIODS[per()], RR.hbars(RR.deptPL(per()).map(r => ({ label: r.dept, value: r.net }))))}
      </div></div>`;
  };

  /* ---------- Billing ---------- */
  function billRows() {
    const q = S.billQuery.toLowerCase().trim();
    return RR.db.invoices.filter(i => RR.inPeriod(i.date) && (S.billFilter === 'all' ? i.status !== 'void' : i.status === S.billFilter) &&
      (!q || i.id.toLowerCase().includes(q) || i.patient.toLowerCase().includes(q) || i.dept.toLowerCase().includes(q) || i.payer.toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }
  P.billingTable = () => {
    const rows = billRows(), shown = rows.slice(0, S.billLimit), total = rows.reduce((s, i) => s + i.amount, 0);
    return RR.table(shown, [
      { h: 'Invoice', f: i => esc(i.id) + `<span class="sub">${RR.dateShort(i.date)}</span>`, cls: 'id' },
      { h: 'Patient', f: i => `${esc(i.patient)}<span class="sub">${esc(i.service)} · ${esc(i.dept)}</span>`, cls: 'strong' },
      { h: 'Payer', f: i => esc(i.payer) + (i.insurance ? `<span class="sub">covers ${inrShort(i.insurance)}</span>` : '') },
      { h: 'Due', f: i => RR.dateShort(i.due) + (i.remindedOn ? '<span class="sub">reminded</span>' : '') },
      { h: 'Status', f: i => badge(i.status) }, { h: 'Amount', f: i => inr(i.amount), num: 1 },
      { h: '', cls: 'row-act', f: i => `${i.status === 'pending' || i.status === 'overdue' || i.status === 'draft' ? `<button class="icon-btn" data-paid="${i.id}" title="Mark paid" aria-label="Mark ${i.id} paid">${icon('check')}</button>` : ''}<button class="icon-btn" data-edit-inv="${i.id}" title="Edit" aria-label="Edit ${i.id}">${icon('edit')}</button>${i.status !== 'paid' && i.status !== 'void' ? `<button class="icon-btn danger" data-void="${i.id}" title="Void" aria-label="Void ${i.id}">${icon('trash')}</button>` : ''}` },
    ], { empty: S.billFilter !== 'all' || S.billQuery ? 'No bills match these filters' : `No bills ${RR.periodPhrase()}`, art: S.billFilter === 'overdue' && !S.billQuery ? 'calendar' : 'ledger', emptySub: S.billFilter === 'overdue' && !S.billQuery ? 'Nothing is past its due date.' : S.billQuery ? 'Try a different name or invoice number.' : '' }) + `<div class="foot-row"><span>${rows.length} bills · ${inr(total)}</span>${rows.length > shown.length ? '<button class="btn btn-ghost btn-sm" data-act="more-bills">Show more</button>' : ''}</div>`;
  };
  P.billing = () => {
    const k = RR.kpis(), all = RR.db.invoices.filter(i => i.status !== 'void' && RR.inPeriod(i.date));
    const cnt = s => (s === 'all' ? all.length : all.filter(i => i.status === s).length);
    return `<div class="page">${head('Billing', `${RR.PERIODS[per()]} · ${span()}`, `<button class="btn btn-outline" data-act="export">${icon('download')}Export</button><button class="btn btn-outline" data-act="tally">${icon('tally')}Send to Tally</button><button class="btn btn-primary" data-act="new-invoice">${icon('plus')}New invoice</button>`)}
      ${RR.kpiStrip([deltaK('Billed', k.billed, k.billedPrev, true, { note: k.bills + ' bills · ' + k.patients + ' patients' }), deltaK('Collected', k.collected, k.collectedPrev, true),
        { label: 'Realisation', value: pct(k.collectRate), note: 'collected ÷ billed' }, { label: 'Overdue, all time', value: inrShort(k.overdue), count: k.overdue, neg: k.overdue > 0, note: k.overdueCount + ' bills' }])}
      <section class="card flush"><div class="toolbar">
        <div class="search">${icon('search')}<input class="input" id="bill-q" type="search" placeholder="Search patient, invoice, payer" value="${esc(S.billQuery)}" aria-label="Search bills"></div>
        <div class="seg" role="group" aria-label="Filter by status">${['all', 'pending', 'overdue', 'paid', 'draft'].map(s => `<button data-bill-filter="${s}" aria-pressed="${S.billFilter === s}">${s[0].toUpperCase() + s.slice(1)}<span class="n">${cnt(s)}</span></button>`).join('')}</div>
      </div><div id="bill-table">${P.billingTable()}</div></section></div>`;
  };

  /* ---------- Payments ---------- */
  P.payments = () => {
    const mix = RR.payerMix(per()), paid = RR.db.invoices.filter(i => i.status === 'paid' && RR.inPeriod(i.paidOn)).sort((a, b) => b.paidOn.localeCompare(a.paidOn));
    const tot = mix.reduce((s, x) => s + x.value, 0), self = (mix.find(x => x.payer === 'Self-pay') || { value: 0 }).value;
    return `<div class="page">${head('Payments', `${RR.PERIODS[per()]} · ${span()}`)}
      ${RR.kpiStrip([{ label: 'Received', value: inrShort(tot), count: tot, note: paid.length + ' payments' }, { label: 'From insurers & schemes', value: tot ? pct(1 - self / tot) : '—' }, { label: 'Avg days to pay', value: RR.avgDaysToPay() + ' days', note: 'last 90 days' }])}
      <div class="grid g-21">${card('Receipts', RR.PERIODS[per()], RR.table(paid.slice(0, 30), [
        { h: 'Invoice', f: i => esc(i.id), cls: 'id' }, { h: 'Patient', f: i => `${esc(i.patient)}<span class="sub">${esc(i.service)}</span>`, cls: 'strong' },
        { h: 'Method', f: i => `<span class="badge badge-outline">${esc(i.method)}</span>` }, { h: 'Posted', f: i => RR.dateShort(i.paidOn) }, { h: 'Amount', f: i => inr(i.amount), num: 1 }], { empty: 'No payments in this period', art: 'coins' }), { flush: 1 })}
      ${card('By payer', RR.PERIODS[per()], mix.length ? RR.hbars(mix.map(x => ({ label: x.payer, value: x.value }))) : RR.emptyState('Nothing collected yet', ''))}</div></div>`;
  };

  /* ---------- Expenses ---------- */
  P.expenses = () => {
    const b = RR.budget(), list = RR.db.expenses.filter(e => RR.inPeriod(e.date)), k = RR.kpis();
    return `<div class="page">${head('Expenses', `${RR.PERIODS[per()]} · ${span()}`, `<button class="btn btn-primary" data-act="new-expense">${icon('plus')}Log expense</button>`)}
      ${RR.kpiStrip([deltaK('Spent', k.expenses, k.expensesPrev, false, { note: list.length + ' entries' }), { label: 'Pending approval', value: list.filter(e => e.status === 'pending').length + '' }, { label: 'Payroll share', value: inrShort(k.payroll), count: k.payroll, note: 'pro-rated' }])}
      <div class="grid g-21">${card('Ledger', RR.PERIODS[per()], RR.table(list, [
        { h: 'Expense', f: e => `${esc(e.desc)}<span class="sub">${esc(e.vendor)} · ${esc(e.id)}</span>`, cls: 'strong' }, { h: 'Category', f: e => `${esc(e.category)}<span class="sub">${esc(e.dept)}</span>` },
        { h: 'Date', f: e => RR.dateShort(e.date) }, { h: 'Status', f: e => badge(e.status) }, { h: 'Amount', f: e => inr(e.amount), num: 1 },
        { h: '', cls: 'row-act', f: e => `${e.status === 'pending' ? `<button class="icon-btn" data-approve="${e.id}" title="Approve" aria-label="Approve ${e.id}">${icon('check')}</button>` : ''}<button class="icon-btn danger" data-del-exp="${e.id}" title="Delete" aria-label="Delete ${e.id}">${icon('trash')}</button>` }], { empty: 'No expenses in this period', art: 'ledger' }), { flush: 1 })}
      ${card('Budget vs actual', 'Last 30 days · line marks 100%', RR.budgetBars(b))}</div></div>`;
  };

  /* ---------- Payroll ---------- */
  P.payroll = () => {
    const tot = RR.payrollMonthly(), month = RR.todayISO.slice(0, 7), ran = RR.db.runs.find(r => r.month === month);
    const mname = RR.TODAY.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return `<div class="page">${head('Payroll', `${RR.db.staff.length} staff · ${mname} ${ran ? 'paid on ' + RR.date(ran.date) : 'not yet run'}`, ran ? '' : `<button class="btn btn-primary" data-act="run-payroll">${icon('play')}Run ${RR.TODAY.toLocaleDateString('en-IN', { month: 'long' })} payroll</button>`)}
      ${RR.kpiStrip([{ label: 'Gross, monthly', value: inrShort(tot), count: tot }, { label: 'TDS + PF (est. 22%)', value: inrShort(tot * 0.22), count: tot * 0.22 }, { label: 'Net to staff', value: inrShort(tot * 0.78), count: tot * 0.78 }])}
      <div class="grid g-21">${card('Staff', 'Monthly gross', RR.table(RR.db.staff, [
        { h: 'Name', f: s => `${esc(s.name)}<span class="sub">${esc(s.role)}</span>`, cls: 'strong' }, { h: 'Department', f: s => esc(s.dept) },
        { h: 'This month', f: () => badge(ran ? 'processed' : 'scheduled') }, { h: 'Gross', f: s => inr(s.gross), num: 1 }, { h: 'Net', f: s => inr(s.gross * 0.78), num: 1 }]), { flush: 1 })}
      ${card('Past runs', '', RR.table(RR.db.runs.slice(0, 8), [{ h: 'Month', f: r => RR.parse(r.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }, { h: 'Staff', f: r => r.staff, num: 1 }, { h: 'Gross', f: r => inr(r.total), num: 1 }], { compact: 1 }), { flush: 1 })}</div></div>`;
  };

  /* ---------- Patients ---------- */
  P.patients = () => {
    const list = RR.db.patients.map(p => ({ ...p, bal: RR.patientBalance(p.id), n: RR.db.invoices.filter(i => i.patientId === p.id && i.status !== 'void').length })).sort((a, b) => b.bal - a.bal || a.name.localeCompare(b.name));
    const migrated = list.filter(p => p.source === 'paper').length;
    return `<div class="page">${head('Patients', `${list.length} records${migrated ? ' · ' + migrated + ' from paper' : ''}`, `<button class="btn btn-primary" data-act="new-patient">${icon('plus')}Add patient</button>`)}
      ${card('Patient records', 'Sorted by balance owed', RR.table(list, [
        { h: 'Patient', f: p => `${esc(p.name)}<span class="sub">${esc(p.mrn)}</span>`, cls: 'strong' }, { h: 'Age / sex', f: p => (p.age ?? '—') + ' · ' + esc(p.sex || '—') },
        { h: 'Department', f: p => esc(p.dept) }, { h: 'Source', f: p => (p.source === 'paper' ? 'Paper' : 'Digital') },
        { h: 'Bills', f: p => p.n, num: 1 }, { h: 'Owed', f: p => (p.bal ? inr(p.bal) : '<span class="muted">—</span>'), num: 1 },
        { h: '', cls: 'row-act', f: p => `<button class="icon-btn" data-bill-patient="${p.id}" title="New invoice" aria-label="Bill ${esc(p.name)}">${icon('receipt')}</button>` }]), { flush: 1 })}</div>`;
  };

  /* ---------- Departments ---------- */
  P.departments = () => {
    const rows = RR.deptPL(per());
    return `<div class="page">${head('Departments', `Profit and loss · ${RR.PERIODS[per()]} · ${span()}`)}
      <div class="grid g-11">${card('Net by department', 'Collected − (payroll + spend)', RR.hbars(rows.map(r => ({ label: r.dept, value: r.net }))))}
      ${card('Profit & loss', '', RR.table(rows, [{ h: 'Department', f: r => esc(r.dept), cls: 'strong' }, { h: 'Collected', f: r => inr(r.revenue), num: 1 }, { h: 'Payroll', f: r => inr(r.payroll), num: 1 },
        { h: 'Spend', f: r => inr(r.spend), num: 1 }, { h: 'Net', f: r => `<span class="${r.net < 0 ? 'neg' : 'strong'}">${inr(r.net)}</span>`, num: 1 }], { compact: 1 }), { flush: 1 })}</div></div>`;
  };

  /* ---------- Records (paper → digital) ---------- */
  P.records = () => {
    const dg = RR.digitisation();
    const list = RR.db.paper.filter(p => S.recFilter === 'all' || p.status === S.recFilter);
    const clean = RR.db.paper.filter(p => p.status === 'pending' && !RR.parsePaper(p.text).missing.length).length;
    return `<div class="page">${head('Paper records', 'Lines transcribed from the old ward ledgers and OPD registers.', `${clean ? `<button class="btn btn-primary" data-act="digitise-clean">${icon('scan')}Digitise ${clean} complete</button>` : ''}<button class="btn btn-outline" data-act="new-paper">${icon('plus')}Add line</button>`)}
      ${RR.kpiStrip([{ label: 'Digitised', value: dg.done + ' / ' + dg.total, note: pct(dg.ratio) + ' complete' }, { label: 'Waiting', value: dg.pending + '' }, { label: 'Patients from paper', value: RR.db.patients.filter(p => p.source === 'paper').length + '' }])}
      <section class="card flush"><div class="toolbar"><div class="seg" role="group" aria-label="Filter records">${['pending', 'digitised', 'all'].map(s => `<button data-rec-filter="${s}" aria-pressed="${S.recFilter === s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div></div>
      ${RR.table(list, [{ h: 'Register', f: p => `${esc(p.source)}<span class="sub">${esc(p.id)}</span>` }, { h: 'Original line', f: p => `<div class="paper-line">${esc(p.text)}</div>` },
        { h: 'Read as', f: p => { const f = RR.parsePaper(p.text); return `<div class="fields">${[['name', f.name], ['age', f.age], ['date', f.date && RR.dateShort(f.date)], ['service', f.service], ['amount', f.amount && inr(f.amount)]].map(x => `<span class="field-chip${x[1] == null ? ' miss' : ''}">${x[1] == null ? 'no ' + x[0] : esc(x[1])}</span>`).join('')}</div>`; } },
        { h: 'Status', f: p => (p.status === 'digitised' ? badge('digitised') + `<span class="sub">${esc(p.invoiceId)}</span>` : RR.parsePaper(p.text).missing.length ? badge('review') : badge('pending')) },
        { h: '', cls: 'row-act', f: p => (p.status === 'pending' ? `<button class="btn btn-ghost btn-sm" data-review="${p.id}">Review</button>` : '') }], { empty: S.recFilter === 'pending' ? 'Every register line is digitised' : 'No records', art: S.recFilter === 'pending' ? 'folder' : '', emptySub: S.recFilter === 'pending' ? 'The paper registers are fully in the ledger.' : '' })}</section></div>`;
  };

  /* ---------- Ask (chat) page shell ---------- */
  P.copilot = () => `<div class="page" style="height:100%;animation:none" id="copilot-page"></div>`;
})();
