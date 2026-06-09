import { Cell } from "@/game/types";
import { World } from "@/game/world/tilemap";

// 8-directional A* over the world grid. Diagonals are allowed only when both
// orthogonal neighbours are clear (no corner cutting through nodes/water).

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export function findPath(
  world: World,
  start: Cell,
  goal: Cell,
): Cell[] | null {
  if (!world.isWalkable(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];

  const key = (x: number, y: number) => y * world.w + x;
  const open = new MinHeap();
  const gScore = new Map<number, number>();
  const came = new Map<number, number>();

  const sk = key(start.x, start.y);
  gScore.set(sk, 0);
  open.push(sk, heuristic(start, goal));

  while (open.size) {
    const current = open.pop()!;
    const cx = current % world.w;
    const cy = (current / world.w) | 0;
    if (cx === goal.x && cy === goal.y) {
      return reconstruct(came, current, world.w);
    }
    const cg = gScore.get(current)!;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!world.isWalkable(nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        // prevent corner cutting
        if (!world.isWalkable(cx + dx, cy) || !world.isWalkable(cx, cy + dy)) continue;
      }
      const step = dx !== 0 && dy !== 0 ? 1.41421356 : 1;
      const nk = key(nx, ny);
      const tentative = cg + step;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        came.set(nk, current);
        gScore.set(nk, tentative);
        open.push(nk, tentative + heuristic({ x: nx, y: ny }, goal));
      }
    }
  }
  return null;
}

/** Nearest walkable cell orthogonally/diagonally adjacent to a (blocked) node. */
export function adjacentWalkable(
  world: World,
  from: Cell,
  target: Cell,
): Cell | null {
  let best: Cell | null = null;
  let bestD = Infinity;
  for (const [dx, dy] of DIRS) {
    const x = target.x + dx;
    const y = target.y + dy;
    if (!world.isWalkable(x, y)) continue;
    const d = Math.hypot(x - from.x, y - from.y);
    if (d < bestD) {
      bestD = d;
      best = { x, y };
    }
  }
  return best;
}

function heuristic(a: Cell, b: Cell) {
  // octile distance
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.max(dx, dy) + (1.41421356 - 1) * Math.min(dx, dy);
}

function reconstruct(came: Map<number, number>, current: number, w: number): Cell[] {
  const path: Cell[] = [];
  let c: number | undefined = current;
  while (c !== undefined) {
    path.push({ x: c % w, y: (c / w) | 0 });
    c = came.get(c);
  }
  path.reverse();
  path.shift(); // drop the start cell
  return path;
}

// Simple binary min-heap keyed by priority.
class MinHeap {
  private items: number[] = [];
  private prio: number[] = [];

  get size() {
    return this.items.length;
  }

  push(item: number, priority: number) {
    this.items.push(item);
    this.prio.push(priority);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.prio[p] <= this.prio[i]) break;
      this.swap(i, p);
      i = p;
    }
  }

  pop(): number | undefined {
    if (!this.items.length) return undefined;
    const top = this.items[0];
    const lastItem = this.items.pop()!;
    const lastPrio = this.prio.pop()!;
    if (this.items.length) {
      this.items[0] = lastItem;
      this.prio[0] = lastPrio;
      let i = 0;
      const n = this.items.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < n && this.prio[l] < this.prio[smallest]) smallest = l;
        if (r < n && this.prio[r] < this.prio[smallest]) smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.prio[a], this.prio[b]] = [this.prio[b], this.prio[a]];
  }
}
