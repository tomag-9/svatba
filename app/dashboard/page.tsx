import { AppShell } from '@/components/app-shell';
import { getWeddingAlertSlot } from '@/lib/alert-slot';
import { taskStatusLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import { getWeddingCountdownCopy } from '@/lib/wedding-copy';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [tasks, guests, expenses, settings] = await Promise.all([
    prisma.task.findMany(),
    prisma.guest.findMany(),
    prisma.expense.findMany(),
    prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } })
  ]);

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const doneTasks = tasks.filter((task) => task.status === 'DONE').length;
  const upcomingDeadlines = tasks.filter((task) => {
    if (!task.deadline) {
      return false;
    }

    const diffDays = (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  }).length;
  const budgetTarget = settings?.budgetTarget ? Number(settings.budgetTarget) : null;
  const budgetRemaining = budgetTarget === null ? null : budgetTarget - totalSpent;
  const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const countdown = settings ? getWeddingCountdownCopy({ daysUntilWedding, role: settings.role, slot: getWeddingAlertSlot() }) : null;

  const metrics = [
    { label: 'Otvorené úlohy', value: tasks.filter((task) => task.status !== 'DONE').length, tone: 'warn' },
    { label: 'Hotové úlohy', value: doneTasks, tone: 'good' },
    { label: 'Blízke deadliny', value: upcomingDeadlines, tone: 'warn' },
    { label: 'Hostia na obed', value: guests.filter((guest) => guest.dinner).length, tone: 'good' },
    { label: 'Hostia na párty', value: guests.filter((guest) => guest.party).length, tone: 'good' },
    { label: 'Výdavky', value: expenses.length, tone: 'good' }
  ];

  return (
    <AppShell
      eyebrow="Prehľad"
      title="Prehľad plánovania"
      description="Kľúčové informácie pre rýchly dohľad nad úlohami, hosťami a rozpočtom."
    >
      <section className="panel">
        <h2>Základné info</h2>
        <div className="list">
          <div className="row">
            <div>
              <div className="row-title">Miesto</div>
              <div className="lede" style={{ margin: '6px 0 0' }}>{settings?.venueName ?? 'Zatiaľ nenastavené'}</div>
            </div>
            <span className="tag">{settings?.currency ?? 'EUR'}</span>
          </div>
          <div className="row">
            <div>
              <div className="row-title">Dátum svadby</div>
              <div className="lede" style={{ margin: '6px 0 0' }}>
                {settings?.weddingDate ? settings.weddingDate.toISOString().slice(0, 10) : 'Zatiaľ nenastavené'}
              </div>
            </div>
            <span className="tag">{tasks.length} úloh</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Odpočet</h2>
        <div className="row">
          <div>
            <div className="row-title">{countdown?.title ?? 'Nastav dátum svadby'}</div>
            <div className="lede" style={{ margin: '6px 0 0' }}>{countdown?.subtitle ?? 'Odpočet sa zobrazí po uložení dátumu.'}</div>
            <div className="lede" style={{ margin: '6px 0 0', fontWeight: 700 }}>{countdown?.dailyLine ?? ''}</div>
          </div>
          <span className="tag">{daysUntilWedding === null ? '—' : `${Math.max(daysUntilWedding, 0)} dní`}</span>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span className={`tag ${metric.tone}`}>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
        <article className="metric-card">
          <span className="tag">Cieľ rozpočtu</span>
          <strong>{budgetTarget === null ? '—' : `${budgetTarget} EUR`}</strong>
        </article>
        <article className="metric-card">
          <span className="tag">Zostáva</span>
          <strong>{budgetRemaining === null ? '—' : `${budgetRemaining} EUR`}</strong>
        </article>
      </section>

      <section className="section-grid">
        <article className="panel">
          <h2>Rýchle úlohy</h2>
          <div className="list">
            {tasks.slice(0, 4).map((task) => (
              <div className="row" key={task.id}>
                <div>
                  <div className="row-title">{task.title}</div>
                  <div className="lede" style={{ margin: '6px 0 0' }}>{task.category}</div>
                </div>
                <span className="tag">{taskStatusLabels[task.status]}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Rozpočet</h2>
          <p className="lede" style={{ marginTop: 0 }}>
            Minuté {totalSpent.toFixed(2)} EUR{budgetTarget === null ? '' : ` z cieľa ${budgetTarget.toFixed(2)} EUR`}
          </p>
          <div className="list">
            {expenses.map((expense) => (
              <div className="row" key={expense.id}>
                <div>
                  <div className="row-title">{expense.title}</div>
                  <div className="lede" style={{ margin: '6px 0 0' }}>{expense.category}</div>
                </div>
                <span className={`tag ${expense.isPaid ? 'good' : 'warn'}`}>
                  {expense.amount.toString()} {expense.currency}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
