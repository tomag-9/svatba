"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Quote = { id: string; text: string; sortOrder?: number };

export default function QuotesAdminClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const count = quotes.length;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  async function reorder(nextQuotes: Quote[]) {
    const order = nextQuotes.map((quote) => quote.id);
    setQuotes(nextQuotes);

    try {
      const res = await fetch('/api/countdown-lines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa zoradiť citáty.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
      await load();
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
        {quotes.map((q, index) => (
          <li
            key={q.id}
            className="list-item"
            draggable
            onDragStart={() => setDraggedId(q.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={async () => {
              if (!draggedId || draggedId === q.id) return;
              const nextQuotes = [...quotes];
              const draggedIndex = nextQuotes.findIndex((quote) => quote.id === draggedId);
              const targetIndex = index;
              if (draggedIndex === -1) return;

              const [moved] = nextQuotes.splice(draggedIndex, 1);
              nextQuotes.splice(targetIndex, 0, moved);
              await reorder(nextQuotes);
              setDraggedId(null);
            }}
            onDragEnd={() => setDraggedId(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <span aria-label="Presunúť citát" style={{ cursor: 'grab', userSelect: 'none', opacity: 0.7 }} title="Potiahni pre presun">⋮⋮</span>
              <span style={{ minWidth: 24, textAlign: 'center', color: '#666' }}>{index + 1}.</span>
              <div style={{ flex: 1 }}>
                <QuoteRow quote={q} onDelete={() => scheduleDelete(q)} onSave={(text) => save(q.id, text)} onApply={() => void applyNow(q.id)} />
              </div>
            </div>
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
