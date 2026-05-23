// =====================================================================
// Identimarketing SaaS - Database types
// Mirrors the schema in lib/db/migrations/001_create_tables.sql.
// =====================================================================

export type UserRole = 'owner' | 'admin' | 'member' | 'client';
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type ClientStatus = 'lead' | 'active' | 'paused' | 'churned';
export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'in_review'
  | 'completed'
  | 'closed'
  | 'cancelled';
export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'under_review'
  | 'approved'
  | 'rejected';
export type TeamRole =
  | 'admin'
  | 'manager'
  | 'designer'
  | 'developer'
  | 'strategist'
  | 'member';
export type TeamMemberStatus = 'invited' | 'active' | 'inactive';
export type SuggestionStatus =
  | 'pending'
  | 'accepted'
  | 'dismissed'
  | 'applied'
  | 'approved'
  | 'declined';
export type SyncStatus = 'pending' | 'running' | 'success' | 'error';
export type BillingStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'cancelled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ---------------------------------------------------------------------
// Project status state machine. Importing the typed `nextProjectStatus`
// helper guarantees we cannot transition to an illegal status at compile time.
// ---------------------------------------------------------------------
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planning: ['active', 'cancelled'],
  active: ['in_review', 'completed', 'cancelled'],
  in_review: ['active', 'completed', 'cancelled'],
  completed: ['closed', 'active'],
  closed: [],
  cancelled: ['planning'],
};

export function canTransitionProjectStatus(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  return PROJECT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const DELIVERABLE_STATUS_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
  pending: ['in_progress', 'rejected'],
  in_progress: ['completed', 'pending'],
  completed: ['under_review', 'in_progress'],
  under_review: ['approved', 'rejected', 'in_progress'],
  approved: [],
  rejected: ['in_progress'],
};

// ---------------------------------------------------------------------
// Row types  (snake_case to match Postgres columns)
// ---------------------------------------------------------------------
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  timezone: string | null;
  ghl_contact_id: string | null;
  subscription_tier: SubscriptionTier;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// `User` alias matches the spec's terminology
export type User = Profile;

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_base: number;
  deliverables: string[];
  timeline_weeks: number;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  contact_name: string | null;
  contact_email: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  budget: number;
  status: ClientStatus;
  notes: string | null;
  ghl_client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  user_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  service_type: string | null;
  status: ProjectStatus;
  budget: number;
  spent: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: DeliverableStatus;
  due_date: string | null;
  completed_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  file_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  owner_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: TeamRole;
  specialties: string[];
  phone: string | null;
  status: TeamMemberStatus;
  invite_token: string | null;
  invite_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  team_member_id: string;
  assigned_at: string;
}

export interface ProjectMetric {
  id: string;
  project_id: string;
  metric_type: string;
  metric_value: number;
  metric_date: string;
  meta: Record<string, unknown>;
  recorded_at: string;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface ProjectMetricTarget {
  id: string;
  project_id: string;
  metric_type: string;
  target_value: number;
  direction: 'up' | 'down';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ReportFormat = 'pdf' | 'html';
export type ReportStatus = 'pending' | 'ready' | 'failed';
export type ReportSchedule = 'manual' | 'weekly' | 'monthly';

export interface Report {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  format: ReportFormat;
  status: ReportStatus;
  period_from: string | null;
  period_to: string | null;
  summary: string | null;
  payload: Record<string, unknown>;
  html_content: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  share_views: number;
  storage_path: string | null;
  schedule: ReportSchedule;
  next_run_at: string | null;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export type NotificationCategory =
  | 'project'
  | 'team'
  | 'performance'
  | 'billing'
  | 'system'
  | 'empire_os';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationDeliveryStatus = 'queued' | 'sent' | 'failed' | null;

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string | null;
  link: string | null;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_via: string[];
  sent_at: string;
  ghl_message_id: string | null;
  email_status: NotificationDeliveryStatus;
  email_error: string | null;
  sms_status: NotificationDeliveryStatus;
  sms_error: string | null;
  meta: Record<string, unknown>;
  data: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
}

export interface CategoryChannelPrefs {
  email: boolean;
  sms: boolean;
  in_app: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  category_channels: Record<NotificationCategory, CategoryChannelPrefs>;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  daily_digest: boolean;
  weekly_summary: boolean;
  created_at: string;
  updated_at: string;
}

export type CronRunStatus = 'running' | 'ok' | 'failed';

export interface CronRun {
  id: string;
  job: string;
  started_at: string;
  finished_at: string | null;
  status: CronRunStatus;
  stats: Record<string, unknown>;
  error: string | null;
}

export type RecommendationType =
  | 'generate_content'
  | 'email_sequence'
  | 'social_calendar'
  | 'ad_copy'
  | 'strategy'
  | 'advice'; // catch-all for non-auto-executable suggestions

export interface EmpireOSSuggestion {
  id: string;
  project_id: string;
  user_id: string | null;
  skill_name: string;
  event_type: string | null;
  recommendation_type: RecommendationType | null;
  title: string | null;
  suggestion_text: string;
  recommendation: string | null;
  confidence_score: number;
  impact_score: number | null;
  estimated_time_minutes: number | null;
  estimated_value: number | null;
  action_steps: string[];
  auto_executable: boolean;
  status: SuggestionStatus;
  applied_at: string | null;
  applied_output: Record<string, unknown> | null;
  applied_by: string | null;
  declined_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type EmpireEventMode = 'inline' | 'queued' | 'cron';
export type EmpireEventStatus = 'completed' | 'failed' | 'queued';

export interface EmpireOSEvent {
  id: string;
  user_id: string;
  event_type: string;
  project_id: string | null;
  client_id: string | null;
  payload: Record<string, unknown>;
  skills_dispatched: string[];
  mode: EmpireEventMode;
  status: EmpireEventStatus;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface EmpireOSJob {
  id: string;
  user_id: string;
  project_id: string | null;
  event_type: string;
  skill_slug: string;
  payload: Record<string, unknown>;
  priority: number;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  locked_until: string | null;
  last_error: string | null;
  result_suggestion_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpireOSSettings {
  user_id: string;
  auto_execute: boolean;
  confidence_threshold: number;
  allowed_recommendation_types: RecommendationType[];
  enabled_event_types: string[];
  hourly_budget_usd: number;
  created_at: string;
  updated_at: string;
}

export interface GHLSync {
  id: string;
  user_id: string;
  sync_type: string;
  status: SyncStatus;
  last_synced_at: string | null;
  error_message: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Billing {
  id: string;
  user_id: string;
  plan: string;
  monthly_cost: number;
  billing_date: string | null;
  next_billing_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: BillingStatus;
  currency: string;
  price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  canceled_at: string | null;
  default_payment_method: string | null;
  last_invoice_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface Invoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  number: string | null;
  status: InvoiceStatus;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: string | null;
  period_end: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  processed_at: string | null;
  error: string | null;
  created_at: string;
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  context: Record<string, unknown>;
  user_id: string | null;
  request_id: string | null;
  created_at: string;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  duration_ms: number | null;
  user_id: string | null;
  meta: Record<string, unknown>;
  recorded_at: string;
}

// ---------------------------------------------------------------------
// Database type for @supabase/ssr generic
//
// We intentionally use Partial<Row> for Insert/Update so generic helpers
// in lib/db/queries.ts type-check cleanly. Required-field validation
// happens at the Zod layer in lib/validations/*.
// ---------------------------------------------------------------------
type TableShape<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<Profile>;
      services: TableShape<Service>;
      clients: TableShape<Client>;
      projects: TableShape<Project>;
      deliverables: TableShape<Deliverable>;
      team_members: TableShape<TeamMember>;
      project_assignments: TableShape<ProjectAssignment>;
      project_metrics: TableShape<ProjectMetric>;
      project_metric_targets: TableShape<ProjectMetricTarget>;
      reports: TableShape<Report>;
      invoices: TableShape<Invoice>;
      stripe_webhook_events: TableShape<StripeWebhookEvent>;
      notification_preferences: TableShape<NotificationPreferences>;
      cron_runs: TableShape<CronRun>;
      notifications: TableShape<Notification>;
      empire_os_suggestions: TableShape<EmpireOSSuggestion>;
      empire_os_events: TableShape<EmpireOSEvent>;
      empire_os_job_queue: TableShape<EmpireOSJob>;
      empire_os_settings: TableShape<EmpireOSSettings>;
      ghl_syncs: TableShape<GHLSync>;
      billing: TableShape<Billing>;
      system_logs: TableShape<SystemLog>;
      metrics: TableShape<Metric>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ---------------------------------------------------------------------
// Composite types (joins frequently used in the dashboard)
// ---------------------------------------------------------------------
export type ClientWithStats = Client & {
  project_count: number;
  total_revenue: number;
  active_projects: number;
};

export type ProjectWithClient = Project & {
  client?: Pick<Client, 'id' | 'company_name'> | null;
};

export type DeliverableWithAssignee = Deliverable & {
  assignee?: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null;
};
