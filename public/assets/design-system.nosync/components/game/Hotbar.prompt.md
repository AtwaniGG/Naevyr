The 6-slot action bar (keys 1–6). Give it up to 6 items and the active index.

```jsx
<Hotbar
  selected={0}
  onSelect={setSel}
  slots={[
    { icon: <Icon name="axe" size={32} />, name: 'Axe' },
    { icon: <Icon name="pickaxe" size={32} />, name: 'Pickaxe' },
    { icon: <Icon name="rod" size={32} />, name: 'Rod' },
  ]}
/>
```

Empty positions render as quiet wells.
