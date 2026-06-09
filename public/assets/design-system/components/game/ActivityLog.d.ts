import * as React from 'react';

export interface LogEntry {
  kind?: 'xp' | 'loot' | 'info' | 'warning' | 'danger' | 'drift';
  text: React.ReactNode;
  /** Trailing tinted value, e.g. "+128 XP" or "x3". */
  meta?: React.ReactNode;
}

/** The scrolling HUD feed — gathers, level-ups, loot, Drift events. */
export interface ActivityLogProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Entries newest-first. */
  entries?: LogEntry[];
  /** Max rows shown. Default 6. */
  max?: number;
}

export function ActivityLog(props: ActivityLogProps): React.ReactElement;
