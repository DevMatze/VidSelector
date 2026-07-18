import { expect, test, type APIRequestContext } from "@playwright/test";
import { translate, type UiLanguage } from "@/lib/i18n";

async function currentLanguage(request: APIRequestContext): Promise<UiLanguage> {
  const response = await request.get("/api/profile?summary=1");
  const { profile } = (await response.json()) as { profile: { language: UiLanguage } };
  return profile.language;
}

test("Startseite, Navigation und Suche sind bedienbar", async ({ page, request }) => {
  const language = await currentLanguage(request);
  const t = (key: string, values?: Record<string, string | number>) => translate(language, key, values);
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
  await expect(page.getByRole("heading", { name: t("dashboard.title") })).toBeVisible();
  await expect(page.getByRole("button", { name: t("bookmark.addLabel", { title: "Dark" }) })).toBeVisible();
  await expect(page.getByRole("button", { name: /nicht interessiert/i })).toHaveCount(0);
  await page
    .getByRole("link", { name: t("nav.search"), exact: true })
    .first()
    .click();
  const search = page.getByRole("textbox", { name: t("search.label") });
  await search.fill("Dark");
  await page.getByRole("button", { name: t("search.submit"), exact: true }).click();
  await expect(page.getByText("Dark", { exact: true }).first()).toBeVisible();
});

test("Einstellungen enthalten die Datenquellen-Attribution", async ({ page, request }) => {
  const language = await currentLanguage(request);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: translate(language, "settings.sources") })).toBeVisible();
  await expect(page.getByText(/not endorsed or certified by TMDB/i).first()).toBeVisible();
});

test("Merkliste und lokale Datensicherung sind erreichbar", async ({ page, request }) => {
  const language = await currentLanguage(request);
  const t = (key: string) => translate(language, key);
  await page.route("**/api/watchlist*", (route) => route.fulfill({ json: { entries: [], totalEntries: 0 } }));
  await page.goto("/watchlist");
  await expect(page.getByRole("heading", { name: t("watchlist.title") })).toBeVisible();
  await expect(page.getByText(t("watchlist.empty"))).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: t("settings.backup") })).toBeVisible();
  await expect(page.getByRole("link", { name: t("settings.export") })).toHaveAttribute("href", "/api/profile/export");
  await expect(page.getByRole("button", { name: t("settings.import") })).toBeVisible();
});

test("Einzelbenutzermodus bleibt der sichere Standard", async ({ page, request }) => {
  const language = await currentLanguage(request);
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: translate(language, "users.disabledTitle") })).toBeVisible();
  await expect(page.getByRole("button", { name: translate(language, "users.create") })).toHaveCount(0);
});

test("Profilsprache schaltet die komplette Navigation ohne Neustart um", async ({ page }) => {
  let currentLanguage = "de";
  await page.route("**/api/profile*", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as { language: string };
      currentLanguage = body.language;
    }
    return route.fulfill({
      json: {
        profile: {
          name: "Filmfan",
          language: currentLanguage,
          createdAt: "2026-01-01T00:00:00.000Z",
          ratings: 0,
          recommendations: 0,
          watchEntries: 0,
          ratedRecommendations: 0,
        },
        taste: { ratingCount: 0, positiveCount: 0, negativeCount: 0, preferredGenres: [], avoidedGenres: [] },
      },
    });
  });
  await page.goto("/profile");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("link", { name: "Recommendations", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByRole("link", { name: "Recomendaciones", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Français" }).click();
  await expect(page.getByRole("link", { name: "Recommandations", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Deutsch" }).click();
  await expect(page.getByRole("link", { name: "Empfehlungen", exact: true }).first()).toBeVisible();
});
