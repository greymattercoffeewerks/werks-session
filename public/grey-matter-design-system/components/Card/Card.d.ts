import React from 'react';
import { BeanName } from '../BeanTag/BeanTag';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** outline (hairline on cream) · flat (sunk cream) · ink (dark surface). */
  variant?: 'outline' | 'flat' | 'ink';
  /** Bean name → adds a top colour-code accent bar. */
  bean?: BeanName;
  /** Lift + shadow on hover. */
  interactive?: boolean;
  /** CSS padding for the body. */
  padding?: string;
  children?: React.ReactNode;
}
/**
 * Squared content surface — hairline cream by default, ink when inverted.
 * @startingPoint section="Core" subtitle="Content & product card" viewport="700x260"
 */
export function Card(props: CardProps): JSX.Element;
