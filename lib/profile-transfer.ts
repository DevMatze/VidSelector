import { z } from "zod";
import { mediaTypeSchema, ratingValueSchema } from "@/lib/validation";

const exportedMediaSchema = z.object({
  type: mediaTypeSchema,
  tmdbId: z.number().int().positive(),
  title: z.string().min(1).max(300).optional(),
});

const exportedRatingSchema = exportedMediaSchema.extend({
  value: ratingValueSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const exportedWatchEntrySchema = exportedMediaSchema.extend({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const profileBaseSchema = z.object({
  format: z.literal("vidselector-profile"),
  exportedAt: z.string().datetime(),
  profile: z.object({ name: z.string().trim().min(1).max(80) }),
  ratings: z.array(exportedRatingSchema).max(10_000),
});

export const profileExportSchema = profileBaseSchema.extend({
  version: z.literal(2),
  watchEntries: z.array(exportedWatchEntrySchema).max(10_000),
});

const legacyProfileExportSchema = profileBaseSchema.extend({
  version: z.literal(1),
  watchEntries: z
    .array(
      exportedWatchEntrySchema.extend({
        status: z.enum(["planned", "watching", "completed", "dropped"]),
      }),
    )
    .max(10_000),
});

export const profileImportRequestSchema = z
  .object({
    mode: z.enum(["merge", "replace"]),
    data: z.union([profileExportSchema, legacyProfileExportSchema]),
  })
  .transform(({ mode, data }) => ({
    mode,
    data:
      data.version === 2
        ? data
        : {
            ...data,
            version: 2 as const,
            watchEntries: data.watchEntries
              .filter((entry) => entry.status === "planned" || entry.status === "watching")
              .map(({ status: _status, ...entry }) => entry),
          },
  }));

export type ProfileExport = z.infer<typeof profileExportSchema>;
export type ProfileImportMode = z.infer<typeof profileImportRequestSchema>["mode"];
