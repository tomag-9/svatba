'use client';

import { useState } from 'react';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError('Nesprávne heslo.');
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <label className="field">
        <span>Heslo</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Zadaj prístupové heslo"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Prihlasujem...' : 'Vstúpiť'}
      </button>
    </form>
  );
}
