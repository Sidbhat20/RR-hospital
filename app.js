/* RR Hospitals — shell: routing, nav, dock, events */
(function () {
  const RR = window.RR;
  const { icon } = RR;
  const $ = id => document.getElementById(id);
  const S = RR.pageState;

  const NAV = [
    ['copilot', 'Ask', 'spark'], ['overview', 'Overview', 'home'], ['billing', 'Billing', 'receipt'], ['payments', 'Payments', 'card'],
    ['expenses', 'Expenses', 'wallet'], ['payroll', 'Payroll', 'users'], ['patients', 'Patients', 'heart'], ['departments', 'Departments', 'building'], ['records', 'Paper records', 'scan'],
  ];
  const TITLES = Object.fromEntries(NAV.map(n => [n[0], n[1]]));
  /* phone: four tabs + More */
  const TABS = ['copilot', 'overview', 'billing', 'patients'];
  const mobile = () => matchMedia('(max-width: 860px)').matches;
  const st = { page: 'copilot', dock: false };

  /* period switch in the top bar: Today · Week · Month · Year */
  function periodHTML() {
    return Object.keys(RR.PERIODS).map(p => `<button data-period="${p}" aria-pressed="${RR.period === p}">${p === 'today' ? 'Today' : p[0].toUpperCase() + p.slice(1)}</button>`).join('');
  }
  /* saved chats */
  function logsHTML() {
    const logs = RR.Chat.logs();
    $('logs-label').style.display = logs.length ? '' : 'none';
    return logs.slice(0, 12).map(l => `<div class="log${RR.Chat.logId === l.id && st.page === 'copilot' ? ' on' : ''}"><button class="log-open" data-log="${l.id}" title="${RR.esc(l.title)}">${RR.esc(l.title)}</button><button class="log-del" data-log-del="${l.id}" aria-label="Delete chat">${icon('x')}</button></div>`).join('');
  }
  function tabsHTML() {
    const inMore = !TABS.includes(st.page);
    return TABS.map(id => { const n = NAV.find(x => x[0] === id); return `<button data-nav="${id}"${st.page === id ? ' aria-current="page"' : ''}>${icon(n[2])}<span>${n[1]}</span></button>`; }).join('')
      + `<button data-act="more"${inMore ? ' aria-current="page"' : ''} aria-haspopup="dialog">${icon('more')}<span>${inMore ? TITLES[st.page].split(' ')[0] : 'More'}</span></button>`;
  }
  function moreHTML() {
    const dg = RR.digitisation(), logs = RR.Chat.logs().slice(0, 6);
    const item = (id, sub) => { const n = NAV.find(x => x[0] === id); return `<button class="sheet-item" data-nav="${id}"${st.page === id ? ' aria-current="page"' : ''}>${icon(n[2])}<span>${n[1]}</span>${sub ? `<em>${sub}</em>` : ''}</button>`; };
    return `<div class="sheet-group">${['payments', 'expenses', 'payroll', 'departments'].map(id => item(id)).join('')}${item('records', dg.pending ? dg.pending + ' waiting' : '')}</div>
      ${logs.length ? `<div class="sheet-label">Recent chats</div><div class="sheet-group">${logs.map(l => `<button class="sheet-item" data-log="${l.id}">${icon('spark')}<span>${RR.esc(l.title)}</span></button>`).join('')}</div>` : ''}
      <div class="sheet-group"><button class="sheet-item" data-act="new-chat">${icon('plus')}<span>New chat</span></button><button class="sheet-item" data-act="reset">${icon('refresh')}<span>Reset demo data</span></button></div>
      <div class="sheet-who"><div class="avatar" aria-hidden="true">A</div><div class="who"><b>Asim</b><span>RR Hospitals</span></div></div>`;
  }
  function openMore() { $('more-body').innerHTML = moreHTML(); $('more').classList.add('open'); $('more').setAttribute('aria-hidden', 'false'); $('scrim').classList.add('open', 'for-sheet'); }
  function closeMore() { if (!$('more').classList.contains('open')) return false; $('more').classList.remove('open'); $('more').setAttribute('aria-hidden', 'true'); $('scrim').classList.remove('open', 'for-sheet'); return true; }
  RR.closeMore = closeMore;
  function navHTML() {
    const k = RR.kpis(), dg = RR.digitisation();
    const counts = { records: dg.pending || '' };
    return NAV.map(([id, label, ic]) => `<button data-nav="${id}"${st.page === id ? ' aria-current="page"' : ''}>${icon(ic)}${label}${counts[id] ? `<span class="count">${counts[id]}</span>` : ''}</button>`).join('');
  }

  /* where the chat lives: full page on Copilot, the dock everywhere else */
  function placeChat() {
    const target = st.page === 'copilot' ? $('copilot-page') : st.dock ? $('dock-body') : null;
    if (target && RR.Chat.root !== target) {
      const prev = RR.Chat.root; if (prev && prev !== target) prev.innerHTML = '';
      RR.Chat.mount(target, target.id === 'dock-body');
    }
    if (!target && RR.Chat.root && RR.Chat.root.id === 'dock-body') { /* keep thread in memory, dock hidden */ }
  }

  function render(opts = {}) {
    const scroll = $('scroll'), y = opts.keepScroll ? scroll.scrollTop : 0;
    $('nav').innerHTML = navHTML();
    $('tabbar').innerHTML = tabsHTML();
    $('app').dataset.page = st.page;
    $('logs').innerHTML = logsHTML();
    $('period').innerHTML = periodHTML();
    $('crumb').textContent = TITLES[st.page];
    if (mobile()) st.dock = false;
    const showDock = st.dock && st.page !== 'copilot';
    $('app').classList.toggle('dock-open', showDock);
    $('dock-toggle').setAttribute('aria-pressed', String(showDock));
    $('dock-toggle').style.display = st.page === 'copilot' ? 'none' : '';
    $('ask-trigger').style.display = st.page === 'copilot' ? 'none' : '';
    const hasPeriod = !['copilot', 'patients', 'records', 'payroll'].includes(st.page);
    $('period').style.display = hasPeriod ? '' : 'none';
    $('app').classList.toggle('has-period', hasPeriod);
    if (st.page === 'copilot') { scroll.innerHTML = RR.pages.copilot(); scroll.style.overflow = 'hidden'; }
    else {
      scroll.style.overflow = '';
      scroll.innerHTML = `<div class="content">${RR.pages[st.page]()}</div>`;
      if (opts.keepScroll) scroll.querySelector('.page').style.animation = 'none';
      RR.countUp(scroll); RR.fitCharts(scroll); RR.mountIso(scroll);
      scroll.scrollTop = y;
    }
    if (st.page === 'copilot' && RR.Chat.root && RR.Chat.root.id === 'dock-body') RR.Chat.root.innerHTML = '';
    if (st.page !== 'copilot' && RR.Chat.root && RR.Chat.root.id === 'copilot-page') RR.Chat.root = null;
    placeChat(); RR.fitCharts();
  }

  const App = (RR.App = {
    go(page, o = {}) {
      if (!RR.pages[page]) page = 'overview';
      if (!mobile()) {
        if (RR.Chat.busy && page !== st.page && (st.page === 'copilot' || page === 'copilot')) { st.dock = true; }
        if (st.page === 'copilot' && page !== 'copilot') st.dock = o.keepDock || st.dock || RR.Chat.msgs.length > 0;
      } else st.dock = false;
      closeMore();
      st.page = page; $('app').classList.remove('side-open'); $('side-scrim').classList.remove('open');
      history.replaceState(null, '', '#' + page);
      render();
    },
    refresh() { render({ keepScroll: true }); },
    logsChanged() { $('logs').innerHTML = logsHTML(); },
    toast: (t, u) => RR.toast(t, u),
    /* every manual change goes through here → save, repaint, undoable toast */
    commit(text, snap) { RR.save(); App.refresh(); RR.toast(text, snap ? () => { RR.restore(snap); App.refresh(); RR.toast('Change undone'); } : null); },
    ask(q) {
      if (mobile() && st.page !== 'copilot') { App.go('copilot'); setTimeout(() => (q ? RR.Chat.send(q) : RR.Chat.focus()), 60); return; }
      if (st.page !== 'copilot' && !st.dock) { st.dock = true; render({ keepScroll: true }); }
      setTimeout(() => (q ? RR.Chat.send(q) : RR.Chat.focus()), 30);
    },
  });

  function billTableOnly() { const t = $('bill-table'); if (t) { t.innerHTML = RR.pages.billingTable(); RR.mountIso(t); } }

  function exportCSV() {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Invoice', 'Date', 'Patient', 'Department', 'Service', 'Payer', 'Amount', 'Insurer covers', 'Status', 'Paid on', 'Method']]
      
      .concat(RR.db.invoices.filter(i => RR.inPeriod(i.date)).map(i => [i.id, i.date, i.patient, i.dept, i.service, i.payer, i.amount, i.insurance, i.status, i.paidOn, i.method]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'rr-hospitals-bills-' + RR.period + '-' + RR.todayISO + '.csv'; a.click(); URL.revokeObjectURL(a.href);
    RR.toast((rows.length - 1) + ' bills exported');
  }

  function onClick(e) {
    const t = e.target.closest('button, tr[data-ask]'); if (!t) return;
    const d = t.dataset;
    if (t.closest('#dock-body, #copilot-page') && (d.ask || d.go || d.confirm || d.cancel || d.undo || t.hasAttribute('data-copy') || t.hasAttribute('data-retry'))) return; // chat handles its own
    if (d.nav) return App.go(d.nav);
    if (d.period) { RR.period = d.period; try { localStorage.setItem('rr-period', d.period); } catch (e) {} return App.refresh(); }
    if (d.log) { closeMore(); RR.Chat.open(d.log); if (st.page !== 'copilot') App.go('copilot'); else render({ keepScroll: true }); return; }
    if (d.logDel) { RR.Chat.removeLog(d.logDel); return App.logsChanged(); }
    if (d.ask) return App.ask(d.ask);
    if (d.billFilter) { S.billFilter = d.billFilter; S.billLimit = 40; document.querySelectorAll('[data-bill-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.billFilter === S.billFilter))); return billTableOnly(); }
    if (d.recFilter) { S.recFilter = d.recFilter; return App.refresh(); }
    if (d.paid) { const i = RR.db.invoices.find(x => x.id === d.paid), snap = RR.snapshot(); Object.assign(i, { status: 'paid', paidOn: RR.todayISO, method: i.insurance ? 'Insurance' : 'UPI' }); return App.commit(i.id + ' marked paid', snap); }
    if (d.void) { const i = RR.db.invoices.find(x => x.id === d.void), snap = RR.snapshot(); i.status = 'void'; return App.commit(i.id + ' voided', snap); }
    if (d.editInv) return RR.forms.invoice(d.editInv);
    if (d.billPatient) return RR.forms.invoice(null, d.billPatient);
    if (d.approve) { const x = RR.db.expenses.find(v => v.id === d.approve), snap = RR.snapshot(); x.status = 'approved'; return App.commit(x.id + ' approved', snap); }
    if (d.delExp) { const snap = RR.snapshot(); RR.db.expenses = RR.db.expenses.filter(v => v.id !== d.delExp); return App.commit(d.delExp + ' deleted', snap); }
    if (d.review) return RR.forms.paperReview(d.review);
    switch (d.act) {
      case 'more': return $('more').classList.contains('open') ? closeMore() : openMore();
      case 'new-chat': closeMore(); RR.Chat.reset(); if (st.page !== 'copilot' && !st.dock) App.go('copilot'); else App.logsChanged(); return;
      case 'ask': return App.ask();
      case 'dock': st.dock = !st.dock; render({ keepScroll: true }); return setTimeout(() => RR.fitCharts(), 320);
      case 'dock-close': st.dock = false; return render({ keepScroll: true });
      case 'menu': $('app').classList.add('side-open'); $('side-scrim').classList.add('open'); return;
      case 'new-invoice': return RR.forms.invoice();
      case 'new-expense': return RR.forms.expense();
      case 'new-patient': return RR.forms.patient();
      case 'new-paper': return RR.forms.paperNew();
      case 'export': return exportCSV();
      case 'digitise-clean': { const snap = RR.snapshot(); const ids = RR.db.paper.filter(p => p.status === 'pending' && !RR.parsePaper(p.text).missing.length).map(p => p.id); ids.forEach(id => RR.commitPaper(id)); return App.commit(ids.length + ' records digitised', snap); }
      case 'more-bills': S.billLimit += 40; return billTableOnly();
      case 'run-payroll': { const snap = RR.snapshot(), month = RR.todayISO.slice(0, 7); RR.db.runs.unshift({ month, date: RR.todayISO, total: RR.payrollMonthly(), staff: RR.db.staff.length }); return App.commit('Payroll run for ' + RR.db.staff.length + ' staff', snap); }
      case 'reset': closeMore(); if (confirm('Reset all demo data to the original sample? Your changes will be lost.')) { RR.reset(); RR.Chat.msgs = []; if (RR.Chat.root) RR.Chat.reset(); App.refresh(); RR.toast('Demo data reset'); } return;
    }
  }

  function init() {
    RR.load(); RR.save();
    try { const sp = localStorage.getItem('rr-period'); if (RR.PERIODS[sp]) RR.period = sp; } catch (e) {}
    RR.bindDrawer();
    document.addEventListener('click', onClick);
    $('side-scrim').onclick = () => { $('app').classList.remove('side-open'); $('side-scrim').classList.remove('open'); };
    let qT; document.addEventListener('input', e => { if (e.target.id === 'bill-q') { S.billQuery = e.target.value; S.billLimit = 40; clearTimeout(qT); qT = setTimeout(billTableOnly, 120); } });
    document.addEventListener('keydown', e => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === 'Escape') { if (closeMore()) return; if (RR.drawerOpen()) return RR.closeDrawer(); if ($('app').classList.contains('side-open')) return $('side-scrim').onclick(); }
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); st.page === 'copilot' ? RR.Chat.focus() : App.ask(); }
    });
    const h = location.hash.slice(1); st.page = RR.pages[h] && h !== 'billingTable' ? h : 'copilot';
    window.addEventListener('hashchange', () => { const n = location.hash.slice(1); if (RR.pages[n] && n !== 'billingTable' && n !== st.page) App.go(n); });
    /* sheet: swipe down to close; scrim closes either overlay */
    const sh = $('more'); let y0 = null, dy = 0;
    sh.addEventListener('touchstart', e => { if (sh.querySelector('.sheet-b').scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 80) closeMore(); y0 = null; });
    $('scrim').addEventListener('click', closeMore);
    /* hide the tab bar while typing on a phone so the keyboard has room */
    document.addEventListener('focusin', e => { if (mobile() && e.target.matches('textarea, input:not([type=checkbox]):not([type=radio]), select')) document.body.classList.add('typing'); });
    document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement || !document.activeElement.matches('textarea, input, select')) document.body.classList.remove('typing'); }, 60));
    matchMedia('(max-width: 860px)').addEventListener('change', () => { if (!mobile()) closeMore(); render({ keepScroll: true }); });
    render();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
