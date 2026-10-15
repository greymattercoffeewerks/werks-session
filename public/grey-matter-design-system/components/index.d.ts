import React from 'react';

// ---- Logo ----
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

// ---- BeanTag ----
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

// ---- BeanBlock ----
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

// ---- Badge ----
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

// ---- Card ----
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

// ---- Eyebrow ----
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  children?: React.ReactNode;
}
/** Small all-caps tracked label used above titles and section headers. */
export function Eyebrow(props: EyebrowProps): JSX.Element;

// ---- Rule ----
export interface RuleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** hair = cream divider · ink = 1.5px charcoal · heavy = 3px charcoal. */
  weight?: 'hair' | 'ink' | 'heavy';
  color?: string;
}
/** Horizontal divider — hairline or heavy ink bar (bean-name underline register). */
export function Rule(props: RuleProps): JSX.Element;

// ---- Button ----
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

// ---- Input ----
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

// ---- Select ----
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
