import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: mocks.queryRaw } }));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports a healthy application when SQLite responds", async () => {
    mocks.queryRaw.mockResolvedValue([{ ok: 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("reports an unavailable application when SQLite fails", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });
});
