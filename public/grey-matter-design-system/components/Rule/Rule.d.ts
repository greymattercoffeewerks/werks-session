import React from 'react';

export interface RuleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** hair = cream divider · ink = 1.5px charcoal · heavy = 3px charcoal. */
  weight?: 'hair' | 'ink' | 'heavy';
  color?: string;
}
/** Horizontal divider — hairline or heavy ink bar (bean-name underline register). */
export function Rule(props: RuleProps): JSX.Element;
