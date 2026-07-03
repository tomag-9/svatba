'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DeleteEntityButtonProps = {
  endpoint: string;
  redirectTo?: string;
  label?: string;
};

export function DeleteEntityButton({ endpoint, redirectTo, label = 'Zmazať' }: DeleteEntityButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm('Naozaj chceš túto položku zmazať?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    const response = await fetch(endpoint, { method: 'DELETE' });
    setIsDeleting(false);

    if (!response.ok) {
      window.alert('Zmazanie sa nepodarilo.');
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    router.refresh();
  }

  return (
    <button className="button button-ghost" type="button" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Mažem...' : label}
    </button>
  );
}
