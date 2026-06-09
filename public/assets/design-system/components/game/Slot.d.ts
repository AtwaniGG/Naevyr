import * as React from 'react';

/** A single inventory / hotbar cell — pixel well, rarity edge, stack count, Drift selection glow. */
export interface SlotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Item art node, e.g. <Icon name="axe" size={32} />. */
  icon?: React.ReactNode;
  /** Stack count shown bottom-right. */
  count?: number | string | null;
  /** Keybind cap shown top-left. */
  keybind?: number | string | null;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null;
  selected?: boolean;
  /** Pixel size (square). Default 52. */
  size?: number;
}

export function Slot(props: SlotProps): React.ReactElement;
