import React from 'react';

/* Naevyr — XPBar
   A skill progress row: icon + name on the left, level chip on the
   right, a pixel track with a stepped corruption fill, and the
   value/next readout. `color` tints the fill per skill. */

export function XPBar({
  skill = 'Woodcutting',
  level = 1,
  value = 0,
  max = 100,
  color = 'var(--drift-corrupt)',
  icon = null,
  showNumbers = true,
  className = '',
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon}
        <span className="drift-label" style={{ color: 'var(--text-secondary)', flex: 1 }}>{skill}</span>
        <span
          className="drift-num"
          style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)',
            background: 'var(--surface-well)', boxShadow: 'var(--bevel-slot)', padding: '2px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          Lv {level}
        </span>
      </div>
      <div
        style={{
          position: 'relative', height: 'var(--xpbar-height)', background: 'var(--surface-well)',
          boxShadow: 'var(--bevel-slot)', overflow: 'hidden', imageRendering: 'pixelated',
        }}
      >
        <span
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(10,8,16,.25) 55%, rgba(10,8,16,.25) 100%)`,
            boxShadow: `0 0 0 1px rgba(10,8,16,.4), 0 0 6px ${color}`,
            transition: 'width var(--dur-slow) steps(8)',
          }}
        />
      </div>
      {showNumbers && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="drift-num" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {value.toLocaleString()} / {max.toLocaleString()} XP
          </span>
          <span className="drift-num" style={{ fontSize: '10px', color }}>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}
