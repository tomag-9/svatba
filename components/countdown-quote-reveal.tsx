'use client';

import { useState } from 'react';
import { Eye, EyeOff, ImageIcon, X } from 'lucide-react';

type CountdownQuoteRevealProps = {
  quote: string;
  media?: {
    mediaDataUrl: string;
    mediaAlt?: string | null;
    mediaDescription?: string | null;
    mediaType?: string | null;
  } | null;
};

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

export function CountdownQuoteReveal({ quote, media }: CountdownQuoteRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  return (
    <div className="countdown-quote">
      <p className="lede">{isRevealed ? quote : maskQuote(quote)}</p>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="icon-button countdown-quote-toggle"
          type="button"
          aria-label={isRevealed ? 'Skryť citát' : 'Ukázať citát'}
          title={isRevealed ? 'Skryť citát' : 'Ukázať citát'}
          onClick={() => setIsRevealed((current) => !current)}
        >
          {isRevealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>

        {media ? (
          <button
            className="icon-button countdown-quote-toggle"
            type="button"
            aria-label="Otvoriť fotku"
            title="Otvoriť fotku"
            onClick={() => setIsMediaOpen(true)}
          >
            <ImageIcon size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isMediaOpen && media ? (
        <div
          onClick={() => setIsMediaOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.72)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ position: 'relative', width: 'min(560px, 92vw)', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(17, 24, 39, 0.25)' }}>
            <button type="button" onClick={() => setIsMediaOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, border: 'none', borderRadius: 999, background: 'rgba(17, 24, 39, 0.72)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            <img src={media.mediaDataUrl} alt={media.mediaAlt ?? quote} style={{ width: '100%', maxHeight: '68vh', objectFit: 'cover', display: 'block', background: '#f3f4f6' }} />
            {media.mediaDescription ? <p style={{ margin: 0, padding: '14px 16px 0', color: '#1f2937', lineHeight: 1.6 }}>{media.mediaDescription}</p> : null}
            <p style={{ margin: 0, padding: '14px 16px 16px', fontWeight: 700, color: '#1f2937', lineHeight: 1.6 }}>{quote}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
