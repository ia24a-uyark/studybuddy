# StudyBuddy

Eine Web-App, mit der Lernende passende **Lernpartner:innen an der eigenen Schule** finden. Nutzer:innen erstellen ein Lernprofil mit ihren Stärken und Schwächen, bekommen eine sortierte Matching-Liste vorgeschlagen und können einander Nachrichten schreiben.

Entwickelt im Modul **M426 (Scrum)**, Klasse IA24a, von **Team A**: Gianluca, Eldi, Luis, Kerem, Pranav, Korel.

---

## Funktionen (MVP)

| ID | User Story | Status |
|----|------------|--------|
| A | Login – sicher anmelden | ✅ |
| E | Lernprofil erstellen (Name, Klasse, Stärken, Schwächen) | ✅ |
| C | Profil bearbeiten | ✅ |
| B | Profil temporär deaktivieren | ✅ |
| G | Matching-Liste anzeigen (+ Filter nach Fach) | ✅ |
| F | Nachrichten senden (+ Suche) | ✅ |

Aus dem **Stakeholder-Feedback (Sprint 2)** zusätzlich umgesetzt: Suchfunktion bei den Nachrichten und ein überarbeitetes, farbenfroheres Design.

## Technik

- **HTML / CSS / JavaScript** ohne Framework
- **SQLite im Browser** über [sql.js](https://sql.js.org) – läuft komplett ohne Server
- Eigene Tabellen `strengths` / `weaknesses` für sauberes Matching
- **Matching-Logik:** Punktesystem – eine eigene Schwäche, die zur Stärke einer anderen Person passt, zählt doppelt; ein gemeinsames Fach zählt einfach. Die Liste wird nach Punkten sortiert.

## Starten

Da sql.js per WebAssembly lädt, sollte die App über einen lokalen Webserver geöffnet werden (nicht per Doppelklick auf die Datei):

```bash
cd src
python3 -m http.server 8000
```

Dann im Browser öffnen: <http://localhost:8000>

## Demo-Konten

| Benutzername | Passwort |
|--------------|----------|
| lena, jonas, mira, sven, aylin | `demo123` |

Über die **SQL-Konsole** (Link unten in der App) lässt sich live zeigen, dass echte SQL-Abfragen gegen die Datenbank laufen – z. B. `SELECT username, name, class FROM users;`

## Projektstruktur

```
studybuddy/
├── src/
│   ├── index.html      # App-Shell & Views
│   ├── styles.css      # Design / Farbschema
│   ├── db.js           # SQLite-Schema + Seed-Daten
│   └── app.js          # Login, Profil, Matching, Nachrichten
├── docs/
│   └── doku.md         # Projektdokumentation
├── LICENSE
└── README.md
```

## Lizenz

MIT – siehe [LICENSE](LICENSE).
