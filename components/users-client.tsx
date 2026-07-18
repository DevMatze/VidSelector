"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Save, Trash2, UserRound, UsersRound } from "lucide-react";
import { useI18n } from "@/components/app-provider";
import { languageNames, supportedUiLanguages, type UiLanguage } from "@/lib/i18n";

interface ManagedUser {
  id: string;
  name: string;
  language: UiLanguage;
  createdAt: string;
  ratings: number;
  recommendations: number;
  watchEntries: number;
  isDefault: boolean;
}

async function responseJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

function UserCard({ user, active, onChanged }: { user: ManagedUser; active: boolean; onChanged: () => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState(user.language);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function update() {
    setPending(true);
    setError("");
    try {
      await responseJson(
        await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, language }),
        }),
      );
      await onChanged();
      if (active && language !== user.language) window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("users.updateError"));
    } finally {
      setPending(false);
    }
  }

  async function select() {
    setPending(true);
    setError("");
    try {
      await responseJson(await fetch(`/api/users/${user.id}/select`, { method: "POST" }));
      window.location.assign("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("users.selectError"));
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("users.confirmDelete", { name: user.name }))) return;
    setPending(true);
    setError("");
    try {
      await responseJson(await fetch(`/api/users/${user.id}`, { method: "DELETE" }));
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("users.deleteError"));
    } finally {
      setPending(false);
    }
  }

  const changed = name.trim() !== user.name || language !== user.language;
  return (
    <article className={active ? "user-card active" : "user-card"}>
      <div className="user-card-heading">
        <div className="profile-avatar small">{user.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <strong>{user.name}</strong>
          <div className="user-badges">
            {active && (
              <span>
                <Check size={12} />
                {t("users.active")}
              </span>
            )}
            {user.isDefault && <span>{t("users.defaultBadge")}</span>}
          </div>
        </div>
      </div>
      <div className="user-counts">
        <span>{t("users.ratings", { count: user.ratings })}</span>
        <span>{t("users.watchlist", { count: user.watchEntries })}</span>
      </div>
      <label>
        <span>{t("users.name")}</span>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
      </label>
      <label>
        <span>{t("users.language")}</span>
        <select value={language} onChange={(event) => setLanguage(event.target.value as UiLanguage)}>
          {supportedUiLanguages.map((item) => (
            <option key={item} value={item}>
              {languageNames[item]}
            </option>
          ))}
        </select>
      </label>
      <div className="user-actions">
        {!active && (
          <button className="button primary" disabled={pending} onClick={() => void select()}>
            <UserRound size={16} />
            {t("users.select")}
          </button>
        )}
        <button className="button" disabled={pending || !changed || !name.trim()} onClick={() => void update()}>
          <Save size={16} />
          {t("users.save")}
        </button>
        {!user.isDefault && (
          <button className="button danger" disabled={pending} onClick={() => void remove()}>
            <Trash2 size={16} />
            {t("users.delete")}
          </button>
        )}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

export function UsersClient() {
  const { t, config } = useI18n();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<UiLanguage>(config.localization.default_language);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(config.users.mode === "multiple");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const data = await responseJson(await fetch("/api/users"));
      setUsers(data.users);
      setActiveUserId(data.activeUserId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("users.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (config.users.mode !== "multiple") return;
    let cancelled = false;
    void fetch("/api/users")
      .then(responseJson)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.users);
        setActiveUserId(data.activeUserId);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : t("users.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.users.mode, t]);

  async function create() {
    setPending(true);
    setError("");
    try {
      await responseJson(
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, language }),
        }),
      );
      setName("");
      setLanguage(config.localization.default_language);
      await loadUsers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("users.createError"));
    } finally {
      setPending(false);
    }
  }

  if (config.users.mode !== "multiple") {
    return (
      <div className="page-shell">
        <div className="status-panel">
          <UsersRound size={34} />
          <h1>{t("users.disabledTitle")}</h1>
          <p>{t("users.disabledBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell users-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("users.eyebrow")}</p>
          <h1>{t("users.title")}</h1>
          <p className="lead">{t("users.lead")}</p>
        </div>
      </header>
      <section className="settings-card user-create-card">
        <div>
          <h2>{t("users.newTitle")}</h2>
          <p className="muted">{t("users.lead")}</p>
        </div>
        <label>
          <span>{t("users.name")}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </label>
        <label>
          <span>{t("users.language")}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as UiLanguage)}>
            {supportedUiLanguages.map((item) => (
              <option key={item} value={item}>
                {languageNames[item]}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" disabled={pending || !name.trim()} onClick={() => void create()}>
          <Plus size={16} />
          {t(pending ? "users.creating" : "users.create")}
        </button>
      </section>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="status-panel">
          <div className="spinner" />
        </div>
      ) : (
        <section className="users-grid">
          {users.map((user) => (
            <UserCard key={user.id} user={user} active={user.id === activeUserId} onChanged={loadUsers} />
          ))}
        </section>
      )}
    </div>
  );
}
