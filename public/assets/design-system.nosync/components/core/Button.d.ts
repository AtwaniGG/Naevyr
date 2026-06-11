import * as React from 'react';

/**
 * Pixel button with a hard bevel that presses down on click.
 * @startingPoint section="HUD" subtitle="Pixel action button, 4 variants" viewport="260x120"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Palette role. Default 'primary' (the Drift). */
  variant?: 'primary' | 'gold' | 'ghost' | 'danger';
  /** Size. Default 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to full width. */
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button(props: ButtonProps): React.ReactElement;
