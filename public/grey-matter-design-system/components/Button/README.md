**Button** — the brand's action element. All-caps display type, squared corners, quiet hover. Use `primary` for most CTAs; `teal` only for brand-level moments (never a generic "add to cart").

```jsx
<Button variant="primary">Shop beans</Button>
<Button variant="secondary" size="lg">Wholesale enquiry</Button>
<Button variant="teal">Meet Grey Matter</Button>   {/* brand moment */}
<Button variant="invert">Get started</Button>       {/* on dark ground */}
```

Variants: `primary` (ink), `secondary` (ink outline → fill on hover), `teal` (brand-reserved), `ghost` (bare), `invert` (cream on dark). Sizes `sm | md | lg`. `block` for full width.
