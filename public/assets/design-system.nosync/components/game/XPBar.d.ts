import * as React from 'react';

/**
 * A skill progress row — icon, name, level chip, stepped corruption
 * fill and the value/next readout.
 * @startingPoint section="HUD" subtitle="Skill XP bar" viewport="320x90"
 */
export interface XPBarProps extends React.HTMLAttributes<HTMLDivElement> {
  skill?: string;
  level?: number;
  value?: number;
  max?: number;
  /** Fill tint (per skill). Default the Drift purple. */
  color?: string;
  icon?: React.ReactNode;
  showNumbers?: boolean;
}

export function XPBar(props: XPBarProps): React.ReactElement;
