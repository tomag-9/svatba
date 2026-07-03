import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { GuestCreateForm } from '@/components/guest-create-form';
import { guestAttendanceLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InviteesPage() {
  const guests = await prisma.guest.findMany({
    orderBy: [{ familyGroup: 'asc' }, { name: 'asc' }]
  });

  return (
    <AppShell
      eyebrow="Hostia"
      title="Hostia a účasť"
      description="Základ pre sledovanie, kto ide na obed, kto na párty a kto má obe časti dňa."
    >
      <article className="panel">
        <h2>Pridať hosťa</h2>
        <GuestCreateForm />
      </article>

      <article className="panel">
        <h2>Zoznam hostí</h2>
        <div className="table-list">
          {guests.map((guest) => (
            <div className="table-row" key={guest.id}>
              <div>
                <Link className="row-title row-link" href={`/invitees/${guest.id}`}>
                  {guest.name}
                </Link>
                <div className="lede" style={{ margin: '6px 0 0' }}>{guest.familyGroup ?? '—'}</div>
              </div>
              <div className="item-actions">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className="tag">{guestAttendanceLabels[guest.attendance]}</span>
                  <span className={`tag ${guest.dinner ? 'good' : 'warn'}`}>Obed</span>
                  <span className={`tag ${guest.party ? 'good' : 'warn'}`}>Párty</span>
                </div>
                <div className="item-action-row">
                  <Link className="button button-ghost" href={`/invitees/${guest.id}`}>
                    Upraviť
                  </Link>
                  <DeleteEntityButton endpoint={`/api/guests/${guest.id}`} label="Zmazať" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
