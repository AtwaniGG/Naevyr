Pixel action button — hard bevel, presses down on click. Use `primary` (the Drift) for the main action, `gold` to confirm/spend, `ghost` for quiet actions, `danger` to destroy.

```jsx
<Button variant="primary">Gather</Button>
<Button variant="gold" iconLeft={<Icon name="coin" size={16} />}>Claim</Button>
<Button variant="ghost" size="sm">Drop</Button>
```

Sizes: `sm` / `md` / `lg`. `block` stretches full width.
