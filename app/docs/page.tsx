"use client";

import { useState, useEffect } from "react";
import LandingShell from "@/components/LandingShell";
import { useViewport } from "@/game/state/viewport";
import {
  BURN_COSTS, burnAmt, BASE_PERKS, HOLDER_TIERS,
  DRIFT_WHEEL, DRIFT_WHEEL_PITY, GOLD_WHEEL, GUILD, EXCHANGE, RELIC_MARKET, DUEL_DRIFTS,
  PRESTIGE_CATALOG, AVATAR_KINDS, AVATAR_CHANNELS,
} from "@/game/types";

// The whitepaper: everything the realm is and how it works, in one document.
// Sidebar anchors on the left, long-form sections on the right.

const SECTIONS: { id: string; group: string; title: string }[] = [
  { id: "introduction", group: "Getting Started", title: "Introduction" },
  { id: "identity", group: "Getting Started", title: "Account & Identity" },
  { id: "gate", group: "Getting Started", title: "The Entry Gate" },
  { id: "guest", group: "Getting Started", title: "The Guest Drift" },
  { id: "first-session", group: "Getting Started", title: "Your First Session" },
  { id: "world", group: "The World", title: "The Realm & Regions" },
  { id: "drift", group: "The World", title: "The Drift & Seasons" },
  { id: "waystation", group: "The World", title: "The Waystation" },
  { id: "wilds", group: "The World", title: "The Wild Quadrants" },
  { id: "frontier", group: "The World", title: "The Frontier" },
  { id: "gathering", group: "Core Systems", title: "Gathering & Skills" },
  { id: "forge", group: "Core Systems", title: "The Forge & Equipment" },
  { id: "combat", group: "Core Systems", title: "Combat & Beasts" },
  { id: "death", group: "Core Systems", title: "Death & Tombstones" },
  { id: "claims", group: "Core Systems", title: "Land Claims" },
  { id: "market", group: "Core Systems", title: "The Market" },
  { id: "caravans", group: "Core Systems", title: "Caravans" },
  { id: "guilds", group: "Core Systems", title: "Guilds & Territory" },
  { id: "streaks", group: "Core Systems", title: "Streaks & Boards" },
  { id: "events", group: "Core Systems", title: "World Events" },
  { id: "token", group: "DRIFTS", title: "DRIFTS & Burn Rites" },
  { id: "driftwheel", group: "DRIFTS", title: "The Drift Wheel & Relics" },
  { id: "exchange", group: "DRIFTS", title: "The Exchange" },
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
function AvatarGallery() {
  return (
    <figure style={{ margin: "18px 0 22px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        {AVATAR_KINDS.map((k) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: "100%", aspectRatio: String(48 / 64),
                backgroundImage: `url(/assets/design-system.nosync/assets/avatars/portrait_${k}.svg)`,
                backgroundSize: "200% 100%",
                backgroundPosition: "0 0",
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
                boxShadow: "0 0 0 1px rgba(124, 58, 237, 0.35), 4px 4px 0 0 rgba(10, 8, 16, 0.85)",
              }}
            />
            <div style={{ font: "600 11px/1.2 var(--font-ui)", color: "#d8b4fe", textAlign: "center" }}>
              {PRESTIGE_CATALOG[k].label}
            </div>
          </div>
        ))}
      </div>
      <figcaption
        style={{
          textAlign: "center", marginTop: 10,
          font: "400 10.5px/1.4 var(--font-ui)", color: "var(--text-muted)",
        }}
      >
        The four premium bodies · each tried on at the Drift Mirror before the burn
      </figcaption>
    </figure>
  );
}

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
  const isPhone = useViewport().isPhone;
  // the 220px sticky sidebar would steal a phone's whole content width — start
  // it collapsed there (the "show contents" toggle still reveals it inline).
  useEffect(() => {
    if (isPhone) setOpen(false);
  }, [isPhone]);
  const groups = [...new Set(SECTIONS.map((s) => s.group))];
  return (
    <LandingShell>
      <div style={{ display: "flex", flexDirection: isPhone ? "column" : "row", maxWidth: 1160, margin: "0 auto", padding: "28px 22px", gap: 28, alignItems: isPhone ? "stretch" : "flex-start" }}>
        {/* ---- sidebar ---- */}
        <nav
          style={{
            position: isPhone ? "static" : "sticky", top: 70,
            width: isPhone ? "100%" : 220, flexShrink: 0, boxSizing: "border-box",
            background: "rgba(124, 58, 237, 0.05)",
            border: "1px solid rgba(124, 58, 237, 0.18)",
            padding: "14px 16px", maxHeight: isPhone ? "none" : "calc(100vh - 100px)", overflowY: "auto",
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

          <H id="guest">The Guest Drift</H>
          <Art
            src="/assets/design-system.nosync/assets/worldchoice/guest_vista.svg"
            caption="The Guest Drift · free to enter, no wallet asked"
            frames={2}
            ratio={256 / 160}
            maxWidth={256}
          />
          <P>
            You do not need a wallet to set foot in the realm. At the door, the
            Guest Drift opens free to anyone. You name a wanderer and step into
            the same shared world the holders walk, alongside the same beasts,
            caravans and other players. Walk, gather, fish, cook, craft, fight
            the Drift's beasts, learn the land. The lessons of the Threshold are
            yours either way.
          </P>
          <P>
            What a guest cannot touch is the economy and the chain. Land claims,
            the Market, the Vault, the Wheel, the Exchange, guilds, the Drift
            Wheel and every burn rite stay shut behind the Realm's door. The
            keepers' counters trade with holders only. A guest earns gold and
            loot in the moment, but that purse is borrowed light: guest progress
            is never bound to a wallet and does not carry into a Realm account.
          </P>
          <P>
            The Guest Drift is a way to see the realm before you commit, not a
            second world. When you are ready for land, markets and DRIFTS,
            leave the Guest Drift, connect a wallet, and enter the Realm proper.
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
            Each <Gold>season</Gold> (a 30-minute tick at production pace) the
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
            <Gold>The Dyeworks</Gold> sells cloak dyes, eye glows and auras,
            and keeps the Drift Mirror: premium avatars are tried on at the
            glass before any DRIFTS burn.{" "}
            <Gold>The Vault</Gold> holds gold safe from your tombstone (2%
            withdrawal fee). <Gold>The Wheel</Gold> spins for gold, shards or
            nothing, jackpot 500g. <Gold>The Last Lantern</Gold> pours drinks
            that buff gathering, damage or sight. <Gold>The Furnisher</Gold>{" "}
            sells furnishings for your claim. <Gold>The Menagerie</Gold> sells
            small followers. <Gold>The Shrine of the Pale Flame</Gold> takes
            donations toward a cleansing. <Gold>The Pit</Gold> hosts wagered
            duels in gold or DRIFTS: stake at least {DUEL_DRIFTS.min.toLocaleString()}{" "}
            DRIFTS, the winner takes nine tenths of the pot and the house keeps a
            tenth. <Gold>The Mine</Gold> holds seven gold
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

          <H id="frontier">The Frontier</H>
          <P>
            Past the old edge the map opens into a true frontier: four{" "}
            <Gold>waystations</Gold> on the spokes out of town and a{" "}
            <Gold>Frontier Outpost</Gold> deep in the southeast. There is work out
            there for those who walk it.
          </P>
          <P>
            <Gold>Bounty boards.</Gold> Each waystation posts that region's
            contracts. Take up to three, cull beasts or gather in the named region,
            and turn them in for gold and drift shards. The boards re-post on their
            own clock. <Gold>The Roaming Trader,</Gold> a hooded peddler with a pack
            mule, walks the roads between waystations: catch them parked to buy a
            rotating stock with gold, or sell loot back at a premium over the town
            vendor.
          </P>
          <P>
            <Gold>Salvage.</Gold> Wagon wrecks, ruined huts, and old campfires give
            up gold and scrap to whoever searches them, then pick clean for a few
            minutes. <Gold>Camp craft:</Gold> the roadside resource camps carry field
            tools, a cook-fire to cook your catch on the spot, an anvil and a tannery
            that open the Forge so you can work far from town.
          </P>
          <P>
            <Gold>The Outpost & standing.</Gold> The Quartermaster takes supply
            contracts, paying gold and <Gold>reputation</Gold> for delivered goods.
            Standing climbs Drifter, Recruit, Regular, Veteran, and each rank opens
            more of the quartermaster's wares.
          </P>
          <P>
            <Gold>Fast-travel.</Gold> Step up to any waystation and walk the Drift
            Roads to another for <Gold>60g</Gold>, or burn DRIFTS to step the leyline
            instantly. The <Gold>Stable</Gold> sells a steed for 3,000g, and a{" "}
            <Gold>Swift Steed</Gold> shoeing for 4,000g more is the fastest thing on
            the roads.
          </P>
          <P>
            <Gold>The Sunken Lair.</Gold> By the lake in the deep southwest, a drowned
            king and its pack hold a sunken ruin. Camp bosses and the{" "}
            <Gold>rare elites</Gold> that breed in the deep frontier pay a richer
            haul, and sometimes a Drift cache of gold and shards spills from the
            corpse.
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
          <P>
            <Gold>Reinforce.</Gold> At the rune-anvil, an equipped piece can be
            reinforced with gold: each reinforcement adds a point of power, up to
            five, for an escalating cost. A veteran's gold sink, and the way to
            outgrow the recipes.
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
          <P>
            <Gold>Claim upgrades.</Gold> The Furnisher sells working props for your
            ground: a <Gold>Storage Stash</Gold> that opens your vault from the field,
            a <Gold>Workbench</Gold> that opens the Forge, and a <Gold>Drift-Ward</Gold>{" "}
            that halves the season's erosion while it stands. Place them on your claim,
            then use them where you live.
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

          <H id="guilds">Guilds & Territory</H>
          <P>
            A guild is a banner with a treasury behind it. Founding one takes
            both standing and sacrifice: a linked wallet holding{" "}
            <Gold>{GUILD.foundHold.toLocaleString()} DRIFTS</Gold> and a{" "}
            <Gold>{burnAmt(BURN_COSTS.guildFound)} DRIFTS burn</Gold>. A guild
            carries up to <Gold>{GUILD.maxMembers} wanderers</Gold>; joining is
            free; your tag rides your nameplate everywhere.
          </P>
          <P>
            <Gold>Territory.</Gold> The four wild regions — {GUILD.regions.join(", ")} —
            each take one banner (the Waystation takes none). The founder
            stakes a region for <Gold>{burnAmt(BURN_COSTS.guildTerritory)} DRIFTS</Gold>,
            which holds it for <Gold>48 hours</Gold>. Any member can feed the
            banner: <Gold>{burnAmt(BURN_COSTS.guildUpkeep)} DRIFTS</Gold> buys
            another 48 hours, payable at most 7 days ahead. Let it starve and
            the banner falls; the region opens to any guild.
          </P>
          <P>
            <Gold>What the banner pays.</Gold> While it stands, members gain{" "}
            <Gold>+{Math.round(GUILD.richStrikeBonus * 100)}% rich-strike odds</Gold>{" "}
            gathering inside their held region, and{" "}
            <Gold>+{GUILD.caravanWeightBonus} caravan payout weight</Gold> per
            kill anywhere (a heavier share of the same pool — zero inflation,
            like every perk in the realm). An active guild burns about{" "}
            <Gold>5,000 DRIFTS a day</Gold> keeping its ground: territory is
            the realm's structural, recurring sink.
          </P>

          <H id="streaks">Streaks & Boards</H>
          <P>
            The realm rewards return. Each new day you log in continues your{" "}
            <Gold>login streak</Gold> and pays an escalating, capped reward in gold;
            miss a day and it resets. Milestones earn <Gold>titles</Gold> for good,
            Beast-tested through Centurion, Gilded through Magnate, Provider,
            Deathblow and more, each yours to wear once the bar is crossed.
          </P>
          <P>
            <Gold>The boards.</Gold> The Leaderboard keeps a public reckoning:{" "}
            <Gold>Wealth</Gold> (purse and vault together), <Gold>Kills</Gold>,{" "}
            <Gold>Total Level</Gold>, and the longest <Gold>Streak</Gold>. The realm
            sees who walks it hardest.
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
                  ["driftSpin", "Drift Wheel spin (gacha cosmetics)"],
                  ["cache", "Drift Cache (3 Drift Wheel spins, 20% off)"],
                  ["claim", "Stake a 3×3 claim (auto for holders in claim mode)"],
                  ["reinforce", "Reinforce your weakest claim (+25 warding)"],
                  ["aura", "Dyeworks aura"],
                  ["cleanse", "Shrine cleansing (+150g to the pot)"],
                  ["obelisk", "Obelisk quest reroll"],
                  ["prestigeDye", "Drift-touched cloak dye (burn-only)"],
                  ["prestigeAura", "Drift-touched aura (burn-only)"],
                  ["prestigeTitle", "Drift-touched title (burn-only)"],
                  ["prestigeAvatar", "Premium avatar: a whole other body (burn-only)"],
                  ["guildFound", "Found a guild (also requires holding 25,000)"],
                  ["guildTerritory", "Stake a guild banner over a region (48h)"],
                  ["guildUpkeep", "Feed the banner (+48h, any member)"],
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
            <Gold>Premium avatars</Gold> are the top of that shelf: four whole
            other bodies, each <Gold>{burnAmt(BURN_COSTS.prestigeAvatar)} DRIFTS</Gold>,
            each with two dye channels of its own. Every one is tried on at the
            Dyeworks&apos; Drift Mirror before the burn; what the glass shows
            is exactly what the realm sees. They are bound to the buyer and
            never trade.
          </P>
          <AvatarGallery />
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ borderCollapse: "collapse", font: "400 12px/1.5 var(--font-ui)", color: "var(--text-secondary)", minWidth: 480 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "5px 10px" }}>Avatar</th>
                  <th style={{ padding: "5px 10px" }}>Who they were</th>
                  <th style={{ padding: "5px 10px" }}>Dye channels</th>
                </tr>
              </thead>
              <tbody>
                {AVATAR_KINDS.map((k) => (
                  <tr key={k}>
                    <td style={{ padding: "5px 10px", color: "#d8b4fe" }}>{PRESTIGE_CATALOG[k].label}</td>
                    <td style={{ padding: "5px 10px" }}>{PRESTIGE_CATALOG[k].desc}.</td>
                    <td style={{ padding: "5px 10px", color: "var(--text-primary)" }}>
                      {Object.keys(AVATAR_CHANNELS[k]).join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            The server builds each burn transaction, but your wallet is the
            sole signer and pays the small network fee, so the rite never
            passes through a relayer that wallet scanners could mistake for a
            drainer. A burn signature spends exactly once; replays are refused. The
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

          <H id="driftwheel">The Drift Wheel & Relics</H>
          <P>
            Beside the gold wheel stands a darker one. The{" "}
            <Gold>Drift Wheel</Gold> takes only burned DRIFTS —{" "}
            <Gold>{burnAmt(BURN_COSTS.driftSpin)} a spin</Gold>, or a{" "}
            <Gold>Drift Cache</Gold>: three spins bundled for{" "}
            <Gold>{burnAmt(BURN_COSTS.cache)}</Gold> (20% off). It pays
            cosmetics and shards, <Gold>never DRIFTS</Gold> — the wheel is a
            sink with style, not a faucet. The exact odds, the same table the
            server rolls:
          </P>
          <div style={{ margin: "0 0 16px", overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", font: "400 12px/1.6 var(--font-ui)", color: "var(--text-secondary)" }}>
              <thead>
                <tr>
                  {["Odds", "Prize", "If already owned"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--drift-gold)", borderBottom: "1px solid rgba(124,58,237,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DRIFT_WHEEL.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: "5px 10px" }}>{Math.round(s.p * 100)}%</td>
                    <td style={{ padding: "5px 10px", color: s.kind === "prestigeAura" ? "#d8b4fe" : "var(--text-primary)" }}>
                      {s.kind === "shards" ? `${s.amount} Drift Shards`
                        : s.kind === "dye" ? "A cloak dye you lack"
                        : s.kind === "eye" ? "An eye glow you lack"
                        : s.kind === "aura" ? "An aura you lack"
                        : s.kind === "pet" ? "A pet you lack"
                        : s.kind === "title" ? "The title Wheelturned"
                        : "A Drift-touched prestige aura"}
                    </td>
                    <td style={{ padding: "5px 10px" }}>{s.dupShards ? `${s.dupShards} shards` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            <Gold>The pity rule.</Gold> {DRIFT_WHEEL_PITY} dry spins (no aura,
            pet, title or relic) force the next spin into the rare band, odds
            re-weighted 47.6% aura · 28.6% pet · 19% title · 4.8% relic. The
            counter persists across sessions and resets on any rare. Long-run,
            a spin returns roughly 4-5 shards' worth of value (60-75g) per{" "}
            {burnAmt(BURN_COSTS.driftSpin)} burned — the house keeps its edge;
            the prize is the look.
          </P>
          <P>
            <Gold>The relic market.</Gold> Drift-touched cosmetics — and only
            those, because only their ownership lives on the realm's ledgers —
            trade wanderer to wanderer, priced in DRIFTS (
            {RELIC_MARKET.minPrice.toLocaleString()} minimum,{" "}
            {RELIC_MARKET.maxListings} listings per seller). The buyer pays the
            seller's wallet directly on-chain; the realm takes{" "}
            <Gold>{Math.round(RELIC_MARKET.feePct * 100)}% and burns it</Gold>.
            Worked through: a relic sold at 30,000 DRIFTS pays the seller
            28,500 and burns 1,500 forever. Titles and premium avatars are
            soul-bound and never trade. The server verifies both legs of every sale and moves the
            ownership itself — a relic worn is a relic owned, provably.
          </P>

          <H id="exchange">The Exchange</H>
          <P>
            At the Vault keeper's counter, gold and DRIFTS change hands at
            fixed rates — anchored to the realm's own arithmetic. The economy
            already prices <Gold>100 DRIFTS ≈ 1 gold</Gold> (a 50g spin or a{" "}
            {burnAmt(BURN_COSTS.spin)}-DRIFTS burn buy the same wheel; a 250g
            claim or {burnAmt(BURN_COSTS.claim)} DRIFTS stake the same land).
            The counter buys gold near that anchor and sells it well below,
            a deliberate spread that keeps the escrow pool whole:
          </P>
          <P>
            <Gold>Buying gold</Gold> costs <Gold>{EXCHANGE.buyRate} DRIFTS per
            1g</Gold>, paid by on-chain transfer into the realm's escrow pool,
            capped at <Gold>{EXCHANGE.buyCapPerDay.toLocaleString()}g per
            wallet per day</Gold>.
            <br />
            <Gold>Selling gold</Gold> pays <Gold>{EXCHANGE.sellRate} DRIFTS per
            1g</Gold>, out of that same pool — and ONLY out of it. Payouts come
            from what other players paid in, never minted, never a house
            faucet. When the pool runs dry, the merchant's purse is light and
            the counter waits for buyers.
          </P>
          <P>
            <Gold>Both sides are live.</Gold> The realm seeded the escrow pool,
            so the merchant buys gold for DRIFTS from day one as readily as it
            sells it. The pool stays finite: every DRIFTS paid out for gold
            leaves it, and only player buys refill it, so the sell side can run
            dry between waves of buyers and the merchant's purse goes light until
            they return.
          </P>
          <P>
            <Gold>A guard on the young pool.</Gold> In the realm's first days
            every standing shares one daily sell cap of{" "}
            {EXCHANGE.sellCapPerDay[""]}g, no matter what it holds. The pool is
            finite and freshly seeded, so the keeper changes coin slowly while
            buyers deepen it. The wider, standing-scaled limits return once the
            coffers can bear them. The table below shows the live caps.
          </P>
          <div style={{ margin: "0 0 16px", overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", font: "400 12px/1.6 var(--font-ui)", color: "var(--text-secondary)" }}>
              <thead>
                <tr>
                  {["Standing", "DRIFTS held", "Daily sell cap", "Max DRIFTS out/day"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--drift-gold)", borderBottom: "1px solid rgba(124,58,237,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Holder", "1+", EXCHANGE.sellCapPerDay[""]],
                  ["Keeper", "10,000+", EXCHANGE.sellCapPerDay.keeper],
                  ["Warden", "100,000+", EXCHANGE.sellCapPerDay.warden],
                  ["Drift Lord", "1,000,000+", EXCHANGE.sellCapPerDay.driftlord],
                ].map(([label, held, cap]) => (
                  <tr key={String(label)}>
                    <td style={{ padding: "5px 10px", color: "var(--text-primary)" }}>{label}</td>
                    <td style={{ padding: "5px 10px" }}>{held}</td>
                    <td style={{ padding: "5px 10px" }}>{Number(cap).toLocaleString()}g</td>
                    <td style={{ padding: "5px 10px" }}>{(Number(cap) * EXCHANGE.sellRate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            The {EXCHANGE.buyRate - EXCHANGE.sellRate}-DRIFTS round-trip spread
            (buy at {EXCHANGE.buyRate}, sell at {EXCHANGE.sellRate}) stays in the
            pool as its buffer — it blocks wash-trading and keeps the counter
            solvent. Trades start at{" "}
            {EXCHANGE.minTrade}g. The grind loop is complete: items sell for
            gold, gold trades for DRIFTS, DRIFTS burn for standing. Play feeds
            the coin; the coin never prints.
          </P>

          <H id="tokenomics">Tokenomics</H>
          <Sub>At a glance</Sub>
          <div style={{ margin: "0 0 16px", overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", font: "400 12px/1.7 var(--font-ui)", color: "var(--text-secondary)" }}>
              <tbody>
                {([
                  ["Ticker", "DRIFTS"],
                  ["Network", "Solana"],
                  ["Standard", "SPL Token"],
                  ["Total supply", "1,000,000,000 (fixed, minted once)"],
                  ["Decimals", "6"],
                  ["Launch", "pump.fun, fair-launch bonding curve"],
                  ["New issuance", "none. Mint authority revoked at launch"],
                  ["Entry gate", "hold 1,000 DRIFTS to enter the realm"],
                  ["Contract", "ArTtDETxYH7X98XhuUEoLb6fKXGUkjgipG66wXnepump"],
                ] as [string, string][]).map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: "5px 10px", color: "var(--drift-gold)", whiteSpace: "nowrap", verticalAlign: "top", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>{k}</td>
                    <td style={{ padding: "5px 10px", color: "var(--text-primary)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            <Gold>The coin.</Gold> DRIFTS is an SPL token on Solana with six
            decimals, live on mainnet through a pump.fun fair launch. The supply
            is one billion, minted once; the mint authority is revoked, so
            nothing can ever mint more, and the realm's design only ever removes
            coins from circulation.
          </P>
          <P>
            <Gold>Distribution.</Gold> It is a fair launch, not a raise. There
            is <Gold>no presale, no private round, no venture allocation, no
            team set-aside and no vesting schedule</Gold>. The entire supply
            enters circulation through pump.fun's public bonding curve, where
            the first coin and the last are bought on the same terms. Any DRIFTS
            the realm's keepers hold were bought on that open curve, like yours.
            Nothing was minted to insiders, and there are no locked tranches
            waiting to unlock on you.
          </P>
          <P>
            <Gold>Demand.</Gold> Several forces pull DRIFTS into wallets, all of
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
            cleansings and rerolls can be paid in DRIFTS; the Drift Wheel, the
            Drift-touched shelf and every guild banner take nothing else.
            <br />
            4. <Gold>The grind loop.</Gold> The Exchange turns play into
            demand: gold sells for DRIFTS only out of what buyers paid in, so
            every seller needs a buyer first.
            <br />
            5. <Gold>The banner.</Gold> Guilds hold ground only while they keep
            burning: founding 50,000, staking 25,000, upkeep 10,000 per 48
            hours, about 5,000 a day per active guild, forever.
            <br />
            6. <Gold>The sand.</Gold> The Pit takes DRIFTS wagers: two fighters
            stake at least {DUEL_DRIFTS.min.toLocaleString()} each, the winner
            takes nine tenths of the pot and the house keeps a tenth. Every duel
            locks real DRIFTS in escrow and skims {DUEL_DRIFTS.feePct * 100}% to
            the realm.
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
          <Sub>The treasury · where the other half goes</Sub>
          <P>
            The tithed half is not profit skimmed off players; it funds the
            realm and, by design, pushes back toward the coin. It pays for{" "}
            <Gold>development and servers</Gold> and seeds the{" "}
            <Gold>Exchange's float</Gold> once that opens. After the mainnet launch the treasury also funds{" "}
            <Gold>buyback-and-burn</Gold>: coins bought back off the open market
            and destroyed, the same direction as every rite. The treasury is a
            wallet the keepers control and post publicly; every coin it receives
            arrives as an on-chain tithe leg anyone can read.
          </P>
          <Sub>Liquidity and the curve</Sub>
          <P>
            pump.fun provides liquidity from the first second through its
            bonding curve: the curve itself is the market, so there is always a
            price to buy or sell at. As the curve fills it{" "}
            <Gold>graduates</Gold> to a decentralized exchange, where its
            liquidity migrates into an open pool and ordinary on-chain trading
            takes over. Price is whatever the market sets, moment to moment.
            There is <Gold>no price floor, no guaranteed buyback, and no promise
            the pool stays deep</Gold>. Liquidity can thin and the price can
            fall to zero.
          </P>
          <P>
            <Gold>The flywheel.</Gold> The loop is mechanical, not a promise:
            rites consume DRIFTS; half of every rite is burned, shrinking
            supply with play; the other half funds development and, after the
            mainnet launch, buyback-and-burn and the Exchange's float. The
            relic market burns {Math.round(RELIC_MARKET.feePct * 100)}% of
            every resale; the Exchange's spread feeds its own pool; guild
            banners burn daily by design. More play means more rites; more
            rites mean fewer coins. No part of the loop mints, yields, or pays
            holders.
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
          <Sub>Verify it yourself</Sub>
          <P>
            None of this asks for trust. The coin is an SPL token anyone can
            inspect on a Solana explorer: total supply, the revoked mint
            authority, every holder and every burn. Each rite's burn and tithe
            are on-chain transactions; the realm's{" "}
            <Gold>lifetime burn counter</Gold> sums them in public, and the{" "}
            <Gold>leaderboard</Gold> shows the live wealth distribution. The
            entry gate and the standing tiers only ever READ balances; you can
            confirm that on-chain too. When in doubt, read the chain.
          </P>
          <P>
            <Gold>Here now.</Gold> The mainnet launch and the Exchange are live:
            a two-sided gold-for-DRIFTS market where payouts come only from what
            other players paid in. Player to player, never house to player.
            While the realm is young a single flat daily cap guards the pool,
            widening with standing once the coffers can bear it. The loop is
            simple: hold to enter, hold more to stand taller, burn to act.
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
