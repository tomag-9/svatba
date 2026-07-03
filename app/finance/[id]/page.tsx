import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { ExpenseCreateForm } from '@/components/expense-create-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpenseEditPage({ params }: PageProps) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    notFound();
  }

  return (
    <AppShell eyebrow="Rozpočet" title="Upraviť výdavok" description="Rýchla úprava ceny, stavu platby alebo kategórie na mobile.">
      <article className="panel">
        <ExpenseCreateForm
          initialValues={{
            title: expense.title,
            category: expense.category ?? '',
            amount: expense.amount.toString(),
            currency: expense.currency,
            isPaid: expense.isPaid
          }}
          submitLabel="Uložiť výdavok"
          endpoint={`/api/expenses/${expense.id}`}
          method="PATCH"
          successPath="/finance"
        />
      </article>
      <article className="panel panel-inline-actions">
        <DeleteEntityButton endpoint={`/api/expenses/${expense.id}`} redirectTo="/finance" label="Zmazať výdavok" />
      </article>
    </AppShell>
  );
}
