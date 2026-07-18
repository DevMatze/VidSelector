"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Library, Search, SlidersHorizontal } from "lucide-react";
import type { RatingRecord } from "@/lib/types";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";

interface Payload {
  ratings: RatingRecord[];
  genres: string[];
  totalRatings: number;
}

export function LibraryClient() {
  const [data, setData] = useState<Payload>({ ratings: [], genres: [], totalRatings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ query: "", value: "", type: "", genre: "", sort: "newest" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const response = await fetch(`/api/ratings?${params}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setData(json);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);
  function update(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "type" ? { genre: "" } : {}) }));
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dein Verlauf</p>
          <h1>Meine Bewertungen</h1>
          <p className="lead">Alle Titel, die dein persönliches Profil prägen – jederzeit änderbar.</p>
        </div>
        <div className="stat-pill">
          <strong>{data.ratings.length}</strong>
          <span>angezeigt</span>
        </div>
      </div>
      <div className="filter-bar">
        <label className="filter-search">
          <span className="sr-only">In Bewertungen suchen</span>
          <Search size={17} />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder="In Bewertungen suchen"
            aria-label="In Bewertungen suchen"
          />
        </label>
        <label>
          <span className="sr-only">Bewertung</span>
          <select value={filters.value} onChange={(event) => update("value", event.target.value)}>
            <option value="">Alle Meinungen</option>
            <option value="like">Gefällt mir</option>
            <option value="dislike">Gefällt mir nicht</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Typ</span>
          <select value={filters.type} onChange={(event) => update("type", event.target.value)}>
            <option value="">Film & Serie</option>
            <option value="movie">Nur Filme</option>
            <option value="tv">Nur Serien</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Genre</span>
          <select value={filters.genre} onChange={(event) => update("genre", event.target.value)}>
            <option value="">Alle Genres</option>
            {data.genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sortierung</span>
          <select value={filters.sort} onChange={(event) => update("sort", event.target.value)}>
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="title">Nach Titel</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>Bibliothek wird geladen …</p>
        </div>
      ) : error ? (
        <div className="status-panel" role="alert">
          <h2>Bibliothek nicht verfügbar</h2>
          <p>{error}</p>
          <button className="button" onClick={load}>
            Erneut laden
          </button>
        </div>
      ) : data.ratings.length === 0 ? (
        data.totalRatings > 0 ? (
          <div className="status-panel">
            <SlidersHorizontal size={38} />
            <h2>Keine passenden Bewertungen</h2>
            <p>Mit den gewählten Filtern wurde kein Titel gefunden.</p>
            <button
              className="button"
              onClick={() => setFilters({ query: "", value: "", type: "", genre: "", sort: "newest" })}
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="status-panel">
            <Library size={38} />
            <h2>Noch nichts in diesem Regal</h2>
            <p>
              Bewerte ein paar bekannte Filme oder Serien. Sie erscheinen hier und verbessern sofort deine Vorschläge.
            </p>
            <Link href="/search" className="button primary">
              Titel suchen
            </Link>
          </div>
        )
      ) : (
        <MediaTypeGroups
          items={data.ratings}
          getMedia={(rating) => rating.media}
          gridClassName="library-grid"
          progressive
          renderItem={(rating) => (
            <MediaCard
              key={rating.id}
              media={rating.media}
              rating={rating.value}
              bookmarked={rating.bookmarked}
              onRated={(value) => {
                if (!value) void load();
              }}
            />
          )}
        />
      )}
    </div>
  );
}
