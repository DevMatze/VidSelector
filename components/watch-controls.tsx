"use client";

import { useState } from "react";
import { Bookmark, Check, Eye, PlayCircle, XCircle } from "lucide-react";
import type { MediaSummary, WatchStatus } from "@/lib/types";

const LABELS: Record<WatchStatus, string> = {
  planned: "Möchte ich sehen",
  watching: "Angefangen",
  completed: "Gesehen",
  dropped: "Abgebrochen",
};

const ICONS = {
  planned: Bookmark,
  watching: PlayCircle,
  completed: Check,
  dropped: XCircle,
} as const;

export function WatchControls({
  media,
  initialStatus = null,
  compact = false,
  onChange,
}: {
  media: MediaSummary;
  initialStatus?: WatchStatus | null;
  compact?: boolean;
  onChange?: (status: WatchStatus | null) => void;
}) {
  const [status, setStatus] = useState<WatchStatus | null>(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(nextStatus: WatchStatus) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(nextStatus);
      onChange?.(nextStatus);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/watchlist?type=${media.type}&tmdbId=${media.tmdbId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(null);
      onChange?.(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Titel konnte nicht entfernt werden.");
    } finally {
      setPending(false);
    }
  }

  if (compact) {
    const Icon = status ? ICONS[status] : Bookmark;
    return (
      <div className="watch-compact">
        <button
          type="button"
          className={status ? "watch-button selected" : "watch-button"}
          disabled={pending}
          onClick={() => (status ? remove() : save("planned"))}
          aria-pressed={Boolean(status)}
          aria-label={
            status ? `${LABELS[status]} entfernen: ${media.title}` : `Zur Merkliste hinzufügen: ${media.title}`
          }
          title={status ? LABELS[status] : "Möchte ich sehen"}
        >
          <Icon size={16} fill={status === "planned" ? "currentColor" : "none"} />
        </button>
        {error && <span className="sr-only">{error}</span>}
      </div>
    );
  }

  return (
    <div className="watch-controls">
      <label>
        <Eye size={17} />
        <span className="sr-only">Wiedergabestatus für {media.title}</span>
        <select
          value={status ?? ""}
          disabled={pending}
          onChange={(event) => {
            const nextStatus = event.target.value as WatchStatus | "";
            if (nextStatus) void save(nextStatus);
            else void remove();
          }}
        >
          <option value="">Kein Status</option>
          {Object.entries(LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
