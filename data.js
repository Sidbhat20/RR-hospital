/* ============================================================
   RR Hospitals — data layer
   One deterministic ledger. Every number on screen and in the
   copilot is computed from this, never typed in by hand.
   ============================================================ */
(function () {
  const RR = (window.RR = window.RR || {});
  const KEY = 'rr-hospitals-db-v4';

  /* ---------- dates ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => new Date(s + 'T00:00:00');
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const todayISO = iso(TODAY);
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const inRange = (d, a, b) => d && d >= a && d <= b;
  Object.assign(RR, { iso, parse, addDays, TODAY, todayISO, daysBetween });

  /* ---------- reference data ---------- */
  const DEPTS = ['Cardiology', 'Orthopedics', 'Oncology', 'Emergency', 'Maternity', 'Radiology', 'Neurology', 'Pediatrics'];
  const DEPT_W = [['Cardiology', 18], ['Orthopedics', 15], ['Oncology', 14], ['Emergency', 14], ['Maternity', 12], ['Radiology', 11], ['Neurology', 9], ['Pediatrics', 7]];
  const SERVICES = { 'Consultation': [1500, 3500], 'Lab Panel': [4000, 12000], 'Imaging': [8000, 28000], 'Therapy': [15000, 45000], 'Inpatient Stay': [60000, 240000], 'Surgery': [150000, 550000] };
  const SERVICE_W = [['Consultation', 30], ['Lab Panel', 22], ['Imaging', 18], ['Therapy', 12], ['Inpatient Stay', 11], ['Surgery', 7]];
  const INSURERS = ['Star Health', 'HDFC ERGO', 'Niva Bupa', 'ICICI Lombard', 'PM-JAY', 'CGHS'];
  const CATEGORIES = ['Supplies', 'Pharmacy', 'Equipment', 'Facilities', 'IT'];
  const BUDGETS = { Supplies: 450000, Pharmacy: 330000, Equipment: 180000, Facilities: 260000, IT: 125000 };
  Object.assign(RR, { DEPTS, SERVICES, INSURERS, CATEGORIES, BUDGETS });

  const NAMES = [
    ['Rohan Mehta', 'M'], ['Elena Fernandes', 'F'], ['Arjun Nair', 'M'], ['Priya Shah', 'F'], ['David Thomas', 'M'],
    ['Sara Iyer', 'F'], ['Imran Qureshi', 'M'], ['Aisha Khan', 'F'], ['Karthik Reddy', 'M'], ['Meera Pillai', 'F'],
    ['Suresh Patil', 'M'], ['Kavya Hegde', 'F'], ['Aditya Joshi', 'M'], ['Neha Gupta', 'F'], ['Farhan Ali', 'M'],
    ['Lakshmi Narayan', 'F'], ['Vivek Sinha', 'M'], ['Pooja Desai', 'F'], ['Rahul Verma', 'M'], ['Anjali Menon', 'F'],
    ['Sanjay Kulkarni', 'M'], ['Divya Rao', 'F'], ['Nikhil Bansal', 'M'], ['Shreya Das', 'F'], ['Manoj Tiwari', 'M'],
    ['Ritu Malhotra', 'F'], ['Gaurav Saxena', 'M'], ['Fatima Sheikh', 'F'], ['Ajay Chauhan', 'M'], ['Swati Bhatt', 'F'],
    ['Harish Gowda', 'M'], ['Nandini Krishnan', 'F'], ['Tarun Arora', 'M'], ['Bhavna Jain', 'F'], ['Deepak Yadav', 'M'],
    ['Ishita Roy', 'F'], ['Mohan Pillai', 'M'], ['Zoya Mirza', 'F'], ['Kunal Shetty', 'M'], ['Asha Varghese', 'F'],
  ];

  const STAFF = [
    ['Dr. Ananya Rao', 'Chief Medical Officer', 'Cardiology', 180000],
    ['Dr. Vikram Menon', 'Orthopedic Surgeon', 'Orthopedics', 160000],
    ['Dr. Hana Kapoor', 'Oncologist', 'Oncology', 150000],
    ['Dr. Omar Sheikh', 'Neurologist', 'Neurology', 140000],
    ['Dr. Leela Krishnan', 'Obstetrician', 'Maternity', 120000],
    ['Dr. Ravi Prasad', 'Radiologist', 'Radiology', 120000],
    ['Dr. Sameer Joshi', 'Pediatrician', 'Pediatrics', 110000],
    ['Dr. Kiran Bhat', 'Emergency Physician', 'Emergency', 100000],
    ['Joy Pillai', 'Head Nurse', 'Emergency', 52000],
    ['Grace Dsouza', 'Staff Nurse', 'Pediatrics', 38000],
    ['Reena Thomas', 'Staff Nurse', 'Maternity', 38000],
    ['Asif Khan', 'ICU Nurse', 'Cardiology', 42000],
    ['Raj Patel', 'Radiology Technician', 'Radiology', 34000],
    ['Mahesh Naik', 'Facilities Lead', 'Emergency', 36000],
  ];

  const EXP_TEMPLATES = [
    ['Surgical consumables', 'Supplies', 'Orthopedics', [60000, 160000], 'MedLine India'],
    ['Cardiac stents & catheters', 'Supplies', 'Cardiology', [90000, 240000], 'Meril Life Sciences'],
    ['Oncology pharmacy restock', 'Pharmacy', 'Oncology', [120000, 220000], 'Apollo Pharma Distribution'],
    ['General pharmacy restock', 'Pharmacy', 'Emergency', [50000, 110000], 'MedPlus Wholesale'],
    ['MRI / CT service contract', 'Equipment', 'Radiology', [80000, 180000], 'Siemens Healthineers'],
    ['Electricity & water', 'Facilities', 'Emergency', [110000, 170000], 'BESCOM / BWSSB'],
    ['Housekeeping services', 'Facilities', 'Pediatrics', [45000, 70000], 'CleanCare Services'],
    ['Lab reagents', 'Supplies', 'Radiology', [30000, 75000], 'Transasia Bio-Medicals'],
    ['EHR & copilot platform', 'IT', 'Neurology', [60000, 60000], 'RR Digital'],
    ['Linen & laundry', 'Facilities', 'Maternity', [25000, 45000], 'WashWell'],
  ];

  /* Transcribed lines from the paper registers, waiting to be digitised */
  const PAPER = [
    ['Ward B ledger · 2019 · p.14', '14/03/19 | Smt. Lakshmi Devi | F/62 | Ortho OPD - knee X-ray | Rs 850 | paid cash'],
    ['OPD register · 2019 · p.3', '21/05/19 | Ramesh Gowda | M/45 | cardiac consult | Rs 1,200 | paid'],
    ['Paeds register · 2019 · p.22', '02/07/19 | Baby Ananya | F/4 | paeds OPD fever, lab test | Rs 650 | recd'],
    ['Oncology day-care · 2020 · p.8', '11/02/20 | Mohd. Saleem | M/58 | chemo cycle 3 | Rs 18,500 | balance due'],
    ['Labour ward · 2020 · p.41', '30/08/20 | Sunita Sharma | F/29 | delivery normal, ward 3 days | Rs 22,000 | paid'],
    ['Casualty book · 2020 · p.5', '07/10/20 | K. Venkatesh | M | casualty - fracture | Rs 4,300'],
    ['Neuro OPD · 2021 · p.17', '16/01/21 | Fatima Begum | F/71 | neuro consult + CT | Rs 6,200 | paid'],
    ['Cardiac OT log · 2021 · p.2', "09/04/21 | Joseph D'Souza | M/66 | bypass surgery | Rs 1,85,000 | ins. claim pending"],
    ['Radiology slips · 2021 · p.30', '23/06/21 | Priyanka Rao | F/34 | MRI brain | Rs 7,500 | paid UPI'],
    ['ICU register · 2022 · p.11', '04/03/22 | Abdul Kareem | M/50 | admit ICU 2 days | Rs 38,000 | due'],
    ['Physio register · 2022 · p.6', '19/09/22 | Geeta Kulkarni | F/41 | physio x6 sessions | Rs 3,600 | paid'],
    ['OPD register · 2022 · p.19', '?? (smudged) | M | OPD | Rs 300'],
  ];

  /* ---------- deterministic RNG ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seed() {
    const r = rng(20261106);
    const pick = a => a[Math.floor(r() * a.length)];
    const wpick = pairs => { const tot = pairs.reduce((s, p) => s + p[1], 0); let x = r() * tot; for (const p of pairs) { if ((x -= p[1]) < 0) return p[0]; } return pairs[0][0]; };
    const between = (a, b, step) => Math.round((a + r() * (b - a)) / step) * step;

    const patients = NAMES.map((n, i) => {
      const dept = wpick(DEPT_W);
      return { id: 'PT-' + (1001 + i), name: n[0], sex: n[1], age: dept === 'Pediatrics' ? 2 + Math.floor(r() * 13) : 19 + Math.floor(r() * 60), dept, mrn: 'RR' + (240100 + i), source: 'digital' };
    });

    const raw = [];
    for (let i = 0; i < 640; i++) {
      const age = Math.floor(365 * Math.pow(r(), 1.2));
      const date = addDays(TODAY, -age);
      const p = pick(patients);
      const service = p.dept === 'Radiology' ? 'Imaging' : wpick(SERVICE_W);
      const [lo, hi] = SERVICES[service];
      const amount = between(lo, hi, lo >= 50000 ? 1000 : 100);
      let payer = 'Self-pay', insurance = 0;
      if (r() > 0.35) { payer = pick(INSURERS); insurance = (payer === 'PM-JAY' || payer === 'CGHS') ? amount : Math.round((amount * (0.55 + r() * 0.35)) / 100) * 100; }
      const paidProb = age > 60 ? 0.96 : age > 30 ? 0.82 : age > 15 ? 0.62 : 0.38;
      let status = 'pending', paidOn = null, method = null;
      if (r() < paidProb) {
        status = 'paid';
        paidOn = iso(addDays(date, Math.min(age, Math.floor(r() * 24))));
        method = insurance >= amount ? 'Insurance' : insurance ? pick(['Insurance', 'UPI', 'Card']) : pick(['UPI', 'UPI', 'Card', 'Cash', 'NEFT']);
      }
      if (age <= 2 && r() < 0.4) status = 'draft';
      raw.push({ patientId: p.id, patient: p.name, dept: p.dept, service, date: iso(date), due: iso(addDays(date, 15)), amount, insurance, payer, status, paidOn, method });
    }
    // a working day's traffic for the last two weeks, so Today and This week read like a real desk
    for (let age = 0; age < 45; age++) {
      const n = age === 0 ? 9 : 1 + Math.floor(r() * 3);
      for (let j = 0; j < n; j++) {
        const date = addDays(TODAY, -age), p = pick(patients);
        const service = p.dept === 'Radiology' ? 'Imaging' : wpick([['Consultation', 40], ['Lab Panel', 25], ['Imaging', 18], ['Therapy', 10], ['Inpatient Stay', 5], ['Surgery', 2]]);
        const [lo, hi] = SERVICES[service];
        const amount = between(lo, hi, lo >= 50000 ? 1000 : 100);
        let payer = 'Self-pay', insurance = 0;
        if (r() > 0.55) { payer = pick(INSURERS); insurance = (payer === 'PM-JAY' || payer === 'CGHS') ? amount : Math.round((amount * (0.55 + r() * 0.35)) / 100) * 100; }
        const paid = r() < (insurance ? 0.25 : 0.7);
        const paidOn = paid ? iso(addDays(date, Math.min(age, Math.floor(r() * 2)))) : null;
        raw.push({ patientId: p.id, patient: p.name, dept: p.dept, service, date: iso(date), due: iso(addDays(date, 15)), amount, insurance, payer, status: paid ? 'paid' : 'pending', paidOn, method: paid ? pick(['UPI', 'UPI', 'Card', 'Cash']) : null });
      }
    }
    // one deliberate duplicate charge so the detector has something real to find
    const dupSrc = raw.find(x => daysBetween(x.date, todayISO) <= 8 && daysBetween(x.date, todayISO) >= 2 && x.service === 'Imaging' && x.status !== 'draft');
    if (dupSrc) raw.push({ ...dupSrc, date: iso(addDays(parse(dupSrc.date), 1)), status: 'pending', paidOn: null, method: null });
    raw.sort((a, b) => a.date.localeCompare(b.date));
    const invoices = raw.map((x, i) => ({ id: 'INV-' + (2001 + i), ...x }));

    const expenses = [];
    for (let k = 0; k < 12; k++) {
      const ms = new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1);
      EXP_TEMPLATES.forEach(t => {
        if (t[1] !== 'IT' && r() > 0.8) return;
        const d = addDays(ms, Math.floor(r() * 28));
        if (d > TODAY) return;
        const age = daysBetween(iso(d), todayISO);
        let amt = between(t[3][0], t[3][1], 500);
        if (t[1] === 'Pharmacy' && age <= 30) amt = Math.round((amt * 1.4) / 500) * 500; // recent pharmacy overrun
        expenses.push({ desc: t[0], category: t[1], dept: t[2], vendor: t[4], amount: amt, date: iso(d), status: age <= 10 && r() < 0.5 ? 'pending' : 'approved' });
      });
    }
    expenses.sort((a, b) => b.date.localeCompare(a.date));
    expenses.forEach((e, i) => (e.id = 'EXP-' + (5000 + expenses.length - i)));

    const staff = STAFF.map((s, i) => ({ id: 'EMP-' + (301 + i), name: s[0], role: s[1], dept: s[2], gross: s[3], status: 'scheduled' }));
    const total = staff.reduce((s, x) => s + x.gross, 0);
    const runs = [];
    for (let k = 1; k <= 11; k++) {
      const m = new Date(TODAY.getFullYear(), TODAY.getMonth() - k + 1, 0); // last day of month k-1 ago
      runs.push({ month: iso(m).slice(0, 7), date: iso(m), total, staff: staff.length });
    }

    const paper = PAPER.map((p, i) => ({ id: 'PR-' + (101 + i), source: p[0], text: p[1], status: 'pending', invoiceId: null }));

    return { v: 4, patients, invoices, expenses, staff, runs, paper, seededOn: todayISO };
  }

  /* ---------- store ---------- */
  function refreshStatuses(db) {
    db.invoices.forEach(i => { if ((i.status === 'pending' || i.status === 'overdue')) i.status = i.due < todayISO ? 'overdue' : 'pending'; });
  }
  RR.load = function () {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    if (!db || db.v !== 4) db = seed();
    refreshStatuses(db);
    RR.db = db;
    return db;
  };
  RR.save = function () { refreshStatuses(RR.db); try { localStorage.setItem(KEY, JSON.stringify(RR.db)); } catch (e) {} };
  RR.reset = function () { localStorage.removeItem(KEY); RR.db = seed(); refreshStatuses(RR.db); RR.save(); };
  RR.snapshot = () => JSON.stringify(RR.db);
  RR.restore = s => { RR.db = JSON.parse(s); RR.save(); };
  RR.nextInvoiceId = () => 'INV-' + (Math.max(2000, ...RR.db.invoices.map(i => +i.id.slice(4))) + 1);
  RR.nextId = (list, prefix, base) => prefix + (Math.max(base, ...list.map(x => +x.id.split('-')[1])) + 1);

  /* ---------- periods: Today · This week · This month · This year (FY Apr–Mar) ---------- */
  const PERIODS = { today: 'Today', week: 'This week', month: 'This month', year: 'This year' };
  RR.PERIODS = PERIODS;
  RR.period = 'today';
  RR.range = function (p) {
    p = p || RR.period;
    const t = TODAY;
    let from, prev = null;
    if (p === 'today') { from = t; const y = iso(addDays(t, -1)); prev = [y, y]; }
    else if (p === 'week') { from = addDays(t, -((t.getDay() + 6) % 7)); const n = daysBetween(iso(from), todayISO); prev = [iso(addDays(from, -7)), iso(addDays(from, n - 7))]; }
    else if (p === 'month') { from = new Date(t.getFullYear(), t.getMonth(), 1); const pf = new Date(t.getFullYear(), t.getMonth() - 1, 1); const end = new Date(t.getFullYear(), t.getMonth(), 0); const pt = addDays(pf, t.getDate() - 1); prev = [iso(pf), iso(pt > end ? end : pt)]; }
    else { from = new Date(t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1, 3, 1); }
    return { key: p, label: PERIODS[p], from: iso(from), to: todayISO, prev, days: daysBetween(iso(from), todayISO) + 1 };
  };
  RR.periodPhrase = p => ({ today: 'today', week: 'this week', month: 'this month', year: 'this financial year' })[p || RR.period];
  RR.prevPhrase = p => ({ today: 'yesterday', week: 'the same days last week', month: 'the same days last month' })[p || RR.period] || '';
  RR.periodFrom = function (text) {
    const s = String(text).toLowerCase();
    if (/\btoday|so far today|this morning/.test(s)) return 'today';
    if (/\bweek|weekly|7 days/.test(s)) return 'week';
    if (/\bmonth\b|monthly|30 days|mtd/.test(s) && !/next month/.test(s)) return 'month';
    if (/\byear|yearly|annual|\bfy\b|ytd|12 months/.test(s)) return 'year';
    return null;
  };

  /* ---------- analytics ---------- */
  const W30 = [iso(addDays(TODAY, -29)), todayISO];
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const live = () => RR.db.invoices.filter(i => i.status !== 'void');
  const unpaid = () => live().filter(i => i.status === 'pending' || i.status === 'overdue');
  const W = p => { const r = RR.range(p); return [r.from, r.to]; };
  RR.payrollMonthly = () => sum(RR.db.staff, s => s.gross);
  RR.inPeriod = (d, p) => { const r = RR.range(p); return inRange(d, r.from, r.to); };

  RR.kpis = function (p) {
    const r = RR.range(p), inv = live();
    const collected = w => sum(inv.filter(i => i.status === 'paid' && inRange(i.paidOn, w[0], w[1])), i => i.amount);
    const billedL = w => inv.filter(i => i.status !== 'draft' && inRange(i.date, w[0], w[1]));
    const spend = w => sum(RR.db.expenses.filter(e => inRange(e.date, w[0], w[1])), e => e.amount);
    const payroll = Math.round(RR.payrollMonthly() * r.days / 30.4);
    const cur = [r.from, r.to], pv = r.prev, u = unpaid(), bl = billedL(cur);
    const k = {
      period: r, payroll,
      collected: collected(cur), billed: sum(bl, i => i.amount), bills: bl.length, patients: new Set(bl.map(i => i.patientId)).size, expenses: spend(cur),
      collectedPrev: pv ? collected(pv) : null, billedPrev: pv ? sum(billedL(pv), i => i.amount) : null, expensesPrev: pv ? spend(pv) : null,
      outstanding: sum(u, i => i.amount), overdue: sum(u.filter(i => i.status === 'overdue'), i => i.amount),
      overdueCount: u.filter(i => i.status === 'overdue').length, unpaidCount: u.length,
    };
    k.cost = k.expenses + payroll; k.costPrev = pv ? k.expensesPrev + payroll : null;
    k.net = k.collected - k.cost; k.netPrev = pv ? k.collectedPrev - k.costPrev : null;
    k.collectRate = k.billed ? k.collected / k.billed : 0;
    return k;
  };

  /* chart buckets: today/week → last 7 days, month → days of month, year → months of FY */
  RR.series = function (p) {
    p = p || RR.period;
    const r = RR.range(p), inv = live(), out = [];
    const bucket = (label, test, testPaid) => out.push({ label, billed: sum(inv.filter(i => i.status !== 'draft' && test(i.date)), i => i.amount), collected: sum(inv.filter(i => i.status === 'paid' && i.paidOn && testPaid(i.paidOn)), i => i.amount) });
    if (p === 'year') {
      for (let d = RR.parse(r.from); d <= TODAY; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) { const k = iso(d).slice(0, 7); bucket(d.toLocaleDateString('en-IN', { month: 'short' }), x => x.startsWith(k), x => x.startsWith(k)); }
      return out;
    }
    const from = p === 'month' ? RR.parse(r.from) : addDays(TODAY, -6);
    for (let d = from; d <= TODAY; d = addDays(d, 1)) { const k = iso(d); bucket(p === 'month' ? String(d.getDate()) : d.toLocaleDateString('en-IN', { weekday: 'short' }), x => x === k, x => x === k); }
    return out;
  };

  /* every bill in a period, newest first */
  RR.bills = p => live().filter(i => i.status !== 'draft' && RR.inPeriod(i.date, p)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  /* completed calendar months, oldest → newest */
  RR.monthly = function (n) {
    const out = [];
    for (let k = n; k >= 1; k--) {
      const m = new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1);
      const key = iso(m).slice(0, 7);
      const inv = live();
      out.push({
        key, label: m.toLocaleDateString('en-IN', { month: 'short' }),
        billed: sum(inv.filter(i => i.status !== 'draft' && i.date.startsWith(key)), i => i.amount),
        collected: sum(inv.filter(i => i.status === 'paid' && i.paidOn && i.paidOn.startsWith(key)), i => i.amount),
        expenses: sum(RR.db.expenses.filter(e => e.date.startsWith(key)), e => e.amount) + RR.payrollMonthly(),
      });
    }
    return out;
  };

  RR.forecast = function () {
    const m = RR.monthly(12);
    const ys = m.map(x => x.billed), n = ys.length, xs = ys.map((_, i) => i);
    const mx = sum(xs, x => x) / n, my = sum(ys, y => y) / n;
    const slope = sum(xs, x => (x - mx) * (ys[x] - my)) / sum(xs, x => (x - mx) ** 2);
    const next = Math.max(0, Math.round((my + slope * (n - mx)) / 1000) * 1000);
    const resid = Math.sqrt(sum(xs, x => (ys[x] - (my + slope * (x - mx))) ** 2) / n);
    return { months: m, next, slope, band: Math.round(resid) };
  };

  RR.deptPL = function (p) {
    const w = p ? W(p) : W30, days = p ? RR.range(p).days : 30.4;
    const inv = live().filter(i => i.status === 'paid' && inRange(i.paidOn, w[0], w[1]));
    const exp = RR.db.expenses.filter(e => inRange(e.date, w[0], w[1]));
    return DEPTS.map(d => {
      const revenue = sum(inv.filter(i => i.dept === d), i => i.amount);
      const spend = sum(exp.filter(e => e.dept === d), e => e.amount);
      const payroll = Math.round(sum(RR.db.staff.filter(s => s.dept === d), s => s.gross) * days / 30.4);
      const cost = spend + payroll;
      return { dept: d, revenue, spend, payroll, cost, net: revenue - cost, margin: revenue ? (revenue - cost) / revenue : -1 };
    }).sort((a, b) => b.net - a.net);
  };

  RR.aging = function () {
    const b = [['Not yet due', 0, 0], ['1–30 days', 0, 0], ['31–60 days', 0, 0], ['61–90 days', 0, 0], ['90+ days', 0, 0]];
    unpaid().forEach(i => {
      const late = daysBetween(i.due, todayISO);
      const idx = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4;
      b[idx][1] += i.amount; b[idx][2]++;
    });
    return b.map(x => ({ label: x[0], value: x[1], count: x[2] }));
  };

  /* rule-based risk score — transparent, explained in the UI */
  RR.claimRisk = function () {
    return unpaid().filter(i => i.insurance > 0).map(i => {
      const late = Math.max(0, daysBetween(i.due, todayISO));
      const reasons = [];
      let s = 10;
      if (i.status === 'overdue') { s += 30; reasons.push('past due'); }
      if (late > 30) { s += 15; reasons.push(late + ' days late'); }
      if (i.insurance / i.amount > 0.8 && i.payer !== 'PM-JAY' && i.payer !== 'CGHS') { s += 20; reasons.push('high insured share'); }
      if (i.service === 'Surgery' || i.service === 'Inpatient Stay') { s += 15; reasons.push('pre-auth heavy service'); }
      return { ...i, score: Math.min(98, s), reasons };
    }).sort((a, b) => b.score - a.score || b.insurance - a.insurance);
  };

  RR.duplicates = function () {
    const out = [], inv = live().filter(i => i.status !== 'paid');
    const all = live();
    inv.forEach(i => {
      const twin = all.find(j => j.id !== i.id && j.patientId === i.patientId && j.service === i.service && j.amount === i.amount && Math.abs(daysBetween(j.date, i.date)) <= 7 && j.id < i.id);
      if (twin) out.push({ dup: i, original: twin });
    });
    return out;
  };

  RR.budget = function () {
    const exp = RR.db.expenses.filter(e => inRange(e.date, W30[0], W30[1]));
    return CATEGORIES.map(c => {
      const spent = sum(exp.filter(e => e.category === c), e => e.amount);
      return { category: c, spent, budget: BUDGETS[c], ratio: spent / BUDGETS[c] };
    }).sort((a, b) => b.ratio - a.ratio);
  };

  RR.payerMix = function (p) {
    const w = p ? W(p) : W30;
    const inv = live().filter(i => i.status === 'paid' && inRange(i.paidOn, w[0], w[1]));
    const m = {};
    inv.forEach(i => { const k = i.insurance ? i.payer : 'Self-pay'; m[k] = (m[k] || 0) + i.amount; });
    return Object.entries(m).map(([payer, value]) => ({ payer, value })).sort((a, b) => b.value - a.value);
  };

  RR.avgDaysToPay = function () {
    const from = iso(addDays(TODAY, -90));
    const p = live().filter(i => i.status === 'paid' && i.paidOn >= from);
    return p.length ? Math.round(sum(p, i => daysBetween(i.date, i.paidOn)) / p.length) : 0;
  };

  RR.patientBalance = function (pid) { return sum(unpaid().filter(i => i.patientId === pid), i => i.amount); };
  RR.digitisation = function () {
    const p = RR.db.paper, done = p.filter(x => x.status === 'digitised').length;
    return { total: p.length, done, pending: p.length - done, ratio: p.length ? done / p.length : 0 };
  };

  /* ---------- amount & paper-record parsing ---------- */
  RR.parseAmount = function (text) {
    const t = String(text).replace(/INV-\d+|EXP-\d+|PT-\d+|PR-\d+|RR\d+/gi, ' ');
    const re = /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l|crores?|cr)?\b/gi;
    let m, best = null;
    while ((m = re.exec(t))) {
      let v = parseFloat(m[1].replace(/,/g, ''));
      const u = (m[2] || '').toLowerCase();
      if (u === 'k' || u === 'thousand') v *= 1e3;
      else if (u.startsWith('l')) v *= 1e5;
      else if (u.startsWith('c')) v *= 1e7;
      const explicit = /₹|rs|inr/i.test(m[0]) || u;
      if (!best || explicit || v > best.v) best = { v, explicit };
      if (explicit) break;
    }
    return best ? Math.round(best.v) : null;
  };

  const DEPT_KEYS = [
    [/cardi|heart|bypass|angio|stent/i, 'Cardiology'], [/ortho|knee|fractur|bone|joint|physio/i, 'Orthopedics'],
    [/onco|chemo|cancer|tumou?r/i, 'Oncology'], [/casualty|emergenc|trauma|icu|accident/i, 'Emergency'],
    [/deliver|maternity|labou?r|obst|pregnan|gyn/i, 'Maternity'], [/x-?ray|mri|ct\b|scan|radiol|ultrasound|usg/i, 'Radiology'],
    [/neuro|brain|stroke|epilep/i, 'Neurology'], [/paed|ped|child|baby|infant/i, 'Pediatrics'],
  ];
  const SERVICE_KEYS = [
    [/surger|bypass|operat|\bot\b|c-?section/i, 'Surgery'], [/admit|ward|icu|stay|days\b|deliver/i, 'Inpatient Stay'],
    [/x-?ray|mri|ct\b|scan|ultrasound|usg|imaging/i, 'Imaging'], [/chemo|physio|therapy|session|dialysis/i, 'Therapy'],
    [/lab|blood|test|panel|culture/i, 'Lab Panel'], [/consult|opd|check-?up|visit/i, 'Consultation'],
  ];
  RR.matchDept = t => (DEPT_KEYS.find(k => k[0].test(t)) || [])[1] || null;
  RR.matchService = t => (SERVICE_KEYS.find(k => k[0].test(t)) || [])[1] || null;
  RR.matchCategory = t => (/pharma|drug|medicin/i.test(t) ? 'Pharmacy' : /equip|machine|mri|ct|service contract|repair/i.test(t) ? 'Equipment' : /electric|water|clean|housekeep|laundry|linen|facilit|rent/i.test(t) ? 'Facilities' : /software|it\b|licen|computer|server/i.test(t) ? 'IT' : /suppl|consum|glove|reagent|stent|instrument/i.test(t) ? 'Supplies' : null);

  RR.parsePaper = function (text) {
    const t = String(text);
    const f = { name: null, sex: null, age: null, date: null, dept: null, service: null, amount: null, paid: false };
    const d = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
    if (d) { let y = +d[3]; if (y < 100) y += 2000; f.date = y + '-' + pad(+d[2]) + '-' + pad(+d[1]); }
    const sa = t.match(/\b([MF])\s*[\/,]?\s*(\d{1,3})\b/) || t.match(/\(([MF])\s*\/\s*(\d{1,3})\)/);
    if (sa) { f.sex = sa[1]; f.age = +sa[2]; } else { const s = t.match(/\|\s*([MF])\s*\|/) || t.match(/\b([MF])\b/); if (s) f.sex = s[1]; }
    const segs = t.split(/[|,]/).map(s => s.trim()).filter(Boolean);
    for (const s of segs) {
      const cleaned = s.replace(/^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\s*/, '').replace(/\(.*?\)/g, '').replace(/\b[MF]\s*\/?\s*\d{0,3}\b.*$/, '').trim();
      if (/^(smt\.?|shri\.?|mr\.?|mrs\.?|ms\.?|mohd\.?|baby|dr\.?)?\s*[A-Z][a-zA-Z.']+(\s+[A-Z][a-zA-Z.']+)*$/.test(cleaned) && !RR.matchDept(cleaned.replace(/^baby\s+/i, '')) && !RR.matchService(cleaned) && cleaned.length > 3) {
        f.name = cleaned.replace(/^(smt\.?|shri\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').trim(); break;
      }
    }
    f.dept = RR.matchDept(t);
    f.service = RR.matchService(t) || (f.dept ? 'Consultation' : null);
    const a = t.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
    f.amount = a ? +a[1].replace(/,/g, '') : null;
    f.paid = /\bpaid\b|\brecd\b|received|cash\b|upi\b/i.test(t) && !/due|pending|balance/i.test(t);
    const keys = ['name', 'sex', 'age', 'date', 'dept', 'service', 'amount'];
    const missing = keys.filter(k => f[k] == null);
    f.missing = missing;
    f.confidence = Math.round(((keys.length - missing.length) / keys.length) * 100);
    return f;
  };
})();
