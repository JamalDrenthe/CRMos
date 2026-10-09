import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '@/types';
import { 
  signInWithGoogle, 
  logoutFirebase, 
  onAuthStateChanged, 
  auth, 
  syncFirebaseUserWithFirestore, 
  isFirebaseConfigured 
} from '@/lib/firebase';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  login: (user: User, org: Organization) => void;
  loginWithGoogleAction: () => Promise<{ user: User; org: Organization }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setOrganization: (org) => set({ organization: org }),
      
      login: (user, org) => set({
        user,
        organization: org,
        isAuthenticated: true,
        error: null,
      }),

      loginWithGoogleAction: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user, org } = await signInWithGoogle();
          set({
            user,
            organization: org,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { user, org };
        } catch (error: any) {
          const message = error?.message || 'Er is een fout opgetreden bij het inloggen met Google.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          await logoutFirebase();
        } catch (err) {
          console.warn('Fout bij uitloggen uit Firebase:', err);
        }
        set({
          user: null,
          organization: null,
          isAuthenticated: false,
          error: null,
        });
      },
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      initAuthListener: () => {
        if (!isFirebaseConfigured()) {
          return () => {};
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            try {
              // Only sync if user was not already loaded or if different
              const currentUser = get().user;
              if (!currentUser || currentUser.id !== fbUser.uid) {
                const { user, org } = await syncFirebaseUserWithFirestore(fbUser);
                set({ user, organization: org, isAuthenticated: true });
              }
            } catch (e) {
              console.error('Fout bij synchroniseren van auth state:', e);
            }
          } else {
            // Only clear if logged in via firebase
            const currentUser = get().user;
            if (currentUser && currentUser.id.length > 20) {
              set({ user: null, organization: null, isAuthenticated: false });
            }
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'crmos-auth-storage',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
