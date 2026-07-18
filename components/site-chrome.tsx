"use client";

import Image from "next/image";
import { useI18n } from "@/components/app-provider";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a className="skip-link" href="#main-content">
      {t("footer.skip")}
    </a>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <span>VidSelector</span>
      <span>{t("footer.notice")}</span>
      <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label={t("footer.tmdbLabel")}>
        <Image src="/tmdb-logo.svg" width={137} height={18} alt="The Movie Database" />
      </a>
    </footer>
  );
}
