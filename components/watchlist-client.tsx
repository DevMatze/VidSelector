"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import type { WatchEntryRecord } from "@/lib/types";
import { useI18n } from "@/components/app-provider";

interface Payload {
  entries: WatchEntryRecord[];
  totalEntries: number;
}

export function WatchlistClient() {
  const { t } = useI18n();
  const [data, setData] = useState<Payload>({ entries: [], totalEntries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ query: "", type: "", sort: "newest" });

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
      setError(reason instanceof Error ? reason.message : t("watchlist.loadError"));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

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
          <p className="eyebrow">{t("watchlist.eyebrow")}</p>
          <h1>{t("watchlist.title")}</h1>
          <p className="lead">{t("watchlist.lead")}</p>
        </div>
        <div className="stat-pill">
          <strong>{data.entries.length}</strong>
          <span>{t("common.shown")}</span>
        </div>
      </div>
      <div className="filter-bar watchlist-filters">
        <label className="filter-search">
          <span className="sr-only">{t("watchlist.search")}</span>
          <Search size={17} />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder={t("watchlist.search")}
          />
        </label>
        <label>
          <span className="sr-only">{t("filter.type")}</span>
          <select value={filters.type} onChange={(event) => update("type", event.target.value)}>
            <option value="">{t("filter.allTypes")}</option>
            <option value="movie">{t("filter.moviesOnly")}</option>
            <option value="tv">{t("filter.seriesOnly")}</option>
          </select>
        </label>
        <label>
          <span className="sr-only">{t("filter.sort")}</span>
          <select value={filters.sort} onChange={(event) => update("sort", event.target.value)}>
            <option value="newest">{t("filter.newest")}</option>
            <option value="oldest">{t("filter.oldest")}</option>
            <option value="title">{t("filter.title")}</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>{t("watchlist.loading")}</p>
        </div>
      ) : error ? (
        <div className="status-panel" role="alert">
          <h2>{t("watchlist.unavailable")}</h2>
          <p>{error}</p>
          <button className="button" onClick={load}>
            {t("common.reload")}
          </button>
        </div>
      ) : data.entries.length === 0 ? (
        data.totalEntries > 0 ? (
          <div className="status-panel">
            <SlidersHorizontal size={38} />
            <h2>{t("watchlist.filteredEmpty")}</h2>
            <p>{t("filter.noMatches")}</p>
            <button className="button" onClick={() => setFilters({ query: "", type: "", sort: "newest" })}>
              {t("filter.reset")}
            </button>
          </div>
        ) : (
          <div className="status-panel">
            <Bookmark size={38} />
            <h2>{t("watchlist.empty")}</h2>
            <p>{t("watchlist.emptyBody")}</p>
            <Link className="button primary" href="/search">
              {t("watchlist.discover")}
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
              bookmarked
              onBookmarkChange={() => void load()}
            />
          )}
        />
      )}
    </div>
  );
}
