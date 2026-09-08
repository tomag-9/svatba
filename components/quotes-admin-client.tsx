"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowLeft, ArrowUp, Check, GripVertical, ImageIcon, Pencil, Play, Plus, Sparkles, Trash2, Undo2, X } from 'lucide-react';

import styles from './quotes-admin-client.module.css';

type QuoteCategory = 'BASIC' | 'FUNNY' | 'ROMANTIC' | 'EROTIC';

type Quote = {
  id: string;
  text: string;
  sortOrder?: number;
  category?: QuoteCategory | null;
  mediaDataUrl?: string | null;
  mediaAlt?: string | null;
  mediaDescription?: string | null;
  mediaType?: string | null;
};

type ButtonVariant = 'primary' | 'secondary' | 'danger';

const categories: { key: QuoteCategory; label: string }[] = [
  { key: 'BASIC', label: 'Basic' },
  { key: 'FUNNY', label: 'Funny' },
  { key: 'ROMANTIC', label: 'Romantic' },
  { key: 'EROTIC', label: 'Erotic' }
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Súbor sa nepodarilo prečítať.'));
    reader.readAsDataURL(file);
  });
}

async function compressMediaFile(file: File): Promise<{ dataUrl: string; mediaType: string; alt: string }> {
  const alt = file.name.replace(/\.[^/.]+$/, '');

  if (file.type === 'image/gif') {
    return { dataUrl: await readFileAsDataUrl(file), mediaType: 'gif', alt };
  }

  const source = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
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
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.82), mediaType: 'image', alt });
    };
    img.onerror = () => reject(new Error('Obrázok sa nepodarilo načítať.'));
    img.src = source;
  });
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftCategory, setDraftCategory] = useState<QuoteCategory>('BASIC');
  const [draftMediaDataUrl, setDraftMediaDataUrl] = useState<string | null>(null);
  const [draftMediaAlt, setDraftMediaAlt] = useState('');
  const [draftMediaDescription, setDraftMediaDescription] = useState('');

  const pendingDeletes = useRef<Record<string, { text: string; timeoutId: number }>>({});
  const [hasPending, setHasPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const previewGroups = categories.map((category) => ({
    ...category,
    quotes: quotes.filter((quote) => (quote.category ?? 'BASIC') === category.key)
  }));

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

  useEffect(() => {
    if (!toast || hasPending) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [hasPending, toast]);

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Obrázok môže mať najviac 8 MB.');
      return;
    }

    try {
      const { dataUrl, mediaType, alt } = await compressMediaFile(file);
      setDraftMediaDataUrl(dataUrl);
      setDraftMediaAlt(alt);
      setError(null);
      setToast(mediaType === 'gif' ? 'GIF je pridaný bez straty animácie.' : 'Obrázok je zmenšený a pridaný.');
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
          category: draftCategory,
          mediaDataUrl: draftMediaDataUrl,
          mediaAlt: draftMediaAlt,
          mediaDescription: draftMediaDescription,
          mediaType: draftMediaDataUrl?.startsWith('data:image/gif') ? 'gif' : draftMediaDataUrl ? 'image' : 'text'
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa pridať');
      }
      setDraft('');
      setDraftCategory('BASIC');
      setDraftMediaDataUrl(null);
      setDraftMediaAlt('');
      setDraftMediaDescription('');
      await load();
      setToast('Citát je pridaný.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    }
  }

  async function save(id: string, text: string, category?: QuoteCategory | null, mediaDataUrl?: string | null, mediaAlt?: string | null, mediaDescription?: string | null, mediaType?: string | null) {
    try {
      const res = await fetch('/api/countdown-lines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          text,
          category: category ?? 'BASIC',
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

  async function reorderCategory(category: QuoteCategory, nextQuotes: Quote[]) {
    const order = nextQuotes.filter((quote) => (quote.category ?? 'BASIC') === category).map((quote) => quote.id);
    setQuotes(nextQuotes);

    try {
      const res = await fetch('/api/countdown-lines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, category })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Nepodarilo sa zoradiť citáty.');
      }
      setToast('Poradie je uložené.');
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

  function moveWithinCategory(quoteId: string, direction: -1 | 1) {
    const nextQuotes = [...quotes];
    const quote = nextQuotes.find((item) => item.id === quoteId);
    if (!quote) return;

    const currentCategory = quote.category ?? 'BASIC';
    const categoryItems = nextQuotes.filter((item) => (item.category ?? 'BASIC') === currentCategory);
    const currentIndex = categoryItems.findIndex((item) => item.id === quoteId);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= categoryItems.length) return;

    const [moved] = categoryItems.splice(currentIndex, 1);
    categoryItems.splice(targetIndex, 0, moved);

    let nextCategoryIndex = 0;
    const reordered = nextQuotes.map((item) => {
      if ((item.category ?? 'BASIC') !== currentCategory) return item;
      const next = categoryItems[nextCategoryIndex];
      nextCategoryIndex += 1;
      return next;
    });

    void reorderCategory(currentCategory, reordered);
  }

  function handleDragEnd(category: QuoteCategory, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryItems = quotes.filter((item) => (item.category ?? 'BASIC') === category);
    const oldIndex = categoryItems.findIndex((item) => item.id === active.id);
    const newIndex = categoryItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const movedItems = arrayMove(categoryItems, oldIndex, newIndex);
    let nextCategoryIndex = 0;
    const reordered = quotes.map((item) => {
      if ((item.category ?? 'BASIC') !== category) return item;
      const next = movedItems[nextCategoryIndex];
      nextCategoryIndex += 1;
      return next;
    });

    void reorderCategory(category, reordered);
  }

  function scheduleDelete(item: Quote) {
    if (!window.confirm('Naozaj zmazať tento citát? Ešte 5 sekúnd ho vieš vrátiť cez Undo.')) {
      return;
    }

    setQuotes((prev) => prev.filter((q) => q.id !== item.id));
    setToast('Citát zmazaný.');

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

          <div className={styles.categoryFieldRow}>
            <label className={styles.formFieldInline}>
              <span className={styles.fieldLabel}>Kategória</span>
              <select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value as QuoteCategory)} className={styles.selectInput}>
                {categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
              </select>
            </label>
          </div>

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
            <h2 className={styles.sectionTitle}><Sparkles size={18} /> Náhľad rotácie</h2>
            <span className={styles.sectionHint}>Mood vyberie kategóriu, potom ide ďalší citát v jej poradí</span>
          </div>

          {quotes.length === 0 ? (
            <p className={styles.emptyState}>Počkáme na prvý citát.</p>
          ) : (
            <div className={styles.previewGroups}>
              {previewGroups.map((group) => (
                <div key={group.key} className={styles.previewGroup}>
                  <div className={styles.previewGroupHeader}>
                    <span>{group.label}</span>
                    <span>{group.quotes.length}</span>
                  </div>
                  {group.quotes.length === 0 ? (
                    <p className={styles.emptyStateSmall}>Žiadne citáty v tejto kategórii.</p>
                  ) : (
                    <div className={styles.previewList}>
                      {group.quotes.map((quote, index) => (
                        <div key={quote.id} className={styles.previewRow}>
                          <div className={styles.previewDay}>#{index + 1}</div>
                          <div className={styles.previewText}>{quote.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
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
            <span className={styles.sectionHint}>Posúvaj citáty šípkami v rámci kategórie</span>
          </div>

          <div className={styles.categoryBlocks}>
            {categories.map(({ key: category, label }) => {
              const items = quotes.filter((quote) => (quote.category ?? 'BASIC') === category);

              return (
                <div key={category} className={styles.categoryBlock}>
                  <div className={styles.categoryBlockHeader}>
                    <span className={styles.categoryLabel}>{label}</span>
                    <span className={styles.categoryCount}>{items.length}</span>
                  </div>

                  {items.length === 0 ? (
                    <p className={styles.emptyStateSmall}>Žiadne citáty v tejto kategórii.</p>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(category, event)}>
                      <SortableContext items={items.map((quote) => quote.id)} strategy={verticalListSortingStrategy}>
                        <ul className={styles.quoteList}>
                          {items.map((quote, index) => (
                            <SortableQuoteItem key={quote.id} id={quote.id} index={index}>
                              <QuoteRow
                                quote={quote}
                                onDelete={() => scheduleDelete(quote)}
                                onSave={(text, categoryValue, mediaDataUrl, mediaAlt, mediaDescription, mediaType) => save(quote.id, text, categoryValue, mediaDataUrl, mediaAlt, mediaDescription, mediaType)}
                                onApply={() => void applyNow(quote.id)}
                                onMove={(direction) => moveWithinCategory(quote.id, direction)}
                              />
                            </SortableQuoteItem>
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {toast || hasPending ? (
        <div className={styles.deleteToast}>
          <span>{toast ?? 'Citát zmazaný'}</span>
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

function SortableQuoteItem({ id, index, children }: { id: string; index: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1
  };

  return (
    <li ref={setNodeRef} style={style} className={styles.quoteItem}>
      <div className={styles.quoteRowWrap}>
        <button type="button" className={styles.dragHandle} aria-label="Presunúť citát" title="Presunúť citát" {...attributes} {...listeners}>
          <GripVertical size={15} />
        </button>
        <span className={styles.quoteIndex}>{index + 1}</span>
        <div className={styles.quoteItemContent}>{children}</div>
      </div>
    </li>
  );
}

function QuoteRow({ quote, onDelete, onSave, onApply, onMove }: { quote: Quote; onDelete: () => void; onSave: (text: string, category?: QuoteCategory | null, mediaDataUrl?: string | null, mediaAlt?: string | null, mediaDescription?: string | null, mediaType?: string | null) => void; onApply?: () => void; onMove?: (direction: -1 | 1) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.text);
  const [category, setCategory] = useState<QuoteCategory>(quote.category ?? 'BASIC');
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(quote.mediaDataUrl ?? null);
  const [mediaAlt, setMediaAlt] = useState(quote.mediaAlt ?? '');
  const [mediaDescription, setMediaDescription] = useState(quote.mediaDescription ?? '');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setText(quote.text);
    setCategory(quote.category ?? 'BASIC');
    setMediaDataUrl(quote.mediaDataUrl ?? null);
    setMediaAlt(quote.mediaAlt ?? '');
    setMediaDescription(quote.mediaDescription ?? '');
  }, [quote.text, quote.category, quote.mediaDataUrl, quote.mediaAlt, quote.mediaDescription]);

  async function handleMediaUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      event.target.value = '';
      return;
    }

    try {
      const media = await compressMediaFile(file);
      setMediaDataUrl(media.dataUrl);
      setMediaAlt(media.alt);
    } catch (error) {
      console.error(error);
    }
    event.target.value = '';
  }

  return (
    <>
      <div className={styles.quoteRow}>
        {editing ? (
          <>
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={240} className={styles.rowInput} />
            <div className={styles.categoryRow}>
              <select value={category} onChange={(event) => setCategory(event.target.value as QuoteCategory)} className={styles.selectInputShort}>
                {categories.map((categoryOption) => <option key={categoryOption.key} value={categoryOption.key}>{categoryOption.label}</option>)}
              </select>
            </div>
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

        <div className={styles.arrowActions}>
          <button type="button" aria-label="Posunúť hore" title="Posunúť hore" onClick={() => onMove?.(-1)} className={styles.arrowButton}>
            <ArrowUp size={14} />
          </button>
          <button type="button" aria-label="Posunúť dole" title="Posunúť dole" onClick={() => onMove?.(1)} className={styles.arrowButton}>
            <ArrowDown size={14} />
          </button>
        </div>

        {editing ? (
          <ActionButton onClick={() => { setEditing(false); onSave(text, category, mediaDataUrl, mediaAlt, mediaDescription, mediaDataUrl?.startsWith('data:image/gif') ? 'gif' : mediaDataUrl ? 'image' : 'text'); }} variant="primary" icon={<Check size={15} />}>Uložiť</ActionButton>
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
