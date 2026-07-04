// ===== Core Types =====

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'super_admin' | 'platform_admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  tenant_id?: number | null;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  portal_mode?: boolean;
  center_count?: number;
  memberships?: TenantMembershipOption[];
  permissions?: string[];
  avatar?: string;
  locale: string;
  created_at: string;
}

export interface CenterScopedRow {
  center_id?: string | number;
  center_name?: string | null;
  center_slug?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  draw?: number;
  recordsTotal: number;
  recordsFiltered: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
  requires_tenant_selection?: boolean;
  memberships?: TenantMembershipOption[];
  user?: Partial<User>;
}

export interface TenantMembershipOption {
  membership_id: number;
  tenant_id: number;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  role: string;
  profile_id: number;
}

// ===== Academic Setup =====

export interface Grade {
  id: number;
  name: string;
  notes?: string;
}

export interface ClassRoom {
  id: number;
  name: string;
  grade_id: number;
  notes?: string;
  grade?: Grade;
}

export interface SectionWeekDay {
  day: string;
  time: string;
}

export interface Section {
  id: number;
  name: string;
  class_id: number;
  grade_id: number;
  teacher_id?: number;
  week_days?: SectionWeekDay[];
  classroom?: ClassRoom;
  grade?: Grade;
  teacher?: Teacher;
}

// ===== People =====

export interface Student {
  id: number;
  code: string;
  name: string;
  grade_name?: string;
  class_name?: string;
  section_name?: string;
  email?: string;
  password?: string;
  gender: string;
  date_of_birth?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  grade_id: number;
  classroom_id: number;
  section_id: number;
  parent_id?: number;
  grade?: Grade;
  classroom?: ClassRoom;
  section?: Section;
  parent?: Parent;
  attachments?: string[];
  created_at: string;
}

export interface Parent {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  job_title?: string;
  status: 'active' | 'inactive';
  address?: string;
  attachments?: string[];
  children?: Student[];
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  password?: string;
  specialization?: string;
  phone?: string;
  gender?: string;
  status?: 'active' | 'inactive';
  joining_date?: string;
  address?: string;
  class_ids?: number[];
  attachments?: string[];
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: string[];
}

// ===== Academic Operations =====

export interface Attendance {
  id: number;
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  student?: Student;
}

export interface Fee {
  id: number;
  title: string;
  amount: number;
  grade_id?: number;
  classroom_id?: number;
  section_id?: number;
  description?: string;
  type: string;
  year: string;
  month?: string;
}

export interface Payment {
  id: number;
  student_id: number;
  amount: number;
  date: string;
  description?: string;
  student?: Student;
}

export interface Quiz {
  id: number;
  name: string;
  subject_id?: number;
  grade_id?: number;
  classroom_id?: number;
  section_id?: number;
  teacher_id?: number;
}

export interface QuizDegree {
  id: number;
  quiz_id: number;
  student_id: number;
  degree: number;
  date: string;
  quiz?: Quiz;
  student?: Student;
}

export interface Exam {
  id: number;
  name: string;
  term: string;
  year: string;
  grade_id?: number;
  classroom_id?: number;
}

export interface ExamDegree {
  id: number;
  exam_id: number;
  student_id: number;
  degree: number;
  exam?: Exam;
  student?: Student;
}

export interface Homework {
  id: number;
  title: string;
  content?: string;
  grade_id?: number;
  classroom_id?: number;
  section_id?: number;
  teacher_id?: number;
  start_date: string;
  due_date: string;
  file?: string;
  grade?: Grade;
  classroom?: ClassRoom;
  section?: Section;
}

// ===== Learning Content =====

export interface MediaFile {
  id: number | string;
  name: string;
  size: number;
  type: string;
  url: string;
  file_name?: string;
  mime_type?: string | null;
}

export interface Unit {
  id: number;
  name: string;
  class_id: number;
  notes?: string;
  media?: MediaFile[];
  classroom?: ClassRoom;
}

export interface Lesson {
  id: number;
  name: string;
  unit_id: number;
  notes?: string;
  media?: MediaFile[];
  unit?: Unit;
}

export interface Word {
  id: number;
  word: string;
  meaning?: string;
  lesson_id: number;
}

export interface Question {
  id: number;
  title: string;
  type: string;
  lesson_id?: number;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  answer: string;
  is_correct: boolean;
  question_id: number;
}

export interface LibraryItem {
  id: number;
  title: string;
  description?: string;
  file: string;
  type: string;
  grade_id?: number;
  created_at: string;
}

// ===== Communication =====

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id?: number;
  target_role?: UserRole;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    body?: string;
    message?: string;
    url?: string;
    type?: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unread_count: number;
}

export interface WhatsAppTemplate {
  id: number;
  name: string;
  body: string;
  language: string;
}

// ===== Platform =====

export interface Tenant {
  id: number | string;
  name: string;
  domain: string;
  slug?: string;
  database?: string;
  plan?: string;
  users_count?: number;
  teachers_count?: number;
  students_count?: number;
  parents_count?: number;
  subscription_status?: 'active' | 'trial' | 'past_due' | 'cancelled';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface TenantInitialUserRow {
  name: string;
  email: string;
  password?: string;
  subject?: string;
  phone?: string;
}

export interface TenantCreatePayload extends Partial<Tenant> {
  id?: number | string;
  seed_default_accounts?: boolean;
  initial_users?: {
    admin?: TenantInitialUserRow;
    teachers?: TenantInitialUserRow[];
    parents?: TenantInitialUserRow[];
    students?: TenantInitialUserRow[];
  };
}

export interface TenantProvisionedAccount {
  role: string;
  name: string;
  email: string;
  password: string;
}

export interface TenantCreateResponse extends Tenant {
  default_accounts?: TenantProvisionedAccount[];
}

export interface ActivityLog {
  id: number;
  description: string;
  causer_id?: number;
  causer_type?: string;
  subject_type?: string;
  subject_id?: number;
  properties?: Record<string, unknown>;
  created_at: string;
}

export interface Subscription {
  id: number;
  tenant_id: number;
  tenant_name: string;
  plan: string;
  amount: number;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  next_billing_date: string;
}

export interface TenantContext {
  tenantId?: number;
  tenantSlug?: string;
  database?: string;
}

export interface DashboardStat {
  id: string;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'students' | 'teachers' | 'attendance' | 'finance' | 'exams' | 'alerts';
  icon?: string;
}

export interface DashboardItem {
  id: string | number;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  grade_name?: string;
  class_name?: string;
  section_name?: string;
  fee_title?: string;
}

export interface DashboardSection {
  key: string;
  title: string;
  items: DashboardItem[];
}

export interface DashboardPayload {
  stats: DashboardStat[];
  sections: DashboardSection[];
  payment_summary?: {
    month: string;
    expected_students: number;
    paid_count: number;
    unpaid_count: number;
    unpaid_amount: number;
    filters?: DashboardFilters;
  };
}

export interface DashboardFilters {
  month?: string | null;
  year?: string | null;
  grade_id?: number | null;
  class_id?: number | null;
  section_id?: number | null;
}
