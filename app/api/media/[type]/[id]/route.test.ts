import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaDetails } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getRating: vi.fn(),
  getCachedMediaDetails: vi.fn(),
  cacheMediaDetails: vi.fn(),
  getMediaDetails: vi.fn(),
}));

vi.mock("@/lib/data", () => ({ getRating: mocks.getRating }));
vi.mock("@/lib/media-cache", () => ({
  getCachedMediaDetails: mocks.getCachedMediaDetails,
  cacheMediaDetails: mocks.cacheMediaDetails,
}));
vi.mock("@/lib/tmdb", () => ({
  getMediaDetails: mocks.getMediaDetails,
  isDemoMode: false,
}));

import { GET } from "@/app/api/media/[type]/[id]/route";

const details: MediaDetails = {
  tmdbId: 27205,
  type: "movie",
  title: "Inception",
  overview: "Ein Dieb dringt in Träume ein.",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2010-07-15",
  genres: [{ id: 878, name: "Science-Fiction" }],
  voteAverage: 8.4,
  popularity: 145,
  originalLanguage: "en",
  countries: ["USA"],
  cast: [],
  creators: [],
  providers: [],
  similar: [],
};

const context = { params: Promise.resolve({ type: "movie", id: "27205" }) };

describe("GET /api/media/[type]/[id] cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRating.mockResolvedValue(null);
  });

  it("liefert vollständige lokale Details ohne TMDB-Anfrage", async () => {
    mocks.getCachedMediaDetails.mockResolvedValue(details);

    const response = await GET(new Request("http://localhost/api/media/movie/27205"), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ media: details, cacheHit: true });
    expect(mocks.getMediaDetails).not.toHaveBeenCalled();
    expect(mocks.cacheMediaDetails).not.toHaveBeenCalled();
  });

  it("lädt fehlende Details von TMDB und legt sie im Cache ab", async () => {
    mocks.getCachedMediaDetails.mockResolvedValue(null);
    mocks.getMediaDetails.mockResolvedValue(details);

    const response = await GET(new Request("http://localhost/api/media/movie/27205"), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ media: details, cacheHit: false });
    expect(mocks.getMediaDetails).toHaveBeenCalledWith("movie", 27205);
    expect(mocks.cacheMediaDetails).toHaveBeenCalledWith(details);
  });
});
