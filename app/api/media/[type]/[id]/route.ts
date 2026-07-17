import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { getRating } from "@/lib/data";
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
    const [cachedMedia, rating] = await Promise.all([getCachedMediaDetails(type, id), getRating(type, id)]);
    const media = cachedMedia ?? (await getMediaDetails(type, id));
    if (!media) return NextResponse.json({ error: "Dieser Titel wurde nicht gefunden." }, { status: 404 });
    if (!cachedMedia) await cacheMediaDetails(media);
    return NextResponse.json({
      media,
      rating: rating?.value ?? null,
      demoMode: isDemoMode,
      cacheHit: Boolean(cachedMedia),
    });
  } catch (error) {
    return apiError(error, "Die Details konnten nicht geladen werden.");
  }
}
