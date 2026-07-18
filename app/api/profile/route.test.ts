import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getRatings: vi.fn(),
  resetProfile: vi.fn(),
  updateProfile: vi.fn(),
  buildTasteProfile: vi.fn(),
  maintainMediaCache: vi.fn(),
  maintainAutomaticProfileBackups: vi.fn(),
  createProfileBackup: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getProfile: mocks.getProfile,
  getRatings: mocks.getRatings,
  resetProfile: mocks.resetProfile,
  updateProfile: mocks.updateProfile,
}));
vi.mock("@/lib/recommendations/engine", () => ({ buildTasteProfile: mocks.buildTasteProfile }));
vi.mock("@/lib/media-cache", () => ({ maintainMediaCache: mocks.maintainMediaCache }));
vi.mock("@/lib/profile-backups", () => ({
  maintainAutomaticProfileBackups: mocks.maintainAutomaticProfileBackups,
  createProfileBackup: mocks.createProfileBackup,
}));

import { GET, PATCH } from "@/app/api/profile/route";

describe("/api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.maintainAutomaticProfileBackups.mockResolvedValue(null);
  });

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
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("speichert Name und unterstützte Profilsprache gemeinsam", async () => {
    mocks.updateProfile.mockResolvedValue({ name: "Marcel", language: "fr" });
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: "http://localhost", Host: "localhost" },
        body: JSON.stringify({ name: "Marcel", language: "fr" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.updateProfile).toHaveBeenCalledWith("Marcel", "fr");
  });

  it("weist nicht unterstützte Profilsprache ab", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Marcel", language: "it" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });
});
