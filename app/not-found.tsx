import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="status-panel">
        <h1>Seite nicht gefunden</h1>
        <p>Dieser Titel oder diese Seite ist nicht verfügbar.</p>
        <Link className="button primary" href="/">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
