**Input** — text field with an all-caps eyebrow label, hairline border on cream, ink focus state. Squared, never pill.

```jsx
<Input label="Email" type="email" placeholder="you@cafe.com" />
<Input label="Order qty" prefix="×" hint="1kg bags" />
<Input label="Voucher" error="Code not recognised" />
```

Props: `label`, `hint`, `error` (red, overrides hint), `prefix`. Spreads native input attrs.
