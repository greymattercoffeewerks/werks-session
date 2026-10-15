import React from 'react';
import { BeanName } from '../BeanTag/BeanTag';

export interface BeanBlockProps {
  /** Which bean this block represents (sets colour + default copy). */
  bean?: BeanName;
  /** Origin line (defaults to the bean's canonical origin). */
  origin?: string;
  /** Tasting/descriptor line (defaults to the bean's canonical note). */
  note?: string;
  /** Flat (Swedish Simplistic) or engraved-linework (Old School Rich). */
  mode?: 'simplistic' | 'rich';
  /** Greyscale value equivalent for B&W production. */
  mono?: boolean;
  align?: 'top' | 'bottom';
  /** Bean-name casing. Lowercase is the editorial default. */
  casing?: 'lower' | 'upper';
  /** Path to the botanical engraving PNG, relative to the host page. */
  textureSrc?: string;
  /** Override the bean-name display. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * The signature system element: a confident flat colour block stating a
 * bean's name + origin/notes — the colour-code identity in use.
 * @startingPoint section="Brand" subtitle="Colour-coded bean block" viewport="600x420"
 */
export function BeanBlock(props: BeanBlockProps): JSX.Element;
