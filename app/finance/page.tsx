import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { ExpenseCreateForm } from '@/components/expense-create-form';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const [expenses, settings] = await Promise.all([
    prisma.expense.findMany({
      orderBy: [{ createdAt: 'desc' }]
    }),
    prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } })
  ]);

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const budgetTarget = settings?.budgetTarget ? Number(settings.budgetTarget) : null;
  const remaining = budgetTarget === null ? null : budgetTarget - total;

  return (
    <AppShell
      eyebrow="Rozpočet"
      title="Výdavky a rozpočet"
      description="Prehľad plánovaných výdavkov, zaplatených položiek a celkového rozpočtu."
    >
      <section className="metric-grid">
        <article className="metric-card">
          <span className="tag">Spolu</span>
          <strong>{total} EUR</strong>
        </article>
        <article className="metric-card">
          <span className="tag good">Zaplatené</span>
          <strong>{expenses.filter((expense) => expense.isPaid).length}</strong>
        </article>
        <article className="metric-card">
          <span className="tag warn">Nezaplatené</span>
          <strong>{expenses.filter((expense) => !expense.isPaid).length}</strong>
        </article>
        <article className="metric-card">
          <span className="tag">Mena</span>
          <strong>{settings?.currency ?? 'EUR'}</strong>
        </article>
        <article className="metric-card">
          <span className="tag">Cieľ</span>
          <strong>{budgetTarget === null ? '—' : `${budgetTarget} EUR`}</strong>
        </article>
        <article className="metric-card">
          <span className="tag">Zostáva</span>
          <strong>{remaining === null ? '—' : `${remaining} EUR`}</strong>
        </article>
      </section>

      <article className="panel">
        <h2>Pridať výdavok</h2>
        <ExpenseCreateForm />
      </article>

      <article className="panel">
        <h2>Zoznam výdavkov</h2>
        <p className="lede" style={{ marginTop: 0 }}>
          Spolu minuté: {total.toFixed(2)} {settings?.currency ?? 'EUR'}
        </p>
        <div className="table-list">
          {expenses.map((expense) => (
            <div className="table-row" key={expense.id}>
              <div>
                <Link className="row-title row-link" href={`/finance/${expense.id}`}>
                  {expense.title}
                </Link>
                <div className="lede" style={{ margin: '6px 0 0' }}>{expense.category}</div>
                {expense.vendor ? <div className="lede" style={{ margin: '6px 0 0' }}>Dodávateľ: {expense.vendor}</div> : null}
              </div>
              <div className="item-actions">
                <span className={`tag ${expense.isPaid ? 'good' : 'warn'}`}>
                  {expense.amount.toString()} {expense.currency}
                </span>
                <div className="item-action-row">
                  <Link className="button button-ghost" href={`/finance/${expense.id}`}>
                    Upraviť
                  </Link>
                  <DeleteEntityButton endpoint={`/api/expenses/${expense.id}`} label="Zmazať" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
