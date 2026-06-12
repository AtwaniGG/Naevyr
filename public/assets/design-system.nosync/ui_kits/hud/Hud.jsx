/* Naevyr UI kit — the HUD overlay.
   Composes the design-system components (Panel, Hotbar, XPBar, Slot,
   ActivityLog, SeasonBadge, Button, Icon) into the full in-game HUD,
   sitting over the canvas world. Light interactivity: pick a tool,
   gather → XP + loot + log. */

const NS = window.DriftLandsDesignSystem_3de3e2
  || window[Object.keys(window).find(k => k.startsWith('DriftLandsDesignSystem'))];
const { Panel, Button, Badge, SeasonBadge, Slot, Hotbar, XPBar, ActivityLog, Icon } = NS;

const TOOLS = [
  { name: 'Axe', icon: 'axe', skill: 'Woodcutting', loot: 'Ashen log', lootIcon: 'log', xp: 128 },
  { name: 'Pickaxe', icon: 'pickaxe', skill: 'Mining', loot: 'Drift ore', lootIcon: 'ore', xp: 96 },
  { name: 'Rod', icon: 'rod', skill: 'Fishing', loot: 'Pale carp', lootIcon: 'fish', xp: 74 },
  { name: 'Sword', icon: 'sword', skill: null },
  { name: 'Ward', icon: 'ward', skill: null },
  { name: 'Sigil', icon: 'sigil', skill: null, rarity: 'epic' },
];

const SKILL_COLOR = {
  Woodcutting: 'var(--skill-woodcutting)',
  Mining: 'var(--skill-mining)',
  Fishing: 'var(--skill-fishing)',
};
const SKILL_ICON = { Woodcutting: 'axe', Mining: 'pickaxe', Fishing: 'rod' };

function Vitals({ hearts, shards }) {
  return (
    <Panel padded={false} corners={false} style={{ padding: '8px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Icon key={i} name="heart" size={16} style={{ opacity: i < hearts ? 1 : 0.18 }} />
          ))}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="coin" size={16} glow />
          <span className="drift-num" style={{ fontWeight: 700, fontSize: 15, color: 'var(--drift-gold)', textShadow: 'var(--text-shadow-hud)' }}>
            {shards.toLocaleString()}
          </span>
        </span>
      </div>
    </Panel>
  );
}

function HUD() {
  const [sel, setSel] = React.useState(0);
  const [xp, setXp] = React.useState({
    Woodcutting: { level: 42, value: 6280, max: 9000 },
    Mining: { level: 31, value: 3400, max: 7200 },
    Fishing: { level: 28, value: 5100, max: 6400 },
  });
  const [shards, setShards] = React.useState(1284);
  const [log, setLog] = React.useState([
    { kind: 'drift', text: 'The Drift crept into Hollowmere.' },
    { kind: 'info', text: 'A rock vein re-formed nearby.' },
    { kind: 'loot', text: 'Ashen log', meta: 'x2' },
  ]);
  const [bag, setBag] = React.useState([
    { icon: 'log', count: 64, rarity: 'common' },
    { icon: 'ore', count: 18, rarity: 'rare' },
    { icon: 'fish', count: 7, rarity: 'uncommon' },
    { icon: 'coin', count: '1.2k', rarity: 'legendary' },
  ]);
  const [progress, setProgress] = React.useState(null); // 0..1 while gathering
  const [floaters, setFloaters] = React.useState([]);
  const timer = React.useRef(null);

  const tool = TOOLS[sel];
  const canGather = !!tool.skill && progress === null;

  function gather() {
    if (!canGather) return;
    let p = 0;
    setProgress(0);
    timer.current = setInterval(() => {
      p += 0.04;
      if (p >= 1) {
        clearInterval(timer.current);
        setProgress(null);
        // rewards
        const t = TOOLS[sel];
        setXp(prev => {
          const s = { ...prev[t.skill] };
          s.value = Math.min(s.max, s.value + t.xp);
          if (s.value >= s.max) { s.level += 1; s.value = s.value - s.max; }
          return { ...prev, [t.skill]: s };
        });
        setShards(v => v + 12);
        const fid = Date.now();
        setFloaters(f => [...f, { id: fid, text: `+${t.xp} XP`, kind: 'xp' }, { id: fid + 1, text: '+12', kind: 'gold' }]);
        setTimeout(() => setFloaters(f => f.filter(x => x.id !== fid && x.id !== fid + 1)), 1100);
        setLog(l => [
          { kind: 'xp', text: t.skill, meta: `+${t.xp} XP` },
          { kind: 'loot', text: t.loot, meta: 'x1' },
          ...l,
        ].slice(0, 7));
        setBag(b => {
          const idx = b.findIndex(x => x.icon === t.lootIcon);
          if (idx >= 0) { const n = [...b]; n[idx] = { ...n[idx], count: (parseInt(n[idx].count) || 0) + 1 }; return n; }
          return [...b, { icon: t.lootIcon, count: 1, rarity: 'common' }];
        });
      } else setProgress(p);
    }, 60);
  }
  React.useEffect(() => () => clearInterval(timer.current), []);

  const bagSlots = Array.from({ length: 12 }, (_, i) => bag[i] || null);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <style>{`
        .hud-region { position: absolute; pointer-events: auto; }
        @keyframes floatUp { 0% { transform: translate(-50%,0); opacity: 1; } 100% { transform: translate(-50%,-46px); opacity: 0; } }
        .floater { position:absolute; left:50%; bottom:64px; transform:translateX(-50%); animation: floatUp 1.1s steps(10) forwards;
          font-family: var(--font-num); font-weight:700; font-size:16px; text-shadow: var(--text-shadow-hud); }
      `}</style>

      {/* top-left: season + vitals */}
      <div className="hud-region" style={{ top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SeasonBadge season={3} name="Ashfall" driftPct={42} />
        <Vitals hearts={4} shards={shards} />
      </div>

      {/* top-right: satchel */}
      <div className="hud-region" style={{ top: 16, right: 16 }}>
        <Panel kicker="Satchel" title="Inventory" style={{ width: 232 }}
          accessory={<Badge tone="neutral">{bag.length}/24</Badge>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--slot-gap)' }}>
            {bagSlots.map((it, i) => (
              <Slot key={i} size={48} icon={it ? <Icon name={it.icon} size={30} /> : null} count={it ? it.count : null} rarity={it ? it.rarity : null} />
            ))}
          </div>
        </Panel>
      </div>

      {/* left-bottom: skills */}
      <div className="hud-region" style={{ bottom: 16, left: 16 }}>
        <Panel kicker="Skills" title="Gathering" style={{ width: 264 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['Woodcutting', 'Mining', 'Fishing'].map(s => (
              <XPBar key={s} skill={s} level={xp[s].level} value={xp[s].value} max={xp[s].max}
                color={SKILL_COLOR[s]} icon={<Icon name={SKILL_ICON[s]} size={16} />} />
            ))}
          </div>
        </Panel>
      </div>

      {/* right-bottom: activity log */}
      <div className="hud-region" style={{ bottom: 16, right: 16 }}>
        <Panel kicker="Realm" title="Activity" style={{ width: 248 }}>
          <ActivityLog entries={log} max={7} />
        </Panel>
      </div>

      {/* center: gather target + progress ring */}
      <div style={{ position: 'absolute', left: '50%', top: 'calc(50% + 36px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
        {progress !== null && (
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,.8))' }}>
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(10,8,16,.7)" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="#a855f7" strokeWidth="6"
              strokeDasharray={2 * Math.PI * 26} strokeDashoffset={(1 - progress) * 2 * Math.PI * 26}
              transform="rotate(-90 32 32)" strokeLinecap="butt" />
          </svg>
        )}
        {floaters.map((f, i) => (
          <span key={f.id} className="floater" style={{ color: f.kind === 'gold' ? 'var(--drift-gold)' : 'var(--drift-corrupt)', left: `calc(50% + ${i % 2 ? 22 : -22}px)` }}>
            {f.text}
          </span>
        ))}
      </div>

      {/* bottom-center: hotbar + action */}
      <div className="hud-region" style={{ bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Button variant={canGather ? 'primary' : 'ghost'} size="md" onClick={gather} disabled={!canGather}
          iconLeft={<Icon name={tool.icon} size={16} />}>
          {progress !== null ? 'Gathering…' : tool.skill ? `${tool.skill}` : `${tool.name} equipped`}
        </Button>
        <Hotbar selected={sel} onSelect={setSel}
          slots={TOOLS.map(t => ({ icon: <Icon name={t.icon} size={32} />, name: t.name, rarity: t.rarity }))} />
      </div>
    </div>
  );
}

window.HUD = HUD;
