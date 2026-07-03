// TimelineScreen.jsx — segmented priority tabs (mobile-safe alternative to a 3-column grid).
function TimelineScreen() {
  const { tasks } = window.WEDDING_MOCK;
  const [tier, setTier] = React.useState('HIGH');
  const list = tasks.filter((t) => t.priority === tier);
  return (
    <div>
      <AppHeader eyebrow="Časová os" title="Čo riešiť najskôr" sub="Prepni prioritu a presuň úlohu ťuknutím na šípku." />
      <div style={{ display: 'flex', gap: 8, padding: '12px 18px 0' }}>
        {['HIGH', 'MEDIUM', 'LOW'].map((p) => (
          <button key={p} onClick={() => setTier(p)} style={{
            flex: 1, padding: '9px 0', borderRadius: 999, border: '1px solid var(--card-border)', cursor: 'pointer',
            background: tier === p ? 'var(--accent-tint)' : 'rgba(255,255,255,0.6)',
            color: tier === p ? 'var(--accent)' : 'var(--muted)', fontWeight: 700, fontSize: 12.5,
          }}>{window.PRIORITY_LABEL[p]} ({tasks.filter((t) => t.priority === p).length})</button>
        ))}
      </div>
      <div style={{ padding: '14px 18px 24px', display: 'grid', gap: 10 }}>
        {list.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>Žiadne úlohy v tejto priorite.</p>}
        {list.map((t) => (
          <div key={t.id} style={{ borderRadius: 18, padding: 14, background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <CategoryIcon category={t.category} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.category} · {t.deadline || 'Bez termínu'}</div>
              </div>
              <AppTag tone={window.STATUS_TONE[t.status]}>{window.STATUS_LABEL[t.status]}</AppTag>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45 }}>{t.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

window.TimelineScreen = TimelineScreen;
