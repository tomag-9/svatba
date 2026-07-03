// TasksScreen.jsx — horizontally-scrollable filter chips + compact icon rows.
function TasksScreen() {
  const { tasks } = window.WEDDING_MOCK;
  const [status, setStatus] = React.useState('ALL');
  const filtered = tasks.filter((t) => status === 'ALL' || t.status === status);
  return (
    <div>
      <AppHeader eyebrow="Úlohy" title="Úlohy a deadline" sub={null} />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 18px 0' }}>
        {['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].map((v) => (
          <button key={v} onClick={() => setStatus(v)} style={{
            flexShrink: 0, padding: '8px 13px', borderRadius: 999, border: '1px solid var(--card-border)', cursor: 'pointer', whiteSpace: 'nowrap',
            background: status === v ? 'var(--accent-tint)' : 'rgba(255,255,255,0.6)', color: status === v ? 'var(--accent)' : 'var(--muted)', fontWeight: 700, fontSize: 12,
          }}>{v === 'ALL' ? 'Všetko' : window.STATUS_LABEL[v]}</button>
        ))}
      </div>
      <div style={{ padding: '14px 18px 90px', display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{filtered.length} úloh</div>
        {filtered.map((t) => (
          <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 11, borderRadius: 16, background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(88,61,39,0.08)' }}>
            <CategoryIcon category={t.category} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.category} · {t.deadline || 'bez termínu'}</div>
            </div>
            <AppTag tone={window.STATUS_TONE[t.status]}>{window.STATUS_LABEL[t.status]}</AppTag>
          </div>
        ))}
      </div>
    </div>
  );
}

window.TasksScreen = TasksScreen;
