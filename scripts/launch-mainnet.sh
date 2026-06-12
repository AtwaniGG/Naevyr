#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# DRIFTS mainnet cutover — flips the LIVE stack from devnet to the pump.fun mint.
# Run this ONCE, at launch, AFTER you've created the token on pump.fun.
#
# It sets every env var on Railway (driftlands-server) + Vercel and redeploys.
# Your relayer SECRET KEY is read from a local file and never printed.
#
# The mint + RPC (which carries an api-key) are PROMPTED at runtime, never
# stored in this file — this script is committed to a PUBLIC repo, so no
# secret may live in it.
#
#   1. make sure you're logged in + linked:
#        railway whoami   &&   railway status     (linked to project driftlands)
#        vercel  whoami   &&   vercel  link        (linked to the driftlands project)
#   2. ./scripts/launch-mainnet.sh   (it asks for the mint + RPC)
#      (or pass them inline:  MINT=… RPC=… ./scripts/launch-mainnet.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── inputs — prompted at runtime so nothing secret lands in this committed file ─
RELAYER_KEYPAIR_FILE="${RELAYER_KEYPAIR_FILE:-relayer.json}"  # the solana-keygen file
MINT="${MINT:-}"
RPC="${RPC:-}"
[[ -n "$MINT" ]] || read -r -p "pump.fun mint address (base58, no 0x): " MINT
[[ -n "$RPC"  ]] || read -r -p "mainnet RPC URL (https://mainnet.helius-rpc.com/?api-key=…): " RPC

# ─── these are already decided — leave them ───────────────────────────────────
TREASURY_ADDRESS="F9PxeNqrpjvtYjSrXVde3EzTqPXqSLviNibE3yBF13rF"
ESCROW_ADDRESS="8FuXwL3siaNQ3AptnRKaf9JicsBkz3yFeohvsX1LEbLA"
GATE_TOKENS="1000"
RAILWAY_SERVICE="driftlands-server"
SERVER_URL="https://driftlands-server-production.up.railway.app"

# ─── safety checks (catch the launch-bricking mistakes) ───────────────────────
die() { echo "✗ $1" >&2; exit 1; }

[[ -n "$MINT" ]] || die "MINT is empty — launch on pump.fun first, then paste the mint."
[[ "$MINT" != 0x* ]] || die "MINT starts with 0x — that's an Ethereum address. You need the Solana mint."
[[ "$MINT" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]] || die "MINT doesn't look like a Solana address."
[[ -n "$RPC" ]] || die "RPC is empty — paste your mainnet RPC URL."
[[ "$RPC" == https://* ]] || die "RPC must be an https:// URL."
[[ "$RPC" != *devnet* ]] || die "RPC points at DEVNET — every balance will read 0 and nobody passes the gate."
[[ -f "$RELAYER_KEYPAIR_FILE" ]] || die "Can't find $RELAYER_KEYPAIR_FILE (the relayer secret key file)."
python3 -c "import json,sys; a=json.load(open('$RELAYER_KEYPAIR_FILE')); assert isinstance(a,list) and len(a) in (64,) " \
  2>/dev/null || die "$RELAYER_KEYPAIR_FILE isn't a 64-byte Solana keypair array."

echo "About to flip the LIVE stack to mainnet:"
echo "  mint     : $MINT"
echo "  rpc      : ${RPC%%\?*}?…(key hidden)"
echo "  treasury : $TREASURY_ADDRESS"
echo "  escrow   : $ESCROW_ADDRESS   (buy side only — ESCROW_KEYPAIR stays unset)"
echo "  gate     : $GATE_TOKENS DRIFTS"
read -r -p $'\nType  LAUNCH  to proceed: ' confirm
[[ "$confirm" == "LAUNCH" ]] || die "Aborted."

KEYPAIR_CONTENTS="$(cat "$RELAYER_KEYPAIR_FILE")"

# ─── Railway: the game server ─────────────────────────────────────────────────
echo "→ setting Railway variables on $RAILWAY_SERVICE…"
railway variables --service "$RAILWAY_SERVICE" \
  --set "TOKEN_MINT=$MINT" \
  --set "SOLANA_RPC=$RPC" \
  --set "AUTHORITY_KEYPAIR=$KEYPAIR_CONTENTS" \
  --set "TREASURY_ADDRESS=$TREASURY_ADDRESS" \
  --set "ESCROW_ADDRESS=$ESCROW_ADDRESS" \
  --set "GATE_TOKENS=$GATE_TOKENS" \
  --set "NODE_ENV=production"
# (ESCROW_KEYPAIR deliberately NOT set — sell side stays dark.
#  DATABASE_URL is a Railway reference — never touch it.)

# ─── Vercel: the client ───────────────────────────────────────────────────────
echo "→ setting Vercel NEXT_PUBLIC_TOKEN_MINT…"
vercel env rm NEXT_PUBLIC_TOKEN_MINT production -y >/dev/null 2>&1 || true
printf "%s" "$MINT" | vercel env add NEXT_PUBLIC_TOKEN_MINT production
echo "→ redeploying the client to production…"
vercel --prod

# ─── smoke test ───────────────────────────────────────────────────────────────
echo $'\n→ waiting 20s for the server to redeploy, then checking the gate…'
sleep 20
echo "GET $SERVER_URL/gate :"
curl -s "$SERVER_URL/gate" || true
echo $'\n\nDone. Now verify by hand:'
echo "  • the /gate JSON above shows your NEW mint and online:true"
echo "  • load the site, connect a wallet holding >= $GATE_TOKENS DRIFTS, confirm it lets you in"
echo "  • do one small burn (a wheel spin) and confirm it lands on-chain"
echo "  • fund the relayer (69pQX…wRbS) with ~1-2 SOL if you haven't — burns fail without it"
