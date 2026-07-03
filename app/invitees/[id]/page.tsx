import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { GuestCreateForm } from '@/components/guest-create-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuestEditPage({ params }: PageProps) {
  const { id } = await params;
  const guest = await prisma.guest.findUnique({ where: { id } });

  if (!guest) {
    notFound();
  }

  return (
    <AppShell eyebrow="Hostia" title="Upraviť hosťa" description="Dolaď účasť na obede a párty bez preklikávania cez iné časti aplikácie.">
      <article className="panel">
        <GuestCreateForm
          initialValues={{
            name: guest.name,
            familyGroup: guest.familyGroup ?? '',
            attendance: guest.attendance,
            dinner: guest.dinner,
            party: guest.party
          }}
          submitLabel="Uložiť hosťa"
          endpoint={`/api/guests/${guest.id}`}
          method="PATCH"
          successPath="/invitees"
        />
      </article>
      <article className="panel panel-inline-actions">
        <DeleteEntityButton endpoint={`/api/guests/${guest.id}`} redirectTo="/invitees" label="Zmazať hosťa" />
      </article>
    </AppShell>
  );
}
