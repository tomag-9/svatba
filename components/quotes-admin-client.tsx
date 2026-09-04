"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, GripVertical, ImageIcon, Pencil, Play, Plus, Sparkles, Trash2, Undo2, X } from 'lucide-react';

import styles from './quotes-admin-client.module.css';

type Quote = {
  id: string;
  text: string;
  sortOrder?: number;
  mediaDataUrl?: string | null;
  mediaAlt?: string | null;
  mediaDescription?: string | null;
  mediaType?: string | null;
};
type PreviewQuote = Quote & { day: number };

type ButtonVariant = 'primary' | 'secondary' | 'danger';

function ActionButton({ children, onClick, variant = 'secondary', fullWidth = false, icon }: { children: ReactNode; onClick?: () => void; variant?: ButtonVariant; fullWidth?: boolean; icon?: ReactNode }) {
  const className = [styles.actionButton, styles[variant], fullWidth ? styles.fullWidth : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon ? <span className={styles.buttonIcon}>{icon}</span> : null}
      {children}
    </button>
  );
}

export default function QuotesAdminClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const count = quotes.length;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftMediaDataUrl, setDraftMediaDataUrl] = useState<string | null>(null);
  const [draftMediaAlt, setDraftMediaAlt] = useState('');
  const [draftMediaDescription, setDraftMediaDescription] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const pendingDeletes = useRef<Record<string, { text: string; timeoutId: number }>>({});
  const [hasPending, setHasPending] = useState(false);
  const previewDaySequence = [1, 2, 4, 6, 7, 9, 10];
  const previewQuotes: PreviewQuote[] = quotes.map((quote, index) => ({ ...quote, day: previewDaySequence[index] ?? index + 1 }));

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

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Nepodarilo sa vytvoriť náhľad obrázka.'));
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Obrázok sa nepodarilo načítať.'));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error('Obrázok sa nepodarilo prečítať.'));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Obrázok môže mať najviac 8 MB.');
      return;
    }

    try {
      const dataUrl = await compressImage(file);
      setDraftMediaDataUrl(dataUrl);
      setDraftMediaAlt(file.name.replace(/\.[^/.]+$/, ''));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba pri nahrávaní obrázka.');
    } finally {
      event.target.value = '';
    }
  }

  async function create() {
    if (!draft.trim()) return;
    try {
      const res = await fetch('/api/countdown-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: draft,
          mediaDataUrl: draftMediaDataUrl,
          mediaAlt: draftMediaAlt,
          mediaDescription: draftMediaDescription,
          mediaType: draftMediaDataUrl ? 'image' : 'text'
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa pridať');
      }
      setDraft('');
      setDraftMediaDataUrl(null);
      setDraftMediaAlt('');
      setDraftMediaDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  async function save(id: string, text: string, mediaDataUrl?: string | null, mediaAlt?: string | null, mediaDescription?: string | null, mediaType?: string | null) {
    try {
      const res = await fetch('/api/countdown-lines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          text,
          mediaDataUrl: mediaDataUrl ?? null,
          mediaAlt: mediaAlt ?? null,
          mediaDescription: mediaDescription ?? null,
          mediaType: mediaDataUrl ? mediaType ?? 'image' : 'text'
        })
      });
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
      await load();
      alert(`Citát aplikovaný. Push: sent=${payload.push?.sent ?? 0}, failed=${payload.push?.failed ?? 0}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  function scheduleDelete(item: Quote) {
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
    setQuotes((prev) => [{ id, text: entry.text }, ...prev]);
    delete pendingDeletes.current[id];
    setHasPending(Object.keys(pendingDeletes.current).length > 0);
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Countdown</p>
            <h1 className={styles.heading}>Správa citátov</h1>
          </div>

          <ActionButton onClick={() => router.back()} variant="secondary" icon={<ArrowLeft size={16} />}>Späť</ActionButton>
        </header>

        <section className={styles.sectionCard}>
          <label className={styles.formField}>
            <span className={styles.fieldLabel}>Pridať nový citát</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={240}
              placeholder="Napíš nový citát..."
              className={styles.input}
            />
          </label>

          <div className={styles.mediaUploadBox}>
            <label className={styles.uploadLabel}>
              <ImageIcon size={16} />
              Pridať fotku / GIF
              <input type="file" accept="image/*,image/gif" onChange={(event) => void handleImageUpload(event)} />
            </label>
            {draftMediaDataUrl ? (
              <div className={styles.mediaPreviewCard}>
                <img src={draftMediaDataUrl} alt={draftMediaAlt || 'Náhľad'} className={styles.mediaPreviewImage} />
                <button type="button" onClick={() => setDraftMediaDataUrl(null)} className={styles.removeMediaButton}>Odstrániť</button>
              </div>
            ) : null}
            {draftMediaDataUrl ? (
              <div className={styles.inlineFields}>
                <input value={draftMediaAlt} onChange={(event) => setDraftMediaAlt(event.target.value)} className={styles.input} placeholder="Alternatívny text / názov" />
                <textarea value={draftMediaDescription} onChange={(event) => setDraftMediaDescription(event.target.value)} className={styles.textarea} placeholder="Krátky popis alebo text k fotografie" rows={3} />
              </div>
            ) : null}
          </div>

          <div className={styles.inlineActions}>
            <ActionButton onClick={() => void create()} variant="primary" icon={<Plus size={16} />}>Pridať citát</ActionButton>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Sparkles size={18} /> Náhľad poradia po dňoch</h2>
            <span className={styles.sectionHint}>Dátum 1 = prvý citát</span>
          </div>

          {previewQuotes.length === 0 ? (
            <p className={styles.emptyState}>Počkáme na prvý citát.</p>
          ) : (
            <div className={styles.previewList}>
              {previewQuotes.map((quote) => (
                <div key={quote.id} className={styles.previewRow}>
                  <div className={styles.previewDay}>Deň {quote.day}</div>
                  <div className={styles.previewText}>{quote.text}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {loading ? <div className={`${styles.message} ${styles.loadingMessage}`}>Načítavam...</div> : null}
        {error ? <div className={`${styles.message} ${styles.errorMessage}`}>{error}</div> : null}

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><GripVertical size={18} /> Upravovať poradie</h2>
            <span className={styles.sectionHint}>Potiahni citát na nové miesto</span>
          </div>

          <ul className={styles.quoteList}>
            {quotes.map((quote, index) => (
              <li
                key={quote.id}
                draggable
                onDragStart={(event: DragEvent<HTMLLIElement>) => {
                  event.dataTransfer.effectAllowed = 'move';
                  setDraggedId(quote.id);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={async () => {
                  if (!draggedId || draggedId === quote.id) return;
                  const nextQuotes = [...quotes];
                  const draggedIndex = nextQuotes.findIndex((item) => item.id === draggedId);
                  const targetIndex = index;
                  if (draggedIndex === -1) return;

                  const [moved] = nextQuotes.splice(draggedIndex, 1);
                  nextQuotes.splice(targetIndex, 0, moved);
                  await reorder(nextQuotes);
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={styles.quoteItem}
              >
                <div className={styles.quoteRowWrap}>
                  <span aria-label="Presunúť citát" title="Potiahni pre presun" className={styles.dragHandle}>
                    <GripVertical size={16} />
                  </span>

                  <span className={styles.quoteIndex}>{index + 1}</span>

                  <div className={styles.quoteItemContent}>
                    <QuoteRow
                      quote={quote}
                      onDelete={() => scheduleDelete(quote)}
                      onSave={(text, mediaDataUrl, mediaAlt, mediaDescription, mediaType) => save(quote.id, text, mediaDataUrl, mediaAlt, mediaDescription, mediaType)}
                      onApply={() => void applyNow(quote.id)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {hasPending ? (
        <div className={styles.deleteToast}>
          <span>Citát zmazaný</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.keys(pendingDeletes.current).map((id) => (
              <button key={id} type="button" onClick={() => undoDelete(id)} className={styles.undoButton}>
                <Undo2 size={14} />
                Undo
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuoteRow({ quote, onDelete, onSave, onApply }: { quote: Quote; onDelete: () => void; onSave: (text: string, mediaDataUrl?: string | null, mediaAlt?: string | null, mediaDescription?: string | null, mediaType?: string | null) => void; onApply?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.text);
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(quote.mediaDataUrl ?? null);
  const [mediaAlt, setMediaAlt] = useState(quote.mediaAlt ?? '');
  const [mediaDescription, setMediaDescription] = useState(quote.mediaDescription ?? '');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setText(quote.text);
    setMediaDataUrl(quote.mediaDataUrl ?? null);
    setMediaAlt(quote.mediaAlt ?? '');
    setMediaDescription(quote.mediaDescription ?? '');
  }, [quote.text, quote.mediaDataUrl, quote.mediaAlt, quote.mediaDescription]);

  async function handleMediaUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(maxWidth / img.width, 1);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setMediaDataUrl(canvas.toDataURL('image/jpeg', 0.82));
        setMediaAlt(file.name.replace(/\.[^/.]+$/, ''));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  return (
    <>
      <div className={styles.quoteRow}>
        {editing ? (
          <>
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={240} className={styles.rowInput} />
            <div className={styles.mediaEditorBlock}>
              <label className={styles.uploadLabelSmall}>
                <ImageIcon size={14} />
                Fotka / GIF
                <input type="file" accept="image/*,image/gif" onChange={(event) => void handleMediaUpload(event)} />
              </label>

              {mediaDataUrl ? (
                <div className={styles.mediaPreviewCard}>
                  <img src={mediaDataUrl} alt={mediaAlt || 'Nahraný obrázok'} className={styles.mediaPreviewImage} />
                  <div className={styles.mediaMetaRow}>
                    <input value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} className={styles.input} placeholder="Alt text" />
                    <textarea value={mediaDescription} onChange={(event) => setMediaDescription(event.target.value)} className={styles.textarea} placeholder="Popis" rows={2} />
                  </div>
                  <button type="button" onClick={() => setMediaDataUrl(null)} className={styles.removeMediaButton}>Odstrániť</button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className={styles.quoteText}>{quote.text}</div>
        )}

        {editing ? (
          <ActionButton onClick={() => { setEditing(false); onSave(text, mediaDataUrl, mediaAlt, mediaDescription, mediaDataUrl ? 'image' : 'text'); }} variant="primary" icon={<Check size={15} />}>Uložiť</ActionButton>
        ) : (
          <ActionButton onClick={() => setEditing(true)} variant="secondary" icon={<Pencil size={15} />}>Upraviť</ActionButton>
        )}

        {quote.mediaDataUrl ? (
          <ActionButton onClick={() => setModalOpen(true)} variant="secondary" icon={<ImageIcon size={15} />}>Otvoriť</ActionButton>
        ) : null}

        <ActionButton onClick={onDelete} variant="danger" icon={<Trash2 size={15} />}>Zmazať</ActionButton>
        <ActionButton onClick={onApply} variant="secondary" icon={<Play size={15} />}>Apply now</ActionButton>
      </div>

      {modalOpen && quote.mediaDataUrl ? (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalCloseButton} onClick={() => setModalOpen(false)}>
              <X size={16} />
            </button>
            <img src={quote.mediaDataUrl} alt={quote.mediaAlt ?? quote.text} className={styles.modalImage} />
            {quote.mediaDescription ? <p className={styles.modalDescription}>{quote.mediaDescription}</p> : null}
            <p className={styles.modalQuote}>{quote.text}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
