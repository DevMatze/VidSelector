import { z } from "zod";
import { mediaTypeSchema, ratingValueSchema, watchStatusSchema } from "@/lib/validation";

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
  status: watchStatusSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const profileExportSchema = z.object({
  format: z.literal("vidselector-profile"),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  profile: z.object({ name: z.string().trim().min(1).max(80) }),
  ratings: z.array(exportedRatingSchema).max(10_000),
  watchEntries: z.array(exportedWatchEntrySchema).max(10_000),
});

export const profileImportRequestSchema = z.object({
  mode: z.enum(["merge", "replace"]),
  data: profileExportSchema,
});

export type ProfileExport = z.infer<typeof profileExportSchema>;
export type ProfileImportMode = z.infer<typeof profileImportRequestSchema>["mode"];
