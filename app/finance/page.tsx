import { AppShell } from '@/components/app-shell';
import { CategoryIcon } from '@/components/category-icon';
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
  const budgetPercent = budgetTarget ? Math.min(100, Math.round((total / budgetTarget) * 100)) : 0;
  const currency = settings?.currency ?? 'EUR';

  return (
    <AppShell
      eyebrow="Rozpočet"
      title="Výdavky"
    >
      <section className="panel budget-hero">
        <div className="budget-total">{total.toFixed(0)} {currency}</div>
        <div className="compact-meta">z {budgetTarget?.toFixed(0) ?? '—'} {currency} cieľa</div>
        <div className="progress-track" style={{ height: 9, marginTop: 10 }}>
          <div className={`progress-fill ${budgetPercent > 90 ? 'danger' : ''}`} style={{ width: `${budgetPercent}%` }} />
        </div>
      </section>

      <article className="panel" id="add-expense">
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
              <CategoryIcon category={expense.category} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link className="row-title row-link" href={`/finance/${expense.id}`}>
                  {expense.title}
                </Link>
                <div className="compact-meta">{expense.vendor || expense.category}</div>
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
