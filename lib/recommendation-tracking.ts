import type { MediaSummary } from "@/lib/types";

export function trackRecommendations(
  items: Array<Pick<MediaSummary, "type" | "tmdbId">>,
  event: "displayed" | "clicked" | "skipped",
) {
  if (!items.length) return;
  const body = JSON.stringify({ event, items: items.map(({ type, tmdbId }) => ({ type, tmdbId })) });
  if ((event === "clicked" || event === "skipped") && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/recommendations", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
