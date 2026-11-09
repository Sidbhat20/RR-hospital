/* ============================================================
   RR Hospitals — chat engine
   Type → answer. Answers are short text; charts and tables only
   appear when asked for. Action cards change data only after you
   confirm, and every change can be undone. Conversations are
   kept as logs (localStorage) and listed in the sidebar.
   Runs fully in the browser — no model API is called.
   ============================================================ */
(function () {
  const RR = window.RR;
  const { icon, esc, md } = RR;
  const LOG_KEY = 'rr-hospitals-logs-v1';

  const Chat = (RR.Chat = { msgs: [], busy: false, root: null, compact: false, logId: null });
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, reduce() ? 0 : ms));
  let actionSeq = 0;

  /* ---------------- logs ---------------- */
  const readLogs = () => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; } };
  const writeLogs = l => { try { localStorage.setItem(LOG_KEY, JSON.stringify(l.slice(0, 40))); } catch (e) {} };
  Chat.logs = () => readLogs();
  function saveLog() {
    if (!Chat.msgs.length) return;
    const logs = readLogs(), first = Chat.msgs.find(m => m.role === 'user');
    const entry = { id: Chat.logId || (Chat.logId = 'c' + Date.now()), title: first ? first.text.slice(0, 60) : 'Chat', at: Date.now(),
      msgs: Chat.msgs.map(m => (m.role === 'user' ? { role: 'user', text: m.text } : { role: 'ai', id: m.id, text: m.text, blocks: (m.blocks || []).filter(b => !b.action).map(b => ({ html: b.html })) })) };
    const i = logs.findIndex(l => l.id === entry.id);
    if (i >= 0) logs.splice(i, 1);
    logs.unshift(entry); writeLogs(logs);
    if (RR.App && RR.App.logsChanged) RR.App.logsChanged();
  }
  Chat.open = function (id) {
    if (Chat.busy) return;
    const l = readLogs().find(x => x.id === id); if (!l) return;
    if (RR.chatCtx) RR.chatCtx.topic = null; Chat.logId = l.id; Chat.msgs = l.msgs.map(m => Object.assign({}, m));
    if (Chat.root) renderAll();
  };
  Chat.removeLog = id => { writeLogs(readLogs().filter(l => l.id !== id)); if (Chat.logId === id) Chat.reset(); };
  Chat.clearLogs = () => { writeLogs([]); };

  /* ---------------- mount ---------------- */
  Chat.mount = function (root, compact) {
    Chat.root = root; Chat.compact = !!compact;
    root.innerHTML = `<div class="chat"><div class="thread"><div class="thread-in" aria-live="polite"></div></div>
      <div class="composer-wrap"><form class="composer"><label class="sr" for="cin-${compact ? 'd' : 'p'}">Message</label>
        <textarea id="cin-${compact ? 'd' : 'p'}" rows="1" placeholder="Ask anything…" autocomplete="off"></textarea>
        <button class="send" type="submit" aria-label="Send" disabled>${icon('send')}</button></form></div></div>`;
    if (!root._chatBound) { root._chatBound = true; root.addEventListener('click', onClick); }
    bindComposer(root);
    renderAll(); RR.fitCharts(root); requestAnimationFrame(scrollEnd);
  };
  function bindComposer(root) {
    const ta = root.querySelector('textarea'), btn = root.querySelector('.send');
    const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(180, ta.scrollHeight) + 'px'; btn.disabled = !ta.value.trim() || Chat.busy; };
    ta.addEventListener('input', fit);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); root.querySelector('form').requestSubmit(); } });
    root.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const v = ta.value.trim(); if (!v || Chat.busy) return; ta.value = ''; fit(); Chat.send(v); });
  }
  Chat.focus = () => { const t = Chat.root && Chat.root.querySelector('textarea'); if (t) t.focus(); };
  Chat.reset = () => { if (Chat.busy) return; Chat.msgs = []; if (RR.chatCtx) RR.chatCtx.topic = null; Chat.logId = null; if (Chat.root) renderAll(); Chat.focus(); if (RR.App && RR.App.logsChanged) RR.App.logsChanged(); };

  const threadEl = () => Chat.root.querySelector('.thread-in');
  function scrollEnd() { const t = Chat.root && Chat.root.querySelector('.thread'); if (t) t.scrollTop = t.scrollHeight; }

  function helloHTML() {
    const h = new Date().getHours();
    return `<div class="hello"><h1>${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}, Asim</h1></div>`;
  }

  function renderAll() {
    const el = threadEl(), empty = !Chat.msgs.length;
    Chat.root.querySelector('.chat').classList.toggle('is-empty', empty);
    if (empty) { el.innerHTML = helloHTML(); return; }
    el.innerHTML = '';
    Chat.msgs.forEach(m => el.appendChild(m.role === 'user' ? userNode(m) : aiNode(m, true)));
    el.querySelectorAll('.msg-user, .msg-ai, .block').forEach(n => (n.style.animation = 'none'));
    RR.countUp(el); RR.fitCharts(el);
    requestAnimationFrame(scrollEnd);
  }

  function userNode(m) { const d = document.createElement('div'); d.className = 'msg-user'; d.textContent = m.text; return d; }
  function aiNode(m, full) {
    const d = document.createElement('div'); d.className = 'msg-ai'; d.dataset.mid = m.id;
    d.innerHTML = '<div class="msg-body"></div>';
    if (full) fillAI(d.querySelector('.msg-body'), m);
    return d;
  }
  function fillAI(body, m) {
    body.innerHTML = `<div class="msg-text">${m.text.map(p => `<p>${md(p)}</p>`).join('')}</div>`;
    (m.blocks || []).forEach(b => body.insertAdjacentHTML('beforeend', blockHTML(b)));
    body.insertAdjacentHTML('beforeend', toolsHTML());
  }
  const toolsHTML = () => `<div class="msg-tools"><button class="icon-btn" data-copy title="Copy" aria-label="Copy answer">${icon('copy')}</button></div>`;

  function blockHTML(b) {
    if (!b.action) return b.html;
    const a = b.action;
    const foot = a.state === 'done'
      ? `<span class="act-state">${icon('check')}${esc(a.result.text)}</span><span class="sp"></span>${a.result.go ? `<button class="btn btn-ghost btn-sm" data-go="${a.result.go}">View</button>` : ''}<button class="btn btn-ghost btn-sm" data-undo="${a.id}">Undo</button>`
      : a.state === 'cancelled' ? `<span class="act-state">Cancelled</span>`
      : a.state === 'undone' ? `<span class="act-state">Undone</span>`
      : `<button class="btn ${a.danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-confirm="${a.id}">${esc(a.confirm)}</button><button class="btn btn-ghost btn-sm" data-cancel="${a.id}">Cancel</button>`;
    return `<div class="block act" data-act="${a.id}"><div class="block-h"><b>${esc(a.title)}</b></div>
      <dl class="act-rows">${a.rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl><div class="act-foot">${foot}</div></div>`;
  }
  function findAction(id) { for (const m of Chat.msgs) for (const b of m.blocks || []) if (b.action && b.action.id === id) return b.action; return null; }
  function repaintAction(a) { const el = Chat.root.querySelector(`[data-act="${a.id}"]`); if (el) { el.outerHTML = blockHTML({ action: a }); const n = Chat.root.querySelector(`[data-act="${a.id}"]`); if (n) n.style.animation = 'none'; } }

  function onClick(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.go) return RR.App.go(t.dataset.go, { keepDock: true });
    if (t.dataset.confirm) {
      const a = findAction(t.dataset.confirm); if (!a || a.state) return;
      a.snap = RR.snapshot(); a.result = a.run(); a.state = 'done'; RR.save(); repaintAction(a); RR.App.refresh(); RR.App.toast(a.result.text);
      return;
    }
    if (t.dataset.cancel) { const a = findAction(t.dataset.cancel); if (a && !a.state) { a.state = 'cancelled'; repaintAction(a); } return; }
    if (t.dataset.undo) { const a = findAction(t.dataset.undo); if (a && a.state === 'done') { RR.restore(a.snap); a.state = 'undone'; repaintAction(a); RR.App.refresh(); RR.App.toast('Change undone'); } return; }
    if (t.hasAttribute('data-copy')) {
      const m = Chat.msgs.find(x => x.id === +t.closest('.msg-ai').dataset.mid);
      if (m && navigator.clipboard) navigator.clipboard.writeText(m.text.join('\n\n').replace(/\*\*/g, '')).then(() => RR.App.toast('Copied'));
    }
  }

  function tokens(s) {
    const out = [];
    s.split(/(\*\*.+?\*\*)/).forEach(seg => { if (!seg) return; const b = seg.startsWith('**') && seg.endsWith('**'); (b ? seg.slice(2, -2) : seg).split(/(\s+)/).forEach(w => w && out.push({ w, b })); });
    return out;
  }

  Chat.send = async function (text) {
    if (Chat.busy || !Chat.root) return;
    Chat.busy = true; Chat.root.querySelector('.send').disabled = true;
    const el = threadEl();
    if (!Chat.msgs.length) { el.innerHTML = ''; Chat.root.querySelector('.chat').classList.remove('is-empty'); }
    const u = { role: 'user', text }; Chat.msgs.push(u); el.appendChild(userNode(u)); scrollEnd();

    const node = aiNode({ id: 0 }, false); el.appendChild(node);
    const body = node.querySelector('.msg-body');
    body.innerHTML = '<div class="thinking" aria-label="Working"><i></i><i></i><i></i></div>'; scrollEnd();
    let res;
    try { res = RR.route(text); } catch (err) { console.error(err); res = { text: ['Something went wrong reading the ledger. Try rephrasing.'] }; }
    const m = { role: 'ai', id: Date.now(), text: res.text, blocks: (res.blocks || []).map(b => (b.action ? { action: Object.assign(b.action, { id: 'a' + ++actionSeq }) } : b)) };
    node.dataset.mid = m.id;
    await sleep(260);

    body.innerHTML = '<div class="msg-text"></div>';
    const tx = body.firstChild;
    const all = m.text.map(tokens), n = all.reduce((s, p) => s + p.length, 0);
    const step = Math.max(6, Math.min(18, 700 / Math.max(1, n)));
    for (const para of all) {
      const p = document.createElement('p'); tx.appendChild(p);
      for (let i = 0; i < para.length; i += 3) {
        para.slice(i, i + 3).forEach(t => p.insertAdjacentHTML('beforeend', t.b ? `<b>${esc(t.w)}</b>` : esc(t.w)));
        if (!reduce()) await sleep(step);
      }
    }
    for (const b of m.blocks) { body.insertAdjacentHTML('beforeend', blockHTML(b)); RR.countUp(body); RR.fitCharts(body); RR.mountIso(body); }
    body.insertAdjacentHTML('beforeend', toolsHTML());
    Chat.msgs.push(m); scrollEnd();
    Chat.busy = false; saveLog();
    const ta = Chat.root.querySelector('textarea'); Chat.root.querySelector('.send').disabled = !ta.value.trim();
  };
})();
