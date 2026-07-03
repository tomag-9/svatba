import { AppShell } from '@/components/app-shell';
import { SettingsForm } from '@/components/settings-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });

  return (
    <AppShell
      eyebrow="Nastavenia"
      title="Nastavenia svadby"
      description="Ulož dátum svadby, miesto a cieľ rozpočtu. Tieto hodnoty sa premietnu do prehľadov aj financií."
    >
      <article className="panel">
        <h2>Nastavenia svadby</h2>
        <SettingsForm
          initialValues={{
            weddingDate: settings?.weddingDate ? settings.weddingDate.toISOString().slice(0, 10) : '',
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
        <h2>Na čo sa to používa</h2>
        <div className="list">
          <div className="row">
            <div>
              <div className="row-title">Odpočet na prehľade</div>
              <div className="lede" style={{ margin: '6px 0 0' }}>Ukáže termín svadby, odpočet a najbližšiu správu dňa.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="row-title">Súhrn financií</div>
              <div className="lede" style={{ margin: '6px 0 0' }}>Spočíta minuté peniaze proti cieľu rozpočtu.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="row-title">Mobilný PWA shell</div>
              <div className="lede" style={{ margin: '6px 0 0' }}>Slúži ako centrálna konfigurácia pre aplikáciu.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="row-title">Upozornenia na pozadí</div>
              <div className="lede" style={{ margin: '6px 0 0' }}>Zapne push subscription, background sync a časované pripomienky.</div>
            </div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
