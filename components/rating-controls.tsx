"use client";

import { useState } from "react";
import { Heart, HeartOff, Minus, Trash2 } from "lucide-react";
import type { MediaSummary, RatingValue } from "@/lib/types";
import { useI18n } from "@/components/app-provider";

interface Props {
  media: MediaSummary;
  initialValue?: RatingValue | null;
  compact?: boolean;
  onChange?: (value: RatingValue | null) => void;
}

export function RatingControls({ media, initialValue = null, compact = false, onChange }: Props) {
  const { t } = useI18n();
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
      setError(reason instanceof Error ? reason.message : t("rating.saveError"));
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
      setError(reason instanceof Error ? reason.message : t("rating.removeError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "rating-wrap compact" : "rating-wrap"}>
      <div className="rating-controls" aria-label={t("rating.label", { title: media.title })}>
        <button
          className={value === "like" ? "rate-button like selected" : "rate-button like"}
          disabled={pending}
          onClick={() => rate("like")}
          aria-pressed={value === "like"}
          aria-label={t("rating.likeLabel", { title: media.title })}
          title={t("rating.like")}
        >
          <Heart size={compact ? 17 : 19} fill={value === "like" ? "currentColor" : "none"} />
          <span>{compact ? "" : t("rating.like")}</span>
        </button>
        <button
          className={value === "dislike" ? "rate-button dislike selected" : "rate-button dislike"}
          disabled={pending}
          onClick={() => rate("dislike")}
          aria-pressed={value === "dislike"}
          aria-label={t("rating.dislikeLabel", { title: media.title })}
          title={t("rating.dislikeTitle")}
        >
          <HeartOff size={compact ? 17 : 19} />
          <span>{compact ? "" : t("rating.dislike")}</span>
        </button>
        <button
          className={value === "neutral" ? "rate-button neutral selected" : "rate-button neutral"}
          disabled={pending}
          onClick={() => rate("neutral")}
          aria-pressed={value === "neutral"}
          aria-label={t("rating.neutralLabel", { title: media.title })}
          title={t("rating.neutralTitle")}
        >
          <Minus size={compact ? 17 : 19} />
          <span>{compact ? "" : t("rating.neutral")}</span>
        </button>
        {value && (
          <button
            className="rate-button remove"
            disabled={pending}
            onClick={remove}
            title={t("rating.remove")}
            aria-label={t("rating.remove")}
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
