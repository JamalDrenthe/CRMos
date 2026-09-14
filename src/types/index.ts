// ============================================
// JAMCRM v2.0 - Complete Type Definitions
// ============================================

// ===== User & Organization =====
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'agent' | 'recruiter';
  org_id: string;
  phone?: string;
  timezone: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  org_type: 'supplier' | 'partner' | 'agent';
  parent_org_id?: string;
  settings: OrganizationSettings;
  created_at: string;
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  date_format: string;
  branding: {
    primary_color: string;
    logo_url?: string;
  };
  features: {
    recruitment: boolean;
    crm: boolean;
    sales: boolean;
    contact_center: boolean;
    gamification: boolean;
    workflows: boolean;
  };
}

// ===== Recruitment (ATS) =====
export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  source: string;
  resume_url?: string;
  skills: string[];
  experience_years: number;
  current_salary?: number;
  expected_salary?: number;
  location: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'published' | 'closed' | 'on-hold';
  description: string;
  requirements: string[];
  salary_min?: number;
  salary_max?: number;
  currency: string;
  hiring_manager: string;
  assigned_recruiters: string[];
  candidates_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  stage: 'applied' | 'screening' | 'phone' | 'interview' | 'offer' | 'hired' | 'rejected';
  applied_at: string;
  notes?: string;
}

// ===== CRM =====
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
  company?: string;
  title?: string;
  industry?: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  source: string;
  assigned_to?: string;
  tags: string[];
  address?: Address;
  social_profiles?: SocialProfiles;
  custom_fields: Record<string, unknown>;
  last_contact_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact360 extends Contact {
  timeline: TimelineEvent[];
  score: number;
  lifetime_value: number;
  last_activity_at?: string;
  interactions_count: number;
  emails_sent: number;
  emails_opened: number;
  calls_made: number;
  meetings_held: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string;
  address?: Address;
  phone?: string;
  website?: string;
  linkedin?: string;
  assigned_to?: string;
  contacts_count: number;
  deals_count: number;
  created_at: string;
  updated_at: string;
}

// ===== Deals & Pipeline =====
export interface Deal {
  id: string;
  name: string;
  company_id: string;
  company_name?: string;
  contact_id?: string;
  contact_name?: string;
  value: number;
  currency: string;
  stage: string;
  pipeline_id: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  source: string;
  assigned_to: string;
  assigned_name?: string;
  tags: string[];
  notes?: string;
  activities: Activity[];
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
  is_default: boolean;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
}

// ===== Activities =====
export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'whatsapp' | 'sms';
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  assigned_to: string;
  related_to: {
    type: 'contact' | 'deal' | 'company';
    id: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'whatsapp' | 'sms' | 'deal_created' | 'deal_won' | 'deal_lost' | 'status_change';
  title: string;
  description?: string;
  timestamp: string;
  user_id: string;
  user_name?: string;
  metadata?: Record<string, unknown>;
}

// ===== Sales =====
export interface Quote {
  id: string;
  deal_id: string;
  quote_number: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  notes?: string;
  terms?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  currency: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

// ===== Contact Center =====
export interface Call {
  id: string;
  call_sid?: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  contact_id?: string;
  contact_name?: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'missed' | 'voicemail';
  duration?: number;
  recording_url?: string;
  notes?: string;
  disposition?: string;
  rating?: number;
  agent_id: string;
  agent_name?: string;
  campaign_id?: string;
  started_at: string;
  ended_at?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'outbound' | 'inbound';
  status: 'draft' | 'active' | 'paused' | 'completed';
  description?: string;
  script?: string;
  pitch_flow_id?: string;
  target_contacts: number;
  completed_contacts: number;
  conversion_rate: number;
  start_date?: string;
  end_date?: string;
  assigned_agents: string[];
  created_at: string;
  updated_at: string;
}

export interface PitchFlow {
  id: string;
  name: string;
  description?: string;
  steps: PitchStep[];
  is_active: boolean;
  created_at: string;
}

export interface PitchStep {
  id: string;
  order: number;
  type: 'intro' | 'question' | 'value_prop' | 'objection_handler' | 'close' | 'custom';
  title: string;
  content: string;
  branching?: PitchBranch[];
}

export interface PitchBranch {
  condition: string;
  next_step_id: string;
  label: string;
}

// ===== Gamification =====
export interface GamificationProfile {
  user_id: string;
  points: number;
  level: number;
  title: string;
  badges: Badge[];
  commission_rate: number;
  total_commission_earned: number;
  monthly_points: number;
  weekly_points: number;
  streak_days: number;
  rank?: number;
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
  avatar?: string;
  points: number;
  deals_closed: number;
  revenue: number;
  calls_made: number;
  rank: number;
}

// ===== Territory Management =====
export interface Territory {
  id: string;
  name: string;
  description?: string;
  geometry: GeoJSONPolygon;
  agent_ids: string[];
  color: string;
  postcode_prefixes?: string[];
  metrics?: TerritoryMetrics;
  created_at: string;
  updated_at: string;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface TerritoryMetrics {
  contacts_count: number;
  deals_count: number;
  revenue: number;
  last_updated: string;
}

// ===== Workflows & Automation =====
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  is_active: boolean;
  run_count: number;
  last_run_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: 'deal_created' | 'deal_stage_changed' | 'deal_won' | 'deal_lost' | 'contact_created' | 'contact_updated' | 'activity_completed' | 'email_opened' | 'call_completed' | 'scheduled' | 'webhook';
  config: Record<string, unknown>;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_sms' | 'create_task' | 'create_activity' | 'update_field' | 'webhook' | 'delay' | 'condition' | 'add_tag' | 'remove_tag' | 'assign_user';
  config: Record<string, unknown>;
  order: number;
}

// ===== Dashboard =====
export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'list' | 'activity' | 'pipeline' | 'leaderboard' | 'tasks' | 'calls' | 'performance';
  title: string;
  config: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  is_default: boolean;
  widgets: DashboardWidget[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ===== Audit & Compliance =====
export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ===== Notifications =====
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}

// ===== UI Types =====
export type ViewMode = 'list' | 'grid' | 'kanban' | 'calendar';

// ===== Search =====
export interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'deal' | 'candidate' | 'job' | 'activity';
  title: string;
  subtitle?: string;
  url: string;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
