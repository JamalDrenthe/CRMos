import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Call, Campaign } from '@/types';
import {
  saveCallToFirestore,
  subscribeToCalls,
  saveCampaignToFirestore,
  subscribeToCampaigns,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/authStore';
import { isFirebaseConfigured } from '@/lib/firebase';

if (typeof window !== 'undefined') {
  window.localStorage.removeItem('crmos-contactcenter-storage');
  window.localStorage.removeItem('crmos-contact-center-storage');
}

const generateId = () => Math.random().toString(36).substring(2, 15);

interface ContactCenterState {
  calls: Call[];
  campaigns: Campaign[];
  activeCall: Call | null;
  selectedCampaign: Campaign | null;
  isMuted: boolean;
  isPaused: boolean;

  // Stats
  todayStats: {
    callsMade: number;
    callsCompleted: number;
    avgDuration: number;
    conversionRate: number;
  };

  // Actions
  setCalls: (calls: Call[]) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  clearLocalStore: () => void;
  syncWithFirestore: (orgId: string) => () => void;

  addCall: (call: Omit<Call, 'id'>) => Call;
  updateCall: (id: string, updates: Partial<Call>) => void;
  endCall: (id: string, notes?: string, disposition?: string, rating?: number) => void;

  addCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  startCampaign: (id: string) => void;
  pauseCampaign: (id: string) => void;
  completeCampaign: (id: string) => void;
  selectCampaign: (campaign: Campaign | null) => void;

  setActiveCall: (call: Call | null) => void;
  toggleMute: () => void;
  togglePause: () => void;

  getCallsByAgent: (agentId: string) => Call[];
  getCallsByCampaign: (campaignId: string) => Call[];
  getCallsByContact: (contactId: string) => Call[];
  getTodayCalls: (agentId: string) => Call[];

  updateTodayStats: (agentId: string) => void;
}

export const useContactCenterStore = create<ContactCenterState>()(
  persist(
    (set, get) => ({
      calls: [],
      campaigns: [],
      activeCall: null,
      selectedCampaign: null,
      isMuted: false,
      isPaused: false,
      todayStats: {
        callsMade: 0,
        callsCompleted: 0,
        avgDuration: 0,
        conversionRate: 0,
      },

      setCalls: (calls) => set({ calls }),
      setCampaigns: (campaigns) => set({ campaigns }),
      clearLocalStore: () =>
        set({
          calls: [],
          campaigns: [],
          activeCall: null,
          selectedCampaign: null,
          todayStats: { callsMade: 0, callsCompleted: 0, avgDuration: 0, conversionRate: 0 },
        }),

      syncWithFirestore: (orgId: string) => {
        if (!isFirebaseConfigured()) return () => {};
        const unsubs: (() => void)[] = [];

        const unsubCalls = subscribeToCalls(orgId, (firestoreCalls) => {
          set({ calls: firestoreCalls || [] });
        });
        unsubs.push(unsubCalls);

        const unsubCampaigns = subscribeToCampaigns(orgId, (firestoreCampaigns) => {
          set({ campaigns: firestoreCampaigns || [] });
        });
        unsubs.push(unsubCampaigns);

        return () => {
          unsubs.forEach((u) => u());
        };
      },

      addCall: (callData) => {
        const newCall: Call = {
          ...callData,
          id: generateId(),
        };
        set((state) => ({ calls: [newCall, ...state.calls] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
        saveCallToFirestore(newCall, orgId);
        return newCall;
      },

      updateCall: (id, updates) => {
        set((state) => {
          const updatedCalls = state.calls.map((c) => (c.id === id ? { ...c, ...updates } : c));
          const updated = updatedCalls.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCallToFirestore(updated, orgId);
          }
          return { calls: updatedCalls };
        });
      },

      endCall: (id, notes, disposition, rating) => {
        const now = new Date().toISOString();
        set((state) => {
          const updatedCalls = state.calls.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'completed' as const,
                  ended_at: now,
                  notes: notes || c.notes,
                  disposition: disposition || c.disposition,
                  rating: rating || c.rating,
                }
              : c
          );
          const updated = updatedCalls.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCallToFirestore(updated, orgId);
          }
          return { calls: updatedCalls, activeCall: null };
        });
      },

      addCampaign: (campaignData) => {
        const newCampaign: Campaign = {
          ...campaignData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ campaigns: [...state.campaigns, newCampaign] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
        saveCampaignToFirestore(newCampaign, orgId);
        return newCampaign;
      },

      updateCampaign: (id, updates) => {
        set((state) => {
          const updatedCampaigns = state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCampaigns.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCampaignToFirestore(updated, orgId);
          }
          return { campaigns: updatedCampaigns };
        });
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },

      startCampaign: (id) => {
        set((state) => {
          const updatedCampaigns = state.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'active' as const, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCampaigns.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCampaignToFirestore(updated, orgId);
          }
          return { campaigns: updatedCampaigns };
        });
      },

      pauseCampaign: (id) => {
        set((state) => {
          const updatedCampaigns = state.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'paused' as const, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCampaigns.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCampaignToFirestore(updated, orgId);
          }
          return { campaigns: updatedCampaigns };
        });
      },

      completeCampaign: (id) => {
        set((state) => {
          const updatedCampaigns = state.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'completed' as const, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCampaigns.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCampaignToFirestore(updated, orgId);
          }
          return { campaigns: updatedCampaigns };
        });
      },

      selectCampaign: (campaign) => set({ selectedCampaign: campaign }),

      setActiveCall: (call) => set({ activeCall: call }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

      getCallsByAgent: (agentId) => {
        return get().calls.filter((c) => c.agent_id === agentId);
      },

      getCallsByCampaign: (campaignId) => {
        return get().calls.filter((c) => c.campaign_id === campaignId);
      },

      getCallsByContact: (contactId) => {
        return get().calls.filter((c) => c.contact_id === contactId);
      },

      getTodayCalls: (agentId) => {
        const today = new Date().toISOString().split('T')[0];
        return get().calls.filter(
          (c) => c.agent_id === agentId && c.started_at.startsWith(today)
        );
      },

      updateTodayStats: (agentId) => {
        const todayCalls = get().getTodayCalls(agentId);
        const completedCalls = todayCalls.filter((c) => c.status === 'completed');
        const avgDuration =
          completedCalls.length > 0
            ? completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length
            : 0;
        const conversionRate =
          completedCalls.length > 0
            ? (completedCalls.filter((c) => c.disposition === 'Interested').length /
                completedCalls.length) *
              100
            : 0;

        set({
          todayStats: {
            callsMade: todayCalls.length,
            callsCompleted: completedCalls.length,
            avgDuration: Math.round(avgDuration),
            conversionRate: Math.round(conversionRate),
          },
        });
      },
    }),
    {
      name: 'crmos-contactcenter-live-v3',
    }
  )
);
