import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quote } from '@/types';
import { 
  saveQuoteToFirestore, 
  deleteQuoteFromFirestore, 
  subscribeToQuotes 
} from '@/services/firestoreService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';

const generateId = () => Math.random().toString(36).substring(2, 11);

const sampleQuotes: Quote[] = [
  {
    id: 'quote_1',
    quote_number: 'OFF-2026-001',
    title: 'Q4 Zakelijke CRMos Licentie & Support',
    customer_name: 'Amsterdam Holding B.V.',
    subtotal: 4800,
    tax_rate: 21,
    tax_amount: 1008,
    discount_amount: 0,
    total: 5808,
    currency: 'EUR',
    status: 'accepted',
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_by: 'Jamal Drenthe',
    items: [
      {
        id: 'item_1',
        name: 'CRMos Pro Bedrijfslicentie (12 mnd)',
        quantity: 1,
        unit_price: 3600,
        discount_percent: 0,
        total: 3600,
      },
      {
        id: 'item_2',
        name: 'Onboarding & Buitendienst Training',
        quantity: 1,
        unit_price: 1200,
        discount_percent: 0,
        total: 1200,
      },
    ],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'quote_2',
    quote_number: 'OFF-2026-002',
    title: 'Field Sales iPad & Scan Suite',
    customer_name: 'Rotterdam Logistics Group',
    subtotal: 12500,
    tax_rate: 21,
    tax_amount: 2625,
    discount_amount: 500,
    total: 14625,
    currency: 'EUR',
    status: 'sent',
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_by: 'Alex Johnson',
    items: [
      {
        id: 'item_3',
        name: 'Hardware Bundel Buitendienst',
        quantity: 5,
        unit_price: 2500,
        discount_percent: 4,
        total: 12000,
      },
    ],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

interface QuotesState {
  quotes: Quote[];
  selectedQuote: Quote | null;
  isFirestoreSynced: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';

  setQuotes: (quotes: Quote[]) => void;
  selectQuote: (quote: Quote | null) => void;
  addQuote: (quoteData: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  syncWithFirestore: (orgId: string) => () => void;
}

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set) => ({
      quotes: sampleQuotes,
      selectedQuote: null,
      isFirestoreSynced: false,
      syncStatus: 'idle',

      setQuotes: (quotes) => set({ quotes }),
      selectQuote: (quote) => set({ selectedQuote: quote }),

      addQuote: (quoteData) => {
        const authUser = useAuthStore.getState().user;
        const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = authUser?.company_name || '';

        const newQuote: Quote = {
          org_id: orgId,
          company_name: userCompanyName,
          ...quoteData,
          id: `quote_${Date.now()}_${generateId()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set((state) => ({ quotes: [newQuote, ...state.quotes] }));
        saveQuoteToFirestore(newQuote, orgId);
        return newQuote;
      },

      updateQuote: (id, updates) => {
        const authUser = useAuthStore.getState().user;
        const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';

        set((state) => {
          const updatedQuotes = state.quotes.map((q) =>
            q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q
          );
          const updated = updatedQuotes.find((q) => q.id === id);
          if (updated) {
            saveQuoteToFirestore(updated, orgId);
          }
          return { quotes: updatedQuotes };
        });
      },

      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
        deleteQuoteFromFirestore(id);
      },

      syncWithFirestore: (orgId: string) => {
        if (!isFirebaseConfigured()) {
          set({ syncStatus: 'offline', isFirestoreSynced: false });
          return () => {};
        }

        set({ syncStatus: 'syncing' });

        return subscribeToQuotes(orgId, (firestoreQuotes) => {
          if (firestoreQuotes && firestoreQuotes.length > 0) {
            set({
              quotes: firestoreQuotes,
              syncStatus: 'synced',
              isFirestoreSynced: true,
            });
          } else {
            set({ syncStatus: 'synced', isFirestoreSynced: true });
          }
        });
      },
    }),
    {
      name: 'crmos-quotes-live-v1',
    }
  )
);
