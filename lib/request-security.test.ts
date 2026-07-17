import { describe, expect, it } from "vitest";
import { assertSameOrigin, enforceRateLimit, OriginError, RateLimitError } from "@/lib/request-security";

describe("request security", () => {
  it("akzeptiert gleiche Origins und lehnt fremde ab", () => {
    expect(() =>
      assertSameOrigin(new Request("http://localhost", { headers: { origin: "http://localhost", host: "localhost" } })),
    ).not.toThrow();
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost", { headers: { origin: "https://example.org", host: "localhost" } }),
      ),
    ).toThrow(OriginError);
  });

  it("begrenzt wiederholte Anfragen pro Bereich", () => {
    const request = new Request("http://localhost", { headers: { "x-real-ip": "rate-limit-test" } });
    enforceRateLimit(request, "test", 1, 60_000);
    expect(() => enforceRateLimit(request, "test", 1, 60_000)).toThrow(RateLimitError);
  });
});
