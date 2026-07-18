import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  importProfileData: vi.fn(),
  createProfileBackup: vi.fn(),
}));

vi.mock("@/lib/data", () => ({ importProfileData: mocks.importProfileData }));
vi.mock("@/lib/profile-backups", () => ({ createProfileBackup: mocks.createProfileBackup }));

import { POST } from "@/app/api/profile/import/route";

const data = {
  format: "vidselector-profile",
  version: 2,
  exportedAt: "2026-07-18T00:00:00.000Z",
  profile: { name: "Filmfan" },
  ratings: [],
  watchEntries: [],
};

describe("POST /api/profile/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProfileBackup.mockResolvedValue("backup.json");
    mocks.importProfileData.mockResolvedValue({ ratings: 0, watchEntries: 0, mode: "merge" });
  });

  it("sichert den Ist-Stand vor einem validierten Import", async () => {
    const response = await POST(
      new Request("http://localhost/api/profile/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost", Host: "localhost" },
        body: JSON.stringify({ mode: "merge", data }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createProfileBackup).toHaveBeenCalledWith("before-import");
    expect(mocks.importProfileData).toHaveBeenCalledWith(data, "merge");
  });

  it("verändert bei unbekannten Exportversionen keine Daten", async () => {
    const response = await POST(
      new Request("http://localhost/api/profile/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "replace", data: { ...data, version: 99 } }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createProfileBackup).not.toHaveBeenCalled();
    expect(mocks.importProfileData).not.toHaveBeenCalled();
  });
});
