import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    searchCache: { deleteMany: mocks.deleteMany },
    mediaItem: { updateMany: mocks.updateMany },
    $transaction: mocks.transaction,
  },
}));

import { invalidateLocalizedMediaCache } from "@/lib/localized-cache";

describe("invalidateLocalizedMediaCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteMany.mockReturnValue("search-operation");
    mocks.updateMany.mockReturnValue("media-operation");
    mocks.transaction.mockResolvedValue([]);
  });

  it("entfernt Suchergebnisse und lässt Mediendetails neu laden", async () => {
    await invalidateLocalizedMediaCache("user-1");

    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { scopeId: "user-1" } });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { scopeId: "user-1" },
      data: {
        expiresAt: expect.any(Date),
        detailsExpiresAt: null,
      },
    });
    expect(mocks.transaction).toHaveBeenCalledWith(["search-operation", "media-operation"]);
  });
});
