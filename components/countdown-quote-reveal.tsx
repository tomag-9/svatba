'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type CountdownQuoteRevealProps = {
  quote: string;
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

export function CountdownQuoteReveal({ quote }: CountdownQuoteRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="countdown-quote">
      <p className="lede">{isRevealed ? quote : maskQuote(quote)}</p>
      <button
        className="icon-button countdown-quote-toggle"
        type="button"
        aria-label={isRevealed ? 'Skryť citát' : 'Ukázať citát'}
        title={isRevealed ? 'Skryť citát' : 'Ukázať citát'}
        onClick={() => setIsRevealed((current) => !current)}
      >
        {isRevealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
