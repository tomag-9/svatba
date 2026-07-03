'use client';

import { useEffect, useMemo, useState } from 'react';

type BeforeInstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || navigatorStandalone);

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const visible = useMemo(() => Boolean(installEvent) && !isStandalone, [installEvent, isStandalone]);

  if (!visible) {
    return null;
  }

  async function handleInstall() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <div className="pwa-install-banner">
      <div>
        <p className="banner-title">Pridaj appku na plochu</p>
        <p className="banner-copy">Najpohodlnejšie sa používa ako PWA na Androide.</p>
      </div>
      <button className="button button-primary" type="button" onClick={handleInstall}>
        Inštalovať
      </button>
    </div>
  );
}
