"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Quote = { id?: string; text: string; source: 'db' | 'file' };

export default function QuotesAdminPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/countdown-lines', { cache: 'no-store' });
      if (!res.ok) throw new Error('Nepodarilo sa načítať citáty.');
      const data = await res.json();
      setQuotes(data.lines ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function create() {
    if (!draft.trim()) return;
    try {
      const res = await fetch('/api/countdown-lines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ line: draft }) });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa pridať');
      }
      setDraft('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  async function remove(id: string) {
    if (!confirm('Naozaj zmazať tento citát?')) return;
    try {
      const res = await fetch('/api/countdown-lines', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Nepodarilo sa zmazať.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  async function save(id: string, text: string) {
    try {
      const res = await fetch('/api/countdown-lines', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text }) });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa upraviť.');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  async function importFileLine(text: string) {
    try {
      const res = await fetch('/api/countdown-lines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ line: text }) });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa importovať.');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  return (
    <div className="page">
      <h1>Správa citátov</h1>
      <p>Tu vidíš všetky citáty z txt aj z databázy. Upraviť a zmazať môžeš iba položky uložené v DB.</p>

      <div className="card">
        <label className="field">
          <span>Pridať nový citát</span>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={240} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button" onClick={() => void create()}>Pridať</button>
          <button className="button button-ghost" onClick={() => router.back()}>Späť</button>
        </div>
      </div>

      {loading ? <p>Načítavam...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <ul className="list">
        {quotes.map((q) => (
          <li key={q.id ?? q.text} className="list-item">
            <QuoteRow quote={q} onDelete={q.id ? () => void remove(q.id as string) : undefined} onSave={q.id ? (newText) => void save(q.id as string, newText) : undefined} onImport={!q.id ? () => void importFileLine(q.text) : undefined} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuoteRow({ quote, onDelete, onSave, onImport }: { quote: Quote; onDelete?: () => void; onSave?: (text: string) => void; onImport?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.text);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {editing ? (
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={240} />
      ) : (
        <div style={{ flex: 1 }}>{quote.text} <small style={{ opacity: 0.6 }}>({quote.source})</small></div>
      )}

      {quote.source === 'db' ? (
        <>
          {editing ? (
            <button onClick={() => { setEditing(false); onSave && onSave(text); }}>Uložiť</button>
          ) : (
            <button onClick={() => setEditing(true)}>Upraviť</button>
          )}
          <button onClick={onDelete} className="button button-danger">Zmazať</button>
        </>
      ) : (
        <button onClick={onImport}>Importovať do DB</button>
      )}
    </div>
  );
}
