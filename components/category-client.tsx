"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, RefreshCw } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import {
  categoryTitleForMediaType,
  RECOMMENDATION_CATEGORIES,
  recommendationsForCategory,
  type RecommendationCategorySlug,
} from "@/lib/recommendation-categories";
import type { MediaType, ScoredRecommendation, TasteProfile } from "@/lib/types";

interface Payload {
  recommendations: ScoredRecommendation[];
  profile: TasteProfile;
  demoMode: boolean;
}

export function CategoryClient({ slug, mediaType }: { slug: RecommendationCategorySlug; mediaType?: MediaType }) {
  const [data, setData] = useState<Payload | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const category = RECOMMENDATION_CATEGORIES[slug];

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/recommendations${fresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setData(json);
      setHidden(new Set());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kategorie konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const items = useMemo(
    () =>
      recommendationsForCategory(slug, data?.recommendations ?? [])
        .filter((item) => !mediaType || item.media.type === mediaType)
        .filter(({ media }) => !hidden.has(`${media.type}:${media.tmdbId}`)),
    [data, hidden, mediaType, slug],
  );

  function hide(item: ScoredRecommendation) {
    setHidden((current) => new Set(current).add(`${item.media.type}:${item.media.tmdbId}`));
  }

  return (
    <div className="page-shell category-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={17} />
        Zurück zu den Empfehlungen
      </Link>
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {mediaType === "movie"
              ? "Alle Filme dieser Kategorie"
              : mediaType === "tv"
                ? "Alle Serien dieser Kategorie"
                : "Alle Empfehlungen dieser Kategorie"}
          </p>
          <h1>{categoryTitleForMediaType(slug, mediaType)}</h1>
          <p className="lead">{category.subtitle}</p>
        </div>
        <button className="button" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={16} />
          Neu berechnen
        </button>
      </div>
      {data?.demoMode && <DemoBanner />}
      {loading ? (
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>Kategorie wird geladen …</p>
        </div>
      ) : error ? (
        <div className="status-panel" role="alert">
          <Compass size={34} />
          <h2>Kategorie nicht verfügbar</h2>
          <p>{error}</p>
          <button className="button primary" onClick={() => load()}>
            Noch einmal versuchen
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="status-panel">
          <Compass size={34} />
          <h2>Keine weiteren Titel</h2>
          <p>Für diese Kategorie sind aktuell keine Empfehlungen verfügbar.</p>
          <Link className="button primary" href="/">
            Zur Startseite
          </Link>
        </div>
      ) : (
        <MediaTypeGroups
          items={items}
          getMedia={(item) => item.media}
          progressive
          renderItem={(item) => (
            <MediaCard
              key={`${item.media.type}:${item.media.tmdbId}`}
              media={item.media}
              reason={item.reasons[0]}
              onRated={() => hide(item)}
              onDismiss={() => hide(item)}
              trackRecommendation
            />
          )}
        />
      )}
    </div>
  );
}
