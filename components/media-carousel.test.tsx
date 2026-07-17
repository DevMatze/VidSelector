// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MediaCarousel } from "@/components/media-carousel";

describe("MediaCarousel", () => {
  it("rendert immer nur die aktuelle Fünfergruppe und blendet Randpfeile aus", () => {
    render(
      <MediaCarousel
        items={Array.from({ length: 12 }, (_, index) => index + 1)}
        label="Testtitel"
        pageSize={5}
        renderItem={(item) => <span key={item}>Titel {item}</span>}
      />,
    );

    expect(screen.getByText("Titel 1")).toBeInTheDocument();
    expect(screen.getByText("Titel 5")).toBeInTheDocument();
    expect(screen.queryByText("Titel 6")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vorherige Testtitel" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nächste Testtitel" }));

    expect(screen.queryByText("Titel 1")).not.toBeInTheDocument();
    expect(screen.getByText("Titel 6")).toBeInTheDocument();
    expect(screen.getByText("Titel 10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vorherige Testtitel" })).toBeInTheDocument();
  });
});
