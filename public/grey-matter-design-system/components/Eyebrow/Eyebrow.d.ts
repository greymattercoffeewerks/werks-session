import React from 'react';

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  children?: React.ReactNode;
}
/** Small all-caps tracked label used above titles and section headers. */
export function Eyebrow(props: EyebrowProps): JSX.Element;
