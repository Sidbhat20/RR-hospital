/* ============================================================
   RR Hospitals — claims, daily closing, Tally export.
   All figures computed from the ledger in data.js.
   ============================================================ */
(function () {
  const RR = window.RR;
  const T = () => RR.CONFIG.tally;
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

  /* ---------- insurance claims ---------- */
  const CLAIM_LABEL = { pending: 'With TPA', queried: 'Queried', settled: 'Settled', short: 'Short-paid' };
  RR.CLAIM_LABEL = CLAIM_LABEL;
  RR.claimAge = c => RR.daysBetween(c.submitted, c.settledOn || RR.todayISO);
  RR.claims = function () {
    const all = (RR.db.claims || []).filter(c => c.status !== 'void');
    const open = all.filter(c => c.status === 'pending' || c.status === 'queried');
    const stuck = open.filter(c => RR.claimAge(c) > 30);
    const short = all.filter(c => c.status === 'short');
    const byPayer = {};
    open.forEach(c => { const p = (byPayer[c.payer] = byPayer[c.payer] || { payer: c.payer, open: 0, stuck: 0, count: 0, days: 0 }); p.open += c.amount; p.count++; p.days += RR.claimAge(c); if (RR.claimAge(c) > 30) p.stuck += c.amount; });
    const payers = Object.values(byPayer).map(p => ({ ...p, avgDays: Math.round(p.days / p.count) })).sort((a, b) => b.open - a.open);
    const buckets = [['0–15 days', 0, 15], ['16–30 days', 16, 30], ['31–60 days', 31, 60], ['60+ days', 61, 1e9]].map(([label, a, b]) => {
      const l = open.filter(c => RR.claimAge(c) >= a && RR.claimAge(c) <= b);
      return { label, count: l.length, value: sum(l, c => c.amount) };
    });
    return {
      all, open, stuck, short, payers, buckets,
      openValue: sum(open, c => c.amount), stuckValue: sum(stuck, c => c.amount),
      queried: open.filter(c => c.status === 'queried'),
      shortValue: sum(short, c => c.amount - c.settled),
      settledValue: sum(all.filter(c => c.status === 'settled' || c.status === 'short'), c => c.settled),
    };
  };
  RR.settleClaim = function (id, amount, note) {
    const c = RR.db.claims.find(x => x.id === id); if (!c) return;
    const inv = RR.db.invoices.find(i => i.id === c.invoiceId);
    c.settled = amount; c.settledOn = RR.todayISO; c.status = amount < c.amount ? 'short' : 'settled'; c.note = amount < c.amount ? (note || 'Deduction by TPA') : '';
    if (inv && inv.status !== 'paid') Object.assign(inv, { status: 'paid', paidOn: RR.todayISO, method: 'Insurance' });
  };

  /* ---------- daily closing ---------- */
  const METHODS = [['cash', 'Cash', 'Cash'], ['upi', 'UPI', 'UPI'], ['card', 'Card', 'Card']];
  RR.CLOSE_METHODS = METHODS;
  RR.closing = function (day) {
    day = day || RR.todayISO;
    const inv = RR.db.invoices.filter(i => i.status !== 'void');
    const billedL = inv.filter(i => i.status !== 'draft' && i.date === day);
    const paidL = inv.filter(i => i.status === 'paid' && i.paidOn === day);
    const ledger = {};
    METHODS.forEach(([k, , m]) => (ledger[k] = sum(paidL.filter(i => i.method === m), i => i.amount)));
    const other = sum(paidL.filter(i => !['Cash', 'UPI', 'Card'].includes(i.method)), i => i.amount);
    const rec = (RR.db.closings || {})[day] || null;
    const counted = {};
    METHODS.forEach(([k]) => (counted[k] = rec ? ledger[k] + (rec.diff[k] || 0) : null));
    const diff = rec ? sum(METHODS, ([k]) => rec.diff[k] || 0) : 0;
    const billed = sum(billedL, i => i.amount);
    const desk = sum(METHODS, ([k]) => ledger[k]);
    const insured = sum(billedL, i => i.insurance);
    const unpaidToday = billedL.filter(i => i.status !== 'paid');
    return {
      day, rec, ledger, counted, other, billed, desk, insured, diff, bills: billedL.length, payments: paidL.length,
      dueFromPatients: sum(unpaidToday, i => i.amount - i.insurance), withInsurers: sum(unpaidToday, i => i.insurance),
      unpaidToday, paidL,
    };
  };
  RR.closeDay = function (day, counted, by) {
    const c = RR.closing(day), diff = {};
    METHODS.forEach(([k]) => (diff[k] = Math.round((counted[k] || 0) - c.ledger[k])));
    RR.db.closings = RR.db.closings || {};
    const now = new Date();
    RR.db.closings[day] = { closed: true, by: by || 'Front desk', at: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), diff };
  };
  RR.recentClosings = function (n = 7) {
    const out = [];
    for (let k = 0; k < n; k++) out.push(RR.closing(RR.iso(RR.addDays(RR.TODAY, -k))));
    return out;
  };

  /* ---------- Tally export (TallyPrime / ERP 9 XML import) ---------- */
  const x = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tdate = d => d.replace(/-/g, '');
  const amt = n => (Math.round(n * 100) / 100).toFixed(2);
  const entry = (ledger, dr, value) => `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${x(ledger)}</LEDGERNAME><ISDEEMEDPOSITIVE>${dr ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE><AMOUNT>${dr ? '-' : ''}${amt(value)}</AMOUNT></ALLLEDGERENTRIES.LIST>`;
  const voucher = (type, no, date, party, narration, lines) => `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${type}" ACTION="Create" OBJVIEW="Accounting Voucher View"><DATE>${tdate(date)}</DATE><VOUCHERTYPENAME>${type}</VOUCHERTYPENAME><VOUCHERNUMBER>${x(no)}</VOUCHERNUMBER><PARTYLEDGERNAME>${x(party)}</PARTYLEDGERNAME><NARRATION>${x(narration)}</NARRATION><PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>${lines.join('')}</VOUCHER></TALLYMESSAGE>`;
  const master = (name, parent) => `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${x(name)}" ACTION="Create"><NAME.LIST><NAME>${x(name)}</NAME></NAME.LIST><PARENT>${x(parent)}</PARENT><ISBILLWISEON>${parent === 'Sundry Debtors' ? 'Yes' : 'No'}</ISBILLWISEON></LEDGER></TALLYMESSAGE>`;
  const bankFor = m => (m === 'Cash' ? T().cash : m === 'UPI' ? T().upi : m === 'Card' ? T().card : T().bank);

  RR.tallyExport = function (p) {
    const r = RR.range(p), t = T();
    const inv = RR.db.invoices.filter(i => i.status !== 'void' && i.status !== 'draft');
    const sales = inv.filter(i => i.date >= r.from && i.date <= r.to);
    const receipts = inv.filter(i => i.status === 'paid' && i.paidOn >= r.from && i.paidOn <= r.to);
    const claimOf = new Map((RR.db.claims || []).map(c => [c.invoiceId, c]));
    const ledgers = new Map();
    const use = (name, parent) => (ledgers.set(name, parent), name);
    const v = [];

    sales.forEach(i => {
      const self = i.amount - i.insurance, lines = [];
      if (i.insurance) lines.push(entry(use(t.insurer(i.payer), 'Sundry Debtors'), true, i.insurance));
      if (self) lines.push(entry(use(t.selfPay, 'Sundry Debtors'), true, self));
      lines.push(entry(use(t.income(i.dept), 'Sales Accounts'), false, i.amount));
      v.push(voucher('Sales', i.id, i.date, i.insurance ? t.insurer(i.payer) : t.selfPay, `${i.patient} · ${i.service} · ${i.dept}`, lines));
    });
    receipts.forEach(i => {
      const self = i.amount - i.insurance;
      if (self > 0) {
        const m = i.method === 'Insurance' || i.method === 'NEFT' ? (i.method === 'NEFT' ? 'NEFT' : 'UPI') : i.method;
        v.push(voucher('Receipt', 'R-' + i.id, i.paidOn, t.selfPay, `${i.patient} · ${m} against ${i.id}`, [entry(use(bankFor(m), m === 'Cash' ? 'Cash-in-Hand' : 'Bank Accounts'), true, self), entry(use(t.selfPay, 'Sundry Debtors'), false, self)]));
      }
      if (i.insurance > 0) {
        const c = claimOf.get(i.id), got = c && c.status === 'short' ? c.settled : i.insurance, cut = i.insurance - got;
        const lines = [entry(use(t.bank, 'Bank Accounts'), true, got)];
        if (cut > 0) lines.push(entry(use(t.deductions, 'Indirect Expenses'), true, cut));
        lines.push(entry(use(t.insurer(i.payer), 'Sundry Debtors'), false, i.insurance));
        v.push(voucher('Receipt', 'S-' + i.id, i.paidOn, t.insurer(i.payer), `${i.payer} settlement ${c ? c.id : ''} for ${i.id}${cut > 0 ? ' · deduction: ' + (c.note || 'TPA') : ''}`, lines));
      }
    });

    const masters = [...ledgers].map(([n, p]) => master(n, p));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${x(t.company)} · ${r.from} to ${r.to} · ${sales.length} sales, ${v.length - sales.length} receipts. Import in TallyPrime: Import > Transactions (ledgers are created if missing). -->
<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${x(t.company)}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>
${masters.join('\n')}
${v.join('\n')}
</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>
`;
    return { xml, sales: sales.length, receipts: v.length - sales.length, ledgers: ledgers.size, from: r.from, to: r.to, total: sum(sales, i => i.amount) };
  };
  RR.downloadTally = function (p) {
    const e = RR.tallyExport(p);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([e.xml], { type: 'application/xml' }));
    a.download = `RR-Hospitals-Tally-${e.from}${e.from !== e.to ? '-to-' + e.to : ''}.xml`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return e;
  };
})();
