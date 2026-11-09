/* ============================================================
   RR Hospitals — doctors, shifts and who saw whom.
   Every consult is a visit: doctor, patient, time, shift, status.
   Seeded deterministically for the last 14 days and today;
   new visits are logged from the Doctors page or the chat.
   ============================================================ */
(function () {
  const RR = window.RR;
  const { esc, inr } = RR;

  /* ---------- shifts ---------- */
  const SHIFTS = {
    morning: { label: 'Morning', from: 8, to: 14 },
    evening: { label: 'Evening', from: 14, to: 20 },
    night: { label: 'Night', from: 20, to: 32 }, // 20:00 → 08:00 next day
  };
  RR.SHIFTS = SHIFTS;
  /* which shift each doctor works; Emergency rotates nights */
  const ROSTER = { 'Cardiology': 'morning', 'Orthopedics': 'morning', 'Oncology': 'morning', 'Neurology': 'evening', 'Maternity': 'evening', 'Radiology': 'morning', 'Pediatrics': 'evening', 'Emergency': 'night' };
  const COMPLAINTS = {
    Cardiology: ['Chest pain', 'Hypertension review', 'ECG follow-up', 'Breathlessness', 'Post-stent review', 'Palpitations'],
    Orthopedics: ['Knee pain', 'Back pain', 'Fracture review', 'Shoulder stiffness', 'Post-op dressing', 'Sports injury'],
    Oncology: ['Chemo cycle', 'Follow-up scan review', 'New referral', 'Pain management', 'Blood count review'],
    Neurology: ['Migraine', 'Seizure follow-up', 'Numbness in hands', 'Vertigo', 'Stroke rehab review'],
    Maternity: ['ANC check', 'Scan review', 'Postnatal check', 'Gestational diabetes', 'Labour assessment'],
    Radiology: ['MRI report', 'CT report', 'Ultrasound', 'X-ray review'],
    Pediatrics: ['Fever', 'Vaccination', 'Cough and cold', 'Growth check', 'Ear infection', 'Stomach upset'],
    Emergency: ['Road accident', 'Fall', 'Chest pain', 'Asthma attack', 'High fever', 'Cut needing stitches', 'Poisoning', 'Burn'],
  };
  const FEES = { Cardiology: 900, Orthopedics: 800, Oncology: 1200, Neurology: 900, Maternity: 700, Radiology: 600, Pediatrics: 600, Emergency: 500 };

  RR.doctors = () => RR.db.staff.filter(s => /^Dr\.?\s/.test(s.name));
  RR.doctorShift = d => d.shift || ROSTER[d.dept] || 'morning';
  const hm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  RR.hm = hm;

  /* a shift that runs past midnight belongs to the day it started */
  RR.shiftWindow = (doc, day) => {
    const sh = SHIFTS[RR.doctorShift(doc)];
    return { ...sh, key: RR.doctorShift(doc), day, fromLabel: hm(sh.from * 60), toLabel: hm(sh.to * 60) };
  };
  /* current or most recent shift for a doctor */
  RR.currentShiftDay = doc => {
    const sh = SHIFTS[RR.doctorShift(doc)], now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
    if (sh.to > 24 && mins < (sh.to - 24) * 60) return RR.iso(RR.addDays(RR.TODAY, -1)); // still on last night's shift
    if (mins < sh.from * 60) return RR.iso(RR.addDays(RR.TODAY, -1)); // today's shift hasn't started: show the last one
    return RR.todayISO;
  };
  RR.onShiftNow = doc => {
    const sh = SHIFTS[RR.doctorShift(doc)], now = new Date(), m = now.getHours() * 60 + now.getMinutes();
    return sh.to > 24 ? m >= sh.from * 60 || m < (sh.to - 24) * 60 : m >= sh.from * 60 && m < sh.to * 60;
  };

  /* ---------- seed visits ---------- */
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const FIRST_M = ['Ravi', 'Manjunath', 'Prakash', 'Suresh', 'Venkatesh', 'Abdul', 'Ganesh', 'Naveen', 'Shivakumar', 'Ramesh', 'Anil', 'Mohammed', 'Kiran', 'Vinay', 'Raghu', 'Santosh', 'Joseph', 'Harsha', 'Lokesh', 'Imran'];
  const FIRST_F = ['Lakshmi', 'Shabana', 'Kavitha', 'Asha', 'Rekha', 'Fathima', 'Sowmya', 'Geetha', 'Pavithra', 'Nagamma', 'Mary', 'Deepa', 'Shilpa', 'Ayesha', 'Bhavya', 'Roopa', 'Sunita', 'Anitha', 'Jyothi', 'Usha'];
  const LAST = ['Gowda', 'Reddy', 'Naik', 'Shetty', 'Rao', 'Kumar', 'Hegde', 'Patil', 'Khan', 'Murthy', 'Bhat', 'Prasad', 'Pasha', 'Swamy', 'Nayak', 'Fernandes', 'Iyer', 'Kamath'];
  function seedVisits(db) {
    const r = rng(4242), pick = a => a[Math.floor(r() * a.length)];
    // walk-in OPD patients: most visits are people who never got a bill in the ledger
    // every first × last combination once (720 people), shuffled; bounded, so it can never loop forever
    const taken = new Set(db.patients.map(p => p.name)), walkins = [];
    for (const [list, sex] of [[FIRST_F, 'F'], [FIRST_M, 'M']]) for (const f of list) for (const l of LAST) { const name = f + ' ' + l; if (!taken.has(name)) walkins.push({ id: null, name, sex }); }
    for (let i = walkins.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [walkins[i], walkins[j]] = [walkins[j], walkins[i]]; }
    const back = {}; // a walk-in returns, at most twice, to the same department
    const walk = dept => { const l = back[dept] || []; if (l.length && r() < 0.2) { const i = Math.floor(r() * l.length), w = l[i]; if (++w.n >= 3) l.splice(i, 1); return w.p; } const p = walkins.pop() || pick(db.patients); (back[dept] = back[dept] || []).push({ p, n: 1 }); return p; };
    const docs = db.staff.filter(s => /^Dr\.?\s/.test(s.name));
    const visits = [];
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    for (let age = 14; age >= 0; age--) {
      const day = RR.iso(RR.addDays(RR.TODAY, -age)), dow = RR.addDays(RR.TODAY, -age).getDay();
      docs.forEach(doc => {
        if (dow === 0 && doc.dept !== 'Emergency' && doc.dept !== 'Maternity') return; // Sundays off, except casualty and labour ward
        const sh = SHIFTS[ROSTER[doc.dept] || 'morning'];
        const base = { Emergency: 14, Pediatrics: 16, Cardiology: 13, Orthopedics: 12, Maternity: 10, Neurology: 9, Oncology: 8, Radiology: 11 }[doc.dept] || 10;
        const n = Math.max(3, Math.round(base * (0.75 + r() * 0.5)));
        const span = (sh.to - sh.from) * 60;
        const times = Array.from({ length: n }, () => sh.from * 60 + Math.floor(r() * (span - 20))).sort((a, b) => a - b);
        const pool = db.patients.filter(p => p.dept === doc.dept), inShift = new Set();
        times.forEach(t => {
          const actualDay = t >= 24 * 60 ? RR.iso(RR.addDays(RR.parse(day), 1)) : day;
          // today: only what has already happened, plus a short queue for the shift on now
          let status = 'seen';
          if (actualDay > RR.todayISO) return;
          if (actualDay === RR.todayISO) { const m = t % (24 * 60); if (m > nowMin + 90) return; if (m > nowMin) status = 'waiting'; else if (m > nowMin - 25) status = 'with doctor'; }
          let p = r() < 0.12 ? (pool.length ? pick(pool) : pick(db.patients)) : walk(doc.dept);
          for (let k = 0; inShift.has(p.name) && k < 5; k++) p = walkins.pop() || pick(db.patients); // nobody twice in one shift
          inShift.add(p.name);
          visits.push({ id: 'V-' + (90001 + visits.length), doctorId: doc.id, doctor: doc.name, dept: doc.dept, patientId: p.id, patient: p.name,
            shiftDay: day, shift: ROSTER[doc.dept] || 'morning', date: actualDay, time: hm(t), mins: t, reason: pick(COMPLAINTS[doc.dept] || ['Consultation']),
            status, fee: FEES[doc.dept] || 700, type: r() < 0.18 ? 'Follow-up' : r() < 0.12 ? 'Admitted' : 'OPD' });
        });
      });
    }
    db.visits = visits;
  }
  const origReset = RR.reset;
  RR.reset = function () { origReset(); seedVisits(RR.db); RR.db.visitsOn = RR.todayISO; RR.save(); };
  const origLoad = RR.load;
  RR.load = function () {
    const db = origLoad();
    if (!db.visits || db.visitsOn !== RR.todayISO) { seedVisits(db); db.visitsOn = RR.todayISO; }
    return db;
  };

  /* ---------- queries ---------- */
  RR.visitsFor = (doc, opt = {}) => RR.db.visits.filter(v => v.doctorId === doc.id && (!opt.shiftDay || v.shiftDay === opt.shiftDay) && (!opt.from || (v.date >= opt.from && v.date <= opt.to)));
  RR.shiftSummary = (doc, shiftDay) => {
    const v = RR.visitsFor(doc, { shiftDay }).sort((a, b) => a.mins - b.mins);
    const seen = v.filter(x => x.status === 'seen'), w = v.filter(x => x.status === 'waiting'), wd = v.filter(x => x.status === 'with doctor');
    return { doc, shiftDay, win: RR.shiftWindow(doc, shiftDay), visits: v, seen, waiting: w, withDoctor: wd, newPts: seen.filter(x => x.type === 'OPD').length, followUps: seen.filter(x => x.type === 'Follow-up').length, admitted: seen.filter(x => x.type === 'Admitted').length, fees: seen.reduce((a, x) => a + x.fee, 0) };
  };

  /* find a doctor in free text: "Dr Menon", "vikram", "the cardiologist", "orthopaedic doctor" */
  const ROLE = [[/cardio/, 'Cardiology'], [/ortho/, 'Orthopedics'], [/onco|cancer/, 'Oncology'], [/neuro/, 'Neurology'], [/obst|gyn|matern/, 'Maternity'], [/radio/, 'Radiology'], [/paed|pedia|child/, 'Pediatrics'], [/emergency|casualty|\ber\b/, 'Emergency']];
  RR.findDoctor = q => {
    const t = ' ' + String(q).toLowerCase().replace(/[^a-z\s]/g, ' ') + ' ', docs = RR.doctors();
    const names = d => d.name.toLowerCase().replace(/^dr\.?\s*/, '').split(/\s+/);
    // 1. "Dr Menon", "doctor Vikram", or the full name
    for (const d of docs) { const [f, l] = names(d); if (t.includes(' ' + f + ' ' + l + ' ') || new RegExp(`\\b(dr|doctor)\\s+(${f}|${l})\\b`).test(t)) return d; }
    // 2. a first name on its own, unless it's really a patient's name ("Ravi Kumar")
    const pt = RR.db.patients.find(p => t.includes(' ' + p.name.toLowerCase() + ' '));
    if (!pt) for (const d of docs) { const [f] = names(d); if (t.includes(' ' + f + ' ')) return d; }
    if (/\b(doctor|dr|physician|surgeon|consultant|ologist|iatrician|shift)\b|ologist|ician/.test(t)) for (const [re, dept] of ROLE) if (re.test(t)) return docs.find(d => d.dept === dept);
    return null;
  };

  /* ---------- chat ---------- */
  function shiftDayFrom(s, doc) {
    if (/yesterday|last night/.test(s)) return RR.iso(RR.addDays(RR.TODAY, -1));
    const m = s.match(/(\d+)\s*days? ago/); if (m) return RR.iso(RR.addDays(RR.TODAY, -+m[1]));
    const wd = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].findIndex(d => s.includes(d));
    if (wd >= 0) { let k = (RR.TODAY.getDay() - wd + 7) % 7; if (k === 0) k = 7; return RR.iso(RR.addDays(RR.TODAY, -k)); }
    return null;
  }
  const dayWord = d => (d === RR.todayISO ? 'today' : d === RR.iso(RR.addDays(RR.TODAY, -1)) ? 'yesterday' : 'on ' + RR.date(d));

  function doctorShiftAnswer(doc, s) {
    const K = RR.chatKit, explicit = shiftDayFrom(s, doc), periodic = RR.periodFrom(s);
    if (periodic && periodic !== 'today' && !explicit) {
      const r = RR.range(periodic), v = RR.visitsFor(doc, { from: r.from, to: r.to }).filter(x => x.status === 'seen');
      const days = new Set(v.map(x => x.shiftDay)).size;
      const out = { text: [`**${doc.name}** has seen **${v.length} patients** ${RR.periodPhrase(periodic)}${days > 1 ? `, across ${days} shifts, about ${Math.round(v.length / days)} a shift` : days ? ', all in one shift' : ''}.`], blocks: [] };
      if (K.wantsChart(s)) { const by = {}; v.forEach(x => (by[x.shiftDay] = (by[x.shiftDay] || 0) + 1)); out.blocks.push(K.blk('Patients per shift', doc.name, RR.hbars(Object.keys(by).sort().map(d => ({ label: RR.dateShort(d), value: by[d], display: by[d] + '' }))))); }
      return out;
    }
    const day = explicit || RR.currentShiftDay(doc), sum = RR.shiftSummary(doc, day), w = sum.win;
    const live = day === RR.currentShiftDay(doc) && RR.onShiftNow(doc);
    const t = [];
    if (!sum.visits.length) t.push(day < RR.currentShiftDay(doc) ? `**${doc.name}** wasn’t on shift ${dayWord(day)}${RR.parse(day).getDay() === 0 ? ' (Sunday, OPD closed)' : ''}.` : `**${doc.name}**’s ${w.label.toLowerCase()} shift (${w.fromLabel}–${w.toLabel}) hasn’t started yet, so no patients so far.`);
    else {
      t.push(`**${doc.name}** ${live ? 'has seen' : 'saw'} **${sum.seen.length} patient${sum.seen.length === 1 ? '' : 's'}** ${live ? 'so far in the current' : 'in the'} ${w.label.toLowerCase()} shift${live ? '' : ' ' + dayWord(day)} (${w.fromLabel}–${w.toLabel}).` +
        (sum.withDoctor.length ? ` ${sum.withDoctor[0].patient} is with them now` : '') + (sum.waiting.length ? `${sum.withDoctor.length ? ' and' : ''} ${sum.waiting.length} ${sum.waiting.length === 1 ? 'is' : 'are'} waiting` : '') + (sum.withDoctor.length || sum.waiting.length ? '.' : ''));
      const parts = [sum.newPts && `${sum.newPts} new OPD`, sum.followUps && `${sum.followUps} follow-up${sum.followUps === 1 ? '' : 's'}`, sum.admitted && `${sum.admitted} admitted`].filter(Boolean);
      if (parts.length) t.push(`${RR.chatKit.cap(parts.join(', '))}. Consultation fees ${inr(sum.fees)}.`);
      if (/waiting|queue/.test(s) && !sum.waiting.length && !sum.withDoctor.length) t.push(live ? 'Nobody is waiting for them right now.' : 'Nobody is waiting; they’re off shift right now.');
    }
    const blocks = [];
    if (K.wantsTable(s) || /\bwho|which patients|names\b/.test(s)) blocks.push(K.blk(`${doc.name} · ${w.label} shift`, dayWord(day), RR.table(sum.visits, [{ h: 'Time', f: v => esc(v.time) }, { h: 'Patient', f: v => `${esc(v.patient)}<span class="sub">${esc(v.type)}</span>` }, { h: 'Reason', f: v => esc(v.reason) }, { h: 'Status', f: v => visitBadge(v.status) }], { compact: 1, empty: 'No patients in this shift' }), { flush: 1 }));
    blocks.push({ html: K.openLink('doctors', 'Open doctors') });
    return { text: t, blocks };
  }
  function allDoctorsAnswer(s) {
    const K = RR.chatKit, rows = RR.doctors().map(d => RR.shiftSummary(d, RR.currentShiftDay(d)));
    const on = rows.filter(r => RR.onShiftNow(r.doc));
    const total = rows.reduce((a, r) => a + r.seen.length, 0), waiting = rows.reduce((a, r) => a + r.waiting.length, 0);
    const busiest = rows.slice().sort((a, b) => b.seen.length - a.seen.length)[0];
    const out = { text: [`Across the doctors' current shifts, **${total} patients** have been seen${waiting ? ` and ${waiting} are waiting` : ''}. ${on.length ? `On shift now: ${on.map(r => r.doc.name.replace(/^Dr\.?\s*/, 'Dr ')).join(', ')}.` : 'No one is on shift right now.'}`, busiest && busiest.seen.length ? `Busiest is ${busiest.doc.name} with ${busiest.seen.length}.` : ''].filter(Boolean), blocks: [] };
    if (K.wantsChart(s)) out.blocks.push(K.blk('Patients seen this shift', '', RR.hbars(rows.map(r => ({ label: r.doc.name, sub: r.win.label, value: r.seen.length, display: r.seen.length + '' })))));
    else if (K.wantsTable(s)) out.blocks.push(K.blk('Doctors', 'Current or last shift', RR.table(rows, [{ h: 'Doctor', f: r => `${esc(r.doc.name)}<span class="sub">${esc(r.doc.dept)}</span>` }, { h: 'Shift', f: r => `${r.win.label} · ${r.win.fromLabel}–${r.win.toLabel}` }, { h: 'Seen', num: 1, f: r => r.seen.length }, { h: 'Waiting', num: 1, f: r => r.waiting.length || '—' }], { compact: 1 }), { flush: 1 }));
    out.blocks.push({ html: K.openLink('doctors', 'Open doctors') });
    return out;
  }
  function whoSawPatient(pt, s) {
    const v = RR.db.visits.filter(x => (pt.id && x.patientId === pt.id) || x.patient.toLowerCase() === pt.name.toLowerCase()).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    if (!v.length) return { text: [`**${pt.name}** hasn't seen a doctor in the last two weeks.`] };
    const now = v.find(x => x.status !== 'seen'), last = v.find(x => x.status === 'seen'), t = [];
    if (now) t.push(`**${pt.name}** is ${now.status === 'waiting' ? 'waiting to see' : 'with'} **${now.doctor}** now (${now.reason}, booked ${now.time}).`);
    if (last) t.push(`${now ? 'Before that, they' : `**${pt.name}**`} last saw **${last.doctor}** ${dayWord(last.date)} at ${last.time} (${last.reason}).`);
    const docs = [...new Set(v.filter(x => x.status === 'seen').map(x => x.doctor))];
    if (v.length > 1) t.push(`${v.length} visits in the last two weeks${docs.length > 1 ? `, with ${docs.slice(0, -1).join(', ')} and ${docs[docs.length - 1]}` : ''}.`);
    return { text: t };
  }
  const visitBadge = st => (st === 'seen' ? '<span class="badge badge-solid">Seen</span>' : st === 'with doctor' ? '<span class="badge badge-soft">With doctor</span>' : '<span class="badge badge-outline">Waiting</span>');
  RR.visitBadge = visitBadge;

  const DOCQ = /\b(doctor|doctors|dr|shift|attended|consult(ed|ations)?|seen|saw|see|visits?|opd|on duty|on call|rounds|busiest|workload|waiting|queue|with)\b/;
  (RR.extraIntents = RR.extraIntents || []).push((q, s, p) => {
    if (/\b(which|what) doctor|who (saw|treated|attended|is seeing|consulted)|doctor did .* see/.test(s)) {
      const pt = RR.chatKit.findPatient(q) || (() => { const t = ' ' + s.replace(/[^a-z\s]/g, ' ') + ' ', hit = RR.db.visits.find(v => t.includes(' ' + v.patient.toLowerCase() + ' ')); return hit ? { id: null, name: hit.patient } : null; })();
      if (pt) return whoSawPatient(pt, s);
    }
    const doc = RR.findDoctor(q);
    if (doc && DOCQ.test(s)) { const f = (pp, ss) => doctorShiftAnswer(doc, ss); RR.chatKit.remember(f, p); return doctorShiftAnswer(doc, s); }
    if (/\b(which|what) doctor|who (saw|treated|attended|is seeing|consulted)|doctor did .* see/.test(s)) { const pt = RR.chatKit.findPatient(q); if (pt) return whoSawPatient(pt, s); }
    if (/\b(doctors?|on duty|on shift|shifts?)\b/.test(s) && /\b(how many|patients|who|which|all|each|every|busiest|today|now|shift|list|chart)\b/.test(s) && !/salar|payroll|pay\b/.test(s)) { const f = (pp, ss) => allDoctorsAnswer(ss); RR.chatKit.remember(f, p); return allDoctorsAnswer(s); }
    return null;
  });

  /* ---------- log a visit (Doctors page) ---------- */
  RR.logVisit = (docId, patientId, reason, type) => {
    const doc = RR.db.staff.find(d => d.id === docId), p = RR.db.patients.find(x => x.id === patientId);
    const now = new Date(), m = now.getHours() * 60 + now.getMinutes(), day = RR.currentShiftDay(doc);
    const v = { id: 'V-' + (90001 + RR.db.visits.length), doctorId: doc.id, doctor: doc.name, dept: doc.dept, patientId: p.id, patient: p.name, shiftDay: day, shift: RR.doctorShift(doc),
      date: RR.todayISO, time: hm(m), mins: day === RR.todayISO ? m : m + 24 * 60, reason: reason || 'Consultation', status: 'seen', fee: FEES[doc.dept] || 700, type: type || 'OPD' };
    RR.db.visits.push(v);
    return v;
  };
})();
