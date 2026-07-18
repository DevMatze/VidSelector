# Zu VidSelector beitragen

Danke für dein Interesse an VidSelector. Das Projekt ist eine lokale Einzelplatz-Anwendung und ein persönliches Hobbyprojekt. Kleine, klar abgegrenzte Verbesserungen und gut nachvollziehbare Fehlerberichte sind willkommen.

## Vor einer Änderung

- Suche in den vorhandenen Issues, ob das Thema bereits gemeldet wurde.
- Erstelle für größere Änderungen zunächst ein Feature-Issue und beschreibe Problem, Nutzen und geplanten Umfang.
- Sicherheitslücken und personenbezogene Daten gehören nicht in öffentliche Issues. Folge stattdessen der [Sicherheitsrichtlinie](SECURITY.md).
- Beachte den [Verhaltenskodex](CODE_OF_CONDUCT.md).

## Lokale Entwicklung

Vorausgesetzt werden Node.js 20 oder neuer und npm.

```bash
git clone https://github.com/DevMatze/VidSelector.git
cd VidSelector
npm install
cp .env.example .env
npm run setup
npm run dev
```

Ohne TMDB-Zugangsdaten läuft die Anwendung automatisch mit dem Demo-Katalog. Echte Tokens, lokale Datenbanken, Backups und `.env`-Dateien dürfen nicht committed werden.

## Änderungen einreichen

1. Erstelle einen aussagekräftig benannten Branch.
2. Halte die Änderung fokussiert und ergänze bei Verhaltensänderungen passende Tests und Dokumentation.
3. Verwende verständliche Commit-Nachrichten und keine personenbezogenen Daten in Autorenname, Nachricht oder Dateien.
4. Führe vor dem Pull Request mindestens die relevanten Prüfungen aus:

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
```

Bei Änderungen an Oberfläche, Build oder Browser-Verhalten können zusätzlich `npm run test:e2e` und `npm run build` erforderlich sein.

5. Fülle die Pull-Request-Vorlage vollständig aus. Screenshots sind bei sichtbaren UI-Änderungen hilfreich, dürfen aber keine privaten Profile, Tokens oder lokalen Daten zeigen.

## Pull-Request-Prüfung

Ein Beitrag sollte:

- das beschriebene Problem lösen, ohne unnötige Nebenänderungen;
- bestehende Architektur-, Datenschutz- und Local-first-Grundsätze respektieren;
- Tests und Dokumentation aktuell halten;
- alle automatischen Prüfungen bestehen.

Der Maintainer kann Änderungen oder eine kleinere Aufteilung vorschlagen. Es besteht kein Anspruch auf Aufnahme eines Beitrags.
