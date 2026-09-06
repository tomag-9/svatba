'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, ImageIcon, X } from 'lucide-react';

import styles from './countdown-quote-reveal.module.css';

type CountdownQuoteRevealProps = {
  role?: 'TOMI' | 'ANGIE';
  hasAnsweredToday?: boolean;
  quote: string;
  quoteId?: string;
  media?: {
    mediaDataUrl: string;
    mediaAlt?: string | null;
    mediaDescription?: string | null;
    mediaType?: string | null;
  } | null;
};

type SelectedQuote = {
  id?: string | null;
  text: string;
  mediaDataUrl?: string | null;
  mediaAlt?: string | null;
  mediaDescription?: string | null;
  mediaType?: string | null;
};

const moodOptions = [
  { key: 'LUBENE', label: 'Zaľúbené', emoji: '🥰' },
  { key: 'HORNY', label: 'Horny', emoji: '🥵' },
  { key: 'SEXY', label: 'Sexi', emoji: '🔥' },
  { key: 'FUNNY', label: 'Funny', emoji: '😂' },
  { key: 'LOYAL', label: 'Oddane', emoji: '🫶' },
  { key: 'COMFORT', label: 'Pohodovo', emoji: '😌' },
  { key: 'CALM', label: 'Spokojne', emoji: '😋' }
] as const;

const hornyMethods = [
  { value: 'K', label: 'K' },
  { value: 'V', label: 'V' },
  { value: 'P', label: 'P' },
  { value: 'Žiadnu', label: 'Žiadnu' },
  { value: 'NO_SEX', label: 'Žiadnu, no-sex', disabled: true }
];
const sexyBodyParts = [
  { value: 'Zadok', label: 'Zadok' },
  { value: 'ľavý cecok', label: 'ľavý cecok' },
  { value: 'chlp na bradavke', label: 'chlp na bradavke' },
  { value: 'bičák', label: 'bičák' },
  { value: 'personality', label: 'personality', disabled: true }
];
const funnyLengths = ['Krátky', 'Dlhý'];
const loyaltyOptions = ['áno', 'áno a rada', 'áno, oddane'];

const visiblePrefix = 'A potom';

function maskQuote(quote: string) {
  if (!quote.trim()) {
    return '********';
  }

  const startsWithPrefix = quote.toLocaleLowerCase('sk-SK').startsWith(visiblePrefix.toLocaleLowerCase('sk-SK'));
  const prefix = startsWithPrefix ? quote.slice(0, visiblePrefix.length) : quote.split(/\s+/).slice(0, 2).join(' ');
  const hiddenPart = quote.slice(prefix.length);

  return `${prefix}${hiddenPart.replace(/\S/g, '*')}`;
}

export function CountdownQuoteReveal({ role = 'TOMI', hasAnsweredToday = false, quote, quoteId, media }: CountdownQuoteRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [answeredToday, setAnsweredToday] = useState(Boolean(hasAnsweredToday));
  const [moodLocked, setMoodLocked] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedFunnyLength, setSelectedFunnyLength] = useState<string | null>(null);
  const [selectedLoyalty, setSelectedLoyalty] = useState<string | null>(null);
  const [momentText, setMomentText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<SelectedQuote | null>(null);
  const [selectingQuote, setSelectingQuote] = useState(false);
  const [quoteSelectionError, setQuoteSelectionError] = useState<string | null>(null);

  const currentMood = useMemo(() => moodOptions.find((option) => option.key === selectedMood) ?? null, [selectedMood]);
  const effectiveQuote = selectedQuote?.text ?? quote;
  const effectiveMedia = selectedQuote
    ? selectedQuote.mediaDataUrl
      ? selectedQuote
      : null
    : media;

  async function selectMood(mood: string) {
    if (isMoodLocked || selectingQuote) return;

    setSelectedMood(mood);
    setMoodLocked(true);
    setSelectingQuote(true);
    setQuoteSelectionError(null);

    try {
      const response = await fetch('/api/countdown-reveal/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood })
      });
      const payload = await response.json().catch(() => null) as { line?: SelectedQuote; error?: string } | null;

      if (!response.ok || !payload?.line) {
        throw new Error(payload?.error ?? 'Citát sa nepodarilo vybrať.');
      }

      setSelectedQuote(payload.line);
    } catch (error) {
      setQuoteSelectionError(error instanceof Error ? error.message : 'Citát sa nepodarilo vybrať.');
    } finally {
      setSelectingQuote(false);
    }
  }

  async function submitResponse() {
    if (!selectedMood) return;

    setSaving(true);
    try {
      const payload = {
        quoteId: selectedQuote?.id ?? quoteId ?? null,
        quoteText: effectiveQuote,
        mood: selectedMood,
        method: selectedMethod ?? null,
        bodyPart: selectedBodyPart ?? null,
        moment: momentText.trim() || null,
        funnyLength: selectedFunnyLength ?? null,
        loyalty: selectedLoyalty ?? null,
        answers: {
          method: selectedMethod ?? null,
          bodyPart: selectedBodyPart ?? null,
          moment: momentText.trim() || null,
          funnyLength: selectedFunnyLength ?? null,
          loyalty: selectedLoyalty ?? null
        }
      };

      const response = await fetch('/api/countdown-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? 'Nepodarilo sa uložiť odpoveď.');
      }

      setAnsweredToday(true);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  const isRoleVisibleText = role === 'TOMI' ? isRevealed : (isRevealed && (answeredToday || submitted));
  const shouldShowQuestions = role === 'ANGIE' && !answeredToday && isRevealed && !submitted;
  const isMoodStepVisible = role === 'ANGIE' && Boolean(selectedMood);
  const isMoodLocked = Boolean(selectedMood) || moodLocked;
  const isAllowSubmit = Boolean(selectedMood && selectedQuote) && (
    selectedMood === 'COMFORT' ||
    selectedMood === 'CALM' ||
    (selectedMood === 'FUNNY' && Boolean(selectedFunnyLength)) ||
    (selectedMood === 'HORNY' && Boolean(selectedMethod) && selectedMethod !== 'NO_SEX') ||
    (selectedMood === 'SEXY' && Boolean(selectedBodyPart) && momentText.trim().length > 0) ||
    (selectedMood === 'LOYAL' && Boolean(selectedLoyalty)) ||
    (selectedMood === 'LUBENE' && momentText.trim().length > 0)
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.quoteRow}>
        <p className={styles.quoteText}>
          {role === 'ANGIE' && !answeredToday && isRevealed && !submitted ? maskQuote(effectiveQuote) : isRoleVisibleText ? effectiveQuote : maskQuote(effectiveQuote)}
        </p>

        <div className={styles.actions}>
          <button
            className={styles.revealButton}
            type="button"
            aria-label={isRoleVisibleText ? 'Skryť citát' : 'Ukázať citát'}
            title={isRoleVisibleText ? 'Skryť citát' : 'Ukázať citát'}
            onClick={() => {
              if (role === 'ANGIE' && !answeredToday) {
                setIsRevealed(true);
                return;
              }
              setIsRevealed((current) => !current);
            }}
          >
            {isRoleVisibleText ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            <span>{role === 'ANGIE' && !answeredToday ? 'Odhaliť' : isRoleVisibleText ? 'Skryť' : 'Odhaliť'}</span>
          </button>

          {effectiveMedia ? (
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Otvoriť fotku"
              title="Otvoriť fotku"
                  onClick={() => setIsMediaOpen(true)}
            >
              <ImageIcon size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {shouldShowQuestions ? (
        <div className={styles.flow}>
          <p className={styles.flowTitle}>Ako sa dnes cítiš?</p>

          <div className={styles.choiceGrid}>
            {moodOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={selectedMood === option.key ? styles.choiceButtonSelected : styles.choiceButton}
                onClick={() => {
                  if (isMoodLocked) return;
                  void selectMood(option.key);
                }}
                aria-disabled={isMoodLocked && selectedMood !== option.key}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>

          {isMoodStepVisible && currentMood ? (
            <>
              {selectingQuote ? <span className={styles.loadingText}>Vyberám citát podľa tvojej odpovede...</span> : null}
              {quoteSelectionError ? <span className={styles.errorText}>{quoteSelectionError}</span> : null}
              {currentMood.key === 'LUBENE' ? (
                <>
                  <p className={styles.flowTitle}>Aký bol posledný moment, kedy si sa cítila byť milovaná?</p>
                  <input
                    className={styles.textInput}
                    value={momentText}
                    onChange={(event) => setMomentText(event.target.value)}
                    placeholder="Napíš krátko, kedy si sa cítila milovaná..."
                  />
                </>
              ) : null}

              {currentMood.key === 'HORNY' ? (
                <>
                  <p className={styles.flowTitle}>Zvolila by si na dnes metódu?</p>
                  <div className={styles.choiceGrid}>
                    {hornyMethods.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${selectedMethod === option.value ? styles.choiceButtonSelected : styles.choiceButton} ${option.disabled ? styles.fakeDisabledChoice : ''}`}
                        onClick={() => {
                          if (option.disabled) return;
                          setSelectedMethod(option.value);
                        }}
                        aria-disabled={Boolean(option.disabled)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {currentMood.key === 'SEXY' ? (
                <>
                  <p className={styles.flowTitle}>Ktorá časť môjho tela je podľa teba najviac sexi?</p>
                  <div className={styles.choiceGrid}>
                    {sexyBodyParts.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${selectedBodyPart === option.value ? styles.choiceButtonSelected : styles.choiceButton} ${option.disabled ? styles.fakeDisabledChoice : ''}`}
                        onClick={() => {
                          if (option.disabled) return;
                          setSelectedBodyPart(option.value);
                        }}
                        aria-disabled={Boolean(option.disabled)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <p className={styles.flowTitle}>Kedy sa cítiš najviac sexi?</p>
                  <input
                    className={styles.textInput}
                    value={momentText}
                    onChange={(event) => setMomentText(event.target.value)}
                    placeholder="Napíš, kedy sa cítiš najviac sexi..."
                  />
                </>
              ) : null}

              {currentMood.key === 'FUNNY' ? (
                <>
                  <p className={styles.flowTitle}>Chceš vidieť krátky alebo dlhý vtip?</p>
                  <div className={styles.choiceGrid}>
                    {funnyLengths.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={selectedFunnyLength === option ? styles.choiceButtonSelected : styles.choiceButton}
                        onClick={() => setSelectedFunnyLength(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {currentMood.key === 'LOYAL' ? (
                <>
                  <p className={styles.flowTitle}>Budeš mi oddane žehliť prať a iné?</p>
                  <div className={styles.choiceGrid}>
                    {loyaltyOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={selectedLoyalty === option ? styles.choiceButtonSelected : styles.choiceButton}
                        onClick={() => setSelectedLoyalty(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <button
                type="button"
                className={styles.submitButton}
                onClick={() => void submitResponse()}
                disabled={!isAllowSubmit || saving || selectingQuote}
              >
                {saving ? 'Ukladám...' : 'Odoslať'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {role === 'ANGIE' && !answeredToday && isRevealed && !submitted ? (
        <div className={styles.success}>
          <strong>Ak chceš citát, musíš pre to niečo spraviť.</strong>
          <span>Odpovedz na nasledujúce otázky pravdivo.</span>
        </div>
      ) : null}

      {submitted ? (
        <div className={styles.success}>
          <strong>Hotovo.</strong>
          <span>Odpoveď sa uložila a bude poslaná ďalej.</span>
        </div>
      ) : null}

      {isMediaOpen && effectiveMedia ? (
        <div className={styles.modalBackdrop} onClick={() => setIsMediaOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalCloseButton} onClick={() => setIsMediaOpen(false)}>
              <X size={16} />
            </button>
            <img src={effectiveMedia.mediaDataUrl ?? ''} alt={effectiveMedia.mediaAlt ?? effectiveQuote} className={styles.modalImage} />
            {effectiveMedia.mediaDescription ? <p className={styles.modalDescription}>{effectiveMedia.mediaDescription}</p> : null}
            <p className={styles.modalQuote}>{effectiveQuote}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
