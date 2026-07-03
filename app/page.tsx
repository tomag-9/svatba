import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { getSessionCookieName, verifySessionToken } from '@/lib/auth';

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(getSessionCookieName())?.value;

  if (await verifySessionToken(session)) {
    redirect('/dashboard');
  }

  return (
    <div className="login-wrap">
      <div className="login-shell">
        <section className="hero-card hero-copy">
          <p className="eyebrow">Svadobný plánovač</p>
          <h1>Svadba bez chaosu.</h1>
          <p className="lede">
            Riadenie úloh, hostí, rozpočtu a časovej osi v jednej PWA aplikácii pripravené pre mobil a dlhodobé používanie.
          </p>
          <div className="two-up" style={{ marginTop: '24px' }}>
            <div className="metric-card">
              <span className="tag">PWA</span>
              <strong>Mobilný režim</strong>
              <p className="lede">Aplikácia je navrhnutá pre inštaláciu na plochu a dlhé používanie na mobile.</p>
            </div>
            <div className="metric-card">
              <span className="tag">Auth</span>
              <strong>Zapamätané</strong>
              <p className="lede">Prihlásenie sa drží dlhodobo cez HTTP-only session cookie.</p>
            </div>
          </div>
        </section>
        <LoginForm />
      </div>
    </div>
  );
}
