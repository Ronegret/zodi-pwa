/**
 * Iconos de trazo (24×24, stroke = currentColor) compartidos por Icon.astro
 * e Icon.tsx. Cada icono es una lista de `d` de <path>.
 */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const ICONS = {
  home: ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M10 20v-5h4v5'],
  wheel: [circle(12, 12, 9), circle(12, 12, 4), 'M12 3v5M12 16v5M3 12h5M16 12h5'],
  sun: [
    circle(12, 12, 4),
    'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  ],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  heart: ['M12 20s-7-4.4-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.6-9 9-9 9z'],
  sparkles: [
    'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z',
    'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  ],
  sliders: ['M4 7h10M18 7h2M4 17h4M12 17h8', circle(16, 7, 2), circle(10, 17, 2)],
  logout: ['M15 4h4v16h-4', 'M10 8l-4 4 4 4', 'M6 12h10'],
  user: [circle(12, 8, 4), 'M4 21a8 8 0 0 1 16 0'],
  flame: ['M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 1 3 2 3 0-3-1-5 1-8z'],
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 9h8M8 12h5'],
  plus: ['M12 5v14M5 12h14'],
  x: ['M6 6l12 12M18 6 6 18'],
  check: ['M5 12.5 10 17l9-10'],
  chevronRight: ['M9 6l6 6-6 6'],
  chevronLeft: ['M15 6l-6 6 6 6'],
  pin: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', circle(12, 10, 2.5)],
  bolt: ['M13 3 5 14h6l-1 7 8-11h-6z'],
  bell: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21h4'],
  eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z', circle(12, 12, 3)],
  info: [circle(12, 12, 9), 'M12 11v6M12 7.5v.5'],
  pause: ['M8 5v14M16 5v14'],
  play: ['M7 5l12 7-12 7z'],
  rotate: ['M20 12a8 8 0 1 1-2.3-5.7', 'M20 4v4h-4'],
} as const;

export type IconName = keyof typeof ICONS;
