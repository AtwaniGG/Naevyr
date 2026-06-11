import * as React from 'react';

/**
 * The canonical pixel HUD frame — notched corners, hard bevel, thin
 * corruption-purple edge, semi-transparent fill, purple corner pips.
 * @startingPoint section="HUD" subtitle="Glassy pixel frame for any HUD surface" viewport="320x200"
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Heading text (pixel display font). */
  title?: React.ReactNode;
  /** Small uppercase kicker above the title. */
  kicker?: React.ReactNode;
  /** Node pinned to the right of the header (badge, button). */
  accessory?: React.ReactNode;
  /** Show the 4 purple corner pips. Default true. */
  corners?: boolean;
  /** Add an outer corruption halo. Default false. */
  glow?: boolean;
  /** Pad the body & header. Default true. */
  padded?: boolean;
  /** Element tag. Default 'section'. */
  as?: keyof JSX.IntrinsicElements;
}

export function Panel(props: PanelProps): React.ReactElement;
