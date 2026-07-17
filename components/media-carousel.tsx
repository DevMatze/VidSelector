"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function MediaCarousel<T>({
  items,
  renderItem,
  label,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ page: 0, pages: 1, canGoBack: false, canGoForward: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const viewportWidth = Math.max(track.clientWidth, 1);
    const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const tolerance = 2;
    const pages = Math.max(1, Math.ceil(track.scrollWidth / viewportWidth));
    const atEnd = track.scrollLeft >= maximumScroll - tolerance;
    const page = atEnd ? pages - 1 : Math.min(pages - 1, Math.max(0, Math.round(track.scrollLeft / viewportWidth)));
    setPosition({
      page,
      pages,
      canGoBack: track.scrollLeft > tolerance,
      canGoForward: maximumScroll > tolerance && !atEnd,
    });
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length, measure]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="carousel-shell">
      <div className="carousel-buttons carousel-overlay" aria-label={`Navigation für ${label}`}>
        {position.canGoBack && (
          <button
            className="carousel-previous"
            type="button"
            onClick={() => move(-1)}
            aria-label={`Vorherige ${label}`}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {position.canGoForward && (
          <button className="carousel-next" type="button" onClick={() => move(1)} aria-label={`Nächste ${label}`}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>
      <div className="media-carousel" ref={trackRef} onScroll={measure} tabIndex={0} aria-label={label}>
        {items.map(renderItem)}
      </div>
      {position.pages > 1 && (
        <span className="carousel-page" aria-live="polite">
          {position.page + 1} / {position.pages}
        </span>
      )}
    </div>
  );
}
