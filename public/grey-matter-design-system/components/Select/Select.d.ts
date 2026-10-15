import React from 'react';

export interface SelectOption { value: string; label: string; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  /** Options as strings or {value,label}. Or pass <option> children. */
  options?: (string | SelectOption)[];
  children?: React.ReactNode;
}

/** Native select styled to match Input — squared, hairline, ink focus. */
export function Select(props: SelectProps): JSX.Element;
