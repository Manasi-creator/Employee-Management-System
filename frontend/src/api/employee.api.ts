import api from './axios';
import type {
  Employee,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  ProfileUpdateRequest,
  PaginatedResponse,
  QueryParams,
  HRDashboardData,
  ManagerDashboardData,
  EmployeeDashboardData,
} from '../types';

const EMPLOYEES_PREFIX = '/employees';

export const employeeApi = {
  /* ── List / Search ────────────────────────────────────────── */
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Employee>>(EMPLOYEES_PREFIX, { params }),

  getManagers: (params?: QueryParams) =>
    api.get<PaginatedResponse<Employee>>(`${EMPLOYEES_PREFIX}/managers`, { params }),

  getMyTeam: (params?: QueryParams) =>
    api.get<PaginatedResponse<Employee>>(`${EMPLOYEES_PREFIX}/my-team`, { params }),

  getNextCode: () =>
    api.get<{ employee_code: string }>(`${EMPLOYEES_PREFIX}/next-code`),

  /* ── CRUD ─────────────────────────────────────────────────── */
  getById: (id: number) =>
    api.get<Employee>(`${EMPLOYEES_PREFIX}/${id}`),

  create: (data: EmployeeCreateRequest) =>
    api.post<Employee>(EMPLOYEES_PREFIX, data),

  update: (id: number, data: EmployeeUpdateRequest) =>
    api.put<Employee>(`${EMPLOYEES_PREFIX}/${id}`, data),

  archive: (id: number) =>
    api.post<{ message: string }>(`${EMPLOYEES_PREFIX}/${id}/archive`),

  /* ── Profile (self) ───────────────────────────────────────── */
  getMyProfile: () =>
    api.get<Employee>(`${EMPLOYEES_PREFIX}/me`),

  updateMyProfile: (data: ProfileUpdateRequest) =>
    api.put<Employee>(`${EMPLOYEES_PREFIX}/me`, data),

  /* ── Dashboards ───────────────────────────────────────────── */
  getHRDashboard: () =>
    api.get<HRDashboardData>('/dashboard/hr'),

  getManagerDashboard: () =>
    api.get<ManagerDashboardData>('/dashboard/manager'),

  getEmployeeDashboard: () =>
    api.get<EmployeeDashboardData>('/dashboard/employee'),
};
