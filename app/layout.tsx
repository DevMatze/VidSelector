import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { AppProvider } from "@/components/app-provider";
import { appConfig } from "@/lib/config.mjs";
import { getProfileLanguage } from "@/lib/data";
import { SiteFooter, SkipLink } from "@/components/site-chrome";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getProfileLanguage();
  return {
    title: { default: translate(language, "meta.homeTitle"), template: "%s · VidSelector" },
    description: translate(language, "meta.description"),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = await getProfileLanguage();
  const publicConfig = {
    users: appConfig.users,
    localization: appConfig.localization,
    recommendations: appConfig.recommendations,
    features: appConfig.features,
    backups: appConfig.backups,
  };
  return (
    <html lang={language} data-scroll-behavior="smooth">
      <body>
        <AppProvider initialLanguage={language} config={publicConfig}>
          <SkipLink />
          <Navigation />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </AppProvider>
      </body>
    </html>
  );
}
