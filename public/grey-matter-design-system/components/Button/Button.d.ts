import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = ink block · secondary = outline · teal = BRAND ONLY · ghost · invert (on dark). */
  variant?: 'primary' | 'secondary' | 'teal' | 'ghost' | 'invert';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * The brand's action element: blunt, squared, all-caps display type.
 * Teal variant is reserved for brand-level moments, not general CTAs.
 * @startingPoint section="Forms" subtitle="Buttons — ink, outline, teal" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
