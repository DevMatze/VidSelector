import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { deleteRating, getProfileLanguage, getRatings, saveRating } from "@/lib/data";
import { genreFacets, matchesGenreFilter } from "@/lib/genres";
import { getCachedMediaDetails } from "@/lib/media-cache";
import { getMediaDetails } from "@/lib/tmdb";
import { libraryFilterSchema, mediaTypeSchema, saveRatingSchema } from "@/lib/validation";
import { assertSameOrigin, enforceRateLimit } from "@/lib/request-security";

export async function GET(request: NextRequest) {
  try {
    const filters = libraryFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const allRatings = await getRatings();
    let ratings = [...allRatings];
    if (filters.value) ratings = ratings.filter((rating) => rating.value === filters.value);
    if (filters.type) ratings = ratings.filter((rating) => rating.media.type === filters.type);
    if (filters.genre) {
      const selectedGenre = filters.genre;
      ratings = ratings.filter((rating) =>
        matchesGenreFilter(rating.media.genres, selectedGenre, rating.media.originalLanguage),
      );
    }
    if (filters.query) {
      const query = filters.query.toLocaleLowerCase("de");
      ratings = ratings.filter((rating) => rating.media.title.toLocaleLowerCase("de").includes(query));
    }
    ratings.sort((a, b) =>
      filters.sort === "title"
        ? a.media.title.localeCompare(b.media.title, "de")
        : filters.sort === "oldest"
          ? a.updatedAt.localeCompare(b.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
    const ratingsForGenreSelection = filters.type
      ? allRatings.filter((rating) => rating.media.type === filters.type)
      : allRatings;
    const allGenres = [
      ...new Set(
        ratingsForGenreSelection.flatMap((rating) => genreFacets(rating.media.genres, rating.media.originalLanguage)),
      ),
    ].sort((a, b) => a.localeCompare(b, "de"));
    return NextResponse.json({
      ratings: ratings.map(({ metadata: _metadata, ...rating }) => rating),
      genres: allGenres,
      totalRatings: allRatings.length,
    });
  } catch (error) {
    return apiError(error, "Deine Bewertungen konnten nicht geladen werden.");
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "ratings", 90, 60_000);
    const body = saveRatingSchema.parse(await request.json());
    const language = await getProfileLanguage();
    let details = null;
    try {
      details =
        (await getCachedMediaDetails(body.media.type, body.media.tmdbId)) ??
        (await getMediaDetails(body.media.type, body.media.tmdbId, language));
    } catch {
      /* The rating remains usable with submitted metadata. */
    }
    const rating = await saveRating(body.media, body.value, details);
    const { metadata: _metadata, ...publicRating } = rating;
    return NextResponse.json({ rating: publicRating }, { status: 201 });
  } catch (error) {
    return apiError(error, "Die Bewertung konnte nicht gespeichert werden.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const type = mediaTypeSchema.parse(request.nextUrl.searchParams.get("type"));
    const tmdbId = z.coerce.number().int().positive().parse(request.nextUrl.searchParams.get("tmdbId"));
    const deleted = await deleteRating(type, tmdbId);
    return NextResponse.json({ deleted });
  } catch (error) {
    return apiError(error, "Die Bewertung konnte nicht entfernt werden.");
  }
}
