import { describe, expect, it } from "vitest";
import { profileImportRequestSchema } from "@/lib/profile-transfer";

const data = {
  format: "vidselector-profile",
  version: 1,
  exportedAt: "2026-07-18T00:00:00.000Z",
  profile: { name: "Filmfan" },
  ratings: [{ type: "movie", tmdbId: 1, value: "like" }],
  watchEntries: [{ type: "tv", tmdbId: 2, status: "planned" }],
};

describe("VidSelector-Profiltransfer", () => {
  it("akzeptiert das versionierte Exportformat", () => {
    expect(profileImportRequestSchema.parse({ mode: "merge", data }).data).toMatchObject(data);
  });

  it("weist unbekannte Versionen und ungültige Statuswerte ab", () => {
    expect(profileImportRequestSchema.safeParse({ mode: "merge", data: { ...data, version: 2 } }).success).toBe(false);
    expect(
      profileImportRequestSchema.safeParse({
        mode: "merge",
        data: { ...data, watchEntries: [{ type: "tv", tmdbId: 2, status: "paused" }] },
      }).success,
    ).toBe(false);
  });
});
