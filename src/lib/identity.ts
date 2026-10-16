import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  type User,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import type { Actor, Role } from '../types';
import { auth, functions } from './firebase';

const pendingEmailKey = 'werks-sessions.email-link';

function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'instructor' || value === 'learner';
}

function pendingEmail(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(pendingEmailKey) || '';
}

function setPendingEmail(email: string): void {
  window.localStorage.setItem(pendingEmailKey, email);
}

function clearPendingEmail(): void {
  window.localStorage.removeItem(pendingEmailKey);
}

async function actorFrom(user: User): Promise<Actor> {
  const token = await user.getIdTokenResult();
  if (typeof token.claims.person_id !== 'string' || !isRole(token.claims.role)) {
    throw new Error('Your account could not be activated. Please contact Werks Sessions.');
  }
  return {
    personId: token.claims.person_id,
    role: token.claims.role,
    displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
    email: user.email || '',
  };
}

function requireConfiguredAuth(): NonNullable<typeof auth> {
  if (!auth) throw new Error('Sign-in is not configured yet. Please try again after Werks Sessions has enabled account access.');
  return auth;
}

/** Sends a Firebase email-link sign-in invitation without creating a public password flow. */
export async function requestEmailLink(emailInput: string): Promise<void> {
  const configuredAuth = requireConfiguredAuth();
  const email = emailInput.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter the email address used for your booking.');
  const continueUrl = import.meta.env.VITE_AUTH_CONTINUE_URL || window.location.origin;
  await sendSignInLinkToEmail(configuredAuth, email, { url: continueUrl, handleCodeInApp: true });
  setPendingEmail(email);
}

/** True only when the current URL contains a Firebase email-link sign-in action. */
export function isEmailLink(url = typeof window === 'undefined' ? '' : window.location.href): boolean {
  return Boolean(auth && url && isSignInWithEmailLink(auth, url));
}

export function pendingSignInEmail(): string {
  return pendingEmail();
}

/** Completes a link opened on this or another device. The email is required by Firebase for safety. */
export async function completeEmailLink(emailInput: string, url = window.location.href): Promise<void> {
  const configuredAuth = requireConfiguredAuth();
  const email = emailInput.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter the email address used for your booking.');
  if (!isSignInWithEmailLink(configuredAuth, url)) throw new Error('This sign-in link is invalid or has expired. Request a new link and try again.');
  await signInWithEmailLink(configuredAuth, email, url);
  clearPendingEmail();
}

/**
 * Creates the temporary Firebase-to-person mapping only for a newly signed-in
 * learner, then refreshes claims before private UI is allowed to render.
 */
export async function activateLearner(): Promise<Actor> {
  const configuredAuth = requireConfiguredAuth();
  const user = configuredAuth.currentUser;
  if (!user || !functions) throw new Error('Your account could not be activated. Please try again.');

  const currentToken = await user.getIdTokenResult();
  if (typeof currentToken.claims.person_id === 'string' && isRole(currentToken.claims.role)) return actorFrom(user);
  if (currentToken.claims.role) throw new Error('Your staff account is missing its person ID. Please contact an administrator.');

  await httpsCallable<void, { personId: string; role: Role }>(functions, 'activateLearner')();
  await user.getIdToken(true);
  return actorFrom(user);
}

export interface IdentityProvider {
  observe(callback: (actor: Actor | null, error?: string) => void): () => void;
  signOut(): Promise<void>;
}

export const firebaseIdentity: IdentityProvider = {
  observe(callback) {
    if (!auth) { callback(null); return () => undefined; }
    const configuredAuth = auth;
    return onAuthStateChanged(configuredAuth, async (user) => {
      if (!user) { callback(null); return; }
      try {
        callback(await activateLearner());
      } catch (error) {
        await signOut(configuredAuth);
        callback(null, error instanceof Error ? error.message : 'Your account could not be activated. Please try again.');
      }
    });
  },
  async signOut() { if (auth) await signOut(auth); },
};

/**
 * SeduhID migration contract:
 * 1. validate the Supabase session server-side;
 * 2. exchange it for a Firebase custom token with this same `person_id`;
 * 3. use Firebase only as Firestore's temporary security-token transport.
 */
export interface SeduhIdBridge { exchangeSupabaseToken(accessToken: string): Promise<{ firebaseToken: string; personId: string }>; }
