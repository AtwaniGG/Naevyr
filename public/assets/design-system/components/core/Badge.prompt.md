Pixel chip for statuses, counts, rarity & the seasonal Drift marker. `Badge` is the compact inline tag; `SeasonBadge` is the ornate HUD season marker.

```jsx
<Badge tone="gold">Epic</Badge>
<Badge tone="danger" icon={<Icon name="heart" size={12} />}>Low</Badge>
<SeasonBadge season={3} name="Ashfall" driftPct={42} />
```

Badge tones: `corrupt` · `gold` · `success` · `warning` · `danger` · `neutral`.
