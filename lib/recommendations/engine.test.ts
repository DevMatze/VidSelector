import { describe, expect, it } from "vitest";
import { buildTasteProfile, scoreRecommendations } from "@/lib/recommendations/engine";
import type { StoredRating } from "@/lib/data";
import type { MediaSummary, RatingValue } from "@/lib/types";

const sciFi: MediaSummary = {
  tmdbId: 1,
  type: "tv",
  title: "Dunkle Zukunft",
  overview: "",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2021-01-01",
  genres: [{ id: 878, name: "Science-Fiction" }],
  voteAverage: 8,
  popularity: 100,
  originalLanguage: "de",
};
const romance: MediaSummary = {
  tmdbId: 2,
  type: "movie",
  title: "Kitsch",
  overview: "",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2020-01-01",
  genres: [{ id: 10749, name: "Romanze" }],
  voteAverage: 8,
  popularity: 100,
  originalLanguage: "en",
};
const candidateSciFi: MediaSummary = { ...sciFi, tmdbId: 3, title: "Zeitschleife" };
const candidateRomance: MediaSummary = { ...romance, tmdbId: 4, title: "Große Liebe" };

function rating(media: MediaSummary, value: RatingValue): StoredRating {
  return { id: String(media.tmdbId), value, createdAt: "2026-01-01", updatedAt: "2026-01-01", media, metadata: {} };
}

describe("scoreRecommendations", () => {
  it("behandelt neutrale Bewertungen tatsächlich neutral", () => {
    const profile = buildTasteProfile([rating(sciFi, "neutral")]);

    expect(profile.genreScores["Science-Fiction"]).toBe(0);
    expect(profile.languageScores.de).toBe(0);
    expect(profile.decadeScores["2020er"]).toBe(0);
    expect(profile.preferredGenres).toEqual([]);
    expect(profile.avoidedGenres).toEqual([]);
  });

  it("schließt bereits bewertete Titel vollständig aus", () => {
    const result = scoreRecommendations(
      [rating(sciFi, "like")],
      [
        { media: sciFi, source: "popular" },
        { media: candidateSciFi, source: "popular" },
      ],
    );
    expect(result.recommendations.map((item) => item.media.tmdbId)).toEqual([3]);
  });

  it("bevorzugt positive Muster und senkt negative aktiv ab", () => {
    const result = scoreRecommendations(
      [rating(sciFi, "like"), rating(romance, "dislike")],
      [
        { media: candidateRomance, source: "popular" },
        { media: candidateSciFi, source: "popular" },
      ],
    );
    expect(result.recommendations[0].media.tmdbId).toBe(3);
    expect(result.recommendations[0].reasons.join(" ")).toContain("Science-Fiction");
  });

  it("macht ähnliche positive Titel erklärbar", () => {
    const result = scoreRecommendations(
      [rating(sciFi, "like")],
      [{ media: candidateSciFi, source: "similar", similarTo: [{ title: sciFi.title, value: "like" }] }],
    );
    expect(result.recommendations[0].reasons[0]).toContain(sciFi.title);
    expect(result.recommendations[0].score).toBeGreaterThan(25);
  });

  it("wertet kombinierte Seriengenres mit denselben Facetten wie Filmgenres", () => {
    const fantasy = { ...romance, tmdbId: 20, title: "Fantasyfilm", genres: [{ id: 14, name: "Fantasy" }] };
    const combined = {
      ...sciFi,
      tmdbId: 21,
      title: "Fantasyserie",
      genres: [{ id: 10765, name: "Science-Fiction & Fantasy" }],
    };
    const result = scoreRecommendations([rating(fantasy, "like")], [{ media: combined, source: "popular" }]);

    expect(result.recommendations[0].reasons.join(" ")).toContain("Fantasy");
    expect(result.recommendations[0].source).toBe("profile");
  });

  it("berücksichtigt bekannte Personen und die Verlässlichkeit öffentlicher Bewertungen", () => {
    const liked = { ...rating(sciFi, "like"), metadata: { cast: [{ id: 1, name: "Alex Beispiel" }] } };
    const reliable = { ...candidateSciFi, tmdbId: 30, voteAverage: 8, voteCount: 20_000 };
    const uncertain = { ...candidateSciFi, tmdbId: 31, voteAverage: 8, voteCount: 1 };
    const result = scoreRecommendations(
      [liked],
      [
        { media: uncertain, source: "popular" },
        { media: reliable, source: "popular", people: ["Alex Beispiel"] },
      ],
    );

    expect(result.recommendations[0].media.tmdbId).toBe(30);
    expect(result.recommendations[0].reasons.join(" ")).toContain("Alex Beispiel");
  });

  it("blendet ausdrücklich uninteressante Titel dauerhaft aus", () => {
    const result = scoreRecommendations(
      [],
      [
        {
          media: candidateSciFi,
          source: "popular",
          signal: { displayCount: 1, clickCount: 0, skipCount: 0, dismissed: true },
        },
        { media: candidateRomance, source: "popular" },
      ],
    );

    expect(result.recommendations.map((item) => item.media.tmdbId)).toEqual([4]);
  });

  it("reduziert Wiederholungen und wertet einen Klick nur vorsichtig positiv", () => {
    const result = scoreRecommendations(
      [],
      [
        {
          media: candidateSciFi,
          source: "popular",
          signal: { displayCount: 8, clickCount: 0, skipCount: 2, dismissed: false },
        },
        {
          media: candidateRomance,
          source: "popular",
          signal: { displayCount: 1, clickCount: 1, skipCount: 0, dismissed: false },
        },
      ],
    );

    expect(result.recommendations[0].media.tmdbId).toBe(4);
  });

  it("kann nachweislich erfolgreiche Empfehlungsquellen leicht bevorzugen", () => {
    const result = scoreRecommendations(
      [],
      [
        { media: candidateSciFi, source: "similar", sourceAdjustment: 2 },
        { media: candidateRomance, source: "popular", sourceAdjustment: -2 },
      ],
    );

    expect(result.recommendations[0].media.tmdbId).toBe(3);
  });
});
