import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getRatings: vi.fn(),
  getCandidatePool: vi.fn(),
  cacheMediaSummaries: vi.fn(),
  cacheSearch: vi.fn(),
  getCachedSearch: vi.fn(),
  getCachedCandidatePeople: vi.fn(),
  scoreRecommendations: vi.fn(),
  saveRecommendationHistory: vi.fn(),
  candidatesFromRatings: vi.fn(),
  markRecommendationEvents: vi.fn(),
  getRecommendationSignals: vi.fn(),
  getRecommendationSourceAdjustments: vi.fn(),
  getWatchStatusMap: vi.fn(),
}));
vi.mock("@/lib/data", () => ({
  getRatings: mocks.getRatings,
  saveRecommendationHistory: mocks.saveRecommendationHistory,
  getCachedCandidatePeople: mocks.getCachedCandidatePeople,
  markRecommendationEvents: mocks.markRecommendationEvents,
  getRecommendationSignals: mocks.getRecommendationSignals,
  getRecommendationSourceAdjustments: mocks.getRecommendationSourceAdjustments,
  getWatchStatusMap: mocks.getWatchStatusMap,
}));
vi.mock("@/lib/media-cache", () => ({
  cacheMediaSummaries: mocks.cacheMediaSummaries,
  cacheSearch: mocks.cacheSearch,
  getCachedSearch: mocks.getCachedSearch,
}));
vi.mock("@/lib/recommendations/engine", () => ({
  candidatesFromRatings: mocks.candidatesFromRatings,
  scoreRecommendations: mocks.scoreRecommendations,
}));
vi.mock("@/lib/tmdb", () => ({
  getCandidatePool: mocks.getCandidatePool,
  isDemoMode: true,
  TmdbError: class TmdbError extends Error {},
}));

import { GET } from "@/app/api/recommendations/route";

describe("GET /api/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRatings.mockResolvedValue([]);
    mocks.getCandidatePool.mockResolvedValue([]);
    mocks.candidatesFromRatings.mockReturnValue([]);
    mocks.getCachedCandidatePeople.mockResolvedValue(new Map());
    mocks.getRecommendationSignals.mockResolvedValue(new Map());
    mocks.getRecommendationSourceAdjustments.mockResolvedValue({});
    mocks.getWatchStatusMap.mockResolvedValue(new Map());
    mocks.cacheSearch.mockResolvedValue(undefined);
    mocks.scoreRecommendations.mockReturnValue({ profile: { ratingCount: 0 }, recommendations: [] });
  });

  it("erzwingt bei manueller Aktualisierung einen frischen Kandidatenpool", async () => {
    const response = await GET(new NextRequest("http://localhost/api/recommendations?refresh=1"));
    expect(response.status).toBe(200);
    expect(mocks.getCandidatePool).toHaveBeenCalledWith(true);
    expect(mocks.saveRecommendationHistory).toHaveBeenCalledWith([]);
  });

  it("verwendet einen vollständigen lokalen Kandidatenpool vor TMDB", async () => {
    const media = {
      tmdbId: 1,
      type: "movie",
      title: "Lokal",
      overview: "",
      posterPath: null,
      backdropPath: null,
      releaseDate: "2020-01-01",
      genres: [],
      voteAverage: 7,
      popularity: 10,
      originalLanguage: "de",
    };
    mocks.getCachedSearch
      .mockResolvedValueOnce({ results: [media], totalPages: 1 })
      .mockResolvedValueOnce({ results: [], totalPages: 1 });

    const response = await GET(new NextRequest("http://localhost/api/recommendations"));

    expect(response.status).toBe(200);
    expect(mocks.getCandidatePool).not.toHaveBeenCalled();
    expect(mocks.scoreRecommendations).toHaveBeenCalledWith(
      [],
      [expect.objectContaining({ media, source: "popular" })],
    );
  });
});
