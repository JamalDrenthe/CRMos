import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, Contact360, Company, CompanyInvitation, CRMTeam, TeamStatus, Deal, Pipeline, Activity, TimelineEvent } from '@/types';
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
import { DEFAULT_ECOSYSTEM_COMPANIES, formatCompanyTag } from '@/lib/companyAccess';
import {
  ensureContactVvcTag,
  ensureAllContactsHaveVvcTags,
  getVvcTag,
} from '@/services/vvcTagService';
import {
  DEFAULT_CRM_TEAMS,
  deduplicateAndEnrichContactsWithTeams,
  isReferredByJamal,
  smartSearchContacts,
  smartSearchCompanies,
} from '@/services/crmSearchEngine';

function mergeEcosystemCompanies(existingCompanies: Company[]): {
  merged: Company[];
  addedCompanies: Company[];
} {
  const result = existingCompanies.map((comp) => {
    const primaryTag = comp.company_tag || formatCompanyTag(comp.name);
    const allTags = Array.from(new Set([primaryTag, ...(comp.company_tags || [])].filter(Boolean)));
    if (comp.company_tag === primaryTag && comp.company_tags?.length === allTags.length) {
      return comp;
    }
    return {
      ...comp,
      company_tag: primaryTag,
      company_tags: allTags,
    };
  });

  const addedCompanies: Company[] = [];
  const now = new Date().toISOString();

  for (const eco of DEFAULT_ECOSYSTEM_COMPANIES) {
    const exists = result.some(
      (c) =>
        c.id === eco.id ||
        c.name.trim().toLowerCase() === eco.name.trim().toLowerCase() ||
        (c.company_tag && eco.company_tag && c.company_tag.toLowerCase() === eco.company_tag.toLowerCase())
    );
    if (!exists) {
      const fullCompany: Company = {
        ...eco,
        created_at: now,
        updated_at: now,
      };
      result.unshift(fullCompany);
      addedCompanies.push(fullCompany);
    }
  }

  return { merged: result, addedCompanies };
}

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
  teams: CRMTeam[];
  companies: Company[];
  deals: Deal[];
  pipelines: Pipeline[];
  activities: Activity[];
  selectedContact: Contact360 | null;
  selectedDeal: Deal | null;
  selectedCompany: Company | null;

  // Actions
  setContacts: (contacts: Contact[]) => void;
  setTeams: (teams: CRMTeam[]) => void;
  setCompanies: (companies: Company[]) => void;
  setDeals: (deals: Deal[]) => void;
  setPipelines: (pipelines: Pipeline[]) => void;
  setActivities: (activities: Activity[]) => void;
  clearLocalStore: () => void;

  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Contact;
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
  searchAccountsByCompanyTag: (tagOrQuery: string) => Contact[];

  // VVC API Tag, Ecosystem Companies, Custom Tags & Referral Teams Sync
  ensureVvcTagsOnAllContacts: () => number;
  ensureEcosystemCompaniesInCRM: () => number;
  ensureTeamsAndCoreReferralsInCRM: () => void;
  addTagToContact: (contactId: string, tag: string) => void;
  removeTagFromContact: (contactId: string, tag: string) => void;
  addCompanyTagToContact: (contactId: string, companyTag: string) => void;
  removeCompanyTagFromContact: (contactId: string, companyTag: string) => void;
  inviteContactToCompany: (companyId: string, contactId: string, role?: string) => CompanyInvitation | null;
  acceptCompanyInvitation: (contactId: string, invitationId: string) => void;

  // Team & Referral Actions
  assignContactToTeam: (contactId: string, teamIdOrName: string, status?: TeamStatus, role?: 'leader' | 'member') => void;
  setContactTeamStatus: (contactId: string, status: TeamStatus) => void;
  setContactReferrer: (contactId: string, referredByName: string) => void;
  startTeamForContact: (contactId: string, teamName: string, status?: TeamStatus) => {
    success: boolean;
    reason?: string;
    team?: CRMTeam;
  };
  requestTeamForContact: (contactId: string, desiredTeamName: string, status?: TeamStatus) => void;
  approveTeamRequest: (contactId: string) => CRMTeam | null;
  rejectTeamRequest: (contactId: string) => void;

  // Firestore Sync
  isFirestoreSynced: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  syncWithFirestore: (orgId: string) => () => void;
}

const initialEnriched = deduplicateAndEnrichContactsWithTeams([], DEFAULT_CRM_TEAMS);

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      contacts: initialEnriched.contacts,
      teams: initialEnriched.teams,
      companies: mergeEcosystemCompanies([]).merged,
      deals: [],
      pipelines: defaultPipelines,
      activities: [],
      selectedContact: null,
      selectedDeal: null,
      selectedCompany: null,
      isFirestoreSynced: false,
      syncStatus: 'idle',

      setContacts: (contacts) => set({ contacts }),
      setTeams: (teams) => set({ teams }),
      setCompanies: (companies) => set({ companies }),
      setDeals: (deals) => set({ deals }),
      setPipelines: (pipelines) => set({ pipelines }),
      setActivities: (activities) => set({ activities }),
      clearLocalStore: () =>
        set({
          contacts: [],
          teams: DEFAULT_CRM_TEAMS,
          companies: [],
          deals: [],
          activities: [],
          selectedContact: null,
          selectedDeal: null,
          selectedCompany: null,
        }),

      addContact: (contactData) => {
        const authUser = useAuthStore.getState().user;
        const orgId = contactData.org_id || authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = contactData.company_name || authUser?.company_name || '';

        const existingVvcTags = new Set(
          get()
            .contacts.map((c) => getVvcTag(c)?.toLowerCase())
            .filter(Boolean) as string[]
        );

        const referredByName = contactData.referred_by_name || authUser?.name || 'Jamal Drenthe';
        const canStartTeam = contactData.can_start_team ?? isReferredByJamal(referredByName, contactData);
        const teamStatus: TeamStatus = contactData.team_status || 'active';
        const defaultTeamId = contactData.team_id || 'team_jamal_drenthe';
        const matchedTeam = get().teams.find((t) => t.id === defaultTeamId || t.name === contactData.team_name);
        const teamName = contactData.team_name || matchedTeam?.name || 'Team Jamal Drenthe';
        const statusTag = teamStatus === 'active' ? 'Actief Team' : 'Passief Team';

        const baseContact: Contact = {
          org_id: orgId,
          company_name: userCompanyName,
          ...contactData,
          team_id: matchedTeam?.id || defaultTeamId,
          team_name: teamName,
          team_status: teamStatus,
          team_role: contactData.team_role || 'member',
          referred_by_name: referredByName,
          can_start_team: canStartTeam,
          team_request_status: contactData.team_request_status || (canStartTeam ? 'approved' : 'none'),
          tags: Array.from(new Set([...(contactData.tags || []), statusTag])),
          id: contactData.id || generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newContact = ensureContactVvcTag(baseContact, existingVvcTags);

        set((state) => {
          const existingIdx = state.contacts.findIndex(
            (c) =>
              c.id === newContact.id ||
              (newContact.vvc_tag && getVvcTag(c)?.toLowerCase() === newContact.vvc_tag.toLowerCase())
          );
          if (existingIdx >= 0) {
            const next = [...state.contacts];
            next[existingIdx] = { ...next[existingIdx], ...newContact };
            return { contacts: next };
          }
          return { contacts: [newContact, ...state.contacts] };
        });
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
        const orgId = companyData.org_id || authUser?.org_id || useAuthStore.getState().organization?.id || 'default_org';
        const userCompanyName = companyData.company_name || authUser?.company_name || '';
        const primaryCompanyTag = formatCompanyTag(companyData.company_tag || companyData.name);
        const allCompanyTags = Array.from(
          new Set(
            [primaryCompanyTag, ...(companyData.company_tags || []).map((t) => formatCompanyTag(t))].filter(Boolean)
          )
        );

        const newCompany: Company = {
          org_id: orgId,
          company_name: userCompanyName,
          ...companyData,
          company_tag: primaryCompanyTag,
          company_tags: allCompanyTags,
          id: (companyData as Partial<Company>).id || generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ companies: [newCompany, ...state.companies] }));
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

        // Contacts subscription (replace state directly with real Firestore records, deduplicating & enriching with Teams + VVC tags)
        const unsubContacts = subscribeToContacts(orgId, (firestoreContacts) => {
          const rawContacts = firestoreContacts || [];
          const { updatedContacts } = ensureAllContactsHaveVvcTags(rawContacts);
          const {
            contacts: enrichedContacts,
            teams: enrichedTeams,
            addedOrUpdatedCoreContacts,
          } = deduplicateAndEnrichContactsWithTeams(updatedContacts, get().teams);

          set({
            contacts: enrichedContacts,
            teams: enrichedTeams,
            syncStatus: 'synced',
            isFirestoreSynced: true,
          });

          // Sla eventueel nieuw aangemaakte kernteamleden (zoals Boas Salesmates) op in Firestore
          if (addedOrUpdatedCoreContacts.length > 0 && isFirebaseConfigured()) {
            addedOrUpdatedCoreContacts.forEach((contact) => {
              saveContactToFirestore(contact, 'default_org');
            });
          }
        });
        unsubs.push(unsubContacts);

        // Companies subscription (garandeer altijd alle 13 ecosysteem-bedrijven + bedrijfstags)
        const unsubCompanies = subscribeToCompanies(orgId, (firestoreCompanies) => {
          const rawCompanies = firestoreCompanies || [];
          const { merged, addedCompanies } = mergeEcosystemCompanies(rawCompanies);
          set({ companies: merged });

          if (addedCompanies.length > 0 && isFirebaseConfigured()) {
            addedCompanies.forEach((comp) => {
              saveCompanyToFirestore(comp, comp.org_id || 'default_org');
            });
          }
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

      ensureEcosystemCompaniesInCRM: () => {
        const currentCompanies = get().companies;
        const { merged, addedCompanies } = mergeEcosystemCompanies(currentCompanies);
        set({ companies: merged });
        if (isFirebaseConfigured()) {
          addedCompanies.forEach((comp) => {
            saveCompanyToFirestore(comp, comp.org_id || 'default_org');
          });
        }
        return addedCompanies.length;
      },

      ensureTeamsAndCoreReferralsInCRM: () => {
        const state = get();
        const { contacts, teams, addedOrUpdatedCoreContacts } = deduplicateAndEnrichContactsWithTeams(
          state.contacts,
          state.teams
        );
        set({ contacts, teams });
        if (addedOrUpdatedCoreContacts.length > 0 && isFirebaseConfigured()) {
          addedOrUpdatedCoreContacts.forEach((c) => {
            saveContactToFirestore(c, 'default_org');
          });
        }
      },

      addTagToContact: (contactId, rawTag) => {
        const cleanTag = rawTag.trim();
        if (!cleanTag) return;
        const isCompTag = cleanTag.startsWith('#');
        set((state) => {
          const updatedContacts = state.contacts.map((c) => {
            if (c.id !== contactId) return c;
            const nextTags = Array.from(new Set([...(c.tags || []), cleanTag]));
            const nextCompanyTags = isCompTag
              ? Array.from(new Set([...(c.company_tags || []), formatCompanyTag(cleanTag)]))
              : c.company_tags;
            return {
              ...c,
              tags: nextTags,
              company_tags: nextCompanyTags,
              updated_at: new Date().toISOString(),
            };
          });
          const updated = updatedContacts.find((c) => c.id === contactId);
          if (updated) {
            saveContactToFirestore(updated, updated.org_id || 'default_org');
          }
          return { contacts: updatedContacts };
        });
      },

      removeTagFromContact: (contactId, tagToRemove) => {
        const lower = tagToRemove.trim().toLowerCase();
        set((state) => {
          const updatedContacts = state.contacts.map((c) => {
            if (c.id !== contactId) return c;
            return {
              ...c,
              tags: (c.tags || []).filter((t) => t.toLowerCase() !== lower),
              company_tags: (c.company_tags || []).filter((t) => t.toLowerCase() !== lower),
              updated_at: new Date().toISOString(),
            };
          });
          const updated = updatedContacts.find((c) => c.id === contactId);
          if (updated) {
            saveContactToFirestore(updated, updated.org_id || 'default_org');
          }
          return { contacts: updatedContacts };
        });
      },

      assignContactToTeam: (contactId, teamIdOrName, status, role) => {
        const state = get();
        const foundTeam =
          state.teams.find((t) => t.id === teamIdOrName || t.name.toLowerCase() === teamIdOrName.toLowerCase()) ||
          state.teams[0];
        if (!foundTeam) return;

        const contact = state.contacts.find((c) => c.id === contactId);
        if (!contact) return;

        const nextStatus: TeamStatus = status || contact.team_status || foundTeam.status || 'active';
        const statusTag = nextStatus === 'active' ? 'Actief Team' : 'Passief Team';
        const filteredTags = (contact.tags || []).filter((t) => t !== 'Actief Team' && t !== 'Passief Team');

        get().updateContact(contactId, {
          team_id: foundTeam.id,
          team_name: foundTeam.name,
          team_status: nextStatus,
          team_role: role || contact.team_role || (foundTeam.leader_id === contactId ? 'leader' : 'member'),
          tags: Array.from(new Set([...filteredTags, statusTag])),
        });

        set((s) => ({
          teams: s.teams.map((t) =>
            t.id === foundTeam.id
              ? { ...t, member_ids: Array.from(new Set([...t.member_ids, contactId])) }
              : t
          ),
        }));
      },

      setContactTeamStatus: (contactId, status) => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return;
        const statusTag = status === 'active' ? 'Actief Team' : 'Passief Team';
        const filteredTags = (contact.tags || []).filter((t) => t !== 'Actief Team' && t !== 'Passief Team');
        get().updateContact(contactId, {
          team_status: status,
          tags: Array.from(new Set([...filteredTags, statusTag])),
        });
      },

      setContactReferrer: (contactId, referredByName) => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return;
        const trimmed = referredByName.trim() || 'Jamal Drenthe';
        const canStart = isReferredByJamal(trimmed, { ...contact, referred_by_name: trimmed });
        const filteredTags = (contact.tags || []).filter((t) => !t.startsWith('Ref: '));
        get().updateContact(contactId, {
          referred_by_name: trimmed,
          can_start_team: canStart,
          team_request_status: canStart ? 'approved' : contact.team_request_status || 'none',
          tags: Array.from(new Set([...filteredTags, `Ref: ${trimmed}`])),
        });
      },

      startTeamForContact: (contactId, teamName, status = 'active') => {
        const state = get();
        const contact = state.contacts.find((c) => c.id === contactId);
        if (!contact) {
          return { success: false, reason: 'Contact niet gevonden' };
        }

        const allowed = isReferredByJamal(contact.referred_by_name, contact);
        if (!allowed) {
          return {
            success: false,
            reason:
              'Alleen personen die rechtstreeks door Jamal Drenthe zijn aangeleverd (of een goedgekeurde aanvraag hebben) kunnen direct een eigen team starten. Dien eerst een Team Aanvraag in.',
          };
        }

        const cleanName = teamName.trim() || `Team ${contact.first_name}`;
        const teamId = `team_${contact.first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36).slice(-4)}`;
        const newTeam: CRMTeam = {
          id: teamId,
          name: cleanName,
          leader_id: contact.id,
          leader_name: `${contact.first_name} ${contact.last_name}`.trim(),
          referred_by_name: contact.referred_by_name || 'Jamal Drenthe',
          status,
          member_ids: [contact.id],
          company_name: contact.company || 'VVC (Verdienende Vrienden Club)',
          description: `Team gestart door ${contact.first_name} ${contact.last_name} (aangeleverd door ${contact.referred_by_name || 'Jamal Drenthe'}).`,
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          teams: [newTeam, ...s.teams],
        }));

        const statusTag = status === 'active' ? 'Actief Team' : 'Passief Team';
        const filteredTags = (contact.tags || []).filter((t) => t !== 'Actief Team' && t !== 'Passief Team');

        get().updateContact(contactId, {
          team_id: newTeam.id,
          team_name: newTeam.name,
          team_status: status,
          team_role: 'leader',
          own_team_id: newTeam.id,
          own_team_name: newTeam.name,
          can_start_team: true,
          team_request_status: 'approved',
          tags: Array.from(new Set([...filteredTags, statusTag, 'Teamleider', cleanName])),
        });

        return { success: true, team: newTeam };
      },

      requestTeamForContact: (contactId, desiredTeamName, status = 'active') => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return;
        const cleanName = desiredTeamName.trim() || `Team ${contact.first_name}`;
        get().updateContact(contactId, {
          team_request_status: 'pending',
          team_request_name: cleanName,
          team_status: status,
          tags: Array.from(new Set([...(contact.tags || []), 'Team Aanvraag Ingediend'])),
        });
      },

      approveTeamRequest: (contactId) => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return null;
        const desiredName = contact.team_request_name || `Team ${contact.first_name}`;
        // Mark approved first so startTeamForContact succeeds
        get().updateContact(contactId, {
          can_start_team: true,
          team_request_status: 'approved',
          tags: (contact.tags || []).filter((t) => t !== 'Team Aanvraag Ingediend'),
        });
        const res = get().startTeamForContact(contactId, desiredName, contact.team_status || 'active');
        return res.team || null;
      },

      rejectTeamRequest: (contactId) => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return;
        get().updateContact(contactId, {
          team_request_status: 'rejected',
          tags: (contact.tags || []).filter((t) => t !== 'Team Aanvraag Ingediend'),
        });
      },

      addCompanyTagToContact: (contactId, rawCompanyTag) => {
        const formattedTag = formatCompanyTag(rawCompanyTag);
        if (!formattedTag) return;

        set((state) => {
          const updatedContacts = state.contacts.map((c) => {
            if (c.id !== contactId) return c;
            const nextCompanyTags = Array.from(new Set([...(c.company_tags || []), formattedTag]));
            const nextTags = Array.from(new Set([...(c.tags || []), formattedTag]));
            return {
              ...c,
              company_tags: nextCompanyTags,
              tags: nextTags,
              updated_at: new Date().toISOString(),
            };
          });
          const updated = updatedContacts.find((c) => c.id === contactId);
          if (updated) {
            const orgId = updated.org_id || useAuthStore.getState().organization?.id || 'default_org';
            saveContactToFirestore(updated, orgId);
          }
          return { contacts: updatedContacts };
        });
      },

      removeCompanyTagFromContact: (contactId, rawCompanyTag) => {
        const formattedTag = formatCompanyTag(rawCompanyTag);
        set((state) => {
          const updatedContacts = state.contacts.map((c) => {
            if (c.id !== contactId) return c;
            return {
              ...c,
              company_tags: (c.company_tags || []).filter((t) => t.toLowerCase() !== formattedTag.toLowerCase()),
              tags: (c.tags || []).filter((t) => t.toLowerCase() !== formattedTag.toLowerCase()),
              updated_at: new Date().toISOString(),
            };
          });
          const updated = updatedContacts.find((c) => c.id === contactId);
          if (updated) {
            const orgId = updated.org_id || useAuthStore.getState().organization?.id || 'default_org';
            saveContactToFirestore(updated, orgId);
          }
          return { contacts: updatedContacts };
        });
      },

      inviteContactToCompany: (companyId, contactId, role = 'Medewerker') => {
        const state = get();
        const company = state.companies.find((c) => c.id === companyId);
        const contact = state.contacts.find((c) => c.id === contactId);
        if (!company || !contact) return null;

        const authUser = useAuthStore.getState().user;
        const companyTag = company.company_tag || formatCompanyTag(company.name);

        const invitation: CompanyInvitation = {
          id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          company_id: company.id,
          company_name: company.name,
          company_tag: companyTag,
          contact_id: contact.id,
          contact_name: `${contact.first_name} ${contact.last_name}`.trim(),
          contact_email: contact.email,
          vvc_tag: getVvcTag(contact),
          role,
          invited_by_name: authUser?.name || 'Bedrijfsbeheerder',
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        // Werk Contact bij met de bedrijfstag, uitnodiging en bedrijfskoppeling
        const nextCompanyTags = Array.from(new Set([...(contact.company_tags || []), companyTag]));
        const nextTags = Array.from(new Set([...(contact.tags || []), companyTag, `Uitgenodigd: ${company.name}`]));
        const nextInvitedCompanies = Array.from(new Set([...(contact.invited_companies || []), company.name]));
        const nextMemberCompanies = Array.from(new Set([...(contact.member_companies || []), company.name]));
        const existingInvs = (contact.company_invitations || []).filter((i) => i.company_id !== company.id);
        const nextInvitations = [invitation, ...existingInvs];
        const nextAllowed = Array.from(new Set([...(contact.allowed_companies || []), company.name]));

        get().updateContact(contact.id, {
          company: contact.company || company.name,
          company_id: contact.company_id || company.id,
          company_tags: nextCompanyTags,
          tags: nextTags,
          invited_companies: nextInvitedCompanies,
          member_companies: nextMemberCompanies,
          company_invitations: nextInvitations,
          allowed_companies: nextAllowed,
        });

        // Werk Company bij met gekoppelde medewerker en verhoogde teller
        const nextInvitedMemberIds = Array.from(new Set([...(company.invited_member_ids || []), contact.id]));
        const nextMemberIds = Array.from(new Set([...(company.member_ids || []), contact.id]));
        get().updateCompany(company.id, {
          invited_member_ids: nextInvitedMemberIds,
          member_ids: nextMemberIds,
          contacts_count: Math.max((company.contacts_count || 0) + 1, nextMemberIds.length),
        });

        // Als de uitgenodigde persoon de momenteel ingelogde gebruiker is, voeg de uitnodiging en tag ook direct aan zijn profiel toe
        if (authUser && authUser.email.toLowerCase() === contact.email.toLowerCase()) {
          useAuthStore.getState().updateUser({
            company_tags: Array.from(new Set([...(authUser.company_tags || []), companyTag])),
            company_invitations: [
              invitation,
              ...(authUser.company_invitations || []).filter((i) => i.company_id !== company.id),
            ],
            allowed_companies: Array.from(new Set([...(authUser.allowed_companies || []), company.name])),
          });
        }

        // Log activiteit op de tijdlijn van het contact
        get().addActivity({
          type: 'note',
          title: `Uitgenodigd om bij ${company.name} (${companyTag}) te komen`,
          description: `${invitation.contact_name} is via bedrijfstag ${companyTag} gevonden en uitgenodigd als ${role} bij ${company.name} door ${invitation.invited_by_name}.`,
          status: 'completed',
          completed_at: new Date().toISOString(),
          assigned_to: authUser?.id || 'user1',
          related_to: { type: 'contact', id: contact.id },
          org_id: authUser?.org_id || 'default_org',
        });

        return invitation;
      },

      acceptCompanyInvitation: (contactId, invitationId) => {
        const contact = get().contacts.find((c) => c.id === contactId);
        if (!contact) return;

        const targetInv = (contact.company_invitations || []).find((i) => i.id === invitationId);
        const updatedInvs = (contact.company_invitations || []).map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'accepted' as const } : inv
        );

        get().updateContact(contactId, {
          company: targetInv?.company_name || contact.company,
          company_id: targetInv?.company_id || contact.company_id,
          status: 'internal',
          company_invitations: updatedInvs,
          member_companies: targetInv
            ? Array.from(new Set([...(contact.member_companies || []), targetInv.company_name]))
            : contact.member_companies,
        });

        const authUser = useAuthStore.getState().user;
        if (authUser && targetInv && authUser.email.toLowerCase() === contact.email.toLowerCase()) {
          useAuthStore.getState().updateUser({
            company_name: targetInv.company_name,
            company_invitations: (authUser.company_invitations || []).map((inv) =>
              inv.id === invitationId ? { ...inv, status: 'accepted' as const } : inv
            ),
          });
        }
      },

      searchAccountsByCompanyTag: (tagOrQuery) => {
        return smartSearchContacts(get().contacts, tagOrQuery);
      },

      searchContacts: (query) => {
        return smartSearchContacts(get().contacts, query);
      },

      searchCompanies: (query) => {
        return smartSearchCompanies(get().companies, query);
      },

      searchDeals: (query) => {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return get().deals;
        return get().deals.filter(
          (d) =>
            d.name.toLowerCase().includes(lowerQuery) ||
            d.company_name?.toLowerCase().includes(lowerQuery) ||
            d.contact_name?.toLowerCase().includes(lowerQuery) ||
            d.stage?.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'crmos-crm-live-v3',
      partialize: (state) => ({
        contacts: state.contacts,
        teams: state.teams,
        companies: state.companies,
        deals: state.deals,
        pipelines: state.pipelines,
        activities: state.activities,
      }),
    }
  )
);
