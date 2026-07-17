import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: { default: "VidSelector – Dein nächster Film", template: "%s · VidSelector" },
  description: "Persönliche Film- und Serienempfehlungen, die aus deinem Geschmack lernen.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Zum Inhalt springen
        </a>
        <Navigation />
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <span>VidSelector</span>
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="The Movie Database öffnen">
            <Image src="/tmdb-logo.svg" width={137} height={18} alt="The Movie Database" />
          </a>
        </footer>
      </body>
    </html>
  );
}
