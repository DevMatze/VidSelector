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

  it("akzeptiert schreibende Anfragen über dieselbe LAN-Adresse", () => {
    expect(() =>
      assertSameOrigin(
        new Request("http://192.168.0.242:3000/api/watchlist", {
          headers: {
            host: "192.168.0.242:3000",
            origin: "http://192.168.0.242:3000",
            "sec-fetch-site": "same-origin",
          },
        }),
      ),
    ).not.toThrow();
  });

  it("begrenzt wiederholte Anfragen pro Bereich", () => {
    const request = new Request("http://localhost", { headers: { "x-real-ip": "rate-limit-test" } });
    enforceRateLimit(request, "test", 1, 60_000);
    expect(() => enforceRateLimit(request, "test", 1, 60_000)).toThrow(RateLimitError);
  });
});
