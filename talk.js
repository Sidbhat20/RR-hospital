/* ============================================================
   RR Hospitals — the conversational layer in front of RR.route.
   1. Small talk: greetings, thanks, "who are you", jokes, rude
      messages, off-topic asks — answered like a person would.
   2. Typos: every word is checked against the ledger's vocabulary
      (money words, departments, patient and doctor names) and
      fixed when it is one or two letters off ("blling tdy").
   3. Friendly fallbacks: unknown names and unclear questions get
      a warm reply that says what was understood and how to ask.
   ============================================================ */
(function () {
  const RR = window.RR, base = RR.route;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const owner = () => (RR.CONFIG && RR.CONFIG.owner) || 'there';
  const say = (...t) => ({ text: t.filter(Boolean), talk: true });

  /* ---------- typo correction ---------- */
  const SHORT = { tdy: 'today', tday: 'today', '2day': 'today', yday: 'yesterday', ystrdy: 'yesterday', wk: 'week', mth: 'month', mnth: 'month', yr: 'year', amt: 'amount', pls: 'please', plz: 'please', pt: 'patient', pts: 'patients', dept: 'department', depts: 'departments', docs: 'doctors', doc: 'doctor', exp: 'expenses', rev: 'revenue', bil: 'bill', bils: 'bills', inv: 'inv', u: 'you', ur: 'your', r: 'are', wat: 'what', wht: 'what', hw: 'how', hv: 'have', abt: 'about', thx: 'thanks', ty: 'thanks', tq: 'thanks', insta: 'instant', opd: 'opd', ipd: 'ipd', tpa: 'tpa', upi: 'upi', fy: 'fy', ytd: 'ytd', mtd: 'mtd', pnl: 'p&l', recv: 'received', rcvd: 'received', pymt: 'payment', pmt: 'payment', sal: 'salary', bal: 'balance', outstnd: 'outstanding' };
  const WORDS = `today yesterday tomorrow week weekly month monthly year yearly annual quarter morning evening night shift shifts last this next previous so far
    bill bills billing billed invoice invoices revenue income sales money owe owes owed owing overdue outstanding pending unpaid receivable receivables due
    claim claims insurance insurer insurers insured stuck settled settlement settle short queried query rejected denial denied pmjay cghs star hdfc niva bupa icici lombard
    payment payments paid pay collected collection collections cash card cheque method methods received refund
    expense expenses budget budgets spend spending spent purchase purchases vendor vendors pharmacy supplies cost costs
    payroll salary salaries staff wages employees employee
    profit profits loss losses losing margin margins net gross earning earnings bottom line
    department departments cardiology orthopedics orthopaedics oncology emergency maternity radiology neurology pediatrics paediatrics casualty
    patient patients doctor doctors attended seen visit visits consult consultation consultations duty busiest waiting
    closing close drawer match matched mismatch reconcile counter tally export accountant xml
    chart graph table list show pull trend breakdown details overview summary dashboard report numbers status
    balance register registers paper scan digitise digitize digitised handwritten photo page duplicate duplicates forecast predict projection risk
    reminder remind chase void delete undo create raise charge record log add mark
    how much many which who whom what when where why does did do is are was were has have had the our we us me my you your a an and or of for in on at by with to from
    total totals doing done best worst top bottom highest lowest biggest largest smallest most least more less average anyone someone everyone anything something everything nobody
    all any each every some none other same new old just only also still yet already now then than there here their they them it its that those these
    going go went been being make made take took need needs want wants know think tell said says like right wrong good bad well better worse
    give gave send sent open opened day days hour hours time times number amount price rate fee fees value up down out over under about after before since until between
    cardiologist orthopaedician oncologist neurologist gynaecologist gynecologist radiologist paediatrician pediatrician surgeon physician consultant nurse nurses
    queue admitted discharged ward wards bed beds
    please thanks thank hello hi hey good great nice cool okay sorry help can could would should tell give get find check see look`.split(/\s+/).filter(Boolean);
  let vocab = null;
  function buildVocab() {
    const v = new Set(WORDS);
    RR.db.patients.forEach(p => p.name.toLowerCase().split(/\s+/).forEach(w => v.add(w)));
    RR.db.staff.forEach(p => p.name.toLowerCase().replace(/^dr\.?\s*/, '').split(/\s+/).forEach(w => v.add(w)));
    (RR.DEPTS || []).forEach(d => v.add(d.toLowerCase()));
    return [...v].filter(w => w.length > 1);
  }
  function dist(a, b, max) { // Damerau-Levenshtein with early exit
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      let best = Infinity;
      for (let j = 1; j <= b.length; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        best = Math.min(best, d[i][j]);
      }
      if (best > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  function fixWord(w) {
    const lw = w.toLowerCase();
    if (SHORT[lw]) return SHORT[lw];
    if (lw.length < 4 || /\d|₹/.test(lw) || vocab.includes(lw)) return w;
    const max = lw.length >= 8 ? 2 : 1;
    let best = null, bd = max + 1;
    for (const v of vocab) {
      if (Math.abs(v.length - lw.length) > max) continue;
      const d = dist(lw, v, max);
      if (d < bd || (d === bd && best && v[0] === lw[0] && best[0] !== lw[0])) { bd = d; best = v; }
    }
    return best && bd <= max ? best : w;
  }
  // a name right after "Dr" is never "corrected" into some other word
  // names are left alone: a word right after "Dr", or a Capitalised word mid-sentence, is never "corrected"
  RR.fixTypos = q => { vocab = vocab || buildVocab(); return q.replace(/(\b(?:dr|doctor)\.?\s+)?([A-Za-z]+)/gi, (m, pre, w, i) => (pre || (i > 0 && /^[A-Z][a-z]/.test(w)) ? m : fixWord(w))); };
  RR.refreshVocab = () => (vocab = null);

  /* ---------- small talk ---------- */
  const hour = () => new Date().getHours();
  const greet = () => (hour() < 12 ? 'Good morning' : hour() < 17 ? 'Good afternoon' : 'Good evening');
  const S = s => s.toLowerCase().replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ').trim();
  const OFF = /\b(weather|rain|cricket|ipl|match score|football|movie|movies|song|music|recipe|cook|news|politic|election|stock market|sensex|nifty|bitcoin|crypto|traffic|flight|train)\b/;
  const RUDE = /\b(useless|stupid|dumb|idiot|bad bot|worst|rubbish|trash|garbage|hate you|shut up|you suck|pathetic|not working|doesn't work|doesnt work|wrong answer|that's wrong|thats wrong)\b/;
  const JOKES = [
    'Why did the accountant break up with the calculator? She felt he was always counting on her.',
    'I’d tell you a joke about overdue bills, but you’d probably have to wait 30 days for the punchline.',
    'Our ledger walked into a bar. The bartender said, “What’ll it be?” It said, “Just put it on my account.”',
  ];
  function smallTalk(raw) {
    const s = S(raw);
    if (!s) return say('Looks like that one came through empty. What would you like to know?');
    const words = s.split(' ');
    if (/^(hi+|hello+|hey+|hiya|yo|namaste|namaskar|hola|good (morning|afternoon|evening)|gm|morning)( (there|asim|rr|team|buddy|friend))?$/.test(s))
      return say(pick([`${greet()}, ${owner()}! What would you like to look at?`, `Hi ${owner()}! How can I help today?`, `${greet()}! What can I pull up for you?`]));
    if (/^(how are you|how r u|how are u|how's it going|hows it going|how is it going|what's up|whats up|sup|how do you do)\b/.test(s))
      return say(pick(['Doing well, thanks for asking! The ledger’s up to date and ready when you are. What would you like to check?', 'All good here, thanks! What can I help you with?']));
    if (/^(thanks|thank you|thankyou|thx|ty|tq|thanks a lot|thank you so much|great thanks|perfect thanks|awesome thanks|cheers)\b/.test(s))
      return say(pick(['You’re welcome! Anything else?', 'Happy to help. Just ask if you need anything else.', 'Anytime!']));
    if (/^(ok|okay|k|cool|great|nice|got it|alright|fine|perfect|awesome|good|sure|hmm+|right)$/.test(s))
      return say(pick(['👍 Let me know whenever you need something.', 'Sounds good. I’m here if you need anything else.']));
    if (/^(bye|goodbye|see you|see ya|good night|gn|that's all|thats all|nothing else|done)\b/.test(s))
      return say(pick([`Bye, ${owner()}! Everything’s saved, so you can pick up where you left off.`, 'Take care! Your chats are saved in the sidebar.']));
    if (/^(who are you|what are you|what is this|what's your name|whats your name|your name|are you (a )?(bot|ai|human|real|chatgpt|gpt))\b/.test(s))
      return say(`I’m the assistant inside RR Hospitals. I read the same ledger you see on every page (bills, payments, insurance claims, expenses, payroll, doctors’ shifts and the paper registers) and answer in plain words.`, 'I can also make changes, like raising a bill or recording a payment, but I always show you what I’m about to do and wait for you to confirm.');
    if (/^(help|what can you do|what can i ask|what do you do|how does this work|how do i use (this|you)|options|menu|commands)\b/.test(s)) return null; // the detailed help in intents.js
    if (/\b(joke|funny|make me laugh)\b/.test(s)) return say(pick(JOKES), 'Now, anything I can look up for you?');
    if (RUDE.test(s)) return say('Sorry about that, I clearly missed what you meant. Could you tell me what you were looking for? Even a few words like “overdue bills” or “Dr Menon’s shift” is enough, and I’ll have another go.');
    if (OFF.test(s) && !/\b(bill|claim|patient|doctor|cash|expense|money)\b/.test(s)) return say('That’s outside what I can see, sorry. I only know what’s in RR Hospitals’ books: bills, payments, claims, expenses, payroll, patients and doctors’ shifts. Happy to help with any of those.');
    if (/^(love you|you're great|youre great|good job|well done|nice work|amazing|you're the best|good bot)\b/.test(s)) return say(pick(['Thank you, that’s kind! 😊', 'Glad it’s helping!']));
    // keyboard mash: one or two "words" with no real vowels pattern and nothing we know
    vocab = vocab || buildVocab();
    if (words.length <= 2 && words.every(w => !vocab.includes(w) && !SHORT[w] && fixWord(w) === w && (/^[^aeiou]{4,}$/.test(w) || /(.)\1{2,}/.test(w) || /^(asdf|qwer|zxcv|hjkl|jkl|sdf|dfg|fgh|ghj)/.test(w))))
      return say('Hmm, I think that might have been a slip of the keyboard. 🙂 What would you like to know?');
    return null;
  }

  /* ---------- a few questions the ledger answers directly ---------- */
  function direct(q, s) {
    if (/\bhow many (doctors|docs)\b|\b(list|which|who are) (the |our )?doctors\b|\bdoctors? (do we have|are there)\b/.test(s)) {
      const d = RR.doctors(), on = d.filter(RR.onShiftNow);
      return { text: [`RR Hospitals has **${d.length} doctors** on the roster: ${d.map(x => `${x.name} (${x.dept})`).join(', ')}.`, on.length ? `${on.length} ${on.length === 1 ? 'is' : 'are'} on shift right now: ${on.map(x => x.name).join(', ')}.` : 'Nobody is on shift right now.'] };
    }
    if (/\bhow many (patients|pts)\b.*\b(registered|do we have|total|in the system|on file)\b|\btotal patients\b/.test(s))
      return { text: [`There are **${RR.db.patients.length} patients** with bills in the ledger, plus walk-ins seen in OPD who haven’t been billed yet.`] };
    if (/\b(net|profit|bottom line|make money|making money|earn|earning)\b/.test(s) && !/\b(department|dept|which|by|each|losing)\b/.test(s)) return base(q.replace(/\b(profit|bottom line|making money|make money|earning|earn)\b/gi, 'overview'));
    return null;
  }

  /* ---------- friendly fallbacks ---------- */
  function unknownName(q, s) {
    const dm = s.match(/\b(?:dr|doctor)\.?\s+([a-z]{3,})/);
    if (dm && !RR.findDoctor(q)) {
      const nm = dm[1][0].toUpperCase() + dm[1].slice(1);
      const near = RR.doctors().find(d => d.name.toLowerCase().replace(/^dr\.?\s*/, '').split(' ').some(w => dist(w, dm[1], 2) <= 2));
      if (near) { const q0 = s; mem.pending = { kind: 'confirm', run: () => route2(withDoctor(q0, near, [dm[1]]), withDoctor(q0, near, [dm[1]]), q0) }; return say(`I don’t see a Dr ${nm}. Did you mean **${near.name}** (${near.dept})?`); }
      return say(`I don’t see a Dr ${nm} on the roster. 🤔`, `The doctors here are ${RR.doctors().map(d => d.name.replace(/^Dr\.?\s*/, 'Dr ')).join(', ')}. Which one did you mean?`);
    }
    const pm = q.match(/\b(?:does|did|is|for|of|about|patient)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (pm && !RR.chatKit.findPatient(pm[1])) return say(`I couldn’t find a patient called **${pm[1]}**. Could the spelling be a little different? You can also search on the Patients page.`);
    return null;
  }
  function fallback(raw, fixed) {
    const named = unknownName(fixed, S(fixed));
    if (named) return named;
    const s = S(fixed), short = s.split(' ').length <= 2;
    return say(
      short ? `I’m not quite sure what you mean by “${raw.trim()}”.` : pick(['Sorry, I didn’t quite catch that one.', 'Hmm, I’m not sure I followed that.', 'I want to get this right, but I’m not sure what you’re after.']),
      'Could you put it another way? For example: “How much did we bill this week?”, “Who owes us money?”, “Which claims are stuck?” or “How many patients has Dr Menon seen today?”',
    );
  }

  /* ---------- conversation memory ---------- */
  const mem = (RR.talkMem = { pending: null, doc: null, patient: null });
  const YES = /^(yes|yeah|yea|yep|yup|ya|yah|haan|ha|han|ji|correct|right|exactly|that one|that's (him|her|right|the one)|thats (him|her|right)|yes please|yes pls|sure|ok yes|yess+|y)\b/;
  const NO = /^(no|nope|nah|not (him|her|that one)|wrong|neither|none)\b/;

  /* ---------- fuzzy doctor / patient resolution ---------- */
  const dname = d => d.name.toLowerCase().replace(/^dr\.?\s*/, '').split(/\s+/);
  const tol = w => (w.length >= 6 ? 2 : w.length >= 4 ? 1 : 0);
  const COMMON = new Set(WORDS);
  function fuzzyDoctor(s) {
    const toks = s.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && w !== 'dr' && w !== 'doctor');
    const score = new Map();
    for (const d of RR.doctors()) {
      const parts = dname(d); let hit = 0, used = [];
      for (const t of toks) {
        if (COMMON.has(t) && !parts.includes(t)) continue;
        const best = Math.min(...parts.map(p => (t === p ? 0 : dist(t, p, 2))));
        if (best === 0 || best <= tol(t)) { hit += best === 0 ? 3 : 2 - best * 0.5; used.push(t); }
      }
      if (hit) score.set(d, { hit, used });
    }
    const ranked = [...score.entries()].sort((a, b) => b[1].hit - a[1].hit);
    if (!ranked.length) return null;
    if (ranked.length > 1 && ranked[0][1].hit === ranked[1][1].hit) return { ambiguous: ranked.filter(r => r[1].hit === ranked[0][1].hit).map(r => r[0]) };
    return { doc: ranked[0][0], used: ranked[0][1].used };
  }
  function fuzzyPatient(s) {
    const t = s.replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim(), words = t.split(' ');
    const names = [...new Set([...RR.db.patients.map(p => p.name), ...RR.db.visits.map(v => v.patient)])];
    let best = null, bd = 9;
    for (let i = 0; i < words.length - 1; i++) {
      const pair = words[i] + ' ' + words[i + 1];
      if (COMMON.has(words[i]) || pair.length < 7) continue;
      for (const n of names) { const d = dist(pair, n.toLowerCase(), 3); if (d < bd) { bd = d; best = { name: n, pair }; } }
    }
    return best && bd <= (best.name.length >= 10 ? 3 : 2) ? best : null;
  }
  const withDoctor = (s, doc, used) => {
    const full = dname(doc).join(' ');
    let done = false;
    let out = s.replace(/[a-z]+/g, w => (used.includes(w) ? (done ? '' : ((done = true), full)) : w)).replace(/\s+/g, ' ');
    if (!/\b(dr|doctor)\b/.test(out)) out = 'dr ' + out;
    return out;
  };
  const isDoctorish = s => /\b(dr|doctor|doc|shift|attended|seen|saw|see|patients|duty|opd)\b/.test(s);

  function answer(raw) {
    const st = smallTalk(raw);
    if (st) return st;
    let fixed = RR.fixTypos(raw), s = fixed.toLowerCase(), note = null;

    // he / she → the last doctor or patient we talked about
    if (/\b(he|she|him|her|his)\b/.test(s) && !RR.findDoctor(fixed) && !RR.chatKit.findPatient(fixed)) {
      if (mem.doc) { fixed = s = s + ' dr ' + dname(mem.doc).join(' '); }
      else if (mem.patient) { fixed = s = s + ' ' + mem.patient.toLowerCase(); }
    }
    // a doctor's name typed slightly wrong: answer for the obvious one, ask only when it's a real toss-up
    if (isDoctorish(s) && !RR.findDoctor(fixed)) {
      const f = fuzzyDoctor(s);
      if (f && f.doc) { fixed = s = withDoctor(s, f.doc, f.used); note = `I think you mean **${f.doc.name}** (${f.doc.dept}).`; }
      else if (f && f.ambiguous) {
        const opts = f.ambiguous;
        mem.pending = { kind: 'choose', opts, q: s };
        return say(`Did you mean ${opts.slice(0, -1).map(d => `**${d.name}**`).join(', ')} or **${opts[opts.length - 1].name}**? Just say the name.`);
      }
    }
    // a patient's name typed slightly wrong
    if (!RR.chatKit.findPatient(fixed) && !RR.findDoctor(fixed) && !/\b(dr|doctor)\b/.test(s)) {
      const fp = fuzzyPatient(s);
      if (fp && fp.name.toLowerCase() !== fp.pair) { fixed = s = s.replace(fp.pair, fp.name.toLowerCase()); note = `I think you mean **${fp.name}**.`; }
    }
    const out = route2(fixed, s, raw);
    if (note && out.text && !out.talk) out.text = [note, ...out.text];
    return out;
  }

  function route2(fixed, s, raw) {
    let out = direct(fixed, s);
    if (!out && /\b(?:dr|doctor)\.?\s+[a-z]{3,}/.test(s) && !RR.findDoctor(fixed)) out = unknownName(fixed, s);
    if (!out) { // a Capitalised full name that isn't anyone we know
      const nm = raw.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
      if (nm && !/^(Dr|Doctor|RR|Star|Niva|HDFC|ICICI|Send|Show|Pull|What|Which|Who|How|This|Last)\b/.test(nm[1]) && !RR.chatKit.findPatient(nm[1]) && !RR.findDoctor(nm[1]) && !RR.db.staff.some(x => x.name.includes(nm[1])) && !(RR.DEPTS || []).some(d => nm[1].includes(d)) && !RR.db.visits.some(v => v.patient === nm[1]))
        out = say(`I couldn’t find anyone called **${nm[1]}** in the ledger. Could the spelling be a little different? If they’re new, you can add them by raising their first bill.`);
    }
    if (!out) out = base(fixed);
    if (!out || out.fallback) out = fallback(raw, fixed);
    return out;
  }

  RR.route = function (q) {
    const raw = String(q || ''), s = S(raw);
    // answering a question we just asked
    if (mem.pending) {
      const pend = mem.pending; mem.pending = null;
      if (pend.kind === 'confirm' && YES.test(s)) return finish(pend.run());
      if (pend.kind === 'confirm' && NO.test(s)) return say(pend.no || 'No problem. Who did you mean? Type the name as best you can and I’ll find them.');
      if (pend.kind === 'choose') {
        const pickd = pend.opts.find(d => dname(d).some(w => s.includes(w)));
        if (pickd) return finish(route2(withDoctor(pend.q, pickd, dname(pickd).concat(pend.opts.flatMap(dname))), pend.q, raw));
        if (NO.test(s)) return say('No problem. Which doctor did you mean?');
      }
    }
    if (YES.test(s) && s.split(' ').length <= 3) return say(pick(['Great! What would you like me to look up?', 'Sure. What can I check for you?']));
    if (NO.test(s) && s.split(' ').length <= 3) return say('Okay! Let me know if there’s anything else you need.');
    return finish(answer(raw));
  };
  // remember who the answer was about, so "he", "she" and "yes" work next
  function finish(out) {
    const t = (out.text || []).join(' ');
    const d = RR.doctors().find(x => t.includes(x.name));
    if (d && !/^The doctors here|has \*\*\d+ doctors\*\*/.test(t)) { mem.doc = d; mem.patient = null; }
    else { const p = RR.db.patients.find(x => t.includes('**' + x.name + '**')) || RR.db.visits.find(v => t.includes('**' + v.patient + '**')); if (p) { mem.patient = p.name || p.patient; mem.doc = null; } }
    return out;
  }
})();
