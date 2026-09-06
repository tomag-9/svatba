import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';

export const dynamic = 'force-dynamic';

export default async function RevealHistoryPage() {
  const hdr = await headers();
  const cookieHeader = hdr.get('cookie') ?? null;
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(cookieHeader), 'ANGIE');

  if (role !== 'TOMI') {
    return (
      <main className="page-shell">
        <div className="card">
          <h2>Prístup zamietnutý</h2>
          <p>Túto históriu môže vidieť len Tomi.</p>
        </div>
      </main>
    );
  }

  const items = await prisma.countdownRevealResponse.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      quoteText: true,
      mood: true,
      category: true,
      method: true,
      bodyPart: true,
      moment: true,
      funnyLength: true,
      loyalty: true,
      answers: true,
      createdAt: true
    }
  });

  return (
    <main className="page-shell">
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">Admin</div>
            <h1 style={{ margin: '6px 0 0', fontSize: '2rem' }}>História reveal odpovedí</h1>
          </div>
        </div>

        <div className="list">
          {items.length === 0 ? (
            <div className="row">
              <div className="row-title">Zatiaľ nie sú žiadne odpovede.</div>
            </div>
          ) : (
            items.map((item) => (
              <div className="row" key={item.id} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{new Date(item.createdAt).toLocaleString('sk-SK')}</div>
                  <div className="compact-meta">mood: {item.mood} · category: {item.category ?? 'BASIC'}</div>
                  <div style={{ marginTop: 6, color: '#111827', lineHeight: 1.6 }}>{item.quoteText}</div>
                  <div style={{ marginTop: 8, display: 'grid', gap: 4, color: '#374151', fontSize: 13 }}>
                    {item.method ? <div>method: {item.method}</div> : null}
                    {item.bodyPart ? <div>bodyPart: {item.bodyPart}</div> : null}
                    {item.moment ? <div>moment: {item.moment}</div> : null}
                    {item.funnyLength ? <div>funnyLength: {item.funnyLength}</div> : null}
                    {item.loyalty ? <div>loyalty: {item.loyalty}</div> : null}
                    {item.answers && Object.keys(item.answers as Record<string, unknown>).length > 0 ? (
                      <div>answers: {JSON.stringify(item.answers)}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
