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

const recommendations = Array.from({ length: 40 }, (_, index) =>
  recommendation(index + 1, index % 2 === 0 ? "movie" : "tv", index >= 35 ? "discovery" : "popular"),
);

describe("recommendationsForCategory", () => {
  it("filtert Film-, Serien- und Entdeckungskategorien korrekt", () => {
    expect(recommendationsForCategory("movies", recommendations).map((item) => item.media.tmdbId)).toEqual([33, 35]);
    expect(recommendationsForCategory("series", recommendations).map((item) => item.media.tmdbId)).toEqual([32, 34]);
    expect(recommendationsForCategory("discovery", recommendations).map((item) => item.media.tmdbId)).toEqual([
      36, 37, 38, 39, 40,
    ]);
  });

  it("lässt bei weiteren passenden Titeln die Hero-Empfehlung aus", () => {
    expect(recommendationsForCategory("more", recommendations).map((item) => item.media.tmdbId)).toEqual(
      Array.from({ length: 30 }, (_, index) => index + 2),
    );
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
