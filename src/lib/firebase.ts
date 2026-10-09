import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import type { User, Organization } from '@/types';

// Environment configuration for Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'YOUR_API_KEY'
  );
};

// Initialize Firebase App singleton
export const app = !getApps().length 
  ? initializeApp(
      isFirebaseConfigured() 
        ? firebaseConfig 
        : {
            apiKey: 'mock-api-key',
            authDomain: 'crmos-demo.firebaseapp.com',
            projectId: 'crmos-demo',
            storageBucket: 'crmos-demo.appspot.com',
            messagingSenderId: '123456789',
            appId: '1:123456789:web:abcdef',
          }
    )
  : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in using Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: User; org: Organization }> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is nog niet geconfigureerd. Voeg je Firebase configuratiesleutels toe aan het .env bestand.'
    );
  }

  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  return await syncFirebaseUserWithFirestore(fbUser);
}

/**
 * Sign out current user
 */
export async function logoutFirebase(): Promise<void> {
  if (isFirebaseConfigured()) {
    await signOut(auth);
  }
}

/**
 * Synchronize Firebase User profile into Firestore users and organizations collections
 */
export async function syncFirebaseUserWithFirestore(fbUser: FirebaseUser): Promise<{ user: User; org: Organization }> {
  const orgId = `org_${fbUser.uid.substring(0, 8)}`;
  const userRef = doc(db, 'users', fbUser.uid);
  const orgRef = doc(db, 'organizations', orgId);

  // Default Organization
  const defaultOrg: Organization = {
    id: orgId,
    name: `${fbUser.displayName || 'Mijn Organisatie'}'s CRM`,
    org_type: 'supplier',
    settings: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
      currency: 'EUR',
      date_format: 'DD/MM/YYYY',
      branding: {
        primary_color: '#3b82f6',
      },
      features: {
        recruitment: true,
        crm: true,
        sales: true,
        contact_center: true,
        gamification: true,
        workflows: true,
      },
    },
    created_at: new Date().toISOString(),
  };

  let org = defaultOrg;

  try {
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
      await setDoc(orgRef, {
        ...defaultOrg,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } else {
      org = { ...defaultOrg, ...(orgSnap.data() as Organization), id: orgId };
    }
  } catch (error) {
    console.warn('Kon organisatie niet ophalen uit Firestore, standaardwaarde gebruikt:', error);
  }

  // App User object
  const appUser: User = {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'CRMos Gebruiker',
    avatar: fbUser.photoURL || undefined,
    role: 'admin',
    org_id: org.id,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(
      userRef,
      {
        ...appUser,
        last_login_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Kon gebruikersdocument niet bijwerken in Firestore:', error);
  }

  return { user: appUser, org };
}

export { onAuthStateChanged };
