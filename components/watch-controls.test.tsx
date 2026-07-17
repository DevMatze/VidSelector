// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WatchControls } from "@/components/watch-controls";
import type { MediaSummary } from "@/lib/types";

const media: MediaSummary = {
  tmdbId: 1,
  type: "movie",
  title: "Testfilm",
  overview: "",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2020-01-01",
  genres: [],
  voteAverage: 7,
  popularity: 10,
  originalLanguage: "de",
};

afterEach(() => vi.restoreAllMocks());

describe("WatchControls", () => {
  it("setzt einen unbekannten Titel kompakt auf die Merkliste", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ entry: {} }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<WatchControls media={media} compact />);

    fireEvent.click(screen.getByRole("button", { name: "Zur Merkliste hinzufügen: Testfilm" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ status: "planned", media: { tmdbId: 1 } });
    expect(await screen.findByRole("button", { name: "Möchte ich sehen entfernen: Testfilm" })).toBeInTheDocument();
  });
});
