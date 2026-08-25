import { headers } from 'next/headers';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import QuotesAdminClient from '@/components/quotes-admin-client';

export default async function QuotesAdminPage() {
  const hdr = await headers();
  const cookieHeader = hdr.get('cookie') ?? null;
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(cookieHeader), 'TOMI');

  if (role !== 'TOMI') {
    return (
      <div className="card">
        <h2>Prístup zamietnutý</h2>
        <p>Túto správu citátov môže vidieť len Tomi.</p>
      </div>
    );
  }

  return <QuotesAdminClient />;
}
