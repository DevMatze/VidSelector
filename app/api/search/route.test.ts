import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { MediaSummary } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  findCachedMedia: vi.fn(),
  getCachedSearch: vi.fn(),
  cacheSearch: vi.fn(),
  purgeExpiredMediaCache: vi.fn(),
  searchMedia: vi.fn(),
  getBookmarkMap: vi.fn(),
  getProfileLanguage: vi.fn(),
}));
vi.mock("@/lib/data", () => ({
  getBookmarkMap: mocks.getBookmarkMap,
  getProfileLanguage: mocks.getProfileLanguage,
}));

vi.mock("@/lib/media-cache", () => ({
  findCachedMedia: mocks.findCachedMedia,
  getCachedSearch: mocks.getCachedSearch,
  cacheSearch: mocks.cacheSearch,
  purgeExpiredMediaCache: mocks.purgeExpiredMediaCache,
}));

vi.mock("@/lib/tmdb", () => ({
  isDemoMode: false,
  searchMedia: mocks.searchMedia,
  TmdbError: class TmdbError extends Error {},
}));

import { GET } from "@/app/api/search/route";

const result: MediaSummary = {
  tmdbId: 70523,
  type: "tv",
  title: "Dark",
  overview: "Eine deutsche Mysteryserie.",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2017-12-01",
  genres: [{ id: 9648, name: "Mystery" }],
  voteAverage: 8.4,
  popularity: 120,
  originalLanguage: "de",
};

function request(query: string) {
  return new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(query)}`);
}

describe("GET /api/search cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCachedSearch.mockResolvedValue(null);
    mocks.purgeExpiredMediaCache.mockResolvedValue(undefined);
    mocks.getBookmarkMap.mockResolvedValue(new Map());
    mocks.getProfileLanguage.mockResolvedValue("de");
  });

  it("liefert lokale Treffer ohne TMDB-Anfrage", async () => {
    mocks.getCachedSearch.mockResolvedValue({ results: [result], totalPages: 1 });

    const response = await GET(request("Dark"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ results: [result], cacheHit: true });
    expect(mocks.getCachedSearch).toHaveBeenCalledWith("Dark", 1);
    expect(mocks.findCachedMedia).not.toHaveBeenCalled();
    expect(mocks.searchMedia).not.toHaveBeenCalled();
    expect(mocks.cacheSearch).not.toHaveBeenCalled();
  });

  it("fragt bei einem Cache-Miss TMDB ab und speichert die Ergebnisse", async () => {
    mocks.findCachedMedia.mockResolvedValue([]);
    mocks.searchMedia.mockResolvedValue({ results: [result], totalPages: 3 });

    const response = await GET(request("Dark"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ results: [result], cacheHit: false });
    expect(mocks.findCachedMedia).toHaveBeenCalledWith("Dark");
    expect(mocks.searchMedia).toHaveBeenCalledWith("Dark", 1, "de");
    expect(mocks.cacheSearch).toHaveBeenCalledWith("Dark", 1, [result], 3);
  });

  it("ergänzt unvollständige lokale Treffer mit TMDB-Ergebnissen", async () => {
    const second = { ...result, tmdbId: 2, title: "Dark Matter" };
    mocks.findCachedMedia.mockResolvedValue([result]);
    mocks.searchMedia.mockResolvedValue({ results: [result, second], totalPages: 1 });

    const response = await GET(request("Dark"));
    const body = await response.json();

    expect(body.results).toEqual([
      { ...result, bookmarked: false },
      { ...second, bookmarked: false },
    ]);
    expect(mocks.searchMedia).toHaveBeenCalledOnce();
  });

  it("liefert bei einem TMDB-Ausfall vorhandene lokale Treffer als Teilresultat", async () => {
    mocks.findCachedMedia.mockResolvedValue([result]);
    mocks.searchMedia.mockRejectedValue(new Error("offline"));

    const response = await GET(request("Dark"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ results: [result], partial: true, cacheHit: true });
    expect(mocks.cacheSearch).not.toHaveBeenCalled();
  });
});
