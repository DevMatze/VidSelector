"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { MediaSummary } from "@/lib/types";
import { useI18n } from "@/components/app-provider";

export function BookmarkControl({
  media,
  initialBookmarked = false,
  compact = false,
  onChange,
}: {
  media: MediaSummary;
  initialBookmarked?: boolean;
  compact?: boolean;
  onChange?: (bookmarked: boolean) => void;
}) {
  const { t } = useI18n();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setPending(true);
    setError("");
    try {
      const response = bookmarked
        ? await fetch(`/api/watchlist?type=${media.type}&tmdbId=${media.tmdbId}`, { method: "DELETE" })
        : await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ media }),
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const nextBookmarked = !bookmarked;
      setBookmarked(nextBookmarked);
      onChange?.(nextBookmarked);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("bookmark.error"));
    } finally {
      setPending(false);
    }
  }

  const Icon = bookmarked ? BookmarkCheck : Bookmark;
  return (
    <div className={compact ? "bookmark-control compact" : "bookmark-control"}>
      <button
        type="button"
        className={
          compact ? (bookmarked ? "watch-button selected" : "watch-button") : bookmarked ? "button selected" : "button"
        }
        disabled={pending}
        onClick={toggle}
        aria-pressed={bookmarked}
        aria-label={t(bookmarked ? "bookmark.removeLabel" : "bookmark.addLabel", { title: media.title })}
        title={t(bookmarked ? "bookmark.remove" : "bookmark.add")}
      >
        <Icon size={compact ? 16 : 17} fill={bookmarked ? "currentColor" : "none"} />
        {!compact && <span>{t(bookmarked ? "bookmark.added" : "bookmark.add")}</span>}
      </button>
      {error && (
        <p className={compact ? "sr-only" : "inline-error"} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
