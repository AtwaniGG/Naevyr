The canonical pixel HUD frame — notched corners, hard bevel, thin corruption-purple edge, semi-transparent fill. Wrap any HUD surface in it.

```jsx
<Panel kicker="Satchel" title="Inventory" accessory={<Badge tone="gold">128</Badge>}>
  …slots…
</Panel>
```

`glow` adds an outer halo; `corners={false}` drops the purple pips; `padded={false}` for flush content; `as` swaps the tag.
