import type { MediaItem, Rating, WatchEntry } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeGenres, normalizeMediaGenres } from "@/lib/genres";
import type {
  MediaDetails,
  MediaSummary,
  RatingRecord,
  RatingValue,
  ScoredRecommendation,
  WatchEntryRecord,
  WatchStatus,
} from "@/lib/types";
import { genreSchema, mediaDetailsSchema } from "@/lib/validation";
import type { ProfileExport, ProfileImportMode } from "@/lib/profile-transfer";

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
export type StoredWatchEntry = WatchEntryRecord;

function summaryStorageData(media: MediaSummary, now = new Date()) {
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
    cachedAt: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000),
  };
}

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
  const statusMap = await getWatchStatusMap(ratings.map((rating) => mediaItemToSummary(rating.mediaItem)));
  return ratings.map((rating) => {
    const record = ratingToRecord(rating);
    return { ...record, watchStatus: statusMap.get(`${record.media.type}:${record.media.tmdbId}`) ?? null };
  });
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
    ...summaryStorageData(mediaForStorage, now),
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
  const selected = recommendations.slice(0, 100);
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
        update: {
          score: recommendation.score,
          reasons: JSON.stringify(recommendation.reasons),
          source: recommendation.source,
          displayed: false,
          active: true,
        },
        create: {
          userId: LOCAL_USER_ID,
          mediaItemId: item.id,
          score: recommendation.score,
          reasons: JSON.stringify(recommendation.reasons),
          source: recommendation.source,
        },
      });
    }
    await tx.recommendation.updateMany({
      where: {
        userId: LOCAL_USER_ID,
        active: true,
        ...(currentIds.length ? { mediaItemId: { notIn: currentIds } } : {}),
      },
      data: { active: false },
    });
  });
}

export interface RecommendationSignal {
  displayCount: number;
  clickCount: number;
  skipCount: number;
  dismissed: boolean;
  lastShownAt?: string;
}

export async function getRecommendationSignals(mediaItems: MediaSummary[]): Promise<Map<string, RecommendationSignal>> {
  const clauses = mediaItems.map((media) => ({ tmdbId: media.tmdbId, type: media.type }));
  if (!clauses.length) return new Map();
  const stored = await prisma.recommendation.findMany({
    where: { userId: LOCAL_USER_ID, mediaItem: { OR: clauses } },
    include: { mediaItem: { select: { tmdbId: true, type: true } } },
  });
  return new Map(
    stored.map((entry) => [
      `${entry.mediaItem.type}:${entry.mediaItem.tmdbId}`,
      {
        displayCount: entry.displayCount,
        clickCount: entry.clickCount,
        skipCount: entry.skipCount,
        dismissed: Boolean(entry.dismissedAt),
        lastShownAt: entry.lastShownAt?.toISOString(),
      },
    ]),
  );
}

export async function getRecommendationSourceAdjustments(): Promise<Record<string, number>> {
  const outcomes = await prisma.recommendation.findMany({
    where: { userId: LOCAL_USER_ID, laterRated: true },
    select: {
      source: true,
      mediaItem: {
        select: { ratings: { where: { userId: LOCAL_USER_ID }, select: { value: true }, take: 1 } },
      },
    },
  });
  const scores: Record<string, { likes: number; dislikes: number }> = {};
  for (const outcome of outcomes) {
    const value = outcome.mediaItem.ratings[0]?.value;
    if (value !== "like" && value !== "dislike") continue;
    scores[outcome.source] ??= { likes: 0, dislikes: 0 };
    if (value === "like") scores[outcome.source].likes += 1;
    else scores[outcome.source].dislikes += 1;
  }
  return Object.fromEntries(
    Object.entries(scores).map(([source, result]) => {
      const sampleSize = result.likes + result.dislikes;
      const adjustment = sampleSize < 2 ? 0 : Math.max(-3, Math.min(3, (result.likes - result.dislikes) * 0.75));
      return [source, adjustment];
    }),
  );
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
  event: "displayed" | "clicked" | "skipped" | "dismissed",
): Promise<void> {
  await ensureLocalUser();
  const mediaItems = await prisma.mediaItem.findMany({
    where: { OR: items.map((item) => ({ type: item.type, tmdbId: item.tmdbId })) },
    select: { id: true },
  });
  if (!mediaItems.length) return;
  const now = new Date();
  await prisma.$transaction(
    mediaItems.map((item) =>
      prisma.recommendation.upsert({
        where: { userId_mediaItemId: { userId: LOCAL_USER_ID, mediaItemId: item.id } },
        update:
          event === "clicked"
            ? { clicked: true, clickCount: { increment: 1 } }
            : event === "skipped"
              ? { skipCount: { increment: 1 }, lastShownAt: now }
              : event === "dismissed"
                ? { dismissedAt: now, active: false }
                : { displayed: true, lastShownAt: now, displayCount: { increment: 1 } },
        create: {
          userId: LOCAL_USER_ID,
          mediaItemId: item.id,
          score: 0,
          reasons: "[]",
          active: event !== "dismissed",
          dismissedAt: event === "dismissed" ? now : undefined,
          displayed: event === "displayed",
          clicked: event === "clicked",
          displayCount: event === "displayed" ? 1 : 0,
          clickCount: event === "clicked" ? 1 : 0,
          skipCount: event === "skipped" ? 1 : 0,
          lastShownAt: event === "displayed" || event === "skipped" ? now : undefined,
        },
      }),
    ),
  );
}

function watchEntryToRecord(entry: WatchEntry & { mediaItem: MediaItem; user?: unknown }): StoredWatchEntry {
  return {
    id: entry.id,
    status: entry.status as WatchStatus,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    media: mediaItemToSummary(entry.mediaItem),
  };
}

export async function getWatchEntries(): Promise<StoredWatchEntry[]> {
  await ensureLocalUser();
  const entries = await prisma.watchEntry.findMany({
    where: { userId: LOCAL_USER_ID },
    include: { mediaItem: true },
    orderBy: { updatedAt: "desc" },
  });
  const ratings = await getRatings();
  const ratingMap = new Map(ratings.map((rating) => [`${rating.media.type}:${rating.media.tmdbId}`, rating.value]));
  return entries.map((entry) => {
    const record = watchEntryToRecord(entry);
    return { ...record, rating: ratingMap.get(`${record.media.type}:${record.media.tmdbId}`) ?? null };
  });
}

export async function getWatchStatus(type: string, tmdbId: number): Promise<WatchStatus | null> {
  await ensureLocalUser();
  const entry = await prisma.watchEntry.findFirst({
    where: { userId: LOCAL_USER_ID, mediaItem: { type, tmdbId } },
    select: { status: true },
  });
  return (entry?.status as WatchStatus | undefined) ?? null;
}

export async function getWatchStatusMap(mediaItems: MediaSummary[]): Promise<Map<string, WatchStatus>> {
  const clauses = mediaItems.map((media) => ({ tmdbId: media.tmdbId, type: media.type }));
  if (!clauses.length) return new Map();
  await ensureLocalUser();
  const entries = await prisma.watchEntry.findMany({
    where: { userId: LOCAL_USER_ID, mediaItem: { OR: clauses } },
    include: { mediaItem: { select: { tmdbId: true, type: true } } },
  });
  return new Map(
    entries.map((entry) => [`${entry.mediaItem.type}:${entry.mediaItem.tmdbId}`, entry.status as WatchStatus]),
  );
}

export async function saveWatchEntry(media: MediaSummary, status: WatchStatus): Promise<StoredWatchEntry> {
  await ensureLocalUser();
  const entry = await prisma.$transaction(async (tx) => {
    const mediaItem = await tx.mediaItem.upsert({
      where: { tmdbId_type: { tmdbId: media.tmdbId, type: media.type } },
      update: summaryStorageData(media),
      create: { tmdbId: media.tmdbId, type: media.type, ...summaryStorageData(media) },
    });
    return tx.watchEntry.upsert({
      where: { userId_mediaItemId: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id } },
      update: { status },
      create: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id, status },
      include: { mediaItem: true },
    });
  });
  return watchEntryToRecord(entry);
}

export async function deleteWatchEntry(type: string, tmdbId: number): Promise<boolean> {
  await ensureLocalUser();
  const mediaItem = await prisma.mediaItem.findUnique({ where: { tmdbId_type: { tmdbId, type } } });
  if (!mediaItem) return false;
  const result = await prisma.watchEntry.deleteMany({ where: { userId: LOCAL_USER_ID, mediaItemId: mediaItem.id } });
  return result.count > 0;
}

export async function exportProfileData(): Promise<ProfileExport> {
  const user = await ensureLocalUser();
  const [ratings, watchEntries] = await Promise.all([
    prisma.rating.findMany({ where: { userId: LOCAL_USER_ID }, include: { mediaItem: true } }),
    prisma.watchEntry.findMany({ where: { userId: LOCAL_USER_ID }, include: { mediaItem: true } }),
  ]);
  return {
    format: "vidselector-profile",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: { name: user.name },
    ratings: ratings.map((rating) => ({
      type: rating.mediaItem.type as MediaSummary["type"],
      tmdbId: rating.mediaItem.tmdbId,
      title: rating.mediaItem.title,
      value: rating.value as RatingValue,
      createdAt: rating.createdAt.toISOString(),
      updatedAt: rating.updatedAt.toISOString(),
    })),
    watchEntries: watchEntries.map((entry) => ({
      type: entry.mediaItem.type as MediaSummary["type"],
      tmdbId: entry.mediaItem.tmdbId,
      title: entry.mediaItem.title,
      status: entry.status as WatchStatus,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
  };
}

export async function importProfileData(data: ProfileExport, mode: ProfileImportMode) {
  await ensureLocalUser();
  await prisma.$transaction(async (tx) => {
    if (mode === "replace") {
      await tx.recommendation.deleteMany({ where: { userId: LOCAL_USER_ID } });
      await tx.rating.deleteMany({ where: { userId: LOCAL_USER_ID } });
      await tx.watchEntry.deleteMany({ where: { userId: LOCAL_USER_ID } });
    }
    await tx.user.update({ where: { id: LOCAL_USER_ID }, data: { name: data.profile.name } });
    const now = new Date();
    for (const rating of data.ratings) {
      const item = await tx.mediaItem.upsert({
        where: { tmdbId_type: { tmdbId: rating.tmdbId, type: rating.type } },
        update: {},
        create: {
          tmdbId: rating.tmdbId,
          type: rating.type,
          title: rating.title ?? "Metadaten werden aktualisiert",
          genres: "[]",
          cachedAt: now,
          expiresAt: now,
        },
      });
      await tx.rating.upsert({
        where: { userId_mediaItemId: { userId: LOCAL_USER_ID, mediaItemId: item.id } },
        update: { value: rating.value, updatedAt: rating.updatedAt ? new Date(rating.updatedAt) : now },
        create: {
          userId: LOCAL_USER_ID,
          mediaItemId: item.id,
          value: rating.value,
          createdAt: rating.createdAt ? new Date(rating.createdAt) : now,
          updatedAt: rating.updatedAt ? new Date(rating.updatedAt) : now,
        },
      });
    }
    for (const watchEntry of data.watchEntries) {
      const item = await tx.mediaItem.upsert({
        where: { tmdbId_type: { tmdbId: watchEntry.tmdbId, type: watchEntry.type } },
        update: {},
        create: {
          tmdbId: watchEntry.tmdbId,
          type: watchEntry.type,
          title: watchEntry.title ?? "Metadaten werden aktualisiert",
          genres: "[]",
          cachedAt: now,
          expiresAt: now,
        },
      });
      await tx.watchEntry.upsert({
        where: { userId_mediaItemId: { userId: LOCAL_USER_ID, mediaItemId: item.id } },
        update: { status: watchEntry.status, updatedAt: watchEntry.updatedAt ? new Date(watchEntry.updatedAt) : now },
        create: {
          userId: LOCAL_USER_ID,
          mediaItemId: item.id,
          status: watchEntry.status,
          createdAt: watchEntry.createdAt ? new Date(watchEntry.createdAt) : now,
          updatedAt: watchEntry.updatedAt ? new Date(watchEntry.updatedAt) : now,
        },
      });
    }
  });
  return { ratings: data.ratings.length, watchEntries: data.watchEntries.length, mode };
}

export async function updateProfileName(name: string) {
  await ensureLocalUser();
  return prisma.user.update({ where: { id: LOCAL_USER_ID }, data: { name } });
}

export async function getProfile() {
  const user = await ensureLocalUser();
  const [ratings, recommendations, watchEntries, ratedRecommendations] = await Promise.all([
    prisma.rating.count({ where: { userId: LOCAL_USER_ID } }),
    prisma.recommendation.count({ where: { userId: LOCAL_USER_ID, active: true } }),
    prisma.watchEntry.count({ where: { userId: LOCAL_USER_ID } }),
    prisma.recommendation.count({ where: { userId: LOCAL_USER_ID, laterRated: true } }),
  ]);
  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    ratings,
    recommendations,
    watchEntries,
    ratedRecommendations,
  };
}

export async function resetProfile(): Promise<void> {
  await ensureLocalUser();
  await prisma.$transaction([
    prisma.recommendation.deleteMany({ where: { userId: LOCAL_USER_ID } }),
    prisma.rating.deleteMany({ where: { userId: LOCAL_USER_ID } }),
    prisma.watchEntry.deleteMany({ where: { userId: LOCAL_USER_ID } }),
  ]);
}
