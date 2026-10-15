**BeanBlock** — the signature system element. A flat, confident, full-bleed colour block naming a bean (shout) with its origin + tasting notes (descriptor). This is the colour code *in use*, exactly as on the IG tiles and product labels. One bean colour per block, never stacked.

```jsx
<BeanBlock bean="ttku" />
<BeanBlock bean="mana saja" origin="Quasi Specialty Coffee" note="Perfect for Spanish & other flavoured coffee" />
<BeanBlock bean="rbtl" mode="rich" textureSrc="../../assets/botanical-linework.png" />
<BeanBlock bean="iykyk" mono />   {/* B&W production */}
```

`mode`: `simplistic` (flat — information register) or `rich` (engraved botanical linework — story register). Pass `textureSrc` as the correct relative path to `assets/botanical-linework.png` from your page. `mono` renders the greyscale value for print. Stack several in a vertical run to make a "beans" line-up tile.
