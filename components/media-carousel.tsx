"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/components/app-provider";

export function MediaCarousel<T>({
  items,
  renderItem,
  label,
  pageSize = 5,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  label: string;
  pageSize?: number;
}) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visibleItems = useMemo(
    () => items.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [currentPage, items, pageSize],
  );

  function move(direction: -1 | 1) {
    setPage(Math.min(pages - 1, Math.max(0, currentPage + direction)));
    trackRef.current?.scrollTo?.({ left: 0, behavior: "smooth" });
  }

  return (
    <div className="carousel-shell">
      <div className="carousel-buttons carousel-overlay" aria-label={t("common.carouselNav", { label })}>
        {currentPage > 0 && (
          <button
            className="carousel-previous"
            type="button"
            onClick={() => move(-1)}
            aria-label={t("common.previous", { label })}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {currentPage < pages - 1 && (
          <button
            className="carousel-next"
            type="button"
            onClick={() => move(1)}
            aria-label={t("common.next", { label })}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>
      <div
        className="media-carousel"
        ref={trackRef}
        tabIndex={0}
        aria-label={t("common.pageOf", { label, page: currentPage + 1, pages })}
      >
        {visibleItems.map(renderItem)}
      </div>
      {pages > 1 && (
        <span className="carousel-page" aria-live="polite">
          {currentPage + 1} / {pages}
        </span>
      )}
    </div>
  );
}
