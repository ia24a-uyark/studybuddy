/* ===========================================================
   StudyBuddy · app.js
   Steuert Views und alle MVP-User-Stories:
   A Login · E Profil erstellen · C Profil bearbeiten ·
   B Profil deaktivieren · G Matching (+Filter) · F Nachrichten (+Suche)
   =========================================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  bindAuth();
  bindNav();
  bindProfile();
  bindMessages();
  bindMatchingFilter();
  bindSqlConsole();
});

/* ---------------- Auth (Story A) ---------------- */
function bindAuth() {
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function login() {
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const rows = DB.query('SELECT * FROM users WHERE username = ? AND password = ?', [u, p]);
  if (rows.length === 0) {
    err.textContent = 'Benutzername oder Passwort stimmt nicht.';
    err.hidden = false;
    return;
  }
  err.hidden = true;
  currentUser = rows[0];
  document.getElementById('topbar').hidden = false;
  document.getElementById('navUserName').textContent = currentUser.name;
  showView('matching');
}

function logout() {
  currentUser = null;
  document.getElementById('topbar').hidden = true;
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  showView('login');
}

/* ---------------- Navigation ---------------- */
function bindNav() {
  document.querySelectorAll('.nav-link').forEach(b =>
    b.addEventListener('click', () => showView(b.dataset.view)));
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.hidden = true);
  const el = document.getElementById('view-' + name);
  if (el) el.hidden = false;
  document.querySelectorAll('.nav-link').forEach(b =>
    b.classList.toggle('active', b.dataset.view === name));
  if (name === 'matching') renderMatching();
  if (name === 'messages') renderThreadList();
  if (name === 'profile')  loadProfile();
}

/* ---------------- Profile (Stories E, C, B) ---------------- */
function bindProfile() {
  document.getElementById('pfSave').addEventListener('click', saveProfile);
  document.getElementById('pfToggle').addEventListener('click', toggleActive);
}

function loadProfile() {
  document.getElementById('pfName').value = currentUser.name;
  document.getElementById('pfClass').value = currentUser.class || '';
  document.getElementById('pfStrengths').value = DB.subjectsFor('strengths', currentUser.id).join(', ');
  document.getElementById('pfWeak').value = DB.subjectsFor('weaknesses', currentUser.id).join(', ');
  renderActiveState();
}

function saveProfile() {
  const name = document.getElementById('pfName').value.trim();
  const klass = document.getElementById('pfClass').value.trim();
  const strengths = splitSubjects(document.getElementById('pfStrengths').value);
  const weak = splitSubjects(document.getElementById('pfWeak').value);

  DB.run('UPDATE users SET name = ?, class = ? WHERE id = ?', [name, klass, currentUser.id]);
  DB.run('DELETE FROM strengths WHERE user_id = ?', [currentUser.id]);
  DB.run('DELETE FROM weaknesses WHERE user_id = ?', [currentUser.id]);
  strengths.forEach(s => DB.run('INSERT INTO strengths (user_id, subject) VALUES (?, ?)', [currentUser.id, s]));
  weak.forEach(w => DB.run('INSERT INTO weaknesses (user_id, subject) VALUES (?, ?)', [currentUser.id, w]));

  currentUser.name = name;
  currentUser.class = klass;
  document.getElementById('navUserName').textContent = name;
  flash('Profil gespeichert.', 'ok');
}

function toggleActive() {
  const newState = currentUser.active ? 0 : 1;
  DB.run('UPDATE users SET active = ? WHERE id = ?', [newState, currentUser.id]);
  currentUser.active = newState;
  renderActiveState();
}

function renderActiveState() {
  const btn = document.getElementById('pfToggle');
  if (currentUser.active) {
    btn.textContent = 'Profil deaktivieren';
  } else {
    btn.textContent = 'Profil wieder aktivieren';
    flash('Dein Profil ist deaktiviert – du wirst niemandem vorgeschlagen.', 'off');
  }
}

function flash(msg, kind) {
  const s = document.getElementById('pfStatus');
  s.textContent = msg;
  s.className = 'profile-status ' + kind;
  s.hidden = false;
}

function splitSubjects(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

/* ---------------- Matching (Story G + Filter) ---------------- */
function bindMatchingFilter() {
  document.getElementById('matchFilter').addEventListener('change', renderMatching);
}

/* Punktesystem: eigene Schwäche <-> fremde Stärke zählt doppelt,
   gemeinsame Stärke zählt einfach. (siehe Review-Protokoll) */
function scoreFor(otherId, myStrengths, myWeak) {
  const theirStrengths = DB.subjectsFor('strengths', otherId);
  let score = 0;
  theirStrengths.forEach(s => {
    if (myWeak.includes(s)) score += 2;
    if (myStrengths.includes(s)) score += 1;
  });
  return score;
}

function renderMatching() {
  const grid = document.getElementById('matchGrid');
  const empty = document.getElementById('matchEmpty');
  grid.innerHTML = '';

  const myStrengths = DB.subjectsFor('strengths', currentUser.id);
  const myWeak = DB.subjectsFor('weaknesses', currentUser.id);
  const filter = document.getElementById('matchFilter').value;

  populateFilterOptions();

  // nur aktive, andere Nutzer:innen
  const others = DB.query('SELECT * FROM users WHERE id != ? AND active = 1', [currentUser.id]);
  let list = others.map(u => ({
    user: u,
    score: scoreFor(u.id, myStrengths, myWeak),
    strengths: DB.subjectsFor('strengths', u.id),
    weaknesses: DB.subjectsFor('weaknesses', u.id),
  }));

  if (filter) list = list.filter(x => x.strengths.includes(filter) || x.weaknesses.includes(filter));
  list.sort((a, b) => b.score - a.score);

  if (list.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  list.forEach(x => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.innerHTML = `
      <span class="match-score">${x.score} Punkte Übereinstimmung</span>
      <h3>${escapeHtml(x.user.name)}</h3>
      <p class="match-class">${escapeHtml(x.user.class || '')}</p>
      <div class="tag-row">
        ${x.strengths.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}
        ${x.weaknesses.map(w => `<span class="tag tag--weak">braucht: ${escapeHtml(w)}</span>`).join('')}
      </div>
      <button class="btn btn-ghost" data-msg="${x.user.id}">Nachricht schreiben</button>`;
    card.querySelector('[data-msg]').addEventListener('click', () => openThread(x.user.id));
    grid.appendChild(card);
  });
}

function populateFilterOptions() {
  const sel = document.getElementById('matchFilter');
  const current = sel.value;
  const subjects = DB.query('SELECT DISTINCT subject FROM strengths UNION SELECT DISTINCT subject FROM weaknesses ORDER BY subject')
    .map(r => r.subject);
  sel.innerHTML = '<option value="">Alle Fächer</option>' +
    subjects.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  sel.value = current;
}

/* ---------------- Messages (Story F + Suche) ---------------- */
let activeThread = null;

function bindMessages() {
  document.getElementById('msgSend').addEventListener('click', sendMessage);
  document.getElementById('msgInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  document.getElementById('msgSearch').addEventListener('input', renderThreadList);
}

function renderThreadList() {
  const list = document.getElementById('threadList');
  const term = document.getElementById('msgSearch').value.trim().toLowerCase();
  list.innerHTML = '';

  // alle anderen Nutzer:innen als mögliche Gesprächspartner
  let users = DB.query('SELECT * FROM users WHERE id != ?', [currentUser.id]);

  // Suche: nach Name ODER nach Nachrichteninhalt (Feedback-Wunsch)
  if (term) {
    const matchIds = new Set(
      DB.query(`SELECT DISTINCT u.id FROM users u
                JOIN messages m ON (m.from_id = u.id OR m.to_id = u.id)
                WHERE (m.from_id = ? OR m.to_id = ?) AND LOWER(m.body) LIKE ?`,
        [currentUser.id, currentUser.id, '%' + term + '%']).map(r => r.id)
    );
    users = users.filter(u => u.name.toLowerCase().includes(term) || matchIds.has(u.id));
  }

  users.forEach(u => {
    const last = DB.query(
      `SELECT body FROM messages
       WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
       ORDER BY ts DESC LIMIT 1`,
      [currentUser.id, u.id, u.id, currentUser.id])[0];
    const li = document.createElement('li');
    li.innerHTML = `${escapeHtml(u.name)}<small>${last ? escapeHtml(last.body) : 'Noch keine Nachrichten'}</small>`;
    if (activeThread === u.id) li.classList.add('active');
    li.addEventListener('click', () => openThread(u.id));
    list.appendChild(li);
  });
}

function openThread(userId) {
  showView('messages');
  activeThread = userId;
  const partner = DB.query('SELECT * FROM users WHERE id = ?', [userId])[0];
  document.getElementById('threadHead').textContent = partner.name;
  document.getElementById('threadCompose').hidden = false;
  renderThreadList();
  renderThread();
}

function renderThread() {
  const body = document.getElementById('threadBody');
  body.innerHTML = '';
  if (!activeThread) return;
  const msgs = DB.query(
    `SELECT * FROM messages
     WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
     ORDER BY ts ASC`,
    [currentUser.id, activeThread, activeThread, currentUser.id]);
  msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = 'bubble ' + (m.from_id === currentUser.id ? 'bubble--out' : 'bubble--in');
    div.textContent = m.body;
    body.appendChild(div);
  });
  body.scrollTop = body.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !activeThread) return;
  DB.run('INSERT INTO messages (from_id, to_id, body, ts) VALUES (?, ?, ?, ?)',
    [currentUser.id, activeThread, text, Date.now()]);
  input.value = '';
  renderThread();
  renderThreadList();
}

/* ---------------- SQL console (Demo) ---------------- */
function bindSqlConsole() {
  document.getElementById('sqlToggle').addEventListener('click', () => showView('sql'));
  document.getElementById('sqlRun').addEventListener('click', runSql);
}

function runSql() {
  const sql = document.getElementById('sqlInput').value;
  const out = document.getElementById('sqlResult');
  try {
    const res = DB.exec(sql);
    if (res.length === 0) { out.innerHTML = '<p class="empty">Abfrage ausgeführt – keine Ergebnisse.</p>'; return; }
    const { columns, values } = res[0];
    out.innerHTML = `<table>
      <thead><tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
      <tbody>${values.map(row => `<tr>${row.map(v => `<td>${escapeHtml(String(v))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  } catch (e) {
    out.innerHTML = `<p class="empty">Fehler: ${escapeHtml(e.message)}</p>`;
  }
}

/* ---------------- Util ---------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
