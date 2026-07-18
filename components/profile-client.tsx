"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Check, Heart, Sparkles, ThumbsDown, UsersRound } from "lucide-react";
import type { TasteProfile } from "@/lib/types";
import { useI18n } from "@/components/app-provider";
import type { UiLanguage } from "@/lib/i18n";
import { localizeGenreName } from "@/lib/genres";

interface Profile {
  name: string;
  language: UiLanguage;
  createdAt: string;
  ratings: number;
  recommendations: number;
  watchEntries: number;
  ratedRecommendations: number;
}

const PROFILE_LOAD_ERROR = "__PROFILE_LOAD_ERROR__";

export function ProfileClient() {
  const { t, locale, language, setLanguage, config } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProfile(data.profile);
        setName(data.profile.name);
        setLanguage(data.profile.language);
        setTaste(data.taste);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : PROFILE_LOAD_ERROR));
  }, [setLanguage]);

  async function save() {
    setPending(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setProfile((current) => (current ? { ...current, name: json.profile.name } : current));
      setMessage(t("common.saved"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("profile.saveError"));
    } finally {
      setPending(false);
    }
  }

  if (error)
    return (
      <div className="page-shell">
        <div className="status-panel">
          <h2>{t("profile.unavailable")}</h2>
          <p>{error === PROFILE_LOAD_ERROR ? t("profile.loadError") : error}</p>
        </div>
      </div>
    );
  if (!profile || !taste)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>{t("profile.loading")}</p>
        </div>
      </div>
    );
  const memberSince = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(profile.createdAt),
  );
  return (
    <div className="page-shell profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{profile.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <p className="eyebrow">{t("profile.eyebrow")}</p>
          <h1>{profile.name}</h1>
          <p className="lead">{t("profile.member", { date: memberSince, count: taste.ratingCount })}</p>
        </div>
      </div>
      <section className="profile-stats">
        <div>
          <Heart size={21} />
          <strong>{taste.positiveCount}</strong>
          <span>{t("rating.like")}</span>
        </div>
        <div>
          <ThumbsDown size={21} />
          <strong>{taste.negativeCount}</strong>
          <span>{t("rating.dislike")}</span>
        </div>
        <div>
          <Sparkles size={21} />
          <strong>{profile.recommendations}</strong>
          <span>{t("profile.currentSuggestions")}</span>
        </div>
        <div>
          <Check size={21} />
          <strong>{profile.watchEntries}</strong>
          <span>{t("profile.watchlistCount")}</span>
        </div>
        <div>
          <Sparkles size={21} />
          <strong>{profile.ratedRecommendations}</strong>
          <span>{t("profile.ratedSuggestions")}</span>
        </div>
        <div>
          <Award size={21} />
          <strong>
            {t(
              taste.ratingCount >= 10 ? "profile.strong" : taste.ratingCount >= 5 ? "profile.learning" : "profile.new",
            )}
          </strong>
          <span>{t("profile.maturity")}</span>
        </div>
      </section>
      <div className="profile-layout">
        <section className="settings-card">
          <h2>{t("profile.preferred")}</h2>
          {taste.preferredGenres.length ? (
            <div className="taste-list positive">
              {taste.preferredGenres.map((genre) => (
                <span key={genre}>
                  <Heart size={14} fill="currentColor" />
                  {localizeGenreName(genre, language)}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">{t("profile.preferredEmpty")}</p>
          )}
          <h2>{t("profile.avoided")}</h2>
          {taste.avoidedGenres.length ? (
            <div className="taste-list negative">
              {taste.avoidedGenres.map((genre) => (
                <span key={genre}>
                  <ThumbsDown size={14} />
                  {localizeGenreName(genre, language)}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">{t("profile.avoidedEmpty")}</p>
          )}
        </section>
        <section className="settings-card">
          <h2>{t("profile.name")}</h2>
          <p className="muted">{t("profile.nameHelp")}</p>
          <div className="name-row">
            <label className="sr-only" htmlFor="profile-name">
              {t("profile.nameLabel")}
            </label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
          </div>
          <button className="button primary" disabled={pending || !name.trim()} onClick={save}>
            <Check size={16} />
            {t(pending ? "common.saving" : "common.save")}
          </button>
          {config.users.mode === "multiple" && (
            <Link className="button" href="/users">
              <UsersRound size={16} />
              {t("users.manage")}
            </Link>
          )}
          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
