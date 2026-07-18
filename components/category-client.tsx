"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, RefreshCw } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import { expandedRecommendationsForCategory, type RecommendationCategorySlug } from "@/lib/recommendation-categories";
import type { MediaType, ScoredRecommendation, TasteProfile } from "@/lib/types";
import { useI18n } from "@/components/app-provider";

interface Payload {
  recommendations: ScoredRecommendation[];
  profile: TasteProfile;
  demoMode: boolean;
}

export function CategoryClient({ slug, mediaType }: { slug: RecommendationCategorySlug; mediaType?: MediaType }) {
  const { t, config } = useI18n();
  const [data, setData] = useState<Payload | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const categoryTitle = `${t(`category.${slug}.title`)}${mediaType && slug !== "movies" && slug !== "series" ? ` – ${t(mediaType === "movie" ? "common.movies" : "common.seriesPlural")}` : ""}`;

  const load = useCallback(
    async (fresh = false) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/recommendations${fresh ? "?refresh=1" : ""}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);
        setData(json);
        setHidden(new Set());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : t("category.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const items = useMemo(
    () =>
      expandedRecommendationsForCategory(slug, data?.recommendations ?? [])
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
        {t("category.back")}
      </Link>
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {mediaType === "movie"
              ? t("category.allMovies")
              : mediaType === "tv"
                ? t("category.allSeries")
                : t("category.all")}
          </p>
          <h1>{categoryTitle}</h1>
          <p className="lead">{t(`category.${slug}.subtitle`)}</p>
        </div>
        <button className="button" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={16} />
          {t("dashboard.refresh")}
        </button>
      </div>
      {data?.demoMode && <DemoBanner />}
      {loading ? (
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>{t("category.loading")}</p>
        </div>
      ) : error ? (
        <div className="status-panel" role="alert">
          <Compass size={34} />
          <h2>{t("category.unavailable")}</h2>
          <p>{error}</p>
          <button className="button primary" onClick={() => load()}>
            {t("common.retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="status-panel">
          <Compass size={34} />
          <h2>{t("category.empty")}</h2>
          <p>{t("category.emptyBody")}</p>
          <Link className="button primary" href="/">
            {t("common.home")}
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
              reason={config.recommendations.show_reasons ? item.reasons[0] : undefined}
              onRated={() => hide(item)}
              trackRecommendation
            />
          )}
        />
      )}
    </div>
  );
}
