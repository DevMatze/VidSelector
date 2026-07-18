import { describe, expect, it } from "vitest";
import { applyConfiguredMediaFeatures, mediaDetailRequestPlan } from "@/lib/media-features";
import { assertFeatureEnabled, FeatureDisabledError } from "@/lib/features";
import { determineDemoMode } from "@/lib/tmdb";
import type { MediaDetails } from "@/lib/types";

const media: MediaDetails = {
  tmdbId: 1,
  type: "movie",
  title: "Test",
  overview: "",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2020-01-01",
  genres: [],
  voteAverage: 8,
  voteCount: 100,
  popularity: 10,
  originalLanguage: "en",
  countries: [],
  cast: [],
  creators: [],
  trailerKey: "abc",
  providers: [{ id: 1, name: "Test", kind: "flatrate" }],
  watchProviderUrl: "https://example.com",
  similar: [
    {
      tmdbId: 2,
      type: "movie",
      title: "Ähnlich",
      overview: "",
      posterPath: null,
      backdropPath: null,
      releaseDate: "2021-01-01",
      genres: [],
      voteAverage: 7,
      voteCount: 1,
      popularity: 1,
      originalLanguage: "en",
    },
  ],
};

const allEnabled = {
  profile_import_export: true,
  streaming_providers: true,
  trailers: true,
  similar_titles: true,
};

describe("funktionswirksame Konfigurationsschalter", () => {
  it("erzwingt den Demo-Katalog und erkennt beide TMDB-Zugangsarten", () => {
    expect(determineDemoMode({}, false)).toBe(true);
    expect(determineDemoMode({ apiKey: "key" }, false)).toBe(false);
    expect(determineDemoMode({ bearerToken: "token" }, false)).toBe(false);
    expect(determineDemoMode({ bearerToken: "token" }, true)).toBe(true);
  });

  it.each([
    ["streaming_providers", "providers"],
    ["trailers", "trailerKey"],
    ["similar_titles", "similar"],
  ] as const)("entfernt deaktivierte Mediendaten für %s", (feature, field) => {
    const filtered = applyConfiguredMediaFeatures(media, { ...allEnabled, [feature]: false });
    expect(field === "trailerKey" ? filtered.trailerKey : filtered[field]).toEqual(
      field === "trailerKey" ? undefined : [],
    );
  });

  it("plant für deaktivierte Medienfunktionen keine zugehörigen TMDB-Anfragen", () => {
    expect(
      mediaDetailRequestPlan({
        ...allEnabled,
        streaming_providers: false,
        trailers: false,
        similar_titles: false,
      }),
    ).toEqual({ appendedResponses: ["credits"], fetchProviders: false });
    expect(mediaDetailRequestPlan(allEnabled)).toEqual({
      appendedResponses: ["credits", "videos", "similar", "recommendations"],
      fetchProviders: true,
    });
  });

  it("blockiert deaktivierten Profilimport und -export serverseitig", () => {
    expect(() =>
      assertFeatureEnabled("profile_import_export", { ...allEnabled, profile_import_export: false }),
    ).toThrow(FeatureDisabledError);
  });
});
