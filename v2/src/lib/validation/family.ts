/**
 * Ajustes → Sobre ti: la fecha de nacimiento de la pareja y los hijos, para
 * añadirlos a Tu gente (su signo y la afinidad). Todo opcional; si se pone
 * una fecha, hace falta el nombre (y al revés en los hijos). Puro.
 */
import { birthDateSchema } from './profile';

export const KID_SLOTS = 3;
/** Estados en los que se pregunta por la pareja (o por quien quita el sueño). */
export const PARTNER_STATUSES = ['single', 'relationship', 'married', 'complicated'] as const;

export interface Family {
  partner: { name: string; birth_date: string } | null;
  kids: { name: string; birth_date: string }[];
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function parseFamily(
  raw: Record<string, unknown>,
): { ok: true; family: Family } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const status = str(raw.relationship_status);
  const date = (key: string) => {
    const r = birthDateSchema.safeParse(str(raw[key]));
    if (!r.success) errors[key] = r.error.issues[0]?.message ?? 'Fecha no válida.';
    return r.success ? r.data : null;
  };

  let partner: Family['partner'] = null;
  const partnerName = str(raw.partner_name);
  if ((PARTNER_STATUSES as readonly string[]).includes(status) && str(raw.partner_birth_date)) {
    const d = date('partner_birth_date');
    if (!partnerName) errors.partner_name = 'Pon también su nombre.';
    else if (d) partner = { name: partnerName.slice(0, 60), birth_date: d };
  }

  const kids: Family['kids'] = [];
  if (str(raw.has_kids) === 'si') {
    for (let i = 1; i <= KID_SLOTS; i++) {
      const name = str(raw[`kid_name_${i}`]);
      const hasDate = Boolean(str(raw[`kid_date_${i}`]));
      if (!name && !hasDate) continue;
      if (!name) {
        errors[`kid_name_${i}`] = 'Pon su nombre.';
        continue;
      }
      if (!hasDate) {
        errors[`kid_date_${i}`] = 'Pon su fecha de nacimiento.';
        continue;
      }
      const d = date(`kid_date_${i}`);
      if (d) kids.push({ name: name.slice(0, 60), birth_date: d });
    }
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, family: { partner, kids } };
}
