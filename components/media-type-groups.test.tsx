// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MediaTypeGroups } from "@/components/media-type-groups";

describe("MediaTypeGroups", () => {
  it("lädt eine unbegrenzte Serienliste in 20er-Schritten nach", () => {
    const items = Array.from({ length: 45 }, (_, index) => ({ id: index + 1, type: "tv" as const }));

    render(
      <MediaTypeGroups
        items={items}
        getMedia={(item) => item}
        progressive
        renderItem={(item) => <span key={item.id}>Serie {item.id}</span>}
      />,
    );

    expect(screen.getByText("Serie 20")).toBeInTheDocument();
    expect(screen.queryByText("Serie 21")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Weitere 20 serien laden" }));

    expect(screen.getByText("Serie 40")).toBeInTheDocument();
    expect(screen.queryByText("Serie 41")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Weitere 5 serien laden" }));

    expect(screen.getByText("Serie 45")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Weitere .* serien laden/ })).not.toBeInTheDocument();
  });
});
