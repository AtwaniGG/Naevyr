import * as React from 'react';

/** Compact pixel chip for statuses, counts, rarity & the Drift marker. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color role. Default 'corrupt'. */
  tone?: 'corrupt' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
}

export function Badge(props: BadgeProps): React.ReactElement;

/**
 * The ornate HUD season badge — number + name + Drift-spread readout.
 * @startingPoint section="HUD" subtitle="Seasonal Drift badge" viewport="220x90"
 */
export interface SeasonBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  season?: number;
  name?: string;
  /** % of the realm consumed by the Drift this season. */
  driftPct?: number;
}

export function SeasonBadge(props: SeasonBadgeProps): React.ReactElement;
