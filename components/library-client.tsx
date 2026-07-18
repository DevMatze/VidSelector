"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Library, Search, SlidersHorizontal } from "lucide-react";
import type { RatingRecord } from "@/lib/types";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import { useI18n } from "@/components/app-provider";

interface Payload {
  ratings: RatingRecord[];
  genres: string[];
  totalRatings: number;
}

export function LibraryClient() {
  const { t } = useI18n();
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
      setError(reason instanceof Error ? reason.message : t("library.loadError"));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

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
          <p className="eyebrow">{t("library.eyebrow")}</p>
          <h1>{t("library.title")}</h1>
          <p className="lead">{t("library.lead")}</p>
        </div>
        <div className="stat-pill">
          <strong>{data.ratings.length}</strong>
          <span>{t("common.shown")}</span>
        </div>
      </div>
      <div className="filter-bar">
        <label className="filter-search">
          <span className="sr-only">{t("library.search")}</span>
          <Search size={17} />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder={t("library.search")}
            aria-label={t("library.search")}
          />
        </label>
        <label>
          <span className="sr-only">{t("filter.rating")}</span>
          <select value={filters.value} onChange={(event) => update("value", event.target.value)}>
            <option value="">{t("library.allRatings")}</option>
            <option value="like">{t("rating.like")}</option>
            <option value="dislike">{t("rating.dislikeTitle")}</option>
            <option value="neutral">{t("rating.neutral")}</option>
          </select>
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
          <span className="sr-only">{t("filter.genre")}</span>
          <select value={filters.genre} onChange={(event) => update("genre", event.target.value)}>
            <option value="">{t("library.allGenres")}</option>
            {data.genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
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
          <p>{t("library.loading")}</p>
        </div>
      ) : error ? (
        <div className="status-panel" role="alert">
          <h2>{t("library.unavailable")}</h2>
          <p>{error}</p>
          <button className="button" onClick={load}>
            {t("common.reload")}
          </button>
        </div>
      ) : data.ratings.length === 0 ? (
        data.totalRatings > 0 ? (
          <div className="status-panel">
            <SlidersHorizontal size={38} />
            <h2>{t("library.filteredEmpty")}</h2>
            <p>{t("filter.noMatches")}</p>
            <button
              className="button"
              onClick={() => setFilters({ query: "", value: "", type: "", genre: "", sort: "newest" })}
            >
              {t("filter.reset")}
            </button>
          </div>
        ) : (
          <div className="status-panel">
            <Library size={38} />
            <h2>{t("library.empty")}</h2>
            <p>{t("library.emptyBody")}</p>
            <Link href="/search" className="button primary">
              {t("library.find")}
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
