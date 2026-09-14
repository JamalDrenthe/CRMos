import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Call, Campaign } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 15);

const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q4 Enterprise Outreach',
    type: 'outbound',
    status: 'active',
    description: 'Target enterprise accounts for Q4 closing',
    script: 'Hi [Name], this is [Agent] from JamCRM. I noticed your company is growing rapidly...',
    pitch_flow_id: '1',
    target_contacts: 500,
    completed_contacts: 320,
    conversion_rate: 12.5,
    start_date: new Date(Date.now() - 2592000000).toISOString(),
    end_date: new Date(Date.now() + 5184000000).toISOString(),
    assigned_agents: ['user1', 'user2', 'user3'],
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Product Launch Campaign',
    type: 'outbound',
    status: 'active',
    description: 'Announce new features to existing prospects',
    script: 'Hi [Name], exciting news! We just launched...',
    target_contacts: 1000,
    completed_contacts: 580,
    conversion_rate: 8.2,
    start_date: new Date(Date.now() - 5184000000).toISOString(),
    end_date: new Date(Date.now() + 2592000000).toISOString(),
    assigned_agents: ['user1', 'user2'],
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    name: 'Customer Satisfaction Survey',
    type: 'inbound',
    status: 'paused',
    description: 'Gather feedback from recent customers',
    target_contacts: 200,
    completed_contacts: 150,
    conversion_rate: 75,
    start_date: new Date(Date.now() - 7776000000).toISOString(),
    end_date: new Date(Date.now() - 2592000000).toISOString(),
    assigned_agents: ['user3', 'user4'],
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    updated_at: new Date(Date.now() - 2592000000).toISOString(),
  },
];

const sampleCalls: Call[] = [
  {
    id: '1',
    call_sid: 'CA123456',
    direction: 'outbound',
    from_number: '+15550001111',
    to_number: '+15551234567',
    contact_id: '1',
    contact_name: 'John Smith',
    status: 'completed',
    duration: 245,
    notes: 'Great conversation. Interested in enterprise plan.',
    disposition: 'Interested',
    rating: 5,
    agent_id: 'user1',
    agent_name: 'Alex Johnson',
    campaign_id: '1',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    ended_at: new Date(Date.now() - 3355000).toISOString(),
  },
  {
    id: '2',
    call_sid: 'CA123457',
    direction: 'outbound',
    from_number: '+15550001111',
    to_number: '+15552345678',
    contact_id: '2',
    contact_name: 'Sarah Johnson',
    status: 'completed',
    duration: 180,
    notes: 'Requested demo next week.',
    disposition: 'Callback Scheduled',
    rating: 4,
    agent_id: 'user1',
    agent_name: 'Alex Johnson',
    campaign_id: '1',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    ended_at: new Date(Date.now() - 7020000).toISOString(),
  },
  {
    id: '3',
    call_sid: 'CA123458',
    direction: 'inbound',
    from_number: '+15553456789',
    to_number: '+15550001111',
    contact_id: '3',
    contact_name: 'Michael Chen',
    status: 'completed',
    duration: 320,
    notes: 'Support question about integration.',
    disposition: 'Support Required',
    rating: 4,
    agent_id: 'user2',
    agent_name: 'Maria Garcia',
    started_at: new Date(Date.now() - 10800000).toISOString(),
    ended_at: new Date(Date.now() - 10480000).toISOString(),
  },
  {
    id: '4',
    call_sid: 'CA123459',
    direction: 'outbound',
    from_number: '+15550001111',
    to_number: '+15554567890',
    status: 'missed',
    agent_id: 'user1',
    agent_name: 'Alex Johnson',
    campaign_id: '2',
    started_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    call_sid: 'CA123460',
    direction: 'outbound',
    from_number: '+15550001111',
    to_number: '+15555678901',
    contact_id: '5',
    contact_name: 'Robert Wilson',
    status: 'completed',
    duration: 150,
    notes: 'Not interested at this time.',
    disposition: 'Not Interested',
    rating: 2,
    agent_id: 'user2',
    agent_name: 'Maria Garcia',
    campaign_id: '2',
    started_at: new Date(Date.now() - 18000000).toISOString(),
    ended_at: new Date(Date.now() - 17850000).toISOString(),
  },
];

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
      calls: sampleCalls,
      campaigns: sampleCampaigns,
      activeCall: null,
      selectedCampaign: null,
      isMuted: false,
      isPaused: false,
      todayStats: {
        callsMade: 12,
        callsCompleted: 10,
        avgDuration: 195,
        conversionRate: 25,
      },

      setCalls: (calls) => set({ calls }),
      setCampaigns: (campaigns) => set({ campaigns }),

      addCall: (callData) => {
        const newCall: Call = {
          ...callData,
          id: generateId(),
        };
        set((state) => ({ calls: [newCall, ...state.calls] }));
        return newCall;
      },

      updateCall: (id, updates) => {
        set((state) => ({
          calls: state.calls.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      endCall: (id, notes, disposition, rating) => {
        const now = new Date().toISOString();
        set((state) => ({
          calls: state.calls.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'completed',
                  ended_at: now,
                  notes: notes || c.notes,
                  disposition: disposition || c.disposition,
                  rating: rating || c.rating,
                }
              : c
          ),
          activeCall: null,
        }));
      },

      addCampaign: (campaignData) => {
        const newCampaign: Campaign = {
          ...campaignData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ campaigns: [...state.campaigns, newCampaign] }));
        return newCampaign;
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },

      startCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'active', updated_at: new Date().toISOString() } : c
          ),
        }));
      },

      pauseCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'paused', updated_at: new Date().toISOString() } : c
          ),
        }));
      },

      completeCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'completed', updated_at: new Date().toISOString() } : c
          ),
        }));
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
        const avgDuration = completedCalls.length > 0
          ? completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length
          : 0;
        const conversionRate = completedCalls.length > 0
          ? (completedCalls.filter((c) => c.disposition === 'Interested').length / completedCalls.length) * 100
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
      name: 'jamcrm-contactcenter-storage',
    }
  )
);
