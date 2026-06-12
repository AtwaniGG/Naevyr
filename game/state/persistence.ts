import { useGame, rollDailyQuests, QuestState } from "@/game/state/store";
import { QUEST_POOL } from "@/game/types";

// Progress snapshots. Offline they live in localStorage; online the same
// snapshot is pushed to the game server (Postgres) every few seconds and
// handed back on join — the server copy wins when both exist.
// Quest defs hold functions, so quests are saved in a lite form
// ({id, progress, claimed}) and rehydrated against QUEST_POOL; a saved board
// from a previous day is discarded and rerolled.

const KEY = "driftlands-save-v1";
const DEVICE_KEY = "driftlands-device";
const SAVE_THROTTLE_MS = 1500;

export interface SaveData {
  day: number;
  inventory: unknown;
  skills: unknown;
  vitals: unknown;
  equipment: unknown;
  cosmetics?: unknown;
  kills?: number;
  stats?: unknown;
  ownedDyes?: string[];
  ownedEyes?: string[];
  ownedAuras?: string[];
  ownedPets?: string[];
  ownedAvatars?: string[];
  ownedTitles?: string[];
  gold: number;
  driftSeason: number;
  driftPct?: number;
  quests: { id: string; progress: number; claimed: boolean }[];
  /** the Threshold has been walked (or skipped); new wanderers go there first */
  tutorialDone?: boolean;
}

const today = () => Math.floor(Date.now() / 86_400_000);

/** the browser-held guest identity for the game server (created on demand) */
export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(DEVICE_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, t);
  }
  return t;
}

// ---- Phase 6: the entry gate ------------------------------------------------
// The wallet that passed the landing gate; the engine sends it with the join
// so GATE_TOKENS servers can re-check the balance authoritatively.
const GATE_WALLET_KEY = "driftlands-gate-wallet";

export function getGateWallet(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GATE_WALLET_KEY);
}

export function setGateWallet(address: string | null) {
  if (typeof window === "undefined") return;
  if (address) localStorage.setItem(GATE_WALLET_KEY, address);
  else localStorage.removeItem(GATE_WALLET_KEY);
}

// The signed ownership proof for that wallet (gateMessage over a server nonce,
// signed once at the door). Rides along with every join so onAuth can verify
// the wallet is actually owned, not merely claimed. The nonce carries its own
// expiry; a stale or restart-orphaned proof just fails proofOk and re-signs.
const GATE_PROOF_KEY = "driftlands-gate-proof";

export interface GateProof {
  address: string;
  nonce: string;
  sig: string;
}

export function getGateProof(): GateProof | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GATE_PROOF_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as GateProof;
    return p && p.address && p.nonce && p.sig ? p : null;
  } catch {
    return null;
  }
}

export function setGateProof(proof: GateProof | null) {
  if (typeof window === "undefined") return;
  if (proof) localStorage.setItem(GATE_PROOF_KEY, JSON.stringify(proof));
  else localStorage.removeItem(GATE_PROOF_KEY);
}

/** capture the full progress snapshot from the store */
export function buildSnapshot(): SaveData {
  const s = useGame.getState();
  return {
    day: today(),
    inventory: s.inventory,
    skills: s.skills,
    vitals: s.vitals,
    equipment: s.equipment,
    cosmetics: s.cosmetics,
    kills: s.kills,
    stats: s.stats,
    ownedDyes: s.ownedDyes,
    ownedEyes: s.ownedEyes,
    ownedAuras: s.ownedAuras,
    ownedPets: s.ownedPets,
    ownedAvatars: s.ownedAvatars,
    ownedTitles: s.ownedTitles,
    gold: s.gold,
    driftSeason: s.driftSeason,
    driftPct: s.driftPct,
    quests: s.quests.map((q) => ({
      id: q.def.id,
      progress: q.progress,
      claimed: q.claimed,
    })),
    tutorialDone: s.tutorialDone,
  };
}

/** restore a snapshot into the store (quests rehydrated; stale boards reroll) */
export function applySnapshot(data: SaveData) {
  const rehydrated: QuestState[] =
    data.day === today() && Array.isArray(data.quests)
      ? data.quests.flatMap((q) => {
          const def = QUEST_POOL.find((d) => d.id === q.id);
          return def
            ? [{ def, progress: q.progress, claimed: q.claimed }]
            : [];
        })
      : [];
  // a stale day OR a board whose ids no longer resolve (the live empty-board
  // bug) falls back to a fresh roll instead of showing nothing
  const quests: QuestState[] = rehydrated.length ? rehydrated : rollDailyQuests();
  // grandfather old saves: whatever is equipped counts as owned
  const cos = (data.cosmetics ?? {}) as { dye?: string; eye?: string };
  const ownedDyes = [...new Set(["stone", ...(data.ownedDyes ?? []), ...(cos.dye ? [cos.dye] : [])])];
  const ownedEyes = [...new Set(["drift", ...(data.ownedEyes ?? []), ...(cos.eye ? [cos.eye] : [])])];

  useGame.setState({
    ...(data.inventory ? { inventory: data.inventory as never } : {}),
    ...(data.skills ? { skills: data.skills as never } : {}),
    ...(data.vitals ? { vitals: data.vitals as never } : {}),
    ...(data.equipment ? { equipment: data.equipment as never } : {}),
    ...(data.cosmetics
      ? { cosmetics: { ...useGame.getState().cosmetics, ...(data.cosmetics as object) } as never }
      : {}),
    ownedDyes: ownedDyes as never,
    ownedEyes: ownedEyes as never,
    ownedAuras: (data.ownedAuras ?? []) as never,
    ownedPets: (data.ownedPets ?? []) as never,
    // NOT grandfathered from the worn look: ownership is server-authoritative
    // (the profile's prestige list re-grants after this runs)
    ownedAvatars: (data.ownedAvatars ?? []) as never,
    ownedTitles: data.ownedTitles ?? [],
    ...(data.stats
      ? { stats: { ...useGame.getState().stats, ...(data.stats as object) } as never }
      : {}),
    kills: data.kills ?? 0,
    gold: data.gold ?? 0,
    driftSeason: data.driftSeason ?? 1,
    driftPct: data.driftPct ?? 0,
    quests,
    // sticky: an older snapshot (from before the flag existed) must never send
    // a wanderer who finished the Threshold back through it
    tutorialDone: (data.tutorialDone ?? false) || useGame.getState().tutorialDone,
  });
}

/** has this browser's wanderer walked the Threshold? (read before the engine mounts) */
export function getTutorialDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? Boolean(JSON.parse(raw)?.tutorialDone) : false;
  } catch {
    return false;
  }
}

let persistenceInited = false;
export function initPersistence() {
  if (typeof window === "undefined") return;
  // the tutorial → realm transition remounts GameCanvas; load + subscribe once
  if (persistenceInited) return;
  persistenceInited = true;

  // ---- load -----------------------------------------------------------------
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) applySnapshot(JSON.parse(raw) as SaveData);
  } catch {
    // corrupt save — start fresh rather than crash
    localStorage.removeItem(KEY);
  }

  // ---- save (throttled on any change) ----------------------------------------
  let timer: ReturnType<typeof setTimeout> | null = null;
  useGame.subscribe(() => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      try {
        localStorage.setItem(KEY, JSON.stringify(buildSnapshot()));
      } catch {
        // storage full/blocked — skip silently
      }
    }, SAVE_THROTTLE_MS);
  });

  // leaving the page (back to the landing, tab close) flushes any pending save
  window.addEventListener("pagehide", () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(buildSnapshot()));
    } catch {
      // storage full/blocked — skip silently
    }
  });
}

// ---- the name sworn at the door ----------------------------------------------
// The door writes the local save, but a returning player's SERVER snapshot
// lands after join and would clobber it. The engine takes this and re-asserts
// the sworn name once the snapshot has applied.
let doorName: string | null = null;
export function setDoorName(name: string) {
  doorName = name;
}
export function takeDoorName(): string | null {
  const n = doorName;
  doorName = null;
  return n;
}

/** wipe the save and reload fresh (handy for testing) */
export function resetSave() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.location.reload();
}
