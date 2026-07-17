"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock3,
  Clapperboard,
  ExternalLink,
  Film,
  Globe2,
  Play,
  Star,
  Tv,
  Users,
} from "lucide-react";
import type { MediaDetails, RatingValue, WatchStatus } from "@/lib/types";
import { imageUrl } from "@/lib/tmdb";
import { RatingControls } from "@/components/rating-controls";
import { MediaCard } from "@/components/media-card";
import { MediaPoster } from "@/components/media-poster";
import { MediaCarousel } from "@/components/media-carousel";
import { WatchControls } from "@/components/watch-controls";

interface DetailsPayload {
  media: MediaDetails;
  rating: RatingValue | null;
  watchStatus: WatchStatus | null;
  demoMode: boolean;
}

export function DetailClient({ type, id }: { type: string; id: string }) {
  const [data, setData] = useState<DetailsPayload | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = `${type}:${id}`;
    fetch(`/api/media/${type}/${id}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);
        setData(json);
        setLoadedKey(requestKey);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError")
          setError({ key: requestKey, message: reason instanceof Error ? reason.message : "Details nicht verfügbar." });
      });
    return () => controller.abort();
  }, [type, id]);

  const currentKey = `${type}:${id}`;
  if (error?.key === currentKey)
    return (
      <div className="page-shell">
        <div className="status-panel">
          <Film size={38} />
          <h2>Details nicht verfügbar</h2>
          <p>{error.message}</p>
          <Link className="button primary" href="/search">
            Zur Suche
          </Link>
        </div>
      </div>
    );
  if (!data || loadedKey !== currentKey)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>Titel wird geladen …</p>
        </div>
      </div>
    );
  const { media } = data;
  const year = media.releaseDate?.slice(0, 4);
  const kind = media.type === "movie" ? "Film" : "Serie";
  const providerGroups = [
    { kind: "flatrate", label: "Streamen" },
    { kind: "rent", label: "Mieten" },
    { kind: "buy", label: "Kaufen" },
  ] as const;

  return (
    <div className="details-page">
      <div
        className="detail-backdrop"
        style={
          media.backdropPath
            ? {
                backgroundImage: `linear-gradient(0deg, var(--bg) 2%, rgba(8,9,13,.36) 75%, var(--bg) 100%), url(${imageUrl(media.backdropPath, "original")})`,
              }
            : undefined
        }
      />
      <div className="page-shell detail-shell">
        <button className="back-link back-button" type="button" onClick={() => router.back()}>
          <ArrowLeft size={17} />
          Zurück
        </button>
        <section className="detail-hero">
          <div className="detail-poster">
            <MediaPoster path={media.posterPath} title={media.title} priority />
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{kind}</p>
            <h1>{media.title}</h1>
            {media.originalTitle && media.originalTitle !== media.title && (
              <p className="original-title">{media.originalTitle}</p>
            )}
            <div className="detail-meta">
              <span>
                <Calendar size={15} />
                {year || "Datum unbekannt"}
              </span>
              <span>
                <Star size={15} fill="currentColor" />
                {media.voteAverage.toFixed(1)} / 10
              </span>
              {media.runtime && (
                <span>
                  <Clock3 size={15} />
                  {media.runtime} Min.
                </span>
              )}
              {media.type === "tv" && media.seasons && (
                <span>
                  <Tv size={15} />
                  {media.seasons} Staffeln{media.episodes ? ` · ${media.episodes} Folgen` : ""}
                </span>
              )}
            </div>
            <div className="genre-pills">
              {media.genres.map((genre) => (
                <span key={genre.id}>{genre.name}</span>
              ))}
            </div>
            <p className="detail-overview">{media.overview}</p>
            <div className="detail-personal-controls">
              <RatingControls media={media} initialValue={data.rating} />
              <WatchControls media={media} initialStatus={data.watchStatus} />
            </div>
            {media.trailerKey && (
              <a
                className="button trailer-button"
                target="_blank"
                rel="noreferrer"
                href={`https://www.youtube.com/watch?v=${media.trailerKey}`}
              >
                <Play size={16} fill="currentColor" />
                Trailer ansehen <ExternalLink size={14} />
              </a>
            )}
          </div>
        </section>

        <div className="detail-columns">
          <div>
            <section className="detail-section">
              <h2>Besetzung</h2>
              {media.cast.length ? (
                <div className="person-list">
                  {media.cast.map((person) => (
                    <div className="person" key={person.id}>
                      <div className="person-avatar">
                        {person.profilePath ? (
                          <Image
                            src={imageUrl(person.profilePath, "w342")!}
                            alt=""
                            width={38}
                            height={38}
                            sizes="38px"
                          />
                        ) : (
                          <Users size={18} />
                        )}
                      </div>
                      <div>
                        <strong>{person.name}</strong>
                        <span>{person.role || "Besetzung"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Keine Besetzungsdaten verfügbar.</p>
              )}
            </section>
            <section className="detail-section">
              <h2>{media.type === "movie" ? "Kreativteam" : "Erstellt von"}</h2>
              {media.creators.length ? (
                <div className="person-list creators">
                  {media.creators.map((person) => (
                    <div className="person" key={person.id}>
                      <div className="person-avatar">
                        {person.profilePath ? (
                          <Image
                            src={imageUrl(person.profilePath, "w342")!}
                            alt=""
                            width={38}
                            height={38}
                            sizes="38px"
                          />
                        ) : (
                          <Clapperboard size={18} />
                        )}
                      </div>
                      <div>
                        <strong>{person.name}</strong>
                        <span>{person.role || "Kreativteam"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Keine Kreativdaten verfügbar.</p>
              )}
            </section>
          </div>
          <aside className="facts-card">
            <h2>Auf einen Blick</h2>
            <dl>
              <div>
                <dt>
                  <Globe2 size={15} />
                  Originalsprache
                </dt>
                <dd>{media.originalLanguage?.toUpperCase() || "—"}</dd>
              </div>
              <div>
                <dt>
                  <Film size={15} />
                  Produktionsland
                </dt>
                <dd>{media.countries.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>
                  <Star size={15} />
                  Beliebtheit
                </dt>
                <dd>{Math.round(media.popularity)}</dd>
              </div>
            </dl>
            {media.providers.length > 0 && (
              <div className="provider-section">
                <h3>Verfügbarkeit in Deutschland</h3>
                {providerGroups.map(({ kind: providerKind, label }) => {
                  const providers = media.providers.filter((provider) => provider.kind === providerKind);
                  return providers.length ? (
                    <div className="provider-group" key={providerKind}>
                      <strong>{label}</strong>
                      <div className="provider-list">
                        {providers.map((provider) => (
                          <span key={`${providerKind}:${provider.id}`}>{provider.name}</span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
                <p className="provider-attribution">Streamingdaten von JustWatch.</p>
                {media.watchProviderUrl && (
                  <a className="text-link" href={media.watchProviderUrl} target="_blank" rel="noreferrer">
                    Angebote bei TMDB ansehen <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>

        {media.similar.length > 0 && (
          <section className="section">
            <div className="section-heading similar-heading">
              <div>
                <h2>{media.type === "movie" ? "Ähnliche Filme" : "Ähnliche Serien"}</h2>
                <p>Mehr aus derselben {media.type === "movie" ? "filmischen" : "erzählerischen"} Richtung</p>
              </div>
              <div className="media-type-navigation">
                <Link className="see-more-link" href={`/media/${media.type}/${media.tmdbId}/similar`}>
                  Siehe mehr <ArrowRight size={15} />
                </Link>
                <span>{media.similar.length}</span>
              </div>
            </div>
            <MediaCarousel
              items={media.similar}
              label={media.type === "movie" ? "Ähnliche Filme" : "Ähnliche Serien"}
              renderItem={(similar) => <MediaCard key={`${similar.type}:${similar.tmdbId}`} media={similar} />}
            />
          </section>
        )}
      </div>
    </div>
  );
}
