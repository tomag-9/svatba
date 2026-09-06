import { AppShell } from '@/components/app-shell';
import { SettingsForm } from '@/components/settings-form';
import { prisma } from '@/lib/prisma';
import { WEDDING_ROLE_COOKIE, getWeddingRole } from '@/lib/wedding-role';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings, cookieStore] = await Promise.all([
    prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } }),
    cookies()
  ]);
  const role = getWeddingRole(cookieStore.get(WEDDING_ROLE_COOKIE)?.value, settings?.role ?? 'ANGIE');

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
            venueName: settings?.venueName ?? '',
            notes: settings?.notes ?? '',
            role,
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
