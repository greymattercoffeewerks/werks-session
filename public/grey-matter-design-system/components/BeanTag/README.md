**BeanTag** — the smallest unit of the bean colour code: a tag carrying a bean's permanent colour + name. Use anywhere a bean is referenced (product cards, menus, filters). Always identified by its label, so it stays readable in B&W.

```jsx
<BeanTag bean="ttku" />
<BeanTag bean="iykyk" shape="pill" />
<BeanTag bean="mana saja" variant="underline" size="lg" />
<BeanTag bean="ttku" mono />   {/* greyscale — print/B&W */}
```

Variants: `solid` (colour block), `outline` (colour hairline), `underline` (type with 3px colour rule). `shape`: `block` (square, default) or `pill`. Set `mono` for print/B&W — colour collapses to its value equivalent, label carries identity.
