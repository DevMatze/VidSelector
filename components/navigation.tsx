"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Search, Star, UserRound, Settings, Clapperboard } from "lucide-react";

const links = [
  { href: "/", label: "Empfehlungen", icon: Compass },
  { href: "/search", label: "Suche", icon: Search },
  { href: "/library", label: "Meine Bewertungen", icon: Star },
  { href: "/watchlist", label: "Merkliste", icon: Bookmark },
  { href: "/profile", label: "Mein Profil", icon: UserRound },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [initial, setInitial] = useState("F");
  useEffect(() => {
    fetch("/api/profile?summary=1")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const name = data?.profile?.name;
        if (typeof name === "string" && name.trim()) setInitial(name.trim().slice(0, 1).toUpperCase());
      })
      .catch(() => undefined);
  }, []);
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/category/") || pathname.startsWith("/media/")
      : pathname.startsWith(href);
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="VidSelector Startseite">
          <span className="brand-mark">
            <Clapperboard size={20} />
          </span>
          <span>
            Vid<span>Selector</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
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
        <Link className="profile-chip" href="/profile" aria-label="Profil öffnen">
          {initial}
        </Link>
      </header>
      <nav className="mobile-nav" aria-label="Mobile Navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link className={active ? "active" : ""} href={href} key={href}>
              <Icon size={21} />
              <span>{label === "Meine Bewertungen" ? "Bibliothek" : label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
