"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Database, Download, ExternalLink, RotateCcw, ShieldCheck, TriangleAlert, Upload } from "lucide-react";
import { useI18n } from "@/components/app-provider";

export function SettingsClient() {
  const { t, config } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<"import" | "reset" | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const fileInput = useRef<HTMLInputElement>(null);

  async function importData(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setMessage("");
    setError("");
    setFeedbackFor("import");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error(t("settings.fileTooLarge"));
      const data: unknown = JSON.parse(await file.text());
      const response = await fetch("/api/profile/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: importMode, data }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setMessage(t("settings.importSuccess", json.imported));
      if (fileInput.current) fileInput.current.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("settings.importError"));
    } finally {
      setPending(false);
    }
  }

  async function reset() {
    setPending(true);
    setMessage("");
    setError("");
    setFeedbackFor("reset");
    try {
      const response = await fetch("/api/profile", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(t("settings.resetSuccess"));
      setConfirming(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("settings.resetError"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="page-shell settings-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("settings.eyebrow")}</p>
          <h1>{t("settings.title")}</h1>
          <p className="lead">{t("settings.lead")}</p>
        </div>
      </div>
      <div className="settings-stack">
        <section className="settings-card">
          <div className="setting-title">
            <Database size={21} />
            <div>
              <h2>{t("settings.tmdb")}</h2>
              <p>{t("settings.tmdbBody")}</p>
            </div>
          </div>
          <ol className="setup-list">
            <li>
              {t("settings.tmdbStep1a")}{" "}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
                TMDB <ExternalLink size={13} />
              </a>{" "}
              {t("settings.tmdbStep1b")}
            </li>
            <li>{t("settings.tmdbStep2")}</li>
            <li>{t("settings.tmdbStep3")}</li>
          </ol>
          <p className="muted small">{t("settings.tmdbHint")}</p>
        </section>
        {config.features.profile_import_export && (
          <section className="settings-card">
            <div className="setting-title">
              <Download size={21} />
              <div>
                <h2>{t("settings.backup")}</h2>
                <p>{t("settings.backupBody")}</p>
              </div>
            </div>
            <div className="backup-actions">
              <a className="button" href="/api/profile/export" download>
                <Download size={16} /> {t("settings.export")}
              </a>
              <label>
                <span>{t("settings.importBehavior")}</span>
                <select value={importMode} onChange={(event) => setImportMode(event.target.value as typeof importMode)}>
                  <option value="merge">{t("settings.merge")}</option>
                  <option value="replace">{t("settings.replace")}</option>
                </select>
              </label>
              <input
                ref={fileInput}
                className="sr-only"
                id="profile-import"
                type="file"
                accept="application/json,.json"
                disabled={pending}
                onChange={(event) => void importData(event.target.files?.[0])}
              />
              <button className="button" type="button" disabled={pending} onClick={() => fileInput.current?.click()}>
                <Upload size={16} /> {t(pending ? "settings.importing" : "settings.import")}
              </button>
            </div>
            <p className="muted small">
              {config.backups.enabled
                ? t("settings.autoBackup", { directory: config.backups.directory })
                : t("settings.noAutoBackup")}
            </p>
            {feedbackFor === "import" && message && (
              <p className="success-message" role="status">
                {message}
              </p>
            )}
            {feedbackFor === "import" && error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
          </section>
        )}
        <section className="settings-card">
          <div className="setting-title">
            <ShieldCheck size={21} />
            <div>
              <h2>{t("settings.privacy")}</h2>
              <p>{t("settings.privacyBody")}</p>
            </div>
          </div>
          <Link className="text-link" href="/profile">
            {t("settings.viewProfile")}
          </Link>
        </section>
        <section className="settings-card">
          <div className="setting-title">
            <ExternalLink size={21} />
            <div>
              <h2>{t("settings.sources")}</h2>
              <p>{t("settings.tmdbNotice")}</p>
            </div>
          </div>
          <p className="muted small">{t("settings.sourcesBody")}</p>
          <a className="text-link" href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            {t("settings.visitTmdb")} <ExternalLink size={13} />
          </a>
        </section>
        <section className="settings-card destructive">
          <div className="setting-title">
            <TriangleAlert size={21} />
            <div>
              <h2>{t("settings.reset")}</h2>
              <p>
                {t("settings.resetBody")}
                {config.backups.enabled && t("settings.resetBackup")}
              </p>
            </div>
          </div>
          {confirming ? (
            <div className="confirm-row">
              <span>{t("settings.confirmReset")}</span>
              <button className="button danger" disabled={pending} onClick={reset}>
                {t("settings.yesReset")}
              </button>
              <button className="button" disabled={pending} onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button className="button danger" onClick={() => setConfirming(true)}>
              <RotateCcw size={16} />
              {t("settings.reset")}
            </button>
          )}
          {feedbackFor === "reset" && message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}
          {feedbackFor === "reset" && error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
