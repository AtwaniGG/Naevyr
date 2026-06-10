import { Server } from "colyseus";
import { Encoder } from "@colyseus/schema";
import { DriftRoom } from "./rooms/DriftRoom";

// initial full state (1600-tile map + nodes + players) outgrows the 8KB default
Encoder.BUFFER_SIZE = 64 * 1024;

const port = Number(process.env.PORT ?? 2567);

const server = new Server();
server.define("drift", DriftRoom);

server.listen(port).then(() => {
  console.log(`Driftlands server listening on ws://localhost:${port}`);
});
