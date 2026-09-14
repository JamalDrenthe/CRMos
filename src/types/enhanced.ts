// Enhanced Types for JamCRM v2.0
import type { Contact, GeoJSONPolygon } from './index';

// Organization & Multi-tenant
export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  org_type: 'supplier' | 'partner' | 'agent';
  parent_org_id?: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  primary_color: string;
  timezone: string;
  currency: string;
  language: string;
  features: string[];
}

// Enhanced Contact with 360° view
export interface Contact360 extends Contact {
  timeline: TimelineEvent[];
  score: number;
  last_activity_at?: string;
  next_action?: Action;
  custom_fields: Record<string, unknown>;
  territory_id?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'whatsapp' | 'task' | 'note' | 'status_change' | 'deal_created' | 'quote_sent';
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by: string;
  related_to?: {
    type: string;
    id: string;
    name: string;
  };
}

export interface Action {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  title: string;
  due_at: string;
  completed: boolean;
}

// Gamification
export interface GamificationProfile {
  user_id: string;
  points: number;
  level: number;
  badges: Badge[];
  daily_target: number;
  weekly_target: number;
  monthly_target: number;
  current_streak: number;
  best_streak: number;
  commission_rate: number;
  total_commission_earned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  points: number;
  deals_closed: number;
  revenue: number;
  rank: number;
}

// Territory Management
export interface Territory {
  id: string;
  name: string;
  organization_id: string;
  agent_ids: string[];
  geometry: GeoJSONPolygon;
  color: string;
  created_at: string;
  updated_at: string;
}

// Workflow Builder (No-Code)
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: 'status_change' | 'field_update' | 'new_contact' | 'new_deal' | 'time_based' | 'manual';
  config: Record<string, unknown>;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'create_task' | 'add_note' | 'update_field' | 'webhook' | 'notification' | 'delay';
  config: Record<string, unknown>;
  order: number;
}

// Pitch Flows
export interface PitchFlow {
  id: string;
  name: string;
  campaign_id: string;
  nodes: PitchNode[];
  edges: PitchEdge[];
  created_at: string;
  updated_at: string;
}

export interface PitchNode {
  id: string;
  type: 'start' | 'question' | 'info' | 'calculator' | 'offer' | 'end';
  data: {
    title: string;
    content?: string;
    options?: PitchOption[];
    calculator_type?: 'roi' | 'savings' | 'monthly_cost';
  };
  position: { x: number; y: number };
}

export interface PitchEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface PitchOption {
  id: string;
  label: string;
  value: string;
  next_node_id?: string;
}

// Audit Logs
export interface AuditLog {
  id: string;
  user_id: string;
  organization_id: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'view';
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// QA Module
export interface QAReview {
  id: string;
  call_id?: string;
  contract_id?: string;
  reviewer_id: string;
  agent_id: string;
  status: 'pending' | 'approved' | 'rejected';
  score?: number;
  notes?: string;
  criteria: QACriteria[];
  created_at: string;
  updated_at: string;
}

export interface QACriteria {
  name: string;
  weight: number;
  score: number;
  notes?: string;
}

// Offline Sync
export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  data: unknown;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  retry_count: number;
  created_at: string;
  synced_at?: string;
  error_message?: string;
}

// Location Tracking
export interface LocationUpdate {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  timestamp: string;
  is_suspicious?: boolean;
}

// Commission
export interface Commission {
  id: string;
  user_id: string;
  deal_id: string;
  amount: number;
  rate: number;
  status: 'pending' | 'approved' | 'paid';
  period: string;
  created_at: string;
  paid_at?: string;
}

// Custom Fields
export interface CustomField {
  id: string;
  organization_id: string;
  entity_type: 'contact' | 'deal' | 'company' | 'job';
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url';
  options?: string[];
  required: boolean;
  order: number;
  is_active: boolean;
}

// Dashboard Widgets
export interface DashboardWidget {
  id: string;
  user_id: string;
  type: 'stats' | 'chart' | 'list' | 'pipeline' | 'calendar' | 'leaderboard';
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

// Re-export all types from index
export * from './index';
