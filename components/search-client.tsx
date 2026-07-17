"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Clapperboard, AlertCircle, SlidersHorizontal } from "lucide-react";
import type { MediaSummary } from "@/lib/types";
import { DemoBanner } from "@/components/demo-banner";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");
  const [hideUpcoming, setHideUpcoming] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [partial, setPartial] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const executeSearch = useCallback(async (rawQuery: string, nextPage = 1, append = false) => {
    const normalized = rawQuery.trim();
    if (normalized.length < 2) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    setError("");
    if (!append) setResults([]);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}&page=${nextPage}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (requestControllerRef.current !== controller) return;
      setResults((current) =>
        append
          ? [
              ...new Map(
                [...current, ...data.results].map((media) => [`${media.type}:${media.tmdbId}`, media]),
              ).values(),
            ]
          : data.results,
      );
      setPage(data.page ?? nextPage);
      setTotalPages(data.totalPages ?? 1);
      setPartial(Boolean(data.partial));
      setDemoMode(data.demoMode);
    } catch (reason) {
      if ((reason as Error).name !== "AbortError")
        setError(reason instanceof Error ? reason.message : "Suche fehlgeschlagen.");
    } finally {
      if (requestControllerRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    requestControllerRef.current?.abort();
    if (normalized.length < 2) return;
    timerRef.current = window.setTimeout(() => {
      void executeSearch(normalized);
    }, 400);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query, executeSearch]);

  const filteredResults = useMemo(
    () =>
      results.filter((media) => {
        if (mediaFilter !== "all" && media.type !== mediaFilter) return false;
        if (media.type !== "movie" || !media.releaseDate) return true;
        const releaseDate = new Date(`${media.releaseDate}T00:00:00`);
        if (Number.isNaN(releaseDate.getTime())) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (hideUpcoming && releaseDate > today) return false;
        return true;
      }),
    [results, mediaFilter, hideUpcoming],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    void executeSearch(query);
  }

  function clearSearch() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    requestControllerRef.current?.abort();
    setQuery("");
    setResults([]);
    setError("");
    setLoading(false);
    setPage(1);
    setTotalPages(1);
    setPartial(false);
  }

  function changeQuery(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      setPage(1);
      setTotalPages(1);
      setPartial(false);
    } else {
      setResults([]);
      setError("");
      setLoading(true);
      setPage(1);
      setTotalPages(1);
      setPartial(false);
    }
  }

  return (
    <div className="page-shell search-page">
      <div className="search-intro">
        <p className="eyebrow">Entdecken & bewerten</p>
        <h1>Was kennst du schon?</h1>
        <p className="lead">
          Suche gleichzeitig nach Filmen und Serien. Deine Bewertungen formen jede künftige Empfehlung.
        </p>
      </div>
      <form className="search-box" onSubmit={submitSearch}>
        <Search size={22} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          placeholder="Titel, Genre oder Stichwort suchen …"
          aria-label="Filme und Serien suchen"
        />
        {query && (
          <button className="search-clear" type="button" onClick={clearSearch} aria-label="Suche leeren">
            <X size={19} />
          </button>
        )}
        {loading && <span className="mini-spinner" aria-hidden="true" />}
        <button className="search-submit" type="submit" disabled={query.trim().length < 2}>
          Suchen
        </button>
      </form>
      <p className="search-timing">Suche mit Enter oder automatisch nach einer kurzen Eingabepause.</p>
      {demoMode && <DemoBanner />}
      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {partial && (
        <div className="notice" role="status">
          TMDB ist gerade nicht erreichbar. Angezeigt werden verfügbare lokale Treffer.
        </div>
      )}
      {!query && (
        <div className="search-empty">
          <Clapperboard size={42} />
          <h2>Ein Titel genügt</h2>
          <p>Gib mindestens zwei Zeichen ein und drücke Enter – oder warte kurz nach dem Tippen.</p>
        </div>
      )}
      {query.trim().length === 1 && <p className="search-hint">Bitte gib noch ein Zeichen ein.</p>}
      {!loading && query.trim().length >= 2 && !error && results.length === 0 && (
        <div className="search-empty">
          <Search size={38} />
          <h2>Kein Treffer</h2>
          <p>Versuche den Originaltitel oder eine andere Schreibweise.</p>
        </div>
      )}
      {results.length > 0 && (
        <section className="section">
          <div className="search-filters">
            <div className="filter-group" aria-label="Inhaltstyp">
              <SlidersHorizontal size={16} />
              <button
                type="button"
                className={mediaFilter === "all" ? "active" : ""}
                onClick={() => setMediaFilter("all")}
              >
                Alles
              </button>
              <button
                type="button"
                className={mediaFilter === "movie" ? "active" : ""}
                onClick={() => setMediaFilter("movie")}
              >
                Filme
              </button>
              <button
                type="button"
                className={mediaFilter === "tv" ? "active" : ""}
                onClick={() => setMediaFilter("tv")}
              >
                Serien
              </button>
            </div>
            <div className="availability-filters">
              <label>
                <input
                  type="checkbox"
                  checked={hideUpcoming}
                  onChange={(event) => setHideUpcoming(event.target.checked)}
                />
                Noch nicht erschienene Filme ausblenden
              </label>
            </div>
          </div>
          <div className="section-heading">
            <div>
              <h2>{filteredResults.length} Treffer</h2>
              <p>
                {mediaFilter === "all"
                  ? "Getrennt nach Filmen und Serien"
                  : mediaFilter === "movie"
                    ? "Nur Filme"
                    : "Nur Serien"}
              </p>
            </div>
          </div>
          {filteredResults.length === 0 ? (
            <div className="search-empty filtered-empty">
              <SlidersHorizontal size={38} />
              <h2>Keine Treffer mit diesen Filtern</h2>
              <p>Entferne einen Filter, um weitere Ergebnisse zu sehen.</p>
            </div>
          ) : (
            <>
              <MediaTypeGroups
                items={filteredResults}
                getMedia={(media) => media}
                renderItem={(media) => <MediaCard key={`${media.type}:${media.tmdbId}`} media={media} />}
              />
              {page < totalPages && (
                <div className="load-more">
                  <button
                    className="button"
                    type="button"
                    disabled={loading}
                    onClick={() => void executeSearch(query, page + 1, true)}
                  >
                    {loading ? "Weitere Treffer werden geladen …" : "Weitere Treffer laden"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
