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
    const pool = await getCandidatePool(true, "fr");
    const candidateRequests = requestedUrls.filter((url) => !url.pathname.includes("/genre/"));

    expect(isDemoMode).toBe(false);
    expect(candidateRequests).toHaveLength(20);
    expect(requestedUrls.every((url) => url.searchParams.get("language") === "fr-FR")).toBe(true);
    expect(new Set(candidateRequests.map((url) => url.searchParams.get("page")))).toEqual(
      new Set(["1", "2", "3", "4", "5"]),
    );
    expect(pool.filter(({ media }) => media.type === "movie")).toHaveLength(10);
    expect(pool.filter(({ media }) => media.type === "tv")).toHaveLength(10);
    expect(pool.filter(({ source }) => source === "popular")).toHaveLength(10);
    expect(pool.filter(({ source }) => source === "discovery")).toHaveLength(10);
  });

  it("lädt Details und Ersatzbeschreibung in der Profilsprache", async () => {
    vi.stubEnv("TMDB_BEARER_TOKEN", "test-token");
    vi.stubEnv("DEMO_MODE", "false");
    const requestedUrls: URL[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | RequestInfo) => {
        const url = new URL(String(input));
        requestedUrls.push(url);
        if (url.pathname.includes("/genre/")) return Response.json({ genres: [] });
        if (url.pathname.endsWith("/watch/providers")) return Response.json({ results: {} });
        return Response.json({
          id: 123,
          title: "Una película",
          overview: "",
          genres: [],
          credits: { cast: [], crew: [] },
          videos: { results: [] },
          similar: { results: [] },
          recommendations: { results: [] },
        });
      }),
    );

    const { getMediaDetails } = await import("@/lib/tmdb");
    const details = await getMediaDetails("movie", 123, "es");

    expect(details?.title).toBe("Una película");
    expect(details?.overview).toBe("Todavía no hay una descripción disponible para este título.");
    expect(requestedUrls.every((url) => url.searchParams.get("language") === "es-ES")).toBe(true);
  });

  it("lädt ähnliche Empfehlungen mitsamt Ankertitel neu in der Profilsprache", async () => {
    vi.stubEnv("TMDB_BEARER_TOKEN", "test-token");
    vi.stubEnv("DEMO_MODE", "false");
    const requestedUrls: URL[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | RequestInfo) => {
        const url = new URL(String(input));
        requestedUrls.push(url);
        if (url.pathname.includes("/genre/")) return Response.json({ genres: [{ id: 12, name: "Aventure" }] });
        return Response.json({
          id: 10,
          title: "Titre d’ancrage",
          genres: [],
          recommendations: {
            results: [
              {
                id: 20,
                title: "Titre recommandé",
                overview: "Une description française.",
                genre_ids: [12],
              },
            ],
          },
          similar: { results: [] },
        });
      }),
    );

    const { getRelatedCandidatePool } = await import("@/lib/tmdb");
    const candidates = await getRelatedCandidatePool([{ type: "movie", tmdbId: 10, value: "like" }], "fr");

    expect(candidates).toEqual([
      expect.objectContaining({
        media: expect.objectContaining({
          title: "Titre recommandé",
          overview: "Une description française.",
          genres: [{ id: 12, name: "Aventure" }],
        }),
        similarTo: [{ title: "Titre d’ancrage", value: "like" }],
      }),
    ]);
    expect(requestedUrls.every((url) => url.searchParams.get("language") === "fr-FR")).toBe(true);
  });
});
