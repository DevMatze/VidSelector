import { describe, expect, it } from "vitest";
import {
  genreFacets,
  genreIdsMatchingQuery,
  matchesGenreFilter,
  normalizeGenres,
  normalizeMediaGenres,
} from "@/lib/genres";

describe("Genre-Normalisierung", () => {
  it("ersetzt gespeicherte numerische Platzhalter durch deutsche Namen", () => {
    expect(
      normalizeGenres([
        { id: 12, name: "Genre 12" },
        { id: 14, name: "Genre 14" },
        { id: 878, name: "Genre 878" },
      ]),
    ).toEqual([
      { id: 12, name: "Abenteuer" },
      { id: 14, name: "Fantasy" },
      { id: 878, name: "Science-Fiction" },
    ]);
  });

  it("teilt kombinierte Seriengenres in auswählbare Filter auf", () => {
    const genres = [
      { id: 10759, name: "Action & Adventure" },
      { id: 10765, name: "Sci-Fi & Fantasy" },
    ];

    expect(genreFacets(genres)).toEqual(["Action", "Abenteuer", "Science-Fiction", "Fantasy"]);
    expect(matchesGenreFilter(genres, "Fantasy")).toBe(true);
    expect(matchesGenreFilter(genres, "Science-Fiction")).toBe(true);
  });

  it("findet für Genre-Suchbegriffe Film- und Serien-IDs", () => {
    expect(genreIdsMatchingQuery("Fantasy")).toEqual(expect.arrayContaining([14, 10765]));
    expect(genreIdsMatchingQuery("Action")).toEqual(expect.arrayContaining([28, 10759]));
    expect(genreIdsMatchingQuery("Anime")).toEqual([16]);
  });

  it("trennt japanische Anime exklusiv von sonstiger Animation", () => {
    const base = {
      tmdbId: 1,
      type: "tv" as const,
      title: "Beispiel",
      overview: "",
      posterPath: null,
      backdropPath: null,
      releaseDate: "2020-01-01",
      genres: [{ id: 16, name: "Animation" }],
      voteAverage: 8,
      popularity: 10,
    };
    const anime = normalizeMediaGenres({ ...base, originalLanguage: "ja" });
    const animation = normalizeMediaGenres({ ...base, originalLanguage: "en" });

    expect(anime.genres[0].name).toBe("Anime");
    expect(animation.genres[0].name).toBe("Animation");
    expect(matchesGenreFilter(anime.genres, "Anime", anime.originalLanguage)).toBe(true);
    expect(matchesGenreFilter(anime.genres, "Animation", anime.originalLanguage)).toBe(false);
    expect(matchesGenreFilter(animation.genres, "Animation", animation.originalLanguage)).toBe(true);
    expect(matchesGenreFilter(animation.genres, "Anime", animation.originalLanguage)).toBe(false);
  });
});
