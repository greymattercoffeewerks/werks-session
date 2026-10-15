import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** All-caps eyebrow label above the field. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message (renders in kiasu red, overrides hint). */
  error?: string;
  /** Static prefix inside the field (e.g. "$"). */
  prefix?: string;
}

/**
 * Text field — hairline on cream, squared, ink focus border.
 * @startingPoint section="Forms" subtitle="Text input" viewport="700x140"
 */
export function Input(props: InputProps): JSX.Element;
