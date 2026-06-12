import React from 'react';
import { Slot } from './Slot.jsx';

/* Naevyr — Hotbar
   The 6-slot action bar (keys 1–6). Pass `slots` as an array of up to
   6 items ({ icon, count, rarity }); `selected` is the active index.
   Empty positions render as quiet wells. */

export function Hotbar({
  slots = [],
  selected = 0,
  onSelect,
  size = 52,
  className = '',
  style = {},
  ...rest
}) {
  const cells = Array.from({ length: 6 }, (_, i) => slots[i] || null);
  return (
    <div
      className={className}
      style={{ display: 'flex', gap: 'var(--slot-gap)', ...style }}
      role="toolbar"
      aria-label="Hotbar"
      {...rest}
    >
      {cells.map((item, i) => (
        <Slot
          key={i}
          size={size}
          keybind={i + 1}
          icon={item ? item.icon : null}
          count={item ? item.count : null}
          rarity={item ? item.rarity : null}
          selected={i === selected}
          title={item ? item.name : `Slot ${i + 1}`}
          onClick={() => onSelect && onSelect(i)}
        />
      ))}
    </div>
  );
}
