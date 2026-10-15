# Grey Matter Coffee Werks — Design System

A design reference language for **Grey Matter Coffee Werks**, Brunei's boutique dedicated coffee partner. This system keeps the brand recognisable across social, product/label artwork, print, and wholesale collateral — while letting two legitimate stylistic modes coexist: **Old School Rich** and **Swedish Simplistic**.

> The core idea: here is the DNA that cannot change, here is the range it's allowed to move in, here is what breaks it. Every piece must sit *somewhere on that spectrum*, never off it — and must survive being stripped to black & white.

## Sources this system was built from
- **Logo mark** (split-bean icon) and **full lockup** — the refreshed logo artwork (August 2026), wordmark set in Figtree.
- **Packaging label line-up** — the ten bean labels, which supply the confirmed hex pairs and product descriptors.
- **Sample IG story** — the "june beans" content card showing the colour-coded bean system in use (`assets/ref-ig-story.png`).
- **Product photo** — a bagged bean reference (`assets/ref-package-ttku.jpg`).
- **Certificate of appreciation** — the Coffee Con 2026 volunteer certificate (October 2026), the source of the certificate palette (`cert-*` tokens) and the triangle border.
- **Brief** — the "Design Reference Language Brief" (July 2026) provided with the upload.
- Live references named in the brief (not accessed here, stored for the reader): `www.greymattercoffee.com`, `www.instagram.com/greymatter.cw`.

---

## THE NON-NEGOTIABLE CORE DNA
Fixed regardless of stylistic mode:
1. **The bean mark** — the asymmetric split with the negative-space curve. Never redraw, distort, re-proportion, or recolour outside the three approved finishes.
2. **Figtree Bold, all-caps** as the wordmark and primary display "shout." (Figtree is hosted by Google Fonts — see Caveats.)
3. **The bean colour code** — ten beans, each owning a **permanent primary + secondary pair**: mana saja/black, iiwii/yellow+indigo, ttku/green+pink, rbtl/burgundy+turquoise, kiasu/red+deep teal, iykyk/blue+sienna, aura/orange+steel blue, xixu/purple+leaf, decaf/grey+tan, fomo/green+plum. Functional, used as design blocks. Never reassigned for aesthetic convenience.
4. **Wordmark lockup proportions** — fixed even when colour/finish changes.
5. **A neutral base** — cream + charcoal/black do most of the work; colour is accent, not wallpaper.

## THE TWO PERMITTED EXPRESSIONS
- **Old School Rich** — warmth, craft, heritage. Engraved botanical linework, deeper ink density, tactile/print textures. For *stories*: sourcing, origin, the 3C/community narrative, WCC credibility.
- **Swedish Simplistic** — restraint, air, function. Generous cream space, grid-locked layout, flat colour blocks, type doing 100% of the work. For *information*: prices, ordering, CafePartners mechanics — read fast on a phone.

**Rule of thumb:** story → can lean Rich. Information → should lean Simplistic. Most day-to-day social sits Simplistic by necessity (solo, low production time) — the system is honest about that.

## WHAT BREAKS THE SYSTEM
- Redrawing/recolouring the bean mark outside approved variants.
- Reassigning a bean's colour for a one-off.
- A single piece trying to be *both* richly textured and minimal — pick a lane.
- Adding a third typeface (warmth comes from texture, not a serif/script).
- Colour-only differentiation in anything that might be printed or shared in B&W.

---

## CONTENT FUNDAMENTALS
- **Voice:** plain, confident, unfussy. Lowercase editorial headlines ("good coffee, no fuss.", "june beans", "mana saja"); ALL-CAPS for brand/UI chrome (nav, buttons, labels). Pick **one casing per piece**.
- **Person:** speaks as "we" (the roastery) to "you" (café owner / drinker). Warm but not chatty — "Roasted on-demand for maximum flavour and freshness."
- **Bean names are lowercase, always** — `ttku`, `rbtl`, `mana saja`. Treat them as proper nouns of the system.
- **Descriptors are terse** — origin + tasting notes as a short line beneath the shout: "Brazil · nutty, sweet caramel." No purple prose.
- **Emoji:** essentially none in brand copy. The occasional functional glyph (☕) is tolerable in casual social captions but never in the system chrome.
- **Numbers/price:** blunt and unmissable — big display weight, "$12 /250g". No fake precision, no stat-padding.
- **Vibe:** a specialist who respects your time. Craft is implied by the product and the linework, not claimed in adjectives.

## VISUAL FOUNDATIONS
- **Colour:** neutral base — cream `#FFFEEE`, charcoal `#1A1A1A`, black `#000`. **One bean-colour pair per piece, maximum** (exception: an explicit range/portfolio line-up). The primary carries the label strip and headline block; the secondary is the counter-block, the tag, the second colour in a two-colour run. Five primaries are light (`iiwii`, `iykyk`, `aura`, `decaf`, `fomo`) and take **ink** type, not cream — use `BEANS[name].on`. The **teal `#3B96A4` (the leaf in the refreshed logo) is brand-only** — logo, About, judge/competition — never a bean colour, never general decoration.
- **Monochrome:** the system must degrade gracefully. In true B&W, print bean blocks solid charcoal and let the **type label** carry identity — the greyscale value ladder (see the "Beans in monochrome" card) proves many bean colours collapse to near-identical greys, so colour alone can never be trusted.
- **Type:** two families. **Figtree** (400–900, hosted by Google Fonts) for display and the wordmark — **shout** (700–900, tight). **Archivo** for body/UI — **say** (400–500, generous). No third family.
- **Spacing:** 4px base grid; grid-locked, generous air (Swedish Simplistic default).
- **Backgrounds:** flat cream or flat bean-colour blocks. Old School Rich adds the **engraved botanical linework** (`assets/botanical-linework*.png`) at low opacity and, optionally, a faint paper tooth (`--gm-paper-tooth`). **No gradients, no glow.**
- **Corners:** near-square. `--gm-radius-sm: 2px` / `md: 4px` are the defaults; pills reserved for bean tags/chips. `lg: 8px` used sparingly.
- **Cards:** cream ground with a **1px hairline** (`--gm-cream-3`), not shadow. Shadow appears only on lift/hover and floating surfaces (cart drawer). Optional bean top-accent bar carries the code.
- **Borders over shadows.** Hairlines and heavy ink rules (1.5–3px charcoal) do the structural work; the 3px rule is the bean-name underline motif.
- **Motion:** quiet. Short eased transitions (`--gm-ease`, 120–360ms), fades and slides. **No bounce, no infinite decorative loops.**
- **Hover:** shift of tone (primary button → true black; ghost → cream-2; card → 2px lift + soft shadow). **Press:** 1px downward nudge. No colour-flip surprises.
- **Imagery vibe:** warm, tactile, print-referencing when present; product shots sit on cream. Linework is charcoal (on light) or cream (`-cream.png`, on dark bean blocks).
- **Transparency/blur:** used only for the sticky header scrim (cream at 92% + slight blur) and modal overlays. Not decorative.

## CERTIFICATES & RECOGNITION
- **Ground and palette:** `cert-ground` `#FFFFF4`; the border and rules use `cert-teal` `#108D99`, `cert-red` `#CB0707`, `cert-grey` `#9D9999` and `cert-charcoal` `#3F4044`; supporting type and the small outlined triangles use `cert-navy` `#112F49`; signatures use `cert-signature` `#264158`. The title and citation are `gm-black`. `cert-red` is not a bean colour and is never used for `kiasu`.
- **Border:** right-angled triangles in teal, red, grey and charcoal bleed off the corners and the top and bottom edges; a few small navy-outlined triangles float in the side margins. Nothing else decorates the page.
- **Order, top-left aligned:** the refreshed lockup; the title in heavy all-caps; a light, tracked all-caps line beneath it in `cert-navy`; a bold tracked "PRESENTED TO" in `cert-navy`; the recipient's name in Figtree `cert-teal` at 24px or larger with a `cert-teal` rule under it; the citation in `gm-black`; then the signature over a `cert-teal` rule, the signatory in teal bold caps and the team line in `gm-black`.
- **Contrast:** `cert-teal` on `cert-ground` is 3.9:1, so keep it to the name (24px+), rules and the signatory line at display size; `cert-grey` is for the border only.

---

## ICONOGRAPHY
- The brand is **type- and mark-led, not icon-led.** There is no proprietary icon set in the source material.
- The **bean mark** is the one true glyph — used as an avatar/bug (`assets/logo-mark*.png`).
- UI affordances are drawn with **CSS/type** (the select caret, cart `×`, quantity `–`/`+`, back `←`) rather than an icon font — matching the blunt, minimal register.
- **No emoji as UI.** If a future surface genuinely needs a small icon set, use a thin-to-medium stroke line set (e.g. Lucide via CDN) to match the type weight — **flagged as a substitution**, since none ships today.
- **Do not invent decorative SVG icons.** Warmth is carried by the botanical linework asset, not by iconography.

---

## INDEX — what's in this system

**Root**
- `styles.css` — global entry point (link this one file). `@import`s `tokens.css` and `components/bundle.css`.
- `README.md` — this file. `assets/notes/SKILL.from-standalone.md` — the Agent-Skills-compatible usage guide from the standalone version.

**Tokens** — `tokens.json` is the source (colours, spacing, radii, shadows, type scale, type styles); `tokens.css` is generated from it. `components/bundle.css` holds what `tokens.json` cannot declare: the Google Fonts import, the `--font-*` role shorthands, borders, motion and the paper texture. `archived/styles.css` and `archived/tokens/*.css` are the stylesheets they replace.

**`fonts/`** — `Gotham-{Regular,Bold,Black}.otf`, the previous wordmark face, kept for existing artwork. New work uses Figtree.

**`assets/`** — `logo-mark[-white|-black].png` (0.71:1), `logo-lockup[-white|-black].png` (4.75:1), all transparent PNG, `botanical-linework.png` (charcoal) + `botanical-linework-cream.png` (for dark blocks), `ref-ig-story.png`, `ref-package-ttku.jpg`; usage notes in `assets/README.md`.

**`components/`** (namespace `window.DesignSystem_69d0e9`, built into `components/bundle.js`; one folder per component with `README.md`, `preview.html` and types; sources in `components/src/`)
- **Logo**, **BeanTag**, **BeanBlock** (+ `src/brand/beans.js` data: `BEANS`, `BEAN_NAMES`).
- **Button**, **Input**, **Select**.
- **Card**, **Badge**, **Eyebrow**, **Rule**.

**`ui_kits/`**
- `storefront/` — greymattercoffee.com recreation: home hero, shop grid, product detail, cart drawer. Interactive `index.html`.
- `social/` — Instagram story + feed tiles, both expressions, each shown in colour **and** monochrome. `index.html`.

**`guidelines/`** — the foundation cards that stay as pages (`expressions`, `type-casing`, `type-display`, `color-teal`); the other specimen cards are in `archived/guidelines/`, their values now in `tokens.json`.

---

## CAVEATS & OPEN QUESTIONS
- **Fonts:** **Figtree** is the wordmark and display face and loads from Google Fonts through `components/bundle.css`; **Archivo** carries body/UI. **Gotham** (previous wordmark face, licensed) stays in `fonts/` and in `type.families` as `legacy-gotham` for existing artwork only. The certificate's title and supporting lines are set in a face that is neither Figtree nor Archivo (it resembles Barlow); it is not added to the system until confirmed.
- **Contrast:** `gm-cream` type on `gm-teal` is 3.4:1 (Button and Badge `teal`), `gm-cream` type on `kiasu` is 3.9:1 and `gm-grey-2` on cream is 4.47:1: all kept exact from the brand artwork and flagged in their token notes; use them at 24px+ or bold 19px+.
- **Bean copy:** origins are now taken from the production labels. **Tasting notes are still missing for `kiasu`, `aura`, `xixu` and `decaf`** — send them and they drop straight into `beans.js`.
- **Bean hex values** are sampled from the label artwork, so they are screen-accurate but not print-accurate. **Confirm the Pantone/CMYK build** for each pair before any print run.
- **Prices** in the storefront kit are illustrative placeholders.
