"use client";

import React from "react";

/* ============================================================
   DriftLands PIXEL ICONS
   Each icon is a 16×16 grid of chars; every char maps to a palette
   entry below and renders as one 1×1 <rect> with crisp edges. Tune
   pixels by editing the grids — keep the 'k' outline + 2–3 shade
   ramp per material so icons match sprites & tiles.
   ============================================================ */

const PAL: Record<string, string | null> = {
  '.': null,            // transparent
  k: '#0a0810',         // outline / void
  // bone / steel-light
  L: '#d8cfe0', o: '#a99fb8', h: '#efe9f4',
  // steel / stone
  S: '#9b94ab', C: '#4a4360', s: '#6f6781', z: '#3a3350', c: '#322b46',
  // wood
  W: '#7a6048', w: '#50402e', x: '#36291c',
  // gold
  G: '#f6e0a6', g: '#e7c873', y: '#b8943f',
  // ember
  E: '#fcd34d', e: '#f59e0b',
  // drift purple
  P: '#f3e8ff', p: '#a855f7', u: '#6b21a8', v: '#3b1162',
  // blood
  R: '#ef4444', r: '#dc2626',
  // moss / leaf
  M: '#7fae5e', m: '#4d7c4d', n: '#356037',
  // water / fish
  B: '#4a7fa0', b: '#2c5775',
};

const GRID = 16;

const ICONS = {
  /* ---------------- 6 TOOLS ---------------- */
  axe: [
    '................',
    '......kkkkkk....',
    '.....kSShhhSzk..',
    '....kSSSSSShSzk.',
    '....kSSSSSSSSzk.',
    '....kzSSSSSSzk..',
    '.....kkzSSzkk...',
    '......kwwk......',
    '......kWwk......',
    '......kwWk......',
    '......kWwk......',
    '......kwWk......',
    '......kWwk......',
    '......kwWkk.....',
    '.......kkk......',
    '................',
  ],
  pickaxe: [
    '................',
    '..kk........kk..',
    '.kssk......kssk.',
    'kSsszk....kzssSk',
    'kSsszkk..kkzssSk',
    '.kzsssk..ksssszk',
    '..kkzsssssszkk..',
    '.....kkwwkk.....',
    '......kWwk......',
    '......kwWk......',
    '......kxwk......',
    '......kWwk......',
    '......kwxk......',
    '......kWwk......',
    '......kxwkk.....',
    '.......kk.......',
  ],
  rod: [
    '............kkk.',
    '...........kWWk.',
    '..........kWzk..',
    '.........kWzk...',
    '........kWzk....',
    '.......kWzk.....',
    '......kWzk..k...',
    '.....kWzk...k...',
    '....kWzk....k...',
    '...kWzk.....k...',
    '..kWzk....kBBk..',
    '..kWk.....kPBk..',
    '.kWk......kbbk..',
    '.kk........kk...',
    '................',
    '................',
  ],
  sword: [
    '.......k........',
    '......kLk.......',
    '......kzLk......',
    '......kzLk......',
    '......kzLk......',
    '......kzLk......',
    '......kzLk......',
    '......kzLk......',
    '.....kzzLLk.....',
    '...kkkkkkkkkk...',
    '...kygggggyk...',
    '....kkkwwkk.....',
    '......kwwk......',
    '......kwwk......',
    '.....kgGGgk.....',
    '......kkkk......',
  ],
  ward: [
    '...kkkkkkkkk....',
    '..kCsssssssCk...',
    '..kCsuuuuusCk...',
    '..kCsuPPpusCk...',
    '..kCsupPpusCk...',
    '..kCsuppppsCk...',
    '..kCsssssssCk...',
    '..kCsssssssCk...',
    '...kCsssssCk....',
    '...kCsssssCk....',
    '....kCsssCk.....',
    '....kCsssCk.....',
    '.....kCsCk......',
    '.....kCsCk......',
    '......kkk.......',
    '................',
  ],
  sigil: [
    '......kkkk......',
    '....kkuuuukk....',
    '...kuppppppuk...',
    '..kupppPppppuk..',
    '..kuppPPPpppuk..',
    '.kuppPPpPPpppuk.',
    '.kupppPPPppppuk.',
    '.kuppPPpPPpppuk.',
    '..kpppPPPpppuk..',
    '..kupppPppppuk..',
    '...kuppppppuk...',
    '....kkuuuukk....',
    '......kkkk......',
    '................',
    '................',
    '................',
  ],

  /* ---------------- RESOURCES ---------------- */
  log: [
    '................',
    '...kkkkkkkkk....',
    '..kWWWWWWWWWk...',
    '.kWWxoxWWWWWk...',
    '.kWxoxoxWWWWk...',
    '.kWWxoxWWWWWk...',
    '..kWWWWWWWWWk...',
    '...kkkkkkkkk....',
    '...kkkkkkkkk....',
    '..kwwwwwwwwwk...',
    '.kwwxoxwwwwwk...',
    '.kwxoxoxwwwwk...',
    '.kwwxoxwwwwwk...',
    '..kwwwwwwwwwk...',
    '...kkkkkkkkk....',
    '................',
  ],
  ore: [
    '................',
    '......kkkk......',
    '....kkCCCCkk....',
    '...kCCsssCCk....',
    '..kCsgssssgCk...',
    '..kCsssgsssCk...',
    '.kcsgssssgsck...',
    '.kcssgsssscck...',
    '..kcssgsssck....',
    '..kccssssgck....',
    '...kccsssck.....',
    '....kcccck......',
    '.....kkkk.......',
    '................',
    '................',
    '................',
  ],
  fish: [
    '................',
    '................',
    '....kkkk....kk..',
    '..kkBBBBkk.kBk..',
    '.kBBBBBBBBkBBk..',
    'kBBbbkBBBBBBBk..',
    'kBkLBBBBBBBBBk..',
    'kBBbbkBBBBBBk...',
    '.kBBBBBBBBkBBk..',
    '..kkBBBBkk.kBk..',
    '....kkkk....kk..',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  coin: [
    '................',
    '.....kkkkk......',
    '...kkgggggkk....',
    '..kgGGGGGGgk....',
    '..kgGyppyGgk....',
    '.kgGyppppyGgk...',
    '.kgGyppPppyGk...',
    '.kgGyppppyGgk...',
    '..kgGyppyGgk....',
    '..kgGGGGGGgk....',
    '...kkgggggkk....',
    '.....kkkkk......',
    '................',
    '................',
    '................',
    '................',
  ],
  drift: [
    '................',
    '.......k........',
    '......kPk.......',
    '......kPk.......',
    '.....kpPpk......',
    '....kppPppk.....',
    '.kk.kppPppk.kk..',
    'kPppppPPPpppPk..',
    '.kk.kppPppk.kk..',
    '....kppPppk.....',
    '.....kpPpk......',
    '......kPk.......',
    '......kPk.......',
    '.......k........',
    '................',
    '................',
  ],

  /* ---------------- HUD ---------------- */
  heart: [
    '................',
    '..kkk....kkk....',
    '.kRRRkk.kRRRk...',
    'kRRRRRkkRRRRRk..',
    'kRRRRRRRRRRRRk..',
    'kRRRRRRRRRRRRk..',
    'kRRRRRRRRRRRRk..',
    '.kRRRRRRRRRRk...',
    '..kRRRRRRRRk....',
    '...kRRRRRRk.....',
    '....kRRRRk......',
    '.....kRRk.......',
    '......kk........',
    '................',
    '................',
    '................',
  ],
  leaf: [
    '................',
    '.............kk.',
    '..........kkMMk.',
    '........kkMMMnk.',
    '......kkMMMMnk..',
    '.....kMMMMMnk...',
    '....kMMMMnnk....',
    '...kMMMnnk......',
    '..kMMnnk.k......',
    '..kMnnk.kn......',
    '.kMnnk.kn.......',
    '.knnk.kn........',
    '.kkk.kn.........',
    '....kn..........',
    '...kk...........',
    '................',
  ],
  bag: [
    '................',
    '.....kkkk.......',
    '....kk..kk......',
    '....k....k......',
    '...kkkkkkkk.....',
    '..kWwwwwwwWk....',
    '..kwwwwwwwwk....',
    '..kwwwggwwwk....',
    '..kwwwggwwwk....',
    '..kwwwwwwwwk....',
    '..kwwwwwwwwk....',
    '...kwwwwwwk.....',
    '....kkkkkk......',
    '................',
    '................',
    '................',
  ],
  bolt: [
    '................',
    '........kk......',
    '.......kEk......',
    '......kEek......',
    '.....kEek.......',
    '....kEek........',
    '...kEekkk.......',
    '..kEeEEEk.......',
    '..kkkkEek.......',
    '.....kEek.......',
    '....kEek........',
    '...kEek.........',
    '..kEek..........',
    '..kek...........',
    '..kk............',
    '................',
  ],
  chevronRight: [
    '................',
    '.....k..........',
    '.....kk.........',
    '.....kLk........',
    '......kLk.......',
    '.......kLk......',
    '........kLk.....',
    '........kLk.....',
    '.......kLk......',
    '......kLk.......',
    '.....kLk........',
    '.....kk.........',
    '.....k..........',
    '................',
    '................',
    '................',
  ],
  x: [
    '................',
    '..kk......kk....',
    '..kLk....kLk....',
    '...kLk..kLk.....',
    '....kLkkLk......',
    '.....kLLk.......',
    '.....kLLk.......',
    '....kLkkLk......',
    '...kLk..kLk.....',
    '..kLk....kLk....',
    '..kk......kk....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
export const TOOL_NAMES: IconName[] = ['axe', 'pickaxe', 'rod', 'sword', 'ward', 'sigil'];

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  glow?: boolean;
}

export function Icon({ name, size = 32, glow = false, style = {}, className = '', ...rest }: IconProps) {
  const grid: string[] = ICONS[name] || [];
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = PAL[row[x]];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID} ${GRID}`}
      shapeRendering="crispEdges"
      className={className}
      style={{
        display: 'block',
        flex: 'none',
        imageRendering: 'pixelated',
        filter: glow ? 'drop-shadow(0 0 0.5px #a855f7) drop-shadow(0 0 2px rgba(168,85,247,0.8))' : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    >
      {rects}
    </svg>
  );
}
