import { AppShell } from '@/components/app-shell';
import { CategoryIcon } from '@/components/category-icon';
import { CountdownQuoteReveal } from '@/components/countdown-quote-reveal';
import { getWeddingAlertSlot } from '@/lib/alert-slot';
import { taskStatusLabels, weddingRoleLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import { getTaskCategoryLabel } from '@/lib/task-categories';
import { WEDDING_ROLE_COOKIE, getWeddingRole } from '@/lib/wedding-role';
import { getWeddingCountdownCopy } from '@/lib/wedding-copy';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [tasks, guests, expenses, settings, cookieStore] = await Promise.all([
    prisma.task.findMany(),
    prisma.guest.findMany(),
    prisma.expense.findMany(),
    prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } }),
    cookies()
  ]);
  const role = getWeddingRole(cookieStore.get(WEDDING_ROLE_COOKIE)?.value, settings?.role ?? 'ANGIE');

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const openTasks = tasks.filter((task) => task.status !== 'DONE').length;
  const doneTasks = tasks.filter((task) => task.status === 'DONE').length;
  const budgetTarget = settings?.budgetTarget ? Number(settings.budgetTarget) : null;
  const budgetPercent = budgetTarget ? Math.min(100, Math.round((totalSpent / budgetTarget) * 100)) : 0;
  const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const countdown = settings ? await getWeddingCountdownCopy({ daysUntilWedding, role, slot: getWeddingAlertSlot(), isApproximate: settings.weddingDateApproximate }) : null;
  const yesGuests = guests.filter((guest) => guest.attendance === 'YES').length;
  const maybeGuests = guests.filter((guest) => guest.attendance === 'MAYBE').length;
  const todayResponse = await prisma.countdownRevealResponse.findFirst({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: { createdAt: 'desc' },
    select: { quoteId: true, quoteText: true }
  });
  const hasAnsweredToday = Boolean(todayResponse);
  const todayQuote = todayResponse?.quoteId
    ? await prisma.countdownLine.findUnique({
        where: { id: todayResponse.quoteId },
        select: { mediaDataUrl: true, mediaAlt: true, mediaDescription: true, mediaType: true }
      })
    : null;
  const tomiMedia = todayQuote?.mediaDataUrl
    ? {
        mediaDataUrl: todayQuote.mediaDataUrl,
        mediaAlt: todayQuote.mediaAlt,
        mediaDescription: todayQuote.mediaDescription,
        mediaType: todayQuote.mediaType
      }
    : null;
  const tomiQuote = todayResponse?.quoteText ?? 'A potom ****************';
  const weddingDate = settings?.weddingDate
    ? new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(settings.weddingDate)
    : 'Dátum nenastavený';
  const currency = settings?.currency ?? 'EUR';
  const greetingName = weddingRoleLabels[role];

  return (
    <AppShell
      eyebrow="Prehľad"
      title={`Ahoj, ${greetingName}`}
    >
      <section className="dashboard-countdown" id="countdown">
        <div className="eyebrow">Do svadby ešte</div>
        <div className="countdown-number">
          {daysUntilWedding === null ? '—' : Math.max(daysUntilWedding, 0)} <span>dní</span>
        </div>
        {countdown?.dailyLine ? (
          <CountdownQuoteReveal
            role={role}
            hasAnsweredToday={hasAnsweredToday}
            quote={role === 'TOMI' ? tomiQuote : countdown.dailyLine}
            quoteId={role === 'TOMI' ? (todayResponse?.quoteId ?? undefined) : (countdown.dailyQuoteId ?? undefined)}
            media={role === 'TOMI' ? tomiMedia : countdown.dailyMedia}
          />
        ) : (
          <p className="lede" style={{ marginTop: 8 }}>Odpočet sa zobrazí po uložení dátumu.</p>
        )}
        <div className="compact-meta" style={{ marginTop: 10, color: 'var(--accent)', fontWeight: 700 }}>
          {settings?.venueName ?? 'Miesto nenastavené'} · {weddingDate}
        </div>
      </section>

      <section className="metric-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <article className="metric-card">
          <span className="tag warn">Otvorené</span>
          <strong>{openTasks}</strong>
        </article>
        <article className="metric-card">
          <span className="tag good">Hotové</span>
          <strong>{doneTasks}</strong>
        </article>
      </section>

      <section className="panel" style={{ borderRadius: 18, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--muted)', fontSize: 12.5, fontWeight: 700 }}>
          <span>Rozpočet</span>
          <span>{totalSpent.toFixed(0)} / {budgetTarget?.toFixed(0) ?? '—'} {currency}</span>
        </div>
        <div className="progress-track" style={{ marginTop: 8 }}>
          <div className="progress-fill" style={{ width: `${budgetPercent}%` }} />
        </div>
      </section>

      <section className="panel" style={{ borderRadius: 18, padding: 14 }}>
        <div style={{ color: 'var(--muted)', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Hostia — RSVP</div>
        <div className="rsvp-split">
          <div>
            <div className="rsvp-figure" style={{ color: 'var(--good)' }}>{yesGuests}</div>
            <div className="compact-meta">Áno</div>
          </div>
          <div>
            <div className="rsvp-figure" style={{ color: 'var(--warn)' }}>{maybeGuests}</div>
            <div className="compact-meta">Možno</div>
          </div>
          <div>
            <div className="rsvp-figure">{guests.length}</div>
            <div className="compact-meta">Spolu</div>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 13, margin: '0 0 8px', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>Rýchle úlohy</h2>
          <div className="list">
            {tasks.slice(0, 3).map((task) => (
              <div className="row" key={task.id}>
                <CategoryIcon category={task.category} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{task.title}</div>
                  <div className="compact-meta">{getTaskCategoryLabel(task.category)}</div>
                </div>
                <span className="tag">{taskStatusLabels[task.status]}</span>
              </div>
            ))}
          </div>
      </section>
    </AppShell>
  );
}
