"use client";

import { useState } from "react";
import { Heart, HeartOff, Minus, Trash2 } from "lucide-react";
import type { MediaSummary, RatingValue } from "@/lib/types";

interface Props {
  media: MediaSummary;
  initialValue?: RatingValue | null;
  compact?: boolean;
  onChange?: (value: RatingValue | null) => void;
}

export function RatingControls({ media, initialValue = null, compact = false, onChange }: Props) {
  const [value, setValue] = useState<RatingValue | null>(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function rate(nextValue: RatingValue) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media, value: nextValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setValue(nextValue);
      onChange?.(nextValue);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/ratings?type=${media.type}&tmdbId=${media.tmdbId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setValue(null);
      onChange?.(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Entfernen fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "rating-wrap compact" : "rating-wrap"}>
      <div className="rating-controls" aria-label={`Bewertung für ${media.title}`}>
        <button
          className={value === "like" ? "rate-button like selected" : "rate-button like"}
          disabled={pending}
          onClick={() => rate("like")}
          aria-pressed={value === "like"}
          aria-label={`Gefällt mir: ${media.title}`}
          title="Gefällt mir"
        >
          <Heart size={compact ? 17 : 19} fill={value === "like" ? "currentColor" : "none"} />
          <span>{compact ? "" : "Gefällt mir"}</span>
        </button>
        <button
          className={value === "dislike" ? "rate-button dislike selected" : "rate-button dislike"}
          disabled={pending}
          onClick={() => rate("dislike")}
          aria-pressed={value === "dislike"}
          aria-label={`Gefällt mir nicht: ${media.title}`}
          title="Gefällt mir nicht"
        >
          <HeartOff size={compact ? 17 : 19} />
          <span>{compact ? "" : "Nicht meins"}</span>
        </button>
        <button
          className={value === "neutral" ? "rate-button neutral selected" : "rate-button neutral"}
          disabled={pending}
          onClick={() => rate("neutral")}
          aria-pressed={value === "neutral"}
          aria-label={`Neutral bewertet: ${media.title}`}
          title="Neutral – keine Präferenz"
        >
          <Minus size={compact ? 17 : 19} />
          <span>{compact ? "" : "Neutral"}</span>
        </button>
        {value && (
          <button
            className="rate-button remove"
            disabled={pending}
            onClick={remove}
            title="Bewertung entfernen"
            aria-label="Bewertung entfernen"
          >
            <Trash2 size={compact ? 16 : 18} />
          </button>
        )}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
