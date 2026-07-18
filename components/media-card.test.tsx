// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MediaCard } from "@/components/media-card";
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

describe("MediaCard", () => {
  it("zeigt bei Empfehlungen Merken, aber keine Ausblendaktion", () => {
    render(<MediaCard media={media} trackRecommendation />);

    expect(screen.getByRole("button", { name: "Merken: Testfilm" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /nicht interessiert/i })).not.toBeInTheDocument();
  });
});
