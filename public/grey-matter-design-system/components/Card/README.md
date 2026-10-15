**Card / Eyebrow / Rule / Badge** — core surface + text primitives.

```jsx
<Card variant="outline" bean="ttku" interactive>
  <Eyebrow>Single origin</Eyebrow>
  <h3 style={{font:'var(--font-title)', margin:'6px 0'}}>ttku</h3>
  <Rule weight="heavy" color="var(--bean-ttku)" style={{width:48}} />
  <p style={{font:'var(--font-body)'}}>Brazil Santos — nutty, sweet caramel.</p>
  <Badge variant="outline">Espresso roast</Badge>
</Card>
```

- **Card**: `variant` outline·flat·ink, `bean` (top accent bar), `interactive` (hover lift).
- **Eyebrow**: small all-caps tracked label.
- **Rule**: `weight` hair·ink·heavy divider (heavy = bean-name underline).
- **Badge**: `variant` default·outline·solid·teal·bean.
