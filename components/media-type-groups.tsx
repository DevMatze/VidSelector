"use client";

import Link from "next/link";
import { ArrowRight, Film, Tv } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { MediaType } from "@/lib/types";
import { MediaCarousel } from "@/components/media-carousel";

interface TypedItem {
  type: MediaType;
}

interface Props<T> {
  items: T[];
  getMedia: (item: T) => TypedItem;
  renderItem: (item: T) => ReactNode;
  gridClassName?: string;
  limitPerType?: number;
  paginate?: boolean;
  pageSize?: number;
  seeMoreHrefs?: Partial<Record<MediaType, string>>;
  progressive?: boolean;
  initialVisiblePerType?: number;
  loadMoreStep?: number;
}

const GROUPS = [
  { type: "movie", label: "Filme", Icon: Film },
  { type: "tv", label: "Serien", Icon: Tv },
] as const;

export function MediaTypeGroups<T>({
  items,
  getMedia,
  renderItem,
  gridClassName = "",
  limitPerType,
  paginate = false,
  pageSize = 5,
  seeMoreHrefs,
  progressive = false,
  initialVisiblePerType = 20,
  loadMoreStep = 20,
}: Props<T>) {
  return (
    <div className="media-type-groups">
      {GROUPS.map(({ type, label, Icon }) => {
        const entries = items.filter((item) => getMedia(item).type === type).slice(0, limitPerType);
        if (entries.length === 0) return null;

        return (
          <MediaTypeGroup
            key={type}
            type={type}
            label={label}
            Icon={Icon}
            entries={entries}
            renderItem={renderItem}
            gridClassName={gridClassName}
            paginate={paginate}
            pageSize={pageSize}
            seeMoreHref={seeMoreHrefs?.[type]}
            progressive={progressive}
            initialVisible={initialVisiblePerType}
            loadMoreStep={loadMoreStep}
          />
        );
      })}
    </div>
  );
}

function MediaTypeGroup<T>({
  type,
  label,
  Icon,
  entries,
  renderItem,
  gridClassName,
  paginate,
  pageSize,
  seeMoreHref,
  progressive,
  initialVisible,
  loadMoreStep,
}: {
  type: MediaType;
  label: string;
  Icon: typeof Film;
  entries: T[];
  renderItem: (item: T) => ReactNode;
  gridClassName: string;
  paginate: boolean;
  pageSize: number;
  seeMoreHref?: string;
  progressive: boolean;
  initialVisible: number;
  loadMoreStep: number;
}) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const effectiveVisibleCount = Math.min(entries.length, Math.max(initialVisible, visibleCount));
  const visibleEntries = progressive ? entries.slice(0, effectiveVisibleCount) : entries;
  return (
    <section className={`media-type-group ${type}`}>
      <div className="media-type-heading">
        <h3>
          <Icon size={18} />
          {label}
        </h3>
        <div className="media-type-navigation">
          {seeMoreHref && (
            <Link className="see-more-link" href={seeMoreHref}>
              Siehe mehr <ArrowRight size={15} />
            </Link>
          )}
          <span>{entries.length}</span>
        </div>
      </div>
      {paginate && entries.length > pageSize ? (
        <MediaCarousel items={entries} renderItem={renderItem} label={label} pageSize={pageSize} />
      ) : (
        <>
          <div className={`media-grid ${gridClassName}`.trim()}>{visibleEntries.map(renderItem)}</div>
          {progressive && effectiveVisibleCount < entries.length && (
            <div className="load-more-row">
              <button className="button" type="button" onClick={() => setVisibleCount((count) => count + loadMoreStep)}>
                Weitere {Math.min(loadMoreStep, entries.length - effectiveVisibleCount)} {label.toLocaleLowerCase("de")}{" "}
                laden
              </button>
              <span>
                {visibleEntries.length} von {entries.length}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
