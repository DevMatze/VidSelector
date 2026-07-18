"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useI18n } from "@/components/app-provider";

export function DemoBanner() {
  const { t } = useI18n();
  return (
    <div className="demo-banner">
      <Info size={17} />
      <span>
        {t("demo.message")} <Link href="/settings">{t("demo.more")}</Link>
      </span>
    </div>
  );
}
