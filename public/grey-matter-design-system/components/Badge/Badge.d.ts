import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** default (soft) · outline · solid (ink) · teal (BRAND) · bean (pass beanColor). */
  variant?: 'default' | 'outline' | 'teal' | 'solid' | 'bean';
  /** CSS colour used when variant='bean'. */
  beanColor?: string;
  children?: React.ReactNode;
}
/**
 * Small status / meta label — uppercase display type, squared.
 * @startingPoint section="Core" subtitle="Badges & status labels" viewport="700x120"
 */
export function Badge(props: BadgeProps): JSX.Element;
