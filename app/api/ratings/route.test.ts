import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { MediaSummary } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getRatings: vi.fn(),
  getCachedMediaDetails: vi.fn(),
  getMediaDetails: vi.fn(),
  saveRating: vi.fn(),
  getProfileLanguage: vi.fn(),
}));
vi.mock("@/lib/data", () => ({
  getRatings: mocks.getRatings,
  getRating: vi.fn(),
  deleteRating: vi.fn(),
  saveRating: mocks.saveRating,
  getProfileLanguage: mocks.getProfileLanguage,
}));
vi.mock("@/lib/media-cache", () => ({ getCachedMediaDetails: mocks.getCachedMediaDetails }));
vi.mock("@/lib/tmdb", () => ({ getMediaDetails: mocks.getMediaDetails, TmdbError: class TmdbError extends Error {} }));

import { GET } from "@/app/api/ratings/route";

const media: MediaSummary = {
  tmdbId: 1,
  type: "tv",
  title: "Fantasyserie",
  overview: "",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2020-01-01",
  genres: [{ id: 10765, name: "Science-Fiction & Fantasy" }],
  voteAverage: 8,
  popularity: 10,
  originalLanguage: "en",
};

describe("GET /api/ratings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtert kombinierte Seriengenres über ihre Facetten", async () => {
    mocks.getRatings.mockResolvedValue([
      { id: "1", value: "like", createdAt: "2026-01-01", updatedAt: "2026-01-01", media, metadata: {} },
    ]);
    const response = await GET(new NextRequest("http://localhost/api/ratings?type=tv&genre=Fantasy"));
    const body = await response.json();
    expect(body.ratings).toHaveLength(1);
    expect(body.genres).toContain("Fantasy");
    expect(body.totalRatings).toBe(1);
  });
});
