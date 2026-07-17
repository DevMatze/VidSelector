"use client";

import { useEffect, useState } from "react";
import { Award, Check, Heart, Sparkles, ThumbsDown } from "lucide-react";
import type { TasteProfile } from "@/lib/types";

interface Profile {
  name: string;
  createdAt: string;
  ratings: number;
  recommendations: number;
}

export function ProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProfile(data.profile);
        setName(data.profile.name);
        setTaste(data.taste);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Profil nicht verfügbar."));
  }, []);

  async function save() {
    setPending(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setProfile((current) => (current ? { ...current, name: json.profile.name } : current));
      setMessage("Gespeichert.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  if (error)
    return (
      <div className="page-shell">
        <div className="status-panel">
          <h2>Profil nicht verfügbar</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  if (!profile || !taste)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>Profil wird geladen …</p>
        </div>
      </div>
    );
  const memberSince = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    new Date(profile.createdAt),
  );
  return (
    <div className="page-shell profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{profile.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <p className="eyebrow">Dein Geschmacksprofil</p>
          <h1>{profile.name}</h1>
          <p className="lead">
            Mitglied seit {memberSince} · Dein Profil basiert auf {taste.ratingCount} Bewertungen.
          </p>
        </div>
      </div>
      <section className="profile-stats">
        <div>
          <Heart size={21} />
          <strong>{taste.positiveCount}</strong>
          <span>Gefällt mir</span>
        </div>
        <div>
          <ThumbsDown size={21} />
          <strong>{taste.negativeCount}</strong>
          <span>Nicht meins</span>
        </div>
        <div>
          <Sparkles size={21} />
          <strong>{profile.recommendations}</strong>
          <span>Vorschläge erstellt</span>
        </div>
        <div>
          <Award size={21} />
          <strong>{taste.ratingCount >= 10 ? "Stark" : taste.ratingCount >= 5 ? "Lernt" : "Neu"}</strong>
          <span>Profilreife</span>
        </div>
      </section>
      <div className="profile-layout">
        <section className="settings-card">
          <h2>Bevorzugte Richtungen</h2>
          {taste.preferredGenres.length ? (
            <div className="taste-list positive">
              {taste.preferredGenres.map((genre) => (
                <span key={genre}>
                  <Heart size={14} fill="currentColor" />
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">Bewerte Titel, um bevorzugte Genres zu erkennen.</p>
          )}
          <h2>Weniger passend</h2>
          {taste.avoidedGenres.length ? (
            <div className="taste-list negative">
              {taste.avoidedGenres.map((genre) => (
                <span key={genre}>
                  <ThumbsDown size={14} />
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">Noch keine wiederkehrenden Ausschlüsse erkannt.</p>
          )}
        </section>
        <section className="settings-card">
          <h2>Name</h2>
          <p className="muted">Dieser Name wird nur lokal auf diesem Gerät gespeichert.</p>
          <div className="name-row">
            <label className="sr-only" htmlFor="profile-name">
              Profilname
            </label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
            <button className="button primary" disabled={pending || !name.trim()} onClick={save}>
              <Check size={16} />
              {pending ? "Speichert …" : "Speichern"}
            </button>
          </div>
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
