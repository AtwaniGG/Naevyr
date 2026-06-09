A skill progress row — icon, name, level chip, stepped corruption fill, value/next readout. Tint `color` per skill.

```jsx
<XPBar skill="Woodcutting" level={42} value={6280} max={9000}
       color="var(--skill-woodcutting)" icon={<Icon name="axe" size={16} />} />
```

`showNumbers={false}` hides the readout for a compact bar.
