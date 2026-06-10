import { Server } from "colyseus";
import { Encoder } from "@colyseus/schema";
import { DriftRoom } from "./rooms/DriftRoom";
import { initDb } from "./db";

// initial full state (1600-tile map + nodes + players) outgrows the 8KB default
Encoder.BUFFER_SIZE = 64 * 1024;

const port = Number(process.env.PORT ?? 2567);

async function main() {
  await initDb();
  const server = new Server();
  server.define("drift", DriftRoom);
  await server.listen(port);
  console.log(`Driftlands server listening on ws://localhost:${port}`);
}

main().catch((e) => {
  console.error("server failed to start:", e);
  process.exit(1);
});
