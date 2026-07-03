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
          <img className="login-mark" src="/icon.svg" alt="" />
          <p className="eyebrow">Svadobný plánovač</p>
          <h1>Svadba bez chaosu.</h1>
        </section>
        <LoginForm />
      </div>
    </div>
  );
}
