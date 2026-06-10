import { useGame, rollDailyQuests, QuestState } from "@/game/state/store";
import { QUEST_POOL } from "@/game/types";

// Lightweight localStorage persistence. Quest defs hold functions, so quests
// are saved in a lite form ({id, progress, claimed}) and rehydrated against
// QUEST_POOL; a saved board from a previous day is discarded and rerolled.

const KEY = "driftlands-save-v1";
const SAVE_THROTTLE_MS = 1500;

interface SaveData {
  day: number;
  inventory: unknown;
  skills: unknown;
  vitals: unknown;
  equipment: unknown;
  cosmetics?: unknown;
  kills?: number;
  gold: number;
  driftSeason: number;
  driftPct?: number;
  quests: { id: string; progress: number; claimed: boolean }[];
}

const today = () => Math.floor(Date.now() / 86_400_000);

export function initPersistence() {
  if (typeof window === "undefined") return;

  // ---- load -----------------------------------------------------------------
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as SaveData;
      const quests: QuestState[] =
        data.day === today()
          ? data.quests.flatMap((q) => {
              const def = QUEST_POOL.find((d) => d.id === q.id);
              return def
                ? [{ def, progress: q.progress, claimed: q.claimed }]
                : [];
            })
          : rollDailyQuests();
      useGame.setState({
        ...(data.inventory ? { inventory: data.inventory as never } : {}),
        ...(data.skills ? { skills: data.skills as never } : {}),
        ...(data.vitals ? { vitals: data.vitals as never } : {}),
        ...(data.equipment ? { equipment: data.equipment as never } : {}),
        ...(data.cosmetics ? { cosmetics: data.cosmetics as never } : {}),
        kills: data.kills ?? 0,
        gold: data.gold ?? 0,
        driftSeason: data.driftSeason ?? 1,
        driftPct: data.driftPct ?? 0,
        quests,
      });
    }
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
      const s = useGame.getState();
      const data: SaveData = {
        day: today(),
        inventory: s.inventory,
        skills: s.skills,
        vitals: s.vitals,
        equipment: s.equipment,
        cosmetics: s.cosmetics,
        kills: s.kills,
        gold: s.gold,
        driftSeason: s.driftSeason,
        driftPct: s.driftPct,
        quests: s.quests.map((q) => ({
          id: q.def.id,
          progress: q.progress,
          claimed: q.claimed,
        })),
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        // storage full/blocked — skip silently
      }
    }, SAVE_THROTTLE_MS);
  });
}

/** wipe the save and reload fresh (handy for testing) */
export function resetSave() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.location.reload();
}
