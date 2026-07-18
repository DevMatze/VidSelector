"use client";

import { useI18n } from "@/components/app-provider";

export default function Loading() {
  const { t } = useI18n();
  return (
    <div className="page-shell">
      <div className="status-panel" aria-live="polite" aria-busy="true">
        <div className="spinner" />
        <p>{t("common.loading")}</p>
      </div>
    </div>
  );
}
