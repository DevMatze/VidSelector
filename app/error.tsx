"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="page-shell">
      <div className="status-panel" role="alert">
        <h1>Etwas ist schiefgelaufen</h1>
        <p>Die Seite konnte nicht vollständig geladen werden.</p>
        <button className="button primary" onClick={reset}>
          Noch einmal versuchen
        </button>
      </div>
    </div>
  );
}
