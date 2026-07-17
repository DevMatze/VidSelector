import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { TmdbError } from "@/lib/tmdb";
import { OriginError, RateLimitError } from "@/lib/request-security";

export function apiError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Die übermittelten Daten sind ungültig.", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }
  if (error instanceof TmdbError) {
    return NextResponse.json({ error: error.message, code: "TMDB_ERROR" }, { status: error.status });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message, code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }
  if (error instanceof OriginError) {
    return NextResponse.json({ error: error.message, code: "ORIGIN_REJECTED" }, { status: 403 });
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return NextResponse.json(
      { error: "Die lokale Datenbank ist gerade nicht verfügbar.", code: "DATABASE_ERROR" },
      { status: 503 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: fallback, code: "INTERNAL_ERROR" }, { status: 500 });
}
