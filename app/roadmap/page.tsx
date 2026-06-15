"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./roadmap.css";

// THE LONG ROAD: interactive roadmap. A winding trail the visitor walks INTO
// the Drift: near milestones bright/gold, far ones dim/purple/half-swallowed.
// Scroll / drag / wheel / arrows move along it; clicking a waystation reveals
// its card. Desktop = horizontal journey, mobile = vertical descent.
// Ported from public/assets/naevyr-roadmap/Naevyr Roadmap.html (logic kept
// imperative inside one useEffect, scoped to the root ref; styles in roadmap.css).

type Mile = {
  n: string;
  title: string;
  status: string;
  near?: boolean;
  /** shipped + live — lit gold like a near milestone, marked walked */
  done?: boolean;
  tag: string;
  lede: string;
  items: string[];
  foot: string;
};

const MILES: Mile[] = [
  {
    n: "I", title: "The Drift Ledger", status: "Walked. It's live.", done: true,
    tag: "A pass for those who keep walking.",
    lede: "Four weeks to a season. Marks are earned by walking, gathering, fighting, surviving. The first season runs now.",
    items: ["Four-week seasons", "Tiers pay cosmetics and coin", "Each season strikes one relic"],
    foot: "Earned, never given.",
  },
  {
    n: "II", title: "The Wider Realm", status: "Nearly here", near: true,
    tag: "Carved, and nearly walked.",
    lede: "The map breaks its bounds. A true frontier opens past the old edge, and the Drift comes with it.",
    items: ["New outposts and war camps", "New beasts, new mini-bosses", "Drift Rifts tear the ground open", "The Blood Moon turns the night against you"],
    foot: "The frontier opens.",
  },
  {
    n: "III", title: "Guild Wars", status: "Forming",
    tag: "Banners clash over the wild quadrants.",
    lede: "Rival claims over open ground. Hold the quadrant, or bleed for it.",
    items: ["Contest the wild quadrants", "Upkeep bleeds the war-chest", "Perks worth fighting for"],
    foot: "Ground is held, not owned.",
  },
  {
    n: "IV", title: "The Living Economy", status: "Tuning",
    tag: "The coin must keep flowing.",
    lede: "The Exchange opens. Sinks and burn rites tuned by hand as the realm fills.",
    items: ["Rates and limits shift", "Sinks and burn rites", "New ways to spend DRIFTS"],
    foot: "Tuned, while you sleep.",
  },
  {
    n: "V", title: "The Realm Goes Live", status: "The horizon",
    tag: "Beta ends. The realm stands.",
    lede: "The veil of beta lifts. The realm opens in full, hardened by every step that came before it.",
    items: ["Beta becomes the live realm", "Every system proven and standing", "The door open to all who come"],
    foot: "Not beta. Live.",
  },
];

export default function RoadmapPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T | null;

    // lock the page behind the full-screen takeover
    const prevHtmlOf = document.documentElement.style.overflow;
    const prevBodyOf = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const trail = q<HTMLDivElement>("#trail")!;
    const track = q<HTMLDivElement>("#track")!;
    const lineSvg = q<SVGSVGElement>("#line")!;
    const rail = q<HTMLDivElement>("#rail")!;
    const fog = q<HTMLDivElement>("#fog")!;
    const dither = q<HTMLDivElement>("#dither")!;
    const fillEl = q<HTMLDivElement>("#fill")!;
    const pctEl = q<HTMLDivElement>("#pct")!;
    const cv = q<HTMLCanvasElement>("#particles")!;
    const ctx = cv.getContext("2d")!;
    const ridgeFar = q<SVGSVGElement>("#ridgeFar")!;
    const ridgeNear = q<SVGSVGElement>("#ridgeNear")!;

    const reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    let isMobile = false;
    let progress = 0;
    type Node = { el: HTMLButtonElement; i: number; x: number; y: number };
    let nodes: Node[] = [];
    const GAP = 470;

    const clarity = (i: number) => Math.max(0.42, 1 - i * 0.155);

    function obelisk(i: number) {
      const c = clarity(i);
      const bright = MILES[i].near || MILES[i].done; // shipped + imminent both glow gold
      const runeFill = bright ? "var(--gold)" : "var(--pur)";
      const glow = bright ? "rgba(231,200,115,.55)" : "rgba(168,85,247,.4)";
      return `
      <svg class="ob" width="76" height="132" viewBox="0 0 76 132" style="opacity:${MILES[i].done ? 1 : c}; filter:drop-shadow(0 0 ${bright ? 14 : 8}px ${glow});" aria-hidden="true">
        <polygon points="30,18 46,18 50,108 26,108" fill="#160f24" stroke="#060409" stroke-width="2"/>
        <polygon points="30,18 38,18 36,108 26,108" fill="rgba(124,58,237,0.16)"/>
        <polygon points="33,4 43,4 46,18 30,18" fill="#1c1330" stroke="#060409" stroke-width="2"/>
        <rect x="18" y="108" width="40" height="12" fill="#160f24" stroke="#060409" stroke-width="2"/>
        <rect x="12" y="120" width="52" height="8" fill="#120c1d" stroke="#060409" stroke-width="2"/>
        <rect x="33" y="50" width="10" height="10" transform="rotate(45 38 55)" fill="${runeFill}" stroke="#060409" stroke-width="1.5"/>
      </svg>`;
    }

    function buildNodes() {
      nodes.forEach((n) => n.el.remove());
      nodes = [];
      MILES.forEach((m, i) => {
        const el = document.createElement("button");
        el.className = "way" + (m.near ? " near" : "") + (m.done ? " done" : "");
        el.setAttribute("data-i", String(i));
        el.setAttribute("aria-label", `${m.title}. Status: ${m.status}. Click to reveal.`);
        el.innerHTML = `
          <div class="fogblob"></div>
          <div class="stone">${obelisk(i)}</div>
          <div class="meta">
            <span class="num">${m.n}</span>
            <span class="status">${m.status}</span>
            <h3 class="title">${m.title}</h3>
            <p class="tag">${m.tag}</p>
          </div>
          <div class="card">
            <span class="c-status">${m.status}</span>
            <h4 class="c-title">${m.title}</h4>
            <p class="c-lede">${m.lede}</p>
            <ul>${m.items.map((it) => `<li>${it}</li>`).join("")}</ul>
            <div class="c-foot"><span>${m.foot}</span><button class="c-close" data-close>Seal &times;</button></div>
          </div>`;
        track.appendChild(el);
        nodes.push({ el, i, x: 0, y: 0 });

        el.addEventListener("click", (e) => {
          if (el.dataset.dragged === "1") return;
          if ((e.target as Element).closest("[data-close]")) { close(el); return; }
          toggle(el);
        });
      });

      const w = document.createElement("div");
      w.className = "wanderer"; w.id = "wanderer";
      w.innerHTML = `<div class="pip"></div><div class="lab">YOU ARE HERE</div><div class="sub">the present &middot; the road runs forward</div>`;
      track.appendChild(w);

      const ec = document.createElement("div");
      ec.className = "endcap"; ec.id = "endcap";
      ec.innerHTML = `<div class="glyph">&#10070;</div><div class="t">the realm goes live</div>`;
      track.appendChild(ec);
    }

    function buildRail() {
      rail.innerHTML = "";
      MILES.forEach((m, i) => {
        if (i > 0) { const b = document.createElement("span"); b.className = "bar"; rail.appendChild(b); }
        const s = document.createElement("button");
        s.className = "seg"; s.setAttribute("data-i", String(i));
        s.innerHTML = `<span class="dot"></span><span class="rl">${m.n}</span>`;
        s.addEventListener("click", () => jumpTo(i));
        rail.appendChild(s);
      });
    }

    function layout() {
      isMobile = window.innerWidth <= 760;
      root!.classList.toggle("is-mobile", isMobile);
      const H = trail.clientHeight, W = trail.clientWidth;
      const wander = q<HTMLDivElement>("#wanderer")!;
      const endcap = q<HTMLDivElement>("#endcap")!;

      if (!isMobile) {
        const yFrac = [0.6, 0.4, 0.63, 0.37, 0.55];
        const startX = W * 0.42;
        nodes.forEach((n, i) => { n.x = startX + i * GAP; n.y = H * yFrac[i]; });
        const totalW = startX + (nodes.length - 1) * GAP + W * 0.55;
        track.style.width = totalW + "px";
        track.style.height = "100%";

        nodes.forEach((n) => {
          n.el.style.left = n.x + "px"; n.el.style.top = n.y + "px";
          n.el.style.scrollSnapAlign = "center";
          placeCard(n);
        });
        wander.style.left = (W * 0.16) + "px"; wander.style.top = (H * 0.52) + "px";
        endcap.style.left = (totalW - W * 0.22) + "px"; endcap.style.top = (H * 0.5) + "px";

        drawLine(W, H, totalW, false);
      } else {
        const stepY = 360, topPad = 150;
        // gentle wind, kept tight so the (narrower) mobile cards never clip the edges
        const xOff = [0.5, 0.58, 0.42, 0.58, 0.46];
        nodes.forEach((n, i) => { n.x = W * xOff[i]; n.y = topPad + i * stepY; });
        const totalH = topPad + (nodes.length - 1) * stepY + 420;
        track.style.width = "100%";
        track.style.height = totalH + "px";

        nodes.forEach((n) => {
          n.el.style.left = n.x + "px"; n.el.style.top = n.y + "px";
          n.el.style.scrollSnapAlign = "center";
          (n.el.querySelector(".card") as HTMLElement).className = "card below";
        });
        wander.style.left = (W * 0.5) + "px"; wander.style.top = "70px";
        endcap.style.left = (W * 0.5) + "px"; endcap.style.top = (totalH - 150) + "px";

        drawLine(W, totalH, 0, true);
      }
      sizeCanvas();
      onScroll();
    }

    function placeCard(n: Node) {
      const card = n.el.querySelector(".card") as HTMLElement;
      const H = trail.clientHeight;
      card.className = "card " + (n.y < H * 0.5 ? "below" : "above");
    }

    function smoothPath(pts: { x: number; y: number }[]) {
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
      }
      return d;
    }

    function drawLine(W: number, H: number, totalW: number, vertical: boolean) {
      const svgW = vertical ? W : totalW;
      const svgH = H;
      lineSvg.setAttribute("width", String(svgW));
      lineSvg.setAttribute("height", String(svgH));
      lineSvg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);

      const wEl = q<HTMLDivElement>("#wanderer")!;
      const eEl = q<HTMLDivElement>("#endcap")!;
      const pts = [
        { x: parseFloat(wEl.style.left), y: parseFloat(wEl.style.top) },
        ...nodes.map((n) => ({ x: n.x, y: n.y })),
        { x: parseFloat(eEl.style.left), y: parseFloat(eEl.style.top) },
      ];
      const d = smoothPath(pts);
      const dir = vertical ? "0%,0%,0%,100%" : "0%,0%,100%,0%";
      const [x1, y1, x2, y2] = dir.split(",");
      const flowAnim = reduced ? "" : "line-flow";

      lineSvg.innerHTML = `
        <defs>
          <linearGradient id="lg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
            <stop offset="0%" stop-color="#e7c873"/>
            <stop offset="22%" stop-color="#e7c873"/>
            <stop offset="48%" stop-color="#a855f7"/>
            <stop offset="78%" stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#3a2560"/>
          </linearGradient>
          <linearGradient id="lgGlow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
            <stop offset="0%" stop-color="rgba(231,200,115,0.55)"/>
            <stop offset="50%" stop-color="rgba(168,85,247,0.45)"/>
            <stop offset="100%" stop-color="rgba(124,58,237,0.05)"/>
          </linearGradient>
          <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6"/>
          </filter>
        </defs>
        <path d="${d}" fill="none" stroke="url(#lgGlow)" stroke-width="14" stroke-linecap="round" filter="url(#soft)" opacity="0.9"/>
        <path d="${d}" fill="none" stroke="url(#lg)" stroke-width="2.5" stroke-linecap="round" opacity="0.92"/>
        <path class="${flowAnim}" d="${d}" fill="none" stroke="#d8b8ff" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
      `;
    }

    let ticking = false;
    function onScroll() {
      const max = isMobile
        ? (trail.scrollHeight - trail.clientHeight)
        : (trail.scrollWidth - trail.clientWidth);
      const pos = isMobile ? trail.scrollTop : trail.scrollLeft;
      progress = max > 0 ? Math.min(1, Math.max(0, pos / max)) : 0;

      const p = Math.round(progress * 100);
      fillEl.style.width = p + "%";
      pctEl.textContent = p + "%";

      fog.style.opacity = (0.15 + progress * 0.85).toFixed(3);
      dither.style.opacity = (progress * 0.7).toFixed(3);

      if (!isMobile) {
        ridgeFar.style.transform = `translateX(${-pos * 0.06}px)`;
        ridgeNear.style.transform = `translateX(${-pos * 0.13}px)`;
      } else {
        ridgeFar.style.transform = ""; ridgeNear.style.transform = "";
      }

      const centre = isMobile ? pos + trail.clientHeight / 2 : pos + trail.clientWidth / 2;
      let best = 0, bd = Infinity;
      nodes.forEach((n) => { const c = isMobile ? n.y : n.x; const dd = Math.abs(c - centre); if (dd < bd) { bd = dd; best = n.i; } });
      nodes.forEach((n) => n.el.classList.toggle("active", n.i === best));
      [...rail.querySelectorAll(".seg")].forEach((s) => s.classList.toggle("on", +(s as HTMLElement).dataset.i! === best));
    }

    const onScrollEvt = () => { if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; } };
    trail.addEventListener("scroll", onScrollEvt, { passive: true });

    const onWheel = (e: WheelEvent) => {
      if (isMobile) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        trail.scrollLeft += e.deltaY;
      }
    };
    trail.addEventListener("wheel", onWheel, { passive: false });

    let down = false, sx = 0, sl = 0, moved = 0, activeWay: HTMLElement | null = null;
    const onPointerDown = (e: PointerEvent) => {
      down = true; moved = 0; sx = e.clientX; sl = trail.scrollLeft;
      activeWay = (e.target as Element).closest(".way");
      if (activeWay) activeWay.dataset.dragged = "0";
      trail.classList.add("dragging");
    };
    trail.addEventListener("pointerdown", onPointerDown);
    const onPointerMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(e.clientY - 0));
      if (isMobile) return;
      trail.scrollLeft = sl - dx;
      if (Math.abs(dx) > 6 && activeWay) activeWay.dataset.dragged = "1";
    };
    window.addEventListener("pointermove", onPointerMove);
    const onPointerUp = () => {
      down = false; trail.classList.remove("dragging");
      const aw = activeWay;
      if (aw) setTimeout(() => { aw.dataset.dragged = "0"; }, 30);
      activeWay = null;
    };
    window.addEventListener("pointerup", onPointerUp);

    const onKeyTrail = (e: KeyboardEvent) => {
      const step = isMobile ? 340 : GAP * 0.6;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); nudge(step); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); nudge(-step); }
      else if (e.key === "Home") { e.preventDefault(); scrollAlong(0); }
      else if (e.key === "End") { e.preventDefault(); scrollAlong(1e9); }
    };
    trail.addEventListener("keydown", onKeyTrail);
    function nudge(d: number) { if (isMobile) trail.scrollTop += d; else trail.scrollLeft += d; }
    function scrollAlong(v: number) {
      if (isMobile) trail.scrollTo({ top: v, behavior: reduced ? "auto" : "smooth" });
      else trail.scrollTo({ left: v, behavior: reduced ? "auto" : "smooth" });
    }
    function jumpTo(i: number) {
      const n = nodes[i]; if (!n) return;
      if (isMobile) trail.scrollTo({ top: n.y - trail.clientHeight / 2, behavior: reduced ? "auto" : "smooth" });
      else trail.scrollTo({ left: n.x - trail.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
    }

    function toggle(el: HTMLElement) {
      const open = el.classList.contains("open");
      closeAll();
      if (!open) el.classList.add("open");
    }
    function close(el: HTMLElement) { el.classList.remove("open"); }
    function closeAll() { nodes.forEach((n) => n.el.classList.remove("open")); }
    const onKeyEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
    document.addEventListener("keydown", onKeyEsc);

    // ---- canvas drift particles ----
    type Part = { x: number; y: number; vx: number; vy: number; s: number; a: number; gold: boolean };
    let parts: Part[] = [], dpr = 1, cw = 0, ch = 0;
    function sizeCanvas() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cw = trail.clientWidth; ch = trail.clientHeight;
      cv.width = cw * dpr; cv.height = ch * dpr;
      cv.style.width = cw + "px"; cv.style.height = ch + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function seed() {
      parts = [];
      const N = 140;
      for (let i = 0; i < N; i++) {
        parts.push({
          x: Math.random() * cw, y: Math.random() * ch,
          vx: -(0.12 + Math.random() * 0.4), vy: -(Math.random() * 0.18) + 0.06,
          s: Math.random() < 0.18 ? 3 : 2,
          a: 0.2 + Math.random() * 0.6,
          gold: Math.random() < 0.1,
        });
      }
    }
    function drawParticles() {
      ctx.clearRect(0, 0, cw, ch);
      for (const pt of parts) {
        const band = 0.15 + progress * 0.95;
        const screenFrac = pt.x / cw;
        const active = screenFrac < band || pt.gold;
        if (!active) continue;

        pt.x += pt.vx; pt.y += pt.vy;
        if (pt.x < -4) { pt.x = cw + 4; pt.y = Math.random() * ch; }
        if (pt.y < -4) { pt.y = ch + 4; }
        if (pt.y > ch + 4) { pt.y = -4; }

        const intensity = 0.35 + screenFrac * 0.65;
        const alpha = pt.a * intensity * (pt.gold ? 0.9 : 1);
        if (pt.gold) ctx.fillStyle = `rgba(231,200,115,${alpha * 0.8})`;
        else ctx.fillStyle = `rgba(168,85,247,${alpha})`;
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.s, pt.s);
      }
    }
    let raf: number | null = null;
    function loop() { drawParticles(); raf = requestAnimationFrame(loop); }

    // ---- ridges ----
    function ridgePath(seedN: number, amp: number, base: number) {
      let d = `M0 300 L0 ${base}`;
      let x = 0; const step = 80; let r = seedN;
      while (x <= 1600) {
        r = (r * 9301 + 49297) % 233280;
        const h = base - (r / 233280) * amp;
        d += ` L${x} ${h.toFixed(0)}`;
        x += step;
      }
      d += ` L1600 ${base} L1600 300 Z`;
      return d;
    }
    ridgeFar.innerHTML = `<path d="${ridgePath(7, 70, 200)}" fill="#15102099"/>`;
    ridgeNear.innerHTML = `<path d="${ridgePath(31, 120, 250)}" fill="#0d0a16"/>` +
      `<path d="${ridgePath(31, 120, 250)}" fill="none" stroke="rgba(124,58,237,0.25)" stroke-width="1"/>`;

    // ---- init ----
    buildNodes();
    buildRail();
    layout();
    if (!reduced) loop();
    else { sizeCanvas(); drawParticles(); }

    let rt: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => { if (rt) clearTimeout(rt); rt = setTimeout(() => { closeAll(); layout(); if (reduced) drawParticles(); }, 140); };
    window.addEventListener("resize", onResize);

    const onVis = () => {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      else if (!reduced && !raf) { loop(); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.documentElement.style.overflow = prevHtmlOf;
      document.body.style.overflow = prevBodyOf;
      if (raf) cancelAnimationFrame(raf);
      if (rt) clearTimeout(rt);
      trail.removeEventListener("scroll", onScrollEvt);
      trail.removeEventListener("wheel", onWheel);
      trail.removeEventListener("pointerdown", onPointerDown);
      trail.removeEventListener("keydown", onKeyTrail);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyEsc);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div id="nvr-road" ref={rootRef}>
      <div id="ridges">
        <svg id="ridgeFar" className="ridge-far" viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true" />
        <svg id="ridgeNear" className="ridge-near" viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true" />
      </div>

      <div className="trail" id="trail" tabIndex={0} aria-label="Naevyr roadmap. Scroll, drag or use arrow keys to walk the road.">
        <div className="track" id="track">
          <svg id="line" aria-hidden="true" />
        </div>
      </div>

      <canvas id="particles" />
      <div id="fog" />
      <div id="dither" />

      <div className="hud">
        <div className="topbar">
          <Link href="/" className="brand" aria-label="Naevyr home">
            <span className="mark">NAE<b>V</b>YR</span>
            <span className="sub">The Long Road</span>
          </Link>
          <nav className="rail" id="rail" aria-label="Milestones" />
        </div>
      </div>

      <div className="meter" aria-hidden="true">
        <div className="lab"><span>Drift Encroach</span><span className="pct" id="pct">0%</span></div>
        <div className="track2"><div className="fill" id="fill" /></div>
      </div>

      <div className="hint">walk the road <span className="ar">&rsaquo;&rsaquo;&rsaquo;</span></div>
    </div>
  );
}
