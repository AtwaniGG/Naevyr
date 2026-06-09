The scrolling HUD feed — gathers, level-ups, loot, Drift events. Newest entries first; older rows fade out.

```jsx
<ActivityLog entries={[
  { kind: 'xp', text: 'Woodcutting', meta: '+128 XP' },
  { kind: 'loot', text: 'Ashen log', meta: 'x3' },
  { kind: 'drift', text: 'The Drift crept into Hollowmere.' },
]} />
```

Kinds: `xp` · `loot` · `info` · `warning` · `danger` · `drift`.
