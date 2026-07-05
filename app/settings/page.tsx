import { AppShell } from '@/components/app-shell';
import { SettingsForm } from '@/components/settings-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });

  return (
    <AppShell
      eyebrow="Nastavenia"
      title="Svadba"
      description="Dátum, miesto a rozpočet pre prehľad."
    >
      <article className="panel">
        <h2>Základné nastavenia</h2>
        <SettingsForm
          initialValues={{
            weddingDate: settings?.weddingDate ? settings.weddingDate.toISOString().slice(0, 10) : '',
            weddingDateApproximate: settings?.weddingDateApproximate ?? false,
            budgetTarget: settings?.budgetTarget ? settings.budgetTarget.toString() : '',
            currency: settings?.currency ?? 'EUR',
            venueName: settings?.venueName ?? '',
            role: settings?.role ?? 'TOMI',
            deadlineAlertsEnabled: settings?.deadlineAlertsEnabled ?? false,
            alertLeadDays: settings?.alertLeadDays?.toString() ?? '3'
          }}
        />
      </article>

      <article className="panel">
        <h2>Premietne sa do</h2>
        <div className="list">
          <div className="row">
            <div>
              <div className="row-title">Prehľad</div>
              <div className="compact-meta">Odpočet, miesto a svadobná správa dňa.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="row-title">Rozpočet</div>
              <div className="compact-meta">Porovnanie výdavkov s cieľom.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="row-title">Upozornenia</div>
              <div className="compact-meta">Deadline pripomienky a push notifikácie.</div>
            </div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
