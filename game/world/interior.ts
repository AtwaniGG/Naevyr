import { Cell } from "@/game/types";
import { BuildingKey } from "@/game/world/tilemap";

// Building interiors: small client-local rooms behind each Waystation door.
// Entering is a scene swap (the server never knows — your wanderer appears to
// wait at the door, same accepted-caveat model as mobs). Inside, walking to
// the counter opens that building's function; the door returns you outside.

export type FixtureKind =
  | "counter" | "vat" | "shelf" | "table" | "barrel"
  | "cage" | "anvil" | "rug" | "wheelDisc" | "hearth" | "oreCart";

export interface InteriorFixture {
  kind: FixtureKind;
  x: number;
  y: number;
  /** palette accent override (vats come in many dyes) */
  accent?: string;
  /** blocks walking (rugs don't) */
  solid?: boolean;
}

export interface InteriorSpec {
  key: BuildingKey;
  title: string;
  w: number;
  h: number;
  floor: "wood" | "stone" | "cave";
  /** room accent (rug, trim, wall windows) */
  accent: string;
  /** south-edge exit */
  door: Cell;
  /** walking adjacent to this opens the shop panel (rooms without one are
   *  pure-activity spaces, like the Mine) */
  counter?: Cell;
  /** where the keeper stands (drawn, solid) */
  keeper?: Cell;
  /** keeper's cloak dye (reuses wanderer cosmetics) */
  keeperDye?: string;
  /** rough cave walls instead of timber (no windows) */
  cave?: boolean;
  /** mineable gold veins (the Mine): solid, deplete + regrow client-side */
  veins?: Cell[];
  fixtures: InteriorFixture[];
}

const SOLID_KINDS: FixtureKind[] = [
  "counter", "vat", "shelf", "table", "barrel", "cage", "anvil", "wheelDisc", "hearth", "oreCart",
];

export const INTERIORS: Partial<Record<BuildingKey, InteriorSpec>> = {
  dyeworks: {
    key: "dyeworks", title: "The Dyeworks", w: 9, h: 7,
    floor: "wood", accent: "#a855f7",
    door: { x: 4, y: 6 }, counter: { x: 4, y: 2 }, keeper: { x: 4, y: 1 }, keeperDye: "bone",
    fixtures: [
      { kind: "vat", x: 1, y: 2, accent: "#a855f7" },
      { kind: "vat", x: 1, y: 3, accent: "#f59e0b" },
      { kind: "vat", x: 1, y: 4, accent: "#4a7fa0" },
      { kind: "vat", x: 7, y: 2, accent: "#dc2626" },
      { kind: "vat", x: 7, y: 3, accent: "#4d7c4d" },
      { kind: "shelf", x: 6, y: 1 },
      { kind: "rug", x: 4, y: 4 },
    ],
  },
  vault: {
    key: "vault", title: "The Vault", w: 8, h: 7,
    floor: "stone", accent: "#e7c873",
    door: { x: 4, y: 6 }, counter: { x: 4, y: 2 }, keeper: { x: 4, y: 1 }, keeperDye: "gold",
    fixtures: [
      { kind: "shelf", x: 1, y: 1 }, { kind: "shelf", x: 2, y: 1 }, { kind: "shelf", x: 6, y: 1 },
      { kind: "barrel", x: 1, y: 4 },
      { kind: "rug", x: 4, y: 4 },
    ],
  },
  wheel: {
    key: "wheel", title: "Wheel of the Drift", w: 8, h: 7,
    floor: "wood", accent: "#dc2626",
    door: { x: 4, y: 6 }, counter: { x: 4, y: 1 }, keeper: { x: 3, y: 1 }, keeperDye: "blood",
    fixtures: [
      { kind: "wheelDisc", x: 4, y: 1 },
      { kind: "barrel", x: 1, y: 2 }, { kind: "barrel", x: 6, y: 2 },
      { kind: "table", x: 1, y: 4 }, { kind: "table", x: 6, y: 4 },
      { kind: "rug", x: 4, y: 4 },
    ],
  },
  lantern: {
    key: "lantern", title: "The Last Lantern", w: 10, h: 8,
    floor: "wood", accent: "#f59e0b",
    door: { x: 5, y: 7 }, counter: { x: 5, y: 2 }, keeper: { x: 5, y: 1 }, keeperDye: "ember",
    fixtures: [
      { kind: "hearth", x: 1, y: 1 },
      { kind: "barrel", x: 8, y: 1 }, { kind: "barrel", x: 8, y: 2 },
      { kind: "table", x: 2, y: 3 }, { kind: "table", x: 7, y: 4 },
      { kind: "table", x: 2, y: 5 }, { kind: "table", x: 7, y: 6 },
      { kind: "rug", x: 5, y: 4 },
    ],
  },
  furnisher: {
    key: "furnisher", title: "The Furnisher", w: 9, h: 7,
    floor: "wood", accent: "#d8cfe0",
    door: { x: 4, y: 6 }, counter: { x: 4, y: 2 }, keeper: { x: 4, y: 1 }, keeperDye: "moss",
    fixtures: [
      { kind: "anvil", x: 1, y: 2 },
      { kind: "shelf", x: 6, y: 1 }, { kind: "shelf", x: 7, y: 1 },
      { kind: "barrel", x: 1, y: 4 }, { kind: "table", x: 7, y: 4 },
      { kind: "rug", x: 4, y: 4 },
    ],
  },
  menagerie: {
    key: "menagerie", title: "The Menagerie", w: 9, h: 7,
    floor: "stone", accent: "#4a7fa0",
    door: { x: 4, y: 6 }, counter: { x: 4, y: 2 }, keeper: { x: 4, y: 1 }, keeperDye: "water",
    fixtures: [
      { kind: "cage", x: 1, y: 1 }, { kind: "cage", x: 2, y: 1 },
      { kind: "cage", x: 6, y: 1 }, { kind: "cage", x: 7, y: 1 },
      { kind: "cage", x: 1, y: 3 },
      { kind: "rug", x: 4, y: 4 },
    ],
  },
};

// THE MINE: no counter, no shop — the room IS the activity. Gold veins line
// the cavern walls; mining them pays coin directly (client-trusted, Phase 6).
INTERIORS.mine = {
  key: "mine", title: "The Mine", w: 11, h: 9,
  floor: "cave", accent: "#e7c873", cave: true,
  door: { x: 5, y: 8 }, keeper: { x: 8, y: 2 }, keeperDye: "stone",
  veins: [
    { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 },
    { x: 1, y: 3 }, { x: 9, y: 4 }, { x: 1, y: 6 },
  ],
  fixtures: [
    { kind: "barrel", x: 9, y: 6 },
    { kind: "table", x: 7, y: 2 },
    { kind: "oreCart", x: 3, y: 6 },
  ],
};

// the Mirewife's Hut: cramped, mossy, smells of bog water and old herbs
INTERIORS.mirehut = {
  key: "mirehut", title: "The Mirewife's Hut", w: 8, h: 6,
  floor: "wood", accent: "#4d7c4d",
  door: { x: 4, y: 5 }, counter: { x: 4, y: 2 }, keeper: { x: 4, y: 1 }, keeperDye: "moss",
  fixtures: [
    { kind: "vat", x: 1, y: 1, accent: "#4d7c4d" },
    { kind: "vat", x: 1, y: 2, accent: "#a855f7" },
    { kind: "cage", x: 6, y: 1 },
    { kind: "shelf", x: 2, y: 1 },
    { kind: "hearth", x: 6, y: 3 },
    { kind: "rug", x: 4, y: 3 },
  ],
};

/** rooms exist only for buildings with doors; shrine + pit stay open-air */
export function interiorFor(key: BuildingKey): InteriorSpec | null {
  return INTERIORS[key] ?? null;
}

/** a World-shaped navigation shim for findPath (small solid-fixture grid) */
export function interiorNav(spec: InteriorSpec): { w: number; h: number; isWalkable(x: number, y: number): boolean; inBounds(x: number, y: number): boolean } {
  const solid = new Set<number>();
  const key = (x: number, y: number) => y * spec.w + x;
  for (const f of spec.fixtures) {
    if (f.solid ?? SOLID_KINDS.includes(f.kind)) solid.add(key(f.x, f.y));
  }
  if (spec.keeper) solid.add(key(spec.keeper.x, spec.keeper.y));
  for (const v of spec.veins ?? []) solid.add(key(v.x, v.y));
  return {
    w: spec.w,
    h: spec.h,
    inBounds: (x, y) => x >= 0 && y >= 0 && x < spec.w && y < spec.h,
    isWalkable: (x, y) =>
      x >= 0 && y >= 0 && x < spec.w && y < spec.h && !solid.has(key(x, y)),
  };
}
