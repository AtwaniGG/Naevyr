import React from 'react';

/* DriftLands — Slot
   Inventory / hotbar cell. Pixel well with a hard inset bevel; a
   rarity edge, a stack count, an optional keybind cap, and the Drift
   selection glow. Pass `icon` as a node (e.g. <Icon name="axe" />). */

const RARITY = {
  common:    'var(--bone-14)',
  uncommon:  'var(--drift-moss)',
  rare:      'var(--water-hi)',
  epic:      'var(--drift-corrupt)',
  legendary: 'var(--drift-gold)',
};

export function Slot({
  icon = null,
  count = null,
  keybind = null,
  rarity = null,
  selected = false,
  disabled = false,
  size = 52,
  onClick,
  title,
  className = '',
  style = {},
  ...rest
}) {
  const edge = rarity ? RARITY[rarity] : null;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      className={className}
      style={{
        position: 'relative', width: size, height: size, padding: 0, border: 0,
        background: 'var(--surface-well)', cursor: disabled ? 'default' : 'pointer',
        imageRendering: 'pixelated',
        boxShadow: selected
          ? 'var(--bevel-slot), 0 0 0 1px var(--drift-core), 0 0 0 2px var(--drift-corrupt), 0 0 0 4px var(--corrupt-16)'
          : edge
            ? `var(--bevel-slot), inset 0 0 0 1px ${edge}`
            : 'var(--bevel-slot)',
        transition: 'box-shadow var(--dur-fast) steps(2)',
        ...style,
      }}
      {...rest}
    >
      {/* item art */}
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      {/* keybind cap */}
      {keybind != null && (
        <span style={{ position: 'absolute', top: 2, left: 3, font: '400 9px/1 var(--font-pixel)', color: 'var(--bone-45)' }}>
          {keybind}
        </span>
      )}
      {/* stack count */}
      {count != null && (
        <span
          className="drift-num"
          style={{
            position: 'absolute', right: 3, bottom: 2, fontSize: '11px', fontWeight: 700,
            color: 'var(--text-primary)', textShadow: 'var(--text-shadow-hud)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
