/* RR Hospitals — drawer forms, paper commit, toasts */
(function () {
  const RR = window.RR;
  const { icon, esc, inr } = RR;
  const $ = id => document.getElementById(id);

  /* ---------- paper record → patient + invoice ---------- */
  RR.commitPaper = function (id, override) {
    const rec = RR.db.paper.find(p => p.id === id);
    if (!rec || rec.status !== 'pending') return null;
    const f = Object.assign(RR.parsePaper(rec.text), override || {});
    let p = RR.db.patients.find(x => x.name.toLowerCase() === String(f.name).toLowerCase());
    if (!p) {
      p = { id: RR.nextId(RR.db.patients, 'PT-', 1000), name: f.name, sex: f.sex, age: f.age, dept: f.dept || 'Emergency', mrn: 'RR' + (240100 + RR.db.patients.length), source: 'paper' };
      RR.db.patients.push(p);
    }
    const date = f.date || RR.todayISO;
    const inv = { id: RR.nextInvoiceId(), patientId: p.id, patient: p.name, dept: f.dept || p.dept, service: f.service || 'Consultation', date, due: RR.iso(RR.addDays(RR.parse(date), 15)),
      amount: +f.amount || 0, insurance: 0, payer: 'Self-pay', status: f.paid ? 'paid' : 'pending', paidOn: f.paid ? date : null, method: f.paid ? 'Cash' : null, legacy: true };
    RR.db.invoices.push(inv);
    rec.status = 'digitised'; rec.invoiceId = inv.id;
    return inv;
  };

  /* ---------- toast with optional undo ---------- */
  RR.toast = function (text, undo) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = `<span>${esc(text)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
    $('toasts').appendChild(t);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 260); };
    if (undo) t.querySelector('button').onclick = () => { undo(); kill(); };
    setTimeout(kill, undo ? 6000 : 2600);
  };

  /* ---------- drawer ---------- */
  let onSubmit = null, lastFocus = null;
  RR.drawer = function (title, sub, body, submitLabel, handler) {
    lastFocus = document.activeElement;
    $('drawer-title').textContent = title; $('drawer-sub').textContent = sub || '';
    $('drawer-body').innerHTML = body;
    $('drawer-foot').innerHTML = `<button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">${esc(submitLabel)}</button>`;
    onSubmit = handler;
    $('drawer').classList.add('open'); $('drawer').setAttribute('aria-hidden', 'false'); $('scrim').classList.add('open');
    setTimeout(() => { const f = $('drawer-body').querySelector('input,select,textarea'); if (f) f.focus(); }, 60);
  };
  RR.closeDrawer = function () {
    $('drawer').classList.remove('open'); $('drawer').setAttribute('aria-hidden', 'true'); $('scrim').classList.remove('open'); onSubmit = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  RR.drawerOpen = () => $('drawer').classList.contains('open');

  function bindDrawer() {
    $('drawer').addEventListener('submit', e => {
      e.preventDefault(); if (!onSubmit) return;
      const data = Object.fromEntries(new FormData($('drawer')));
      const errs = onSubmit(data) || {};
      $('drawer').querySelectorAll('.err').forEach(x => (x.textContent = ''));
      if (Object.keys(errs).length) { Object.entries(errs).forEach(([k, v]) => { const el = $('err-' + k); if (el) el.textContent = v; }); const first = $('drawer').querySelector(`[name="${Object.keys(errs)[0]}"]`); if (first) first.focus(); return; }
      RR.closeDrawer();
    });
    $('drawer').addEventListener('click', e => { if (e.target.closest('[data-close]')) RR.closeDrawer(); });
    $('drawer-close').onclick = RR.closeDrawer; $('scrim').onclick = RR.closeDrawer;
  }
  RR.bindDrawer = bindDrawer;

  /* ---------- field helpers ---------- */
  const fld = (name, label, input, hint) => `<div class="f"><label for="f-${name}">${esc(label)}</label>${input}${hint ? `<div class="f-hint">${esc(hint)}</div>` : ''}<div class="err" id="err-${name}"></div></div>`;
  const inp = (name, val, attrs = '') => `<input class="input" id="f-${name}" name="${name}" value="${esc(val ?? '')}" ${attrs}>`;
  const sel = (name, opts, val) => `<select class="select" id="f-${name}" name="${name}">${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  const money = v => { const n = Math.round(parseFloat(String(v).replace(/[₹,\s]/g, ''))); return isFinite(n) ? n : NaN; };

  /* ---------- forms ---------- */
  RR.forms = {
    invoice(id, patientId) {
      const i = id ? RR.db.invoices.find(x => x.id === id) : null;
      const pid = i ? i.patientId : patientId || RR.db.patients[0].id;
      const pt = RR.db.patients.find(p => p.id === pid);
      RR.drawer(i ? 'Edit ' + i.id : 'New invoice', i ? i.patient : 'Raise a bill against a patient record',
        fld('patientId', 'Patient', sel('patientId', RR.db.patients.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => [p.id, p.name + ' · ' + p.mrn]), pid)) +
        `<div class="f-row">${fld('service', 'Service', sel('service', Object.keys(RR.SERVICES), i ? i.service : 'Consultation'))}${fld('dept', 'Department', sel('dept', RR.DEPTS, i ? i.dept : pt && pt.dept))}</div>` +
        `<div class="f-row">${fld('amount', 'Amount (₹)', inp('amount', i ? i.amount : '', 'inputmode="numeric" placeholder="e.g. 12,500"'))}${fld('insurance', 'Insurer covers (₹)', inp('insurance', i ? i.insurance : 0, 'inputmode="numeric"'))}</div>` +
        `<div class="f-row">${fld('payer', 'Payer', sel('payer', ['Self-pay', ...RR.INSURERS], i ? i.payer : 'Self-pay'))}${fld('due', 'Due date', inp('due', i ? i.due : RR.iso(RR.addDays(RR.TODAY, 15)), 'type="date"'))}</div>` +
        (i ? fld('status', 'Status', sel('status', ['draft', 'pending', 'paid'], i.status === 'overdue' ? 'pending' : i.status), 'Overdue is set automatically from the due date.') : ''),
        i ? 'Save changes' : 'Create invoice', d => {
          const amount = money(d.amount), ins = money(d.insurance || 0), e = {};
          if (!(amount > 0)) e.amount = 'Enter an amount above ₹0.';
          if (!(ins >= 0)) e.insurance = 'Enter ₹0 or more.'; else if (ins > amount) e.insurance = 'Insurer can’t cover more than the bill.';
          if (d.payer === 'Self-pay' && ins > 0) e.payer = 'Pick the insurer covering ' + inr(ins) + '.';
          if (!d.due) e.due = 'Choose a due date.';
          if (Object.keys(e).length) return e;
          const p = RR.db.patients.find(x => x.id === d.patientId), snap = RR.snapshot();
          const patch = { patientId: p.id, patient: p.name, service: d.service, dept: d.dept, amount, insurance: ins, payer: d.payer, due: d.due };
          if (i) { Object.assign(i, patch); if (d.status) { i.status = d.status; if (d.status === 'paid' && !i.paidOn) { i.paidOn = RR.todayISO; i.method = ins ? 'Insurance' : 'UPI'; } if (d.status !== 'paid') { i.paidOn = null; i.method = null; } } }
          else RR.db.invoices.push({ id: RR.nextInvoiceId(), ...patch, date: RR.todayISO, status: 'pending', paidOn: null, method: null });
          RR.App.commit(i ? i.id + ' updated' : 'Invoice created', snap);
        });
    },
    expense() {
      RR.drawer('Log expense', 'Goes in as pending until approved',
        fld('desc', 'Description', inp('desc', '', 'placeholder="e.g. Surgical gloves, bulk order"')) +
        `<div class="f-row">${fld('category', 'Category', sel('category', RR.CATEGORIES, 'Supplies'))}${fld('dept', 'Department', sel('dept', RR.DEPTS, 'Emergency'))}</div>` +
        `<div class="f-row">${fld('amount', 'Amount (₹)', inp('amount', '', 'inputmode="numeric" placeholder="e.g. 45,000"'))}${fld('date', 'Date', inp('date', RR.todayISO, 'type="date"'))}</div>` + fld('vendor', 'Vendor', inp('vendor', '', 'placeholder="Optional"')),
        'Log expense', d => {
          const amount = money(d.amount), e = {};
          if (!d.desc.trim()) e.desc = 'Describe what was bought.';
          if (!(amount > 0)) e.amount = 'Enter an amount above ₹0.';
          if (!d.date || d.date > RR.todayISO) e.date = 'Use today or an earlier date.';
          if (Object.keys(e).length) return e;
          const snap = RR.snapshot();
          RR.db.expenses.unshift({ id: RR.nextId(RR.db.expenses, 'EXP-', 5000), desc: d.desc.trim(), category: d.category, dept: d.dept, vendor: d.vendor.trim() || '—', amount, date: d.date, status: 'pending' });
          RR.db.expenses.sort((a, b) => b.date.localeCompare(a.date));
          RR.App.commit('Expense logged', snap);
        });
    },
    patient() {
      RR.drawer('Add patient', 'Creates a new digital record',
        fld('name', 'Full name', inp('name', '', 'autocomplete="off" placeholder="e.g. Kavita Menon"')) +
        `<div class="f-row">${fld('age', 'Age', inp('age', '', 'inputmode="numeric"'))}${fld('sex', 'Sex', sel('sex', [['F', 'Female'], ['M', 'Male'], ['O', 'Other']], 'F'))}</div>` + fld('dept', 'Department', sel('dept', RR.DEPTS, 'Emergency')),
        'Add patient', d => {
          const e = {}, age = parseInt(d.age, 10);
          if (d.name.trim().length < 2) e.name = 'Enter the patient’s full name.';
          if (!(age >= 0 && age <= 120)) e.age = 'Age must be between 0 and 120.';
          if (Object.keys(e).length) return e;
          const snap = RR.snapshot();
          RR.db.patients.push({ id: RR.nextId(RR.db.patients, 'PT-', 1000), name: d.name.trim(), age, sex: d.sex, dept: d.dept, mrn: 'RR' + (240100 + RR.db.patients.length), source: 'digital' });
          RR.App.commit(d.name.trim() + ' added', snap);
        });
    },
    paperNew() {
      RR.drawer('Add register line', 'Type the line exactly as written in the register',
        fld('source', 'Register', inp('source', '', 'placeholder="e.g. OPD register · 2021 · p.7"')) + fld('text', 'Line', `<textarea class="input" id="f-text" name="text" rows="3" style="height:auto;padding:10px 12px;border-radius:14px" placeholder="12/05/21 | Ravi Kumar | M/40 | ortho OPD | Rs 900 | paid"></textarea>`),
        'Add line', d => {
          const e = {}; if (d.text.trim().length < 8) e.text = 'Paste the full line from the register.';
          if (Object.keys(e).length) return e;
          const snap = RR.snapshot();
          RR.db.paper.push({ id: RR.nextId(RR.db.paper, 'PR-', 100), source: d.source.trim() || 'Manual entry', text: d.text.trim(), status: 'pending', invoiceId: null });
          RR.App.commit('Register line added', snap);
        });
    },
    settle(id) {
      const c = RR.db.claims.find(x => x.id === id);
      RR.drawer('Record settlement', `${c.id} · ${c.payer} · ${c.patient}`,
        `<dl class="kv"><dt>Claimed</dt><dd>${inr(c.amount)}</dd><dt>Submitted</dt><dd>${RR.date(c.submitted)} · ${RR.claimAge(c)} days ago</dd>${c.note ? `<dt>Query</dt><dd>${esc(c.note)}</dd>` : ''}</dl>` +
        fld('amount', 'Amount received (₹)', inp('amount', c.amount, 'inputmode="numeric"'), 'If the TPA paid less, enter what reached the bank.') +
        fld('note', 'Reason for any deduction', inp('note', '', 'placeholder="e.g. Non-payable consumables"')),
        'Record settlement', d => {
          const amount = money(d.amount), e = {};
          if (!(amount > 0)) e.amount = 'Enter the amount received.'; else if (amount > c.amount) e.amount = 'Can’t be more than the ' + inr(c.amount) + ' claimed.';
          if (Object.keys(e).length) return e;
          const snap = RR.snapshot(); RR.settleClaim(id, amount, d.note.trim());
          RR.App.commit(amount < c.amount ? `${c.id} settled ${inr(c.amount - amount)} short` : c.id + ' settled in full', snap);
        });
    },
    tally() {
      const cur = RR.period, opts = Object.keys(RR.PERIODS).map(k => { const e = RR.tallyExport(k); return [k, `${RR.PERIODS[k]} · ${e.sales} sales, ${e.receipts} receipts`]; });
      RR.drawer('Send to Tally', 'An XML file TallyPrime and Tally ERP 9 import directly',
        fld('period', 'Period', sel('period', opts, cur)) +
        `<div class="tally-what"><b>What goes in</b><ul><li>A <b>Sales</b> voucher for each bill, split between the patient and the insurer</li><li>A <b>Receipt</b> for each payment, posted to Cash, UPI, Card or the bank</li><li>Insurer settlements, with any TPA deduction posted to <b>${esc(RR.CONFIG.tally.deductions)}</b></li><li>Missing ledgers are created under the right groups</li></ul></div>` +
        `<p class="f-hint">In Tally: Gateway › Import › Transactions, then choose the file. Ledger names can be matched to your chart of accounts in config.js.</p>`,
        'Download for Tally', d => { const e = RR.downloadTally(d.period); RR.toast(`Tally file saved · ${e.sales} sales, ${e.receipts} receipts`); });
    },
    paperReview(id) {
      const rec = RR.db.paper.find(p => p.id === id), f = RR.parsePaper(rec.text);
      RR.drawer('Review ' + rec.id, rec.source,
        `<div class="paper-line" style="max-width:none">${esc(rec.text)}</div><p class="f-hint">Check the fields against the original line, fix anything missing, then digitise.</p>` +
        fld('name', 'Patient name', inp('name', f.name)) +
        `<div class="f-row">${fld('age', 'Age', inp('age', f.age, 'inputmode="numeric"'))}${fld('sex', 'Sex', sel('sex', [['F', 'Female'], ['M', 'Male'], ['O', 'Other']], f.sex || 'F'))}</div>` +
        `<div class="f-row">${fld('date', 'Visit date', inp('date', f.date, 'type="date"'))}${fld('amount', 'Amount (₹)', inp('amount', f.amount, 'inputmode="numeric"'))}</div>` +
        `<div class="f-row">${fld('dept', 'Department', sel('dept', RR.DEPTS, f.dept || 'Emergency'))}${fld('service', 'Service', sel('service', Object.keys(RR.SERVICES), f.service || 'Consultation'))}</div>` +
        fld('paid', 'Payment', sel('paid', [['1', 'Paid at the time'], ['', 'Still owed']], f.paid ? '1' : '')),
        'Digitise record', d => {
          const e = {}, amount = money(d.amount), age = parseInt(d.age, 10);
          if (!d.name || d.name.trim().length < 2) e.name = 'The register line has no readable name. Check the original page.';
          if (!(age >= 0 && age <= 120)) e.age = 'Enter an age between 0 and 120.';
          if (!(amount > 0)) e.amount = 'Enter the amount from the register.';
          if (!d.date) e.date = 'Enter the visit date from the register.';
          if (Object.keys(e).length) return e;
          const snap = RR.snapshot();
          const inv = RR.commitPaper(id, { name: d.name.trim(), age, sex: d.sex, date: d.date, amount, dept: d.dept, service: d.service, paid: !!d.paid });
          RR.App.commit(rec.id + ' digitised as ' + inv.id, snap);
        });
    },
  };
})();
