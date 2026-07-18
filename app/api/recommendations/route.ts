import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import {
  getCachedCandidatePeople,
  getBookmarkMap,
  getProfileLanguage,
  getRatings,
  getRecommendationSignals,
  getRecommendationSourceAdjustments,
  markRecommendationEvents,
  saveRecommendationHistory,
} from "@/lib/data";
import { candidatesFromRatings, scoreRecommendations } from "@/lib/recommendations/engine";
import { getCandidatePool, getRelatedCandidatePool, isDemoMode } from "@/lib/tmdb";
import { cacheMediaSummaries, cacheSearch, getCachedSearch } from "@/lib/media-cache";
import { assertSameOrigin, enforceRateLimit } from "@/lib/request-security";

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, "recommendations", 20, 60_000);
    const fresh = request.nextUrl.searchParams.get("refresh") === "1";
    const [ratings, language, cachedPopular, cachedDiscovery] = await Promise.all([
      getRatings(),
      getProfileLanguage(),
      fresh ? null : getCachedSearch("__recommendations_popular_v2__", 1),
      fresh ? null : getCachedSearch("__recommendations_discovery_v2__", 1),
    ]);
    const genericCandidates =
      cachedPopular && cachedDiscovery
        ? [
            ...cachedPopular.results.map((media) => ({ media, source: "popular" as const })),
            ...cachedDiscovery.results.map((media) => ({ media, source: "discovery" as const })),
          ]
        : await getCandidatePool(fresh, language);
    if (!cachedPopular || !cachedDiscovery || fresh) {
      await Promise.all([
        cacheSearch(
          "__recommendations_popular_v2__",
          1,
          genericCandidates.filter(({ source }) => source === "popular").map(({ media }) => media),
          1,
        ),
        cacheSearch(
          "__recommendations_discovery_v2__",
          1,
          genericCandidates.filter(({ source }) => source === "discovery").map(({ media }) => media),
          1,
        ),
      ]);
    }
    await cacheMediaSummaries(genericCandidates.map(({ media }) => media));
    const relatedCandidates = isDemoMode
      ? candidatesFromRatings(ratings)
      : await getRelatedCandidatePool(
          ratings.map((rating) => ({
            type: rating.media.type,
            tmdbId: rating.media.tmdbId,
            value: rating.value,
          })),
          language,
        );
    const candidates = [...relatedCandidates, ...genericCandidates.map(({ media, source }) => ({ media, source }))];
    const candidateMedia = candidates.map(({ media }) => media);
    const [people, signals, bookmarks, sourceAdjustments] = await Promise.all([
      getCachedCandidatePeople(candidateMedia),
      getRecommendationSignals(candidateMedia),
      getBookmarkMap(candidateMedia),
      getRecommendationSourceAdjustments(),
    ]);
    const result = scoreRecommendations(
      ratings,
      candidates.map((candidate) => ({
        ...candidate,
        people: people.get(`${candidate.media.type}:${candidate.media.tmdbId}`) ?? [],
        signal: signals.get(`${candidate.media.type}:${candidate.media.tmdbId}`),
        sourceAdjustment: sourceAdjustments[candidate.source] ?? 0,
      })),
      language,
    );
    await saveRecommendationHistory(result.recommendations);
    const recommendations = result.recommendations.map((recommendation) => ({
      ...recommendation,
      media: {
        ...recommendation.media,
        bookmarked: bookmarks.has(`${recommendation.media.type}:${recommendation.media.tmdbId}`),
      },
      bookmarked: bookmarks.has(`${recommendation.media.type}:${recommendation.media.tmdbId}`),
    }));
    return NextResponse.json({ ...result, recommendations, demoMode: isDemoMode });
  } catch (error) {
    return apiError(error, "Empfehlungen konnten gerade nicht berechnet werden.");
  }
}

const eventSchema = z.object({
  event: z.enum(["displayed", "clicked", "skipped"]),
  items: z
    .array(z.object({ type: z.enum(["movie", "tv"]), tmdbId: z.number().int().positive() }))
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = eventSchema.parse(await request.json());
    await markRecommendationEvents(body.items, body.event);
    return NextResponse.json({ tracked: true });
  } catch (error) {
    return apiError(error, "Das Empfehlungsereignis konnte nicht gespeichert werden.");
  }
}
