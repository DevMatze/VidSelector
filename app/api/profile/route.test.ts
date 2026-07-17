import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getRatings: vi.fn(),
  resetProfile: vi.fn(),
  updateProfileName: vi.fn(),
  buildTasteProfile: vi.fn(),
  maintainMediaCache: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getProfile: mocks.getProfile,
  getRatings: mocks.getRatings,
  resetProfile: mocks.resetProfile,
  updateProfileName: mocks.updateProfileName,
}));
vi.mock("@/lib/recommendations/engine", () => ({ buildTasteProfile: mocks.buildTasteProfile }));
vi.mock("@/lib/media-cache", () => ({ maintainMediaCache: mocks.maintainMediaCache }));

import { GET, PATCH } from "@/app/api/profile/route";

describe("/api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("liefert das Geschmacksprofil ohne Empfehlungen zu erzeugen", async () => {
    mocks.getProfile.mockResolvedValue({ name: "Filmfan" });
    mocks.getRatings.mockResolvedValue([]);
    mocks.buildTasteProfile.mockReturnValue({ ratingCount: 0 });
    const response = await GET(new Request("http://localhost/api/profile"));
    expect(await response.json()).toEqual({ profile: { name: "Filmfan" }, taste: { ratingCount: 0 } });
  });

  it("liefert für die Navigation nur die kompakte Profilzusammenfassung", async () => {
    mocks.getProfile.mockResolvedValue({ name: "Filmfan" });
    const response = await GET(new Request("http://localhost/api/profile?summary=1"));
    expect(await response.json()).toEqual({ profile: { name: "Filmfan" } });
    expect(mocks.getRatings).not.toHaveBeenCalled();
  });

  it("weist profiländernde Cross-Site-Anfragen ab", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
        body: JSON.stringify({ name: "Test" }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mocks.updateProfileName).not.toHaveBeenCalled();
  });
});
