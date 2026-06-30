/* ===========================================================
   StudyBuddy · db.js
   In-Browser-SQLite über sql.js. Erstellt das Schema und
   befüllt es mit fünf Demo-Nutzer:innen.
   Bewusste Entscheidung (siehe Review-Protokoll): eigene
   Tabellen strengths / weaknesses statt eines Textfelds,
   damit sauberes Matching möglich ist.
   =========================================================== */

const DB = (() => {
  let db = null;

  // Demo-Konten – Passwort für alle: demo123
  const SEED_USERS = [
    { username: 'lena',  name: 'Lena Bühler',   class: 'IA24a', strengths: ['Mathe', 'Physik'],        weaknesses: ['Französisch'] },
    { username: 'jonas', name: 'Jonas Frei',    class: 'IA24b', strengths: ['Französisch', 'Englisch'], weaknesses: ['Mathe'] },
    { username: 'mira',  name: 'Mira Kuster',   class: 'IA24a', strengths: ['Geschichte', 'Deutsch'],   weaknesses: ['Physik'] },
    { username: 'sven',  name: 'Sven Aebi',     class: 'IA24c', strengths: ['Physik', 'Chemie'],        weaknesses: ['Deutsch'] },
    { username: 'aylin', name: 'Aylin Demir',   class: 'IA24b', strengths: ['Mathe', 'Informatik'],     weaknesses: ['Geschichte'] },
  ];

  async function init() {
    const SQL = await initSqlJs({
      locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
    });
    db = new SQL.Database();
    createSchema();
    seed();
    return db;
  }

  function createSchema() {
    db.run(`
      CREATE TABLE users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        username  TEXT UNIQUE NOT NULL,
        password  TEXT NOT NULL,
        name      TEXT NOT NULL,
        class     TEXT,
        active    INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE strengths (
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE weaknesses (
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE messages (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        from_id   INTEGER NOT NULL,
        to_id     INTEGER NOT NULL,
        body      TEXT NOT NULL,
        ts        INTEGER NOT NULL
      );
    `);
  }

  function seed() {
    SEED_USERS.forEach(u => {
      db.run('INSERT INTO users (username, password, name, class) VALUES (?, ?, ?, ?)',
        [u.username, 'demo123', u.name, u.class]);
      const id = lastId();
      u.strengths.forEach(s => db.run('INSERT INTO strengths (user_id, subject) VALUES (?, ?)', [id, s]));
      u.weaknesses.forEach(w => db.run('INSERT INTO weaknesses (user_id, subject) VALUES (?, ?)', [id, w]));
    });
    // ein paar Demo-Nachrichten, damit der Chat nicht leer ist
    seedMessage('jonas', 'lena', 'Hey Lena, hilfst du mir in Mathe?');
    seedMessage('lena', 'jonas', 'Klar! Dafür zeigst du mir Französisch :)');
  }

  function seedMessage(fromU, toU, body) {
    const f = userByName(fromU), t = userByName(toU);
    if (f && t) db.run('INSERT INTO messages (from_id, to_id, body, ts) VALUES (?, ?, ?, ?)',
      [f.id, t.id, body, Date.now()]);
  }

  function lastId() {
    const r = db.exec('SELECT last_insert_rowid() AS id');
    return r[0].values[0][0];
  }

  // --- kleine Helfer, die rows als Objekte zurückgeben ---
  function query(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }
  function run(sql, params = []) { db.run(sql, params); }

  function userByName(username) {
    return query('SELECT * FROM users WHERE username = ?', [username])[0] || null;
  }
  function subjectsFor(table, userId) {
    return query(`SELECT subject FROM ${table} WHERE user_id = ?`, [userId]).map(r => r.subject);
  }

  // raw exec für die SQL-Konsole (Demo)
  function exec(sql) { return db.exec(sql); }

  return { init, query, run, userByName, subjectsFor, exec };
})();
