A single inventory/hotbar cell — pixel well, rarity edge, stack count, keybind cap, Drift selection glow. Pass item art via `icon`.

```jsx
<Slot icon={<Icon name="log" size={32} />} count={64} rarity="common" />
<Slot icon={<Icon name="sigil" size={32} />} rarity="epic" selected keybind={1} />
<Slot /> {/* empty well */}
```

Rarity edges: common · uncommon · rare · epic · legendary.
