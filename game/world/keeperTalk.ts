// Keeper voice lines: door reactions, idle small talk (canvas bubbles), and
// conversation openers (KeeperDialogue picks one per visit). Dark-laconic,
// no em dashes, short enough for a one-line bubble.

export interface KeeperLines {
  /** fired the moment you step through the door */
  enter: string[];
  /** muttered now and then while you're in the room */
  idle: string[];
  /** dialogue openers (one is picked per conversation) */
  greet: string[];
}

export const KEEPER_TALK: Record<string, KeeperLines> = {
  dyeworks: {
    enter: ["Mind the vats. Some colors bite.", "Ah. A walking canvas."],
    idle: [
      "Drift purple never washes out.",
      "I dyed a cloak for a dead man once. He looked marvelous.",
      "The ember batch is fresh. Still warm.",
    ],
    greet: [
      "Color for your shoulders, light for your eyes. What do you need?",
      "What color is your courage today?",
    ],
  },
  vault: {
    enter: ["Wipe your boots. This is a place of money.", "Another purse walks in."],
    idle: [
      "The warding holds. It always holds.",
      "Gold sleeps. Gold doesn't snore.",
      "No, you may not see the ledgers.",
    ],
    greet: [
      "Your coin sleeps safer here than on your corpse. Speak.",
      "Deposits. Withdrawals. No miracles.",
    ],
  },
  wheel: {
    enter: ["Step up, step up. The Drift loves a gambler.", "I can smell the luck on you. Or is that fish?"],
    idle: [
      "Someone hit the jackpot last season. Never saw him again.",
      "The wheel remembers every spin.",
      "House keeps a sliver. The Drift keeps the rest.",
    ],
    greet: [
      "Feeling lucky, wanderer? The Drift decides.",
      "Coin or token, the wheel doesn't care.",
    ],
  },
  lantern: {
    enter: ["Close the door, the ash gets in.", "Sit anywhere that holds you."],
    idle: [
      "Boneale's brewed strong this season.",
      "A caravan guard drank his whole payout here. Good man.",
      "The hearth stays lit. House rule.",
    ],
    greet: [
      "Warm light, bad stools, good drink. What'll it be?",
      "Kitchen's closed. Taps aren't.",
    ],
  },
  furnisher: {
    enter: ["Careful. Wet varnish somewhere.", "You break it, you stake a claim to pay for it."],
    idle: [
      "Made a statue once that watched back.",
      "Driftwood works best. It remembers being alive.",
      "Land first, furniture second. That's the order.",
    ],
    greet: [
      "Goods for the landed. Pick something.",
      "Something for the plot, then?",
    ],
  },
  menagerie: {
    enter: ["Hush. The wisp just settled.", "Don't tap the cages. They tap back."],
    idle: [
      "The crow knows your name already.",
      "Emberlings sleep in the ash bucket. Cozier.",
      "I don't sell them. I introduce them.",
    ],
    greet: [
      "Don't rattle the cages. They choose you, really.",
      "Looking for company that won't talk back?",
    ],
  },
  mine: {
    enter: ["Watch your head. And your fingers.", "Fresh air's that way. Gold's this way."],
    idle: [
      "The vein in the north wall's nearly grown back.",
      "Heard knocking from below once. We don't dig there.",
      "Every swing pays. Eventually.",
    ],
    greet: [
      "The veins glitter deep. Swing till your arms ache.",
      "Pick's sharp? Then what are you waiting for.",
    ],
  },
};

// wild structures
KEEPER_TALK.mirehut = {
  enter: ["Mind the floor. It minds you back.", "The mere told me you were coming."],
  idle: [
    "The bog keeps what it's given.",
    "Hides and shards. Everything useful was alive once.",
    "The Drift hums louder near the water.",
  ],
  greet: [
    "Sit. Don't touch the green vat. What ails you?",
    "Gold and goods make medicine. What do you need?",
  ],
};
KEEPER_TALK.obelisk = {
  enter: [],
  idle: [],
  greet: [
    "THE ASH REMEMBERS. ASK, AND PAY.",
    "STONE BEFORE THE DRIFT. STONE AFTER. SPEAK.",
  ],
};

export function pickLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? "";
}
