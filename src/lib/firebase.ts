import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCsBPKp7i7Cd959bF8hZzTDtV_V_7cI9Xo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'crmosone-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crmosone-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'crmosone-dev.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '560657459503',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:560657459503:web:cafda0014c240cdc7099da',
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
            apiKey: 'AIzaSyCsBPKp7i7Cd959bF8hZzTDtV_V_7cI9Xo',
            authDomain: 'crmosone-dev.firebaseapp.com',
            projectId: 'crmosone-dev',
            storageBucket: 'crmosone-dev.firebasestorage.app',
            messagingSenderId: '560657459503',
            appId: '1:560657459503:web:cafda0014c240cdc7099da',
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
 * Register with Email and Password
 */
export async function registerWithEmailPassword(
  name: string,
  email: string,
  password: string,
  companyName?: string
): Promise<{ user: User; org: Organization }> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is nog niet geconfigureerd. Voeg je Firebase configuratiesleutels toe aan het .env bestand.'
    );
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }

  return await syncFirebaseUserWithFirestore(credential.user, companyName);
}

/**
 * Sign in using Email and Password
 */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: User; org: Organization }> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is nog niet geconfigureerd. Voeg je Firebase configuratiesleutels toe aan het .env bestand.'
    );
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return await syncFirebaseUserWithFirestore(credential.user);
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
export async function syncFirebaseUserWithFirestore(
  fbUser: FirebaseUser,
  companyName?: string
): Promise<{ user: User; org: Organization }> {
  const userRef = doc(db, 'users', fbUser.uid);
  let existingUserData: Record<string, unknown> = {};

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      existingUserData = userSnap.data() || {};
    }
  } catch (error) {
    console.warn('Kon bestaand gebruikersprofiel niet controleren in Firestore:', error);
  }

  // Determine effective company name
  const effectiveCompanyName =
    companyName ||
    (existingUserData.company_name as string) ||
    'CRMos Bedrijf';

  const isCoreEcosystem = [
    'crmos',
    'crmos.one',
    'vvc',
    'verdienende vrienden club',
    'quantum initium',
    'logs rent',
    'djobba',
    'trusting work',
  ].some((c) => {
    const norm = effectiveCompanyName.trim().toLowerCase();
    return norm === c || norm.includes(c) || c.includes(norm);
  });

  // Determine organization ID:
  // Core ecosystem partners share the CRMos core pool ('default_org')
  // Independent third-party companies get an isolated organization ID
  const orgId = isCoreEcosystem
    ? 'default_org'
    : (existingUserData.org_id as string) ||
      `org_${effectiveCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}_${fbUser.uid.substring(0, 4)}`;

  const orgRef = doc(db, 'organizations', orgId);

  // Default Organization
  const defaultOrg: Organization = {
    id: orgId,
    name: effectiveCompanyName,
    org_type: isCoreEcosystem ? 'partner' : 'client',
    is_crmos_core: isCoreEcosystem,
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

  // Determine role: info@jamaldrenthe.com and info@crmos.one are always Super Admin
  const isSuperAdmin =
    fbUser.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    fbUser.email?.toLowerCase() === 'info@crmos.one' ||
    existingUserData.is_super_admin === true;

  const userRole: User['role'] = isSuperAdmin ? 'admin' : ((existingUserData.role as User['role']) || 'admin');

  // App User object
  const appUser: User = {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || (isSuperAdmin ? 'Jamal Drenthe' : 'CRMos Gebruiker'),
    avatar: fbUser.photoURL || undefined,
    role: userRole,
    org_id: org.id,
    company_name: effectiveCompanyName,
    is_super_admin: isSuperAdmin,
    allowed_companies: isCoreEcosystem
      ? ['CRMos', 'VVC', 'Quantum Initium', 'Logs Rent', 'Djobba', 'Trusting Work']
      : [effectiveCompanyName],
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

export async function sendPasswordReset(email: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await sendPasswordResetEmail(auth, email);
}

export { onAuthStateChanged };
