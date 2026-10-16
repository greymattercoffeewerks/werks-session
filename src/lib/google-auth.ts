import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export function observeAccount(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error('Learner sign-in is not configured yet. Please contact Werks Sessions.');

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function signOut(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/popup-closed-by-user') return 'Sign-in was closed before it finished. You can try again when you are ready.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled yet. Please contact Werks Sessions.';
  return 'We could not complete sign-in. Please try again or contact Werks Sessions.';
}
