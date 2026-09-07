import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import styles from './reveal-history.module.css';

export const dynamic = 'force-dynamic';

const moodLabels: Record<string, string> = {
  LUBENE: 'Zaľúbené',
  HORNY: 'Horny',
  SEXY: 'Sexi',
  FUNNY: 'Funny',
  LOYAL: 'Oddane',
  COMFORT: 'Pohodovo',
  CALM: 'Spokojne'
};

const categoryLabels: Record<string, string> = {
  BASIC: 'Basic',
  FUNNY: 'Funny',
  ROMANTIC: 'Romantic',
  EROTIC: 'Erotic'
};

function formatAnswer(key: string, value: string) {
  if (key === 'method' && value === 'MAST') return '🫲🍆🍑🫱';
  return value;
}

function getQuestionAnswers(item: {
  mood: string;
  method: string | null;
  bodyPart: string | null;
  moment: string | null;
  funnyLength: string | null;
  loyalty: string | null;
}) {
  const pairs: Array<{ question: string; answer: string; key: string }> = [
    { question: 'Ako sa dnes cítiš?', answer: moodLabels[item.mood] ?? item.mood, key: 'mood' }
  ];

  if (item.mood === 'LUBENE' && item.moment) {
    pairs.push({ question: 'Aký bol posledný moment, kedy si sa cítila byť milovaná?', answer: item.moment, key: 'moment' });
  }
  if (item.mood === 'HORNY' && item.method) {
    pairs.push({ question: 'Zvolila by si na dnes metódu?', answer: formatAnswer('method', item.method), key: 'method' });
  }
  if (item.mood === 'SEXY') {
    if (item.bodyPart) pairs.push({ question: 'Ktorá časť môjho tela je podľa teba najviac sexi?', answer: item.bodyPart, key: 'bodyPart' });
    if (item.moment) pairs.push({ question: 'Kedy sa cítiš najviac sexi?', answer: item.moment, key: 'sexy-moment' });
  }
  if (item.mood === 'FUNNY' && item.funnyLength) {
    pairs.push({ question: 'Chceš vidieť krátky alebo dlhý vtip?', answer: item.funnyLength, key: 'funnyLength' });
  }
  if (item.mood === 'LOYAL' && item.loyalty) {
    pairs.push({ question: 'Budeš mi oddane žehliť, prať a iné?', answer: item.loyalty, key: 'loyalty' });
  }

  return pairs;
}

export default async function RevealHistoryPage() {
  const hdr = await headers();
  const cookieHeader = hdr.get('cookie') ?? null;
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(cookieHeader), 'ANGIE');

  if (role !== 'TOMI') {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>
          <h2>Prístup zamietnutý</h2>
          <p>Túto históriu môže vidieť len Tomi.</p>
          </div>
        </div>
      </main>
    );
  }

  const items = await prisma.countdownRevealResponse.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      quoteText: true,
      mood: true,
      category: true,
      method: true,
      bodyPart: true,
      moment: true,
      funnyLength: true,
      loyalty: true,
      answers: true,
      createdAt: true
    }
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Tomi · súkromné</p>
            <h1 className={styles.title}>História odpovedí</h1>
          </div>
          <span className={styles.count}>{items.length} {items.length === 1 ? 'odpoveď' : 'odpovedí'}</span>
        </header>

        <div className={styles.list}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              Zatiaľ nie sú žiadne odpovede.
            </div>
          ) : (
            items.map((item) => (
              <article className={styles.card} key={item.id}>
                <div className={styles.meta}>
                  <time className={styles.date} dateTime={item.createdAt.toISOString()}>
                    {new Date(item.createdAt).toLocaleString('sk-SK')}
                  </time>
                  <div className={styles.tags}>
                    <span className={styles.tag}>{moodLabels[item.mood] ?? item.mood}</span>
                    <span className={`${styles.tag} ${styles.tagCategory}`}>{categoryLabels[item.category ?? 'BASIC'] ?? item.category ?? 'Basic'}</span>
                  </div>
                </div>
                <p className={styles.quoteLabel}>Citát</p>
                <p className={styles.quote}>{item.quoteText}</p>
                <div className={styles.answers}>
                  <p className={styles.answersLabel}>Otázky a odpovede</p>
                  {getQuestionAnswers(item).map((pair) => (
                    <div className={styles.answer} key={pair.key}>
                      <span className={styles.question}>{pair.question}</span>
                      <span className={styles.answerValue}>{pair.answer}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
