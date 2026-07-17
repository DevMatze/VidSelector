import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteSearch: vi.fn(),
  deleteMedia: vi.fn(),
  scrubMedia: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    searchCache: { deleteMany: mocks.deleteSearch },
    mediaItem: { deleteMany: mocks.deleteMedia, updateMany: mocks.scrubMedia },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/data", () => ({ mediaItemToSummary: vi.fn() }));

import { CACHE_TTL, purgeExpiredMediaCache } from "@/lib/media-cache";

describe("TMDB-konforme Cache-Bereinigung", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteSearch.mockResolvedValue({ count: 0 });
    mocks.deleteMedia.mockResolvedValue({ count: 0 });
    mocks.scrubMedia.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations));
  });

  it("löscht ungenutzte Medien und entfernt TMDB-Inhalte aus weiterhin referenzierten Datensätzen", async () => {
    const before = Date.now();
    await purgeExpiredMediaCache();

    const deleteWhere = mocks.deleteMedia.mock.calls[0][0].where;
    const scrub = mocks.scrubMedia.mock.calls[0][0];
    const maximumAge = deleteWhere.cachedAt.lt as Date;

    expect(maximumAge.getTime()).toBeGreaterThanOrEqual(before - CACHE_TTL.maximum - 50);
    expect(deleteWhere).toMatchObject({
      ratings: { none: {} },
      recommendations: { none: {} },
      watchEntries: { none: {} },
    });
    expect(scrub.where.OR).toEqual([
      { ratings: { some: {} } },
      { recommendations: { some: {} } },
      { watchEntries: { some: {} } },
    ]);
    expect(scrub.data).toMatchObject({
      title: "Metadaten abgelaufen",
      metadata: "{}",
      genres: "[]",
      posterPath: null,
      detailsExpiresAt: null,
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});
