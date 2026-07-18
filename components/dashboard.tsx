"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, RefreshCw, Sparkles, Star } from "lucide-react";
import type { ScoredRecommendation, TasteProfile } from "@/lib/types";
import { imageUrl } from "@/lib/tmdb-image";
import { recommendationsForCategory } from "@/lib/recommendation-categories";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import { RatingControls } from "@/components/rating-controls";
import { DemoBanner } from "@/components/demo-banner";
import { trackRecommendations } from "@/lib/recommendation-tracking";
import { BookmarkControl } from "@/components/bookmark-control";
import { useI18n } from "@/components/app-provider";

interface Payload {
  recommendations: ScoredRecommendation[];
  profile: TasteProfile;
  demoMode: boolean;
}

export function Dashboard() {
  const { t, config } = useI18n();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const load = useCallback(
    async (fresh = false) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/recommendations${fresh ? "?refresh=1" : ""}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);
        setData(json);
        setHeroIndex(0);
        setHidden(new Set());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : t("dashboard.loadError"));
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
  const visible = useMemo(
    () => data?.recommendations.filter(({ media }) => !hidden.has(`${media.type}:${media.tmdbId}`)) ?? [],
    [data, hidden],
  );
  const hero = visible[heroIndex % Math.max(visible.length, 1)];
  const heroKey = hero ? `${hero.media.type}:${hero.media.tmdbId}` : "";
  const additionallyExcludedKeys = new Set(heroKey ? [heroKey] : []);
  const limit = config.recommendations.homepage_limit;
  const more = recommendationsForCategory("more", visible, additionallyExcludedKeys, limit);
  const movies = recommendationsForCategory("movies", visible, additionallyExcludedKeys, limit);
  const shows = recommendationsForCategory("series", visible, additionallyExcludedKeys, limit);
  const discoveries = recommendationsForCategory("discovery", visible, additionallyExcludedKeys, limit);
  useEffect(() => {
    if (hero) trackRecommendations([hero.media], "displayed");
  }, [hero]);

  function hide(recommendation: ScoredRecommendation) {
    setHidden((current) => new Set(current).add(`${recommendation.media.type}:${recommendation.media.tmdbId}`));
  }

  if (loading)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <h2>{t("dashboard.loadingTitle")}</h2>
          <p>{t("dashboard.loadingBody")}</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="page-shell">
        <div className="status-panel">
          <Compass size={34} />
          <h2>{t("dashboard.unavailable")}</h2>
          <p>{error}</p>
          <button className="button primary" onClick={() => load()}>
            {t("common.retry")}
          </button>
        </div>
      </div>
    );

  return (
    <div className="page-shell dashboard">
      {data?.demoMode && <DemoBanner />}
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("dashboard.eyebrow")}</p>
          <h1>{t("dashboard.title")}</h1>
          <p className="lead">{t("dashboard.lead")}</p>
        </div>
        <button className="button" onClick={() => load(true)}>
          <RefreshCw size={16} />
          {t("dashboard.refresh")}
        </button>
      </div>

      {data && data.profile.ratingCount < 5 && (
        <div className="onboarding-strip">
          <div className="progress-ring">
            <strong>{data.profile.ratingCount}</strong>
            <span>/ 5</span>
          </div>
          <div>
            <strong>{t("dashboard.onboardingTitle")}</strong>
            <p>{t("dashboard.onboardingBody", { count: 5 - data.profile.ratingCount })}</p>
          </div>
          <Link className="button primary" href="/search">
            {t("dashboard.rateTitles")} <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {hero ? (
        <section
          className="recommendation-hero"
          style={
            hero.media.backdropPath
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(11,12,17,.98) 0%, rgba(11,12,17,.80) 48%, rgba(11,12,17,.18) 100%), url(${imageUrl(hero.media.backdropPath, "original")})`,
                }
              : undefined
          }
        >
          <div className="hero-content">
            <p className="eyebrow">
              <Sparkles size={13} /> {t("dashboard.best")}
            </p>
            <h2>{hero.media.title}</h2>
            <div className="hero-meta">
              <span>{t(hero.media.type === "movie" ? "common.movie" : "common.series")}</span>
              <span>{hero.media.releaseDate.slice(0, 4) || "—"}</span>
              <span>
                <Star size={14} fill="currentColor" /> {hero.media.voteAverage.toFixed(1)}
              </span>
              <span>
                {hero.media.genres
                  .slice(0, 3)
                  .map((genre) => genre.name)
                  .join(" · ")}
              </span>
            </div>
            <p className="hero-overview">{hero.media.overview}</p>
            {config.recommendations.show_reasons && hero.reasons[0] && (
              <div className="hero-reason">
                <Sparkles size={18} />
                <span>{hero.reasons[0]}</span>
              </div>
            )}
            <div className="hero-actions">
              <Link
                className="button primary"
                href={`/media/${hero.media.type}/${hero.media.tmdbId}`}
                onClick={() => trackRecommendations([hero.media], "clicked")}
              >
                {t("dashboard.details")} <ArrowRight size={16} />
              </Link>
              <button
                className="button"
                onClick={() => {
                  trackRecommendations([hero.media], "skipped");
                  setHeroIndex((index) => index + 1);
                }}
              >
                {t("dashboard.other")}
              </button>
              <BookmarkControl
                media={hero.media}
                initialBookmarked={hero.bookmarked ?? hero.media.bookmarked ?? false}
              />
            </div>
            <div className="detail-personal-controls">
              <RatingControls media={hero.media} onChange={() => hide(hero)} />
            </div>
          </div>
        </section>
      ) : (
        <div className="status-panel">
          <Sparkles size={34} />
          <h2>{t("dashboard.allRated")}</h2>
          <p>{t("dashboard.allRatedBody")}</p>
          <Link className="button primary" href="/search">
            {t("common.search")}
          </Link>
        </div>
      )}

      {more.length > 0 && (
        <RecommendationSection
          title={t("category.more.title")}
          subtitle={t("category.more.subtitle")}
          items={more}
          categorySlug="more"
          onRated={hide}
        />
      )}
      {movies.length > 0 && (
        <RecommendationSection
          title={t("category.movies.title")}
          subtitle={t("category.movies.subtitle")}
          items={movies}
          categorySlug="movies"
          onRated={hide}
        />
      )}
      {shows.length > 0 && (
        <RecommendationSection
          title={t("category.series.title")}
          subtitle={t("category.series.subtitle")}
          items={shows}
          categorySlug="series"
          onRated={hide}
        />
      )}
      {discoveries.length > 0 && (
        <RecommendationSection
          title={t("category.discovery.title")}
          subtitle={t("category.discovery.subtitle")}
          items={discoveries}
          categorySlug="discovery"
          onRated={hide}
        />
      )}
    </div>
  );
}

function RecommendationSection({
  title,
  subtitle,
  items,
  categorySlug,
  onRated,
}: {
  title: string;
  subtitle: string;
  items: ScoredRecommendation[];
  categorySlug: string;
  onRated: (item: ScoredRecommendation) => void;
}) {
  const { config } = useI18n();
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <MediaTypeGroups
        items={items}
        getMedia={(item) => item.media}
        paginate
        pageSize={5}
        seeMoreHrefs={{ movie: `/category/${categorySlug}/movie`, tv: `/category/${categorySlug}/tv` }}
        renderItem={(item) => (
          <MediaCard
            key={`${item.media.type}:${item.media.tmdbId}`}
            media={item.media}
            reason={config.recommendations.show_reasons ? item.reasons[0] : undefined}
            onRated={() => onRated(item)}
            trackRecommendation
          />
        )}
      />
    </section>
  );
}
