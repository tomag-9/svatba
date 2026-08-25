"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Quote = { id: string; text: string };

export default function QuotesAdminClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const count = quotes.length;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const pendingDeletes = useRef<Record<string, { text: string; timeoutId: number }>>({});
  const [hasPending, setHasPending] = useState(false);

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

  async function applyNow(id: string) {
    try {
      setError(null);
      const res = await fetch('/api/countdown-lines/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa aplikovať.');
      }
      const payload = await res.json();
      // refresh to reflect new state
      await load();
      alert(`Citát aplikovaný. Push: sent=${payload.push?.sent ?? 0}, failed=${payload.push?.failed ?? 0}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  function scheduleDelete(item: Quote) {
    // Optimistic remove from UI, schedule server delete after timeout
    setQuotes((prev) => prev.filter((q) => q.id !== item.id));

    const timeoutId = window.setTimeout(async () => {
      try {
        await fetch('/api/countdown-lines', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
      } catch {}
      delete pendingDeletes.current[item.id];
      setHasPending(Object.keys(pendingDeletes.current).length > 0);
    }, 5000);

    pendingDeletes.current[item.id] = { text: item.text, timeoutId };
    setHasPending(true);
  }

  function undoDelete(id: string) {
    const entry = pendingDeletes.current[id];
    if (!entry) return;
    clearTimeout(entry.timeoutId);
    // re-insert into UI at top
    setQuotes((prev) => [{ id, text: entry.text }, ...prev]);
    delete pendingDeletes.current[id];
    setHasPending(Object.keys(pendingDeletes.current).length > 0);
  }

  return (
    <div className="page">
      <h1>Správa citátov</h1>

      <div className="card">
        <label className="field">
          <span>Pridať nový citát</span>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={240} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => void create()}>Pridať</button>
          <button className="btn btn-sm btn-ghost" onClick={() => router.back()}>Späť</button>
        </div>
      </div>

      {loading ? <p>Načítavam...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <ul className="list">
        {quotes.map((q) => (
          <li key={q.id} className="list-item">
            <QuoteRow quote={q} onDelete={() => scheduleDelete(q)} onSave={(text) => save(q.id, text)} onApply={() => void applyNow(q.id)} />
          </li>
        ))}
      </ul>

      {hasPending ? (
        <div className="snackbar">
          <span>Citát zmazaný</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
            {Object.keys(pendingDeletes.current).map((id) => (
              <button key={id} onClick={() => undoDelete(id)} className="button">Undo</button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuoteRow({ quote, onDelete, onSave, onApply }: { quote: Quote; onDelete: () => void; onSave: (text: string) => void; onApply?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.text);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {editing ? (
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={240} />
      ) : (
        <div style={{ flex: 1 }}>{quote.text}</div>
      )}

      {editing ? (
        <button onClick={() => { setEditing(false); onSave(text); }}>Uložiť</button>
      ) : (
        <button onClick={() => setEditing(true)}>Upraviť</button>
      )}
      <button onClick={onDelete} className="button button-danger">Zmazať</button>
      <button onClick={onApply} className="button">Apply now</button>
    </div>
  );
}
