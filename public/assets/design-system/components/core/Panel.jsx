import React from 'react';

/* DriftLands — Panel
   The canonical pixel HUD frame: notched corners, hard bevel, a thin
   corruption-purple edge, semi-transparent fill, purple corner pips.
   Composes into every HUD surface (inventory, log, skills). */

export function Panel({
  title,
  kicker,
  accessory,
  corners = true,
  glow = false,
  padded = true,
  as: Tag = 'section',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const pip = (pos) => (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', width: 3, height: 3, background: 'var(--drift-corrupt)',
        boxShadow: '0 0 0 1px var(--corrupt-32)', ...pos, pointerEvents: 'none',
      }}
    />
  );
  return (
    <Tag
      className={`drift-panel ${className}`}
      style={{
        boxShadow: glow
          ? 'var(--frame-shadow), 0 0 0 3px var(--corrupt-16)'
          : 'var(--frame-shadow)',
        ...style,
      }}
      {...rest}
    >
      {corners && (
        <>
          {pip({ left: 2, top: 2 })}
          {pip({ right: 2, top: 2 })}
          {pip({ left: 2, bottom: 2 })}
          {pip({ right: 2, bottom: 2 })}
        </>
      )}
      {(title || kicker || accessory) && (
        <header
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--space-4)', padding: padded ? '10px 14px 8px' : '10px 12px 8px',
            borderBottom: '1px solid var(--bone-14)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {kicker && <span className="drift-label" style={{ color: 'var(--text-muted)' }}>{kicker}</span>}
            {title && (
              <span className="drift-heading" style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>
                {title}
              </span>
            )}
          </div>
          {accessory}
        </header>
      )}
      <div style={{ padding: padded ? '12px 14px' : 0 }}>{children}</div>
    </Tag>
  );
}
