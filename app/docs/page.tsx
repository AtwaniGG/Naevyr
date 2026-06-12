"use client";

import { useState } from "react";
import LandingShell from "@/components/LandingShell";
import { BURN_COSTS, burnAmt, BASE_PERKS, HOLDER_TIERS } from "@/game/types";

// The whitepaper: everything the realm is and how it works, in one document.
// Sidebar anchors on the left, long-form sections on the right.

const SECTIONS: { id: string; group: string; title: string }[] = [
  { id: "introduction", group: "Getting Started", title: "Introduction" },
  { id: "identity", group: "Getting Started", title: "Account & Identity" },
  { id: "gate", group: "Getting Started", title: "The Entry Gate" },
  { id: "first-session", group: "Getting Started", title: "Your First Session" },
  { id: "world", group: "The World", title: "The Realm & Regions" },
  { id: "drift", group: "The World", title: "The Drift & Seasons" },
  { id: "waystation", group: "The World", title: "The Waystation" },
  { id: "wilds", group: "The World", title: "The Wild Quadrants" },
  { id: "gathering", group: "Core Systems", title: "Gathering & Skills" },
  { id: "forge", group: "Core Systems", title: "The Forge & Equipment" },
  { id: "combat", group: "Core Systems", title: "Combat & Beasts" },
  { id: "death", group: "Core Systems", title: "Death & Tombstones" },
  { id: "claims", group: "Core Systems", title: "Land Claims" },
  { id: "market", group: "Core Systems", title: "The Market" },
  { id: "caravans", group: "Core Systems", title: "Caravans" },
  { id: "events", group: "Core Systems", title: "World Events" },
  { id: "token", group: "DRIFTS", title: "DRIFTS & Burn Rites" },
  { id: "tokenomics", group: "DRIFTS", title: "Tokenomics" },
  { id: "trust", group: "DRIFTS", title: "Architecture & Trust" },
  { id: "roadmap", group: "DRIFTS", title: "Roadmap" },
  { id: "disclaimer", group: "DRIFTS", title: "Disclaimer" },
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="drift-wordmark"
      style={{ fontSize: 22, margin: "44px 0 12px", scrollMarginTop: 80 }}
    >
      {children}
    </h2>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ font: "700 12px/1 var(--font-ui)", color: "var(--drift-gold)", margin: "18px 0 6px" }}>
      {children}
    </div>
  );
}

const P_STYLE: React.CSSProperties = {
  font: "400 13.5px/1.75 var(--font-ui)",
  color: "var(--text-secondary)",
  margin: "0 0 12px",
};

function P({ children }: { children: React.ReactNode }) {
  return <p style={P_STYLE}>{children}</p>;
}

function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--drift-gold)" }}>{children}</span>;
}

/** a plate from the Design System exports. The SVGs are frame SHEETS laid out
 *  horizontally; the paper shows frame 0 (background-size spans all frames). */
function Art({
  src, caption, frames = 1, ratio, maxWidth,
}: {
  src: string; caption: string; frames?: number; ratio: number; maxWidth?: number;
}) {
  return (
    <figure style={{ margin: "18px 0 22px" }}>
      <div
        style={{
          width: "100%", maxWidth: maxWidth ?? 480, aspectRatio: String(ratio),
          margin: "0 auto",
          backgroundImage: `url(${src})`,
          backgroundSize: `${frames * 100}% 100%`,
          backgroundPosition: "0 0",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          boxShadow: "0 0 0 1px rgba(124, 58, 237, 0.35), 4px 4px 0 0 rgba(10, 8, 16, 0.85)",
        }}
      />
      <figcaption
        style={{
          textAlign: "center", marginTop: 8,
          font: "400 10.5px/1.4 var(--font-ui)", color: "var(--text-muted)",
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

export default function DocsPage() {
  const [open, setOpen] = useState(true);
  const groups = [...new Set(SECTIONS.map((s) => s.group))];
  return (
    <LandingShell>
      <div style={{ display: "flex", maxWidth: 1160, margin: "0 auto", padding: "28px 22px", gap: 28, alignItems: "flex-start" }}>
        {/* ---- sidebar ---- */}
        <nav
          style={{
            position: "sticky", top: 70, width: 220, flexShrink: 0,
            background: "rgba(124, 58, 237, 0.05)",
            border: "1px solid rgba(124, 58, 237, 0.18)",
            padding: "14px 16px", maxHeight: "calc(100vh - 100px)", overflowY: "auto",
            display: open ? "block" : "none",
          }}
        >
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: 14 }}>
              <div style={{ font: "700 10px/1 var(--font-ui)", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                {g}
              </div>
              {SECTIONS.filter((s) => s.group === g).map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{
                    display: "block", padding: "5px 0", textDecoration: "none",
                    font: "500 12.5px/1.3 var(--font-ui)", color: "var(--text-secondary)",
                  }}
                >
                  {s.title}
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* ---- the paper ---- */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 720 }}>
          <div style={{ font: "700 11px/1 var(--font-ui)", color: "#a855f7", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            The Naevyr Papers
            <button
              onClick={() => setOpen(!open)}
              style={{ float: "right", background: "none", border: 0, color: "var(--text-muted)", cursor: "pointer", font: "500 11px var(--font-ui)" }}
            >
              {open ? "hide contents" : "show contents"}
            </button>
          </div>
          <h1 className="drift-wordmark" style={{ fontSize: 34, margin: "8px 0 4px" }}>
            The Whitepaper
          </h1>
          <P>
            Everything the realm is, how it works, and what DRIFTS does.
            Use the contents to jump to any chapter.
          </P>
          <Art
            src="/assets/design-system.nosync/assets/landing/hero_vista.svg"
            caption="The realm at dusk · the Drift gathers at the edges"
            frames={2}
            ratio={480 / 270}
          />

          <H id="introduction">Introduction</H>
          <P>
            Naevyr is a browser-based isometric MMO set in a realm being
            eaten, season by season, by a creeping corruption called <Gold>the
            Drift</Gold>. You wander a shared world with everyone else online:
            gather, cook, forge, fight, trade, stake land, escort caravans, and
            when the corruption reaches its terminal mark, stand at the
            Waystation through the Long Night or watch the realm reset and rise
            again.
          </P>
          <P>
            Nothing here is a static map. The Drift relocates the resources it
            swallows, erodes the wardings on claimed land, wakes a Colossus at
            each new threshold of corruption, and ultimately takes everything
            that is not held. The loop of the game is the loop of holding on.
          </P>

          <H id="identity">Account & Identity</H>
          <P>
            You walk in as a guest. Your browser holds a device key that IS
            your account; no email, no password. Your progress (satchel,
            skills, gold, cosmetics, quests) is snapshotted to the realm's
            ledger every few seconds while online, and to your browser when
            offline.
          </P>
          <P>
            Linking a <Gold>Solana wallet</Gold> binds your wanderer to it by
            signed message: the wallet signs a one-time challenge, the server
            verifies the signature, and from then on the wallet is your
            identity's anchor. No funds move. Nothing is ever requested on
            mainnet. One wallet binds to one wanderer.
          </P>

          <H id="gate">The Entry Gate</H>
          <Art
            src="/assets/design-system.nosync/assets/landing/gate_door.svg"
            caption="The warded door · it opens only to DRIFTS"
            frames={3}
            ratio={96 / 128}
            maxWidth={192}
          />
          <P>
            When the door is warded, entering the shared realm requires holding
            a posted amount of DRIFTS in a connected wallet. The
            landing page checks your balance against the chain when you press
            PLAY, and the realm's server checks it again, independently, when
            you actually join. The game never takes custody of DRIFTS; holding
            them in your own wallet is the key.
          </P>
          <P>
            With no wallet, or too few DRIFTS, the door stays shut. The realm
            can also run with the door open (no requirement), at its keepers'
            choosing.
          </P>

          <H id="first-session">Your First Session</H>
          <P>
            Name your wanderer at the gate. Click ground to walk; click a tree,
            rock or fishing pool to gather. Cook your fish (the Cook button in
            your satchel), eat to heal, and take your first materials to the
            Forge. When you carry more gold than you want to lose, the Vault in
            town will hold it. The day's three quests sit on the left; the
            activity log and chat sit on the right. Say something. The Drift is
            less heavy with company.
          </P>

          <H id="world">The Realm & Regions</H>
          <P>
            The realm is a 40×40 island. At its heart lies <Gold>Wanderer's
            Rest</Gold>, the protected town region around the Waystation, where
            corruption cannot reach. Beyond it the quadrants get stranger: the
            ash-blown <Gold>Ashen Flats</Gold> to the northwest, the boggy{" "}
            <Gold>Hollowmere Reach</Gold> to the southwest with its second
            lake, the <Gold>Bonefields</Gold> by the Mine, and the open drift
            country between. Two lakes carry rich fishing on their banks.
          </P>

          <H id="drift">The Drift & Seasons</H>
          <P>
            Each <Gold>season</Gold> (a 15-minute tick at production pace) the
            corruption spreads. Corrupt ground hurts to stand on, kills the
            unwary, and swallows resource nodes, which re-form elsewhere,
            preferring claimed land if any stands. Seasons carry names:
            Ashfall, Hollowmere, Gloamreach, Palewake, Vesselrot, Embershade,
            Duskharrow, Mournveil.
          </P>
          <P>
            Corruption can be fought: the Shrine's communal pot fires a
            cleansing when filled, burning the corruption nearest town. At
            terminal corruption the Long Night decides everything (see World
            Events).
          </P>

          <H id="waystation">The Waystation</H>
          <P>Nine structures stand in and around town, each with a keeper and a purpose:</P>
          <P>
            <Gold>The Dyeworks</Gold> sells cloak dyes, eye glows and auras.{" "}
            <Gold>The Vault</Gold> holds gold safe from your tombstone (2%
            withdrawal fee). <Gold>The Wheel</Gold> spins for gold, shards or
            nothing, jackpot 500g. <Gold>The Last Lantern</Gold> pours drinks
            that buff gathering, damage or sight. <Gold>The Furnisher</Gold>{" "}
            sells furnishings for your claim. <Gold>The Menagerie</Gold> sells
            small followers. <Gold>The Shrine of the Pale Flame</Gold> takes
            donations toward a cleansing. <Gold>The Pit</Gold> hosts wagered
            duels, winner takes the pot. <Gold>The Mine</Gold> holds seven gold
            veins that pay coin and mining experience, strike by strike.
          </P>
          <P>
            Each building with a door has an interior; walk to the counter and
            the keeper will talk. They have names, moods, and short patience.
          </P>

          <H id="wilds">The Wild Quadrants</H>
          <P>
            The <Gold>Husk Den</Gold> in the Ashen Flats is held by five elite
            husks guarding a war-chest (60-100g and shards; the den re-seeds a
            quarter hour after it is cleared). The <Gold>Ash Obelisk</Gold>{" "}
            rewrites the day's quests for gold or a DRIFTS burn, and sells a
            gathering blessing. The <Gold>Mirewife's Hut</Gold> in Hollowmere
            Reach brews stronger drinks that cost coin AND materials, and the
            Mirewife reads where the corruption will press next. In the{" "}
            <Gold>Drowned Field</Gold>, lore graves sink into the bog, and a
            lost tombstone holding 30-80g surfaces every few minutes for
            whoever finds it. None of these grounds are protected; the Drift
            besieges them like anywhere else.
          </P>

          <H id="gathering">Gathering & Skills</H>
          <P>
            Trees give driftwood, rocks give pale stone, pools give hollowfish.
            Each gather is a timed swing run by the server; one in ten swings
            is a <Gold>rich strike</Gold> and pays double. Four skills level
            independently: Woodcutting, Mining, Fishing, Combat. Higher skill
            means faster, harder, richer. Cooked fish heals; raw fish is a
            promise.
          </P>

          <H id="forge">The Forge & Equipment</H>
          <P>
            The Forge turns materials into gear across three slots: weapons
            (Bone Blade, Shard Saber), tools (Keen Tools, Shardtooth Tools),
            and wards (Hide Ward, Drift Sigil). Costs are paid from your
            satchel and validated by the realm. Gear auto-equips when it beats
            what you wear, renders on your wanderer, and follows you
            everywhere.
          </P>

          <H id="combat">Combat & Beasts</H>
          <P>
            Every beast in the overworld is shared; what you see is what
            everyone sees, and the realm's server rules every death. Husks
            (lv1-2) and stalkers (lv3+) wander their territory and only
            retaliate while you trade blows; you can always walk away. Raiders
            come with caravan ambushes and the Long Night, and drop coin. The{" "}
            <Gold>Colossus</Gold> is a 140-hp walking ruin that rises at each
            corruption threshold and pays 50g and five shards to whoever fells
            it. Beasts drop drift shards and hides; loot lands directly on your
            ledger.
          </P>

          <H id="death">Death & Tombstones</H>
          <P>
            Dying drops half your carried gold into a tombstone where you fell;
            you have five minutes to walk back and reclaim it before the Drift
            dissolves it. Banked gold is never at risk. The realm records what
            fell, so a tombstone pays back exactly once.
          </P>

          <H id="claims">Land Claims</H>
          <P>
            A claim stakes a 3×3 plot for <Gold>250g</Gold> (or a DRIFTS burn).
            Claimed ground resists the Drift, and relocated nodes prefer it,
            which makes claims the realm's farmland. But every season grinds a
            claim's warding down, three times faster when corruption stands at
            the fence; when the warding breaks, the land falls at once. Hold
            three claims at most. Furnish them; the campfires are yours.
          </P>
          <P>
            Holders can <Gold>reinforce</Gold>: a burn of{" "}
            {burnAmt(BURN_COSTS.reinforce)} DRIFTS mends your weakest claim's
            warding by 25 points, never past 100. It buys time, not immunity;
            the Drift always comes back, and the warding always needs feeding.
          </P>

          <H id="market">The Market</H>
          <P>
            The player market lists up to six offers per wanderer. Listing
            escrows the goods out of your satchel into the realm's keeping;
            buying moves gold ledger-to-ledger. Sellers offline when their
            goods move get paid on their next visit. Prices are yours to set;
            the Drift does not regulate commerce, only existence.
          </P>

          <H id="caravans">Caravans</H>
          <P>
            Every few minutes a wagon rolls from the Waystation toward a
            map-edge gate. Raider waves take it on the road; the wagon bleeds
            while they swarm. Kill the wave before the wagon dies and it rolls
            on; see it through the gate and the pay pool (richer in deeper
            corruption) splits pro-rata by kills among its escorts, paid live
            or held for your return.
          </P>

          <H id="events">World Events</H>
          <P>
            <Gold>Driftfall</Gold>: a falling star of corruption that births
            new resource nodes where it lands. <Gold>Ash-storms</Gold>: passing
            squalls that dim the realm. <Gold>The Colossus</Gold>: rises at
            10/25/40/60/80% corruption. <Gold>The Long Night</Gold>: at 90%
            corruption the horde falls on the Waystation with a shared kill
            quota on a three-minute clock. Hold the line and dawn burns the
            corruption back to 35% and pays every defender 250g. Fail, and the
            realm resets: fresh world, fresh Drift, claims and furnishings
            gone. Your vault, cosmetics and wallet persist; the land does not.
          </P>

          <H id="token">DRIFTS & Burn Rites</H>
          <Art
            src="/assets/design-system.nosync/assets/brand/emblem-64.svg"
            caption="DRIFTS · the realm's coin"
            ratio={1}
            maxWidth={128}
          />
          <P>
            <Gold>DRIFTS</Gold> lives on Solana and is pure
            utility. It does two things: <Gold>opens the door</Gold> (the entry
            gate, when warded) and <Gold>pays for rites by burning</Gold>.
            Every rite paid in DRIFTS splits the same way, by formula: for a
            rite costing <Gold>c</Gold>, the realm burns{" "}
            <Gold>⌈c/2⌉</Gold> on-chain, destroyed forever, and tithes{" "}
            <Gold>⌊c/2⌋</Gold> to the realm's treasury, the protocol fee that
            funds development. The burn always rounds up; you can never
            under-burn. (Until the treasury wallet is posted, the split rests
            and the full cost burns.)
          </P>
          <div style={{ margin: "0 0 16px", overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", font: "400 12px/1.6 var(--font-ui)", color: "var(--text-secondary)" }}>
              <thead>
                <tr>
                  {["Rite", "Cost", "Burned ⌈c/2⌉", "Treasury ⌊c/2⌋"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--drift-gold)", borderBottom: "1px solid rgba(124,58,237,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ["spin", "Wheel spin"],
                  ["claim", "Stake a 3×3 claim (auto for holders in claim mode)"],
                  ["reinforce", "Reinforce your weakest claim (+25 warding)"],
                  ["aura", "Dyeworks aura"],
                  ["cleanse", "Shrine cleansing (+150g to the pot)"],
                  ["obelisk", "Obelisk quest reroll"],
                  ["prestigeDye", "Drift-touched cloak dye (burn-only)"],
                  ["prestigeAura", "Drift-touched aura (burn-only)"],
                  ["prestigeTitle", "Drift-touched title (burn-only)"],
                ] as [keyof typeof BURN_COSTS, string][]).map(([k, label]) => {
                  const c = BURN_COSTS[k];
                  const burned = Math.ceil(c / 2);
                  return (
                    <tr key={k}>
                      <td style={{ padding: "5px 10px", color: "var(--text-primary)" }}>{label}</td>
                      <td style={{ padding: "5px 10px" }}>{c.toLocaleString()}</td>
                      <td style={{ padding: "5px 10px" }}>{burned.toLocaleString()}</td>
                      <td style={{ padding: "5px 10px" }}>{(c - burned).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <P>
            <Gold>Drift-touched</Gold> cosmetics are the prestige shelf at the
            Dyeworks: a cloak dyed in corruption, four auras (the Ashen Crown,
            the Corruption Halo, the Ember Cinder, the Bonewisp) and titles
            that outrank every earned one. They can only be burned into being,
            never bought with gold. While the <Gold>Founder window</Gold>{" "}
            stands during the beta, the first verified burn from a wallet marks
            it forever: the Founder title and the Ashen Crown, never grantable
            again after the window closes.
          </P>
          <P>
            The server builds and fee-pays every burn transaction, so players
            need zero SOL; your wallet only countersigns the burn itself. A
            burn signature spends exactly once; replays are refused. The
            server verifies both halves of the split on-chain, the burn and
            the tithe, before any effect lands. The realm's lifetime burn
            count is public: the counter rides the site's nav, fed by the
            same table that rules the replays.
          </P>
          <P>
            <Gold>Holding tiers.</Gold> What you hold is also what you are.
            The realm reads your linked wallet's balance and widens your
            standing with it, enforced by the server on every rail:
          </P>
          <div style={{ margin: "0 0 16px", overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", font: "400 12px/1.6 var(--font-ui)", color: "var(--text-secondary)" }}>
              <thead>
                <tr>
                  {["Tier", "DRIFTS held", "Claims", "Stalls", "Vault fee", "Rich strikes", "Caravan share"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--drift-gold)", borderBottom: "1px solid rgba(124,58,237,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[BASE_PERKS, ...[...HOLDER_TIERS].reverse()].map((t) => (
                  <tr key={t.key || "holder"}>
                    <td style={{ padding: "5px 10px", color: "var(--text-primary)" }}>{t.label || "Holder"}</td>
                    <td style={{ padding: "5px 10px" }}>{t.min > 0 ? `${t.min.toLocaleString()}+` : "1+"}</td>
                    <td style={{ padding: "5px 10px" }}>{t.claimSlots}</td>
                    <td style={{ padding: "5px 10px" }}>{t.marketSlots}</td>
                    <td style={{ padding: "5px 10px" }}>{(t.vaultFee * 100).toLocaleString()}%</td>
                    <td style={{ padding: "5px 10px" }}>{Math.round(t.richStrikeP * 100)}%</td>
                    <td style={{ padding: "5px 10px" }}>×{t.caravanWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            Weighted caravan shares split the same pool; they never grow it.
            Sell or move your DRIFTS and the standing leaves with them.
          </P>

          <H id="tokenomics">Tokenomics</H>
          <P>
            <Gold>The coin.</Gold> DRIFTS is an SPL token on Solana (6
            decimals). The beta runs on a devnet test mint with no value; the
            real coin launches on pump.fun, a fair-launch bonding curve: no
            presale, no allocation rounds, pump.fun's standard fixed supply of
            one billion minted once, with the realm's keepers buying on the
            same curve as everyone else. After launch nothing can mint more.
            The realm's design only ever removes coins from circulation.
          </P>
          <P>
            <Gold>Demand.</Gold> Three forces pull DRIFTS into wallets, all of
            them utility:
          </P>
          <P>
            1. <Gold>The door.</Gold> Entering the shared realm requires
            holding the posted amount in a connected wallet; the production
            door posts <Gold>1,000 DRIFTS</Gold>, proven by a signed message,
            checked again at every join. Every active wanderer is a holder by
            definition.
            <br />
            2. <Gold>Standing.</Gold> The holding tiers above: claims, stalls,
            vault fees, rich strikes and caravan weight all scale with what the
            wallet holds. The realm reads balances live; standing follows the
            coins.
            <br />
            3. <Gold>The rites.</Gold> Spins, claims, reinforcements, auras,
            cleansings and rerolls can be paid in DRIFTS, and the Drift-touched
            shelf takes nothing else.
          </P>
          <P>
            <Gold>Supply sinks, by the numbers.</Gold> Every rite splits by
            the formula above: half burned forever, half tithed to the
            treasury. Worked through: a {burnAmt(BURN_COSTS.spin)} spin burns{" "}
            {Math.ceil(BURN_COSTS.spin / 2).toLocaleString()} and tithes{" "}
            {Math.floor(BURN_COSTS.spin / 2).toLocaleString()}; a{" "}
            {burnAmt(BURN_COSTS.claim)} claim burns{" "}
            {Math.ceil(BURN_COSTS.claim / 2).toLocaleString()} and tithes{" "}
            {Math.floor(BURN_COSTS.claim / 2).toLocaleString()}; a{" "}
            {burnAmt(BURN_COSTS.prestigeTitle)} Drift-touched title burns{" "}
            {Math.ceil(BURN_COSTS.prestigeTitle / 2).toLocaleString()} and
            tithes {Math.floor(BURN_COSTS.prestigeTitle / 2).toLocaleString()}.
            Burned coins are destroyed on-chain and the supply never recovers.
            Gold sinks keep the in-game economy hungry so the rites stay used:
            the Wheel takes 50g a spin and returns about 42.5g in gold and a
            sixth of a shard on average, a house edge near 10-15%, verified
            math, working as a sink; claims erode every season; the vault
            takes up to 2% on withdrawal; death drops half your purse.
          </P>
          <P>
            <Gold>The flywheel.</Gold> The loop is mechanical, not a promise:
            rites consume DRIFTS; half of every rite is burned, shrinking
            supply with play; the other half funds development and, after the
            mainnet launch, buyback-and-burn and the Exchange's float. More
            play means more rites; more rites mean fewer coins. No part of the
            loop mints, yields, or pays holders.
          </P>
          <P>
            <Gold>What the house never does.</Gold> The realm's treasury only
            ever <Gold>receives</Gold> the protocol fee; it pays no players,
            sells no coins in-game, takes no custody (the gate reads balances;
            linking signs a message; burns are countersigned by your own
            wallet), and promises no yield. Gold, the earnable currency, lives
            on the realm's ledgers and is not the coin. Anything that would
            make DRIFTS flow FROM the realm TO players is designed out on
            purpose.
          </P>
          <P>
            <Gold>Ahead.</Gold> After the mainnet launch comes the Exchange: a
            two-sided gold-for-DRIFTS market where payouts come only from what
            other players paid in, with daily caps scaled by holdings. Player
            to player, never house to player. Until then, the loop is simple:
            hold to enter, hold more to stand taller, burn to act.
          </P>

          <H id="trust">Architecture & Trust</H>
          <P>
            The realm runs on an authoritative server: movement, gather timers
            and loot, the gold and item ledgers, every overworld beast's life
            and death, claims, the market's goods and coin, the vault, the
            wheel's rolls, duel wagers, caravan and night quotas, and every
            DRIFTS burn are all server-ruled. What remains client-side is
            cosmetic or being hardened next: experience, quest progress, drink
            buffs, and your own vitals.
          </P>
          <P>
            Offline, the game runs a full local simulation: you can wander,
            gather and forge alone, and the shared features wait for the realm
            to return.
          </P>

          <H id="roadmap">Roadmap</H>
          <P>
            The realm is hardened and deployed; the beta stands on public
            infrastructure now. Next, and only on its own word: the DRIFTS
            mainnet launch on pump.fun, then the Exchange. The realm does not
            rush its own door.
          </P>

          <H id="disclaimer">Disclaimer</H>
          <P>
            Naevyr is in beta. DRIFTS is game utility: it opens the
            door and feeds the burn rites. It is not an investment, promises
            no return, and its market price can fall to zero. Nothing in the
            realm, this paper, or its keepers' mouths is financial advice.
            The Drift takes everything eventually; spend accordingly.
          </P>
        </div>
      </div>
    </LandingShell>
  );
}
