import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '@/types';
import { 
  signInWithGoogle, 
  registerWithEmailPassword,
  loginWithEmailPassword,
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
  registerWithEmailAction: (name: string, email: string, password: string, companyName?: string, role?: User['role']) => Promise<{ user: User; org: Organization }>;
  loginWithEmailAction: (email: string, password: string) => Promise<{ user: User; org: Organization }>;
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
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Er is een fout opgetreden bij het inloggen met Google.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      registerWithEmailAction: async (name, email, password, companyName, role = 'admin') => {
        set({ isLoading: true, error: null });
        try {
          if (isFirebaseConfigured()) {
            const { user, org } = await registerWithEmailPassword(name, email, password, companyName);
            set({
              user,
              organization: org,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { user, org };
          } else {
            // Local Demo/Offline Registration
            const orgId = `org_${Math.random().toString(36).substring(2, 8)}`;
            const mockOrg: Organization = {
              id: orgId,
              name: companyName || `${name}'s Bedrijf`,
              org_type: 'supplier',
              settings: {
                timezone: 'Europe/Amsterdam',
                currency: 'EUR',
                date_format: 'DD/MM/YYYY',
                branding: { primary_color: '#3b82f6' },
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

            const mockUser: User = {
              id: `user_${Math.random().toString(36).substring(2, 8)}`,
              email,
              name,
              role,
              org_id: orgId,
              timezone: 'Europe/Amsterdam',
              created_at: new Date().toISOString(),
            };

            set({
              user: mockUser,
              organization: mockOrg,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { user: mockUser, org: mockOrg };
          }
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Er is een fout opgetreden bij het registreren.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      loginWithEmailAction: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          if (isFirebaseConfigured()) {
            const { user, org } = await loginWithEmailPassword(email, password);
            set({
              user,
              organization: org,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { user, org };
          } else {
            // Demo Fallback
            const mockOrg: Organization = {
              id: 'org1',
              name: 'CRMos Demo Organisatie',
              org_type: 'supplier',
              settings: {
                timezone: 'Europe/Amsterdam',
                currency: 'EUR',
                date_format: 'DD/MM/YYYY',
                branding: { primary_color: '#3b82f6' },
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

            const mockUser: User = {
              id: 'user1',
              email,
              name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              role: 'admin',
              org_id: 'org1',
              timezone: 'Europe/Amsterdam',
              created_at: new Date().toISOString(),
            };

            set({
              user: mockUser,
              organization: mockOrg,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { user: mockUser, org: mockOrg };
          }
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Er is een fout opgetreden bij het inloggen.';
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
