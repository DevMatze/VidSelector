import { z } from "zod";

export const mediaTypeSchema = z.enum(["movie", "tv"]);
export const ratingValueSchema = z.enum(["like", "dislike", "neutral"]);

export const genreSchema = z.object({ id: z.number().int(), name: z.string().min(1).max(100) });

export const mediaSummarySchema = z.object({
  tmdbId: z.number().int().positive(),
  type: mediaTypeSchema,
  title: z.string().min(1).max(300),
  originalTitle: z.string().max(300).optional(),
  overview: z.string().max(5000).default(""),
  posterPath: z.string().max(500).nullable(),
  backdropPath: z.string().max(500).nullable(),
  releaseDate: z.string().max(30).default(""),
  genres: z.array(genreSchema).max(30).default([]),
  voteAverage: z.number().min(0).max(10).default(0),
  voteCount: z.number().int().nonnegative().optional(),
  popularity: z.number().nonnegative().default(0),
  originalLanguage: z.string().max(20).default(""),
});

const personSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(200),
  role: z.string().max(300).optional(),
  profilePath: z.string().max(500).nullable().optional(),
});

const watchProviderSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(200),
  logoPath: z.string().max(500).nullable().optional(),
  kind: z.enum(["flatrate", "rent", "buy"]),
});

export const mediaDetailsSchema = mediaSummarySchema.extend({
  runtime: z.number().int().positive().optional(),
  seasons: z.number().int().nonnegative().optional(),
  episodes: z.number().int().nonnegative().optional(),
  countries: z.array(z.string().max(200)).max(30),
  cast: z.array(personSchema).max(100),
  creators: z.array(personSchema).max(50),
  trailerKey: z.string().max(100).optional(),
  providers: z.array(watchProviderSchema).max(100),
  watchProviderUrl: z.string().url().max(1000).optional(),
  similar: z.array(mediaSummarySchema).max(100),
});

export const saveRatingSchema = z.object({
  value: ratingValueSchema,
  media: mediaSummarySchema,
});

export const libraryFilterSchema = z.object({
  value: ratingValueSchema.optional(),
  type: mediaTypeSchema.optional(),
  query: z.string().max(200).optional(),
  genre: z.string().max(100).optional(),
  sort: z.enum(["newest", "oldest", "title"]).default("newest"),
});
