// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { RatingControls } from "@/components/rating-controls";
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

describe("RatingControls", () => {
  it("bietet auch kompakt alle drei Bewertungen mit zugänglichen Namen an", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ rating: {} }), { status: 201 })));
    const { container } = render(<RatingControls media={media} compact />);

    expect(screen.getByRole("button", { name: "Gefällt mir: Testfilm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gefällt mir nicht: Testfilm" })).toBeInTheDocument();
    const neutral = screen.getByRole("button", { name: "Neutral bewertet: Testfilm" });
    fireEvent.click(neutral);
    expect(await screen.findByRole("button", { name: "Bewertung entfernen" })).toBeInTheDocument();

    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
