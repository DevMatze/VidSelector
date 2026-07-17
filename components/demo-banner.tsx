import Link from "next/link";
import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="demo-banner">
      <Info size={17} />
      <span>
        Demo-Modus: Du nutzt den integrierten Beispielkatalog. Hinterlege deinen TMDB-Schlüssel in <code>.env</code>, um
        den vollständigen Katalog zu aktivieren. <Link href="/settings">Mehr erfahren</Link>
      </span>
    </div>
  );
}
