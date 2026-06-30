/* @ds-bundle: {"format":3,"namespace":"DriftLandsDesignSystem_3de3e2","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"SeasonBadge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"ActivityLog","sourcePath":"components/game/ActivityLog.jsx"},{"name":"Hotbar","sourcePath":"components/game/Hotbar.jsx"},{"name":"Slot","sourcePath":"components/game/Slot.jsx"},{"name":"XPBar","sourcePath":"components/game/XPBar.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"TOOL_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"}],"sourceHashes":{"animations.jsx":"ebe6809a6cbe","assets/_gen/appicon.js":"f7cab3d9bb5f","assets/_gen/arena.js":"69cfbaefdc87","assets/_gen/auras.js":"01e9d29f4e14","assets/_gen/avatars.js":"695bd23c6b0f","assets/_gen/battlepass.js":"7d6ac397635e","assets/_gen/beasts.js":"f237a8bd4969","assets/_gen/biometiles.js":"5477c551f97d","assets/_gen/cache.js":"63ec2b62b1be","assets/_gen/camps.js":"37b95a9ccd0a","assets/_gen/character.js":"c39fb75c7f1b","assets/_gen/critters.js":"588a2bd815c1","assets/_gen/crypt.js":"546043af8414","assets/_gen/deaths.js":"5d997101a3d8","assets/_gen/deeds.js":"41d05c6504ec","assets/_gen/driftwarden.js":"650d7310d088","assets/_gen/echofx.js":"1ff66367ee8d","assets/_gen/events.js":"be8abbea21ef","assets/_gen/exchange.js":"f36aebfd6998","assets/_gen/frontier.js":"9935f42232a6","assets/_gen/fxlogo.js":"d75e9312c3e4","assets/_gen/gifenc.js":"e070ad4dfccb","assets/_gen/groundcover.js":"8f90dc375aa6","assets/_gen/guildbanner.js":"91ce1c38fd2d","assets/_gen/interiors.js":"3c05ee6a0c8d","assets/_gen/landing.js":"6ccb614cb388","assets/_gen/micropoi.js":"6ec7a953747c","assets/_gen/minibosses.js":"699d607a298c","assets/_gen/mobfx.js":"3ce5d1767e25","assets/_gen/mobs.js":"c4cc60f3af95","assets/_gen/mounts.js":"876be6592a93","assets/_gen/nodes.js":"423b0fe786d3","assets/_gen/npcs.js":"4bdee152bbfd","assets/_gen/outpost.js":"e1604e77a693","assets/_gen/pixlib.js":"68d1e384c31c","assets/_gen/roads.js":"93337242873b","assets/_gen/ruins.js":"e328e8ba20cc","assets/_gen/social.js":"117e1c91be46","assets/_gen/spectate.js":"16895cf8cdbe","assets/_gen/streak.js":"4006f6272d04","assets/_gen/threshold.js":"9a7b8510e4f6","assets/_gen/tiles.js":"6d77bc55b2e1","assets/_gen/town.js":"a7f2517c52fe","assets/_gen/walls.js":"034bfd562504","assets/_gen/wayside.js":"25d010151206","assets/_gen/waystation.js":"71fe846c47ba","assets/_gen/wheelfaces.js":"e6055cb0a0a6","assets/_gen/wilds.js":"19f44fe8beb5","assets/_gen/worldchoice.js":"af4ad4c35a44","components/core/Badge.jsx":"85e7377ebd5a","components/core/Button.jsx":"1e68b0d79a01","components/core/Panel.jsx":"13ea472f5db3","components/game/ActivityLog.jsx":"cd0eda105b42","components/game/Hotbar.jsx":"b8493e549497","components/game/Slot.jsx":"a18ee855c625","components/game/XPBar.jsx":"8cd5c827574d","components/icons/Icon.jsx":"5150976deb7d","naevyr_scenes.jsx":"b137777c5e70","reel-common.js":"2c8bbdca445c","ui_kits/hud/Hud.jsx":"8fa35d5b4c86","ui_kits/hud/Scene.jsx":"572c11e0e9fa"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DriftLandsDesignSystem_3de3e2 = window.DriftLandsDesignSystem_3de3e2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// animations.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// animations.jsx
// Reusable animation starter: Stage, Timeline, Sprite, easing helpers.
// Exports (to window): Stage, Sprite, PlaybackBar, TextSprite, ImageSprite, RectSprite,
//   useTime, useTimeline, useSprite, Easing, interpolate, animate, clamp.
//
// Usage (in an HTML file that loads React + Babel):
//
//   <Stage width={1280} height={720} duration={10} background="#f6f4ef">
//     <MyScene />
//   </Stage>
//
// <Stage> auto-scales to the viewport and provides the scrubber, play/pause,
// ←/→ seek, space, and 0-to-reset controls, and persists the playhead.
// Inside <Stage>, any child can call useTime() to read the current
// playhead (seconds). Or wrap content in <Sprite start={1} end={4}>...</Sprite>
// to only render during that window -- children receive a `localTime` and
// `progress` via the useSprite() hook. Use Easing + interpolate()/animate()
// for tweens; TextSprite / ImageSprite / RectSprite have built-in entry/exit.
// Build YOUR scenes by composing Sprites inside a Stage.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: t => t,
  // Quad
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // Cubic
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // Quart
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - --t * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  // Expo
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  // Sine
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  // Back (overshoot)
  easeOutBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: t => {
    const c1 = 1.70158,
      c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  // Elastic
  easeOutElastic: t => {
    const c4 = 2 * Math.PI / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return t => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic
}) {
  return t => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({
  time: 0,
  duration: 10,
  playing: false
});
const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with `localTime` (seconds since start) and `progress` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

const SpriteContext = React.createContext({
  localTime: 0,
  progress: 0,
  duration: 0
});
const useSprite = () => React.useContext(SpriteContext);
function Sprite({
  start = 0,
  end = Infinity,
  children,
  keepMounted = false
}) {
  const {
    time
  } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;
  const value = {
    localTime,
    progress,
    duration,
    visible
  };
  return /*#__PURE__*/React.createElement(SpriteContext.Provider, {
    value: value
  }, typeof children === 'function' ? children(value) : children);
}

// ── Sample sprite components ────────────────────────────────────────────────

// TextSprite: fades/slides text in on entry, holds, then fades out on exit.
// Props: text, x, y, size, color, font, entryDur, exitDur, align
function TextSprite({
  text,
  x = 0,
  y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em'
}) {
  const {
    localTime,
    duration
  } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let ty = 0;
  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }
  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${translateX}, ${ty}px)`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity'
    }
  }, text);
}

// ImageSprite: scales + fades in; optional Ken Burns drift during hold.
function ImageSprite({
  src,
  x = 0,
  y = 0,
  width = 400,
  height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null // {label: string} for striped placeholder
}) {
  const {
    localTime,
    duration
  } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }
  const content = placeholder ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    }
  }, placeholder.label || 'image') : /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: fit,
      display: 'block'
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity'
    }
  }, content);
}

// RectSprite: simple rectangle that animates position/size/color via props.
// Useful demo primitive — takes a `render` fn for per-frame customization.
function RectSprite({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render // optional: (ctx) => style overrides
}) {
  const spriteCtx = useSprite();
  const {
    localTime,
    duration
  } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }
  const overrides = render ? render(spriteCtx) : {};
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides
    }
  });
}
function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children
}) {
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try {
      localStorage.setItem(persistKey + ':t', String(time));
    } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
      const s = Math.min(el.clientWidth / width, (el.clientHeight - barH) / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = ts => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime(t => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);
  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(() => ({
    time: displayTime,
    duration,
    playing,
    setTime,
    setPlaying
  }), [displayTime, duration, playing]);
  return /*#__PURE__*/React.createElement("div", {
    ref: stageRef,
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#0a0a0a',
      fontFamily: 'Inter, system-ui, sans-serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: canvasRef,
    style: {
      width,
      height,
      background,
      position: 'relative',
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      flexShrink: 0,
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(TimelineContext.Provider, {
    value: ctxValue
  }, children))), /*#__PURE__*/React.createElement(PlaybackBar, {
    time: displayTime,
    actualTime: time,
    duration: duration,
    playing: playing,
    onPlayPause: () => setPlaying(p => !p),
    onReset: () => {
      setTime(0);
    },
    onSeek: t => setTime(t),
    onHover: t => setHoverTime(t)
  }));
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({
  time,
  duration,
  playing,
  onPlayPause,
  onReset,
  onSeek,
  onHover
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback(e => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);
  const onTrackMove = e => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };
  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };
  const onTrackDown = e => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = e => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? time / duration * 100 : 0;
  const fmt = t => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor(total * 100 % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    onClick: onReset,
    title: "Return to start (0)"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 2v10M12 2L5 7l7 5V2z",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement(IconButton, {
    onClick: onPlayPause,
    title: "Play/pause (space)"
  }, playing ? /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 2l9 5-9 5V2z",
    fill: "currentColor"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'right',
      color: '#f6f4ef'
    }
  }, fmt(time)), /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    onMouseMove: onTrackMove,
    onMouseLeave: onTrackLeave,
    onMouseDown: onTrackDown,
    style: {
      flex: 1,
      height: 22,
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 4,
      background: 'rgba(255,255,255,0.12)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      width: `${pct}%`,
      height: 4,
      background: 'oklch(72% 0.12 250)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `${pct}%`,
      top: '50%',
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      background: '#fff',
      borderRadius: 6,
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'left',
      color: 'rgba(246,244,239,0.55)'
    }
  }, fmt(duration)));
}
function IconButton({
  children,
  onClick,
  title
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    title: title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      color: '#f6f4ef',
      cursor: 'pointer',
      padding: 0,
      transition: 'background 120ms'
    }
  }, children);
}
Object.assign(window, {
  Easing,
  interpolate,
  animate,
  clamp,
  TimelineContext,
  useTime,
  useTimeline,
  Sprite,
  SpriteContext,
  useSprite,
  TextSprite,
  ImageSprite,
  RectSprite,
  Stage,
  PlaybackBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "animations.jsx", error: String((e && e.message) || e) }); }

// assets/_gen/appicon.js
try { (() => {
// Naevyr PWA + NOTIFICATION ICONS — eval after pixlib.js + fxlogo.js
// (reuses emblemGrid / scaleGrid — the DRIFTS/Naevyr emblem). Pixel art is
// authored at a small NATIVE grid; each export's SVG carries the native viewBox
// but is sized to the exact target px (512/192/96) so PNG rasterization is crisp
// and the file stays tiny. No global outline (the emblem brings its own void).

// dark drift-stone field with central glow lift + vignette + a faint mote ring
function appField(W, H, glow) {
  const g = makeGrid(W, H);
  const cx = (W - 1) / 2,
    cy = (H - 1) / 2,
    maxd = Math.hypot(cx, cy);
  const st = RAMP.stone,
    dr = RAMP.drift;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy) / maxd; // 0 center → 1 corner
    let a, b, t;
    if (d > 0.62) {
      a = RAMP.void;
      b = st[3];
      t = (d - 0.62) / 0.38;
    } // outer vignette
    else if (d > 0.32) {
      a = st[3];
      b = st[2];
      t = (d - 0.32) / 0.30;
    } // body
    else {
      a = st[2];
      b = glow ? '#2a2342' : st[2];
      t = d / 0.32;
    } // central drift-stone lift
    const dith = ((x >> 1) + (y >> 1)) % 2 === 0 ? t : t - 0.5; // 2px ordered dither
    P(g, x, y, dith > 0.5 ? a : b);
  }
  // faint drift motes orbiting the emblem
  const rng = mulberry(861);
  const moteN = Math.round(W * 0.5);
  for (let i = 0; i < moteN; i++) {
    const ang = rng() * Math.PI * 2,
      rr = (0.36 + rng() * 0.22) * maxd;
    P(g, Math.round(cx + Math.cos(ang) * rr), Math.round(cy + Math.sin(ang) * rr), rng() < 0.4 ? dr[1] : dr[2]);
  }
  return g;
}

// full-bleed standard icon (native 48×48): emblem ×2 centered on the field
function drawAppIcon() {
  const g = appField(48, 48, true);
  stamp(g, scaleGrid(emblemGrid(false), 2), 8, 8); // (48-32)/2 = 8
  return g;
}

// MASKABLE icon (native 56×56): same emblem, extra padding so it survives the
// Android safe-zone crop (emblem 32/56 ≈ 57% of the field, well inside 80%).
function drawAppIconMaskable() {
  const g = appField(56, 56, true);
  stamp(g, scaleGrid(emblemGrid(false), 2), 12, 12); // (56-32)/2 = 12
  return g;
}

// MONOCHROME notification badge (native 16×16): the emblem reduced to one flat
// white shape on transparent — the status bar tints it. No bg, no outline.
function drawNotifBadge() {
  const src = emblemGrid(true);
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (G(src, x, y)) P(g, x, y, '#ffffff');
  return g;
}

/* ============================ REGISTRY ============================
   native = authored grid (viewBox); out = exact px the SVG is sized to. */
const APPICON = {
  app_icon_512: {
    fn: drawAppIcon,
    native: [48, 48],
    out: [512, 512],
    purpose: 'any',
    frames: 1
  },
  app_icon_192: {
    fn: drawAppIcon,
    native: [48, 48],
    out: [192, 192],
    purpose: 'any',
    frames: 1
  },
  app_icon_maskable_512: {
    fn: drawAppIconMaskable,
    native: [56, 56],
    out: [512, 512],
    purpose: 'maskable',
    frames: 1
  },
  notif_badge: {
    fn: drawNotifBadge,
    native: [16, 16],
    out: [96, 96],
    purpose: 'monochrome',
    frames: 1,
    mono: true
  }
};
Object.assign(globalThis, {
  appField,
  drawAppIcon,
  drawAppIconMaskable,
  drawNotifBadge,
  APPICON
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/appicon.js", error: String((e && e.message) || e) }); }

// assets/_gen/arena.js
try { (() => {
// Naevyr — ARENA SET ("The Pit"). Eval after pixlib.js + tiles.js (+ walls.js
// for the W2 skew helpers). The Pit's duels float in the Drift's void: a torch-
// lit ring the corruption watches. Rect-grid, RAMP only, 1px void outline, dither
// never blur, deterministic. Iso 64×32 diamond floors; ring tiles at +32x,±16y.

/* ============================ ARENA FLOOR (64×36) ============================
   Packed blood-sand: warm dirt ramp base + ember-red accents; 3 seed variants
   + 1 blood-flecked variant. Reads under a violet vignette. */
function arenaFloor(variant, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const dt = RAMP.dirt,
    em = RAMP.ember,
    bl = RAMP.blood;
  const face = dt[1],
    hi = dt[0],
    sh = dt[2],
    dp = dt[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
    P(g, x, y, RAMP.void);
    break;
  }

  // packed-sand grain + warm ember-red flecks
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
    const h = hash2(x, y, seedN);
    if (h < 0.05) P(g, x, y, sh); // trodden grain
    else if (h < 0.075) P(g, x, y, hi); // lit grit
    else if (h < 0.088) P(g, x, y, em[2]); // faint ember-red warmth
    if (hash2(x, y, seedN + 5) < 0.012) P(g, x, y, dp); // raked groove
  }
  // raked concentric arcs (subtle, arena-swept)
  for (let y = 4; y < 30; y += 6) for (let x = rows[y].x0 + 2; x <= rows[y].x1 - 2; x++) if ((x + 2 * y) % 9 === 0) P(g, x, y, sh);
  if (variant === 'blood') {
    // dark dried spatter, dithered
    const rng = mulberry(seedN + 40);
    for (let s = 0; s < 5; s++) {
      const cxp = 14 + Math.floor(rng() * 36),
        cyp = 8 + Math.floor(rng() * 18),
        r = 2 + Math.floor(rng() * 4);
      for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
        const x = cxp + xx,
          y = cyp + yy;
        if (!inDiamond(rows, x, y) || y < 1) continue;
        const d = xx * xx + yy * yy;
        if (d <= r * r && (x + y) % 2 === 0) P(g, x, y, bl[3]);else if (d <= (r + 1) * (r + 1) && hash2(x, y, 41) < 0.4) P(g, x, y, bl[3]);
      }
      // a drip tail
      for (let k = 0; k < 4; k++) if (hash2(s, k, 42) < 0.6) P(g, cxp + k % 2, cyp + r + k, bl[3]);
    }
  }
  return g;
}

/* ============================ ARENA RING (32×72 segments) ====================
   Modular circular palisade in the skewed-segment style (tiles +32x,±16y).
   Bone-and-blackstone posts strung with iron chain. NO side void outline. */
function ringBottomY(side, x) {
  return side === 'ne' ? 55 + Math.round(x * 16 / 31) : 55 + Math.round((31 - x) * 16 / 31);
}
function ringP(g, side, x, hAbove, c) {
  const by = ringBottomY(side, x);
  P(g, x, by - hAbove, c);
}
function arenaRing(side, variant) {
  const g = makeGrid(32, 72);
  const st = RAMP.stone,
    bn = RAMP.bone,
    em = RAMP.ember,
    dr = RAMP.drift;
  const FACE = 44;
  // low blackstone kerb wall (continuous, periodic mod 32 so seams match)
  for (let x = 0; x < 32; x++) {
    for (let h = 0; h <= 12; h++) {
      let c = st[2];
      if (h >= 11) c = st[0]; // top lit lip
      else if (h <= 1) c = st[3]; // base shadow
      if (x % 8 < 1) c = st[3]; // block joints (periodic)
      if (hash2(x, h, 211) < 0.05) c = st[3];
      ringP(g, side, x, h, c);
    }
  }
  // posts every 16px: bone-capped blackstone
  const postXs = variant === 'b' ? [4, 20] : [0, 16];
  postXs.forEach(px => {
    for (let h = 12; h <= FACE; h++) {
      const w = 2;
      for (let o = -w; o <= w; o++) {
        const x = px + o;
        if (x < 0 || x > 31) continue;
        let c = st[1];
        if (o <= -w + 0) c = st[0];
        if (o >= w) c = st[3];
        if (hash2(x, h, 212) < 0.06) c = st[2];
        ringP(g, side, x, h, c);
      }
    }
    // bone skull/cap finial
    for (let o = -2; o <= 2; o++) for (let k = 0; k <= 3; k++) {
      const x = px + o;
      if (x < 0 || x > 31) continue;
      let c = bn[1];
      if (o <= -1) c = bn[0];
      if (o >= 1) c = bn[2];
      if (k === 0) c = bn[0];
      ringP(g, side, x, FACE + 1 + k, c);
    }
    ringP(g, side, px - 1, FACE + 2, RAMP.void);
    ringP(g, side, px + 1, FACE + 2, RAMP.void); // skull eye sockets
    if (variant === 'b') {
      ringP(g, side, px - 1, FACE + 2, em[1]);
      ringP(g, side, px + 1, FACE + 2, em[1]);
    } // lit watcher-skulls
  });
  // iron chain swag strung between the posts (catenary dip)
  const x0 = postXs[0],
    x1 = postXs[0] + 16;
  for (let x = x0; x <= Math.min(31, x1); x++) {
    const t = (x - x0) / 16;
    const dip = Math.round(Math.sin(t * Math.PI) * 5);
    const h = FACE - 4 - dip;
    ringP(g, side, x, h, x % 2 === 0 ? st[3] : st[0]); // chain links alternate
  }
  return g;
}

/* gate segment: fighters' entrance with a raised iron portcullis (32×72) */
function arenaGate(side) {
  const g = makeGrid(32, 72);
  const st = RAMP.stone,
    bn = RAMP.bone,
    em = RAMP.ember;
  const FACE = 48;
  // two heavy jambs framing a dark archway
  [3, 28].forEach(px => {
    for (let h = 0; h <= FACE; h++) for (let o = -2; o <= 2; o++) {
      const x = px + o;
      if (x < 0 || x > 31) continue;
      let c = st[1];
      if (o <= -2) c = st[0];
      if (o >= 2) c = st[3];
      if (h % 6 === 0) c = st[3];
      ringP(g, side, x, h, c);
    }
  });
  // dark archway void between jambs
  for (let x = 6; x <= 25; x++) for (let h = 0; h <= FACE - 6; h++) {
    const arch = h > FACE - 14 ? Math.round(Math.sqrt(Math.max(0, 49 - (x - 15.5) * (x - 15.5)))) : 99;
    if (h < FACE - 6 - 0 && FACE - 6 - h < arch + 8) ringP(g, side, x, h, RAMP.void);
  }
  // lintel + bone trophy over the arch
  for (let x = 3; x <= 28; x++) ringP(g, side, x, FACE, st[2]);
  for (let x = 3; x <= 28; x++) ringP(g, side, x, FACE + 1, st[0]);
  for (let o = -2; o <= 2; o++) {
    ringP(g, side, 15 + o, FACE + 3, bn[1]);
  }
  ringP(g, side, 15, FACE + 4, bn[0]);
  ringP(g, side, 14, FACE + 3, RAMP.void);
  ringP(g, side, 16, FACE + 3, RAMP.void);
  // RAISED iron portcullis: bars pulled up into the lintel, fangs hanging down
  for (let x = 7; x <= 24; x += 3) for (let h = FACE - 6; h >= FACE - 11; h--) ringP(g, side, x, h, st[3]); // retracted bars
  for (let x = 7; x <= 24; x += 3) {
    ringP(g, side, x, FACE - 12, st[2]);
    ringP(g, side, x, FACE - 13, st[3]);
  } // fang tips
  for (let x = 6; x <= 25; x++) ringP(g, side, x, FACE - 6, st[3]); // portcullis rail
  // ember cresset on the left jamb
  ringP(g, side, 2, 30, em[2]);
  ringP(g, side, 2, 31, em[1]);
  ringP(g, side, 2, 32, em[0]);
  ringP(g, side, 1, 31, em[2]);
  return g;
}

/* ============================ ARENA TORCH (32×64, 3-frame flame) ============ */
function arenaTorch(frame) {
  const g = makeGrid(32, 64);
  const st = RAMP.stone,
    dt = RAMP.dirt,
    em = RAMP.ember,
    gd = RAMP.gold;
  const cx = 16,
    baseY = 60;
  // tripod legs
  [[-6, 0], [6, 0], [0, 2]].forEach(([dx, sk]) => {
    for (let k = 0; k < 16; k++) {
      const x = cx + Math.round(dx * (1 - k / 16)),
        y = baseY - k;
      P(g, x, y, st[2]);
      P(g, x, y + 1, st[3]);
    }
  });
  for (let x = cx - 7; x <= cx + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY + 1, RAMP.void); // ground contact
  // brazier bowl
  for (let j = 0; j < 7; j++) for (let i = -7 + j; i <= 7 - j; i++) {
    let c = st[1];
    if (i < -4) c = st[0];
    if (i > 4) c = st[3];
    if (j === 0) c = st[3];
    P(g, cx + i, baseY - 16 + j, c);
  }
  for (let i = -7; i <= 7; i++) P(g, cx + i, baseY - 17, st[3]); // rim
  for (let i = -5; i <= 5; i++) P(g, cx + i, baseY - 16, RAMP.void); // coals shadow
  // coals
  for (let i = -4; i <= 4; i++) if ((i + frame) % 2 === 0) P(g, cx + i, baseY - 16, em[2]);
  // FLAME (3-frame), strong + tall, the only light in the void
  const sway = [0, 1, -1][frame],
    tall = [0, 2, 1][frame];
  const fb = baseY - 17;
  for (let yy = 0; yy <= 22 + tall; yy++) {
    const t = yy / (22 + tall);
    const hw = Math.round((1 - t) * 6 * (1 - t * 0.25)) + (yy < 4 ? 1 : 0);
    const sx = cx + Math.round(Math.sin(yy * 0.45 + frame) * 1.3) + Math.round(sway * t * 2);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = em[1];
      if (Math.abs(xx) >= hw - 1) c = em[2];
      if (yy < 7 && Math.abs(xx) < 2) c = em[0];
      if (t > 0.78 && Math.abs(xx) <= 1) c = gd[0]; // white-hot tip
      P(g, sx + xx, fb - yy, c);
    }
  }
  // inner gold core
  for (let yy = 2; yy <= 12 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (13 + tall)) * 3));
    for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, fb - yy - 1, gd[0]);
  }
  // escaping spark
  if (frame !== 1) P(g, cx + sway * 2, fb - 26 - tall, em[0]);
  outline(g, RAMP.void);
  // strong glow pixels (outline-free, added after) — stepped ember halo into the void
  for (let yy = -20; yy <= 6; yy++) for (let xx = -14; xx <= 14; xx++) {
    const d = Math.abs(xx) + Math.abs(yy * 1.2);
    if (d > 8 && d < 13 && (xx + yy + frame) % 2 === 0) {
      const gy = fb - 8 + yy;
      if (gy > 4 && !G(g, cx + xx, gy)) P(g, cx + xx, gy, em[3]);
    }
  }
  return g;
}

/* ============================ WATCHER (32×40, wanderer-rig) =================== */
function arenaWatcher(variant, anim, f) {
  const g = makeGrid(32, 40);
  const ramp = variant === 'blood' ? RAMP.blood : variant === 'void' ? RAMP.stone : RAMP.bone;
  const dark = variant === 'void';
  const cx = 16,
    em = RAMP.ember;
  let bob = 0,
    armUp = 0;
  if (anim === 'idle') bob = f === 1 ? 1 : 0; // sway
  if (anim === 'cheer') armUp = f === 1 ? 1 : 0; // fist up on f1
  const top = 11 + bob,
    shoulderY = 19 + bob;

  // hooded cloak (rounded, faceless)
  for (let y = shoulderY; y <= 37; y++) {
    const t = (y - shoulderY) / (37 - shoulderY);
    const hw = Math.round(4 + t * 3);
    for (let x = cx - hw; x <= cx + hw; x++) {
      let c = dark ? RAMP.void : ramp[1];
      if (x <= cx - hw + 1) c = dark ? RAMP.stone[3] : ramp[0];
      if (x >= cx + hw - 1) c = dark ? '#0a0810' : ramp[2];
      if (!dark && hash2(x, y, 221) < 0.06) c = ramp[2];
      P(g, x, y, c);
    }
  }
  // hood dome
  for (let y = top; y <= shoulderY; y++) {
    const hy = (y - top) / (shoulderY - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.3) * Math.PI * 0.5) * 3.2);
    for (let x = cx - hw; x <= cx + hw; x++) {
      let c = dark ? RAMP.stone[3] : ramp[1];
      if (x === cx - hw) c = dark ? RAMP.stone[2] : ramp[0];
      if (x >= cx + hw - 1) c = '#0a0810';
      if (y === top) c = dark ? RAMP.stone[2] : ramp[0];
      P(g, x, y, c);
    }
  }
  P(g, cx, top - 1, dark ? RAMP.stone[2] : ramp[1]);
  // faceless void + ember eyes
  for (let y = top + 3; y <= top + 7; y++) for (let x = cx - 2; x <= cx + 2; x++) P(g, x, y, RAMP.void);
  const eyOn = !(anim === 'idle' && f === 1);
  P(g, cx - 1, top + 5, eyOn ? em[0] : em[2]);
  P(g, cx + 1, top + 5, eyOn ? em[0] : em[2]);
  // arms: resting, or fist raised on cheer f1
  if (anim === 'cheer' && armUp) {
    for (let k = 0; k < 8; k++) P(g, cx + 5, shoulderY + 2 - k, dark ? RAMP.stone[2] : ramp[2]); // raised arm
    fillRect(g, cx + 4, shoulderY - 7, 3, 3, dark ? RAMP.stone[1] : ramp[1]); // fist
  } else {
    P(g, cx - 5, shoulderY + 3, dark ? RAMP.stone[2] : ramp[2]);
    P(g, cx + 5, shoulderY + 3, dark ? RAMP.stone[2] : ramp[2]);
  }
  // hem
  for (let x = 0; x < 32; x++) {
    const v = G(g, x, 37);
    if (v) P(g, x, 37, dark ? '#0a0810' : ramp[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ VICTORY PLATE (96×48, 2-frame shimmer) ========= */
function victoryPlate(frame) {
  const g = makeGrid(96, 48);
  const gd = RAMP.gold,
    bn = RAMP.bone,
    vd = RAMP.void;
  const cx = 48,
    cy = 24;
  // floating gold plaque on void (no bg fill = transparent void)
  // laurel of finger-bones (two arcs)
  for (let s = -1; s <= 1; s += 2) {
    for (let a = 0; a < 11; a++) {
      const ang = Math.PI * (0.15 + a * 0.07);
      const x = Math.round(cx + s * Math.cos(ang) * 38),
        y = Math.round(cy + Math.sin(ang) * 20 - 0);
      // each bone: 2px with knuckle ends
      P(g, x, y, bn[1]);
      P(g, x, y + 1, bn[2]);
      P(g, x + s, y, bn[0]);
      if (a % 2 === 0) {
        P(g, x, y - 1, bn[0]);
      }
    }
  }
  // crossed blades (gold), X through the center
  for (let k = -16; k <= 16; k++) {
    // blade 1 (down-right)
    P(g, cx + k, cy + Math.round(k * 0.55), gd[1]);
    P(g, cx + k, cy + Math.round(k * 0.55) - 1, gd[0]);
    // blade 2 (down-left)
    P(g, cx - k, cy + Math.round(k * 0.55), gd[2]);
    P(g, cx - k, cy + Math.round(k * 0.55) - 1, gd[1]);
  }
  // hilts + pommels at the lower ends
  [[-16, 1], [16, -1]].forEach(([k, s]) => {
    const x = cx + k,
      y = cy + Math.round(Math.abs(k) * 0.55);
    fillRect(g, x - 1, y, 3, 2, gd[3]);
    P(g, x, y + 2, gd[2]);
  });
  // central boss gem (drift accent, the corruption watches)
  fillRect(g, cx - 2, cy - 2, 4, 4, gd[0]);
  P(g, cx, cy, RAMP.drift[1]);
  // shimmer sweep (frame-dependent diagonal highlight)
  const sweepX = frame ? cx + 14 : cx - 14;
  for (let yy = -10; yy <= 10; yy++) {
    const x = sweepX + Math.round(yy * 0.4);
    if (G(g, x, cy + yy)) P(g, x, cy + yy, RAMP.bone[0]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ BLOOD FX (48×24 decal, 3 variants) ============= */
function bloodFx(variant) {
  const g = makeGrid(48, 24);
  const bl = RAMP.blood;
  const rng = mulberry(300 + variant);
  const cx = 24,
    cy = 13;
  const blobs = variant === 0 ? 1 : variant === 1 ? 2 : 3;
  for (let b = 0; b < blobs; b++) {
    const bxp = cx + Math.round((rng() - 0.5) * 22),
      byp = cy + Math.round((rng() - 0.5) * 10),
      r = 3 + Math.floor(rng() * 4);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
      const x = bxp + xx,
        y = byp + Math.round(yy * 0.6);
      if (x < 0 || x > 47 || y < 0 || y > 23) continue;
      const d = xx * xx / ((r + 1) * (r + 1)) + yy * yy / (r * r);
      if (d <= 0.75) P(g, x, y, (x + y) % 3 === 0 ? bl[3] : bl[2]);else if (d <= 1.1 && (x + y) % 2 === 0) P(g, x, y, bl[3]); // dithered edge
    }
    // splatter droplets + a drip
    for (let s = 0; s < 5; s++) {
      const dx = bxp + Math.round((rng() - 0.5) * 16),
        dy = byp + Math.round((rng() - 0.5) * 9);
      if (dx >= 0 && dx < 48 && dy >= 0 && dy < 24) P(g, dx, dy, bl[3]);
    }
    for (let k = 0; k < 3; k++) if (rng() < 0.6) P(g, bxp + k % 2, Math.min(23, byp + r + k), bl[3]);
  }
  // NOTE: ground decal — no void outline (sits flush on sand)
  return g;
}
const ARENA = {
  floors: {
    fn: arenaFloor,
    cell: [64, 36],
    anchor: [32, 16],
    variants: ['a', 'b', 'c', 'blood']
  },
  ring: {
    fn: arenaRing,
    cell: [32, 72],
    anchor: [16, 55],
    note: 'tile +32x,±16y; no side outline',
    tiles: ['ne', 'nw'],
    variants: ['a', 'b']
  },
  gate: {
    fn: arenaGate,
    cell: [32, 72],
    anchor: [16, 55]
  },
  torch: {
    fn: arenaTorch,
    cell: [32, 64],
    anchor: [16, 60],
    frames: 3,
    fps: 4
  },
  watcher: {
    fn: arenaWatcher,
    cell: [32, 40],
    anchor: [16, 39],
    variants: ['bone', 'blood', 'void'],
    anims: [['idle', 2], ['cheer', 2]]
  },
  victory: {
    fn: victoryPlate,
    cell: [96, 48],
    anchor: [48, 24],
    frames: 2,
    fps: 3
  },
  blood: {
    fn: bloodFx,
    cell: [48, 24],
    anchor: [24, 12],
    variants: [0, 1, 2]
  }
};
Object.assign(globalThis, {
  arenaFloor,
  ringBottomY,
  ringP,
  arenaRing,
  arenaGate,
  arenaTorch,
  arenaWatcher,
  victoryPlate,
  bloodFx,
  ARENA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/arena.js", error: String((e && e.message) || e) }); }

// assets/_gen/auras.js
try { (() => {
// NAEVYR PRESTIGE AURAS — eval after pixlib.js + tiles.js (+ character.js for
// preview). Procedural orbiting-mote cosmetics baked per-frame around the
// wanderer (32×40, bottom-center anchor 16,39). Each aura canvas is 64×64 with
// its own bottom-center FEET anchor at (32,56): align that point to the
// wanderer's (16,39) anchor (engine offset = aura(32,56) over char(16,39)).
//
// Rules: rect-grid, dither not blur, RAMP ramps only, crispEdges. Particles/
// motes are outline-free glow (like ambient drift motes); only solid wisp forms
// get the 1px void outline. Frames emitted left-to-right (per-frame x offset).

const AURA_N = 64,
  AURA_CX = 32,
  AURA_FEET = 56,
  AURA_HEAD = 18;

// glow mote: optional plus-halo (dimmer) + core; outline-free
function gmote(g, x, y, core, halo) {
  x = Math.round(x);
  y = Math.round(y);
  if (halo) {
    P(g, x - 1, y, halo);
    P(g, x + 1, y, halo);
    P(g, x, y - 1, halo);
    P(g, x, y + 1, halo);
  }
  P(g, x, y, core);
}
// big premium mote: 2×2 core + diamond halo
function gmoteBig(g, x, y, core, hi, halo) {
  x = Math.round(x);
  y = Math.round(y);
  if (halo) {
    P(g, x - 2, y, halo);
    P(g, x + 2, y, halo);
    P(g, x, y - 2, halo);
    P(g, x, y + 2, halo);
    P(g, x - 1, y - 1, halo);
    P(g, x + 1, y - 1, halo);
    P(g, x - 1, y + 1, halo);
    P(g, x + 1, y + 1, halo);
  }
  P(g, x, y, core);
  P(g, x + 1, y, hi);
  P(g, x, y + 1, hi);
  P(g, x + 1, y + 1, hi);
}
// draw a solid form on a temp grid, 1px void outline, stamp onto dest
function solidOn(dest, drawFn) {
  const t = makeGrid(AURA_N, AURA_N);
  drawFn(t);
  outline(t, RAMP.void);
  stamp(dest, t, 0, 0);
}

/* ===================== 1 · ASHEN CROWN (gold + bone + ash) ===================== */
// A slow ring of drifting ash flecks hovering above/around the head, crowned by
// a faint gold arc. 8 frames, 6 fps.
function drawAshenCrown(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const gd = RAMP.gold,
    bn = RAMP.bone,
    ash = RAMP.ash;
  const cx = AURA_CX,
    cy = AURA_HEAD - 3,
    rx = 15,
    ry = 6;
  const fp = frame / 8;

  // floating crown arc (solid, outlined) — prongs riding a gentle curved band
  solidOn(g, t => {
    const span = 13;
    // curved band: y dips at the ends (a tiara arc over the head)
    for (let x = cx - span; x <= cx + span; x++) {
      const u = (x - cx) / span; // -1..1
      const yb = Math.round(cy + 2 + u * u * 3 + Math.sin(fp * Math.PI * 2 + x * 0.25) * 0.4);
      P(t, x, yb, gd[2]);
      if ((x - cx) % 4 === 0) P(t, x, yb - 1, gd[1]); // beaded highlights, not a solid rail
    }
    // five prongs of unequal height rising off the band
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * 6;
      const u = i / 2;
      const bandY = Math.round(cy + 2 + u * u * 3);
      const bob = Math.sin(fp * Math.PI * 2 + i) * 0.6;
      const h = i === 0 ? 6 : Math.abs(i) === 1 ? 4 : 3;
      for (let k = 0; k < h; k++) P(t, px, Math.round(bandY - 1 - k + bob), k === h - 1 ? gd[0] : gd[1]);
    }
  });
  // gem on the center prong
  gmote(g, cx, cy - 7 + Math.round(Math.sin(fp * Math.PI * 2) * 0.6), bn[0], gd[1]);

  // orbiting ash flecks (outline-free), slow drift, depth-dimmed on the far arc
  const M = 14;
  for (let i = 0; i < M; i++) {
    const ang = i / M * Math.PI * 2 + fp * Math.PI * 2 * 0.5;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry + Math.sin(fp * Math.PI * 2 + i) * 0.8;
    const far = Math.sin(ang) < -0.2; // upper/back arc
    const pick = i % 5;
    let c = pick === 0 ? gd[0] : pick === 1 ? bn[0] : pick === 2 ? bn[1] : pick === 3 ? gd[1] : ash;
    if (far) c = pick < 2 ? gd[2] : bn[3];
    if (i % 4 === frame % 4) gmote(g, x, y, c, far ? null : pick === 0 ? gd[2] : bn[3]);else P(g, Math.round(x), Math.round(y), c);
    // trailing ash speck
    if (!far && i % 3 === 0) P(g, Math.round(x - Math.cos(ang)), Math.round(y - Math.sin(ang)), ash);
  }
  return g;
}

/* =================== 2 · CORRUPTION HALO (drift ramp) =================== */
// A pulsing violet ring around the whole figure with motes spiraling inward —
// the player reads as a small Drift. 6 frames, 8 fps.
function drawCorruptionHalo(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const dr = RAMP.drift;
  const cx = AURA_CX,
    cy = 35,
    fp = frame / 6;
  const pulse = Math.sin(fp * Math.PI * 2);
  const rx = 17 + pulse * 2,
    ry = 9 + pulse;

  // the pulsing ring (dotted drift motes on an iso ellipse)
  const RING = 26;
  for (let i = 0; i < RING; i++) {
    const ang = i / RING * Math.PI * 2 + fp * Math.PI * 0.5;
    const x = cx + Math.cos(ang) * rx,
      y = cy + Math.sin(ang) * ry;
    const far = Math.sin(ang) < 0;
    if ((i + frame) % 2 === 0) {
      const bright = pulse > 0.4 && i % 4 === 0;
      gmote(g, x, y, far ? dr[3] : bright ? dr[0] : dr[2], far ? null : dr[4]);
    }
  }
  // motes spiraling INWARD toward the core
  const SP = 10;
  for (let i = 0; i < SP; i++) {
    const t = (frame + i * 0.6) % 6 / 6; // 0 outer .. 1 core
    const r = (1 - t) * 22 + 3;
    const ang = i / SP * Math.PI * 2 + t * Math.PI * 2.2;
    const x = cx + Math.cos(ang) * r,
      y = cy + Math.sin(ang) * r * 0.5;
    const c = t > 0.7 ? dr[0] : t > 0.4 ? dr[1] : dr[2];
    gmote(g, x, y, c, t > 0.5 ? dr[3] : null);
  }
  // pulsing core (the small Drift) at chest height
  const corec = pulse > 0 ? dr[0] : dr[1];
  gmoteBig(g, cx, cy - 1, corec, dr[1], dr[3]);
  if (pulse > 0.5) {
    P(g, cx, cy - 4, dr[2]);
    P(g, cx, cy + 2, dr[2]);
    P(g, cx - 3, cy - 1, dr[2]);
    P(g, cx + 3, cy - 1, dr[2]);
  }
  return g;
}

/* ===================== 3 · EMBER CINDER (ember + blood) ===================== */
// Rising ember sparks that swirl upward and fade to blood-ash. 6 frames, 8 fps.
function drawEmberCinder(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const em = RAMP.ember,
    bl = RAMP.blood;
  const cx = AURA_CX;
  const K = 16;
  for (let i = 0; i < K; i++) {
    const t = (frame + i * 1.7) % 6 / 6; // 0 born at feet .. 1 spent at top
    const y = AURA_FEET - 2 - t * 46;
    const swirl = Math.sin(t * Math.PI * 2 + i * 1.3) * (11 * (1 - t * 0.35));
    const x = cx + swirl + (i % 2 ? 1 : -1) * 2;
    if (t > 0.92) continue; // fade out at the crest
    let core, halo;
    if (t < 0.3) {
      core = em[0];
      halo = em[1];
    } // hot newborn spark
    else if (t < 0.6) {
      core = em[1];
      halo = em[2];
    } else {
      core = bl[1];
      halo = i % 2 ? bl[2] : em[3];
    } // cooling to blood-ash
    if (t < 0.25 && i % 3 === 0) gmoteBig(g, x, y, em[0], em[1], em[2]);else gmote(g, x, y, core, t < 0.7 && i % 2 === 0 ? halo : null);
    // upward trailing wisp
    if (t < 0.7) P(g, Math.round(x), Math.round(y + 1), t < 0.4 ? em[2] : bl[3]);
  }
  // a low ember glow at the feet (source)
  for (let x = cx - 5; x <= cx + 5; x++) if ((x + frame) % 2 === 0) P(g, x, AURA_FEET, x % 3 ? em[3] : em[2]);
  return g;
}

/* ======================== 4 · BONEWISP (bone ramp) ======================== */
// Pale skeletal wisps orbiting low around the feet/legs — eerie and cold.
// 8 frames, 6 fps.
function drawBonewisp(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const bn = RAMP.bone,
    dr = RAMP.drift;
  const cx = AURA_CX,
    cy = 49,
    rx = 15,
    ry = 5,
    fp = frame / 8;
  const W = 5;
  // back wisps first (drawn dimmer), then front
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < W; i++) {
      const ang = i / W * Math.PI * 2 + fp * Math.PI * 2;
      const far = Math.sin(ang) < 0;
      if (pass === 0 !== far) continue;
      const x = cx + Math.cos(ang) * rx;
      const y = cy + Math.sin(ang) * ry;
      const flick = Math.sin(fp * Math.PI * 2 * 2 + i) > 0 ? 1 : 0;
      // small flame/comma wisp, solid + void outline
      solidOn(g, t => {
        const tip = far ? bn[2] : bn[0],
          body = far ? bn[3] : bn[1],
          base = bn[3];
        P(t, Math.round(x), Math.round(y - 2 - flick), tip);
        P(t, Math.round(x), Math.round(y - 1), body);
        P(t, Math.round(x), Math.round(y), body);
        P(t, Math.round(x + (i % 2 ? 1 : -1)), Math.round(y), base);
        P(t, Math.round(x), Math.round(y + 1), base);
      });
      // cold drift glint in the wisp's eye-hollow (sparingly)
      if (!far && i === frame % W) P(g, Math.round(x), Math.round(y - 1), dr[1]);
      // trailing cold spark
      if (!far) gmote(g, x - Math.cos(ang) * 2, y - Math.sin(ang) * 2, bn[2], null);
    }
  }
  // faint ground mist ring at the feet
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + fp * Math.PI;
    const x = cx + Math.cos(a) * (rx - 2);
    const y = cy + 3 + Math.sin(a) * (ry - 1);
    if ((i + frame) % 2 === 0) P(g, Math.round(x), Math.round(y), bn[3]);
  }
  return g;
}
const AURAS = {
  ashen_crown: {
    fn: drawAshenCrown,
    frames: 8,
    fps: 6,
    ramp: 'gold + bone + ash',
    desc: 'Slow ring of drifting ash flecks crowning the head.'
  },
  corruption_halo: {
    fn: drawCorruptionHalo,
    frames: 6,
    fps: 8,
    ramp: 'drift',
    desc: 'Pulsing violet ring with motes spiraling inward; the player as a small Drift.'
  },
  ember_cinder: {
    fn: drawEmberCinder,
    frames: 6,
    fps: 8,
    ramp: 'ember + blood',
    desc: 'Rising ember sparks swirling upward, cooling to blood-ash.'
  },
  bonewisp: {
    fn: drawBonewisp,
    frames: 8,
    fps: 6,
    ramp: 'bone',
    desc: 'Pale skeletal wisps orbiting low around the feet; eerie and cold.'
  }
};
Object.assign(globalThis, {
  AURA_N,
  AURA_CX,
  AURA_FEET,
  AURA_HEAD,
  gmote,
  gmoteBig,
  solidOn,
  drawAshenCrown,
  drawCorruptionHalo,
  drawEmberCinder,
  drawBonewisp,
  AURAS,
  solidOn
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/auras.js", error: String((e && e.message) || e) }); }

// assets/_gen/avatars.js
try { (() => {
// Naevyr — PREMIUM AVATAR SET. Eval after pixlib.js + tiles.js (+ character.js
// for preview/scale). Four cosmetic player characters, DROP-IN COMPATIBLE with
// the wanderer rig: 32×40 cell, feet row y=37, 5 facings (s,se,e,ne,n; engine
// mirrors w/sw/nw), anims idle 2f · walk 6f · swing 4f, sheet rows=facings,
// cols=12 (idle0-1, walk0-5, swing0-3). Shoulder line y=18(+bob), swing hand
// pivot (cx+off+4, shoulderY+2), arc [-2.1,-1.35,-0.45,0.35], hit spark on f2,
// walk bob [0,-1,0,0,-1,0], idle-f1 secondary tell. RAMP only, 1px void outline.

const AV_RAMP = {
  ember: RAMP.ember,
  gold: RAMP.gold,
  blood: RAMP.blood,
  drift: RAMP.drift,
  bone: RAMP.bone,
  stone: RAMP.stone,
  dirt: RAMP.dirt,
  grass: RAMP.grass,
  water: RAMP.water
};

// two cosmetic channels per character; each option names a locked ramp.
const AVATAR_CHANNELS = {
  ashbound: {
    seam: ['ember', 'gold', 'blood', 'drift', 'bone'],
    wrap: ['stone', 'dirt', 'blood', 'bone', 'drift']
  },
  mireborn: {
    flame: ['ember', 'drift', 'gold', 'water', 'blood'],
    shawl: ['grass', 'dirt', 'stone', 'water', 'bone']
  },
  bonecaller: {
    socket: ['drift', 'ember', 'gold', 'blood', 'water'],
    mantle: ['bone', 'stone', 'gold', 'dirt', 'blood']
  },
  veilborn: {
    veil: ['stone', 'drift', 'blood', 'water', 'bone'],
    mote: ['drift', 'ember', 'gold', 'water', 'blood']
  }
};
const AVATAR_KINDS = ['ashbound', 'mireborn', 'bonecaller', 'veilborn'];

// resolve a look {a,b} (ramp-name keys, or indices) to the two channel ramps
function resolveLook(kind, look) {
  look = look || {};
  const ch = AVATAR_CHANNELS[kind];
  const names = Object.keys(ch);
  function pick(chanName, v) {
    const opts = ch[chanName];
    if (v == null) return AV_RAMP[opts[0]];
    if (typeof v === 'number') return AV_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    if (AV_RAMP[v]) return AV_RAMP[v];
    return AV_RAMP[opts[0]];
  }
  return {
    rA: pick(names[0], look.a),
    rB: pick(names[1], look.b),
    names
  };
}
const AV_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const AV_ANIMS = [['idle', 2], ['walk', 6], ['swing', 4]];

// shared rig scalars for a frame
function rig(facing, anim, f) {
  const cx = 16;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const off = [0, 1, 2, 1, 0][dir];
  const showFace = dir <= 2;
  const back = dir >= 3;
  let bob = 0,
    step = 0,
    hemSway = 0;
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    step = [2, 1, 0, -2, -1, 0][f];
    hemSway = [0, 1, 1, 0, -1, -1][f];
  }
  if (anim === 'idle') {
    hemSway = f === 1 ? 1 : 0;
  }
  return {
    cx,
    dir,
    off,
    showFace,
    back,
    bob,
    step,
    hemSway,
    top: 9 + bob,
    shoulderY: 18 + bob
  };
}

// shared two-foot draw (skip for veilborn). soleRamp solid, toe void.
function drawFeet(g, R, soleRamp, kind, extraStomp) {
  const footY = 37 + (extraStomp || 0);
  const fo = R.dir >= 1 ? 1 : 0;
  // left foot
  P(g, R.cx - 3 + fo + R.step, footY, soleRamp[3]);
  P(g, R.cx - 2 + fo + R.step, footY, RAMP.void);
  P(g, R.cx - 3 + fo + R.step, footY - 1, soleRamp[2]);
  // right foot
  P(g, R.cx + 2 + fo - R.step, footY, RAMP.void);
  P(g, R.cx + 3 + fo - R.step, footY, soleRamp[3]);
  P(g, R.cx + 3 + fo - R.step, footY - 1, soleRamp[2]);
}

// shared swing arm; toolFn(g, ex, ey, f) paints the per-kind weapon head/haft.
function drawSwingArm(g, R, anim, f, armRamp, toolFn) {
  if (anim !== 'swing') return;
  const hx = R.cx + R.off + 4,
    hy = R.shoulderY + 2;
  const ang = [-2.1, -1.35, -0.45, 0.35][f];
  for (let k = 2; k < 8; k++) {
    const x = Math.round(hx + Math.cos(ang) * k),
      y = Math.round(hy + Math.sin(ang) * k);
    P(g, x, y, k < 4 ? armRamp[2] : RAMP.dirt[0]); // sleeve/forearm → haft start
  }
  const ex = Math.round(hx + Math.cos(ang) * 8),
    ey = Math.round(hy + Math.sin(ang) * 8);
  toolFn(g, ex, ey, f);
}

/* ===================================================================== */
/* 1 · THE ASHBOUND — burned penitent. Broad, no hood, topknot, ember    */
/*     seams through ash-grey skin, chest straps.                        */
/* ===================================================================== */
function bodyAshbound(g, R, anim, f, seam, wrap) {
  const sk = RAMP.bone; // ash-grey skin = bone-ramp greys (mids/darks)
  const {
    cx,
    off,
    dir,
    top,
    shoulderY
  } = R;
  const flare = anim === 'idle' && f === 1; // ember seam flares on idle f1

  // broad torso (widest of the set)
  for (let y = shoulderY; y <= 31; y++) {
    const t = (y - shoulderY) / (31 - shoulderY);
    const halfw = Math.round(5 + (1 - t) * 3); // 8 at shoulders → 5 at waist
    const cxx = cx + Math.round(off * 0.5);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = sk[2];
      if (x <= cxx - halfw + 1) c = sk[1]; // moonlit
      if (x >= cxx + halfw - 1) c = sk[3]; // shadow
      if (hash2(x, y, 71) < 0.10) c = sk[3]; // scars/soot
      P(g, x, y, c);
    }
  }
  // cracked ember seams glowing through (vertical-ish, dithered)
  const seamPts = [[-3, 21], [2, 24], [-1, 27], [4, 22], [-4, 29], [1, 30]];
  seamPts.forEach((p, i) => {
    const x = cx + Math.round(off * 0.5) + p[0],
      y = p[1];
    P(g, x, y, flare ? seam[0] : seam[1]);
    if (flare) {
      P(g, x, y - 1, seam[2]);
      P(g, x + 1, y, seam[2]);
    } else P(g, x, y + 1, seam[3]);
  });
  // chest straps (wrap ramp), crossing — symmetric so it mirrors clean
  for (let k = 0; k <= 9; k++) {
    const y = shoulderY + 1 + k;
    P(g, cx + off - 4 + k, y, wrap[1]);
    P(g, cx + off + 4 - k, y, wrap[2]);
  }
  for (let x = cx + off - 5; x <= cx + off + 5; x++) P(g, x, 31, wrap[3]); // belt
  // bare scarred arms (shoulders bulge out)
  [[-1, sk[1]], [1, sk[3]]].forEach(([s, c]) => {
    const ax = cx + off + s * 7;
    for (let y = shoulderY + 1; y <= 28; y++) {
      P(g, ax, y, c);
      P(g, ax - s, y, sk[2]);
      if (hash2(ax, y, 72) < 0.12) P(g, ax, y, seam[3]);
    }
  });
  // head (no hood), heavy brow
  for (let y = top + 1; y <= shoulderY; y++) {
    const hw = y < top + 4 ? 3 : 4;
    for (let x = cx + off - hw; x <= cx + off + hw; x++) {
      let c = sk[2];
      if (x < cx + off - hw + 1) c = sk[1];
      if (x > cx + off + hw - 1) c = sk[3];
      P(g, x, y, c);
    }
  }
  // short brutal topknot (spike up + bound base)
  P(g, cx + off, top - 2, sk[3]);
  P(g, cx + off, top - 1, sk[2]);
  P(g, cx + off, top, sk[1]);
  P(g, cx + off - 1, top, wrap[3]);
  P(g, cx + off + 1, top, wrap[3]); // hair tie
  // face: ember eyes + grim mouth
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0);
    const ey = top + 5;
    P(g, fcx - 2, ey, seam[1]);
    P(g, fcx + 2, ey, flare ? seam[0] : seam[1]);
    for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, top + 8, sk[3]); // jaw shadow
  }
}
function toolAshbound(g, ex, ey, f) {
  // haymaker fist (no haft)
  const sk = RAMP.bone;
  fillRect(g, ex - 1, ey - 1, 3, 3, sk[2]);
  P(g, ex, ey - 1, sk[1]);
  P(g, ex - 1, ey, RAMP.ember[2]);
  P(g, ex + 1, ey, RAMP.ember[2]); // ember knuckles
  if (f === 2) {
    P(g, ex + 2, ey - 1, RAMP.ember[0]);
    P(g, ex + 3, ey, RAMP.ember[1]);
    P(g, ex + 2, ey + 1, RAMP.gold[0]);
  }
}

/* ===================================================================== */
/* 2 · THE MIREBORN — bog seer. Lean, hunched, reed shawl + wet hem,     */
/*     belt bone-charm lantern (sways/gutters), root-staff swing.        */
/* ===================================================================== */
function bodyMireborn(g, R, anim, f, flame, shawl) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    hemSway
  } = R;
  const gutter = anim === 'idle' && f === 1;
  const hunch = 1; // pushed-forward head

  // reed shawl: rounded dome over hunched shoulders → trailing wet hem
  for (let y = shoulderY - 1; y <= 37; y++) {
    const t = (y - (shoulderY - 1)) / (37 - (shoulderY - 1));
    const halfw = Math.round(3.4 + t * 3.0 + (y > 33 ? 1 : 0));
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.6) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = shawl[1];
      if (x <= cxx - halfw + 1) c = shawl[0];
      if (x >= cxx + halfw - 1) c = shawl[2];
      // reed weave texture (diagonal dashes)
      if ((x + 2 * y) % 5 === 0) c = shawl[2];
      if (hash2(x, y, 81) < 0.05) c = shawl[3];
      P(g, x, y, c);
    }
  }
  // wet hem: darker, dripping
  for (let x = 0; x < 32; x++) {
    const v = G(g, x, 37);
    if (v) {
      P(g, x, 37, shawl[3]);
      if (hash2(x, 0, 82) < 0.3 && G(g, x, 36)) P(g, x, 36, shawl[3]);
    }
  }
  // hunched head (forward/down), cowl peak low
  const hy0 = top + hunch;
  for (let y = hy0; y <= shoulderY; y++) {
    const hw = 3;
    const hcx = cx + off + (dir <= 2 ? 1 : 0);
    for (let x = hcx - hw; x <= hcx + hw; x++) {
      let c = shawl[1];
      if (x < hcx - hw + 1) c = shawl[0];
      if (x > hcx + hw - 1) c = shawl[2];
      if (y === hy0) c = shawl[2];
      P(g, x, y, c);
    }
  }
  // face in shadow + pale seer eyes (flame-tinted)
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : 1);
    const ey = hy0 + 5;
    for (let y = hy0 + 3; y <= hy0 + 7; y++) for (let x = fcx - 2; x <= fcx + 1; x++) P(g, x, y, RAMP.void);
    P(g, fcx - 1, ey, gutter ? flame[2] : flame[1]);
    P(g, fcx + 1, ey, gutter ? flame[3] : flame[0]);
  }
  // belt bone-charm lantern hanging front, sways on walk / gutters on idle f1
  const lsw = anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0;
  const lx = cx + off - 4 + lsw,
    ly = 30;
  P(g, lx, ly - 1, RAMP.bone[2]); // hook/charm
  for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) {
    let c = RAMP.bone[3];
    if (i === 0 && j > 0 && j < 3) c = gutter ? flame[2] : flame[1];
    P(g, lx + i, ly + j, c);
  }
  P(g, lx, ly + 1, gutter ? flame[0] : flame[1]); // flame core
  if (!gutter) P(g, lx, ly - 0, flame[0]);
}
function toolMireborn(g, ex, ey, f) {
  // crooked root-staff (longer, gnarled)
  const dt = RAMP.dirt;
  // the haft is drawn by drawSwingArm; add a gnarled root knob + side roots
  fillRect(g, ex - 1, ey - 1, 2, 3, dt[1]);
  P(g, ex, ey - 2, dt[2]);
  P(g, ex + 1, ey - 1, dt[3]);
  P(g, ex - 2, ey, dt[2]);
  P(g, ex + 1, ey + 1, dt[3]); // twisted roots
  if (f === 2) {
    P(g, ex + 2, ey - 1, RAMP.drift[0]);
    P(g, ex + 2, ey, RAMP.ember[1]);
    P(g, ex + 3, ey, RAMP.drift[1]);
  }
}

/* ===================================================================== */
/* 3 · THE BONECALLER — ossuary priest. Tall narrow, beast-skull mask    */
/*     (sockets glow), hanging-bone mantle (sways opp. hem), bandage arms.*/
/* ===================================================================== */
function bodyBonecaller(g, R, anim, f, socket, mantle) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    hemSway
  } = R;
  const robe = RAMP.stone;
  const click = anim === 'idle' && f === 1; // one hanging bone clicks (1px shift)

  // narrow tall robe
  for (let y = shoulderY; y <= 37; y++) {
    const t = (y - shoulderY) / (37 - shoulderY);
    const halfw = Math.round(2.8 + t * 2.6);
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = robe[1];
      if (x <= cxx - halfw + 1) c = robe[0];
      if (x >= cxx + halfw - 1) c = robe[3];
      if (hash2(x, y, 91) < 0.05) c = robe[2];
      P(g, x, y, c);
    }
  }
  // bone mantle: small bones hanging from the shoulders, sway OPPOSITE the hem
  const msw = anim === 'walk' ? -[0, 1, 1, 0, -1, -1][f] : 0;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const bx = cx + off + i * 2 + (Math.abs(i) > 1 ? msw : 0);
    const len = 3 - (Math.abs(i) === 3 ? 1 : 0);
    const clickShift = click && i === 2 ? 1 : 0;
    for (let j = 0; j < len; j++) P(g, bx, shoulderY + 1 + j + clickShift, j === len - 1 ? mantle[0] : mantle[1]);
    P(g, bx, shoulderY + 1 + len + clickShift, mantle[3]); // bead/knot tip
  }
  // bandage-wrapped arms (thin, at sides)
  [[-1, robe[0]], [1, robe[3]]].forEach(([s, c]) => {
    const ax = cx + off + s * 4;
    for (let y = shoulderY + 2; y <= 30; y++) {
      P(g, ax, y, c);
      if (y % 2 === 0) P(g, ax, y, RAMP.bone[2]);
    } // wrap stripes
  });
  // tall beast-skull half-mask head
  const hy0 = top - 1;
  for (let y = hy0; y <= shoulderY; y++) {
    const hw = y < hy0 + 3 ? 2 : 3;
    const hcx = cx + off;
    for (let x = hcx - hw; x <= hcx + hw; x++) {
      let c = mantle[1];
      if (x < hcx - hw + 1) c = mantle[0];
      if (x > hcx + hw - 1) c = mantle[2];
      P(g, x, y, c);
    }
  }
  // skull snout juts forward (toward facing) for profile silhouette
  if (dir >= 1) {
    P(g, cx + off + 3, top + 3, mantle[1]);
    P(g, cx + off + 4, top + 3, mantle[2]);
    P(g, cx + off + 3, top + 4, mantle[3]);
  }
  // horns
  P(g, cx + off - 2, hy0 - 1, mantle[2]);
  P(g, cx + off + 2, hy0 - 1, mantle[2]);
  P(g, cx + off - 2, hy0 - 2, mantle[3]);
  P(g, cx + off + 2, hy0 - 2, mantle[3]);
  // glowing eye sockets
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0);
    const ey = top + 3;
    for (let y = ey - 1; y <= ey + 1; y++) {
      P(g, fcx - 2, y, RAMP.void);
      P(g, fcx + 2, y, RAMP.void);
    }
    P(g, fcx - 2, ey, socket[0]);
    P(g, fcx + 2, ey, socket[0]);
    P(g, fcx - 2, ey + 1, socket[1]);
    P(g, fcx + 2, ey + 1, socket[1]);
  }
}
function toolBonecaller(g, ex, ey, f) {
  // ritual bone wand; spark bone-white then ember
  const bn = RAMP.bone;
  fillRect(g, ex - 1, ey - 1, 2, 3, bn[1]);
  P(g, ex, ey - 2, bn[0]);
  P(g, ex + 1, ey, bn[3]);
  if (f === 2) {
    P(g, ex + 2, ey - 1, bn[0]);
    P(g, ex + 3, ey, bn[0]);
    P(g, ex + 2, ey + 1, RAMP.ember[1]);
    P(g, ex + 3, ey + 1, RAMP.ember[0]);
  }
}

/* ===================================================================== */
/* 4 · THE VEILBORN — one the Drift gave back. Weightless: feet replaced  */
/*     by a drift-mote gap, layered veil, afterimage on walk.            */
/* ===================================================================== */
function bodyVeilborn(g, R, anim, f, veil, mote) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    hemSway,
    step
  } = R;
  const detach = anim === 'idle' && f === 1;

  // afterimage trail on walk (faint veil pixels offset behind motion)
  if (anim === 'walk' && (f === 1 || f === 4)) {
    const tdir = f === 1 ? -1 : 1;
    for (let y = shoulderY + 2; y <= 30; y += 2) P(g, cx + off + tdir * 4, y, veil[3]);
  }
  // layered veil: scalloped tiers, hem floats (stops ~y34, never touches ground)
  for (let y = shoulderY; y <= 34; y++) {
    const t = (y - shoulderY) / (34 - shoulderY);
    const halfw = Math.round(3.2 + t * 3.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 28 ? Math.round(hemSway * 0.7) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = veil[1];
      if (x <= cxx - halfw + 1) c = veil[0];
      if (x >= cxx + halfw - 1) c = veil[2];
      // translucent dither holes (weightless, wrong)
      if (hash2(x, y, 101) < 0.10) continue;
      // scallop tier lines
      if ((y - shoulderY) % 5 === 0) c = veil[2];
      P(g, x, y, c);
    }
  }
  // ragged floating hem (scalloped bottom, drift-tinted)
  for (let x = cx + off - 6; x <= cx + off + 6; x++) {
    const s = Math.sin((x - cx) * 0.9 + hemSway);
    if (s > 0.2) {
      const y = 34 - Math.round(s);
      if (G(g, x, y - 1)) {
        P(g, x, y, veil[2]);
        P(g, x, y + 1, mote[3]);
      }
    }
  }
  // veil head (no face, just a hollow with mote eyes)
  for (let y = top; y <= shoulderY; y++) {
    const hw = 3;
    const hcx = cx + off;
    for (let x = hcx - hw; x <= hcx + hw; x++) {
      if (hash2(x, y, 102) < 0.10) continue;
      let c = veil[1];
      if (x < hcx - hw + 1) c = veil[0];
      if (x > hcx + hw - 1) c = veil[2];
      if (y === top) c = veil[2];
      P(g, x, y, c);
    }
  }
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0);
    const ey = top + 5;
    P(g, fcx - 1, ey, mote[0]);
    P(g, fcx + 1, ey, mote[1]);
  }
  // drift-mote gap where feet would be (weightless) — replaces drawFeet
  const gy = 36,
    fo = R.dir >= 1 ? 1 : 0;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + f;
    const x = Math.round(cx + off + Math.cos(a) * 3 - step * 0.5),
      y = Math.round(gy + Math.sin(a) * 1.2);
    P(g, x, y, i % 2 ? mote[1] : mote[2]);
  }
  P(g, cx + off, 37, mote[3]);
  // idle f1: a mote detaches and rises
  if (detach) {
    P(g, cx + off + 5, top + 1, mote[0]);
    P(g, cx + off + 5, top, mote[1]);
  }
}
function toolVeilborn(g, ex, ey, f, mote) {
  // drift shard + smear behind arm
  const dr = mote || RAMP.drift;
  fillRect(g, ex - 1, ey - 1, 2, 2, dr[1]);
  P(g, ex, ey - 2, dr[0]);
  // smear trail behind the arc
  P(g, ex - 2, ey + 1, dr[3]);
  P(g, ex - 3, ey + 2, dr[3]);
  if (f === 2) {
    P(g, ex + 2, ey - 1, dr[0]);
    P(g, ex + 2, ey, dr[1]);
    P(g, ex + 3, ey, dr[2]);
  }
}

/* ===================== dispatcher ===================== */
function drawAvatar(kind, facing, anim, f, look) {
  const g = makeGrid(32, 40);
  const R = rig(facing, anim, f);
  const {
    rA,
    rB
  } = resolveLook(kind, look);
  if (kind === 'ashbound') {
    const stomp = anim === 'walk' && (f === 1 || f === 4) ? 1 : 0;
    bodyAshbound(g, R, anim, f, rA, rB);
    drawFeet(g, R, rB, kind, stomp);
    drawSwingArm(g, R, anim, f, RAMP.bone, toolAshbound);
  } else if (kind === 'mireborn') {
    bodyMireborn(g, R, anim, f, rA, rB);
    drawFeet(g, R, rB, kind, 0);
    drawSwingArm(g, R, anim, f, rB, toolMireborn);
  } else if (kind === 'bonecaller') {
    bodyBonecaller(g, R, anim, f, rA, rB);
    drawFeet(g, R, RAMP.stone, kind, 0);
    drawSwingArm(g, R, anim, f, RAMP.stone, toolBonecaller);
  } else if (kind === 'veilborn') {
    bodyVeilborn(g, R, anim, f, rA, rB); // draws its own mote "feet"
    drawSwingArm(g, R, anim, f, rA, (gg, ex, ey, ff) => toolVeilborn(gg, ex, ey, ff, rB));
  }
  outline(g, RAMP.void);
  // post-outline glow accents (kept outline-free) per kind on idle f1
  return g;
}
function avatarSheetGrids(kind, look) {
  return AV_FACINGS.map(fc => {
    const row = [];
    AV_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(drawAvatar(kind, fc, anim, f, look));
    });
    return row;
  });
}

/* ===================== shop portrait (48×64 bust, s-facing, 2f idle) ===================== */
function drawAvatarPortrait(kind, f, look) {
  const g = makeGrid(48, 64);
  const {
    rA,
    rB
  } = resolveLook(kind, look);
  const cx = 24,
    top = 10;
  // draw the s-facing idle body large by scaling the head/shoulders region:
  // simplest reliable route — render the 32×40 idle frame and 1.5×-ish place bust.
  const src = drawAvatar(kind, 's', 'idle', f || 0, look);
  // bust crop: take src rows ~6..26 (head+shoulders) and 2× scale into the portrait
  for (let y = 6; y <= 27; y++) for (let x = 4; x <= 27; x++) {
    const v = G(src, x, y);
    if (!v) continue;
    const px = cx - 24 + (x - 4) * 2,
      py = top + (y - 6) * 2;
    fillRect(g, px, py, 2, 2, v.c);
  }
  // pedestal shadow + frame hint
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}
const AVATARS = {
  ashbound: {
    ramp: 'bone(ash) + ember + dirt',
    channels: AVATAR_CHANNELS.ashbound
  },
  mireborn: {
    ramp: 'grass/stone(shawl) + ember(flame)',
    channels: AVATAR_CHANNELS.mireborn
  },
  bonecaller: {
    ramp: 'stone(robe) + bone(mantle) + drift(socket)',
    channels: AVATAR_CHANNELS.bonecaller
  },
  veilborn: {
    ramp: 'stone/drift(veil) + drift(mote)',
    channels: AVATAR_CHANNELS.veilborn
  }
};
Object.assign(globalThis, {
  AV_RAMP,
  AVATAR_CHANNELS,
  AVATAR_KINDS,
  AV_FACINGS,
  AV_ANIMS,
  resolveLook,
  rig,
  drawFeet,
  drawSwingArm,
  drawAvatar,
  avatarSheetGrids,
  drawAvatarPortrait,
  AVATARS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/avatars.js", error: String((e && e.message) || e) }); }

// assets/_gen/battlepass.js
try { (() => {
// NAEVYR — BATTLE PASS "ASHFALL" (Season 1). Eval after pixlib.js + tiles.js
// (hash2) + character.js (drawWanderer/WANDER_FACINGS/WANDER_ANIMS) and, for the
// aura preview, after auras.js (gmote/gmoteBig/solidOn/AURA_* helpers).
//
// Season-exclusive, ornate, gilded-but-corrupted cosmetics:
//   1. tarnished_chalice  — a 64×64 prestige AURA (auras.js conventions). A small
//      generic two-handled trophy cup hovering above the wanderer: gilded (gold
//      ramp) but pitted & rot-eaten at the rim with the Drift (drift ramp) creeping
//      in; its DETACHED LID slowly orbits the head while gilded motes rise from the
//      feet. 3-frame loop @4fps. anchor 32,56 aligns to the wanderer's 16,39.
//   2. ashfall_dye        — a wanderer CLOAK COLORWAY delivered as the existing
//      dye-channel ramp swap (locked-ramp names, baked at draw time, no new rig):
//      ash-grey base + banded gold trim + faint drift-purple corruption at the hem.
//   3. pass_emblem        — a 32×32 pixel sigil (+ -mono bone variant) reading as a
//      "seasonal ledger": a gilded chalice mark over a furled parchment banner with
//      drift-corruption flecks. For panel headers / docs.
//
// Rules (locked): RAMP ramps only; 1px void outline on solid forms; particles/
// motes are outline-free glow; dither, never blur; crispEdges; bottom-center /
// frames emitted left-to-right with a per-frame x offset.

/* ===================================================================== */
/* 1 · TARNISHED CHALICE — prestige aura (gold + drift)                  */
/* ===================================================================== */
// Uses auras.js globals: AURA_N(64), AURA_CX(32), AURA_FEET(56), gmote, solidOn.
// Cup floats above the head (y8..16); the detached lid orbits the head (~y30);
// gilded motes rise the full column from the feet up into the cup.
function drawTarnishedChalice(frame) {
  const N = typeof AURA_N !== 'undefined' ? AURA_N : 64;
  const g = makeGrid(N, N);
  const gd = RAMP.gold,
    dr = RAMP.drift;
  const cx = 32;
  const fp = frame / 3; // 3-frame loop

  // ---- gilded motes rising from the feet up into the cup (outline-free) ----
  const M = 7;
  for (let i = 0; i < M; i++) {
    const t = (i / M + fp) % 1; // 0 born at feet .. 1 spent at cup
    if (t < 0.04 || t > 0.95) continue;
    const y = 54 - t * 37; // 54 → ~17 (just under the foot)
    const sway = Math.sin(t * Math.PI * 2 + i * 1.7) * 3.2;
    const x = cx + sway + (i % 2 ? 2 : -2);
    const c = t < 0.4 ? gd[2] : t < 0.72 ? gd[1] : gd[0];
    gmote(g, x, y, c, t > 0.45 && i % 2 === 0 ? gd[3] : null);
    if (t < 0.5) P(g, Math.round(x), Math.round(y + 1), gd[3]); // brief trailing spark
  }

  // ---- the gilded two-handled trophy cup (solid, void-outlined) ----
  solidOn(g, t => {
    const row = (y, x0, x1) => {
      for (let x = x0; x <= x1; x++) {
        let c = gd[1];
        if (x === x0) c = gd[0]; // moonlit left
        if (x === x1) c = gd[2]; // shadow right
        P(t, x, y, c);
      }
    };
    // bowl
    row(8, 28, 36);
    row(9, 28, 36);
    row(10, 29, 35);
    row(11, 30, 34);
    row(12, 31, 33);
    // stem
    P(t, 32, 13, gd[2]);
    P(t, 32, 14, gd[2]);
    // foot
    row(15, 30, 34);
    row(16, 29, 35);
    P(t, 30, 16, gd[2]);
    P(t, 35, 16, gd[3]);
    // loop handles
    P(t, 27, 9, gd[1]);
    P(t, 26, 10, gd[1]);
    P(t, 26, 11, gd[2]);
    P(t, 27, 12, gd[2]);
    P(t, 37, 9, gd[1]);
    P(t, 38, 10, gd[2]);
    P(t, 38, 11, gd[3]);
    P(t, 37, 12, gd[3]);
    // a couple of interior value steps so the gold reads as recovered, not flat
    P(t, 30, 9, gd[0]);
    P(t, 34, 10, gd[3]);
    P(t, 31, 11, gd[0]);
  });

  // ---- rim rot: the Drift eats the gold rim (dither + a chipped void notch) ----
  P(g, 34, 8, dr[2]);
  P(g, 33, 9, dr[3]);
  P(g, 35, 9, dr[2]);
  P(g, 36, 8, RAMP.void); // a chip pitted out of the rim
  if (frame % 2 === 0) P(g, 35, 11, dr[2]); // a corruption droplet weeping down
  P(g, 29, 8, dr[3]); // far-rim pitting

  // ---- the DETACHED LID orbiting the head (solid, outlined) ----
  const ang = fp * Math.PI * 2 - Math.PI * 0.5;
  const lx = Math.round(cx + Math.cos(ang) * 12);
  const ly = Math.round(30 + Math.sin(ang) * 4);
  const far = Math.sin(ang) < -0.15; // upper/back arc → dimmer, behind head
  solidOn(g, t => {
    const a = far ? gd[2] : gd[0],
      b = far ? gd[3] : gd[1];
    P(t, lx - 2, ly, b);
    P(t, lx - 1, ly, a);
    P(t, lx, ly, a);
    P(t, lx + 1, ly, a);
    P(t, lx + 2, ly, b);
    P(t, lx - 1, ly - 1, a);
    P(t, lx, ly - 1, a);
    P(t, lx + 1, ly - 1, b);
    P(t, lx, ly - 2, b); // knob
  });
  if (!far) P(g, lx + 1, ly, dr[2]); // matching rot on the lid

  return g;
}
const BP_AURAS = {
  tarnished_chalice: {
    fn: drawTarnishedChalice,
    frames: 3,
    fps: 4,
    ramp: 'gold + drift',
    desc: 'Gilded, rot-eaten two-handled trophy cup; detached lid orbits the head, gilded motes rise.',
    tier: 'season-exclusive',
    season: 'S01 Ashfall'
  }
};

/* ===================================================================== */
/* 2 · ASHFALL DYE — wanderer cloak colorway (existing dye-channel swap) */
/* ===================================================================== */
// Same mechanism as avatars.js (AVATAR_CHANNELS + resolveLook): each channel
// resolves to a LOCKED RAMP, baked at draw time — no new rig. The look post-
// processes the stock wanderer grid: stone→base ramp swap, drift→corrupt ramp
// swap, then banded trim + faint hem corruption painted on the garment.
const DYE_RAMP = {
  stone: RAMP.stone,
  bone: RAMP.bone,
  dirt: RAMP.dirt,
  blood: RAMP.blood,
  grass: RAMP.grass,
  gold: RAMP.gold,
  ember: RAMP.ember,
  drift: RAMP.drift,
  water: RAMP.water
};
// three cosmetic channels, each a list of locked-ramp options (mirrors AVATAR_CHANNELS shape)
const WANDERER_DYE_CHANNELS = {
  base: ['stone', 'bone', 'dirt', 'blood', 'grass'],
  // cloak/hood body
  trim: ['gold', 'ember', 'bone', 'drift', 'blood'],
  // banded trim
  corrupt: ['drift', 'blood', 'ember', 'water', 'grass'] // hem corruption + eyes
};
// named season colorways (look = {base,trim,corrupt} ramp names)
const WANDERER_DYES = {
  ashfall: {
    base: 'stone',
    trim: 'gold',
    corrupt: 'drift',
    note: 'ash-grey base, banded gold trim, faint drift-purple corruption at the hem'
  }
};
function resolveDye(look) {
  look = look || WANDERER_DYES.ashfall;
  const pick = (chan, v) => {
    const opts = WANDERER_DYE_CHANNELS[chan];
    if (v == null) return DYE_RAMP[opts[0]];
    if (typeof v === 'number') return DYE_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    return DYE_RAMP[v] || DYE_RAMP[opts[0]];
  };
  return {
    base: pick('base', look.base),
    trim: pick('trim', look.trim),
    corrupt: pick('corrupt', look.corrupt)
  };
}
function drawWandererDyed(facing, anim, f, look) {
  const {
    base,
    trim,
    corrupt
  } = resolveDye(look);
  const g = drawWanderer(facing, anim, f); // stock rig: stone cloak, drift hem/eyes, void outline

  // 1) ramp swap (skip void outline / anything off-ramp)
  const map = {};
  RAMP.stone.forEach((c, i) => {
    map[c] = base[Math.min(i, base.length - 1)];
  });
  RAMP.drift.forEach((c, i) => {
    map[c] = corrupt[Math.min(i, corrupt.length - 1)];
  });
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v && map[v.c]) P(g, x, y, map[v.c]);
  }

  // 2) banded gold trim — adaptive scan per row across the garment interior
  const bob = anim === 'walk' ? [0, -1, 0, 0, -1, 0][f] : 0;
  const baseSet = new Set(base);
  const bandRow = (y, midC, loC, hiC) => {
    let lo = 99,
      hi = -1;
    for (let x = 0; x < g.w; x++) {
      const v = G(g, x, y);
      if (v && baseSet.has(v.c)) {
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
    }
    if (hi < lo) return;
    for (let x = lo; x <= hi; x++) {
      const v = G(g, x, y);
      if (v && baseSet.has(v.c)) P(g, x, y, x === lo ? loC : x === hi ? hiC : midC);
    }
  };
  bandRow(20 + bob, trim[1], trim[0], trim[2]); // collar
  bandRow(32 + bob, trim[1], trim[0], trim[2]); // mid-hem band
  bandRow(34 + bob, trim[2], trim[1], trim[3] || trim[2]); // lower band

  // 3) faint drift-purple corruption creeping up the hem
  for (let x = 0; x < g.w; x++) for (let y = 31 + bob; y <= 34 + bob; y++) {
    const v = G(g, x, y);
    if (v && baseSet.has(v.c) && hash2(x, y, 137) < 0.10) P(g, x, y, corrupt[3]);
  }
  return g;
}
function ashfallDyeSheetGrids(look) {
  return WANDER_FACINGS.map(fc => {
    const row = [];
    WANDER_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(drawWandererDyed(fc, anim, f, look));
    });
    return row;
  });
}

/* ===================================================================== */
/* 3 · PASS EMBLEM — 32×32 "seasonal ledger" sigil (+ -mono)             */
/* ===================================================================== */
// A gilded two-handled chalice mark over a furled parchment banner (the season's
// ledger), with drift-corruption flecks. mono = the bone-only variant.
function drawPassEmblem(mono) {
  const g = makeGrid(32, 32);
  const GOLD = mono ? RAMP.bone : RAMP.gold;
  const PARCH = RAMP.bone; // parchment banner (ledger)
  const TRIM = mono ? RAMP.bone : RAMP.gold;
  const ROT = mono ? RAMP.bone : RAMP.drift;
  const pb = mono ? 2 : 1; // parchment darkened a step in mono for contrast

  // ---- furled parchment banner (behind): a hanging ledger scroll ----
  // rolled furl bar across the top (overhangs the body → reads as a furled roll)
  for (let x = 7; x <= 24; x++) P(g, x, 10, PARCH[mono ? 2 : 0]);
  for (let x = 7; x <= 24; x++) P(g, x, 11, PARCH[3]);
  P(g, 6, 10, PARCH[3]);
  P(g, 6, 11, PARCH[2]);
  P(g, 25, 10, PARCH[3]);
  P(g, 25, 11, PARCH[2]); // rolled end curls
  // draped body (narrower than the furl bar)
  for (let y = 12; y <= 23; y++) {
    const lo = 9,
      hi = 22;
    for (let x = lo; x <= hi; x++) {
      let c = PARCH[pb];
      if (x === lo) c = PARCH[mono ? 1 : 0];
      if (x === hi) c = PARCH[mono ? 3 : 2];
      P(g, x, y, c);
    }
  }
  // ledger rule-lines (full horizontal strokes)
  [15, 18, 21].forEach(y => {
    for (let x = 11; x <= 20; x++) P(g, x, y, PARCH[3]);
  });
  // forked swallowtail bottom (two tails + a center V-notch)
  for (let y = 24; y <= 27; y++) {
    const k = y - 24;
    for (let x = 9; x <= 13 - k; x++) P(g, x, y, x === 9 ? PARCH[mono ? 1 : 0] : PARCH[pb]);
    for (let x = 18 + k; x <= 22; x++) P(g, x, y, x === 22 ? PARCH[mono ? 3 : 2] : PARCH[pb]);
  }
  // gold trim bands (top & bottom of the draped body)
  for (let x = 9; x <= 22; x++) P(g, x, 12, TRIM[1]);
  for (let x = 10; x <= 21; x++) P(g, x, 23, TRIM[2]);

  // ---- gilded two-handled chalice mark (front, on the banner) ----
  const crow = (y, x0, x1) => {
    for (let x = x0; x <= x1; x++) {
      let c = GOLD[1];
      if (x === x0) c = GOLD[0];
      if (x === x1) c = GOLD[2];
      P(g, x, y, c);
    }
  };
  crow(4, 13, 19);
  crow(5, 13, 19);
  crow(6, 14, 18);
  crow(7, 15, 17); // bowl
  P(g, 16, 8, GOLD[2]);
  P(g, 16, 9, GOLD[2]); // stem
  crow(10, 13, 19);
  P(g, 13, 10, GOLD[0]);
  P(g, 19, 10, GOLD[2]); // foot
  // loop handles
  P(g, 12, 4, GOLD[1]);
  P(g, 11, 5, GOLD[1]);
  P(g, 11, 6, GOLD[2]);
  P(g, 12, 7, GOLD[2]);
  P(g, 20, 4, GOLD[1]);
  P(g, 21, 5, GOLD[2]);
  P(g, 21, 6, GOLD[3]);
  P(g, 20, 7, GOLD[3]);
  // rim rot on the chalice
  P(g, 18, 4, ROT[mono ? 3 : 2]);
  P(g, 19, 4, ROT[mono ? 3 : 3]);
  outline(g, RAMP.void);

  // ---- drift-corruption flecks (outline-free, after outline) ----
  if (!mono) {
    P(g, 9, 17, RAMP.drift[2]);
    P(g, 8, 17, RAMP.drift[3]); // corruption eating the left edge
    P(g, 22, 20, RAMP.drift[2]);
    P(g, 23, 20, RAMP.drift[3]); // right edge
    P(g, 16, 25, RAMP.drift[3]); // a fleck in the notch
  } else {
    P(g, 9, 17, RAMP.bone[3]);
    P(g, 22, 20, RAMP.bone[3]);
    P(g, 16, 25, RAMP.bone[3]);
  }
  return g;
}
const BATTLEPASS = {
  season: 'S01 Ashfall',
  theme: 'ornate · gilded-but-corrupted · season-exclusive',
  assets: {
    tarnished_chalice: {
      kind: 'aura',
      cell: '64×64',
      anchor: '32,56',
      frames: 3,
      fps: 4,
      ramp: 'gold + drift'
    },
    ashfall_dye: {
      kind: 'wanderer dye',
      cell: '32×40',
      anchor: '16,39',
      ramp: 'stone(base) + gold(trim) + drift(corrupt)'
    },
    pass_emblem: {
      kind: 'sigil',
      cell: '32×32',
      ramp: 'gold + bone + drift',
      variants: ['', '-mono']
    }
  }
};
Object.assign(globalThis, {
  drawTarnishedChalice,
  BP_AURAS,
  DYE_RAMP,
  WANDERER_DYE_CHANNELS,
  WANDERER_DYES,
  resolveDye,
  drawWandererDyed,
  ashfallDyeSheetGrids,
  drawPassEmblem,
  BATTLEPASS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/battlepass.js", error: String((e && e.message) || e) }); }

// assets/_gen/beasts.js
try { (() => {
// Naevyr creature generators — eval after pixlib.js (+ tiles.js for RAMP/helpers).
// Same conventions as character.js: drawX(facing, anim, frame) -> grid.
// 5 facings s/se/e/ne/n (engine mirrors w/sw/nw), bottom-center anchor (base on
// last row), 1px void auto-outline, locked RAMP only, deterministic.
// TOP 4px OF EVERY CELL LEFT EMPTY for engine HP-bar / level-tag clearance.

function ell(g, cx, cy, rx, ry, fn) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx,
        dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, d, dx, dy);
    }
  }
}
// shade a stone-ish mass: lit top-left, shadowed bottom-right, rim dark
function shadeMass(g, cx, cy, rx, ry, ramp, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (d > 0.72) c = ramp[3]; // rim shadow
    else if (dx + dy < -0.45) c = ramp[0]; // moonlit hi
    else if (dx + dy > 0.5) c = ramp[2]; // lower shadow
    if (seed != null && hash2(x, y, seed) < 0.07) c = ramp[2]; // cracked speckle
    P(g, x, y, c);
  });
}
// jagged spike pointing up from (bx, baseY), height h, drift ramp + glow tip
function spike(g, bx, baseY, h, lit) {
  const dr = RAMP.drift;
  for (let k = 0; k < h; k++) {
    const w = Math.max(0, Math.round((h - k) / 2.4));
    for (let x = bx - w; x <= bx + w; x++) P(g, x, baseY - k, k > h - 2 ? lit ? dr[0] : dr[1] : dr[3]);
  }
  P(g, bx, baseY - h, lit ? dr[0] : dr[1]);
}
function moteBurst(g, cx, cy, r, density, seed) {
  const dr = RAMP.drift;
  for (let i = 0; i < 40; i++) {
    const t = hash2(i, seed, 1) * Math.PI * 2,
      rr = hash2(i, seed, 2) * r;
    if (hash2(i, seed, 3) > density) continue;
    const x = Math.round(cx + Math.cos(t) * rr),
      y = Math.round(cy + Math.sin(t) * rr * 0.7);
    P(g, x, y, hash2(i, seed, 4) < 0.3 ? dr[0] : hash2(i, seed, 4) < 0.6 ? dr[1] : dr[2]);
  }
}

/* ============================ 1 · DRIFT HUSK (32×32) ============================ */
function drawHusk(facing, anim, f) {
  const g = makeGrid(32, 32);
  const st = RAMP.stone,
    dr = RAMP.drift;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 16 + lean;
  const groundY = 30;
  let dx = 0,
    sq = 0,
    legP = 0,
    alive = true,
    df = -1;
  if (anim === 'idle') sq = f === 1 ? 1 : 0;
  if (anim === 'skitter') {
    legP = f;
    dx = [0, 1, 0, -1][f];
  }
  if (anim === 'lunge') {
    dx = [-3, -4, 5, 7][f];
    sq = [1, 2, -1, 0][f];
  }
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    if (df === 0) {
      // collapsing
      shadeMass(g, cx, groundY - 3, profile ? 10 : 8, 3, st, 1);
      moteBurst(g, cx, 18, 6, 0.5, 7);
    } else if (df === 1) {
      for (let i = 0; i < 10; i++) P(g, 10 + i * 3 % 14, 27 + i % 3, st[3]); // rubble
      moteBurst(g, cx, 16, 11, 0.85, 9);
    } else {
      moteBurst(g, cx, 13, 13, 0.4, 11);
    }
    outline(g, RAMP.void);
    return g;
  }
  const bodyX = cx + dx,
    bodyY = groundY - 5 + 0;
  const rx = profile ? 9 : 7,
    ry = 5 - sq;

  // legs (under body)
  const legXs = profile ? [-6, -2, 3, 7] : [-5, -2, 2, 5];
  legXs.forEach((lx, i) => {
    const fwd = anim === 'skitter' ? (i + legP) % 2 === 0 ? 1 : 0 : 0;
    for (let k = 0; k < 4 - fwd; k++) P(g, bodyX + lx, bodyY + 3 + k, st[3]);
    P(g, bodyX + lx, groundY, RAMP.void);
  });
  // body mass
  shadeMass(g, bodyX, bodyY, rx, ry, st, 2);
  // back spines (drift) — flicker on idle f1
  const lit = anim === 'idle' ? f === 1 : anim === 'lunge' && f >= 2;
  const spineXs = back ? [-4, 0, 4] : profile ? [-6, -2, 2, 6] : [-4, 0, 4];
  spineXs.forEach((sx, i) => spike(g, bodyX + sx, bodyY - ry + 1, 4 + i % 2, lit));
  // head (front/side only)
  if (!back) {
    const hx = bodyX + (profile ? rx - 1 : 0),
      hy = bodyY + 1 + (profile ? 1 : 2);
    shadeMass(g, hx, hy, 3, 3, st, 3);
    const ey = hy - 1;
    if (profile) {
      P(g, hx + 1, ey, lit ? dr[0] : dr[1]);
    } else {
      P(g, hx - 1, ey, lit ? dr[0] : dr[1]);
      P(g, hx + 1, ey, dr[1]);
    }
  } else {
    // haunch hump from behind
    shadeMass(g, bodyX, bodyY - 1, rx - 2, ry, st, 4);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · DRIFT STALKER (36×40) ========================= */
function drawStalker(facing, anim, f) {
  const g = makeGrid(36, 40);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bl = RAMP.blood;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 18 + lean;
  const groundY = 38;
  let crouch = 0,
    armSwing = 0,
    alive = true,
    df = -1,
    dx = 0;
  if (anim === 'idle') crouch = f === 1 ? 1 : 0;
  if (anim === 'stalk') {
    dx = [0, 1, 1, 0, -1, -1][f];
    crouch = [0, 1, 1, 0, 1, 1][f];
  }
  if (anim === 'lunge') {
    dx = [-2, -3, 6, 8][f];
    crouch = [2, 3, -2, -1][f];
  }
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    if (df <= 1) {
      const yy = groundY - 8 + df * 4;
      shadeMass(g, cx, yy, 8 - df, 5 - df, st, 1);
      if (df === 1) moteBurst(g, cx, yy - 4, 8, 0.6, 21);
    } else if (df === 2) {
      moteBurst(g, cx, 20, 12, 0.85, 23);
      for (let i = 0; i < 8; i++) P(g, 12 + i * 3 % 12, 35 + i % 3, st[3]);
    } else moteBurst(g, cx, 16, 15, 0.4, 25);
    outline(g, RAMP.void);
    return g;
  }
  const hipY = groundY - 10 + crouch;
  const headY = hipY - 13 + crouch;
  // legs (digitigrade)
  [[-4, 1], [4, -1]].forEach(([lx, ph], i) => {
    const k2 = anim === 'stalk' ? (f + i) % 2 : 0;
    P(g, cx + lx, hipY + 2, st[2]);
    P(g, cx + lx + ph, hipY + 5, st[2]);
    P(g, cx + lx + ph, hipY + 8 - k2, st[3]);
    P(g, cx + lx + ph + 1, groundY, RAMP.void);
    P(g, cx + lx + ph + 2, groundY, bl[1]); // gore-stained foot-claw
  });
  // torso (upright, leaning forward)
  const torsoX = cx + dx,
    leanF = profile ? 2 : 0;
  shadeMass(g, torsoX + leanF, (hipY + headY) / 2, 5, 7, st, 2);
  // exposed drift veins down torso
  for (let y = headY + 3; y < hipY; y += 2) P(g, torsoX + leanF - 1, y, dr[2]);
  P(g, torsoX + leanF, headY + 5, dr[1]);
  // back spines
  const lit = anim === 'idle' ? f === 1 : anim === 'lunge' && f >= 2;
  [-2, 1, 4].forEach((sx, i) => spike(g, torsoX + (back ? sx : sx + 3), (hipY + headY) / 2 - 5, 5 + i % 2, lit));
  // arms with clawed hands
  const ang = anim === 'lunge' ? [-1.6, -2.0, 0.2, 0.5][f] : anim === 'stalk' ? -0.6 + Math.sin(f) * 0.2 : -0.7;
  const sx0 = torsoX + leanF + 2,
    sy0 = headY + 5;
  for (let k = 1; k < 7; k++) {
    const x = Math.round(sx0 + Math.cos(ang) * k),
      y = Math.round(sy0 + Math.sin(ang) * k + 3);
    P(g, x, y, st[2]);
  }
  const cxh = Math.round(sx0 + Math.cos(ang) * 7),
    cyh = Math.round(sy0 + Math.sin(ang) * 7 + 3);
  P(g, cxh, cyh, bl[0]);
  P(g, cxh + 1, cyh - 1, bl[1]);
  P(g, cxh + 1, cyh + 1, bl[1]); // gore claws
  // head
  if (!back) {
    shadeMass(g, torsoX + leanF + (profile ? 2 : 0), headY, 3, 3, st, 3);
    const ey = headY;
    if (profile) P(g, torsoX + leanF + 3, ey, lit ? dr[0] : dr[1]);else {
      P(g, torsoX + leanF - 1, ey, lit ? dr[0] : dr[1]);
      P(g, torsoX + leanF + 1, ey, dr[1]);
    }
    // bloodied maw
    P(g, torsoX + leanF + (profile ? 3 : 0), headY + 2, bl[1]);
  } else shadeMass(g, torsoX, headY, 3, 3, st, 4);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · DRIFT COLOSSUS (64×64) ========================= */
function drawColossus(facing, anim, f) {
  const g = makeGrid(64, 64);
  const st = RAMP.stone,
    dr = RAMP.drift,
    em = RAMP.ember;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 2, 4, 2, 0][dir];
  const cx = 32 + lean;
  const groundY = 60;
  let stagger = 0,
    armUp = 0,
    alive = true,
    df = -1,
    shake = 0;
  if (anim === 'idle') stagger = f === 1 ? 1 : 0;
  if (anim === 'walk') {
    stagger = [0, 1, 0, 1][f];
    shake = [0, 0, 1, 0][f];
  }
  if (anim === 'slam') {
    armUp = [3, 6, 6, -2, -4][f];
    shake = [0, 0, 0, 2, 1][f];
  }
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    const collapse = df; // 0..4 crumble
    if (df < 4) {
      // shrinking rubble pile
      const h = 30 - df * 6;
      for (let y = groundY; y > groundY - h; y--) {
        const w = Math.round((groundY - y) * 0.5 + 6);
        for (let x = cx - w; x <= cx + w; x++) if (hash2(x, y, 30 + df) < 0.7) P(g, x, y, hash2(x, y, 5) < 0.4 ? st[2] : st[1]);
      }
      moteBurst(g, cx, groundY - h - 4, 16 + df * 3, 0.7, 40 + df);
      // cracks leaking drift
      for (let i = 0; i < 6 - df; i++) P(g, cx - 8 + i * 3, groundY - 8, dr[2]);
    } else {
      for (let i = 0; i < 18; i++) P(g, cx - 16 + i * 5 % 32, groundY - i % 3, st[3]);
      moteBurst(g, cx, 30, 22, 0.5, 49);
    }
    outline(g, RAMP.void);
    return g;
  }
  const baseY = groundY + (shake ? 1 : 0);
  // two stone legs (broken pillars)
  [[-10, 0], [9, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && (f + i) % 2 === 0 ? 2 : 0;
    for (let y = baseY - 18; y <= baseY - lift; y++) {
      for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
        let c = st[1];
        if (x < cx + lx - 2) c = st[0];
        if (x > cx + lx + 2) c = st[3];
        if (hash2(x, y, 31) < 0.06) c = st[2];
        P(g, x, y, c);
      }
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
    // drift leaking at the knee
    P(g, cx + lx - 4, baseY - 9, dr[2]);
    P(g, cx + lx + 4, baseY - 12, dr[3]);
  });
  // masonry torso (broken brick block)
  const tx = cx + (profile ? 3 : 0),
    tTop = baseY - 44 + stagger,
    tBot = baseY - 20;
  for (let y = tTop; y <= tBot; y++) {
    const w = 13 + Math.round((y - tTop) / 6);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1];
      if (x < tx - w + 3) c = st[0];
      if (x > tx + w - 3) c = st[2];
      if (y > tBot - 4) c = st[3];
      // brick seams
      if ((y - tTop) % 6 === 0 || (x - tx + Math.floor((y - tTop) / 6) % 2 * 4) % 8 === 0) c = st[3];
      if (hash2(x, y, 32) < 0.05) c = dr[3]; // corruption in cracks
      P(g, x, y, c);
    }
  }
  // corruption leaking from torso cracks
  [[-8, 6], [5, 10], [-2, 16], [9, 4]].forEach(([ox, oy], i) => {
    P(g, tx + ox, tTop + oy, dr[2]);
    P(g, tx + ox, tTop + oy + 1, dr[3]);
    if (anim === 'idle' && f === 1 || anim === 'slam') P(g, tx + ox, tTop + oy - 1, i % 2 ? dr[0] : em[1]);
  });
  // arms (raise on slam)
  [[-1, -16], [1, 16]].forEach(([sgn, ox]) => {
    const shoulderX = tx + ox * 0.9,
      shoulderY = tTop + 4;
    const ay = shoulderY + 8 - (anim === 'slam' ? armUp : 0);
    for (let y = shoulderY; y <= shoulderY + 16; y++) {
      const yy = anim === 'slam' && armUp > 0 ? shoulderY + (y - shoulderY) - armUp : y;
      for (let x = shoulderX - 3; x <= shoulderX + 3; x++) {
        let c = st[1];
        if (x < shoulderX - 1) c = st[0];
        if (x > shoulderX + 1) c = st[2];
        P(g, Math.round(x), Math.round(yy), c);
      }
    }
    // fist
    const fy = anim === 'slam' && armUp > 0 ? shoulderY + 16 - armUp : shoulderY + 16;
    shadeMass(g, shoulderX, fy, 4, 3, st, 6);
  });
  // shockwave on slam impact frames
  if (anim === 'slam' && f >= 3) {
    const r = f === 3 ? 16 : 24;
    for (let a = 0; a < 2; a++) {
      P(g, cx - r + a, groundY - 1, dr[1]);
      P(g, cx + r - a, groundY - 1, dr[1]);
      P(g, cx - r + a, groundY, em[1]);
      P(g, cx + r - a, groundY, em[1]);
    }
  }
  // fractured head with single drift-core eye
  if (!back) {
    const hx = tx + (profile ? 4 : 0),
      hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      let c = st[1];
      if (x < hx - 2) c = st[0];
      if (y > hy + 1) c = st[3];
      if (hash2(x, y, 33) < 0.08) c = st[2];
      P(g, x, y, c);
    }
    // crack across head
    for (let k = -5; k <= 5; k++) P(g, hx + k, hy - 1 + Math.round(Math.sin(k)), st[3]);
    // huge drift-core eye
    const lit = anim === 'idle' && f === 1 || anim === 'slam' && f >= 1;
    ell(g, hx, hy + 1, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    if (lit) {
      P(g, hx - 3, hy + 1, dr[2]);
      P(g, hx + 3, hy + 1, dr[2]);
    }
  } else {
    const hx = tx,
      hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      P(g, x, y, hash2(x, y, 33) < 0.5 ? st[2] : st[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · CARAVAN RAIDER (32×40) ========================= */
function drawRaider(facing, anim, f) {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    em = RAMP.ember,
    bl = RAMP.blood;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir];
  const cx = 16;
  const groundY = 38;
  let bob = 0,
    step = 0,
    armAng = null,
    alive = true,
    df = -1;
  if (anim === 'idle') bob = f === 1 ? 1 : 0;
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    step = [2, 1, 0, -2, -1, 0][f];
  }
  if (anim === 'slash') armAng = [-1.9, -0.9, 0.2, 0.7][f];
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    if (df === 0) {
      // stagger back, clutching
      drawRaiderBody(g, cx + 1, 12, dt, bn, off, dir, profile, back, 2, 0);
      P(g, cx + 6, 17, bl[1]);
      P(g, cx + 7, 18, bl[2]); // blood
    } else if (df === 1) {
      // slumping to knees, bowed
      ell(g, cx, 30, 8, 6, (x, y, d, dx, dy) => {
        let c = dt[1];
        if (dx + dy < -0.4) c = dt[0];
        if (dx + dy > 0.5) c = dt[2];
        if (hash2(x, y, 62) < 0.1) c = dt[3];
        P(g, x, y, c);
      });
      ell(g, cx + 4, 25, 3, 3, (x, y) => P(g, x, y, dt[2])); // bowed head
      for (let y = 24; y <= 26; y++) for (let x = cx + 3; x <= cx + 6; x++) if (hash2(x, y, 65) < 0.7) P(g, x, y, bn[1]); // mask
      P(g, cx - 6, 36, bl[2]);
    } else {
      // sprawled flat
      for (let x = cx - 9; x <= cx + 8; x++) {
        P(g, x, groundY - 1, dt[2]);
        if (hash2(x, 0, 61) < 0.6) P(g, x, groundY - 2, dt[1]);
      }
      ell(g, cx - 7, groundY - 3, 3, 2, (x, y) => P(g, x, y, bn[1])); // dropped mask
      P(g, cx + 8, groundY - 1, em[2]);
      P(g, cx + 9, groundY - 2, em[1]); // dropped torch
    }
    outline(g, RAMP.void);
    return g;
  }
  const top = 9 + bob;
  drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, 0, step);

  // weapon arm: ember torch (idle/walk) or blade (slash)
  const shoulderY = top + 9;
  if (anim === 'slash') {
    const sx = cx + off + 3,
      ang = armAng;
    for (let k = 1; k < 7; k++) P(g, Math.round(sx + Math.cos(ang) * k), Math.round(shoulderY + Math.sin(ang) * k), dt[1]);
    const bx = Math.round(sx + Math.cos(ang) * 7),
      by = Math.round(shoulderY + Math.sin(ang) * 7);
    for (let k = 0; k < 6; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by + Math.sin(ang) * k), bn[0]); // steel blade
    if (f === 2) {
      P(g, bx + 3, by, bn[0]);
      P(g, bx + 4, by + 1, em[0]);
    } // slash glint
  } else {
    // torch held at side
    const tx = cx + off + (profile ? 5 : 4),
      ty = shoulderY - 2;
    for (let k = 0; k < 6; k++) P(g, tx, ty + k, dt[2]); // haft
    P(g, tx, ty - 1, em[2]);
    const flick = anim === 'idle' ? f : 0;
    P(g, tx, ty - 2 - flick, em[1]);
    P(g, tx, ty - 3 - flick, em[0]);
    P(g, tx + (flick ? 1 : -1), ty - 2, em[1]);
  }
  outline(g, RAMP.void);
  return g;
}
// shared raider body (so death frames can reuse)
function drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, hunch, step) {
  const shoulderY = top + 9 + hunch,
    hipY = top + 19,
    groundY = 38;
  // legs
  const fo = dir >= 1 ? 1 : 0;
  for (let leg = 0; leg < 2; leg++) {
    const sgn = leg ? 1 : -1,
      sx = cx + sgn * 2 + fo + (leg ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) {
      let c = dt[2];
      if (y > groundY - 4) c = dt[3];
      P(g, sx, y, c);
      P(g, sx + sgn, y, dt[1]);
    }
    P(g, sx, groundY - 1, RAMP.void);
    P(g, sx + sgn, groundY - 1, dt[3]); // boot
  }
  // patched-leather torso
  for (let y = shoulderY; y <= hipY; y++) {
    const w = 4 + Math.round((y - shoulderY) / 8);
    for (let x = cx - w + off / 2; x <= cx + w + off / 2; x++) {
      let c = dt[1];
      if (x < cx - w + off / 2 + 1) c = dt[0];
      if (x > cx + w + off / 2 - 1) c = dt[3];
      if (hash2(x, y, 62) < 0.08) c = dt[2]; // patches
      if (hash2(x, y, 64) < 0.02) c = bn[2]; // bone trinket
      P(g, Math.round(x), y, c);
    }
  }
  // belt
  for (let x = cx - 4 + off / 2; x <= cx + 4 + off / 2; x++) P(g, Math.round(x), hipY, dt[3]);
  // head + bone mask
  const hx = cx + off;
  ell(g, hx, top + 4, 3.2, 3.6, (x, y, d, dx, dy) => {
    let c = dt[1];
    if (dx + dy < -0.4) c = dt[0];
    if (dx + dy > 0.5) c = dt[2];
    P(g, x, y, c);
  });
  if (!back) {
    // bone mask plate over face
    const mw = profile ? 1 : 2;
    for (let y = top + 3; y <= top + 6; y++) for (let x = hx - (profile ? 0 : mw); x <= hx + mw; x++) P(g, x, y, hash2(x, y, 65) < 0.2 ? bn[2] : bn[1]);
    // eye slit (dark)
    P(g, hx + (profile ? 1 : 0), top + 4, RAMP.void);
    if (!profile) P(g, hx + 1, top + 4, RAMP.void);
  } else {
    // hood/hair from behind
    for (let y = top + 1; y <= top + 5; y++) for (let x = hx - 3; x <= hx + 3; x++) if ((x - hx) ** 2 + (y - top - 3) ** 2 < 10) P(g, x, y, dt[3]);
  }
  // hood cowl
  for (let x = hx - 4; x <= hx + 4; x++) {
    const yy = top + Math.round(((x - hx) / 4) ** 2 * 2);
    if ((x - hx) ** 2 < 17) P(g, x, yy, dt[2]);
  }
}
const BEAST_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const BEASTS = {
  husk: {
    fn: 'drawHusk',
    cell: [32, 32],
    anims: [['idle', 2], ['skitter', 4], ['lunge', 4], ['death', 3]],
    hurt: 'drift-hi (#d8b4fe)'
  },
  stalker: {
    fn: 'drawStalker',
    cell: [36, 40],
    anims: [['idle', 2], ['stalk', 6], ['lunge', 4], ['death', 4]],
    hurt: 'blood-hi (#ef4444)'
  },
  colossus: {
    fn: 'drawColossus',
    cell: [64, 64],
    anims: [['idle', 2], ['walk', 4], ['slam', 5], ['death', 5]],
    hurt: 'bone-hi (#efe9f4) then drift-hi'
  },
  raider: {
    fn: 'drawRaider',
    cell: [32, 40],
    anims: [['idle', 2], ['walk', 6], ['slash', 4], ['death', 3]],
    hurt: 'blood-hi (#ef4444)'
  }
};
function beastSheetGrids(name) {
  const spec = BEASTS[name],
    fn = globalThis[spec.fn];
  return BEAST_FACINGS.map(fc => {
    const row = [];
    spec.anims.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(fn(fc, anim, f));
    });
    return row;
  });
}
Object.assign(globalThis, {
  ell,
  shadeMass,
  spike,
  moteBurst,
  drawHusk,
  drawStalker,
  drawColossus,
  drawRaider,
  drawRaiderBody,
  BEAST_FACINGS,
  BEASTS,
  beastSheetGrids
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/beasts.js", error: String((e && e.message) || e) }); }

// assets/_gen/biometiles.js
try { (() => {
// Naevyr "FILL THE REALM" · BIOME TILE ACCENTS — eval after pixlib.js + tiles.js.
// (uses makeBaseTile/diamondRows/inDiamond/hash2 from tiles.js + pixlib.)
//
// 64×32 iso GROUND-TILE variants, drawn as the base tile per region so the terrain itself
// differs by biome. Diamond-center anchored (32,16) like drawFloor interior tiles —
// these are floor tiles, NOT billboards: no void outline on the face, accents dither into
// the surface. Cell 64×36 (32px diamond face + 3px south lip), tile 64×32. RAMP only.
//
// Registry: { fn(), cell:[64,36], tile:[64,32], anchor:[32,16], base, sink:true }.

// scatter accent pixels inside the diamond face only (never on the lip/edge)
function faceScatter(rows, fn) {
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0 + 2; x <= rows[y].x1 - 2; x++) fn(x, y);
}

/* =============================== MEADOW FLOWER =============================== */
// grass + scattered tiny blooms (drift / gold / bone), a lusher heartland floor.
function drawMeadowFlower() {
  const g = makeBaseTile('grass', 11);
  const rows = diamondRows(),
    dr = RAMP.drift,
    gd = RAMP.gold,
    bn = RAMP.bone,
    gr = RAMP.grass;
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 600);
    if (h < 0.012) {
      P(g, x, y, dr[1]);
      P(g, x, y - 1, dr[0]);
      P(g, x - 1, y, gr[2]);
    } // purple bloom
    else if (h < 0.024) {
      P(g, x, y, gd[0]);
      P(g, x, y - 1, gd[1]);
      P(g, x - 1, y, gr[2]);
    } // gold bloom
    else if (h < 0.034) {
      P(g, x, y, bn[0]);
      P(g, x + 1, y, bn[1]);
    } // white daisy speck
    else if (h < 0.05) P(g, x, y, gr[0]); // lush highlight blade
  });
  return g;
}

/* =============================== ASH DIRT =============================== */
// grey scorched dirt + ember flecks — the Ashen Flats war ground.
function drawAshDirt() {
  const g = makeBaseTile('dirt', 12);
  const rows = diamondRows(),
    em = RAMP.ember;
  const ashgrey = ['#564f6b', '#3a3450', '#211c30', '#14101e'];
  // recolour the dirt face toward cold ash-grey (keep the lip/void edges from makeBaseTile)
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const v = G(g, x, y);
    if (!v || v.c === RAMP.void) continue;
    const dl = RAMP.dirt.indexOf(v.c);
    if (dl >= 0) P(g, x, y, ashgrey[dl]);
  }
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 610);
    if (h < 0.02) {
      P(g, x, y, em[2]);
      if (hash2(x, y, 611) < 0.5) P(g, x, y, em[1]);
    } // ember fleck
    else if (h < 0.035) P(g, x, y, RAMP.ash); // soot patch
    else if (h < 0.06) P(g, x, y, ashgrey[0]); // dry ash highlight
  });
  return g;
}

/* =============================== HIGHLAND STONE =============================== */
// rocky grey — the Ashen Flats highland; cracked flagstone-ish ground.
function drawHighlandStone() {
  const g = makeBaseTile('stone', 13);
  const rows = diamondRows(),
    st = RAMP.stone,
    gr = RAMP.grass;
  // a few embedded boulders + cracks across the face
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 620);
    if (h < 0.02) {
      P(g, x, y, st[3]);
      P(g, x + 1, y, st[3]);
    } // crack seam
    else if (h < 0.05) P(g, x, y, st[0]); // lit rock facet
    else if (h < 0.065) P(g, x, y, st[2]); // shadow pit
  });
  // two small embedded rocks (lit top-left)
  [[24, 14, 3], [42, 20, 4]].forEach(([cx, cy, r], i) => {
    ell(g, cx, cy, r, r * 0.7, (x, y, d, dx, dy) => {
      if (!inDiamond(rows, x, y)) return;
      let c = st[1];
      if (dx + dy < -0.3) c = st[0];
      if (d > 0.7) c = st[2];
      P(g, x, y, c);
    });
    if (i === 0) P(g, cx - 1, cy - 2, gr[2]); // a touch of moss
  });
  return g;
}

/* =============================== MARSH MUD =============================== */
// wet dark dirt + puddle dither — Hollowmere ground.
function drawMarshMud() {
  const g = makeBaseTile('dirt', 14);
  const rows = diamondRows(),
    wt = RAMP.water,
    dt = RAMP.dirt,
    gr = RAMP.grass;
  // darken the dirt face (wet)
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const v = G(g, x, y);
    if (!v || v.c === RAMP.void) continue;
    if (v.c === dt[0]) P(g, x, y, dt[1]);else if (v.c === dt[1]) P(g, x, y, dt[2]);
  }
  // a couple of puddles with dithered water + sheen
  [[26, 16, 7, 3], [44, 22, 6, 2.5]].forEach(([cx, cy, rx, ry], i) => {
    ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
      if (!inDiamond(rows, x, y)) return;
      if (d > 0.85 && (x + y) % 2) return; // soft dithered puddle rim
      let c = wt[2];
      if (d < 0.4) c = wt[3];
      if (dx + dy < -0.4 && d < 0.6) c = wt[1];
      P(g, x, y, c);
    });
    P(g, cx - 1, cy - 1, wt[0]); // sky sheen glint
  });
  // scattered reeds / wet grass blades + mud flecks
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 630);
    if (h < 0.015) {
      P(g, x, y, gr[2]);
      P(g, x, y - 1, gr[1]);
    } // reed blade
    else if (h < 0.03) P(g, x, y, dt[3]); // wet mud dark fleck
  });
  return g;
}

/* ============================ REGISTRY ============================ */
const BIOMETILES = {
  meadow_flower: {
    fn: () => drawMeadowFlower(),
    base: 'grass'
  },
  ash_dirt: {
    fn: () => drawAshDirt(),
    base: 'dirt'
  },
  highland_stone: {
    fn: () => drawHighlandStone(),
    base: 'stone'
  },
  marsh_mud: {
    fn: () => drawMarshMud(),
    base: 'dirt'
  }
};
Object.keys(BIOMETILES).forEach(k => Object.assign(BIOMETILES[k], {
  cell: [64, 36],
  tile: [64, 32],
  anchor: [32, 16],
  sink: true,
  outline: false
}));
Object.assign(globalThis, {
  faceScatter,
  drawMeadowFlower,
  drawAshDirt,
  drawHighlandStone,
  drawMarshMud,
  BIOMETILES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/biometiles.js", error: String((e && e.message) || e) }); }

// assets/_gen/cache.js
try { (() => {
// NAEVYR — DRIFT CACHE (HUD/engine reveal art). Eval after pixlib.js + tiles.js.
// Small ornate chest, 64×64, bottom-center anchor (32,58). Dark iron + drift-
// violet seams. 3 states: sealed(1f) · opening(2f, lid cracking w/ violet light)
// · burst(2f, light column + motes). Rect-grid, RAMP only, 1px void outline on
// the solid chest, outline-free glow for light/motes.

const CACHE_N = 64,
  CC_X = 32,
  CC_BASE = 58;

// the chest body (shared); lidLift raises the lid + opens a glowing gap
function chestBody(g, lidLift) {
  const st = RAMP.stone,
    ir0 = '#1a1626',
    dr = RAMP.drift,
    gd = RAMP.gold;
  const cx = CC_X,
    w = 17,
    bodyTop = 34,
    bodyBot = CC_BASE;
  // --- body box (dark iron) ---
  for (let y = bodyTop; y <= bodyBot; y++) for (let x = cx - w; x <= cx + w; x++) {
    let c = '#2a2438';
    if (x < cx - w + 2) c = '#3a3350';
    if (x > cx + w - 2) c = ir0;
    if (y > bodyBot - 3) c = ir0;
    P(g, x, y, c);
  }
  // wood staves between iron bands
  for (let x = cx - w + 1; x <= cx + w - 1; x++) {
    if ((x - cx) % 5 === 0) for (let y = bodyTop + 1; y < bodyBot - 1; y++) P(g, x, y, RAMP.dirt[3]);
  }
  // iron corner brackets + drift-violet seams
  for (let y = bodyTop; y <= bodyBot; y++) {
    P(g, cx - w, y, ir0);
    P(g, cx + w, y, ir0);
    if (y % 2 === 0) {
      P(g, cx - w + 1, y, dr[3]);
      P(g, cx + w - 1, y, dr[3]);
    }
  }
  // gold lockplate
  fillRect(g, cx - 3, bodyTop + 4, 6, 7, gd[2]);
  P(g, cx, bodyTop + 7, RAMP.void);
  fillRect(g, cx - 2, bodyTop + 4, 4, 1, gd[1]);
  P(g, cx, bodyTop + 6, gd[0]);

  // --- lid (raised by lidLift) ---
  const lidBot = bodyTop,
    lidH = 13;
  const ly = lidBot - lidLift;
  // glowing gap revealed under a lifted lid
  if (lidLift > 0) {
    for (let yy = ly; yy < lidBot; yy++) for (let x = cx - w + 1; x <= cx + w - 1; x++) {
      const t = (yy - ly) / Math.max(1, lidBot - ly);
      let c = dr[3];
      if (t > 0.3) c = dr[2];
      if (t > 0.6) c = dr[1];
      if (t > 0.85) c = dr[0];
      if (hash2(x, yy, 9) < 0.25) c = dr[0];
      P(g, x, yy, c);
    }
  }
  // arched lid
  for (let x = cx - w; x <= cx + w; x++) {
    const u = (x - cx) / w;
    const arch = Math.round((1 - u * u) * 6);
    for (let y = ly - lidH - arch + 6; y <= ly; y++) {
      let c = '#2a2438';
      if (x < cx - w + 2) c = '#3a3350';
      if (x > cx + w - 2) c = ir0;
      if (y <= ly - lidH - arch + 7) c = '#3a3350'; // top highlight
      P(g, x, y, c);
    }
  }
  // lid iron bands + violet seam along the rim
  for (let x = cx - w; x <= cx + w; x++) {
    const u = (x - cx) / w;
    const arch = Math.round((1 - u * u) * 6);
    P(g, x, ly, ir0);
    P(g, x, ly - 1, dr[3]);
    if ((x - cx) % 6 === 0) for (let y = ly - lidH - arch + 7; y < ly; y++) P(g, x, y, RAMP.dirt[3]);
  }
  return {
    cx,
    w,
    bodyTop,
    lidTopY: ly - lidH
  };
}
function drawCacheSealed() {
  const g = makeGrid(CACHE_N, CACHE_N);
  chestBody(g, 0);
  // faint dormant violet glow in the seams
  outline(g, RAMP.void);
  return g;
}
function drawCacheOpening(frame) {
  // 0,1 — lid cracking
  const g = makeGrid(CACHE_N, CACHE_N);
  const lift = frame === 0 ? 4 : 9;
  chestBody(g, lift);
  // escaping light slivers at the crack
  const dr = RAMP.drift;
  for (let i = -2; i <= 2; i++) {
    const x = CC_X + i * 5;
    P(g, x, 34 - lift - 1, dr[0]);
    if (frame) P(g, x, 34 - lift - 3, dr[1]);
  }
  outline(g, RAMP.void);
  // motes (outline-free) added AFTER outline so they stay glow
  if (frame) for (let i = 0; i < 6; i++) {
    const x = CC_X - 8 + i * 3;
    const y = 30 - i % 3 * 3;
    P(g, x, y, i % 2 ? dr[0] : dr[2]);
  }
  return g;
}
function drawCacheBurst(frame) {
  // 0,1 — light column + motes
  const g = makeGrid(CACHE_N, CACHE_N);
  chestBody(g, 11);
  outline(g, RAMP.void);
  const dr = RAMP.drift,
    gd = RAMP.gold;
  const cx = CC_X,
    topGlow = 33 - 11;
  // vertical light column rising from the open chest (dithered, widening)
  const h = frame ? 30 : 22,
    halfMax = frame ? 9 : 6;
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const hw = Math.round((1 - t) * halfMax) + 1;
    const yy = topGlow - k;
    for (let x = cx - hw; x <= cx + hw; x++) {
      const edge = Math.abs(x - cx) >= hw - 1;
      if (edge && (x + yy) % 2 !== 0) continue; // dithered edge
      let c = dr[2];
      if (Math.abs(x - cx) < hw - 2) c = dr[1];
      if (Math.abs(x - cx) <= 1) c = k < h * 0.6 ? dr[0] : RAMP.bone[0];
      if (t > 0.8 && Math.abs(x - cx) <= 1) c = gd[0]; // gold sparks at the crest
      P(g, x, yy, c);
    }
  }
  // burst motes flying out + up
  const mr = mulberry(frame + 5);
  const N = frame ? 22 : 14;
  for (let i = 0; i < N; i++) {
    const a = (-90 + (mr() - 0.5) * 150) * Math.PI / 180; // mostly upward fan
    const r = 6 + mr() * (frame ? 26 : 16);
    const x = Math.round(cx + Math.cos(a) * r),
      y = Math.round(topGlow + Math.sin(a) * r);
    P(g, x, y, mr() < 0.3 ? gd[0] : mr() < 0.6 ? dr[0] : dr[1]);
    if (mr() < 0.3) P(g, x, y + 1, dr[3]);
  }
  return g;
}
const CACHE = {
  drift_cache: {
    cell: [CACHE_N, CACHE_N],
    anchor: [CC_X, CC_BASE],
    ramp: 'iron(stone) + drift + gold',
    states: {
      sealed: {
        fn: () => [drawCacheSealed()],
        frames: 1,
        fps: 0
      },
      opening: {
        fn: () => [drawCacheOpening(0), drawCacheOpening(1)],
        frames: 2,
        fps: 6
      },
      burst: {
        fn: () => [drawCacheBurst(0), drawCacheBurst(1)],
        frames: 2,
        fps: 8
      }
    }
  }
};
Object.assign(globalThis, {
  CACHE_N,
  CC_X,
  CC_BASE,
  chestBody,
  drawCacheSealed,
  drawCacheOpening,
  drawCacheBurst,
  CACHE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/cache.js", error: String((e && e.message) || e) }); }

// assets/_gen/camps.js
try { (() => {
// Naevyr FRONTIER EXPANSION · WILD CAMPS / MINI-DUNGEONS — eval after pixlib.js +
// tiles.js + wilds.js (driftVeins, boneSpikeShape) + town.js (foundation).
// Three explorable wild structures, each ~96-120px wide, 3×3 footprint, bottom-center
// anchor, top 6px reserved for the label, with a subtle 2-frame idle.
//   drowned_ruins  (Palewater)  120×96  — half-sunken pale arches in shallow water
//   barrow_crypt   (Bonefields) 116×100 — grass-grown burial mound + dark stone door
//   ashen_warcamp  (frontier)   120×104 — raider tents + crude palisade + war-banner
// RAMP only, 1px void auto-outline, dither not blur, moonlit-left/shadowed-right.

/* ===================== 1 · DROWNED RUINS (120×96, 2f water shimmer) ===================== */
function drawDrownedRuins(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 96);
  const wa = RAMP.water,
    st = RAMP.stone,
    bn = RAMP.bone;
  const cx = 60,
    baseY = 88;

  // shallow waterlogged basin (iso ellipse) — pale, with land rim
  for (let dy = -18; dy <= 18; dy++) for (let dx = -58; dx <= 58; dx++) {
    const e = (dx / 58) ** 2 + (dy / 18) ** 2;
    if (e > 1) continue;
    const h = hash2(cx + dx, baseY + dy, 601);
    let c;
    if (e > 0.86) {
      c = RAMP.dirt[2];
      if (h < 0.3) c = RAMP.dirt[3];
    } // muddy shore rim
    else {
      c = wa[2];
      if (dy < -2) c = wa[1];
      if (h < 0.10) c = wa[1];
      if (h > 0.94) c = wa[3];
    }
    P(g, cx + dx, baseY + dy, c);
  }
  // pale waterline scum / reeds at the rim
  for (let i = 0; i < 10; i++) {
    const rx = cx - 48 + Math.floor(hash2(i, 1, 602) * 96);
    const ry = baseY + Math.floor((hash2(i, 2, 602) - 0.5) * 30);
    if ((rx - cx) ** 2 / 58 ** 2 + (ry - baseY) ** 2 / 18 ** 2 > 0.95) continue;
    for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]);
    P(g, rx, ry - 4, bn[2]);
  }

  // helper: a half-sunken broken stone arch (pale + waterlogged base)
  function arch(acx, springY, R, band, breakAt) {
    // two stubby legs down into the water
    for (const side of [-1, 1]) {
      const lx = acx + side * R;
      for (let y = springY; y <= baseY + 4; y++) {
        const sub = y > baseY - 6; // submerged darker + algae
        for (let x = -3; x <= 3; x++) {
          let c = side < 0 ? st[0] : st[2];
          if (x > 1) c = st[3];
          if (sub) c = hash2(lx + x, y, 603) < 0.4 ? RAMP.grass[3] : st[3];
          P(g, lx + x, y, c);
        }
      }
    }
    // the broken semicircle (missing a chunk at breakAt side)
    tDisc(g, acx, springY, R + 3, (x, y, d) => {
      if (y > springY) return;
      if (d > R + 3 || d < R - band) return;
      if (breakAt < 0 && x < acx - R * 0.3 && y < springY - R * 0.4) return; // knocked-out chunk (left)
      if (breakAt > 0 && x > acx + R * 0.3 && y < springY - R * 0.4) return; // (right)
      let c = x < acx ? st[0] : st[1];
      const edge = d > R + 2 || d < R - band + 1.3;
      if (edge) c = st[3];else if (hash2(x, y, 604) < 0.10) c = bn[2]; // pale weather bloom
      P(g, x, y, c);
    });
    // dripping algae streaks down the inner faces
    for (let s = 0; s < 3; s++) {
      const dx2 = acx - R + 2 + s * R;
      for (let k = 0; k < 5; k++) P(g, dx2, springY + 1 + k, RAMP.grass[3]);
    }
  }
  arch(cx - 30, baseY - 30, 16, 6, +1);
  arch(cx + 26, baseY - 36, 19, 7, -1);
  // a lone toppled capstone half in the water (foreground left)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) {
    let c = st[1];
    if (i < 2) c = st[0];
    if (i > 13) c = st[3];
    if (j > 3) c = st[3];
    P(g, cx - 52 + i, baseY - 4 - j + Math.round(i * 0.25), c);
  }

  // 2-frame water shimmer (pale speculars drift ±1px) + a rising bubble
  const DX = [0, 1],
    DY = [0, -1];
  const specs = [[cx - 18, baseY + 4], [cx + 4, baseY - 2], [cx + 30, baseY + 6], [cx - 40, baseY + 8], [cx + 16, baseY + 10]];
  specs.forEach((s, i) => {
    const sx = s[0] + DX[(frame + i) % 2],
      sy = s[1] + DY[(frame + i) % 2];
    if ((sx - cx) ** 2 / 58 ** 2 + (sy - baseY) ** 2 / 18 ** 2 <= 0.84) {
      P(g, sx, sy, wa[0]);
      P(g, sx + 1, sy, wa[0]);
    }
  });
  if (frame === 1) {
    P(g, cx - 6, baseY + 2, wa[0]);
    P(g, cx - 6, baseY + 1, bn[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ===================== 2 · BARROW-CRYPT (116×100, 2f doorway glow) ===================== */
function drawBarrowCrypt(frame) {
  frame = frame || 0;
  const g = makeGrid(116, 100);
  const gr = RAMP.grass,
    dt = RAMP.dirt,
    st = RAMP.stone,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const cx = 58,
    baseY = 92;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 4, 52, {
    ash: false
  });

  // low, broad, grass-grown burial mound
  const maxH = 50;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(54 * Math.pow(1 - Math.pow(t, 2.4), 0.5));
    hw += Math.round((hash2(yy, 0, 611) - 0.5) * 5);
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 612);
      let c = gr[1];
      if (xx < -hw + 6) c = gr[0]; // moonlit back-left
      else if (xx > hw - 6) c = gr[3]; // shadow right
      else if (h < 0.10) c = gr[2];else if (h < 0.13) c = gr[0];
      if (h > 0.95) c = dt[2]; // bare earth scars
      // earth showing through near the base
      if (yy < 8 && h < 0.35) c = dt[2];
      P(g, cx + xx, top, c);
    }
  }
  // grass tufts on the crown
  for (let i = 0; i < 10; i++) {
    const tx = cx - 30 + Math.floor(hash2(i, 1, 613) * 60);
    const ty = baseY - maxH + 2 + Math.floor(hash2(i, 2, 613) * 8);
    for (let k = 0; k < 3; k++) P(g, tx, ty - k, gr[k > 1 ? 0 : 2]);
  }

  // dark stone trilithon doorway at the south base (two jambs + lintel)
  const dw = 22,
    dh = 30,
    dx0 = cx - dw / 2,
    dtop = baseY - dh;
  // jambs
  for (const side of [-1, 1]) {
    const jx = cx + side * (dw / 2 + 2);
    for (let y = dtop - 2; y <= baseY; y++) for (let x = -3; x <= 3; x++) {
      let c = side < 0 ? st[0] : st[2];
      if (x > 1) c = st[3];
      if (hash2(jx + x, y, 614) < 0.08) c = st[2];
      P(g, jx + x, y, c);
    }
  }
  // lintel slab
  for (let j = 0; j < 5; j++) for (let i = -dw / 2 - 5; i <= dw / 2 + 5; i++) {
    let c = i < 0 ? st[1] : st[2];
    if (i < -dw / 2 - 2) c = st[0];
    if (i > dw / 2 + 2) c = st[3];
    P(g, cx + i, dtop - 2 - j, c);
  }
  // dark doorway void
  for (let j = 0; j < dh; j++) for (let i = -dw / 2 + 1; i <= dw / 2 - 1; i++) {
    const t = Math.abs(i) / (dw / 2);
    if (j < dh * 0.18 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  // faint drift glow seeping from the doorway (blinks per frame)
  const bright = frame === 1;
  const gy = baseY - 10;
  [[-3, bright ? dr[1] : dr[3]], [3, bright ? dr[2] : dr[3]], [0, bright ? dr[0] : dr[2]]].forEach(([ox, c]) => {
    P(g, cx + ox, gy, c);
    P(g, cx + ox, gy + 1, bright ? dr[2] : dr[3]);
    if (bright) {
      P(g, cx + ox, gy - 1, dr[2]);
    }
  });
  if (bright) for (let x = -dw / 2 + 2; x <= dw / 2 - 2; x++) if ((cx + x) % 2 === 0) P(g, cx + x, baseY + 1, dr[3]);

  // bone accents — ribs & skulls half-buried around the base, markers on top
  if (typeof boneSpikeShape === 'function') {
    [[-44, 7, -0.5], [44, 7, 0.5], [-30, 5, -0.2], [32, 6, 0.3]].forEach(([ox, h, ln]) => boneSpikeShape(g, cx + ox, baseY + 1, h + 4, ln));
  }
  const rng = mulberry(615);
  for (let i = 0; i < 4; i++) {
    const kx = cx - 40 + Math.floor(rng() * 80),
      ky = baseY + 1 + Math.floor(rng() * 4);
    if (Math.abs(kx - cx) < dw / 2 + 6) continue;
    fillRect(g, kx, ky - 2, 4, 3, bn[1]);
    P(g, kx + 1, ky - 1, RAMP.void);
    P(g, kx + 3, ky - 1, RAMP.void);
    P(g, kx + 1, ky + 1, bn[2]);
  }
  // a leaning bone marker post on the crown
  for (let k = 0; k < 10; k++) P(g, cx - 14 + Math.round(k * 0.2), baseY - maxH + 6 - k, bn[2]);
  P(g, cx - 12, baseY - maxH - 4, bn[1]);
  P(g, cx - 13, baseY - maxH - 3, bn[1]);
  P(g, cx - 11, baseY - maxH - 3, bn[1]);
  outline(g, RAMP.void);
  return g;
}

/* ===================== 3 · ASHEN WARCAMP (120×104, 2f ember flicker) ===================== */
function drawAshenWarcamp(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 104);
  const dt = RAMP.dirt,
    bl = RAMP.blood,
    bn = RAMP.bone,
    em = RAMP.ember,
    st = RAMP.stone;
  const cx = 60,
    baseY = 96;

  // ashen ground pad (dirt + dark ash dither)
  for (let dy = -16; dy <= 16; dy++) for (let dx = -56; dx <= 56; dx++) {
    if ((dx / 56) ** 2 + (dy / 16) ** 2 > 1) continue;
    const h = hash2(cx + dx, baseY + dy, 621);
    let c = dt[2];
    if (h < 0.16) c = RAMP.ash;else if (h < 0.22) c = dt[3];
    if (dy < -4 && dx < 0) c = dt[1];
    P(g, cx + dx, baseY + dy, c);
  }

  // crude palisade of sharpened stakes arcing across the back
  const stakes = 13;
  for (let i = 0; i < stakes; i++) {
    const t = i / (stakes - 1);
    const sx = cx - 46 + Math.round(t * 92);
    const sy = baseY - 30 - Math.round(Math.sin(t * Math.PI) * 8); // arc up in the middle (recede)
    const h = 22 + Math.floor(hash2(i, 1, 622) * 6);
    const lean = Math.round((hash2(i, 2, 622) - 0.5) * 2);
    for (let k = 0; k < h; k++) {
      const px = sx + Math.round(lean * (k / h));
      let c = dt[1];
      if (i % 2) c = dt[2];
      if (k < 3) c = dt[3]; // sharpened dark tip
      P(g, px, sy - k, c);
      P(g, px + 1, sy - k, dt[3]);
    }
    // sharpened point
    P(g, sx + lean, sy - h, dt[3]);
    P(g, sx + lean, sy - h + 1, dt[2]);
  }
  // lashing rope across the stakes
  for (let x = cx - 44; x <= cx + 44; x++) {
    const t = (x - (cx - 44)) / 88;
    const ry = baseY - 30 - Math.round(Math.sin(t * Math.PI) * 8) - 12;
    P(g, x, ry, bn[3]);
  }
  // a skull impaled on the tallest stake
  fillRect(g, cx - 2, baseY - 58, 5, 4, bn[1]);
  P(g, cx - 1, baseY - 57, RAMP.void);
  P(g, cx + 1, baseY - 57, RAMP.void);
  P(g, cx, baseY - 55, bn[2]);

  // helper: a raider tent (angular hide cloth)
  function tent(tx, by, w, hgt, ramp) {
    // triangular hide tent: narrow at the apex (top), wide at the base
    for (let row = 0; row <= hgt; row++) {
      const t = row / hgt,
        hw = Math.round(w / 2 * t);
      const sy = by - hgt + row;
      for (let x = -hw; x <= hw; x++) {
        let c = ramp[1];
        if (x < -hw + 2) c = ramp[0];
        if (x > hw - 2) c = ramp[2];
        if ((x - row) % 6 === 0) c = ramp[3]; // hide-seam stitching (runs down the slope)
        if (hash2(tx + x, sy, 623) < 0.05) c = ramp[3];
        P(g, tx + x, sy, c);
      }
      // lashed lower hem
      if (row === hgt) for (let x = -hw; x <= hw; x++) if (x % 2 === 0) P(g, tx + x, sy, ramp[3]);
    }
    // crossed ridge poles poking out the apex
    for (let k = 0; k < 6; k++) P(g, tx, by - hgt - k, dt[3]);
    P(g, tx - 2, by - hgt - 4, dt[3]);
    P(g, tx + 2, by - hgt - 5, dt[3]);
    // dark triangular entrance flap at the base center
    const eh = Math.round(hgt * 0.55);
    for (let j = 0; j < eh; j++) {
      const ew = Math.round((1 - j / eh) * 4);
      for (let i = -ew; i <= ew; i++) P(g, tx + i, by - j, RAMP.void);
    }
    // tied-back flap edges (lit)
    for (let j = 0; j < eh; j++) {
      const ew = Math.round((1 - j / eh) * 4);
      P(g, tx - ew - 1, by - j, ramp[0]);
      P(g, tx + ew + 1, by - j, ramp[2]);
    }
    // guy-lines pegged to the ground
    for (let k = 0; k < 4; k++) {
      P(g, tx - Math.round(w / 2) - 1 - k, by - 2 + k, dt[3]);
      P(g, tx + Math.round(w / 2) + 1 + k, by - 2 + k, dt[3]);
    }
  }
  tent(cx - 30, baseY, 34, 30, dt);
  tent(cx + 26, baseY - 2, 28, 26, bl);

  // war-banner on a pole (right) — blood cloth, bone finial; 2f flutter
  const bx = cx + 46,
    byTop = baseY - 54;
  for (let y = byTop; y <= baseY; y++) P(g, bx, y, dt[3]);
  P(g, bx, byTop - 1, bn[1]);
  P(g, bx - 1, byTop - 2, bn[2]);
  P(g, bx + 1, byTop - 2, bn[2]); // bone finial
  const flutter = frame === 1 ? 1 : 0;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 14; i++) {
    const wob = Math.round(Math.sin(j * 0.4 + frame) * 1.3) + (i > 9 ? flutter : 0);
    let c = bl[2];
    if (i === 0) c = bl[1];
    if (i >= 12) c = bl[3];
    if (i > 9 + flutter && j > 16) continue; // notched/torn tail
    P(g, bx - 1 - i + wob, byTop + 2 + j, c);
  }
  // bone emblem on the banner
  fillRect(g, bx - 7, byTop + 9, 3, 4, bn[1]);
  P(g, bx - 6, byTop + 10, RAMP.void);
  P(g, bx - 8, byTop + 13, bn[2]);
  P(g, bx - 4, byTop + 13, bn[2]);

  // central campfire — logs + ember flame (2f flicker) + warm glow
  const fxp = cx - 4,
    fy = baseY - 2;
  for (let i = -6; i <= 6; i++) P(g, fxp + i, fy, dt[3]); // log bed
  P(g, fxp - 4, fy - 1, dt[2]);
  P(g, fxp + 4, fy - 1, dt[2]);
  const sway = [0, 1][frame],
    tall = [0, 2][frame];
  for (let yy = 0; yy <= 11 + tall; yy++) {
    const t = yy / (11 + tall),
      hw = Math.round((1 - t) * 5);
    const sxf = fxp + Math.round(Math.sin(yy * 0.6 + frame) * 1.1) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = em[1];
      if (Math.abs(xx) >= hw - 1) c = em[2];
      if (yy < 4 && Math.abs(xx) < 2) c = em[0];
      P(g, sxf + xx, fy - 2 - yy, c);
    }
  }
  for (let yy = 2; yy <= 6 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (7 + tall)) * 2));
    for (let xx = -hw; xx <= hw; xx++) P(g, fxp + xx, fy - 4 - yy, RAMP.gold[0]);
  }
  if (frame === 1) P(g, fxp + sway, fy - 15 - tall, em[0]);
  // warm glow halo (dither, pulses)
  const rr = frame === 1 ? 11 : 9;
  for (let yy = -9; yy <= 3; yy++) for (let xx = -12; xx <= 12; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 6 && d < rr && (xx + yy + frame) % 2 === 0) P(g, fxp + xx, fy - 5 + yy, em[2]);
  }

  // a couple of crates / loot by the fire
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    let c = dt[1];
    if (i === 0) c = dt[0];
    if (i === 7) c = dt[2];
    if (i === 0 || i === 7 || j === 0 || j === 7) c = dt[3];
    if (i === j || i === 7 - j) c = dt[2];
    P(g, cx + 16 + i, baseY - 8 + j, c);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const CAMPS = {
  drowned_ruins: {
    fn: i => drawDrownedRuins(i),
    cell: [120, 96],
    anchor: [60, 95],
    frames: 2,
    footprint: '3x3',
    tile: true,
    labelClear: true,
    anim: {
      name: 'idle',
      fps: 2
    }
  },
  barrow_crypt: {
    fn: i => drawBarrowCrypt(i),
    cell: [116, 100],
    anchor: [58, 99],
    frames: 2,
    footprint: '3x3',
    tile: true,
    labelClear: true,
    anim: {
      name: 'idle',
      fps: 2
    }
  },
  ashen_warcamp: {
    fn: i => drawAshenWarcamp(i),
    cell: [120, 104],
    anchor: [60, 103],
    frames: 2,
    footprint: '3x3',
    tile: true,
    labelClear: true,
    anim: {
      name: 'idle',
      fps: 2
    }
  }
};
Object.assign(globalThis, {
  drawDrownedRuins,
  drawBarrowCrypt,
  drawAshenWarcamp,
  CAMPS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/camps.js", error: String((e && e.message) || e) }); }

// assets/_gen/character.js
try { (() => {
// Naevyr character generator — hooded Drift-touched wanderer.
// 32×40 cell, ~30px tall, feet at bottom-center. 5 facings (s,se,e,ne,n);
// engine mirrors for w/sw/nw. Anim: idle 2f · walk 6f · swing 4f.

function drawWanderer(facing, anim, f) {
  const g = makeGrid(32, 40);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone;
  const cx = 16;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const off = [0, 1, 2, 1, 0][dir]; // lateral shift toward facing
  const showFace = dir <= 2;
  let bob = 0,
    hemSway = 0;
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    hemSway = [0, 1, 1, 0, -1, -1][f];
  }
  if (anim === 'idle') {
    hemSway = f === 1 ? 1 : 0;
  }
  const top = 9 + bob;
  const shoulderY = 18 + bob;

  // ---- cloak body (stooped taper, shoulder→hem) ----
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const halfw = Math.round(3.6 + t * 3.4); // ~4 → 7
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x <= cxx - halfw + 1) c = st[0]; // moonlit left edge
      if (x >= cxx + halfw - 1) c = st[3]; // shadow right
      if (hash2(x, y, 61) < 0.06) c = st[2]; // worn cloth
      if (dir >= 3 && x === cxx) c = st[2]; // back seam
      P(g, x, y, c);
    }
  }
  // ---- hem glow (corruption creeping up from the ground) ----
  for (let y = 35; y <= 36; y++) for (let x = 0; x < 32; x++) {
    const v = G(g, x, y);
    if (v) P(g, x, y, y === 36 ? hash2(x, y, 63) < 0.3 ? dr[2] : dr[3] : hash2(x, y, 63) < 0.25 ? dr[3] : v.c);
  }

  // ---- hood ----
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const halfw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.4);
    const cxx = cx + off;
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x === cxx - halfw) c = st[0];
      if (x >= cxx + halfw - 1) c = st[3];
      if (y === top) c = st[0];
      P(g, x, y, c);
    }
  }
  // hood point (droops toward facing)
  P(g, cx + off, top - 1, st[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, st[2]);

  // ---- face shadow + Drift eyes ----
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0);
    const w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    const blink = anim === 'idle' && f === 1;
    if (dir === 0) {
      P(g, fcx - 1, ey, blink ? dr[3] : dr[2]);
      P(g, fcx + 1, ey, blink ? dr[3] : dr[1]);
    }
    if (dir === 1) {
      P(g, fcx, ey, blink ? dr[3] : dr[2]);
      P(g, fcx + 2, ey, blink ? dr[3] : dr[1]);
    }
    if (dir === 2) {
      P(g, fcx + 1, ey, blink ? dr[3] : dr[1]);
    }
  }
  // idle mote drifting off the shoulder
  if (anim === 'idle' && f === 1) P(g, cx + off + 7, top + 3, dr[1]);

  // ---- feet ----
  const footY = 37;
  let step = 0;
  if (anim === 'walk') step = [2, 1, 0, -2, -1, 0][f];
  const fo = dir >= 1 ? 1 : 0;
  P(g, cx - 3 + fo + step, footY, st[3]);
  P(g, cx - 2 + fo + step, footY, RAMP.void);
  P(g, cx + 2 + fo - step, footY, RAMP.void);
  P(g, cx + 3 + fo - step, footY, st[3]);

  // ---- gather/swing arm + tool ----
  if (anim === 'swing') {
    const hx = cx + off + 4,
      hy = shoulderY + 2;
    const ang = [-2.1, -1.35, -0.45, 0.35][f];
    for (let k = 2; k < 8; k++) {
      const x = Math.round(hx + Math.cos(ang) * k),
        y = Math.round(hy + Math.sin(ang) * k);
      P(g, x, y, k < 4 ? st[2] : RAMP.dirt[0]); // sleeve → wooden haft
    }
    const ex = Math.round(hx + Math.cos(ang) * 8),
      ey2 = Math.round(hy + Math.sin(ang) * 8);
    fillRect(g, ex - 1, ey2 - 1, 3, 2, bn[2]); // tool head
    P(g, ex, ey2 - 2, bn[1]);
    if (f === 2) {
      P(g, ex + 2, ey2, bn[0]);
      P(g, ex + 3, ey2 + 1, RAMP.ember[0]);
    } // hit spark
  }
  outline(g);
  return g;
}
const WANDER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const WANDER_ANIMS = [['idle', 2], ['walk', 6], ['swing', 4]];
function wandererSheetGrids() {
  // rows = facings, cols = 12 frames (idle0..1, walk0..5, swing0..3)
  const rows = [];
  WANDER_FACINGS.forEach(fc => {
    const row = [];
    WANDER_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(drawWanderer(fc, anim, f));
    });
    rows.push(row);
  });
  return rows;
}
Object.assign(globalThis, {
  drawWanderer,
  wandererSheetGrids,
  WANDER_FACINGS,
  WANDER_ANIMS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/character.js", error: String((e && e.message) || e) }); }

// assets/_gen/critters.js
try { (() => {
// Naevyr "FILL THE REALM" · AMBIENT WILDLIFE — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2; ell from beasts.js).
//
// Small wandering creatures for movement/life, style-matched to the pet/beast rigs.
// Each: idle + move anims. Flyers are flat (no facings); ground critters carry at least
// left/right (facing 'e' + engine mirror to 'w'). RAMP only, 1px void outline (billboards),
// dither not blur, moonlit-left / shadowed-right, bottom-center anchor.
//
// Registry: { fn(facing, anim, frame), cell:[w,h], anchor:[x,y], facings:[...],
//   mirror:{w:'e',...}|null, anims:[[name,count,fps],...], fly?:{height, shadow:[rx,ry]} }.
// Flyers: the SPRITE is drawn at the top of its cell; the engine offsets it up by fly.height
// and draws a ground shadow (fly.shadow ellipse) at the anchor.

/* ----------------------------- shared critter bits ----------------------------- */
function critterShadow(g, cx, cy, rx, ry) {
  ell(g, cx, cy, rx, ry, (x, y, d) => {
    if (d > 0.6 && (x + y) % 2) return;
    P(g, x, y, RAMP.void, 0.45);
  });
}
// a small dithered wing (for birds/insects), from (x0,y0) sweeping by angle, length L
function wing(g, x0, y0, dx, dy, L, ramp, lead) {
  for (let k = 0; k < L; k++) {
    const x = Math.round(x0 + dx * k),
      y = Math.round(y0 + dy * k);
    P(g, x, y, k < 1 ? ramp[0] : k > L - 2 ? ramp[2] : ramp[1]);
    if (lead) P(g, x, y - 1, ramp[0]);
  }
}

/* =============================== DEER (24×28) =============================== */
// idle 2f, walk 4f, 3 facings s/e/n + mirror. Calm forest deer; tan dirt-ramp coat.
function drawDeer(facing, anim, f) {
  const g = makeGrid(24, 28);
  const co = RAMP.dirt,
    bn = RAMP.bone,
    baseY = 26,
    cx = 12;
  const breath = anim === 'idle' ? f === 1 ? -1 : 0 : 0;
  const oy = breath;
  // gait: 4-frame walk, alternating diagonal legs
  const swA = anim === 'walk' ? [2, 0, -2, 0][f] : 0;
  const swB = anim === 'walk' ? [-2, 0, 2, 0][f] : 0;
  const headBob = anim === 'walk' ? [0, -1, 0, -1][f] : anim === 'idle' && f === 1 ? -1 : 0;
  function leg(x, topY, sw, ramp) {
    for (let y = topY; y <= baseY - 1; y++) {
      const t = (y - topY) / (baseY - topY);
      P(g, Math.round(x + sw * t), y, y > baseY - 3 ? RAMP.void : ramp[2]);
    }
  }
  if (facing === 'e') {
    critterShadow(g, cx, baseY, 10, 2);
    // far legs
    leg(cx - 4, 16 + oy, swB, co);
    leg(cx + 5, 16 + oy, swA, co);
    // barrel
    ell(g, cx, 15 + oy, 8, 5, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.3) c = co[0];
      if (dy > 0.4) c = co[2];
      if (d > 0.78) c = co[2];
      P(g, x, y, c);
    });
    P(g, cx - 6, 17 + oy, bn[1]); // pale rump/belly
    // tail
    P(g, cx - 8, 13 + oy, co[2]);
    P(g, cx - 8, 12 + oy, bn[0]);
    // near legs
    leg(cx - 3, 17 + oy, swA, co);
    leg(cx + 6, 17 + oy, swB, co);
    // neck + head up-right
    for (let k = 0; k < 7; k++) {
      const x = cx + 6 + Math.round(k * 0.5),
        y = 14 + oy - k + headBob;
      for (let i = 0; i < 3; i++) P(g, x + i, y, i === 0 ? co[0] : co[1]);
    }
    const hx = cx + 11,
      hy = 8 + oy + headBob;
    ell(g, hx, hy, 2.4, 2, (x, y, d, dx) => {
      let c = co[1];
      if (dx < -0.2) c = co[0];
      if (d > 0.7) c = co[2];
      P(g, x, y, c);
    });
    for (let k = 0; k < 3; k++) P(g, hx + 1 + k, hy + 1 + k, co[2]); // muzzle
    P(g, hx + 3, hy + 3, RAMP.void); // nose
    P(g, hx, hy - 1, RAMP.void); // eye
    // ears + small antler nubs
    P(g, hx - 2, hy - 2, co[2]);
    P(g, hx + 1, hy - 2, co[1]);
    P(g, hx, hy - 3, bn[3]);
    P(g, hx + 1, hy - 4, bn[2]);
  } else if (facing === 's') {
    critterShadow(g, cx, baseY, 8, 2);
    leg(cx - 4, 18 + oy, 0, co);
    leg(cx + 4, 18 + oy, 0, co);
    leg(cx - 2, 18 + oy, swA, co);
    leg(cx + 2, 18 + oy, swB, co);
    ell(g, cx, 15 + oy, 6, 6, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dx < -0.25) c = co[0];
      if (dx > 0.3) c = co[2];
      if (d > 0.8) c = co[2];
      P(g, x, y, c);
    });
    P(g, cx, 19 + oy, bn[1]);
    // neck + head toward viewer
    for (let k = 0; k < 5; k++) for (let i = -2; i <= 2; i++) P(g, cx + i, 12 + oy - k + headBob, i < 0 ? co[0] : co[1]);
    const hy = 7 + oy + headBob;
    ell(g, cx, hy, 3, 2.6, (x, y, d, dx) => {
      let c = co[1];
      if (dx < -0.2) c = co[0];
      if (d > 0.78) c = co[2];
      P(g, x, y, c);
    });
    P(g, cx, hy + 2, RAMP.void); // nose
    P(g, cx - 2, hy - 1, RAMP.void);
    P(g, cx + 2, hy - 1, RAMP.void); // eyes
    P(g, cx - 3, hy - 2, co[2]);
    P(g, cx + 3, hy - 2, co[1]); // ears
    P(g, cx - 1, hy - 4, bn[3]);
    P(g, cx + 1, hy - 4, bn[3]); // antler nubs
  } else {
    // n — rear, head away
    critterShadow(g, cx, baseY, 8, 2);
    // small head/neck away at top first
    for (let k = 0; k < 4; k++) for (let i = -1; i <= 1; i++) P(g, cx + i, 9 + oy - k, co[2]);
    ell(g, cx, 7 + oy, 2.2, 2, (x, y, d) => P(g, x, y, d > 0.6 ? co[3] : co[2]));
    P(g, cx - 2, 5 + oy, co[3]);
    P(g, cx + 2, 5 + oy, co[3]); // ear backs
    leg(cx - 4, 18 + oy, swA, co);
    leg(cx + 4, 18 + oy, swB, co);
    leg(cx - 2, 18 + oy, swB, co);
    leg(cx + 2, 18 + oy, swA, co);
    // rump toward viewer
    ell(g, cx, 15 + oy, 6, 6, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.3) c = co[0];
      if (Math.abs(dx) > 0.5) c = co[2];
      if (d > 0.8) c = co[2];
      P(g, x, y, c);
    });
    P(g, cx, 12 + oy, bn[0]); // white tail flash
    P(g, cx, 13 + oy, bn[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== RABBIT (14×14) =============================== */
// idle 2f (ear twitch), hop 3f (crouch/leap/land); facing e + mirror.
function drawRabbit(facing, anim, f) {
  const g = makeGrid(14, 14),
    co = RAMP.bone,
    dt = RAMP.dirt,
    baseY = 13,
    cx = 6;
  const hop = anim === 'hop' ? f : -1; // 0 crouch, 1 leap (airborne), 2 land
  const lift = hop === 1 ? 3 : 0; // leap lifts the body
  const stretch = hop === 1 ? 1 : 0;
  const earTw = anim === 'idle' && f === 1 ? 1 : 0;
  const oy = -lift;
  if (hop !== 1) critterShadow(g, cx + 1, baseY, 5, 1.5);else critterShadow(g, cx + 3, baseY, 4, 1);
  // hind feet
  if (hop !== 1) {
    P(g, cx - 2, baseY - 1, co[2]);
    P(g, cx - 1, baseY - 1, co[1]);
    P(g, cx - 2, baseY, dt[3]);
  }
  // body (crouched egg shape, stretches when leaping)
  ell(g, cx, baseY - 4 + oy, 4 + stretch, 4 - stretch, (x, y, d, dx, dy) => {
    let c = co[1];
    if (dy < -0.3) c = co[0];
    if (d > 0.74) c = co[2];
    P(g, x, y, c);
  });
  // head + nose to the right
  const hx = cx + 4 + stretch,
    hy = baseY - 6 + oy;
  ell(g, hx, hy, 2.2, 2, (x, y, d, dx) => {
    let c = co[1];
    if (dx < -0.2) c = co[0];
    if (d > 0.7) c = co[2];
    P(g, x, y, c);
  });
  P(g, hx + 2, hy, RAMP.void); // eye
  P(g, hx + 2, hy + 1, dt[2]); // nose
  // two tall ears (twitch on idle)
  P(g, hx - 1, hy - 2 - earTw, co[1]);
  P(g, hx - 1, hy - 3 - earTw, co[2]);
  P(g, hx - 1, hy - 4 - earTw, co[2]);
  P(g, hx + 1, hy - 2, co[0]);
  P(g, hx + 1, hy - 3, co[1]);
  P(g, hx + 1, hy - 4, co[2]);
  // cotton tail
  P(g, cx - 4, baseY - 5 + oy, co[0]);
  P(g, cx - 4, baseY - 4 + oy, co[1]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== FROG (12×10) =============================== */
// idle 2f (throat puff), hop 2f; facing e + mirror.
function drawFrog(facing, anim, f) {
  const g = makeGrid(12, 10),
    gr = RAMP.grass,
    baseY = 9,
    cx = 6;
  const leap = anim === 'hop' && f === 1;
  const oy = leap ? -2 : 0;
  const puff = anim === 'idle' && f === 1 ? 1 : 0;
  critterShadow(g, cx, baseY, 5, 1.5);
  // hind legs folded (extend on leap)
  if (leap) {
    for (let k = 0; k < 4; k++) P(g, cx - 3 - k, baseY - 1, gr[2]);
  } else {
    P(g, cx - 4, baseY - 1, gr[2]);
    P(g, cx - 4, baseY - 2, gr[1]);
    P(g, cx + 4, baseY - 1, gr[2]);
  }
  // body
  ell(g, cx, baseY - 3 + oy, 4, 3, (x, y, d, dx, dy) => {
    let c = gr[1];
    if (dy < -0.3) c = gr[0];
    if (d > 0.74) c = gr[2];
    P(g, x, y, c);
  });
  // throat
  for (let i = -1; i <= 1; i++) P(g, cx + 2 + i, baseY - 1 + oy, gr[0]);
  if (puff) {
    P(g, cx + 2, baseY + oy, gr[1]);
  }
  // eyes bulging on top
  P(g, cx - 1, baseY - 6 + oy, gr[0]);
  P(g, cx - 1, baseY - 7 + oy, RAMP.void);
  P(g, cx + 2, baseY - 6 + oy, gr[0]);
  P(g, cx + 2, baseY - 7 + oy, RAMP.void);
  P(g, cx, baseY - 5 + oy, gr[2]); // top of head
  outline(g, RAMP.void);
  return g;
}

/* =============================== SONGBIRD (12×10) =============================== */
// hop 2f, fly 2f; facing e + mirror. Small meadow/woods bird, ember breast.
function drawSongbird(facing, anim, f) {
  const g = makeGrid(12, 10),
    co = RAMP.stone,
    em = RAMP.ember,
    baseY = 9,
    cx = 6;
  const fly = anim === 'fly';
  const oy = fly ? -2 : anim === 'hop' && f === 1 ? -1 : 0;
  if (!fly) critterShadow(g, cx, baseY, 4, 1.2);
  // legs (only when grounded)
  if (!fly) {
    P(g, cx, baseY - 1, em[3]);
    P(g, cx + 1, baseY - 1, em[3]);
  }
  // plump body
  ell(g, cx, baseY - 4 + oy, 3, 3, (x, y, d, dx, dy) => {
    let c = co[1];
    if (dy < -0.3) c = co[0];
    if (d > 0.74) c = co[2];
    P(g, x, y, c);
  });
  // ember breast
  P(g, cx + 1, baseY - 3 + oy, em[1]);
  P(g, cx + 2, baseY - 3 + oy, em[0]);
  P(g, cx + 1, baseY - 2 + oy, em[2]);
  // head + beak
  P(g, cx + 3, baseY - 5 + oy, co[0]);
  P(g, cx + 4, baseY - 5 + oy, co[1]);
  P(g, cx + 5, baseY - 5 + oy, em[2]); // beak
  P(g, cx + 4, baseY - 6 + oy, RAMP.void); // eye-ish dark crown
  P(g, cx + 4, baseY - 5 + oy, RAMP.void);
  // wing — folded (hop) / spread (fly, up or down by frame)
  if (fly) {
    const up = f === 0;
    wing(g, cx, baseY - 4 + oy, -1.2, up ? -1 : 1, 4, co, false);
  } else {
    for (let k = 0; k < 3; k++) P(g, cx - 1 - k, baseY - 4 + oy, co[2]);
  }
  // tail
  for (let k = 0; k < 3; k++) P(g, cx - 3 - k, baseY - 3 + oy + (fly ? 1 : 0), co[2]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== CROW (16×16, flat flyer) =============================== */
// perch/idle 2f, fly 2f. Ashen Flats / Bonefields. Black bird, drift-glint eye.
function drawCrow(facing, anim, f) {
  const g = makeGrid(16, 16),
    bk = ['#322b46', '#211c30', '#14101e', '#0a0810'],
    dr = RAMP.drift,
    cx = 8;
  const fly = anim === 'fly';
  const cy = fly ? 7 : 10;
  if (anim === 'perch') {
    // perched, folded wings; subtle head turn on f1
    const ht = f === 1 ? 1 : 0;
    P(g, cx, 14, bk[2]);
    P(g, cx + 1, 14, bk[2]); // feet
    ell(g, cx, cy, 4, 4, (x, y, d, dx, dy) => {
      let c = bk[1];
      if (dy < -0.3) c = bk[0];
      if (d > 0.74) c = bk[2];
      P(g, x, y, c);
    });
    // tail down
    for (let k = 0; k < 4; k++) P(g, cx - 3 - 0, cy + 2 + k, bk[2]);
    // head + beak
    P(g, cx + 3 + ht, cy - 3, bk[0]);
    P(g, cx + 4 + ht, cy - 3, bk[1]);
    P(g, cx + 5 + ht, cy - 3, bk[3]);
    P(g, cx + 6 + ht, cy - 3, bk[3]); // beak
    P(g, cx + 4 + ht, cy - 4, bk[0]);
    P(g, cx + 4 + ht, cy - 3, dr[1]); // drift-glint eye
  } else {
    // flying — wings up (f0) / down (f1), body tilted
    ell(g, cx, cy, 3, 2.4, (x, y, d, dx, dy) => {
      let c = bk[1];
      if (dy < -0.3) c = bk[0];
      if (d > 0.74) c = bk[2];
      P(g, x, y, c);
    });
    const up = f === 0;
    wing(g, cx - 1, cy, -1.4, up ? -1 : 0.8, 6, bk, false);
    wing(g, cx + 1, cy, 1.4, up ? -1 : 0.8, 6, bk, false);
    // head + beak forward
    P(g, cx + 3, cy - 1, bk[0]);
    P(g, cx + 4, cy - 1, bk[2]);
    P(g, cx + 5, cy - 1, bk[3]);
    P(g, cx + 3, cy - 1, dr[2]);
    // tail
    for (let k = 0; k < 3; k++) P(g, cx - 3 - k, cy + 1, bk[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== VULTURE (18×16, flat flyer) =============================== */
// glide 2f, flap 2f. Bonefields. Broad dark wings, bone-bald head, blood ruff.
function drawVulture(facing, anim, f) {
  const g = makeGrid(18, 16),
    co = RAMP.dirt,
    bn = RAMP.bone,
    bl = RAMP.blood,
    cx = 9,
    cy = 8;
  const flap = anim === 'flap';
  // body
  ell(g, cx, cy, 3, 2.6, (x, y, d, dx, dy) => {
    let c = co[2];
    if (dy < -0.3) c = co[1];
    if (d > 0.74) c = co[3];
    P(g, x, y, c);
  });
  // broad wings — glide = near-flat (slight dihedral wobble by f); flap = up/down
  let wy;
  if (glideOrFlap()) wy = flap ? f === 0 ? -2 : 1 : f === 0 ? 0 : -1;
  function glideOrFlap() {
    return true;
  }
  for (let s = -1; s <= 1; s += 2) {
    for (let k = 1; k <= 7; k++) {
      const x = cx + s * k;
      const y = cy - 1 + Math.round(wy * (k / 7)) + (k > 4 ? 1 : 0);
      let c = co[2];
      if (k <= 2) c = co[1];
      if (k > 5) c = co[3];
      P(g, x, y, c);
      if (k > 4) P(g, x, y + 1, RAMP.void); // finger feather tips
    }
  }
  // bone-bald head + hooked beak + blood ruff
  P(g, cx + 3, cy - 2, bn[2]);
  P(g, cx + 4, cy - 2, bn[1]);
  P(g, cx + 5, cy - 2, bn[3]);
  P(g, cx + 5, cy - 1, co[3]); // hooked beak
  P(g, cx + 3, cy - 2, RAMP.void); // eye
  P(g, cx + 1, cy - 1, bl[2]);
  P(g, cx + 2, cy, bl[3]); // ruff
  // short tail
  for (let k = 0; k < 3; k++) P(g, cx - 3 - k, cy + 1, co[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== DRAGONFLY (12×8, flat flyer) =============================== */
// hover 2f (wing blur), marsh, fast flit. Drift-blue body, bone wings.
function drawDragonfly(facing, anim, f) {
  const g = makeGrid(12, 8),
    dr = RAMP.drift,
    wt = RAMP.water,
    bn = RAMP.bone,
    cx = 4,
    cy = 4;
  // long thin abdomen trailing right
  for (let k = 0; k < 7; k++) {
    let c = wt[1];
    if (k % 2) c = dr[2];
    if (k > 4) c = wt[2];
    P(g, cx + 1 + k, cy, c);
  }
  P(g, cx + 8, cy, dr[1]); // tail tip
  // thorax + head
  P(g, cx, cy, dr[1]);
  P(g, cx - 1, cy, dr[0]);
  P(g, cx - 2, cy, RAMP.void); // head/eye
  // 4 wings — blurred position alternates per frame
  const up = f === 0;
  // forewings
  wingBlur(cx, cy - 1, up ? -1 : 0);
  wingBlur(cx + 1, cy - 1, up ? -1 : 0);
  function wingBlur(x, y, dy) {
    for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= 3; k++) P(g, x + s * k, y + dy * (k > 1 ? 1 : 0), bn[3]);
  }
  outline(g, RAMP.void);
  // re-lighten wings to read as translucent (no hard void around them is fine; keep subtle)
  return g;
}

/* =============================== FIREFLY (8×8, flat, additive glow) =============================== */
// 2f glow pulse — marsh/meadow at night. Tiny dark body + pulsing gold/drift glow.
function drawFirefly(facing, anim, f) {
  const g = makeGrid(8, 8),
    gd = RAMP.gold,
    dr = RAMP.drift,
    cx = 4,
    cy = 4;
  const bright = f === 0;
  // glow halo (dithered ring; brighter on f0)
  const r = bright ? 3 : 2;
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
    const d = xx * xx + yy * yy;
    if (d > (r - 0.5) * (r - 0.5) && d <= (r + 0.5) * (r + 0.5) && (xx + yy + f) % 2 === 0) P(g, cx + xx, cy + yy, bright ? gd[2] : dr[3]);
  }
  // body + bright tail lantern
  P(g, cx - 1, cy, RAMP.void);
  P(g, cx, cy, RAMP.dirt[3]);
  P(g, cx + 1, cy, bright ? gd[0] : gd[1]);
  P(g, cx + 1, cy - 1, bright ? '#fffdf0' : gd[0]); // lantern core
  P(g, cx, cy + 1, bright ? gd[1] : gd[2]);
  // NO void outline — additive glow reads softer; flat:true
  return g;
}

/* =============================== BUTTERFLY (10×10, flat) =============================== */
// flutter 3f (wings open / mid / closed), meadow day. Drift+gold wings.
function drawButterfly(facing, anim, f) {
  const g = makeGrid(10, 10),
    dr = RAMP.drift,
    gd = RAMP.gold,
    cx = 5,
    cy = 5;
  // body
  for (let k = -2; k <= 2; k++) P(g, cx, cy + k, RAMP.dirt[3]);
  P(g, cx, cy - 3, RAMP.dirt[2]);
  P(g, cx - 1, cy - 4, RAMP.dirt[2]);
  P(g, cx + 1, cy - 4, RAMP.dirt[2]); // antennae
  // wings — spread (f0), mid (f1), nearly closed edge-on (f2)
  const spread = [3, 2, 1][f];
  for (let s = -1; s <= 1; s += 2) {
    for (let wy = -2; wy <= 2; wy++) for (let wx = 1; wx <= spread; wx++) {
      let c = dr[1];
      if (Math.abs(wy) >= 2) c = dr[2];
      if (wx === 1) c = dr[0];
      if (wy === 0 && wx === spread) c = gd[1]; // gold eyespot
      P(g, cx + s * wx, cy + wy, c);
    }
    // lower wing lobe
    if (f < 2) {
      P(g, cx + s * 1, cy + 3, dr[2]);
      P(g, cx + s * 2, cy + 3, dr[2]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const CRITTERS = {
  deer: {
    fn: drawDeer,
    cell: [24, 28],
    anchor: [12, 26],
    facings: ['s', 'e', 'n'],
    mirror: {
      w: 'e'
    },
    anims: [['idle', 2, 2], ['walk', 4, 6]]
  },
  rabbit: {
    fn: drawRabbit,
    cell: [14, 14],
    anchor: [6, 13],
    facings: ['e'],
    mirror: {
      w: 'e'
    },
    anims: [['idle', 2, 2], ['hop', 3, 8]]
  },
  frog: {
    fn: drawFrog,
    cell: [12, 10],
    anchor: [6, 9],
    facings: ['e'],
    mirror: {
      w: 'e'
    },
    anims: [['idle', 2, 2], ['hop', 2, 6]]
  },
  songbird: {
    fn: drawSongbird,
    cell: [12, 10],
    anchor: [6, 9],
    facings: ['e'],
    mirror: {
      w: 'e'
    },
    anims: [['hop', 2, 4], ['fly', 2, 8]],
    fly: {
      height: 14,
      shadow: [4, 1.5]
    }
  },
  crow: {
    fn: drawCrow,
    cell: [16, 16],
    anchor: [8, 14],
    facings: ['_'],
    mirror: null,
    anims: [['perch', 2, 2], ['fly', 2, 6]],
    fly: {
      height: 22,
      shadow: [5, 2]
    }
  },
  vulture: {
    fn: drawVulture,
    cell: [18, 16],
    anchor: [9, 8],
    facings: ['_'],
    mirror: null,
    anims: [['glide', 2, 2], ['flap', 2, 4]],
    fly: {
      height: 34,
      shadow: [7, 2.5]
    }
  },
  dragonfly: {
    fn: drawDragonfly,
    cell: [12, 8],
    anchor: [4, 4],
    facings: ['_'],
    mirror: null,
    anims: [['hover', 2, 12]],
    fly: {
      height: 12,
      shadow: [3, 1]
    }
  },
  firefly: {
    fn: drawFirefly,
    cell: [8, 8],
    anchor: [4, 4],
    facings: ['_'],
    mirror: null,
    anims: [['pulse', 2, 3]],
    fly: {
      height: 16,
      shadow: [2, 1]
    },
    additive: true,
    flat: true
  },
  butterfly: {
    fn: drawButterfly,
    cell: [10, 10],
    anchor: [5, 5],
    facings: ['_'],
    mirror: null,
    anims: [['flutter', 3, 6]],
    fly: {
      height: 14,
      shadow: [3, 1]
    }
  }
};
Object.assign(globalThis, {
  critterShadow,
  wing,
  drawDeer,
  drawRabbit,
  drawFrog,
  drawSongbird,
  drawCrow,
  drawVulture,
  drawDragonfly,
  drawFirefly,
  drawButterfly,
  CRITTERS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/critters.js", error: String((e && e.message) || e) }); }

// assets/_gen/crypt.js
try { (() => {
// Naevyr FRONTIER EXPANSION · CRYPT / RUIN INTERIOR — eval after pixlib.js + tiles.js +
// interiors.js (isoCuboid). Matches the existing interiors pack: a crypt FLOOR variant
// (64×36, 3 seed variants, tiles.js diamond format) + dungeon FIXTURES (bottom-center
// anchored, top 6px clear, each JSON carries a `solid` collision flag like the interiors set).
//   floor_crypt · sarcophagus · rubble_pile · standing_brazier (2f flame @4fps)
//   broken_pillar · bone_pile
// RAMP only, 1px void auto-outline, dither not blur, moonlit-left/shadowed-right.

/* ============================ CRYPT FLOOR (64×36, 3 variants) ============================ */
// Dark cracked flagstone (deep stone ramp), bone fragments + faint gold rune bits +
// dim drift seep welling in the joints. Reads as kin to floor_stone but corrupted.
function makeCryptFloor(seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const face = st[2],
    hi = st[1],
    sh = st[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip + 1px void north edge
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }
  // big crypt flagstones (coarser courses than floor_stone) + cracks
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const joint = (x + 2 * y) % 16 === 0 || (x - 2 * y + 128) % 16 === 0;
    if (joint) {
      P(g, x, y, sh);
      if (hash2(x, y, seedN) < 0.4) P(g, x, y, RAMP.void);
      continue;
    }
    const bx = Math.floor((x + 2 * y) / 16),
      by = Math.floor((x - 2 * y + 128) / 16);
    if (hash2(bx, by, seedN) < 0.22 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
    if (hash2(x, y, seedN + 7) < 0.018) P(g, x, y, RAMP.void); // hairline crack
    // dim drift seep welling from the joints
    if (joint === false && hash2(x, y, seedN + 8) < 0.010) {
      P(g, x, y, dr[3]);
      if (hash2(x, y, seedN + 9) < 0.4) P(g, x, y, dr[2]);
    }
  }
  // a scatter of bone fragments + a worn gold rune fleck per variant
  const rng = mulberry(seedN * 13 + 3);
  for (let i = 0; i < 5; i++) {
    const fx = 14 + Math.floor(rng() * 36),
      fy = 6 + Math.floor(rng() * 20);
    if (!inDiamond(rows, fx, fy)) continue;
    P(g, fx, fy, bn[3]);
    if (rng() < 0.5) P(g, fx + 1, fy, bn[2]);
  }
  const gx = 20 + seedN % 3 * 10,
    gy = 12 + seedN % 2 * 6;
  if (inDiamond(rows, gx, gy)) {
    P(g, gx, gy, gd[2]);
    P(g, gx + 1, gy, gd[3]);
  }
  return g;
}

/* ============================ FIXTURES ============================ */

// SARCOPHAGUS — stone coffin: tapered body (iso) + a heavy lid with a carved
// recumbent figure, bone-and-gold trim, a crack with faint drift seep. SOLID.
function fxSarcophagus() {
  const g = makeGrid(44, 36);
  const st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const baseY = 33,
    cx = 22;
  // coffin body — slightly tapered cuboid (head end wider, left)
  for (let y = 0; y < 12; y++) for (let x = 0; x < 34; x++) {
    const taper = Math.round(x / 34 * 1.5);
    let c = st[1];
    if (x < 2) c = st[0];
    if (x > 31) c = st[2];
    if (y > 9) c = st[3];
    P(g, 4 + x, baseY - y - taper, c);
  }
  // right iso side (shadow)
  for (let d = 1; d <= 6; d++) for (let y = 0; y < 12; y++) P(g, 4 + 33 + d, baseY - y - Math.floor(d / 2), d >= 5 ? st[3] : st[2]);
  // the lid — a wider slab on top with a carved figure
  for (let d = 0; d <= 7; d++) for (let x = -1; x < 35; x++) {
    let c = d === 0 || x < 1 ? st[0] : st[1];
    if (d >= 6) c = st[2];
    P(g, 4 + x + d, baseY - 12 - Math.floor(d / 2), c);
  }
  // recumbent figure carved into the lid (bone, simplified effigy)
  const lx = 12,
    ly = baseY - 14;
  fillRect(g, lx, ly - 2, 16, 1, bn[2]); // body line
  P(g, lx - 1, ly - 2, bn[1]);
  P(g, lx, ly - 3, bn[1]);
  P(g, lx + 1, ly - 3, bn[2]); // head
  fillRect(g, lx + 4, ly - 3, 6, 1, bn[3]);
  fillRect(g, lx + 5, ly - 4, 4, 1, bn[2]); // crossed arms
  // gold trim band + a worn rune on the foot
  for (let x = 4; x < 38; x++) if (x % 2 === 0) P(g, x, baseY - 1, gd[3]);
  P(g, 30, baseY - 6, gd[2]);
  P(g, 31, baseY - 6, gd[3]);
  P(g, 30, baseY - 7, gd[3]);
  // crack across the lid with faint drift seep
  for (let k = 0; k < 8; k++) {
    const cxk = 18 + Math.round(Math.sin(k) * 1.5),
      cyk = baseY - 18 + k;
    P(g, cxk, cyk, st[3]);
    if (k % 2 === 0) P(g, cxk, cyk, dr[3]);
  }
  outline(g, RAMP.void);
  return g;
}

// RUBBLE PILE — collapsed stone blocks heaped up, dust. SOLID (low cover).
function fxRubblePile() {
  const g = makeGrid(34, 24);
  const st = RAMP.stone;
  const baseY = 21,
    cx = 17;
  // a heap of broken blocks of varying sizes
  const blocks = [[cx - 11, baseY, 8, 6], [cx - 2, baseY, 9, 7], [cx + 7, baseY, 7, 5], [cx - 7, baseY - 6, 7, 5], [cx + 1, baseY - 7, 8, 6], [cx - 1, baseY - 12, 6, 5]];
  blocks.forEach(([bx, by, w, h], i) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = st[1];
      if (x < 1) c = st[0];
      if (x > w - 2) c = st[2];
      if (y === 0) c = st[0];
      if (y > h - 2) c = st[3];
      if (hash2(bx + x, by - y, 631 + i) < 0.12) c = st[2];
      P(g, bx + x, by - y, c);
    }
    // dark gap seams between blocks
    for (let x = 0; x < w; x++) P(g, bx + x, by + 1, st[3]);
  });
  // dust / gravel at the base
  const rng = mulberry(632);
  for (let i = 0; i < 14; i++) {
    const dx = cx - 14 + Math.floor(rng() * 28);
    P(g, dx, baseY + 1 + Math.floor(rng() * 2), st[3]);
  }
  outline(g, RAMP.void);
  return g;
}

// STANDING BRAZIER — iron tripod bowl with ember flame (2-frame flicker @4fps). SOLID.
function fxStandingBrazier(frame) {
  frame = frame || 0;
  const g = makeGrid(24, 40);
  const st = RAMP.stone,
    em = RAMP.ember,
    gd = RAMP.gold;
  const cx = 12,
    baseY = 37;
  // three splayed iron legs
  [[-6, -1], [0, 0], [6, 1]].forEach(([ox, dir]) => {
    for (let k = 0; k < 18; k++) {
      const lx = cx + ox + Math.round(dir * k * 0.4);
      P(g, lx, baseY - k, dir === 0 ? st[1] : st[2]);
      P(g, lx + 1, baseY - k, st[3]);
    }
  });
  // cross-brace ring
  for (let x = cx - 5; x <= cx + 6; x++) P(g, x, baseY - 10, st[3]);
  // the bowl (iso half-ellipse)
  for (let yy = 0; yy < 7; yy++) for (let xx = -9 + yy; xx <= 9 - yy; xx++) {
    let c = st[1];
    if (xx < -7 + yy) c = st[0];
    if (xx > 7 - yy) c = st[3];
    if (yy === 0) c = st[2];
    P(g, cx + xx, baseY - 19 - yy, c);
  }
  for (let xx = -9; xx <= 9; xx++) P(g, cx + xx, baseY - 19, st[2]); // rim
  // ember coals
  for (let xx = -6; xx <= 6; xx++) if (hash2(cx + xx, frame, 633) < 0.6) P(g, cx + xx, baseY - 20, em[2]);
  // flame (2-frame flicker)
  const sway = [0, 1][frame],
    tall = [0, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) {
    const t = yy / (12 + tall),
      hw = Math.round((1 - t) * 5);
    const sx = cx + Math.round(Math.sin(yy * 0.6 + frame * 2) * 1.2) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = em[1];
      if (Math.abs(xx) >= hw - 1) c = em[2];
      if (yy < 4 && Math.abs(xx) < 2) c = em[0];
      P(g, sx + xx, baseY - 21 - yy, c);
    }
  }
  for (let yy = 2; yy <= 7 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2));
    for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 23 - yy, gd[0]);
  }
  if (frame === 1) P(g, cx + sway, baseY - 35 - tall, em[0]);
  // glow halo (dither)
  const rr = frame === 1 ? 10 : 8;
  for (let yy = -9; yy <= 3; yy++) for (let xx = -10; xx <= 10; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 5 && d < rr && (xx + yy + frame) % 2 === 0) P(g, cx + xx, baseY - 24 + yy, em[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// BROKEN PILLAR — a fluted stone column snapped off jagged, rubble at the base,
// on a square plinth. SOLID.
function fxBrokenPillar() {
  const g = makeGrid(24, 40);
  const st = RAMP.stone;
  const cx = 12,
    baseY = 37;
  // square plinth (iso cuboid)
  if (typeof isoCuboid === 'function') isoCuboid(g, cx - 8, baseY, 14, 5, 4, st);
  // the column shaft, snapped at ~70% with a jagged top
  const shaftBot = baseY - 5,
    shaftTop = 10;
  const breakProfile = [shaftTop + 2, shaftTop, shaftTop + 3, shaftTop + 1, shaftTop + 4];
  for (let x = -5; x <= 5; x++) {
    const col = x + 5;
    const topY = breakProfile[Math.min(breakProfile.length - 1, Math.floor(col / 10 * (breakProfile.length - 1)))] + (col % 2 ? 1 : 0);
    for (let y = shaftBot; y >= topY; y--) {
      let c = st[1];
      if (x < -3) c = st[0];
      if (x > 3) c = st[2];
      if (x > 4) c = st[3];
      // vertical fluting
      if (x % 2 === 0) c = x < 0 ? st[0] : st[2];
      if (hash2(cx + x, y, 641) < 0.05) c = st[3];
      P(g, cx + x, y, c);
    }
    // dark broken-core top edge
    P(g, cx + x, topY - 1, st[3]);
  }
  // capital ring near the break
  for (let x = -6; x <= 6; x++) P(g, cx + x, shaftBot - 2, st[2]);
  // a chunk of fallen column lying at the base (right)
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) {
    let c = st[1];
    if (i < 1) c = st[0];
    if (i > 7) c = st[3];
    if (j > 2) c = st[3];
    P(g, cx + 4 + i, baseY - 1 - j, c);
  }
  outline(g, RAMP.void);
  return g;
}

// BONE PILE — a heap of bones, ribs & two skulls. Decorative, NOT solid.
function fxBonePile() {
  const g = makeGrid(30, 20);
  const bn = RAMP.bone;
  const cx = 15,
    baseY = 17;
  // mound of long bones crossing
  const rng = mulberry(651);
  for (let i = 0; i < 9; i++) {
    const bx = cx - 11 + Math.floor(rng() * 22),
      by = baseY - Math.floor(rng() * 6);
    const len = 5 + Math.floor(rng() * 5),
      ang = (rng() - 0.5) * 1.6;
    for (let k = 0; k < len; k++) {
      const x = Math.round(bx + Math.cos(ang) * k),
        y = Math.round(by - Math.sin(ang) * k * 0.5);
      P(g, x, y, i % 2 ? bn[1] : bn[2]);
    }
    // knuckle ends
    P(g, bx, by, bn[0]);
    P(g, Math.round(bx + Math.cos(ang) * len), Math.round(by - Math.sin(ang) * len * 0.5), bn[0]);
  }
  // two skulls nestled in the pile
  [[cx - 6, baseY - 2], [cx + 4, baseY - 4]].forEach(([sx, sy], i) => {
    fillRect(g, sx, sy - 3, 5, 4, bn[1]);
    P(g, sx, sy - 3, bn[0]);
    P(g, sx + 1, sy - 2, RAMP.void);
    P(g, sx + 3, sy - 2, RAMP.void); // eye sockets
    P(g, sx + 2, sy, bn[3]);
    fillRect(g, sx + 1, sy + 1, 3, 1, bn[2]); // jaw
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const CRYPT_FLOOR = {
  floor_crypt: {
    fn: i => makeCryptFloor(i),
    cell: [64, 36],
    anchor: [32, 16],
    variants: 3,
    tile: true
  }
};
const CRYPT_FIX = {
  sarcophagus: {
    fn: () => fxSarcophagus(),
    cell: [44, 36],
    anchor: [22, 35],
    labelClear: true,
    solid: true
  },
  rubble_pile: {
    fn: () => fxRubblePile(),
    cell: [34, 24],
    anchor: [17, 23],
    labelClear: true,
    solid: true
  },
  standing_brazier: {
    fn: i => fxStandingBrazier(i),
    cell: [24, 40],
    anchor: [12, 37],
    labelClear: true,
    solid: true,
    frames: 2,
    anim: {
      name: 'flame',
      fps: 4
    }
  },
  broken_pillar: {
    fn: () => fxBrokenPillar(),
    cell: [24, 40],
    anchor: [12, 37],
    labelClear: true,
    solid: true
  },
  bone_pile: {
    fn: () => fxBonePile(),
    cell: [30, 20],
    anchor: [15, 19],
    labelClear: true,
    solid: false
  }
};
Object.assign(globalThis, {
  makeCryptFloor,
  fxSarcophagus,
  fxRubblePile,
  fxStandingBrazier,
  fxBrokenPillar,
  fxBonePile,
  CRYPT_FLOOR,
  CRYPT_FIX
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/crypt.js", error: String((e && e.message) || e) }); }

// assets/_gen/deaths.js
try { (() => {
// Naevyr FRONTIER CREATURE DEATHS — eval after pixlib.js + tiles.js + beasts.js
// (ell, shadeMass, spike, moteBurst) + mobs.js (DIRMAP) + minibosses.js (pillarLeg).
// Standalone death sequences matching the beasts.js death convention: authored collapse
// frames, solids 1px void-outlined, then OUTLINE-FREE motes/scatter painted after the
// outline pass (like moteBurst). 5 facings handled (slight topple toward facing).
// Returns a grid of the creature's exact cell size. RAMP only, dither not blur,
// bottom-center anchor, top 4px clear, moonlit-left / shadowed-right.

/* shared: a rough rubble/debris mound (lit-left, shadow-right), void at the base seam */
function deathMound(g, cx, baseY, halfW, height, ramp, seed, fill) {
  fill = fill == null ? 0.8 : fill;
  for (let yy = 0; yy < height; yy++) {
    const t = yy / height;
    const w = Math.round(halfW * (1 - t * t * 0.85));
    for (let x = cx - w; x <= cx + w; x++) {
      if (hash2(x, baseY - yy, seed) > fill) continue;
      let c = ramp[1];
      if (x < cx - w + 2) c = ramp[0];
      if (x > cx + w - 2) c = ramp[3];
      if (yy === 0) c = ramp[3];
      if (hash2(x, baseY - yy, seed + 7) < 0.16) c = ramp[2];
      P(g, x, baseY - yy, c);
    }
  }
}
/* a low scatter of debris pixels flung out along the ground */
function deathScatter(g, cx, baseY, spread, n, ramp, seed) {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.round(cx + (r() - 0.5) * spread * 2);
    const y = baseY - Math.floor(r() * 2);
    P(g, x, y, r() < 0.5 ? ramp[2] : ramp[3]);
  }
}
function leanOf(dir) {
  return [0, 1, 2, 1, 0][dir];
}

/* ============================ MOBS ============================ */

// BOGWRETCH 32×40 — collapses, throat-sac deflates, dissolves to drift motes (4f)
function bogwretchDeath(facing, f) {
  const g = makeGrid(32, 40);
  const wa = RAMP.water,
    gr = RAMP.grass,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const cx = 16 + leanOf(dir),
    groundY = 38;
  if (f === 0) {
    // slumped: body sags flat, sac deflated, eyes dimming
    shadeMass(g, cx, groundY - 4, profile ? 9 : 8, 4, wa, 110);
    if (!back) {
      const hx = cx + (profile ? 5 : 0);
      shadeMass(g, hx, groundY - 5, 4, 3, wa, 112);
      P(g, hx + (profile ? 2 : -2), groundY - 6, dr[3]);
      if (!profile) P(g, hx + 2, groundY - 6, dr[3]);
      for (let i = -3; i <= 3; i++) P(g, hx + i, groundY - 1, wa[3]);
    }
    // legs splaying
    P(g, cx - 8, groundY - 1, wa[2]);
    P(g, cx + 8, groundY - 1, wa[2]);
    outline(g, RAMP.void);
    P(g, cx, groundY - 8, dr[3]);
  } else if (f === 1) {
    // collapsed splayed heap
    ell(g, cx, groundY - 2, 11, 3, (x, y, d, dx, dy) => {
      let c = wa[2];
      if (dx + dy < -0.4) c = wa[1];
      if (d > 0.7) c = wa[3];
      if (hash2(x, y, 113) < 0.18) c = gr[2];
      P(g, x, y, c);
    });
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 6, 8, 0.5, 114);
  } else if (f === 2) {
    // dissolving puddle + bone bits, motes rising
    for (let x = cx - 9; x <= cx + 9; x++) {
      if (hash2(x, 0, 115) < 0.7) P(g, x, groundY - 1, wa[3]);
      if (hash2(x, 1, 115) < 0.3) P(g, x, groundY - 2, wa[2]);
    }
    P(g, cx - 4, groundY - 1, bn[3]);
    P(g, cx + 3, groundY - 1, bn[3]);
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 9, 12, 0.7, 116);
  } else {
    // near-gone: faint stain + scattering drift motes (no body)
    for (let x = cx - 6; x <= cx + 6; x++) if (hash2(x, 2, 117) < 0.35) P(g, x, groundY - 1, wa[3]);
    moteBurst(g, cx, groundY - 12, 14, 0.4, 118);
  }
  return g;
}

// BARROW WIGHT 32×44 — robe crumples, bones clatter apart (4f)
function barrowWightDeath(facing, f) {
  const g = makeGrid(32, 44);
  const st = RAMP.stone,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const cx = 16 + Math.round(leanOf(dir) * 0.5),
    groundY = 42;
  if (f === 0) {
    // robe sagging, hood drooping, sockets flickering out
    for (let y = groundY - 26; y <= groundY; y++) {
      const t = (y - (groundY - 26)) / 26;
      const w = Math.round(4 + t * 5);
      for (let x = cx - w; x <= cx + w; x++) {
        let c = st[1];
        if (x < cx - w + 1) c = st[0];
        if (x > cx + w - 1) c = st[3];
        if (hash2(x, y, 121) < 0.05) c = st[2];
        P(g, x, y, c);
      }
    }
    if (!back) {
      P(g, cx + (profile ? 3 : -2), groundY - 22, dr[3]);
      if (!profile) P(g, cx + 2, groundY - 22, dr[3]);
    }
    outline(g, RAMP.void);
  } else if (f === 1) {
    // crumpling, bones separating from the hem
    for (let y = groundY - 16; y <= groundY; y++) {
      const t = (y - (groundY - 16)) / 16;
      const w = Math.round(6 + t * 4);
      for (let x = cx - w; x <= cx + w; x++) {
        if (hash2(x, y, 122) > 0.85) continue;
        let c = st[1];
        if (x < cx - w + 1) c = st[0];
        if (x > cx + w - 1) c = st[3];
        P(g, x, y, c);
      }
    }
    [[-7, 6], [8, 9], [-9, 4]].forEach(([ox, oy], i) => {
      for (let k = 0; k < 4; k++) P(g, cx + ox + (i ? 1 : -1), groundY - oy + k, bn[1]);
    });
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 18, 9, 0.5, 123);
  } else if (f === 2) {
    // robe heap + scattered clattering bones
    deathMound(g, cx, groundY - 1, 9, 6, st, 124, 0.82);
    const r = mulberry(125);
    for (let i = 0; i < 7; i++) {
      const bx = cx + Math.round((r() - 0.5) * 22),
        by = groundY - 1 - Math.floor(r() * 3);
      const len = 3 + Math.floor(r() * 3);
      const ang = (r() - 0.5) * 1.5;
      for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.5), bn[1]);
      P(g, bx, by, bn[0]);
    }
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 12, 11, 0.5, 126);
  } else {
    // settled: bone pile + collapsed robe + last drift wisp
    deathMound(g, cx, groundY - 1, 7, 4, st, 127, 0.7);
    const r = mulberry(128);
    for (let i = 0; i < 9; i++) {
      const bx = cx + Math.round((r() - 0.5) * 24),
        by = groundY - 1 - Math.floor(r() * 2);
      P(g, bx, by, bn[2]);
      if (r() < 0.5) P(g, bx + 1, by, bn[1]);
    }
    // a couple of skulls
    fillRect(g, cx - 8, groundY - 4, 4, 3, bn[1]);
    P(g, cx - 7, groundY - 3, RAMP.void);
    outline(g, RAMP.void);
    P(g, cx + 2, groundY - 8, dr[2]);
    P(g, cx + 2, groundY - 10, dr[3]);
  }
  return g;
}

// BONE HUSK 28×36 — skeleton shatters (4f)
function boneHuskDeath(facing, f) {
  const g = makeGrid(28, 36);
  const bn = RAMP.bone,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3;
  const cx = 14 + leanOf(dir),
    groundY = 34;
  if (f === 0) {
    // jolt + cracks, skull tilts, eyes flare
    const top = 9,
      hipY = top + 13;
    for (let y = top + 6; y <= hipY; y++) {
      P(g, cx - 2, y, bn[2]);
      P(g, cx + 2, y, bn[3]);
      if ((y - top) % 2 === 0) for (let x = cx - 1; x <= cx + 1; x++) P(g, x, y, bn[1]);
    }
    shadeMass(g, cx + 1, top + 3, 3, 3, bn, 131);
    if (!back) {
      P(g, cx, top + 3, dr[0]);
      P(g, cx + 2, top + 3, dr[0]);
    }
    for (let y = hipY; y < groundY - 1; y++) {
      P(g, cx - 2, y, bn[2]);
      P(g, cx + 3, y, bn[2]);
    }
    // cracks
    P(g, cx, top + 8, RAMP.void);
    P(g, cx + 1, top + 10, RAMP.void);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // bones flying apart (radiating shards)
    const cyk = 20;
    const r = mulberry(132);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const dst = 4 + r() * 6;
      const bx = Math.round(cx + Math.cos(a) * dst),
        by = Math.round(cyk + Math.sin(a) * dst * 0.7);
      const len = 2 + Math.floor(r() * 3);
      for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(a) * k), Math.round(by + Math.sin(a) * k * 0.6), i % 2 ? bn[1] : bn[2]);
    }
    shadeMass(g, cx, cyk, 2, 2, bn, 133);
    outline(g, RAMP.void);
    moteBurst(g, cx, cyk, 9, 0.4, 134);
  } else if (f === 2) {
    // scattered shards on the ground + dust
    const r = mulberry(135);
    for (let i = 0; i < 11; i++) {
      const bx = cx + Math.round((r() - 0.5) * 22),
        by = groundY - 1 - Math.floor(r() * 3);
      const len = 2 + Math.floor(r() * 3),
        ang = (r() - 0.5) * 1.8;
      for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.4), bn[1]);
    }
    outline(g, RAMP.void);
    deathScatter(g, cx, groundY - 1, 12, 8, bn, 136);
  } else {
    // small bone pile + dust settling
    deathMound(g, cx, groundY - 1, 6, 4, bn, 137, 0.75);
    fillRect(g, cx - 5, groundY - 3, 4, 3, bn[1]);
    P(g, cx - 4, groundY - 2, RAMP.void); // a skull
    outline(g, RAMP.void);
    deathScatter(g, cx, groundY - 1, 13, 6, bn, 138);
  }
  return g;
}

// ASH BRUTE 48×52 — ember cracks flare then go cold, slumps (4f)
function ashBruteDeath(facing, f) {
  const g = makeGrid(48, 52);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    em = RAMP.ember,
    gd = RAMP.gold;
  const dir = DIRMAP[facing];
  const cx = 24 + leanOf(dir) * 2,
    groundY = 50;
  const crk = [[-7, 8], [4, 12], [-2, 18], [8, 6], [-9, 15], [1, 22], [-5, 26], [6, 24]];
  if (f === 0) {
    // rigid, every crack blazing gold-hot
    deathMound(g, cx, groundY - 1, 17, 34, dt, 141, 0.96);
    crk.forEach(([ox, oy]) => {
      const x = cx + ox,
        y = groundY - 34 + oy;
      P(g, x, y, gd[0]);
      P(g, x, y + 1, em[0]);
      P(g, x + 1, y, em[0]);
      P(g, x - 1, y, em[1]);
    });
    // head glare
    shadeMass(g, cx, groundY - 38, 5, 4, dt, 145);
    P(g, cx - 2, groundY - 38, gd[0]);
    P(g, cx + 2, groundY - 38, gd[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // buckling — body squat, cracks at peak flare + ember spray rising
    deathMound(g, cx, groundY - 1, 18, 26, dt, 142, 0.95);
    crk.forEach(([ox, oy]) => {
      const x = cx + ox,
        y = groundY - 26 + Math.round(oy * 0.7);
      P(g, x, y, em[0]);
      P(g, x, y + 1, gd[0]);
    });
    outline(g, RAMP.void);
    for (let i = 0; i < 10; i++) {
      const t = hash2(i, 1, 143) * Math.PI;
      P(g, Math.round(cx + Math.cos(t) * 14), groundY - 24 - Math.floor(hash2(i, 2, 143) * 8), i % 2 ? em[0] : gd[0]);
    }
  } else if (f === 2) {
    // collapsing, cracks cooling to dim ember
    deathMound(g, cx, groundY - 1, 19, 16, dt, 144, 0.9);
    crk.forEach(([ox, oy]) => {
      const x = cx + ox,
        y = groundY - 14 + Math.round(oy * 0.4);
      P(g, x, y, em[2]);
      if (hash2(x, y, 145) < 0.4) P(g, x, y, em[3]);
    });
    outline(g, RAMP.void);
    for (let i = 0; i < 6; i++) P(g, cx + Math.round((hash2(i, 3, 146) - 0.5) * 26), groundY - 1, em[3]); // dying embers
  } else {
    // cold dark rubble heap, a couple of fading embers
    deathMound(g, cx, groundY - 1, 20, 11, st, 147, 0.85);
    for (let i = 0; i < 14; i++) {
      const x = cx + Math.round((hash2(i, 4, 148) - 0.5) * 38);
      P(g, x, groundY - 1, st[3]);
      if (hash2(i, 5, 148) < 0.3) P(g, x, groundY - 2, dt[3]);
    }
    outline(g, RAMP.void);
    P(g, cx - 6, groundY - 4, em[3]);
    P(g, cx + 5, groundY - 3, em[3]); // last cooling coals (outline-free)
  }
  return g;
}

// DRIFT WISP 28×32 — pops into scattering motes (3f, NO outline)
function driftWispDeath(facing, f) {
  const g = makeGrid(28, 32);
  const dr = RAMP.drift;
  const cx = 14,
    cy = 12;
  if (f === 0) {
    // core flares supernova-bright, halo intensifies
    ell(g, cx, cy, 5, 4.4, (x, y, d) => P(g, x, y, d < 0.4 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    P(g, cx, cy, dr[0]);
    for (let a = 0; a < 8; a++) {
      const t = a / 8 * Math.PI * 2;
      P(g, Math.round(cx + Math.cos(t) * 7), Math.round(cy + Math.sin(t) * 6), dr[0]);
    }
    moteBurst(g, cx, cy, 9, 0.6, 150);
  } else if (f === 1) {
    // bursting outward
    const r = mulberry(151);
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2,
        dst = 4 + r() * 9;
      const x = Math.round(cx + Math.cos(a) * dst),
        y = Math.round(cy + Math.sin(a) * dst * 0.9);
      P(g, x, y, r() < 0.3 ? dr[0] : r() < 0.6 ? dr[1] : dr[2]);
    }
    P(g, cx, cy, dr[1]);
  } else {
    // scattered, fading — mostly empty
    const r = mulberry(152);
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2,
        dst = 7 + r() * 6;
      P(g, Math.round(cx + Math.cos(a) * dst), Math.round(cy - 2 + Math.sin(a) * dst * 0.8), r() < 0.5 ? dr[2] : dr[3]);
    }
  }
  return g; // no outline — pure corruption motes
}

/* ============================ MINI-BOSSES (5f dramatic collapse) ============================ */

// THE DROWNED KING 110×110 — topples, water bursts, crumbles to barnacled rubble + drift
function drownedKingDeath(facing, f) {
  const g = makeGrid(110, 110);
  const wa = RAMP.water,
    st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold,
    gr = RAMP.grass,
    dr = RAMP.drift;
  const dir = DIRMAP[facing];
  const cx = 55 + leanOf(dir) * 3,
    groundY = 106;
  const tip = dir <= 2 ? 1 : -1;
  if (f === 0) {
    // staggered, listing, water weeping from the seams, crown tipping
    deathMound(g, cx + tip * 4, groundY - 1, 26, 64, st, 301, 0.95);
    for (let i = 0; i < 16; i++) {
      const x = cx + Math.round((hash2(i, 0, 302) - 0.5) * 44),
        y = groundY - 20 - Math.floor(hash2(i, 1, 302) * 40);
      if (hash2(i, 2, 302) < 0.5) P(g, x, y, wa[2]);
    }
    // tipping crown
    for (let i = -8; i <= 8; i += 2) P(g, cx + tip * 8 + i, groundY - 70, gd[1]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // toppling — leans hard, big water burst
    for (let yy = 0; yy < 50; yy++) {
      const t = yy / 50;
      const w = Math.round(24 * (1 - t * 0.6));
      const sx = cx + tip * Math.round(t * 22);
      for (let x = sx - w; x <= sx + w; x++) {
        if (hash2(x, yy, 303) > 0.9) continue;
        let c = st[1];
        if (x < sx - w + 3) c = st[0];
        if (x > sx + w - 3) c = st[3];
        if (t > 0.5 && hash2(x, yy, 304) < 0.3) c = wa[2];
        P(g, x, groundY - yy, c);
      }
    }
    for (let i = 0; i < 24; i++) {
      const a = Math.PI + i / 24 * Math.PI;
      P(g, Math.round(cx + tip * 30 + Math.cos(a) * 26), Math.round(groundY - 10 + Math.sin(a) * 14), i % 2 ? wa[0] : wa[1]);
    }
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 40, 18, 0.4, 305);
  } else if (f === 2) {
    // crashing down — body breaking into barnacled chunks, splash ring
    deathMound(g, cx + tip * 10, groundY - 1, 34, 30, st, 306, 0.82);
    [[-18, 8], [16, 12], [24, 6], [-26, 5]].forEach(([ox, oy], i) => ell(g, cx + ox, groundY - oy, 6, 4, (x, y, d) => P(g, x, y, d < 0.5 ? st[1] : st[3])));
    // barnacles + kelp in the rubble
    for (let i = 0; i < 8; i++) {
      const x = cx + Math.round((hash2(i, 0, 307) - 0.5) * 56);
      P(g, x, groundY - 1 - Math.floor(hash2(i, 1, 307) * 6), bn[1]);
    }
    for (let a = 0; a < 30; a++) {
      const t = a / 30 * Math.PI * 2;
      if (a % 2) P(g, Math.round(cx + Math.cos(t) * 40), Math.round(groundY - 2 + Math.sin(t) * 9), wa[0]);
    }
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 30, 24, 0.5, 308);
  } else if (f === 3) {
    // heap of barnacled rubble + kelp + draining puddle, crown fallen
    deathMound(g, cx, groundY - 1, 32, 18, st, 309, 0.8);
    for (let i = 0; i < 12; i++) {
      const x = cx + Math.round((hash2(i, 0, 310) - 0.5) * 60);
      P(g, x, groundY - 1 - Math.floor(hash2(i, 1, 310) * 4), bn[2]);
    }
    for (let i = 0; i < 8; i++) {
      const kx = cx + Math.round((hash2(i, 2, 310) - 0.5) * 54);
      for (let k = 0; k < 4; k++) P(g, kx, groundY - 1 - k, gr[2]);
    }
    // fallen crown (left)
    for (let i = -6; i <= 6; i += 2) P(g, cx - 24 + i, groundY - 3, gd[1]);
    for (let x = cx - 30; x <= cx - 18; x++) P(g, x, groundY - 2, gd[2]);
    for (let x = cx - 44; x <= cx + 44; x++) if (hash2(x, 3, 311) < 0.4) P(g, x, groundY - 1, wa[3]); // draining water
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 20, 22, 0.35, 312);
  } else {
    // settled barnacled mound + the broken crown + drift + wet stain
    deathMound(g, cx, groundY - 1, 28, 12, st, 313, 0.78);
    for (let i = 0; i < 14; i++) {
      const x = cx + Math.round((hash2(i, 0, 314) - 0.5) * 56);
      P(g, x, groundY - 1, st[3]);
      P(g, x, groundY - 2 - Math.floor(hash2(i, 1, 314) * 3), bn[2]);
    }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 22 + i, groundY - 3, gd[2]);
    for (let x = cx - 46; x <= cx + 46; x++) if (hash2(x, 4, 315) < 0.3) P(g, x, groundY - 1, wa[3]);
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 16, 20, 0.3, 316);
  }
  return g;
}

// THE BARROW LORD 110×116 — collapses, bones explode apart, crown falls
function barrowLordDeath(facing, f) {
  const g = makeGrid(110, 116);
  const bn = RAMP.bone,
    st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const dir = DIRMAP[facing];
  const cx = 55 + leanOf(dir) * 3,
    groundY = 112;
  if (f === 0) {
    // shudder, sockets flare, ribcage jolts, crown rattling
    for (let y = groundY - 78; y <= groundY - 28; y++) P(g, cx, y, bn[2]);
    for (let r = 0; r < 7; r++) {
      const ry = groundY - 72 + r * 6,
        span = 16 - r;
      for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) {
        const x = cx + s * k,
          y = ry + Math.round((k / span) ** 2 * 7) + (r % 2 ? 1 : 0);
        P(g, x, y, bn[1]);
      }
    }
    // legs
    for (const lx of [-13, 13]) for (let y = groundY - 30; y <= groundY; y++) P(g, cx + lx, y, bn[2]);
    // skull + crown + flaring sockets
    const hy = groundY - 90;
    for (let y = hy - 8; y <= hy + 7; y++) for (let x = cx - 9; x <= cx + 9; x++) {
      if (Math.abs(x - cx) + Math.abs(y - hy) > 13) continue;
      P(g, x, y, bn[1]);
    }
    for (let i = -8; i <= 8; i += 2) for (let k = 0; k < 3; k++) P(g, cx + i, hy - 9 - k, gd[2]);
    P(g, cx - 4, hy - 1, dr[0]);
    P(g, cx + 4, hy - 1, dr[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // ribcage cracking apart, bones beginning to fly
    for (let r = 0; r < 6; r++) {
      const ry = groundY - 66 + r * 7,
        span = 15 - r,
        off = r % 2 ? 3 : -3;
      for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) {
        if (hash2(k, ry, 320) > 0.85) continue;
        const x = cx + off + s * k,
          y = ry + Math.round((k / span) ** 2 * 6);
        P(g, x, y, bn[1]);
      }
    }
    const r = mulberry(321);
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2,
        dst = 16 + r() * 18;
      const bx = Math.round(cx + Math.cos(a) * dst),
        by = Math.round(groundY - 50 + Math.sin(a) * dst * 0.7);
      const len = 4 + Math.floor(r() * 4);
      for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(a) * k), Math.round(by + Math.sin(a) * k * 0.6), bn[2]);
    }
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 56, 26, 0.4, 322);
  } else if (f === 2) {
    // explosive scatter — bones flung wide
    const r = mulberry(323);
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2,
        dst = 10 + r() * 40;
      const bx = Math.round(cx + Math.cos(a) * dst),
        by = Math.round(groundY - 40 + Math.sin(a) * dst * 0.6);
      const len = 3 + Math.floor(r() * 5);
      const ang = a + (r() - 0.5);
      for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.5), i % 2 ? bn[0] : bn[1]);
    }
    deathMound(g, cx, groundY - 1, 14, 8, bn, 324, 0.7);
    outline(g, RAMP.void);
    moteBurst(g, cx, groundY - 40, 30, 0.5, 325);
  } else if (f === 3) {
    // collapsing skeletal heap, crown falling, mantle crumpling
    deathMound(g, cx, groundY - 1, 26, 16, st, 326, 0.74);
    const r = mulberry(327);
    for (let i = 0; i < 20; i++) {
      const bx = cx + Math.round((r() - 0.5) * 70),
        by = groundY - 1 - Math.floor(r() * 5);
      const len = 3 + Math.floor(r() * 4),
        ang = (r() - 0.5) * 1.8;
      for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.4), bn[1]);
    }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 4 + i, groundY - 14, gd[1]);
    for (let x = cx - 12; x <= cx + 4; x++) P(g, x, groundY - 13, gd[2]); // crown sliding off
    outline(g, RAMP.void);
    P(g, cx - 10, groundY - 18, dr[2]);
    P(g, cx + 8, groundY - 16, dr[3]);
  } else {
    // pile of bones + fallen gold crown + fading drift fire
    deathMound(g, cx, groundY - 1, 22, 11, st, 328, 0.7);
    const r = mulberry(329);
    for (let i = 0; i < 26; i++) {
      const bx = cx + Math.round((r() - 0.5) * 78),
        by = groundY - 1 - Math.floor(r() * 3);
      P(g, bx, by, bn[2]);
      if (r() < 0.5) P(g, bx + 1, by, bn[1]);
    }
    fillRect(g, cx + 14, groundY - 6, 7, 5, bn[1]);
    P(g, cx + 16, groundY - 5, RAMP.void);
    P(g, cx + 18, groundY - 5, RAMP.void); // a big skull
    for (let i = -6; i <= 6; i += 2) P(g, cx - 18 + i, groundY - 4, gd[2]);
    for (let x = cx - 26; x <= cx - 10; x++) P(g, x, groundY - 3, gd[1]); // fallen crown
    outline(g, RAMP.void);
    P(g, cx - 2, groundY - 14, dr[3]);
    P(g, cx + 4, groundY - 12, dr[3]);
  }
  return g;
}

// THE ASH WARLORD 100×110 — armor cracks blaze ember-hot then cool, buckles, collapses
function ashWarlordDeath(facing, f) {
  const g = makeGrid(100, 110);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    em = RAMP.ember,
    gd = RAMP.gold,
    bl = RAMP.blood,
    bn = RAMP.bone;
  const dir = DIRMAP[facing];
  const cx = 50 + leanOf(dir) * 2,
    groundY = 106;
  const tip = dir <= 2 ? 1 : -1;
  const seams = [[-8, 12], [5, 18], [-2, 26], [9, 14], [-10, 32], [2, 40], [-5, 46], [7, 36]];
  if (f === 0) {
    // rigid, every seam blazing, blade lowering, cloak settling
    if (dir <= 2) for (let y = groundY - 70; y <= groundY - 6; y++) {
      const t = (y - (groundY - 70)) / 64;
      const w = Math.round(16 + t * 10);
      for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 5; x++) P(g, cx + s * (w - x), y, x === 0 ? bl[1] : bl[2]);
    }
    deathMound(g, cx, groundY - 1, 19, 70, dt, 341, 0.95);
    seams.forEach(([ox, oy]) => {
      const x = cx + ox,
        y = groundY - 70 + oy;
      P(g, x, y, gd[0]);
      P(g, x, y + 1, em[0]);
    });
    shadeMass(g, cx, groundY - 74, 7, 5, dt, 342);
    P(g, cx - 2, groundY - 73, em[0]);
    P(g, cx + 2, groundY - 73, em[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // buckling — knees give, ember light flares through every seam, cloak billows
    deathMound(g, cx + tip * 3, groundY - 1, 21, 50, dt, 343, 0.93);
    seams.forEach(([ox, oy]) => {
      const x = cx + ox,
        y = groundY - 50 + Math.round(oy * 0.7);
      P(g, x, y, em[0]);
      P(g, x, y + 1, gd[0]);
      P(g, x + 1, y, em[1]);
    });
    if (dir <= 2) for (let i = 0; i < 16; i++) {
      const a = Math.PI + i / 16 * Math.PI;
      P(g, Math.round(cx + tip * 18 + Math.cos(a) * 22), Math.round(groundY - 30 + Math.sin(a) * 16), bl[2]);
    }
    outline(g, RAMP.void);
    for (let i = 0; i < 12; i++) P(g, cx + Math.round((hash2(i, 0, 344) - 0.5) * 30), groundY - 44 - Math.floor(hash2(i, 1, 344) * 10), i % 2 ? em[0] : gd[0]);
  } else if (f === 2) {
    // collapsing forward, plates breaking, ember spray
    for (let yy = 0; yy < 40; yy++) {
      const t = yy / 40,
        w = Math.round(20 * (1 - t * 0.5)),
        sx = cx + tip * Math.round(t * 20);
      for (let x = sx - w; x <= sx + w; x++) {
        if (hash2(x, yy, 345) > 0.88) continue;
        let c = dt[1];
        if (x < sx - w + 3) c = dt[0];
        if (x > sx + w - 3) c = dt[3];
        P(g, x, groundY - yy, c);
      }
    }
    seams.forEach(([ox, oy]) => {
      const x = cx + tip * 10 + ox,
        y = groundY - 30 + Math.round(oy * 0.4);
      P(g, x, y, em[2]);
      if (hash2(x, y, 346) < 0.4) P(g, x, y, em[3]);
    });
    outline(g, RAMP.void);
    for (let i = 0; i < 18; i++) {
      const a = hash2(i, 0, 347) * Math.PI;
      P(g, Math.round(cx + tip * 24 + Math.cos(a) * 20), Math.round(groundY - 12 + Math.sin(a) * 10), i % 2 ? em[1] : em[2]);
    }
  } else if (f === 3) {
    // crumpled smouldering heap, blade fallen, cloak draped, embers cooling
    deathMound(g, cx, groundY - 1, 24, 18, dt, 348, 0.84);
    for (let x = cx - 30; x <= cx + 6; x++) P(g, x, groundY - 2, bl[3]); // draped cloak
    seams.forEach(([ox, oy]) => {
      const x = cx + ox,
        y = groundY - 14 + Math.round(oy * 0.2);
      if (y < groundY) {
        P(g, x, y, em[3]);
        if (hash2(x, y, 349) < 0.5) P(g, x, y, em[2]);
      }
    });
    // fallen blade (right), still ember-warm
    for (let k = 0; k < 30; k++) {
      const x = cx + 18 + k,
        y = groundY - 2 - Math.round(k * 0.1);
      P(g, x, y, k % 4 === 0 ? em[2] : st[1]);
    }
    outline(g, RAMP.void);
  } else {
    // cold dark armor rubble + fallen blade + dying embers + trophy skull rolled free
    deathMound(g, cx, groundY - 1, 26, 12, st, 350, 0.8);
    for (let i = 0; i < 16; i++) {
      const x = cx + Math.round((hash2(i, 0, 351) - 0.5) * 50);
      P(g, x, groundY - 1, st[3]);
      if (hash2(i, 1, 351) < 0.3) P(g, x, groundY - 2, dt[3]);
    }
    for (let x = cx - 32; x <= cx - 6; x++) P(g, x, groundY - 2, bl[3]); // cloak
    for (let k = 0; k < 32; k++) P(g, cx + 16 + k, groundY - 2, k % 5 === 0 ? st[0] : st[1]); // cold blade
    fillRect(g, cx - 24, groundY - 5, 6, 4, bn[1]);
    P(g, cx - 23, groundY - 4, RAMP.void);
    P(g, cx - 21, groundY - 4, RAMP.void); // trophy skull rolled free
    outline(g, RAMP.void);
    P(g, cx - 4, groundY - 6, em[3]);
    P(g, cx + 6, groundY - 5, em[3]); // last coals (outline-free)
  }
  return g;
}
const CREATURE_DEATHS = {
  bogwretch: {
    fn: 'bogwretchDeath',
    frames: 4,
    group: 'mobs'
  },
  barrow_wight: {
    fn: 'barrowWightDeath',
    frames: 4,
    group: 'mobs'
  },
  bone_husk: {
    fn: 'boneHuskDeath',
    frames: 4,
    group: 'mobs'
  },
  ash_brute: {
    fn: 'ashBruteDeath',
    frames: 4,
    group: 'mobs'
  },
  drift_wisp: {
    fn: 'driftWispDeath',
    frames: 3,
    group: 'mobs',
    noOutline: true
  },
  drowned_king: {
    fn: 'drownedKingDeath',
    frames: 5,
    group: 'beasts'
  },
  barrow_lord: {
    fn: 'barrowLordDeath',
    frames: 5,
    group: 'beasts'
  },
  ash_warlord: {
    fn: 'ashWarlordDeath',
    frames: 5,
    group: 'beasts'
  }
};
Object.assign(globalThis, {
  deathMound,
  deathScatter,
  leanOf,
  bogwretchDeath,
  barrowWightDeath,
  boneHuskDeath,
  ashBruteDeath,
  driftWispDeath,
  drownedKingDeath,
  barrowLordDeath,
  ashWarlordDeath,
  CREATURE_DEATHS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/deaths.js", error: String((e && e.message) || e) }); }

// assets/_gen/deeds.js
try { (() => {
// NAEVYR — DEEDS & HONORS badge set. Eval after pixlib.js (+ tiles.js for hash2).
//
// Earned honors for the Hall of Deeds — weathered heraldic emblems, NOT shiny
// game trophies. Same pixel language as Icon.jsx: 16×16 rect grid, 1px void
// outline (auto via outline()), 2–3 step locked-RAMP shade per material, crisp
// edges, dither (never blur), no anti-aliasing. Each reads as a 1em inline icon
// and matches the silhouette weight of the sword/coin/ward/drift glyphs.
//
//   5 category badges (16×16) — one heraldic emblem per deed line:
//     deed_blade   crossed swords · war          (steel/bone + blood)
//     deed_coin    struck coin + star · value    (gold)
//     deed_labor   anvil on a stump · toil        (steel + wood)
//     deed_endure  ward shield + drift boss       (bone + drift)
//     deed_realm   the Drift sigil · corruption   (drift-purple)
//   3 tier rings (16×16 OVERLAY, transparent center) — wrap a badge to show rank:
//     tier_bronze / tier_silver / tier_gold        laurel half-wreath + tie
//   deed_emblem (16×16 + 32×32) — the "Hall of Deeds" mark: a struck gold
//     medallion, a 4-point star, and a short ribbon. Panel / tab icon.
//
// Gold is OLD STRUCK METAL: lean on the y→g→G ramp (shadow→base→hi), never a
// flat bright yellow. Blood/drift are the only saturated accents.

/* ---- shared: paint a char-grid using a per-icon palette, then let
   outline() add the exterior 1px void. '.' / ' ' = skip; 'k' = explicit
   void (internal separators); any other char = pal[char]. -------------- */
function paintRows(g, rows, pal, ox, oy) {
  ox = ox || 0;
  oy = oy || 0;
  for (let y = 0; y < rows.length; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x];
      if (ch === '.' || ch === ' ') continue;
      if (ch === 'k') {
        P(g, ox + x, oy + y, RAMP.void);
        continue;
      }
      const c = pal[ch];
      if (c) P(g, ox + x, oy + y, c);
    }
  }
}

// Char → hex, drawn from the locked RAMP only (mirrors Icon.jsx letters).
const DPAL = {
  // bone / steel
  h: RAMP.bone[0],
  L: RAMP.bone[1],
  o: RAMP.bone[2],
  q: RAMP.bone[3],
  // stone (dark steel)
  C: RAMP.stone[0],
  c: RAMP.stone[1],
  s: RAMP.stone[2],
  // gold (struck) — y shadow · g base · G hi
  G: RAMP.gold[0],
  g: RAMP.gold[1],
  y: RAMP.gold[2],
  Y: RAMP.gold[3],
  // blood
  R: RAMP.blood[0],
  r: RAMP.blood[1],
  B: RAMP.blood[2],
  // drift
  P: RAMP.drift[0],
  d: RAMP.drift[1],
  p: RAMP.drift[2],
  u: RAMP.drift[3],
  v: RAMP.drift[4],
  // wood / dirt
  W: RAMP.dirt[0],
  w: RAMP.dirt[1],
  x: RAMP.dirt[2],
  // ember (bronze warmth)
  E: RAMP.ember[0],
  e: RAMP.ember[1],
  F: RAMP.ember[2]
};

/* ===================================================================== */
/* 1 · DEED_BLADE — crossed swords bound at the cross (war)              */
/* ===================================================================== */
function deedBlade() {
  const g = makeGrid(16, 16);
  paintRows(g, ['................', '.h............h.', '.Ch..........hC.', '..Ch........hC..', '...Ch......hC...', '....Ch....hC....', '.....Ch..hC.....', '......RrrR......', '......RrrR......', '.....hC..Ch.....', '....hC....Ch....', '...gg......gg...', '..gWg......gWg..', '...G........G...', '..GGG......GGG..', '................'], DPAL);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 2 · DEED_COIN — old struck coin stamped with a 4-point star (value)   */
/* ===================================================================== */
function deedCoin() {
  const g = makeGrid(16, 16);
  paintRows(g, ['................', '.....ggggg......', '...ggGGGGGgg....', '..gGyyyyyyyGg...', '..gGy..G..yGg...', '.gGy..GGG..yGg..', '.gGy.GG.GG.yGg..', '.gGy.G...G.yGg..', '.gGy.GG.GG.yGg..', '.gGy..GGG..yGg..', '..gGy..G..yGg...', '..gGyyyyyyyGg...', '...ggGGGGGgg....', '.....ggggg......', '................', '................'], DPAL);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 3 · DEED_LABOR — anvil (steel) on a wood stump (toil)                 */
/* ===================================================================== */
function deedLabor() {
  const g = makeGrid(16, 16);
  paintRows(g, ['................', '................', '...CCCCCCCC.....', '.CCCsssssssC....', 'CCCssssssssC....', '..CCsssssCC.....', '....CssssC......', '....CssssC......', '...CCssssCC.....', '..CCCCCCCCCC....', '..WWWWWWWWWW....', '..WwwwwwwwwW....', '..WwxWWWWxwW....', '..WwwwwwwwwW....', '..WWWWWWWWWW....', '................'], DPAL);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 4 · DEED_ENDURE — bone ward shield with a Drift boss (endurance)      */
/* ===================================================================== */
function deedEndure() {
  const g = makeGrid(16, 16);
  const o = RAMP.bone[2],
    L = RAMP.bone[1],
    q = RAMP.bone[3],
    dr = RAMP.drift;
  // heater-shield silhouette: y -> [x0, x1] body span (frame = the endpoints)
  const span = [[1, 3, 10], [2, 2, 11], [3, 2, 11], [4, 2, 11], [5, 2, 11], [6, 2, 11], [7, 2, 11], [8, 3, 10], [9, 3, 10], [10, 4, 9], [11, 4, 9], [12, 5, 8], [13, 6, 7]];
  span.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let c = o; // weathered pewter body
      if (x === x0) c = L; // moonlit left edge
      else if (x === x1) c = q; // shadowed right edge
      if (y === 1) c = L; // top rim catches the light
      P(g, x, y, c);
    }
  });
  // recessed Drift boss (the ward that endures), center of the field
  const bx = 4,
    by = 3;
  for (let d = 0; d < 5; d++) {
    P(g, bx + d, by, dr[3]);
    P(g, bx + d, by + 3, dr[3]);
  }
  for (let d = 0; d < 4; d++) {
    P(g, bx, by + d, dr[3]);
    P(g, bx + 4, by + d, dr[3]);
  }
  P(g, bx + 1, by + 1, dr[2]);
  P(g, bx + 2, by + 1, dr[1]);
  P(g, bx + 3, by + 1, dr[2]);
  P(g, bx + 1, by + 2, dr[2]);
  P(g, bx + 2, by + 2, dr[0]);
  P(g, bx + 3, by + 2, dr[2]);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 5 · DEED_REALM — the Drift sigil: glowing core + 4 spikes (corruption)*/
/* ===================================================================== */
function deedRealm() {
  const g = makeGrid(16, 16);
  const dr = RAMP.drift;
  const cx = 7,
    cy = 7;
  // bright diamond core (2×2 hi, ringed by mid)
  P(g, cx, cy, dr[0]);
  P(g, cx + 1, cy, dr[0]);
  P(g, cx, cy + 1, dr[0]);
  P(g, cx + 1, cy + 1, dr[0]);
  P(g, cx, cy - 1, dr[1]);
  P(g, cx + 1, cy - 1, dr[1]);
  P(g, cx, cy + 2, dr[1]);
  P(g, cx + 1, cy + 2, dr[1]);
  P(g, cx - 1, cy, dr[1]);
  P(g, cx - 1, cy + 1, dr[1]);
  P(g, cx + 2, cy, dr[1]);
  P(g, cx + 2, cy + 1, dr[1]);
  // four orthogonal spikes (taper mid→deep)
  for (let i = 2; i <= 5; i++) {
    const c = i <= 3 ? dr[2] : dr[3];
    P(g, cx, cy - i, c);
    P(g, cx + 1, cy - i, c); // up
    P(g, cx, cy + 1 + i, c);
    P(g, cx + 1, cy + 1 + i, c); // down
    P(g, cx - i, cy, c);
    P(g, cx - i, cy + 1, c); // left
    P(g, cx + 1 + i, cy, c);
    P(g, cx + 1 + i, cy + 1, c); // right
  }
  // diagonal dither motes (corruption flecks, glow — drawn, no outline added by spikes)
  [[cx - 3, cy - 3], [cx + 4, cy - 3], [cx - 3, cy + 4], [cx + 4, cy + 4]].forEach(([mx, my]) => {
    P(g, mx, my, dr[2]);
    P(g, mx + (mx < cx ? 1 : -1), my + (my < cy ? 1 : -1), dr[3]);
  });
  outline(g);
  return g;
}

/* ===================================================================== */
/* TIER RINGS — 16×16 laurel half-wreath OVERLAY (transparent center)    */
/* ===================================================================== */
// bronze = warm ember ramp · silver = cool bone ramp · gold = struck gold ramp.
function tierRing(metal) {
  const g = makeGrid(16, 16);
  const R = metal === 'gold' ? RAMP.gold : metal === 'silver' ? RAMP.bone : RAMP.ember;
  // bottom tie knot
  P(g, 7, 14, R[1]);
  P(g, 8, 14, R[1]);
  P(g, 6, 14, R[2]);
  P(g, 9, 14, R[2]);
  P(g, 7, 13, R[0]);
  P(g, 8, 13, R[0]);
  // leaves climbing each side from the tie, open at the top.
  // [base x, base y] of each left-side leaf; mirrored to the right.
  const leaves = [[4, 13], [3, 11], [2, 9], [2, 7], [3, 5], [4, 3]];
  leaves.forEach(([lx, ly], i) => {
    const lite = i % 2 ? R[0] : R[1];
    // left leaf — small dash angled up-and-out
    P(g, lx, ly, R[1]);
    P(g, lx - 1, ly - 1, lite);
    P(g, lx, ly - 1, R[0]);
    P(g, lx + 1, ly, R[2]);
    // mirrored right leaf
    const rx = 15 - lx;
    P(g, rx, ly, R[1]);
    P(g, rx + 1, ly - 1, lite);
    P(g, rx, ly - 1, R[0]);
    P(g, rx - 1, ly, R[2]);
  });
  outline(g);
  return g;
}

/* ===================================================================== */
/* DEED_EMBLEM — the Hall of Deeds mark (16×16 inline + 32×32 panel)     */
/* ===================================================================== */
function deedEmblem16() {
  const g = makeGrid(16, 16);
  paintRows(g, ['................', '....ggggg.......', '..ggGyyyGgg.....', '.ggGyyyyyGgg....', '.gGyy.G.yyGg....', '.gGy.GGG.yGg....', '.gGyyGGGyyGg....', '.gGy.GGG.yGg....', '.gGyy.G.yyGg....', '.ggGyyyyyGgg....', '..ggGyyyGgg.....', '....ggggg.......', '...Rr...rR......', '...Rr...rR......', '...rR...Rr......', '....r...r.......'], DPAL);
  outline(g);
  return g;
}
function deedEmblem32() {
  const g = makeGrid(32, 32);
  const gd = RAMP.gold,
    bl = RAMP.blood;
  const cx = 15.5,
    cy = 13;
  const rO = 11; // outer disc radius
  // ---- ribbon (behind disc): two forked tails, struck blood ----
  for (let y = 22; y <= 31; y++) {
    const k = y - 22;
    // left tail
    for (let x = 11; x <= 14; x++) {
      if (k >= 7 && x >= 13) continue; // forked notch
      P(g, x - Math.floor(k * 0.15), y, x === 11 ? bl[2] : x === 14 ? bl[2] : bl[1]);
    }
    // right tail (mirror)
    for (let x = 17; x <= 20; x++) {
      if (k >= 7 && x <= 18) continue;
      P(g, x + Math.floor(k * 0.15), y, x === 20 ? bl[2] : x === 17 ? bl[2] : bl[1]);
    }
  }
  // ribbon highlight threads
  for (let y = 22; y <= 28; y++) {
    P(g, 12, y, bl[0]);
    P(g, 19, y, bl[0]);
  }

  // ---- struck gold medallion disc ----
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = x - cx,
      dy = y - cy,
      d = Math.sqrt(dx * dx + dy * dy);
    if (d > rO) continue;
    let c;
    if (d > rO - 1.4) c = gd[3]; // dark struck edge
    else if (d > rO - 3) c = gd[2]; // bevel shadow
    else c = gd[1]; // base field
    // top-left moonlit catch
    if (dx + dy < -rO * 0.5 && d <= rO - 1) c = gd[0];
    if (dx + dy < -rO * 0.78 && d <= rO - 2) c = gd[0];
    P(g, x, y, c);
  }
  // inner rule ring (dull groove)
  for (let a = 0; a < 360; a += 5) {
    const rr = rO - 3.4;
    const x = Math.round(cx + Math.cos(a * Math.PI / 180) * rr);
    const y = Math.round(cy + Math.sin(a * Math.PI / 180) * rr);
    P(g, x, y, gd[3]);
  }
  // weathered struck mottle — break up the flat field so it reads as old metal
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = x - cx,
      dy = y - cy,
      d = Math.sqrt(dx * dx + dy * dy);
    if (d > rO - 4 || d < 2) continue;
    if (hash2(x, y, 91) < 0.10) P(g, x, y, gd[2]);
  }

  // ---- 4-point star struck into the field (embossed: lit upper-left, shadow lower-right) ----
  const sx = 15,
    sy = 12;
  for (let i = 1; i <= 7; i++) {
    P(g, sx, sy - i, gd[0]);
    P(g, sx + 1, sy - i, i <= 3 ? gd[0] : gd[1]); // up (lit)
    P(g, sx - i, sy, gd[0]);
    P(g, sx - i, sy + 1, i <= 3 ? gd[0] : gd[1]); // left (lit)
    P(g, sx, sy + 1 + i, i <= 3 ? gd[2] : gd[3]);
    P(g, sx + 1, sy + 1 + i, gd[3]); // down (shadow)
    P(g, sx + 1 + i, sy, i <= 3 ? gd[2] : gd[3]);
    P(g, sx + 1 + i, sy + 1, gd[3]); // right (shadow)
  }
  for (let dy = -2; dy <= 3; dy++) for (let dx = -2; dx <= 3; dx++) {
    if (Math.abs(dx - 0.5) + Math.abs(dy - 0.5) <= 2.5) {
      P(g, sx + dx, sy + dy, dx + dy < 1 ? gd[0] : gd[3]);
    }
  }
  outline(g);
  // tiny drift fleck on the rim (the honor is touched by the realm's decay)
  P(g, 24, 7, RAMP.drift[2]);
  P(g, 25, 8, RAMP.drift[3]);
  return g;
}

/* ===================================================================== */
/* METADATA                                                              */
/* ===================================================================== */
const DEED_BADGES = {
  deed_blade: {
    fn: deedBlade,
    cell: 16,
    ramp: 'steel/bone + blood',
    motif: 'crossed swords bound at the cross',
    line: 'War'
  },
  deed_coin: {
    fn: deedCoin,
    cell: 16,
    ramp: 'gold (struck)',
    motif: 'old coin stamped with a 4-point star',
    line: 'Value'
  },
  deed_labor: {
    fn: deedLabor,
    cell: 16,
    ramp: 'steel + wood',
    motif: 'anvil on a wood stump',
    line: 'Toil'
  },
  deed_endure: {
    fn: deedEndure,
    cell: 16,
    ramp: 'bone + drift',
    motif: 'ward shield with a Drift boss',
    line: 'Endurance'
  },
  deed_realm: {
    fn: deedRealm,
    cell: 16,
    ramp: 'drift-purple',
    motif: 'the Drift sigil — core + four spikes',
    line: 'The Realm'
  }
};
const DEED_TIERS = {
  tier_bronze: {
    metal: 'bronze',
    cell: 16,
    ramp: 'ember (warm)',
    overlay: true
  },
  tier_silver: {
    metal: 'silver',
    cell: 16,
    ramp: 'bone (cool)',
    overlay: true
  },
  tier_gold: {
    metal: 'gold',
    cell: 16,
    ramp: 'gold (struck)',
    overlay: true
  }
};
const DEEDS = {
  theme: 'earned honors · weathered heraldry · old struck gold, not shiny trophies',
  badges: DEED_BADGES,
  tiers: DEED_TIERS,
  emblem: {
    cell: [16, 32],
    ramp: 'gold + blood (ribbon) + drift (fleck)',
    motif: 'medallion · 4-point star · short ribbon',
    use: 'Hall of Deeds panel / tab icon'
  }
};
Object.assign(globalThis, {
  paintRows,
  DPAL,
  deedBlade,
  deedCoin,
  deedLabor,
  deedEndure,
  deedRealm,
  tierRing,
  deedEmblem16,
  deedEmblem32,
  DEED_BADGES,
  DEED_TIERS,
  DEEDS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/deeds.js", error: String((e && e.message) || e) }); }

// assets/_gen/driftwarden.js
try { (() => {
// Naevyr — DRIFTWARDEN (5th premium avatar, frontier ranger). Eval after pixlib.js +
// tiles.js + avatars.js (rig, drawFeet, drawSwingArm, AV_RAMP). DROP-IN COMPATIBLE with
// the wanderer/avatar rig: 32×40, feet y=37, 5 facings, idle2·walk6·swing4, shoulder y=18,
// swing pivot (cx+off+4, shoulderY+2), arc [-2.1,-1.35,-0.45,0.35], hit spark f2. RAMP only.
// Two cosmetic ramp-swap channels: cloak (the travel-cloak/hood) + ward (drift-lantern glow
// + cloak-edge trim + glaive energy). 48×64 shop portrait. Worn-gear lines up with the rig.

const DW_CHANNELS = {
  driftwarden: {
    cloak: ['stone', 'dirt', 'grass', 'blood', 'drift'],
    // a = cloak/hood body ramp
    ward: ['drift', 'ember', 'gold', 'water', 'blood'] // b = lantern/trim/glaive glow ramp
  }
};
function dwResolve(look) {
  look = look || {};
  const ch = DW_CHANNELS.driftwarden,
    names = Object.keys(ch);
  const pick = (chan, v) => {
    const opts = ch[chan];
    if (v == null) return AV_RAMP[opts[0]];
    if (typeof v === 'number') return AV_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    return AV_RAMP[v] || AV_RAMP[opts[0]];
  };
  return {
    rCloak: pick('cloak', look.a),
    rWard: pick('ward', look.b)
  };
}

// frontier ranger body: open travel-cloak + hood over a leather jerkin, one pauldron,
// a slung quiver, a belt drift-lantern (the ward glow), a warden's glaive on swing.
function bodyDriftwarden(g, R, anim, f, cloak, ward) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    hemSway,
    back,
    showFace
  } = R;
  const lt = RAMP.dirt; // leather jerkin under the cloak
  const flare = anim === 'idle' && f === 1; // lantern pulses on idle f1

  // slung quiver on the back (visible from behind / sides)
  if (back || dir === 1 || dir === 2) {
    const qx = cx + off - (back ? 0 : 3);
    for (let y = shoulderY - 1; y <= shoulderY + 8; y++) P(g, qx, y, lt[3]);
    P(g, qx, shoulderY - 2, ward[1]);
    P(g, qx - 1, shoulderY - 2, RAMP.bone[1]);
    P(g, qx + 1, shoulderY - 2, RAMP.bone[1]); // arrow fletching
  }

  // open travel-cloak (knee-length, parts at the front to show the jerkin)
  for (let y = shoulderY; y <= 35; y++) {
    const t = (y - shoulderY) / (35 - shoulderY);
    const hw = Math.round(3.6 + t * 3.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    const gap = !back && y > shoulderY + 6 ? Math.max(0, Math.round(t * 2)) : -1; // front opening
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      if (gap >= 0 && Math.abs(x - cxx) <= gap) {
        // jerkin shows through the parted cloak
        P(g, x, y, x < cxx ? lt[1] : lt[2]);
        continue;
      }
      let c = cloak[1];
      if (x <= cxx - hw + 1) c = cloak[0];
      if (x >= cxx + hw - 1) c = cloak[3];
      if (hash2(x, y, 401) < 0.05) c = cloak[2];
      if (back && x === cxx) c = cloak[2];
      P(g, x, y, c);
    }
  }
  // ward-trim along the cloak's leading edge (a thin glowing hem line)
  for (let y = shoulderY + 3; y <= 34; y += 1) {
    const t = (y - shoulderY) / (35 - shoulderY);
    const cxx = cx + Math.round(off * 0.5);
    const hw = Math.round(3.6 + t * 3.2);
    if (y % 2 === 0) P(g, cxx + hw - 1, y, ward[flare ? 1 : 2]);
  }
  // a pauldron on the right shoulder (leather + ward stud)
  const px = cx + off + 4;
  for (let y = shoulderY - 1; y <= shoulderY + 3; y++) for (let x = px - 2; x <= px + 2; x++) {
    let c = lt[1];
    if (x < px - 1) c = lt[0];
    if (x > px + 1) c = lt[2];
    P(g, x, y, c);
  }
  P(g, px, shoulderY, ward[flare ? 0 : 2]);
  // belt drift-lantern (the ward glow) hanging at the left hip; sways on walk
  if (!back) {
    const lsw = anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0;
    const lx = cx + off - 5 + lsw,
      ly = 28;
    P(g, lx, ly - 1, RAMP.bone[2]); // hook
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) {
      let c = lt[3];
      if (i === 0 && j === 1) c = flare ? ward[0] : ward[1];
      P(g, lx + i, ly + j, c);
    }
    if (flare) {
      P(g, lx, ly - 2, ward[1]);
      P(g, lx + 2, ly + 1, ward[2]);
      P(g, lx - 2, ly + 1, ward[2]);
    }
  }
  // hood (peaked, drawn over the head)
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.4);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = cloak[1];
      if (x === cxx - hw) c = cloak[0];
      if (x >= cxx + hw - 1) c = cloak[3];
      if (y === top) c = cloak[0];
      P(g, x, y, c);
    }
  }
  P(g, cx + off, top - 1, cloak[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, cloak[2]); // hood point droops toward facing
  // face shadow + steady warden eyes (ward-tinted glint)
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0),
      w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6,
      lit = flare;
    if (dir === 0) {
      P(g, fcx - 1, ey, lit ? ward[0] : ward[1]);
      P(g, fcx + 1, ey, ward[1]);
    }
    if (dir === 1) {
      P(g, fcx, ey, lit ? ward[0] : ward[1]);
      P(g, fcx + 2, ey, ward[1]);
    }
    if (dir === 2) {
      P(g, fcx + 1, ey, lit ? ward[0] : ward[1]);
    }
  }
  if (flare) P(g, cx + off + 7, top + 3, ward[1]); // drifting mote off the shoulder
}
// warden's glaive — a long haft with a hooked blade; the edge sparks ward-energy on f2.
function toolDriftwarden(g, ex, ey, f, ward) {
  const bn = RAMP.bone;
  // hooked blade head
  fillRect(g, ex - 1, ey - 2, 2, 4, bn[1]);
  P(g, ex, ey - 3, bn[0]);
  P(g, ex + 1, ey - 2, bn[2]);
  P(g, ex + 2, ey - 3, bn[1]);
  P(g, ex + 2, ey - 4, bn[0]); // hook curl
  if (f === 2) {
    P(g, ex + 3, ey - 2, ward[0]);
    P(g, ex + 4, ey - 1, ward[1]);
    P(g, ex + 3, ey, ward[2]);
  } // ward arc-spark
}
function drawDriftwarden(facing, anim, f, look) {
  const g = makeGrid(32, 40);
  const R = rig(facing, anim, f);
  const {
    rCloak,
    rWard
  } = dwResolve(look);
  const stomp = anim === 'walk' && (f === 1 || f === 4) ? 1 : 0;
  bodyDriftwarden(g, R, anim, f, rCloak, rWard);
  drawFeet(g, R, RAMP.dirt, 'driftwarden', stomp);
  drawSwingArm(g, R, anim, f, rCloak, (gg, ex, ey, ff) => toolDriftwarden(gg, ex, ey, ff, rWard));
  outline(g, RAMP.void);
  return g;
}

// 48×64 shop portrait — s-facing idle bust, 2f (reuses the avatar portrait crop logic).
function drawDriftwardenPortrait(f, look) {
  const g = makeGrid(48, 64);
  const cx = 24,
    top = 10;
  const src = drawDriftwarden('s', 'idle', f || 0, look);
  for (let y = 6; y <= 27; y++) for (let x = 4; x <= 27; x++) {
    const v = G(src, x, y);
    if (!v) continue;
    fillRect(g, cx - 24 + (x - 4) * 2, top + (y - 6) * 2, 2, 2, v.c);
  }
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}
const DRIFTWARDEN = {
  ramp: 'stone/dirt(cloak) + dirt(jerkin) + drift/ember(ward)',
  channels: DW_CHANNELS.driftwarden
};
Object.assign(globalThis, {
  DW_CHANNELS,
  dwResolve,
  bodyDriftwarden,
  toolDriftwarden,
  drawDriftwarden,
  drawDriftwardenPortrait,
  DRIFTWARDEN
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/driftwarden.js", error: String((e && e.message) || e) }); }

// assets/_gen/echofx.js
try { (() => {
// Naevyr ECHO FX — eval after pixlib.js + tiles.js (for hash2).
// Drift-shimmer overlays sized to the 32×40 wanderer rig (feet row y=37,
// bottom-center anchor [16,37]). These composite OVER a half-alpha wanderer so
// an "Echo" (a replayed past wanderer) reads as a ghost. Alpha is intentional —
// these are FX, NOT outlined (corruption/drift FX never get the void outline).

// Approximate silhouette envelope of the wanderer rig: y -> [x0,x1] (inclusive)
// or null. Matches the 32×40 avatar body so wisps hug the edges and the
// materialize puff fills the right footprint.
function wandererEnvelope() {
  const env = [];
  for (let y = 0; y < 40; y++) {
    if (y < 6) {
      env.push(null);
      continue;
    } // above head
    else if (y < 16) env.push([12, 19]); // head + hood
    else if (y < 20) env.push([11, 20]); // shoulders
    else if (y < 31) env.push([10, 21]); // torso + arms
    else if (y <= 37) env.push([12, 19]); // legs
    else env.push(null); // below feet
  }
  return env;
}

/* ============================ ECHO VEIL (32×40, 3 frames @3fps loop) ============================
   Faint vertical drift-wisps + rising motes that cling to the wanderer's edges.
   Subtle by design — edges only, low alpha — so the body shows through. */
function drawEchoVeil(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 40);
  const env = wandererEnvelope();
  const dr = RAMP.drift;

  // edge wisps: faint vertical motes just outside the body edges, phase-shifted
  // per frame so they shimmer/rise.
  for (let y = 6; y <= 37; y++) {
    const e = env[y];
    if (!e) continue;
    const ph = y + frame * 2;
    if (ph % 3 === 0) P(g, e[0] - 1, y, dr[1], 0.34); // left outer wisp
    if ((y + frame) % 4 === 0) P(g, e[0], y, dr[0], 0.22); // left inner shimmer
    if ((ph + 1) % 3 === 0) P(g, e[1] + 1, y, dr[1], 0.34); // right outer wisp
    if ((y + frame + 2) % 4 === 0) P(g, e[1], y, dr[0], 0.22); // right inner shimmer
    // sparse bright vein nodes along the seam
    if (hash2(e[0], y, 711) < 0.04) P(g, e[0] - 1, y, dr[0], 0.5);
    if (hash2(e[1], y, 712) < 0.04) P(g, e[1] + 1, y, dr[0], 0.5);
  }

  // a handful of interior motes drifting upward (same set, shifted by frame)
  const motes = [[14, 34], [18, 30], [12, 25], [20, 21], [16, 15], [19, 37], [11, 29], [21, 18]];
  motes.forEach(([mx, my], i) => {
    let yy = my - frame * 2;
    while (yy < 6) yy += 32; // wrap up through the body
    const e = env[yy];
    if (!e) return;
    const x = Math.min(Math.max(mx, e[0]), e[1]);
    P(g, x, yy, i % 2 ? dr[0] : dr[1], 0.3);
  });

  // crown shimmer — a couple of motes lifting off the head
  const crownY = 5 - frame;
  if (crownY >= 0) {
    P(g, 15, crownY, dr[0], 0.28);
    P(g, 17, crownY + 1, dr[1], 0.22);
  }
  // NOTE: no outline — FX overlay.
  return g;
}

/* ============================ ECHO FADE (32×40, 4 frames, one-shot) ============================
   Materialize/dissolve puff: drift motes gather INTO the wanderer silhouette
   across frames 0→3. Play forward to spawn an Echo, reversed to despawn it. */
function drawEchoFade(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 40);
  const env = wandererEnvelope();
  const dr = RAMP.drift;
  const rng = mulberry(733);
  const dens = [0.14, 0.42, 0.72, 1][frame]; // silhouette fill ratio
  const spread = [5, 4, 2, 0][frame]; // how far motes scatter outside

  // fill the silhouette with motes, density rising toward frame 3
  for (let y = 6; y <= 37; y++) {
    const e = env[y];
    if (!e) continue;
    for (let x = e[0]; x <= e[1]; x++) {
      const h = hash2(x, y, 73);
      if (h < dens) {
        const c = h < dens * 0.3 ? dr[0] : h < dens * 0.6 ? dr[1] : dr[2];
        P(g, x, y, c, 0.3 + 0.6 * dens);
      }
    }
  }

  // scattered outer motes — many while forming, gone once solid
  if (spread > 0) {
    for (let i = 0; i < 26; i++) {
      const ey = 6 + Math.floor(rng() * 32);
      const e = env[ey];
      if (!e) continue;
      const side = rng() < 0.5 ? -1 : 1;
      const off = 1 + Math.floor(rng() * spread);
      const x = side < 0 ? e[0] - off : e[1] + off;
      P(g, x, ey, rng() < 0.5 ? dr[0] : dr[1], 0.22 + 0.06 * (4 - spread));
    }
  }
  // NOTE: no outline — FX overlay.
  return g;
}

/* ============================ REGISTRY ============================ */
const ECHOFX = {
  echo_veil: {
    fn: drawEchoVeil,
    cell: [32, 40],
    anchor: [16, 37],
    frames: 3,
    anim: {
      name: 'shimmer',
      fps: 3,
      loop: true
    },
    overlay: true,
    compositeOver: 'wanderer 32×40 @ half alpha'
  },
  echo_fade: {
    fn: drawEchoFade,
    cell: [32, 40],
    anchor: [16, 37],
    frames: 4,
    anim: {
      name: 'materialize',
      fps: 8,
      loop: false
    },
    overlay: true,
    note: 'forward = spawn, reversed = despawn'
  }
};
Object.assign(globalThis, {
  wandererEnvelope,
  drawEchoVeil,
  drawEchoFade,
  ECHOFX
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/echofx.js", error: String((e && e.message) || e) }); }

// assets/_gen/events.js
try { (() => {
// Naevyr EVENT ART — eval after pixlib.js + tiles.js + beasts.js (moteBurst, ell).
// World-event sprites. Drift corruption FX get NO void outline on the boil seam (it bleeds);
// solid props keep the 1px outline. RAMP only, dither not blur.
//   drift_rift  96×128  states sealed/opening/active(boil 4f)/closing — vertical world-tear
//   rift_mote   16×16   2f — small mote drifting around an active rift
//   blood_moon  64×64   2f — dark-red corrupted moon phase
//   blood_aura  96×48   3f pulse — ground ring under buffed mobs during the Blood Moon
//   (sky-tint gradient stops are emitted as data in events emit + the readme)

/* ============================ DRIFT RIFT (96×128) ============================ */
// A vertical tear hanging on the ground plane: dithered drift core, bone-white boil seam,
// roiling mote edges, a scorched dirt apron. open ∈ 0..1 controls width/height; boil ∈ 0..3.
function drawRiftBody(g, open, boil) {
  const dr = RAMP.drift,
    dt = RAMP.dirt;
  const cx = 48,
    midY = 66,
    groundY = 120;
  // scorched apron on the ground (dirt + ash + drift dither) — this part is outlined-ish via dither
  ell(g, cx, groundY, Math.round(20 + open * 16), Math.round(5 + open * 3), (x, y, d) => {
    let c = dt[3];
    if (d < 0.4) c = RAMP.ash;
    if (hash2(x, y, 600) < open * 0.4 && d > 0.4) c = dr[3];
    P(g, x, y, c);
  });
  if (open <= 0.02) {
    // sealed: a dormant hairline scar with a few dim drift flecks
    for (let y = midY - 30; y <= groundY - 6; y++) {
      if (y % 3 !== 0) P(g, cx, y, dr[3]);
      if (y % 9 === 0) P(g, cx, y, dr[2]);
    }
    P(g, cx, midY, dr[2]);
    return;
  }
  const halfW = Math.round(2 + open * 20);
  const halfH = Math.round(20 + open * 42);
  // the tear: vertical lens, hard-banded drift ramp + pixel dither (NOT blurred)
  for (let y = midY - halfH; y <= midY + halfH; y++) {
    const ty = (y - (midY - halfH)) / (2 * halfH); // 0 top .. 1 bottom
    const profile = Math.sin(ty * Math.PI); // lens taper
    const w = Math.max(0, Math.round(halfW * profile));
    for (let x = cx - w; x <= cx + w; x++) {
      const r = Math.abs(x - cx) / Math.max(1, w); // 0 core .. 1 edge
      let c;
      if (r < 0.18) c = dr[0];else if (r < 0.4) c = dr[1];else if (r < 0.66) c = dr[2];else if (r < 0.86) c = dr[3];else c = dr[4];
      // pixel dither breakup (toward the edges), animated by boil
      if (r > 0.45 && (x + y + boil) % 2 === 0 && hash2(x, y, 601 + boil) < 0.5) continue;
      P(g, x, y, c);
    }
  }
  // bright bone-white boil seam down the centre (flickers per boil frame)
  for (let y = midY - halfH + 2; y <= midY + halfH - 2; y++) {
    if (hash2(0, y, 610 + boil) < 0.78) P(g, cx, y, dr[0]);
    if (hash2(0, y, 612 + boil) < 0.25) {
      P(g, cx - 1, y, dr[1]);
      P(g, cx + 1, y, dr[1]);
    }
  }
  // roiling mote edge (boils outward) — NO outline, it bleeds into the dark
  const rip = mulberry(620 + boil);
  for (let i = 0; i < Math.round(14 * open); i++) {
    const ty = rip(),
      y = Math.round(midY - halfH + ty * 2 * halfH);
    const profile = Math.sin(ty * Math.PI),
      w = halfW * profile;
    const side = rip() < 0.5 ? -1 : 1;
    const x = Math.round(cx + side * (w + 1 + rip() * 3));
    P(g, x, y, rip() < 0.4 ? dr[0] : dr[2]);
  }
  // motes escaping the top
  if (open > 0.6) moteBurst(g, cx, midY - halfH, 8, 0.4, 630 + boil);
}
const RIFT_STATES = {
  sealed: 2,
  opening: 4,
  active: 4,
  closing: 4
};
function drawDriftRift(state, f) {
  const g = makeGrid(96, 128);
  if (state === 'sealed') drawRiftBody(g, 0, f % 2);
  if (state === 'opening') drawRiftBody(g, [0.15, 0.45, 0.72, 1][f], f % 4);
  if (state === 'active') drawRiftBody(g, 1, f); // boil loop
  if (state === 'closing') drawRiftBody(g, [1, 0.7, 0.4, 0.12][f], (4 - f) % 4);
  // ground apron keeps a faint outline so it reads on the tile; the corruption does NOT.
  return g; // intentionally no global outline (boil seam bleeds)
}

/* ============================ RIFT MOTE (16×16, 2f) ============================ */
function drawRiftMote(f) {
  const g = makeGrid(16, 16);
  const dr = RAMP.drift;
  const cx = 8,
    cy = 7 + (f ? -1 : 1);
  ell(g, cx, cy, 2.2, 2.2, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
  // little trailing tail + sparkle (alternates)
  P(g, cx, cy + 3, dr[3]);
  P(g, cx + (f ? 1 : -1), cy + 4, dr[3]);
  if (f) {
    P(g, cx - 3, cy - 2, dr[1]);
    P(g, cx + 3, cy, dr[2]);
  } else {
    P(g, cx + 3, cy - 2, dr[1]);
    P(g, cx - 3, cy, dr[2]);
  }
  return g; // mote: no outline (it glows)
}

/* ============================ BLOOD MOON (64×64, 2f) ============================ */
// A corrupted blood-red moon: deep-red disc, darker maria/craters, a creeping drift-purple
// vein, a faint outer corrupted halo. 2f = a slow ember/drift glimmer along the vein.
function drawBloodMoon(f) {
  const g = makeGrid(64, 64);
  const bl = RAMP.blood,
    dr = RAMP.drift;
  const cx = 32,
    cy = 32,
    R = 22;
  // outer corrupted halo (dither, no hard edge)
  for (let y = 4; y < 60; y++) for (let x = 4; x < 60; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > R && d < R + 6 && (x + y + f) % 2 === 0 && hash2(x, y, 640) < (1 - (d - R) / 6) * 0.6) P(g, x, y, bl[3]);
  }
  // the disc — blood ramp, lit upper-left
  ell(g, cx, cy, R, R, (x, y, d, dx, dy) => {
    let c = bl[1];
    if (dx + dy < -0.4) c = bl[0];
    if (d > 0.72) c = bl[2];
    if (dx + dy > 0.55) c = bl[3];
    if (hash2(x, y, 641) < 0.06) c = bl[3]; // mottling
    P(g, x, y, c);
  });
  // dark maria / craters
  [[-7, -5, 5], [6, 3, 6], [-3, 9, 4], [10, -8, 3]].forEach(([ox, oy, r]) => ell(g, cx + ox, cy + oy, r, r * 0.9, (x, y, d) => {
    if (d < 0.7) P(g, x, y, bl[3]);else if (d < 1) P(g, x, y, bl[2]);
  }));
  // creeping drift-purple corruption vein (glimmers on f1)
  let vx = cx - 14,
    vy = cy - 6;
  for (let k = 0; k < 22; k++) {
    if (Math.hypot(vx - cx, vy - cy) < R - 1) P(g, Math.round(vx), Math.round(vy), f && k % 3 === 0 ? dr[0] : dr[2]);
    vx += 1.1 + (hash2(k, 0, 642) - 0.5);
    vy += 0.5 + (hash2(k, 1, 642) - 0.5) * 1.2;
  }
  if (f) moteBurst(g, cx + 6, cy + 2, 6, 0.3, 643);
  outline(g, RAMP.void); // the moon is a solid body → outlined
  return g;
}

/* ============================ BLOOD AURA RING (96×48, 3f) ============================ */
// Iso ground ring placed UNDER buffed mobs during the Blood Moon. Pulses 3f.
function drawBloodAura(f) {
  const g = makeGrid(96, 48);
  const bl = RAMP.blood,
    dr = RAMP.drift;
  const cx = 48,
    cy = 24;
  const rx = [30, 34, 32][f],
    ry = rx / 2;
  const bright = f === 1;
  for (let a = 0; a < 360; a += 3) {
    const rad = a * Math.PI / 180,
      x = Math.round(cx + Math.cos(rad) * rx),
      y = Math.round(cy + Math.sin(rad) * ry);
    if ((x + y + f) % 2 === 0) continue; // dither
    P(g, x, y, bright ? bl[0] : bl[1]);
    // inner glow lip
    const ix = Math.round(cx + Math.cos(rad) * (rx - 2)),
      iy = Math.round(cy + Math.sin(rad) * (ry - 1));
    if ((ix + iy) % 3 === 0) P(g, ix, iy, bright ? bl[1] : bl[2]);
  }
  // a few drift-tainted flecks rising inside the ring
  for (let i = 0; i < 6; i++) {
    const t = hash2(i, f, 650) * Math.PI * 2,
      r = hash2(i, f, 651) * rx * 0.6;
    P(g, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.5), i % 2 ? dr[2] : bl[2]);
  }
  return g; // ground FX: no outline
}

// Full-screen Blood-Moon SKY TINT — vertical gradient reference (top → horizon).
// Exact hex stops (overlay the world with these, top-to-bottom; ~0.5 strength):
const BLOOD_SKY_STOPS = [{
  at: 0.0,
  hex: '#1a0610',
  note: 'zenith — near-void, faint red'
}, {
  at: 0.35,
  hex: '#2a0810',
  note: 'upper sky'
}, {
  at: 0.62,
  hex: '#3b0d14',
  note: 'mid sky'
}, {
  at: 0.82,
  hex: '#5f1212',
  note: 'low sky (blood-dp)'
}, {
  at: 1.0,
  hex: '#991b1b',
  note: 'horizon glow (blood-lo)'
}];
// a 64×128 banded-dither swatch of the gradient for the preview / engine reference
function drawBloodSkySwatch() {
  const g = makeGrid(64, 128);
  for (let y = 0; y < 128; y++) {
    const t = y / 127;
    // pick the two surrounding stops and hard-band with a dither between them
    let lo = BLOOD_SKY_STOPS[0],
      hi = BLOOD_SKY_STOPS[BLOOD_SKY_STOPS.length - 1];
    for (let i = 0; i < BLOOD_SKY_STOPS.length - 1; i++) if (t >= BLOOD_SKY_STOPS[i].at && t <= BLOOD_SKY_STOPS[i + 1].at) {
      lo = BLOOD_SKY_STOPS[i];
      hi = BLOOD_SKY_STOPS[i + 1];
    }
    const f = (t - lo.at) / Math.max(0.0001, hi.at - lo.at);
    for (let x = 0; x < 64; x++) {
      const c = (x + y) % 2 === 0 && hash2(x, y, 660) < f ? hi.hex : lo.hex;
      P(g, x, y, c);
    }
  }
  return g;
}
const EVENTS = {
  drift_rift: {
    states: RIFT_STATES,
    cell: [96, 128],
    anchor: [48, 127],
    note: 'world-tear; sits on ground plane; boil seam un-outlined'
  },
  rift_mote: {
    frames: 2,
    cell: [16, 16],
    anchor: [8, 8]
  },
  blood_moon: {
    frames: 2,
    cell: [64, 64],
    anchor: [32, 32]
  },
  blood_aura: {
    frames: 3,
    cell: [96, 48],
    anchor: [48, 24],
    centered: true
  }
};
Object.assign(globalThis, {
  drawRiftBody,
  RIFT_STATES,
  drawDriftRift,
  drawRiftMote,
  drawBloodMoon,
  drawBloodAura,
  BLOOD_SKY_STOPS,
  drawBloodSkySwatch,
  EVENTS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/events.js", error: String((e && e.message) || e) }); }

// assets/_gen/exchange.js
try { (() => {
// NAEVYR — THE EXCHANGE counter (Vault interior fixture). Eval after pixlib.js +
// tiles.js. Matches the interiors.js fixture conventions: bottom-center anchor,
// top 6px of the cell kept clear for labels, 1px void outline, RAMP only.
// Brass balance scales: a GOLD pan and a violet-glow DRIFTS pan, 48×48, 2-frame
// tip-totter (~2fps).

const EX_W = 48,
  EX_H = 48,
  EX_ANCHOR = [24, 47];
function drawExchange(frame) {
  const g = makeGrid(EX_W, EX_H);
  const gd = RAMP.gold,
    dr = RAMP.drift,
    st = RAMP.stone,
    dt = RAMP.dirt;
  const cx = 24,
    baseY = 45;

  // --- ledger/counter base the scales sit on ---
  for (let y = baseY - 6; y <= baseY; y++) for (let x = cx - 16; x <= cx + 16; x++) {
    let c = dt[1];
    if (x < cx - 14) c = dt[0];
    if (x > cx + 14) c = dt[3];
    if (y > baseY - 2) c = dt[3];
    if ((x + y) % 7 === 0) c = dt[2];
    P(g, x, y, c);
  }
  // an open ledger book on the left of the counter
  fillRect(g, cx - 14, baseY - 9, 9, 3, RAMP.bone[1]);
  P(g, cx - 10, baseY - 9, dt[3]);
  for (let i = 0; i < 3; i++) {
    P(g, cx - 13 + i, baseY - 8, st[3]);
    P(g, cx - 8 + i, baseY - 8, st[3]);
  }

  // --- central brass column ---
  for (let y = 12; y <= baseY - 6; y++) {
    P(g, cx, y, gd[1]);
    P(g, cx - 1, y, gd[2]);
    P(g, cx + 1, y, gd[3]);
  }
  fillRect(g, cx - 2, baseY - 7, 5, 2, gd[3]); // foot
  // finial
  P(g, cx, 10, gd[0]);
  P(g, cx, 11, gd[1]);

  // --- balance beam (tips by frame) ---
  const tip = frame === 0 ? 1 : -1; // +1: gold pan down; -1: drifts pan down
  const beamY = 14;
  const armLen = 13;
  // beam as a shallow line pivoting at (cx, beamY)
  const pts = [];
  for (let i = -armLen; i <= armLen; i++) {
    const y = beamY + Math.round(i / armLen * 2 * tip);
    P(g, cx + i, y, i < 0 ? gd[1] : gd[2]);
    P(g, cx + i, y - 1, gd[0]);
    pts.push(y);
  }
  // pivot knob
  P(g, cx, beamY - 1, gd[0]);
  P(g, cx, beamY, gd[1]);

  // --- left pan: GOLD coins ---
  const lpx = cx - armLen,
    lpy = pts[0] + 1;
  hangPan(g, lpx, lpy + (tip > 0 ? 4 : 2), gd, 'gold');
  // --- right pan: DRIFTS (violet glow) ---
  const rpx = cx + armLen,
    rpy = pts[pts.length - 1] + 1;
  hangPan(g, rpx, rpy + (tip < 0 ? 4 : 2), dr, 'drifts');
  outline(g, RAMP.void);

  // glow on the drifts pan AFTER outline (outline-free)
  const gy = (tip < 0 ? rpy + 4 : rpy + 2) + 4;
  for (let i = -1; i <= 1; i++) P(g, rpx + i, gy - 5, dr[0]);
  if (frame) {
    P(g, rpx, gy - 7, dr[1]);
    P(g, rpx - 2, gy - 5, dr[2]);
    P(g, rpx + 2, gy - 5, dr[2]);
  }
  return g;
}

// a hanging pan: 2 chains to a shallow bowl + its contents
function hangPan(g, px, py, ramp, kind) {
  const gd = RAMP.gold;
  // chains from beam end down to the bowl
  for (let k = 0; k < 4; k++) {
    P(g, px - 2, py - 4 + k, gd[3]);
    P(g, px + 2, py - 4 + k, gd[3]);
  }
  // bowl
  for (let x = px - 4; x <= px + 4; x++) {
    const d = Math.abs(x - px);
    const yy = py + Math.round(d * 0.4);
    P(g, x, yy, gd[2]);
    P(g, x, yy + 1, gd[3]);
  }
  // contents
  if (kind === 'gold') {
    P(g, px - 1, py - 1, gd[0]);
    P(g, px + 1, py - 1, gd[1]);
    P(g, px, py - 2, gd[0]);
    P(g, px, py - 1, gd[1]); // coin stack
  } else {
    // a drift shard
    P(g, px, py - 3, RAMP.drift[0]);
    P(g, px, py - 2, RAMP.drift[1]);
    P(g, px - 1, py - 1, RAMP.drift[2]);
    P(g, px + 1, py - 1, RAMP.drift[2]);
    P(g, px, py - 1, RAMP.drift[1]);
  }
}
const EXCHANGE = {
  exchange_counter: {
    fn: drawExchange,
    frames: 2,
    fps: 2,
    cell: [EX_W, EX_H],
    anchor: EX_ANCHOR,
    ramp: 'gold(brass) + drift + dirt'
  }
};
Object.assign(globalThis, {
  EX_W,
  EX_H,
  EX_ANCHOR,
  drawExchange,
  hangPan,
  EXCHANGE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/exchange.js", error: String((e && e.message) || e) }); }

// assets/_gen/frontier.js
try { (() => {
// Naevyr FRONTIER EXPANSION · GROUND ACCENTS + DOODADS — eval after pixlib.js + tiles.js.
// Heavier ash / corruption ground-accent tiles (64×36, drawn UNDER entities, like the
// threshold ground accents) + native-size bottom-anchored frontier doodads.
//   ash_ground   64×36 ×2 variants (a=ash drift, b=corruption stain)
//   drift_crystal 28×44 ×2 · ash_dune 26×16 ×2 · scorched_stump 24×22 ×2
// RAMP only, 1px void outline on doodads (accents keep only their diamond edge),
// dither not blur, moonlit-left/shadowed-right.

/* ===================== GROUND ACCENTS (64×36, 2 variants, under-entities) ===================== */
function drawAshGround(variant) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const st = RAMP.stone,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const seed = 801 + variant;
  // dark ashen face (ash + deep-stone dither)
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    let c = (x + y) % 2 === 0 ? RAMP.ash : st[3];
    if (y > 23) c = RAMP.void;
    P(g, x, y, c);
  }
  // 3px south lip + 1px void north edge
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, RAMP.void);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }
  if (variant === 0) {
    // ASH DRIFT — pale wind-blown ash piled in streaks, scorch blotches
    for (let i = 0; i < 64; i++) {
      const ax = 8 + Math.floor(hash2(i, 1, seed) * 48),
        ay = 6 + Math.floor(hash2(i, 2, seed) * 20);
      if (!inDiamond(rows, ax, ay)) continue;
      const a = hash2(i, 3, seed);
      if (a < 0.5) {
        P(g, ax, ay, bn[3]);
        if (a < 0.22) {
          P(g, ax + 1, ay, bn[2]);
        }
      } else if (a < 0.62) P(g, ax, ay, st[2]); // grey grit
    }
    // a couple of darker scorch patches
    [[22, 14], [40, 18]].forEach(([bx, by]) => {
      for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) {
        if ((xx / 4) ** 2 + (yy / 3) ** 2 > 1) continue;
        if (inDiamond(rows, bx + xx, by + yy) && hash2(bx + xx, by + yy, seed + 5) < 0.7) P(g, bx + xx, by + yy, RAMP.void);
      }
    });
  } else {
    // CORRUPTION STAIN — drift-purple dither bloom welling from a void core + motes
    const ccx = 32,
      ccy = 16;
    for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const d = Math.abs(x - ccx) / 2 + Math.abs(y - ccy); // diamond metric
      const density = Math.max(0, 1 - d / 16);
      const h = hash2(x, y, seed);
      if (d < 3) {
        if (h < 0.7) P(g, x, y, RAMP.void);
      } // dead core
      else if ((x + y) % 2 === 0 && h < density * 0.95) P(g, x, y, dr[3]);else if (h < density * 0.28) P(g, x, y, dr[4] || dr[3]);
    }
    // bright drift motes welling up
    [[26, 12], [36, 18], [30, 20], [40, 10]].forEach(([mx, my], i) => {
      if (!inDiamond(rows, mx, my)) return;
      P(g, mx, my, i % 2 ? dr[1] : dr[2]);
      if (i % 2 === 0) P(g, mx, my - 1, dr[2]);
    });
    // faint purple veins crawling to the rim
    let vx = ccx,
      vy = ccy;
    for (let k = 0; k < 22; k++) {
      if (inDiamond(rows, vx, vy)) P(g, vx, vy, dr[2]);
      vx += hash2(vx, vy, seed + 9) < 0.5 ? 1 : -1;
      vy += hash2(vx, vy, seed + 8) < 0.5 ? 1 : 0;
    }
  }
  return g; // ground accent: keep only its diamond edge (no full outline)
}

/* ===================== DRIFT CRYSTAL CLUSTER (28×44, 2 variants) ===================== */
function drawDriftCrystal(variant) {
  const g = makeGrid(28, 44);
  const dr = RAMP.drift,
    st = RAMP.stone;
  const cx = 14,
    baseY = 41;
  // small dark rocky base the shards erupt from
  for (let yy = 0; yy < 5; yy++) for (let xx = -9 + yy; xx <= 9 - yy; xx++) {
    let c = st[2];
    if (xx < -7 + yy) c = st[1];
    if (xx > 7 - yy) c = st[3];
    P(g, cx + xx, baseY - yy, c);
  }
  // a single drift shard (tapered crystal) leaning by `lean`
  function shard(sx, sy, h, lean, thick) {
    for (let k = 0; k < h; k++) {
      const t = k / h,
        w = Math.max(0, Math.round((1 - t) * thick));
      const x = sx + Math.round(lean * t * 4);
      for (let i = -w; i <= w; i++) {
        let c = dr[2];
        if (i < 0) c = dr[1];
        if (i > 0) c = dr[3];
        if (i === 0 && k < h * 0.7) c = dr[0];
        P(g, x + i, sy - k, c);
      }
    }
    P(g, sx + Math.round(lean * 4), sy - h, dr[0]); // bright tip
  }
  // cluster layout per variant
  if (variant === 0) {
    // upright tall cluster
    shard(cx, baseY - 2, 34, 0.1, 3);
    shard(cx - 6, baseY - 1, 20, -0.5, 2);
    shard(cx + 6, baseY - 1, 24, 0.5, 2);
    shard(cx - 2, baseY, 12, -0.2, 1);
  } else {
    // wider, splayed cluster
    shard(cx - 2, baseY - 1, 26, -0.3, 3);
    shard(cx + 4, baseY - 2, 30, 0.4, 2);
    shard(cx - 8, baseY, 16, -0.7, 2);
    shard(cx + 9, baseY, 14, 0.8, 1);
    shard(cx + 1, baseY, 10, 0.1, 1);
  }
  // faint glow halo (dither)
  for (let yy = -2; yy <= 6; yy++) for (let xx = -11; xx <= 11; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 8 && d < 12 && (xx + yy) % 2 === 0 && !G(g, cx + xx, baseY - 18 + yy)) P(g, cx + xx, baseY - 18 + yy, dr[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ===================== ASH DUNE TUFT (26×16, 2 variants) ===================== */
function drawAshDune(variant) {
  const g = makeGrid(26, 16);
  const dt = RAMP.dirt,
    bn = RAMP.bone;
  const cx = 13,
    baseY = 14;
  // a low wind-blown ash mound (asymmetric, tail to the right)
  const peak = variant ? 7 : 6;
  for (let xx = -12; xx <= 12; xx++) {
    const t = (xx + 12) / 24;
    // asymmetric profile: steep left face, long drift tail right
    const h = Math.round(peak * Math.exp(-Math.pow((xx + (variant ? -2 : 2)) / 7, 2)) * (1 + 0.3 * (xx > 0 ? 1 - t : 0)));
    for (let k = 0; k < h; k++) {
      let c = dt[2];
      if (k > h - 2) c = bn[3];
      if (xx < -peak + 2) c = dt[1];
      if (xx > peak) c = RAMP.ash;
      P(g, cx + xx, baseY - k, c);
    }
    // pale ash crest streaks
    if (h > 1 && hash2(cx + xx, h, 821 + variant) < 0.5) P(g, cx + xx, baseY - h, bn[2]);
  }
  // wind-blown ash flecks trailing off the tail
  for (let i = 0; i < 4; i++) {
    const fx = cx + 8 + i * 2,
      fy = baseY - 4 - Math.floor(hash2(i, 1, 822 + variant) * 3);
    P(g, fx, fy, bn[3]);
  }
  // a dead reed or bone shard poking out (variant differs)
  if (variant === 0) {
    for (let k = 0; k < 6; k++) P(g, cx - 3, baseY - peak - k, bn[2]);
    P(g, cx - 3, baseY - peak - 6, bn[1]);
  } else {
    for (let k = 0; k < 5; k++) P(g, cx + 1, baseY - peak - k, RAMP.grass[2]);
    P(g, cx + 1, baseY - peak - 5, RAMP.grass[0]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ===================== SCORCHED STUMP (24×22, 2 variants) ===================== */
function drawScorchedStump(variant) {
  const g = makeGrid(24, 22);
  const dt = RAMP.dirt,
    em = RAMP.ember;
  const cx = 12,
    baseY = 20;
  // burnt broken trunk — charred dark wood, jagged snapped top
  const hgt = variant ? 13 : 10,
    rad = variant ? 4 : 5;
  const topProfile = [hgt, hgt - 2, hgt + 1, hgt - 3, hgt, hgt - 1];
  for (let x = -rad; x <= rad; x++) {
    const col = x + rad,
      top = topProfile[Math.min(topProfile.length - 1, Math.floor(col / (rad * 2) * (topProfile.length - 1)))];
    for (let y = 0; y < top; y++) {
      let c = dt[3];
      if (x < -rad + 1) c = dt[2];
      if (x > rad - 1) c = RAMP.void;
      if (y > top - 3) c = RAMP.void; // charred black crown
      if (hash2(cx + x, y, 831 + variant) < 0.10) c = RAMP.ash;
      P(g, cx + x, baseY - y, c);
    }
    // ember glow smouldering in the cracks of the crown
    if (x % 2 === 0 && Math.abs(x) < rad) {
      P(g, cx + x, baseY - top + 2, em[2]);
      if (Math.abs(x) < 2) P(g, cx + x, baseY - top + 3, em[1]);
    }
  }
  // exposed charred roots flaring at the base
  for (const dir of [-1, 1]) for (let k = 0; k < 4; k++) P(g, cx + dir * (rad + k), baseY - Math.floor(k / 2), k > 1 ? dt[3] : dt[2]);
  // a broken branch stub (variant 1) or an ember spark drifting up (variant 0)
  if (variant === 1) {
    for (let k = 0; k < 5; k++) P(g, cx + rad - 1 + k, baseY - hgt + 4 - Math.floor(k * 0.6), dt[3]);
  } else {
    P(g, cx + 1, baseY - hgt - 2, em[1]);
    P(g, cx, baseY - hgt - 4, em[2]);
  }
  // faint rising ash/ember glow
  for (let yy = -2; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 3 && d < 5 && (xx + yy) % 2 === 0) P(g, cx + xx, baseY - hgt + yy, em[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const FRONTIER_GROUND = {
  ash_ground: {
    fn: i => drawAshGround(i),
    cell: [64, 36],
    anchor: [32, 16],
    variants: 2,
    tile: true,
    under: true
  }
};
const FRONTIER_DOODAD = {
  drift_crystal: {
    fn: i => drawDriftCrystal(i),
    cell: [28, 44],
    anchor: [14, 41],
    variants: 2
  },
  ash_dune: {
    fn: i => drawAshDune(i),
    cell: [26, 16],
    anchor: [13, 15],
    variants: 2
  },
  scorched_stump: {
    fn: i => drawScorchedStump(i),
    cell: [24, 22],
    anchor: [12, 21],
    variants: 2
  }
};
Object.assign(globalThis, {
  drawAshGround,
  drawDriftCrystal,
  drawAshDune,
  drawScorchedStump,
  FRONTIER_GROUND,
  FRONTIER_DOODAD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/frontier.js", error: String((e && e.message) || e) }); }

// assets/_gen/fxlogo.js
try { (() => {
// Naevyr FX + logo generators — eval after pixlib.js.

// ---- FX ----
function makeMotes() {
  const dr = RAMP.drift;
  const v1 = makeGrid(2, 2);
  fillRect(v1, 0, 0, 2, 2, dr[1]);
  const v2 = makeGrid(2, 2);
  P(v2, 0, 0, dr[0]);
  P(v2, 1, 0, dr[1]);
  P(v2, 0, 1, dr[2]);
  P(v2, 1, 1, dr[2]);
  const v3 = makeGrid(2, 2);
  P(v3, 0, 0, dr[2]);
  P(v3, 1, 0, dr[3]);
  P(v3, 0, 1, dr[3]);
  P(v3, 1, 1, dr[2]);
  return [v1, v2, v3];
}
function makeEmbers() {
  return [0, 1, 2].map(i => {
    const g = makeGrid(1, 1);
    P(g, 0, 0, RAMP.ember[i]);
    return g;
  });
}
function makeAsh() {
  return ['#a99fb8', '#6f6781', '#d8cfe0'].map(c => {
    const g = makeGrid(1, 1);
    P(g, 0, 0, c);
    return g;
  });
}
// progress ring: 24×24, 8 fill steps, stepped pixel circumference
function makeRingFrames() {
  const dr = RAMP.drift;
  const pts = [];
  const n = 44;
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + i / n * Math.PI * 2; // start top, clockwise
    pts.push([Math.round(11.5 + Math.cos(t) * 9.5), Math.round(11.5 + Math.sin(t) * 9.5)]);
  }
  return Array.from({
    length: 8
  }, (_, s) => {
    const g = makeGrid(24, 24);
    const fillN = Math.round((s + 1) / 8 * n);
    pts.forEach((p, i) => {
      const on = i < fillN;
      P(g, p[0], p[1], on ? dr[2] : dr[4]);
      // 2px thickness: inner ring pixel
      const t = -Math.PI / 2 + i / n * Math.PI * 2;
      P(g, Math.round(11.5 + Math.cos(t) * 8.5), Math.round(11.5 + Math.sin(t) * 8.5), on ? dr[3] : dr[4]);
      if (on && i === fillN - 1) P(g, p[0], p[1], dr[0]); // hot leading pixel
    });
    return g;
  });
}

// ---- LOGO ----
// custom 12px-tall pixel letterset (only the letters NAEVYR needs)
const GLYPHS = {
  D: ['######..', '#######.', '##...##.', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##...##.', '#######.', '######..'],
  R: ['#######.', '########', '##....##', '##....##', '##...###', '#######.', '######..', '##.###..', '##..##..', '##...##.', '##...###', '##....##'],
  I: ['####', '####', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '####', '####'],
  F: ['########', '########', '##......', '##......', '##......', '#######.', '#######.', '##......', '##......', '##......', '##......', '##......'],
  T: ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  L: ['##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '########', '########'],
  A: ['..####..', '.######.', '##....##', '##....##', '##....##', '########', '########', '##....##', '##....##', '##....##', '##....##', '##....##'],
  N: ['##....##', '##....##', '###...##', '####..##', '##.##.##', '##.##.##', '##..####', '##..####', '##...###', '##...###', '##....##', '##....##'],
  S: ['.#######', '########', '##......', '##......', '########', '.#######', '......##', '......##', '......##', '......##', '########', '#######.'],
  E: ['########', '########', '##......', '##......', '##......', '#######.', '#######.', '##......', '##......', '##......', '########', '########'],
  V: ['##....##', '##....##', '##....##', '##....##', '##....##', '.##..##.', '.##..##.', '.##..##.', '..####..', '..####..', '...##...', '...##...'],
  Y: ['##....##', '##....##', '.##..##.', '.##..##.', '..####..', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...']
};
function scaleGrid(g, k) {
  const m = makeGrid(g.w * k, g.h * k);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) fillRect(m, x * k, y * k, k, k, v.c, v.a);
  }
  return m;
}
// build the NAEVYR wordmark at 1× (12 tall) with corruption bleed
function wordmarkGrid(mono) {
  const word = 'NAEVYR';
  const bn = RAMP.bone,
    dr = RAMP.drift;
  let widths = [],
    total = 0;
  for (const ch of word) {
    const w = GLYPHS[ch][0].length;
    widths.push(w);
    total += w + 1;
  }
  total -= 1;
  const g = makeGrid(total, 12);
  let ox = 0;
  word.split('').forEach((ch, gi) => {
    const rows = GLYPHS[ch];
    for (let y = 0; y < 12; y++) for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== '#') continue;
      let c;
      if (mono) c = bn[1];else if (y === 0) c = bn[0];else if (y < 8) c = bn[1];else if (y === 8) c = (x + y) % 2 === 0 ? bn[1] : dr[1];else if (y === 9) c = (x + y) % 2 === 0 ? dr[1] : dr[2];else if (y === 10) c = dr[2];else c = dr[3];
      // rising veins
      if (!mono && y >= 6 && y <= 8 && hash2(ox + x, y, 99) < 0.05) c = dr[2];
      P(g, ox + x, y, c);
    }
    ox += widths[gi] + 1;
  });
  return g;
}
// emblem (the stone iso-tile cradling a Drift mote) — 16×16 master
const EMBLEM_ROWS = ['.......kk.......', '......kCCk......', '.....kCccCk.....', '....kCc..cCk....', '...kCc.p..cCk...', '..kCc.pPp..cCk..', '.kCc..pPp...cCk.', 'kCc..pPPPp...cCk', '.kCc..pPp...cCk.', '..kCc.pPp..cCk..', '...kCc.p..cCk...', '....kCc..cCk....', '.....kCccCk.....', '......kCCk......', '.......kk.......', '................'];
function emblemGrid(mono) {
  const PALC = mono ? {
    k: '#0a0810',
    C: '#d8cfe0',
    c: '#a99fb8',
    P: '#efe9f4',
    p: '#d8cfe0'
  } : {
    k: '#0a0810',
    C: '#4a4360',
    c: '#322b46',
    P: '#f3e8ff',
    p: '#a855f7'
  };
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = EMBLEM_ROWS[y][x];
    if (ch !== '.' && PALC[ch]) P(g, x, y, PALC[ch]);
  }
  return g;
}
// lockups
function logoHorizontal(mono) {
  const g = makeGrid(512, 96);
  stamp(g, scaleGrid(emblemGrid(mono), 4), 4, 16);
  const wm = scaleGrid(wordmarkGrid(mono), 5); // 85*5=425 × 60
  stamp(g, wm, 80, 18);
  return g;
}
function logoStacked(mono) {
  const g = makeGrid(256, 220);
  stamp(g, scaleGrid(emblemGrid(mono), 6), 80, 12);
  const wm = scaleGrid(wordmarkGrid(mono), 3); // centered (name length varies)
  stamp(g, wm, Math.round((256 - wm.w) / 2), 132);
  if (!mono) {
    const dr = RAMP.drift;
    [[60, 190], [128, 198], [196, 188]].forEach((m, i) => {
      P(g, m[0], m[1], i === 1 ? dr[0] : dr[1]);
      P(g, m[0] + 1, m[1], dr[2]);
      P(g, m[0], m[1] + 1, dr[2]);
    });
  }
  return g;
}
Object.assign(globalThis, {
  makeMotes,
  makeEmbers,
  makeAsh,
  makeRingFrames,
  GLYPHS,
  scaleGrid,
  wordmarkGrid,
  emblemGrid,
  logoHorizontal,
  logoStacked
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/fxlogo.js", error: String((e && e.message) || e) }); }

// assets/_gen/gifenc.js
try { (() => {
// Naevyr — GIF89a animated encoder (eval inside run_script, after pixlib.js).
// Pixel-art is a tiny fixed palette, so GIF is lossless + small. Includes a
// matching LZW decoder used to round-trip-verify every frame before shipping.

function hexRGB(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// grids: array of equal-size grids (makeGrid). opts: {bg, scale, fps, loop}
// Returns a Uint8Array (image/gif).
function encodeGIF(grids, opts) {
  const bg = opts.bg || '#0a0810',
    scale = opts.scale || 1,
    fps = opts.fps || 8;
  const gw = grids[0].w,
    gh = grids[0].h,
    W = gw * scale,
    H = gh * scale;

  // --- palette (bg = index 0) ---
  const pal = new Map();
  pal.set(bg, 0);
  const palList = [bg];
  for (const g of grids) for (const cell of g.d) if (cell && !pal.has(cell.c)) {
    pal.set(cell.c, palList.length);
    palList.push(cell.c);
  }
  if (palList.length > 256) throw new Error('palette overflow: ' + palList.length);
  let bits = 2;
  while (1 << bits < palList.length) bits++; // 2..8
  const tableSize = 1 << bits,
    minCode = bits;

  // --- frames -> scaled index buffers ---
  const frames = grids.map(g => {
    const buf = new Uint8Array(W * H);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const cell = g.d[y * gw + x];
      const idx = cell ? pal.get(cell.c) : 0;
      if (idx === 0) continue; // bg already 0
      for (let sy = 0; sy < scale; sy++) {
        const yy = (y * scale + sy) * W + x * scale;
        for (let sx = 0; sx < scale; sx++) buf[yy + sx] = idx;
      }
    }
    return buf;
  });

  // --- LZW, "literal-run" scheme: emit a CLEAR before the decoder's dictionary
  // could ever fill, so the code size stays fixed at minCode+1 and there is no
  // size-bump asymmetry to desync. Larger output, but provably correct against
  // any standard GIF decoder. ---
  const maxRun = (1 << minCode) - 2; // literals between clears
  function lzwEncode(px) {
    const CLEAR = 1 << minCode,
      EOI = CLEAR + 1,
      size = minCode + 1;
    const out = [];
    let cur = 0,
      nb = 0;
    const put = c => {
      cur |= c << nb;
      nb += size;
      while (nb >= 8) {
        out.push(cur & 255);
        cur >>= 8;
        nb -= 8;
      }
    };
    put(CLEAR);
    let since = 0;
    for (let i = 0; i < px.length; i++) {
      if (since === maxRun) {
        put(CLEAR);
        since = 0;
      }
      put(px[i]);
      since++;
    }
    put(EOI);
    if (nb > 0) out.push(cur & 255);
    return out;
  }
  const b = [];
  const push = (...xs) => {
    for (const x of xs) b.push(x & 0xff);
  };
  const str = s => {
    for (let i = 0; i < s.length; i++) b.push(s.charCodeAt(i));
  };
  const u16 = v => {
    b.push(v & 0xff, v >> 8 & 0xff);
  };
  str('GIF89a');
  u16(W);
  u16(H);
  push(0x80 | bits - 1 << 4 | bits - 1);
  push(0);
  push(0); // packed, bg, aspect
  for (let i = 0; i < tableSize; i++) {
    const c = i < palList.length ? hexRGB(palList[i]) : [0, 0, 0];
    push(c[0], c[1], c[2]);
  }
  // loop forever
  push(0x21, 0xFF, 0x0B);
  str('NETSCAPE2.0');
  push(0x03, 0x01);
  u16(opts.loop == null ? 0 : opts.loop);
  push(0x00);
  const delay = Math.max(2, Math.round(100 / fps));
  for (const px of frames) {
    const data = lzwEncode(px);
    // GCE
    push(0x21, 0xF9, 0x04, 0x04);
    u16(delay);
    push(0x00, 0x00); // disposal=1, no transparency
    // image descriptor
    push(0x2C);
    u16(0);
    u16(0);
    u16(W);
    u16(H);
    push(0x00);
    push(minCode);
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      push(chunk.length);
      for (const x of chunk) b.push(x);
    }
    push(0x00);
  }
  push(0x3B);
  return new Uint8Array(b);
}

// scene helpers ----------------------------------------------------------
function fillBg(g, c) {
  for (let i = 0; i < g.d.length; i++) g.d[i] = {
    c
  };
}
// stamp a sprite so its (anchorX,anchorY) lands at scene (x,y); skips nulls
function place(scene, sprite, anchorX, anchorY, x, y, flip) {
  const s = flip ? mirrorX(sprite) : sprite;
  stamp(scene, s, x - anchorX, y - anchorY);
}
// soft iso ground shadow (dithered void ellipse)
function groundShadow(g, cx, cy, rx, ry) {
  for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
    const d = xx * xx / (rx * rx) + yy * yy / (ry * ry);
    if (d <= 1 && (xx + yy) % 2 === 0 && Math.random() < 0.9) {
      const x = cx + xx,
        y = cy + yy;
      if (x >= 0 && y >= 0 && x < g.w && y < g.h) P(g, x, y, d < 0.5 ? '#070510' : '#0a0810');
    }
  }
}
Object.assign(globalThis, {
  encodeGIF,
  fillBg,
  place,
  groundShadow,
  hexRGB
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/gifenc.js", error: String((e && e.message) || e) }); }

// assets/_gen/groundcover.js
try { (() => {
// Naevyr "FILL THE REALM" · GROUND COVER & BIOME DOODADS — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass/moteBurst from beasts.js).
//
// Small native-size doodads, BOTTOM-CENTER anchored, 2 variants each (engine picks per cell),
// grouped by biome so each region reads distinct. RAMP only, 1px #0a0810 void outline on
// billboards, dither not blur, moonlit-left / shadowed-right.
//   EXCEPTION — ground-flat decor (clover, lilypad, mud, rubble, charred_bone): sink into the
//   ground like floor tiles — soft dithered edges, NO billboard outline. (spec.flat = true)
//
// Registry entry: { fn(variant, frame), cell:[w,h], anchor:[x,y], biome, variants(=2),
//   frames(=1), flat?, anim?{name,fps} }.  Variants laid major, frames minor, left-to-right.

/* ----------------------------- shared doodad helpers ----------------------------- */
// a tapering plant stem from (x,baseY) up to height h, optional lean
function stem(g, x, baseY, h, ramp, lean) {
  lean = lean || 0;
  for (let k = 0; k < h; k++) {
    const t = k / h,
      sx = Math.round(x + lean * t);
    let c = ramp[1];
    if (k > h - 2) c = ramp[2];
    P(g, sx, baseY - k, c);
    if (k % 3 === 1) P(g, sx - 1, baseY - k, ramp[2]); // shade side
  }
}
// dithered leafy volume (moonlit-left), seed varies the speckle
function leafMass(g, cx, cy, rx, ry, ramp, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (dx + dy < -0.45) c = ramp[0]; // moonlit top-left
    else if (dx + dy > 0.45) c = ramp[2]; // shaded lower-right
    if (d > 0.74) c = ramp[2];
    if (hash2(x, y, seed) < 0.12) c = ramp[2]; // leaf dither
    if (hash2(x, y, seed + 7) < 0.05) c = ramp[3]; // deep gaps
    P(g, x, y, c);
  });
}
// a 4-petal bloom around (x,y) in petal ramp, center dot in core ramp
function bloom(g, x, y, petal, core) {
  P(g, x - 1, y, petal[1]);
  P(g, x + 1, y, petal[1]);
  P(g, x, y - 1, petal[0]);
  P(g, x, y + 1, petal[2]);
  P(g, x, y, core);
}
// soft dithered ground splotch (flat decor) — no outline; rim fades by dither
function groundSplotch(g, cx, cy, rx, ry, fn, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    if (d > 0.9 && (x + y) % 2 === 1) return; // 50% dithered rim
    if (d > 0.7 && hash2(x, y, seed) < 0.35) return;
    fn(x, y, d, dx, dy);
  });
}
// finish a billboard doodad (outline) unless flat
function fin(g, flat) {
  if (!flat) outline(g, RAMP.void);
  return g;
}

/* =============================== MEADOW / HEARTLAND =============================== */

function drawWildflower(v) {
  const g = makeGrid(14, 14),
    gr = RAMP.grass,
    dr = RAMP.drift,
    gd = RAMP.gold,
    baseY = 13;
  const stalks = v === 0 ? [[5, 9, 1], [9, 11, -1], [7, 7, 0]] : [[4, 8, 1], [8, 10, 0], [10, 8, -1], [6, 6, 1]];
  stalks.forEach(([x, h, ln], i) => {
    stem(g, x, baseY, h, gr, ln);
    const bx = Math.round(x + ln * (h / 14)),
      by = baseY - h;
    const petal = (i + v) % 2 === 0 ? dr : gd;
    bloom(g, bx, by, petal, i % 2 ? gd[0] : dr[0]);
  });
  // a couple low leaves
  P(g, 3, baseY - 1, gr[2]);
  P(g, 11, baseY - 1, gr[2]);
  return fin(g);
}
function drawDaisies(v) {
  const g = makeGrid(14, 10),
    gr = RAMP.grass,
    bn = RAMP.bone,
    gd = RAMP.gold,
    baseY = 9;
  const heads = v === 0 ? [[4, 4], [9, 5], [6, 2]] : [[3, 5], [7, 3], [10, 4], [5, 6]];
  heads.forEach(([x, y]) => {
    stem(g, x, baseY, baseY - y, gr, 0);
    // ring of bone petals + gold center
    [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], i) => P(g, x + dx, y + dy, i % 2 ? bn[1] : bn[0]));
    P(g, x, y, gd[1]);
  });
  return fin(g);
}
function drawClover(v) {
  // FLAT ground patch
  const g = makeGrid(12, 8),
    gr = RAMP.grass,
    seed = 210 + v;
  groundSplotch(g, 6, 4, 6, 3.5, (x, y, d) => {
    let c = gr[1];
    if (d < 0.3) c = gr[0];
    if (hash2(x, y, seed) < 0.3) c = gr[2];
    P(g, x, y, c);
  }, seed);
  // a few three-leaf clover dots
  const cl = v === 0 ? [[3, 3], [8, 4], [6, 5]] : [[4, 5], [9, 3], [5, 2], [8, 6]];
  cl.forEach(([x, y]) => {
    P(g, x, y, gr[0]);
    P(g, x - 1, y, gr[1]);
    P(g, x + 1, y, gr[1]);
    P(g, x, y - 1, gr[1]);
  });
  return fin(g, true);
}
function drawBush(v) {
  const g = makeGrid(20, 18),
    gr = RAMP.grass,
    baseY = 16;
  // rounded leafy shrub — a cluster of overlapping leaf masses
  const lobes = v === 0 ? [[10, 10, 8, 6], [6, 12, 5, 4], [14, 12, 5, 4]] : [[8, 9, 6, 5], [13, 11, 6, 5], [10, 13, 7, 4]];
  lobes.forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 220 + v * 3 + i));
  // a little trunk peeking at the base
  P(g, 10, baseY - 1, RAMP.dirt[2]);
  P(g, 10, baseY, RAMP.dirt[3]);
  return fin(g);
}
function drawFern(v) {
  const g = makeGrid(16, 16),
    gr = RAMP.grass,
    baseY = 15,
    cx = 8;
  const fronds = v === 0 ? [[-1.1, 12], [-0.5, 14], [0.1, 14], [0.7, 13], [1.2, 11]] : [[-1.3, 11], [-0.7, 13], [0, 15], [0.7, 13], [1.3, 11]];
  fronds.forEach(([slope, len], fi) => {
    for (let k = 0; k < len; k++) {
      const t = k / len;
      const x = Math.round(cx + slope * k * 0.7);
      const y = baseY - k;
      let c = gr[1];
      if (slope < 0) c = gr[0];
      if (k > len - 2) c = gr[2];
      P(g, x, y, c);
      // leaflets along the arc
      if (k > 1 && k % 2 === 0) {
        P(g, x - 1, y, gr[2]);
        P(g, x + 1, y, gr[1]);
      }
    }
  });
  return fin(g);
}
function drawTallgrass(v) {
  const g = makeGrid(16, 16),
    gr = RAMP.grass,
    baseY = 15;
  const blades = v === 0 ? [[3, 11, 1], [5, 14, 0], [7, 12, -1], [9, 15, 1], [11, 13, 0], [13, 10, -1]] : [[2, 10, 1], [4, 13, 0], [6, 15, -1], [8, 12, 1], [10, 14, 0], [12, 11, -1], [14, 9, 1]];
  blades.forEach(([x, h, curl]) => {
    for (let k = 0; k < h; k++) {
      const t = k / h,
        sx = Math.round(x + curl * t * 2.5);
      let c = gr[1];
      if (curl < 0) c = gr[2];
      if (k > h - 2) c = gr[0];
      P(g, sx, baseY - k, c);
    }
  });
  return fin(g);
}
function drawMeadowMushroom(v) {
  const g = makeGrid(12, 10),
    bn = RAMP.bone,
    bl = RAMP.blood,
    em = RAMP.ember,
    baseY = 9;
  const caps = v === 0 ? [[4, 4, 2, bl], [8, 5, 2, em]] : [[3, 5, 2, em], [6, 3, 3, bl], [9, 6, 2, bl]];
  caps.forEach(([x, y, r, cap]) => {
    // stalk
    for (let k = y + 1; k <= baseY; k++) {
      P(g, x, k, bn[1]);
      P(g, x, k, k > baseY - 1 ? bn[2] : bn[1]);
    }
    // domed cap
    ell(g, x, y, r, r * 0.8, (px, py, d, dx, dy) => {
      if (py > y) return;
      let c = cap[1];
      if (dy < -0.3) c = cap[0];
      if (d > 0.7) c = cap[2];
      P(g, px, py, c);
    });
    P(g, x - 1, y, bn[0]);
    P(g, x + 1, y - 1, cap[0]); // spots
  });
  return fin(g);
}

/* =============================== WOODLAND / GROVES =============================== */

function drawGroveTree(v) {
  // 2 silhouettes; walk-through decorative tree
  const g = makeGrid(32, 40),
    gr = RAMP.grass,
    dt = RAMP.dirt,
    baseY = 38,
    cx = 16;
  // trunk
  const trunkH = v === 0 ? 16 : 13;
  for (let y = baseY; y >= baseY - trunkH; y--) {
    const w = y > baseY - 3 ? 4 : 3;
    for (let i = -w; i <= w; i++) {
      let c = dt[1];
      if (i < -w + 1) c = dt[0];
      if (i > w - 1) c = dt[3];
      if (hash2(cx + i, y, 30) < 0.1) c = dt[2];
      P(g, cx + i, y, c);
    }
  }
  // a couple of root flares + low branch
  P(g, cx - 5, baseY, dt[2]);
  P(g, cx + 5, baseY, dt[3]);
  if (v === 0) {
    for (let k = 0; k < 5; k++) P(g, cx + 3 + k, baseY - 12 - k, dt[2]);
  }
  // canopy — variant 0 = broad round; variant 1 = taller, two-tier
  if (v === 0) {
    [[16, 13, 13, 10], [9, 16, 7, 6], [23, 16, 7, 6], [16, 8, 9, 7]].forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 31 + i));
  } else {
    [[16, 9, 10, 8], [11, 16, 7, 6], [21, 16, 7, 6], [16, 18, 9, 6]].forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 41 + i));
  }
  return fin(g);
}
function drawLog(v) {
  const g = makeGrid(24, 12),
    dt = RAMP.dirt,
    gr = RAMP.grass,
    bn = RAMP.bone,
    baseY = 10;
  // horizontal fallen log
  for (let y = baseY - 6; y <= baseY; y++) for (let x = 2; x <= 21; x++) {
    let c = dt[1];
    if (y < baseY - 4) c = dt[0];
    if (y > baseY - 2) c = dt[3];
    if (hash2(x, y, 50 + v) < 0.1) c = dt[2]; // bark grain
    P(g, x, y, c);
  }
  // sawn end-rings at one end
  ell(g, v === 0 ? 3 : 21, baseY - 3, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));
  // mossy top
  for (let x = 4; x <= 19; x++) if (hash2(x, 0, 51 + v) < 0.5) P(g, x, baseY - 6, gr[2]);
  for (let x = 4; x <= 19; x++) if (hash2(x, 1, 52 + v) < 0.25) P(g, x, baseY - 5, gr[1]);
  return fin(g);
}
function drawStump(v) {
  const g = makeGrid(16, 14),
    dt = RAMP.dirt,
    bn = RAMP.bone,
    gr = RAMP.grass,
    baseY = 13,
    cx = 8;
  const top = baseY - (v === 0 ? 8 : 6);
  for (let y = top; y <= baseY; y++) {
    const w = 5;
    for (let x = cx - w; x <= cx + w; x++) {
      let c = dt[1];
      if (x < cx - w + 2) c = dt[0];
      if (x > cx + w - 2) c = dt[3];
      if (x % 3 === 0 && hash2(x, y, 60) < 0.6) c = dt[3];
      P(g, x, y, c);
    }
  }
  // end-grain rings
  ell(g, cx, top, 5, 2, (x, y, d) => {
    let c = dt[2];
    if (d < 0.3) c = bn[3];
    if (d > 0.7) c = dt[1];
    P(g, x, y, c);
  });
  ell(g, cx, top, 3, 1.2, (x, y, d) => {
    if (d > 0.6) P(g, x, y, dt[3]);
  });
  if (v === 1) {
    P(g, cx + 2, top, gr[2]);
    P(g, cx - 3, baseY - 1, gr[2]);
  } // moss
  return fin(g);
}
function drawSapling(v) {
  const g = makeGrid(14, 20),
    gr = RAMP.grass,
    dt = RAMP.dirt,
    baseY = 19,
    cx = 7;
  const h = v === 0 ? 13 : 15;
  stem(g, cx, baseY, h, dt, v === 0 ? 1 : -1);
  // a few small leaf tufts up the thin stem
  const ty = baseY - h;
  const tufts = v === 0 ? [[cx + 1, ty, 4, 3], [cx - 2, ty + 4, 3, 2], [cx + 3, ty + 6, 3, 2]] : [[cx - 1, ty, 4, 3], [cx + 2, ty + 4, 3, 2], [cx - 3, ty + 7, 3, 2]];
  tufts.forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 70 + v + i));
  return fin(g);
}
function drawToadstool(v) {
  const g = makeGrid(12, 12),
    bn = RAMP.bone,
    bl = RAMP.blood,
    dr = RAMP.drift,
    baseY = 11;
  const cx = v === 0 ? 6 : 5,
    capColor = v === 0 ? bl : dr;
  // fat stalk
  for (let y = 4; y <= baseY; y++) {
    const w = y > baseY - 2 ? 2 : 1;
    for (let i = -w; i <= w; i++) P(g, cx + i, y, i < 0 ? bn[0] : bn[1]);
  }
  // broad domed cap
  ell(g, cx, 4, 5, 3.5, (x, y, d, dx, dy) => {
    if (y > 5) return;
    let c = capColor[1];
    if (dy < -0.3) c = capColor[0];
    if (d > 0.7) c = capColor[2];
    P(g, x, y, c);
  });
  // pale spots
  [[cx - 2, 3], [cx + 2, 3], [cx, 2], [cx + 1, 5]].forEach(([x, y]) => P(g, x, y, bn[0]));
  if (v === 1) {
    P(g, cx, 1, dr[0]);
  } // drift glow tip
  // a small companion
  if (v === 0) {
    for (let y = 8; y <= baseY; y++) P(g, 10, y, bn[1]);
    ell(g, 10, 8, 2, 1.5, (x, y, d) => {
      if (y > 8) return;
      P(g, x, y, d > 0.6 ? bl[2] : bl[1]);
    });
  }
  return fin(g);
}

/* =============================== HIGHLAND (Ashen Flats stone) =============================== */

function drawBoulder(v) {
  const g = makeGrid(22, 16),
    st = RAMP.stone,
    gr = RAMP.grass,
    baseY = 14,
    cx = 11;
  shadeMass(g, cx, baseY - 5, v === 0 ? 9 : 8, v === 0 ? 6 : 7, st, 80 + v);
  if (v === 1) shadeMass(g, 16, baseY - 3, 4, 3, st, 82); // a second smaller rock
  // moss cap on the lit shoulder
  for (let x = cx - 6; x <= cx; x++) if (hash2(x, 0, 81 + v) < 0.45) P(g, x, baseY - 10 + Math.round(hash2(x, 1, 81) * 2), gr[2]);
  for (let x = cx - 5; x <= cx - 1; x++) if (hash2(x, 2, 81 + v) < 0.3) P(g, x, baseY - 9, gr[1]);
  return fin(g);
}
function drawRubble(v) {
  // FLAT-ish scattered rock
  const g = makeGrid(16, 10),
    st = RAMP.stone,
    seed = 90 + v;
  const rocks = v === 0 ? [[4, 7, 3], [10, 8, 2], [7, 5, 2], [13, 6, 2]] : [[3, 6, 2], [6, 8, 3], [11, 7, 2], [9, 5, 2], [13, 8, 2]];
  rocks.forEach(([x, y, r], i) => {
    ell(g, x, y, r, r * 0.7, (px, py, d, dx, dy) => {
      let c = st[1];
      if (dx + dy < -0.3) c = st[0];
      if (d > 0.7) c = st[2];
      if (py > y) c = st[3];
      P(g, px, py, c);
    });
  });
  // a little gravel dither between
  for (let i = 0; i < 6; i++) {
    const x = 2 + Math.floor(hash2(i, 1, seed) * 12),
      y = 4 + Math.floor(hash2(i, 2, seed) * 5);
    P(g, x, y, st[2]);
  }
  return fin(g, true);
}

/* =============================== MARSH (Hollowmere) =============================== */

function drawCattail(v) {
  const g = makeGrid(14, 20),
    gr = RAMP.grass,
    dt = RAMP.dirt,
    baseY = 19;
  const reeds = v === 0 ? [[4, 16, 1], [7, 18, 0], [10, 15, -1]] : [[3, 14, 1], [6, 17, 0], [9, 18, -1], [11, 13, 1]];
  reeds.forEach(([x, h, ln], i) => {
    for (let k = 0; k < h; k++) {
      const sx = Math.round(x + ln * (k / h));
      P(g, sx, baseY - k, k > h - 2 ? gr[0] : gr[1]);
      if (k % 4 === 2) P(g, sx - 1, baseY - k, gr[2]);
    }
    // brown bulrush head on some reeds
    if (i % 2 === 0) {
      const hx = Math.round(x + ln),
        hy = baseY - h;
      for (let k = 0; k < 5; k++) for (let i2 = -1; i2 <= 1; i2++) {
        let c = dt[2];
        if (i2 < 0) c = dt[1];
        if (i2 > 0) c = dt[3];
        P(g, hx + i2, hy + k, c);
      }
      P(g, hx, hy - 1, dt[2]);
    }
  });
  return fin(g);
}
function drawLilypad(v, f) {
  // FLAT on water, 2f gentle bob
  const g = makeGrid(16, 8),
    gr = RAMP.grass,
    dr = RAMP.drift,
    wt = RAMP.water,
    seed = 100 + v;
  const bob = (f || 0) === 1 ? 1 : 0;
  const cx = 8,
    cy = 4 + bob;
  // round pad with the classic notch
  groundSplotch(g, cx, cy, v === 0 ? 7 : 6, 3.2, (x, y, d, dx, dy) => {
    if (dx > 0.3 && Math.abs(dy) < 0.25) return; // V notch on the right
    let c = gr[1];
    if (dx + dy < -0.3) c = gr[0];
    if (d > 0.6) c = gr[2];
    if (hash2(x, y, seed) < 0.12) c = gr[2];
    P(g, x, y, c);
  }, seed);
  // ripple ring + a drift bloom on one pad
  P(g, cx - 7, cy + 1, wt[0]);
  P(g, cx + 6, cy + 2, wt[0]);
  if (v === 0) {
    P(g, cx - 1, cy - 1, dr[0]);
    P(g, cx, cy - 2, dr[1]);
    P(g, cx + 1, cy - 1, dr[1]);
    P(g, cx, cy - 1, dr[0]);
  }
  return fin(g, true);
}
function drawMud(v) {
  // FLAT wet-dirt splotch
  const g = makeGrid(16, 8),
    dt = RAMP.dirt,
    wt = RAMP.water,
    seed = 110 + v;
  groundSplotch(g, 8, 4, v === 0 ? 7 : 6.5, 3.4, (x, y, d, dx, dy) => {
    let c = dt[2];
    if (d < 0.3) c = dt[3];
    if (hash2(x, y, seed) < 0.2) c = dt[1];
    P(g, x, y, c);
  }, seed);
  // wet sheen puddles
  const pud = v === 0 ? [[6, 4], [10, 5]] : [[5, 3], [9, 5], [11, 4]];
  pud.forEach(([x, y]) => {
    P(g, x, y, wt[1]);
    P(g, x + 1, y, wt[0]);
    P(g, x, y + 1, wt[2]);
  });
  return fin(g, true);
}

/* =============================== ASH / WAR (Ashen Flats) =============================== */

function drawAshTuft(v) {
  const g = makeGrid(14, 10),
    em = RAMP.ember,
    baseY = 9;
  const ashgrey = ['#6f6781', '#564f6b', '#3a3450', '#211c30']; // grey from bone[3]/stone tones
  const blades = v === 0 ? [[3, 6, 1], [6, 8, 0], [9, 6, -1], [11, 5, 1]] : [[2, 5, 1], [5, 7, 0], [8, 8, -1], [11, 6, 1]];
  blades.forEach(([x, h, ln]) => {
    for (let k = 0; k < h; k++) {
      const sx = Math.round(x + ln * (k / h));
      let c = ashgrey[1];
      if (ln < 0) c = ashgrey[2];
      if (k > h - 2) c = ashgrey[0];
      P(g, sx, baseY - k, c);
    }
  });
  // ember flecks smouldering at the base
  P(g, 5, baseY, em[1]);
  P(g, 9, baseY - 1, em[2]);
  if (v === 1) P(g, 7, baseY, em[0]);
  return fin(g);
}
function drawCharredBone(v) {
  // FLAT burnt bone shards
  const g = makeGrid(16, 10),
    bn = RAMP.bone,
    em = RAMP.ember,
    seed = 120 + v;
  // scorched ground hint
  groundSplotch(g, 8, 7, 7, 2.5, (x, y, d) => P(g, x, y, RAMP.ash), seed);
  const shards = v === 0 ? [[3, 6, 5, 0.2], [9, 7, 4, -0.3], [6, 5, 3, 0.5]] : [[2, 7, 4, 0.1], [7, 6, 5, -0.2], [11, 7, 4, 0.3], [5, 5, 3, -0.4]];
  shards.forEach(([x, y, len, sl]) => {
    for (let k = 0; k < len; k++) {
      const px = x + k,
        py = y + Math.round(k * sl);
      let c = bn[2];
      if (k < 1) c = RAMP.void;
      if (k > len - 2) c = bn[3];
      P(g, px, py, c);
      P(g, px, py - 1, bn[1]);
    }
  });
  // a couple ember glints among the char
  P(g, 5, 8, em[2]);
  if (v === 0) P(g, 11, 8, em[1]);
  return fin(g, true);
}
function drawWarDebris(v) {
  const g = makeGrid(20, 12),
    st = RAMP.stone,
    dt = RAMP.dirt,
    bl = RAMP.blood,
    baseY = 11;
  // a broken round shield leaning
  const sx = v === 0 ? 7 : 12;
  ell(g, sx, baseY - 4, 5, 5, (x, y, d, dx, dy) => {
    let c = dt[1];
    if (d < 0.25) c = dt[3];
    if (dx + dy < -0.3) c = dt[0];
    if (d > 0.78) c = dt[3];
    P(g, x, y, c);
  });
  ell(g, sx, baseY - 4, 1.6, 1.6, (x, y) => P(g, x, y, st[1])); // boss
  for (let k = -4; k <= 4; k++) if (k % 3 === 0) P(g, sx + k, baseY - 4, RAMP.void); // splits
  P(g, sx - 2, baseY - 7, bl[2]);
  P(g, sx + 1, baseY - 6, bl[2]); // blood stains
  // a snapped spear lying across
  const ex = v === 0 ? 13 : 4;
  for (let k = 0; k < 9; k++) P(g, ex + Math.round(k * (v === 0 ? 0.6 : -0.6)), baseY - 1 - Math.round(k * 0.3), dt[3]);
  const tipx = ex + Math.round(8 * (v === 0 ? 0.6 : -0.6)),
    tipy = baseY - 1 - Math.round(8 * 0.3);
  P(g, tipx, tipy, st[0]);
  P(g, tipx + (v === 0 ? 1 : -1), tipy - 1, st[1]);
  return fin(g);
}

/* =============================== BONEFIELDS (death) =============================== */

function drawSkull(v) {
  const g = makeGrid(12, 10),
    bn = RAMP.bone,
    dt = RAMP.dirt,
    baseY = 9,
    cx = 6;
  // half-buried — dirt mound at the base
  groundSplotch(g, cx, baseY, 6, 2, (x, y, d) => P(g, x, y, dt[3]), 130 + v);
  // cranium
  ell(g, cx, baseY - 4, 4, 3.6, (x, y, d, dx, dy) => {
    if (y > baseY - 1) return;
    let c = bn[2];
    if (dy < -0.2) c = bn[1];
    if (dx < -0.2) c = bn[0];
    if (d > 0.78) c = bn[3];
    P(g, x, y, c);
  });
  // eye sockets + nasal
  P(g, cx - 2, baseY - 4, RAMP.void);
  P(g, cx + 1, baseY - 4, RAMP.void);
  P(g, cx - 1, baseY - 2, RAMP.void);
  // teeth row
  for (let x = cx - 2; x <= cx + 1; x++) P(g, x, baseY - 1, bn[3]);
  if (v === 1) {
    ell(g, cx + 4, baseY - 1, 2, 1.5, (x, y) => P(g, x, y, bn[3]));
  } // a stray jawbone
  return fin(g);
}
function drawGraveNub(v) {
  const g = makeGrid(14, 16),
    st = RAMP.stone,
    dt = RAMP.dirt,
    gr = RAMP.grass,
    baseY = 15,
    cx = 7;
  if (v === 0) {
    // leaning headstone
    const lean = 1;
    for (let y = baseY - 1; y >= 3; y--) {
      const t = (baseY - y) / 12;
      const w = 3;
      const off = Math.round(t * lean * 2);
      for (let i = -w; i <= w; i++) {
        let c = st[1];
        if (i < -w + 1) c = st[0];
        if (i > w - 1) c = st[3];
        if (hash2(cx + i, y, 140) < 0.08) c = st[2];
        P(g, cx + i + off, y, c);
      }
    }
    // rounded top + a carved line
    ell(g, cx + 2, 3, 3, 2, (x, y, d) => {
      if (y > 3) return;
      P(g, x, y, d > 0.6 ? st[3] : st[1]);
    });
    P(g, cx + 1, 7, st[3]);
    P(g, cx + 3, 7, st[3]);
  } else {
    // a small stacked cairn
    [[cx, baseY - 2, 4, 2.5], [cx - 1, baseY - 5, 3, 2], [cx + 1, baseY - 8, 2.5, 2], [cx, baseY - 10, 1.8, 1.5]].forEach(([x, y, rx, ry], i) => shadeMass(g, x, y, rx, ry, st, 141 + i));
  }
  // grass tufts at the base
  P(g, cx - 4, baseY, gr[1]);
  P(g, cx + 4, baseY, gr[2]);
  return fin(g);
}
function drawDeadShrub(v) {
  const g = makeGrid(16, 14),
    dt = RAMP.dirt,
    baseY = 13,
    cx = 8;
  // bare thorny branches radiating from a low base
  const branches = v === 0 ? [[-1.0, 10], [-0.4, 12], [0.2, 11], [0.8, 10], [1.3, 8]] : [[-1.3, 9], [-0.6, 11], [0, 12], [0.5, 11], [1.1, 9], [-0.2, 7]];
  branches.forEach(([slope, len], bi) => {
    let x = cx,
      y = baseY;
    for (let k = 0; k < len; k++) {
      x = Math.round(cx + slope * k * 0.8);
      y = baseY - k;
      let c = dt[2];
      if (slope < 0) c = dt[1];
      if (k > len - 2) c = dt[3];
      P(g, x, y, c);
      // thorns / twig forks
      if (k > 2 && k % 3 === 0) {
        P(g, x + (slope < 0 ? -1 : 1), y - 1, dt[3]);
      }
    }
  });
  // gnarled trunk base
  P(g, cx, baseY, dt[3]);
  P(g, cx - 1, baseY, dt[2]);
  P(g, cx + 1, baseY, dt[2]);
  return fin(g);
}

/* ============================ REGISTRY ============================ */
const GROUNDCOVER = {
  // meadow / heartland
  wildflower: {
    fn: v => drawWildflower(v),
    cell: [14, 14],
    anchor: [7, 13],
    biome: 'meadow'
  },
  daisies: {
    fn: v => drawDaisies(v),
    cell: [14, 10],
    anchor: [7, 9],
    biome: 'meadow'
  },
  clover: {
    fn: v => drawClover(v),
    cell: [12, 8],
    anchor: [6, 7],
    biome: 'meadow',
    flat: true
  },
  bush: {
    fn: v => drawBush(v),
    cell: [20, 18],
    anchor: [10, 16],
    biome: 'meadow'
  },
  fern: {
    fn: v => drawFern(v),
    cell: [16, 16],
    anchor: [8, 15],
    biome: 'meadow'
  },
  tallgrass: {
    fn: v => drawTallgrass(v),
    cell: [16, 16],
    anchor: [8, 15],
    biome: 'meadow'
  },
  meadow_mushroom: {
    fn: v => drawMeadowMushroom(v),
    cell: [12, 10],
    anchor: [6, 9],
    biome: 'meadow'
  },
  // woodland / groves
  grove_tree: {
    fn: v => drawGroveTree(v),
    cell: [32, 40],
    anchor: [16, 38],
    biome: 'woodland',
    footprint: '1x1 walk-through'
  },
  log: {
    fn: v => drawLog(v),
    cell: [24, 12],
    anchor: [12, 10],
    biome: 'woodland'
  },
  stump: {
    fn: v => drawStump(v),
    cell: [16, 14],
    anchor: [8, 13],
    biome: 'woodland'
  },
  sapling: {
    fn: v => drawSapling(v),
    cell: [14, 20],
    anchor: [7, 19],
    biome: 'woodland'
  },
  toadstool: {
    fn: v => drawToadstool(v),
    cell: [12, 12],
    anchor: [6, 11],
    biome: 'woodland'
  },
  // highland (Ashen Flats stone)
  boulder: {
    fn: v => drawBoulder(v),
    cell: [22, 16],
    anchor: [11, 14],
    biome: 'highland'
  },
  rubble: {
    fn: v => drawRubble(v),
    cell: [16, 10],
    anchor: [8, 8],
    biome: 'highland',
    flat: true
  },
  // marsh (Hollowmere)
  cattail: {
    fn: v => drawCattail(v),
    cell: [14, 20],
    anchor: [7, 19],
    biome: 'marsh'
  },
  lilypad: {
    fn: (v, f) => drawLilypad(v, f),
    cell: [16, 8],
    anchor: [8, 6],
    biome: 'marsh',
    flat: true,
    frames: 2,
    anim: {
      name: 'bob',
      fps: 2,
      loop: true
    }
  },
  mud: {
    fn: v => drawMud(v),
    cell: [16, 8],
    anchor: [8, 6],
    biome: 'marsh',
    flat: true
  },
  // ash / war (Ashen Flats)
  ash_tuft: {
    fn: v => drawAshTuft(v),
    cell: [14, 10],
    anchor: [7, 9],
    biome: 'ash'
  },
  charred_bone: {
    fn: v => drawCharredBone(v),
    cell: [16, 10],
    anchor: [8, 8],
    biome: 'ash',
    flat: true
  },
  war_debris: {
    fn: v => drawWarDebris(v),
    cell: [20, 12],
    anchor: [10, 11],
    biome: 'ash'
  },
  // bonefields (death)
  skull: {
    fn: v => drawSkull(v),
    cell: [12, 10],
    anchor: [6, 9],
    biome: 'bonefields'
  },
  grave_nub: {
    fn: v => drawGraveNub(v),
    cell: [14, 16],
    anchor: [7, 15],
    biome: 'bonefields'
  },
  dead_shrub: {
    fn: v => drawDeadShrub(v),
    cell: [16, 14],
    anchor: [8, 13],
    biome: 'bonefields'
  }
};
Object.assign(globalThis, {
  stem,
  leafMass,
  bloom,
  groundSplotch,
  fin,
  drawWildflower,
  drawDaisies,
  drawClover,
  drawBush,
  drawFern,
  drawTallgrass,
  drawMeadowMushroom,
  drawGroveTree,
  drawLog,
  drawStump,
  drawSapling,
  drawToadstool,
  drawBoulder,
  drawRubble,
  drawCattail,
  drawLilypad,
  drawMud,
  drawAshTuft,
  drawCharredBone,
  drawWarDebris,
  drawSkull,
  drawGraveNub,
  drawDeadShrub,
  GROUNDCOVER
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/groundcover.js", error: String((e && e.message) || e) }); }

// assets/_gen/guildbanner.js
try { (() => {
// NAEVYR — GUILD BANNER (engine sprite). Eval after pixlib.js + tiles.js.
// Standing war-banner, 48×96, bottom-center anchor (24,95). Dark wood pole,
// bone-ramp cloth with a BLANK plate area (engine overlays the guild tag as
// text), drift-violet trim. 3 frames cloth sway (~3fps) + a 1-frame fallen
// tattered variant. Rect-grid, RAMP only, 1px void outline, dither not blur.

const GB_W = 48,
  GB_H = 96,
  GB_ANCHOR = [24, 95];

// plate area the engine writes text into (returned in JSON): x,y,w,h in cell px
const GB_PLATE = {
  x: 14,
  y: 30,
  w: 22,
  h: 26
};
function drawGuildBanner(frame) {
  const g = makeGrid(GB_W, GB_H);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    dr = RAMP.drift,
    gd = RAMP.gold;
  const poleX = 14,
    topY = 8,
    baseY = GB_H - 2;

  // --- ground shadow ---
  for (let x = poleX - 7; x <= poleX + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY, RAMP.void);

  // --- wooden pole ---
  for (let y = topY; y <= baseY - 1; y++) for (let x = poleX - 1; x <= poleX + 1; x++) {
    let c = dt[1];
    if (x === poleX - 1) c = dt[0];
    if (x === poleX + 1) c = dt[3];
    if (hash2(x, y, 3) < 0.08) c = dt[2];
    P(g, x, y, c);
  }
  // pole finial: drift-violet crystal cap
  P(g, poleX, topY - 3, dr[0]);
  P(g, poleX, topY - 2, dr[1]);
  P(g, poleX - 1, topY - 1, dr[2]);
  P(g, poleX + 1, topY - 1, dr[2]);
  P(g, poleX, topY - 1, dr[1]);
  // crossbar
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY, dt[3]);
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY + 1, dt[2]);
  P(g, poleX + 20, topY - 1, dr[2]); // crossbar tip glint

  // --- cloth banner: hangs from crossbar, sways by frame ---
  const clothX0 = poleX + 2,
    clothW = 22,
    clothTop = topY + 2,
    clothBot = 70;
  const sway = [0, 1, 0][frame] || 0;
  const phase = frame;
  for (let y = clothTop; y <= clothBot; y++) {
    const t = (y - clothTop) / (clothBot - clothTop);
    // horizontal wave offset grows toward the free (right) edge & toward the bottom
    const wave = Math.round(Math.sin(t * 3.2 + phase * 1.3) * (1.4 * t) + sway * t);
    for (let x = clothX0; x <= clothX0 + clothW; x++) {
      const u = (x - clothX0) / clothW; // 0 at pole .. 1 free edge
      const xoff = Math.round(wave * u);
      let c = bn[1];
      if (u < 0.12) c = bn[3]; // shadow fold at the pole
      else if (u > 0.86) c = bn[2]; // far edge shade
      // soft vertical fold shading
      const fold = Math.sin(u * 9 + phase);
      if (fold > 0.7) c = bn[0];else if (fold < -0.7) c = bn[2];
      // drift-violet trim border (top, bottom, free edge)
      if (y <= clothTop + 1 || u > 0.93) c = dr[2];
      P(g, x + xoff, y, c);
    }
    // swallowtail notch at the bottom
    if (y > clothBot - 8) {
      const cut = 8 - (clothBot - y);
      for (let x = clothX0 + clothW / 2 - cut; x <= clothX0 + clothW / 2 + cut; x++) {
        const u = (x - clothX0) / clothW;
        const xoff = Math.round(wave * u);
        if (Math.abs(x - (clothX0 + clothW / 2)) < cut) g.d[y * g.w + (x + xoff)] = null;
      }
    }
  }
  // --- blank plate area (engine writes the tag here): subtle recessed bone panel + trim ---
  const swayP = Math.round(sway * 0.4);
  for (let y = GB_PLATE.y; y < GB_PLATE.y + GB_PLATE.h; y++) for (let x = GB_PLATE.x; x < GB_PLATE.x + GB_PLATE.w; x++) {
    const edge = y === GB_PLATE.y || y === GB_PLATE.y + GB_PLATE.h - 1 || x === GB_PLATE.x || x === GB_PLATE.x + GB_PLATE.w - 1;
    P(g, x + swayP, y, edge ? dr[3] : bn[1]);
  }
  // emblem hint corners (so the blank plate still reads as heraldry)
  P(g, GB_PLATE.x + swayP, GB_PLATE.y, gd[2]);
  P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y, gd[2]);
  P(g, GB_PLATE.x + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]);
  P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]);
  outline(g, RAMP.void);
  return g;
}
function drawGuildBannerFallen() {
  const g = makeGrid(GB_W, GB_H);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    dr = RAMP.drift;
  // leaning pole (diagonal), base bottom-center, top toward upper-right
  const baseX = 18,
    baseY = GB_H - 2;
  for (let k = 0; k < 60; k++) {
    const x = baseX + Math.round(k * 0.42),
      y = baseY - k;
    if (y < 18) break;
    for (let o = -1; o <= 1; o++) {
      let c = dt[1];
      if (o === -1) c = dt[0];
      if (o === 1) c = dt[3];
      if (hash2(x + o, y, 4) < 0.1) c = dt[2];
      P(g, x + o, y, c);
    }
  }
  const topX = baseX + Math.round(59 * 0.42),
    topY = baseY - 59;
  // broken crossbar
  for (let x = topX - 1; x <= topX + 12; x++) P(g, x, topY, dt[3]);
  // tattered cloth draping down-right, corruption-eaten edges
  const cx0 = topX + 1,
    cw = 20,
    ct = topY + 1,
    cb = topY + 40;
  for (let y = ct; y <= cb; y++) {
    const t = (y - ct) / (cb - ct);
    const lean = Math.round(t * 6);
    for (let x = cx0; x <= cx0 + cw; x++) {
      const u = (x - cx0) / cw;
      // ragged right/bottom edge: corruption eats away
      const eat = hash2(x, y, 7);
      const ragged = u > 0.6 + 0.35 * Math.sin(y * 0.7) || t > 0.7 && eat < 0.5;
      if (ragged) {
        if (eat < 0.35 && u > 0.5) P(g, x + lean, y, eat < 0.15 ? dr[1] : dr[3]);
        continue;
      }
      let c = bn[2];
      if (u < 0.14) c = bn[3];
      const fold = Math.sin(u * 8);
      if (fold > 0.6) c = bn[1];else if (fold < -0.6) c = bn[3];
      // corruption bleeding inward from the eaten edge
      if (u > 0.5 && eat < 0.2) c = dr[3];
      if (y <= ct + 1) c = dr[3];
      P(g, x + lean, y, c);
    }
  }
  // a few drift motes rising off the rot
  for (let i = 0; i < 6; i++) {
    const x = cx0 + 4 + i * 3 % cw,
      y = cb - 4 - i % 4 * 5;
    P(g, x, y, i % 2 ? dr[1] : dr[2]);
  }
  // fallen finial crystal on the ground
  P(g, baseX - 4, baseY - 1, dr[1]);
  P(g, baseX - 5, baseY, dr[3]);
  outline(g, RAMP.void);
  return g;
}
const GUILD = {
  guild_banner: {
    fn: drawGuildBanner,
    frames: 3,
    fps: 3,
    ramp: 'bone + dirt + drift',
    anchor: GB_ANCHOR,
    plate: GB_PLATE
  },
  guild_banner_fallen: {
    fn: drawGuildBannerFallen,
    frames: 1,
    fps: 0,
    ramp: 'bone + dirt + drift',
    anchor: GB_ANCHOR
  }
};
Object.assign(globalThis, {
  GB_W,
  GB_H,
  GB_ANCHOR,
  GB_PLATE,
  drawGuildBanner,
  drawGuildBannerFallen,
  GUILD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/guildbanner.js", error: String((e && e.message) || e) }); }

// assets/_gen/interiors.js
try { (() => {
// Naevyr INTERIOR SET + THE MINE — eval after pixlib.js + tiles.js.
// Rect-grid, RAMP only, 1px void auto-outline, dither not blur, deterministic.
// Moonlit-left / shadowed-right. Floors 64×36 (tiles.js format). Walls 64×56.
// Fixtures bottom-center anchored; top 6px of every fixture/building cell kept
// clear for engine labels.

/* ============================ FLOOR TILES (64×36) ============================ */
function makeFloorTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = type === 'wood' ? RAMP.dirt : RAMP.stone;
  const face = ramp[1],
    hi = ramp[0],
    sh = ramp[2],
    dp = ramp[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
    P(g, x, y, RAMP.void);
    break;
  }
  if (type === 'wood') {
    // plank seams run NW→SE (parallel to top-left edge): constant (x+2y)
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      if ((x + 2 * y) % 10 === 0) P(g, x, y, dp); // board seam
      else if ((x + 2 * y) % 10 === 1) P(g, x, y, hi); // plank highlight edge
      if (hash2(x, y, seedN) < 0.015) {
        P(g, x, y, dp);
        P(g, x + 1, y, sh);
      } // knot
      else if (hash2(x, y, seedN + 5) < 0.03) P(g, x, y, sh); // grain
    }
    // board END caps (cross seams) every few rows
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) if ((x - 2 * y + 64) % 26 === seedN * 7 % 26) P(g, x, y, dp);
  } else if (type === 'stone') {
    // flagstone courses (blocky), hairline cracks
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const bx = Math.floor((x + 2 * y) / 12),
        by = Math.floor((x - 2 * y + 128) / 12);
      if ((x + 2 * y) % 12 === 0 || (x - 2 * y + 128) % 12 === 0) P(g, x, y, dp); // joints
      else if (hash2(bx, by, seedN) < 0.18 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
      if (hash2(x, y, seedN + 7) < 0.012) P(g, x, y, dp); // hairline crack
    }
  } else {
    // cave
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const h = hash2(x, y, seedN);
      if (h < 0.08) P(g, x, y, sh);else if (h < 0.11) P(g, x, y, dp);else if (h < 0.135) P(g, x, y, hi);
      if (hash2(x, y, seedN + 9) < 0.012) {
        P(g, x, y, RAMP.gold[1]);
        if (hash2(x, y, seedN + 10) < 0.4) P(g, x + 1, y, RAMP.gold[2]);
      } // gold fleck
      if (hash2(x, y, seedN + 11) < 0.02) P(g, x, y, dp); // rubble speck
    }
  }
  return g;
}

/* ============================ WALL SEGMENTS (64×56) ==========================
   Flat camera-facing face + a sheared iso top cap that implies the wall's
   recede direction. NW = back-left (moonlit), NE = back-right (shadowed). */
function wallSegment(side, mat, variant, opt) {
  opt = opt || {};
  const g = makeGrid(64, 56);
  const lit = side === 'nw';
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  // base/face brightness shift by side
  const cBase = lit ? ramp[1] : ramp[2];
  const cHi = lit ? ramp[0] : ramp[1];
  const cSh = lit ? ramp[2] : ramp[3];
  const faceTop = 14,
    faceBot = 53;

  // ---- top cap (iso thickness), sheared toward the far corner ----
  for (let x = 0; x < 64; x++) {
    // NW recedes up-right → cap rises to the right; NE mirror
    const sx = lit ? x : 63 - x;
    const capLift = Math.floor(sx / 8); // 0..7 px
    for (let k = 0; k < 6; k++) P(g, x, faceTop - 1 - k - capLift, k < 2 ? RAMP.stone[lit ? 1 : 2] : mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]);
    // void cap edge
    P(g, x, faceTop - 6 - capLift, RAMP.void);
  }

  // ---- face ----
  for (let y = faceTop; y <= faceBot; y++) for (let x = 0; x < 64; x++) {
    let c = cBase;
    if (x < 3) c = lit ? cHi : ramp[1]; // left edge lightest
    else if (x > 60) c = cSh;
    // material texture
    if (mat === 'timber') {
      if ((y - faceTop) % 4 === 0) c = cSh; // plank seams
      if (hash2(x, y, 71) < 0.04) c = cSh;
    } else if (mat === 'block') {
      const course = Math.floor((y - faceTop) / 6);
      if ((y - faceTop) % 6 === 0) c = cSh; // course line
      if ((x + course % 2 * 6) % 12 === 0) c = cSh; // vertical joints (staggered)
      if (hash2(x, y, 72) < 0.03) c = lit ? ramp[1] : ramp[3];
    } else {
      // cave — raw rock
      const h = hash2(x, y, 73);
      if (h < 0.10) c = cSh;else if (h < 0.14) c = cHi;
      if (hash2(x, y, 74) < 0.02) c = ramp[3];
    }
    P(g, x, y, c);
  }
  // baseboard
  for (let x = 0; x < 64; x++) {
    P(g, x, faceBot, ramp[3]);
    P(g, x, faceBot - 1, cSh);
  }

  // ---- variants ----
  if (variant === 'window') {
    const wx = 24,
      wy = 24,
      ww = 16,
      wh = 14;
    for (let j = 0; j < wh; j++) for (let i = 0; i < ww; i++) {
      let c = RAMP.ember[1];
      if (i === 0 || j === 0 || i === ww - 1 || j === wh - 1) c = RAMP.ember[0];
      if ((i + j) % 2 === 0 && hash2(i, j, 75) < 0.25) c = RAMP.ember[0];
      P(g, wx + i, wy + j, c);
    }
    // bone frame + mullions
    for (let i = -1; i <= ww; i++) {
      P(g, wx + i, wy - 1, RAMP.bone[2]);
      P(g, wx + i, wy + wh, RAMP.bone[3]);
    }
    for (let j = -1; j <= wh; j++) {
      P(g, wx - 1, wy + j, RAMP.bone[2]);
      P(g, wx + ww, wy + j, RAMP.bone[3]);
    }
    for (let j = 0; j < wh; j++) P(g, wx + (ww >> 1), wy + j, RAMP.bone[3]);
    for (let i = 0; i < ww; i++) P(g, wx + i, wy + (wh >> 1), RAMP.bone[3]);
    // warm spill
    for (let i = -2; i < ww + 2; i++) P(g, wx + i, wy + wh + 1, RAMP.ember[2]);
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx = 26,
      by = faceTop + 2,
      bw = 12,
      bh = 30;
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      let c = acc[2];
      if (i === 0) c = acc[1];
      if (i === bw - 1) c = acc[3];
      P(g, bx + i, by + j, c);
    }
    for (let i = -1; i <= bw; i++) P(g, bx + i, by - 1, RAMP.dirt[3]); // rod
    // pennant tail (notched bottom)
    for (let i = 0; i < bw; i++) {
      const t = Math.abs(i - (bw - 1) / 2) / ((bw - 1) / 2);
      for (let k = 0; k < Math.round((1 - t) * 5); k++) P(g, bx + i, by + bh + k, acc[3]);
    }
    // emblem
    P(g, bx + (bw >> 1), by + 10, acc[0]);
    P(g, bx + (bw >> 1) - 1, by + 11, acc[0]);
    P(g, bx + (bw >> 1) + 1, by + 11, acc[0]);
    P(g, bx + (bw >> 1), by + 12, acc[1]);
  } else if (variant === 'seam') {
    // glinting gold seam across raw rock
    let x = 8,
      y = faceTop + 6;
    for (let k = 0; k < 40; k++) {
      P(g, x, y, RAMP.gold[1]);
      if (hash2(x, y, 76) < 0.5) P(g, x, y + 1, RAMP.gold[2]);
      if (hash2(x, y, 77) < 0.3) P(g, x, y - 1, RAMP.gold[0]); // glint
      x += 1 + (hash2(k, 1, 78) < 0.4 ? 1 : 0);
      y += hash2(k, 2, 78) < 0.5 ? 1 : hash2(k, 3, 78) < 0.5 ? -1 : 0;
      if (x > 58) break;
      y = Math.max(faceTop + 2, Math.min(faceBot - 3, y));
    }
  } else if (variant === 'lantern') {
    // hanging miner's lantern (ember)
    const lx = 32,
      ly = faceTop + 6;
    for (let k = 0; k < 5; k++) P(g, lx, faceTop - 1 - k < 0 ? 0 : faceTop - 1 + k, RAMP.dirt[3]); // bracket down
    P(g, lx, ly - 3, RAMP.dirt[3]);
    for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1];
      if (j === 0 || j === 7) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[0];else if (i >= 2) c = RAMP.ember[2];
      if ((j === 1 || j === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      P(g, lx + i, ly + j, c);
    }
    P(g, lx, ly + 3, RAMP.ember[0]);
    // glow dither
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ FIXTURES ============================ */
// generic iso cuboid: front (lit) + right side (shadow) + top
function isoCuboid(g, x0, baseY, w, h, dep, ramp) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // front
    let c = ramp[1];
    if (x < 1) c = ramp[0];
    if (x > w - 2) c = ramp[2];
    P(g, x0 + x, baseY - y, c);
  }
  for (let d = 1; d <= dep; d++) for (let y = 0; y < h; y++) {
    // right side
    P(g, x0 + w - 1 + d, baseY - y - Math.floor(d / 2), d >= dep - 1 ? ramp[3] : ramp[2]);
  }
  for (let d = 0; d <= dep; d++) for (let x = 0; x < w; x++) {
    // top
    P(g, x0 + x + d, baseY - h - Math.floor(d / 2), d === 0 || x === 0 ? ramp[0] : ramp[1]);
  }
}
function fxCounter() {
  const g = makeGrid(48, 32);
  const r = RAMP.dirt;
  const baseY = 29,
    x0 = 3;
  isoCuboid(g, x0, baseY, 38, 16, 6, r);
  // top surface lighter plank
  for (let d = 0; d <= 6; d++) for (let x = 0; x < 38; x++) if ((x + d) % 6 === 0) P(g, x0 + x + d, baseY - 16 - Math.floor(d / 2), r[2]);
  // gold till glint
  P(g, x0 + 30, baseY - 17, RAMP.gold[0]);
  P(g, x0 + 31, baseY - 18, RAMP.gold[1]);
  P(g, x0 + 30, baseY - 16, RAMP.gold[2]);
  // panel seams on front
  for (let x = 8; x < 38; x += 10) for (let y = 0; y < 15; y++) P(g, x0 + x, baseY - y, r[3]);
  outline(g, RAMP.void);
  return g;
}
function fxShelf() {
  const g = makeGrid(40, 40);
  const r = RAMP.dirt;
  const x0 = 4,
    top = 8;
  // frame
  for (let j = 0; j < 28; j++) {
    P(g, x0, top + j, r[2]);
    P(g, x0 + 30, top + j, r[3]);
  }
  for (const sy of [top, top + 9, top + 18, top + 27]) for (let i = 0; i <= 30; i++) P(g, x0 + i, sy, r[3]);
  // bottles (top shelf)
  [[RAMP.drift, 6], [RAMP.ember, 11], [RAMP.water, 16], [RAMP.grass, 21]].forEach(([col, bx]) => {
    P(g, x0 + bx, top + 3, col[1]);
    P(g, x0 + bx, top + 4, col[2]);
    P(g, x0 + bx, top + 5, col[2]);
    P(g, x0 + bx, top + 2, RAMP.bone[2]);
  });
  // coffer (mid)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) {
    let c = RAMP.dirt[1];
    if (i === 0) c = RAMP.dirt[0];
    if (i === 11) c = RAMP.dirt[2];
    if (j === 0) c = RAMP.gold[2];
    P(g, x0 + 8 + i, top + 11 + j, c);
  }
  P(g, x0 + 14, top + 13, RAMP.gold[0]);
  // cloth bolts (lower)
  [[RAMP.blood, 6], [RAMP.drift, 13], [RAMP.gold, 20]].forEach(([col, bx]) => {
    for (let j = 0; j < 6; j++) P(g, x0 + bx, top + 20 + j, col[1]), P(g, x0 + bx + 1, top + 20 + j, col[2]);
  });
  outline(g, RAMP.void);
  return g;
}
function fxTable() {
  const g = makeGrid(40, 32);
  const r = RAMP.dirt;
  const cx = 20,
    ty = 16;
  // round top (iso ellipse)
  for (let yy = -5; yy <= 5; yy++) for (let xx = -13; xx <= 13; xx++) {
    if ((xx / 13) ** 2 + (yy / 5) ** 2 > 1) continue;
    let c = r[1];
    if (yy < -1) c = r[0];
    if (yy > 2) c = r[2];
    P(g, cx + xx, ty + yy, c);
  }
  for (let xx = -13; xx <= 13; xx++) {
    const t = 1 - Math.abs(xx) / 13;
    const ey = ty + Math.round(5 * t);
    for (let k = 1; k <= 3; k++) P(g, cx + xx, ey + k, r[3]);
  } // rim
  // legs
  P(g, cx - 8, ty + 8, r[3]);
  P(g, cx - 8, ty + 9, r[3]);
  P(g, cx + 8, ty + 8, r[3]);
  P(g, cx + 8, ty + 9, r[3]);
  P(g, cx, ty + 11, r[3]);
  P(g, cx, ty + 12, r[3]);
  // mug
  P(g, cx + 3, ty - 2, RAMP.dirt[2]);
  P(g, cx + 3, ty - 3, RAMP.dirt[1]);
  fillRect(g, cx + 2, ty - 4, 3, 2, RAMP.dirt[1]);
  P(g, cx + 5, ty - 3, RAMP.dirt[2]);
  P(g, cx + 3, ty - 5, RAMP.bone[1]);
  outline(g, RAMP.void);
  return g;
}
function fxBarrel() {
  const g = makeGrid(20, 28);
  const r = RAMP.dirt;
  const x0 = 3,
    baseY = 25;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 12; i++) {
    const t = Math.abs(i - 5.5) / 6;
    let c = r[1];
    if (i <= 1) c = r[0];
    if (i >= 9) c = r[2];
    if (t > 0.85) c = r[3];
    if (j === 0 || j === 21) c = r[3];
    if (j === 5 || j === 16) c = r[3];
    P(g, x0 + i, baseY - 21 + j, c);
  }
  // top rim ellipse
  for (let xx = 0; xx < 12; xx++) {
    const t = Math.abs(xx - 5.5) / 6;
    if (t < 0.92) P(g, x0 + xx, baseY - 21 - Math.round((1 - t) * 2), r[2]);
  }
  P(g, x0 + 5, baseY - 24, r[1]);
  outline(g, RAMP.void);
  return g;
}
const VAT_LIQUIDS = ['drift', 'ember', 'water', 'blood', 'grass', 'gold'];
function fxVat(liquid) {
  const g = makeGrid(28, 28);
  const r = RAMP.dirt;
  const lr = RAMP[liquid] || RAMP.drift;
  const cx = 14,
    baseY = 25;
  // wooden tub
  for (let j = 0; j < 16; j++) for (let i = -10; i <= 10; i++) {
    const t = Math.abs(i) / 10;
    if (t > 0.95 - j * 0.005) continue;
    let c = r[1];
    if (i < -7) c = r[0];
    if (i > 7) c = r[2];
    if (j % 6 === 5) c = r[3];
    if (Math.abs(i) >= 9) c = r[3];
    P(g, cx + i, baseY - j, c);
  }
  // liquid surface (iso ellipse) near top
  for (let yy = -3; yy <= 3; yy++) for (let xx = -8; xx <= 8; xx++) {
    if ((xx / 8) ** 2 + (yy / 3) ** 2 > 1) continue;
    let c = lr[2] || lr[1];
    if (yy < -1) c = lr[1];
    if (yy <= -2) c = lr[0];
    if ((xx + yy) % 3 === 0 && yy > 0) c = lr[3] || lr[2];
    P(g, cx + xx, baseY - 14 + yy, c);
  }
  // steam
  P(g, cx - 2, baseY - 18, RAMP.bone[3]);
  P(g, cx + 1, baseY - 20, RAMP.bone[3]);
  P(g, cx - 1, baseY - 22, RAMP.bone[3]);
  // rim
  for (let xx = -9; xx <= 9; xx++) {
    const t = Math.abs(xx) / 9;
    if (t < 0.96) P(g, cx + xx, baseY - 16 - Math.round((1 - t) * 1), r[2]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxCage() {
  const g = makeGrid(26, 32);
  const r = RAMP.stone;
  const x0 = 3,
    top = 6,
    w = 18,
    h = 22;
  // base
  for (let i = 0; i < w; i++) {
    P(g, x0 + i, top + h, r[3]);
    P(g, x0 + i, top + h - 1, r[2]);
  }
  // dome top
  for (let xx = 0; xx < w; xx++) {
    const t = Math.abs(xx - (w - 1) / 2) / ((w - 1) / 2);
    const yy = top - Math.round((1 - t) * 4);
    for (let k = yy; k < top + 1; k++) P(g, x0 + xx, k, r[2]);
  }
  P(g, x0 + (w >> 1), top - 5, r[3]);
  P(g, x0 + (w >> 1), top - 6, r[3]); // ring
  // vertical bars
  for (let i = 0; i <= w; i += 3) for (let j = top; j < top + h; j++) P(g, x0 + i, j, r[3]);
  for (let i = 0; i < w; i++) {
    P(g, x0 + i, top, r[3]);
    P(g, x0 + i, top + Math.round(h / 2), r[3]);
  }
  // glowing wisp inside
  const wx = x0 + (w >> 1),
    wy = top + 12;
  P(g, wx, wy, RAMP.drift[0]);
  P(g, wx - 1, wy, RAMP.drift[1]);
  P(g, wx + 1, wy, RAMP.drift[1]);
  P(g, wx, wy - 1, RAMP.drift[1]);
  P(g, wx, wy + 1, RAMP.drift[2]);
  for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  outline(g, RAMP.void);
  return g;
}
function fxAnvil() {
  const g = makeGrid(28, 24);
  const r = RAMP.stone;
  const baseY = 21,
    cx = 14;
  // stump
  for (let j = 0; j < 7; j++) for (let i = -5; i <= 5; i++) {
    let c = RAMP.dirt[1];
    if (i < -3) c = RAMP.dirt[0];
    if (i > 3) c = RAMP.dirt[2];
    P(g, cx + i, baseY - j, c);
  }
  // anvil body
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 9, r[1]); // base top
  for (let i = -4; i <= 4; i++) P(g, cx + i, baseY - 8, r[2]); // waist
  for (let i = -7; i <= 9; i++) {
    let c = r[1];
    if (i < -5) c = r[0];
    if (i > 6) c = r[2];
    P(g, cx + i, baseY - 12, c);
    P(g, cx + i, baseY - 11, c);
  } // top face + horn
  for (let i = 7; i <= 11; i++) P(g, cx + i, baseY - 11, r[2]); // horn taper
  // gold spark
  P(g, cx + 2, baseY - 14, RAMP.gold[0]);
  P(g, cx + 3, baseY - 15, RAMP.gold[1]);
  P(g, cx + 1, baseY - 15, RAMP.ember[0]);
  outline(g, RAMP.void);
  return g;
}
function fxWheelStand() {
  const g = makeGrid(34, 40);
  const cx = 17,
    wy = 14,
    R = 12;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.grass[1]];
  // stand post + feet
  for (let j = 0; j < 14; j++) P(g, cx, wy + R + j, RAMP.dirt[2]), P(g, cx + 1, wy + R + j, RAMP.dirt[3]);
  for (let i = -6; i <= 6; i++) P(g, cx + i, wy + R + 13, RAMP.dirt[3]);
  // wheel
  for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > R) continue;
    if (d > R - 2) {
      P(g, cx + xx, wy + yy, RAMP.dirt[3]);
      continue;
    }
    const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2);
    P(g, cx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]);
  }
  P(g, cx, wy, RAMP.bone[1]); // hub
  P(g, cx, wy - R - 1, RAMP.bone[0]);
  P(g, cx, wy - R, RAMP.bone[1]); // pointer
  outline(g, RAMP.void);
  return g;
}
function fxHearth(frame) {
  frame = frame || 0;
  const g = makeGrid(36, 36);
  const r = RAMP.stone;
  const cx = 18,
    baseY = 33;
  // stone surround
  for (let j = 0; j < 28; j++) for (let i = -15; i <= 15; i++) {
    const inner = Math.abs(i) <= 9 && j < 18;
    if (inner) continue;
    if (Math.abs(i) > 15 || j > 27) continue;
    let c = r[1];
    if (i < -11) c = r[0];
    if (i > 11) c = r[2];
    if (j % 6 === 0 || (i + Math.floor(j / 6) % 2 * 5) % 10 === 0) c = r[3];
    P(g, cx + i, baseY - j, c);
  }
  // dark firebox
  for (let j = 0; j < 16; j++) for (let i = -8; i <= 8; i++) if (Math.abs(i) <= 8 && j < 16) P(g, cx + i, baseY - j, RAMP.void);
  // logs
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 1, RAMP.dirt[3]);
  P(g, cx - 4, baseY - 2, RAMP.dirt[2]);
  P(g, cx + 4, baseY - 2, RAMP.dirt[2]);
  // ember fire (flicker)
  const sway = [0, 1, -1][frame],
    tall = [0, 1, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) {
    const t = yy / (12 + tall);
    const hw = Math.round((1 - t) * 6);
    const sx = cx + Math.round(Math.sin(yy * 0.5 + frame) * 1.1) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = RAMP.ember[1];
      if (Math.abs(xx) >= hw - 1) c = RAMP.ember[2];
      if (yy < 5 && Math.abs(xx) < 2) c = RAMP.ember[0];
      P(g, sx + xx, baseY - 2 - yy, c);
    }
  }
  for (let yy = 2; yy <= 7 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2));
    for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 4 - yy, RAMP.gold[0]);
  }
  // spark + glow
  if (frame !== 1) P(g, cx + sway, baseY - 16 - tall, RAMP.ember[0]);
  for (let yy = -10; yy <= 2; yy++) for (let xx = -10; xx <= 10; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 7 && d < 10 && (xx + yy + frame) % 2 === 0 && baseY - 4 + yy > 14) P(g, cx + xx, baseY - 6 + yy, RAMP.ember[2]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxRug(accent) {
  const g = makeGrid(56, 30);
  const cx = 28,
    cy = 15;
  const acc = accent || RAMP.drift;
  for (let yy = -13; yy <= 13; yy++) for (let xx = -26; xx <= 26; xx++) {
    if ((xx / 26) ** 2 + (yy / 13) ** 2 > 1) continue;
    const e = (xx / 26) ** 2 + (yy / 13) ** 2;
    let c = RAMP.dirt[2];
    if (e > 0.78) c = acc[2]; // accent border
    else if (e > 0.66) c = acc[3];else if (e < 0.18) c = acc[3]; // center medallion
    else if (e < 0.28) c = RAMP.dirt[1];
    if ((xx + yy) % 6 === 0 && e < 0.6 && e > 0.3) c = RAMP.dirt[1]; // weave
    P(g, cx + xx, cy + yy, c);
  }
  // fringe
  for (let xx = -26; xx <= 26; xx += 3) {
    P(g, cx + xx, cy + Math.round(13 * Math.sqrt(Math.max(0, 1 - (xx / 26) ** 2))) + 1, RAMP.dirt[3]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxGoldVein(state) {
  // state: 'rich0','rich1','spent'
  const g = makeGrid(28, 26);
  const r = RAMP.stone;
  const cx = 14,
    baseY = 23;
  for (let yy = 0; yy <= 18; yy++) for (let xx = -11; xx <= 11; xx++) {
    const t = yy / 18;
    const hw = Math.round(11 * (1 - Math.abs(t - 0.5) * 0.7));
    if (Math.abs(xx) > hw) continue;
    let c = r[1];
    if (xx < -hw + 2) c = r[0];
    if (xx > hw - 2) c = r[3];
    if (yy > 14) c = r[3];
    if (hash2(cx + xx, baseY - yy, 81) < 0.08) c = r[2];
    P(g, cx + xx, baseY - yy, c);
  }
  if (state === 'spent') {
    // hollowed dark pockets, no gold
    [[-4, 10], [3, 7], [0, 13], [-6, 6], [5, 12]].forEach(([ox, oy]) => {
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) P(g, cx + ox + xx, baseY - oy + yy, RAMP.void);
      P(g, cx + ox, baseY - oy, RAMP.stone[3]);
    });
  } else {
    const spark = state === 'rich1';
    // bright gold seams
    const seams = [[-7, 4, 1, 1], [-2, 6, 1, -1], [4, 5, 1, 1], [-5, 11, 1, 0], [2, 12, 1, 1]];
    seams.forEach(([sx, sy, dx, dy], i) => {
      let x = cx + sx,
        y = baseY - sy;
      for (let k = 0; k < 6; k++) {
        P(g, x, y, RAMP.gold[1]);
        if (k % 2 === 0) P(g, x, y + 1, RAMP.gold[2]);
        if (spark && (i + k) % 4 === 0) P(g, x, y - 1, RAMP.gold[0]);
        x += dx;
        y -= dy * (k % 2);
      }
    });
    // a couple of bright nuggets with glint
    P(g, cx - 3, baseY - 8, RAMP.gold[0]);
    P(g, cx - 2, baseY - 8, RAMP.gold[1]);
    if (spark) P(g, cx - 3, baseY - 9, RAMP.bone[0]);
    P(g, cx + 5, baseY - 10, RAMP.gold[0]);
    if (spark) P(g, cx + 6, baseY - 11, RAMP.bone[0]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxOreCart() {
  const g = makeGrid(36, 28);
  const r = RAMP.dirt;
  const baseY = 25,
    x0 = 4;
  // rails under
  for (let i = 0; i < 36; i++) {
    P(g, i, baseY, RAMP.stone[3]);
    P(g, i, baseY - 1, RAMP.stone[2]);
  }
  for (let i = 2; i < 36; i += 5) P(g, i, baseY + 1, RAMP.dirt[3]); // ties
  // wheels
  [[x0 + 6, baseY - 2], [x0 + 22, baseY - 2]].forEach(([wx, wy]) => {
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 5) P(g, wx + xx, wy + yy, RAMP.stone[3]);
    P(g, wx, wy, RAMP.stone[2]);
  });
  // cart body (trapezoid bucket)
  for (let j = 0; j < 12; j++) {
    const w = 26 - j;
    const sx = x0 + 2 + Math.floor((26 - w) / 2);
    for (let i = 0; i < w; i++) {
      let c = r[1];
      if (i < 1) c = r[0];
      if (i > w - 2) c = r[2];
      if (j === 0) c = r[2];
      P(g, sx + i, baseY - 6 - j, c);
    }
  }
  // band + rivets
  for (let i = 0; i < 26; i++) P(g, x0 + 2 + i, baseY - 12, RAMP.dirt[3]);
  // raw gold ore heaped on top
  for (let i = 0; i < 9; i++) {
    const ox = x0 + 6 + i * 2,
      oy = baseY - 18 - i % 2;
    P(g, ox, oy, RAMP.gold[1]);
    P(g, ox + 1, oy, RAMP.gold[2]);
    P(g, ox, oy - 1, RAMP.gold[0]);
  }
  for (let i = 0; i < 5; i++) P(g, x0 + 9 + i * 3, baseY - 20, RAMP.stone[2]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ THE MINE (overworld, 144×120) ============================ */
function drawMine() {
  const g = makeGrid(144, 120);
  const cx = 72,
    baseY = 100;
  // foundation (reuse town foundation if available, else local)
  if (typeof foundation === 'function') foundation(g, cx, baseY + 6, 56, {});
  // rocky mound — low, broad, FLAT-topped dome, irregular silhouette
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(66 * Math.pow(1 - Math.pow(t, 3), 0.42)); // stays wide, flat top
    hw += Math.round((hash2(yy, 0, 95) - 0.5) * 6); // rocky bumps
    if (yy > maxH - 6) hw = Math.max(hw, 10 - (maxH - yy) * 1.5); // rounded flat cap
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 91);
      let c = RAMP.stone[1];
      if (xx < -hw + 6) c = RAMP.stone[0]; // moonlit left
      else if (xx > hw - 6) c = RAMP.stone[3]; // shadow right
      else if (h < 0.10) c = RAMP.stone[2];else if (h < 0.13) c = RAMP.stone[0];
      if (h < 0.02) c = RAMP.stone[3];
      P(g, cx + xx, top, c);
    }
  }
  // gold seams glinting across the rock
  const rng = mulberry(913);
  for (let s = 0; s < 7; s++) {
    let x = cx - 40 + Math.floor(rng() * 80),
      y = baseY - 8 - Math.floor(rng() * 46);
    const dx = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < 10 + Math.floor(rng() * 8); k++) {
      if (G(g, x, y)) {
        P(g, x, y, RAMP.gold[1]);
        if (rng() < 0.5) P(g, x, y + 1, RAMP.gold[2]);
        if (rng() < 0.3) P(g, x, y - 1, RAMP.gold[0]);
      }
      x += dx * (rng() < 0.4 ? 1 : 0) + (rng() < 0.3 ? 1 : 0);
      y += rng() < 0.5 ? 1 : -1;
    }
  }
  // timber-framed dark adit on the south face
  const ax = cx,
    abot = baseY,
    aw = 30,
    ah = 30;
  for (let j = 0; j < ah; j++) for (let i = -aw / 2; i <= aw / 2; i++) {
    const t = Math.abs(i) / (aw / 2);
    if (j < ah * 0.45 * t) continue; // arched top
    P(g, ax + i, abot - j, RAMP.void);
  }
  // arch interior depth hint (dither toward lighter at top)
  for (let j = 0; j < 6; j++) for (let i = -aw / 2 + 3; i <= aw / 2 - 3; i++) if ((i + j) % 2 === 0 && Math.abs(i) < aw / 2 - 3) P(g, ax + i, abot - ah + 6 + j, RAMP.stone[3]);
  // timber frame (posts + lintel)
  for (let j = 0; j <= ah; j++) {
    fillRect(g, ax - aw / 2 - 3, abot - j, 3, 1, RAMP.dirt[1]);
    fillRect(g, ax + aw / 2, abot - j, 3, 1, RAMP.dirt[2]);
  }
  for (let i = -aw / 2 - 3; i <= aw / 2 + 3; i++) {
    const t = Math.abs(i) / (aw / 2 + 3);
    const ly = abot - ah - 2 + Math.round(t * 5);
    P(g, ax + i, ly, RAMP.dirt[1]);
    P(g, ax + i, ly - 1, RAMP.dirt[0]);
    P(g, ax + i, ly - 2, RAMP.dirt[3]);
  }
  // cross-brace
  for (let k = 0; k < aw + 6; k++) P(g, ax - aw / 2 - 3 + k, abot - ah + 2 + Math.round(Math.sin(k / (aw + 6) * Math.PI) * -2), RAMP.dirt[3]);
  // cart rails running out of the mouth (south, toward camera)
  for (let k = 0; k < 22; k++) {
    const ry = abot + k,
      spread = 4 + Math.floor(k * 0.5);
    P(g, ax - spread, ry, RAMP.stone[3]);
    P(g, ax - spread + 1, ry, RAMP.stone[2]);
    P(g, ax + spread, ry, RAMP.stone[3]);
    P(g, ax + spread - 1, ry, RAMP.stone[2]);
    if (k % 3 === 0) for (let i = -spread; i <= spread; i++) P(g, ax + i, ry, RAMP.dirt[3]); // tie
  }
  // a few raw ore chunks by the mouth
  [[ax - 22, abot + 2], [ax + 20, abot + 5]].forEach(([ox, oy]) => {
    P(g, ox, oy, RAMP.gold[1]);
    P(g, ox + 1, oy, RAMP.gold[2]);
    P(g, ox, oy - 1, RAMP.gold[0]);
    P(g, ox - 1, oy, RAMP.stone[2]);
  });
  // hung ember lantern by the entrance (on the left post)
  const lx = ax - aw / 2 - 6,
    ly = abot - ah + 6;
  P(g, lx + 2, ly - 4, RAMP.dirt[3]);
  for (let i = 0; i < 4; i++) P(g, lx + 2 + i, ly - 4, RAMP.dirt[3]);
  for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) {
    let c = RAMP.ember[1];
    if (j === 0 || j === 7) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[0];else if (i >= 2) c = RAMP.ember[2];
    P(g, lx + i, ly + j, c);
  }
  P(g, lx, ly + 3, RAMP.ember[0]);
  for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// Drift Mirror — tall standing mirror, bone-and-iron frame, 32×48, bottom-center
// anchor (16,47). The glass is NOT reflective: it swirls dark with drift-ramp
// motes ("what the Drift could make of you"). 2-frame ripple. Stands in the
// Dyeworks. RAMP only, 1px void outline, dither not blur.
function fxMirror(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 48);
  const bn = RAMP.bone,
    st = RAMP.stone,
    dr = RAMP.drift;
  const cx = 16,
    baseY = 46;

  // --- iron feet / splayed base ---
  for (let x = cx - 8; x <= cx + 8; x++) {
    P(g, x, baseY, st[3]);
    if (Math.abs(x - cx) > 4) P(g, x, baseY - 1, st[2]);
  }
  P(g, cx - 8, baseY - 1, st[3]);
  P(g, cx + 8, baseY - 1, st[3]);
  // base post
  for (let y = baseY - 4; y <= baseY - 1; y++) for (let x = cx - 2; x <= cx + 2; x++) P(g, x, y, x < cx ? st[1] : st[3]);

  // --- bone-and-iron frame (rounded-arch top), glass cavity y 6..40, x 6..25 ---
  const gx0 = 6,
    gx1 = 25,
    gTop = 6,
    gBot = 40,
    arch = 6;
  function inGlass(x, y) {
    if (x < gx0 || x > gx1 || y > gBot) return false;
    if (y >= gTop + arch) return true;
    const mx = (gx0 + gx1) / 2;
    return (x - mx) * (x - mx) + (y - gTop - arch) * (y - gTop - arch) <= (arch + 3.5) * (arch + 3.5) * ((gx1 - gx0) / 2 / (arch + 3.5)) * ((gx1 - gx0) / 2 / (arch + 3.5));
  }
  // frame: a 3px band around the glass cavity, bone outer + iron inner, with arch
  for (let y = 1; y <= baseY - 4; y++) for (let x = 2; x <= 29; x++) {
    if (inGlass(x, y)) continue;
    // distance-to-cavity test: draw frame where near the glass region box
    const nearX = x >= gx0 - 4 && x <= gx1 + 4,
      nearY = y >= gTop - 4 && y <= gBot + 4;
    if (!nearX || !nearY) continue;
    // inner iron ring (touching glass) vs outer bone
    let touchesGlass = false;
    for (let oy = -1; oy <= 1 && !touchesGlass; oy++) for (let ox = -1; ox <= 1; ox++) if (inGlass(x + ox, y + oy)) {
      touchesGlass = true;
      break;
    }
    let c;
    if (touchesGlass) c = st[3]; // iron lip on the glass
    else {
      c = bn[1];
      if (x < gx0 - 1) c = bn[0]; // moonlit left
      if (x > gx1 + 1) c = bn[2]; // shadow right
      if (y < gTop) c = bn[0];
      if (hash2(x, y, 51) < 0.10) c = bn[2]; // bone grain
      // iron rivets at the corners + arch crown
      if ((Math.abs(x - gx0) < 2 || Math.abs(x - gx1) < 2) && Math.abs(y - gBot) < 2) c = st[2];
    }
    P(g, x, y, c);
  }
  // arch crown ornament (a small drift crystal set in the bone)
  P(g, cx, gTop - 4, dr[0]);
  P(g, cx, gTop - 3, dr[1]);
  P(g, cx - 1, gTop - 2, dr[2]);
  P(g, cx + 1, gTop - 2, dr[2]);
  P(g, cx, gTop - 2, dr[1]);

  // --- the glass: dark swirling Drift (NOT reflective), 2-frame ripple ---
  const mx = (gx0 + gx1) / 2,
    my = (gTop + arch + gBot) / 2;
  for (let y = gTop - arch; y <= gBot; y++) for (let x = gx0; x <= gx1; x++) {
    if (!inGlass(x, y)) continue;
    const dx = x - mx,
      dy = (y - my) * 1.4;
    const rad = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx);
    // swirl field: phase shifts between frames for the ripple
    const swirl = Math.sin(ang * 2 + rad * 0.5 - frame * 1.7);
    let c;
    if (swirl > 0.55) c = dr[2];else if (swirl > 0.0) c = dr[3];else c = RAMP.void;
    // dithered mid tone so it reads as depth, not flat
    if (c === dr[3] && (x + y) % 2 === 0) c = dr[4] || dr[3];
    P(g, x, y, c);
  }
  // floating drift motes in the glass (drift up, reposition per frame)
  const mr = mulberry(frame + 3);
  for (let i = 0; i < 9; i++) {
    let mxx = gx0 + 1 + Math.floor(mr() * (gx1 - gx0 - 1));
    let myy = gTop + arch - 2 + Math.floor(mr() * (gBot - gTop - arch));
    myy -= frame * 2; // rise between frames
    if (!inGlass(mxx, myy)) continue;
    const bright = i % 3 === 0;
    P(g, mxx, myy, bright ? dr[0] : dr[1]);
    if (bright) {
      P(g, mxx, myy - 1, dr[2]);
    }
  }
  // a faint pale "figure" hint deep in the glass (what the Drift could make of you)
  const fy = my + (frame ? 1 : 0);
  for (let y = fy - 6; y <= fy + 6; y++) {
    const w = y < fy - 2 ? 1 : 2;
    for (let x = mx - w; x <= mx + w; x++) if (inGlass(x, y) && hash2(x, y, 60 + frame) < 0.5) P(g, x, y, dr[2]);
  }
  P(g, mx, fy - 5, dr[1]);
  P(g, mx - 1, fy - 4, dr[1]);
  P(g, mx + 1, fy - 4, dr[1]); // shoulders/head hint

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRIES ============================ */
const FLOORS = {
  floor_wood: 'wood',
  floor_stone: 'stone',
  floor_cave: 'cave'
};
const WALLS = [
// key, side, mat, variant
['wall_timber_nw', 'nw', 'timber', 'plain'], ['wall_timber_ne', 'ne', 'timber', 'plain'], ['wall_timber_window', 'nw', 'timber', 'window'], ['wall_timber_banner', 'nw', 'timber', 'banner'], ['wall_block_nw', 'nw', 'block', 'plain'], ['wall_block_ne', 'ne', 'block', 'plain'], ['wall_block_window', 'nw', 'block', 'window'], ['wall_block_banner', 'nw', 'block', 'banner'], ['wall_cave_nw', 'nw', 'cave', 'plain'], ['wall_cave_ne', 'ne', 'cave', 'plain'], ['wall_cave_seam', 'nw', 'cave', 'seam'], ['wall_cave_lantern', 'nw', 'cave', 'lantern']];
const FIX = {
  counter: {
    fn: fxCounter,
    cell: [48, 32],
    anchor: [24, 31]
  },
  shelf: {
    fn: fxShelf,
    cell: [40, 40],
    anchor: [20, 39]
  },
  table: {
    fn: fxTable,
    cell: [40, 32],
    anchor: [20, 31]
  },
  barrel: {
    fn: fxBarrel,
    cell: [20, 28],
    anchor: [10, 27]
  },
  cage: {
    fn: fxCage,
    cell: [26, 32],
    anchor: [13, 31]
  },
  anvil: {
    fn: fxAnvil,
    cell: [28, 24],
    anchor: [14, 23]
  },
  wheel_stand: {
    fn: fxWheelStand,
    cell: [34, 40],
    anchor: [17, 39]
  },
  ore_cart: {
    fn: fxOreCart,
    cell: [36, 28],
    anchor: [18, 26]
  },
  mirror: {
    fn: fxMirror,
    cell: [32, 48],
    anchor: [16, 47],
    frames: 2,
    fps: 2
  }
};
Object.assign(globalThis, {
  makeFloorTile,
  wallSegment,
  isoCuboid,
  fxCounter,
  fxShelf,
  fxTable,
  fxBarrel,
  fxVat,
  fxCage,
  fxAnvil,
  fxWheelStand,
  fxHearth,
  fxRug,
  fxGoldVein,
  fxOreCart,
  fxMirror,
  drawMine,
  FLOORS,
  WALLS,
  FIX,
  VAT_LIQUIDS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/interiors.js", error: String((e && e.message) || e) }); }

// assets/_gen/landing.js
try { (() => {
// Naevyr LANDING PAGE ART PACK — eval after pixlib.js + tiles.js (+ town.js
// & interiors.js for silhouette cues, fxlogo.js for the emblem). Rect-grid,
// RAMP only, 1px void outline, dither not blur, deterministic. Moonlit-left.

/* ============================ HERO VISTA (480×270, 2 frames) ============================
   Waystation cluster at dusk, distant 2:1 iso. Warm windows, shrine pale flame,
   corruption creeping from both edges + drifting motes. Center third kept calm
   & dark for overlaid UI text. */
function drawHeroVista(frame) {
  frame = frame || 0;
  const W = 480,
    H = 270,
    g = makeGrid(W, H);
  const horizon = 150;

  // --- sky: dusk gradient via stepped dither bands (void→stone→drift hint) ---
  const bands = [[0, 26, RAMP.void, '#13101d'], [26, 54, '#13101d', RAMP.ash], [54, 84, RAMP.ash, '#241d33'], [84, 116, '#241d33', '#2f2440'], [116, horizon, '#2f2440', '#3a2c4e']];
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        // ordered 2px dither between a and b
        const dith = (x + y) % 2 === 0 ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });
  // distant ridge silhouettes (two layers)
  for (let x = 0; x < W; x++) {
    const r1 = horizon - 10 - Math.round(8 * Math.sin(x * 0.013) + 5 * Math.sin(x * 0.05));
    for (let y = r1; y < horizon; y++) P(g, x, y, '#241d33');
    const r2 = horizon - 4 - Math.round(5 * Math.sin(x * 0.02 + 2));
    for (let y = r2; y < horizon; y++) P(g, x, y, '#1c1729');
  }
  // a cold moon, upper-left third (kept out of center)
  const mx = 70,
    my = 46;
  for (let yy = -9; yy <= 9; yy++) for (let xx = -9; xx <= 9; xx++) {
    if (xx * xx + yy * yy > 81) continue;
    let c = RAMP.bone[2];
    if (xx + yy < -4) c = RAMP.bone[1];
    if (xx * xx + yy * yy > 56) c = RAMP.bone[3];
    P(g, mx + xx, my + yy, c);
  }
  for (let i = 0; i < 5; i++) {
    const cxs = mx + 2 + i,
      cys = my + 3 + i % 2 * 2;
    for (let xx = 0; xx < 5; xx++) P(g, cxs + xx, cys, '#2f2440');
  } // craters via dark streaks
  // faint stars
  const rng = mulberry(301);
  for (let i = 0; i < 60; i++) {
    const sx = Math.floor(rng() * W),
      sy = Math.floor(rng() * (horizon - 20));
    if (Math.abs(sx - 240) < 70 && sy > 40) continue;
    P(g, sx, sy, rng() < 0.3 ? RAMP.bone[1] : RAMP.bone[3]);
  }

  // --- ground plane (iso-ish dark earth, fading to black at front) ---
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      let c = t < 0.4 ? '#1a1626' : t < 0.75 ? '#13101d' : RAMP.void;
      if ((x + y) % 2 === 0 && hash2(x, y, 302) < 0.05 * (1 - t)) c = RAMP.dirt[3];
      P(g, x, y, c);
    }
  }
  // a faint iso path leading to the cluster (center, dark/calm)
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    const wdt = Math.round(6 + t * 40);
    for (let x = 240 - wdt; x <= 240 + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, '#1f1a2e');
  }

  // --- distant Waystation cluster on the horizon (small simplified buildings) ---
  // helper: tiny iso house with optional warm window + roof color
  function tinyHouse(bx, by, w, hh, roof, lit, flicker) {
    // body
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      let c = RAMP.stone[2];
      if (x < 1) c = RAMP.stone[1];
      if (x > w - 2) c = RAMP.stone[3];
      P(g, bx + x, by - y, c);
    }
    // right side
    for (let d = 1; d <= 3; d++) for (let y = 0; y < hh; y++) P(g, bx + w - 1 + d, by - y - Math.floor(d / 2), RAMP.stone[3]);
    // roof
    for (let x = -1; x <= w; x++) {
      const d = Math.abs(x - (w - 1) / 2);
      const ry = by - hh - Math.round((w / 2 - d) * 0.7);
      for (let y = ry; y <= by - hh + 1; y++) P(g, bx + x, y, roof);
    }
    // warm window
    if (lit) {
      const wx = bx + (w >> 1) - 1,
        wy = by - (hh >> 1) - 1;
      const on = !flicker || frame === 0;
      fillRect(g, wx, wy, 2, 2, on ? RAMP.ember[1] : RAMP.ember[2]);
      if (on) P(g, wx, wy - 1, RAMP.ember[2]);
    }
  }
  // cluster center ~ x 210..290, sitting on horizon
  tinyHouse(196, horizon - 1, 12, 12, RAMP.blood[2], true, false); // tavern-ish (warm)
  tinyHouse(214, horizon + 2, 10, 9, RAMP.stone[3], true, true);
  tinyHouse(252, horizon + 3, 14, 10, RAMP.dirt[3], true, false);
  tinyHouse(276, horizon - 1, 9, 11, RAMP.water[1], false, false); // menagerie-ish
  tinyHouse(232, horizon - 3, 8, 8, RAMP.stone[3], true, true);
  // the shrine pale flame on a small dais (right of center)
  const sfx = 300,
    sfy = horizon + 1;
  fillRect(g, sfx - 3, sfy - 2, 7, 3, RAMP.stone[2]); // dais
  const tall = frame === 0 ? 0 : 1;
  for (let yy = 0; yy <= 6 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (7 + tall)) * 2));
    for (let xx = -hw; xx <= hw; xx++) P(g, sfx + xx, sfy - 2 - yy, Math.abs(xx) === 0 ? RAMP.bone[0] : RAMP.bone[1]);
  }
  for (let yy = 1; yy <= 4 + tall; yy++) P(g, sfx, sfy - 3 - yy, RAMP.drift[1]); // purple core
  // pale flame glow
  for (let yy = -5; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 2 && d < 5 && (xx + yy + frame) % 2 === 0) P(g, sfx + xx, sfy - 4 + yy, RAMP.drift[2]);
  }

  // --- corruption creeping from BOTH screen edges ---
  function corruptEdge(side) {
    for (let y = 60; y < H; y++) {
      const reach = Math.round((40 + 26 * Math.sin(y * 0.05 + (side < 0 ? 0 : 2))) * (0.5 + 0.5 * (y / H)));
      for (let d = 0; d < reach; d++) {
        const x = side < 0 ? d : W - 1 - d;
        const edgeFade = 1 - d / reach;
        const h = hash2(x, y, 303);
        if ((x + y) % 2 === 0 && h < edgeFade * 0.8) P(g, x, y, h < edgeFade * 0.3 ? RAMP.drift[2] : RAMP.drift[3]);else if (h < edgeFade * 0.18) P(g, x, y, RAMP.drift[1]); // bright vein nodes
        // glowing tendril tips
        if (d > reach - 3 && h < 0.04) P(g, x, y, RAMP.drift[1]);
      }
    }
  }
  corruptEdge(-1);
  corruptEdge(1);

  // --- drifting purple motes (shimmer between frames), avoid calm center top ---
  const mrng = mulberry(304);
  for (let i = 0; i < 70; i++) {
    let px = Math.floor(mrng() * W),
      py = Math.floor(mrng() * H);
    const drift = frame === 0 ? 0 : 1;
    px = (px + i % 3 * drift) % W;
    py = (py - drift + H) % H;
    // keep upper-center third calmer
    if (px > 150 && px < 330 && py < 120) {
      if (mrng() < 0.7) continue;
    }
    const big = i % 5 === 0;
    P(g, px, py, big ? RAMP.drift[0] : RAMP.drift[1]);
    if (big) {
      P(g, px + 1, py, RAMP.drift[2]);
      P(g, px, py + 1, RAMP.drift[2]);
    }
  }
  // bottom vignette so overlaid UI text reads
  for (let y = H - 60; y < H; y++) {
    const t = (y - (H - 60)) / 60;
    for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && hash2(x, y, 305) < t * 0.9) P(g, x, y, RAMP.void);
  }

  // NOTE: no global outline — this is a scene, not an object.
  return g;
}

/* ============================ NAV ICONS (16×16) ============================
   Icon.tsx style: single 'ink' silhouette + light/shadow, tintable. We draw in
   bone ramp so the DS can recolor via CSS. 1px void outline. */
function navIcon(name) {
  const g = makeGrid(16, 16);
  const I = RAMP.bone[1],
    D = RAMP.bone[3],
    H = RAMP.bone[0],
    A = RAMP.drift[1],
    G = RAMP.gold[1],
    E = RAMP.ember[1];
  const box = (x, y, w, h, c) => fillRect(g, x, y, w, h, c);
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) P(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
  };
  switch (name) {
    case 'gauge':
      {
        // dashboard
        for (let yy = -5; yy <= 2; yy++) for (let xx = -6; xx <= 6; xx++) {
          if (xx * xx + (yy * 1.4) ** 2 > 36) continue;
          if (yy > 1) continue;
          P(g, 8 + xx, 9 + yy, I);
        }
        for (let xx = -6; xx <= 6; xx++) {
          P(g, 8 + xx, 9, D);
        } // base
        [-4, 0, 4].forEach(t => P(g, 8 + t, 4 + Math.abs(t) * 0.2, D)); // ticks
        line(8, 9, 11, 5, A);
        P(g, 8, 9, H); // needle
        break;
      }
    case 'scroll':
      {
        // updates
        box(4, 3, 8, 10, I);
        box(4, 3, 8, 1, D);
        box(4, 12, 8, 1, D);
        for (let yy = 5; yy <= 10; yy += 2) line(5, yy, 10, yy, D);
        P(g, 3, 3, D);
        P(g, 12, 3, D);
        P(g, 3, 13, D);
        P(g, 12, 13, D); // rolled ends
        box(3, 2, 2, 2, H);
        box(11, 12, 2, 2, H);
        break;
      }
    case 'banner':
      {
        // events
        box(5, 2, 6, 9, A);
        P(g, 5, 2, RAMP.drift[0]);
        box(10, 2, 1, 9, RAMP.drift[3]);
        for (let i = 0; i < 3; i++) {
          P(g, 6 + i * 2, 11 + i % 2, RAMP.drift[3]);
        } // notched tail
        line(8, 2, 8, 14, D); // pole
        P(g, 7, 5, H);
        P(g, 9, 5, H);
        P(g, 8, 6, H); // emblem
        break;
      }
    case 'book':
      {
        // docs / how-to-play
        box(3, 3, 5, 10, I);
        box(8, 3, 5, 10, I);
        box(3, 3, 5, 1, D);
        box(8, 3, 5, 1, D);
        line(8, 3, 8, 12, D); // spine
        box(3, 12, 10, 1, D);
        P(g, 5, 6, D);
        P(g, 10, 6, D);
        P(g, 5, 8, D);
        P(g, 10, 8, D); // text lines
        P(g, 8, 2, H);
        break;
      }
    case 'trophy':
      {
        // leaderboard
        for (let yy = 0; yy < 5; yy++) for (let xx = -4; xx <= 4; xx++) {
          if (Math.abs(xx) === 4 && yy > 2) continue;
          P(g, 8 + xx, 3 + yy, G);
        }
        P(g, 3, 4, G);
        P(g, 3, 5, G);
        P(g, 13, 4, G);
        P(g, 13, 5, G); // handles
        box(7, 8, 3, 2, RAMP.gold[2]);
        box(5, 11, 7, 2, G);
        box(6, 13, 5, 1, RAMP.gold[3]); // stem+base
        P(g, 8, 4, H);
        break;
      }
    case 'ledger':
      {
        // index
        box(4, 2, 9, 12, I);
        box(4, 2, 9, 1, D);
        box(4, 13, 9, 1, D);
        box(4, 2, 1, 12, D); // binding
        for (let yy = 4; yy <= 11; yy += 2) line(6, yy, 11, yy, D);
        P(g, 12, 5, A);
        P(g, 12, 9, G); // tab marks
        break;
      }
    case 'discord':
      {
        for (let yy = -3; yy <= 3; yy++) for (let xx = -5; xx <= 5; xx++) {
          if (xx * xx / 25 + yy * yy / 9 > 1) continue;
          P(g, 8 + xx, 7 + yy, I);
        }
        P(g, 4, 11, I);
        P(g, 12, 11, I);
        P(g, 5, 10, I);
        P(g, 11, 10, I); // lower horns
        P(g, 6, 7, D);
        P(g, 10, 7, D);
        P(g, 6, 6, H);
        P(g, 10, 6, H); // eyes
        break;
      }
    case 'telegram':
      {
        for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 11; xx++) {
          if (xx + yy < 4 || xx - yy > 8) continue;
          if (yy > 4 && xx < yy + 1) continue;
          P(g, 3 + xx, 3 + yy, I);
        }
        line(13, 4, 5, 9, H); // fold highlight
        P(g, 7, 12, I);
        P(g, 6, 13, D); // tail flick
        break;
      }
    case 'x_bird':
      {
        line(3, 3, 12, 12, I);
        line(4, 3, 13, 12, I);
        line(12, 3, 3, 12, I);
        line(13, 3, 4, 12, I);
        P(g, 3, 3, H);
        P(g, 13, 12, D);
        break;
      }
  }
  outline(g, RAMP.void);
  return g;
}
const NAV_ICONS = ['gauge', 'scroll', 'banner', 'book', 'trophy', 'ledger', 'discord', 'telegram', 'x_bird'];

/* ============================ GATE DOOR (96×128, 3 frames) ============================
   Warded stone door: shut · runes pulsing (gold) · opening glow. */
function drawGateDoor(frame) {
  frame = frame || 0;
  const g = makeGrid(96, 128);
  const cx = 48,
    baseY = 122;
  const st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  // stone arch surround
  for (let y = 8; y <= baseY; y++) for (let x = 8; x <= 87; x++) {
    const inArch = x >= 18 && x <= 77 && y >= 28 - Math.round(Math.sqrt(Math.max(0, 900 - (x - 48) ** 2)) * 0.0);
    // outer block frame
    if (x < 18 || x > 77 || y < 26) {
      // arch top: carve circle
      const topGap = y < 40 && (x - 48) ** 2 + (y - 40) ** 2 < 30 ** 2 && x > 18 && x < 78;
      if (topGap) continue;
      let c = st[1];
      if (x < 12 || x > 77 && x < 84) c = st[0];
      if (x > 83 || x > 77) c = st[3];
      if (y % 8 === 0 || (x + Math.floor(y / 8) % 2 * 5) % 10 === 0) c = st[3];
      if (hash2(x, y, 311) < 0.05) c = st[2];
      P(g, x, y, c);
    }
  }
  // door leaves region
  const dl = 20,
    dr_ = 76,
    dtopFlat = 42,
    dtopArchR = 28;
  function inDoor(x, y) {
    if (x < dl || x > dr_) return false;
    if (y > baseY - 2) return false;
    if (y >= dtopFlat) return true;
    return (x - 48) ** 2 + (y - dtopFlat) ** 2 <= dtopArchR ** 2;
  }
  // opening: frame 2 splits the doors apart
  const split = frame === 2 ? 10 : 0;
  for (let y = 14; y <= baseY; y++) for (let x = dl; x <= dr_; x++) {
    if (!inDoor(x, y)) continue;
    const leftLeaf = x < 48;
    const sx = leftLeaf ? x - split : x + split;
    if (frame === 2 && Math.abs(x - 48) < split) {
      // revealed interior glow
      let c = dr[3];
      const d = Math.abs(x - 48);
      if (d < split - 4) c = dr[2];
      if (d < split - 7) c = dr[1];
      if (hash2(x, y, 312) < 0.2) c = dr[0];
      P(g, x, y, c);
      continue;
    }
    if (!inDoor(sx, y)) continue;
    // wood/stone leaf with vertical planks
    let c = st[2];
    if (leftLeaf && x < dl + 3 || !leftLeaf && x > dr_ - 3) c = st[1];
    const plank = (leftLeaf ? dr_ - x : x - dl) % 7;
    if (plank === 0) c = st[3];
    if (x > 44 && x < 52) c = st[3]; // center seam
    if (hash2(sx, y, 313) < 0.05) c = st[3];
    P(g, sx, y, c);
  }
  // iron bands
  if (frame !== 2) {
    for (const by of [56, 90]) for (let x = dl + 1; x <= dr_ - 1; x++) {
      if (inDoor(x, by)) P(g, x, by, st[3]);
      if (inDoor(x, by + 1)) P(g, x, by + 1, RAMP.void);
    }
  }

  // --- warded runes (a ring + glyphs) ---
  const glow = frame === 0 ? gd[3] : frame === 1 ? gd[0] : gd[1];
  const glowDim = frame === 0 ? RAMP.gold[3] : gd[2];
  // central ring sigil
  const rcx = 48,
    rcy = 78,
    R = 16;
  if (frame !== 2) {
    for (let a = 0; a < 48; a++) {
      const th = a / 48 * Math.PI * 2;
      const x = Math.round(rcx + Math.cos(th) * R),
        y = Math.round(rcy + Math.sin(th) * R);
      if (inDoor(x, y)) P(g, x, y, a % 6 < 3 ? glow : glowDim);
    }
    // inner triangle glyph
    for (let i = 0; i < 3; i++) {
      const a0 = -Math.PI / 2 + i * 2.094,
        a1 = -Math.PI / 2 + (i + 1) * 2.094;
      const x0 = rcx + Math.cos(a0) * 9,
        y0 = rcy + Math.sin(a0) * 9,
        x1 = rcx + Math.cos(a1) * 9,
        y1 = rcy + Math.sin(a1) * 9;
      const n = 12;
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n),
          y = Math.round(y0 + (y1 - y0) * k / n);
        P(g, x, y, glow);
      }
    }
    P(g, rcx, rcy, frame === 1 ? gd[0] : gd[2]);
    // vertical rune column glyphs on each leaf
    [30, 66].forEach(rx => {
      [50, 62, 100].forEach(ry => {
        if (!inDoor(rx, ry)) return;
        P(g, rx, ry, glow);
        P(g, rx - 1, ry + 1, glowDim);
        P(g, rx + 1, ry + 1, glowDim);
        P(g, rx, ry + 2, glow);
      });
    });
    // glow halo on frame 1
    if (frame === 1) for (let yy = -R - 4; yy <= R + 4; yy++) for (let xx = -R - 4; xx <= R + 4; xx++) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (d > R + 1 && d < R + 4 && (xx + yy) % 2 === 0 && inDoor(rcx + xx, rcy + yy)) P(g, rcx + xx, rcy + yy, gd[3]);
    }
  } else {
    // opening: runes flare and scatter upward
    for (let yy = -R; yy <= R; yy += 2) for (let xx = -R; xx <= R; xx += 2) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (Math.abs(d - R) < 2) P(g, rcx + xx, rcy + yy, gd[0]);
    }
    for (let i = 0; i < 8; i++) {
      P(g, rcx - 12 + i * 3, rcy - 18 - i % 3 * 3, i % 2 ? gd[0] : dr[1]);
    }
  }
  // big ring handle / knocker (frames 0,1)
  if (frame !== 2) {
    for (let a = 0; a < 16; a++) {
      const th = a / 16 * Math.PI * 2;
      P(g, Math.round(46 + Math.cos(th) * 4), Math.round(106 + Math.sin(th) * 4), gd[2]);
    }
    P(g, 46, 102, gd[1]);
  }
  // threshold
  for (let x = 14; x <= 82; x++) {
    P(g, x, baseY + 1, st[3]);
    P(g, x, baseY + 2, st[2]);
  }
  if (frame === 2) for (let x = 38; x <= 58; x++) {
    P(g, x, baseY + 1, dr[2]);
  } // glow spill on ground
  outline(g, RAMP.void);
  return g;
}

/* ============================ WORDMARK PLATE (320×96, 2 frames) ============================
   Ornate bone-and-gold frame with drift-purple inlay to sit behind NAEVYR. */
function drawWordmarkPlate(frame) {
  frame = frame || 0;
  const W = 320,
    Hh = 96,
    g = makeGrid(W, Hh);
  const bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const x0 = 6,
    x1 = W - 7,
    y0 = 14,
    y1 = Hh - 15;
  // outer bevel plate (bone), inset
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    let c = bn[2];
    if (edge < 2) c = bn[3];else if (edge < 4) c = y - y0 < (y1 - y0) / 2 ? bn[1] : bn[2];else if (edge < 5) c = bn[0];else c = null; // hollow center (text sits here)
    if (c) P(g, x, y, c);
  }
  // gold inner rails
  for (let x = x0 + 6; x <= x1 - 6; x++) {
    P(g, x, y0 + 6, gd[1]);
    P(g, x, y1 - 6, gd[2]);
  }
  for (let y = y0 + 6; y <= y1 - 6; y++) {
    P(g, x0 + 6, y, gd[1]);
    P(g, x1 - 6, y, gd[2]);
  }
  // drift-purple inlay dots along the gold rail (pulse on frame 1)
  const lit = frame === 1;
  for (let x = x0 + 12; x <= x1 - 12; x += 12) {
    P(g, x, y0 + 6, lit ? dr[0] : dr[1]);
    P(g, x, y1 - 6, lit ? dr[0] : dr[1]);
    if (lit) {
      P(g, x, y0 + 5, dr[2]);
      P(g, x, y1 - 5, dr[2]);
    }
  }
  // ornate corner flourishes (gold scrollwork)
  function corner(cx, cy, sx, sy) {
    for (let k = 0; k < 10; k++) P(g, cx + sx * k, cy, gd[1]);
    for (let k = 0; k < 10; k++) P(g, cx, cy + sy * k, gd[1]);
    // little curl
    P(g, cx + sx * 9, cy + sy, gd[0]);
    P(g, cx + sx * 10, cy + sy * 2, gd[2]);
    P(g, cx + sx, cy + sy * 9, gd[0]);
    // drift gem at the corner
    P(g, cx + sx * 2, cy + sy * 2, lit ? dr[0] : dr[1]);
    P(g, cx + sx * 3, cy + sy * 2, dr[2]);
    P(g, cx + sx * 2, cy + sy * 3, dr[2]);
  }
  corner(x0 + 4, y0 + 4, 1, 1);
  corner(x1 - 4, y0 + 4, -1, 1);
  corner(x0 + 4, y1 - 4, 1, -1);
  corner(x1 - 4, y1 - 4, -1, -1);
  // center top & bottom finials
  [[x0 + x1 >> 1, y0 - 1, -1], [x0 + x1 >> 1, y1 + 1, 1]].forEach(([fx, fy, dir]) => {
    for (let k = 0; k < 5; k++) {
      const w = 4 - k;
      for (let i = -w; i <= w; i++) P(g, fx + i, fy + dir * k, i === 0 ? gd[0] : gd[1]);
    }
    P(g, fx, fy + dir * 5, lit ? dr[0] : dr[1]);
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const LANDING = {
  hero_vista: {
    fn: drawHeroVista,
    cell: [480, 270],
    anchor: [240, 269],
    frames: 2,
    anim: {
      name: 'shimmer',
      fps: 2
    },
    scene: true
  },
  gate_door: {
    fn: drawGateDoor,
    cell: [96, 128],
    anchor: [48, 127],
    frames: 3,
    anim: {
      name: 'ward',
      fps: 3
    }
  },
  wordmark_plate: {
    fn: drawWordmarkPlate,
    cell: [320, 96],
    anchor: [160, 48],
    frames: 2,
    anim: {
      name: 'inlay',
      fps: 2
    }
  }
};
Object.assign(globalThis, {
  drawHeroVista,
  navIcon,
  NAV_ICONS,
  drawGateDoor,
  drawWordmarkPlate,
  LANDING
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/landing.js", error: String((e && e.message) || e) }); }

// assets/_gen/micropoi.js
try { (() => {
// Naevyr "FILL THE REALM" · MICRO-POIs — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2; ell/shadeMass from beasts.js).
//
// Small decorative landmarks scattered across the map, BOTTOM-CENTER anchored, native cells,
// 1px #0a0810 void outline. Mostly 1 frame; a few animate. RAMP only, dither not blur,
// moonlit-left / shadowed-right. Registry: { fn(frame), cell:[w,h], anchor:[x,y],
//   frames(=1), anim?{name,fps}, footprint?, ground? }.

/* ----------------------------- local timber helpers ----------------------------- */
function mpole(g, x, y0, y1, ramp, w) {
  w = w || 3;
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1];
    if (i === 0) c = ramp[0];
    if (i === w - 1) c = ramp[3];
    if (hash2(x + i, y, 411) < 0.1) c = ramp[2];
    P(g, x + i, y, c);
  }
}
function mplank(g, x0, x1, y, ramp, th) {
  th = th || 3;
  for (let x = x0; x <= x1; x++) for (let j = 0; j < th; j++) {
    let c = ramp[1];
    if (j === 0) c = ramp[0];
    if (j === th - 1) c = ramp[3];
    if (hash2(x, y + j, 412) < 0.1) c = ramp[2];
    P(g, x, y + j, c);
  }
}
function mcrate(g, x, top, w, h, ramp) {
  for (let i = -1; i < w + 1; i++) P(g, x + i, top, ramp[2]);
  for (let y = top; y < top + h; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1];
    if (i < 2) c = ramp[0];
    if (i > w - 3) c = ramp[3];
    if (hash2(x + i, y, 413) < 0.08) c = ramp[2];
    P(g, x + i, y, c);
  }
  for (let i = 4; i < w; i += 5) for (let y = top; y < top + h; y++) P(g, x + i, y, ramp[3]);
}
function groundOval(g, cx, cy, rx, ry, c, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d) => {
    if (y < cy - 1) return;
    if (d > 0.85 && (x + y) % 2) return;
    P(g, x, y, c, c === RAMP.void ? 0.4 : 1);
  });
}

/* =============================== WELL (32×40) =============================== */
function drawWell() {
  const g = makeGrid(32, 40),
    st = RAMP.stone,
    dt = RAMP.dirt,
    wt = RAMP.water,
    bn = RAMP.bone,
    cx = 16,
    baseY = 37;
  groundOval(g, cx, baseY, 14, 4, RAMP.void, 1);
  // circular stone wall (elliptical front)
  for (let y = baseY - 12; y <= baseY - 1; y++) for (let x = cx - 9; x <= cx + 9; x++) {
    const dx = (x - cx) / 9;
    if (Math.abs(dx) > 1) continue;
    let c = st[1];
    if (x < cx - 6) c = st[0];
    if (x > cx + 5) c = st[3];
    if ((x + y) % 4 === 0) c = st[3]; // mortar courses
    if (hash2(x, y, 420) < 0.08) c = st[2];
    P(g, x, y, c);
  }
  // dark water mouth at the top rim
  ell(g, cx, baseY - 12, 9, 3, (x, y, d) => {
    let c = st[2];
    if (d < 0.6) c = wt[3];
    if (d < 0.3) c = wt[2];
    P(g, x, y, c);
  });
  ell(g, cx, baseY - 12, 9, 3, (x, y, d) => {
    if (d > 0.82) P(g, x, y, st[0]);
  }); // lit rim lip
  // two roof posts + a peaked little shingle roof
  mpole(g, cx - 8, baseY - 26, baseY - 12, dt, 2);
  mpole(g, cx + 7, baseY - 26, baseY - 12, dt, 2);
  for (let k = 0; k <= 9; k++) {
    for (let x = cx - 11 + k; x <= cx + 11 - k; x++) P(g, x, baseY - 26 - k, k === 9 ? dt[0] : x < cx ? dt[1] : dt[2]);
  }
  P(g, cx, baseY - 36, dt[0]);
  // a windlass + bucket hanging in the mouth
  for (let x = cx - 6; x <= cx + 6; x++) P(g, x, baseY - 24, dt[3]); // crossbar
  P(g, cx + 1, baseY - 23, bn[3]);
  for (let y = baseY - 23; y <= baseY - 16; y++) P(g, cx + 1, y, bn[3]); // rope
  mcrate(g, cx - 1, baseY - 16, 4, 4, dt);
  P(g, cx, baseY - 16, st[2]); // bucket
  outline(g, RAMP.void);
  return g;
}

/* =============================== SIGNPOST (24×40) =============================== */
function drawSignpost() {
  const g = makeGrid(24, 40),
    dt = RAMP.dirt,
    bn = RAMP.bone,
    gr = RAMP.grass,
    cx = 11,
    baseY = 37;
  groundOval(g, cx, baseY, 7, 2, RAMP.void, 1);
  mpole(g, cx, 6, baseY - 1, dt, 3);
  // two arrow boards pointing opposite ways
  function board(y, dir) {
    const x0 = dir > 0 ? cx + 3 : cx - 13,
      x1 = dir > 0 ? cx + 13 : cx - 3;
    for (let yy = y; yy < y + 5; yy++) for (let x = x0; x <= x1; x++) {
      let c = dt[1];
      if (yy === y) c = dt[0];
      if (yy === y + 4) c = dt[3];
      if (hash2(x, yy, 430) < 0.1) c = dt[2];
      P(g, x, yy, c);
    }
    // pointed tip
    const tip = dir > 0 ? x1 : x0;
    P(g, tip + dir, y + 1, dt[2]);
    P(g, tip + dir, y + 3, dt[3]);
    P(g, tip + 2 * dir, y + 2, dt[2]);
    // faint carved text marks
    for (let x = dir > 0 ? cx + 5 : cx - 11; x < (dir > 0 ? cx + 11 : cx - 5); x += 2) P(g, x, y + 2, bn[3]);
  }
  board(11, 1);
  board(20, -1);
  // moss at base
  P(g, cx - 3, baseY - 1, gr[2]);
  P(g, cx + 4, baseY - 1, gr[2]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== WAGON WRECK (64×40) =============================== */
function drawWagonWreck() {
  const g = makeGrid(64, 40),
    dt = RAMP.dirt,
    st = RAMP.stone,
    gr = RAMP.grass,
    baseY = 37,
    cx = 32;
  groundOval(g, cx, baseY, 28, 5, RAMP.void, 1);
  // toppled cart bed lying at an angle
  for (let y = baseY - 14; y <= baseY - 2; y++) for (let x = 10; x <= 44; x++) {
    const tilt = Math.round((x - 10) * 0.2);
    let c = dt[1];
    if (y - tilt < baseY - 12) c = dt[0];
    if (y - tilt > baseY - 5) c = dt[3];
    if (x % 6 === 0) c = dt[3]; // plank seams
    if (hash2(x, y, 440) < 0.1) c = dt[2];
    P(g, x, y - tilt + 6, c);
  }
  // one broken wheel (collapsed spokes) + one wheel still up
  function wheel(wx, wy, broken) {
    ell(g, wx, wy, 7, 7, (x, y, d) => {
      if (d > 0.78) P(g, x, y, dt[3]);else if (d > 0.62) P(g, x, y, dt[2]);
    });
    if (!broken) {
      for (let a = 0; a < 6; a++) {
        const ang = a / 6 * Math.PI * 2;
        for (let k = 0; k < 6; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(wy + Math.sin(ang) * k), dt[3]);
      }
      ell(g, wx, wy, 1.6, 1.6, (x, y) => P(g, x, y, st[2]));
    } else {
      for (let a = 0; a < 3; a++) {
        const ang = a / 6 * Math.PI * 2 + 0.4;
        for (let k = 0; k < 5; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(wy + Math.sin(ang) * k), dt[3]);
      }
    } // a couple snapped spokes
  }
  wheel(16, baseY - 7, false);
  wheel(45, baseY - 4, true);
  // a broken axle shaft jutting up
  for (let k = 0; k < 10; k++) P(g, 48 + k, baseY - 12 - k, dt[2]);
  // scattered crates spilling out
  mcrate(g, 30, baseY - 11, 9, 9, dt);
  mcrate(g, 40, baseY - 8, 7, 7, dt);
  // grass reclaiming
  for (let i = 0; i < 8; i++) {
    const x = 12 + Math.floor(hash2(i, 1, 441) * 40);
    P(g, x, baseY - 2, gr[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== RUINED HUT (80×72) =============================== */
function drawRuinedHut() {
  const g = makeGrid(80, 72),
    st = RAMP.stone,
    dt = RAMP.dirt,
    gr = RAMP.grass,
    baseY = 68,
    cx = 40;
  groundOval(g, cx, baseY, 34, 6, RAMP.void, 1);
  // crumbling stone walls — left wall tall, right wall broken low
  function wall(x0, x1, topFn) {
    for (let x = x0; x <= x1; x++) {
      const top = topFn(x);
      for (let y = top; y <= baseY - 1; y++) {
        let c = st[1];
        if (x < x0 + 3) c = st[0];
        if (x > x1 - 3) c = st[3];
        if ((x + y) % 4 === 0) c = st[3];
        if (hash2(x, y, 450) < 0.08) c = st[2];
        P(g, x, y, c);
      }
    }
  }
  // left + back wall (taller), jagged broken top
  wall(12, 40, x => 26 + Math.round(Math.sin(x * 0.7) * 2) + (x > 34 ? (x - 34) * 1.5 : 0));
  // right wall stub (collapsed)
  wall(50, 68, x => baseY - 14 + Math.round(Math.sin(x * 0.9) * 3) + (x < 56 ? -6 : 0));
  // doorway gap in the front
  for (let y = baseY - 16; y <= baseY - 1; y++) for (let x = 40; x <= 48; x++) P(g, x, y, null);
  for (let y = baseY - 16; y <= baseY - 1; y++) {
    P(g, 40, y, st[3]);
    P(g, 48, y, st[3]);
  } // door jambs
  // caved-in thatch roof — a sagging dark mass over the left half, broken open
  for (let x = 10; x <= 44; x++) {
    const topY = 22 + Math.round(Math.abs(x - 27) * 0.4);
    for (let k = 0; k < 6; k++) {
      const y = topY + k;
      if (hash2(x, y, 451) < 0.25) continue;
      let c = dt[2];
      if (k === 0) c = dt[1];
      if (k > 4) c = dt[3];
      P(g, x, y, c);
    }
  }
  // rubble pile + fallen beams in front of the broken wall
  for (let i = 0; i < 18; i++) {
    const x = 50 + Math.floor(hash2(i, 1, 452) * 18),
      y = baseY - 2 - Math.floor(hash2(i, 2, 452) * 4);
    P(g, x, y, hash2(i, 3, 452) < 0.5 ? st[2] : st[3]);
  }
  for (let k = 0; k < 12; k++) P(g, 52 + k, baseY - 6 - Math.round(k * 0.4), dt[3]); // fallen beam
  // grass + a sapling reclaiming the interior
  for (let i = 0; i < 14; i++) {
    const x = 14 + Math.floor(hash2(i, 4, 453) * 60);
    P(g, x, baseY - 1, gr[2]);
  }
  for (let y = baseY - 8; y <= baseY - 1; y++) P(g, 30, y, dt[2]);
  ell(g, 30, baseY - 9, 4, 4, (x, y, d) => P(g, x, y, d > 0.7 ? gr[2] : gr[1]));
  outline(g, RAMP.void);
  return g;
}

/* =============================== GRAVE ROW (64×32, ground decor) =============================== */
function drawGraveRow() {
  const g = makeGrid(64, 32),
    st = RAMP.stone,
    dt = RAMP.dirt,
    gr = RAMP.grass,
    baseY = 29;
  groundOval(g, 32, baseY, 30, 4, dt[3], 1);
  const stones = [[10, 12, 1], [24, 10, -1], [40, 13, 1], [54, 11, 0]];
  stones.forEach(([cx, h, lean], i) => {
    for (let y = baseY - 1; y >= baseY - h; y--) {
      const t = (baseY - y) / h;
      const off = Math.round(t * lean * 2);
      const w = 4;
      for (let x = -w; x <= w; x++) {
        let c = st[1];
        if (x < -w + 1) c = st[0];
        if (x > w - 1) c = st[3];
        if (hash2(cx + x, y, 460 + i) < 0.08) c = st[2];
        P(g, cx + x + off, y, c);
      }
    }
    // rounded top
    const off = Math.round(h / h * lean * 2);
    ell(g, cx + off, baseY - h, 4, 2, (x, y, d) => {
      if (y > baseY - h) return;
      P(g, x, y, d > 0.6 ? st[3] : st[1]);
    });
    // carved cross line
    P(g, cx + off - 1, baseY - h + 4, st[3]);
    P(g, cx + off + 1, baseY - h + 4, st[3]);
    P(g, cx + off, baseY - h + 3, st[3]);
    P(g, cx + off, baseY - h + 5, st[3]);
    // a little grave mound + grass
    groundOval(g, cx, baseY, 5, 2, dt[2], 5 + i);
    P(g, cx - 5, baseY, gr[2]);
    P(g, cx + 5, baseY - 1, gr[2]);
  });
  outline(g, RAMP.void);
  return g;
}

/* =============================== STANDING STONES (64×72, 2f shimmer) =============================== */
function drawStandingStones(frame) {
  frame = frame || 0;
  const g = makeGrid(64, 72),
    st = RAMP.stone,
    dr = RAMP.drift,
    gr = RAMP.grass,
    baseY = 68;
  groundOval(g, 32, baseY, 30, 6, dt3(), 1);
  function dt3() {
    return RAMP.dirt[3];
  }
  // a pair of tall monoliths + two shorter ones behind (a small ring)
  function monolith(cx, topY, hw, runeY) {
    for (let y = baseY - 1; y >= topY; y--) {
      const t = (baseY - y) / (baseY - topY);
      const w = Math.round(hw - t * 1.5);
      for (let x = -w; x <= w; x++) {
        let c = st[1];
        if (x < -w + 1) c = st[0];
        if (x > w - 1) c = st[3];
        if (hash2(cx + x, y, 470) < 0.07) c = st[2];
        if (hash2(cx + x, y, 471) < 0.02) c = st[3];
        P(g, cx + x, y, c);
      }
    }
    // chipped top
    P(g, cx - 1, topY - 1, st[1]);
    P(g, cx + hw, topY + 1, RAMP.void);
    // a faint drift rune, shimmers across the 2 frames
    if (runeY != null) {
      const lit = frame === 1;
      const rc = lit ? dr[0] : dr[3];
      [[cx - 1, runeY], [cx, runeY - 1], [cx + 1, runeY], [cx, runeY + 1], [cx, runeY + 2]].forEach(([rx, ry]) => P(g, rx, ry, rc));
      if (lit) for (let yy = runeY - 3; yy <= runeY + 4; yy++) for (let xx = -3; xx <= 3; xx++) {
        const d = Math.abs(xx) + Math.abs(yy - runeY);
        if (d > 2 && d < 4 && (xx + yy) % 2 === 0 && !G(g, cx + xx, yy)) P(g, cx + xx, yy, dr[3]);
      }
    }
  }
  // back pair (shorter, drawn first)
  monolith(20, 26, 4, null);
  monolith(44, 24, 4, null);
  // front pair (tall, with runes)
  monolith(14, 14, 5, 40);
  monolith(50, 12, 5, 38);
  // a fallen lintel stone leaning between
  for (let x = 26; x <= 40; x++) {
    const y = 30 + Math.round((x - 26) * 0.5);
    for (let k = 0; k < 4; k++) {
      let c = st[2];
      if (k === 0) c = st[1];
      if (k === 3) c = st[3];
      P(g, x, y + k, c);
    }
  }
  // grass tufts
  for (let i = 0; i < 8; i++) {
    const x = 8 + Math.floor(hash2(i, 1, 472) * 48);
    P(g, x, baseY - 1, gr[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== SCARECROW (24×44) =============================== */
function drawScarecrow() {
  const g = makeGrid(24, 44),
    dt = RAMP.dirt,
    gd = RAMP.gold,
    bl = RAMP.blood,
    bn = RAMP.bone,
    cx = 11,
    baseY = 41;
  groundOval(g, cx, baseY, 7, 2, RAMP.void, 1);
  // cross-post
  mpole(g, cx, 8, baseY - 1, dt, 3);
  for (let x = cx - 8; x <= cx + 9; x++) P(g, x, 18, dt[2]); // arm bar
  for (let x = cx - 8; x <= cx + 9; x++) P(g, x, 19, dt[3]);
  // straw stuffing at the arm ends + bottom
  [[cx - 9, 18], [cx + 10, 18]].forEach(([x, y]) => {
    for (let k = 0; k < 4; k++) {
      P(g, x + (x < cx ? -k : k) * 0, y + k - 1, gd[1]);
      P(g, x, y + k, gd[2]);
    }
  });
  for (let k = 0; k < 5; k++) {
    P(g, cx - 2 - k, 18 + k, gd[1]);
    P(g, cx + 3 + k, 18 + k, gd[2]);
  } // straw wrists
  // ragged blood-cloth tunic over the torso
  for (let y = 18; y <= 30; y++) {
    const w = 5 - Math.round((y - 18) / 6);
    for (let x = -w; x <= w; x++) {
      let c = bl[2];
      if (x < -w + 1) c = bl[1];
      if (x > w - 1) c = bl[3];
      if (hash2(cx + x, y, 480) < 0.15) c = dt[3];
      P(g, cx + x, y, c);
    }
  }
  // ragged hem
  for (let x = cx - 4; x <= cx + 4; x++) if (x % 2 === 0) P(g, x, 31, bl[3]);
  // burlap head with stitched face + straw hair + a tattered hat
  ell(g, cx, 12, 4, 4, (x, y, d, dx, dy) => {
    let c = bn[2];
    if (dy < -0.3) c = bn[1];
    if (d > 0.76) c = bn[3];
    if (hash2(x, y, 481) < 0.1) c = gd[2];
    P(g, x, y, c);
  });
  P(g, cx - 2, 11, RAMP.void);
  P(g, cx + 2, 11, RAMP.void); // stitched X eyes
  P(g, cx - 1, 14, dt[3]);
  P(g, cx, 14, dt[3]);
  P(g, cx + 1, 14, dt[3]); // stitched mouth
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, 8, dt[2]); // hat brim
  for (let x = cx - 3; x <= cx + 3; x++) P(g, x, 7, dt[3]);
  P(g, cx, 5, dt[2]); // hat crown
  for (let k = 0; k < 4; k++) {
    P(g, cx - 4 - 0, 9 + k, gd[1]);
    P(g, cx + 4, 9 + k, gd[2]);
  } // straw hair
  outline(g, RAMP.void);
  return g;
}

/* =============================== BEEHIVE (20×28, 2f bee motes) =============================== */
function drawBeehive(frame) {
  frame = frame || 0;
  const g = makeGrid(20, 28),
    gd = RAMP.gold,
    dt = RAMP.dirt,
    em = RAMP.ember,
    cx = 10,
    baseY = 25;
  groundOval(g, cx, baseY, 8, 2, RAMP.void, 1);
  // little wooden stand
  mpole(g, cx - 6, baseY - 4, baseY - 1, dt, 2);
  mpole(g, cx + 5, baseY - 4, baseY - 1, dt, 2);
  for (let x = cx - 7; x <= cx + 7; x++) P(g, x, baseY - 5, dt[2]);
  // woven straw skep — stacked tapering coils
  for (let y = baseY - 5; y >= baseY - 18; y--) {
    const t = (baseY - 5 - y) / 13,
      w = Math.round(7 - t * 4.5);
    for (let x = -w; x <= w; x++) {
      let c = gd[2];
      if (x < -w + 2) c = gd[1];
      if (x > w - 2) c = gd[3];
      if (y % 2 === 0) c = gd[3];
      P(g, cx + x, y, c);
    }
  }
  P(g, cx, baseY - 19, gd[1]); // knot at the top
  // dark entrance hole
  P(g, cx, baseY - 8, dt[3]);
  P(g, cx - 1, baseY - 8, dt[3]);
  P(g, cx, baseY - 7, dt[3]);
  // bee motes circling (move per frame)
  const bees = frame === 0 ? [[cx + 6, baseY - 12], [cx - 7, baseY - 9], [cx + 2, baseY - 22]] : [[cx + 8, baseY - 10], [cx - 5, baseY - 14], [cx - 2, baseY - 23]];
  bees.forEach(([bx, by]) => {
    P(g, bx, by, gd[0]);
    P(g, bx, by, em[1]);
    P(g, bx + 1, by, dt[3]);
  });
  outline(g, RAMP.void);
  return g;
}

/* =============================== HAY BALES (40×24) =============================== */
function drawHayBales() {
  const g = makeGrid(40, 24),
    gd = RAMP.gold,
    dt = RAMP.dirt,
    baseY = 22;
  groundOval(g, 20, baseY, 18, 3, RAMP.void, 1);
  function bale(cx, cy, r) {
    ell(g, cx, cy, r, r * 0.82, (x, y, d, dx, dy) => {
      let c = gd[2];
      if (dy < -0.3) c = gd[1];
      if (d > 0.78) c = gd[3];
      P(g, x, y, c);
    });
    // horizontal binding lines + straw texture
    for (let yy = Math.round(cy - r * 0.5); yy <= cy + r * 0.5; yy += 3) for (let x = cx - r; x <= cx + r; x++) if (hash2(x, yy, 490) < 0.5) P(g, x, yy, gd[3]);
    ell(g, cx, cy, r * 0.95, r * 0.78, (x, y, d) => {
      if (d > 0.85) P(g, x, y, gd[3]);
    }); // rim
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI;
      P(g, Math.round(cx + Math.cos(a) * r * 0.7), Math.round(cy - Math.abs(Math.sin(a)) * r * 0.5), gd[0]);
    } // loose straw
  }
  // two on the ground, one stacked on top
  bale(11, baseY - 6, 9);
  bale(29, baseY - 6, 9);
  bale(20, baseY - 15, 8);
  outline(g, RAMP.void);
  return g;
}

/* =============================== OLD CAMPFIRE (32×28, faint 2f embers) =============================== */
function drawOldCampfire(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 28),
    st = RAMP.stone,
    dt = RAMP.dirt,
    em = RAMP.ember,
    cx = 16,
    baseY = 25;
  // scorched ash patch
  ell(g, cx, baseY - 1, 12, 4, (x, y, d) => {
    if (d > 0.85 && (x + y) % 2) return;
    P(g, x, y, d < 0.4 ? RAMP.void : hash2(x, y, 500) < 0.4 ? RAMP.ash : dt[3]);
  });
  // cold stone ring
  for (let a = 0; a < 8; a++) {
    const ang = a / 8 * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * 11),
      sy = Math.round(baseY - 2 + Math.sin(ang) * 4);
    shadeMass(g, sx, sy, 2.6, 2, st, 30 + a);
  }
  // charred crossed logs (cold, dark)
  for (let k = -6; k <= 6; k++) {
    P(g, cx + k, baseY - 3 + Math.round(k * 0.2), dt[3]);
    P(g, cx + k, baseY - 4 + Math.round(k * 0.2), RAMP.void);
  }
  for (let k = -6; k <= 6; k++) P(g, cx + Math.round(k * 0.25), baseY - 3 - Math.abs(Math.round(k * 0.2)), dt[3]);
  // a few faint embers still glowing (pulse per frame)
  const e = frame === 0 ? [[cx - 2, baseY - 3], [cx + 3, baseY - 2]] : [[cx, baseY - 3], [cx - 3, baseY - 2]];
  e.forEach(([x, y]) => {
    P(g, x, y, em[2]);
    P(g, x, y, frame === 0 ? em[1] : em[3]);
  });
  // a thin wisp of smoke
  P(g, cx, baseY - 6 - frame, RAMP.bone[3]);
  P(g, cx + (frame ? 1 : -1), baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== FENCE (48×20, tileable) =============================== */
function drawFence() {
  const g = makeGrid(48, 20),
    dt = RAMP.dirt,
    gr = RAMP.grass,
    baseY = 18;
  // posts at a tileable spacing (0, 16, 32, and a 48-edge post for seamless tiling)
  for (const px of [2, 18, 34]) {
    mpole(g, px, 4, baseY - 1, dt, 3);
    groundOval(g, px + 1, baseY, 4, 1.5, RAMP.void, px);
  }
  mpole(g, 46, 4, baseY - 1, dt, 2); // edge post (meets the next tile's x=2 post region visually)
  // two split rails spanning the full width (run off both edges to tile)
  for (const ry of [7, 12]) for (let x = 0; x < 48; x++) {
    let c = dt[1];
    if (x % 7 < 1) c = dt[3];
    if (hash2(x, ry, 510) < 0.12) c = dt[2];
    P(g, x, ry, c);
    P(g, x, ry + 1, dt[3]);
  }
  // grass along the base
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(hash2(i, 1, 511) * 48);
    P(g, x, baseY - 1, gr[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== FISHING SPOT (40×28, 2f water lap) =============================== */
function drawFishingSpot(frame) {
  frame = frame || 0;
  const g = makeGrid(40, 28),
    dt = RAMP.dirt,
    wt = RAMP.water,
    bn = RAMP.bone,
    em = RAMP.ember,
    baseY = 25;
  // water area
  for (let y = baseY - 7; y <= baseY; y++) for (let x = 2; x < 38; x++) {
    let c = (x + y) % 2 === 0 ? wt[1] : wt[2];
    if (y > baseY - 2) c = wt[3];
    P(g, x, y, c);
  }
  // a tiny plank jetty jutting from the left bank
  mpole(g, 8, baseY - 6, baseY - 1, dt, 2);
  mpole(g, 16, baseY - 6, baseY - 1, dt, 2); // posts
  for (let x = 3; x <= 22; x++) {
    const y = baseY - 8;
    for (let j = 0; j < 3; j++) {
      let c = dt[1];
      if (j === 0) c = dt[0];
      if (j === 2) c = dt[3];
      P(g, x, y + j, c);
    }
    if (x % 6 === 0) P(g, x, y, dt[3]);
  }
  // bank / grass behind the jetty
  for (let x = 0; x < 6; x++) for (let y = baseY - 10; y <= baseY; y++) P(g, x, y, RAMP.grass[2]);
  // a fishing float bobbing on the water (laps per frame) + ripple ring
  const fx = 30,
    fy = baseY - 4 + (frame === 1 ? 1 : 0);
  P(g, fx, fy - 1, bn[0]);
  P(g, fx, fy, em[1]);
  P(g, fx, fy + 1, em[2]);
  for (let a = 0; a < 8; a++) {
    const ang = a / 8 * Math.PI * 2;
    const rx = Math.round(fx + Math.cos(ang) * (frame === 0 ? 3 : 4)),
      ry = Math.round(fy + Math.sin(ang) * (frame === 0 ? 1.5 : 2));
    P(g, rx, ry, wt[0]);
  }
  // a thin fishing line from the jetty to the float
  for (let x = 22; x <= fx; x++) P(g, x, baseY - 8 + Math.round((x - 22) / (fx - 22) * (fy - (baseY - 8))), bn[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== BRIDGE (96×40) =============================== */
function drawBridge() {
  const g = makeGrid(96, 40),
    dt = RAMP.dirt,
    wt = RAMP.water,
    st = RAMP.stone,
    baseY = 34,
    cx = 48;
  // a gap with water below
  for (let y = baseY - 2; y <= baseY + 4; y++) for (let x = 4; x < 92; x++) {
    if (y > 38) break;
    let c = (x + y) % 2 === 0 ? wt[1] : wt[2];
    P(g, x, y, c);
  }
  // support posts down into the gap
  for (const px of [16, 48, 80]) {
    mpole(g, px, baseY - 4, baseY + 3, dt, 3);
    P(g, px, baseY + 3, wt[0]);
    P(g, px + 4, baseY + 3, wt[0]);
  }
  // a gently arched plank deck spanning the width
  for (let x = 2; x <= 93; x++) {
    const t = (x - 47.5) / 47.5;
    const y = baseY - 8 - Math.round((1 - t * t) * 4); // arch
    for (let j = 0; j < 4; j++) {
      let c = dt[1];
      if (j === 0) c = dt[0];
      if (j === 3) c = dt[3];
      P(g, x, y + j, c);
    }
    if (x % 6 === 0) for (let j = 0; j < 4; j++) P(g, x, y + j, dt[3]); // plank gaps
  }
  // hand rails (posts + top rail) following the arch
  for (let x = 4; x <= 91; x += 1) {
    const t = (x - 47.5) / 47.5;
    const y = baseY - 8 - Math.round((1 - t * t) * 4);
    if (x % 12 === 0) for (let k = 1; k <= 5; k++) P(g, x, y - k, dt[2]);
  }
  for (let x = 4; x <= 91; x++) {
    const t = (x - 47.5) / 47.5;
    const y = baseY - 13 - Math.round((1 - t * t) * 4);
    P(g, x, y, dt[2]);
    P(g, x, y + 1, dt[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const MICROPOI = {
  well: {
    fn: () => drawWell(),
    cell: [32, 40],
    anchor: [16, 37]
  },
  signpost: {
    fn: () => drawSignpost(),
    cell: [24, 40],
    anchor: [11, 37]
  },
  wagon_wreck: {
    fn: () => drawWagonWreck(),
    cell: [64, 40],
    anchor: [32, 37],
    footprint: '2x1'
  },
  ruined_hut: {
    fn: () => drawRuinedHut(),
    cell: [80, 72],
    anchor: [40, 68],
    footprint: '3x3'
  },
  grave_row: {
    fn: () => drawGraveRow(),
    cell: [64, 32],
    anchor: [32, 29],
    ground: true
  },
  standing_stones: {
    fn: i => drawStandingStones(i),
    cell: [64, 72],
    anchor: [32, 68],
    frames: 2,
    anim: {
      name: 'shimmer',
      fps: 2,
      loop: true
    },
    footprint: '2x2'
  },
  scarecrow: {
    fn: () => drawScarecrow(),
    cell: [24, 44],
    anchor: [11, 41]
  },
  beehive: {
    fn: i => drawBeehive(i),
    cell: [20, 28],
    anchor: [10, 25],
    frames: 2,
    anim: {
      name: 'bees',
      fps: 3,
      loop: true
    }
  },
  hay_bales: {
    fn: () => drawHayBales(),
    cell: [40, 24],
    anchor: [20, 22]
  },
  old_campfire: {
    fn: i => drawOldCampfire(i),
    cell: [32, 28],
    anchor: [16, 25],
    frames: 2,
    anim: {
      name: 'embers',
      fps: 2,
      loop: true
    }
  },
  fence: {
    fn: () => drawFence(),
    cell: [48, 20],
    anchor: [24, 18],
    tileable: 'x'
  },
  fishing_spot: {
    fn: i => drawFishingSpot(i),
    cell: [40, 28],
    anchor: [20, 25],
    frames: 2,
    anim: {
      name: 'water_lap',
      fps: 2,
      loop: true
    }
  },
  bridge: {
    fn: () => drawBridge(),
    cell: [96, 40],
    anchor: [48, 34],
    footprint: '3x1'
  }
};
Object.assign(globalThis, {
  mpole,
  mplank,
  mcrate,
  groundOval,
  drawWell,
  drawSignpost,
  drawWagonWreck,
  drawRuinedHut,
  drawGraveRow,
  drawStandingStones,
  drawScarecrow,
  drawBeehive,
  drawHayBales,
  drawOldCampfire,
  drawFence,
  drawFishingSpot,
  drawBridge,
  MICROPOI
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/micropoi.js", error: String((e && e.message) || e) }); }

// assets/_gen/minibosses.js
try { (() => {
// Naevyr CAMP MINI-BOSSES — Colossus-scale, one per Frontier camp.
// Eval after pixlib.js + tiles.js + beasts.js (ell, shadeMass, spike, moteBurst).
// Same rig as beasts.js: drawX(facing, anim, f) -> grid. 5 facings s/se/e/ne/n,
// bottom-center anchor, 1px void outline, RAMP only. TOP 4px CLEAR for HP/level UI.
// anims: idle 2 · walk 6 · attack 4. Each also has a 48×64 boss-alert "banner" portrait.
//   drowned_king 110×110 (Drowned Ruins) · barrow_lord 110×116 (Barrow-Crypt)
//   ash_warlord  100×110 (Ashen Warcamp)

/* shared: a thick limb segment (boulder/bone leg) bottom→top with iso shading */
function pillarLeg(g, cx, topY, botY, hw, ramp, seed) {
  for (let y = topY; y <= botY; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    let c = ramp[1];
    if (x < cx - hw + 2) c = ramp[0];
    if (x > cx + hw - 2) c = ramp[3];
    if (seed != null && hash2(x, y, seed) < 0.06) c = ramp[2];
    P(g, x, y, c);
  }
}

/* ============================ 1 · THE DROWNED KING (110×110) ============================ */
// Bloated waterlogged monarch: tattered royal robe, barnacle-crusted shoulders, kelp
// strands, a broken gold crown, drowned-pale glare. Drags a great rusted anchor-cleaver.
// water + stone(robe) + bone(barnacle) + gold(crown) + grass(kelp) + drift(eyes).
function drawDrownedKing(facing, anim, f) {
  const g = makeGrid(110, 110);
  const wa = RAMP.water,
    st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold,
    gr = RAMP.grass,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 3, 6, 3, 0][dir],
    cx = 55 + lean,
    groundY = 106;
  let bob = 0,
    armUp = 0,
    sway = 0,
    glow = 0;
  if (anim === 'idle') {
    bob = f === 1 ? -1 : 0;
    glow = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    bob = [0, -2, 0, 0, -2, 0][f];
    sway = [0, 1, 2, 0, -1, -2][f];
  }
  if (anim === 'attack') {
    armUp = [10, 16, -10, -4][f];
    glow = [1, 2, 2, 1][f];
    bob = [-1, -2, 2, 1][f];
  }

  // puddle / wet apron
  ell(g, cx, groundY, 40, 7, (x, y, d) => P(g, x, y, d > 0.6 ? wa[3] : hash2(x, y, 300) < 0.4 ? wa[2] : wa[3]));
  // two bloated legs under the robe
  [[-16, 0], [15, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && (f + i) % 2 === 0 ? 4 : 0;
    pillarLeg(g, cx + lx + (i ? -sway : sway), groundY - 26, groundY - lift, 8, wa, 301);
    P(g, cx + lx, groundY - lift, RAMP.void);
  });
  // robe-draped bloated body (wide belly)
  const tx = cx + (profile ? 4 : 0),
    tTop = groundY - 78 + bob,
    tBot = groundY - 18;
  for (let y = tTop; y <= tBot; y++) {
    const t = (y - tTop) / (tBot - tTop);
    const w = Math.round(20 + Math.sin(t * Math.PI) * 12); // bulge at the belly
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1];
      if (x < tx - w + 4) c = st[0];
      if (x > tx + w - 4) c = st[3];
      if (hash2(x, y, 302) < 0.05) c = st[2];
      // soaked lower robe (water-darkened) + drip seam
      if (t > 0.66) {
        c = wa[2];
        if (x < tx - w + 4) c = wa[1];
        if (x > tx + w - 4) c = wa[3];
        if (hash2(x, y, 303) < 0.12) c = wa[3];
      }
      P(g, x, y, c);
    }
  }
  // kelp strands hanging off the hem
  for (let i = -3; i <= 3; i++) {
    const sx = tx + i * 9;
    for (let k = 0; k < 5 + (i % 2 ? 2 : 0); k++) P(g, sx + Math.round(Math.sin(k + f) * 0.8), tBot + k, gr[2 + (k > 3 ? 1 : 0)]);
  }
  // barnacle clusters on the shoulders (bone nubs)
  [[-20, tTop + 6], [20, tTop + 7], [-14, tTop + 2]].forEach(([ox, oy], i) => {
    ell(g, tx + ox, oy, 4, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2]));
    P(g, tx + ox, oy, bn[1]);
  });
  // ribs of a sunken crown of office on the chest (gold medallion)
  P(g, tx, tTop + 22, gd[1]);
  P(g, tx - 1, tTop + 22, gd[2]);
  P(g, tx + 1, tTop + 22, gd[2]);
  P(g, tx, tTop + 21, gd[0]);
  // arms: left rests, right drags / raises the anchor-cleaver
  // left arm (rests at side)
  if (!back) {
    const ax = tx - 22;
    for (let y = tTop + 8; y <= tTop + 34; y++) {
      P(g, ax, y, wa[1]);
      P(g, ax + 1, y, wa[2]);
    }
    shadeMass(g, ax, tTop + 36, 4, 3, wa, 304);
  }
  // weapon arm (right)
  const shX = tx + 20,
    shY = tTop + 8;
  const wRaise = anim === 'attack' ? armUp : anim === 'idle' ? 0 : sway;
  for (let y = shY; y <= shY + 26 - Math.max(0, wRaise); y++) {
    P(g, shX, y, wa[1]);
    P(g, shX + 1, y, wa[2]);
    P(g, shX - 1, y, wa[2]);
  }
  // the great rusted anchor-cleaver
  const hgx = shX + 2,
    hgy = shY + 26 - Math.max(0, wRaise);
  if (!back) {
    if (anim === 'attack' && f >= 2) {
      // crashing down to the ground in front
      for (let k = 0; k < 30; k++) P(g, hgx + 2 + Math.round(k * 0.2), hgy + k, st[3]); // haft swung forward
      const bx = hgx + 8,
        by = hgy + 28;
      for (let yy = 0; yy < 16; yy++) for (let xx = -10; xx <= 4; xx++) {
        if (xx < -10 + yy * 0.4) continue;
        let c = bn[3];
        if (xx < -6) c = st[2];
        if (hash2(bx + xx, by + yy, 305) < 0.2) c = RAMP.ember[3];
        P(g, bx + xx, by + yy, c);
      } // rusted cleaver head
      // impact splash
      if (f === 2) for (let i = 0; i < 12; i++) {
        const a = Math.PI + i / 12 * Math.PI;
        P(g, Math.round(bx + Math.cos(a) * 14), Math.round(by + 12 + Math.sin(a) * 6), wa[0]);
      }
    } else {
      // shouldered / dragging
      for (let k = 0; k < 30; k++) P(g, hgx + Math.round(k * 0.1), hgy - k, st[3]); // haft up over the shoulder
      const bx = hgx + 2,
        by = hgy - 30;
      for (let yy = 0; yy < 14; yy++) for (let xx = -3; xx <= 9; xx++) {
        if (xx > 9 - yy * 0.3) continue;
        let c = bn[3];
        if (xx > 5) c = st[2];
        if (hash2(bx + xx, by + yy, 306) < 0.2) c = RAMP.ember[3];
        P(g, bx + xx, by + yy, c);
      }
    }
  }
  // head: kelp-draped, broken gold crown, drowned glare
  const hx = tx + (profile ? 5 : 0),
    hy = tTop - 6 + bob;
  shadeMass(g, hx, hy, 10, 8, wa, 307);
  // crown (broken, askew)
  for (let i = -8; i <= 8; i += 2) {
    const ch = i === -2 || i === 4 ? 0 : 2 + (Math.abs(i) % 4 === 0 ? 1 : 0);
    for (let k = 0; k < ch; k++) P(g, hx + i, hy - 8 - k, gd[1]);
  }
  for (let x = hx - 8; x <= hx + 8; x++) P(g, x, hy - 7, gd[2]);
  // kelp over the brow
  for (let i = -6; i <= 6; i += 2) P(g, hx + i, hy - 5 + (i % 4 ? 1 : 0), gr[1]);
  // drowned eyes
  if (!back) {
    const lit = glow > 0 || anim === 'attack';
    if (profile) P(g, hx + 6, hy - 1, lit ? dr[0] : wa[0]);else {
      P(g, hx - 4, hy - 1, lit ? dr[0] : wa[0]);
      P(g, hx + 4, hy - 1, lit ? dr[0] : wa[0]);
    }
    for (let x = hx - 5; x <= hx + 5; x++) P(g, x, hy + 4, wa[3]); // grim slack jaw
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · THE BARROW LORD (110×116) ============================ */
// Crowned skeletal giant: colossal bone frame, tattered burial mantle, tarnished crown,
// drift-fire sockets, bone shards orbiting. Cleaves with a great bone blade.
// bone + stone(mantle) + gold(crown) + drift(sockets/magic).
function drawBarrowLord(facing, anim, f) {
  const g = makeGrid(110, 116);
  const bn = RAMP.bone,
    st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 3, 6, 3, 0][dir],
    cx = 55 + lean,
    groundY = 112;
  let bob = 0,
    armUp = 0,
    sway = 0,
    glow = 0;
  if (anim === 'idle') {
    bob = f === 1 ? -1 : 0;
    glow = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    bob = [0, -2, 0, 0, -2, 0][f];
    sway = [0, 1, 2, 0, -1, -2][f];
  }
  if (anim === 'attack') {
    armUp = [12, 18, -12, -5][f];
    glow = [1, 2, 2, 1][f];
    bob = [-1, -2, 2, 1][f];
  }

  // bone legs (femurs)
  [[-14, 0], [14, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && (f + i) % 2 === 0 ? 4 : 0;
    const lxx = cx + lx + (i ? -sway : sway);
    for (let y = groundY - 30; y <= groundY - lift; y++) {
      const w = 5 - Math.round(Math.abs(y - (groundY - 15)) / 14);
      P(g, lxx - w, y, bn[2]);
      for (let x = lxx - w + 1; x <= lxx + w - 1; x++) P(g, x, y, bn[1]);
      P(g, lxx + w, y, bn[3]);
    }
    P(g, lxx, groundY - lift, RAMP.void);
    ell(g, lxx, groundY - lift - 1, 5, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2])); // knee knob
  });
  // ribcage torso
  const tx = cx + (profile ? 4 : 0),
    tTop = groundY - 80 + bob,
    tBot = groundY - 28;
  // spine
  for (let y = tTop; y <= tBot; y++) P(g, tx, y, bn[2]);
  // ribs (curved pairs)
  for (let r = 0; r < 7; r++) {
    const ry = tTop + 6 + r * 6;
    const span = 16 - r;
    for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) {
      const x = tx + s * k,
        y = ry + Math.round(k / span * (k / span) * 7);
      P(g, x, y, k > span - 2 ? bn[2] : bn[1]);
    }
  }
  // tattered burial mantle over the shoulders (stone, sways)
  for (let y = tTop - 2; y <= tBot - 6; y++) {
    const t = (y - (tTop - 2)) / (tBot - 6 - (tTop - 2));
    const w = Math.round(20 + t * 6);
    for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 6; x++) {
      const xx = tx + s * (w - x) + (y > tBot - 16 ? Math.round(sway * t) : 0);
      let c = st[1];
      if (x === 0) c = st[0];
      if (x > 4) c = st[3];
      if (hash2(xx, y, 311) < 0.06) c = st[2];
      P(g, xx, y, c);
    }
  }
  // tattered mantle hem
  for (let x = tx - 26; x <= tx + 26; x++) {
    const yy = tBot - 6 + Math.round(Math.sin(x * 0.5) * 1.5);
    if (Math.abs(x - tx) > 14 && hash2(x, 0, 312) < 0.7) P(g, x, yy, st[3]);
  }
  // floating bone shards orbiting (denser on idle f1 / attack)
  if (glow > 0 || anim === 'attack') {
    [[-30, tTop + 14], [32, tTop + 24], [-26, tTop + 40], [30, tTop + 6]].forEach(([ox, oy], i) => {
      for (let k = 0; k < 3; k++) P(g, tx + ox, oy + k, k === 1 ? bn[0] : bn[2]);
    });
  }
  // arms (humeri) + great bone blade in the right
  if (!back) {
    const ax = tx - 20;
    for (let y = tTop + 4; y <= tTop + 30; y++) {
      P(g, ax, y, bn[1]);
      P(g, ax - 1, y, bn[2]);
      P(g, ax + 1, y, bn[3]);
    }
    ell(g, ax, tTop + 32, 4, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2]));
  }
  const shX = tx + 18,
    shY = tTop + 4;
  const wRaise = anim === 'attack' ? armUp : anim === 'idle' ? 0 : sway;
  for (let y = shY; y <= shY + 24 - Math.max(0, wRaise); y++) {
    P(g, shX, y, bn[1]);
    P(g, shX + 1, y, bn[3]);
    P(g, shX - 1, y, bn[2]);
  }
  const hgx = shX,
    hgy = shY + 24 - Math.max(0, wRaise);
  if (!back) {
    if (anim === 'attack' && f >= 2) {
      // blade cleaving down
      for (let k = 0; k < 34; k++) {
        const x = hgx + 4 + Math.round(k * 0.2),
          y = hgy + k;
        const w = 1 + Math.round(k / 10);
        for (let i = -1; i <= w; i++) P(g, x + i, y, i === w ? bn[3] : i < 0 ? bn[0] : bn[1]);
      }
      if (f === 2) moteBurst(g, hgx + 12, hgy + 30, 10, 0.6, 313); // drift edge flare
    } else {
      // raised over the shoulder
      for (let k = 0; k < 36; k++) {
        const x = hgx - Math.round(k * 0.1),
          y = hgy - k;
        const w = 1 + Math.round(k / 11);
        for (let i = -1; i <= w; i++) P(g, x + i, y, i === w ? bn[3] : i < 0 ? bn[0] : bn[1]);
      }
    }
  }
  // crowned skull
  const hx = tx + (profile ? 5 : 0),
    hy = tTop - 10 + bob;
  for (let y = hy - 8; y <= hy + 7; y++) for (let x = hx - 9; x <= hx + 9; x++) {
    if (Math.abs(x - hx) + Math.abs(y - hy) > 13) continue;
    let c = bn[1];
    if (x < hx - 4) c = bn[0];
    if (y > hy + 3) c = bn[2];
    if (x > hx + 5) c = bn[3];
    P(g, x, y, c);
  }
  // jaw + teeth
  for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy + 8, bn[2]);
  for (let x = hx - 5; x <= hx + 5; x += 2) P(g, x, hy + 7, bn[3]);
  // tarnished crown
  for (let i = -8; i <= 8; i += 2) {
    const chh = 2 + (Math.abs(i) % 4 === 0 ? 1 : 0);
    for (let k = 0; k < chh; k++) P(g, hx + i, hy - 9 - k, gd[2]);
    P(g, hx + i, hy - 9, gd[1]);
  }
  for (let x = hx - 8; x <= hx + 8; x++) P(g, x, hy - 8, gd[2]);
  // drift-fire sockets
  if (!back) {
    const lit = glow > 0 || anim === 'attack';
    if (profile) {
      for (let y = hy - 3; y <= hy; y++) P(g, hx + 5, y, RAMP.void);
      P(g, hx + 5, hy - 1, lit ? dr[0] : dr[1]);
    } else {
      for (const ox of [-4, 4]) {
        for (let y = hy - 3; y <= hy; y++) P(g, hx + ox, y, RAMP.void);
        P(g, hx + ox, hy - 1, lit ? dr[0] : dr[1]);
      }
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · THE ASH WARLORD (100×110) ============================ */
// Ember-armored raider champion: heavy ash plate veined with ember, horned helm with a
// burning visor, blood war-cloak, great ember-hot blade (two-handed overhead slash).
// dirt/stone(plate) + ember(forge cracks/blade) + gold(trim) + blood(cloak) + bone(horns).
function drawAshWarlord(facing, anim, f) {
  const g = makeGrid(100, 110);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    em = RAMP.ember,
    gd = RAMP.gold,
    bl = RAMP.blood,
    bn = RAMP.bone;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 3, 5, 3, 0][dir],
    cx = 50 + lean,
    groundY = 106;
  let bob = 0,
    armUp = 0,
    sway = 0,
    hot = 0;
  if (anim === 'idle') {
    bob = f === 1 ? -1 : 0;
    hot = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    bob = [0, -2, 0, 0, -2, 0][f];
    sway = [0, 1, 2, 0, -1, -2][f];
  }
  if (anim === 'attack') {
    armUp = [14, 20, -14, -6][f];
    hot = [1, 2, 2, 1][f];
    bob = [-1, -2, 2, 1][f];
  }

  // blood war-cloak behind (drawn first)
  if (!profile) {
    for (let y = groundY - 74 + bob; y <= groundY - 6; y++) {
      const t = (y - (groundY - 74 + bob)) / 68;
      const w = Math.round(16 + t * 10);
      for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 5; x++) {
        const xx = cx + s * (w - x) + (y > groundY - 24 ? Math.round(sway) : 0);
        let c = bl[2];
        if (x === 0) c = bl[1];
        if (x > 3) c = bl[3];
        P(g, xx, y, c);
      }
    }
  }
  // armored legs (greaves)
  [[-13, 0], [13, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && (f + i) % 2 === 0 ? 4 : 0;
    pillarLeg(g, cx + lx + (i ? -sway : sway), groundY - 30, groundY - lift, 7, dt, 321);
    // ember knee crack + gold trim
    P(g, cx + lx, groundY - 16, em[hot ? 0 : 2]);
    for (let x = cx + lx - 6; x <= cx + lx + 6; x++) P(g, x, groundY - 22, gd[3]);
    P(g, cx + lx, groundY - lift, RAMP.void);
  });
  // heavy plate torso
  const tx = cx + (profile ? 3 : 0),
    tTop = groundY - 74 + bob,
    tBot = groundY - 26;
  for (let y = tTop; y <= tBot; y++) {
    const t = (y - tTop) / (tBot - tTop);
    const w = Math.round(19 - t * 4);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = dt[1];
      if (x < tx - w + 4) c = dt[0];
      if (x > tx + w - 4) c = dt[3];
      if (hash2(x, y, 322) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  // ember forge-cracks across the plate
  [[-8, 10], [5, 16], [-2, 24], [9, 12], [-10, 30], [2, 36]].forEach(([ox, oy]) => {
    const x = tx + ox,
      y = tTop + oy;
    P(g, x, y, hot ? em[0] : em[2]);
    P(g, x, y + 1, hot ? em[1] : em[3]);
    if (hot >= 2) P(g, x + 1, y, gd[0]);
  });
  // gold pauldron trim + a trophy skull on the left shoulder
  for (let x = tx - 20; x <= tx - 8; x++) P(g, x, tTop + 4, gd[2]);
  for (let x = tx + 8; x <= tx + 20; x++) P(g, x, tTop + 4, gd[2]);
  shadeMass(g, tx - 18, tTop + 2, 5, 4, dt, 323);
  P(g, tx - 18, tTop + 1, bn[1]);
  P(g, tx - 19, tTop + 2, RAMP.void);
  P(g, tx - 17, tTop + 2, RAMP.void);
  // arms (pauldrons + gauntlets); right wields the great blade two-handed
  [[-1, -17], [1, 17]].forEach(([sgn, ox]) => {
    const shX = tx + ox,
      shY = tTop + 3;
    shadeMass(g, shX, shY + 2, 6, 4, dt, 324); // pauldron
    const drop = anim === 'attack' && sgn > 0 ? armUp : anim === 'attack' ? Math.round(armUp * 0.6) : 0;
    for (let y = shY + 4; y <= shY + 20; y++) {
      const yy = y - drop;
      for (let x = shX - 3; x <= shX + 3; x++) {
        let c = dt[1];
        if (x < shX - 1) c = dt[0];
        if (x > shX + 1) c = dt[3];
        P(g, x, Math.round(yy), c);
      }
    }
    shadeMass(g, shX, shY + 22 - drop, 4, 3, st, 325); // gauntlet fist
  });
  // the great ember blade (held by the right fist)
  if (!back) {
    const fistX = tx + 17,
      fistY = tTop + 25 - (anim === 'attack' ? armUp : 0);
    if (anim === 'attack' && f >= 2) {
      // overhead slash crashing forward-down
      for (let k = 0; k < 46; k++) {
        const x = fistX + 2 + Math.round(k * 0.5),
          y = fistY - 6 + k;
        const w = 2 + Math.round(k / 12);
        for (let i = -1; i <= w; i++) {
          let c = st[0];
          if (i === w) c = st[3];
          if (i >= 0 && i < w) c = hash2(x, y, 326) < 0.5 ? em[hot ? 0 : 1] : st[1];
          P(g, x + i, y, c);
        }
      }
      if (f === 2) for (let i = 0; i < 14; i++) {
        const a = Math.PI * 0.2 + i / 14 * Math.PI * 0.7;
        P(g, Math.round(fistX + 22 + Math.cos(a) * 16), Math.round(fistY + 28 + Math.sin(a) * 10), em[i % 2 ? 0 : 1]);
      } // fire arc
    } else {
      // raised high overhead (windup / idle ready)
      for (let k = 0; k < 48; k++) {
        const x = fistX - Math.round(k * 0.08),
          y = fistY - 6 - k;
        const w = 2 + Math.round(k / 13);
        for (let i = -1; i <= w; i++) {
          let c = st[0];
          if (i === w) c = st[3];
          if (i >= 0 && i < w) c = hash2(x, y, 327) < 0.5 ? em[hot ? 0 : 1] : st[1];
          P(g, x + i, y, c);
        }
      }
      // crossguard
      for (let x = fistX - 5; x <= fistX + 5; x++) P(g, x, fistY - 4, gd[2]);
    }
  }
  // horned helm with burning visor
  const hx = tx + (profile ? 4 : 0),
    hy = tTop - 8 + bob;
  shadeMass(g, hx, hy, 8, 7, dt, 328);
  // horns (bone, curving up-out)
  for (let s = -1; s <= 1; s += 2) {
    for (let k = 0; k < 6; k++) P(g, hx + s * (7 + Math.round(k * 0.4)), hy - 4 - k, k > 3 ? bn[0] : bn[2]);
  }
  // gold helm ridge
  for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy - 6, gd[2]);
  P(g, hx, hy - 8, gd[1]);
  // burning visor slit
  if (!back) {
    const lit = hot || anim === 'attack';
    if (profile) {
      for (let x = hx + 2; x <= hx + 6; x++) P(g, x, hy, RAMP.void);
      P(g, hx + 5, hy, lit ? em[0] : em[1]);
    } else {
      for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy + 1, RAMP.void);
      for (let x = hx - 5; x <= hx + 5; x += 2) P(g, x, hy + 1, lit ? em[0] : em[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}
const BOSS_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const MINIBOSSES = {
  drowned_king: {
    fn: 'drawDrownedKing',
    cell: [110, 110],
    anims: [['idle', 2], ['walk', 6], ['attack', 4]],
    hurt: 'water-hi (#4a7fa0) then bone-hi',
    camp: 'Drowned Ruins'
  },
  barrow_lord: {
    fn: 'drawBarrowLord',
    cell: [110, 116],
    anims: [['idle', 2], ['walk', 6], ['attack', 4]],
    hurt: 'bone-hi (#efe9f4) then drift-hi',
    camp: 'Barrow-Crypt'
  },
  ash_warlord: {
    fn: 'drawAshWarlord',
    cell: [100, 110],
    anims: [['idle', 2], ['walk', 6], ['attack', 4]],
    hurt: 'ember-hi (#fcd34d)',
    camp: 'Ashen Warcamp'
  }
};

// 48×64 boss-alert banner portrait — a menacing bust, 2f idle, drawn from the s-facing.
function drawBossPortrait(name, f) {
  const g = makeGrid(48, 64);
  const fn = globalThis[MINIBOSSES[name].fn];
  const src = fn('s', 'idle', f || 0);
  const [cw, ch] = MINIBOSSES[name].cell;
  // crop the head+shoulders band from the big sprite and 1.6×-ish fit into the bust
  const cropX0 = Math.round(cw / 2 - 22),
    cropY0 = Math.round(ch * 0.0) + (name === 'ash_warlord' ? 18 : 14);
  const cropW = 44,
    cropH = 40,
    sc = 48 / cropW;
  for (let y = 0; y < cropH; y++) for (let x = 0; x < cropW; x++) {
    const v = G(src, cropX0 + x, cropY0 + y);
    if (!v) continue;
    const px = Math.round(x * sc),
      py = 6 + Math.round(y * sc);
    fillRect(g, px, py, Math.ceil(sc), Math.ceil(sc), v.c);
  }
  // bottom banner bar + name notch
  for (let x = 0; x < 48; x++) P(g, x, 60, RAMP.void);
  for (let x = 0; x < 48; x++) if ((x + (f || 0)) % 2 === 0) P(g, x, 61, RAMP.blood[3]);
  outline(g, RAMP.void);
  return g;
}
Object.assign(globalThis, {
  pillarLeg,
  drawDrownedKing,
  drawBarrowLord,
  drawAshWarlord,
  BOSS_FACINGS,
  MINIBOSSES,
  drawBossPortrait
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/minibosses.js", error: String((e && e.message) || e) }); }

// assets/_gen/mobfx.js
try { (() => {
// Naevyr MOB FX & PROJECTILES — eval after pixlib.js + tiles.js + beasts.js (moteBurst, ell).
// Frame-strip sprites (no facings): drawX(f) -> grid. 1px void outline on solid bodies;
// dithered glow/ring FX. RAMP only. Anchors per-asset (projectiles center, ground FX as noted).
//   bog_spit       12×12  travel 3f + splat 2f   (Bogwretch projectile)
//   drift_bolt     10×10  travel 3f              (Drift Wisp projectile)
//   ash_shockwave  48×24  ring 4f                (Ash Brute slam ground FX; centered)

/* ---- bog_spit: a drift-tinted bile glob, spinning, with a wet trail; then splat ---- */
function drawBogSpit(f, splat) {
  const g = makeGrid(12, 12);
  const wa = RAMP.water,
    gr = RAMP.grass,
    dr = RAMP.drift;
  if (!splat) {
    const cx = 7,
      cy = 6;
    // tumbling glob (lit core shifts each frame)
    ell(g, cx, cy, 3, 2.6, (x, y, d, dx, dy) => {
      let c = wa[1];
      if (d > 0.7) c = wa[3];
      if (dx + dy < -0.3) c = f % 2 ? gr[0] : wa[0];
      P(g, x, y, c);
    });
    P(g, cx, cy, dr[1]); // drift-bile core
    P(g, cx + (f === 1 ? 1 : -1), cy - 1, dr[0]);
    // wet trail behind (toward back-left, since it flies right)
    const tr = [[-4, 1], [-3, 0], [-5, 2]];
    tr.forEach(([ox, oy], i) => {
      if (i <= f) P(g, cx + ox, cy + oy, i ? wa[3] : wa[2]);
    });
    P(g, cx - 6, cy + 1, dr[3]);
    outline(g, RAMP.void);
  } else {
    // splat: spreading puddle + droplets (2f)
    const cy = 9;
    for (let x = 2; x <= 10; x++) {
      if (hash2(x, splat, 200) < 0.85) P(g, x, cy, wa[2]);
      if (hash2(x, splat, 201) < 0.5) P(g, x, cy + 1, wa[3]);
    }
    P(g, 5, cy, dr[2]);
    P(g, 7, cy, dr[2]);
    if (splat === 0) {
      P(g, 3, cy - 2, wa[1]);
      P(g, 9, cy - 2, wa[1]);
      P(g, 6, cy - 3, dr[1]);
    } // flung droplets
    else {
      for (let x = 1; x <= 11; x++) if (hash2(x, 9, 202) < 0.4) P(g, x, cy + 1, wa[3]);
    }
    outline(g, RAMP.void);
  }
  return g;
}

/* ---- drift_bolt: a bright corrupted dart, elongated toward travel, mote sparks ---- */
function drawDriftBolt(f) {
  const g = makeGrid(10, 10);
  const dr = RAMP.drift;
  const cx = 5,
    cy = 5;
  // elongated bright bolt (points right / travel dir; engine rotates per heading)
  for (let x = cx - 3; x <= cx + 3; x++) {
    const t = (x - (cx - 3)) / 6; // tail→head
    const hh = Math.round(t * 2.2);
    for (let y = cy - hh; y <= cy + hh; y++) {
      let c = dr[2];
      if (t > 0.6) c = dr[1];
      if (t > 0.85) c = dr[0];
      if (Math.abs(y - cy) >= hh && hh > 0) c = dr[3];
      P(g, x, y, c);
    }
  }
  P(g, cx + 3, cy, dr[0]); // hot tip
  // sparks trailing (vary by frame)
  const sp = [[-4, 0], [-3, -1], [-3, 1], [-5, 0]];
  sp.forEach(([ox, oy], i) => {
    if ((i + f) % 2 === 0) P(g, cx + ox, cy + oy, dr[3]);
  });
  if (f === 1) {
    P(g, cx, cy - 3, dr[0]);
    P(g, cx + 1, cy + 3, dr[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ---- ash_shockwave: expanding ember ring on the iso ground plane (4f, centered) ---- */
function drawAshShockwave(f) {
  const g = makeGrid(48, 24);
  const em = RAMP.ember,
    gd = RAMP.gold,
    dt = RAMP.dirt;
  const cx = 24,
    cy = 12;
  const rx = [6, 14, 21, 23][f],
    ry = rx / 2;
  const fade = f; // outer ring thins/darkens as it grows
  // the ring: iso ellipse outline, dithered, ember→gold hot on the inner edge
  for (let a = 0; a < 360; a += 4) {
    const rad = a * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * rx),
      y = Math.round(cy + Math.sin(rad) * ry);
    if ((x + y + f) % 2 === 0) continue; // dither
    let c = f < 2 ? em[0] : em[1];
    if (f >= 2 && hash2(x, y, 210) < 0.4) c = em[3]; // breaking up
    P(g, x, y, c);
    // hot inner lip
    const ix = Math.round(cx + Math.cos(rad) * (rx - 1.5)),
      iy = Math.round(cy + Math.sin(rad) * (ry - 0.8));
    if ((ix + iy) % 2 === 0) P(g, ix, iy, f === 0 ? gd[0] : em[2]);
  }
  // kicked ember dust inside the ring on the first frames
  if (f <= 1) for (let i = 0; i < 10; i++) {
    const t = hash2(i, f, 211) * Math.PI * 2,
      r = hash2(i, f, 212) * rx * 0.7;
    P(g, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.5), hash2(i, f, 213) < 0.5 ? em[1] : dt[2]);
  }
  // central scorch on the last frame
  if (f === 3) for (let x = cx - 3; x <= cx + 3; x++) P(g, x, cy, dt[3]);
  return g; // ground FX: no silhouette outline (dithered ring reads on its own)
}
const MOBFX = {
  bog_spit: {
    travel: 3,
    splat: 2,
    cell: [12, 12],
    anchor: [6, 6]
  },
  drift_bolt: {
    travel: 3,
    cell: [10, 10],
    anchor: [5, 5]
  },
  ash_shockwave: {
    ring: 4,
    cell: [48, 24],
    anchor: [24, 12],
    centered: true
  }
};
Object.assign(globalThis, {
  drawBogSpit,
  drawDriftBolt,
  drawAshShockwave,
  MOBFX
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/mobfx.js", error: String((e && e.message) || e) }); }

// assets/_gen/mobs.js
try { (() => {
// Naevyr FRONTIER MOBS — eval after pixlib.js + tiles.js + beasts.js (ell, shadeMass,
// spike, moteBurst). Same rig as beasts.js: drawX(facing, anim, f) -> grid.
// 5 facings s/se/e/ne/n (engine mirrors w/sw/nw), bottom-center anchor (base on last
// row), 1px void auto-outline, RAMP only, deterministic. TOP 4px LEFT CLEAR for HP bar.
//   bogwretch  32×40  idle2 · walk6 · cast4         (Palewater ranged spitter)
//   barrow_wight 32×44 idle2 · walk6 · summon4      (Bonefields summoner)
//   bone_husk  28×36  idle2 · walk6 · swing4        (Wight's skeletal add)
//   ash_brute  48×52  idle2 · walk6 · slam4         (Ashen AoE slammer)
//   drift_wisp 28×32  hover4 · dive3                (flying; paired ground shadow)
//   drift_wisp_shadow 16×8  bob4                    (separate ground shadow)

const DIRMAP = {
  s: 0,
  se: 1,
  e: 2,
  ne: 3,
  n: 4
};

/* ============================ 1 · BOGWRETCH (32×40) ============================ */
// Hunched amphibian spitter — waterlogged pale hide, bloated throat sac that
// inflates on cast, wide maw. water + grass + bone ramps, drift-tinted spit.
function drawBogwretch(facing, anim, f) {
  const g = makeGrid(32, 40);
  const wa = RAMP.water,
    gr = RAMP.grass,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir],
    cx = 16 + lean,
    groundY = 38;
  let bob = 0,
    sac = 0,
    rear = 0,
    mouth = 0,
    step = 0;
  if (anim === 'idle') {
    bob = f === 1 ? -1 : 0;
    sac = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    step = [2, 1, 0, -2, -1, 0][f];
  }
  if (anim === 'cast') {
    rear = [-2, -3, 1, 2][f];
    sac = [1, 3, 1, 0][f];
    mouth = [0, 0, 2, 1][f];
  }
  const hipY = groundY - 7 + bob;
  // squat bent toad legs (thick, splayed knees) + webbed feet
  [[-7, -1], [7, 1]].forEach(([lx, ph], i) => {
    const k2 = anim === 'walk' ? (f + i) % 2 ? 1 : 0 : 0;
    const fx = cx + lx + (i ? -step : step);
    // thigh up-and-out, shin down to foot (bent knee)
    P(g, fx - ph, hipY - 1, wa[2]);
    P(g, fx - ph, hipY, wa[1]);
    for (let y = hipY + 1; y < groundY - 1 - k2; y++) {
      P(g, fx, y, wa[2]);
      P(g, fx + ph, y, wa[3]);
    }
    // webbed foot (3 wide)
    P(g, fx - 1, groundY - 1, wa[1]);
    P(g, fx, groundY - 1, RAMP.void);
    P(g, fx + 1, groundY - 1, wa[1]);
    P(g, fx + ph, groundY - 1, wa[2]);
  });
  // bloated hunched body
  const bx = cx + rear * 0.4;
  shadeMass(g, bx, hipY - 4, profile ? 8 : 7, 5, wa, 110);
  // small forelimbs resting forward on the ground (front/side facings)
  if (!back) {
    const ax = bx + (profile ? 5 : 4);
    P(g, ax, hipY + 1, wa[2]);
    P(g, ax + 1, hipY + 2, wa[1]);
    P(g, ax + 2, hipY + 2, wa[1]); // little clawed hand
    if (!profile) {
      P(g, bx - 4, hipY + 1, wa[2]);
      P(g, bx - 5, hipY + 2, wa[1]);
      P(g, bx - 6, hipY + 2, wa[1]);
    }
  }
  // mottled grass-slime blotches on the back
  [[-3, -5], [2, -6], [4, -2], [-5, -1]].forEach(([ox, oy], i) => {
    if (hash2(i, 1, 111) < 0.8) P(g, bx + ox, hipY - 4 + oy, gr[2]);
  });
  // spine nubs
  if (back) {
    [-3, 0, 3].forEach(sx => spike(g, bx + sx, hipY - 8, 3, false));
  }
  // head + throat sac (front/side)
  if (!back) {
    const hx = bx + (profile ? 6 : 0),
      hy = hipY - 6 + (profile ? 0 : 0);
    shadeMass(g, hx, hy, profile ? 5 : 5, 4, wa, 112);
    // bulging eyes (pale, drift glint when casting)
    const lit = anim === 'idle' && f === 1 || anim === 'cast';
    if (profile) {
      P(g, hx + 3, hy - 2, bn[0]);
      P(g, hx + 3, hy - 2, lit ? dr[1] : bn[2]);
    } else {
      P(g, hx - 2, hy - 2, lit ? dr[1] : bn[0]);
      P(g, hx + 2, hy - 2, lit ? dr[1] : bn[0]);
    }
    // wide maw (opens on spit)
    if (mouth > 0) {
      for (let i = -2; i <= 2; i++) P(g, hx + (profile ? 3 : i), hy + 2 + (profile ? i : 0), RAMP.void);
      P(g, hx + (profile ? 4 : 0), hy + 2, dr[2]);
    }
    // inflating throat sac under the chin
    const sw = 3 + sac;
    ell(g, hx, hy + 4 + Math.floor(sac / 2), sw, 2 + sac, (x, y, d, dx, dy) => {
      let c = wa[1];
      if (dy < -0.3) c = wa[0];
      if (d > 0.7) c = wa[3];
      P(g, x, y, c);
    });
    if (sac >= 2) for (let i = -1; i <= 1; i++) P(g, hx + i, hy + 4, dr[3]); // drift glow charging
  } else {
    shadeMass(g, bx, hipY - 6, 4, 3, wa, 113); // haunch from behind
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · BARROW WIGHT (32×44) ========================= */
// Tall robed undead summoner — stone-grey burial robe, deep hood, skeletal hands
// that rise to call adds; drift-fire eyes. stone(robe) + bone + drift.
function drawBarrowWight(facing, anim, f) {
  const g = makeGrid(32, 44);
  const st = RAMP.stone,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir],
    cx = 16,
    groundY = 42;
  let bob = 0,
    hemSway = 0,
    arms = 0,
    glow = 0,
    step = 0;
  if (anim === 'idle') {
    bob = f === 1 ? -1 : 0;
    hemSway = f === 1 ? 1 : 0;
    glow = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    hemSway = [0, 1, 1, 0, -1, -1][f];
    step = [1, 1, 0, -1, -1, 0][f];
  }
  if (anim === 'summon') {
    arms = [1, 3, 4, 2][f];
    glow = [0, 1, 2, 1][f];
  }
  const top = 7 + bob,
    shoulderY = 17 + bob;
  // long burial robe (tall taper to floor)
  for (let y = shoulderY; y <= 40; y++) {
    const t = (y - shoulderY) / (40 - shoulderY);
    const hw = Math.round(3.4 + t * 4.0);
    const cxx = cx + Math.round(off * 0.5) + (y > 33 ? Math.round(hemSway * 0.6) : 0) + (anim === 'walk' ? Math.round(step * t) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = st[1];
      if (x <= cxx - hw + 1) c = st[0];
      if (x >= cxx + hw - 1) c = st[3];
      if (hash2(x, y, 121) < 0.05) c = st[2];
      if (back && x === cxx) c = st[2];
      P(g, x, y, c);
    }
  }
  // tattered hem
  for (let x = 0; x < 32; x++) {
    const v = G(g, x, 40);
    if (v && hash2(x, 0, 122) < 0.4) P(g, x, 40, RAMP.void);
  }
  // bone trim at the hem + a drift sigil on the chest
  P(g, cx + off, shoulderY + 6, dr[glow > 0 ? 1 : 2]);
  if (glow >= 1) {
    P(g, cx + off - 1, shoulderY + 6, dr[2]);
    P(g, cx + off + 1, shoulderY + 6, dr[2]);
    P(g, cx + off, shoulderY + 5, dr[2]);
  }
  // deep hood
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.2) * Math.PI * 0.55) * 3.6);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = st[1];
      if (x === cxx - hw) c = st[0];
      if (x >= cxx + hw - 1) c = st[3];
      if (y === top) c = st[0];
      P(g, x, y, c);
    }
  }
  P(g, cx + off, top - 1, st[1]);
  // hollow face + drift-fire eyes
  if (!back) {
    const fcx = cx + off + (profile ? 2 : 0);
    const ey = top + 5;
    for (let y = top + 3; y <= top + 8; y++) for (let x = fcx - (profile ? 0 : 2); x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    const lit = glow > 0 || anim === 'summon';
    if (profile) P(g, fcx + 1, ey, lit ? dr[0] : dr[1]);else {
      P(g, fcx - 1, ey, lit ? dr[0] : dr[1]);
      P(g, fcx + 1, ey, lit ? dr[0] : dr[1]);
    }
  }
  // skeletal arms — at sides (idle/walk) or raised (summon)
  [[-1], [1]].forEach(([s]) => {
    const ax = cx + off + s * 4;
    if (anim === 'summon') {
      const ay = shoulderY + 2 - arms;
      for (let k = 0; k < 6; k++) {
        const x = ax + s * Math.round(k * 0.5),
          y = ay - k;
        P(g, x, y, bn[1]);
      }
      const hx = ax + s * 3,
        hy = ay - 6;
      P(g, hx, hy, bn[0]);
      P(g, hx + s, hy, bn[1]);
      P(g, hx, hy - 1, bn[0]); // bony hand
      if (glow >= 1) moteBurst(g, hx, hy - 2, 3 + glow, 0.6, 125 + s);
    } else {
      for (let y = shoulderY + 2; y <= 30; y++) P(g, ax + s * (profile ? 1 : 0), y, st[3]);
      P(g, ax + s, 30, bn[2]); // hand peeks from sleeve
    }
  });
  // summon: bone shards rising from the ground in front
  if (anim === 'summon' && f >= 2) {
    [[-7, 2], [7, 1], [0, 3]].forEach(([ox, h]) => {
      for (let k = 0; k < h + f - 1; k++) P(g, cx + off + ox, groundY - 1 - k, bn[k > h ? 0 : 1]);
    });
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · BONE HUSK (28×36) ============================ */
// Small skeletal minion the Wight summons — crude bone club, drift-spark eyes.
function drawBoneHusk(facing, anim, f) {
  const g = makeGrid(28, 36);
  const bn = RAMP.bone,
    dr = RAMP.drift;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir],
    cx = 14,
    groundY = 34;
  let bob = 0,
    step = 0,
    ang = null,
    rattle = 0;
  if (anim === 'idle') {
    bob = f === 1 ? -1 : 0;
    rattle = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    step = [2, 1, 0, -2, -1, 0][f];
  }
  if (anim === 'swing') ang = [-2.1, -1.35, -0.45, 0.35][f];
  const top = 8 + bob,
    hipY = top + 14,
    shoulderY = top + 6;
  // legs (bone)
  [[-2, -1], [2, 1]].forEach(([lx, ph], i) => {
    const sx = cx + lx + (i ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) P(g, sx, y, bn[2]);
    P(g, sx, groundY - 1, RAMP.void);
    P(g, sx + ph, groundY - 1, bn[1]);
  });
  // ribcage torso
  for (let y = shoulderY; y <= hipY; y++) {
    const hw = 3;
    const cxx = cx + Math.round(off * 0.4);
    P(g, cxx - hw, y, bn[2]);
    P(g, cxx + hw, y, bn[3]); // spine sides
    if ((y - shoulderY) % 2 === 0) for (let x = cxx - hw + 1; x <= cxx + hw - 1; x++) P(g, x, y, bn[1]); // ribs
    else P(g, cxx, y, bn[2]); // spine
  }
  // skull
  const hx = cx + off;
  shadeMass(g, hx, top + 3, 3, 3, bn, 131);
  if (!back) {
    const lit = rattle || anim === 'swing';
    if (profile) P(g, hx + 2, top + 3, lit ? dr[0] : dr[2]);else {
      P(g, hx - 1, top + 3, lit ? dr[0] : dr[2]);
      P(g, hx + 1, top + 3, lit ? dr[0] : dr[2]);
    }
    P(g, hx, top + 5, RAMP.void); // jaw gap
  }
  // arm + bone club
  const shx = hx + 3,
    shy = shoulderY + 1;
  if (anim === 'swing') {
    for (let k = 1; k < 6; k++) P(g, Math.round(shx + Math.cos(ang) * k), Math.round(shy + Math.sin(ang) * k), bn[2]);
    const ex = Math.round(shx + Math.cos(ang) * 6),
      ey = Math.round(shy + Math.sin(ang) * 6);
    fillRect(g, ex - 1, ey - 1, 2, 3, bn[1]);
    P(g, ex, ey - 2, bn[0]); // club head
    if (f === 2) P(g, ex + 2, ey, dr[0]);
  } else {
    for (let y = shy; y <= shy + 5; y++) P(g, shx, y, bn[2]);
    P(g, shx, shy + 6, bn[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · ASH BRUTE (48×52) ============================ */
// Heavy AoE slammer — slab-muscled ash-grey hulk veined with ember; raises both
// fists and slams. dirt/stone body + ember cracks + gold-hot core on slam.
function drawAshBrute(facing, anim, f) {
  const g = makeGrid(48, 52);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    em = RAMP.ember,
    gd = RAMP.gold;
  const dir = DIRMAP[facing],
    back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 2, 3, 2, 0][dir],
    cx = 24 + lean,
    groundY = 50;
  let stomp = 0,
    armUp = 0,
    hot = 0,
    shake = 0;
  if (anim === 'idle') {
    stomp = f === 1 ? 1 : 0;
    hot = f === 1 ? 1 : 0;
  }
  if (anim === 'walk') {
    stomp = [0, 1, 0, 1][f] ?? 0;
    shake = [0, 0, 1, 0][f] ?? 0;
  }
  if (anim === 'slam') {
    armUp = [4, 7, 7, -3][f];
    hot = [1, 2, 2, 0][f];
    shake = [0, 0, 0, 2][f];
  }
  const baseY = groundY - (shake ? 0 : 0);
  // thick legs
  [[-9, 0], [9, 0]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && (f + i) % 2 === 0 ? 2 : 0;
    for (let y = baseY - 16; y <= baseY - lift; y++) for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
      let c = dt[1];
      if (x < cx + lx - 2) c = dt[0];
      if (x > cx + lx + 2) c = dt[3];
      if (hash2(x, y, 141) < 0.06) c = st[2];
      P(g, x, y, c);
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
  });
  // hulking torso (slab muscle)
  const tx = cx + (profile ? 3 : 0),
    tTop = baseY - 40 + stomp,
    tBot = baseY - 15;
  for (let y = tTop; y <= tBot; y++) {
    const w = 14 + Math.round((y - tTop) / 7);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = dt[1];
      if (x < tx - w + 3) c = dt[0];
      if (x > tx + w - 3) c = dt[3];
      if (y > tBot - 4) c = dt[3];
      if (hash2(x, y, 142) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  // glowing ember cracks (pulse on idle f1 / hot on slam)
  const crk = [[-7, 8], [4, 12], [-2, 18], [8, 6], [-9, 15], [1, 22]];
  crk.forEach(([ox, oy], i) => {
    const x = tx + ox,
      y = tTop + oy;
    P(g, x, y, hot ? em[0] : em[2]);
    P(g, x, y + 1, hot ? em[1] : em[3]);
    if (hot >= 2) {
      P(g, x + 1, y, gd[0]);
      P(g, x, y - 1, em[1]);
    }
  });
  // shoulders + arms (raise on slam)
  [[-1, -15], [1, 15]].forEach(([sgn, ox]) => {
    const shX = tx + ox,
      shY = tTop + 3;
    shadeMass(g, shX, shY + 1, 5, 4, dt, 143); // shoulder boulder
    const drop = anim === 'slam' ? armUp : 0;
    for (let y = shY + 3; y <= shY + 16; y++) {
      const yy = y - drop;
      for (let x = shX - 3; x <= shX + 3; x++) {
        let c = dt[1];
        if (x < shX - 1) c = dt[0];
        if (x > shX + 1) c = dt[3];
        P(g, x, Math.round(yy), c);
      }
    }
    // massive fist
    const fy = shY + 16 - drop;
    shadeMass(g, shX, fy, 5, 4, st, 144);
    if (hot >= 1) {
      P(g, shX, fy - 1, em[1]);
    }
  });
  // head (small, sunken, single ember glare) on a thick neck
  if (!back) {
    const hx = tx + (profile ? 4 : 0),
      hy = tTop - 3 + stomp;
    shadeMass(g, hx, hy, 5, 4, dt, 145);
    const lit = hot || anim === 'slam';
    if (profile) P(g, hx + 2, hy, lit ? em[0] : em[1]);else {
      P(g, hx - 2, hy, lit ? em[0] : em[1]);
      P(g, hx + 2, hy, lit ? em[0] : em[1]);
    }
    for (let x = hx - 3; x <= hx + 3; x++) P(g, x, hy + 3, dt[3]); // heavy brow/jaw
  } else shadeMass(g, tx, tTop - 3 + stomp, 5, 4, dt, 146);
  // slam impact: ember dust kicked at the feet (the full shockwave ring is mobfx)
  if (anim === 'slam' && f === 3) {
    for (let i = 0; i < 10; i++) {
      const ox = -20 + i * 4;
      P(g, cx + ox, groundY - 1, em[2]);
      if (i % 2) P(g, cx + ox, groundY - 2, em[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 5 · DRIFT WISP (28×32, flying) ==================== */
// Hovering corrupted mote — bright drift core, trailing tendrils, mote halo. Body
// sits in the UPPER cell (hovers); bottom rows empty. Pairs with drift_wisp_shadow.
function drawDriftWisp(facing, anim, f) {
  const g = makeGrid(28, 32);
  const dr = RAMP.drift;
  const dir = DIRMAP[facing];
  const profile = dir === 2,
    back = dir >= 3;
  const cx = 14 + [0, 1, 1, 1, 0][dir];
  let cy = 12,
    gather = 0;
  if (anim === 'hover') {
    cy = 12 + [0, -1, -2, -1][f];
  } // 4-frame bob
  if (anim === 'dive') {
    cy = [10, 8, 18][f];
    gather = [1, 2, 0][f];
  } // gather high → dart down

  // trailing tendrils below the core (wave with bob)
  for (let i = -1; i <= 1; i++) {
    const tx = cx + i * 3;
    for (let k = 1; k <= 5; k++) {
      const wob = Math.round(Math.sin(k * 0.8 + f + i) * 1.2);
      P(g, tx + wob, cy + 3 + k, k > 3 ? dr[3] : dr[2]);
    }
  }
  // glowing core
  ell(g, cx, cy, 4, 3.4, (x, y, d) => P(g, x, y, d < 0.28 ? dr[0] : d < 0.62 ? dr[1] : d < 0.85 ? dr[2] : dr[3]));
  // bright inner eye
  P(g, cx, cy, dr[0]);
  P(g, cx + (profile ? 1 : 0), cy, dr[0]);
  // mote halo (denser when gathering to dive)
  moteBurst(g, cx, cy, 6 + gather * 2, 0.4 + gather * 0.18, 150 + f);
  if (gather >= 1) {
    P(g, cx, cy - 5, dr[0]);
    P(g, cx - 5, cy, dr[1]);
    P(g, cx + 5, cy, dr[1]);
  }
  // NOTE: corruption motes get NO outline; the core does
  outline(g, RAMP.void);
  return g;
}
// separate ground shadow (bottom-anchored). 4f to track the hover bob (wider when low).
function drawWispShadow(f) {
  const g = makeGrid(16, 8);
  const wide = [4, 3, 2, 3][f] || 3; // smaller when wisp is higher
  ell(g, 8, 5, wide, 1.6, (x, y, d) => P(g, x, y, d < 0.5 ? RAMP.drift[4] : RAMP.stone[3]));
  return g; // no outline — it's a cast shadow
}
const MOB_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const MOBS = {
  bogwretch: {
    fn: 'drawBogwretch',
    cell: [32, 40],
    anims: [['idle', 2], ['walk', 6], ['cast', 4]],
    hurt: 'water-hi (#4a7fa0)'
  },
  barrow_wight: {
    fn: 'drawBarrowWight',
    cell: [32, 44],
    anims: [['idle', 2], ['walk', 6], ['summon', 4]],
    hurt: 'drift-hi (#d8b4fe)'
  },
  bone_husk: {
    fn: 'drawBoneHusk',
    cell: [28, 36],
    anims: [['idle', 2], ['walk', 6], ['swing', 4]],
    hurt: 'bone-hi (#efe9f4)'
  },
  ash_brute: {
    fn: 'drawAshBrute',
    cell: [48, 52],
    anims: [['idle', 2], ['walk', 4], ['slam', 4]],
    hurt: 'ember-hi (#fcd34d)'
  },
  drift_wisp: {
    fn: 'drawDriftWisp',
    cell: [28, 32],
    anims: [['hover', 4], ['dive', 3]],
    hurt: 'drift-core (#f3e8ff)',
    flying: true
  }
};
Object.assign(globalThis, {
  DIRMAP,
  drawBogwretch,
  drawBarrowWight,
  drawBoneHusk,
  drawAshBrute,
  drawDriftWisp,
  drawWispShadow,
  MOB_FACINGS,
  MOBS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/mobs.js", error: String((e && e.message) || e) }); }

// assets/_gen/mounts.js
try { (() => {
// Naevyr FRONTIER EXPANSION · MOUNTS — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass from beasts.js).
//
// v1 kind: frontier_steed — a lean dark-fantasy horse, wanderer-rig compatible.
//   Cell 56×48, bottom-center anchor (28,47), aligned to the ~1-tile 64×32 footprint.
//   5 facings s/se/e/ne/n + engine mirror (w←e, sw←se, nw←ne) — matches the 32×40
//   wanderer rig (5 facings + mirror) exactly.
//   Anims: idle 2f (tail-flick / breath) · walk 6f. The walk gait is timed to the
//   wanderer's 6-frame walk so a seated rider's bob lines up: body bob = [0,-1,0,0,-1,0]
//   (identical to drawWanderer's walk bob), legs stay planted.
//   Per facing & frame a saddleAnchor {x,y} (cell-local px) marks where the rider's
//   bottom-center anchor sits — engine draws wanderer at steedScreenPos + saddleAnchor,
//   exactly like worn-gear anchors line up on the rig.
//   Bottom-center contact shadow. One coat dye channel (RAMP swap) — v1 ships 'ink'.
//   RAMP only, 1px void auto-outline, dither not blur, moonlit-left / shadowed-right.
//
// Build the generator so future variants (e.g. a skeletal drift-horse) slot in:
// STEED_KINDS maps a kind → { coat ramp, mane, glow eye, undead? } and the body
// builder reads it; add a kind, ship a sheet, no rig changes.

/* ---- shared rig constants (LOCK — the TS port keys off these) ---- */
const STEED_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const STEED_MIRROR = {
  w: 'e',
  sw: 'se',
  nw: 'ne'
};
const STEED_ANIMS = [['idle', 2], ['walk', 6]];
const STEED_CELL = [56, 48];
const STEED_ANCHOR = [28, 47];
// bob lines up with drawWanderer: walk rises 1px on f1 & f4; idle breathes on f1.
const STEED_WALK_BOB = [0, -1, 0, 0, -1, 0];
const STEED_IDLE_BOB = [0, -1];
// per-leg fore/aft swing over the 6 walk frames (diagonal gait), + a hoof lift.
// near pair leads the far pair by half a cycle; front opposes back (trot-ish walk).
const GAIT = {
  // [swingX per frame], [lift per frame]
  fNear: {
    sw: [2, 1, 0, -2, -1, 0],
    lift: [0, 1, 1, 0, 0, 0]
  },
  fFar: {
    sw: [-2, -1, 0, 2, 1, 0],
    lift: [0, 0, 0, 0, 1, 1]
  },
  bNear: {
    sw: [-2, -1, 0, 2, 1, 0],
    lift: [0, 0, 0, 0, 1, 1]
  },
  bFar: {
    sw: [2, 1, 0, -2, -1, 0],
    lift: [0, 1, 1, 0, 0, 0]
  }
};

// coat dye channel — RAMP swap. v1 ships 'ink' (dark stone). Future skeletal variant
// would register a kind with coat:'bone', undead:true.
const STEED_KINDS = {
  frontier_steed: {
    coat: 'stone',
    mane: 'void',
    sock: false,
    glow: 'drift',
    undead: false
  }
};
function steedBob(anim, f) {
  return (anim === 'walk' ? STEED_WALK_BOB : STEED_IDLE_BOB)[f] || 0;
}

// saddle seat point per facing (where the rider's bottom-center anchor is placed),
// before the per-frame bob is added. Sits just behind the withers, top of the barrel.
const SADDLE_BASE = {
  s: [28, 26],
  se: [27, 25],
  e: [27, 24],
  ne: [29, 25],
  n: [28, 26]
};
function steedSaddle(facing, anim, f) {
  const b = SADDLE_BASE[facing];
  return {
    x: b[0],
    y: b[1] + steedBob(anim, f)
  };
}

/* ---- a tapered horse leg: hip at (x,topY), down to ground at hoofY, shifted by sw,
       lifted by `lift`, drawn in `ramp`. Hoof = 1px void cap. ---- */
function steedLeg(g, x, topY, hoofY, sw, lift, ramp, w) {
  w = w || 2;
  const by = hoofY - lift; // bent / lifted hoof
  for (let y = topY; y <= by - 1; y++) {
    // leg tapers and drifts toward the swing as it descends
    const t = (y - topY) / Math.max(1, by - topY);
    const xx = Math.round(x + sw * t);
    for (let i = 0; i < w; i++) {
      let c = ramp[2];
      if (i === 0) c = ramp[1];
      if (i === w - 1) c = ramp[3];
      if (y > by - 4) c = ramp[3]; // dark cannon/fetlock
      P(g, xx + i, y, c);
    }
  }
  const hx = Math.round(x + sw);
  for (let i = 0; i < w; i++) P(g, hx + i, by, RAMP.void); // hoof
}

/* ---- contact shadow ellipse on the ground, drawn first (under the body) ---- */
function steedShadow(g, cx, cy, rx, ry) {
  ell(g, cx, cy, rx, ry, (x, y, d) => {
    if (y < cy - 1) return; // only the lower half reads as shadow
    if (d > 0.62 && (x + y) % 2 === 1) return; // dithered soft rim
    P(g, x, y, RAMP.void, 0.5);
  });
}

/* ====================== the steed body builder ====================== */
function drawSteed(kind, facing, anim, f) {
  kind = kind || 'frontier_steed';
  const K = STEED_KINDS[kind];
  const co = RAMP[K.coat]; // coat ramp
  const mane = K.mane === 'void' ? [RAMP.void, co[3], co[3]] : RAMP[K.mane];
  const gl = RAMP[K.glow];
  const g = makeGrid(56, 48);
  const cx = 28,
    groundY = 45;
  const bob = steedBob(anim, f);
  const oy = bob; // upper-body vertical bob (legs stay planted)
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];

  // idle tail flick / breath
  const tailFlick = anim === 'idle' ? f === 1 ? 2 : 0 : anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0;

  // per-leg swing/lift (only when walking)
  const swOf = key => anim === 'walk' ? GAIT[key].sw[f] : 0;
  const liOf = key => anim === 'walk' ? GAIT[key].lift[f] : 0;

  // contact shadow (footprint ~ one 64×32 tile, scaled to cell)
  steedShadow(g, cx, groundY + 1, 17, 5);

  // ---------- profile / three-quarter share a barrel; front & rear are foreshortened ----------
  const profile = dir === 2;
  const threeQ = dir === 1 || dir === 3;
  const front = dir === 0;
  const rear = dir === 4;
  // head end on screen: +1 = head to the right (e/se/ne), 0 = toward/away (s/n)
  const headRight = profile || threeQ;
  const rumpToViewer = rear; // n: rump near viewer (low), head away (high)

  if (headRight) {
    // ===================== SIDE-ISH FACINGS (e, se, ne) =====================
    // squash horizontally a touch for the 3/4 turns
    const squash = threeQ ? 0.86 : 1;
    const bx = cx - 1; // barrel center x
    const byc = 27 + oy; // barrel center y
    const rx = Math.round(14 * squash),
      ry = 8;
    const headEndX = bx + Math.round(rx * 0.95); // shoulder/chest side (right)
    const rumpX = bx - Math.round(rx * 0.95); // hindquarter (left)

    // --- far legs first (behind the barrel), then body, then near legs ---
    steedLeg(g, headEndX - 1, byc + 4, groundY - 1, swOf('fFar'), liOf('fFar'), co, 2); // front-far
    steedLeg(g, rumpX + 1, byc + 4, groundY - 1, swOf('bFar'), liOf('bFar'), co, 2); // back-far

    // --- tail (flows off the rump, dark strands) ---
    const tlx = rumpX - 2;
    for (let k = 0; k < 13; k++) {
      const xx = tlx - Math.round(k * 0.35) - (k > 4 ? Math.round(tailFlick * (k - 4) / 6) : 0);
      const yy = byc - 2 + k;
      P(g, xx, yy, k % 3 === 0 ? mane[1] : RAMP.void);
      if (k > 2 && k % 2 === 0) P(g, xx - 1, yy, co[3]);
    }

    // --- barrel body ---
    ell(g, bx, byc, rx, ry, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.35) c = co[0]; // moonlit topline
      else if (dy > 0.4) c = co[2]; // belly shade
      if (dx > 0.55) c = co[2]; // shaded toward rump? keep chest lit
      if (d > 0.78) c = co[3]; // rim
      if (hash2(x, y, 71) < 0.05) c = co[2]; // coat speckle (dither, lean musculature)
      P(g, x, y, c);
    });
    // belly tuck shadow
    for (let x = rumpX + 2; x <= headEndX - 2; x++) if ((x + byc) % 2 === 0) P(g, x, byc + ry - 1, co[3]);

    // --- chest / shoulder swell at the head end ---
    ell(g, headEndX - 1, byc + 1, 5, 7, (x, y, d, dx, dy) => {
      if (x < headEndX - 5) return;
      let c = co[1];
      if (dy < -0.3) c = co[0];
      if (dy > 0.4) c = co[2];
      if (d > 0.8) c = co[3];
      P(g, x, y, c);
    });

    // --- neck (tapered) rising up-right from the withers to the poll ---
    const wX = headEndX - 1,
      wY = byc - ry + 1; // withers
    const pollX = headEndX + (threeQ ? 6 : 9),
      pollY = 12 + oy; // poll (top of head)
    const NSEG = 12;
    for (let s = 0; s <= NSEG; s++) {
      const t = s / NSEG;
      const nx = Math.round(wX + (pollX - wX) * t);
      const ny = Math.round(wY + (pollY - wY) * t);
      const hw = Math.round(4.2 - t * 1.8); // neck thickness tapers
      for (let i = -hw; i <= hw; i++) {
        let c = co[1];
        if (i <= -hw + 1) c = co[0]; // crest-lit front edge
        if (i >= hw - 1) c = co[2]; // shaded back edge
        P(g, nx + i, ny, c);
      }
      // mane down the back of the neck
      P(g, nx + hw, ny, mane[0]);
      if (s < NSEG) P(g, nx + hw - 1, ny, hash2(nx, ny, 72) < 0.5 ? mane[1] : co[3]);
    }

    // --- head: a lean wedge with a tapered muzzle pointing down-right ---
    const hx = pollX,
      hy = pollY;
    // skull
    ell(g, hx, hy + 3, 3, 4, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dx < -0.2) c = co[0];
      if (dy > 0.4) c = co[2];
      if (d > 0.8) c = co[3];
      P(g, x, y, c);
    });
    // muzzle (tapers down-right toward the nose)
    for (let k = 0; k < 6; k++) {
      const mxx = hx + 1 + k,
        myy = hy + 4 + k;
      const ww = Math.max(1, 2 - Math.floor(k / 3));
      for (let i = 0; i <= ww; i++) P(g, mxx, myy + i, k > 3 ? co[3] : co[2]);
    }
    P(g, hx + 6, hy + 10, RAMP.void); // nostril/lip dark
    // ears (two short, pricked)
    P(g, hx - 1, hy - 2, co[2]);
    P(g, hx - 1, hy - 3, co[3]);
    P(g, hx + 1, hy - 2, co[1]);
    P(g, hx + 1, hy - 3, co[2]);
    // forelock
    P(g, hx, hy - 1, mane[0]);
    // drift-touched eye
    const eyeLit = anim === 'idle' && f === 1;
    P(g, hx + 2, hy + 2, eyeLit ? gl[0] : gl[1]);
    if (K.undead) P(g, hx + 1, hy + 2, gl[2]);

    // --- saddle pad on the back (dark leather + drift trim), behind the withers ---
    const sb = SADDLE_BASE[facing];
    for (let x = sb[0] - 5; x <= sb[0] + 5; x++) {
      const t = Math.abs(x - sb[0]) / 5;
      const yTop = sb[1] + oy - 1 + Math.round(t * 1.5);
      P(g, x, yTop, RAMP.dirt[3]);
      P(g, x, yTop + 1, RAMP.dirt[2]);
      if (x === sb[0] - 5 || x === sb[0] + 5) P(g, x, yTop, gl[2]); // drift trim corners
    }
    // a low cantle/pommel nub so an un-ridden steed still reads as tacked
    P(g, sb[0] + 5, sb[1] + oy - 2, RAMP.dirt[2]);
    P(g, sb[0] - 5, sb[1] + oy - 2, RAMP.dirt[2]);

    // --- near legs (in front of the barrel) ---
    steedLeg(g, headEndX - 2, byc + 4, groundY, swOf('fNear'), liOf('fNear'), co, 3); // front-near
    steedLeg(g, rumpX, byc + 4, groundY, swOf('bNear'), liOf('bNear'), co, 3); // back-near
  } else if (front) {
    // ===================== FRONT (s) — head toward viewer, foreshortened =====================
    const byc = 26 + oy;
    // rump bulge up-back (small), chest/head toward viewer (low-front)
    // hindquarters (behind, higher on screen)
    ell(g, cx, byc - 4, 11, 7, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.3) c = co[0];
      if (dy > 0.4) c = co[2];
      if (d > 0.8) c = co[3];
      if (hash2(x, y, 73) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    // far/back legs (under the rump)
    steedLeg(g, cx - 8, byc + 1, groundY - 2, 0, liOf('bFar'), co, 2);
    steedLeg(g, cx + 7, byc + 1, groundY - 2, 0, liOf('bNear'), co, 2);
    // chest mass toward viewer
    ell(g, cx, byc + 3, 9, 7, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dx < -0.25) c = co[0];
      if (dx > 0.3) c = co[2];
      if (dy > 0.4) c = co[2];
      if (d > 0.82) c = co[3];
      P(g, x, y, c);
    });
    // front legs splayed toward viewer
    steedLeg(g, cx - 6, byc + 7, groundY, swOf('fFar'), liOf('fFar'), co, 3);
    steedLeg(g, cx + 4, byc + 7, groundY, swOf('fNear'), liOf('fNear'), co, 3);
    // neck rising up the middle to a lowered head
    const nbX = cx,
      nbY = byc - 1,
      hY = 14 + oy;
    for (let s = 0; s <= 10; s++) {
      const t = s / 10,
        ny = Math.round(nbY - (nbY - hY) * t),
        hw = Math.round(3.6 - t * 1.2);
      for (let i = -hw; i <= hw; i++) {
        let c = co[1];
        if (i < 0) c = co[0];
        if (i > hw - 2) c = co[2];
        P(g, cx + i, ny, c);
      }
      P(g, cx - hw, ny, mane[0]);
      P(g, cx + hw, ny, mane[1]); // mane both edges from front
    }
    // head facing viewer (long face)
    ell(g, cx, hY, 4, 5, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dx < -0.2) c = co[0];
      if (dx > 0.3) c = co[2];
      if (d > 0.82) c = co[3];
      P(g, x, y, c);
    });
    for (let y = hY + 3; y <= hY + 7; y++) for (let x = cx - 1; x <= cx + 1; x++) P(g, x, y, co[2]); // muzzle
    P(g, cx, hY + 8, RAMP.void);
    // ears
    P(g, cx - 3, hY - 4, co[2]);
    P(g, cx - 3, hY - 5, co[3]);
    P(g, cx + 3, hY - 4, co[1]);
    P(g, cx + 3, hY - 5, co[2]);
    P(g, cx, hY - 3, mane[0]); // forelock
    // two drift eyes
    const eyeLit = anim === 'idle' && f === 1;
    P(g, cx - 2, hY + 1, eyeLit ? gl[0] : gl[1]);
    P(g, cx + 2, hY + 1, eyeLit ? gl[0] : gl[1]);
    // saddle visible behind the neck
    const sb = SADDLE_BASE.s;
    for (let x = sb[0] - 4; x <= sb[0] + 4; x++) {
      P(g, x, sb[1] + oy - 6, RAMP.dirt[3]);
      P(g, x, sb[1] + oy - 5, RAMP.dirt[2]);
    }
  } else {
    // ===================== REAR (n) — rump toward viewer, head away (high) =====================
    const byc = 26 + oy;
    // head & neck small, away (top), drawn first so the rump overlaps
    const hY = 12 + oy;
    for (let s = 0; s <= 8; s++) {
      const t = s / 8,
        ny = Math.round(byc - 8 - (byc - 8 - hY) * t),
        hw = Math.round(3 - t * 1.2);
      for (let i = -hw; i <= hw; i++) {
        let c = co[2];
        if (i < 0) c = co[1];
        P(g, cx + i, ny, c);
      }
      P(g, cx, ny, mane[1]);
    }
    ell(g, cx, hY, 3, 3, (x, y, d) => P(g, x, y, d > 0.7 ? co[3] : co[2])); // back of head
    P(g, cx - 1, hY - 3, co[3]);
    P(g, cx + 1, hY - 3, co[3]); // ear backs
    // far/front legs (under, ahead)
    steedLeg(g, cx - 7, byc - 1, groundY - 2, 0, liOf('fFar'), co, 2);
    steedLeg(g, cx + 6, byc - 1, groundY - 2, 0, liOf('fNear'), co, 2);
    // rump mass toward viewer (rounded, lit top)
    ell(g, cx, byc + 2, 11, 8, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.35) c = co[0];
      if (dy > 0.35) c = co[2];
      if (Math.abs(dx) > 0.55) c = co[2];
      if (d > 0.8) c = co[3];
      if (hash2(x, y, 74) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    // dock + tail hanging down the center
    for (let k = 0; k < 15; k++) {
      const xx = cx + Math.round(tailFlick * (k > 5 ? (k - 5) / 8 : 0));
      const yy = byc - 2 + k;
      P(g, xx, yy, k % 3 === 0 ? mane[1] : RAMP.void);
      if (k > 3 && k % 2 === 0) {
        P(g, xx - 1, yy, co[3]);
        P(g, xx + 1, yy, co[3]);
      }
    }
    // back legs toward viewer
    steedLeg(g, cx - 6, byc + 6, groundY, swOf('bFar'), liOf('bFar'), co, 3);
    steedLeg(g, cx + 4, byc + 6, groundY, swOf('bNear'), liOf('bNear'), co, 3);
    // saddle cantle peeking over the rump
    const sb = SADDLE_BASE.n;
    for (let x = sb[0] - 4; x <= sb[0] + 4; x++) P(g, x, sb[1] + oy - 4, RAMP.dirt[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const MOUNTS = {
  frontier_steed: {
    fn: (facing, anim, f) => drawSteed('frontier_steed', facing, anim, f),
    saddle: (facing, anim, f) => steedSaddle(facing, anim, f),
    cell: STEED_CELL,
    anchor: STEED_ANCHOR,
    facings: STEED_FACINGS,
    mirror: STEED_MIRROR,
    anims: STEED_ANIMS,
    rideRig: 'wanderer',
    riderCell: [32, 40],
    riderAnchor: [16, 39],
    coatDye: {
      channel: 'coat',
      ramp: 'stone',
      swappable: ['stone', 'bone', 'blood', 'drift']
    },
    labelClearTop: 0
  }
};
function steedSheetGrids(kind) {
  // rows = facings, cols = frames (idle0,idle1, walk0..5) laid left-to-right
  return STEED_FACINGS.map(fc => {
    const row = [];
    STEED_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(MOUNTS[kind].fn(fc, anim, f));
    });
    return row;
  });
}
Object.assign(globalThis, {
  drawSteed,
  steedLeg,
  steedShadow,
  steedSaddle,
  steedBob,
  STEED_FACINGS,
  STEED_MIRROR,
  STEED_ANIMS,
  STEED_CELL,
  STEED_ANCHOR,
  STEED_WALK_BOB,
  STEED_IDLE_BOB,
  GAIT,
  STEED_KINDS,
  SADDLE_BASE,
  MOUNTS,
  steedSheetGrids
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/mounts.js", error: String((e && e.message) || e) }); }

// assets/_gen/nodes.js
try { (() => {
// Naevyr resource-node generators — eval after pixlib.js + tiles.js.
// tree 48×56 · rock 40×30 · fish ripple 40×20. Bottom-center anchored.

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx,
    dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// ---- TREE (ashen oak) ----
function makeTree(depleted) {
  const g = makeGrid(48, 56);
  const gr = RAMP.grass,
    dr = RAMP.dirt;

  // trunk: base at (24,55), tapering up
  for (let y = 26; y <= 55; y++) {
    const w = y > 50 ? 6 : y > 44 ? 5 : 4;
    const x0 = 24 - (w >> 1);
    for (let x = x0; x < x0 + w; x++) {
      let c = dr[1];
      if (x === x0) c = dr[0];else if (x === x0 + w - 1) c = dr[3];else if (hash2(x, y, 11) < 0.15) c = dr[2];
      P(g, x, y, c);
    }
  }
  // root flares
  for (let k = 0; k < 3; k++) {
    P(g, 19 + k, 54 + (k > 1 ? 1 : 0), dr[2]);
    P(g, 28 - 0 + k, 55, dr[2]);
  }
  P(g, 18, 55, dr[3]);
  P(g, 30, 55, dr[3]);
  if (!depleted) {
    // full canopy: blob cluster
    const blobs = [[24, 16, 17, 12], [14, 22, 10, 8], [34, 21, 10, 8], [24, 27, 13, 7]];
    for (let y = 2; y <= 36; y++) for (let x = 2; x <= 46; x++) {
      if (!blobs.some(b => inEllipse(x, y, b[0], b[1], b[2], b[3]))) continue;
      const h = hash2(x, y, 21);
      if (h < 0.04) continue; // leaf holes
      let c = gr[1];
      const lit = inEllipse(x, y, 18, 11, 13, 8);
      const shad = y > 26 || inEllipse(x, y, 32, 26, 12, 7);
      if (lit && h < 0.7) c = h < 0.18 ? gr[0] : gr[1];
      if (lit && h >= 0.7 && h < 0.78) c = gr[0];
      if (shad) c = h < 0.5 ? gr[2] : gr[1];
      if (y > 30 && h < 0.5) c = gr[3];
      if (h > 0.965) c = RAMP.bone[2]; // ashen flecks
      P(g, x, y, c);
    }
    // branch peeking under canopy
    for (let k = 0; k < 4; k++) P(g, 26 + k, 30 - (k >> 1), dr[2]);
  } else {
    // near-depleted: bare branches + thin patchy canopy
    const branch = (x0, y0, dx, dy, n, c, thick) => {
      for (let k = 0; k < n; k++) {
        const x = x0 + Math.round(dx * k),
          y = y0 + Math.round(dy * k);
        P(g, x, y, c);
        if (thick) P(g, x + 1, y, RAMP.dirt[3]);
      }
    };
    branch(24, 27, -0.9, -0.7, 12, dr[2], true); // left limb
    branch(24, 27, 0.95, -0.55, 13, dr[1], true); // right limb
    branch(24, 28, 0.1, -1, 9, dr[2], true); // top limb
    branch(15, 19, -0.7, -0.8, 5, dr[3]);
    branch(33, 22, 0.8, -0.7, 5, dr[3]);
    branch(25, 20, 0.4, -0.9, 5, dr[3]);
    // leaf clusters (2 small)
    [[12, 13, 5, 4], [36, 16, 4, 3]].forEach(b => {
      for (let y = b[1] - b[3]; y <= b[1] + b[3]; y++) for (let x = b[0] - b[2]; x <= b[0] + b[2]; x++) {
        if (!inEllipse(x, y, b[0], b[1], b[2], b[3])) continue;
        const h = hash2(x, y, 31);
        if (h < 0.18) continue;
        P(g, x, y, h < 0.5 ? gr[2] : gr[1]);
      }
    });
  }
  outline(g);
  return g;
}

// ---- ROCK / ORE VEIN ----
function makeRock(depleted) {
  const g = makeGrid(40, 30);
  const st = RAMP.stone,
    gd = RAMP.gold;
  // boulder silhouette: two lumps
  for (let y = 4; y <= 29; y++) for (let x = 3; x <= 37; x++) {
    const inA = inEllipse(x, y, 17, 19, 13, 9);
    const inB = inEllipse(x, y, 27, 21, 9, 7);
    if (!inA && !inB) continue;
    if (y > 28) continue;
    let c = st[1];
    const h = hash2(x, y, 41);
    if (inEllipse(x, y, 13, 14, 9, 6)) c = h < 0.75 ? st[0] : st[1]; // top-lit
    if (y > 22) c = h < 0.7 ? st[2] : st[1];
    if (y > 26) c = st[3];
    if (inB && !inA && y <= 22) c = h < 0.5 ? st[1] : st[2];
    // facet lines
    if (h > 0.97) c = st[2];
    P(g, x, y, c);
  }
  if (!depleted) {
    // gold ore flecks
    const fl = [[12, 16], [20, 13], [26, 19], [16, 22], [30, 23]];
    fl.forEach((f, i) => {
      P(g, f[0], f[1], gd[1]);
      P(g, f[0] + 1, f[1], gd[2]);
      P(g, f[0], f[1] + 1, gd[2]);
      if (i % 2 === 0) P(g, f[0] + 1, f[1] - 1, gd[0]); // glint
    });
  } else {
    // cracks + spent flecks + rubble
    const crack = (x0, y0, pts) => {
      let x = x0,
        y = y0;
      pts.forEach(p => {
        x += p[0];
        y += p[1];
        P(g, x, y, st[3]);
        if (y < 18) P(g, x - 1, y, st[0]); // chip highlight on lit face
      });
    };
    crack(14, 10, [[1, 1], [0, 1], [1, 1], [1, 0], [0, 1], [1, 1], [0, 1], [-1, 1], [0, 1], [1, 1]]);
    crack(24, 12, [[1, 1], [1, 0], [0, 1], [1, 1], [0, 1], [1, 0], [0, 1]]);
    crack(10, 18, [[1, 0], [1, 1], [1, 0], [1, 1]]);
    P(g, 20, 17, gd[3]);
    P(g, 27, 21, gd[3]); // spent dull flecks
    // rubble at base
    [[4, 27], [7, 28], [33, 27], [36, 28], [30, 28]].forEach(r => {
      P(g, r[0], r[1], st[2]);
      P(g, r[0] + 1, r[1], st[3]);
      P(g, r[0], r[1] - 1, st[1]);
    });
  }
  outline(g);
  return g;
}

// ---- FISHING SPOT (ripple; sits ON water, no outline) ----
function ellipseRing(g, cx, cy, rx, ry, c, skip) {
  const n = Math.max(16, (rx + ry) * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2;
    const x = Math.round(cx + Math.cos(t) * rx);
    const y = Math.round(cy + Math.sin(t) * ry);
    if (skip && hash2(x, y, 51) < skip) continue;
    P(g, x, y, c);
  }
}
function makeFishFrames() {
  const wa = RAMP.water;
  const frames = [0, 1, 2, 3].map(f => {
    const g = makeGrid(40, 20);
    const r = 4 + f * 2.2;
    ellipseRing(g, 20, 10, r, r / 2, wa[0], f > 1 ? 0.3 : 0); // expanding ring
    if (f >= 1) ellipseRing(g, 20, 10, r - 4, (r - 4) / 2, wa[0], 0.45); // trailing ring
    if (f === 0) {
      P(g, 20, 10, RAMP.bone[1]);
      P(g, 21, 10, wa[0]);
    } // plip
    if (f === 3) ellipseRing(g, 20, 10, r, r / 2, wa[1], 0.5); // fading outer
    // tiny fish shadow under
    for (let k = 0; k < 4; k++) P(g, 18 + k, 12 + f % 2, wa[2]);
    return g;
  });
  // depleted: one faint ring
  const d = makeGrid(40, 20);
  ellipseRing(d, 20, 10, 5, 2.5, wa[2], 0.35);
  P(d, 20, 10, wa[2]);
  frames.push(d);
  return frames;
}
Object.assign(globalThis, {
  inEllipse,
  makeTree,
  makeRock,
  makeFishFrames,
  ellipseRing
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/nodes.js", error: String((e && e.message) || e) }); }

// assets/_gen/npcs.js
try { (() => {
// Naevyr FRONTIER NPCs — keeper rig. Eval after pixlib.js + tiles.js + avatars.js (rig).
// Keeper rig: 32×40 cell, feet y=37, 5 facings s/se/e/ne/n (engine mirrors), idle 2f only
// (stationary NPCs). 1px void outline, RAMP only. Each also has a 48×64 dialog portrait.
//   quartermaster — gruff frontier trader (leather apron, ledger, key-ring)
//   scout         — hooded watcher, hand shading eyes, bow on back
//   hermit        — ragged camp lore NPC, bent over a gnarled staff, long beard

// shared two-foot stand (planted; no step). soleRamp solid, toe void.
function keeperFeet(g, R, soleRamp) {
  const fo = R.dir >= 1 ? 1 : 0;
  P(g, R.cx - 3 + fo, 37, soleRamp[3]);
  P(g, R.cx - 2 + fo, 37, RAMP.void);
  P(g, R.cx - 3 + fo, 36, soleRamp[2]);
  P(g, R.cx + 2 + fo, 37, RAMP.void);
  P(g, R.cx + 3 + fo, 37, soleRamp[3]);
  P(g, R.cx + 3 + fo, 36, soleRamp[2]);
}

/* ============================ QUARTERMASTER (32×40) ============================ */
// Stout, broad. Leather apron over a tunic, rolled sleeves, thick beard, flat cap.
// Holds a ledger; a key-ring glints on the belt. idle f1: weighs a gold coin (glint).
function bodyQuartermaster(g, R, f) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    showFace,
    back
  } = R;
  const lt = RAMP.dirt,
    tu = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold;
  const shift = f === 1 ? 1 : 0;
  // broad torso (tunic) + leather apron over it
  for (let y = shoulderY; y <= 34; y++) {
    const t = (y - shoulderY) / (34 - shoulderY);
    const hw = Math.round(5 + t * 1.5);
    const cxx = cx + Math.round(off * 0.5);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = tu[1];
      if (x <= cxx - hw + 1) c = tu[0];
      if (x >= cxx + hw - 1) c = tu[2];
      // apron panel (center, leather) front/side only
      if (!back && Math.abs(x - cxx) <= hw - 2 && y > shoulderY + 2) {
        c = lt[1];
        if (x < cxx - 1) c = lt[0];
        if (x > cxx + 1) c = lt[2];
      }
      P(g, x, y, c);
    }
  }
  // apron strap + belt with key-ring
  for (let x = cx + off - 4; x <= cx + off + 4; x++) P(g, x, 30, lt[3]);
  P(g, cx + off + 5, 31, gd[2]);
  P(g, cx + off + 6, 31, gd[3]);
  P(g, cx + off + 5, 32, bn[3]); // keys
  // rolled-sleeve arms
  [[-1, tu[0]], [1, tu[2]]].forEach(([s, c]) => {
    const ax = cx + off + s * 6;
    for (let y = shoulderY + 1; y <= 26; y++) P(g, ax, y, c);
    for (let y = 27; y <= 30; y++) P(g, ax, y, bn[2]);
  }); // forearms bare (bone-grey skin)
  // a ledger held at the belly (front/side)
  if (!back) {
    for (let y = 27; y <= 31; y++) for (let x = cx + off - 3; x <= cx + off + 1; x++) P(g, x, y, bn[1]);
    for (let y = 27; y <= 31; y++) P(g, cx + off - 3, y, lt[3]);
  }
  // head + flat cap + thick beard
  const hx = cx + off,
    hy = top + 3;
  for (let y = top + 1; y <= shoulderY; y++) {
    const hw = 3;
    for (let x = hx - hw; x <= hx + hw; x++) {
      let c = bn[2];
      if (x < hx - hw + 1) c = bn[1];
      if (x > hx + hw - 1) c = bn[3];
      P(g, x, y, c);
    }
  }
  for (let x = hx - 4; x <= hx + 4; x++) P(g, x, top, lt[2]); // flat cap brim
  for (let x = hx - 3; x <= hx + 3; x++) P(g, x, top - 1, lt[1]);
  if (!back) {
    for (let y = top + 5; y <= top + 8; y++) for (let x = hx - 3; x <= hx + 3; x++) if (hash2(x, y, 501) < 0.8) P(g, x, y, bn[3]); // beard
    const ey = top + 4;
    if (dir === 0) {
      P(g, hx - 1, ey, RAMP.void);
      P(g, hx + 1, ey, RAMP.void);
    } else if (dir === 1) {
      P(g, hx, ey, RAMP.void);
      P(g, hx + 2, ey, RAMP.void);
    } else P(g, hx + 1, ey, RAMP.void);
  }
  // idle f1: weighs a gold coin off the right hand
  if (f === 1 && !back) {
    P(g, cx + off + 7, 24 - shift, gd[0]);
    P(g, cx + off + 7, 23 - shift, gd[1]);
  }
}

/* ============================ SCOUT (32×40) ============================ */
// Lean hooded watcher. One hand raised to shade the eyes (scanning the horizon),
// a short cloak, a bow slung on the back. idle f1: hand/head shift + cloak sway.
function bodyScout(g, R, f) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    showFace,
    back
  } = R;
  const ck = RAMP.grass,
    lt = RAMP.dirt,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const sway = f === 1 ? 1 : 0;
  // slung bow on the back (behind body)
  if (back || dir === 1 || dir === 2) {
    const bx = cx + off - (back ? 0 : 3);
    for (let y = shoulderY - 2; y <= shoulderY + 12; y++) {
      const c = Math.abs(y - (shoulderY + 5));
      P(g, bx + Math.round(c * 0.18), y, lt[2]);
    }
    P(g, bx, shoulderY - 2, lt[3]);
    P(g, bx, shoulderY + 12, lt[3]);
  }
  // short ranger cloak (green), open
  for (let y = shoulderY; y <= 33; y++) {
    const t = (y - shoulderY) / (33 - shoulderY);
    const hw = Math.round(3.4 + t * 2.6);
    const cxx = cx + Math.round(off * 0.5) + (y > 29 ? sway : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = ck[1];
      if (x <= cxx - hw + 1) c = ck[0];
      if (x >= cxx + hw - 1) c = ck[2];
      if (hash2(x, y, 511) < 0.05) c = ck[3];
      P(g, x, y, c);
    }
  }
  // legs (leggings) below the short cloak
  for (const s of [-1, 1]) {
    const lx = cx + off + s * 2;
    for (let y = 33; y <= 36; y++) P(g, lx, y, lt[2]);
  }
  // hood
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.2);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = ck[1];
      if (x === cxx - hw) c = ck[0];
      if (x >= cxx + hw - 1) c = ck[2];
      if (y === top) c = ck[0];
      P(g, x, y, c);
    }
  }
  P(g, cx + off + (dir >= 1 ? 1 : 0), top - 1, ck[1]);
  // face shadow + a keen eye
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0);
    for (let y = top + 4; y <= top + 7; y++) for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    P(g, fcx + (dir === 2 ? 1 : -1), top + 5, bn[0]);
    if (dir !== 2) P(g, fcx + 1, top + 5, bn[1]);
  }
  // raised hand shading the eyes (front/side) — the scout's read
  if (!back) {
    const hx = cx + off + 5,
      hy = top + 3 - sway;
    for (let k = 0; k < 4; k++) P(g, hx - k, top + 6 - k, lt[1]); // forearm up to brow
    fillRect(g, hx - 4, top + 2 - sway, 4, 1, bn[2]); // flat hand over brow
  } else {
    // arms at sides from behind
    for (const s of [-1, 1]) {
      const ax = cx + off + s * 4;
      for (let y = shoulderY + 1; y <= 27; y++) P(g, ax, y, ck[2]);
    }
  }
}

/* ============================ HERMIT (32×40) ============================ */
// Bent, ragged camp lore-keeper. Tattered layered robes, very long beard, leans on a
// gnarled staff topped with a small drift trinket. idle f1: trinket glints, beard sway.
function bodyHermit(g, R, f) {
  const {
    cx,
    off,
    dir,
    top,
    shoulderY,
    showFace,
    back
  } = R;
  const rb = RAMP.stone,
    lt = RAMP.dirt,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const glint = f === 1;
  const hunch = 2; // bent forward
  // tattered layered robe (hunched, wide hem)
  for (let y = shoulderY + hunch; y <= 36; y++) {
    const t = (y - (shoulderY + hunch)) / (36 - (shoulderY + hunch));
    const hw = Math.round(3.2 + t * 4.0);
    const cxx = cx + Math.round(off * 0.5) + (dir <= 2 ? 1 : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = rb[1];
      if (x <= cxx - hw + 1) c = rb[0];
      if (x >= cxx + hw - 1) c = rb[3];
      if ((x + 2 * y) % 6 === 0) c = rb[2]; // patched layers
      if (hash2(x, y, 521) < 0.06) c = lt[3];
      P(g, x, y, c);
    }
  }
  // ragged hem
  for (let x = 0; x < 32; x++) {
    const v = G(g, x, 36);
    if (v && hash2(x, 0, 522) < 0.5) P(g, x, 36, RAMP.void);
  }
  // hunched head (down/forward), bald pate + wisp of hair
  const hx = cx + off + (dir <= 2 ? 1 : 0),
    hy = top + hunch + 2;
  for (let y = hy - 2; y <= hy + 2; y++) for (let x = hx - 3; x <= hx + 3; x++) {
    if ((x - hx) ** 2 + (y - hy) ** 2 > 11) continue;
    let c = bn[2];
    if (x < hx - 1) c = bn[1];
    if (y > hy + 1) c = bn[3];
    P(g, x, y, c);
  }
  P(g, hx - 3, hy - 2, bn[3]);
  P(g, hx + 3, hy - 1, bn[3]); // wispy hair
  // very long beard cascading down the chest (front/side)
  if (!back) {
    for (let y = hy + 2; y <= 30; y++) {
      const bw = Math.max(1, 3 - Math.floor((y - hy) / 6));
      for (let x = hx - bw; x <= hx + bw; x++) if (hash2(x, y, 523) < 0.85) P(g, x, y, bn[3 - (y < hy + 6 ? 1 : 0)]);
    }
    const ey = hy;
    P(g, hx + (dir === 2 ? 1 : -1), ey, RAMP.void);
    if (dir !== 2) P(g, hx + 1, ey, RAMP.void);
  }
  // gnarled staff in the right hand, topped with a drift trinket
  const sx = cx + off + 7;
  for (let y = top + 1; y <= 37; y++) P(g, sx + Math.round(Math.sin(y * 0.5) * 0.4), y, lt[1]); // gnarled
  P(g, sx, top, lt[2]);
  // drift trinket bound at the top
  P(g, sx, top - 1, glint ? dr[0] : dr[1]);
  P(g, sx - 1, top - 1, dr[2]);
  P(g, sx + 1, top - 1, dr[2]);
  if (glint) {
    P(g, sx, top - 2, dr[1]);
    P(g, sx - 2, top - 1, dr[3]);
    P(g, sx + 2, top - 1, dr[3]);
  }
  // a hand gripping the staff
  P(g, sx - 1, top + 8, bn[2]);
  P(g, sx, top + 8, bn[1]);
}
const KEEPER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const NPCS = {
  quartermaster: {
    body: 'bodyQuartermaster',
    sole: 'dirt',
    desc: 'Outpost Quartermaster — gruff frontier trader'
  },
  scout: {
    body: 'bodyScout',
    sole: 'dirt',
    desc: 'Frontier Scout — hooded watcher'
  },
  hermit: {
    body: 'bodyHermit',
    sole: 'stone',
    desc: 'The Hermit — ragged camp lore-keeper'
  }
};
function drawKeeper(kind, facing, f) {
  const g = makeGrid(32, 40);
  const R = rig(facing, 'idle', f);
  globalThis[NPCS[kind].body](g, R, f);
  keeperFeet(g, R, RAMP[NPCS[kind].sole]);
  outline(g, RAMP.void);
  return g;
}
function drawKeeperPortrait(kind, f) {
  const g = makeGrid(48, 64);
  const cx = 24,
    top = 10;
  const src = drawKeeper(kind, 's', f || 0);
  for (let y = 4; y <= 25; y++) for (let x = 4; x <= 27; x++) {
    const v = G(src, x, y);
    if (!v) continue;
    fillRect(g, cx - 24 + (x - 4) * 2, top + (y - 4) * 2, 2, 2, v.c);
  }
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}
Object.assign(globalThis, {
  keeperFeet,
  bodyQuartermaster,
  bodyScout,
  bodyHermit,
  KEEPER_FACINGS,
  NPCS,
  drawKeeper,
  drawKeeperPortrait
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/npcs.js", error: String((e && e.message) || e) }); }

// assets/_gen/outpost.js
try { (() => {
// Naevyr FRONTIER EXPANSION · OUTPOST — a second small settlement (frontier garrison).
// Eval after pixlib.js + tiles.js + town.js (foundation, frontWall, rightWall, gableRoof,
// litWindow, door, hangingSign, smoke). Matches the TOWN pack: iso 2:1, weathered frontier
// timber, south door + warm lit window, same roof/door conventions so buildings face town.
//   palisade_gate  144×128 — fortified timber gate in a stake palisade run
//   trading_post   120×130 — small timber trade house, awning + wares
//   watchtower      80×152 — tall lookout tower, railed platform, ember brazier
// Bottom-center anchor, top 6px reserved for the label. RAMP only, 1px void, dither not blur.

/* ===================== 1 · PALISADE GATE (144×128) ===================== */
function drawPalisadeGate() {
  const g = makeGrid(144, 128);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    em = RAMP.ember,
    bn = RAMP.bone;
  const cx = 72,
    baseY = 112;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 8, 60, {
    ash: true
  });

  // a run of sharpened palisade stakes to either side of the gate towers
  function stakeRun(x0, x1, topBase) {
    for (let sx = x0; sx <= x1; sx += 5) {
      const h = topBase + Math.floor(hash2(sx, 1, 701) * 5);
      for (let k = 0; k < h; k++) {
        let c = sx / 5 % 2 < 1 ? dt[1] : dt[2];
        if (k < 3) c = dt[3];
        P(g, sx, baseY - k, c);
        P(g, sx + 1, baseY - k, dt[3]);
        P(g, sx + 2, baseY - k, dt[2]);
      }
      P(g, sx, baseY - h, dt[3]);
      P(g, sx + 1, baseY - h, dt[3]); // point
    }
  }
  stakeRun(8, 30, 38);
  stakeRun(114, 136, 38);

  // two squat gate towers framing the opening
  function tower(tx) {
    const w = 22,
      h = 64,
      x0 = tx - w / 2,
      ytop = baseY - h;
    // log-stacked face
    for (let y = ytop; y <= baseY; y++) for (let x = x0; x <= x0 + w; x++) {
      let c = dt[1];
      if (x <= x0 + 1) c = dt[0];
      if (x >= x0 + w - 1) c = dt[2];
      const r = (y - ytop) % 5;
      if (r === 0) c = dt[3];else if (r === 1) c = dt[0];
      if (hash2(x, y, 702) < 0.05) c = dt[2];
      P(g, x, y, c);
    }
    // right iso side
    for (let d = 1; d <= 10; d++) for (let y = ytop; y <= baseY; y++) P(g, x0 + w + d, y - Math.floor(d / 2), d >= 9 ? dt[3] : dt[2]);
    // crenellated stake cap
    for (let x = x0 - 2; x <= x0 + w + 2; x += 4) for (let k = 0; k < 6; k++) {
      P(g, x, ytop - 1 - k, dt[3]);
      P(g, x + 1, ytop - 1 - k, dt[2]);
    }
    // top platform line
    for (let x = x0 - 2; x <= x0 + w + 2; x++) P(g, x, ytop, dt[3]);
    return {
      x0,
      ytop,
      w
    };
  }
  const lt = tower(cx - 30),
    rt = tower(cx + 30);

  // heavy timber lintel beam spanning the towers
  for (let j = 0; j < 7; j++) for (let x = lt.x0 + lt.w; x <= rt.x0; x++) {
    let c = dt[1];
    if (j === 0) c = dt[0];
    if (j > 4) c = dt[3];
    if (x % 6 === 0) c = dt[3];
    P(g, x, baseY - 60 + j, c);
  }
  // iron-strapped double gate doors (shut), banded
  const gl = lt.x0 + lt.w + 2,
    gr = rt.x0 - 2,
    gtop = baseY - 53;
  for (let y = gtop; y <= baseY; y++) for (let x = gl; x <= gr; x++) {
    let c = dt[2];
    if ((x - gl) % 2 === 0) c = dt[3];
    if (x === Math.round((gl + gr) / 2) || x === Math.round((gl + gr) / 2) + 1) c = RAMP.void; // center seam
    if (x <= gl + 1) c = dt[1];
    if (x >= gr - 1) c = dt[3];
    P(g, x, y, c);
  }
  // iron straps + bolts
  for (const sy of [gtop + 6, gtop + 24, baseY - 8]) {
    for (let x = gl; x <= gr; x++) P(g, x, sy, st[3]);
    for (let x = gl + 2; x <= gr - 2; x += 6) {
      P(g, x, sy - 1, st[2]);
    }
  }
  // big iron ring handles
  P(g, Math.round((gl + gr) / 2) - 5, baseY - 28, st[2]);
  P(g, Math.round((gl + gr) / 2) + 6, baseY - 28, st[2]);
  // a warning skull mounted over the gate
  fillRect(g, cx - 2, baseY - 64, 5, 4, bn[1]);
  P(g, cx - 1, baseY - 63, RAMP.void);
  P(g, cx + 1, baseY - 63, RAMP.void);
  P(g, cx, baseY - 60, bn[2]);
  // ember braziers atop each tower
  [lt, rt].forEach(t => {
    const bxp = t.x0 + t.w / 2;
    for (let k = 0; k < 4; k++) {
      const hw = 2 - Math.floor(k / 2);
      for (let i = -hw; i <= hw; i++) P(g, bxp + i, t.ytop - 7 - k, k < 2 ? em[1] : em[2]);
    }
    P(g, bxp, t.ytop - 11, em[0]);
    for (let yy = -3; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 3 && d < 6 && (xx + yy) % 2 === 0) P(g, bxp + xx, t.ytop - 9 + yy, em[2]);
    }
  });
  outline(g, RAMP.void);
  return g;
}

/* ===================== 2 · TRADING POST (120×130) ===================== */
function drawTradingPost() {
  const g = makeGrid(120, 130);
  const dt = RAMP.dirt,
    gd = RAMP.gold,
    bn = RAMP.bone;
  // reuse the town house shell vocabulary (timber + plank roof), sized to 120×130
  const cx = 60,
    baseY = 112;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 8, 50, {
    ash: true
  });
  const fw = 58,
    fh = 54,
    dep = 24,
    roofH = 22,
    x0 = cx - fw / 2,
    x1 = cx + fw / 2,
    ytop = baseY - fh;
  if (typeof rightWall === 'function') rightWall(g, x1, ytop, baseY, dep, dt, 'timber', 71);
  if (typeof frontWall === 'function') frontWall(g, x0, x1, ytop, baseY, dt, 71, 'timber');
  if (typeof gableRoof === 'function') gableRoof(g, x0, x1, ytop, dep, roofH, RAMP.stone, {
    overhang: 4
  });
  // timber corner braces
  for (let k = 0; k < fh; k++) {
    P(g, x0 + 2 + Math.round(k * 0.4), baseY - k, dt[3]);
    P(g, x1 - 2 - Math.round(k * 0.4), baseY - k, dt[3]);
  }
  // door + lit window
  if (typeof door === 'function') door(g, cx + 10, baseY, 11, 22, dt);
  if (typeof litWindow === 'function') litWindow(g, cx - 14, ytop + 16, 9, 9);

  // open-front trade stall awning on the left (a market counter under a lean-to)
  const ax0 = x0 - 30,
    ax1 = x0 + 2,
    ay = ytop + 18;
  for (let x = ax0; x <= ax1; x++) {
    const yy = ay + Math.round((x - ax0) * 0.42);
    P(g, x, yy, dt[2]);
    P(g, x, yy + 1, dt[3]);
  }
  for (let k = 0; k < 22; k++) {
    P(g, ax0, ay + 1 + k, dt[3]);
    P(g, ax0 + 1, ay + 1 + k, dt[2]);
  } // post
  // striped awning cloth
  for (let x = ax0; x <= ax1; x++) {
    const yy = ay + Math.round((x - ax0) * 0.42);
    for (let k = 2; k < 6; k++) P(g, x, yy + k, x % 6 < 3 ? bn[2] : RAMP.blood[2]);
  }
  // counter heaped with wares (crates, sacks, a gold coin stack)
  const wbx = ax0 + 3,
    wby = baseY - 4;
  for (let i = 0; i < 24; i++) P(g, wbx + i, wby, dt[1]);
  for (let i = 0; i < 24; i++) P(g, wbx + i, wby + 1, dt[3]);
  P(g, wbx + 1, wby + 2, dt[3]);
  P(g, wbx + 22, wby + 2, dt[3]);
  // crate
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    let c = dt[1];
    if (i === 0 || i === 7 || j === 0 || j === 7) c = dt[3];
    if (i === j || i === 7 - j) c = dt[2];
    P(g, wbx + 2 + i, wby - 8 + j, c);
  }
  // sacks
  for (let j = 0; j < 6; j++) {
    const w = 6 - Math.abs(j - 3);
    for (let i = -w; i <= w; i++) P(g, wbx + 14 + i, wby - 1 - j, i < 0 ? bn[2] : bn[3]);
  }
  // gold coin stack on the counter
  for (let k = 0; k < 4; k++) {
    P(g, wbx + 19, wby - 1 - k, gd[1]);
    P(g, wbx + 20, wby - 1 - k, gd[2]);
  }
  P(g, wbx + 19, wby - 5, gd[0]);
  // hanging trade sign (coin glyph)
  if (typeof hangingSign === 'function') hangingSign(g, x1 + 2, ytop + 24, 12, 9, dt, (gg, x, y, w, h) => {
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 4) P(gg, x + 6 + xx, y + 4 + yy, RAMP.gold[1]);
    P(gg, x + 6, y + 4, RAMP.gold[0]);
  });
  // chimney smoke for a lived-in read
  if (typeof smoke === 'function') smoke(g, x1 - 8, ytop - 14);
  outline(g, RAMP.void);
  return g;
}

/* ===================== 3 · WATCHTOWER (80×152) ===================== */
function drawWatchtower() {
  const g = makeGrid(80, 152);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    em = RAMP.ember,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const cx = 40,
    baseY = 140;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 6, 30, {
    ash: true
  });

  // tall four-post timber tower, tapering slightly inward toward the platform
  const baseHW = 17,
    topHW = 13,
    botY = baseY,
    platY = 40;
  // back-right legs (drawn first, shadow)
  function leg(sideX, depth) {
    for (let y = platY; y <= botY; y++) {
      const t = (botY - y) / (botY - platY);
      const lx = cx + sideX * Math.round(baseHW - t * (baseHW - topHW)) + depth;
      P(g, lx, y - (depth ? Math.floor(depth / 2) : 0), depth ? dt[3] : sideX < 0 ? dt[1] : dt[2]);
      P(g, lx + 1, y - (depth ? Math.floor(depth / 2) : 0), dt[3]);
    }
  }
  leg(-1, 7);
  leg(1, 7); // back legs (recede up-right)
  leg(-1, 0);
  leg(1, 0); // front legs
  // X cross-braces between the front legs (three storeys)
  for (const by of [botY - 28, botY - 60, botY - 88]) {
    const t0 = (botY - by) / (botY - platY),
      t1 = (botY - (by - 28)) / (botY - platY);
    const lxB = cx - Math.round(baseHW - t0 * (baseHW - topHW)),
      rxB = cx + Math.round(baseHW - t0 * (baseHW - topHW));
    const lxT = cx - Math.round(baseHW - t1 * (baseHW - topHW)),
      rxT = cx + Math.round(baseHW - t1 * (baseHW - topHW));
    const n = 30;
    for (let k = 0; k <= n; k++) {
      P(g, Math.round(lxB + (rxT - lxB) * k / n), Math.round(by - 28 * k / n), dt[2]);
      P(g, Math.round(rxB + (lxT - rxB) * k / n), Math.round(by - 28 * k / n), dt[3]);
    }
    // horizontal girt
    for (let x = lxB; x <= rxB; x++) P(g, x, by, dt[3]);
  }

  // the railed lookout platform (overhangs the posts)
  const pHW = topHW + 5,
    pTop = platY;
  // platform deck (iso slab)
  for (let d = 0; d <= 10; d++) for (let x = -pHW; x <= pHW; x++) P(g, cx + x + d, pTop + 6 - Math.floor(d / 2), d === 0 || x === -pHW ? dt[1] : d >= 9 ? dt[3] : dt[2]);
  for (let x = -pHW; x <= pHW; x++) {
    P(g, cx + x, pTop + 6, dt[3]);
    P(g, cx + x, pTop + 7, dt[3]);
  } // deck underside
  // corner posts + railing
  for (let x = -pHW; x <= pHW; x += 1) if (x === -pHW || x === pHW || x % 6 === 0) for (let k = 0; k < 9; k++) P(g, cx + x, pTop + 5 - k, dt[3]);
  for (let x = -pHW; x <= pHW; x++) P(g, cx + x, pTop - 4, dt[2]); // top rail
  // little shingled roof over the platform
  const rHW = pHW + 3,
    roofH = 16;
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH,
      hw = Math.round(rHW * t);
    const yy = pTop - 5 - roofH + y;
    for (let x = -hw; x <= hw; x++) {
      let c = st[1];
      if (x < -hw + 2) c = st[0];
      if (x > hw - 1) c = st[2];
      if (y % 3 === 0) c = st[3];
      P(g, cx + x, yy, c);
    }
  }
  for (let d = 1; d <= 10; d++) for (let y = 0; y <= roofH; y++) {
    const t = y / roofH;
    const x = Math.round(d + rHW * t);
    const yy = Math.round(pTop - 5 - roofH - Math.floor(d / 2) + y);
    P(g, cx + x, yy, y % 3 === 0 ? st[3] : st[2]);
  }
  for (let d = 0; d <= 10; d++) P(g, cx + d, pTop - 5 - roofH - Math.floor(d / 2), st[0]); // ridge
  // a warning bell hung under the eave
  P(g, cx + pHW - 3, pTop - 6, st[3]);
  for (let j = 0; j < 4; j++) {
    const w = 1 + j;
    for (let i = -w; i <= w; i++) P(g, cx + pHW - 3 + i, pTop - 5 + j, st[2]);
  }
  P(g, cx + pHW - 3, pTop - 1, st[3]);

  // signal brazier glowing on the platform (the lookout's fire) + drift-touched smoke
  const fxp = cx - 4,
    fy = pTop + 2;
  for (let i = -3; i <= 3; i++) P(g, fxp + i, fy, st[3]);
  for (let k = 0; k < 5; k++) {
    const hw = 3 - Math.floor(k / 2);
    for (let i = -hw; i <= hw; i++) P(g, fxp + i, fy - 2 - k, k < 2 ? em[0] : em[1]);
  }
  for (let yy = -3; yy <= 1; yy++) for (let xx = -5; xx <= 5; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 3 && d < 6 && (xx + yy) % 2 === 0) P(g, fxp + xx, fy - 3 + yy, em[2]);
  }
  // ladder up the front-left leg
  const ldx = cx - baseHW + 4;
  for (let y = pTop + 8; y <= botY - 2; y += 4) for (let i = 0; i < 6; i++) P(g, ldx + i, y, dt[3]);
  for (let y = pTop + 8; y <= botY - 2; y++) {
    P(g, ldx, y, dt[2]);
    P(g, ldx + 5, y, dt[2]);
  }
  // a small banner with the frontier mark on a front leg
  const bx = cx + baseHW - 4;
  for (let y = botY - 70; y <= botY - 46; y++) for (let i = 0; i < 8; i++) {
    const wob = Math.round(Math.sin(y * 0.4) * 0.6);
    let c = bn[2];
    if (i === 0) c = bn[1];
    if (i >= 6) c = bn[3];
    P(g, bx - i + wob, y, c);
  }
  P(g, bx - 4, botY - 60, dr[1]);
  P(g, bx - 5, botY - 59, dr[2]);
  P(g, bx - 3, botY - 59, dr[2]);
  P(g, bx - 4, botY - 58, dr[2]); // drift emblem

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const OUTPOST = {
  palisade_gate: {
    fn: () => drawPalisadeGate(),
    cell: [144, 128],
    anchor: [72, 127],
    footprint: '3x3',
    tile: true,
    labelClear: true
  },
  trading_post: {
    fn: () => drawTradingPost(),
    cell: [120, 130],
    anchor: [60, 129],
    footprint: '3x3',
    tile: true,
    labelClear: true
  },
  watchtower: {
    fn: () => drawWatchtower(),
    cell: [80, 152],
    anchor: [40, 151],
    footprint: '2x2',
    tile: true,
    labelClear: true
  }
};
Object.assign(globalThis, {
  drawPalisadeGate,
  drawTradingPost,
  drawWatchtower,
  OUTPOST
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/outpost.js", error: String((e && e.message) || e) }); }

// assets/_gen/pixlib.js
try { (() => {
// Naevyr sprite generator library — evaled inside run_script.
// Pixel grids -> auto outline -> row-run-merged <rect> SVG (crispEdges).
// Deterministic RNG only; alpha used ONLY for the corruption overlay.

function makeGrid(w, h) {
  return {
    w,
    h,
    d: new Array(w * h).fill(null)
  };
}
function P(g, x, y, c, a) {
  x = x | 0;
  y = y | 0;
  if (x < 0 || y < 0 || x >= g.w || y >= g.h || !c) return;
  g.d[y * g.w + x] = a == null ? {
    c
  } : {
    c,
    a
  };
}
function G(g, x, y) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null;
  return g.d[y * g.w + x];
}
function fillRect(g, x, y, w, h, c, a) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(g, x + i, y + j, c, a);
}
function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function outline(g, c) {
  c = c || '#0a0810';
  const add = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach(p => P(g, p[0], p[1], c));
}
function stamp(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const v = G(src, x, y);
    if (v) P(dst, ox + x, oy + y, v.c, v.a);
  }
}
function mirrorX(g) {
  const m = makeGrid(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) P(m, g.w - 1 - x, y, v.c, v.a);
  }
  return m;
}
function gridRects(g, ox, oy) {
  ox = ox || 0;
  oy = oy || 0;
  const out = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = G(g, x, y);
      if (!v) {
        x++;
        continue;
      }
      let x2 = x + 1;
      while (x2 < g.w) {
        const v2 = G(g, x2, y);
        if (!v2 || v2.c !== v.c || (v2.a == null ? 1 : v2.a) !== (v.a == null ? 1 : v.a)) break;
        x2++;
      }
      out.push({
        x: x + ox,
        y: y + oy,
        w: x2 - x,
        c: v.c,
        a: v.a
      });
      x = x2;
    }
  }
  return out;
}
function rectsToSvg(rects, w, h) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' + rects.map(r => '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="1" fill="' + r.c + '"' + (r.a != null ? ' fill-opacity="' + r.a + '"' : '') + '/>').join('') + '</svg>';
}
function gridSvg(g) {
  return rectsToSvg(gridRects(g), g.w, g.h);
}
function sheetSvg(grids, cw, ch, cols) {
  const n = grids.length;
  cols = cols || n;
  const rows = Math.ceil(n / cols);
  let rects = [];
  grids.forEach((g, i) => {
    rects = rects.concat(gridRects(g, i % cols * cw, Math.floor(i / cols) * ch));
  });
  return rectsToSvg(rects, cols * cw, rows * ch);
}
function drawGrid(ctx, g, ox, oy, s) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (!v) continue;
    ctx.globalAlpha = v.a == null ? 1 : v.a;
    ctx.fillStyle = v.c;
    ctx.fillRect(ox + x * s, oy + y * s, s, s);
  }
  ctx.globalAlpha = 1;
}

// 64x32 iso diamond face rows: y -> inclusive [x0,x1]
function diamondRows() {
  const rows = [];
  for (let y = 0; y < 32; y++) {
    const half = y < 16 ? 2 * (y + 1) : 2 * (32 - y);
    rows.push({
      x0: 32 - half,
      x1: 32 + half - 1
    });
  }
  return rows;
}
function inDiamond(rows, x, y) {
  if (y < 0 || y > 31) return false;
  return x >= rows[y].x0 && x <= rows[y].x1;
}
const RAMP = {
  grass: ['#7fae5e', '#4d7c4d', '#356037', '#20402a'],
  dirt: ['#7a6048', '#50402e', '#36291c', '#241a11'],
  stone: ['#4a4360', '#322b46', '#211c30', '#14101e'],
  water: ['#4a7fa0', '#2c5775', '#173a52', '#0d2336'],
  drift: ['#f3e8ff', '#d8b4fe', '#a855f7', '#6b21a8', '#3b1162'],
  ember: ['#fcd34d', '#f59e0b', '#b45309', '#7c3a06'],
  gold: ['#f6e0a6', '#e7c873', '#b8943f', '#7c5f23'],
  blood: ['#ef4444', '#dc2626', '#991b1b', '#5f1212'],
  bone: ['#efe9f4', '#d8cfe0', '#a99fb8', '#6f6781'],
  void: '#0a0810',
  ash: '#171320'
};
Object.assign(globalThis, {
  makeGrid,
  P,
  G,
  fillRect,
  mulberry,
  outline,
  stamp,
  mirrorX,
  gridRects,
  rectsToSvg,
  gridSvg,
  sheetSvg,
  drawGrid,
  diamondRows,
  inDiamond,
  RAMP
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/pixlib.js", error: String((e && e.message) || e) }); }

// assets/_gen/roads.js
try { (() => {
// Naevyr FRONTIER EXPANSION · ROADS — iso auto-tile terrain set.
// Eval after pixlib.js + tiles.js (uses hash2, diamondRows, inDiamond, RAMP).
//
// Roads SINK INTO the terrain like the drawFloor interior tiles: 64×36 cell,
// diamond-center anchored (32,16), drawn OVER the ground tile, painting only the
// worn road ribbon with SOFT DITHERED edges that blend into the ground — and NO
// billboard void outline on the ground-facing sides (the locked-conventions
// exception for floor-style tiles). Packed-earth bed + worn cobble center line,
// dithered ruts. RAMP only, dither not blur, crispEdges.
//
// A COMPACT AUTO-TILE SET keyed by a 4-neighbour road bitmask. The engine
// rotates / mirrors these ~6 canonical pieces to cover all 16 masks; we ship the
// canonical orientation of each shape + an optional drift-eaten `road_broken`.
//
//   bit 0 = NE neighbour, 1 = SE, 2 = SW, 3 = NW  (the diamond's four edges)
//   straight  NE+SW (5)   ·  bend SE+SW (6)  ·  tee NE+SE+SW (7)
//   cross     all (15)    ·  cap  SW (4)     ·  isolated (0)

const ROAD_CENTER = [32, 16];
// the midpoint of each diamond edge — where a road meets the neighbour tile's road.
const ROAD_EDGE = {
  ne: [48, 8],
  se: [48, 24],
  sw: [16, 24],
  nw: [16, 8]
};
const ROAD_BIT = {
  ne: 1,
  se: 2,
  sw: 4,
  nw: 8
};

// canonical pieces: name -> connected dirs (engine rotates/mirrors to fill 16 masks)
const ROAD_PIECES = {
  straight: ['ne', 'sw'],
  bend: ['se', 'sw'],
  tee: ['ne', 'se', 'sw'],
  cross: ['ne', 'se', 'sw', 'nw'],
  cap: ['sw'],
  isolated: []
};
function roadMask(dirs) {
  return dirs.reduce((m, d) => m | ROAD_BIT[d], 0);
}
function distSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax,
    vy = by - ay,
    wx = px - ax,
    wy = py - ay;
  const L2 = vx * vx + vy * vy || 1;
  let t = (wx * vx + wy * vy) / L2;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * vx),
    dy = py - (ay + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}
function drawRoad(dirs, broken) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const dt = RAMP.dirt,
    st = RAMP.stone,
    bn = RAMP.bone,
    dr = RAMP.drift;
  const [cxC, cyC] = ROAD_CENTER;
  const segs = dirs.map(d => [cxC, cyC, ROAD_EDGE[d][0], ROAD_EDGE[d][1]]);
  const isolated = dirs.length === 0;
  const seed = 900 + roadMask(dirs) + (broken ? 50 : 0);

  // iso distance scaled so the band reads circular on the 2:1 diamond
  const isoD = (px, py, ax, ay, bx, by) => distSeg(px, py * 2, ax, ay * 2, bx, by * 2);
  const BED = 7; // packed-earth bed half-width
  const COB = 2.4; // cobble center-line half-width

  for (let y = 0; y < 32; y++) {
    for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      // distance to the nearest connected segment (+ a hub disc at the center)
      let d = Infinity;
      for (const s of segs) d = Math.min(d, isoD(x, y, s[0], s[1], s[2], s[3]));
      const dHub = isoD(x, y, cxC, cyC, cxC, cyC);
      if (isolated) d = dHub; // lone worn patch
      const onBed = d <= BED || dHub <= (isolated ? 6 : 5.5);
      if (!onBed) continue;

      // ----- soft dithered outer edge (blends into ground, no outline) -----
      const edge = Math.min(BED - d, BED - 0); // proximity to bed rim
      if (d > BED - 1.6 && (x + y) % 2 === 1) continue; // 50% dither at the rim
      if (d > BED - 0.7 && hash2(x, y, seed + 3) < 0.5) continue;

      // ----- packed-earth bed -----
      let c = dt[2];
      if (hash2(x, y, seed) < 0.16) c = dt[3]; // trodden dark patches
      else if (hash2(x, y, seed + 1) < 0.12) c = dt[1]; // dry highlight grit
      // worn ruts: two darker dithered tracks flanking the center line
      const rut = d > COB + 1 && d < COB + 3.2;
      if (rut && (x + y) % 2 === 0 && hash2(x, y, seed + 2) < 0.7) c = dt[3];

      // ----- worn cobble center line -----
      const onCob = d <= COB || !isolated && dHub <= COB + 0.6;
      if (onCob) {
        c = st[1];
        if (hash2(x, y, seed + 4) < 0.30) c = st[2]; // set stones
        if (hash2(x, y, seed + 5) < 0.14) c = st[3]; // mortar seams (dark)
        if (hash2(x, y, seed + 6) < 0.08) c = bn[2]; // pale worn cobble cap
        // moonlit-left / shadowed-right shaping on each stone
        if ((x + y) % 2 === 0 && hash2(x, y, seed + 7) < 0.4) c = st[0];
      }

      // ----- broken / drift-eaten variant -----
      if (broken) {
        const h = hash2(x, y, seed + 8);
        if (onCob && h < 0.45) c = (x + y) % 2 === 0 ? dt[3] : RAMP.void; // shattered cobbles
        else if (h < 0.10) c = RAMP.void; // pot-holes / cracks
        else if (h < 0.16) c = dr[3]; // drift creep
        if (h < 0.05) c = dr[2]; // a few drift motes
      }
      P(g, x, y, c);
    }
  }

  // NO outline() — roads sink into the terrain (floor-style exception).
  return g;
}

/* ============================ REGISTRY ============================ */
// Each piece is one frame; the engine derives every mask by rotate/mirror.
const ROADS = {};
Object.keys(ROAD_PIECES).forEach(name => {
  ROADS['road_' + name] = {
    fn: () => drawRoad(ROAD_PIECES[name], false),
    cell: [64, 36],
    tile: [64, 32],
    anchor: [32, 16],
    sink: true,
    outline: false,
    connects: ROAD_PIECES[name],
    mask: roadMask(ROAD_PIECES[name])
  };
});
ROADS.road_broken = {
  fn: () => drawRoad(ROAD_PIECES.straight, true),
  cell: [64, 36],
  tile: [64, 32],
  anchor: [32, 16],
  sink: true,
  outline: false,
  variantOf: 'road_straight',
  connects: ROAD_PIECES.straight,
  mask: roadMask(ROAD_PIECES.straight),
  note: 'corrupt-cell variant; engine may instead hide the road on a corrupt cell'
};

// the full auto-tile lookup the engine fills by rotating/mirroring the 6 canon pieces.
const ROAD_AUTOTILE = {
  bits: {
    ne: 1,
    se: 2,
    sw: 4,
    nw: 8
  },
  canon: Object.fromEntries(Object.keys(ROAD_PIECES).map(n => [n, roadMask(ROAD_PIECES[n])])),
  rule: 'index by 4-neighbour road bitmask; rotate/mirror the matching canonical piece'
};
Object.assign(globalThis, {
  drawRoad,
  distSeg,
  ROAD_CENTER,
  ROAD_EDGE,
  ROAD_BIT,
  ROAD_PIECES,
  roadMask,
  ROADS,
  ROAD_AUTOTILE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/roads.js", error: String((e && e.message) || e) }); }

// assets/_gen/ruins.js
try { (() => {
// Naevyr FRONTIER EXPANSION · RUINS & LANDMARKS — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass/spike/moteBurst from beasts.js).
//
// The wayside landmarks the road wanders between. Native-size, BOTTOM-CENTER anchored,
// 1px #0a0810 void outline, dither not blur, moonlit-left / shadowed-right, RAMP only.
//   waystone 28×44 (faint rune, 2f glow) · broken_arch 96×88 · fallen_statue 72×72 ·
//   battlefield_bones 80×40 (ground decor) · drift_monolith 48×96 (2f shimmer).
//
// NB drift_monolith ships a full dirt apron pad INSIDE its own canvas — the old obelisk
// sprite clipped its south foundation off-canvas; here the pad fits entirely on-cell.

// self-contained packed-earth apron diamond (so ruins don't depend on town.js)
function apron(g, cx, southY, halfW) {
  const dt = RAMP.dirt;
  const halfH = Math.round(halfW / 2);
  const topY = southY - halfH; // diamond spans topY .. southY
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    const y = topY + halfH + dy;
    for (let dx = -w; dx <= w; dx++) {
      let c = dt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dt[0];else if (dy > halfH * 0.3) c = dt[2];
      if (hash2(cx + dx, y, 3) < 0.07) c = dt[2];
      P(g, cx + dx, y, c);
    }
  }
  // front rim plinth (south faces)
  for (let dx = -halfW; dx <= halfW; dx++) {
    const t = 1 - Math.abs(dx) / halfW;
    const edgeY = topY + halfH + Math.round(halfH * t);
    for (let k = 1; k <= 3; k++) P(g, cx + dx, edgeY + k, dx < 0 ? RAMP.stone[2] : RAMP.stone[3]);
  }
}

/* ===================== WAYSTONE (28×44, 2-frame rune glow) ===================== */
function drawWaystone(frame) {
  frame = frame || 0;
  const g = makeGrid(28, 44);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone,
    gd = RAMP.gold;
  const cx = 14,
    baseY = 41;
  // small earth pad
  apron(g, cx, baseY, 11);
  // a leaning weathered marker stone — wider base, chipped top
  const botY = baseY - 1,
    topY = 6;
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const lean = Math.round(t * 1.5); // leans slightly right
    const hw = Math.round(6.5 - t * 2.2);
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + lean;
      let c = st[1];
      if (x <= -hw + 1) c = st[0]; // moonlit left
      else if (x >= hw - 1) c = st[3]; // shadow right
      if (hash2(sx, y, 102) < 0.07) c = st[2]; // pitting
      if (hash2(sx, y, 103) < 0.02) c = st[3]; // cracks
      P(g, sx, y, c);
    }
  }
  // chipped/rounded crown
  P(g, cx + 1, topY - 1, st[1]);
  P(g, cx, topY - 1, st[0]);
  P(g, cx + 4, topY + 1, RAMP.void); // a knocked-off corner
  // moss / lichen at the base
  for (let i = 0; i < 6; i++) {
    const mx = cx - 5 + Math.floor(hash2(i, 1, 104) * 11),
      my = botY - Math.floor(hash2(i, 2, 104) * 4);
    P(g, mx, my, RAMP.grass[2]);
  }
  // a carved directional rune (chevron + bar) on the face — glows on frame 1
  const lit = frame === 1;
  const rc = lit ? dr[0] : '#3b1162';
  const rim = lit ? dr[1] : dr[3];
  [[cx - 2, 20], [cx - 1, 21], [cx, 22], [cx + 1, 21], [cx + 2, 20]].forEach(([rx, ry]) => P(g, rx, ry, rc)); // chevron
  [[cx, 24], [cx, 26], [cx - 1, 28], [cx + 1, 28]].forEach(([rx, ry]) => P(g, rx, ry, rim)); // shaft + feet
  if (lit) {
    // faint glow halo around the rune
    for (let yy = 18; yy <= 30; yy++) for (let xx = -5; xx <= 6; xx++) {
      const d = Math.abs(xx) + Math.abs(yy - 24);
      if (d > 4 && d < 7 && (xx + yy) % 2 === 0 && !G(g, cx + xx, yy)) P(g, cx + xx, yy, dr[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ===================== BROKEN ARCH (96×88) ===================== */
function drawBrokenArch() {
  const g = makeGrid(96, 88);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone,
    gr = RAMP.grass;
  const cx = 48,
    baseY = 84;
  apron(g, cx, baseY, 42);

  // helper: a weathered ashlar block column
  function pier(px, topY, w) {
    for (let y = baseY - 2; y >= topY; y--) {
      const sway = Math.round((baseY - y) * 0.04); // slight outward lean
      for (let x = -w; x <= w; x++) {
        const sx = px + x + sway;
        let c = st[1];
        if (x < -w + 2) c = st[0];
        if (x > w - 2) c = st[3];
        // ashlar courses
        if ((baseY - y) % 9 === 0) c = st[3];
        if ((x + Math.floor((baseY - y) / 9) * 3) % 7 === 0) c = st[3];
        if (hash2(sx, y, 111) < 0.06) c = st[2];
        if (hash2(sx, y, 112) < 0.02) c = dr[3]; // drift in the cracks
        P(g, sx, y, c);
      }
    }
  }
  // LEFT pier — tall, intact, with the arch springer
  pier(26, 18, 9);
  // RIGHT pier — snapped off partway (collapsed)
  pier(72, 40, 9);

  // the ARCH — a thick stone band springing from the left pier, broken at the apex
  const aCx = 49,
    aCy = 24,
    aR = 26,
    band = 9;
  for (let deg = 200; deg <= 340; deg += 1) {
    // left half + over the top, stops before the right
    const a = deg * Math.PI / 180;
    for (let b = 0; b < band; b++) {
      const r = aR - b;
      const x = Math.round(aCx + Math.cos(a) * r * 1.0);
      const y = Math.round(aCy - Math.sin(a) * r * 0.8); // squashed for iso
      if (y > baseY - 2) continue;
      // break the arch just past the crown (drop the far-right voussoirs)
      if (deg > 305 && hash2(x, y, 113) < 0.6) continue;
      let c = st[1];
      if (b < 2) c = st[0];
      if (b > band - 3) c = st[3];
      if (deg % 14 < 2) c = st[3]; // voussoir joints
      if (hash2(x, y, 114) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  // fallen voussoir blocks + rubble heaped at the right base
  [[66, baseY - 8, 9, 7], [78, baseY - 6, 8, 6], [70, baseY - 14, 7, 6], [84, baseY - 5, 6, 5]].forEach(([x, y, w, h], i) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1];
      if (xx < x + 2) c = st[0];
      if (xx > x + w - 3) c = st[3];
      if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 115 + i) < 0.08) c = st[2];
      P(g, xx, yy, c);
    }
  });
  for (let i = 0; i < 22; i++) {
    const x = 58 + Math.floor(hash2(i, 1, 116) * 34),
      y = baseY - 2 - Math.floor(hash2(i, 2, 116) * 4);
    P(g, x, y, hash2(i, 3, 116) < 0.5 ? st[2] : st[3]);
  }
  // grass reclaiming the base + drift seeping from the broken apex
  for (let i = 0; i < 14; i++) {
    const x = 18 + Math.floor(hash2(i, 4, 117) * 60),
      y = baseY - 2 - Math.floor(hash2(i, 5, 117) * 2);
    P(g, x, y, gr[2]);
  }
  [[64, 26], [68, 30], [66, 34]].forEach(([mx, my]) => P(g, mx, my, dr[2]));
  outline(g, RAMP.void);
  return g;
}

/* ===================== FALLEN STATUE (72×72) ===================== */
function drawFallenStatue() {
  const g = makeGrid(72, 72);
  const st = RAMP.stone,
    bn = RAMP.bone,
    dr = RAMP.drift,
    gr = RAMP.grass,
    gd = RAMP.gold;
  const cx = 36,
    baseY = 68;
  apron(g, cx, baseY, 32);

  // the toppled plinth (a stepped stone pedestal, now empty + cracked)
  for (let step = 0; step < 3; step++) {
    const w = 13 - step * 2,
      h = 4,
      x0 = 12 - step,
      y0 = baseY - 4 - step * 4;
    for (let yy = y0; yy < y0 + h; yy++) for (let x = x0; x < x0 + w * 2; x++) {
      let c = st[1];
      if (x < x0 + 2) c = st[0];
      if (x > x0 + w * 2 - 3) c = st[3];
      if (yy > y0 + h - 2) c = st[3];
      if (hash2(x, yy, 121) < 0.07) c = st[2];
      P(g, x, yy, c);
    }
  }
  // broken stumps of the statue's legs, snapped at the shin, still on the plinth
  for (const fx of [15, 21]) {
    for (let y = baseY - 24; y <= baseY - 16; y++) for (let x = fx; x <= fx + 4; x++) {
      let c = st[1];
      if (x > fx + 2) c = st[2];
      P(g, x, y, c);
    }
    for (let x = fx; x <= fx + 4; x++) P(g, x, baseY - 24, st[3]); /* jagged snapped top */
  }

  // the FALLEN figure — a stone warrior lying on its back, head to the right.
  // legs (broken off, lying between plinth and torso, knees bent)
  for (let x = 24; x <= 33; x++) {
    for (let j = 0; j < 5; j++) {
      let c = st[1];
      if (j === 0) c = st[0];
      if (j > 3) c = st[3];
      P(g, x, baseY - 6 - j, c);
    }
  }
  P(g, 33, baseY - 11, st[3]); // knee
  for (let x = 33; x <= 38; x++) {
    for (let j = 0; j < 4; j++) P(g, x, baseY - 8 - j - (x - 33), st[2]);
  } // raised shin
  // torso (broad carved cuirass slab, tapering to the waist)
  for (let x = 36; x <= 52; x++) {
    const t = (x - 36) / 16;
    const hh = Math.round(7 - Math.abs(t - 0.45) * 5); // chest broad, waist narrow
    for (let j = -hh; j <= hh; j++) {
      let c = st[1];
      if (j < -hh + 2) c = st[0];
      if (j > hh - 2) c = st[2];
      if (hash2(x, baseY - 9 + j, 122) < 0.06) c = st[2];
      P(g, x, baseY - 9 + j, c);
    }
  }
  // carved cuirass detail: collarbone ridge + a sun-sigil boss on the chest
  for (let x = 38; x <= 44; x++) P(g, x, baseY - 14, st[0]);
  ell(g, 43, baseY - 9, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.4 ? gd[1] : st[3]));
  // a great crack splitting the torso, drift glowing inside
  for (let k = -4; k <= 4; k++) {
    const yy = baseY - 9 + Math.round(Math.sin(k) * 1.3);
    P(g, 44 + k, yy, RAMP.void);
    P(g, 44 + k, yy - 1, dr[3]);
  }
  P(g, 44, baseY - 9, dr[1]);
  // shoulder pauldron + an arm flung out to the left, hand open
  ell(g, 37, baseY - 14, 3, 3, (x, y, d) => P(g, x, y, d < 0.5 ? st[0] : st[2])); // pauldron
  for (let k = 0; k < 8; k++) P(g, 35 - k, baseY - 13 + Math.round(k * 0.5), st[2]);
  ell(g, 27, baseY - 9, 3, 2, (x, y, d) => P(g, x, y, d < 0.5 ? st[1] : st[3])); // hand
  // neck connecting the torso to the broken-off head
  for (let x = 52; x <= 55; x++) for (let j = -2; j <= 2; j++) P(g, x, baseY - 9 + j, st[2]);
  // the broken-off HEAD, rolled to the right, face up (noble visage, hollow eyes, circlet)
  ell(g, 61, baseY - 8, 6, 6, (x, y, d, dx, dy) => {
    let c = st[1];
    if (dx < -0.3) c = st[0];
    if (dy > 0.3) c = st[2];
    if (d > 0.8) c = st[3];
    if (hash2(x, y, 123) < 0.06) c = st[2];
    P(g, x, y, c);
  });
  P(g, 59, baseY - 9, RAMP.void);
  P(g, 63, baseY - 9, RAMP.void); // hollow eyes
  P(g, 60, baseY - 9, st[3]);
  P(g, 64, baseY - 9, st[3]); // brow shade
  for (let x = 59; x <= 63; x++) P(g, x, baseY - 5, st[3]); // grim mouth line
  for (let x = 56; x <= 66; x++) P(g, x, baseY - 13, gd[2]); // worn circlet band
  P(g, 61, baseY - 14, gd[1]);
  P(g, 58, baseY - 13, gd[0]);
  // moss + rubble reclaiming the wreck
  for (let i = 0; i < 12; i++) {
    const x = 16 + Math.floor(hash2(i, 1, 124) * 50),
      y = baseY - 2 - Math.floor(hash2(i, 2, 124) * 2);
    P(g, x, y, hash2(i, 3, 124) < 0.5 ? gr[2] : st[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ===================== BATTLEFIELD BONES (80×40, ground decor) ===================== */
function drawBattlefieldBones() {
  const g = makeGrid(80, 40);
  const bn = RAMP.bone,
    dt = RAMP.dirt,
    st = RAMP.stone,
    bl = RAMP.blood,
    dr = RAMP.drift;
  const cx = 40,
    baseY = 37;
  // trampled dirt / ash ground patch (low, spreads wide)
  ell(g, cx, baseY - 2, 38, 8, (x, y, d) => {
    if (d > 0.92 && (x + y) % 2) return;
    let c = dt[2];
    if (d > 0.7) c = dt[3];
    if (hash2(x, y, 131) < 0.18) c = RAMP.ash;
    P(g, x, y, c);
  });

  // a half-buried RIBCAGE (arcing ribs from a spine)
  function ribcage(ox, oy, n, dirn) {
    for (let k = 0; k < n; k++) P(g, ox + k * dirn, oy, bn[3]); // spine
    for (let k = 0; k < n; k++) {
      const rx = ox + k * dirn;
      for (let j = 1; j <= 4; j++) {
        const yy = oy - j;
        P(g, rx + Math.round(j * 0.3) * dirn, yy, j < 4 ? bn[2] : bn[1]);
      }
    }
  }
  ribcage(20, baseY - 4, 7, 1);
  ribcage(54, baseY - 3, 6, -1);
  // two skulls
  [[16, baseY - 6], [60, baseY - 5]].forEach(([sx, sy]) => {
    ell(g, sx, sy, 4, 3.4, (x, y, d, dx, dy) => {
      let c = bn[2];
      if (dy < -0.2) c = bn[1];
      if (d > 0.78) c = bn[3];
      P(g, x, y, c);
    });
    P(g, sx - 1, sy, RAMP.void);
    P(g, sx + 1, sy, RAMP.void); // eye sockets
    P(g, sx, sy + 2, bn[3]); // jaw
  });
  // broken spears / arrows stuck in the ground at angles
  [[30, 1.2, 14], [44, -0.9, 16], [50, 1.6, 12], [12, -1.4, 10]].forEach(([bx, ang, len], i) => {
    for (let k = 0; k < len; k++) {
      const x = Math.round(bx + Math.cos(ang) * k),
        y = baseY - 4 - Math.round(Math.sin(ang) * k);
      P(g, x, y, dt[3]);
    }
    const tx = Math.round(bx + Math.cos(ang) * len),
      ty = baseY - 4 - Math.round(Math.sin(ang) * len);
    P(g, tx, ty, st[1]);
    P(g, tx + 1, ty, st[0]); // spearhead glint
  });
  // a couple of cracked round shields lying flat
  [[34, baseY - 2, bl], [58, baseY - 1, dt]].forEach(([sx, sy, ramp]) => {
    ell(g, sx, sy, 6, 3, (x, y, d) => {
      let c = ramp[2];
      if (d < 0.3) c = ramp[3];
      if (d > 0.72) c = ramp[1];
      P(g, x, y, c);
    });
    ell(g, sx, sy, 2, 1, (x, y) => P(g, x, y, RAMP.stone[2])); // boss
    for (let k = -5; k <= 5; k++) if (k % 3 === 0) P(g, sx + k, sy, RAMP.void); // splits
  });
  // faint drift motes drifting over the dead
  [[26, baseY - 10], [48, baseY - 12], [38, baseY - 8]].forEach(([mx, my], i) => P(g, mx, my, i % 2 ? dr[1] : dr[2]));
  outline(g, RAMP.void);
  return g;
}

/* ===================== DRIFT MONOLITH (48×96, 2-frame shimmer) ===================== */
function drawDriftMonolith(frame) {
  frame = frame || 0;
  const g = makeGrid(48, 96);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone;
  const cx = 24,
    baseY = 90;
  // FULL dirt apron pad — fits entirely inside the 48-wide canvas (the fix vs the old obelisk)
  apron(g, cx, baseY, 20);

  // the tapering monolith — a black-stone obelisk with a drift-crystal core seam
  const botY = baseY - 4,
    topY = 10;
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const hw = Math.round(8 - t * 4.5); // tapers toward the top
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x;
      let c = st[1];
      if (x <= -hw + 1) c = st[0]; // moonlit left face
      else if (x >= hw - 1) c = st[3]; // shadowed right face
      else if (x > 0) c = st[2];
      if (hash2(sx, y, 141) < 0.06) c = st[2]; // pitting
      if (hash2(sx, y, 142) < 0.025) c = st[3]; // cracks
      P(g, sx, y, c);
    }
  }
  // pyramidion cap
  for (let k = 0; k < 4; k++) for (let x = -(3 - k); x <= 3 - k; x++) P(g, cx + x, topY - 1 - k, x < 0 ? st[1] : st[2]);

  // a vertical drift-crystal seam glowing up the front face (shimmers across 2 frames)
  const lit0 = frame === 0,
    hi = dr[0],
    mid = dr[1],
    lo = dr[2];
  for (let y = botY - 4; y >= topY + 2; y -= 1) {
    const t = (botY - y) / (botY - topY);
    const jitter = Math.round(Math.sin(y * 0.6 + frame * 1.7));
    const sx = cx + jitter;
    // brightness travels up the seam by frame for a shimmer
    const phase = (Math.floor((botY - y) / 3) + frame) % 3;
    P(g, sx, y, phase === 0 ? hi : phase === 1 ? mid : lo);
    if (phase === 0) {
      P(g, sx - 1, y, mid);
      P(g, sx + 1, y, lo);
    }
  }
  // carved runes flanking the seam (pulse with frame)
  const runeC = frame === 0 ? dr[1] : dr[2];
  [22, 40, 58].forEach((ry, i) => {
    const y = botY - 10 - i * 20;
    if (y < topY + 4) return;
    [[-4, 1], [4, -1]].forEach(([rx, dirn]) => {
      P(g, cx + rx, y, runeC);
      P(g, cx + rx + dirn, y, runeC);
      P(g, cx + rx, y + 1, runeC);
    });
  });
  // drift-crystal shard crown bursting from the cap (Ash-Obelisk kinship)
  const cty = topY - 5;
  for (let k = 0; k < 8; k++) {
    const w = Math.max(0, Math.round((1 - k / 8) * 2));
    for (let i = -w; i <= w; i++) {
      let c = dr[2];
      if (i < 0) c = dr[1];
      if (i > 0) c = dr[3];
      if (i === 0 && k < 5) c = dr[0];
      P(g, cx + i, cty - k, c);
    }
  }
  P(g, cx, cty - 8, dr[0]);
  // glow halo around the crown + rising motes (brighten/drift per frame)
  const rr = frame === 0 ? 7 : 6;
  for (let yy = -7; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 4 && d < rr && (xx + yy + frame) % 2 === 0 && !G(g, cx + xx, cty - 3 + yy)) P(g, cx + xx, cty - 3 + yy, dr[2]);
  }
  for (let i = 0; i < 5; i++) {
    const mx = cx + Math.round((hash2(i, frame, 143) - 0.5) * 14);
    const my = topY + 6 + Math.round(hash2(i, 1, 143) * 40) - frame * 3;
    P(g, mx, my, hash2(i, 2, 143) < 0.4 ? dr[0] : dr[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const RUINS = {
  waystone: {
    fn: i => drawWaystone(i),
    cell: [28, 44],
    anchor: [14, 43],
    frames: 2,
    anim: {
      name: 'rune_glow',
      fps: 2,
      loop: true
    }
  },
  broken_arch: {
    fn: () => drawBrokenArch(),
    cell: [96, 88],
    anchor: [48, 87],
    footprint: '3x3'
  },
  fallen_statue: {
    fn: () => drawFallenStatue(),
    cell: [72, 72],
    anchor: [36, 71],
    footprint: '2x2'
  },
  battlefield_bones: {
    fn: () => drawBattlefieldBones(),
    cell: [80, 40],
    anchor: [40, 39],
    ground: true
  },
  drift_monolith: {
    fn: i => drawDriftMonolith(i),
    cell: [48, 96],
    anchor: [24, 95],
    frames: 2,
    anim: {
      name: 'shimmer',
      fps: 2,
      loop: true
    },
    footprint: '2x2'
  }
};
Object.assign(globalThis, {
  apron,
  drawWaystone,
  drawBrokenArch,
  drawFallenStatue,
  drawBattlefieldBones,
  drawDriftMonolith,
  RUINS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/ruins.js", error: String((e && e.message) || e) }); }

// assets/_gen/social.js
try { (() => {
// Naevyr SOCIAL / LAUNCH pack — eval after pixlib.js + tiles.js + fxlogo.js.
// Coin/pfp sigil + widescreen X banner. Rect-grid, RAMP only, 1px void feel,
// dither not blur, deterministic. Export with nearest-neighbor integer upscale.

/* ---- local circle helpers (filled / ring) ---- */
function disc(g, cx, cy, r, fn) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (d <= r) fn(x, y, d);
  }
}
function ring(g, cx, cy, r, w, c) {
  disc(g, cx, cy, r, (x, y, d) => {
    if (d >= r - w) P(g, x, y, c);
  });
}

/* ============================ COIN SIGIL (square, parametric) ============================
   The warded gate rune (triangle-in-circle door sigil) struck in gold on a
   void/drift field, ringed by a thin gold circle like a coin face. Drift
   corruption creeps in from the upper-left rim. Readable at 32px. */
function drawCoinSigil(N, ticker) {
  const g = makeGrid(N, N);
  const cx = (N - 1) / 2,
    cy = (N - 1) / 2;
  const gd = RAMP.gold,
    dr = RAMP.drift,
    st = RAMP.stone;
  const Rrim = N * 0.47; // coin edge
  const Rfield = N * 0.42; // inner field
  const Rsig = N * 0.30; // sigil ring radius

  // --- coin field: dark drift-purple, dithered toward void at the rim, brightest center ---
  disc(g, cx, cy, Rfield, (x, y, d) => {
    const t = d / Rfield; // 0 center .. 1 rim
    let c;
    if (t < 0.4) c = (x + y) % 2 === 0 ? '#241038' : RAMP.void; // calm dark center (contrast)
    else if (t < 0.72) c = (x + y) % 2 === 0 ? dr[4] : '#1a0c2c';else c = (x + y) % 2 === 0 ? dr[4] : RAMP.void;
    P(g, x, y, c);
  });

  // --- struck coin rim: gold ring with bevel (lit top-left, dark bottom-right) ---
  disc(g, cx, cy, Rrim, (x, y, d) => {
    if (d < Rfield - 0.5) return;
    const ang = Math.atan2(y - cy, x - cx);
    const lit = Math.cos(ang + 2.4) > 0; // top-left lit
    let c = lit ? gd[1] : gd[3];
    if (d > Rrim - 1.2) c = RAMP.void; // outer 1px void edge
    else if (d > Rrim - 2.4) c = lit ? gd[0] : gd[2];
    P(g, x, y, c);
  });
  // inner rim hairline
  ring(g, cx, cy, Rfield + 0.6, 1, gd[3]);

  // --- the door sigil: gold ring + triangle (point up) + inner ring + center mote ---
  ring(g, cx, cy, Rsig, Math.max(1, N * 0.012), gd[1]);
  ring(g, cx, cy, Rsig, Math.max(1, N * 0.012), gd[1]);
  // upward triangle inscribed in the sigil ring
  const verts = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
    return [cx + Math.cos(a) * Rsig * 0.86, cy + Math.sin(a) * Rsig * 0.86];
  });
  function thickLine(x0, y0, x1, y1, c, t) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n,
        y = y0 + (y1 - y0) * i / n;
      for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c);
    }
  }
  const tw = Math.max(1, Math.round(N * 0.018));
  thickLine(verts[0][0], verts[0][1], verts[1][0], verts[1][1], gd[0], tw);
  thickLine(verts[1][0], verts[1][1], verts[2][0], verts[2][1], gd[1], tw);
  thickLine(verts[2][0], verts[2][1], verts[0][0], verts[0][1], gd[1], tw);
  // inner downward triangle ring (second sigil layer, dimmer) + center
  ring(g, cx, cy, Rsig * 0.5, 1, gd[2]);
  disc(g, cx, cy, N * 0.04, (x, y, d) => P(g, x, y, d < N * 0.02 ? dr[0] : dr[1])); // drift-core mote
  // vertical keyhole accent through the triangle
  for (let yy = -Rsig * 0.5; yy <= Rsig * 0.55; yy++) P(g, Math.round(cx), Math.round(cy + yy), (cy + yy | 0) % 2 ? gd[1] : gd[2]);

  // --- drift corruption creeping in from the upper-left rim ---
  const seedN = 911;
  disc(g, cx, cy, Rfield, (x, y, d) => {
    if (d < Rfield - 0.5) return;
    // only upper-left arc
    const ang = Math.atan2(y - cy, x - cx);
    if (Math.cos(ang + 2.4) < 0.25) return;
    if (hash2(x, y, seedN) < 0.6) {
      // tendrils reaching inward
      const reach = 2 + Math.floor(hash2(x, y, seedN + 1) * (N * 0.13));
      for (let k = 0; k < reach; k++) {
        const px = Math.round(x + Math.cos(ang) * -k),
          py = Math.round(y + Math.sin(ang) * -k);
        const fade = 1 - k / reach;
        if ((px + py) % 2 === 0 && hash2(px, py, seedN + 2) < fade * 0.8) P(g, px, py, hash2(px, py, 3) < 0.3 ? dr[1] : dr[3]);
      }
    }
  });
  // a few bright motes drifting off that rim
  const mr = mulberry(seedN);
  for (let i = 0; i < Math.round(N / 8); i++) {
    const a = -Math.PI * 0.95 + mr() * 0.9;
    const rr = Rfield * (0.7 + mr() * 0.28);
    const x = Math.round(cx + Math.cos(a) * rr),
      y = Math.round(cy + Math.sin(a) * rr);
    P(g, x, y, mr() < 0.4 ? dr[0] : dr[1]);
  }

  // --- optional struck ticker legend ($DRIFTS) along the lower field ---
  if (ticker) {
    const tw = 4 + textWidth35('DRIFTS'); // $ (4) + DRIFTS
    const sc = N >= 120 ? 1 : 1;
    const tx = Math.round(cx - tw / 2),
      ty = Math.round(cy + Rsig + N * 0.07);
    // small darkened plinth so gold reads over the dither
    for (let y = ty - 2; y <= ty + 7; y++) for (let x = tx - 3; x <= tx + tw + 2; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d < Rfield - 1) P(g, x, y, (x + y) % 2 === 0 ? '#160a26' : RAMP.void);
    }
    for (let x = tx - 3; x <= tx + tw + 2; x++) {
      P(g, x, ty - 3, gd[3]);
      P(g, x, ty + 8, gd[3]);
    } // hairline rails
    drawTicker(g, tx, ty, gd[0], RAMP.void);
  }
  return g;
}

/* ============================ COMPACT TAGLINE FONT (3×5) ============================ */
const FONT35 = {
  A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '110', '100', '110', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['010', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  ' ': ['000', '000', '000', '000', '000'],
  $: ['111', '110', '011', '110', '111']
};
// "$DRIFTS" struck in gold with a void shadow + a center keyhole bar on the $.
function drawTicker(g, x0, y0, col, shadow) {
  // $ glyph with a vertical bar extending 1px above & below (true dollar look)
  const dollar = FONT35['$'];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (dollar[y][x] === '1') {
    if (shadow) P(g, x0 + x, y0 + y + 1, shadow);
    P(g, x0 + x, y0 + y, col);
  }
  if (shadow) {
    P(g, x0 + 1, y0 - 1 + 1, shadow);
    P(g, x0 + 1, y0 + 5 + 1, shadow);
  }
  P(g, x0 + 1, y0 - 1, col);
  P(g, x0 + 1, y0 + 5, col);
  return drawText35(g, 'DRIFTS', x0 + 4, y0, col, shadow);
}
function textWidth35(str) {
  let w = 0;
  for (const ch of str.toUpperCase()) w += (FONT35[ch] ? 3 : 3) + 1;
  return w - 1;
}
function drawText35(g, str, x0, y0, col, shadow) {
  let ox = x0;
  for (const ch of str.toUpperCase()) {
    const gl = FONT35[ch];
    if (gl) for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (gl[y][x] === '1') {
      if (shadow) P(g, ox + x, y0 + y + 1, shadow);
      P(g, ox + x, y0 + y, col);
    }
    ox += 4;
  }
  return ox - 1;
}

/* ============================ X BANNER (375×125, 3:1) ============================ */
function drawBanner(centered) {
  const W = 375,
    H = 125,
    g = makeGrid(W, H);
  const dr = RAMP.drift,
    bn = RAMP.bone,
    st = RAMP.stone,
    gd = RAMP.gold;
  const horizon = 92;

  // --- dusk/night sky: stepped dither bands ---
  const bands = [[0, 24, RAMP.void, '#120f1c'], [24, 48, '#120f1c', RAMP.ash], [48, 72, RAMP.ash, '#241d33'], [72, horizon, '#241d33', '#2c2240']];
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        const dith = (x + y) % 2 === 0 ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });

  // --- pale moon, left-high ---
  const mx = 64,
    my = 30;
  disc(g, mx, my, 13, (x, y, d) => {
    let c = bn[2];
    if (x - mx + (y - my) < -5) c = bn[1];
    if (d > 10) c = bn[3];
    P(g, x, y, c);
  });
  // scattered craters (not face-like)
  [[-5, -3, 2], [3, -5, 1], [5, 2, 2], [-2, 4, 1], [-6, 1, 1], [1, -1, 1]].forEach(([ox, oy, r]) => disc(g, mx + ox, my + oy, r, (x, y, d) => {
    if (d <= r) P(g, x, y, '#2c2240');
  }));
  // halo dither
  disc(g, mx, my, 18, (x, y, d) => {
    if (d > 13 && d < 18 && (x + y) % 2 === 0 && hash2(x, y, 71) < 0.4) P(g, x, y, '#2c2240');
  });

  // --- stars (dithered), skip near moon & where text sits ---
  const sr = mulberry(720);
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(sr() * W),
      y = Math.floor(sr() * (horizon - 6));
    if ((x - mx) ** 2 + (y - my) ** 2 < 360) continue;
    P(g, x, y, sr() < 0.25 ? bn[1] : bn[3]);
  }

  // --- Waystation rooftops as a dark horizon line ---
  for (let x = 0; x < W; x++) {
    for (let y = horizon; y < H; y++) {
      let c = y < horizon + 6 ? '#171221' : y < horizon + 18 ? '#100c1a' : RAMP.void;
      P(g, x, y, c);
    }
  }
  // roof silhouettes (varied pitched roofs + a couple towers), dark with rare warm window
  function roof(bx, w, h, warm) {
    const cxr = bx + w / 2;
    for (let x = bx; x < bx + w; x++) {
      const d = Math.abs(x - cxr);
      const ry = horizon - Math.round((w / 2 - d) * h / (w / 2));
      for (let y = ry; y <= horizon; y++) P(g, x, y, '#0d0a16');
    }
    // ridge highlight (faint moonlight)
    for (let x = bx; x < bx + w; x++) {
      const d = Math.abs(x - cxr);
      const ry = horizon - Math.round((w / 2 - d) * h / (w / 2));
      P(g, x, ry, '#1c1729');
    }
    if (warm) {
      const wx = Math.round(cxr) - 1,
        wy = horizon - Math.round(h * 0.4);
      fillRect(g, wx, wy, 2, 2, RAMP.ember[1]);
      P(g, wx, wy + 2, RAMP.ember[2]);
    }
  }
  let bx = -6;
  const roofs = [[28, 14, 1], [22, 10, 0], [30, 18, 1], [18, 9, 1], [26, 13, 0], [34, 20, 1], [20, 10, 0], [24, 12, 1], [30, 15, 0], [22, 11, 1], [28, 14, 0], [18, 9, 1], [32, 17, 1], [24, 12, 0], [40, 8, 0]];
  roofs.forEach(([w, h, warm]) => {
    roof(bx, w, h, warm);
    bx += w - 2;
  });
  // chimneys w/ thin smoke on a couple
  [40, 150, 250].forEach((px, i) => {
    for (let y = horizon - 16; y < horizon - 10; y++) P(g, px, y, '#100c1a');
    for (let k = 0; k < 6; k++) P(g, px + k % 2, horizon - 16 - k, bn[3]);
  });

  // --- Drift corruption bleeding in from BOTH side edges ---
  function edge(side) {
    for (let y = 18; y < H; y++) {
      const reach = Math.round((36 + 22 * Math.sin(y * 0.06 + (side < 0 ? 0 : 1.7))) * (0.45 + 0.55 * (y / H)));
      for (let d = 0; d < reach; d++) {
        const x = side < 0 ? d : W - 1 - d;
        const fade = 1 - d / reach,
          h = hash2(x, y, 73);
        if ((x + y) % 2 === 0 && h < fade * 0.85) P(g, x, y, h < fade * 0.28 ? dr[2] : dr[3]);else if (h < fade * 0.16) P(g, x, y, dr[1]);
        if (d > reach - 2 && h < 0.05) P(g, x, y, dr[1]); // glowing tips
      }
    }
  }
  edge(-1);
  edge(1);
  // drifting motes from both edges
  const pr = mulberry(74);
  for (let i = 0; i < 60; i++) {
    const fromL = i % 2 === 0;
    let x = fromL ? pr() * 110 : W - pr() * 110;
    let y = pr() * H;
    const big = i % 5 === 0;
    P(g, Math.round(x), Math.round(y), big ? dr[0] : dr[1]);
    if (big) P(g, Math.round(x) + 1, Math.round(y), dr[2]);
  }

  // --- wordmark plate (X: slightly right of center to clear the avatar; pump.fun: dead center) ---
  const wm = scaleGrid(wordmarkGrid(false), 2); // ~170 × 24
  const plateW = wm.w + 26,
    plateH = wm.h + 18;
  const px = Math.round((centered ? W * 0.5 : W * 0.545) - plateW / 2),
    py = 34;
  // plate body (bone bevel, hollow center) + gold rails + drift inlay
  for (let y = py; y < py + plateH; y++) for (let x = px; x < px + plateW; x++) {
    const edged = Math.min(x - px, px + plateW - 1 - x, y - py, py + plateH - 1 - y);
    let c = null;
    if (edged < 1) c = RAMP.void;else if (edged < 3) c = y - py < plateH / 2 ? bn[1] : bn[3];else if (edged < 4) c = bn[0];else if (edged < 5) c = bn[3];
    if (c) P(g, x, y, c);
  }
  for (let x = px + 5; x < px + plateW - 5; x++) {
    P(g, x, py + 5, gd[1]);
    P(g, x, py + plateH - 6, gd[2]);
  }
  for (let y = py + 5; y < py + plateH - 5; y++) {
    P(g, px + 5, y, gd[1]);
    P(g, px + plateW - 6, y, gd[2]);
  }
  for (let x = px + 10; x < px + plateW - 8; x += 12) {
    P(g, x, py + 5, dr[1]);
    P(g, x, py + plateH - 6, dr[1]);
  }
  // corner drift gems
  [[px + 4, py + 4], [px + plateW - 5, py + 4], [px + 4, py + plateH - 5], [px + plateW - 5, py + plateH - 5]].forEach(([gx, gy]) => {
    P(g, gx, gy, dr[0]);
    P(g, gx + 1, gy, dr[2]);
    P(g, gx, gy + 1, dr[2]);
  });
  // stamp wordmark into the hollow
  stamp(g, wm, px + (plateW - wm.w) / 2 | 0, py + (plateH - wm.h) / 2 | 0);

  // --- tagline beneath, bone ramp, above bottom 15% (H*0.85 = 106) ---
  const tag = 'THE DRIFT TAKES THE REALM';
  const tw = textWidth35(tag);
  const tx = Math.round(px + plateW / 2 - tw / 2),
    ty = py + plateH + 6;
  drawText35(g, tag, tx, ty, bn[1], RAMP.void);

  // --- $DRIFTS ticker beneath the tagline, gold on the rooftop band ---
  const tkw = 4 + textWidth35('DRIFTS');
  const kx = Math.round(px + plateW / 2 - tkw / 2),
    ky = ty + 8;
  for (let x = kx - 4; x <= kx + tkw + 3; x++) {
    P(g, x, ky - 2, gd[3]);
    P(g, x, ky + 7, gd[3]);
  } // rails
  for (let x = kx - 4; x <= kx + tkw + 3; x++) for (let y = ky - 1; y <= ky + 6; y++) if ((x + y) % 2 === 0) P(g, x, y, '#160a26'); // plinth
  drawTicker(g, kx, ky, gd[0], RAMP.void);
  return g;
}
const SOCIAL = {
  pfp_coin: {
    fn: () => drawCoinSigil(128, true),
    native: [128, 128],
    scale: 8,
    out: [1024, 1024]
  },
  pfp_coin_clean: {
    fn: () => drawCoinSigil(128, false),
    native: [128, 128],
    scale: 8,
    out: [1024, 1024]
  },
  pfp_x: {
    fn: () => drawCoinSigil(100, false),
    native: [100, 100],
    scale: 8,
    out: [800, 800]
  },
  banner_x: {
    fn: () => drawBanner(false),
    native: [375, 125],
    scale: 4,
    out: [1500, 500]
  },
  banner_pumpfun: {
    fn: () => drawBanner(true),
    native: [375, 125],
    scale: 4,
    out: [1500, 500]
  }
};
Object.assign(globalThis, {
  disc,
  ring,
  drawCoinSigil,
  drawBanner,
  drawTicker,
  drawText35,
  textWidth35,
  FONT35,
  SOCIAL
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/social.js", error: String((e && e.message) || e) }); }

// assets/_gen/spectate.js
try { (() => {
// Naevyr SPECTATOR / DEMO SET — eval after pixlib.js (+ landing.js for nav style).
// An eye nav glyph for the existing nav_icons family, a read-only "observing"
// frame overlay, and a banner plate matching the landing wordmark_plate.

/* ============================ EYE ICON (16×16, nav_icons style) ============================
   Open eye, drift iris. bone silhouette + 1px void outline, tintable — drop into
   the nav_icons family. */
function drawEyeIcon() {
  const g = makeGrid(16, 16);
  const I = RAMP.bone[1],
    D = RAMP.bone[3],
    H = RAMP.bone[0],
    dr = RAMP.drift;
  const cx = 8,
    cy = 8;
  // almond eye: sin-arc opening, sclera fill + lid edges
  for (let x = 3; x <= 13; x++) {
    const t = (x - 3) / 10;
    const span = Math.round(Math.sin(t * Math.PI) * 4);
    for (let yy = -span; yy <= span; yy++) P(g, x, cy + yy, I);
    P(g, x, cy - span, D);
    P(g, x, cy + span, D);
  }
  // drift iris
  for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) {
    if (xx * xx + yy * yy > 5) continue;
    P(g, cx + xx, cy + yy, dr[2]);
  }
  for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
    if (xx * xx + yy * yy > 2) continue;
    P(g, cx + xx, cy + yy, dr[1]);
  }
  P(g, cx, cy, RAMP.void); // pupil
  P(g, cx - 1, cy - 1, dr[0]); // glint
  P(g, 5, cy - 1, H); // sclera highlight
  outline(g, RAMP.void);
  return g;
}

/* ============================ WATCH FRAME (480×270, 2f pulse @2fps) ============================
   Read-only spectator overlay: a thin drift-rune border + soft corner darkening
   that says "observing" without blocking the world. Center stays transparent.
   Alpha + dither (no blur); no outline — it's an overlay. */
function drawWatchFrame(frame) {
  frame = frame || 0;
  const W = 480,
    H = 270,
    g = makeGrid(W, H);
  const dr = RAMP.drift,
    lit = frame === 1;

  // soft corner darkening (checkerboard-dithered alpha, quantized to keep it crisp)
  const cornerR = 96;
  [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].forEach(([cxp, cyp]) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if ((x + y) % 2 !== 0) continue;
      const d = Math.hypot(x - cxp, y - cyp);
      if (d > cornerR) continue;
      let a = (1 - d / cornerR) * 0.85;
      a = Math.round(a / 0.17) * 0.17; // quantize to ~5 alpha steps
      if (a >= 0.17) P(g, x, y, RAMP.void, a);
    }
  });

  // thin dashed rune border, inset
  const inset = 6,
    x0 = inset,
    y0 = inset,
    x1 = W - 1 - inset,
    y1 = H - 1 - inset;
  const edge = lit ? dr[0] : dr[1],
    dim = lit ? dr[1] : dr[2];
  for (let x = x0; x <= x1; x++) {
    const on = x % 6 < 3;
    P(g, x, y0, on ? edge : dim, on ? 0.7 : 0.4);
    P(g, x, y1, on ? edge : dim, on ? 0.7 : 0.4);
  }
  for (let y = y0; y <= y1; y++) {
    const on = y % 6 < 3;
    P(g, x0, y, on ? edge : dim, on ? 0.7 : 0.4);
    P(g, x1, y, on ? edge : dim, on ? 0.7 : 0.4);
  }

  // corner rune marks
  function runeMark(px, py, sx, sy) {
    P(g, px, py, edge, 0.9);
    P(g, px + sx * 3, py, edge, 0.8);
    P(g, px, py + sy * 3, edge, 0.8);
    P(g, px + sx * 2, py + sy * 2, dim, 0.6);
    if (lit) P(g, px + sx, py + sy, dr[0], 0.7);
  }
  runeMark(x0 + 3, y0 + 3, 1, 1);
  runeMark(x1 - 3, y0 + 3, -1, 1);
  runeMark(x0 + 3, y1 - 3, 1, -1);
  runeMark(x1 - 3, y1 - 3, -1, -1);
  return g; // no outline — transparent-center overlay
}

/* ============================ WATCH PLATE (200×28) ============================
   "You are watching the realm" banner plate — landing wordmark_plate style
   (bone bevel + gold rails + drift inlay). Hollow center holds DOM text. */
function drawWatchPlate() {
  const W = 200,
    Hh = 28,
    g = makeGrid(W, Hh);
  const bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const x0 = 4,
    x1 = W - 5,
    y0 = 3,
    y1 = Hh - 4;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    let c = bn[2];
    if (edge < 1) c = bn[3];else if (edge < 2) c = y - y0 < (y1 - y0) / 2 ? bn[1] : bn[2];else if (edge < 3) c = bn[0];else c = null;
    if (c) P(g, x, y, c);
  }
  for (let x = x0 + 3; x <= x1 - 3; x++) {
    P(g, x, y0 + 3, gd[1]);
    P(g, x, y1 - 3, gd[2]);
  }
  for (let y = y0 + 3; y <= y1 - 3; y++) {
    P(g, x0 + 3, y, gd[1]);
    P(g, x1 - 3, y, gd[2]);
  }
  for (let x = x0 + 10; x <= x1 - 10; x += 11) {
    P(g, x, y0 + 3, dr[1]);
    P(g, x, y1 - 3, dr[1]);
  }
  [[x0 + 3, y0 + 3], [x1 - 3, y0 + 3], [x0 + 3, y1 - 3], [x1 - 3, y1 - 3]].forEach(([gx, gy]) => P(g, gx, gy, dr[0]));
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const SPECTATE = {
  eye_icon: {
    fn: drawEyeIcon,
    cell: [16, 16],
    anchor: [8, 8],
    frames: 1,
    tintable: true,
    family: 'nav_icons'
  },
  watch_frame: {
    fn: drawWatchFrame,
    cell: [480, 270],
    anchor: [240, 135],
    frames: 2,
    anim: {
      name: 'pulse',
      fps: 2,
      loop: true
    },
    overlay: true
  },
  watch_plate: {
    fn: drawWatchPlate,
    cell: [200, 28],
    anchor: [100, 14],
    frames: 1,
    dom: true
  }
};
Object.assign(globalThis, {
  drawEyeIcon,
  drawWatchFrame,
  drawWatchPlate,
  SPECTATE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/spectate.js", error: String((e && e.message) || e) }); }

// assets/_gen/streak.js
try { (() => {
// Naevyr STREAK SET — retention HUD art, DOM-rendered like the brand/landing set.
// eval after pixlib.js. Clean SVG sheets + JSON frame tables, CSS steps()
// friendly. Object glyphs get the 1px void outline (these are HUD art, not FX).

/* ============================ STREAK EMBER (24×24, 4f flicker @6fps) ============================
   A small flame marking an ACTIVE login streak. gold (hot core) → ember (body). */
function drawStreakEmber(frame) {
  frame = frame || 0;
  const g = makeGrid(24, 24);
  const gd = RAMP.gold,
    em = RAMP.ember,
    bn = RAMP.bone;
  const cx = 12,
    baseY = 20;
  const tall = [0, 2, 1, 2][frame]; // tongue height flicker
  const sway = [0, 1, 0, -1][frame]; // tip sway
  const h = 12 + tall;

  // teardrop flame body — width tapers base→tip
  for (let yy = 0; yy < h; yy++) {
    const t = yy / h;
    const half = Math.max(1, Math.round((1 - t) * 4 + 1));
    const tipShift = Math.round(sway * t);
    const y = baseY - yy;
    for (let xx = -half; xx <= half; xx++) {
      const x = cx + xx + tipShift;
      const edge = Math.abs(xx) / (half + 0.001);
      let c;
      if (edge > 0.7) c = em[2]; // outer dim ember
      else if (edge > 0.4) c = em[1]; // mid ember
      else c = t < 0.6 ? gd[0] : gd[1]; // hot gold core
      if (xx === 0 && t < 0.32) c = bn[0]; // white-hot center base
      P(g, x, y, c);
    }
  }
  // base coals
  for (let xx = -4; xx <= 4; xx++) if ((xx + frame) % 2 === 0) P(g, cx + xx, baseY + 1, xx % 2 ? em[2] : em[3]);
  P(g, cx - 2, baseY, em[1]);
  P(g, cx + 2, baseY, em[2]);
  // rising spark
  const sparkY = baseY - h - 1 - frame % 2;
  if (sparkY > 0) P(g, cx + sway, sparkY, gd[0]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ STREAK PIP (16×16, 2 states) ============================
   One faceted gem pip. unlit = bone (dim), lit = gold (bright). The HUD tiles 7
   of these into a 120×16 week meter (stride 17px, 2px pad) lighting 1..7. */
function drawStreakPip(lit) {
  const g = makeGrid(16, 16);
  const ramp = lit ? RAMP.gold : RAMP.bone;
  const cx = 8,
    cy = 8,
    R = 5;
  for (let yy = -R; yy <= R; yy++) {
    const half = R - Math.abs(yy);
    for (let xx = -half; xx <= half; xx++) {
      let c = yy < 0 ? ramp[1] : yy === 0 ? ramp[1] : ramp[2];
      if (yy < -1 && xx <= 0) c = ramp[0]; // upper-left highlight facet
      if (Math.abs(xx) === half) c = ramp[2]; // edge facet
      P(g, cx + xx, cy + yy, c);
    }
  }
  P(g, cx, cy, ramp[0]);
  if (lit) {
    P(g, cx - 1, cy - 1, RAMP.bone[0]);
    P(g, cx + 2, cy + 2, RAMP.gold[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ MILESTONE SEALS (32×32) ============================
   Wax-seal medallions for reward popups. day-7 = gold wax, day-30 = drift wax
   (the signature accent, for the rarer reward). Emblem-adjacent: a Drift mote in
   a recessed field above an embossed numeral, scalloped wax rim, ribbon tails. */
const SEAL_DIGITS = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.']
};
function drawSealNumber(g, str, cx, topY, face, shadow) {
  let totalW = str.length * 3 + (str.length - 1);
  let ox = Math.round(cx - totalW / 2);
  for (const ch of str) {
    const rows = SEAL_DIGITS[ch];
    if (rows) for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
      if (rows[y][x] === '#') {
        P(g, ox + x, topY + y + 1, shadow);
        P(g, ox + x, topY + y, face);
      }
    }
    ox += 4;
  }
}
function drawMilestoneSeal(days) {
  const g = makeGrid(32, 32);
  const wax = days >= 30 ? RAMP.drift : RAMP.gold;
  const rimHi = wax[0],
    rimMid = wax[1],
    rimSh = wax[2],
    deep = wax[3] || wax[2];
  const cx = 16,
    cy = 16,
    R = 13,
    scallops = 12;
  for (let yy = -R - 1; yy <= R + 1; yy++) for (let xx = -R - 1; xx <= R + 1; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    const ang = Math.atan2(yy, xx);
    const edge = R + Math.cos(ang * scallops) * 1.2; // scalloped boundary
    if (d > edge) continue;
    let c = rimMid;
    if (d > edge - 2) c = rimSh; // outer rim shade
    else if (yy < -3 && d < edge - 2) c = rimHi; // upper highlight
    else if (d < 6) c = deep; // recessed center field
    else if (d < 8) c = rimSh;
    P(g, cx + xx, cy + yy, c);
  }
  // drift mote in the recess (signature accent — always purple)
  const dr = RAMP.drift;
  P(g, cx, cy - 3, dr[0]);
  P(g, cx - 1, cy - 2, dr[1]);
  P(g, cx + 1, cy - 2, dr[1]);
  P(g, cx, cy - 2, dr[0]);
  P(g, cx, cy - 1, dr[2]);
  // embossed numeral
  drawSealNumber(g, String(days), cx, cy + 1, RAMP.bone[0], RAMP.void);
  // ribbon tails
  P(g, cx - 5, cy + R - 1, rimSh);
  P(g, cx - 6, cy + R + 1, rimSh);
  P(g, cx - 5, cy + R + 1, deep);
  P(g, cx + 5, cy + R - 1, rimSh);
  P(g, cx + 6, cy + R + 1, rimSh);
  P(g, cx + 5, cy + R + 1, deep);
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const STREAK = {
  streak_ember: {
    fn: drawStreakEmber,
    cell: [24, 24],
    anchor: [12, 21],
    frames: 4,
    anim: {
      name: 'flicker',
      fps: 6,
      loop: true
    },
    dom: true
  },
  streak_pip: {
    fn: drawStreakPip,
    cell: [16, 16],
    anchor: [8, 8],
    frames: 2,
    states: ['unlit', 'lit'],
    dom: true,
    meter: {
      pips: 7,
      field: [120, 16],
      stride: 17,
      pad: 2
    }
  },
  milestone_seal_7: {
    fn: () => drawMilestoneSeal(7),
    cell: [32, 32],
    anchor: [16, 16],
    frames: 1,
    dom: true
  },
  milestone_seal_30: {
    fn: () => drawMilestoneSeal(30),
    cell: [32, 32],
    anchor: [16, 16],
    frames: 1,
    dom: true
  }
};
Object.assign(globalThis, {
  drawStreakEmber,
  drawStreakPip,
  SEAL_DIGITS,
  drawSealNumber,
  drawMilestoneSeal,
  STREAK
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/streak.js", error: String((e && e.message) || e) }); }

// assets/_gen/threshold.js
try { (() => {
// Naevyr "THE THRESHOLD" tutorial micro-set — eval after pixlib.js + tiles.js.
// Rect-grid, RAMP only, 1px void outline, dither not blur, deterministic.
// Gate 96x128 (sealed+open, 3 rune-pulse frames each) · Gatewarden 32x40 (5
// facings, idle 2f) · Objective beacon 64x64 (3f) + arrow pip 16x16 (2f) ·
// Drift wall 64x96 FX (3f, seam-continuous) · ground accents 64x32 (2 variants).

/* ---- local circle / triangle helpers ---- */
function tDisc(g, cx, cy, r, fn) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= r) fn(x, y, d);
  }
}
function tRing(g, cx, cy, r, w, c) {
  tDisc(g, cx, cy, r, (x, y, d) => {
    if (d >= r - w) P(g, x, y, c);
  });
}
function triLine(g, x0, y0, x1, y1, c, t) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n,
      y = y0 + (y1 - y0) * i / n;
    for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c);
  }
}
// the triangle-in-circle door sigil, centered at cx,cy radius R, gold tone set by lit
function gateSigil(g, cx, cy, R, lit) {
  const gd = RAMP.gold,
    dr = RAMP.drift;
  const hi = lit ? gd[0] : gd[3],
    mid = lit ? gd[1] : gd[3],
    dim = lit ? gd[2] : '#5c4a1e';
  tRing(g, cx, cy, R, 1, mid);
  const v = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
    return [cx + Math.cos(a) * R * 0.84, cy + Math.sin(a) * R * 0.84];
  });
  const tw = Math.max(1, Math.round(R * 0.12));
  triLine(g, v[0][0], v[0][1], v[1][0], v[1][1], hi, tw);
  triLine(g, v[1][0], v[1][1], v[2][0], v[2][1], mid, tw);
  triLine(g, v[2][0], v[2][1], v[0][0], v[0][1], mid, tw);
  tRing(g, cx, cy, R * 0.46, 1, dim);
  for (let yy = -R * 0.44; yy <= R * 0.5; yy++) P(g, Math.round(cx), Math.round(cy + yy), (cy + yy | 0) % 2 ? mid : dim); // keyhole bar
  if (lit) {
    P(g, cx, cy, dr[0]);
    P(g, cx, cy - 1, dr[1]);
    P(g, cx, cy + 1, dr[1]);
  } // drift mote in the eye
}

/* ============================ 1 · THRESHOLD GATE (96x128, sealed/open ×3f) ======== */
function drawThresholdGate(open, frame) {
  const g = makeGrid(96, 128);
  const cx = 48,
    baseY = 122;
  const st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift,
    bn = RAMP.bone;
  // pale-stone helper: stone ramp leaned lighter with bone highlights
  function block(x, y, lit) {
    let c = lit ? st[0] : st[1];
    const h = hash2(x, y, 401);
    if (h < 0.05) c = st[2];else if (h < 0.065) c = st[0];else if (h < 0.075) c = bn[2]; // chips + sparse pale highlights
    P(g, x, y, c);
  }
  // foundation slab (iso) under the arch
  const fb = 86,
    fh = 9;
  for (let dy = -fh; dy <= fh; dy++) {
    const t = 1 - Math.abs(dy) / fh,
      w = Math.round(fb / 2 * t);
    for (let dx = -w; dx <= w; dx++) {
      let c = st[2];
      if (dy < 0 && dx < 0) c = st[1];
      if (dy > 2) c = st[3];
      P(g, cx + dx, baseY + dy - 2, c);
    }
  }

  // pillars
  const pw = 16,
    ph = 84,
    lx0 = 12,
    rx0 = 96 - 12 - pw;
  for (const [x0, sideLit] of [[lx0, true], [rx0, false]]) {
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const yy = baseY - 6 - y,
        xx = x0 + x;
      const lit = sideLit ? x < 3 : x < 2;
      // course seams
      let edge = y % 10 === 0 || x === 0 || x === pw - 1;
      block(xx, yy, lit && !edge);
      if (edge) P(g, xx, yy, st[3]);
    }
    // right-side iso depth
    for (let d = 1; d <= 6; d++) for (let y = 0; y < ph; y++) P(g, x0 + pw - 1 + d, baseY - 6 - y - Math.floor(d / 2), st[3]);
  }
  // arch (semicircle spanning the pillars)
  const archCx = cx,
    archCy = baseY - 6 - ph + 4,
    archR = 36;
  tDisc(g, archCx, archCy, archR, (x, y, d) => {
    if (y > archCy) return;
    if (d > archR || d < archR - 16) return;
    const lit = x < archCx;
    let edge = Math.round(d) % 10 < 2 || d > archR - 1.5 || d < archR - 14.5;
    block(x, y, lit && !edge);
    if (edge) P(g, x, y, st[3]);
  });
  // iso depth on arch
  for (let d = 1; d <= 6; d++) tDisc(g, archCx, archCy, archR, (x, y, dd) => {
    if (y > archCy) return;
    if (dd > archR || dd < archR - 16) return;
    if (x < archCx + 8) return;
    P(g, x + d, y - Math.floor(d / 2), st[3]);
  });
  // keystone with the sigil
  gateSigil(g, archCx, archCy - archR + 8, 7, open ? true : false);

  // doorway interior (between pillars, under arch)
  const dl = lx0 + pw,
    dr_ = rx0,
    dtop = archCy,
    dbot = baseY - 6;
  for (let y = dtop; y <= dbot; y++) for (let x = dl; x <= dr_; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - 16) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (open) {
      // glowing drift-purple void with dither + depth
      const t = (y - dtop) / (dbot - dtop);
      let c = dr[4];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : dr[4];
      if (Math.abs(x - cx) < 10 && hash2(x, y + frame, 402) < 0.18) c = dr[2]; // shifting glow
      if (Math.abs(x - cx) < 5 && hash2(x, y - frame * 2, 403) < 0.12) c = dr[1];
      P(g, x, y, c);
    } else {
      // filled with sealed stone blocks
      const lit = x < cx;
      let edge = y % 9 === 0 || (x + Math.floor(y / 9) % 2 * 4) % 8 === 0;
      block(x, y, lit && !edge);
      if (edge) P(g, x, y, st[3]);
    }
  }
  // rune ring around the doorway (pulse across frames)
  const pulse = [0, 1, 2, 1][frame % 4] / 2; // 0 .. 1
  const litRune = open ? true : pulse > 0.4;
  const runeTone = open ? pulse > 0.6 ? gd[0] : gd[1] : pulse > 0.4 ? gd[2] : gd[3];
  // runes set into the pillars + arch inner edge
  const runeSpots = [[dl + 1, dbot - 14], [dl + 1, dbot - 34], [dr_ - 1, dbot - 14], [dr_ - 1, dbot - 34], [cx - 14, dtop + 2], [cx + 14, dtop + 2]];
  runeSpots.forEach(([rx, ry], i) => {
    P(g, rx, ry, runeTone);
    P(g, rx, ry + 1, runeTone);
    P(g, rx + (i % 2 ? 1 : -1), ry, litRune ? runeTone : st[3]);
    P(g, rx, ry - 1, litRune ? gd[3] : st[3]);
  });
  // open: glow spill + escaping motes
  if (open) {
    for (let x = dl; x <= dr_; x++) if ((x + frame) % 3 === 0) P(g, x, dbot + 1, dr[2]);
    const mr = mulberry(404 + frame);
    for (let i = 0; i < 5; i++) {
      const mx = cx + Math.round((mr() - 0.5) * 24),
        my = dtop + Math.round(mr() * (dbot - dtop));
      P(g, mx, my - frame, mr() < 0.4 ? dr[0] : dr[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · THE GATEWARDEN (32x40, 5 facings, idle 2f) ====== */
function drawGatewarden(facing, frame) {
  const g = makeGrid(32, 40);
  const cx = 16,
    baseY = 37;
  const bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift,
    st = RAMP.stone;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const off = [0, 1, 2, 1, 0][dir],
    showFace = dir <= 2;
  const sway = frame === 1 ? 1 : 0;
  const top = 8;
  // robe body (bone, tapered, gold hem)
  for (let y = 17; y <= 36; y++) {
    const t = (y - 17) / 19,
      hw = Math.round(3.4 + t * 4.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(sway * 0.5) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = bn[1];
      if (x <= cxx - hw + 1) c = bn[0];
      if (x >= cxx + hw - 1) c = bn[3];
      if (dir >= 3 && x === cxx) c = bn[2];
      if (hash2(x, y, 411) < 0.05) c = bn[2];
      P(g, x, y, c);
    }
  }
  // gold trim down the front + hem
  if (!(dir >= 3)) for (let y = 18; y <= 35; y += 1) P(g, cx + off, y, y % 2 ? gd[1] : gd[2]);
  for (let x = cx + off - 6; x <= cx + off + 6; x++) {
    const v = G(g, x, 36);
    if (v) P(g, x, 36, gd[2]);
  }
  // hood
  for (let y = top; y <= 18; y++) {
    const hy = (y - top) / (18 - top),
      hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.6);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = bn[1];
      if (x === cxx - hw) c = bn[0];
      if (x >= cxx + hw - 1) c = bn[3];
      if (y === top) c = bn[0];
      P(g, x, y, c);
    }
  }
  P(g, cx + off, top - 1, bn[1]);
  // gold trim on hood rim
  for (let x = cx + off - 4; x <= cx + off + 4; x++) {
    const v = G(g, x, 17);
    if (v) P(g, x, 17, gd[2]);
  }
  // hidden face + 2 gold eye glows
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0),
      w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    if (dir === 0) {
      P(g, fcx - 1, ey, gd[0]);
      P(g, fcx + 1, ey, gd[0]);
    } else if (dir === 1) {
      P(g, fcx, ey, gd[0]);
      P(g, fcx + 2, ey, gd[1]);
    } else {
      P(g, fcx + 1, ey, gd[0]);
    }
  }
  // tall iron staff with chained drift mote (mote bobs in idle)
  const stx = cx + off + (dir >= 1 ? 6 : -6);
  for (let y = top - 4; y <= baseY - 1; y++) P(g, stx, y, y % 6 === 0 ? st[3] : st[1]);
  P(g, stx - 1, top - 4, st[2]);
  P(g, stx + 1, top - 4, st[2]); // staff head crook
  P(g, stx, top - 5, st[2]);
  // chain + mote hanging from the head, bobs by frame
  const moteY = top - 1 + sway * 2;
  P(g, stx, top - 3, st[3]);
  P(g, stx, top - 2, st[3]); // chain links
  P(g, stx, moteY, dr[0]);
  P(g, stx - 1, moteY, dr[1]);
  P(g, stx + 1, moteY, dr[1]);
  P(g, stx, moteY + 1, dr[2]);
  P(g, stx, moteY - 1, dr[1]);
  for (let a = 0; a < 6; a++) {
    const ax = stx + [2, 2, -2, -2, 0, 0][a],
      ay = moteY + [0, 1, 0, 1, 2, -2][a];
    if (hash2(ax, ay + frame, 412) < 0.5) P(g, ax, ay, dr[2]);
  } // faint halo
  // feet
  P(g, cx - 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void);
  P(g, cx + 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · OBJECTIVE BEACON (64x64, 3f) + ARROW (16x16, 2f) */
function drawBeacon(frame) {
  const g = makeGrid(64, 64);
  const cx = 32,
    cy = 48; // diamond center
  const gd = RAMP.gold,
    dr = RAMP.drift;
  const rows = diamondRows();
  // rune-scribed tile (diamond), faint dirt so it reads on grass AND dirt
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const gx = x,
      gy = cy - 16 + y;
    let c = (x + y) % 2 === 0 ? '#2a2032' : '#1b1526';
    P(g, gx, gy, c);
  }
  // gold rune ring scribed on the tile
  tRing(g, cx, cy, 13, 1, gd[2]);
  tRing(g, cx, cy, 13, 1, gd[2]);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    P(g, Math.round(cx + Math.cos(a) * 8), Math.round(cy + Math.sin(a) * 4), gd[1]);
  }
  // diamond edge
  for (let y = 0; y < 32; y++) {
    P(g, rows[y].x0, cy - 16 + y, RAMP.void);
    P(g, rows[y].x1, cy - 16 + y, RAMP.void);
  }
  // rising column of dithered gold light (rise/peak/fall)
  const heights = [22, 34, 14],
    H = heights[frame % 3];
  const peak = frame === 1;
  for (let k = 0; k < H; k++) {
    const y = cy - 4 - k,
      t = k / H;
    const w = Math.max(1, Math.round((1 - t) * 6) + (peak ? 1 : 0));
    for (let x = -w; x <= w; x++) {
      const ax = cx + x;
      const core = Math.abs(x) <= 1;
      if (core) P(g, ax, y, t < 0.3 ? gd[0] : gd[1]);else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 421) < (1 - t) * 0.9) P(g, ax, y, Math.abs(x) <= 2 ? gd[1] : gd[2]);
    }
  }
  // crowning mote at the peak
  if (peak) {
    P(g, cx, cy - 4 - H, gd[0]);
    P(g, cx, cy - 5 - H, dr[1]);
  }
  return g; // no hard outline — it is light
}
function drawArrowPip(frame) {
  const g = makeGrid(16, 16);
  const cx = 8,
    bob = frame === 1 ? 2 : 0,
    gd = RAMP.gold;
  // chunky down-arrow
  const top = 3 + bob;
  for (let y = 0; y < 5; y++) for (let x = -4 + y; x <= 4 - y; x++) P(g, cx + x, top + y, y < 1 ? gd[0] : gd[1]);
  for (let y = 0; y < 4; y++) for (let x = -2; x <= 2; x++) P(g, cx + x, top - 1 - y, gd[2]); // stem
  for (let x = -2; x <= 2; x++) P(g, cx + x, top - 4, gd[1]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · DRIFT WALL FX (64x96, 3f, tiles horizontally) === */
function drawDriftWall(frame) {
  const W = 64,
    H = 96,
    g = makeGrid(W, H);
  const dr = RAMP.drift;
  const phase = frame * 1.15;
  for (let x = 0; x < W; x++) {
    // crest silhouette wobbles, PERIODIC across the 64 seam (sin of x/W*2pi)
    const crest = Math.round(H * 0.32 + 9 * Math.sin(x / W * Math.PI * 2 + phase) + 4 * Math.sin(x / W * Math.PI * 4 - phase));
    for (let y = crest; y < H; y++) {
      const below = (y - crest) / (H - crest); // 0 crest .. 1 floor
      const n = hash2(x, (y + frame * 5) % H, 431); // boil noise, scrolls up
      const n2 = hash2(x, ((y - frame * 4) % H + H) % H, 432);
      let c = null;
      if (below > 0.5) {
        // void-dark core w/ purple veins
        c = n < 0.13 ? dr[3] : (x + y) % 2 === 0 && n2 < 0.32 ? dr[4] : RAMP.void;
      } else {
        // boiling purple band
        if ((x + y + frame) % 2 === 0 && n < 0.86) c = n < 0.3 ? dr[2] : dr[3];else if (n2 < 0.22) c = dr[1]; // bright veins
      }
      if (below < 0.1 && n < 0.55) c = n < 0.16 ? dr[0] : dr[1]; // hot crest line
      if (c) P(g, x, y, c);
    }
    // wispy tendrils boiling above the crest (dithered, fade upward)
    for (let k = 1; k <= 9; k++) {
      const y = crest - k;
      if (y >= 0 && (x + y) % 2 === 0 && hash2(x, (y + frame * 6) % H, 433) < (1 - k / 9) * 0.55) P(g, x, y, k < 3 ? dr[2] : dr[3]);
    }
  }
  // escaping motes (periodic seeds so they wrap across the seam)
  for (let i = 0; i < 8; i++) {
    const mx = i * 37 % W;
    const my = ((i * 53 - frame * 7) % H + H) % H;
    P(g, mx, my, i % 3 === 0 ? dr[0] : dr[1]);
  }
  // NOTE: no outline (tiling FX strip; an outline would create seams)
  return g;
}

/* ============================ 5 · THRESHOLD GROUND ACCENT (64x32, 2 variants) ===== */
function drawThresholdTile(variant) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold;
  // pale flagstone face
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    let c = (x + y) % 2 === 0 ? '#4a4660' : st[1]; // pale stone dither
    if (y > 22) c = st[2];
    P(g, x, y, c);
  }
  // 3px south lip + void north edge
  for (let x = 0; x < 64; x++) {
    let my = -1;
    for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) {
      my = y;
      break;
    }
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, st[3]);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }
  // cracks
  const seed = 440 + variant;
  let cxk = 20 + variant * 16,
    cyk = 8;
  for (let s = 0; s < 18; s++) {
    P(g, cxk, cyk, st[3]);
    if (hash2(cxk, cyk, seed) < 0.5) P(g, cxk, cyk + 1, st[3]);
    cxk += (hash2(cxk, cyk, seed + 1) < 0.5 ? 1 : 0) + 1;
    cyk += hash2(cxk, cyk, seed + 2) < 0.5 ? 1 : 0;
    if (!inDiamond(rows, cxk, cyk)) break;
  }
  // faint gold rune fragments scattered on the face
  const frag = variant === 0 ? [[26, 12], [34, 16], [30, 20]] : [[24, 14], [38, 12], [32, 18], [28, 22]];
  frag.forEach(([fx, fy], i) => {
    if (!inDiamond(rows, fx, fy)) return;
    P(g, fx, fy, gd[2]);
    if (i % 2 === 0) {
      P(g, fx + 1, fy, gd[3]);
    } else {
      P(g, fx, fy + 1, gd[3]);
      P(g, fx + 1, fy, gd[2]);
    }
  });
  return g; // accent overlay; keep its own diamond edge only
}
const THRESHOLD = {
  gate: {
    cell: [96, 128],
    anchor: [48, 127]
  },
  gatewarden: {
    cell: [32, 40],
    anchor: [16, 39]
  },
  beacon: {
    cell: [64, 64],
    anchor: [32, 48]
  },
  arrow_pip: {
    cell: [16, 16],
    anchor: [8, 8]
  },
  drift_wall: {
    cell: [64, 96],
    anchor: [32, 95]
  },
  ground: {
    cell: [64, 36],
    anchor: [32, 16]
  }
};
Object.assign(globalThis, {
  tDisc,
  tRing,
  triLine,
  gateSigil,
  drawThresholdGate,
  drawGatewarden,
  drawBeacon,
  drawArrowPip,
  drawDriftWall,
  drawThresholdTile,
  THRESHOLD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/threshold.js", error: String((e && e.message) || e) }); }

// assets/_gen/tiles.js
try { (() => {
// Naevyr tile generators — eval after pixlib.js.
// Tiles: 64×35 (32px diamond face + 3px south lip). Overlay: 64×32.

function hash2(x, y, s) {
  let h = x * 374761393 + y * 668265263 + (s || 0) * 2147483647 | 0;
  h = (h ^ h >> 13) * 1274126177 | 0;
  return ((h ^ h >> 16) >>> 0) / 4294967296;
}
function contourMaxY(rows, x) {
  for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) return y;
  return -1;
}
function makeBaseTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = RAMP[type];
  const face = ramp[1],
    hi = ramp[0],
    sh = ramp[2],
    dp = ramp[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);

  // 3px south lip in the shadow step
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge (top contour)
  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }

  // per-type face detail
  for (let y = 1; y < 31; y++) {
    for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
      const h = hash2(x, y, seedN);
      if (type === 'grass') {
        if (h < 0.055) {
          P(g, x, y, sh);
          if (hash2(x, y, seedN + 1) < 0.4) P(g, x, y - 1, sh);
        } else if (h < 0.075) P(g, x, y, hi);
      } else if (type === 'dirt') {
        if (h < 0.04) {
          P(g, x, y, sh);
          P(g, x + 1, y, dp);
        } else if (h < 0.05) P(g, x, y, hi);
      } else if (type === 'stone') {
        if (h < 0.03) {
          P(g, x, y, dp);
          P(g, x + 1, y, dp);
          P(g, x + 2, y, dp);
        } else if (h < 0.045) P(g, x, y, hi);
      } else if (type === 'water') {
        if (h < 0.05 && y > 18) P(g, x, y, sh); // deeper toward south
      }
    }
  }
  return g;
}

// 2px dither transition band into `other` along the SOUTH edges
function transitionVariant(type, other, seedN) {
  const g = makeBaseTile(type, seedN);
  const rows = diamondRows();
  const oc = RAMP[other][1];
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my < 0) continue;
    for (let k = 0; k <= 1; k++) {
      const y = my - k;
      if (y < 1 || !inDiamond(rows, x, y)) continue;
      if ((x + y) % 2 === 0 || k === 0 && hash2(x, y, 9) < 0.35) P(g, x, y, oc);
    }
  }
  return g;
}

// stone hard 1px void seam variant (full perimeter)
function stoneSeamVariant(seedN) {
  const g = makeBaseTile('stone', seedN);
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) P(g, x, my, RAMP.void);
  }
  return g;
}

// water shimmer frames: same base, speculars drift ±1px
function waterFrames(seedN) {
  const specs = [];
  const rnd = mulberry(seedN + 100);
  for (let i = 0; i < 7; i++) {
    specs.push({
      x: 12 + Math.floor(rnd() * 38),
      y: 6 + Math.floor(rnd() * 20),
      len: 2 + Math.floor(rnd() * 4)
    });
  }
  const DX = [0, 1, 0, -1],
    DY = [0, 0, 1, 0];
  const rows = diamondRows();
  return [0, 1, 2, 3].map(f => {
    const g = makeBaseTile('water', seedN);
    specs.forEach((s, i) => {
      if ((i + f) % 4 === 3) return; // one streak rests per frame
      const y = s.y + DY[(f + i) % 4];
      for (let k = 0; k < s.len; k++) {
        const x = s.x + DX[(f + i) % 4] + k;
        if (inDiamond(rows, x, y) && y > 1) P(g, x, y, RAMP.water[0]);
      }
    });
    return g;
  });
}

// water foam edge variant (2px light dither at perimeter)
function waterFoamVariant(seedN) {
  const g = makeBaseTile('water', seedN);
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    let ty = -1;
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      ty = y;
      break;
    }
    [[ty + 1, 0], [ty + 2, 1], [my, 0], [my - 1, 1]].forEach(p => {
      const y = p[0];
      if (y < 1 || y > 31 || !inDiamond(rows, x, y)) return;
      if ((x + y) % 2 === 0 && hash2(x, y, 6) < 0.6) P(g, x, y, RAMP.water[0]);else if (hash2(x, y, 5) < 0.14) P(g, x, y, RAMP.bone[2]);
    });
  }
  return g;
}

// corruption overlay: 6 pulse frames, static dither pattern, stepped alpha
function corruptFrames() {
  const alphas = [0.18, 0.212, 0.244, 0.276, 0.308, 0.34];
  const rows = diamondRows();
  const motes = [];
  const rnd = mulberry(424242);
  for (let i = 0; i < 6; i++) {
    motes.push({
      x: 14 + Math.floor(rnd() * 36),
      y: 6 + Math.floor(rnd() * 20)
    });
  }
  return alphas.map((a, f) => {
    const g = makeGrid(64, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = rows[y].x0; x <= rows[y].x1; x++) {
        const dist = Math.abs(x - 32) / 2 + Math.abs(y - 16); // diamond metric 0..16
        const density = Math.max(0, 1 - dist / 15);
        const h = hash2(x, y, 77);
        if ((x + y) % 2 === 0 && h < density * 0.95) P(g, x, y, RAMP.drift[2], a);else if (h < density * 0.22) P(g, x, y, RAMP.drift[3], a);
      }
    }
    motes.forEach((m, i) => {
      const ph = (i + f) % 6;
      if (ph < 3) {
        P(g, m.x, m.y, ph === 1 ? RAMP.drift[0] : RAMP.drift[1], 0.85);
        if (ph === 1) {
          P(g, m.x, m.y - 1, RAMP.drift[1], 0.5);
          P(g, m.x, m.y + 1, RAMP.drift[1], 0.5);
        }
      }
    });
    return g;
  });
}
Object.assign(globalThis, {
  hash2,
  contourMaxY,
  makeBaseTile,
  transitionVariant,
  stoneSeamVariant,
  waterFrames,
  waterFoamVariant,
  corruptFrames
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/tiles.js", error: String((e && e.message) || e) }); }

// assets/_gen/town.js
try { (() => {
// Naevyr TOWN SET — the Waystation. Eval after pixlib.js (+ tiles.js for hash2).
// Isometric 2:1 weathered frontier structures. Each house: south door + a warm
// lit window + a purpose sign/roof feature. Moonlit left, shadowed right. 1px
// void auto-outline, RAMP palette only, dithering not blur, deterministic.
// Houses: 144×152 cell, bottom-center anchor (72,151), top 6px kept clear.
// Shrine: 112×128 (3 flame frames). Pit: 240×120 flat, center anchor (120,60).

function rnd2(x, y, s) {
  return hash2(x, y, s || 0);
}

// ---- packed-earth + stone foundation diamond (3×3-ish footprint, corners show)
function foundation(g, cx, topY, halfW, opt) {
  opt = opt || {};
  const dirt = RAMP.dirt,
    stone = RAMP.stone;
  const halfH = Math.round(halfW / 2);
  // top diamond surface (packed earth)
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    for (let dx = -w; dx <= w; dx++) {
      let c = dirt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dirt[0]; // moonlit back-left
      else if (dy > halfH * 0.3) c = dirt[2]; // front shade
      if (rnd2(cx + dx, topY + dy, 3) < 0.06) c = dirt[2];
      P(g, cx + dx, topY + dy, c);
    }
  }
  // front rim (south faces) — 4px stone plinth height on the lower-front edges
  for (let dx = -halfW; dx <= halfW; dx++) {
    const t = 1 - Math.abs(dx) / halfW;
    const edgeY = topY + Math.round(halfH * t);
    for (let k = 1; k <= 4; k++) {
      let c = dx < 0 ? stone[1] : stone[2];
      if (k >= 3) c = stone[3];
      P(g, cx + dx, edgeY + k, c);
    }
  }
  // ash drifts against the front rim
  if (opt.ash !== false) {
    for (let i = 0; i < 14; i++) {
      const dx = -halfW + 6 + Math.floor(rnd2(i, cx, 7) * (halfW * 2 - 12));
      const t = 1 - Math.abs(dx) / halfW;
      const edgeY = topY + Math.round(halfH * t) + 4;
      const a = rnd2(i, cx, 8);
      if (a < 0.5) {
        P(g, cx + dx, edgeY, RAMP.bone[3]);
        if (a < 0.25) P(g, cx + dx, edgeY - 1, RAMP.bone[2]);
      }
    }
  }
  return {
    halfH
  };
}

// ---- front facade (south wall, camera-facing, moonlit-left)
function frontWall(g, x0, x1, ytop, ybot, ramp, seed, mat) {
  for (let x = x0; x <= x1; x++) {
    for (let y = ytop; y <= ybot; y++) {
      let c = ramp[1];
      if (x <= x0 + 1) c = ramp[0];else if (x >= x1 - 1) c = ramp[2];
      if (mat === 'timber') {
        // horizontal plank seams
        if ((y - ytop) % 4 === 0) c = ramp[2];
        if (rnd2(x, y, seed) < 0.05) c = ramp[2];
      } else if (mat === 'plaster') {
        // patchy plaster
        if (rnd2(x, y, seed) < 0.04) c = ramp[2];else if (rnd2(x, y, seed + 1) < 0.03) c = ramp[0];
      } else if (mat === 'block') {
        // stone block courses
        if ((y - ytop) % 5 === 0) c = ramp[3];
        if ((x - x0 + Math.floor((y - ytop) / 5) % 2 * 4) % 8 === 0) c = ramp[3];
      } else if (mat === 'log') {
        // stacked log ends -> horizontal rounds
        const r = (y - ytop) % 5;
        if (r === 0) c = ramp[3];else if (r === 1) c = ramp[0];
      }
      P(g, x, y, c);
    }
  }
}

// ---- right side wall (east face), recedes up-right by dep, in shadow
function rightWall(g, x1, ytop, ybot, dep, ramp, mat, seed) {
  for (let d = 1; d <= dep; d++) {
    const sx = x1 + d,
      yt = ytop - Math.floor(d / 2),
      yb = ybot - Math.floor(d / 2);
    for (let y = yt; y <= yb; y++) {
      let c = ramp[2];
      if (d >= dep - 1) c = ramp[3];
      if (mat === 'timber' && (y - yt) % 4 === 0) c = ramp[3];
      if (mat === 'block' && (y - yt) % 5 === 0) c = ramp[3];
      if (rnd2(sx, y, seed) < 0.05) c = ramp[3];
      P(g, sx, y, c);
    }
  }
}

// ---- gable roof: lit front triangle + shadowed right slope + eaves
function gableRoof(g, x0, x1, ytop, dep, roofH, ramp, opt) {
  opt = opt || {};
  const cx = (x0 + x1) / 2;
  const ov = opt.overhang == null ? 3 : opt.overhang;
  const gx0 = x0 - ov,
    gx1 = x1 + ov;
  // front gable triangle
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH;
    const hw = (gx1 - gx0) / 2 * t;
    const yy = ytop - roofH + y;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      let c = ramp[1];
      if (x <= cx - hw + 2) c = ramp[0];else if (x >= cx + hw - 1) c = ramp[2];
      if (y % 3 === 0) c = ramp[2]; // shingle rows
      P(g, x, yy, c);
    }
  }
  // ridge + right roof slope receding
  for (let d = 1; d <= dep + ov; d++) {
    const ys = Math.floor(d / 2);
    for (let y = 0; y <= roofH; y++) {
      const t = y / roofH;
      const x = Math.round(cx + d + (gx1 - cx) * t);
      const yy = Math.round(ytop - roofH - ys + y);
      let c = ramp[2];
      if (y % 3 === 0) c = ramp[3];
      if (d >= dep + ov - 1) c = ramp[3];
      P(g, x, yy, c);
    }
  }
  // ridge beam highlight
  for (let d = 0; d <= dep + ov; d++) P(g, Math.round(cx + d), ytop - roofH - Math.floor(d / 2), ramp[0]);
}

// ---- warm lit window (ember interior glow) with frame
function litWindow(g, x, y, w, h, opt) {
  opt = opt || {};
  const em = RAMP.ember,
    fr = opt.frame || RAMP.dirt;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = em[1];
    if (i === 0 || j === 0 || i === w - 1 || j === h - 1) c = em[0];
    if ((i + j) % 2 === 0 && rnd2(x + i, y + j, 12) < 0.3) c = em[0];
    P(g, x + i, y + j, c);
  }
  // frame + cross mullion
  for (let i = -1; i <= w; i++) {
    P(g, x + i, y - 1, fr[3]);
    P(g, x + i, y + h, fr[3]);
  }
  for (let j = -1; j <= h; j++) {
    P(g, x - 1, y + j, fr[3]);
    P(g, x + w, y + j, fr[3]);
  }
  if (!opt.noCross) {
    for (let j = 0; j < h; j++) P(g, x + (w >> 1) - (w > 5 ? 0 : 0), y + j, fr[3]);
    for (let i = 0; i < w; i++) P(g, x + i, y + (h >> 1), fr[3]);
  }
  // warm spill below the sill
  P(g, x, y + h + 1, em[2]);
  P(g, x + w - 1, y + h + 1, em[2]);
}

// ---- plank door on the south wall
function door(g, cx, ybot, w, h, ramp, opt) {
  opt = opt || {};
  const x0 = cx - (w >> 1);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = ramp[2];
    if (i === 0) c = ramp[1];
    if (i === w - 1) c = ramp[3];
    if (i % 2 === 1) c = ramp[3]; // plank gaps
    P(g, x0 + i, ybot - h + j, c);
  }
  // frame
  for (let j = -1; j <= h; j++) {
    P(g, x0 - 1, ybot - h + j, ramp[3]);
    P(g, x0 + w, ybot - h + j, ramp[3]);
  }
  for (let i = -1; i <= w; i++) P(g, x0 + i, ybot - h - 1, opt.lintel || ramp[3]);
  // handle
  P(g, x0 + w - 2, ybot - (h >> 1), opt.handle || RAMP.gold[1]);
}

// ---- hanging sign board (post + chains + plate with a glyph)
function hangingSign(g, x, y, w, h, plate, glyphFn) {
  // bracket
  for (let i = 0; i < 6; i++) P(g, x - 1 + i, y - 2, RAMP.dirt[3]);
  P(g, x + 4, y - 2, RAMP.dirt[3]);
  // chains
  P(g, x + 1, y - 1, RAMP.bone[3]);
  P(g, x + w - 2, y - 1, RAMP.bone[3]);
  // plate
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = plate[1];
    if (i === 0 || j === 0) c = plate[0];
    if (i === w - 1 || j === h - 1) c = plate[3];
    P(g, x + i, y + j, c);
  }
  if (glyphFn) glyphFn(g, x, y, w, h);
}
function smoke(g, cx, topY) {
  const bn = RAMP.bone;
  let x = cx,
    y = topY;
  for (let k = 0; k < 10; k++) {
    P(g, x, y, bn[3]);
    if (k % 2 === 0) P(g, x + (k % 4 === 0 ? 1 : -1), y, bn[3]);
    y -= 1 + k % 2;
    x += (k % 3 === 0 ? 1 : 0) * (k % 6 < 3 ? 1 : -1);
  }
}
function moss(g, x0, x1, y, ramp) {
  for (let x = x0; x <= x1; x++) if (rnd2(x, y, 15) < 0.4) {
    P(g, x, y, ramp[2]);
    if (rnd2(x, y, 16) < 0.4) P(g, x, y + 1, ramp[3]);
  }
}

/* ===================================================================== */
/* THE EIGHT STRUCTURES                                                  */
/* ===================================================================== */

// shared house frame; returns key coords for detailing
function houseShell(g, opt) {
  const cx = 72,
    baseY = opt.baseY || 130;
  foundation(g, cx, baseY + 8, opt.found == null ? 58 : opt.found, {
    ash: opt.ash
  });
  const fw = opt.fw || 64,
    fh = opt.fh || 56,
    dep = opt.dep || 26,
    roofH = opt.roofH || 22;
  const x0 = cx - (fw >> 1),
    x1 = cx + (fw >> 1),
    ytop = baseY - fh,
    ybot = baseY;
  rightWall(g, x1, ytop, ybot, dep, opt.wall, opt.mat, opt.seed || 1);
  frontWall(g, x0, x1, ytop, ybot, opt.wall, opt.seed || 1, opt.mat);
  if (opt.roof !== false) gableRoof(g, x0, x1, ytop, dep, roofH, opt.roofRamp || RAMP.dirt, {
    overhang: opt.overhang
  });
  return {
    cx,
    x0,
    x1,
    ytop,
    ybot,
    fw,
    fh,
    dep,
    roofH
  };
}
function drawDyeworks() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.bone,
    mat: 'plaster',
    roofRamp: RAMP.stone,
    fh: 60,
    fw: 66,
    seed: 21
  });
  // GREAT colorful dye drips running down from the upper floor (signature)
  const dyes = [[RAMP.drift[2], RAMP.drift[1]], [RAMP.ember[1], RAMP.ember[0]], [RAMP.water[0], '#6fa8c8'], [RAMP.gold[1], RAMP.gold[0]], [RAMP.blood[1], RAMP.blood[0]], [RAMP.grass[1], RAMP.grass[0]]];
  let ddx = s.x0 + 3;
  for (let i = 0; ddx < s.x1 - 2; i++) {
    const dark = dyes[i % dyes.length][0],
      lit = dyes[i % dyes.length][1];
    const w = 2 + (rnd2(i, 2, 9) < 0.4 ? 1 : 0);
    const len = 16 + Math.floor(rnd2(i, 3, 9) * 26); // long runs: upper floor → mid wall
    fillRect(g, ddx, s.ytop + 3, w + 1, 3, dark); // pooled source at the seam
    for (let k = 0; k < len; k++) {
      const yy = s.ytop + 4 + k,
        wob = Math.round(Math.sin(k * 0.35 + i) * 0.5);
      for (let c = 0; c < w; c++) P(g, ddx + c + wob, yy, c === 0 ? lit : dark);
      if (k > len - 4) P(g, ddx + (w >> 1) + wob, yy, dark);
    }
    P(g, ddx + (w >> 1), s.ytop + 4 + len, dark); // bead
    ddx += w + 2 + Math.floor(rnd2(i, 5, 9) * 5);
  }
  // door + lit window
  door(g, s.cx - 12, s.ybot, 10, 22, RAMP.dirt);
  litWindow(g, s.cx + 6, s.ytop + 18, 9, 9);
  // steaming dye vats out front
  [[s.x0 + 2, s.ybot + 6, RAMP.drift], [s.x0 + 12, s.ybot + 9, RAMP.ember]].forEach(([vx, vy, r]) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) {
      let c = RAMP.dirt[2];
      if (i === 0) c = RAMP.dirt[1];
      if (i === 7) c = RAMP.dirt[3];
      if (j === 0) c = r[2];
      P(g, vx + i, vy + j, c);
    }
    P(g, vx + 3, vy - 2, RAMP.bone[3]);
    P(g, vx + 4, vy - 4, RAMP.bone[3]);
    P(g, vx + 3, vy - 6, RAMP.bone[3]);
  });
  // drying cloth line (many colors)
  for (let i = 0; i < 7; i++) {
    const lx = s.x1 + 2 + i * 4;
    const col = dyes[i % dyes.length][0];
    P(g, lx, s.ytop + 8, RAMP.bone[3]);
    for (let j = 0; j < 6; j++) P(g, lx, s.ytop + 9 + j, col);
  }
  for (let x = s.x1; x <= s.x1 + 30; x++) P(g, x, s.ytop + 7, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}
function drawVault() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.stone,
    mat: 'block',
    roof: false,
    fh: 64,
    fw: 72,
    dep: 30,
    found: 60,
    seed: 31
  });
  // flat fortified parapet instead of gable
  for (let x = s.x0 - 2; x <= s.x1 + 2; x++) for (let y = s.ytop - 6; y < s.ytop; y++) {
    let c = RAMP.stone[1];
    if (x < s.x0) c = RAMP.stone[0];
    if (x > s.x1) c = RAMP.stone[2];
    if (x % 6 < 2 && y < s.ytop - 3) c = null;
    P(g, x, y, c || RAMP.stone[1]);
    if (x % 6 < 2 && y < s.ytop - 3) g.d[y * g.w + x] = null;
  }
  // crenellations
  for (let x = s.x0 - 2; x <= s.x1 + 2; x += 6) for (let i = 0; i < 3; i++) for (let y = s.ytop - 9; y < s.ytop - 6; y++) P(g, x + i, y, RAMP.stone[2]);
  // top face receding
  for (let d = 1; d <= s.dep; d++) for (let x = s.x0 - 2; x <= s.x1 + 2; x++) P(g, x + d, s.ytop - 6 - Math.floor(d / 2), RAMP.stone[3]);
  // gold-trimmed reinforced door
  const dx = s.cx,
    db = s.ybot;
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) {
    let c = RAMP.stone[3];
    if (i === -7) c = RAMP.gold[2];
    if (i === 7) c = RAMP.gold[3];
    if (Math.abs(i) === 4) c = RAMP.gold[3];
    P(g, dx + i, db - 26 + j, c);
  }
  for (let i = -8; i <= 8; i++) P(g, dx + i, db - 27, RAMP.gold[1]); // gold lintel
  for (let j = -27; j <= 0; j += 1) {
    P(g, dx - 8, db + j, RAMP.gold[2]);
    P(g, dx + 8, db + j, RAMP.gold[2]);
  }
  // big gold ring + seam
  P(g, dx, db - 13, RAMP.gold[0]);
  P(g, dx - 1, db - 13, RAMP.gold[1]);
  P(g, dx + 1, db - 13, RAMP.gold[1]);
  P(g, dx, db - 12, RAMP.gold[2]);
  // small barred lit window high up
  litWindow(g, s.cx - 6, s.ytop + 8, 5, 5, {
    noCross: true
  });
  for (let i = 0; i < 5; i++) P(g, s.cx - 6 + i, s.ytop + 10, RAMP.stone[3]); // bars
  // gold seam coin emblem on wall
  P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]);
  fillRect(g, s.x1 - 9, s.ytop + 21, 3, 3, RAMP.gold[1]);
  P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]);
  outline(g, RAMP.void);
  return g;
}
function drawCasino() {
  const g = makeGrid(144, 152);
  foundation(g, 72, 138, 56, {});
  const cx = 72,
    baseY = 130,
    tw = 76,
    th = 64;
  const x0 = cx - (tw >> 1),
    x1 = cx + (tw >> 1),
    ytop = baseY - th;
  // tent body: blood-red & void-black vertical stripes, slightly crooked
  for (let x = x0; x <= x1; x++) {
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = ytop + 10; y <= baseY; y++) {
      const skew = Math.round((y - ytop) * 0.04);
      let c = stripe ? RAMP.blood[2] : RAMP.ash;
      if (x <= x0 + 1) c = stripe ? RAMP.blood[1] : RAMP.stone[2];else if (x >= x1 - 1) c = stripe ? RAMP.blood[3] : RAMP.void;
      P(g, x + skew, y, c);
    }
  }
  // peaked tent roof (scalloped)
  for (let x = x0 - 4; x <= x1 + 4; x++) {
    const d = Math.abs(x - cx);
    const yy = ytop + 10 - Math.round((1 - d / (tw / 2 + 4)) * 26);
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = yy; y <= ytop + 11; y++) P(g, x, y, stripe ? RAMP.blood[1] : RAMP.ash);
  }
  // scalloped valance
  for (let x = x0 - 4; x <= x1 + 4; x += 4) {
    for (let i = 0; i < 3; i++) P(g, x + i, ytop + 11 + (i === 1 ? 2 : 1), RAMP.gold[1]);
  }
  // center pole flag
  for (let y = ytop - 22; y < ytop - 12; y++) P(g, cx, y, RAMP.dirt[3]);
  fillRect(g, cx + 1, ytop - 22, 6, 4, RAMP.blood[1]);
  P(g, cx + 6, ytop - 21, RAMP.blood[2]);
  // entrance flap (door) — open dark interior with tied-back curtains
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 26 * t * 0.5) continue; // arched top
    P(g, cx + i, baseY - 26 + j + Math.round(t * 3), i <= -5 ? RAMP.blood[3] : i >= 5 ? RAMP.void : RAMP.void);
  }
  for (let i = -8; i <= 8; i++) P(g, cx + i, baseY - 26 + Math.round(Math.abs(i) / 8 * 3), RAMP.gold[2]); // arch trim
  // warm glow + a beckoning lantern just inside
  litWindow(g, cx - 3, baseY - 18, 5, 5, {
    noCross: true
  });
  // big multicolor prize wheel by the entrance
  const wx = x0 - 12,
    wy = baseY - 30;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.moss ? RAMP.grass[1] : RAMP.grass[1]];
  for (let yy = -11; yy <= 11; yy++) for (let xx = -11; xx <= 11; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > 11) continue;
    if (d > 9) {
      P(g, wx + xx, wy + yy, RAMP.dirt[3]);
      continue;
    }
    const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2);
    P(g, wx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]);
  }
  P(g, wx, wy, RAMP.bone[0]);
  P(g, wx + 1, wy - 9, RAMP.bone[0]); // hub + pointer
  for (let k = 0; k < 14; k++) P(g, wx - 11, wy - 11 + k, RAMP.dirt[3]); // post
  // hanging coin-charms over entrance
  for (let x = x0 + 4; x <= x1 - 4; x += 6) {
    P(g, x, ytop + 12, RAMP.gold[2]);
    P(g, x, ytop + 14, RAMP.gold[1]);
    P(g, x, ytop + 15, RAMP.gold[2]);
  }
  // a warm lit slit window
  litWindow(g, x1 - 14, baseY - 30, 6, 7, {
    noCross: true
  });
  outline(g, RAMP.void);
  return g;
}
function drawTavern() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.dirt,
    mat: 'timber',
    roofRamp: RAMP.blood,
    fh: 56,
    fw: 66,
    seed: 41,
    overhang: 4
  });
  // timber A-frame braces on facade
  for (let k = 0; k < s.fh; k++) {
    P(g, s.x0 + 2 + Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]);
    P(g, s.x1 - 2 - Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]);
  }
  for (let x = s.x0 + 4; x <= s.x1 - 4; x++) P(g, x, s.ytop + 22, RAMP.dirt[3]); // mid beam
  // crooked chimney with smoke
  const chx = s.x1 - 6;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 6; i++) {
    let c = RAMP.stone[2];
    if (i === 0) c = RAMP.stone[1];
    if (i === 5) c = RAMP.stone[3];
    if (j % 4 === 0) c = RAMP.stone[3];
    P(g, chx + i + Math.round(j * 0.15), s.ytop - 18 + j, c);
  }
  smoke(g, chx + 3, s.ytop - 19);
  // several glowing windows
  litWindow(g, s.cx - 18, s.ytop + 16, 8, 8);
  litWindow(g, s.cx + 10, s.ytop + 16, 8, 8);
  litWindow(g, s.cx - 4, s.ytop + 30, 7, 7, {
    noCross: true
  });
  // door (open, warm spill)
  door(g, s.cx, s.ybot, 12, 24, RAMP.dirt, {
    handle: RAMP.gold[0]
  });
  for (let j = 0; j < 22; j++) for (let i = -2; i <= 2; i++) if (rnd2(i, j, 17) < 0.5) P(g, s.cx + i, s.ybot - 22 + j, RAMP.ember[2]);
  // big ember lantern over the door
  const lx = s.cx,
    ly = s.ytop + 40;
  P(g, lx, ly - 3, RAMP.dirt[3]);
  for (let j = 0; j < 7; j++) for (let i = -3; i <= 3; i++) {
    const t = Math.abs(i) / 3;
    let c = RAMP.ember[1];
    if (j === 0 || j === 6) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[0];else if (i >= 2) c = RAMP.ember[2];
    if (t > 0.9 && (j === 1 || j === 5)) c = RAMP.dirt[3];
    P(g, lx + i, ly + j, c);
  }
  P(g, lx, ly + 3, RAMP.ember[0]);
  // glow halo (dither)
  for (let yy = -5; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 5 && d < 9 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]);
  }
  // barrels outside
  [[s.x0 - 8, s.ybot + 4], [s.x0 - 1, s.ybot + 8]].forEach(([bx, by]) => {
    for (let j = 0; j < 10; j++) for (let i = 0; i < 8; i++) {
      const t = Math.abs(i - 3.5) / 4;
      let c = RAMP.dirt[1];
      if (i === 0) c = RAMP.dirt[0];
      if (i >= 6) c = RAMP.dirt[2];
      if (j === 0 || j === 9 || j === 4) c = RAMP.dirt[3];
      if (t > 0.85) c = RAMP.dirt[3];
      P(g, bx + i, by + j, c);
    }
  });
  // hanging tavern sign (lantern glyph)
  hangingSign(g, s.x1 + 4, s.ytop + 26, 12, 9, RAMP.dirt, (gg, x, y, w, h) => {
    fillRect(gg, x + 4, y + 2, 4, 5, RAMP.ember[1]);
    P(gg, x + 5, y + 1, RAMP.ember[0]);
    P(gg, x + 5, y + 7, RAMP.ember[0]);
  });
  outline(g, RAMP.void);
  return g;
}
function drawFurnisher() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.dirt,
    mat: 'log',
    roofRamp: RAMP.stone,
    fh: 54,
    fw: 60,
    seed: 51
  });
  // log-end texture already in wall; door + lit window
  door(g, s.cx + 8, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 12, s.ytop + 16, 9, 9);
  // lean-to awning over a workbench (left side)
  const ax0 = s.x0 - 26,
    ax1 = s.x0 + 2,
    ay = s.ytop + 20;
  for (let x = ax0; x <= ax1; x++) {
    const yy = ay + Math.round((x - ax0) * 0.4);
    for (let k = 0; k < 2; k++) P(g, x, yy + k, k ? RAMP.dirt[3] : RAMP.dirt[2]);
  }
  for (let k = 0; k < 18; k++) {
    P(g, ax0, ay + 1 + k, RAMP.dirt[3]);
    P(g, ax0 + 1, ay + 1 + k, RAMP.dirt[2]);
  } // post
  // workbench
  const wbx = ax0 + 4,
    wby = s.ybot - 4;
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby, RAMP.dirt[1]);
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby + 1, RAMP.dirt[3]);
  P(g, wbx + 1, wby + 2, RAMP.dirt[3]);
  P(g, wbx + 1, wby + 3, RAMP.dirt[3]);
  P(g, wbx + 18, wby + 2, RAMP.dirt[3]);
  P(g, wbx + 18, wby + 3, RAMP.dirt[3]);
  // a half-built chair on the bench + saw
  fillRect(g, wbx + 4, wby - 5, 2, 5, RAMP.dirt[2]);
  fillRect(g, wbx + 4, wby - 5, 5, 2, RAMP.dirt[1]);
  P(g, wbx + 8, wby - 5, RAMP.dirt[2]);
  for (let i = 0; i < 6; i++) P(g, wbx + 11 + i, wby - 2, RAMP.bone[1]); // saw blade
  P(g, wbx + 17, wby - 3, RAMP.dirt[3]);
  // sawdust
  for (let i = 0; i < 12; i++) if (rnd2(i, 5, 18) < 0.6) P(g, wbx + 2 + i, s.ybot + 1 + i % 2, RAMP.gold[2]);
  // stacked crates + planks (right)
  const px = s.x1 + 4;
  for (let c = 0; c < 2; c++) for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
    let col = RAMP.dirt[1];
    if (i === 0) col = RAMP.dirt[0];
    if (i === 8) col = RAMP.dirt[2];
    if (j === 0 || j === 8 || i === 0 || i === 8) col = RAMP.dirt[3];
    if (i === j || i === 8 - j) col = RAMP.dirt[2];
    P(g, px + c * 10, s.ybot - 9 - (c ? 9 : 0) + j, col);
    P(g, px + c * 10 + i, s.ybot - 9 - (c ? 9 : 0) + j, col);
  }
  for (let i = 0; i < 12; i++) {
    P(g, px - 2, s.ybot - 2 - i * 0, RAMP.dirt[2]);
  } // (planks leaning)
  for (let k = 0; k < 14; k++) {
    P(g, px + 18 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[1]);
    P(g, px + 19 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[3]);
  }
  // small wares banner + lamp out front
  hangingSign(g, s.x1 + 2, s.ytop + 24, 11, 8, RAMP.dirt, (gg, x, y, w, h) => {
    fillRect(gg, x + 3, y + 2, 5, 2, RAMP.dirt[1]);
    P(gg, x + 4, y + 4, RAMP.dirt[2]);
    P(gg, x + 6, y + 4, RAMP.dirt[2]); // chair glyph
  });
  outline(g, RAMP.void);
  return g;
}
function drawMenagerie() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.dirt,
    mat: 'timber',
    roofRamp: RAMP.water,
    fh: 56,
    fw: 62,
    seed: 61
  });
  // door + lit window
  door(g, s.cx, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 18, s.ytop + 30, 7, 7, {
    noCross: true
  });
  // cages built onto facade
  function cage(x, y, w, h, content) {
    for (let i = -1; i <= w; i++) {
      P(g, x + i, y - 1, RAMP.stone[3]);
      P(g, x + i, y + h, RAMP.stone[3]);
    }
    for (let j = -1; j <= h; j++) {
      P(g, x - 1, y + j, RAMP.stone[3]);
      P(g, x + w, y + j, RAMP.stone[3]);
    }
    for (let i = 0; i < w; i += 2) for (let j = 0; j < h; j++) P(g, x + i, y + j, RAMP.stone[2]); // bars
    content(x, y, w, h);
  }
  // glowing wisp in a cage (left)
  cage(s.x0 + 4, s.ytop + 16, 10, 12, (x, y, w, h) => {
    const wx = x + 5,
      wy = y + 7;
    P(g, wx, wy, RAMP.drift[0]);
    P(g, wx - 1, wy, RAMP.drift[1]);
    P(g, wx + 1, wy, RAMP.drift[1]);
    P(g, wx, wy - 1, RAMP.drift[1]);
    P(g, wx, wy + 1, RAMP.drift[2]);
    for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  });
  // empty perch cage (right)
  cage(s.x1 - 14, s.ytop + 18, 10, 12, (x, y, w, h) => {
    for (let i = 2; i < w - 2; i++) P(g, x + i, y + h - 3, RAMP.dirt[3]); // perch
    P(g, x + 4, y + h - 4, RAMP.gold[2]); // seed
  });
  // perched black bird on the roofline (clear silhouette)
  const bx = s.cx + 2,
    by = s.ytop - s.roofH - 4;
  fillRect(g, bx, by + 1, 5, 3, RAMP.void); // body
  fillRect(g, bx + 5, by + 2, 3, 1, RAMP.void); // tail
  P(g, bx + 1, by, RAMP.void);
  P(g, bx + 1, by - 1, RAMP.void); // raised head
  P(g, bx + 2, by - 1, RAMP.void);
  P(g, bx, by, RAMP.drift[1]); // drift eye glint
  P(g, bx + 1, by + 4, RAMP.gold[2]);
  P(g, bx + 3, by + 4, RAMP.gold[2]); // legs
  for (let k = 0; k < 3; k++) P(g, bx + 5 + k, by + 1 - k, RAMP.void); // tail upsweep
  // drift-purple accents on eaves
  for (let x = s.x0 - 3; x <= s.x1 + 3; x += 5) P(g, x, s.ytop + 1, RAMP.drift[2]);
  // sign (paw/feather glyph)
  hangingSign(g, s.x1 + 2, s.ytop + 30, 11, 8, RAMP.water, (gg, x, y, w, h) => {
    P(gg, x + 5, y + 2, RAMP.bone[1]);
    P(gg, x + 4, y + 4, RAMP.bone[1]);
    P(gg, x + 6, y + 4, RAMP.bone[1]);
    P(gg, x + 5, y + 5, RAMP.bone[2]);
  });
  outline(g, RAMP.void);
  return g;
}

// ---- SHRINE (not a house): stepped dais + cracked altar + Pale Flame (3 frames)
function drawShrine(frame) {
  frame = frame || 0;
  const g = makeGrid(112, 128);
  const cx = 56,
    baseY = 116;
  // scorch marks on ground
  for (let i = 0; i < 26; i++) {
    const a = rnd2(i, frame, 19);
    const x = cx - 30 + Math.floor(rnd2(i, 1, 19) * 60);
    const y = baseY + 2 + Math.floor(rnd2(i, 2, 19) * 6);
    if (a < 0.5) P(g, x, y, RAMP.void);else if (a < 0.7) P(g, x, y, RAMP.ash);
  }
  // stepped stone dais (3 tiers, iso)
  for (let t = 0; t < 3; t++) {
    const hw = 38 - t * 8,
      ty = baseY - t * 8,
      hh = Math.round(hw / 2);
    for (let dy = -hh; dy <= hh; dy++) {
      const k = 1 - Math.abs(dy) / hh,
        w = Math.round(hw * k);
      for (let dx = -w; dx <= w; dx++) {
        let c = RAMP.stone[1];
        if (dy < 0 && dx < 0) c = RAMP.stone[0];else if (dy > 0) c = RAMP.stone[2];
        if (rnd2(cx + dx, ty + dy, 20) < 0.05) c = RAMP.stone[2];
        P(g, cx + dx, ty + dy, c);
      }
    }
    for (let dx = -hw; dx <= hw; dx++) {
      const k = 1 - Math.abs(dx) / hw;
      const ey = ty + Math.round(hh * k);
      for (let s2 = 1; s2 <= 4; s2++) P(g, cx + dx, ey + s2, s2 < 3 ? RAMP.stone[2] : RAMP.stone[3]);
    }
  }
  // cracked altar block
  const ay = baseY - 30;
  for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) {
    let c = RAMP.stone[1];
    if (i < -7) c = RAMP.stone[0];
    if (i > 7) c = RAMP.stone[2];
    if (j === 0) c = RAMP.stone[0];
    if (j > 9) c = RAMP.stone[3];
    P(g, cx + i, ay + j, c);
  }
  // crack
  for (let j = 0; j < 12; j++) P(g, cx + 2 + Math.round(Math.sin(j) * 1.5), ay + j, RAMP.stone[3]);
  // votive candles
  [[cx - 14, baseY - 16], [cx + 14, baseY - 16], [cx - 20, baseY - 6], [cx + 20, baseY - 6]].forEach(([vx, vy], i) => {
    P(g, vx, vy, RAMP.bone[1]);
    P(g, vx, vy + 1, RAMP.bone[2]);
    P(g, vx, vy - 1, RAMP.ember[(frame + i) % 2 ? 1 : 0]);
  });
  // THE PALE FLAME — bone-white fire, drift-purple core, flicker per frame
  const fx = cx,
    fy = ay - 2;
  const sway = [0, 1, -1][frame],
    tall = [0, 1, 2][frame];
  // outer bone flame
  for (let yy = 0; yy <= 14 + tall; yy++) {
    const t = yy / (14 + tall);
    const hw = Math.round((1 - t) * 6 * (1 - t * 0.2)) + (yy < 3 ? 1 : 0);
    const sx = fx + Math.round(Math.sin(yy * 0.5 + frame) * 1.2) + Math.round(sway * t * 2);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = RAMP.bone[0];
      if (Math.abs(xx) >= hw - 1) c = RAMP.bone[1];
      if (Math.abs(xx) >= hw) c = RAMP.drift[1];
      P(g, sx + xx, fy - yy, c);
    }
  }
  // drift-purple core
  for (let yy = 1; yy <= 8 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (9 + tall)) * 3));
    const sx = fx + Math.round(sway * (yy / 10));
    for (let xx = -hw; xx <= hw; xx++) P(g, sx + xx, fy - yy - 1, Math.abs(xx) === 0 ? RAMP.drift[0] : RAMP.drift[2]);
  }
  // rising mote sparks
  for (let i = 0; i < 4; i++) {
    const a = (frame + i) % 3;
    if (a < 2) P(g, fx - 3 + i * 2, fy - 14 - i * 2 - tall, i % 2 ? RAMP.drift[1] : RAMP.bone[0]);
  }
  // pale glow halo (dither)
  for (let yy = -12; yy <= 4; yy++) for (let xx = -10; xx <= 10; xx++) {
    const d = Math.abs(xx) + Math.abs(yy * 1.3);
    if (d > 8 && d < 12 && (xx + yy + frame) % 2 === 0) P(g, fx + xx, fy - 6 + yy, RAMP.drift[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// ---- THE PIT (not a house): flat arena ring, center-anchored, drawn UNDER entities
function drawPit() {
  const g = makeGrid(240, 120);
  const cx = 120,
    cy = 60,
    RX = 108,
    RY = 54;
  // packed-sand floor (iso ellipse)
  for (let y = -RY; y <= RY; y++) for (let x = -RX; x <= RX; x++) {
    const d = (x / RX) ** 2 + (y / RY) ** 2;
    if (d > 1) continue;
    let c = RAMP.dirt[1];
    if (d > 0.82) c = RAMP.dirt[3]; // worn rim
    else if (d > 0.6) c = RAMP.dirt[2];
    if (rnd2(cx + x, cy + y, 22) < 0.05) c = RAMP.dirt[2];
    if (rnd2(cx + x, cy + y, 23) < 0.02) c = RAMP.dirt[0];
    P(g, cx + x, cy + y, c);
  }
  // old bloodstains
  for (let i = 0; i < 7; i++) {
    const bx = cx + Math.floor((rnd2(i, 1, 24) - 0.5) * RX * 1.2);
    const by = cy + Math.floor((rnd2(i, 2, 24) - 0.5) * RY * 1.2);
    if ((bx - cx) ** 2 / RX ** 2 + (by - cy) ** 2 / RY ** 2 > 0.7) continue;
    for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) {
      if (rnd2(bx + xx, by + yy, 25) < 0.45 && xx * xx + yy * yy < 14) P(g, bx + xx, by + yy, RAMP.blood[3]);
    }
  }
  // ten weathered standing stones around the rim, drift-touched tips
  const N = 10;
  for (let i = 0; i < N; i++) {
    const ang = i / N * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * RX * 0.96);
    const sy = Math.round(cy + Math.sin(ang) * RY * 0.96);
    const h = 16 + Math.floor(rnd2(i, 3, 26) * 8);
    const w = 4 + Math.floor(rnd2(i, 4, 26) * 2);
    for (let j = 0; j < h; j++) for (let k = -w; k <= w; k++) {
      const t = j / h;
      const ww = Math.round(w * (1 - t * 0.3));
      if (Math.abs(k) > ww) continue;
      let c = RAMP.stone[1];
      if (k < -ww + 1) c = RAMP.stone[0];
      if (k > ww - 1) c = RAMP.stone[3];
      if (rnd2(sx + k, sy - j, 27) < 0.08) c = RAMP.stone[2];
      P(g, sx + k, sy - j, c);
    }
    // drift-touched tip
    for (let k = -w + 1; k <= w - 1; k++) P(g, sx + k, sy - h, RAMP.drift[2]);
    P(g, sx, sy - h - 1, RAMP.drift[1]);
    if (i % 2) P(g, sx, sy - h - 2, RAMP.drift[0]);
    // base shadow
    for (let k = -w - 1; k <= w + 1; k++) P(g, sx + k, sy + 1, RAMP.void);
    // half-buried skull at some rims
    if (i % 3 === 0) {
      const kx = sx + 5,
        ky = sy + 2;
      fillRect(g, kx, ky, 4, 3, RAMP.bone[1]);
      P(g, kx + 1, ky + 1, RAMP.void);
      P(g, kx + 3, ky + 1, RAMP.void);
      P(g, kx + 1, ky + 3, RAMP.bone[2]);
    }
  }
  // sagging rope/chain between some stones
  for (let i = 0; i < N; i++) {
    if (i % 2) continue;
    const a0 = i / N * Math.PI * 2,
      a1 = (i + 1) / N * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * RX * 0.96,
      y0 = cy + Math.sin(a0) * RY * 0.96;
    const x1 = cx + Math.cos(a1) * RX * 0.96,
      y1 = cy + Math.sin(a1) * RY * 0.96;
    for (let t = 0; t <= 1; t += 0.06) {
      const x = Math.round(x0 + (x1 - x0) * t);
      const sag = Math.sin(t * Math.PI) * 5;
      const y = Math.round(y0 + (y1 - y0) * t - 14 + sag);
      P(g, x, y, RAMP.dirt[3]);
      if (Math.floor(t * 16) % 2 === 0) P(g, x, y, RAMP.stone[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}
const TOWN = {
  dyeworks: {
    fn: drawDyeworks,
    cell: [144, 152],
    anchor: [72, 151]
  },
  vault: {
    fn: drawVault,
    cell: [144, 152],
    anchor: [72, 151]
  },
  casino: {
    fn: drawCasino,
    cell: [144, 152],
    anchor: [72, 151]
  },
  tavern: {
    fn: drawTavern,
    cell: [144, 152],
    anchor: [72, 151]
  },
  furnisher: {
    fn: drawFurnisher,
    cell: [144, 152],
    anchor: [72, 151]
  },
  menagerie: {
    fn: drawMenagerie,
    cell: [144, 152],
    anchor: [72, 151]
  },
  shrine: {
    fn: drawShrine,
    cell: [112, 128],
    anchor: [56, 127],
    frames: 3
  },
  pit: {
    fn: drawPit,
    cell: [240, 120],
    anchor: [120, 60],
    under: true
  }
};
Object.assign(globalThis, {
  rnd2,
  foundation,
  frontWall,
  rightWall,
  gableRoof,
  litWindow,
  door,
  hangingSign,
  smoke,
  moss,
  houseShell,
  drawDyeworks,
  drawVault,
  drawCasino,
  drawTavern,
  drawFurnisher,
  drawMenagerie,
  drawShrine,
  drawPit,
  TOWN
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/town.js", error: String((e && e.message) || e) }); }

// assets/_gen/walls.js
try { (() => {
// Naevyr INTERIOR WALL SET (corrected) — eval after pixlib.js + tiles.js.
// Skewed parallelogram faces that follow the 2:1 iso diagonal and TILE
// seamlessly. Rect-grid, RAMP only, dither not blur, deterministic.
// One segment = one floor tile's back edge: 32 wide, bottom drops 16 across it.
// Face 48 tall, +6 top cap, +1 void cap edge. Cell 32×72.
//   ne  = bottom edge FALLS left→right  (shadowed back-right face)
//   nw  = bottom edge RISES left→right  (moonlit  back-left  face)
// Tiling: place adjacent segments at +32x,±16y. Textures are wall-relative
// (parallel to the sloped bottom) and horizontally periodic mod 32, so a
// segment's right edge continues onto the next segment's left edge.
// NO left/right void outline (would create seams); only the top cap carries
// the 1px void silhouette.

const W2 = {
  W: 32,
  H: 72,
  B: 55,
  FACE: 48,
  CAP: 6
};
function wall2BottomY(side, x) {
  // exact spec corners: ne (0,B)->(31,B+16); nw (0,B+16)->(31,B)
  return side === 'ne' ? W2.B + Math.round(x * 16 / 31) : W2.B + Math.round((31 - x) * 16 / 31);
}

// place a wall-relative feature pixel: (x, h) where h = rows up from bottom edge
function wfP(g, side, x, h, c) {
  if (x < 0 || x > 31) return;
  P(g, x, wall2BottomY(side, x) - h, c);
}
function drawWall2(side, mat, variant, opt) {
  opt = opt || {};
  const g = makeGrid(W2.W, W2.H);
  const lit = side === 'nw';
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  const base = lit ? ramp[1] : ramp[2];
  const hi = lit ? ramp[0] : ramp[1];
  const sh = lit ? ramp[2] : ramp[3];
  const dk = ramp[3];
  for (let x = 0; x < 32; x++) {
    const by = wall2BottomY(side, x);
    for (let h = 0; h < W2.FACE; h++) {
      const y = by - h;
      let c = base;
      // gentle ambient top-light (h-based → continuous across seams)
      if (h > W2.FACE - 5) c = hi;
      if (mat === 'timber') {
        if (h % 4 === 0) c = sh; // plank seams (wall-relative)
        if (hash2(x, h, 201) < 0.04) c = sh; // grain (periodic mod 32 in x)
      } else if (mat === 'block') {
        const course = Math.floor(h / 6),
          off = course % 2 * 4;
        if (h % 6 === 0) c = sh; // course mortar
        else if ((x + off) % 8 === 0) c = sh; // staggered vertical joints
        if (hash2(x, h, 202) < 0.03) c = lit ? ramp[1] : ramp[3];
      } else {
        // cave — raw rock
        const hh = hash2(x, h, 203);
        if (hh < 0.10) c = sh;else if (hh < 0.14) c = hi;
        if (hash2(x, h, 204) < 0.02) c = dk; // rubble speck
      }
      P(g, x, y, c);
    }
    // top cap (follows the slope), then 1px void cap edge
    const topRow = by - (W2.FACE - 1);
    for (let k = 1; k <= W2.CAP; k++) P(g, x, topRow - k, k < 2 ? lit ? RAMP.stone[1] : RAMP.stone[2] : mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]);
    P(g, x, topRow - W2.CAP - 1, RAMP.void);
    // baseboard trim
    P(g, x, by, dk);
  }

  // ---- feature variants (sit on a single segment; need not tile) ----
  if (variant === 'window') {
    const x0 = 8,
      x1 = 23,
      h0 = 20,
      h1 = 33;
    for (let x = x0; x <= x1; x++) for (let h = h0; h <= h1; h++) {
      let c = RAMP.ember[1];
      if (x === x0 || x === x1 || h === h0 || h === h1) c = RAMP.ember[0];
      if ((x + h) % 2 === 0 && hash2(x, h, 205) < 0.25) c = RAMP.ember[0];
      wfP(g, side, x, h, c);
    }
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      wfP(g, side, x, h1 + 1, RAMP.bone[2]);
      wfP(g, side, x, h0 - 1, RAMP.bone[3]);
    }
    for (let h = h0 - 1; h <= h1 + 1; h++) {
      wfP(g, side, x0 - 1, h, RAMP.bone[2]);
      wfP(g, side, x1 + 1, h, RAMP.bone[3]);
    }
    for (let h = h0; h <= h1; h++) wfP(g, side, 15, h, RAMP.bone[3]); // mullion V
    for (let x = x0; x <= x1; x++) wfP(g, side, x, 26, RAMP.bone[3]); // mullion H
    for (let x = x0 - 1; x <= x1 + 1; x++) wfP(g, side, x, h0 - 2, RAMP.ember[2]); // warm spill below
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx0 = 12,
      bx1 = 19,
      hTop = 41,
      hBot = 14;
    for (let x = bx0 - 1; x <= bx1 + 1; x++) wfP(g, side, x, hTop + 1, RAMP.dirt[3]); // rod
    for (let x = bx0; x <= bx1; x++) for (let h = hBot; h <= hTop; h++) {
      let c = acc[2];
      if (x === bx0) c = acc[1];
      if (x === bx1) c = acc[3];
      wfP(g, side, x, h, c);
    }
    // notched pennant tail
    for (let x = bx0; x <= bx1; x++) {
      const t = Math.abs(x - (bx0 + bx1) / 2) / ((bx1 - bx0) / 2);
      for (let k = 0; k < Math.round((1 - t) * 5); k++) wfP(g, side, x, hBot - 1 - k, acc[3]);
    }
    // emblem
    const ex = bx0 + bx1 >> 1;
    wfP(g, side, ex, 30, acc[0]);
    wfP(g, side, ex - 1, 29, acc[0]);
    wfP(g, side, ex + 1, 29, acc[0]);
    wfP(g, side, ex, 28, acc[1]);
  } else if (variant === 'seam') {
    let x = 3,
      h = 8;
    const rng = mulberry(206);
    for (let k = 0; k < 44; k++) {
      wfP(g, side, x, h, RAMP.gold[1]);
      if (rng() < 0.5) wfP(g, side, x, h - 1, RAMP.gold[2]);
      if (rng() < 0.3) wfP(g, side, x, h + 1, RAMP.gold[0]); // glint
      x += 1;
      h += rng() < 0.5 ? 1 : rng() < 0.5 ? -1 : 0;
      if (x > 29) break;
      h = Math.max(4, Math.min(W2.FACE - 5, h));
    }
  } else if (variant === 'lantern') {
    const lx = 16,
      lh = 30;
    for (let k = 0; k < 6; k++) wfP(g, side, lx, lh + 4 + k, RAMP.dirt[3]); // bracket up
    for (let h = 0; h < 8; h++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1];
      if (h === 0 || h === 7) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[2];else if (i >= 2) c = RAMP.ember[0];
      if ((h === 1 || h === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      wfP(g, side, lx + i, lh + h, c);
    }
    wfP(g, side, lx, lh, RAMP.ember[0]);
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < 8 && (xx + yy) % 2 === 0) wfP(g, side, lx + xx, lh + 3 - yy, RAMP.ember[2]);
    }
  }

  // NO global outline (left/right must stay open to tile). Feature frames
  // carry their own edges; the top cap carries the void silhouette.
  return g;
}

// ---- corner wedge (16×72): caps the north junction where nw & ne meet ----
function drawWall2Corner(mat) {
  const g = makeGrid(16, 72);
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  const by = W2.B; // flat high bottom at the corner
  for (let x = 0; x < 16; x++) {
    const litCol = x < 8;
    const base = litCol ? ramp[1] : ramp[2];
    const hi = litCol ? ramp[0] : ramp[1];
    const sh = litCol ? ramp[2] : ramp[3];
    for (let h = 0; h < W2.FACE; h++) {
      const y = by - h;
      let c = base;
      if (x === 7) c = ramp[0]; // corner edge highlight (moonlit seam)
      if (x === 8) c = ramp[3]; // shadow turn
      if (h > W2.FACE - 5) c = hi;
      if (mat === 'timber') {
        if (h % 4 === 0) c = sh;
      } else if (mat === 'block') {
        const course = Math.floor(h / 6),
          off = course % 2 * 4;
        if (h % 6 === 0) c = sh;else if ((x + off) % 8 === 0) c = sh;
      } else {
        const hh = hash2(x, h, 207);
        if (hh < 0.10) c = sh;else if (hh < 0.14) c = hi;
      }
      P(g, x, y, c);
    }
    const topRow = by - (W2.FACE - 1);
    for (let k = 1; k <= W2.CAP; k++) P(g, x, topRow - k, k < 2 ? RAMP.stone[1] : mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]);
    P(g, x, topRow - W2.CAP - 1, RAMP.void);
    P(g, x, by, ramp[3]);
  }
  return g;
}

// corner coords for JSON
function wall2Corners(side) {
  return side === 'ne' ? {
    bottomLeft: [0, 55],
    bottomRight: [31, 71],
    topRight: [31, 23],
    topLeft: [0, 7]
  } : {
    bottomLeft: [0, 71],
    bottomRight: [31, 55],
    topRight: [31, 7],
    topLeft: [0, 23]
  };
}

// registry: key, side, mat, variant
const WALLS2 = [['wall2_timber_nw', 'nw', 'timber', 'plain'], ['wall2_timber_ne', 'ne', 'timber', 'plain'], ['wall2_timber_nw_window', 'nw', 'timber', 'window'], ['wall2_timber_ne_banner', 'ne', 'timber', 'banner'], ['wall2_block_nw', 'nw', 'block', 'plain'], ['wall2_block_ne', 'ne', 'block', 'plain'], ['wall2_block_nw_window', 'nw', 'block', 'window'], ['wall2_block_ne_banner', 'ne', 'block', 'banner'], ['wall2_cave_nw', 'nw', 'cave', 'plain'], ['wall2_cave_ne', 'ne', 'cave', 'plain'], ['wall2_cave_nw_seam', 'nw', 'cave', 'seam'], ['wall2_cave_ne_lantern', 'ne', 'cave', 'lantern']];
const WALLS2_CORNER = ['timber', 'block', 'cave'];
Object.assign(globalThis, {
  W2,
  wall2BottomY,
  drawWall2,
  drawWall2Corner,
  wall2Corners,
  WALLS2,
  WALLS2_CORNER
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/walls.js", error: String((e && e.message) || e) }); }

// assets/_gen/wayside.js
try { (() => {
// Naevyr FRONTIER EXPANSION · WAYSIDE DECOR — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass from beasts.js).
//
// The connective-tissue props that fill the space between landmarks: rest stops and
// resource camps. Native-size cells, BOTTOM-CENTER anchored, 1px #0a0810 void outline,
// dither not blur, moonlit-left / shadowed-right, RAMP only.
//   Rest stops:  campfire(3f flame@4fps) · lean_to · bedroll · supply_crates · cook_pot
//   Logging:     log_pile · sawbuck · axe_stump
//   Quarry:      stone_cart · cut_blocks · pick_stump
//   Fishing:     pier(2f water-lap) · net_rack · fish_basket

/* ----------------------------- shared timber helpers ----------------------------- */
// a single timber log / pole drawn as a shaded column from (x,y0) down to (x,y1)
function pole(g, x, y0, y1, ramp, w) {
  w = w || 3;
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1];
    if (i === 0) c = ramp[0];
    if (i === w - 1) c = ramp[3];
    if (hash2(x + i, y, 311) < 0.10) c = ramp[2]; // bark grain
    P(g, x + i, y, c);
  }
}
// a board / beam along a vector (axx) — horizontal plank
function plankH(g, x0, x1, y, ramp, th) {
  th = th || 3;
  for (let x = x0; x <= x1; x++) for (let j = 0; j < th; j++) {
    let c = ramp[1];
    if (j === 0) c = ramp[0];
    if (j === th - 1) c = ramp[3];
    if (hash2(x, y + j, 312) < 0.10) c = ramp[2];
    P(g, x, y + j, c);
  }
}
// a plank-faced crate/box: front face (x..x+w, top..top+h), lit-left/dark-right, top cap, seams
function crate(g, x, top, w, h, ramp, bands) {
  // top cap (2px parallelogram)
  for (let i = 0; i < w; i++) {
    P(g, x + i, top - 1, ramp[0]);
  }
  for (let i = -1; i < w + 1; i++) P(g, x + i, top, ramp[2]);
  for (let y = top; y < top + h; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1];
    if (i < 2) c = ramp[0];
    if (i > w - 3) c = ramp[3];
    if (hash2(x + i, y, 313) < 0.08) c = ramp[2];
    P(g, x + i, y, c);
  }
  // vertical plank seams
  for (let i = 4; i < w; i += 5) for (let y = top; y < top + h; y++) P(g, x + i, y, ramp[3]);
  // horizontal rail seams
  plankSeam(g, x, x + w - 1, top + 2, ramp[3]);
  plankSeam(g, x, x + w - 1, top + h - 2, ramp[3]);
  if (bands) {
    // iron corner bands
    for (let y = top; y < top + h; y += h - 1) for (let i = 0; i < w; i++) if (i < 2 || i > w - 3) P(g, x + i, y, RAMP.stone[2]);
  }
}
function plankSeam(g, x0, x1, y, c) {
  for (let x = x0; x <= x1; x++) if (x % 2 === 0) P(g, x, y, c);
}

// animated flame (used by campfire + cook_pot): cx,baseY, height h, frame f (0..2)
function flame(g, cx, baseY, h, f) {
  const em = RAMP.ember,
    gd = RAMP.gold;
  const sway = [0, 1, -1][f],
    flick = [0, -1, 1][f];
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const w = Math.max(0, Math.round((1 - t) * 4) - (k > h - 3 ? 1 : 0));
    const xc = cx + Math.round(sway * t * 2);
    for (let i = -w; i <= w; i++) {
      let c = em[2];
      if (Math.abs(i) <= w - 1) c = em[1];
      if (Math.abs(i) <= 1 && k < h * 0.66) c = em[0]; // bright core
      if (Math.abs(i) === 0 && k < h * 0.4) c = gd[0]; // white-hot tip
      P(g, xc + i, baseY - k, c);
    }
  }
  // sparks rising
  P(g, cx + sway, baseY - h - 1 + flick, gd[0]);
  P(g, cx - 2 + flick, baseY - h + 1, em[0]);
  P(g, cx + 3 - flick, baseY - h, em[1]);
}

/* =============================== REST STOPS =============================== */

// campfire 64×64 — stone ring + crossed logs + 3-frame flame @4fps. (Tall cell for the
// flame/glow column; the fire itself sits low, bottom-center anchored.)
function drawCampfire(f) {
  f = f || 0;
  const g = makeGrid(64, 64);
  const st = RAMP.stone,
    dt = RAMP.dirt,
    em = RAMP.ember,
    bn = RAMP.bone;
  const cx = 32,
    baseY = 60;
  // scorched dirt patch
  ell(g, cx, baseY, 16, 6, (x, y, d) => {
    if (d > 0.85 && (x + y) % 2) return;
    P(g, x, y, d < 0.4 ? RAMP.void : hash2(x, y, 5) < 0.4 ? RAMP.ash : dt[3]);
  });
  // ring of stones
  for (let a = 0; a < 9; a++) {
    const ang = a / 9 * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * 14),
      sy = Math.round(baseY - 3 + Math.sin(ang) * 6);
    shadeMass(g, sx, sy, 3, 2.4, st, 30 + a);
  }
  // charred crossed logs
  for (let k = -7; k <= 7; k++) {
    P(g, cx + k, baseY - 4 + Math.round(k * 0.2), dt[3]);
    P(g, cx + k, baseY - 3 + Math.round(k * 0.2), RAMP.void);
  }
  for (let k = -7; k <= 7; k++) {
    P(g, cx + Math.round(k * 0.2), baseY - 4 - Math.round(k * 0.0) - Math.abs(k) * 0 + 0, dt[3]);
  }
  pole(g, cx - 8, baseY - 6, baseY - 4, dt, 4);
  pole(g, cx + 5, baseY - 6, baseY - 4, dt, 4);
  // embers under the fire
  for (let i = 0; i < 6; i++) {
    const ex = cx - 5 + i * 2,
      ey = baseY - 3;
    P(g, ex, ey, i % 2 ? em[1] : em[2]);
  }
  // the flame
  flame(g, cx, baseY - 4, 22, f);
  // warm ground glow (dither, pulses with frame)
  const rr = [12, 14, 13][f];
  for (let yy = -3; yy <= 4; yy++) for (let xx = -rr; xx <= rr; xx++) {
    if ((xx / rr) ** 2 + (yy / 5) ** 2 > 1) continue;
    if ((xx + yy + f) % 2 === 0 && Math.abs(xx) > 8 && hash2(xx, yy, 6) < 0.4) P(g, cx + xx, baseY - 1 + yy, em[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// lean_to 80×72 — A-frame pole shelter with a stretched hide/cloth roof + bedroll inside.
function drawLeanTo() {
  const g = makeGrid(80, 72);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    bl = RAMP.blood,
    st = RAMP.stone;
  const cx = 40,
    baseY = 68;
  // dirt pad
  ell(g, cx, baseY, 30, 7, (x, y, d) => {
    if (d > 0.9 && (x + y) % 2) return;
    P(g, x, y, d < 0.5 ? dt[2] : dt[3]);
  });
  // back frame: two tall rear poles + one ridge pole leaning forward
  pole(g, cx - 26, 22, baseY - 1, dt, 3); // rear-left upright
  pole(g, cx + 22, 24, baseY - 1, dt, 3); // rear-right upright
  // front (low) poles
  pole(g, cx - 14, 46, baseY - 1, dt, 3);
  pole(g, cx + 30, 48, baseY - 1, dt, 3);
  // ridge beam (high back -> low front)
  for (let x = cx - 26; x <= cx + 32; x++) {
    const y = 22 + Math.round((x - (cx - 26)) * 0.0);
    P(g, x, 22 + Math.round((x + 26 - cx) * 0.42), dt[2]);
  }
  // stretched roof hide — sloped panel from the ridge down to the front
  for (let x = cx - 28; x <= cx + 30; x++) {
    const topY = 20 + Math.round((x + 28 - cx) * 0.42);
    for (let k = 0; k < 22; k++) {
      const y = topY + k;
      if (y > baseY - 2) break;
      let c = bn[2]; // pale stretched hide
      if (k < 2) c = bn[1]; // sun-lit ridge
      else if (k > 17) c = bn[3]; // shaded lower hem
      else if (k > 13) c = dt[3]; // hide darkens to the edge
      if (k % 6 === 2 && x % 2 === 0) c = dt[3]; // horizontal stitch seams
      if (hash2(x, y, 41) < 0.04) c = bn[3]; // sparse wear
      P(g, x, y, c);
    }
  }
  // a painted blood-rune ward on the hide
  [[cx - 4, 30], [cx - 6, 32], [cx - 2, 32], [cx - 4, 34], [cx + 8, 38], [cx + 6, 40], [cx + 10, 40]].forEach(([rx, ry]) => P(g, rx, ry, bl[2]));
  // lashings where roof meets poles
  for (const px of [cx - 26, cx + 22]) for (let j = 0; j < 3; j++) P(g, px, 24 + j * 2, st[3]);
  // a bedroll tucked under the lean-to
  for (let x = cx - 14; x <= cx + 6; x++) {
    P(g, x, baseY - 4, dt[2]);
    P(g, x, baseY - 3, bl[2]);
    P(g, x, baseY - 2, dt[3]);
  }
  ell(g, cx - 16, baseY - 4, 3, 3, (x, y, d) => P(g, x, y, d < 0.5 ? bn[1] : bn[3])); // rolled end / pillow
  outline(g, RAMP.void);
  return g;
}

// bedroll 48×24 — rolled mat + blanket on the ground.
function drawBedroll() {
  const g = makeGrid(48, 24);
  const dt = RAMP.dirt,
    bl = RAMP.blood,
    bn = RAMP.bone;
  const cx = 24,
    baseY = 20;
  // the laid-out mat (long low mound)
  for (let x = 6; x <= 42; x++) {
    const t = (x - 6) / 36,
      h = Math.round(4 + Math.sin(t * Math.PI) * 2);
    for (let k = 0; k < h; k++) {
      let c = dt[1];
      if (k > h - 2) c = dt[0];
      if (x > 36) c = dt[2];
      P(g, x, baseY - k, c);
    }
  }
  // blanket folded over the top
  for (let x = 8; x <= 30; x++) {
    P(g, x, baseY - 5, bl[1]);
    P(g, x, baseY - 4, bl[2]);
    if (x % 4 === 0) P(g, x, baseY - 4, bl[0]);
  }
  // rolled pillow at one end
  ell(g, 40, baseY - 4, 4, 4, (x, y, d, dx, dy) => {
    let c = bn[2];
    if (dy < -0.2) c = bn[1];
    if (d > 0.7) c = bn[3];
    P(g, x, y, c);
  });
  outline(g, RAMP.void);
  return g;
}

// supply_crates 48×40 — stacked crates + a barrel + a sack.
function drawSupplyCrates() {
  const g = makeGrid(48, 40);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    st = RAMP.stone;
  const baseY = 38;
  // ground shadow
  ell(g, 24, baseY, 22, 5, (x, y, d) => {
    if (y < baseY - 1) return;
    if (d < 0.85) P(g, x, y, RAMP.void, 0.4);
  });
  crate(g, 4, baseY - 18, 18, 18, dt, true); // big crate left
  crate(g, 23, baseY - 14, 13, 14, dt, true); // small crate right
  crate(g, 9, baseY - 30, 14, 13, dt, false); // crate stacked on top
  // a barrel at far right
  for (let y = baseY - 16; y <= baseY - 1; y++) {
    const t = (y - (baseY - 16)) / 15,
      bulge = Math.round(Math.sin(t * Math.PI) * 1.5);
    for (let x = 37 - bulge; x <= 45 + bulge; x++) {
      let c = dt[1];
      if (x < 39) c = dt[0];
      if (x > 43) c = dt[3];
      P(g, x, y, c);
    }
  }
  for (const yb of [baseY - 13, baseY - 5]) for (let x = 36; x <= 46; x++) P(g, x, yb, st[2]); // barrel hoops
  ell(g, 41, baseY - 16, 5, 2, (x, y) => P(g, x, y, dt[3])); // barrel lid
  outline(g, RAMP.void);
  return g;
}

// cook_pot 32×32 — iron tripod pot over embers, with steam.
function drawCookPot() {
  const g = makeGrid(32, 32);
  const st = RAMP.stone,
    em = RAMP.ember,
    bn = RAMP.bone,
    dt = RAMP.dirt;
  const cx = 16,
    baseY = 29;
  // embers / small fire base
  ell(g, cx, baseY, 9, 3, (x, y, d) => {
    if (d < 0.7) P(g, x, y, hash2(x, y, 51) < 0.5 ? em[2] : RAMP.void);
  });
  for (let i = 0; i < 5; i++) P(g, cx - 4 + i * 2, baseY - 1, i % 2 ? em[0] : em[1]);
  // tripod legs
  P(g, cx - 9, baseY - 2, st[2]);
  for (let k = 0; k < 12; k++) P(g, cx - 8 + k, baseY - 3 - k, st[3]);
  for (let k = 0; k < 12; k++) P(g, cx + 8 - k, baseY - 3 - k, st[3]);
  for (let k = 0; k < 10; k++) P(g, cx, baseY - 3 - k, st[2]);
  // pot body (cast iron)
  ell(g, cx, baseY - 9, 7, 5, (x, y, d, dx, dy) => {
    let c = st[2];
    if (dx + dy < -0.4) c = st[1];
    if (d > 0.75) c = st[3];
    P(g, x, y, c);
  });
  for (let x = cx - 6; x <= cx + 6; x++) P(g, x, baseY - 13, st[3]); // rim
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, baseY - 14, st[1]); // lit rim lip
  // handle arc
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI * (k / 6);
    P(g, Math.round(cx - 6 + (1 - Math.cos(a)) * 6), Math.round(baseY - 14 - Math.sin(a) * 4), st[3]);
  }
  // bubbling stew + steam
  P(g, cx - 2, baseY - 13, bn[3]);
  P(g, cx + 2, baseY - 13, bn[2]);
  P(g, cx, baseY - 17, bn[3]);
  P(g, cx - 2, baseY - 20, bn[3]);
  P(g, cx + 2, baseY - 22, bn[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== LOGGING CAMP =============================== */

// log_pile 64×40 — stacked logs, ends facing the viewer (concentric rings).
function drawLogPile() {
  const g = makeGrid(64, 40);
  const dt = RAMP.dirt,
    bn = RAMP.bone;
  const baseY = 37;
  function logEnd(cx, cy, r) {
    ell(g, cx, cy, r, r, (x, y, d, dx, dy) => {
      let c = dt[1];
      if (dx + dy < -0.3) c = dt[0];
      if (d > 0.8) c = dt[3];
      P(g, x, y, c);
    });
    // growth rings + heartwood
    ell(g, cx, cy, r - 1.5, r - 1.5, (x, y, d) => {
      if (d > 0.7 && d < 0.85) P(g, x, y, dt[2]);
    });
    ell(g, cx, cy, r * 0.4, r * 0.4, (x, y, d) => P(g, x, y, bn[3]));
    P(g, cx, cy, dt[3]);
  }
  // bottom row of 4, supported by two bark logs lying sideways
  plankH(g, 4, 60, baseY - 1, dt, 3);
  const r = 6;
  [[12, baseY - 8], [25, baseY - 8], [38, baseY - 8], [51, baseY - 8]].forEach(([x, y]) => logEnd(x, y, r));
  // second row of 3 nested in the gaps
  [[18, baseY - 18], [31, baseY - 18], [44, baseY - 18]].forEach(([x, y]) => logEnd(x, y, r));
  // top row of 2
  [[25, baseY - 28], [38, baseY - 28]].forEach(([x, y]) => logEnd(x, y, r));
  // a couple of chocks / wedges keeping the stack
  P(g, 5, baseY - 4, dt[3]);
  P(g, 58, baseY - 4, dt[3]);
  outline(g, RAMP.void);
  return g;
}

// sawbuck 48×40 — X-frame sawhorse cradling a log, with a bucksaw leaning on it.
function drawSawbuck() {
  const g = makeGrid(48, 40);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    bn = RAMP.bone;
  const cx = 24,
    baseY = 37;
  // ground shadow
  ell(g, cx, baseY, 18, 4, (x, y, d) => {
    if (y < baseY - 1) return;
    if (d < 0.8) P(g, x, y, RAMP.void, 0.4);
  });
  // X legs (two crossed pairs)
  function xleg(ox) {
    for (let k = 0; k < 20; k++) {
      P(g, ox + 6 + Math.round(k * 0.5), baseY - 1 - k, dt[2]);
      P(g, ox + 16 - Math.round(k * 0.5), baseY - 1 - k, dt[3]);
    }
  }
  xleg(2);
  xleg(20);
  // cradled log resting in the X notches
  for (let y = baseY - 24; y <= baseY - 18; y++) for (let x = 8; x <= 42; x++) {
    let c = dt[1];
    if (y < baseY - 22) c = dt[0];
    if (y > baseY - 20) c = dt[3];
    if (hash2(x, y, 61) < 0.10) c = dt[2];
    P(g, x, y, c);
  }
  ell(g, 8, baseY - 21, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2])); // sawn end (left)
  ell(g, 42, baseY - 21, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2])); // sawn end (right)
  // a bucksaw leaning against the right leg (toothed steel blade + wood bow)
  for (let k = 0; k < 16; k++) {
    const x = 38 + Math.round(k * 0.3),
      y = baseY - 2 - k;
    P(g, x, y, st[0]);
    if (k % 2 === 0) P(g, x + 1, y, st[2]);
  }
  P(g, 38, baseY - 2, dt[3]);
  P(g, 43, baseY - 18, dt[3]); // saw handle / frame
  outline(g, RAMP.void);
  return g;
}

// axe_stump 32×40 — chopping block with an axe buried in it + split firewood.
function drawAxeStump() {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    bn = RAMP.bone;
  const cx = 16,
    baseY = 37;
  // split firewood billets stacked at the base
  [[2, baseY - 1, 6], [3, baseY - 3, 5], [23, baseY - 1, 7], [25, baseY - 3, 5]].forEach(([x, y, w]) => {
    for (let k = 0; k < w; k++) {
      let c = dt[1];
      if (k === 0) c = dt[0];
      if (k === w - 1) c = dt[3];
      P(g, x + k, y, c);
    }
    P(g, x, y, bn[3]); // pale split face
  });
  // the chopping block — a straight-sided round log section
  const sw = 8,
    topY = baseY - 15;
  for (let y = topY; y <= baseY - 1; y++) {
    for (let x = cx - sw; x <= cx + sw; x++) {
      let c = dt[2];
      if (x < cx - sw + 2) c = dt[1];
      if (x > cx + sw - 2) c = dt[3];
      if (x % 4 === 0 && hash2(x, y, 71) < 0.6) c = dt[3]; // vertical bark grooves
      P(g, x, y, c);
    }
  }
  // flat sawn top with end-grain rings (lighter heartwood)
  ell(g, cx, topY, sw, 3, (x, y, d) => {
    let c = dt[1];
    if (d > 0.66) c = dt[3];
    if (d < 0.3) c = bn[3];
    P(g, x, y, c);
  });
  for (const r of [3, 5.5]) ell(g, cx, topY, r, r * 0.36, (x, y, d) => {
    if (d > 0.74) P(g, x, y, dt[2]);
  });
  // the axe sunk into the block — long haft up-right, broad steel head
  for (let k = 0; k < 18; k++) {
    const x = cx + 2 + Math.round(k * 0.5),
      y = topY - 1 - k;
    P(g, x, y, dt[3]);
    P(g, x + 1, y, dt[2]);
  }
  // steel head (bit down-left into the wood)
  const hx = cx + 1,
    hy = topY - 1;
  for (let j = -3; j <= 3; j++) for (let i = -1; i <= 4; i++) {
    if (Math.abs(j) - i > 3) continue;
    let c = st[1];
    if (i < 1) c = st[0];
    if (j > 1) c = st[3];
    P(g, hx - i, hy + j, c);
  }
  P(g, hx - 4, hy - 2, st[0]);
  P(g, hx - 4, hy + 2, st[0]); // bit edge glint
  outline(g, RAMP.void);
  return g;
}

/* =============================== QUARRY CAMP =============================== */

// stone_cart 64×48 — wooden cart loaded with cut stone blocks, two wheels.
function drawStoneCart() {
  const g = makeGrid(64, 48);
  const dt = RAMP.dirt,
    st = RAMP.stone,
    bn = RAMP.bone;
  const cx = 32,
    baseY = 45;
  // ground shadow
  ell(g, cx, baseY, 28, 5, (x, y, d) => {
    if (y < baseY - 1) return;
    if (d < 0.85) P(g, x, y, RAMP.void, 0.4);
  });
  // two wheels
  function wheel(wx) {
    ell(g, wx, baseY - 6, 6, 6, (x, y, d) => {
      if (d > 0.78) P(g, x, y, dt[3]);else if (d > 0.6) P(g, x, y, dt[2]);
    });
    for (let a = 0; a < 6; a++) {
      const ang = a / 6 * Math.PI * 2;
      for (let k = 0; k < 5; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(baseY - 6 + Math.sin(ang) * k), dt[3]);
    } // spokes
    ell(g, wx, baseY - 6, 1.6, 1.6, (x, y) => P(g, x, y, st[2])); // hub
  }
  wheel(16);
  wheel(48);
  // cart bed (plank box, open top) tilted slightly
  for (let y = baseY - 20; y <= baseY - 10; y++) for (let x = 8; x <= 56; x++) {
    let c = dt[1];
    if (y < baseY - 18) c = dt[0];
    if (y > baseY - 12) c = dt[3];
    if ((x - 8) % 6 === 0) c = dt[3]; // plank seams
    P(g, x, y, c);
  }
  plankH(g, 6, 58, baseY - 21, dt, 2); // top rail
  // axle + shaft
  for (let x = 8; x <= 56; x++) P(g, x, baseY - 8, dt[3]);
  for (let k = 0; k < 8; k++) P(g, 56 + k, baseY - 14 + Math.round(k * 0.4), dt[2]); // pull shaft
  // load of cut stone blocks heaped above the bed
  [[16, baseY - 27, 12, 7], [30, baseY - 25, 11, 6], [42, baseY - 28, 10, 7], [24, baseY - 33, 10, 6]].forEach(([x, y, w, h], i) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1];
      if (xx < x + 2) c = st[0];
      if (xx > x + w - 3) c = st[3];
      if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 81 + i) < 0.07) c = st[2];
      P(g, xx, yy, c);
    }
    for (let xx = x; xx < x + w; xx++) P(g, xx, y - 1, st[0]); // lit top edge
    if (i % 2) for (let xx = x; xx < x + w; xx++) if (hash2(xx, y, 9) < 0.2) P(g, xx, y, bn[3]); // quartz fleck
  });
  outline(g, RAMP.void);
  return g;
}

// cut_blocks 56×32 — a neat stack of dressed stone blocks + chisel marks.
function drawCutBlocks() {
  const g = makeGrid(56, 32);
  const st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold;
  const baseY = 30;
  ell(g, 28, baseY, 26, 4, (x, y, d) => {
    if (y < baseY - 1) return;
    if (d < 0.85) P(g, x, y, RAMP.void, 0.4);
  });
  function block(x, y, w, h) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1];
      if (xx < x + 2) c = st[0];
      if (xx > x + w - 3) c = st[3];
      if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 85) < 0.06) c = st[2];
      P(g, xx, yy, c);
    }
    for (let xx = x; xx < x + w; xx++) P(g, xx, y - 1, st[0]); // lit top
    // chisel-dressed face marks
    for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (hash2(xx, yy, 86) < 0.5) P(g, xx, yy, st[2]);
  }
  // bottom row of 3, top row of 2 (offset)
  block(2, baseY - 11, 16, 11);
  block(19, baseY - 11, 16, 11);
  block(36, baseY - 11, 16, 11);
  block(10, baseY - 22, 16, 11);
  block(28, baseY - 22, 16, 11);
  // a few gold-vein flecks + a discarded chisel on top
  P(g, 18, baseY - 23, gd[1]);
  P(g, 35, baseY - 23, bn[3]);
  for (let k = 0; k < 6; k++) P(g, 14 + k, baseY - 24, RAMP.stone[3]); // chisel
  P(g, 14, baseY - 24, st[0]);
  outline(g, RAMP.void);
  return g;
}

// pick_stump 32×40 — a low stone anvil/block with a pickaxe driven in + rubble.
function drawPickStump() {
  const g = makeGrid(32, 40);
  const st = RAMP.stone,
    dt = RAMP.dirt,
    bn = RAMP.bone,
    gd = RAMP.gold;
  const cx = 16,
    baseY = 37;
  // rubble scatter
  for (let i = 0; i < 10; i++) {
    const x = 3 + Math.floor(hash2(i, 1, 91) * 26),
      y = baseY - Math.floor(hash2(i, 2, 91) * 3);
    P(g, x, y, hash2(i, 3, 91) < 0.5 ? st[2] : st[3]);
    if (hash2(i, 4, 91) < 0.15) P(g, x, y, gd[1]);
  }
  // squat stone block / anvil
  for (let y = baseY - 14; y <= baseY - 1; y++) {
    const w = 9;
    for (let x = cx - w; x <= cx + w; x++) {
      let c = st[1];
      if (x < cx - w + 2) c = st[0];
      if (x > cx + w - 2) c = st[3];
      if (y > baseY - 3) c = st[3];
      if (hash2(x, y, 92) < 0.08) c = st[2];
      P(g, x, y, c);
    }
  }
  // lit top + a gold vein running through it
  for (let x = cx - 9; x <= cx + 9; x++) P(g, x, baseY - 15, st[0]);
  for (let x = cx - 6; x <= cx + 4; x++) if (x % 2 === 0) P(g, x, baseY - 12 + Math.round(Math.sin(x)), gd[1]);
  // pickaxe driven into the block (haft up-left, double-pointed steel head)
  for (let k = 0; k < 17; k++) P(g, cx + 2 - Math.round(k * 0.45), baseY - 16 - k, dt[3]); // haft
  const hx = cx + 2,
    hy = baseY - 16;
  for (let k = -5; k <= 5; k++) {
    P(g, hx + k, hy - Math.round(Math.abs(k) * 0.5), st[1]);
    P(g, hx + k, hy + 1 - Math.round(Math.abs(k) * 0.5), st[3]);
  }
  P(g, hx - 5, hy - 3, st[0]);
  P(g, hx + 5, hy - 3, st[0]); // pick points
  outline(g, RAMP.void);
  return g;
}

/* =============================== FISHING CAMP =============================== */

// pier 96×48 — wooden dock running out over water on posts; 2-frame water lap.
function drawPier(f) {
  f = f || 0;
  const g = makeGrid(96, 48);
  const dt = RAMP.dirt,
    wt = RAMP.water,
    bn = RAMP.bone,
    st = RAMP.stone;
  const cx = 48,
    baseY = 45;
  // water under the pier (dithered, laps in 2 frames)
  for (let y = baseY - 6; y <= baseY; y++) for (let x = 4; x < 92; x++) {
    let c = (x + y) % 2 === 0 ? wt[1] : wt[2];
    if (y > baseY - 2) c = wt[3];
    P(g, x, y, c);
  }
  // support posts down into the water
  const posts = [14, 30, 46, 62, 78];
  posts.forEach((px, i) => {
    pole(g, px, baseY - 18, baseY - 1, dt, 3);
    // lapping foam ring at the waterline (drifts with frame)
    const ly = baseY - 4 + (i + f) % 2;
    P(g, px - 2, ly, wt[0]);
    P(g, px + 3, ly, wt[0]);
    if ((i + f) % 2 === 0) {
      P(g, px - 3, ly, bn[3]);
      P(g, px + 4, ly, bn[3]);
    }
  });
  // the plank deck (running left->right, slight iso tilt)
  for (let x = 6; x <= 90; x++) {
    const y = baseY - 20 - Math.round((x - 6) * 0.03);
    for (let j = 0; j < 4; j++) {
      let c = dt[1];
      if (j === 0) c = dt[0];
      if (j === 3) c = dt[3];
      P(g, x, y + j, c);
    }
    if (x % 7 === 0) for (let j = 0; j < 4; j++) P(g, x, y + j, dt[3]); // plank gaps
  }
  // deck edge rail posts + a mooring bollard at the end
  for (const px of [10, 88]) pole(g, px, baseY - 26, baseY - 22, dt, 2);
  ell(g, 88, baseY - 27, 3, 2, (x, y, d) => P(g, x, y, d < 0.5 ? dt[2] : dt[3]));
  // a coiled rope + a couple fish-crates on the deck
  ell(g, 20, baseY - 24, 4, 2, (x, y, d) => P(g, x, y, d < 0.4 ? bn[2] : bn[3]));
  crate(g, 60, baseY - 30, 11, 8, dt, false);
  outline(g, RAMP.void);
  return g;
}

// net_rack 48×56 — A-frame drying rack with a hanging fishing net + fish.
function drawNetRack() {
  const g = makeGrid(48, 56);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    wt = RAMP.water,
    st = RAMP.stone;
  const cx = 24,
    baseY = 53;
  ell(g, cx, baseY, 20, 4, (x, y, d) => {
    if (y < baseY - 1) return;
    if (d < 0.8) P(g, x, y, RAMP.void, 0.4);
  });
  // two A-frame legs + a top cross beam
  pole(g, 6, 14, baseY - 1, dt, 3);
  pole(g, 39, 14, baseY - 1, dt, 3);
  for (let x = 4; x <= 44; x++) P(g, x, 14 + Math.round(Math.abs(x - cx) * 0.0), dt[2]); // top beam
  plankH(g, 4, 44, 13, dt, 2);
  for (let k = 0; k < 6; k++) {
    P(g, 7 + k, 14 + k, dt[3]);
    P(g, 41 - k, 14 + k, dt[3]);
  } // leg braces
  // hanging net (diamond mesh, draped) — bone-coloured cord
  for (let y = 16; y <= 44; y++) for (let x = 8; x <= 40; x++) {
    const sag = Math.round(Math.sin((x - 8) / 32 * Math.PI) * 3);
    const yy = y + sag;
    if (yy > 46) continue;
    if ((x + yy) % 4 === 0 || (x - yy) % 4 === 0) P(g, x, yy, bn[3]);
  }
  // float-corks along the top of the net + weights at the bottom
  for (let x = 10; x <= 38; x += 6) P(g, x, 16, RAMP.ember[2]);
  for (let x = 10; x <= 38; x += 5) P(g, x, 44 + Math.round(Math.sin((x - 8) / 32 * Math.PI) * 3), st[3]);
  // a couple of caught fish hanging in the net
  [[18, 30], [28, 36]].forEach(([fx, fy]) => {
    ell(g, fx, fy, 3, 1.6, (x, y, d, dx) => {
      let c = st[0];
      if (dx > 0.2) c = wt[1];
      if (d > 0.7) c = st[3];
      P(g, x, y, c);
    });
    P(g, fx - 3, fy, wt[2]);
    P(g, fx + 3, fy, st[2]);
  });
  outline(g, RAMP.void);
  return g;
}

// fish_basket 32×28 — woven wicker basket brimming with fish.
function drawFishBasket() {
  const g = makeGrid(32, 28);
  const dt = RAMP.dirt,
    gd = RAMP.gold,
    wt = RAMP.water,
    st = RAMP.stone,
    bn = RAMP.bone;
  const cx = 16,
    baseY = 25;
  // woven basket body (tapered, horizontal weave bands)
  for (let y = baseY - 13; y <= baseY - 1; y++) {
    const t = (y - (baseY - 13)) / 12,
      w = Math.round(7 + t * 3);
    for (let x = cx - w; x <= cx + w; x++) {
      let c = gd[2];
      if (x < cx - w + 2) c = gd[1];
      if (x > cx + w - 2) c = gd[3];
      if ((x + y) % 2 === 0) c = gd[3]; // weave dither
      P(g, x, y, c);
    }
  }
  // rim
  for (let x = cx - 8; x <= cx + 8; x++) P(g, x, baseY - 13, gd[1]);
  for (let x = cx - 8; x <= cx + 8; x++) P(g, x, baseY - 14, gd[0]);
  // fish spilling out of the top (clear body + tail fin + eye)
  [[11, baseY - 16, -0.4], [20, baseY - 16, 0.4], [15, baseY - 19, -0.1]].forEach(([fx, fy, sl], i) => {
    const dirn = sl < 0 ? -1 : 1;
    // fish body
    ell(g, fx, fy, 4, 2.2, (x, y, d, dx, dy) => {
      let c = wt[1];
      if (dy < -0.2) c = st[0];
      if (d > 0.7) c = wt[2];
      P(g, x, y + Math.round((x - fx) * sl), c);
    });
    // tail fin (away from the basket center)
    const tx = fx + dirn * 5,
      ty = fy + Math.round(dirn * 5 * sl);
    for (let j = -2; j <= 2; j++) P(g, tx, ty + j, st[2]);
    P(g, tx + dirn, ty - 2, st[2]);
    P(g, tx + dirn, ty + 2, st[2]);
    // head + eye (toward center)
    const hx2 = fx - dirn * 4,
      hy2 = fy - Math.round(dirn * 4 * sl);
    P(g, hx2, hy2, st[0]);
    P(g, hx2 - dirn, hy2, RAMP.void);
    if (i === 2) {
      P(g, fx, fy - 2, bn[3]);
      P(g, fx - 1, fy, st[0]);
    } // top-fish scales glint
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const WAYSIDE = {
  // rest stops
  campfire: {
    fn: i => drawCampfire(i),
    cell: [64, 64],
    anchor: [32, 63],
    frames: 3,
    anim: {
      name: 'flame',
      fps: 4,
      loop: true
    },
    group: 'rest'
  },
  lean_to: {
    fn: () => drawLeanTo(),
    cell: [80, 72],
    anchor: [40, 71],
    group: 'rest',
    footprint: '2x2'
  },
  bedroll: {
    fn: () => drawBedroll(),
    cell: [48, 24],
    anchor: [24, 23],
    group: 'rest'
  },
  supply_crates: {
    fn: () => drawSupplyCrates(),
    cell: [48, 40],
    anchor: [24, 39],
    group: 'rest'
  },
  cook_pot: {
    fn: () => drawCookPot(),
    cell: [32, 32],
    anchor: [16, 31],
    group: 'rest'
  },
  // logging
  log_pile: {
    fn: () => drawLogPile(),
    cell: [64, 40],
    anchor: [32, 39],
    group: 'logging'
  },
  sawbuck: {
    fn: () => drawSawbuck(),
    cell: [48, 40],
    anchor: [24, 39],
    group: 'logging'
  },
  axe_stump: {
    fn: () => drawAxeStump(),
    cell: [32, 40],
    anchor: [16, 39],
    group: 'logging'
  },
  // quarry
  stone_cart: {
    fn: () => drawStoneCart(),
    cell: [64, 48],
    anchor: [32, 47],
    group: 'quarry'
  },
  cut_blocks: {
    fn: () => drawCutBlocks(),
    cell: [56, 32],
    anchor: [28, 31],
    group: 'quarry'
  },
  pick_stump: {
    fn: () => drawPickStump(),
    cell: [32, 40],
    anchor: [16, 39],
    group: 'quarry'
  },
  // fishing
  pier: {
    fn: i => drawPier(i),
    cell: [96, 48],
    anchor: [48, 47],
    frames: 2,
    anim: {
      name: 'water_lap',
      fps: 2,
      loop: true
    },
    group: 'fishing'
  },
  net_rack: {
    fn: () => drawNetRack(),
    cell: [48, 56],
    anchor: [24, 55],
    group: 'fishing'
  },
  fish_basket: {
    fn: () => drawFishBasket(),
    cell: [32, 28],
    anchor: [16, 27],
    group: 'fishing'
  }
};
Object.assign(globalThis, {
  pole,
  plankH,
  plankSeam,
  crate,
  flame,
  drawCampfire,
  drawLeanTo,
  drawBedroll,
  drawSupplyCrates,
  drawCookPot,
  drawLogPile,
  drawSawbuck,
  drawAxeStump,
  drawStoneCart,
  drawCutBlocks,
  drawPickStump,
  drawPier,
  drawNetRack,
  drawFishBasket,
  WAYSIDE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/wayside.js", error: String((e && e.message) || e) }); }

// assets/_gen/waystation.js
try { (() => {
// Naevyr FRONTIER EXPANSION · WAYSTATION — fast-travel monolith.
// Eval after pixlib.js + tiles.js + town.js (foundation) + threshold.js (tDisc/tRing/gateSigil).
// A rune-arch standing-stone GATEWAY — kin to the Ash Obelisk in silhouette weight
// (tapered weathered stone, drift-crystal crown, glowing runes) but a portal, not a spire.
// Sits on a DIRT apron (its ground pad must NOT rely on grass).
// 64×112, bottom-center anchor (32,111), top 6px reserved for the label.
// One sheet: frame 0 = SEALED (runes dormant, portal dark), frames 1-3 = ACTIVE
// rune-pulse @4fps (runes lit + portal glow swirl + rising light column).
// RAMP only, 1px void auto-outline, dither not blur, moonlit-left/shadowed-right.

function drawWaystation(active, frame) {
  frame = frame || 0;
  const g = makeGrid(64, 112);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone,
    gd = RAMP.gold;
  const cx = 32,
    baseY = 104;

  // ---- DIRT apron (packed earth + stone plinth + ash drifts) — no grass ----
  if (typeof foundation === 'function') foundation(g, cx, baseY + 2, 27, {
    ash: true
  });

  // ---- active ground glow on the apron (dithered drift, pulses) ----
  if (active) {
    const reach = [6, 8, 7][frame];
    for (let dy = -4; dy <= 6; dy++) for (let dx = -24; dx <= 24; dx++) {
      if ((dx / 24) ** 2 + (dy / 7) ** 2 > 1) continue;
      const d = Math.abs(dx) / 3 + Math.abs(dy);
      if ((dx + dy + frame) % 2 === 0 && d > 4 && d < reach + 14 && hash2(dx, dy, 501) < 0.4) P(g, cx + dx, baseY + 4 + dy, dr[3]);
    }
  }

  // ---- two leaning standing stones ----
  const postBot = baseY,
    postTop = 34;
  function stone(side) {
    // side: -1 left (moonlit), +1 right (shadow)
    for (let y = postBot; y >= postTop; y--) {
      const t = (postBot - y) / (postBot - postTop);
      const cxp = cx + side * (16 - Math.round(t * 4)); // lean inward at the top
      const hw = Math.round(6 - t * 1.2);
      for (let x = -hw; x <= hw; x++) {
        const sx = cxp + x;
        let c = side < 0 ? st[1] : st[2];
        if (x < -hw + 2) c = side < 0 ? st[0] : st[1]; // left face lighter
        else if (x > hw - 2) c = st[3]; // right face darker
        if (hash2(sx, y, 502) < 0.06) c = st[2]; // pitting
        if (hash2(sx, y, 503) < 0.02) c = st[3]; // cracks
        P(g, sx, y, c);
      }
    }
    // weathered chips knocked off the outer edge
    const rng = mulberry(504 + side);
    for (let i = 0; i < 5; i++) {
      const y = postTop + 6 + Math.floor(rng() * (postBot - postTop - 12));
      const t = (postBot - y) / (postBot - postTop);
      const cxp = cx + side * (16 - Math.round(t * 4));
      const hw = Math.round(6 - t * 1.2);
      P(g, cxp + side * hw, y, RAMP.void);
      P(g, cxp + side * (hw - 1), y, st[3]);
    }
  }
  stone(-1);
  stone(1);

  // ---- the arch (semicircle band spanning the post tops) ----
  const archCx = cx,
    archCy = postTop + 4,
    archR = 21,
    band = 8;
  if (typeof tDisc === 'function') {
    tDisc(g, archCx, archCy, archR, (x, y, d) => {
      if (y > archCy) return;
      if (d > archR || d < archR - band) return;
      let c = x < archCx ? st[1] : st[2];
      const edge = d > archR - 1.4 || d < archR - band + 1.4;
      if (edge) c = st[3];else if (hash2(x, y, 505) < 0.07) c = st[2];
      if (x < archCx - archR + 4) c = st[0];
      P(g, x, y, c);
    });
    // arch iso depth (shadow recede up-right)
    for (let dd = 1; dd <= 4; dd++) tDisc(g, archCx, archCy, archR, (x, y, d) => {
      if (y > archCy) return;
      if (d > archR || d < archR - band) return;
      if (x < archCx + 6) return;
      P(g, x + dd, y - Math.floor(dd / 2), st[3]);
    });
  }

  // ---- keystone block at the crown, carrying the gate sigil ----
  const ksY = archCy - archR - 1;
  for (let j = 0; j < 12; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 2 && t > 0.6) continue; // chamfered top corners
    let c = i < 0 ? st[1] : st[2];
    if (i < -5) c = st[0];
    if (i > 5) c = st[3];
    if (j === 0) c = st[0];
    if (hash2(cx + i, ksY + j, 506) < 0.08) c = st[2];
    P(g, cx + i, ksY + j, c);
  }
  if (typeof gateSigil === 'function') gateSigil(g, cx, ksY + 6, 5, active);

  // ---- drift-crystal shard crown above the keystone (Ash-Obelisk kinship) ----
  const cty = ksY - 1;
  for (let k = 0; k < 9; k++) {
    const w = Math.max(0, Math.round((1 - k / 9) * 3));
    for (let i = -w; i <= w; i++) {
      let c = dr[2];
      if (i < 0) c = dr[1];
      if (i > 0) c = dr[3];
      if (i === 0 && k < 6) c = dr[0];
      P(g, cx + i, cty - k, c);
    }
  }
  P(g, cx, cty - 9, dr[0]);
  // crown halo (dither, brightens when active)
  if (active) {
    const rr = [6, 8, 7][frame];
    for (let yy = -8; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < rr && (xx + yy + frame) % 2 === 0) P(g, cx + xx, cty - 4 + yy, dr[2]);
    }
  }

  // ---- the portal opening (between posts, under the arch) ----
  const pl = cx - 9,
    pr = cx + 9,
    ptop = archCy,
    pbot = baseY - 2;
  for (let y = ptop; y <= pbot; y++) for (let x = pl; x <= pr; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - band) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (active) {
      const t = (y - ptop) / (pbot - ptop);
      let c = dr[4] || dr[3];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : dr[4] || dr[3];
      if (Math.abs(x - cx) < 6 && hash2(x, y + frame, 507) < 0.20) c = dr[2]; // shifting glow
      if (Math.abs(x - cx) < 3 && hash2(x, y - frame * 2, 508) < 0.14) c = dr[1]; // bright core
      P(g, x, y, c);
    } else {
      // sealed: dark void with a single dormant vertical drift seam
      let c = RAMP.void;
      if (x === cx && y % 3 !== 0) c = dr[3];
      if (x === cx && y % 6 === 0) c = dr[2];
      P(g, x, y, c);
    }
  }

  // ---- carved runes down the inner faces of the posts (pulse when active) ----
  const lit = active ? [dr[2], dr[1], dr[0]][frame] : dr[3];
  const dim = active ? [dr[3], dr[2], dr[1]][frame] : '#3b1162';
  const runeYs = [pbot - 12, pbot - 28, pbot - 44, pbot - 58];
  runeYs.forEach((ry, i) => {
    if (ry < ptop + 2) return;
    [[pl - 1, 1], [pr + 1, -1]].forEach(([rx, dir]) => {
      const on = active ? (frame + i) % 3 !== 2 : false;
      const col = on ? lit : dim;
      P(g, rx, ry, col);
      P(g, rx + dir, ry, col);
      P(g, rx, ry + 1, col);
      P(g, rx, ry - 1, on ? dim : '#3b1162');
    });
  });

  // ---- active: rising column of dithered drift light up the gateway ----
  if (active) {
    const H = [16, 26, 12][frame];
    for (let k = 0; k < H; k++) {
      const y = pbot - 6 - k,
        t = k / H;
      const w = Math.max(1, Math.round((1 - t) * 4));
      for (let x = -w; x <= w; x++) {
        const ax = cx + x,
          core = Math.abs(x) <= 1;
        if (y < ptop - 10) continue;
        if (core) {
          if (G(g, ax, y) || y < ptop) P(g, ax, y, t < 0.3 ? dr[0] : dr[1]);
        } else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 509) < (1 - t) * 0.8) P(g, ax, y, dr[2]);
      }
    }
    // escaping motes
    const mr = mulberry(510 + frame);
    for (let i = 0; i < 5; i++) {
      const mx = cx + Math.round((mr() - 0.5) * 16);
      const my = ptop + Math.round(mr() * (pbot - ptop)) - frame * 2;
      if (my > ptop - 12) P(g, mx, my, mr() < 0.4 ? dr[0] : dr[1]);
    }
    // glow spill at the threshold
    for (let x = pl; x <= pr; x++) if ((x + frame) % 3 === 0) P(g, x, pbot + 1, dr[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// 16×16 fast-travel map / minimap pip — matches the nav-icon / arrow-pip style.
// 2 frames: the gateway drift-mote pulses (dim → bright + halo).
function drawWaystationPip(frame) {
  frame = frame || 0;
  const g = makeGrid(16, 16);
  const st = RAMP.stone,
    dr = RAMP.drift,
    dt = RAMP.dirt;
  const cx = 8;
  // two short standing posts
  for (let y = 6; y <= 13; y++) {
    P(g, 4, y, st[0]);
    P(g, 5, y, st[1]);
    P(g, 10, y, st[2]);
    P(g, 11, y, st[3]);
  }
  // arched lintel across the top
  for (let x = 4; x <= 11; x++) P(g, x, 5, x < 8 ? st[1] : st[2]);
  P(g, 5, 4, st[1]);
  P(g, 6, 4, st[0]);
  P(g, 9, 4, st[2]);
  P(g, 10, 4, st[3]);
  P(g, 7, 3, st[1]);
  P(g, 8, 3, st[2]); // crown notch
  // dirt apron line
  for (let x = 3; x <= 12; x++) P(g, x, 14, dt[3]);
  P(g, 4, 13, dt[2]);
  P(g, 11, 13, dt[2]);
  // gateway drift mote (pulses by frame)
  const bright = frame === 1;
  const mx = 8,
    my = 10;
  P(g, mx, my, bright ? dr[0] : dr[2]);
  P(g, mx - 1, my, bright ? dr[1] : dr[3]);
  P(g, mx, my - 1, bright ? dr[1] : dr[3]);
  P(g, mx, my + 1, dr[2]);
  if (bright) {
    P(g, mx + 1, my, dr[1]);
    P(g, mx - 1, my - 1, dr[2]);
    P(g, mx + 1, my - 1, dr[2]);
    P(g, mx, my - 2, dr[2]);
    P(g, mx - 2, my, dr[3]);
    P(g, mx + 2, my, dr[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const WAYSTATION = {
  waystation: {
    fn: i => i === 0 ? drawWaystation(false, 0) : drawWaystation(true, i - 1),
    cell: [64, 112],
    anchor: [32, 111],
    frames: 4,
    footprint: '3x3',
    tile: true,
    labelClear: true,
    states: {
      sealed: {
        frames: [0],
        fps: 1,
        loop: false
      },
      active: {
        frames: [1, 2, 3],
        fps: 4,
        loop: true
      }
    },
    anim: {
      name: 'rune_pulse',
      fps: 4,
      frames: [1, 2, 3]
    }
  },
  waystation_pip: {
    fn: i => drawWaystationPip(i),
    cell: [16, 16],
    anchor: [8, 8],
    frames: 2,
    anim: {
      name: 'pulse',
      fps: 2
    }
  }
};
Object.assign(globalThis, {
  drawWaystation,
  drawWaystationPip,
  WAYSTATION
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/waystation.js", error: String((e && e.message) || e) }); }

// assets/_gen/wheelfaces.js
try { (() => {
// NAEVYR — WHEEL FACES (HUD overlay art, DOM-rendered). Eval after pixlib.js +
// tiles.js. Two circular spin-wheel faces, 240×240, 2-frame idle rim shimmer
// (~2fps). Segment order is EXACT (the HUD lands a pointer on a named segment);
// each segment's start angle (degrees, 0 = up/12 o'clock, clockwise) is emitted
// in the JSON. Rect-grid, RAMP only, dither not blur, 1px void on the rim/pointer.

const WHEEL_N = 240,
  WCX = 120,
  WCY = 124; // hub sits a touch low (pointer cap up top)

// pixel disc fill with a per-pixel callback (angle in deg from up, clockwise; radius)
function wheelDisc(g, r0, r1, fn) {
  for (let y = WCY - r1 - 2; y <= WCY + r1 + 2; y++) {
    for (let x = WCX - r1 - 2; x <= WCX + r1 + 2; x++) {
      const dx = x - WCX,
        dy = y - WCY,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < r0 || d > r1) continue;
      let ang = Math.atan2(dx, -dy) * 180 / Math.PI; // 0 up, clockwise
      if (ang < 0) ang += 360;
      fn(x, y, d, ang);
    }
  }
}
function wheelRing(g, r, w, c) {
  wheelDisc(g, r - w, r, (x, y) => P(g, x, y, c));
}

// shared rim + pointer cap + hub; segDef = [{label, sweep, paint(localT, d, ang)}]
function buildWheel(frame, segs, opt) {
  opt = opt || {};
  const g = makeGrid(WHEEL_N, WHEEL_N);
  const st = RAMP.stone,
    dr = RAMP.drift,
    gd = RAMP.gold;
  const Rseg = 96,
    Rrim = 110;

  // total sweep -> start angles
  let acc = 0;
  const bounds = [];
  segs.forEach(s => {
    bounds.push([acc, acc + s.sweep, s]);
    acc += s.sweep;
  });

  // --- segments ---
  wheelDisc(g, 0, Rseg, (x, y, d, ang) => {
    const seg = bounds.find(b => ang >= b[0] && ang < b[1]) || bounds[bounds.length - 1];
    const localT = (ang - seg[0]) / seg[2].sweep; // 0..1 across the wedge
    const c = seg[2].paint(localT, d / Rseg, ang, x, y);
    if (c) P(g, x, y, c);
    // wedge divider lines (dark spokes)
    for (const b of bounds) {
      const a0 = b[0];
      const da = (ang - a0 + 540) % 360 - 180;
      if (Math.abs(da) < 0.8 && d > 8) P(g, x, y, st[3]);
    }
  });

  // --- ornate stone rim ---
  wheelDisc(g, Rseg, Rrim, (x, y, d, ang) => {
    const lit = Math.cos((ang - 315) * Math.PI / 180) > 0; // top-left lit
    let c = lit ? st[1] : st[3];
    if (d > Rrim - 2) c = RAMP.void; // 1px void outer
    else if (d < Rseg + 2) c = st[3]; // inner lip
    else if (lit && d < Rseg + 5) c = st[0];
    // studs every 30deg
    if (Math.abs((ang % 30 + 30) % 30 - 15) < 1.2 && d > Rseg + 3 && d < Rrim - 3) c = frame ? gd[0] : gd[1];
    P(g, x, y, c);
  });
  // rim shimmer glint (frame-dependent position)
  const glintAng = frame ? 48 : 312;
  wheelDisc(g, Rseg + 2, Rrim - 2, (x, y, d, ang) => {
    const da = (ang - glintAng + 540) % 360 - 180;
    if (Math.abs(da) < 7) P(g, x, y, opt.corrupt ? dr[1] : gd[0]);
  });
  if (opt.corrupt) {
    // drift motes bleeding off the corrupted rim
    const mr = mulberry(frame + 1);
    for (let i = 0; i < 26; i++) {
      const a = mr() * 360 * Math.PI / 180;
      const rr = Rrim + mr() * 12;
      const x = Math.round(WCX + Math.sin(a) * rr),
        y = Math.round(WCY - Math.cos(a) * rr);
      P(g, x, y, mr() < 0.4 ? dr[0] : dr[2]);
      if (mr() < 0.3) P(g, x, y + 1, dr[3]);
    }
  }

  // --- hub ---
  wheelDisc(g, 0, 12, (x, y, d) => {
    let c = dr[3];
    if (d < 9) c = dr[2];
    if (d < 5) c = dr[1];
    if (d < 2) c = dr[0];
    P(g, x, y, c);
  });
  wheelRing(g, 12, 1, RAMP.void);
  wheelRing(g, 13, 1, gd[2]);

  // --- pointer cap at top (gold, void-outlined), overhangs the rim ---
  const py = WCY - Rrim - 2;
  for (let j = 0; j < 16; j++) {
    const w = Math.max(0, 7 - Math.floor(j / 1.4));
    for (let x = -w; x <= w; x++) {
      let c = gd[1];
      if (x < -w + 1) c = gd[0];
      if (x > w - 1) c = gd[3];
      P(g, WCX + x, py + j, c);
    }
  }
  for (let x = -6; x <= 6; x++) P(g, WCX + x, py - 1, gd[2]);
  fillRect(g, WCX - 3, py + 2, 3, 3, gd[0]); // jewel highlight
  // outline the pointer
  solidOutlineRegion(g, WCX - 9, py - 2, 18, 20);
  return {
    g,
    bounds
  };
}
// outline only solid (non-empty) pixels within a sub-rect (keeps motes glow clean)
function solidOutlineRegion(g, x0, y0, w, h) {
  const add = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach(p => P(g, p[0], p[1], RAMP.void));
}

/* ---- 1 · WHEEL OF THE DRIFT (gold wheel, 6 segments) ----
   order: house(void 40%/~144deg), coin-poor, coin-rich, jackpot(full gold),
   drift-shard(violet), coin-mid. */
function goldWheelSegs() {
  const st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const coin = rich => (t, d, ang, x, y) => {
    const base = rich ? gd[1] : gd[3];
    let c = (x + y) % 2 === 0 ? base : rich ? gd[2] : RAMP.dirt[2];
    // a struck coin emblem mid-wedge
    if (d > 0.4 && d < 0.72 && Math.abs(t - 0.5) < 0.16) c = rich ? gd[0] : gd[1];
    if (d >= 0.72 && d < 0.78 && Math.abs(t - 0.5) < 0.2) c = gd[3];
    return c;
  };
  return [{
    label: 'house',
    sweep: 144,
    paint: (t, d, ang, x, y) => (x + y) % 2 === 0 ? RAMP.void : st[3]
  },
  // dull void, the 40%
  {
    label: 'coin_poor',
    sweep: 43,
    paint: coin(false)
  }, {
    label: 'coin_rich',
    sweep: 43,
    paint: coin(true)
  }, {
    label: 'jackpot',
    sweep: 43,
    paint: (t, d, ang, x, y) => {
      let c = (x + y) % 2 === 0 ? gd[0] : gd[1];
      if (d > 0.55 && Math.abs(t - 0.5) < 0.22) c = RAMP.bone[0];
      return c;
    }
  }, {
    label: 'drift_shard',
    sweep: 43,
    paint: (t, d, ang, x, y) => {
      let c = (x + y) % 2 === 0 ? dr[2] : dr[3];
      if (d > 0.4 && d < 0.74 && Math.abs(t - 0.5) < 0.12) c = d < 0.57 ? dr[0] : dr[1];
      return c;
    }
  }, {
    label: 'coin_mid',
    sweep: 44,
    paint: coin(false)
  }];
}

/* ---- 2 · THE DRIFT WHEEL (dark gacha, 8 segments) ----
   mostly deep stone/drift; one searing gold-violet "relic" (the 1%, tiny sweep). */
function darkWheelSegs() {
  const st = RAMP.stone,
    dr = RAMP.drift,
    gd = RAMP.gold;
  const dim = violet => (t, d, ang, x, y) => {
    const base = violet ? dr[4] : RAMP.rock ? RAMP.rock : st[3];
    let c = (x + y) % 2 === 0 ? violet ? dr[3] : st[2] : violet ? RAMP.void : st[3];
    if (d > 0.5 && d < 0.7 && Math.abs(t - 0.5) < 0.1) c = violet ? dr[2] : st[1]; // faint rune
    return c;
  };
  const big = 51,
    relic = 9; // 7*51 + 9 = 366 -> normalize by trimming one to 45
  return [{
    label: 'common_a',
    sweep: 51,
    paint: dim(false)
  }, {
    label: 'drift_a',
    sweep: 51,
    paint: dim(true)
  }, {
    label: 'common_b',
    sweep: 51,
    paint: dim(false)
  }, {
    label: 'drift_b',
    sweep: 51,
    paint: dim(true)
  }, {
    label: 'relic',
    sweep: relic,
    paint: (t, d, ang, x, y) => {
      let c = (x + y) % 2 === 0 ? gd[0] : dr[1];
      if (d < 0.5) c = RAMP.bone[0];
      if (d > 0.78) c = gd[2];
      return c;
    }
  }, {
    label: 'common_c',
    sweep: 45,
    paint: dim(false)
  }, {
    label: 'drift_c',
    sweep: 51,
    paint: dim(true)
  }, {
    label: 'common_d',
    sweep: 51,
    paint: dim(false)
  }];
}
function drawGoldWheel(frame) {
  return buildWheel(frame, goldWheelSegs(), {
    corrupt: false
  });
}
function drawDarkWheel(frame) {
  return buildWheel(frame, darkWheelSegs(), {
    corrupt: true
  });
}
const WHEELS = {
  wheel_of_the_drift: {
    fn: drawGoldWheel,
    frames: 2,
    fps: 2,
    ramp: 'gold + stone + drift',
    segsFn: goldWheelSegs
  },
  the_drift_wheel: {
    fn: drawDarkWheel,
    frames: 2,
    fps: 2,
    ramp: 'stone + drift + gold (relic)',
    segsFn: darkWheelSegs
  }
};
Object.assign(globalThis, {
  WHEEL_N,
  WCX,
  WCY,
  wheelDisc,
  wheelRing,
  buildWheel,
  solidOutlineRegion,
  goldWheelSegs,
  darkWheelSegs,
  drawGoldWheel,
  drawDarkWheel,
  WHEELS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/wheelfaces.js", error: String((e && e.message) || e) }); }

// assets/_gen/wilds.js
try { (() => {
// Naevyr THE WILDS PACK — eval after pixlib.js + tiles.js (+ town.js for
// foundation, interiors.js for wallSegment). Rect-grid, RAMP only, 1px void
// auto-outline, dither not blur, deterministic. Moonlit-left/shadowed-right.
// Top 6px of every cell kept clear for labels.

// branching drift vein walk across a mass
function driftVeins(g, x0, y0, count, len, seed) {
  const dr = RAMP.drift,
    rng = mulberry(seed);
  for (let v = 0; v < count; v++) {
    let x = x0 + Math.floor((rng() - 0.5) * 40),
      y = y0 + Math.floor((rng() - 0.5) * 24);
    let dx = rng() < 0.5 ? 1 : -1,
      dy = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < len; k++) {
      if (G(g, x, y)) {
        P(g, x, y, k % 7 === 0 ? dr[1] : dr[2]);
        if (rng() < 0.4) P(g, x, y + 1, dr[3]);
        if (k % 9 === 0) P(g, x, y - 1, dr[0]); // glowing node
      }
      x += dx * (rng() < 0.6 ? 1 : 0);
      y += dy * (rng() < 0.5 ? 1 : 0);
      if (rng() < 0.15) dx = -dx;
      if (rng() < 0.12) dy = -dy;
    }
  }
}
function boneSpikeShape(g, bx, by, h, lean) {
  const bn = RAMP.bone;
  for (let k = 0; k < h; k++) {
    const t = k / h,
      w = Math.max(0, Math.round((1 - t) * 2));
    const sx = bx + Math.round(lean * t * 3);
    for (let i = -w; i <= w; i++) P(g, sx + i, by - k, i < 0 ? bn[0] : i > 0 ? bn[2] : bn[1]);
  }
  P(g, bx, by - h, bn[0]);
}

/* ============================ 1 · HUSK DEN (120×88, 2 frames) ============================ */
function drawHuskDen(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 88);
  const cx = 60,
    baseY = 78;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 4, 50, {
    ash: true
  });
  // low corrupted burrow-mound
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(52 * Math.pow(1 - Math.pow(t, 2.6), 0.5));
    hw += Math.round((hash2(yy, 0, 101) - 0.5) * 6);
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 102);
      let c = RAMP.stone[1];
      if (xx < -hw + 5) c = RAMP.stone[0];else if (xx > hw - 5) c = RAMP.stone[3];else if (h < 0.10) c = RAMP.stone[2];else if (h < 0.13) c = RAMP.stone[0];
      P(g, cx + xx, top, c);
    }
  }
  // drift-purple veining
  driftVeins(g, cx, baseY - 26, 5, 60, 103);
  // dark arched burrow mouth (south)
  const mw = 22,
    mh = 26;
  for (let j = 0; j < mh; j++) for (let i = -mw / 2; i <= mw / 2; i++) {
    const t = Math.abs(i) / (mw / 2);
    if (j < mh * 0.5 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  // faint drift-glow eyes inside
  const bright = frame === 1;
  const ey = baseY - 14;
  [[-5, bright ? RAMP.drift[0] : RAMP.drift[2]], [5, bright ? RAMP.drift[1] : RAMP.drift[3]]].forEach(([ox, c]) => {
    P(g, cx + ox, ey, c);
    P(g, cx + ox + 1, ey, c);
    P(g, cx + ox, ey + 1, bright ? RAMP.drift[2] : RAMP.drift[3]);
    if (bright) {
      P(g, cx + ox, ey - 1, RAMP.drift[2]);
      P(g, cx + ox + 2, ey, RAMP.drift[3]);
      P(g, cx + ox - 1, ey, RAMP.drift[3]);
    }
  });
  // ringed bone spikes jutting out
  [[-44, 6, -0.6], [-30, 9, -0.3], [34, 9, 0.3], [46, 6, 0.6], [-16, 5, -0.2], [20, 6, 0.2]].forEach(([ox, h, ln]) => {
    const bx = cx + ox,
      by = baseY - Math.max(0, Math.round(46 * Math.pow(1 - Math.pow(Math.min(0.99, Math.abs(ox) / 52), 2.6), 0.5)) * 0.2) + 2;
    boneSpikeShape(g, bx, baseY + 1, h + 6, ln);
  });
  // scattered ribs at the base
  const rng = mulberry(104);
  for (let i = 0; i < 5; i++) {
    const rx = cx - 40 + Math.floor(rng() * 80),
      ry = baseY + 2 + Math.floor(rng() * 4);
    for (let k = 0; k < 5; k++) P(g, rx + k, ry - Math.round(Math.sin(k / 5 * Math.PI) * 2), RAMP.bone[2]);
    P(g, rx, ry, RAMP.bone[1]);
    P(g, rx + 5, ry, RAMP.bone[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · ASH OBELISK (64×112, 3 frames) ============================ */
function drawAshObelisk(frame) {
  frame = frame || 0;
  const g = makeGrid(64, 112);
  const cx = 32,
    baseY = 104;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 2, 30, {
    ash: true
  });
  // tapered monolith
  const topY = 14;
  for (let y = baseY; y >= topY; y--) {
    const t = (baseY - y) / (baseY - topY);
    const hw = Math.round(13 - t * 5);
    const skew = Math.round(t * 2); // slight lean
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + skew;
      let c = RAMP.stone[1];
      if (x < -hw + 2) c = RAMP.stone[0];else if (x > hw - 2) c = RAMP.stone[3];
      if (hash2(sx, y, 111) < 0.06) c = RAMP.stone[2];
      if (hash2(sx, y, 112) < 0.02) c = RAMP.stone[3]; // cracks
      P(g, sx, y, c);
    }
  }
  // weathered chips off the edges
  const rng = mulberry(113);
  for (let i = 0; i < 8; i++) {
    const y = topY + 6 + Math.floor(rng() * (baseY - topY - 12));
    const side = rng() < 0.5 ? -1 : 1;
    const t = (baseY - y) / (baseY - topY);
    const hw = Math.round(13 - t * 5);
    P(g, cx + side * hw + Math.round(t * 2), y, RAMP.void);
    P(g, cx + side * (hw - 1) + Math.round(t * 2), y, RAMP.stone[3]);
  }
  // glowing drift runes down the south face (pulse by frame)
  const lit = [RAMP.drift[2], RAMP.drift[1], RAMP.drift[0]][frame];
  const dim = [RAMP.drift[3], RAMP.drift[2], RAMP.drift[1]][frame];
  const runes = [[0, 30], [-1, 44], [1, 58], [0, 72], [-1, 86]];
  runes.forEach(([ox, ry], i) => {
    const t = (baseY - (baseY - ry)) / (baseY - topY);
    const skew = Math.round(ry / (baseY - topY) * 0);
    const rx = cx + ox;
    const yy = baseY - ry;
    // a small angular rune glyph
    const on = (frame + i) % 3 !== 2;
    const col = on ? lit : dim;
    P(g, rx, yy, col);
    P(g, rx - 1, yy + 1, col);
    P(g, rx + 1, yy + 1, col);
    P(g, rx, yy + 2, col);
    P(g, rx - 1, yy - 1, on ? dim : RAMP.drift[3]);
    P(g, rx + 1, yy - 1, on ? dim : RAMP.drift[3]);
  });
  // drift-crystal shard crown
  const cty = topY - 1;
  for (let k = 0; k < 12; k++) {
    const w = Math.max(0, Math.round((1 - k / 12) * 4));
    for (let i = -w; i <= w; i++) {
      let c = RAMP.drift[2];
      if (i < 0) c = RAMP.drift[1];
      if (i > 0) c = RAMP.drift[3];
      if (i === 0 && k < 8) c = RAMP.drift[0];
      P(g, cx + i, cty - k, c);
    }
  }
  P(g, cx, cty - 12, RAMP.drift[0]);
  // crown glow halo (dither, pulses)
  if (frame >= 1) for (let yy = -10; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 5 && d < (frame === 2 ? 9 : 7) && (xx + yy) % 2 === 0) P(g, cx + xx, cty - 6 + yy, RAMP.drift[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · MIREWIFE HUT (120×116) ============================ */
function drawMirewifeHut() {
  const g = makeGrid(120, 116);
  const cx = 58,
    baseY = 108;
  // boggy ground (water + dirt iso patch)
  for (let yy = -16; yy <= 16; yy++) for (let xx = -54; xx <= 54; xx++) {
    if ((xx / 54) ** 2 + (yy / 16) ** 2 > 1) continue;
    const h = hash2(cx + xx, baseY + yy, 121);
    let c = RAMP.dirt[2];
    if (h < 0.3) c = RAMP.water[2];else if (h < 0.36) c = RAMP.water[1];
    if (h > 0.93) c = RAMP.grass[2];
    P(g, cx + xx, baseY + yy, c);
  }
  // reed tufts in the bog
  for (let i = 0; i < 8; i++) {
    const rx = cx - 46 + Math.floor(hash2(i, 1, 122) * 92),
      ry = baseY + Math.floor((hash2(i, 2, 122) - 0.5) * 22);
    for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]);
    P(g, rx, ry - 4, RAMP.bone[2]);
  }
  const lean = -1; // crooked
  // stilts lifting the hut
  const liftTop = baseY - 26;
  [-26, -10, 10, 26].forEach((ox, i) => {
    const sx = cx + ox;
    const ly = baseY + (i % 2 ? 4 : 2);
    for (let y = liftTop; y <= ly; y++) {
      const skew = Math.round((y - liftTop) * 0.0);
      P(g, sx + skew, y, RAMP.dirt[2]);
      P(g, sx + 1 + skew, y, RAMP.dirt[3]);
    }
    // cross-brace
    P(g, sx, liftTop + 8, RAMP.dirt[3]);
  });
  // hut body (leaning)
  const fw = 60,
    fh = 38,
    x0 = cx - fw / 2,
    ytop = liftTop - fh,
    ybot = liftTop;
  for (let y = ytop; y <= ybot; y++) {
    const sk = Math.round((ybot - y) / fh * lean * 4);
    for (let x = x0; x <= x0 + fw; x++) {
      let c = RAMP.dirt[1];
      if (x <= x0 + 2) c = RAMP.dirt[0];else if (x >= x0 + fw - 2) c = RAMP.dirt[2];
      if ((y - ytop) % 4 === 0) c = RAMP.dirt[3]; // plank seams
      if (hash2(x, y, 123) < 0.05) c = RAMP.dirt[2];
      P(g, x + sk, y, c);
    }
  }
  // right side wall (shadow), receding
  for (let d = 1; d <= 22; d++) for (let y = ytop; y <= ybot; y++) P(g, x0 + fw + d, y - Math.floor(d / 2), d >= 21 ? RAMP.dirt[3] : RAMP.dirt[2]);
  // mossy reed-thatch roof (gable, overhang)
  const ov = 6,
    roofH = 22,
    gx0 = x0 - ov,
    gx1 = x0 + fw + ov,
    rcx = (gx0 + gx1) / 2;
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH,
      hw = (gx1 - gx0) / 2 * t;
    const yy = ytop - roofH + y + Math.round((ybot - (ytop - roofH + y)) / fh * lean * 2);
    for (let x = Math.round(rcx - hw); x <= Math.round(rcx + hw); x++) {
      let c = RAMP.grass[2];
      if (x <= rcx - hw + 2) c = RAMP.grass[1];else if (x >= rcx + hw - 1) c = RAMP.grass[3];
      if (y % 3 === 0) c = RAMP.dirt[3]; // thatch rows
      if (hash2(x, y, 124) < 0.12) c = RAMP.grass[3]; // moss patches
      else if (hash2(x, y, 125) < 0.06) c = RAMP.grass[0];
      P(g, x, yy, c);
    }
  }
  // roof right slope receding
  for (let d = 1; d <= 22 + ov; d++) {
    const ys = Math.floor(d / 2);
    for (let y = 0; y <= roofH; y++) {
      const t = y / roofH;
      const x = Math.round(rcx + d + (gx1 - rcx) * t);
      const yy = Math.round(ytop - roofH - ys + y);
      P(g, x, yy, y % 3 === 0 ? RAMP.dirt[3] : RAMP.grass[3]);
    }
  }
  // ridge
  for (let d = 0; d <= 22 + ov; d++) P(g, Math.round(rcx + d), ytop - roofH - Math.floor(d / 2), RAMP.grass[1]);
  // warm lit window
  const wx = cx - 6,
    wy = ytop + 12;
  for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) {
    let c = RAMP.ember[1];
    if (i === 0 || j === 0 || i === 10 || j === 10) c = RAMP.ember[0];
    if ((i + j) % 2 === 0 && hash2(i, j, 126) < 0.3) c = RAMP.ember[0];
    P(g, wx + i, wy + j, c);
  }
  for (let i = -1; i <= 11; i++) {
    P(g, wx + i, wy - 1, RAMP.dirt[3]);
    P(g, wx + i, wy + 11, RAMP.dirt[3]);
  }
  for (let j = -1; j <= 11; j++) {
    P(g, wx - 1, wy + j, RAMP.dirt[3]);
    P(g, wx + 11, wy + j, RAMP.dirt[3]);
  }
  for (let j = 0; j < 11; j++) P(g, wx + 5, wy + j, RAMP.dirt[3]);
  for (let i = 0; i < 11; i++) P(g, wx + i, wy + 5, RAMP.dirt[3]);
  // door
  for (let j = 0; j < 18; j++) for (let i = 0; i < 9; i++) {
    let c = RAMP.dirt[2];
    if (i % 2) c = RAMP.dirt[3];
    if (i === 0) c = RAMP.dirt[1];
    P(g, x0 + 8 + i, ybot - j, c);
  }
  // hanging bone-and-charm strings under the eave
  for (let s = 0; s < 6; s++) {
    const hxr = x0 + 6 + s * 9,
      hy = ytop + 2;
    P(g, hxr, hy, RAMP.dirt[3]);
    for (let k = 1; k < 5 + s % 3; k++) P(g, hxr, hy + k, RAMP.bone[3]);
    const cy = hy + 5 + s % 3;
    if (s % 3 === 0) {
      fillRect(g, hxr - 1, cy, 3, 2, RAMP.bone[1]);
      P(g, hxr - 1, cy + 1, RAMP.void);
      P(g, hxr + 1, cy + 1, RAMP.void);
    } // skull
    else if (s % 3 === 1) {
      P(g, hxr, cy, RAMP.drift[1]);
      P(g, hxr - 1, cy + 1, RAMP.drift[2]);
      P(g, hxr + 1, cy + 1, RAMP.drift[2]);
      P(g, hxr, cy + 2, RAMP.drift[2]);
    } // drift charm
    else {
      for (let k = 0; k < 3; k++) P(g, hxr, cy + k, RAMP.bone[2]);
    } // bone shard
  }
  // rickety stoop (steps down from door)
  for (let s = 0; s < 3; s++) for (let i = 0; i < 12 - s * 2; i++) P(g, x0 + 7 + s + i, ybot + 1 + s * 2, RAMP.dirt[3]), P(g, x0 + 7 + s + i, ybot + 2 + s * 2, RAMP.dirt[2]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ DOODADS ============================ */
function drawReedClump(variant) {
  const g = makeGrid(12, 18);
  const baseY = 16,
    cx = 6;
  const blades = variant ? 6 : 4;
  const rng = mulberry(131 + variant);
  for (let i = 0; i < blades; i++) {
    const bx = cx + Math.floor((rng() - 0.5) * 8),
      h = 9 + Math.floor(rng() * 6),
      lean = (rng() - 0.5) * 2;
    for (let k = 0; k < h; k++) {
      const sx = bx + Math.round(lean * (k / h));
      P(g, sx, baseY - k, k > h - 2 ? RAMP.grass[0] : k < 3 ? RAMP.grass[3] : RAMP.grass[1]);
    }
    if (rng() < 0.6) {
      const sy = baseY - h;
      P(g, bx + Math.round(lean), sy - 1, RAMP.bone[2]);
      P(g, bx + Math.round(lean), sy - 2, RAMP.bone[1]);
    } // seed-head
  }
  outline(g, RAMP.void);
  return g;
}
function drawDeadTree(variant) {
  const g = makeGrid(28, 40);
  const baseY = 38,
    cx = 13;
  const dr = RAMP.dirt;
  // trunk leaning
  const lean = variant ? 0.18 : -0.1;
  for (let y = 0; y < 30; y++) {
    const t = y / 30;
    const w = Math.round(3 - t * 1.5);
    const sx = cx + Math.round(lean * y);
    for (let i = -w; i <= w; i++) P(g, sx + i, baseY - y, i < 0 ? dr[0] : i > 0 ? dr[3] : dr[1]);
  }
  // bare branches
  const rng = mulberry(141 + variant);
  const branch = (x0, y0, dx, dy, n) => {
    let x = x0,
      y = y0;
    for (let k = 0; k < n; k++) {
      P(g, Math.round(x), Math.round(y), dr[2]);
      x += dx;
      y += dy;
      if (rng() < 0.3) P(g, Math.round(x), Math.round(y), dr[3]);
    }
  };
  const tx = cx + Math.round(lean * 24);
  branch(tx, baseY - 24, -0.9, -0.7, 9);
  branch(tx, baseY - 26, 0.95, -0.6, 10);
  branch(tx, baseY - 28, 0.1, -1, 7);
  branch(tx - 6, baseY - 28, -0.7, -0.6, 5);
  branch(tx + 6, baseY - 30, 0.7, -0.5, 5);
  // drift moss tufts
  for (let i = 0; i < (variant ? 5 : 3); i++) {
    const mx = tx + Math.floor((rng() - 0.5) * 18),
      my = baseY - 18 - Math.floor(rng() * 14);
    P(g, mx, my, RAMP.drift[2]);
    if (rng() < 0.5) P(g, mx + 1, my, RAMP.drift[3]);
    P(g, mx, my + 1, RAMP.drift[3]);
  }
  outline(g, RAMP.void);
  return g;
}
function drawBoneSpike(variant) {
  const g = makeGrid(10, 16);
  const baseY = 14,
    cx = variant ? 4 : 5;
  boneSpikeShape(g, cx, baseY, variant ? 11 : 13, variant ? 0.4 : -0.15);
  // a small second rib for variant
  if (variant) boneSpikeShape(g, cx + 3, baseY, 6, 0.6);
  // socket holes
  P(g, cx, baseY - 4, RAMP.bone[3]);
  P(g, cx, baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}
function drawMireBubble(frame) {
  const g = makeGrid(10, 8);
  const cx = 5,
    cy = 5;
  const wa = RAMP.water;
  // flat puddle
  for (let yy = -2; yy <= 2; yy++) for (let xx = -4; xx <= 4; xx++) {
    if ((xx / 4) ** 2 + (yy / 2) ** 2 > 1) continue;
    let c = wa[2];
    if (yy < 0) c = wa[1];
    if (yy <= -1 && xx < 0) c = wa[0];
    P(g, cx + xx, cy + yy, c);
  }
  // bubble swells (frame 0 small, frame 1 big/pop)
  if (frame === 0) {
    P(g, cx, cy - 1, wa[0]);
    P(g, cx, cy, wa[1]);
  } else {
    P(g, cx - 1, cy - 2, wa[0]);
    P(g, cx, cy - 2, wa[0]);
    P(g, cx - 1, cy - 1, wa[1]);
    P(g, cx, cy - 1, wa[1]);
    P(g, cx + 1, cy - 1, wa[1]);
    P(g, cx, cy - 3, RAMP.bone[2]);
    P(g, cx + 2, cy - 2, wa[0]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ INTERIOR ADDITIONS ============================ */
function drawHerbRack() {
  const g = makeGrid(24, 30);
  const baseY = 27,
    x0 = 2,
    top = 6;
  const dr = RAMP.dirt;
  // timber rack frame
  for (let i = 0; i <= 20; i++) {
    P(g, x0 + i, top, dr[1]);
    P(g, x0 + i, top + 1, dr[3]);
  } // top rail
  P(g, x0, top, dr[0]);
  P(g, x0 + 20, top, dr[2]);
  for (let j = top; j < baseY; j++) {
    P(g, x0, j, dr[2]);
    P(g, x0 + 20, j, dr[3]);
  } // posts
  // hanging dried herb bundles + charms
  const items = [[3, RAMP.grass], [7, RAMP.moss || RAMP.grass], [11, RAMP.ember], [15, RAMP.drift], [18, RAMP.grass]];
  items.forEach(([ix, col], i) => {
    const hx = x0 + ix,
      hy = top + 2;
    for (let k = 0; k < 3; k++) P(g, hx, hy + k, RAMP.bone[3]); // string
    const by = hy + 3,
      h = 8 + i % 3 * 2;
    if (i === 3) {
      // drift charm
      P(g, hx, by + 2, RAMP.drift[1]);
      P(g, hx - 1, by + 3, RAMP.drift[2]);
      P(g, hx + 1, by + 3, RAMP.drift[2]);
      P(g, hx, by + 4, RAMP.drift[2]);
    } else {
      for (let k = 0; k < h; k++) {
        const t = k / h,
          w = Math.round(1 + t * 1.5);
        for (let m = -w; m <= w; m++) P(g, hx + m, by + k, m < 0 ? col[1] : m > 0 ? col[3] : col[2]);
      }
      P(g, hx, by + h, col[3]); // tied tip
    }
  });
  outline(g, RAMP.void);
  return g;
}
function drawWallTimberCharms() {
  // plain timber NW wall + bone charms strung across
  const g = wallSegment('nw', 'timber', 'plain', {});
  const bn = RAMP.bone,
    dr = RAMP.drift;
  // a sagging string across the face
  const y0 = 22;
  for (let x = 2; x < 62; x++) {
    const sag = Math.round(Math.sin(x / 64 * Math.PI) * 4);
    P(g, x, y0 + sag, bn[3]);
  }
  // dangling charms
  for (let s = 0; s < 6; s++) {
    const hx = 6 + s * 10,
      sag = Math.round(Math.sin(hx / 64 * Math.PI) * 4),
      hy = y0 + sag;
    for (let k = 1; k < 4 + s % 3; k++) P(g, hx, hy + k, bn[3]);
    const cy = hy + 4 + s % 3;
    if (s % 3 === 0) {
      fillRect(g, hx - 1, cy, 3, 3, bn[1]);
      P(g, hx - 1, cy + 1, RAMP.void);
      P(g, hx + 1, cy + 1, RAMP.void);
    } // skull
    else if (s % 3 === 1) {
      for (let k = 0; k < 4; k++) P(g, hx, cy + k, bn[2]);
      P(g, hx - 1, cy + 2, bn[1]);
    } // bone shard
    else {
      P(g, hx, cy, dr[1]);
      P(g, hx - 1, cy + 1, dr[2]);
      P(g, hx + 1, cy + 1, dr[2]);
      P(g, hx, cy + 2, dr[2]);
    } // drift charm
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ THE LOST TOMBSTONE (16×20) ============================ */
function drawTombstone(sunken) {
  const g = makeGrid(16, 20);
  const bn = RAMP.bone;
  const cx = 8,
    baseY = 18;
  // mound of soil
  for (let xx = -7; xx <= 7; xx++) {
    const t = 1 - Math.abs(xx) / 7;
    const h = Math.round(t * 3);
    for (let k = 0; k < h; k++) P(g, cx + xx, baseY - k, RAMP.dirt[2]);
    P(g, cx + xx, baseY - h, RAMP.dirt[3]);
  }
  const lean = sunken ? 0.5 : 0.18;
  const topY = sunken ? 9 : 2,
    botY = baseY - 2;
  // stone slab (leaning)
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const w = 4;
    const sx = cx + Math.round(lean * (y - botY) * -1); // lean
    for (let i = -w; i <= w; i++) {
      if (y < topY + 4) {
        // rounded top
        const tt = (topY + 4 - y) / 4;
        if (Math.abs(i) > w * (1 - tt * 0.8)) continue;
      }
      let c = bn[2];
      if (i < -w + 1) c = bn[1];
      if (i > w - 1) c = bn[3];
      if (hash2(sx + i, y, 151) < 0.08) c = bn[3];
      P(g, sx + i, y, c);
    }
  }
  // cross/mark
  const msx = cx + Math.round(lean * (topY + 8 - botY) * -1);
  P(g, msx, topY + 6, bn[3]);
  P(g, msx, topY + 7, bn[3]);
  P(g, msx, topY + 8, bn[3]);
  P(g, msx - 1, topY + 7, bn[3]);
  P(g, msx + 1, topY + 7, bn[3]);
  // faint gold glint at the base (only non-sunken)
  if (!sunken) {
    P(g, cx + 4, baseY - 1, RAMP.gold[1]);
    P(g, cx + 4, baseY - 2, RAMP.gold[0]);
    P(g, cx + 5, baseY - 1, RAMP.gold[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRIES ============================ */
const WILDS_STRUCT = {
  husk_den: {
    fn: drawHuskDen,
    cell: [120, 88],
    anchor: [60, 87],
    frames: 2,
    anim: {
      name: 'eyes',
      fps: 2
    }
  },
  ash_obelisk: {
    fn: drawAshObelisk,
    cell: [64, 112],
    anchor: [32, 111],
    frames: 3,
    anim: {
      name: 'pulse',
      fps: 4
    }
  },
  mirewife_hut: {
    fn: drawMirewifeHut,
    cell: [120, 116],
    anchor: [58, 115]
  }
};
const WILDS_DOODAD = {
  reed_clump: {
    fn: drawReedClump,
    cell: [12, 18],
    anchor: [6, 17],
    variants: 2
  },
  dead_tree: {
    fn: drawDeadTree,
    cell: [28, 40],
    anchor: [13, 39],
    variants: 2
  },
  bone_spike: {
    fn: drawBoneSpike,
    cell: [10, 16],
    anchor: [5, 15],
    variants: 2
  },
  mire_bubble: {
    fn: drawMireBubble,
    cell: [10, 8],
    anchor: [5, 7],
    frames: 2,
    anim: {
      name: 'bubble',
      fps: 3
    }
  }
};
Object.assign(globalThis, {
  driftVeins,
  boneSpikeShape,
  drawHuskDen,
  drawAshObelisk,
  drawMirewifeHut,
  drawReedClump,
  drawDeadTree,
  drawBoneSpike,
  drawMireBubble,
  drawHerbRack,
  drawWallTimberCharms,
  drawTombstone,
  WILDS_STRUCT,
  WILDS_DOODAD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/wilds.js", error: String((e && e.message) || e) }); }

// assets/_gen/worldchoice.js
try { (() => {
// Naevyr WORLDCHOICE ART PACK — eval after pixlib.js + tiles.js (hash2).
// DOM art (served as SVG exports, animated with CSS steps() like the landing
// set) — NOT engine-ported. Rect-grid, RAMP only, dither not blur, crispEdges,
// 1px void outline on the seal (vistas are scenes → no global outline).
//
// "Choose your path" cards, both 256×160 so they tile as equal columns:
//   guest_vista — safe walled threshold camp at dusk, warm lantern glow, one
//     open stone gateway, calm dirt ground, NO corruption. "Free, no risk."
//   realm_vista — the full Waystation skyline sprawling under a creeping violet
//     Drift corruption haze. Towers, banners, scale. "The real, wallet-gated world."
//   guest_seal — 32×32 bone sigil (open padlock) = "guest / no wallet".

const WC_W = 256,
  WC_H = 160;

// ordered 2px dither between two colors over a vertical band a→b
function wcSky(g, bands, W) {
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        const dith = (x + y) % 2 === 0 ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });
}

/* ===================== GUEST VISTA (256×160, 2f, NO corruption) ===================== */
function drawGuestVista(frame) {
  frame = frame || 0;
  const W = WC_W,
    H = WC_H,
    g = makeGrid(W, H);
  const horizon = 100;
  const st = RAMP.stone,
    dt = RAMP.dirt,
    em = RAMP.ember,
    gd = RAMP.gold,
    bn = RAMP.bone;

  // warm dusk sky
  wcSky(g, [[0, 20, RAMP.void, '#14101c'], [20, 42, '#14101c', '#1d1722'], [42, 64, '#1d1722', '#2a2030'], [64, 84, '#2a2030', '#3a2a22'], [84, horizon, '#3a2a22', '#4d3320']], W);

  // setting-sun warm bloom on the horizon, centered behind the gate
  const sx = 128;
  for (let yy = -30; yy <= 6; yy++) for (let xx = -46; xx <= 46; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy * 2.4);
    if (d > 46) continue;
    const t = 1 - d / 46;
    if ((xx + yy) % 2 === 0 && hash2(sx + xx, horizon + yy, 11) < t * 0.75) {
      P(g, sx + xx, horizon + yy, t > 0.62 ? '#7c3a06' : t > 0.34 ? '#562a14' : '#37200f');
    }
  }
  // sun disc just over the horizon
  for (let yy = -6; yy <= 6; yy++) for (let xx = -7; xx <= 7; xx++) {
    if (xx * xx + yy * yy > 46) continue;
    P(g, sx + xx, horizon - 12 + yy, xx * xx + yy * yy > 30 ? em[3] : em[2]);
  }
  // distant warm ridge
  for (let x = 0; x < W; x++) {
    const r = horizon - 6 - Math.round(4 * Math.sin(x * 0.022) + 3 * Math.sin(x * 0.07));
    for (let y = r; y < horizon; y++) P(g, x, y, '#241812');
  }
  // a few faint warm stars high up
  const rng = mulberry(21);
  for (let i = 0; i < 22; i++) {
    const px = Math.floor(rng() * W),
      py = Math.floor(rng() * 46);
    P(g, px, py, rng() < 0.3 ? bn[2] : '#3a2c24');
  }

  // calm dirt ground
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      let c = t < 0.4 ? dt[2] : t < 0.78 ? dt[3] : '#19120b';
      if ((x + y) % 2 === 0 && hash2(x, y, 22) < 0.05 * (1 - t)) c = dt[1];
      P(g, x, y, c);
    }
  }
  // packed path leading to the gate
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    const wdt = Math.round(5 + t * 30);
    for (let x = sx - wdt; x <= sx + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, dt[1]);
  }

  // --- low stone perimeter wall with a single open gateway ---
  for (let x = 22; x <= 234; x++) for (let y = horizon - 13; y <= horizon - 1; y++) {
    if (x > 110 && x < 146 && y > horizon - 12) continue; // gateway opening
    let c = st[2];
    if (x % 15 < 1) c = st[3];
    if (y <= horizon - 12) c = st[1];
    if (hash2(x, y, 23) < 0.06) c = st[3];
    P(g, x, y, c);
  }
  for (let x = 22; x <= 232; x += 9) {
    if (x > 106 && x < 150) continue;
    fillRect(g, x, horizon - 15, 4, 2, st[1]);
  } // crenellations

  // gateway arch (stone), open, warm glow inside
  const gx = 128;
  for (let y = horizon - 25; y <= horizon - 1; y++) for (const dx of [[-18, -13], [13, 18]]) for (let x = gx + dx[0]; x <= gx + dx[1]; x++) {
    let c = st[1];
    if (x < gx - 16 || x > gx + 16) c = st[3];
    if (hash2(x, y, 24) < 0.06) c = st[2];
    P(g, x, y, c);
  }
  for (let x = gx - 18; x <= gx + 18; x++) {
    const a = Math.round(Math.sqrt(Math.max(0, 18 * 18 - (x - gx) * (x - gx))));
    const ty = horizon - 7 - a;
    for (let y = ty; y <= ty + 4; y++) P(g, x, y, st[2]);
    P(g, x, ty, st[1]);
  }
  // warm interior of the gateway
  for (let y = horizon - 20; y <= horizon - 1; y++) for (let x = gx - 12; x <= gx + 12; x++) {
    const a = Math.round(Math.sqrt(Math.max(0, 12 * 12 - (x - gx) * (x - gx))));
    if (y < horizon - 7 - a) continue;
    const fl = frame === 1;
    const d = Math.abs(x - gx);
    let c = '#2a1a0f';
    if (d < 7) c = em[3];
    if (d < 4) c = fl ? em[1] : em[2];
    if (d < 2 && y > horizon - 10) c = fl ? em[0] : em[1];
    P(g, x, y, c);
  }
  // flanking lanterns on the gate posts
  for (const lx of [gx - 22, gx + 22]) {
    const ly = horizon - 19;
    P(g, lx, ly - 2, st[3]);
    P(g, lx, ly - 1, st[3]);
    fillRect(g, lx - 1, ly, 3, 3, frame ? em[0] : em[1]);
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy + frame) % 2 === 0) P(g, lx + xx, ly + 1 + yy, em[2]);
  }

  // --- campfire in front of the gate (warm, flickers) ---
  const fx = 128,
    fy = horizon + 22;
  fillRect(g, fx - 5, fy, 11, 2, st[3]);
  for (let i = 0; i < 9; i++) P(g, fx - 4 + i, fy - 1, i % 2 ? em[2] : em[3]);
  const fh = frame ? 6 : 5;
  for (let yy = 0; yy <= fh; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (fh + 1)) * 3));
    for (let xx = -hw; xx <= hw; xx++) {
      let c = yy < 2 ? em[2] : Math.abs(xx) === hw ? em[3] : yy < fh - 1 ? em[1] : em[0];
      P(g, fx + xx, fy - 2 - yy, c);
    }
  }
  for (let yy = -2; yy <= 3; yy++) for (let xx = -9; xx <= 9; xx++) {
    const d = Math.abs(xx) + Math.abs(yy) * 2;
    if (d > 5 && d < 10 && (xx + yy) % 2 === 0) P(g, fx + xx, fy + yy, dt[1]);
  }
  for (let i = 0; i < 6; i++) {
    const t = (i / 6 + (frame ? 0.5 : 0)) % 1;
    const ey = fy - 6 - t * 20;
    const ex = fx + Math.sin(t * 6.28 + i) * 5 + (i % 2 ? 3 : -3);
    P(g, Math.round(ex), Math.round(ey), t < 0.5 ? em[1] : em[3]);
  }

  // --- small tents either side (a safe little camp) ---
  function tent(tx, by, c) {
    for (let yy = 0; yy < 11; yy++) {
      const hw = Math.round(yy * 0.9);
      for (let xx = -hw; xx <= hw; xx++) {
        let cc = c[2];
        if (xx < -hw + 1) cc = c[1];
        if (xx > hw - 1) cc = c[3];
        P(g, tx + xx, by - 10 + yy, cc);
      }
    }
    P(g, tx, by - 11, c[1]);
    for (let yy = 0; yy < 6; yy++) P(g, tx, by - yy, c[3]); // pole tip + door slit
  }
  tent(56, horizon + 12, dt);
  tent(198, horizon + 14, dt);
  // a warm gold pennant on a pole (no corruption)
  const pbx = 88;
  for (let y = horizon - 17; y <= horizon - 1; y++) P(g, pbx, y, st[3]);
  for (let yy = 0; yy < 6; yy++) {
    const ww = 5 - yy;
    for (let xx = 0; xx < ww; xx++) P(g, pbx + 1 + xx, horizon - 16 + yy, xx === ww - 1 ? gd[2] : gd[1]);
  }
  return g; // scene: no global outline
}

/* ===================== REALM VISTA (256×160, 2f, violet Drift haze) ===================== */
function drawRealmVista(frame) {
  frame = frame || 0;
  const W = WC_W,
    H = WC_H,
    g = makeGrid(W, H);
  const horizon = 106;
  const st = RAMP.stone,
    dr = RAMP.drift,
    bl = RAMP.blood,
    gd = RAMP.gold,
    em = RAMP.ember,
    bn = RAMP.bone,
    dt = RAMP.dirt;

  // cool violet dusk sky
  wcSky(g, [[0, 22, RAMP.void, '#13101d'], [22, 46, '#13101d', RAMP.ash], [46, 72, RAMP.ash, '#241d33'], [72, 92, '#241d33', '#2f2440'], [92, horizon, '#2f2440', '#3a2c4e']], W);
  // cold moon, upper right
  const mx = 206,
    my = 36;
  for (let yy = -8; yy <= 8; yy++) for (let xx = -8; xx <= 8; xx++) {
    if (xx * xx + yy * yy > 64) continue;
    let c = bn[2];
    if (xx + yy < -3) c = bn[1];
    if (xx * xx + yy * yy > 44) c = bn[3];
    P(g, mx + xx, my + yy, c);
  }
  const rng = mulberry(31);
  for (let i = 0; i < 46; i++) {
    const px = Math.floor(rng() * W),
      py = Math.floor(rng() * (horizon - 16));
    if (Math.abs(px - mx) < 12 && Math.abs(py - my) < 12) continue;
    P(g, px, py, rng() < 0.3 ? bn[1] : bn[3]);
  }

  // distant city ridge (back haze layer) just under the horizon
  for (let x = 0; x < W; x++) {
    const r = horizon - 2 - Math.round(3 * Math.sin(x * 0.05 + 1));
    for (let y = r; y < horizon; y++) P(g, x, y, '#1c1729');
  }

  // ground plane (cool, dark), with a faint path
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      let c = t < 0.4 ? '#1a1626' : t < 0.78 ? '#13101d' : RAMP.void;
      if ((x + y) % 2 === 0 && hash2(x, y, 32) < 0.05 * (1 - t)) c = st[3];
      P(g, x, y, c);
    }
  }
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    const wdt = Math.round(4 + t * 26);
    for (let x = 128 - wdt; x <= 128 + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, '#241d33');
  }

  // --- building helpers ---
  function building(bx, by, w, hh, roof, lit, flick) {
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      let c = st[2];
      if (x < 1) c = st[1];
      if (x > w - 2) c = st[3];
      if (hash2(bx + x, by - y, 71) < 0.05) c = st[3];
      P(g, bx + x, by - y, c);
    }
    for (let d = 1; d <= 2; d++) for (let y = 0; y < hh; y++) P(g, bx + w - 1 + d, by - y - Math.floor(d / 2), st[3]); // right depth
    for (let x = -1; x <= w; x++) {
      const dd = Math.abs(x - (w - 1) / 2);
      const ry = by - hh - Math.round((w / 2 - dd) * 0.6);
      for (let y = ry; y <= by - hh + 1; y++) P(g, bx + x, y, roof);
    }
    if (lit) for (let wy = 2; wy < hh - 1; wy += 4) for (let wx = 1; wx < w - 1; wx += 3) {
      const on = !flick || frame === 0 || (wx + wy) % 2 === 0;
      fillRect(g, bx + wx, by - wy, 1, 2, on ? em[1] : em[3]);
    }
  }
  function tower(bx, by, w, hh, roof, lit) {
    building(bx, by, w, hh, roof, lit, false);
    // battlements
    for (let x = -1; x <= w; x += 2) P(g, bx + x, by - hh - 1, st[1]);
    // a banner hung on the tower face (drift or blood), 2-frame sway
    const sway = frame ? 1 : 0;
    const bcol = roof === bl[2] ? bl : dr;
    const bxk = bx + (w >> 1) - 1,
      byk = by - hh + 4;
    for (let y = 0; y < 9; y++) for (let x = 0; x < 3; x++) {
      let c = bcol[2];
      if (x === 0) c = bcol[1];
      if (x === 2) c = bcol[3];
      if (y > 6 && x === 1) continue;
      P(g, bxk + x + (y > 4 ? sway : 0), byk + y, c);
    }
    P(g, bxk + 1, byk - 1, gd[1]);
  }

  // back row: many small buildings receding along the horizon
  const seed = mulberry(33);
  for (let bx = 4; bx < W - 10; bx += 12 + Math.floor(seed() * 7)) {
    const w = 7 + Math.floor(seed() * 6),
      hh = 7 + Math.floor(seed() * 11);
    const roof = seed() < 0.28 ? bl[2] : seed() < 0.6 ? st[3] : dt[3];
    building(bx, horizon - 1 + Math.floor(seed() * 3), w, hh, roof, seed() < 0.72, seed() < 0.4);
  }
  // prominent towers (scale)
  tower(40, horizon + 1, 11, 36, bl[2], true);
  tower(150, horizon, 13, 44, st[3], true);
  tower(206, horizon + 2, 9, 30, dr[3], true);

  // --- creeping violet Drift corruption haze along the horizon, bleeding up ---
  for (let x = 0; x < W; x++) {
    const top = horizon - 18 - Math.round(8 * Math.sin(x * 0.028) + 4 * Math.sin(x * 0.1 + frame));
    for (let y = top; y < horizon + 2; y++) {
      const t = (y - top) / (horizon + 2 - top); // 0 faint top .. 1 dense base
      const h = hash2(x, y, 34 + frame);
      if ((x + y) % 2 === 0 && h < t * 0.42) P(g, x, y, h < t * 0.16 ? dr[2] : dr[3]);else if (h < t * 0.045) P(g, x, y, dr[1]); // bright vein nodes
    }
  }

  // front-scale buildings (big, close) framing the sides
  building(10, horizon + 20, 24, 26, bl[2], true, false);
  building(W - 50, horizon + 17, 26, 28, st[3], true, true);
  // blood banner pole near the right front building
  const pbx = W - 22;
  for (let y = horizon - 4; y <= horizon + 12; y++) P(g, pbx, y, st[3]);
  for (let yy = 0; yy < 7; yy++) {
    const ww = 5 - Math.floor(yy / 2);
    for (let xx = 0; xx < ww; xx++) P(g, pbx - 1 - xx, horizon - 3 + yy, xx === ww - 1 ? bl[3] : bl[2]);
  }

  // drifting corruption motes (shimmer)
  const mr = mulberry(35);
  for (let i = 0; i < 54; i++) {
    let px = Math.floor(mr() * W),
      py = Math.floor(mr() * H);
    const d = frame ? 1 : 0;
    px = (px + i % 3 * d) % W;
    py = (py - d + H) % H;
    if (py > horizon + 30) continue;
    const big = i % 6 === 0;
    P(g, px, py, big ? dr[0] : dr[1]);
    if (big) {
      P(g, px + 1, py, dr[2]);
      P(g, px, py + 1, dr[2]);
    }
  }
  // bottom vignette so overlaid UI reads
  for (let y = H - 46; y < H; y++) {
    const t = (y - (H - 46)) / 46;
    for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && hash2(x, y, 36) < t * 0.9) P(g, x, y, RAMP.void);
  }
  return g; // scene: no global outline
}

/* ===================== GUEST SEAL (32×32, 1f, bone) — open padlock ===================== */
function drawGuestSeal() {
  const g = makeGrid(32, 32);
  const bn = RAMP.bone;
  // round badge plate
  for (let yy = -13; yy <= 13; yy++) for (let xx = -13; xx <= 13; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > 13) continue;
    let c = bn[2];
    if (d > 11.2) c = bn[3];else if (xx + yy < -7) c = bn[1];else if (xx + yy > 8) c = bn[3];
    P(g, 16 + xx, 16 + yy, c);
  }
  // engraved inner ring
  for (let a = 0; a < 64; a++) {
    const th = a / 64 * Math.PI * 2;
    P(g, Math.round(16 + Math.cos(th) * 10), Math.round(16 + Math.sin(th) * 10), bn[3]);
  }

  // open padlock glyph — body (rounded), lower-center
  for (let y = 20; y <= 27; y++) for (let x = 11; x <= 21; x++) {
    if ((x === 11 || x === 21) && (y === 20 || y === 27)) continue; // rounded corners
    let c = bn[1];
    if (x <= 12) c = bn[0];
    if (x >= 20) c = bn[3];
    if (y >= 26) c = bn[3];
    if (y === 20) c = bn[2];
    P(g, x, y, c);
  }
  // keyhole (circle + slot)
  P(g, 16, 22, bn[3]);
  P(g, 15, 23, bn[3]);
  P(g, 17, 23, bn[3]);
  P(g, 16, 23, RAMP.void);
  P(g, 16, 24, bn[3]);
  P(g, 16, 25, bn[3]);
  // bold shackle (2px). right leg seated in the body; left leg lifted OPEN (gap above body)
  for (let y = 14; y <= 20; y++) {
    P(g, 19, y, bn[1]);
    P(g, 20, y, bn[2]);
  } // right leg → into body
  [[18, 12], [17, 11], [15, 10], [13, 10], [12, 11]].forEach(([x, y]) => {
    P(g, x, y, bn[0]);
    P(g, x, y + 1, bn[1]);
  }); // arch
  for (let y = 12; y <= 16; y++) {
    P(g, 12, y, bn[1]);
    P(g, 11, y, bn[2]);
  } // left leg — short, sprung open
  P(g, 9, 13, bn[3]);
  P(g, 9, 15, bn[3]); // motion ticks

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const WORLDCHOICE = {
  guest_vista: {
    fn: drawGuestVista,
    cell: [256, 160],
    anchor: [128, 159],
    frames: 2,
    anim: {
      name: 'shimmer',
      fps: 2
    },
    scene: true,
    ramps: 'stone + dirt + ember/gold (warm) — NO corruption',
    reads: 'free, no risk, try it'
  },
  realm_vista: {
    fn: drawRealmVista,
    cell: [256, 160],
    anchor: [128, 159],
    frames: 2,
    anim: {
      name: 'shimmer',
      fps: 2
    },
    scene: true,
    ramps: 'stone town + drift haze + blood/gold accents',
    reads: 'the real world, wallet-gated'
  },
  guest_seal: {
    fn: drawGuestSeal,
    cell: [32, 32],
    anchor: [16, 31],
    frames: 1,
    anim: null,
    ramps: 'bone only',
    reads: 'guest / no wallet (open padlock)'
  }
};
Object.assign(globalThis, {
  WC_W,
  WC_H,
  wcSky,
  drawGuestVista,
  drawRealmVista,
  drawGuestSeal,
  WORLDCHOICE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/worldchoice.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — Badge
   Pixel chip for statuses, counts, rarity & the seasonal "Drift"
   marker. variant="season" is the ornate HUD season badge; the rest
   are compact inline tags. */

const TONES = {
  corrupt: {
    fg: 'var(--drift-core)',
    bg: 'var(--corrupt-32)',
    edge: 'var(--corrupt-55)'
  },
  gold: {
    fg: '#1a130a',
    bg: 'var(--drift-gold)',
    edge: 'var(--gold-hi)'
  },
  success: {
    fg: '#dff1df',
    bg: 'var(--moss-24)',
    edge: 'var(--drift-moss)'
  },
  warning: {
    fg: '#241a05',
    bg: 'var(--drift-ember)',
    edge: 'var(--ember-hi)'
  },
  danger: {
    fg: '#ffe7e7',
    bg: 'var(--blood-24)',
    edge: 'var(--drift-blood)'
  },
  neutral: {
    fg: 'var(--text-secondary)',
    bg: 'var(--surface-well)',
    edge: 'var(--bone-14)'
  }
};
function Badge({
  children,
  tone = 'corrupt',
  icon = null,
  className = '',
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.corrupt;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: `var(--weight-regular) var(--text-2xs)/1 var(--font-pixel)`,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: t.fg,
      background: t.bg,
      padding: '4px 8px',
      boxShadow: `0 0 0 1px ${t.edge}`,
      clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))',
      ...style
    }
  }, rest), icon, children);
}

/* The HUD "season" badge — number + name, corruption-styled. */
function SeasonBadge({
  season = 3,
  name = 'Ashfall',
  driftPct = 42,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `drift-panel ${className}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 12px 7px 8px',
      boxShadow: 'var(--frame-shadow)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 34,
      padding: '3px 6px',
      background: 'var(--corrupt-32)',
      boxShadow: '0 0 0 1px var(--corrupt-55)',
      clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 8px/1 var(--font-pixel)',
      letterSpacing: '.1em',
      color: 'var(--bone-72)'
    }
  }, "S"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 17px/1 var(--font-display)',
      color: 'var(--drift-core)'
    }
  }, String(season).padStart(2, '0'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "drift-heading",
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)',
      lineHeight: 1
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: '400 9px/1 var(--font-pixel)',
      letterSpacing: '.06em',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: 'var(--drift-corrupt)',
      boxShadow: 'var(--glow-corrupt-sm)'
    }
  }), "Drift ", driftPct, "%")));
}
Object.assign(__ds_scope, { Badge, SeasonBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — Button
   Pixel button: hard bevel + hard drop shadow that presses down on
   :active (chrome in styles.css → .drift-pixel-btn). Variants tie to
   the palette; React only sets the --btn-* vars + size + content. */

const VARIANTS = {
  primary: {
    '--btn-bg': 'var(--drift-corrupt-dim)',
    '--btn-bg-hi': 'var(--drift-corrupt)',
    '--btn-fg': '#f6efff',
    '--btn-edge': 'var(--drift-corrupt)'
  },
  gold: {
    '--btn-bg': 'var(--gold-lo)',
    '--btn-bg-hi': 'var(--drift-gold)',
    '--btn-fg': '#1a130a',
    '--btn-edge': 'var(--gold-hi)'
  },
  ghost: {
    '--btn-bg': 'var(--surface-frame)',
    '--btn-bg-hi': 'var(--ui-100)',
    '--btn-fg': 'var(--text-primary)',
    '--btn-edge': 'var(--corrupt-32)'
  },
  danger: {
    '--btn-bg': 'var(--blood-lo)',
    '--btn-bg-hi': 'var(--drift-blood)',
    '--btn-fg': '#fff',
    '--btn-edge': 'var(--blood-hi)'
  }
};
const SIZES = {
  sm: {
    minHeight: 32,
    padding: '6px 10px',
    fontSize: 'var(--text-xs)'
  },
  md: {
    minHeight: 40,
    padding: '9px 14px',
    fontSize: 'var(--text-sm)'
  },
  lg: {
    minHeight: 48,
    padding: '12px 18px',
    fontSize: 'var(--text-md)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    className: `drift-pixel-btn ${className}`,
    style: {
      ...(VARIANTS[variant] || VARIANTS.primary),
      ...(SIZES[size] || SIZES.md),
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : undefined,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — Panel
   The canonical pixel HUD frame: notched corners, hard bevel, a thin
   corruption-purple edge, semi-transparent fill, purple corner pips.
   Composes into every HUD surface (inventory, log, skills). */

function Panel({
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
  const pip = pos => /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      width: 3,
      height: 3,
      background: 'var(--drift-corrupt)',
      boxShadow: '0 0 0 1px var(--corrupt-32)',
      ...pos,
      pointerEvents: 'none'
    }
  });
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `drift-panel ${className}`,
    style: {
      boxShadow: glow ? 'var(--frame-shadow), 0 0 0 3px var(--corrupt-16)' : 'var(--frame-shadow)',
      ...style
    }
  }, rest), corners && /*#__PURE__*/React.createElement(React.Fragment, null, pip({
    left: 2,
    top: 2
  }), pip({
    right: 2,
    top: 2
  }), pip({
    left: 2,
    bottom: 2
  }), pip({
    right: 2,
    bottom: 2
  })), (title || kicker || accessory) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: padded ? '10px 14px 8px' : '10px 12px 8px',
      borderBottom: '1px solid var(--bone-14)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, kicker && /*#__PURE__*/React.createElement("span", {
    className: "drift-label",
    style: {
      color: 'var(--text-muted)'
    }
  }, kicker), title && /*#__PURE__*/React.createElement("span", {
    className: "drift-heading",
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)'
    }
  }, title)), accessory), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padded ? '12px 14px' : 0
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/game/ActivityLog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — ActivityLog
   The scrolling HUD feed: gathers, level-ups, loot, Drift events.
   Pass `entries` newest-first; each = { kind, text, meta }. kind tints
   the bullet + accent: loot/xp/info/warning/danger/drift. */

const KINDS = {
  xp: {
    dot: 'var(--drift-corrupt)',
    accent: 'var(--drift-corrupt)'
  },
  loot: {
    dot: 'var(--drift-gold)',
    accent: 'var(--drift-gold)'
  },
  info: {
    dot: 'var(--bone-45)',
    accent: 'var(--text-secondary)'
  },
  warning: {
    dot: 'var(--drift-ember)',
    accent: 'var(--drift-ember)'
  },
  danger: {
    dot: 'var(--drift-blood)',
    accent: 'var(--drift-blood)'
  },
  drift: {
    dot: 'var(--drift-core)',
    accent: 'var(--drift-hi)'
  }
};
function ActivityLog({
  entries = [],
  max = 6,
  className = '',
  style = {},
  ...rest
}) {
  const rows = entries.slice(0, max);
  return /*#__PURE__*/React.createElement("ul", _extends({
    className: className,
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, rest), rows.map((e, i) => {
    const k = KINDS[e.kind] || KINDS.info;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        opacity: 1 - i * 0.085
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        flex: 'none',
        width: 5,
        height: 5,
        marginTop: 1,
        background: k.dot,
        boxShadow: e.kind === 'drift' || e.kind === 'xp' ? 'var(--glow-corrupt-sm)' : 'none'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: '400 13px/1.35 var(--font-ui)',
        color: 'var(--text-secondary)',
        textShadow: 'var(--text-shadow-hud)'
      }
    }, e.text, e.meta && /*#__PURE__*/React.createElement("span", {
      className: "drift-num",
      style: {
        color: k.accent,
        fontWeight: 600,
        marginLeft: 6
      }
    }, e.meta)));
  }));
}
Object.assign(__ds_scope, { ActivityLog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ActivityLog.jsx", error: String((e && e.message) || e) }); }

// components/game/Slot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — Slot
   Inventory / hotbar cell. Pixel well with a hard inset bevel; a
   rarity edge, a stack count, an optional keybind cap, and the Drift
   selection glow. Pass `icon` as a node (e.g. <Icon name="axe" />). */

const RARITY = {
  common: 'var(--bone-14)',
  uncommon: 'var(--drift-moss)',
  rare: 'var(--water-hi)',
  epic: 'var(--drift-corrupt)',
  legendary: 'var(--drift-gold)'
};
function Slot({
  icon = null,
  count = null,
  keybind = null,
  rarity = null,
  selected = false,
  disabled = false,
  size = 52,
  onClick,
  title,
  className = '',
  style = {},
  ...rest
}) {
  const edge = rarity ? RARITY[rarity] : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    title: title,
    className: className,
    style: {
      position: 'relative',
      width: size,
      height: size,
      padding: 0,
      border: 0,
      background: 'var(--surface-well)',
      cursor: disabled ? 'default' : 'pointer',
      imageRendering: 'pixelated',
      boxShadow: selected ? 'var(--bevel-slot), 0 0 0 1px var(--drift-core), 0 0 0 2px var(--drift-corrupt), 0 0 0 4px var(--corrupt-16)' : edge ? `var(--bevel-slot), inset 0 0 0 1px ${edge}` : 'var(--bevel-slot)',
      transition: 'box-shadow var(--dur-fast) steps(2)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon), keybind != null && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: 3,
      font: '400 9px/1 var(--font-pixel)',
      color: 'var(--bone-45)'
    }
  }, keybind), count != null && /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      position: 'absolute',
      right: 3,
      bottom: 2,
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      textShadow: 'var(--text-shadow-hud)'
    }
  }, count));
}
Object.assign(__ds_scope, { Slot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Slot.jsx", error: String((e && e.message) || e) }); }

// components/game/Hotbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — Hotbar
   The 6-slot action bar (keys 1–6). Pass `slots` as an array of up to
   6 items ({ icon, count, rarity }); `selected` is the active index.
   Empty positions render as quiet wells. */

function Hotbar({
  slots = [],
  selected = 0,
  onSelect,
  size = 52,
  className = '',
  style = {},
  ...rest
}) {
  const cells = Array.from({
    length: 6
  }, (_, i) => slots[i] || null);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      gap: 'var(--slot-gap)',
      ...style
    },
    role: "toolbar",
    "aria-label": "Hotbar"
  }, rest), cells.map((item, i) => /*#__PURE__*/React.createElement(__ds_scope.Slot, {
    key: i,
    size: size,
    keybind: i + 1,
    icon: item ? item.icon : null,
    count: item ? item.count : null,
    rarity: item ? item.rarity : null,
    selected: i === selected,
    title: item ? item.name : `Slot ${i + 1}`,
    onClick: () => onSelect && onSelect(i)
  })));
}
Object.assign(__ds_scope, { Hotbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Hotbar.jsx", error: String((e && e.message) || e) }); }

// components/game/XPBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — XPBar
   A skill progress row: icon + name on the left, level chip on the
   right, a pixel track with a stepped corruption fill, and the
   value/next readout. `color` tints the fill per skill. */

function XPBar({
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
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    className: "drift-label",
    style: {
      color: 'var(--text-secondary)',
      flex: 1
    }
  }, skill), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      background: 'var(--surface-well)',
      boxShadow: 'var(--bevel-slot)',
      padding: '2px 6px',
      whiteSpace: 'nowrap'
    }
  }, "Lv ", level)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 'var(--xpbar-height)',
      background: 'var(--surface-well)',
      boxShadow: 'var(--bevel-slot)',
      overflow: 'hidden',
      imageRendering: 'pixelated'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${pct}%`,
      background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(10,8,16,.25) 55%, rgba(10,8,16,.25) 100%)`,
      boxShadow: `0 0 0 1px rgba(10,8,16,.4), 0 0 6px ${color}`,
      transition: 'width var(--dur-slow) steps(8)'
    }
  })), showNumbers && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, value.toLocaleString(), " / ", max.toLocaleString(), " XP"), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '10px',
      color
    }
  }, Math.round(pct), "%")));
}
Object.assign(__ds_scope, { XPBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/XPBar.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   Naevyr PIXEL ICONS
   Each icon is a 16×16 grid of chars; every char maps to a palette
   entry below and renders as one 1×1 <rect> with crisp edges. Tune
   pixels by editing the grids — keep the 'k' outline + 2–3 shade
   ramp per material so icons match sprites & tiles.
   ============================================================ */

const PAL = {
  '.': null,
  // transparent
  k: '#0a0810',
  // outline / void
  // bone / steel-light
  L: '#d8cfe0',
  o: '#a99fb8',
  h: '#efe9f4',
  // steel / stone
  S: '#9b94ab',
  C: '#4a4360',
  s: '#6f6781',
  z: '#3a3350',
  c: '#322b46',
  // wood
  W: '#7a6048',
  w: '#50402e',
  x: '#36291c',
  // gold
  G: '#f6e0a6',
  g: '#e7c873',
  y: '#b8943f',
  // ember
  E: '#fcd34d',
  e: '#f59e0b',
  // drift purple
  P: '#f3e8ff',
  p: '#a855f7',
  u: '#6b21a8',
  v: '#3b1162',
  // blood
  R: '#ef4444',
  r: '#dc2626',
  // moss / leaf
  M: '#7fae5e',
  m: '#4d7c4d',
  n: '#356037',
  // water / fish
  B: '#4a7fa0',
  b: '#2c5775'
};
const GRID = 16;
const ICONS = {
  /* ---------------- 6 TOOLS ---------------- */
  axe: ['................', '......kkkkkk....', '.....kSShhhSzk..', '....kSSSSSShSzk.', '....kSSSSSSSSzk.', '....kzSSSSSSzk..', '.....kkzSSzkk...', '......kwwk......', '......kWwk......', '......kwWk......', '......kWwk......', '......kwWk......', '......kWwk......', '......kwWkk.....', '.......kkk......', '................'],
  pickaxe: ['................', '..kk........kk..', '.kssk......kssk.', 'kSsszk....kzssSk', 'kSsszkk..kkzssSk', '.kzsssk..ksssszk', '..kkzsssssszkk..', '.....kkwwkk.....', '......kWwk......', '......kwWk......', '......kxwk......', '......kWwk......', '......kwxk......', '......kWwk......', '......kxwkk.....', '.......kk.......'],
  rod: ['............kkk.', '...........kWWk.', '..........kWzk..', '.........kWzk...', '........kWzk....', '.......kWzk.....', '......kWzk..k...', '.....kWzk...k...', '....kWzk....k...', '...kWzk.....k...', '..kWzk....kBBk..', '..kWk.....kPBk..', '.kWk......kbbk..', '.kk........kk...', '................', '................'],
  sword: ['.......k........', '......kLk.......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '.....kzzLLk.....', '...kkkkkkkkkk...', '...kygggggyk...', '....kkkwwkk.....', '......kwwk......', '......kwwk......', '.....kgGGgk.....', '......kkkk......'],
  ward: ['...kkkkkkkkk....', '..kCsssssssCk...', '..kCsuuuuusCk...', '..kCsuPPpusCk...', '..kCsupPpusCk...', '..kCsuppppsCk...', '..kCsssssssCk...', '..kCsssssssCk...', '...kCsssssCk....', '...kCsssssCk....', '....kCsssCk.....', '....kCsssCk.....', '.....kCsCk......', '.....kCsCk......', '......kkk.......', '................'],
  sigil: ['......kkkk......', '....kkuuuukk....', '...kuppppppuk...', '..kupppPppppuk..', '..kuppPPPpppuk..', '.kuppPPpPPpppuk.', '.kupppPPPppppuk.', '.kuppPPpPPpppuk.', '..kpppPPPpppuk..', '..kupppPppppuk..', '...kuppppppuk...', '....kkuuuukk....', '......kkkk......', '................', '................', '................'],
  /* ---------------- RESOURCES ---------------- */
  log: ['................', '...kkkkkkkkk....', '..kWWWWWWWWWk...', '.kWWxoxWWWWWk...', '.kWxoxoxWWWWk...', '.kWWxoxWWWWWk...', '..kWWWWWWWWWk...', '...kkkkkkkkk....', '...kkkkkkkkk....', '..kwwwwwwwwwk...', '.kwwxoxwwwwwk...', '.kwxoxoxwwwwk...', '.kwwxoxwwwwwk...', '..kwwwwwwwwwk...', '...kkkkkkkkk....', '................'],
  ore: ['................', '......kkkk......', '....kkCCCCkk....', '...kCCsssCCk....', '..kCsgssssgCk...', '..kCsssgsssCk...', '.kcsgssssgsck...', '.kcssgsssscck...', '..kcssgsssck....', '..kccssssgck....', '...kccsssck.....', '....kcccck......', '.....kkkk.......', '................', '................', '................'],
  fish: ['................', '................', '....kkkk....kk..', '..kkBBBBkk.kBk..', '.kBBBBBBBBkBBk..', 'kBBbbkBBBBBBBk..', 'kBkLBBBBBBBBBk..', 'kBBbbkBBBBBBk...', '.kBBBBBBBBkBBk..', '..kkBBBBkk.kBk..', '....kkkk....kk..', '................', '................', '................', '................', '................'],
  coin: ['................', '.....kkkkk......', '...kkgggggkk....', '..kgGGGGGGgk....', '..kgGyppyGgk....', '.kgGyppppyGgk...', '.kgGyppPppyGk...', '.kgGyppppyGgk...', '..kgGyppyGgk....', '..kgGGGGGGgk....', '...kkgggggkk....', '.....kkkkk......', '................', '................', '................', '................'],
  drift: ['................', '.......k........', '......kPk.......', '......kPk.......', '.....kpPpk......', '....kppPppk.....', '.kk.kppPppk.kk..', 'kPppppPPPpppPk..', '.kk.kppPppk.kk..', '....kppPppk.....', '.....kpPpk......', '......kPk.......', '......kPk.......', '.......k........', '................', '................'],
  /* ---------------- HUD ---------------- */
  heart: ['................', '..kkk....kkk....', '.kRRRkk.kRRRk...', 'kRRRRRkkRRRRRk..', 'kRRRRRRRRRRRRk..', 'kRRRRRRRRRRRRk..', 'kRRRRRRRRRRRRk..', '.kRRRRRRRRRRk...', '..kRRRRRRRRk....', '...kRRRRRRk.....', '....kRRRRk......', '.....kRRk.......', '......kk........', '................', '................', '................'],
  leaf: ['................', '.............kk.', '..........kkMMk.', '........kkMMMnk.', '......kkMMMMnk..', '.....kMMMMMnk...', '....kMMMMnnk....', '...kMMMnnk......', '..kMMnnk.k......', '..kMnnk.kn......', '.kMnnk.kn.......', '.knnk.kn........', '.kkk.kn.........', '....kn..........', '...kk...........', '................'],
  bag: ['................', '.....kkkk.......', '....kk..kk......', '....k....k......', '...kkkkkkkk.....', '..kWwwwwwwWk....', '..kwwwwwwwwk....', '..kwwwggwwwk....', '..kwwwggwwwk....', '..kwwwwwwwwk....', '..kwwwwwwwwk....', '...kwwwwwwk.....', '....kkkkkk......', '................', '................', '................'],
  bolt: ['................', '........kk......', '.......kEk......', '......kEek......', '.....kEek.......', '....kEek........', '...kEekkk.......', '..kEeEEEk.......', '..kkkkEek.......', '.....kEek.......', '....kEek........', '...kEek.........', '..kEek..........', '..kek...........', '..kk............', '................'],
  chevronRight: ['................', '.....k..........', '.....kk.........', '.....kLk........', '......kLk.......', '.......kLk......', '........kLk.....', '........kLk.....', '.......kLk......', '......kLk.......', '.....kLk........', '.....kk.........', '.....k..........', '................', '................', '................'],
  x: ['................', '..kk......kk....', '..kLk....kLk....', '...kLk..kLk.....', '....kLkkLk......', '.....kLLk.......', '.....kLLk.......', '....kLkkLk......', '...kLk..kLk.....', '..kLk....kLk....', '..kk......kk....', '................', '................', '................', '................', '................']
};
const ICON_NAMES = Object.keys(ICONS);
const TOOL_NAMES = ['axe', 'pickaxe', 'rod', 'sword', 'ward', 'sigil'];
function Icon({
  name,
  size = 32,
  glow = false,
  style = {},
  className = '',
  ...rest
}) {
  const grid = ICONS[name] || [];
  const rects = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = PAL[row[x]];
      if (fill) rects.push(/*#__PURE__*/React.createElement("rect", {
        key: `${x}-${y}`,
        x: x,
        y: y,
        width: 1,
        height: 1,
        fill: fill
      }));
    }
  }
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: `0 0 ${GRID} ${GRID}`,
    shapeRendering: "crispEdges",
    className: className,
    style: {
      display: 'block',
      flex: 'none',
      imageRendering: 'pixelated',
      filter: glow ? 'drop-shadow(0 0 0.5px #a855f7) drop-shadow(0 0 2px rgba(168,85,247,0.8))' : undefined,
      ...style
    },
    "aria-hidden": "true"
  }, rest), rects);
}
Object.assign(__ds_scope, { ICON_NAMES, TOOL_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// naevyr_scenes.jsx
try { (() => {
// Naevyr — "Mobile + Guest Rift open to all" announce video.
// 6s, 1920×1080, loop. One continuous shot: dark ruined vista → a vertical
// Drift seam glimmers → the rift TEARS open (light spill + mote burst) → a phone
// rises out of the rift running the game → headline + CTA build on the right.
// Loads after animations.jsx. Pixel-art discipline: crisp sprites, dithered glow.

const {
  Stage,
  Sprite,
  useTime,
  Easing,
  interpolate,
  animate,
  clamp
} = window;

/* ============================ palette ============================ */
const C = {
  void: '#0a0810',
  ash: '#171320',
  stone: '#2a2438',
  bone: '#d8cfe0',
  boneHi: '#efe9f4',
  boneMid: '#a99fb8',
  boneLo: '#6f6781',
  core: '#f3e8ff',
  driftHi: '#d8b4fe',
  drift: '#a855f7',
  driftLo: '#6b21a8',
  driftDp: '#3b1162',
  ember: '#f59e0b',
  emberHi: '#fcd34d',
  gold: '#e7c873',
  goldHi: '#f6e0a6',
  goldLo: '#b8943f',
  water: '#4a7fa0',
  moss: '#4d7c4d',
  blood: '#dc2626'
};
const FONT_PIX = "'Pixelify Sans', monospace";
const FONT_SILK = "'Silkscreen', monospace";
const FONT_SORA = "'Sora', system-ui, sans-serif";

// centre of the rift / phone (left third)
const RIFT_X = 600;

/* deterministic RNG */
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}

/* a small pixel-dither overlay (checkerboard) as a CSS background */
function ditherBg(color, size = 3) {
  return {
    backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%),` + `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%)`,
    backgroundSize: `${size * 2}px ${size * 2}px`,
    backgroundPosition: `0 0, ${size}px ${size}px`,
    imageRendering: 'pixelated'
  };
}

/* ============================ backdrop ============================ */
// hero_vista (480×270 frame, ×4 = 1920×1080) with a slow ken-burns push.
function Backdrop() {
  const t = useTime();
  const scale = interpolate([0, 6], [1.08, 1.16], Easing.easeInOutSine)(t);
  const drift = interpolate([0, 6], [0, -22], Easing.linear)(t);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: C.void
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      transform: `scale(${scale}) translate(${drift * 0.2}px, ${drift * 0.1}px)`,
      transformOrigin: '50% 60%'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/landing/hero_vista.svg",
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 3840,
      height: 1080,
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(120% 90% at 60% 40%, transparent 40%, rgba(10,8,16,0.55) 100%)'
    }
  }));
}

/* ============================ drifting motes ============================ */
function Motes({
  count = 46,
  seed = 7
}) {
  const t = useTime();
  const r = React.useMemo(() => {
    const g = rng(seed);
    const arr = [];
    for (let i = 0; i < count; i++) arr.push({
      x: g() * 1920,
      y: g() * 1080,
      sp: 6 + g() * 16,
      sz: g() < 0.8 ? 2 : 3,
      ph: g() * Math.PI * 2,
      amp: 8 + g() * 26,
      tw: 0.4 + g() * 1.6,
      col: g() < 0.7 ? C.drift : g() < 0.5 ? C.driftHi : C.gold
    });
    return arr;
  }, [count, seed]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }
  }, r.map((m, i) => {
    const y = ((m.y - t * m.sp) % 1120 + 1120) % 1120 - 20;
    const x = m.x + Math.sin(t * 0.5 + m.ph) * m.amp;
    const op = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * m.tw + m.ph));
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'absolute',
        left: x,
        top: y,
        width: m.sz,
        height: m.sz,
        background: m.col,
        opacity: op,
        imageRendering: 'pixelated',
        boxShadow: m.sz > 2 ? `0 0 6px ${m.col}` : 'none'
      }
    });
  }));
}

/* ============================ the rift ============================ */
function Rift() {
  const t = useTime();
  // anticipation seam (1.0–1.6), tear open (1.6→2.4), then breathe.
  const wRaw = interpolate([0.9, 1.35, 1.55, 2.4, 6], [0, 7, 3, 360, 360], [Easing.easeOutQuad, Easing.easeInQuad, Easing.easeOutExpo, Easing.linear])(t);
  const breathe = t > 2.4 ? Math.sin((t - 2.4) * 1.7) * 9 : 0;
  const W = Math.max(0, wRaw + (t > 2.4 ? breathe : 0));
  const H = interpolate([0.9, 1.55, 2.4], [60, 150, 930], Easing.easeOutExpo)(t);
  const op = interpolate([0.85, 1.2, 2.4, 6], [0, 0.85, 1, 1])(t);
  const flick = 0.86 + 0.14 * Math.sin(t * 22);
  const coreW = Math.max(2, W * 0.06);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: RIFT_X,
      top: 540,
      transform: 'translate(-50%,-50%)',
      opacity: op
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: W * 2.4,
      height: H * 1.04,
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background: `radial-gradient(50% 50% at 50% 50%, ${C.drift}66 0%, ${C.driftLo}33 38%, transparent 72%)`,
      filter: 'blur(2px)',
      opacity: 0.8 * flick
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: W,
      height: H,
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      overflow: 'hidden',
      background: `linear-gradient(to bottom,
          transparent 0%, ${C.driftDp} 5%, ${C.driftDp} 11%, ${C.driftLo} 11%, ${C.driftLo} 22%,
          ${C.drift} 22%, ${C.drift} 36%, ${C.driftHi} 36%, ${C.driftHi} 46%,
          ${C.core} 46%, ${C.core} 54%, ${C.driftHi} 54%, ${C.driftHi} 64%,
          ${C.drift} 64%, ${C.drift} 78%, ${C.driftLo} 78%, ${C.driftLo} 89%,
          ${C.driftDp} 89%, ${C.driftDp} 95%, transparent 100%)`,
      boxShadow: `0 0 ${18 * flick}px ${C.drift}, inset 0 0 14px ${C.core}99`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: 0.5,
      ...ditherBg('rgba(243,232,255,0.5)', 3)
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: 0.4,
      ...ditherBg('rgba(59,17,98,0.7)', 2)
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: coreW,
      height: H * 0.9,
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background: C.core,
      opacity: flick,
      boxShadow: `0 0 16px ${C.core}, 0 0 40px ${C.driftHi}`
    }
  }), [-0.34, -0.14, 0.14, 0.34].map((f, i) => {
    const cx = f * W;
    const colOp = (0.18 + 0.16 * Math.sin(t * 3 + i)) * clamp((t - 1.8) * 2, 0, 1);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'absolute',
        left: `calc(50% + ${cx}px)`,
        top: '50%',
        width: 2,
        height: H * 1.18,
        transform: 'translate(-50%,-50%)',
        background: `linear-gradient(${C.core}, transparent)`,
        opacity: colOp,
        imageRendering: 'pixelated'
      }
    });
  }));
}

/* burst of shards/motes at the tear */
function TearBurst() {
  const t = useTime();
  const r = React.useMemo(() => {
    const g = rng(31);
    const arr = [];
    for (let i = 0; i < 34; i++) {
      const a = g() * Math.PI * 2;
      arr.push({
        a,
        d: 120 + g() * 520,
        sz: g() < 0.6 ? 2 : 3,
        sp: 0.5 + g() * 0.5,
        col: g() < 0.6 ? C.driftHi : C.core,
        dy: (g() - 0.5) * 0.4
      });
    }
    return arr;
  }, []);
  if (t < 1.55 || t > 3.2) return null;
  const p = clamp((t - 1.6) / 1.0, 0, 1);
  const e = Easing.easeOutExpo(p);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: RIFT_X,
      top: 540,
      pointerEvents: 'none'
    }
  }, r.map((m, i) => {
    const dist = m.d * e * m.sp;
    const x = Math.cos(m.a) * dist * 0.55;
    const y = Math.sin(m.a) * dist + m.dy * dist;
    const op = (1 - p) * 0.95;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'absolute',
        left: x,
        top: y,
        width: m.sz,
        height: m.sz,
        background: m.col,
        opacity: op,
        boxShadow: `0 0 6px ${m.col}`,
        imageRendering: 'pixelated'
      }
    });
  }));
}

/* white-purple flash at the moment of tearing */
function TearFlash() {
  const t = useTime();
  const g = Math.exp(-Math.pow((t - 1.98) / 0.26, 2));
  if (g < 0.01) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `radial-gradient(60% 80% at ${RIFT_X / 1920 * 100}% 50%, ${C.core} 0%, ${C.driftHi}cc 22%, ${C.drift}55 45%, transparent 70%)`,
      opacity: g * 0.92,
      mixBlendMode: 'screen'
    }
  });
}

/* ============================ phone + game HUD ============================ */
function PhoneScreen() {
  const t = useTime();
  // xp bar ticks up; a +XP float rises on a loop
  const xp = interpolate([3.0, 5.6], [0.36, 0.66], Easing.easeInOutQuad)(t);
  const floatP = (t - 3.0) % 2.2 / 2.2;
  const showFloat = t > 3.0 && floatP >= 0 && floatP < 1;
  const selPulse = 0.5 + 0.5 * Math.sin(t * 4);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: C.void
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/landing/hero_vista.svg",
    style: {
      position: 'absolute',
      left: -384 - Math.sin(t * 0.4) * 5,
      top: 0,
      width: 1004,
      height: 565,
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 150,
      top: 250
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 20,
      transform: 'translate(-50%,-50%) rotate(45deg)',
      border: `2px solid ${C.gold}`,
      opacity: 0.5 + 0.5 * selPulse,
      boxShadow: `0 0 8px ${C.gold}`
    }
  })), showFloat && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 150,
      top: 232 - floatP * 30,
      transform: 'translateX(-50%)',
      fontFamily: FONT_SILK,
      fontSize: 11,
      color: C.driftHi,
      opacity: 1 - floatP,
      textShadow: `0 1px 0 ${C.void}`
    }
  }, "+18 XP"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 8,
      top: 8,
      right: 8,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(23,19,32,0.86)',
      border: `1px solid ${C.drift}88`,
      padding: '3px 6px',
      display: 'flex',
      gap: 5,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 7,
      height: 7,
      background: C.drift,
      transform: 'rotate(45deg)',
      boxShadow: `0 0 5px ${C.drift}`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_SILK,
      fontSize: 8,
      color: C.bone,
      letterSpacing: '0.04em'
    }
  }, "S3\xB7THE DRIFT")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(23,19,32,0.86)',
      border: `1px solid ${C.gold}66`,
      padding: '3px 6px',
      display: 'flex',
      gap: 4,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      background: C.gold,
      transform: 'rotate(45deg)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_SORA,
      fontWeight: 700,
      fontSize: 10,
      color: C.goldHi
    }
  }, "1,240"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 8,
      top: 34,
      width: 46,
      height: 46,
      background: 'rgba(10,8,16,0.7)',
      border: `1px solid ${C.bone}22`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 5,
      height: 5,
      transform: 'translate(-50%,-50%)',
      background: C.drift,
      boxShadow: `0 0 5px ${C.drift}`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 7,
      background: 'rgba(10,8,16,0.8)',
      border: `1px solid ${C.bone}22`,
      marginBottom: 6,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${xp * 100}%`,
      background: `linear-gradient(90deg, ${C.driftLo}, ${C.drift})`,
      boxShadow: `0 0 6px ${C.drift}`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, [{
    c: C.ember,
    sel: false
  }, {
    c: C.gold,
    sel: true
  }, {
    c: C.water,
    sel: false
  }, {
    c: C.drift,
    sel: false
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 30,
      background: 'rgba(23,19,32,0.9)',
      border: `1px solid ${s.sel ? C.gold : C.drift + '66'}`,
      boxShadow: s.sel ? `0 0 8px ${C.gold}88` : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 11,
      height: 11,
      background: s.c,
      transform: 'rotate(45deg)',
      opacity: 0.92,
      boxShadow: `0 0 5px ${s.c}88`
    }
  }))))));
}
function Phone() {
  const t = useTime();
  if (t < 2.2) return null;
  const p = clamp((t - 2.25) / 0.95, 0, 1);
  const rise = Easing.easeOutBack(p);
  const targetTop = 244;
  const startTop = 1120;
  const bob = t > 3.2 ? Math.sin((t - 3.2) * 1.5) * 7 : 0;
  const top = startTop + (targetTop - startTop) * rise + bob;
  const op = clamp((t - 2.25) / 0.4, 0, 1);
  const W = 312,
    H = 624;
  // rim light at the base where it emerges from the rift
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: RIFT_X,
      top: 0,
      transform: 'translateX(-50%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: top,
      transform: 'translateX(-50%)',
      width: W,
      height: H,
      opacity: op
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: C.void,
      clipPath: 'polygon(0 14px,14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px))',
      boxShadow: `0 0 30px ${C.drift}aa, 0 18px 50px rgba(10,8,16,0.7)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 3,
      background: `linear-gradient(135deg, ${C.stone} 0%, ${C.ash} 60%)`,
      clipPath: 'polygon(0 12px,12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 7,
      border: `2px solid ${C.drift}`,
      clipPath: 'polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px))',
      boxShadow: `inset 0 0 12px ${C.drift}66`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 14,
      transform: 'translateX(-50%)',
      width: 54,
      height: 5,
      background: C.void,
      borderRadius: 3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      top: 30,
      right: 16,
      bottom: 30,
      overflow: 'hidden',
      boxShadow: `inset 0 0 0 1px ${C.void}`
    }
  }, /*#__PURE__*/React.createElement(PhoneScreen, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 12,
      transform: 'translateX(-50%)',
      width: 70,
      height: 4,
      background: C.boneLo,
      borderRadius: 2,
      opacity: 0.6
    }
  })));
}

/* ============================ text column (right) ============================ */
const COL_X = 1040;
function Kicker() {
  const t = useTime();
  const p = clamp((t - 2.75) / 0.5, 0, 1);
  const op = p * clamp((6 - t) / 0.3, 0, 1);
  const tx = (1 - Easing.easeOutCubic(p)) * 24;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: COL_X,
      top: 286,
      opacity: op,
      transform: `translateX(${tx}px)`,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 9,
      height: 9,
      background: C.drift,
      transform: 'rotate(45deg)',
      boxShadow: `0 0 8px ${C.drift}`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_SILK,
      fontSize: 21,
      letterSpacing: '0.16em',
      color: C.bone
    }
  }, "NOW PLAYABLE ON MOBILE"));
}
function Headline() {
  const t = useTime();
  // two lines slam in (nowrap; accent the thematic word)
  const lines = [{
    start: 3.25,
    content: /*#__PURE__*/React.createElement(React.Fragment, null, "THE GUEST ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.driftHi,
        textShadow: `0 0 24px ${C.drift}, 0 3px 0 ${C.void}`
      }
    }, "RIFT"))
  }, {
    start: 3.45,
    content: 'IS OPEN.'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: COL_X,
      top: 312
    }
  }, lines.map((ln, i) => {
    const p = clamp((t - ln.start) / 0.42, 0, 1);
    const e = Easing.easeOutBack(p);
    const op = clamp((t - ln.start) / 0.28, 0, 1) * clamp((6 - t) / 0.3, 0, 1);
    const sc = 0.84 + 0.16 * e;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontFamily: FONT_PIX,
        fontWeight: 700,
        fontSize: 82,
        lineHeight: 1.06,
        color: C.boneHi,
        whiteSpace: 'nowrap',
        opacity: op,
        transform: `scale(${sc})`,
        transformOrigin: 'left center',
        textShadow: `0 3px 0 ${C.void}, 0 0 18px rgba(168,85,247,0.22)`,
        letterSpacing: '0.01em'
      }
    }, ln.content);
  }));
}
function Subline() {
  const t = useTime();
  const p = clamp((t - 4.0) / 0.5, 0, 1);
  const op = p * clamp((6 - t) / 0.3, 0, 1);
  const tx = (1 - Easing.easeOutCubic(p)) * 20;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: COL_X,
      top: 560,
      opacity: op,
      transform: `translateX(${tx}px)`,
      width: 760
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_SORA,
      fontWeight: 400,
      fontSize: 30,
      lineHeight: 1.45,
      color: C.bone
    }
  }, "No account. No wallet. ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.boneMid
    }
  }, "Step through"), /*#__PURE__*/React.createElement("br", null), "as a guest \u2014 the realm is ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.driftHi,
      fontWeight: 600
    }
  }, "open to all"), "."));
}
function CTA() {
  const t = useTime();
  const p = clamp((t - 4.55) / 0.5, 0, 1);
  const e = Easing.easeOutBack(p);
  const op = clamp((t - 4.55) / 0.32, 0, 1) * clamp((6 - t) / 0.3, 0, 1);
  const glow = 0.6 + 0.4 * Math.sin(t * 3);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: COL_X,
      top: 706,
      opacity: op,
      transform: `scale(${0.9 + 0.1 * e})`,
      transformOrigin: 'left center',
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/brand/emblem-64.svg",
    style: {
      width: 64,
      height: 64,
      display: 'block',
      filter: `drop-shadow(0 0 ${8 * glow}px ${C.drift})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_PIX,
      fontWeight: 600,
      fontSize: 44,
      color: C.goldHi,
      letterSpacing: '0.02em',
      textShadow: `0 2px 0 ${C.void}`
    }
  }, "naevyr.com"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_SILK,
      fontSize: 13,
      letterSpacing: '0.22em',
      color: C.boneMid
    }
  }, "FREE TO PLAY \xB7 NO DOWNLOAD")));
}

/* ============================ framing ============================ */
function Scrims() {
  const t = useTime();
  const rightScrim = clamp((t - 2.6) / 0.8, 0, 1) * 0.5; // darken right side as text comes
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `linear-gradient(90deg, transparent 38%, rgba(10,8,16,${rightScrim * 0.7}) 62%, rgba(10,8,16,${rightScrim}) 100%)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, rgba(10,8,16,0.45) 0%, transparent 18%, transparent 80%, rgba(10,8,16,0.5) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      boxShadow: 'inset 0 0 220px 60px rgba(10,8,16,0.85)'
    }
  }));
}

// loop seam: brief fade from/to black at the ends
function LoopFade() {
  const t = useTime();
  const inFade = clamp((0.32 - t) / 0.32, 0, 1);
  const outFade = clamp((t - 5.7) / 0.3, 0, 1);
  const op = Math.max(inFade, outFade * 0.82);
  if (op < 0.01) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: C.void,
      opacity: op,
      pointerEvents: 'none'
    }
  });
}

/* ============================ root ============================ */
function NaevyrAnnounce() {
  const t = useTime();
  // gentle global push-in
  const cam = interpolate([0, 6], [1.0, 1.055], Easing.easeOutSine)(t);
  React.useEffect(() => {
    const root = document.getElementById('anim-root');
    if (root) root.setAttribute('data-screen-label', `t=${t.toFixed(1)}s`);
  }, [Math.floor(t)]);
  return /*#__PURE__*/React.createElement("div", {
    id: "anim-root",
    "data-screen-label": "t=0.0s",
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: C.void
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      transform: `scale(${cam})`,
      transformOrigin: '42% 50%'
    }
  }, /*#__PURE__*/React.createElement(Backdrop, null), /*#__PURE__*/React.createElement(Rift, null), /*#__PURE__*/React.createElement(TearBurst, null), /*#__PURE__*/React.createElement(Motes, null), /*#__PURE__*/React.createElement(Phone, null), /*#__PURE__*/React.createElement(TearFlash, null), /*#__PURE__*/React.createElement(Scrims, null), /*#__PURE__*/React.createElement(Kicker, null), /*#__PURE__*/React.createElement(Headline, null), /*#__PURE__*/React.createElement(Subline, null), /*#__PURE__*/React.createElement(CTA, null)), /*#__PURE__*/React.createElement(LoopFade, null));
}
window.NaevyrAnnounce = NaevyrAnnounce;
})(); } catch (e) { __ds_ns.__errors.push({ path: "naevyr_scenes.jsx", error: String((e && e.message) || e) }); }

// reel-common.js
try { (() => {
// Naevyr tweet-reel helpers — tiny canvas sprite-loop engine. No deps.
(function (g) {
  function loadImg(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  }
  // fixed WxH canvas, scaled to fit viewport, black letterbox; calls draw(ctx, tLoopMs, tAbsMs) each frame
  function makeStage(W, H, loopMs, draw) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:#06040a;display:flex;align-items:center;justify-content:center;overflow:hidden';
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    cv.style.cssText = 'image-rendering:pixelated;box-shadow:0 20px 80px rgba(0,0,0,.6)';
    wrap.appendChild(cv);
    document.body.appendChild(wrap);
    const ctx = cv.getContext('2d');
    function fit() {
      const s = Math.min(innerWidth / W, innerHeight / H);
      cv.style.width = W * s + 'px';
      cv.style.height = H * s + 'px';
    }
    fit();
    addEventListener('resize', fit);
    const t0 = performance.now();
    function frame(now) {
      const ta = now - t0;
      try {
        ctx.imageSmoothingEnabled = false;
        draw(ctx, ta % loopMs, ta);
      } catch (e) {
        window.__err = e && (e.stack || e.message) || String(e);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  // draw frame `col,row` of a sheet (cell fw×fh) centred at (cx,cy) scaled, pixelated
  function spr(ctx, img, fw, fh, col, row, cx, cy, sc) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, col * fw, (row || 0) * fh, fw, fh, Math.round(cx - fw * sc / 2), Math.round(cy - fh * sc), fw * sc, fh * sc);
  }
  // bottom-anchored variant (cy = baseline of feet)
  function sprBase(ctx, img, fw, fh, col, cx, baseY, sc) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, col * fw, 0, fw, fh, Math.round(cx - fw * sc / 2), Math.round(baseY - fh * sc), fw * sc, fh * sc);
  }
  function radial(ctx, x, y, r, stops) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach(s => gr.addColorStop(s[0], s[1]));
    return gr;
  }
  function vignette(ctx, W, H, strength) {
    ctx.fillStyle = radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.62, [[0.55, 'rgba(6,4,10,0)'], [1, 'rgba(6,4,10,' + (strength || 0.9) + ')']]);
    ctx.fillRect(0, 0, W, H);
  }
  // drifting motes
  function motes(ctx, W, H, t, n, color, seed) {
    seed = seed || 1;
    const s = (i, k) => {
      const v = Math.sin(i * 12.9898 + k * 78.233 + seed) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < n; i++) {
      const sp = 6 + s(i, 1) * 14,
        y = ((s(i, 2) * (H + 40) - t / 1000 * sp * 14) % (H + 40) + (H + 40)) % (H + 40) - 20;
      const x = s(i, 3) * W + Math.sin(t / 1000 * 0.5 + i) * (8 + s(i, 4) * 20);
      const op = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t / 1000 * (0.5 + s(i, 5)) + i));
      ctx.globalAlpha = op;
      ctx.fillStyle = color;
      const sz = s(i, 6) < 0.8 ? 2 : 3;
      ctx.fillRect(Math.round(x), Math.round(y), sz, sz);
    }
    ctx.globalAlpha = 1;
  }
  // pick the active clip from a list of {at, ...} given loop time (ms)
  function phase(tMs, segs) {
    let cur = segs[0];
    for (const s of segs) {
      if (tMs >= s.at) cur = s;
    }
    return cur;
  }
  g.Reel = {
    loadImg,
    makeStage,
    spr,
    sprBase,
    radial,
    vignette,
    motes,
    phase
  };
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "reel-common.js", error: String((e && e.message) || e) }); }

// ui_kits/hud/Hud.jsx
try { (() => {
/* Naevyr UI kit — the HUD overlay.
   Composes the design-system components (Panel, Hotbar, XPBar, Slot,
   ActivityLog, SeasonBadge, Button, Icon) into the full in-game HUD,
   sitting over the canvas world. Light interactivity: pick a tool,
   gather → XP + loot + log. */

const NS = window.DriftLandsDesignSystem_3de3e2 || window[Object.keys(window).find(k => k.startsWith('DriftLandsDesignSystem'))];
const {
  Panel,
  Button,
  Badge,
  SeasonBadge,
  Slot,
  Hotbar,
  XPBar,
  ActivityLog,
  Icon
} = NS;
const TOOLS = [{
  name: 'Axe',
  icon: 'axe',
  skill: 'Woodcutting',
  loot: 'Ashen log',
  lootIcon: 'log',
  xp: 128
}, {
  name: 'Pickaxe',
  icon: 'pickaxe',
  skill: 'Mining',
  loot: 'Drift ore',
  lootIcon: 'ore',
  xp: 96
}, {
  name: 'Rod',
  icon: 'rod',
  skill: 'Fishing',
  loot: 'Pale carp',
  lootIcon: 'fish',
  xp: 74
}, {
  name: 'Sword',
  icon: 'sword',
  skill: null
}, {
  name: 'Ward',
  icon: 'ward',
  skill: null
}, {
  name: 'Sigil',
  icon: 'sigil',
  skill: null,
  rarity: 'epic'
}];
const SKILL_COLOR = {
  Woodcutting: 'var(--skill-woodcutting)',
  Mining: 'var(--skill-mining)',
  Fishing: 'var(--skill-fishing)'
};
const SKILL_ICON = {
  Woodcutting: 'axe',
  Mining: 'pickaxe',
  Fishing: 'rod'
};
function Vitals({
  hearts,
  shards
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    padded: false,
    corners: false,
    style: {
      padding: '8px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(Icon, {
    key: i,
    name: "heart",
    size: 16,
    style: {
      opacity: i < hearts ? 1 : 0.18
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin",
    size: 16,
    glow: true
  }), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--drift-gold)',
      textShadow: 'var(--text-shadow-hud)'
    }
  }, shards.toLocaleString()))));
}
function HUD() {
  const [sel, setSel] = React.useState(0);
  const [xp, setXp] = React.useState({
    Woodcutting: {
      level: 42,
      value: 6280,
      max: 9000
    },
    Mining: {
      level: 31,
      value: 3400,
      max: 7200
    },
    Fishing: {
      level: 28,
      value: 5100,
      max: 6400
    }
  });
  const [shards, setShards] = React.useState(1284);
  const [log, setLog] = React.useState([{
    kind: 'drift',
    text: 'The Drift crept into Hollowmere.'
  }, {
    kind: 'info',
    text: 'A rock vein re-formed nearby.'
  }, {
    kind: 'loot',
    text: 'Ashen log',
    meta: 'x2'
  }]);
  const [bag, setBag] = React.useState([{
    icon: 'log',
    count: 64,
    rarity: 'common'
  }, {
    icon: 'ore',
    count: 18,
    rarity: 'rare'
  }, {
    icon: 'fish',
    count: 7,
    rarity: 'uncommon'
  }, {
    icon: 'coin',
    count: '1.2k',
    rarity: 'legendary'
  }]);
  const [progress, setProgress] = React.useState(null); // 0..1 while gathering
  const [floaters, setFloaters] = React.useState([]);
  const timer = React.useRef(null);
  const tool = TOOLS[sel];
  const canGather = !!tool.skill && progress === null;
  function gather() {
    if (!canGather) return;
    let p = 0;
    setProgress(0);
    timer.current = setInterval(() => {
      p += 0.04;
      if (p >= 1) {
        clearInterval(timer.current);
        setProgress(null);
        // rewards
        const t = TOOLS[sel];
        setXp(prev => {
          const s = {
            ...prev[t.skill]
          };
          s.value = Math.min(s.max, s.value + t.xp);
          if (s.value >= s.max) {
            s.level += 1;
            s.value = s.value - s.max;
          }
          return {
            ...prev,
            [t.skill]: s
          };
        });
        setShards(v => v + 12);
        const fid = Date.now();
        setFloaters(f => [...f, {
          id: fid,
          text: `+${t.xp} XP`,
          kind: 'xp'
        }, {
          id: fid + 1,
          text: '+12',
          kind: 'gold'
        }]);
        setTimeout(() => setFloaters(f => f.filter(x => x.id !== fid && x.id !== fid + 1)), 1100);
        setLog(l => [{
          kind: 'xp',
          text: t.skill,
          meta: `+${t.xp} XP`
        }, {
          kind: 'loot',
          text: t.loot,
          meta: 'x1'
        }, ...l].slice(0, 7));
        setBag(b => {
          const idx = b.findIndex(x => x.icon === t.lootIcon);
          if (idx >= 0) {
            const n = [...b];
            n[idx] = {
              ...n[idx],
              count: (parseInt(n[idx].count) || 0) + 1
            };
            return n;
          }
          return [...b, {
            icon: t.lootIcon,
            count: 1,
            rarity: 'common'
          }];
        });
      } else setProgress(p);
    }, 60);
  }
  React.useEffect(() => () => clearInterval(timer.current), []);
  const bagSlots = Array.from({
    length: 12
  }, (_, i) => bag[i] || null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        .hud-region { position: absolute; pointer-events: auto; }
        @keyframes floatUp { 0% { transform: translate(-50%,0); opacity: 1; } 100% { transform: translate(-50%,-46px); opacity: 0; } }
        .floater { position:absolute; left:50%; bottom:64px; transform:translateX(-50%); animation: floatUp 1.1s steps(10) forwards;
          font-family: var(--font-num); font-weight:700; font-size:16px; text-shadow: var(--text-shadow-hud); }
      `), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      top: 16,
      left: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    season: 3,
    name: "Ashfall",
    driftPct: 42
  }), /*#__PURE__*/React.createElement(Vitals, {
    hearts: 4,
    shards: shards
  })), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Satchel",
    title: "Inventory",
    style: {
      width: 232
    },
    accessory: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, bag.length, "/24")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--slot-gap)'
    }
  }, bagSlots.map((it, i) => /*#__PURE__*/React.createElement(Slot, {
    key: i,
    size: 48,
    icon: it ? /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 30
    }) : null,
    count: it ? it.count : null,
    rarity: it ? it.rarity : null
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      left: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Skills",
    title: "Gathering",
    style: {
      width: 264
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13
    }
  }, ['Woodcutting', 'Mining', 'Fishing'].map(s => /*#__PURE__*/React.createElement(XPBar, {
    key: s,
    skill: s,
    level: xp[s].level,
    value: xp[s].value,
    max: xp[s].max,
    color: SKILL_COLOR[s],
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: SKILL_ICON[s],
      size: 16
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Realm",
    title: "Activity",
    style: {
      width: 248
    }
  }, /*#__PURE__*/React.createElement(ActivityLog, {
    entries: log,
    max: 7
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 'calc(50% + 36px)',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none'
    }
  }, progress !== null && /*#__PURE__*/React.createElement("svg", {
    width: "64",
    height: "64",
    viewBox: "0 0 64 64",
    style: {
      filter: 'drop-shadow(0 0 4px rgba(168,85,247,.8))'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    fill: "none",
    stroke: "rgba(10,8,16,.7)",
    strokeWidth: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    fill: "none",
    stroke: "#a855f7",
    strokeWidth: "6",
    strokeDasharray: 2 * Math.PI * 26,
    strokeDashoffset: (1 - progress) * 2 * Math.PI * 26,
    transform: "rotate(-90 32 32)",
    strokeLinecap: "butt"
  })), floaters.map((f, i) => /*#__PURE__*/React.createElement("span", {
    key: f.id,
    className: "floater",
    style: {
      color: f.kind === 'gold' ? 'var(--drift-gold)' : 'var(--drift-corrupt)',
      left: `calc(50% + ${i % 2 ? 22 : -22}px)`
    }
  }, f.text))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: canGather ? 'primary' : 'ghost',
    size: "md",
    onClick: gather,
    disabled: !canGather,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: tool.icon,
      size: 16
    })
  }, progress !== null ? 'Gathering…' : tool.skill ? `${tool.skill}` : `${tool.name} equipped`), /*#__PURE__*/React.createElement(Hotbar, {
    selected: sel,
    onSelect: setSel,
    slots: TOOLS.map(t => ({
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: t.icon,
        size: 32
      }),
      name: t.name,
      rarity: t.rarity
    }))
  })));
}
window.HUD = HUD;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hud/Hud.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hud/Scene.jsx
try { (() => {
/* Naevyr UI kit — representative isometric world backdrop.
   NOT part of the design system: the real world is Canvas sprites
   handled by the engine. This is a stand-in so the HUD can be shown
   reading over a busy, moving scene. Iso 2:1, tiles 64×32. */

function IsoScene({
  driftPct = 42
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let raf,
      t = 0;
    const TW = 64,
      TH = 32; // tile diamond
    const COLS = 16,
      ROWS = 16;
    const PAL = {
      grass: ['#4d7c4d', '#356037', '#20402a'],
      dirt: ['#50402e', '#36291c', '#241a11'],
      stone: ['#322b46', '#211c30', '#14101e'],
      water: ['#2c5775', '#173a52', '#0d2336'],
      drift: ['#a855f7', '#6b21a8', '#3b1162']
    };
    // deterministic terrain map
    const map = [];
    for (let gy = 0; gy < ROWS; gy++) {
      const r = [];
      for (let gx = 0; gx < COLS; gx++) {
        const n = Math.sin(gx * 1.7) + Math.cos(gy * 1.3) + Math.sin((gx + gy) * 0.6);
        let type = 'grass';
        if (n < -1.3) type = 'water';else if (n < -0.5) type = 'dirt';else if (n > 1.4) type = 'stone';
        r.push({
          type,
          corrupt: gx + gy > (COLS + ROWS) * (1 - driftPct / 100) && Math.sin(gx * 2.1 + gy) > -0.2
        });
      }
      map.push(r);
    }
    // objects: trees/rocks at a few tiles
    const objs = [{
      gx: 3,
      gy: 5,
      kind: 'tree'
    }, {
      gx: 6,
      gy: 3,
      kind: 'tree'
    }, {
      gx: 10,
      gy: 6,
      kind: 'tree'
    }, {
      gx: 12,
      gy: 9,
      kind: 'rock'
    }, {
      gx: 4,
      gy: 10,
      kind: 'rock'
    }, {
      gx: 8,
      gy: 8,
      kind: 'player'
    }];
    function resize() {
      const r = cv.getBoundingClientRect();
      cv.width = r.width;
      cv.height = r.height;
    }
    resize();
    window.addEventListener('resize', resize);
    function isoX(gx, gy, ox) {
      return ox + (gx - gy) * (TW / 2);
    }
    function isoY(gx, gy, oy) {
      return oy + (gx + gy) * (TH / 2);
    }
    function diamond(cx, cy, fill, edge) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - TH / 2);
      ctx.lineTo(cx + TW / 2, cy);
      ctx.lineTo(cx, cy + TH / 2);
      ctx.lineTo(cx - TW / 2, cy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (edge) {
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    function draw() {
      const W = cv.width,
        H = cv.height;
      // sky / void wash
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(0, 0, W, H);
      const ox = W / 2,
        oy = H / 2 - (COLS + ROWS) * TH / 4 + 40;

      // ground
      for (let gy = 0; gy < ROWS; gy++) {
        for (let gx = 0; gx < COLS; gx++) {
          const cell = map[gy][gx];
          const cx = isoX(gx, gy, ox),
            cy = isoY(gx, gy, oy);
          const ramp = PAL[cell.type];
          diamond(cx, cy, ramp[0], 'rgba(10,8,16,0.35)');
          // south shading lip
          ctx.fillStyle = ramp[1];
          ctx.beginPath();
          ctx.moveTo(cx - TW / 2, cy);
          ctx.lineTo(cx, cy + TH / 2);
          ctx.lineTo(cx, cy + TH / 2 + 3);
          ctx.lineTo(cx - TW / 2, cy + 3);
          ctx.closePath();
          ctx.fill();
          if (cell.type === 'water') {
            // shimmer
            const sh = (Math.sin(t / 22 + gx + gy) + 1) / 2;
            ctx.fillStyle = `rgba(120,180,210,${0.06 + sh * 0.10})`;
            diamond(cx, cy - 1, ctx.fillStyle, null);
          }
          if (cell.corrupt) {
            const pulse = 0.18 + (Math.sin(t / 30 + gx - gy) + 1) / 2 * 0.16;
            ctx.fillStyle = `rgba(168,85,247,${pulse})`;
            diamond(cx, cy, ctx.fillStyle, null);
          }
        }
      }

      // objects (depth sorted by gx+gy)
      [...objs].sort((a, b) => a.gx + a.gy - (b.gx + b.gy)).forEach(o => {
        const cx = isoX(o.gx, o.gy, ox),
          cy = isoY(o.gx, o.gy, oy);
        if (o.kind === 'tree') {
          ctx.fillStyle = '#241a11';
          ctx.fillRect(cx - 3, cy - 14, 6, 16); // trunk
          ctx.fillStyle = '#36291c';
          ctx.fillRect(cx - 1, cy - 14, 2, 16);
          ctx.fillStyle = '#356037';
          ctx.fillRect(cx - 12, cy - 40, 24, 28); // canopy
          ctx.fillStyle = '#4d7c4d';
          ctx.fillRect(cx - 12, cy - 40, 18, 22);
          ctx.fillStyle = '#7fae5e';
          ctx.fillRect(cx - 10, cy - 38, 8, 8);
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 12, cy - 41, 24, 1);
        } else if (o.kind === 'rock') {
          ctx.fillStyle = '#211c30';
          ctx.fillRect(cx - 12, cy - 14, 24, 14);
          ctx.fillStyle = '#322b46';
          ctx.fillRect(cx - 12, cy - 14, 18, 10);
          ctx.fillStyle = '#4a4360';
          ctx.fillRect(cx - 10, cy - 12, 6, 4);
          ctx.fillStyle = '#e7c873';
          ctx.fillRect(cx - 2, cy - 8, 3, 3); // ore fleck
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 12, cy - 15, 24, 1);
        } else if (o.kind === 'player') {
          // hooded wanderer
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 7, cy - 30, 14, 30);
          ctx.fillStyle = '#2a2438';
          ctx.fillRect(cx - 6, cy - 28, 12, 26); // cloak
          ctx.fillStyle = '#171320';
          ctx.fillRect(cx - 5, cy - 22, 10, 5); // hood shadow
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(cx - 3, cy - 21, 2, 2); // drift eyes
          ctx.fillStyle = '#d8b4fe';
          ctx.fillRect(cx + 1, cy - 21, 2, 2);
          ctx.fillStyle = '#6b21a8';
          ctx.fillRect(cx - 6, cy - 6, 12, 2); // drift hem glow
        }
      });

      // ambient drift motes + ash
      for (let i = 0; i < 26; i++) {
        const mx = (i * 97 + t * (0.3 + i % 3 * 0.2)) % W;
        const my = (i * 53 + Math.sin(t / 40 + i) * 18 + t * 0.15) % H;
        const drift = i % 4 === 0;
        ctx.fillStyle = drift ? 'rgba(168,85,247,0.8)' : 'rgba(216,207,224,0.25)';
        ctx.fillRect(W - mx, my, drift ? 2 : 1, drift ? 2 : 1);
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [driftPct]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "drift-pixel",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      imageRendering: 'pixelated'
    }
  });
}
window.IsoScene = IsoScene;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hud/Scene.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.SeasonBadge = __ds_scope.SeasonBadge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.ActivityLog = __ds_scope.ActivityLog;

__ds_ns.Hotbar = __ds_scope.Hotbar;

__ds_ns.Slot = __ds_scope.Slot;

__ds_ns.XPBar = __ds_scope.XPBar;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.TOOL_NAMES = __ds_scope.TOOL_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

})();
