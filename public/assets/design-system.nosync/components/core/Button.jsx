import React from 'react';

/* Naevyr — Button
   Pixel button: hard bevel + hard drop shadow that presses down on
   :active (chrome in styles.css → .drift-pixel-btn). Variants tie to
   the palette; React only sets the --btn-* vars + size + content. */

const VARIANTS = {
  primary: { '--btn-bg': 'var(--drift-corrupt-dim)', '--btn-bg-hi': 'var(--drift-corrupt)', '--btn-fg': '#f6efff', '--btn-edge': 'var(--drift-corrupt)' },
  gold:    { '--btn-bg': 'var(--gold-lo)', '--btn-bg-hi': 'var(--drift-gold)', '--btn-fg': '#1a130a', '--btn-edge': 'var(--gold-hi)' },
  ghost:   { '--btn-bg': 'var(--surface-frame)', '--btn-bg-hi': 'var(--ui-100)', '--btn-fg': 'var(--text-primary)', '--btn-edge': 'var(--corrupt-32)' },
  danger:  { '--btn-bg': 'var(--blood-lo)', '--btn-bg-hi': 'var(--drift-blood)', '--btn-fg': '#fff', '--btn-edge': 'var(--blood-hi)' },
};

const SIZES = {
  sm: { minHeight: 32, padding: '6px 10px', fontSize: 'var(--text-xs)' },
  md: { minHeight: 40, padding: '9px 14px', fontSize: 'var(--text-sm)' },
  lg: { minHeight: 48, padding: '12px 18px', fontSize: 'var(--text-md)' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  className = '',
  style = {},
  ...rest
}) {
  return (
    <button
      disabled={disabled}
      className={`drift-pixel-btn ${className}`}
      style={{
        ...(VARIANTS[variant] || VARIANTS.primary),
        ...(SIZES[size] || SIZES.md),
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : undefined,
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
