import React from 'react';

/* DriftLands — ActivityLog
   The scrolling HUD feed: gathers, level-ups, loot, Drift events.
   Pass `entries` newest-first; each = { kind, text, meta }. kind tints
   the bullet + accent: loot/xp/info/warning/danger/drift. */

const KINDS = {
  xp:      { dot: 'var(--drift-corrupt)', accent: 'var(--drift-corrupt)' },
  loot:    { dot: 'var(--drift-gold)', accent: 'var(--drift-gold)' },
  info:    { dot: 'var(--bone-45)', accent: 'var(--text-secondary)' },
  warning: { dot: 'var(--drift-ember)', accent: 'var(--drift-ember)' },
  danger:  { dot: 'var(--drift-blood)', accent: 'var(--drift-blood)' },
  drift:   { dot: 'var(--drift-core)', accent: 'var(--drift-hi)' },
};

export function ActivityLog({ entries = [], max = 6, className = '', style = {}, ...rest }) {
  const rows = entries.slice(0, max);
  return (
    <ul
      className={className}
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, ...style }}
      {...rest}
    >
      {rows.map((e, i) => {
        const k = KINDS[e.kind] || KINDS.info;
        return (
          <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, opacity: 1 - i * 0.085 }}>
            <span aria-hidden="true" style={{ flex: 'none', width: 5, height: 5, marginTop: 1, background: k.dot, boxShadow: e.kind === 'drift' || e.kind === 'xp' ? 'var(--glow-corrupt-sm)' : 'none' }} />
            <span style={{ flex: 1, font: '400 13px/1.35 var(--font-ui)', color: 'var(--text-secondary)', textShadow: 'var(--text-shadow-hud)' }}>
              {e.text}
              {e.meta && <span className="drift-num" style={{ color: k.accent, fontWeight: 600, marginLeft: 6 }}>{e.meta}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
