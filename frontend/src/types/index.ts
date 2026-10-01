// ─── Auth & User ─────────────────────────────────────────────
export type Role = 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: number;
  email: string;
  role: Role;
  employee_id: number | null;
  is_first_login: boolean;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ─── Employee ────────────────────────────────────────────────
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  address: string;
  skills: string;
  emergency_contact: string;
  joining_date: string;
  department_id: number;
  designation_id: number;
  manager_id: number | null;
  status: EmployeeStatus;
  user_id: number | null;
  department?: Department;
  designation?: Designation;
  manager?: EmployeeSummary;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSummary {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: Department;
  designation?: Designation;
}

export interface EmployeeCreateRequest {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  address: string;
  skills: string;
  emergency_contact: string;
  joining_date: string;
  department_id: number;
  designation_id: number;
  manager_id: number | null;
  status: EmployeeStatus;
  password?: string;
  role?: Role;
}

export interface EmployeeUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  skills?: string;
  emergency_contact?: string;
  joining_date?: string;
  department_id?: number;
  designation_id?: number;
  manager_id?: number | null;
  status?: EmployeeStatus;
}

export interface ProfileUpdateRequest {
  phone?: string;
  address?: string;
  skills?: string;
  emergency_contact?: string;
}

// ─── Department ──────────────────────────────────────────────
export interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreateRequest {
  name: string;
  description: string;
}

export type DepartmentUpdateRequest = Partial<DepartmentCreateRequest>;

// ─── Designation ─────────────────────────────────────────────
export interface Designation {
  id: number;
  name: string;
  description: string;
  department_id: number;
  department?: Department;
  created_at: string;
  updated_at: string;
}

export interface DesignationCreateRequest {
  name: string;
  description: string;
  department_id: number;
}

export type DesignationUpdateRequest = Partial<DesignationCreateRequest>;

// ─── Leave ───────────────────────────────────────────────────
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: number;
  name: string;
  max_days: number;
}

export interface LeaveBalance {
  leave_type: LeaveType | string;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  remarks: string | null;
  employee?: EmployeeSummary;
  reviewed_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveApplyRequest {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveActionRequest {
  status: 'APPROVED' | 'REJECTED';
  remarks?: string;
}

// ─── Project ─────────────────────────────────────────────────
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export interface Project {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  created_by: number;
  members?: ProjectMember[];
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateRequest {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
}

export type ProjectUpdateRequest = Partial<ProjectCreateRequest>;

export interface ProjectMember {
  id?: number;
  project_id: number;
  employee_id: number;
  project_role: string;
  assigned_at: string;
  employee?: EmployeeSummary;
}

export interface ProjectMemberAddRequest {
  employee_id: number;
  project_role: string;
}

// ─── Former Employee ─────────────────────────────────────────
export interface FormerEmployee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  address: string;
  skills: string;
  emergency_contact: string;
  joining_date: string;
  leaving_date: string;
  archived_at: string;
  department_name: string;
  designation_name: string;
  manager_name: string | null;
  project_history?: ProjectHistory[];
  leave_history?: LeaveHistory[];
}

export interface ProjectHistory {
  project_name: string;
  project_role: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
}

export interface LeaveHistory {
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: LeaveStatus;
  reason: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface HRDashboardData {
  total_employees: number;
  total_managers: number;
  active_employees: number;
  total_departments: number;
  pending_manager_leaves: number;
  department_summary: DepartmentSummary[];
}

export interface DepartmentSummary {
  department_name: string;
  employee_count: number;
}

export interface ManagerDashboardData {
  team_size: number;
  pending_team_leaves: number;
  team_projects: ProjectSummary[];
}

export interface ProjectSummary {
  id: number;
  name: string;
  status: ProjectStatus;
  member_count: number;
}

export interface EmployeeDashboardData {
  leave_balance: LeaveBalance[];
  recent_leave_requests: LeaveRequest[];
  assigned_projects: Project[];
}

// ─── Pagination & Filters ────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  department_id?: number;
  designation_id?: number;
  [key: string]: string | number | boolean | undefined;
}

// ─── API Error ───────────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
