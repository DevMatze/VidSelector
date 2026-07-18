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
import type { MediaDetails, RatingValue } from "@/lib/types";
import { imageUrl } from "@/lib/tmdb-image";
import { RatingControls } from "@/components/rating-controls";
import { MediaCard } from "@/components/media-card";
import { MediaPoster } from "@/components/media-poster";
import { MediaCarousel } from "@/components/media-carousel";
import { BookmarkControl } from "@/components/bookmark-control";
import { useI18n } from "@/components/app-provider";

interface DetailsPayload {
  media: MediaDetails;
  rating: RatingValue | null;
  bookmarked: boolean;
  demoMode: boolean;
}

export function DetailClient({ type, id }: { type: string; id: string }) {
  const { t } = useI18n();
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
          setError({ key: requestKey, message: reason instanceof Error ? reason.message : t("detail.loadError") });
      });
    return () => controller.abort();
  }, [type, id, t]);

  const currentKey = `${type}:${id}`;
  if (error?.key === currentKey)
    return (
      <div className="page-shell">
        <div className="status-panel">
          <Film size={38} />
          <h2>{t("detail.unavailable")}</h2>
          <p>{error.message}</p>
          <Link className="button primary" href="/search">
            {t("common.search")}
          </Link>
        </div>
      </div>
    );
  if (!data || loadedKey !== currentKey)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>{t("detail.loading")}</p>
        </div>
      </div>
    );
  const { media } = data;
  const year = media.releaseDate?.slice(0, 4);
  const kind = t(media.type === "movie" ? "common.movie" : "common.series");
  const providerGroups = [
    { kind: "flatrate", label: t("detail.stream") },
    { kind: "rent", label: t("detail.rent") },
    { kind: "buy", label: t("detail.buy") },
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
          {t("common.back")}
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
                {year || t("detail.unknownDate")}
              </span>
              <span>
                <Star size={15} fill="currentColor" />
                {media.voteAverage.toFixed(1)} / 10
              </span>
              {media.runtime && (
                <span>
                  <Clock3 size={15} />
                  {t("detail.minutes", { count: media.runtime })}
                </span>
              )}
              {media.type === "tv" && media.seasons && (
                <span>
                  <Tv size={15} />
                  {t("detail.seasons", { count: media.seasons })}
                  {media.episodes ? ` · ${t("detail.episodes", { count: media.episodes })}` : ""}
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
              <BookmarkControl media={media} initialBookmarked={data.bookmarked} />
            </div>
            {media.trailerKey && (
              <a
                className="button trailer-button"
                target="_blank"
                rel="noreferrer"
                href={`https://www.youtube.com/watch?v=${media.trailerKey}`}
              >
                <Play size={16} fill="currentColor" />
                {t("detail.trailer")} <ExternalLink size={14} />
              </a>
            )}
          </div>
        </section>

        <div className="detail-columns">
          <div>
            <section className="detail-section">
              <h2>{t("detail.cast")}</h2>
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
                        <span>{person.role || t("detail.cast")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">{t("detail.noCast")}</p>
              )}
            </section>
            <section className="detail-section">
              <h2>{t(media.type === "movie" ? "detail.creative" : "detail.createdBy")}</h2>
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
                        <span>{person.role || t("detail.creative")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">{t("detail.noCreative")}</p>
              )}
            </section>
          </div>
          <aside className="facts-card">
            <h2>{t("detail.facts")}</h2>
            <dl>
              <div>
                <dt>
                  <Globe2 size={15} />
                  {t("detail.originalLanguage")}
                </dt>
                <dd>{media.originalLanguage?.toUpperCase() || "—"}</dd>
              </div>
              <div>
                <dt>
                  <Film size={15} />
                  {t("detail.country")}
                </dt>
                <dd>{media.countries.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>
                  <Star size={15} />
                  {t("detail.popularity")}
                </dt>
                <dd>{Math.round(media.popularity)}</dd>
              </div>
            </dl>
            {media.providers.length > 0 && (
              <div className="provider-section">
                <h3>{t("detail.availability")}</h3>
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
                <p className="provider-attribution">{t("detail.providerAttribution")}</p>
                {media.watchProviderUrl && (
                  <a className="text-link" href={media.watchProviderUrl} target="_blank" rel="noreferrer">
                    {t("detail.providerLink")} <ExternalLink size={12} />
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
                <h2>{t(media.type === "movie" ? "detail.similarMovies" : "detail.similarSeries")}</h2>
                <p>{t(media.type === "movie" ? "detail.similarMovieBody" : "detail.similarSeriesBody")}</p>
              </div>
              <div className="media-type-navigation">
                <Link className="see-more-link" href={`/media/${media.type}/${media.tmdbId}/similar`}>
                  {t("common.seeMore")} <ArrowRight size={15} />
                </Link>
                <span>{media.similar.length}</span>
              </div>
            </div>
            <MediaCarousel
              items={media.similar}
              label={t(media.type === "movie" ? "detail.similarMovies" : "detail.similarSeries")}
              renderItem={(similar) => <MediaCard key={`${similar.type}:${similar.tmdbId}`} media={similar} />}
            />
          </section>
        )}
      </div>
    </div>
  );
}
