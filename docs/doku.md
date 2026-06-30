# StudyBuddy – Projektdokumentation

**Modul:** M426 – Scrum · **Klasse:** IA24a · **Team A:** Gianluca (PO), Eldi, Luis, Kerem, Pranav, Korel (Scrum Master)

## 1. Vision & Problem

**Vision:** StudyBuddy hilft Lernenden, passende Lernpartner:innen an der eigenen Schule zu finden, sich über ein persönliches Lernprofil zu präsentieren und sicher miteinander in Kontakt zu treten.

**Problem:** Lernende finden schwer heraus, wer in welchen Fächern Hilfe sucht oder anbietet.

**Zielgruppe:** Schüler:innen und Studierende, die Unterstützung suchen oder anbieten.

## 2. MVP-Abgrenzung

**Im MVP enthalten:** Registrieren & Login (A), Lernprofil erstellen (E), Profil bearbeiten/deaktivieren (C, B), Matching-Liste (G), Nachrichten (F).

**Bewusst nicht im MVP (später):** Profile sperren (I), Abo pausieren (D), Konto löschen (H).

**Definition of Done:** Akzeptanzkriterien erfüllt · Funktion lauffähig & demonstrierbar · Code im GitHub-Repo · im Team getestet · keine offensichtlichen Fehler.

## 3. Architektur

- Reines Frontend aus HTML, CSS und JavaScript ohne Framework.
- Datenhaltung mit **SQLite im Browser** (sql.js, WebAssembly). Bewusste Entscheidung gegen einen externen Server, damit die App ohne Installation überall lauffähig und sofort demonstrierbar ist.
- Datenmodell: Tabellen `users`, `strengths`, `weaknesses`, `messages`. Stärken und Schwächen liegen in eigenen Tabellen statt in einem Textfeld, damit das Matching sauber funktioniert.

## 4. Matching-Logik

Für jede andere aktive Person wird ein Punktwert berechnet: trifft eine eigene **Schwäche** auf eine **Stärke** der anderen Person, zählt das doppelt; ein gemeinsames Fach zählt einfach. Die Liste wird absteigend nach Punkten sortiert, sodass die hilfreichsten Lernpartner:innen oben stehen. Zusätzlich lässt sich nach einem einzelnen Fach filtern.

## 5. Iterative Verbesserungen aus dem Stakeholder-Feedback (Sprint 2)

Das Stakeholder-Team (Team D) bewertete das Inkrement in allen vier Bögen als „überzeugend“ (Ø 4,5–5,0 / 5). Daraus umgesetzt:

1. **Suchfunktion bei den Nachrichten** (häufigster Wunsch) – Suche nach Name und nach Nachrichteninhalt.
2. **Farbschema überarbeitet** – frischeres, farbenfroheres Design (Petrol + Koralle).
3. Grundlage gelegt für **Bearbeiten/Löschen von Einträgen**.

## 6. Sprints

- **Sprint 2:** Login, Profil erstellen/bearbeiten/deaktivieren. Ergänzend Matching-Liste und Nachrichten als Erweiterung gezeigt.
- **Sprint 3:** Matching als Kernfunktion (Punktesystem, Filter) und Nachrichten inkl. Suchfunktion aus dem Feedback.

## 7. Reflexion

Die Profil- und Login-Funktionen entstanden zuerst und bildeten die Grundlage für das Matching. Die grösste Lernerfahrung lag in realistischerer Planung (nur so viele Stories einplanen, wie „Done“ werden) und durchgängiger Dokumentation parallel zur Umsetzung. Die Entscheidung für sql.js machte die App jederzeit demonstrierbar, ohne Server-Setup.
