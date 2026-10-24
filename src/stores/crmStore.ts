import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, Contact360, Company, Deal, Pipeline, Activity, TimelineEvent } from '@/types';
import {
  saveContactToFirestore,
  deleteContactFromFirestore,
  subscribeToContacts,
  saveCompanyToFirestore,
  deleteCompanyFromFirestore,
  subscribeToCompanies,
  saveDealToFirestore,
  deleteDealFromFirestore,
  subscribeToDeals,
  saveActivityToFirestore,
  deleteActivityFromFirestore,
  subscribeToActivities,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/authStore';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  ensureContactVvcTag,
  ensureAllContactsHaveVvcTags,
  getVvcTag,
} from '@/services/vvcTagService';

// Clean up legacy mock localStorage key on load
if (typeof window !== 'undefined') {
  window.localStorage.removeItem('crmos-crm-storage');
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultPipelines: Pipeline[] = [
  {
    id: '1',
    name: 'Sales Pipeline',
    is_default: true,
    stages: [
      { id: 'lead', name: 'Lead', order: 0, color: '#94a3b8', probability: 10 },
      { id: 'qualified', name: 'Qualified', order: 1, color: '#60a5fa', probability: 25 },
      { id: 'proposal', name: 'Proposal', order: 2, color: '#fbbf24', probability: 50 },
      { id: 'negotiation', name: 'Negotiation', order: 3, color: '#f97316', probability: 75 },
      { id: 'closed-won', name: 'Closed Won', order: 4, color: '#22c55e', probability: 100 },
      { id: 'closed-lost', name: 'Closed Lost', order: 5, color: '#ef4444', probability: 0 },
    ],
  },
];

interface CRMState {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  pipelines: Pipeline[];
  activities: Activity[];
  selectedContact: Contact360 | null;
  selectedDeal: Deal | null;
  selectedCompany: Company | null;

  // Actions
  setContacts: (contacts: Contact[]) => void;
  setCompanies: (companies: Company[]) => void;
  setDeals: (deals: Deal[]) => void;
  setPipelines: (pipelines: Pipeline[]) => void;
  setActivities: (activities: Activity[]) => void;
  clearLocalStore: () => void;

  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addDeal: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (dealId: string, newStage: string) => void;

  addActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Activity;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  completeActivity: (id: string) => void;
  deleteActivity: (id: string) => void;

  selectContact: (contact: Contact360 | null) => void;
  selectDeal: (deal: Deal | null) => void;
  selectCompany: (company: Company | null) => void;

  getContact360: (contactId: string) => Contact360 | null;
  getDealsByStage: (stageId: string) => Deal[];
  getActivitiesByContact: (contactId: string) => Activity[];
  getTimelineForContact: (contactId: string) => TimelineEvent[];

  searchContacts: (query: string) => Contact[];
  searchCompanies: (query: string) => Company[];
  searchDeals: (query: string) => Deal[];

  // VVC API Tag Sync
  ensureVvcTagsOnAllContacts: () => number;

  // Firestore Sync
  isFirestoreSynced: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  syncWithFirestore: (orgId: string) => () => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      contacts: [],
      companies: [],
      deals: [],
      pipelines: defaultPipelines,
      activities: [],
      selectedContact: null,
      selectedDeal: null,
      selectedCompany: null,
      isFirestoreSynced: false,
      syncStatus: 'idle',

      setContacts: (contacts) => set({ contacts }),
      setCompanies: (companies) => set({ companies }),
      setDeals: (deals) => set({ deals }),
      setPipelines: (pipelines) => set({ pipelines }),
      setActivities: (activities) => set({ activities }),
      clearLocalStore: () =>
        set({
          contacts: [],
          companies: [],
          deals: [],
          activities: [],
          selectedContact: null,
          selectedDeal: null,
          selectedCompany: null,
        }),

      addContact: (contactData) => {
        const authUser = useAuthStore.getState().user;
        const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = authUser?.company_name || '';

        const existingVvcTags = new Set(
          get()
            .contacts.map((c) => getVvcTag(c)?.toLowerCase())
            .filter(Boolean) as string[]
        );

        const baseContact: Contact = {
          org_id: orgId,
          company_name: userCompanyName,
          ...contactData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newContact = ensureContactVvcTag(baseContact, existingVvcTags);

        set((state) => ({ contacts: [...state.contacts, newContact] }));
        saveContactToFirestore(newContact, orgId);
        return newContact;
      },

      updateContact: (id, updates) => {
        set((state) => {
          const updatedContacts = state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedContacts.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveContactToFirestore(updated, orgId);
          }
          return { contacts: updatedContacts };
        });
      },

      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        }));
        deleteContactFromFirestore(id);
      },

      addCompany: (companyData) => {
        const authUser = useAuthStore.getState().user;
        const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = authUser?.company_name || '';

        const newCompany: Company = {
          org_id: orgId,
          company_name: userCompanyName,
          ...companyData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ companies: [...state.companies, newCompany] }));
        saveCompanyToFirestore(newCompany, orgId);
        return newCompany;
      },

      updateCompany: (id, updates) => {
        set((state) => {
          const updatedCompanies = state.companies.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCompanies.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCompanyToFirestore(updated, orgId);
          }
          return { companies: updatedCompanies };
        });
      },

      deleteCompany: (id) => {
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
        }));
        deleteCompanyFromFirestore(id);
      },

      addDeal: (dealData) => {
        const authUser = useAuthStore.getState().user;
        const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = authUser?.company_name || '';

        const newDeal: Deal = {
          org_id: orgId,
          company_name: userCompanyName,
          ...dealData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ deals: [...state.deals, newDeal] }));
        saveDealToFirestore(newDeal, orgId);
        return newDeal;
      },

      updateDeal: (id, updates) => {
        set((state) => {
          const updatedDeals = state.deals.map((d) =>
            d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
          );
          const updated = updatedDeals.find((d) => d.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveDealToFirestore(updated, orgId);
          }
          return { deals: updatedDeals };
        });
      },

      deleteDeal: (id) => {
        set((state) => ({
          deals: state.deals.filter((d) => d.id !== id),
        }));
        deleteDealFromFirestore(id);
      },

      moveDeal: (dealId, newStage) => {
        set((state) => {
          const updatedDeals = state.deals.map((d) =>
            d.id === dealId
              ? { ...d, stage: newStage, updated_at: new Date().toISOString() }
              : d
          );
          const updated = updatedDeals.find((d) => d.id === dealId);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveDealToFirestore(updated, orgId);
          }
          return { deals: updatedDeals };
        });
      },

      addActivity: (activityData) => {
        const authUser = useAuthStore.getState().user;
        const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = authUser?.company_name || '';

        const newActivity: Activity = {
          org_id: orgId,
          company_name: userCompanyName,
          ...activityData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ activities: [...state.activities, newActivity] }));
        saveActivityToFirestore(newActivity, orgId);
        return newActivity;
      },

      updateActivity: (id, updates) => {
        set((state) => {
          const updatedActivities = state.activities.map((a) =>
            a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
          );
          const updated = updatedActivities.find((a) => a.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveActivityToFirestore(updated, orgId);
          }
          return { activities: updatedActivities };
        });
      },

      completeActivity: (id) => {
        set((state) => {
          const updatedActivities = state.activities.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'completed' as const,
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : a
          );
          const updated = updatedActivities.find((a) => a.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveActivityToFirestore(updated, orgId);
          }
          return { activities: updatedActivities };
        });
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        }));
        deleteActivityFromFirestore(id);
      },

      syncWithFirestore: (orgId: string) => {
        if (!isFirebaseConfigured()) {
          set({ syncStatus: 'offline', isFirestoreSynced: false });
          return () => {};
        }

        set({ syncStatus: 'syncing' });

        const unsubs: (() => void)[] = [];

        // Contacts subscription (replace state directly with real Firestore records, guaranteeing VVC tags)
        const unsubContacts = subscribeToContacts(orgId, (firestoreContacts) => {
          const rawContacts = firestoreContacts || [];
          const { updatedContacts, changedCount } = ensureAllContactsHaveVvcTags(rawContacts);
          set({
            contacts: updatedContacts,
            syncStatus: 'synced',
            isFirestoreSynced: true,
          });

          // Als er contacten waren die nog geen unieke VVC communicatie tag hadden, sla deze direct op in Firestore
          if (changedCount > 0 && isFirebaseConfigured()) {
            updatedContacts.forEach((contact) => {
              const original = rawContacts.find((c) => c.id === contact.id);
              if (original !== contact) {
                saveContactToFirestore(contact, orgId);
              }
            });
          }
        });
        unsubs.push(unsubContacts);

        // Companies subscription
        const unsubCompanies = subscribeToCompanies(orgId, (firestoreCompanies) => {
          set({ companies: firestoreCompanies || [] });
        });
        unsubs.push(unsubCompanies);

        // Deals subscription
        const unsubDeals = subscribeToDeals(orgId, (firestoreDeals) => {
          set({ deals: firestoreDeals || [] });
        });
        unsubs.push(unsubDeals);

        // Activities subscription
        const unsubActivities = subscribeToActivities(orgId, (firestoreActivities) => {
          set({ activities: firestoreActivities || [] });
        });
        unsubs.push(unsubActivities);

        set({ isFirestoreSynced: true, syncStatus: 'synced' });

        return () => {
          unsubs.forEach((u) => u());
        };
      },

      selectContact: (contact) => set({ selectedContact: contact }),
      selectDeal: (deal) => set({ selectedDeal: deal }),
      selectCompany: (company) => set({ selectedCompany: company }),

      getContact360: (contactId) => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return null;

        const timeline = get().getTimelineForContact(contactId);
        const interactions = timeline.length;
        const emails_sent = timeline.filter((t) => t.type === 'email').length;
        const calls_made = timeline.filter((t) => t.type === 'call').length;
        const meetings_held = timeline.filter((t) => t.type === 'meeting').length;

        const score = Math.min(100, 30 + interactions * 5 + emails_sent * 2 + calls_made * 3);

        return {
          ...contact,
          timeline,
          score,
          lifetime_value: get()
            .deals.filter((d) => d.contact_id === contactId && (d.stage === 'closed-won' || d.stage === 'won'))
            .reduce((sum, d) => sum + d.value, 0),
          interactions_count: interactions,
          emails_sent,
          emails_opened: Math.floor(emails_sent * 0.7),
          calls_made,
          meetings_held,
        };
      },

      getDealsByStage: (stageId) => {
        return get().deals.filter((d) => d.stage === stageId);
      },

      getActivitiesByContact: (contactId) => {
        return get().activities.filter(
          (a) => a.related_to.type === 'contact' && a.related_to.id === contactId
        );
      },

      getTimelineForContact: (contactId) => {
        const contactActivities = get().activities.filter(
          (a) => a.related_to.type === 'contact' && a.related_to.id === contactId
        );
        const contactDeals = get().deals.filter((d) => d.contact_id === contactId);

        const events: TimelineEvent[] = [
          ...contactActivities.map((act) => ({
            id: act.id,
            type: (act.type === 'task' ? 'note' : act.type) as TimelineEvent['type'],
            title: act.title,
            description: act.description,
            timestamp: act.completed_at || act.due_date || act.created_at,
            user_id: act.assigned_to || 'user1',
          })),
          ...contactDeals.map((deal) => ({
            id: `tl_deal_${deal.id}`,
            type: (deal.stage === 'closed-won' || deal.stage === 'won'
              ? 'deal_won'
              : deal.stage === 'closed-lost'
              ? 'deal_lost'
              : 'deal_created') as TimelineEvent['type'],
            title: deal.name,
            description: `Waarde: €${deal.value.toLocaleString('nl-NL')} (${deal.stage})`,
            timestamp: deal.updated_at || deal.created_at,
            user_id: deal.assigned_to || 'user1',
          })),
        ];

        return events.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      ensureVvcTagsOnAllContacts: () => {
        const { contacts } = get();
        const { updatedContacts, changedCount } = ensureAllContactsHaveVvcTags(contacts);
        if (changedCount > 0) {
          const authUser = useAuthStore.getState().user;
          const orgId = authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';

          set({ contacts: updatedContacts });

          if (isFirebaseConfigured()) {
            updatedContacts.forEach((contact) => {
              const oldContact = contacts.find((c) => c.id === contact.id);
              if (oldContact !== contact) {
                saveContactToFirestore(contact, orgId);
              }
            });
          }
        }
        return changedCount;
      },

      searchContacts: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().contacts.filter(
          (c) =>
            c.first_name.toLowerCase().includes(lowerQuery) ||
            c.last_name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery) ||
            c.company?.toLowerCase().includes(lowerQuery) ||
            c.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
        );
      },

      searchCompanies: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().companies.filter(
          (c) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.industry?.toLowerCase().includes(lowerQuery)
        );
      },

      searchDeals: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().deals.filter(
          (d) =>
            d.name.toLowerCase().includes(lowerQuery) ||
            d.company_name?.toLowerCase().includes(lowerQuery) ||
            d.contact_name?.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'crmos-crm-live-v3',
      partialize: (state) => ({
        contacts: state.contacts,
        companies: state.companies,
        deals: state.deals,
        pipelines: state.pipelines,
        activities: state.activities,
      }),
    }
  )
);
