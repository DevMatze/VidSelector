import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { getRating, getWatchStatus, getWatchStatusMap } from "@/lib/data";
import { cacheMediaDetails, getCachedMediaDetails } from "@/lib/media-cache";
import { getMediaDetails, isDemoMode } from "@/lib/tmdb";
import { mediaTypeSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/request-security";

const idSchema = z.coerce.number().int().positive();

export async function GET(request: Request, context: { params: Promise<{ type: string; id: string }> }) {
  try {
    enforceRateLimit(request, "details", 90, 60_000);
    const params = await context.params;
    const type = mediaTypeSchema.parse(params.type);
    const id = idSchema.parse(params.id);
    const [cachedMedia, rating, watchStatus] = await Promise.all([
      getCachedMediaDetails(type, id),
      getRating(type, id),
      getWatchStatus(type, id),
    ]);
    const media = cachedMedia ?? (await getMediaDetails(type, id));
    if (!media) return NextResponse.json({ error: "Dieser Titel wurde nicht gefunden." }, { status: 404 });
    if (!cachedMedia) await cacheMediaDetails(media);
    const similarStatuses = await getWatchStatusMap(media.similar);
    const enrichedMedia = {
      ...media,
      watchStatus,
      similar: media.similar.map((item) => ({
        ...item,
        watchStatus: similarStatuses.get(`${item.type}:${item.tmdbId}`) ?? null,
      })),
    };
    return NextResponse.json({
      media: enrichedMedia,
      rating: rating?.value ?? null,
      watchStatus,
      demoMode: isDemoMode,
      cacheHit: Boolean(cachedMedia),
    });
  } catch (error) {
    return apiError(error, "Die Details konnten nicht geladen werden.");
  }
}
