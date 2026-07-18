"use client";

import Link from "next/link";
import { useI18n } from "@/components/app-provider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="page-shell">
      <div className="status-panel">
        <h1>{t("common.notFound")}</h1>
        <p>{t("common.notFoundBody")}</p>
        <Link className="button primary" href="/">
          {t("common.home")}
        </Link>
      </div>
    </div>
  );
}
