"use client";

import React from "react";

export { Icon, ICON_NAMES, TOOL_NAMES } from "./Icon";
export type { IconName } from "./Icon";

/* ============================================================
   DriftLands design-system components, ported to TSX from
   public/assets/design-system/components. Chrome (clip-paths,
   bevels, glows) lives in app/driftlands.css.
   ============================================================ */

// ---- Panel ------------------------------------------------------------------

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  kicker?: React.ReactNode;
  accessory?: React.ReactNode;
  corners?: boolean;
  glow?: boolean;
  padded?: boolean;
}

export function Panel({
  title,
  kicker,
  accessory,
  corners = true,
  glow = false,
  padded = true,
  className = "",
  style = {},
  children,
  ...rest
}: PanelProps) {
  const pip = (pos: React.CSSProperties) => (
    <span
      aria-hidden="true"
      style={{
        position: "absolute", width: 3, height: 3, background: "var(--drift-corrupt)",
        boxShadow: "0 0 0 1px var(--corrupt-32)", ...pos, pointerEvents: "none",
      }}
    />
  );
  return (
    <section
      className={`drift-panel ${className}`}
      style={{
        boxShadow: glow
          ? "var(--frame-shadow), 0 0 0 3px var(--corrupt-16)"
          : "var(--frame-shadow)",
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
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "var(--space-4)", padding: padded ? "10px 14px 8px" : "10px 12px 8px",
            borderBottom: "1px solid var(--bone-14)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {kicker && <span className="drift-label" style={{ color: "var(--text-muted)" }}>{kicker}</span>}
            {title && (
              <span className="drift-heading" style={{ fontSize: "var(--text-md)", color: "var(--text-primary)" }}>
                {title}
              </span>
            )}
          </div>
          {accessory}
        </header>
      )}
      <div style={{ padding: padded ? "12px 14px" : 0 }}>{children}</div>
    </section>
  );
}

// ---- Button -----------------------------------------------------------------

const BTN_VARIANTS: Record<string, React.CSSProperties> = {
  primary: { "--btn-bg": "var(--drift-corrupt-dim)", "--btn-bg-hi": "var(--drift-corrupt)", "--btn-fg": "#f6efff", "--btn-edge": "var(--drift-corrupt)" } as React.CSSProperties,
  gold:    { "--btn-bg": "var(--gold-lo)", "--btn-bg-hi": "var(--drift-gold)", "--btn-fg": "#1a130a", "--btn-edge": "var(--gold-hi)" } as React.CSSProperties,
  ghost:   { "--btn-bg": "var(--surface-frame)", "--btn-bg-hi": "var(--ui-100)", "--btn-fg": "var(--text-primary)", "--btn-edge": "var(--corrupt-32)" } as React.CSSProperties,
  danger:  { "--btn-bg": "var(--blood-lo)", "--btn-bg-hi": "var(--drift-blood)", "--btn-fg": "#fff", "--btn-edge": "var(--blood-hi)" } as React.CSSProperties,
};

const BTN_SIZES: Record<string, React.CSSProperties> = {
  sm: { minHeight: 28, padding: "5px 10px", fontSize: "var(--text-2xs)" },
  md: { minHeight: 40, padding: "9px 14px", fontSize: "var(--text-sm)" },
  lg: { minHeight: 48, padding: "12px 18px", fontSize: "var(--text-md)" },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  className = "",
  style = {},
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`drift-pixel-btn ${className}`}
      style={{
        ...(BTN_VARIANTS[variant] || BTN_VARIANTS.primary),
        ...(BTN_SIZES[size] || BTN_SIZES.md),
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : undefined,
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

// ---- Badge + SeasonBadge ----------------------------------------------------

const BADGE_TONES: Record<string, { fg: string; bg: string; edge: string }> = {
  corrupt: { fg: "var(--drift-core)", bg: "var(--corrupt-32)", edge: "var(--corrupt-55)" },
  gold:    { fg: "#1a130a", bg: "var(--drift-gold)", edge: "var(--gold-hi)" },
  success: { fg: "#dff1df", bg: "var(--moss-24)", edge: "var(--drift-moss)" },
  warning: { fg: "#241a05", bg: "var(--drift-ember)", edge: "var(--ember-hi)" },
  danger:  { fg: "#ffe7e7", bg: "var(--blood-24)", edge: "var(--drift-blood)" },
  neutral: { fg: "var(--text-secondary)", bg: "var(--surface-well)", edge: "var(--bone-14)" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof BADGE_TONES;
  icon?: React.ReactNode;
}

export function Badge({ children, tone = "corrupt", icon = null, className = "", style = {}, ...rest }: BadgeProps) {
  const t = BADGE_TONES[tone] || BADGE_TONES.corrupt;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        font: `var(--weight-regular) var(--text-2xs)/1 var(--font-pixel)`,
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: t.fg, background: t.bg, padding: "4px 8px",
        boxShadow: `0 0 0 1px ${t.edge}`,
        clipPath: "polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))",
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export interface SeasonBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  season?: number;
  name?: string;
  driftPct?: number;
}

export function SeasonBadge({ season = 1, name = "Ashfall", driftPct = 0, className = "", style = {}, ...rest }: SeasonBadgeProps) {
  return (
    <div
      className={`drift-panel ${className}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "7px 12px 7px 8px",
        boxShadow: "var(--frame-shadow)", ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minWidth: 34, padding: "3px 6px", background: "var(--corrupt-32)",
          boxShadow: "0 0 0 1px var(--corrupt-55)",
          clipPath: "polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))",
        }}
      >
        <span style={{ font: "400 8px/1 var(--font-pixel)", letterSpacing: ".1em", color: "var(--bone-72)" }}>S</span>
        <span style={{ font: "600 17px/1 var(--font-display)", color: "var(--drift-core)" }}>{String(season).padStart(2, "0")}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="drift-heading" style={{ fontSize: "var(--text-md)", color: "var(--text-primary)", lineHeight: 1 }}>
          {name}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "400 9px/1 var(--font-pixel)", letterSpacing: ".06em", color: "var(--text-muted)", textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, background: "var(--drift-corrupt)", boxShadow: "var(--glow-corrupt-sm)" }} />
          Drift {driftPct}%
        </span>
      </div>
    </div>
  );
}

// ---- Slot -------------------------------------------------------------------

const RARITY: Record<string, string> = {
  common:    "var(--bone-14)",
  uncommon:  "var(--drift-moss)",
  rare:      "var(--water-hi)",
  epic:      "var(--drift-corrupt)",
  legendary: "var(--drift-gold)",
};

export interface SlotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  count?: React.ReactNode;
  keybind?: React.ReactNode;
  rarity?: keyof typeof RARITY | null;
  selected?: boolean;
  size?: number;
}

export function Slot({
  icon = null,
  count = null,
  keybind = null,
  rarity = null,
  selected = false,
  disabled = false,
  size = 52,
  onClick,
  title,
  className = "",
  style = {},
  ...rest
}: SlotProps) {
  const edge = rarity ? RARITY[rarity] : null;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      className={className}
      style={{
        position: "relative", width: size, height: size, padding: 0, border: 0,
        background: "var(--surface-well)", cursor: disabled ? "default" : "pointer",
        imageRendering: "pixelated",
        boxShadow: selected
          ? "var(--bevel-slot), 0 0 0 1px var(--drift-core), 0 0 0 2px var(--drift-corrupt), 0 0 0 4px var(--corrupt-16)"
          : edge
            ? `var(--bevel-slot), inset 0 0 0 1px ${edge}`
            : "var(--bevel-slot)",
        transition: "box-shadow var(--dur-fast) steps(2)",
        ...style,
      }}
      {...rest}
    >
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1 }}>
        {icon}
      </span>
      {keybind != null && (
        <span style={{ position: "absolute", top: 2, left: 3, font: "400 9px/1 var(--font-pixel)", color: "var(--bone-45)" }}>
          {keybind}
        </span>
      )}
      {count != null && (
        <span
          className="drift-num"
          style={{
            position: "absolute", right: 3, bottom: 2, fontSize: "11px", fontWeight: 700,
            color: "var(--text-primary)", textShadow: "var(--text-shadow-hud)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ---- Hotbar -----------------------------------------------------------------

export interface HotbarItem {
  icon: React.ReactNode;
  name?: string;
  count?: React.ReactNode;
  rarity?: keyof typeof RARITY | null;
  disabled?: boolean;
}

export interface HotbarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  slots?: (HotbarItem | null)[];
  selected?: number;
  onSelect?: (i: number) => void;
  size?: number;
}

export function Hotbar({
  slots = [],
  selected = 0,
  onSelect,
  size = 52,
  className = "",
  style = {},
  ...rest
}: HotbarProps) {
  const cells = Array.from({ length: 6 }, (_, i) => slots[i] || null);
  return (
    <div
      className={className}
      style={{ display: "flex", gap: "var(--slot-gap)", ...style }}
      role="toolbar"
      aria-label="Hotbar"
      {...rest}
    >
      {cells.map((item, i) => (
        <Slot
          key={i}
          size={size}
          keybind={i + 1}
          icon={item ? item.icon : null}
          count={item ? item.count : null}
          rarity={item ? item.rarity : null}
          selected={i === selected}
          disabled={item?.disabled}
          title={item?.name ?? `Slot ${i + 1}`}
          onClick={() => onSelect && onSelect(i)}
        />
      ))}
    </div>
  );
}

// ---- XPBar ------------------------------------------------------------------

export interface XPBarProps extends React.HTMLAttributes<HTMLDivElement> {
  skill?: string;
  level?: number;
  value?: number;
  max?: number;
  color?: string;
  icon?: React.ReactNode;
  showNumbers?: boolean;
}

export function XPBar({
  skill = "Woodcutting",
  level = 1,
  value = 0,
  max = 100,
  color = "var(--drift-corrupt)",
  icon = null,
  showNumbers = true,
  className = "",
  style = {},
  ...rest
}: XPBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 5, ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {icon}
        <span className="drift-label" style={{ color: "var(--text-secondary)", flex: 1 }}>{skill}</span>
        <span
          className="drift-num"
          style={{
            fontSize: "11px", fontWeight: 700, color: "var(--text-primary)",
            background: "var(--surface-well)", boxShadow: "var(--bevel-slot)", padding: "2px 6px",
            whiteSpace: "nowrap",
          }}
        >
          Lv {level}
        </span>
      </div>
      <div
        style={{
          position: "relative", height: "var(--xpbar-height)", background: "var(--surface-well)",
          boxShadow: "var(--bevel-slot)", overflow: "hidden", imageRendering: "pixelated",
        }}
      >
        <span
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(10,8,16,.25) 55%, rgba(10,8,16,.25) 100%)`,
            boxShadow: `0 0 0 1px rgba(10,8,16,.4), 0 0 6px ${color}`,
            transition: "width var(--dur-slow) steps(8)",
          }}
        />
      </div>
      {showNumbers && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="drift-num" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            {value.toLocaleString()} / {max.toLocaleString()} XP
          </span>
          <span className="drift-num" style={{ fontSize: "10px", color }}>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}

// ---- ActivityLog ------------------------------------------------------------
// Adapted: our store logs as {text, color}; color maps to dot + accent.

export interface LogEntry {
  id?: number;
  text: string;
  color?: string;
  meta?: string;
}

export interface ActivityLogProps extends React.HTMLAttributes<HTMLUListElement> {
  entries?: LogEntry[];
  max?: number;
}

export function ActivityLog({ entries = [], max = 6, className = "", style = {}, ...rest }: ActivityLogProps) {
  const rows = entries.slice(0, max);
  return (
    <ul
      className={className}
      style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6, ...style }}
      {...rest}
    >
      {rows.map((e, i) => {
        const dot = e.color || "var(--bone-45)";
        const isDrift = e.color === "#a855f7";
        return (
          <li key={e.id ?? i} style={{ display: "flex", alignItems: "baseline", gap: 8, opacity: 1 - i * 0.085 }}>
            <span aria-hidden="true" style={{ flex: "none", width: 5, height: 5, marginTop: 1, background: dot, boxShadow: isDrift ? "var(--glow-corrupt-sm)" : "none" }} />
            <span style={{ flex: 1, font: "400 13px/1.35 var(--font-ui)", color: "var(--text-secondary)", textShadow: "var(--text-shadow-hud)" }}>
              {e.text}
              {e.meta && <span className="drift-num" style={{ color: dot, fontWeight: 600, marginLeft: 6 }}>{e.meta}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
