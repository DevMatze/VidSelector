import type { MediaItem, Rating } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeGenres, normalizeMediaGenres } from "@/lib/genres";
import type { MediaDetails, MediaSummary, RatingRecord, RatingValue, ScoredRecommendation } from "@/lib/types";
import { genreSchema, mediaDetailsSchema } from "@/lib/validation";

export const LOCAL_USER_ID = "local-user";

export async function ensureLocalUser() {
  return prisma.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, name: "Filmfan" },
  });
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function mediaItemToSummary(media: MediaItem): MediaSummary {
  const parsedGenres = genreSchema.array().safeParse(parseJson<unknown>(media.genres, []));
  return normalizeMediaGenres({
    tmdbId: media.tmdbId,
    type: media.type as MediaSummary["type"],
    title: media.title,
    originalTitle: media.originalTitle ?? undefined,
    overview: media.overview ?? "",
    posterPath: media.posterPath,
    backdropPath: media.backdropPath,
    releaseDate: media.releaseDate ?? "",
    genres: parsedGenres.success ? parsedGenres.data : [],
    voteAverage: media.voteAverage,
    voteCount: media.voteCount,
    popularity: media.popularity,
    originalLanguage: media.originalLanguage ?? "",
  });
}

export type StoredRating = RatingRecord & { metadata: Partial<MediaDetails> };

function ratingToRecord(rating: Rating & { mediaItem: MediaItem }): StoredRating {
  const parsedMetadata = mediaDetailsSchema.partial().safeParse(parseJson<unknown>(rating.mediaItem.metadata, {}));
  const metadata: Partial<MediaDetails> = parsedMetadata.success ? parsedMetadata.data : {};
  return {
    id: rating.id,
    value: rating.value as RatingValue,
    createdAt: rating.createdAt.toISOString(),
    updatedAt: rating.updatedAt.toISOString(),
    media: mediaItemToSummary(rating.mediaItem),
    metadata: {
      ...metadata,
      similar: metadata.similar?.map(normalizeMediaGenres),
    },
  };
}

export async function getRatings(): Promise<StoredRating[]> {
  await ensureLocalUser();
  const ratings = await prisma.rating.findMany({
    where: { userId: LOCAL_USER_ID },
    include: { mediaItem: true },
    orderBy: { updatedAt: "desc" },
  });
  return ratings.map(ratingToRecord);
}

export async function getRating(type: string, tmdbId: number): Promise<StoredRating | null> {
  await ensureLocalUser();
  const rating = await prisma.rating.findFirst({
    where: { userId: LOCAL_USER_ID, mediaItem: { type, tmdbId } },
    include: { mediaItem: true },
  });
  return rating ? ratingToRecord(rating) : null;
}

export async function saveRating(
  media: MediaSummary,
  value: RatingValue,
  details?: MediaDetails | null,
): Promise<StoredRating> {
  await ensureLocalUser();
  const mediaForStorage: MediaSummary = details ?? media;
  const now = new Date();
  const summaryExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
  const detailsExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000);
  const mediaData = {
    title: mediaForStorage.title,
    originalTitle: mediaForStorage.originalTitle,
    overview: mediaForStorage.overview,
    posterPath: mediaForStorage.posterPath,
    backdropPath: mediaForStorage.backdropPath,
    releaseDate: mediaForStorage.releaseDate,
    genres: JSON.stringify(normalizeGenres(mediaForStorage.genres)),
    voteAverage: mediaForStorage.voteAverage,
    voteCount: mediaForStorage.voteCount ?? 0,
    popularity: mediaForStorage.popularity,
    originalLanguage: mediaForStorage.originalLanguage,
    cachedAt: now,
    expiresAt: summaryExpiry,
    ...(details ? { metadata: JSON.stringify(details), detailsCachedAt: now, detailsExpiresAt: detailsExpiry } : {}),
  };
  const rating = await prisma.$transaction(async (tx) => {
    const mediaItem = await tx.mediaItem.upsert({
      where: { tmdbId_type: { tmdbId: mediaForStorage.tmdbId, type: mediaForStorage.type } },
      update: mediaData,
      create: {
        tmdbId: mediaForStorage.tmdbId,
        type: mediaForStorage.type,
        metadata: JSON.stringify(details ?? {}),
        ...mediaData,
      },
    });
    const saved = await tx.rating.upsert({
      where: { userId_mediaItemId: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id } },
      update: { value },
      create: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id, value },
      include: { mediaItem: true },
    });
    await tx.recommendation.updateMany({
      where: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id },
      data: { laterRated: true },
    });
    return saved;
  });
  return ratingToRecord(rating);
}

export async function deleteRating(type: string, tmdbId: number): Promise<boolean> {
  await ensureLocalUser();
  const mediaItem = await prisma.mediaItem.findUnique({ where: { tmdbId_type: { tmdbId, type } } });
  if (!mediaItem) return false;
  const result = await prisma.rating.deleteMany({ where: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id } });
  return result.count > 0;
}

export async function saveRecommendationHistory(recommendations: ScoredRecommendation[]): Promise<void> {
  await ensureLocalUser();
  const selected = recommendations.slice(0, 30);
  const cachedAt = new Date();
  const expiresAt = new Date(cachedAt.getTime() + 30 * 24 * 60 * 60 * 1_000);
  await prisma.$transaction(async (tx) => {
    const currentIds: string[] = [];
    for (const recommendation of selected) {
      const media = recommendation.media;
      const item = await tx.mediaItem.upsert({
        where: { tmdbId_type: { tmdbId: recommendation.media.tmdbId, type: recommendation.media.type } },
        update: {
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
          cachedAt,
          expiresAt,
        },
        create: {
          tmdbId: media.tmdbId,
          type: media.type,
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
          cachedAt,
          expiresAt,
        },
      });
      currentIds.push(item.id);
      await tx.recommendation.upsert({
        where: { userId_mediaItemId: { userId: LOCAL_USER_ID, mediaItemId: item.id } },
        update: { score: recommendation.score, reasons: JSON.stringify(recommendation.reasons), displayed: false },
        create: {
          userId: LOCAL_USER_ID,
          mediaItemId: item.id,
          score: recommendation.score,
          reasons: JSON.stringify(recommendation.reasons),
        },
      });
    }
    await tx.recommendation.deleteMany({
      where: { userId: LOCAL_USER_ID, ...(currentIds.length ? { mediaItemId: { notIn: currentIds } } : {}) },
    });
  });
}

export async function getCachedCandidatePeople(mediaItems: MediaSummary[]): Promise<Map<string, string[]>> {
  const clauses = mediaItems.map((media) => ({ tmdbId: media.tmdbId, type: media.type }));
  if (!clauses.length) return new Map();
  const stored = await prisma.mediaItem.findMany({
    where: { OR: clauses },
    select: { tmdbId: true, type: true, metadata: true },
  });
  return new Map(
    stored.flatMap((item) => {
      const parsedMetadata = mediaDetailsSchema.partial().safeParse(parseJson<unknown>(item.metadata, {}));
      const metadata: Partial<MediaDetails> = parsedMetadata.success ? parsedMetadata.data : {};
      const people = [...(metadata.cast ?? []).slice(0, 5), ...(metadata.creators ?? [])].map((person) => person.name);
      return people.length ? [[`${item.type}:${item.tmdbId}`, [...new Set(people)]] as const] : [];
    }),
  );
}

export async function markRecommendationEvents(
  items: Array<{ type: string; tmdbId: number }>,
  event: "displayed" | "clicked",
): Promise<void> {
  await ensureLocalUser();
  const mediaItems = await prisma.mediaItem.findMany({
    where: { OR: items.map((item) => ({ type: item.type, tmdbId: item.tmdbId })) },
    select: { id: true },
  });
  if (!mediaItems.length) return;
  await prisma.recommendation.updateMany({
    where: { userId: LOCAL_USER_ID, mediaItemId: { in: mediaItems.map((item) => item.id) } },
    data:
      event === "clicked"
        ? { clicked: true }
        : { displayed: true, lastShownAt: new Date(), displayCount: { increment: 1 } },
  });
}

export async function updateProfileName(name: string) {
  await ensureLocalUser();
  return prisma.user.update({ where: { id: LOCAL_USER_ID }, data: { name } });
}

export async function getProfile() {
  const user = await ensureLocalUser();
  const [ratings, recommendations] = await Promise.all([
    prisma.rating.count({ where: { userId: LOCAL_USER_ID } }),
    prisma.recommendation.count({ where: { userId: LOCAL_USER_ID } }),
  ]);
  return { id: user.id, name: user.name, createdAt: user.createdAt.toISOString(), ratings, recommendations };
}

export async function resetProfile(): Promise<void> {
  await ensureLocalUser();
  await prisma.$transaction([
    prisma.recommendation.deleteMany({ where: { userId: LOCAL_USER_ID } }),
    prisma.rating.deleteMany({ where: { userId: LOCAL_USER_ID } }),
  ]);
}
