import { describe, expect, it } from "vitest";
import {
  categorySupportsMediaType,
  categoryTitleForMediaType,
  isRecommendationCategorySlug,
  RECOMMENDATIONS_PER_MEDIA_TYPE,
  recommendationsForCategory,
} from "@/lib/recommendation-categories";
import type { MediaType, ScoredRecommendation } from "@/lib/types";

function recommendation(tmdbId: number, type: MediaType, source: ScoredRecommendation["source"]): ScoredRecommendation {
  return {
    media: {
      tmdbId,
      type,
      title: `${type}-${tmdbId}`,
      overview: "",
      posterPath: null,
      backdropPath: null,
      releaseDate: "2020-01-01",
      genres: [],
      voteAverage: 7,
      popularity: 10,
      originalLanguage: "de",
    },
    score: 10,
    reasons: [],
    source,
  };
}

const recommendations = [
  recommendation(1, "movie", "popular"),
  ...Array.from({ length: 110 }, (_, index) => recommendation(index + 2, "movie", "popular")),
  ...Array.from({ length: 110 }, (_, index) => recommendation(index + 1_001, "tv", "popular")),
  ...Array.from({ length: 60 }, (_, index) => recommendation(index + 2_001, "movie", "discovery")),
  ...Array.from({ length: 60 }, (_, index) => recommendation(index + 3_001, "tv", "discovery")),
];

const keys = (items: ScoredRecommendation[]) => items.map((item) => `${item.media.type}:${item.media.tmdbId}`);

describe("recommendationsForCategory", () => {
  it("vergibt pro gemischter Kategorie je 50 eigene Film- und Serienplätze", () => {
    const top = recommendationsForCategory("more", recommendations);
    const movies = recommendationsForCategory("movies", recommendations);
    const series = recommendationsForCategory("series", recommendations);
    const discovery = recommendationsForCategory("discovery", recommendations);

    expect(top.filter((item) => item.media.type === "movie")).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);
    expect(top.filter((item) => item.media.type === "tv")).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);
    expect(movies).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);
    expect(series).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);
    expect(discovery.filter((item) => item.media.type === "movie")).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);
    expect(discovery.filter((item) => item.media.type === "tv")).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);

    const assignedKeys = [...keys(top), ...keys(movies), ...keys(series), ...keys(discovery)];
    expect(new Set(assignedKeys).size).toBe(assignedKeys.length);
    expect(assignedKeys).not.toContain("movie:1");
  });

  it("füllt ein Kontingent nach, wenn ein aktuell sichtbarer Hero zusätzlich ausgeschlossen wird", () => {
    const top = recommendationsForCategory("more", recommendations, new Set(["movie:2"]));
    expect(top.filter((item) => item.media.type === "movie")).toHaveLength(RECOMMENDATIONS_PER_MEDIA_TYPE);
    expect(keys(top)).not.toContain("movie:2");
  });

  it("erstellt eigene Film- und Serientitel pro Kategorie", () => {
    expect(categoryTitleForMediaType("more", "movie")).toBe("Top-Auswahl für dich – Filme");
    expect(categoryTitleForMediaType("more", "tv")).toBe("Top-Auswahl für dich – Serien");
    expect(categorySupportsMediaType("movies", "tv")).toBe(false);
    expect(categorySupportsMediaType("series", "tv")).toBe(true);
  });

  it("akzeptiert keine geerbten Objekteigenschaften als Kategorie", () => {
    expect(isRecommendationCategorySlug("toString")).toBe(false);
  });
});
