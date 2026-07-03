export default function OfflinePage() {
  return (
    <div className="login-wrap">
      <div className="hero-card" style={{ width: 'min(720px, 100%)' }}>
        <p className="eyebrow">Offline</p>
        <h1>Práve nie si online.</h1>
        <p className="lede">
          Aplikácia si vie udržať základný shell aj bez siete. Keď sa pripojenie vráti, stránka sa obnoví.
        </p>
      </div>
    </div>
  );
}
