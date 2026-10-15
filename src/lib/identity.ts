import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import type { Actor, Role } from '../types';
import { auth, functions } from './firebase';

/**
 * The UI never uses a Firebase UID as a domain identifier. This adapter is the
 * only Firebase-shaped identity boundary and will be replaced by a SeduhID
 * (Supabase) adapter once the central identity service is ready.
 */
export interface IdentityProvider {
  observe(callback: (actor: Actor | null) => void): () => void;
  signOut(): Promise<void>;
}

async function actorFrom(user: User): Promise<Actor> {
  const token = await user.getIdTokenResult();
  return {
    personId: typeof token.claims.person_id === 'string' ? token.claims.person_id : user.uid,
    role: (typeof token.claims.role === 'string' ? token.claims.role : 'learner') as Role,
    displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
    email: user.email || '',
  };
}

export const firebaseIdentity: IdentityProvider = {
  observe(callback) {
    if (!auth) { callback(null); return () => undefined; }
    return onAuthStateChanged(auth, async (user) => callback(user ? await actorFrom(user) : null));
  },
  async signOut() { if (auth) await signOut(auth); },
};

/** Call after the first Firebase email-link sign-in to create the stable person record. */
export async function activateLearner(): Promise<{ personId: string; role: Role } | null> {
  if (!functions) return null;
  const result = await httpsCallable<void, { personId: string; role: Role }>(functions, 'activateLearner')();
  return result.data;
}

/**
 * SeduhID migration contract:
 * 1. validate the Supabase session server-side;
 * 2. exchange it for a Firebase custom token with this same `person_id`;
 * 3. use Firebase only as Firestore's temporary security-token transport.
 */
export interface SeduhIdBridge { exchangeSupabaseToken(accessToken: string): Promise<{ firebaseToken: string; personId: string }>; }
