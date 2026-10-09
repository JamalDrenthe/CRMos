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

// Generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample data for demo
const sampleContacts: Contact[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@acme.com',
    phone: '+1 (555) 123-4567',
    mobile: '+1 (555) 987-6543',
    company: 'Acme Corp',
    title: 'VP of Sales',
    industry: 'Technology',
    status: 'customer',
    source: 'Website',
    assigned_to: 'user1',
    tags: ['enterprise', 'decision-maker'],
    address: { city: 'San Francisco', state: 'CA', country: 'USA' },
    social_profiles: { linkedin: 'linkedin.com/in/johnsmith' },
    custom_fields: {},
    last_contact_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@techflow.io',
    phone: '+1 (555) 234-5678',
    company: 'TechFlow',
    title: 'CEO',
    industry: 'Software',
    status: 'prospect',
    source: 'LinkedIn',
    assigned_to: 'user1',
    tags: ['startup', 'hot-lead'],
    address: { city: 'New York', state: 'NY', country: 'USA' },
    custom_fields: {},
    last_contact_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'm.chen@globalsolutions.com',
    phone: '+1 (555) 345-6789',
    company: 'Global Solutions',
    title: 'Procurement Manager',
    industry: 'Manufacturing',
    status: 'lead',
    source: 'Trade Show',
    assigned_to: 'user2',
    tags: ['mid-market'],
    address: { city: 'Chicago', state: 'IL', country: 'USA' },
    custom_fields: {},
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@innovate.co',
    phone: '+1 (555) 456-7890',
    company: 'Innovate Co',
    title: 'CTO',
    industry: 'Technology',
    status: 'customer',
    source: 'Referral',
    assigned_to: 'user1',
    tags: ['enterprise', 'tech-savvy'],
    address: { city: 'Austin', state: 'TX', country: 'USA' },
    custom_fields: {},
    last_contact_at: new Date(Date.now() - 432000000).toISOString(),
    created_at: new Date(Date.now() - 15552000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: '5',
    first_name: 'Robert',
    last_name: 'Wilson',
    email: 'r.wilson@startup.xyz',
    phone: '+1 (555) 567-8901',
    company: 'StartupXYZ',
    title: 'Founder',
    industry: 'SaaS',
    status: 'prospect',
    source: 'Cold Outreach',
    assigned_to: 'user2',
    tags: ['startup', 'founder'],
    address: { city: 'Seattle', state: 'WA', country: 'USA' },
    custom_fields: {},
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date(Date.now() - 1209600000).toISOString(),
  },
];

const sampleCompanies: Company[] = [
  {
    id: '1',
    name: 'Acme Corp',
    domain: 'acme.com',
    industry: 'Technology',
    size: '1000-5000',
    revenue: '$100M-$500M',
    address: { city: 'San Francisco', state: 'CA', country: 'USA' },
    phone: '+1 (555) 100-0000',
    website: 'https://acme.com',
    assigned_to: 'user1',
    contacts_count: 5,
    deals_count: 3,
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'TechFlow',
    domain: 'techflow.io',
    industry: 'Software',
    size: '50-200',
    revenue: '$10M-$50M',
    address: { city: 'New York', state: 'NY', country: 'USA' },
    website: 'https://techflow.io',
    assigned_to: 'user1',
    contacts_count: 3,
    deals_count: 1,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    name: 'Global Solutions',
    domain: 'globalsolutions.com',
    industry: 'Manufacturing',
    size: '500-1000',
    revenue: '$50M-$100M',
    address: { city: 'Chicago', state: 'IL', country: 'USA' },
    phone: '+1 (555) 200-0000',
    website: 'https://globalsolutions.com',
    assigned_to: 'user2',
    contacts_count: 8,
    deals_count: 2,
    created_at: new Date(Date.now() - 15552000000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
];

const samplePipelines: Pipeline[] = [
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

const sampleDeals: Deal[] = [
  {
    id: '1',
    name: 'Acme Corp - Enterprise License',
    company_id: '1',
    company_name: 'Acme Corp',
    contact_id: '1',
    contact_name: 'John Smith',
    value: 150000,
    currency: 'USD',
    stage: 'negotiation',
    pipeline_id: '1',
    probability: 75,
    expected_close_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
    source: 'Website',
    assigned_to: 'user1',
    assigned_name: 'Alex Johnson',
    tags: ['enterprise', 'q4-target'],
    activities: [],
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'TechFlow - Team Plan',
    company_id: '2',
    company_name: 'TechFlow',
    contact_id: '2',
    contact_name: 'Sarah Johnson',
    value: 36000,
    currency: 'USD',
    stage: 'proposal',
    pipeline_id: '1',
    probability: 50,
    expected_close_date: new Date(Date.now() + 1296000000).toISOString().split('T')[0],
    source: 'LinkedIn',
    assigned_to: 'user1',
    assigned_name: 'Alex Johnson',
    tags: ['startup', 'monthly'],
    activities: [],
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    name: 'Global Solutions - Implementation',
    company_id: '3',
    company_name: 'Global Solutions',
    contact_id: '3',
    contact_name: 'Michael Chen',
    value: 85000,
    currency: 'USD',
    stage: 'qualified',
    pipeline_id: '1',
    probability: 25,
    expected_close_date: new Date(Date.now() + 5184000000).toISOString().split('T')[0],
    source: 'Trade Show',
    assigned_to: 'user2',
    assigned_name: 'Maria Garcia',
    tags: ['services', 'q1-next'],
    activities: [],
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: '4',
    name: 'Innovate Co - Renewal',
    company_id: '4',
    company_name: 'Innovate Co',
    contact_id: '4',
    contact_name: 'Emily Davis',
    value: 75000,
    currency: 'USD',
    stage: 'closed-won',
    pipeline_id: '1',
    probability: 100,
    expected_close_date: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    actual_close_date: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    source: 'Referral',
    assigned_to: 'user1',
    assigned_name: 'Alex Johnson',
    tags: ['renewal', 'expansion'],
    activities: [],
    created_at: new Date(Date.now() - 15552000000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: '5',
    name: 'StartupXYZ - Pilot',
    company_id: '5',
    company_name: 'StartupXYZ',
    contact_id: '5',
    contact_name: 'Robert Wilson',
    value: 12000,
    currency: 'USD',
    stage: 'lead',
    pipeline_id: '1',
    probability: 10,
    expected_close_date: new Date(Date.now() + 7776000000).toISOString().split('T')[0],
    source: 'Cold Outreach',
    assigned_to: 'user2',
    assigned_name: 'Maria Garcia',
    tags: ['pilot', 'small-deal'],
    activities: [],
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
];

const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'call',
    title: 'Follow-up call with John',
    description: 'Discuss enterprise license terms',
    status: 'pending',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    assigned_to: 'user1',
    related_to: { type: 'deal', id: '1' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    type: 'meeting',
    title: 'Product Demo',
    description: 'Show new features to TechFlow team',
    status: 'pending',
    due_date: new Date(Date.now() + 172800000).toISOString(),
    assigned_to: 'user1',
    related_to: { type: 'deal', id: '2' },
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    type: 'task',
    title: 'Send proposal to Global Solutions',
    status: 'pending',
    due_date: new Date(Date.now() + 432000000).toISOString(),
    assigned_to: 'user2',
    related_to: { type: 'deal', id: '3' },
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

const sampleTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'email',
    title: 'Email Sent',
    description: 'Proposal for Enterprise License',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'user1',
    user_name: 'Alex Johnson',
  },
  {
    id: '2',
    type: 'call',
    title: 'Call Completed',
    description: '45 min - Discussed requirements',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    user_id: 'user1',
    user_name: 'Alex Johnson',
  },
  {
    id: '3',
    type: 'deal_created',
    title: 'Deal Created',
    description: 'Acme Corp - Enterprise License ($150,000)',
    timestamp: new Date(Date.now() - 5184000000).toISOString(),
    user_id: 'user1',
    user_name: 'Alex Johnson',
  },
  {
    id: '4',
    type: 'status_change',
    title: 'Stage Updated',
    description: 'Moved from Proposal to Negotiation',
    timestamp: new Date(Date.now() - 604800000).toISOString(),
    user_id: 'user1',
    user_name: 'Alex Johnson',
  },
  {
    id: '5',
    type: 'meeting',
    title: 'Meeting Scheduled',
    description: 'Product demo with stakeholders',
    timestamp: new Date(Date.now() - 2592000000).toISOString(),
    user_id: 'user1',
    user_name: 'Alex Johnson',
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

  // Firestore Sync
  isFirestoreSynced: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  syncWithFirestore: (orgId: string) => () => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      contacts: sampleContacts,
      companies: sampleCompanies,
      deals: sampleDeals,
      pipelines: samplePipelines,
      activities: sampleActivities,
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

      addContact: (contactData) => {
        const newContact: Contact = {
          ...contactData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ contacts: [...state.contacts, newContact] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
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
        const newCompany: Company = {
          ...companyData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ companies: [...state.companies, newCompany] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
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
        const newDeal: Deal = {
          ...dealData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ deals: [...state.deals, newDeal] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
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
        const newActivity: Activity = {
          ...activityData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ activities: [...state.activities, newActivity] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
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
              ? { ...a, status: 'completed' as const, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
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

        // Contacts subscription
        const unsubContacts = subscribeToContacts(orgId, (firestoreContacts) => {
          if (firestoreContacts && firestoreContacts.length > 0) {
            set((state) => {
              const existingIds = new Set(firestoreContacts.map((c) => c.id));
              const nonFirestore = state.contacts.filter((c) => !existingIds.has(c.id));
              return { contacts: [...firestoreContacts, ...nonFirestore], syncStatus: 'synced', isFirestoreSynced: true };
            });
          }
        });
        unsubs.push(unsubContacts);

        // Companies subscription
        const unsubCompanies = subscribeToCompanies(orgId, (firestoreCompanies) => {
          if (firestoreCompanies && firestoreCompanies.length > 0) {
            set((state) => {
              const existingIds = new Set(firestoreCompanies.map((c) => c.id));
              const nonFirestore = state.companies.filter((c) => !existingIds.has(c.id));
              return { companies: [...firestoreCompanies, ...nonFirestore] };
            });
          }
        });
        unsubs.push(unsubCompanies);

        // Deals subscription
        const unsubDeals = subscribeToDeals(orgId, (firestoreDeals) => {
          if (firestoreDeals && firestoreDeals.length > 0) {
            set((state) => {
              const existingIds = new Set(firestoreDeals.map((d) => d.id));
              const nonFirestore = state.deals.filter((d) => !existingIds.has(d.id));
              return { deals: [...firestoreDeals, ...nonFirestore] };
            });
          }
        });
        unsubs.push(unsubDeals);

        // Activities subscription
        const unsubActivities = subscribeToActivities(orgId, (firestoreActivities) => {
          if (firestoreActivities && firestoreActivities.length > 0) {
            set((state) => {
              const existingIds = new Set(firestoreActivities.map((a) => a.id));
              const nonFirestore = state.activities.filter((a) => !existingIds.has(a.id));
              return { activities: [...firestoreActivities, ...nonFirestore] };
            });
          }
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
        
        // Calculate score based on engagement
        const score = Math.min(100, 30 + interactions * 5 + emails_sent * 2 + calls_made * 3);
        
        return {
          ...contact,
          timeline,
          score,
          lifetime_value: get().deals
            .filter((d) => d.contact_id === contactId && d.stage === 'closed-won')
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

      getTimelineForContact: () => {
        // Return sample timeline for demo
        return sampleTimelineEvents;
      },

      searchContacts: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().contacts.filter(
          (c) =>
            c.first_name.toLowerCase().includes(lowerQuery) ||
            c.last_name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery) ||
            c.company?.toLowerCase().includes(lowerQuery)
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
      name: 'crmos-crm-storage',
    }
  )
);
