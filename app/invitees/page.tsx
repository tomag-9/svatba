import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { GuestCreateForm } from '@/components/guest-create-form';
import { guestAttendanceLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import { Disc3, Utensils } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarTone(group: string | null) {
  if (group === 'Angelika') {
    return 'angelika';
  }

  if (group === 'Tomáš' || group === 'Tomas') {
    return 'tomas';
  }

  return 'party';
}

export default async function InviteesPage() {
  const guests = await prisma.guest.findMany({
    orderBy: [{ familyGroup: 'asc' }, { name: 'asc' }]
  });
  const groups = [
    { key: 'angelika', label: 'Angelika', rows: guests.filter((guest) => guest.familyGroup === 'Angelika' && guest.dinner) },
    { key: 'tomas', label: 'Tomáš', rows: guests.filter((guest) => (guest.familyGroup === 'Tomáš' || guest.familyGroup === 'Tomas') && guest.dinner) },
    { key: 'party', label: 'Party', rows: guests.filter((guest) => guest.party && !guest.dinner) }
  ].filter((group) => group.rows.length > 0);

  return (
    <AppShell
      eyebrow="Hostia"
      title="Kto príde"
    >
      <article className="panel" id="add-guest">
        <h2>Pridať hosťa</h2>
        <GuestCreateForm />
      </article>

      <article className="panel">
        <h2>Zoznam hostí</h2>
        {groups.map((group) => {
          return (
            <section key={group.key}>
              <div className="group-label">{group.label}</div>
              <div className="table-list">
                {group.rows.map((guest) => (
                  <div className="table-row" key={guest.id}>
                    <span className={`avatar-chip ${getAvatarTone(guest.familyGroup)}`}>{getInitials(guest.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link className="row-title row-link" href={`/invitees/${guest.id}`}>
                        {guest.name}
                      </Link>
                      <div className="compact-meta">{guestAttendanceLabels[guest.attendance]}</div>
                    </div>
                    <div className="item-actions">
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <span className={`icon-toggle ${guest.dinner ? 'on' : ''}`} title="Obed" aria-label="Obed">
                          <Utensils size={13} aria-hidden="true" />
                        </span>
                        <span className={`icon-toggle ${guest.party ? 'on' : ''}`} title="Párty" aria-label="Párty">
                          <Disc3 size={13} aria-hidden="true" />
                        </span>
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
            </section>
          );
        })}
      </article>
    </AppShell>
  );
}
