"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, RefreshCw, Sparkles, Star } from "lucide-react";
import type { ScoredRecommendation, TasteProfile } from "@/lib/types";
import { imageUrl } from "@/lib/tmdb";
import { recommendationsForCategory } from "@/lib/recommendation-categories";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import { RatingControls } from "@/components/rating-controls";
import { DemoBanner } from "@/components/demo-banner";
import { trackRecommendations } from "@/lib/recommendation-tracking";
import { BookmarkControl } from "@/components/bookmark-control";

interface Payload {
  recommendations: ScoredRecommendation[];
  profile: TasteProfile;
  demoMode: boolean;
}

export function Dashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const load = useCallback(async (fresh = false) => {
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
      setError(reason instanceof Error ? reason.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

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
  const more = recommendationsForCategory("more", visible, additionallyExcludedKeys);
  const movies = recommendationsForCategory("movies", visible, additionallyExcludedKeys);
  const shows = recommendationsForCategory("series", visible, additionallyExcludedKeys);
  const discoveries = recommendationsForCategory("discovery", visible, additionallyExcludedKeys);
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
          <h2>Deine Auswahl wird kuratiert</h2>
          <p>Wir gleichen Titel mit deinem bisherigen Geschmacksprofil ab.</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="page-shell">
        <div className="status-panel">
          <Compass size={34} />
          <h2>Keine Empfehlungen verfügbar</h2>
          <p>{error}</p>
          <button className="button primary" onClick={() => load()}>
            Noch einmal versuchen
          </button>
        </div>
      </div>
    );

  return (
    <div className="page-shell dashboard">
      {data?.demoMode && <DemoBanner />}
      <div className="page-header">
        <div>
          <p className="eyebrow">Für dich kuratiert</p>
          <h1>Was schaust du als Nächstes?</h1>
          <p className="lead">Persönliche Vorschläge, die mit jeder Bewertung ein bisschen besser werden.</p>
        </div>
        <button className="button" onClick={() => load(true)}>
          <RefreshCw size={16} />
          Neu berechnen
        </button>
      </div>

      {data && data.profile.ratingCount < 5 && (
        <div className="onboarding-strip">
          <div className="progress-ring">
            <strong>{data.profile.ratingCount}</strong>
            <span>/ 5</span>
          </div>
          <div>
            <strong>Hilf uns, deinen Geschmack kennenzulernen</strong>
            <p>Bewerte noch {5 - data.profile.ratingCount} bekannte Titel für deutlich persönlichere Empfehlungen.</p>
          </div>
          <Link className="button primary" href="/search">
            Titel bewerten <ArrowRight size={16} />
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
              <Sparkles size={13} /> Beste Empfehlung
            </p>
            <h2>{hero.media.title}</h2>
            <div className="hero-meta">
              <span>{hero.media.type === "movie" ? "Film" : "Serie"}</span>
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
            <div className="hero-reason">
              <Sparkles size={18} />
              <span>{hero.reasons[0]}</span>
            </div>
            <div className="hero-actions">
              <Link
                className="button primary"
                href={`/media/${hero.media.type}/${hero.media.tmdbId}`}
                onClick={() => trackRecommendations([hero.media], "clicked")}
              >
                Details ansehen <ArrowRight size={16} />
              </Link>
              <button
                className="button"
                onClick={() => {
                  trackRecommendations([hero.media], "skipped");
                  setHeroIndex((index) => index + 1);
                }}
              >
                Andere Empfehlung
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
          <h2>Alles bewertet!</h2>
          <p>Du hast alle aktuellen Kandidaten bewertet. Suche nach weiteren Titeln oder lade neue Daten aus TMDB.</p>
          <Link className="button primary" href="/search">
            Zur Suche
          </Link>
        </div>
      )}

      {more.length > 0 && (
        <RecommendationSection
          title="Top-Auswahl für dich"
          subtitle="Die stärksten Empfehlungen aus Film und Serie"
          items={more}
          categorySlug="more"
          onRated={hide}
        />
      )}
      {movies.length > 0 && (
        <RecommendationSection
          title="Passende Filme"
          subtitle="Für den nächsten Filmabend"
          items={movies}
          categorySlug="movies"
          onRated={hide}
        />
      )}
      {shows.length > 0 && (
        <RecommendationSection
          title="Passende Serien"
          subtitle="Geschichten, die etwas länger bleiben"
          items={shows}
          categorySlug="series"
          onRated={hide}
        />
      )}
      {discoveries.length > 0 && (
        <RecommendationSection
          title="Etwas Neues ausprobieren"
          subtitle="Gut bewertet und knapp außerhalb deiner üblichen Auswahl"
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
            reason={item.reasons[0]}
            onRated={() => onRated(item)}
            trackRecommendation
          />
        )}
      />
    </section>
  );
}
