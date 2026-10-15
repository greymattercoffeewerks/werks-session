import React from 'react';

export interface LogoProps {
  /** Bean mark alone, or the full wordmark lockup. */
  variant?: 'mark' | 'lockup';
  /** Approved finishes only: full colour, white knockout, black knockout. */
  finish?: 'color' | 'white' | 'black';
  /** Rendered height in px (width derives from the fixed ratio). */
  height?: number;
  /** Folder holding the logo PNGs, relative to the host page. */
  assetBase?: string;
  /** Visualise the protected clear-space box. */
  clearspace?: boolean;
  style?: React.CSSProperties;
}

/**
 * The bean mark or full lockup, in one of three approved finishes.
 * The mark is never redrawn, distorted, or recoloured off-palette.
 * @startingPoint section="Brand" subtitle="Logo mark & lockup" viewport="700x200"
 */
export function Logo(props: LogoProps): JSX.Element;
