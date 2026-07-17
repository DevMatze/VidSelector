"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import type { WatchEntryRecord } from "@/lib/types";

interface Payload {
  entries: WatchEntryRecord[];
  totalEntries: number;
}

export function WatchlistClient() {
  const [data, setData] = useState<Payload>({ entries: [], totalEntries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ query: "", status: "", type: "", sort: "newest" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const response = await fetch(`/api/watchlist?${params}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setData(json);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Merkliste konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  function update(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Deine persönliche Auswahl</p>
          <h1>Meine Merkliste</h1>
          <p className="lead">Plane, beginne und verwalte Filme und Serien unabhängig von deiner Bewertung.</p>
        </div>
        <div className="stat-pill">
          <strong>{data.entries.length}</strong>
          <span>angezeigt</span>
        </div>
      </div>
      <div className="filter-bar watchlist-filters">
        <label className="filter-search">
          <span className="sr-only">In der Merkliste suchen</span>
          <Search size={17} />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder="In der Merkliste suchen"
          />
        </label>
        <label>
          <span className="sr-only">Wiedergabestatus</span>
          <select value={filters.status} onChange={(event) => update("status", event.target.value)}>
            <option value="">Alle Status</option>
            <option value="planned">Möchte ich sehen</option>
            <option value="watching">Angefangen</option>
            <option value="completed">Gesehen</option>
            <option value="dropped">Abgebrochen</option>
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
          <p>Merkliste wird geladen …</p>
        </div>
      ) : error ? (
        <div className="status-panel" role="alert">
          <h2>Merkliste nicht verfügbar</h2>
          <p>{error}</p>
          <button className="button" onClick={load}>
            Erneut laden
          </button>
        </div>
      ) : data.entries.length === 0 ? (
        data.totalEntries > 0 ? (
          <div className="status-panel">
            <SlidersHorizontal size={38} />
            <h2>Keine passenden Einträge</h2>
            <p>Mit den gewählten Filtern wurde kein Titel gefunden.</p>
            <button className="button" onClick={() => setFilters({ query: "", status: "", type: "", sort: "newest" })}>
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="status-panel">
            <Bookmark size={38} />
            <h2>Deine Merkliste ist noch leer</h2>
            <p>Speichere Titel als „Möchte ich sehen“, ohne sie bereits bewerten zu müssen.</p>
            <Link className="button primary" href="/search">
              Titel entdecken
            </Link>
          </div>
        )
      ) : (
        <MediaTypeGroups
          items={data.entries}
          getMedia={(entry) => entry.media}
          gridClassName="library-grid"
          progressive
          renderItem={(entry) => (
            <MediaCard
              key={entry.id}
              media={entry.media}
              rating={entry.rating}
              watchStatus={entry.status}
              onWatchStatusChange={() => void load()}
            />
          )}
        />
      )}
    </div>
  );
}
