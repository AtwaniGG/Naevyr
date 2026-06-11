# Driftlands authoritative game server (Colyseus 0.16) — Railway image.
#
# BUILD CONTEXT = repo root (NOT server/): the server reuses game/types.ts and
# game/world/* through the @/* path alias (server/tsconfig baseUrl ".."), so
# those repo-root modules must ship in the image too. COPY paths below are all
# relative to the repo root. Railway points at this via railway.json's
# dockerfilePath; locally: `docker build -f server/Dockerfile .`
FROM node:24-slim
WORKDIR /app

# Server deps. tsx runs the TypeScript directly (no compile step), so
# devDependencies stay in. We use `npm install` (not `npm ci`) so the build
# survives the macOS-lockfile → linux-image drift in ws's optional native
# accelerators (bufferutil/utf-8-validate); --omit=optional skips them (ws
# falls back to pure JS). The lockfile still pins the real dependency versions.
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install --omit=optional --no-audit --no-fund

# Source: the server itself + the repo-root game modules it imports via @/*.
# We copy explicit paths (never server/ wholesale) so the gitignored
# server/.data secret — the mint authority keypair — can never reach the image.
COPY server/src ./server/src
COPY server/tsconfig.json ./server/
COPY game ./game

ENV NODE_ENV=production
# Run from server/ so tsx resolves server/tsconfig.json (@/* → repo root).
WORKDIR /app/server
# Railway injects PORT; index.ts reads it. /gate, /leaderboard and the ws
# transport all ride this one port.
CMD ["npx", "tsx", "src/index.ts"]
