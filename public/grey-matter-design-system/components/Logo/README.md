**Logo** — the bean mark or full lockup, in an approved finish. Never redraw, distort, or recolour the mark. Pass `assetBase` as the relative path to the `assets/` folder from your page.

```jsx
<Logo variant="lockup" finish="color" height={40} assetBase="../../assets" />
<Logo variant="mark" finish="white" height={48} assetBase="../../assets" /> {/* on dark */}
<Logo variant="lockup" finish="black" height={32} assetBase="../../assets" /> {/* mono print */}
```

Finishes: `color` (charcoal + teal, on cream/light), `white` (knockout, on dark/black or bean blocks), `black` (mono print). Min lockup height ≈ 24px; min mark ≈ 20px. Set `clearspace` to preview the protected margin.
