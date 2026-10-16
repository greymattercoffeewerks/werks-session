import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * This is Firebase's public web-app configuration, not a credential. Environment
 * values remain supported for a future non-production Firebase project.
 */
const productionConfig = {
  apiKey: 'AIzaSyCWud7NIXKX4NSzmAJ4UEZxzbmFhTbIekw',
  authDomain: 'werks-session.firebaseapp.com',
  projectId: 'werks-session',
  storageBucket: 'werks-session.firebasestorage.app',
  messagingSenderId: '558755925947',
  appId: '1:558755925947:web:d9158b18d7351135763e9e',
};

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || productionConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || productionConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || productionConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || productionConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || productionConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || productionConfig.appId,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);
const app = firebaseConfigured ? (getApps()[0] ?? initializeApp(config)) : undefined;
export const auth = app ? getAuth(app) : undefined;
