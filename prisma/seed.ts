import { PrismaClient } from "@prisma/client";
import { getDemoDetails, DEMO_CATALOG } from "../lib/demo-data";

const prisma = new PrismaClient();
const userId = "local-user";

async function main() {
  await prisma.user.upsert({ where: { id: userId }, update: {}, create: { id: userId, name: "Filmfan" } });
  const examples: Array<[number, "movie" | "tv", "like" | "dislike" | "neutral"]> = [
    [70523, "tv", "like"],
    [66732, "tv", "like"],
    [27205, "movie", "like"],
    [157336, "movie", "like"],
    [508965, "movie", "neutral"],
    [399566, "movie", "dislike"],
  ];
  for (const [tmdbId, type, value] of examples) {
    const media = DEMO_CATALOG.find((item) => item.tmdbId === tmdbId && item.type === type);
    if (!media) continue;
    const details = getDemoDetails(type, tmdbId);
    const cachedAt = new Date();
    const expiresAt = new Date(cachedAt.getTime() + 30 * 24 * 60 * 60 * 1_000);
    const detailsExpiresAt = new Date(cachedAt.getTime() + 7 * 24 * 60 * 60 * 1_000);
    const mediaData = {
      title: media.title,
      originalTitle: media.originalTitle,
      overview: media.overview,
      posterPath: media.posterPath,
      backdropPath: media.backdropPath,
      releaseDate: media.releaseDate,
      genres: JSON.stringify(media.genres),
      voteAverage: media.voteAverage,
      voteCount: media.voteCount ?? 0,
      popularity: media.popularity,
      originalLanguage: media.originalLanguage,
      metadata: JSON.stringify(details ?? {}),
      cachedAt,
      expiresAt,
      detailsCachedAt: cachedAt,
      detailsExpiresAt,
    };
    const stored = await prisma.mediaItem.upsert({
      where: { tmdbId_type: { tmdbId, type } },
      update: mediaData,
      create: { tmdbId, type, ...mediaData },
    });
    await prisma.rating.upsert({
      where: { userId_mediaItemId: { userId, mediaItemId: stored.id } },
      update: { value },
      create: { userId, mediaItemId: stored.id, value },
    });
  }
  console.log("Beispielprofil mit 6 Bewertungen angelegt.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
