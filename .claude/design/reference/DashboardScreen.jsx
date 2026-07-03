// DashboardScreen.jsx — countdown hero, open/done, budget bar, RSVP split, quick tasks.
const STATUS_LABEL = { TODO: 'Na vybavenie', IN_PROGRESS: 'V riešení', DONE: 'Hotovo', BLOCKED: 'Zablokované' };
const PRIORITY_LABEL = { HIGH: 'Vysoká', MEDIUM: 'Stredná', LOW: 'Nízka' };
const STATUS_TONE = { TODO: 'default', IN_PROGRESS: 'default', DONE: 'good', BLOCKED: 'warn' };
window.STATUS_LABEL = STATUS_LABEL; window.PRIORITY_LABEL = PRIORITY_LABEL; window.STATUS_TONE = STATUS_TONE;

function DashboardScreen() {
  const { tasks, guests, expenses, settings, daysUntil, dailyLine } = window.WEDDING_MOCK;
  const openTasks = tasks.filter((t) => t.status !== 'DONE').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = Math.min(100, Math.round((totalSpent / settings.budgetTarget) * 100));
  const yes = guests.filter((g) => g.attendance === 'YES').length;
  const maybe = guests.filter((g) => g.attendance === 'MAYBE').length;

  return (
    <div>
      <AppHeader eyebrow="Prehľad" title="Ahoj, Tomi 👋" sub={null} />
      <div style={{ padding: '10px 18px 0' }}>
        <div style={{ borderRadius: 22, padding: 20, background: 'var(--gradient-hero)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent)' }}>Do svadby ešte</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '3.4rem', lineHeight: 1, color: 'var(--text)', marginTop: 6 }}>{daysUntil} <span style={{ fontSize: '1.4rem' }}>dní</span></div>
          <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.5 }}>{dailyLine}</div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--accent)', fontWeight: 700 }}>{settings.venueName} · 12. 9. 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 18px 0' }}>
        <div style={{ borderRadius: 18, padding: 14, background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
          <AppTag tone="warn">Otvorené</AppTag>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.7rem', marginTop: 6 }}>{openTasks}</div>
        </div>
        <div style={{ borderRadius: 18, padding: 14, background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
          <AppTag tone="good">Hotové</AppTag>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.7rem', marginTop: 6 }}>{doneTasks}</div>
        </div>
      </div>

      <div style={{ padding: '10px 18px 0' }}>
        <div style={{ borderRadius: 18, padding: 14, background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>
            <span>Rozpočet</span><span>{totalSpent} / {settings.budgetTarget} €</span>
          </div>
          <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: 'rgba(88,61,39,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${budgetPct}%`, height: '100%', borderRadius: 999, background: 'var(--gradient-accent)' }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 18px 0' }}>
        <div style={{ borderRadius: 18, padding: 14, background: 'var(--card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Hostia — RSVP</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--good)' }}>{yes}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Áno</div></div>
            <div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--warn)' }}>{maybe}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Možno</div></div>
            <div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600 }}>{guests.length}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Spolu</div></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 18px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Rýchle úlohy</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {tasks.slice(0, 3).map((t) => (
            <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, borderRadius: 16, background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(88,61,39,0.08)' }}>
              <CategoryIcon category={t.category} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.category}</div>
              </div>
              <AppTag tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</AppTag>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
