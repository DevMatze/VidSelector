import { describe, expect, it } from "vitest";
import { dictionaries, supportedUiLanguages, translate } from "@/lib/i18n";
import { scoreRecommendations } from "@/lib/recommendations/engine";
import type { MediaSummary } from "@/lib/types";

describe("UI-Übersetzungen", () => {
  it("enthält jeden deutschen UI-Schlüssel in allen vier Sprachen", () => {
    const keys = Object.keys(dictionaries.de).sort();
    for (const language of supportedUiLanguages) expect(Object.keys(dictionaries[language]).sort()).toEqual(keys);
  });

  it("ersetzt Variablen und fällt auf Englisch, dann Deutsch zurück", () => {
    expect(translate("fr", "common.countOf", { visible: 2, total: 5 })).toBe("2 sur 5");
    expect(translate("es", "missing.key")).toBe("missing.key");
  });

  it.each([
    ["de", "Von der Community"],
    ["en", "Highly rated"],
    ["es", "Muy bien valorado"],
    ["fr", "Très bien noté"],
  ] as const)("erzeugt Empfehlungserklärungen auf %s", (language, expected) => {
    const media: MediaSummary = {
      tmdbId: 1,
      type: "movie",
      title: "Test",
      overview: "",
      posterPath: null,
      backdropPath: null,
      releaseDate: "2020-01-01",
      genres: [],
      voteAverage: 8,
      voteCount: 1000,
      popularity: 10,
      originalLanguage: "en",
    };
    const result = scoreRecommendations([], [{ media, source: "popular" }], language);
    expect(result.recommendations[0].reasons.join(" ")).toContain(expected);
  });
});
