import { expect, test } from "@playwright/test";

test("Startseite, Navigation und Suche sind bedienbar", async ({ page }) => {
  const media = {
    tmdbId: 70523,
    type: "tv",
    title: "Dark",
    overview: "Eine Mysteryserie.",
    posterPath: null,
    backdropPath: null,
    releaseDate: "2017-12-01",
    genres: [{ id: 9648, name: "Mystery" }],
    voteAverage: 8.4,
    popularity: 120,
    originalLanguage: "de",
  };
  await page.route("**/api/recommendations*", async (route) => {
    if (route.request().method() === "POST") return route.fulfill({ json: { tracked: true } });
    return route.fulfill({
      json: {
        recommendations: [{ media, score: 10, reasons: ["Passt zu deinem Profil."], source: "popular" }],
        profile: {
          ratingCount: 5,
          positiveCount: 4,
          negativeCount: 1,
          genreScores: {},
          preferredGenres: [],
          avoidedGenres: [],
          languageScores: {},
          decadeScores: {},
          peopleScores: {},
        },
        demoMode: true,
      },
    });
  });
  await page.route("**/api/search*", (route) =>
    route.fulfill({ json: { results: [media], page: 1, totalPages: 1, demoMode: true } }),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Was schaust du als Nächstes?" })).toBeVisible();
  await page.getByRole("link", { name: "Suche", exact: true }).first().click();
  const search = page.getByRole("textbox", { name: "Filme und Serien suchen" });
  await search.fill("Dark");
  await page.getByRole("button", { name: "Suchen", exact: true }).click();
  await expect(page.getByText("Dark", { exact: true }).first()).toBeVisible();
});

test("Einstellungen enthalten die Datenquellen-Attribution", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Datenquellen" })).toBeVisible();
  await expect(page.getByText(/not endorsed or certified by TMDB/i).first()).toBeVisible();
});
