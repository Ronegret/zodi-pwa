import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'violet' | 'danger';

interface Props extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
  loading?: boolean;
  icon?: IconName;
  children: ReactNode;
}

/** Misma API y clases que Button.astro, para islas React. */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  icon,
  className,
  type = 'button',
  children,
  ...rest
}: Props) {
  const classes = [
    'btn',
    variant !== 'primary' && `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    block && 'btn-block',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} type={type} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {icon && <Icon name={icon} />}
      <span className="btn-label">{children}</span>
    </button>
  );
}
