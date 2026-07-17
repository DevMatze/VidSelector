import type { MediaItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mediaItemToSummary } from "@/lib/data";
import { genreIdsMatchingQuery, normalizeGenres, normalizeMediaGenres } from "@/lib/genres";
import type { MediaDetails, MediaSummary, MediaType } from "@/lib/types";
import { mediaDetailsSchema } from "@/lib/validation";

const DAY = 24 * 60 * 60 * 1_000;
export const CACHE_TTL = {
  search: 24 * 60 * 60 * 1_000,
  summary: 30 * DAY,
  details: 7 * DAY,
  maximum: 180 * DAY,
} as const;

const CACHE_MAINTENANCE_INTERVAL = DAY;
let lastMaintenanceAt = 0;
let maintenancePromise: Promise<void> | null = null;

const expiresIn = (milliseconds: number) => new Date(Date.now() + milliseconds);
const normalizedQuery = (query: string) => query.trim().toLocaleLowerCase("de").replace(/\s+/g, " ");
const mediaKey = (media: Pick<MediaSummary, "type" | "tmdbId">) => `${media.type}:${media.tmdbId}`;

function summaryData(media: MediaSummary) {
  return {
    title: media.title,
    originalTitle: media.originalTitle,
    overview: media.overview,
    posterPath: media.posterPath,
    backdropPath: media.backdropPath,
    releaseDate: media.releaseDate,
    genres: JSON.stringify(normalizeGenres(media.genres)),
    voteAverage: media.voteAverage,
    voteCount: media.voteCount ?? 0,
    popularity: media.popularity,
    originalLanguage: media.originalLanguage,
    cachedAt: new Date(),
    expiresAt: expiresIn(CACHE_TTL.summary),
  };
}

function parseDetails(mediaItem: MediaItem): MediaDetails | null {
  try {
    const parsed = mediaDetailsSchema.safeParse(JSON.parse(mediaItem.metadata));
    if (!parsed.success) return null;
    return {
      ...parsed.data,
      ...mediaItemToSummary(mediaItem),
      similar: parsed.data.similar.map(normalizeMediaGenres),
    };
  } catch {
    return null;
  }
}

export async function purgeExpiredMediaCache(): Promise<void> {
  const now = new Date();
  const maximumAge = new Date(now.getTime() - CACHE_TTL.maximum);
  await prisma.$transaction([
    prisma.searchCache.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.mediaItem.deleteMany({
      where: {
        cachedAt: { lt: maximumAge },
        ratings: { none: {} },
        recommendations: { none: {} },
      },
    }),
    prisma.mediaItem.updateMany({
      where: {
        cachedAt: { lt: maximumAge },
        OR: [{ ratings: { some: {} } }, { recommendations: { some: {} } }],
      },
      data: {
        title: "Metadaten abgelaufen",
        originalTitle: null,
        overview: null,
        posterPath: null,
        backdropPath: null,
        releaseDate: null,
        genres: "[]",
        voteAverage: 0,
        voteCount: 0,
        popularity: 0,
        originalLanguage: null,
        metadata: "{}",
        cachedAt: now,
        expiresAt: now,
        detailsCachedAt: null,
        detailsExpiresAt: null,
      },
    }),
  ]);
}

export async function maintainMediaCache(): Promise<void> {
  if (Date.now() - lastMaintenanceAt < CACHE_MAINTENANCE_INTERVAL) return;
  if (!maintenancePromise) {
    maintenancePromise = purgeExpiredMediaCache()
      .then(() => {
        lastMaintenanceAt = Date.now();
      })
      .finally(() => {
        maintenancePromise = null;
      });
  }
  await maintenancePromise;
}

export async function findCachedMedia(query: string): Promise<MediaSummary[]> {
  const matchingGenreIds = genreIdsMatchingQuery(query);
  const animeQuery = normalizedQuery(query).includes("anime");
  const mediaItems = await prisma.mediaItem.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(animeQuery ? { originalLanguage: "ja" } : {}),
      OR: [
        { title: { contains: query } },
        { originalTitle: { contains: query } },
        { overview: { contains: query } },
        { genres: { contains: query } },
        ...matchingGenreIds.map((id) => ({ genres: { contains: `\"id\":${id}` } })),
      ],
    },
    orderBy: [{ popularity: "desc" }, { voteAverage: "desc" }],
    take: 40,
  });
  return mediaItems.map(mediaItemToSummary);
}

export async function getCachedSearch(
  query: string,
  page: number,
): Promise<{ results: MediaSummary[]; totalPages: number } | null> {
  const cached = await prisma.searchCache.findUnique({
    where: { query_page: { query: normalizedQuery(query), page } },
  });
  if (!cached || cached.expiresAt <= new Date()) return null;
  let keys: string[];
  try {
    const parsed: unknown = JSON.parse(cached.resultKeys);
    if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) return null;
    keys = parsed;
  } catch {
    return null;
  }
  const clauses = keys.flatMap((key) => {
    const [type, id] = key.split(":");
    const tmdbId = Number(id);
    return (type === "movie" || type === "tv") && Number.isInteger(tmdbId) ? [{ type, tmdbId }] : [];
  });
  if (clauses.length === 0) return { results: [], totalPages: cached.totalPages };
  const items = await prisma.mediaItem.findMany({ where: { OR: clauses, expiresAt: { gt: new Date() } } });
  const byKey = new Map(items.map((item) => [`${item.type}:${item.tmdbId}`, mediaItemToSummary(item)]));
  const results = keys.flatMap((key) => byKey.get(key) ?? []);
  return results.length === keys.length ? { results, totalPages: cached.totalPages } : null;
}

export async function cacheSearch(
  query: string,
  page: number,
  results: MediaSummary[],
  totalPages: number,
): Promise<void> {
  await cacheMediaSummaries(results);
  await prisma.searchCache.upsert({
    where: { query_page: { query: normalizedQuery(query), page } },
    update: { resultKeys: JSON.stringify(results.map(mediaKey)), totalPages, expiresAt: expiresIn(CACHE_TTL.search) },
    create: {
      query: normalizedQuery(query),
      page,
      resultKeys: JSON.stringify(results.map(mediaKey)),
      totalPages,
      expiresAt: expiresIn(CACHE_TTL.search),
    },
  });
}

export async function getCachedMediaDetails(type: MediaType, tmdbId: number): Promise<MediaDetails | null> {
  const mediaItem = await prisma.mediaItem.findUnique({ where: { tmdbId_type: { tmdbId, type } } });
  if (!mediaItem?.detailsExpiresAt || mediaItem.detailsExpiresAt <= new Date()) return null;
  return parseDetails(mediaItem);
}

export async function cacheMediaSummaries(mediaItems: MediaSummary[]): Promise<void> {
  if (mediaItems.length === 0) return;
  await prisma.$transaction(
    mediaItems.map((media) =>
      prisma.mediaItem.upsert({
        where: { tmdbId_type: { tmdbId: media.tmdbId, type: media.type } },
        update: summaryData(media),
        create: { tmdbId: media.tmdbId, type: media.type, ...summaryData(media) },
      }),
    ),
  );
}

export async function cacheMediaDetails(media: MediaDetails): Promise<void> {
  await prisma.mediaItem.upsert({
    where: { tmdbId_type: { tmdbId: media.tmdbId, type: media.type } },
    update: {
      ...summaryData(media),
      metadata: JSON.stringify(media),
      detailsCachedAt: new Date(),
      detailsExpiresAt: expiresIn(CACHE_TTL.details),
    },
    create: {
      tmdbId: media.tmdbId,
      type: media.type,
      ...summaryData(media),
      metadata: JSON.stringify(media),
      detailsCachedAt: new Date(),
      detailsExpiresAt: expiresIn(CACHE_TTL.details),
    },
  });
}
