import { describe, expect, it } from "vitest";
import {
  categorySupportsMediaType,
  categoryTitleForMediaType,
  isRecommendationCategorySlug,
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
  recommendation(2, "tv", "popular"),
  recommendation(3, "movie", "discovery"),
  recommendation(4, "tv", "discovery"),
];

describe("recommendationsForCategory", () => {
  it("filtert Film-, Serien- und Entdeckungskategorien korrekt", () => {
    expect(recommendationsForCategory("movies", recommendations).map((item) => item.media.tmdbId)).toEqual([1, 3]);
    expect(recommendationsForCategory("series", recommendations).map((item) => item.media.tmdbId)).toEqual([2, 4]);
    expect(recommendationsForCategory("discovery", recommendations).map((item) => item.media.tmdbId)).toEqual([3, 4]);
  });

  it("lässt bei weiteren passenden Titeln die Hero-Empfehlung aus", () => {
    expect(recommendationsForCategory("more", recommendations).map((item) => item.media.tmdbId)).toEqual([2, 3, 4]);
  });

  it("erstellt eigene Film- und Serientitel pro Kategorie", () => {
    expect(categoryTitleForMediaType("more", "movie")).toBe("Weitere passende Titel – Filme");
    expect(categoryTitleForMediaType("more", "tv")).toBe("Weitere passende Titel – Serien");
    expect(categorySupportsMediaType("movies", "tv")).toBe(false);
    expect(categorySupportsMediaType("series", "tv")).toBe(true);
  });

  it("akzeptiert keine geerbten Objekteigenschaften als Kategorie", () => {
    expect(isRecommendationCategorySlug("toString")).toBe(false);
  });
});
