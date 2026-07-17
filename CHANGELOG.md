# Changelog

Alle wesentlichen Änderungen an VidSelector werden in diesem Dokument festgehalten. Das Format orientiert sich an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/); die Versionierung folgt
[Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [0.2.0] – 2026-07-18

### Hinzugefügt

- Persönliche Merkliste mit den voneinander getrennten Statuswerten „Möchte ich sehen“, „Angefangen“, „Gesehen“ und
  „Abgebrochen“.
- Eigene Merkliste mit Suche, Typ-, Status- und Sortierfiltern für Filme und Serien.
- Versionierter JSON-Export für Profilname, Bewertungen und Merkliste ohne Poster oder ausführliche TMDB-Metadaten.
- Validierter Profilimport mit den Modi „Zusammenführen“ und „Ersetzen“.
- Automatische lokale Profilsicherungen sowie zusätzliche Sicherungen vor Import und Profilrücksetzung.
- Konsistente SQLite-Sicherung vor Datenbankmigrationen über `npm run db:backup`.
- Dauerhafte Aktion „Nicht interessiert“, ohne dadurch das gesamte Genre negativ zu bewerten.
- Getrennte Erfassung von angezeigten, angeklickten, übersprungenen und später bewerteten Empfehlungen.
- Transparente, begrenzte Rückkopplung erfolgreicher Empfehlungsquellen in das regelbasierte Ranking.
- Zusätzliche Unit-, Komponenten-, API- und Validierungstests für Karussells, Merkliste, Profiltransfer und Feedback.

### Geändert

- „Weitere passende Titel“ wurde in „Top-Auswahl für dich“ umbenannt und eindeutig von Film-, Serien- und
  Entdeckungskategorien abgegrenzt.
- Titel werden auf der Startseite nur noch einer Empfehlungsrubrik zugeordnet und dadurch nicht mehrfach angezeigt.
- Wiederholt ignorierte oder übersprungene Titel werden vorsichtig herabgestuft; Klicks liefern lediglich ein schwaches
  Interessenssignal und ersetzen keine Bewertung.
- Als gesehen oder abgebrochen markierte Titel werden nicht mehr als neue Empfehlung behandelt.
- Profilstatistiken zeigen zusätzlich Merkliste und später bewertete Empfehlungen.
- Das Zurücksetzen des Profils umfasst nun Bewertungen, Merkliste und Empfehlungsverlauf und erstellt vorher eine
  Sicherung.

### Performance

- Karussells rendern nur noch die aktuelle Gruppe von fünf Titeln statt aller unsichtbaren Karten.
- „Siehe mehr“- und Bibliothekslisten beginnen mit 20 Titeln pro Medientyp und laden weitere Einträge kontrolliert in
  20er-Schritten.
- Die Zahl gleichzeitig erzeugter Medienkarten und DOM-Knoten auf der Startseite wurde deutlich reduziert.

### Datenhaltung und Sicherheit

- Merkeinträge schützen zugehörige Medien beim Ablauf des lokalen TMDB-Caches vor versehentlichem Löschen.
- Importdateien werden gegen ein explizites, versionsgebundenes Schema validiert.
- Automatische Backups werden lokal mit eingeschränkten Dateirechten gespeichert und niemals in Git aufgenommen.
- Schreibende Merkliste- und Importanfragen verwenden Herkunftsprüfung, Eingabevalidierung und Ratenbegrenzung.

### Dokumentation

- README um Merkliste, Backups, Feedbacksignale, neue Befehle und die eindeutige Kategorieaufteilung erweitert.
- Transparenzhinweis ergänzt: VidSelector wurde mit Unterstützung generativer KI entwickelt; Prüfung, Auswahl und
  Verantwortung für den veröffentlichten Stand liegen beim Maintainer.

## [0.1.0] – 2026-07-17

### Hinzugefügt

- Erste öffentliche Version mit lokaler Film- und Serienbewertung.
- Transparente, regelbasierte Empfehlungen auf Basis von Genres, Sprache, Jahrzehnt, beteiligten Personen und ähnlichen
  Titeln.
- Getrennte Film- und Serienbereiche, Anime-Facette, Suche, Bibliothek, Detailseiten und Streaminghinweise für
  Deutschland.
- Local-first-TMDB-Cache mit SQLite und maximaler Speicherdauer von 180 Tagen.
- Responsive Netflix-inspirierte Karussells und eigene „Siehe mehr“-Seiten.
- GitHub Actions, Dependabot, Security-Dokumentation, systemd-Benutzerservice und Demo-Modus.

[Unreleased]: https://github.com/DevMatze/VidSelector/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/DevMatze/VidSelector/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/DevMatze/VidSelector/releases/tag/v0.1.0
