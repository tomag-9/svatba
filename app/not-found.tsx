import Link from 'next/link';
import { AppShell } from '@/components/app-shell';

export default function NotFound() {
  return (
    <AppShell
      eyebrow="404"
      title="Stránka sa nenašla"
      description="Zadaná adresa neexistuje alebo už bola presunutá."
    >
      <article className="panel">
        <h2>Kam ďalej</h2>
        <p className="lede" style={{ marginTop: 0 }}>
          Ak si sem prišiel cez starý odkaz alebo preklep, skús sa vrátiť na niektorú z hlavných častí aplikácie.
        </p>
        <div className="item-action-row">
          <Link href="/dashboard" className="button button-primary">
            Na prehľad
          </Link>
          <Link href="/" className="button button-ghost">
            Na úvod
          </Link>
        </div>
      </article>
    </AppShell>
  );
}