import type { IconName } from '@/components/ui/icons';

/**
 * Reparte el texto de una lectura en tarjetas: una frase resumen, bloques con
 * título en negrita y la acción final ("Hoy haz esto"). Si el texto no trae esa
 * estructura (lecturas antiguas), `structured` es false y se muestra como texto.
 * Es puro y tolera el texto a medias del streaming.
 */
export interface ReadingSection {
  title: string;
  body: string[];
  icon: IconName;
}

export interface ReadingCards {
  structured: boolean;
  summary: string;
  sections: ReadingSection[];
  /** Acción final; `label` conserva "Hoy haz esto:". */
  action: { label: string; text: string } | null;
}

const HEADER = /^\*\*([^*\n]{1,40}?)\*\*\s*:?\s*(.*)$/;

const ICON_RULES: Array<[RegExp, IconName]> = [
  [/amor|pareja|sexo|ligue|crush|ex\b|coraz/i, 'heart'],
  [/trabajo|carrera|jefe|empleo|estudi/i, 'bolt'],
  [/dinero|plata|suerte|finanz|econom/i, 'star'],
  [/energ|salud|cuerpo|ánimo|animo|descanso/i, 'flame'],
  [/amig|familia|gente|social|hijo/i, 'users'],
  [/luna|noche|sue[ñn]o|emoci/i, 'moon'],
  [/sol\b|d[ií]a|hoy|vida/i, 'sun'],
];

export function iconFor(title: string): IconName {
  return ICON_RULES.find(([re]) => re.test(title))?.[1] ?? 'sparkles';
}

const isAction = (title: string) => /hoy\s+haz\s+esto|haz\s+esto/i.test(title);

export function splitReading(text: string): ReadingCards {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  // Una cabecera a medio escribir ("**Amo") no se pinta hasta que se cierra.
  const last = lines.at(-1)?.trim() ?? '';
  if (last.startsWith('**') && !HEADER.test(last) && (last.match(/\*\*/g)?.length ?? 0) % 2 === 1) {
    lines.pop();
  }

  const summary: string[] = [];
  const sections: ReadingSection[] = [];
  let action: ReadingCards['action'] = null;
  let current: { title: string; body: string[] } | null = null;

  const flush = () => {
    if (current && current.body.length) {
      sections.push({ title: current.title, body: current.body, icon: iconFor(current.title) });
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim().replace(/^#{1,6}\s+/, '');
    if (!line) continue;
    // Los bullets antiguos "- **Amor:** texto" cuentan como bloque con título.
    const m = HEADER.exec(line.replace(/^[-•*]\s+/, ''));
    if (m) {
      flush();
      const title = m[1]!.trim().replace(/:$/, '');
      const rest = m[2]!.trim();
      if (isAction(title)) {
        action = { label: 'Hoy haz esto:', text: rest };
        current = null;
        continue;
      }
      current = { title, body: rest ? [rest] : [] };
      continue;
    }
    const clean = line.replace(/^[-•*]\s+/, '');
    if (action) {
      action.text = `${action.text} ${clean}`.trim();
    } else if (current) {
      current.body.push(clean);
    } else if (sections.length && !current) {
      sections.at(-1)!.body.push(clean);
    } else {
      summary.push(clean);
    }
  }
  // Cabecera recién escrita sin cuerpo aún (streaming): ya se muestra su tarjeta.
  if (current)
    sections.push({ title: current.title, body: current.body, icon: iconFor(current.title) });

  const structured = Boolean(action) || sections.length > 0;
  return { structured, summary: summary.join(' '), sections, action };
}
