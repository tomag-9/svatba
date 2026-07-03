// FinanceScreen.jsx — budget hero (own row for the currency figure) + expense list.
function FinanceScreen() {
  const { expenses, settings } = window.WEDDING_MOCK;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = Math.min(100, Math.round((total / settings.budgetTarget) * 100));
  return (
    <div>
      <AppHeader eyebrow="Rozpočet" title="Výdavky" sub={null} />
      <div style={{ padding: '10px 18px 0' }}>
        <div style={{ borderRadius: 20, padding: 16, background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{total} €</div>
          <div style={{ marginTop: 2, fontSize: 12.5, color: 'var(--muted)' }}>z {settings.budgetTarget} € cieľa</div>
          <div style={{ marginTop: 10, height: 9, borderRadius: 999, background: 'rgba(88,61,39,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? 'var(--danger)' : 'var(--gradient-accent)', borderRadius: 999 }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 18px 90px', display: 'grid', gap: 8 }}>
        {expenses.map((e) => (
          <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 11, borderRadius: 16, background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(88,61,39,0.08)' }}>
            <CategoryIcon category={e.category} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{e.vendor || e.category}</div>
            </div>
            <AppTag tone={e.isPaid ? 'good' : 'warn'}>{e.amount} €</AppTag>
          </div>
        ))}
      </div>
    </div>
  );
}

window.FinanceScreen = FinanceScreen;
