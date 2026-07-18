import { describe, expect, it } from "vitest";
import { profileImportRequestSchema } from "@/lib/profile-transfer";

const data = {
  format: "vidselector-profile",
  version: 2,
  exportedAt: "2026-07-18T00:00:00.000Z",
  profile: { name: "Filmfan" },
  ratings: [{ type: "movie", tmdbId: 1, value: "like" }],
  watchEntries: [{ type: "tv", tmdbId: 2 }],
};

describe("VidSelector-Profiltransfer", () => {
  it("akzeptiert das versionierte Exportformat", () => {
    expect(profileImportRequestSchema.parse({ mode: "merge", data }).data).toMatchObject(data);
  });

  it("weist unbekannte Versionen ab", () => {
    expect(profileImportRequestSchema.safeParse({ mode: "merge", data: { ...data, version: 3 } }).success).toBe(false);
  });

  it("übernimmt aus Version 1 nur geplante und angefangene Titel als Merkeinträge", () => {
    const parsed = profileImportRequestSchema.parse({
      mode: "merge",
      data: {
        ...data,
        version: 1,
        watchEntries: [
          { type: "tv", tmdbId: 2, status: "planned" },
          { type: "movie", tmdbId: 3, status: "watching" },
          { type: "movie", tmdbId: 4, status: "completed" },
        ],
      },
    });

    expect(parsed.data.version).toBe(2);
    expect(parsed.data.watchEntries).toEqual([
      { type: "tv", tmdbId: 2 },
      { type: "movie", tmdbId: 3 },
    ]);
  });
});
