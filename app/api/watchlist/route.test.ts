import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getWatchEntries: vi.fn(),
  saveWatchEntry: vi.fn(),
  deleteWatchEntry: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getWatchEntries: mocks.getWatchEntries,
  saveWatchEntry: mocks.saveWatchEntry,
  deleteWatchEntry: mocks.deleteWatchEntry,
}));

import { GET, POST } from "@/app/api/watchlist/route";

const media = {
  tmdbId: 1,
  type: "movie" as const,
  title: "Testfilm",
  overview: "",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2020-01-01",
  genres: [],
  voteAverage: 7,
  popularity: 10,
  originalLanguage: "de",
};

describe("/api/watchlist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtert die persönliche Merkliste nach Status", async () => {
    mocks.getWatchEntries.mockResolvedValue([
      { id: "1", status: "planned", createdAt: "2026-01-01", updatedAt: "2026-01-01", media },
      {
        id: "2",
        status: "completed",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
        media: { ...media, tmdbId: 2 },
      },
    ]);
    const response = await GET(new NextRequest("http://localhost/api/watchlist?status=planned"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.entries).toHaveLength(1);
    expect(body.totalEntries).toBe(2);
  });

  it("speichert Status und Bewertung voneinander unabhängig", async () => {
    mocks.saveWatchEntry.mockResolvedValue({ id: "1", status: "planned", media });
    const response = await POST(
      new Request("http://localhost/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost", Host: "localhost" },
        body: JSON.stringify({ media, status: "planned" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.saveWatchEntry).toHaveBeenCalledWith(media, "planned");
  });

  it("blockiert profiländernde Cross-Site-Anfragen", async () => {
    const response = await POST(
      new Request("http://localhost/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
        body: JSON.stringify({ media, status: "planned" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.saveWatchEntry).not.toHaveBeenCalled();
  });
});
