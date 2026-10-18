# Grey Matter Coffee Werks — design system handoff (for Codex / web dev)

Start with `README.md` (the brand book: voice, visual rules, type, colour, caveats). This file is only the map.

## Use it
- Link ONE stylesheet: `styles.css`. It imports `tokens.css` (generated from `tokens.json`) and `components/bundle.css` (Figtree + Archivo from Google Fonts, type-role shorthands `--font-hero … --font-label`, borders, motion, paper texture).
- `tokens.json` is the source of truth. Never hard-code a hex, size or font; use the CSS variables (`--gm-*`, `--bean-*`, `--cert-*`, `--surface-*`, `--text-*`, `--font-*`, spacing/radius/shadow scales). If a value is missing, add it to `tokens.json` and regenerate `tokens.css` rather than inlining it.
- Components: `components/bundle.js` is a compiled classic script exposing `window.DesignSystem_69d0e9` (Button, Input, Select, Card, Badge, Eyebrow, Rule, BeanTag, BeanBlock, Logo, BEANS). Needs React 18 + ReactDOM 18 globals loaded first. Readable sources are in `components/src/`; per-component usage is in `components/<Name>/README.md`, types in `<Name>.d.ts` (all combined in `components/index.d.ts`), live examples in `components/<Name>/preview.html`.
- For a real app (Next/Vite/etc.) port `components/src/*.jsx` into the app's module system, keep props identical to the `.d.ts` files, and keep styling on the CSS variables.
- Worked examples: `ui_kits/storefront/index.html` and `ui_kits/social/index.html` (open over a local static server; they load React/Babel from a CDN and `../../components/bundle.js`).
- Assets: `assets/` (logos in lockup/mark × colour/white/black, transparent PNG; botanical linework; one reference image). See `assets/README.md`. Never redraw or approximate the logo.
- `guidelines/*.card.html` are small specimen cards (colour, type, spacing, expressions).

## Brand rules that must survive implementation
- Type: Figtree = wordmark + display; Archivo = body + UI. Two families only. Gotham files in `fonts/` are legacy artwork only — do not use on the web.
- Bean colour pairs are permanent (each bean has a colour, a second colour, an "on" text colour, and a B&W-safe grey). Don't recolour or mix them.
- Teal (`--gm-teal`, #3B96A4) is brand-only, not a UI state colour.
- Prefer borders over shadows. Must remain legible in black & white.
- Casing: ALL-CAPS for brand/UI labels; lowercase for editorial bean names. One casing per piece.
- Two expressions: "Old School Rich" (story, texture, botanical) vs "Swedish Simplistic" (flat colour, information).

## Known issues
- Some colour pairs fail WCAG contrast; kept exact on purpose and flagged in `tokens.json` usage notes and README "Caveats". Don't use the flagged pairs for body text; check before shipping.
- `PRICE` tables and copy in `ui_kits/` are placeholder demo data, not real pricing.
- In the Werks Sessions portal, Figtree and Archivo are self-hosted via Fontsource (`src/main.tsx`); `components/bundle.css` no longer imports Google Fonts and the Gotham files were removed. Other consumers of this folder must load the two families themselves.
