// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider, type PublicAppConfig } from "@/components/app-provider";
import { MediaTypeGroups } from "@/components/media-type-groups";
import { SettingsClient } from "@/components/settings-client";
import { Dashboard } from "@/components/dashboard";
import { UsersClient } from "@/components/users-client";

const config: PublicAppConfig = {
  users: { mode: "simple" },
  localization: { default_language: "de" },
  recommendations: { show_reasons: true, homepage_limit: 50, load_batch_size: 20 },
  features: { profile_import_export: true, streaming_providers: true, trailers: true, similar_titles: true },
  backups: {
    enabled: true,
    directory: "./backups",
    before_migration: true,
    before_import: true,
    database_backups: 10,
    daily_profile_backups: 7,
    weekly_profile_backups: 4,
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("konfigurationsabhängige UI", () => {
  it("zeigt im Standardmodus keine aktive Benutzerverwaltung", () => {
    render(
      <AppProvider initialLanguage="de" config={config}>
        <UsersClient />
      </AppProvider>,
    );
    expect(screen.getByRole("heading", { name: "Einzelbenutzermodus ist aktiv" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Benutzer anlegen" })).not.toBeInTheDocument();
  });

  it("zeigt im Mehrbenutzermodus getrennte Profile und das Anlegeformular", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          activeUserId: "local-user",
          users: [
            {
              id: "local-user",
              name: "DevMatze",
              language: "de",
              createdAt: "2026-01-01T00:00:00.000Z",
              ratings: 55,
              recommendations: 100,
              watchEntries: 2,
              isDefault: true,
            },
          ],
        }),
      }),
    );
    render(
      <AppProvider initialLanguage="de" config={{ ...config, users: { mode: "multiple" } }}>
        <UsersClient />
      </AppProvider>,
    );
    expect(await screen.findByText("DevMatze")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Benutzer anlegen" })).toBeInTheDocument();
    expect(screen.getByText("Hauptbenutzer")).toBeInTheDocument();
  });

  it("lädt Titel in der konfigurierten Schrittgröße nach", () => {
    const items = Array.from({ length: 16 }, (_, id) => ({ id, type: "movie" as const }));
    render(
      <AppProvider
        initialLanguage="de"
        config={{ ...config, recommendations: { ...config.recommendations, load_batch_size: 7 } }}
      >
        <MediaTypeGroups
          items={items}
          getMedia={(item) => item}
          progressive
          renderItem={(item) => <span key={item.id}>Titel {item.id}</span>}
        />
      </AppProvider>,
    );
    expect(screen.getAllByText(/Titel \d+/)).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: "Weitere 7 filme laden" }));
    expect(screen.getAllByText(/Titel \d+/)).toHaveLength(14);
    expect(screen.getByRole("button", { name: "Weitere 2 filme laden" })).toBeInTheDocument();
  });

  it("blendet Profilimport und -export vollständig aus", () => {
    render(
      <AppProvider
        initialLanguage="de"
        config={{ ...config, features: { ...config.features, profile_import_export: false } }}
      >
        <SettingsClient />
      </AppProvider>,
    );
    expect(screen.queryByRole("heading", { name: "Datensicherung" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Daten exportieren/ })).not.toBeInTheDocument();
  });

  it("zeigt bei deaktivierter Option keine Empfehlungserklärung", async () => {
    const media = {
      tmdbId: 1,
      type: "movie",
      title: "Testfilm",
      overview: "Übersicht",
      posterPath: null,
      backdropPath: null,
      releaseDate: "2020-01-01",
      genres: [],
      voteAverage: 8,
      voteCount: 100,
      popularity: 10,
      originalLanguage: "de",
    } as const;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          new Response(
            JSON.stringify(
              init?.method === "POST"
                ? { tracked: true }
                : {
                    recommendations: [{ media, score: 10, reasons: ["GEHEIME ERKLÄRUNG"], source: "popular" }],
                    profile: { ratingCount: 5 },
                    demoMode: false,
                  },
            ),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    render(
      <AppProvider
        initialLanguage="de"
        config={{ ...config, recommendations: { ...config.recommendations, show_reasons: false } }}
      >
        <Dashboard />
      </AppProvider>,
    );
    await screen.findByRole("heading", { name: "Testfilm" });
    await waitFor(() => expect(screen.queryByText("GEHEIME ERKLÄRUNG")).not.toBeInTheDocument());
  });
});
