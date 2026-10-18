// ─── Auth & User ─────────────────────────────────────────────
export type Role = 'HR' | 'MANAGER' | 'EMPLOYEE';
export type PublicId = string;

export interface User {
  id: PublicId;
  email: string;
  role: Role;
  employee_id: PublicId | null;
  is_first_login: boolean;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
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
  id: PublicId;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code?: string;
  date_of_birth: string;
  gender: Gender;
  address: string;
  skills: string;
  emergency_contact: string;
  joining_date: string;
  department_id: PublicId | null;
  designation_id: PublicId | null;
  manager_id: PublicId | null;
  status: EmployeeStatus;
  user_id: PublicId | null;
  department?: Department;
  designation?: Designation;
  manager?: EmployeeSummary;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSummary {
  id: PublicId;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: Department;
  designation?: Designation;
}

export interface EmployeeCreateRequest {
  employee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code: string;
  date_of_birth: string;
  gender: Gender;
  address: string;
  skills: string;
  emergency_contact: string;
  joining_date: string;
  department_id: PublicId | null;
  designation_id: PublicId | null;
  manager_id: PublicId | null;
  status: EmployeeStatus;
  password: string;
  role?: Role;
}

export interface EmployeeUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country_code?: string;
  date_of_birth?: string;
  gender: Gender;
  address?: string;
  skills?: string;
  emergency_contact?: string;
  joining_date?: string;
  department_id?: PublicId | null;
  designation_id?: PublicId | null;
  manager_id?: PublicId | null;
  status?: EmployeeStatus;
}

export interface ProfileUpdateRequest {
  phone?: string;
  country_code?: string;
  address?: string;
  skills?: string;
  emergency_contact?: string;
}

// ─── Department ──────────────────────────────────────────────
export interface Department {
  id: PublicId;
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
  id: PublicId;
  name: string;
  description: string;
  department_id: PublicId;
  department?: Department;
  created_at: string;
  updated_at: string;
}

export interface DesignationCreateRequest {
  name: string;
  description: string;
  department_id: PublicId;
}

export type DesignationUpdateRequest = Partial<DesignationCreateRequest>;

// ─── Leave ───────────────────────────────────────────────────
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: PublicId;
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
  id: PublicId;
  employee_id: PublicId | null;
  leave_type_id: PublicId;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  remarks: string | null;
  employee?: EmployeeSummary;
  reviewed_by?: PublicId | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveApplyRequest {
  leave_type_id: PublicId;
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
  id: PublicId;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  created_by: PublicId | null;
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
  id?: PublicId;
  project_id: PublicId;
  employee_id: PublicId;
  project_role: string;
  assigned_at: string;
  employee?: EmployeeSummary;
}

export interface ProjectMemberAddRequest {
  employee_id: PublicId;
  project_role: string;
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
  id: PublicId;
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
  department_id?: PublicId;
  designation_id?: PublicId;
  [key: string]: string | number | boolean | undefined;
}

// ─── API Error ───────────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
