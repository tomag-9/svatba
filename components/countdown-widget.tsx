import { CalendarDays } from 'lucide-react';

type CountdownWidgetProps = {
  daysUntilWedding: number | null;
  dailyLine: string;
};

function getDayUnit(days: number | null) {
  if (days === null) {
    return 'dní';
  }

  if (days === 1) {
    return 'deň';
  }

  if (days > 1 && days < 5) {
    return 'dni';
  }

  return 'dní';
}

export function CountdownWidget({ daysUntilWedding, dailyLine }: CountdownWidgetProps) {
  const displayDays = daysUntilWedding === null ? null : Math.max(daysUntilWedding, 0);

  return (
    <section className="countdown-widget" aria-label="Svadobný odpočet">
      <div className="countdown-widget-number" aria-label={displayDays === null ? 'Dátum svadby nie je nastavený' : `${displayDays} ${getDayUnit(displayDays)} do svadby`}>
        <CalendarDays size={17} strokeWidth={2.2} aria-hidden="true" />
        <strong>{displayDays === null ? '—' : displayDays}</strong>
        <span>{getDayUnit(displayDays)}</span>
      </div>
      <p>{dailyLine}</p>
    </section>
  );
}
