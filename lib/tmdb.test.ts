import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getCandidatePool", () => {
  it("lädt fünf Seiten für Filme und Serien aus beiden Empfehlungsquellen", async () => {
    vi.stubEnv("TMDB_BEARER_TOKEN", "test-token");
    vi.stubEnv("DEMO_MODE", "false");
    const requestedUrls: URL[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | RequestInfo) => {
        const url = new URL(String(input));
        requestedUrls.push(url);
        if (url.pathname.includes("/genre/")) {
          return Response.json({ genres: [] });
        }
        const page = Number(url.searchParams.get("page"));
        const typeOffset = url.pathname.includes("/tv/") ? 10_000 : 0;
        const sourceOffset = url.pathname.includes("top_rated") ? 20_000 : 0;
        return Response.json({
          results: [
            {
              id: sourceOffset + typeOffset + page,
              title: `Titel ${page}`,
              name: `Serie ${page}`,
              genre_ids: [],
              vote_average: 7,
              popularity: 10,
            },
          ],
        });
      }),
    );

    const { getCandidatePool, isDemoMode } = await import("@/lib/tmdb");
    const pool = await getCandidatePool(true);
    const candidateRequests = requestedUrls.filter((url) => !url.pathname.includes("/genre/"));

    expect(isDemoMode).toBe(false);
    expect(candidateRequests).toHaveLength(20);
    expect(new Set(candidateRequests.map((url) => url.searchParams.get("page")))).toEqual(
      new Set(["1", "2", "3", "4", "5"]),
    );
    expect(pool.filter(({ media }) => media.type === "movie")).toHaveLength(10);
    expect(pool.filter(({ media }) => media.type === "tv")).toHaveLength(10);
    expect(pool.filter(({ source }) => source === "popular")).toHaveLength(10);
    expect(pool.filter(({ source }) => source === "discovery")).toHaveLength(10);
  });
});
