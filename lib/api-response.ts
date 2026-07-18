import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { TmdbError } from "@/lib/tmdb";
import { OriginError, RateLimitError } from "@/lib/request-security";
import { FeatureDisabledError } from "@/lib/features";
import { logger } from "@/lib/logger";
import { DefaultUserDeletionError, UserManagementDisabledError } from "@/lib/users";

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
  if (error instanceof FeatureDisabledError) {
    return NextResponse.json({ error: error.message, code: "FEATURE_DISABLED" }, { status: 404 });
  }
  if (error instanceof UserManagementDisabledError) {
    return NextResponse.json({ error: error.message, code: "USER_MANAGEMENT_DISABLED" }, { status: 404 });
  }
  if (error instanceof DefaultUserDeletionError) {
    return NextResponse.json({ error: error.message, code: "DEFAULT_USER_PROTECTED" }, { status: 400 });
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
  logger.error("Unbehandelter API-Fehler", { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json({ error: fallback, code: "INTERNAL_ERROR" }, { status: 500 });
}
