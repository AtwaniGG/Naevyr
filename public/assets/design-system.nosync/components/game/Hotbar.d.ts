import * as React from 'react';

export interface HotbarItem {
  icon?: React.ReactNode;
  count?: number | string | null;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null;
  name?: string;
}

/**
 * The 6-slot action bar (keys 1–6).
 * @startingPoint section="HUD" subtitle="6-slot pixel hotbar" viewport="360x80"
 */
export interface HotbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Up to 6 items; empty positions render as quiet wells. */
  slots?: HotbarItem[];
  /** Active index. Default 0. */
  selected?: number;
  onSelect?: (index: number) => void;
  size?: number;
}

export function Hotbar(props: HotbarProps): React.ReactElement;
