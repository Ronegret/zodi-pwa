import { Fragment, type ReactNode } from 'react';

/**
 * Markdown mínimo de la IA → elementos React: párrafos, listas con "- " o
 * "• ", **negrita** y *cursiva*. Nunca HTML crudo: React escapa todo el
 * texto, así que una respuesta rara no puede inyectar nada.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={className ?? 'rich-text'}>{blocks(text)}</div>;
}

type Block = { type: 'p'; lines: string[] } | { type: 'ul'; items: string[] };

export function parseBlocks(text: string): Block[] {
  const out: Block[] = [];
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim().replace(/^#{1,6}\s+/, '');
    const item = /^(?:[-•*]|\d+[.)])\s+(.*)$/.exec(line);
    const last = out.at(-1);
    if (!line) {
      out.push({ type: 'p', lines: [] });
    } else if (item) {
      if (last?.type === 'ul') last.items.push(item[1]!);
      else out.push({ type: 'ul', items: [item[1]!] });
    } else if (last?.type === 'p') {
      last.lines.push(line);
    } else {
      out.push({ type: 'p', lines: [line] });
    }
  }
  return out.filter((b) => (b.type === 'p' ? b.lines.length > 0 : b.items.length > 0));
}

function blocks(text: string): ReactNode {
  return parseBlocks(text).map((b, i) =>
    b.type === 'ul' ? (
      <ul key={i}>
        {b.items.map((it, j) => (
          <li key={j}>{inline(it)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>
        {b.lines.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(l)}
          </Fragment>
        ))}
      </p>
    ),
  );
}

/** **negrita** y *cursiva* (también __ y _ ). Lo demás, texto literal. */
export function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*|__)(.+?)\1|(\*|_)(?=\S)(.+?)(?<=\S)\3/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) parts.push(<strong key={k++}>{m[2]}</strong>);
    else parts.push(<em key={k++}>{m[4]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
