"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/app-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="page-shell">
      <div className="status-panel" role="alert">
        <h1>{t("common.errorTitle")}</h1>
        <p>{t("common.errorBody")}</p>
        <button className="button primary" onClick={reset}>
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
