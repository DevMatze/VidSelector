export default function Loading() {
  return (
    <div className="page-shell">
      <div className="status-panel" aria-live="polite" aria-busy="true">
        <div className="spinner" />
        <p>Inhalte werden geladen …</p>
      </div>
    </div>
  );
}
