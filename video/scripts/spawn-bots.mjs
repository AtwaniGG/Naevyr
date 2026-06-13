// Populate the realm with wandering bot wanderers so capture footage doesn't
// look empty. Each bot joins the shared "drift" room, picks a name + look, and
// strolls to random tiles forever. Run alongside an OPEN server (GATE_TOKENS
// unset/0) before capture-activities.mjs, then Ctrl-C (or it self-stops).
//   node video/scripts/spawn-bots.mjs [count] [serverUrl] [seconds]
import { Client } from "colyseus.js";

const COUNT = Number(process.argv[2] ?? 14);
const URL = process.argv[3] ?? "ws://localhost:2567";
const TTL_S = Number(process.argv[4] ?? 240);

const NAMES = [
  "Vael", "Ozun", "Mira", "Kethra", "Doran", "Sable", "Wren", "Halix",
  "Bronce", "Yara", "Tovin", "Esk", "Marrow", "Quill", "Riven", "Ash",
  "Lune", "Garrow", "Pell", "Nix", "Corvis", "Thade", "Wisp", "Orla",
];
const DYES = ["stone", "ember", "moss", "blood", "gold", "bone", "water", "void"];
const EYES = ["drift", "ember", "blood", "gold", "water"];
const PETS = ["", "wisp", "crow", "emberling"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rooms = [];
let alive = true;

async function spawn(i) {
  const token = `botwanderer-${i}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const client = new Client(URL);
    const room = await client.joinOrCreate("drift", { token });
    rooms.push(room);
    // give it a face
    room.send("identity", {
      name: `${pick(NAMES)}${Math.random() < 0.3 ? "" : ""}`,
      dye: pick(DYES),
      eye: pick(EYES),
      pet: pick(PETS),
    });
    // wander: drift toward a random tile, repick when it likely arrives
    const w = room.state?.w || 40;
    const h = room.state?.h || 40;
    (async () => {
      while (alive) {
        const x = 2 + Math.floor(Math.random() * (w - 4));
        const y = 2 + Math.floor(Math.random() * (h - 4));
        try { room.send("move", { x, y }); } catch { /* dropped */ }
        await sleep(3500 + Math.random() * 4000);
      }
    })();
    return true;
  } catch (e) {
    console.log(`bot ${i} failed: ${e?.message ?? e}`);
    return false;
  }
}

console.log(`spawning ${COUNT} bots on ${URL} …`);
let ok = 0;
for (let i = 0; i < COUNT; i++) {
  if (await spawn(i)) ok++;
  await sleep(250); // stagger joins so they don't all stack on spawn
}
console.log(`${ok}/${COUNT} bots roaming. holding ${TTL_S}s (Ctrl-C to stop).`);

const stop = () => {
  alive = false;
  for (const r of rooms) { try { r.leave(); } catch { /* ignore */ } }
  setTimeout(() => process.exit(0), 600);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await sleep(TTL_S * 1000);
stop();
