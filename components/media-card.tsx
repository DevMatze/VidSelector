"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Star, Sparkles } from "lucide-react";
import type { MediaSummary, RatingValue } from "@/lib/types";
import { MediaPoster } from "@/components/media-poster";
import { RatingControls } from "@/components/rating-controls";
import { trackRecommendations } from "@/lib/recommendation-tracking";

interface Props {
  media: MediaSummary;
  reason?: string;
  rating?: RatingValue | null;
  onRated?: (value: RatingValue | null) => void;
  priority?: boolean;
  trackRecommendation?: boolean;
}

export function MediaCard({ media, reason, rating, onRated, priority, trackRecommendation = false }: Props) {
  const year = media.releaseDate?.slice(0, 4) || "—";
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!trackRecommendation || !card || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackRecommendations([media], "displayed");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [media, trackRecommendation]);
  return (
    <article className="media-card" ref={cardRef}>
      <Link
        className="poster"
        href={`/media/${media.type}/${media.tmdbId}`}
        aria-label={`${media.title} – Details`}
        onClick={() => trackRecommendation && trackRecommendations([media], "clicked")}
      >
        <MediaPoster path={media.posterPath} title={media.title} priority={priority} />
        <span className="type-badge">{media.type === "movie" ? "Film" : "Serie"}</span>
        {media.voteAverage > 0 && (
          <span className="score-badge">
            <Star size={13} fill="currentColor" />
            {media.voteAverage.toFixed(1)}
          </span>
        )}
      </Link>
      <div className="card-body">
        <div className="card-heading">
          <Link
            href={`/media/${media.type}/${media.tmdbId}`}
            onClick={() => trackRecommendation && trackRecommendations([media], "clicked")}
          >
            {media.title}
          </Link>
          <span>{year}</span>
        </div>
        <p className="genre-line">
          {media.genres
            .slice(0, 3)
            .map((genre) => genre.name)
            .join(" · ") || "Genre unbekannt"}
        </p>
        {reason && (
          <p className="reason">
            <Sparkles size={15} />
            {reason}
          </p>
        )}
        <RatingControls media={media} initialValue={rating} compact onChange={onRated} />
      </div>
    </article>
  );
}
