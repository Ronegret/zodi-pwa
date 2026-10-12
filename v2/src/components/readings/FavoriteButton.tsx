import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { toast } from '@/components/ui/toast';
import { ACHIEVEMENT_BY_ID } from '@/lib/progress/achievements';

/** Estrella para guardar una lectura en favoritas (botón conmutador). */
export function FavoriteButton({ id, initial = false }: { id: string; initial?: boolean }) {
  const [favorite, setFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/lecturas/${id}/favorita`, { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      const { data } = (await res.json()) as { data: { favorite: boolean; unlocked: string[] } };
      setFavorite(data.favorite);
      toast(data.favorite ? 'Guardada en favoritas.' : 'Quitada de favoritas.');
      for (const a of data.unlocked) {
        toast(`Logro desbloqueado: ${ACHIEVEMENT_BY_ID.get(a)?.title ?? a}. +5 gemas.`);
      }
    } catch {
      toast('No he podido guardarla. Inténtalo otra vez.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-pressed={favorite}
      aria-busy={busy || undefined}
      onClick={toggle}
    >
      <Icon name="star" />
      <span className="btn-label">{favorite ? 'En favoritas' : 'Guardar en favoritas'}</span>
    </button>
  );
}
