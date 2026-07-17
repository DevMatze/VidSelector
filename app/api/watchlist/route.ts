import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { deleteWatchEntry, getWatchEntries, saveWatchEntry } from "@/lib/data";
import { assertSameOrigin, enforceRateLimit } from "@/lib/request-security";
import { mediaTypeSchema, saveWatchEntrySchema, watchlistFilterSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const filters = watchlistFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const allEntries = await getWatchEntries();
    let entries = [...allEntries];
    if (filters.status) entries = entries.filter((entry) => entry.status === filters.status);
    if (filters.type) entries = entries.filter((entry) => entry.media.type === filters.type);
    if (filters.query) {
      const query = filters.query.toLocaleLowerCase("de");
      entries = entries.filter((entry) => entry.media.title.toLocaleLowerCase("de").includes(query));
    }
    entries.sort((a, b) =>
      filters.sort === "title"
        ? a.media.title.localeCompare(b.media.title, "de")
        : filters.sort === "oldest"
          ? a.updatedAt.localeCompare(b.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
    return NextResponse.json({ entries, totalEntries: allEntries.length });
  } catch (error) {
    return apiError(error, "Deine Merkliste konnte nicht geladen werden.");
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "watchlist", 90, 60_000);
    const body = saveWatchEntrySchema.parse(await request.json());
    const entry = await saveWatchEntry(body.media, body.status);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return apiError(error, "Der Wiedergabestatus konnte nicht gespeichert werden.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const type = mediaTypeSchema.parse(request.nextUrl.searchParams.get("type"));
    const tmdbId = z.coerce.number().int().positive().parse(request.nextUrl.searchParams.get("tmdbId"));
    const deleted = await deleteWatchEntry(type, tmdbId);
    return NextResponse.json({ deleted });
  } catch (error) {
    return apiError(error, "Der Titel konnte nicht aus der Merkliste entfernt werden.");
  }
}
