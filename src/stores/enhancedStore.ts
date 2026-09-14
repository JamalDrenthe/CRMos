import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GamificationProfile, 
  LeaderboardEntry, 
  Badge, 
  Workflow, 
  Dashboard,
  DashboardWidget,
  AuditLog,
  PitchFlow,
  Territory
} from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample Gamification Data
const sampleBadges: Badge[] = [
  { id: '1', name: 'First Deal', description: 'Close your first deal', icon: 'Trophy', color: '#fbbf24', earned_at: new Date(Date.now() - 7776000000).toISOString() },
  { id: '2', name: 'Deal Closer', description: 'Close 10 deals', icon: 'Target', color: '#22c55e', earned_at: new Date(Date.now() - 5184000000).toISOString() },
  { id: '3', name: 'Speed Demon', description: 'Close a deal in under 7 days', icon: 'Zap', color: '#3b82f6', earned_at: new Date(Date.now() - 2592000000).toISOString() },
  { id: '4', name: 'Team Player', description: 'Help a colleague close a deal', icon: 'Users', color: '#a855f7', earned_at: new Date(Date.now() - 864000000).toISOString() },
];

const sampleGamificationProfiles: Record<string, GamificationProfile> = {
  user1: {
    user_id: 'user1',
    points: 12500,
    level: 12,
    title: 'Sales Master',
    badges: sampleBadges,
    commission_rate: 0.08,
    total_commission_earned: 45000,
    monthly_points: 3200,
    weekly_points: 850,
    streak_days: 15,
    rank: 2,
  },
  user2: {
    user_id: 'user2',
    points: 15800,
    level: 15,
    title: 'Sales Legend',
    badges: [...sampleBadges, { id: '5', name: 'Top Performer', description: 'Rank #1 for a month', icon: 'Crown', color: '#f59e0b', earned_at: new Date(Date.now() - 432000000).toISOString() }],
    commission_rate: 0.10,
    total_commission_earned: 62000,
    monthly_points: 4100,
    weekly_points: 1200,
    streak_days: 23,
    rank: 1,
  },
};

const sampleLeaderboard: LeaderboardEntry[] = [
  { user_id: 'user2', user_name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?u=user2', points: 15800, deals_closed: 24, revenue: 850000, calls_made: 340, rank: 1 },
  { user_id: 'user1', user_name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=user1', points: 12500, deals_closed: 18, revenue: 620000, calls_made: 280, rank: 2 },
  { user_id: 'user3', user_name: 'James Wilson', avatar: 'https://i.pravatar.cc/150?u=user3', points: 9800, deals_closed: 14, revenue: 480000, calls_made: 220, rank: 3 },
  { user_id: 'user4', user_name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=user4', points: 8200, deals_closed: 11, revenue: 390000, calls_made: 195, rank: 4 },
  { user_id: 'user5', user_name: 'Mike Brown', avatar: 'https://i.pravatar.cc/150?u=user5', points: 6500, deals_closed: 9, revenue: 310000, calls_made: 160, rank: 5 },
];

// Sample Workflows
const sampleWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'New Lead Follow-up',
    description: 'Automatically follow up with new leads',
    trigger: { type: 'contact_created', config: { status: 'lead' } },
    actions: [
      { id: '1', type: 'delay', config: { duration: 3600 }, order: 0 },
      { id: '2', type: 'send_email', config: { template: 'welcome_email' }, order: 1 },
      { id: '3', type: 'create_task', config: { title: 'Follow up with new lead', due_in_days: 1 }, order: 2 },
    ],
    is_active: true,
    run_count: 156,
    last_run_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: 'user1',
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Deal Won Celebration',
    description: 'Send celebration email and create onboarding task when deal is won',
    trigger: { type: 'deal_won', config: {} },
    actions: [
      { id: '1', type: 'send_email', config: { template: 'deal_won_celebration' }, order: 0 },
      { id: '2', type: 'create_task', config: { title: 'Start customer onboarding', due_in_days: 1 }, order: 1 },
      { id: '3', type: 'webhook', config: { url: 'https://api.example.com/webhooks/deal-won' }, order: 2 },
    ],
    is_active: true,
    run_count: 89,
    last_run_at: new Date(Date.now() - 172800000).toISOString(),
    created_by: 'user1',
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    name: 'Stage Change Notification',
    description: 'Notify team when deal moves to negotiation',
    trigger: { type: 'deal_stage_changed', config: { stage: 'negotiation' } },
    actions: [
      { id: '1', type: 'send_email', config: { template: 'stage_change_notification', to: 'manager' }, order: 0 },
      { id: '2', type: 'create_activity', config: { type: 'task', title: 'Review negotiation strategy' }, order: 1 },
    ],
    is_active: false,
    run_count: 45,
    last_run_at: new Date(Date.now() - 604800000).toISOString(),
    created_by: 'user2',
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
];

// Sample Dashboards
const sampleDashboards: Dashboard[] = [
  {
    id: '1',
    name: 'Sales Dashboard',
    is_default: true,
    widgets: [
      { id: '1', type: 'stats', title: 'Key Metrics', config: {}, position: { x: 0, y: 0, w: 4, h: 2 } },
      { id: '2', type: 'pipeline', title: 'Pipeline Overview', config: {}, position: { x: 4, y: 0, w: 4, h: 4 } },
      { id: '3', type: 'chart', title: 'Revenue Trend', config: { chart_type: 'line' }, position: { x: 0, y: 2, w: 4, h: 3 } },
      { id: '4', type: 'list', title: 'Top Deals', config: { limit: 5 }, position: { x: 8, y: 0, w: 4, h: 4 } },
      { id: '5', type: 'activity', title: 'Recent Activity', config: { limit: 10 }, position: { x: 0, y: 5, w: 6, h: 3 } },
      { id: '6', type: 'tasks', title: 'My Tasks', config: {}, position: { x: 6, y: 4, w: 6, h: 4 } },
    ],
    created_by: 'user1',
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Sample Pitch Flows
const samplePitchFlows: PitchFlow[] = [
  {
    id: '1',
    name: 'Enterprise Software Pitch',
    description: 'Standard pitch for enterprise prospects',
    steps: [
      { id: '1', order: 0, type: 'intro', title: 'Introduction', content: 'Hi [Name], this is [Agent] from JamCRM. How are you today?' },
      { id: '2', order: 1, type: 'question', title: 'Discovery', content: 'Can you tell me about your current CRM challenges?', branching: [
        { condition: 'has_crm', next_step_id: '3', label: 'Has CRM' },
        { condition: 'no_crm', next_step_id: '4', label: 'No CRM' },
      ]},
      { id: '3', order: 2, type: 'value_prop', title: 'Migration Value', content: 'Our migration tool makes switching seamless. Most customers are up and running in 48 hours.' },
      { id: '4', order: 3, type: 'value_prop', title: 'First CRM Value', content: 'Starting with a CRM can transform your sales process. Our customers see 40% productivity gains on average.' },
      { id: '5', order: 4, type: 'close', title: 'Schedule Demo', content: 'I\'d love to show you how JamCRM can help. Are you available for a 15-minute demo this week?' },
    ],
    is_active: true,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
  },
];

// Sample Territories
const sampleTerritories: Territory[] = [
  {
    id: '1',
    name: 'West Coast',
    description: 'California, Oregon, Washington',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-125, 42], [-114, 42], [-114, 32], [-125, 32], [-125, 42]]],
    },
    agent_ids: ['user1', 'user2'],
    color: '#3b82f6',
    postcode_prefixes: ['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'],
    metrics: { contacts_count: 450, deals_count: 89, revenue: 2500000, last_updated: new Date().toISOString() },
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'East Coast',
    description: 'New York, New Jersey, Connecticut',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-80, 45], [-70, 45], [-70, 38], [-80, 38], [-80, 45]]],
    },
    agent_ids: ['user3', 'user4'],
    color: '#22c55e',
    postcode_prefixes: ['10', '11', '06', '07'],
    metrics: { contacts_count: 380, deals_count: 72, revenue: 2100000, last_updated: new Date().toISOString() },
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Sample Audit Logs
const sampleAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'deal_created',
    entity_type: 'deal',
    entity_id: '1',
    user_id: 'user1',
    user_name: 'Alex Johnson',
    new_values: { name: 'Acme Corp - Enterprise License', value: 150000 },
    ip_address: '192.168.1.1',
    created_at: new Date(Date.now() - 5184000000).toISOString(),
  },
  {
    id: '2',
    action: 'deal_updated',
    entity_type: 'deal',
    entity_id: '1',
    user_id: 'user1',
    user_name: 'Alex Johnson',
    old_values: { stage: 'proposal' },
    new_values: { stage: 'negotiation' },
    ip_address: '192.168.1.1',
    created_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: '3',
    action: 'contact_created',
    entity_type: 'contact',
    entity_id: '1',
    user_id: 'user2',
    user_name: 'Maria Garcia',
    new_values: { first_name: 'John', last_name: 'Smith', email: 'john.smith@acme.com' },
    ip_address: '192.168.1.2',
    created_at: new Date(Date.now() - 7776000000).toISOString(),
  },
];

interface EnhancedState {
  // Gamification
  gamificationProfiles: Record<string, GamificationProfile>;
  leaderboard: LeaderboardEntry[];
  
  // Workflows
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  
  // Dashboards
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  
  // Pitch Flows
  pitchFlows: PitchFlow[];
  selectedPitchFlow: PitchFlow | null;
  
  // Territories
  territories: Territory[];
  selectedTerritory: Territory | null;
  
  // Audit Logs
  auditLogs: AuditLog[];
  
  // Actions - Gamification
  addPoints: (userId: string, points: number) => void;
  awardBadge: (userId: string, badge: Badge) => void;
  getLeaderboard: (period: 'daily' | 'weekly' | 'monthly') => LeaderboardEntry[];
  getUserRank: (userId: string) => number;
  
  // Actions - Workflows
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'run_count'>) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflow: (id: string) => void;
  selectWorkflow: (workflow: Workflow | null) => void;
  
  // Actions - Dashboards
  addDashboard: (dashboard: Omit<Dashboard, 'id' | 'created_at' | 'updated_at'>) => Dashboard;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  addWidget: (dashboardId: string, widget: Omit<DashboardWidget, 'id'>) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  
  // Actions - Pitch Flows
  addPitchFlow: (pitchFlow: Omit<PitchFlow, 'id' | 'created_at'>) => PitchFlow;
  updatePitchFlow: (id: string, updates: Partial<PitchFlow>) => void;
  deletePitchFlow: (id: string) => void;
  selectPitchFlow: (pitchFlow: PitchFlow | null) => void;
  
  // Actions - Territories
  addTerritory: (territory: Omit<Territory, 'id' | 'created_at' | 'updated_at'>) => Territory;
  updateTerritory: (id: string, updates: Partial<Territory>) => void;
  deleteTerritory: (id: string) => void;
  assignAgentToTerritory: (territoryId: string, agentId: string) => void;
  removeAgentFromTerritory: (territoryId: string, agentId: string) => void;
  selectTerritory: (territory: Territory | null) => void;
  
  // Actions - Audit Logs
  addAuditLog: (log: Omit<AuditLog, 'id' | 'created_at'>) => void;
  getAuditLogsByEntity: (entityType: string, entityId: string) => AuditLog[];
  getAuditLogsByUser: (userId: string) => AuditLog[];
}

export const useEnhancedStore = create<EnhancedState>()(
  persist(
    (set, get) => ({
      // Initial state
      gamificationProfiles: sampleGamificationProfiles,
      leaderboard: sampleLeaderboard,
      workflows: sampleWorkflows,
      selectedWorkflow: null,
      dashboards: sampleDashboards,
      currentDashboard: sampleDashboards[0],
      pitchFlows: samplePitchFlows,
      selectedPitchFlow: null,
      territories: sampleTerritories,
      selectedTerritory: null,
      auditLogs: sampleAuditLogs,

      // Gamification Actions
      addPoints: (userId, points) => {
        set((state) => ({
          gamificationProfiles: {
            ...state.gamificationProfiles,
            [userId]: {
              ...state.gamificationProfiles[userId],
              points: (state.gamificationProfiles[userId]?.points || 0) + points,
              monthly_points: (state.gamificationProfiles[userId]?.monthly_points || 0) + points,
              weekly_points: (state.gamificationProfiles[userId]?.weekly_points || 0) + points,
            },
          },
        }));
      },

      awardBadge: (userId, badge) => {
        set((state) => ({
          gamificationProfiles: {
            ...state.gamificationProfiles,
            [userId]: {
              ...state.gamificationProfiles[userId],
              badges: [...(state.gamificationProfiles[userId]?.badges || []), badge],
            },
          },
        }));
      },

      getLeaderboard: (period) => {
        const entries = get().leaderboard;
        // Sort by appropriate metric based on period
        return [...entries].sort((a, b) => {
          if (period === 'daily') return b.calls_made - a.calls_made;
          if (period === 'weekly') return b.points - a.points;
          return b.revenue - a.revenue;
        });
      },

      getUserRank: (userId) => {
        const entry = get().leaderboard.find((e) => e.user_id === userId);
        return entry?.rank || 0;
      },

      // Workflow Actions
      addWorkflow: (workflowData) => {
        const newWorkflow: Workflow = {
          ...workflowData,
          id: generateId(),
          run_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ workflows: [...state.workflows, newWorkflow] }));
        return newWorkflow;
      },

      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        }));
      },

      toggleWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, is_active: !w.is_active, updated_at: new Date().toISOString() } : w
          ),
        }));
      },

      selectWorkflow: (workflow) => set({ selectedWorkflow: workflow }),

      // Dashboard Actions
      addDashboard: (dashboardData) => {
        const newDashboard: Dashboard = {
          ...dashboardData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ dashboards: [...state.dashboards, newDashboard] }));
        return newDashboard;
      },

      updateDashboard: (id, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter((d) => d.id !== id),
        }));
      },

      setCurrentDashboard: (dashboard) => set({ currentDashboard: dashboard }),

      addWidget: (dashboardId, widgetData) => {
        const newWidget = { ...widgetData, id: generateId() };
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, widgets: [...d.widgets, newWidget], updated_at: new Date().toISOString() }
              : d
          ),
        }));
      },

      updateWidget: (dashboardId, widgetId, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: d.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
                  updated_at: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      removeWidget: (dashboardId, widgetId) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId), updated_at: new Date().toISOString() }
              : d
          ),
        }));
      },

      // Pitch Flow Actions
      addPitchFlow: (pitchFlowData) => {
        const newPitchFlow: PitchFlow = {
          ...pitchFlowData,
          id: generateId(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({ pitchFlows: [...state.pitchFlows, newPitchFlow] }));
        return newPitchFlow;
      },

      updatePitchFlow: (id, updates) => {
        set((state) => ({
          pitchFlows: state.pitchFlows.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePitchFlow: (id) => {
        set((state) => ({
          pitchFlows: state.pitchFlows.filter((p) => p.id !== id),
        }));
      },

      selectPitchFlow: (pitchFlow) => set({ selectedPitchFlow: pitchFlow }),

      // Territory Actions
      addTerritory: (territoryData) => {
        const newTerritory: Territory = {
          ...territoryData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ territories: [...state.territories, newTerritory] }));
        return newTerritory;
      },

      updateTerritory: (id, updates) => {
        set((state) => ({
          territories: state.territories.map((t) =>
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTerritory: (id) => {
        set((state) => ({
          territories: state.territories.filter((t) => t.id !== id),
        }));
      },

      assignAgentToTerritory: (territoryId, agentId) => {
        set((state) => ({
          territories: state.territories.map((t) =>
            t.id === territoryId && !t.agent_ids.includes(agentId)
              ? { ...t, agent_ids: [...t.agent_ids, agentId], updated_at: new Date().toISOString() }
              : t
          ),
        }));
      },

      removeAgentFromTerritory: (territoryId, agentId) => {
        set((state) => ({
          territories: state.territories.map((t) =>
            t.id === territoryId
              ? { ...t, agent_ids: t.agent_ids.filter((id) => id !== agentId), updated_at: new Date().toISOString() }
              : t
          ),
        }));
      },

      selectTerritory: (territory) => set({ selectedTerritory: territory }),

      // Audit Log Actions
      addAuditLog: (logData) => {
        const newLog: AuditLog = {
          ...logData,
          id: generateId(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },

      getAuditLogsByEntity: (entityType, entityId) => {
        return get().auditLogs.filter(
          (log) => log.entity_type === entityType && log.entity_id === entityId
        );
      },

      getAuditLogsByUser: (userId) => {
        return get().auditLogs.filter((log) => log.user_id === userId);
      },
    }),
    {
      name: 'jamcrm-enhanced-storage',
    }
  )
);
