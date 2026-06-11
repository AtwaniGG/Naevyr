import React from 'react';

/* DriftLands — Badge
   Pixel chip for statuses, counts, rarity & the seasonal "Drift"
   marker. variant="season" is the ornate HUD season badge; the rest
   are compact inline tags. */

const TONES = {
  corrupt: { fg: 'var(--drift-core)', bg: 'var(--corrupt-32)', edge: 'var(--corrupt-55)' },
  gold:    { fg: '#1a130a', bg: 'var(--drift-gold)', edge: 'var(--gold-hi)' },
  success: { fg: '#dff1df', bg: 'var(--moss-24)', edge: 'var(--drift-moss)' },
  warning: { fg: '#241a05', bg: 'var(--drift-ember)', edge: 'var(--ember-hi)' },
  danger:  { fg: '#ffe7e7', bg: 'var(--blood-24)', edge: 'var(--drift-blood)' },
  neutral: { fg: 'var(--text-secondary)', bg: 'var(--surface-well)', edge: 'var(--bone-14)' },
};

export function Badge({ children, tone = 'corrupt', icon = null, className = '', style = {}, ...rest }) {
  const t = TONES[tone] || TONES.corrupt;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        font: `var(--weight-regular) var(--text-2xs)/1 var(--font-pixel)`,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: t.fg, background: t.bg, padding: '4px 8px',
        boxShadow: `0 0 0 1px ${t.edge}`,
        clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))',
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

/* The HUD "season" badge — number + name, corruption-styled. */
export function SeasonBadge({ season = 3, name = 'Ashfall', driftPct = 42, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`drift-panel ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 12px 7px 8px',
        boxShadow: 'var(--frame-shadow)', ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minWidth: 34, padding: '3px 6px', background: 'var(--corrupt-32)',
          boxShadow: '0 0 0 1px var(--corrupt-55)',
          clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))',
        }}
      >
        <span style={{ font: '400 8px/1 var(--font-pixel)', letterSpacing: '.1em', color: 'var(--bone-72)' }}>S</span>
        <span style={{ font: '600 17px/1 var(--font-display)', color: 'var(--drift-core)' }}>{String(season).padStart(2, '0')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span className="drift-heading" style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', lineHeight: 1 }}>
          {name}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '400 9px/1 var(--font-pixel)', letterSpacing: '.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <span style={{ width: 6, height: 6, background: 'var(--drift-corrupt)', boxShadow: 'var(--glow-corrupt-sm)' }} />
          Drift {driftPct}%
        </span>
      </div>
    </div>
  );
}
