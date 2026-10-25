// ============================================
// CRMos - Complete Type Definitions
// ============================================

// ===== User & Organization =====
export const CRMOS_CORE_COMPANIES = [
  'crmos',
  'crmos.one',
  'vvc',
  'verdienende vrienden club',
  'quantum initium',
  'logs rent',
  'djobba',
  'trusting work',
] as const;

export type CoreEcosystemCompany = typeof CRMOS_CORE_COMPANIES[number];

export function isCoreEcosystemCompany(name?: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return CRMOS_CORE_COMPANIES.some(c => n === c || n.includes(c) || c.includes(n));
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'agent' | 'recruiter';
  org_id: string;
  company_name?: string;
  is_super_admin?: boolean;
  allowed_companies?: string[];
  phone?: string;
  vvc_tag?: string;
  timezone: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  org_type: 'supplier' | 'partner' | 'agent' | 'client';
  parent_org_id?: string;
  is_crmos_core?: boolean;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
  vvc_tag?: string;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  vvc_tag?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
  company?: string;
  company_id?: string;
  title?: string;
  industry?: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned' | 'partner' | 'internal';
  contact_type?: 'client' | 'partner' | 'internal' | 'vendor';
  score?: number;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string;
  kvk_number?: string;
  bag_id?: string;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
  vvc_tag?: string;
  name: string;
  company_id: string;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  deal_id?: string;
  company_id?: string;
  contact_id?: string;
  customer_name?: string;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
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
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
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

// ===== Territory Management & D2D =====
export interface Territory {
  id: string;
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
  name: string;
  description?: string;
  geometry: GeoJSONPolygon;
  agent_ids: string[];
  color: string;
  postcode_prefixes?: string[];
  status?: 'planned' | 'active' | 'completed' | 'on_hold';
  target_doors?: number;
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
  total_doors?: number;
  visited_doors?: number;
  last_updated: string;
}

// ===== Door-to-Door (D2D) & Field Sales =====
export type D2DPinStatus = 
  | 'unvisited'       // Nog niet bezocht (Grijs)
  | 'not_home'        // Niet thuis (Geel/Amber)
  | 'no_interest'     // Geen interesse (Rood)
  | 'appointment'     // Afspraak ingepland (Paars)
  | 'deal_closed'     // Deal gesloten / Contract getekend (Groen)
  | 'do_not_knock';   // Colportageverbod / Niet aanbellen (Zwart)

export interface D2DVisitLog {
  id: string;
  visited_at: string;
  agent_id: string;
  agent_name: string;
  status: D2DPinStatus;
  notes?: string;
  follow_up_date?: string;
}

export interface B2BMutationItem {
  id: string;
  title: string;
  type: 'vergunning' | 'faillissement' | 'bekendmaking';
  rubriek: string;
  date: string;
  url: string;
  abstract?: string;
}

export interface D2DAddressPin {
  id: string;
  org_id?: string;
  company_name?: string;
  allowed_companies?: string[];
  is_crmos_core?: boolean;
  territory_id?: string;
  street: string;
  house_number: string;
  house_number_addition?: string;
  postal_code: string;
  city: string;
  latitude: number;
  longitude: number;
  current_status: D2DPinStatus;
  last_visit_at?: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  deal_id?: string;
  contact_id?: string;
  // B2B Enrichment Fields (PDOK BAG + OSM Overpass + Overheid.nl Bekendmakingen)
  is_commercial?: boolean;
  business_name?: string;
  branch?: string;
  bag_gebruiksdoel?: string;
  surface_area_m2?: number;
  build_year?: number;
  pand_identificatie?: string;
  nummeraanduiding_id?: string;
  opening_hours?: string;
  business_phone?: string;
  business_website?: string;
  business_email?: string;
  mutations?: B2BMutationItem[];
  visits: D2DVisitLog[];
  created_at: string;
  updated_at: string;
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
