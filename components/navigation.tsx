"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  ChevronDown,
  Clapperboard,
  Compass,
  Search,
  Settings,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useI18n } from "@/components/app-provider";
import { languageNames, supportedUiLanguages, type UiLanguage } from "@/lib/i18n";

const languageFlags: Record<UiLanguage, string> = { de: "🇩🇪", en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷" };

export function Navigation() {
  const { t, language, setLanguage, config } = useI18n();
  const links = [
    { href: "/", label: t("nav.recommendations"), icon: Compass },
    { href: "/search", label: t("nav.search"), icon: Search },
    { href: "/library", label: t("nav.library"), shortLabel: t("nav.libraryShort"), icon: Star },
    { href: "/watchlist", label: t("nav.watchlist"), icon: Bookmark },
    { href: "/profile", label: t("nav.profile"), icon: UserRound },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];
  const pathname = usePathname();
  const router = useRouter();
  const [initial, setInitial] = useState("F");
  const [profileName, setProfileName] = useState("");
  const [pendingLanguage, setPendingLanguage] = useState<UiLanguage | null>(null);
  const [languageError, setLanguageError] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; name: string; language: UiLanguage }>>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectingUser, setSelectingUser] = useState(false);
  useEffect(() => {
    fetch("/api/profile?summary=1")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const name = data?.profile?.name;
        if (typeof data?.profile?.id === "string") setActiveUserId(data.profile.id);
        if (typeof name === "string" && name.trim()) {
          setProfileName(name.trim());
          setInitial(name.trim().slice(0, 1).toUpperCase());
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (config.users.mode !== "multiple") return;
    fetch("/api/users")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.users)) setUsers(data.users);
        if (typeof data?.activeUserId === "string") setActiveUserId(data.activeUserId);
      })
      .catch(() => undefined);
  }, [config.users.mode]);

  async function changeLanguage(nextLanguage: UiLanguage) {
    if (!profileName || nextLanguage === language || pendingLanguage) return;
    setPendingLanguage(nextLanguage);
    setLanguageError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, language: nextLanguage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLanguage(nextLanguage);
      router.refresh();
    } catch (error) {
      setLanguageError(error instanceof Error ? error.message : t("language.saveError"));
    } finally {
      setPendingLanguage(null);
    }
  }

  async function selectUser(userId: string) {
    if (selectingUser || userId === activeUserId) return;
    setSelectingUser(true);
    try {
      const response = await fetch(`/api/users/${userId}/select`, { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.assign("/");
    } catch {
      setLanguageError(t("users.selectError"));
      setSelectingUser(false);
    }
  }
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/category/") || pathname.startsWith("/media/")
      : pathname.startsWith(href);
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/" aria-label={t("nav.homeLabel")}>
          <span className="brand-mark">
            <Clapperboard size={20} />
          </span>
          <span>
            Vid<span>Selector</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label={t("nav.mainLabel")}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link className={active ? "nav-link active" : "nav-link"} href={href} key={href}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="language-flags" role="group" aria-label={t("language.selector")}>
          {supportedUiLanguages.map((item) => (
            <button
              type="button"
              key={item}
              className={item === language ? "active" : ""}
              aria-label={languageNames[item]}
              aria-pressed={item === language}
              disabled={!profileName || pendingLanguage !== null}
              onClick={() => void changeLanguage(item)}
            >
              <span aria-hidden="true">{languageFlags[item]}</span>
            </button>
          ))}
        </div>
        {languageError && (
          <span className="sr-only" role="alert">
            {languageError}
          </span>
        )}
        {config.users.mode === "multiple" ? (
          <div className="profile-switcher">
            <button
              type="button"
              className="profile-chip"
              aria-label={t("users.openMenu")}
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              {initial}
              <ChevronDown size={12} />
            </button>
            {userMenuOpen && (
              <div className="profile-menu">
                {users.map((user) => (
                  <button type="button" key={user.id} disabled={selectingUser} onClick={() => void selectUser(user.id)}>
                    <span className="profile-menu-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
                    <span>{user.name}</span>
                    {user.id === activeUserId && <Check size={15} />}
                  </button>
                ))}
                <Link href="/profile">
                  <UserRound size={16} />
                  {t("nav.profile")}
                </Link>
                <Link href="/users">
                  <UsersRound size={16} />
                  {t("users.manage")}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link className="profile-chip" href="/profile" aria-label={t("nav.openProfile")}>
            {initial}
          </Link>
        )}
      </header>
      <nav className="mobile-nav" aria-label={t("nav.mobileLabel")}>
        {links.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link className={active ? "active" : ""} href={href} key={href}>
              <Icon size={21} />
              <span>{shortLabel ?? label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
