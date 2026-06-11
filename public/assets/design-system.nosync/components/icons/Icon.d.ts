import * as React from 'react';

export type IconName =
  | 'axe' | 'pickaxe' | 'rod' | 'sword' | 'ward' | 'sigil'
  | 'log' | 'ore' | 'fish' | 'coin' | 'drift'
  | 'heart' | 'leaf' | 'bag' | 'bolt' | 'chevronRight' | 'x';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** Registry name. The 6 tools: axe, pickaxe, rod, sword, ward, sigil. */
  name: IconName;
  /** Pixel size (square). Default 20. */
  size?: number;
  /** SVG stroke width on the 24-grid. Default 1.75. */
  strokeWidth?: number;
  /** Apply the Drift purple drop-shadow glow. Default false. */
  glow?: boolean;
  /** Override color (otherwise inherits currentColor). */
  color?: string;
}

/**
 * The DriftLands icon set — one cohesive line/solid family on a 24×24 grid.
 * Inherits currentColor so it tints to any drift.* token.
 */
export function Icon(props: IconProps): React.ReactElement;

export const ICON_NAMES: string[];
export const TOOL_NAMES: string[];
