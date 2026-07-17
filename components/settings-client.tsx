"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, ExternalLink, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";

export function SettingsClient() {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reset() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/profile", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage("Alle Bewertungen und der Empfehlungsverlauf wurden zurückgesetzt.");
      setConfirming(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Zurücksetzen fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="page-shell settings-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Lokal & privat</p>
          <h1>Einstellungen</h1>
          <p className="lead">Du behältst die Kontrolle über deine Daten und die Verbindung zu TMDB.</p>
        </div>
      </div>
      <div className="settings-stack">
        <section className="settings-card">
          <div className="setting-title">
            <Database size={21} />
            <div>
              <h2>TMDB-Verbindung</h2>
              <p>Die App ruft Filmdaten ausschließlich serverseitig über die offizielle TMDB-API ab.</p>
            </div>
          </div>
          <ol className="setup-list">
            <li>
              Erstelle bei{" "}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
                TMDB <ExternalLink size={13} />
              </a>{" "}
              einen kostenlosen API-Schlüssel.
            </li>
            <li>
              Trage bevorzugt das v4 Read Access Token als <code>TMDB_BEARER_TOKEN</code> in <code>.env</code> ein.
              Alternativ funktioniert <code>TMDB_API_KEY</code>.
            </li>
            <li>
              Setze <code>DEMO_MODE=false</code> und starte den Entwicklungsserver neu.
            </li>
          </ol>
          <p className="muted small">
            Ohne Schlüssel bleibt der sichere Demo-Katalog aktiv; kein Schlüssel wird jemals an den Browser übertragen.
          </p>
        </section>
        <section className="settings-card">
          <div className="setting-title">
            <ShieldCheck size={21} />
            <div>
              <h2>Datenschutz</h2>
              <p>
                Es gibt kein externes Nutzertracking und keine Anmeldung. Gespeichert werden dein lokaler Profilname,
                Bewertungen, der Empfehlungsverlauf und anonyme Anzeige-/Klicksignale für Empfehlungen in SQLite.
              </p>
            </div>
          </div>
          <Link className="text-link" href="/profile">
            Profil ansehen
          </Link>
        </section>
        <section className="settings-card">
          <div className="setting-title">
            <ExternalLink size={21} />
            <div>
              <h2>Datenquellen</h2>
              <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            </div>
          </div>
          <p className="muted small">
            Film- und Seriendaten stammen von TMDB. Angaben zur Streamingverfügbarkeit werden von JustWatch
            bereitgestellt und können sich ändern.
          </p>
          <a className="text-link" href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            The Movie Database besuchen <ExternalLink size={13} />
          </a>
        </section>
        <section className="settings-card destructive">
          <div className="setting-title">
            <TriangleAlert size={21} />
            <div>
              <h2>Profil zurücksetzen</h2>
              <p>
                Entfernt alle Bewertungen und den Empfehlungsverlauf. Die Filmdatenbank bleibt als lokaler Cache
                erhalten.
              </p>
            </div>
          </div>
          {confirming ? (
            <div className="confirm-row">
              <span>Wirklich alles zurücksetzen?</span>
              <button className="button danger" disabled={pending} onClick={reset}>
                Ja, zurücksetzen
              </button>
              <button className="button" disabled={pending} onClick={() => setConfirming(false)}>
                Abbrechen
              </button>
            </div>
          ) : (
            <button className="button danger" onClick={() => setConfirming(true)}>
              <RotateCcw size={16} />
              Profil zurücksetzen
            </button>
          )}
          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
