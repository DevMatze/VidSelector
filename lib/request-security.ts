export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Zu viele Anfragen. Bitte warte kurz und versuche es erneut.");
    this.name = "RateLimitError";
  }
}

export class OriginError extends Error {
  constructor() {
    super("Diese Anfrage wurde aus Sicherheitsgründen abgelehnt.");
    this.name = "OriginError";
  }
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number): void {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "local";
  const key = `${scope}:${client}`;
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > limit) throw new RateLimitError(Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)));
  if (buckets.size > 1_000) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }
}

export function assertSameOrigin(request: Request): void {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new OriginError();
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return;
  try {
    if (new URL(origin).host !== host) throw new OriginError();
  } catch (error) {
    if (error instanceof OriginError) throw error;
    throw new OriginError();
  }
}
