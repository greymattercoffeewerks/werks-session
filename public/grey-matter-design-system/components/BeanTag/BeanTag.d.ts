import React from 'react';

export type BeanName =
  | 'mana saja' | 'iiwii' | 'ttku' | 'rbtl'
  | 'iykyk' | 'xixu' | 'kiasu' | 'aura' | 'decaf' | 'fomo';

export interface BeanTagProps {
  /** Which bean's permanent colour code to display. */
  bean?: BeanName;
  /** solid block, outline, or type underline. */
  variant?: 'solid' | 'outline' | 'underline';
  /** Square block (default) or pill chip. */
  shape?: 'block' | 'pill';
  /** Render the greyscale value equivalent (B&W production). */
  mono?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Override label text (defaults to the bean name). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * The smallest unit of the bean colour code — a tag carrying a bean's
 * permanent colour and name. Identity survives greyscale via the label.
 * @startingPoint section="Brand" subtitle="Bean colour-code tag" viewport="700x160"
 */
export function BeanTag(props: BeanTagProps): JSX.Element;
