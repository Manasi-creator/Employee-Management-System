import api from './axios';
import type {
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectMember,
  ProjectMemberAddRequest,
  PaginatedResponse,
  QueryParams,
} from '../types';

const PREFIX = '/projects';

export const projectApi = {
  /* ── CRUD ─────────────────────────────────────────────────── */
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Project>>(PREFIX, { params }),

  getById: (id: string) =>
    api.get<Project>(`${PREFIX}/${id}`),

  create: (data: ProjectCreateRequest) =>
    api.post<Project>(PREFIX, data),

  update: (id: string, data: ProjectUpdateRequest) =>
    api.put<Project>(`${PREFIX}/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`${PREFIX}/${id}`),

  /* ── Members ──────────────────────────────────────────────── */
  getMembers: (projectId: string) =>
    api.get<ProjectMember[]>(`${PREFIX}/${projectId}/members`),

  addMember: (projectId: string, data: ProjectMemberAddRequest) =>
    api.post<ProjectMember>(`${PREFIX}/${projectId}/members`, data),

  updateMember: (projectId: string, employeeId: string, projectRole: string) =>
    api.put<ProjectMember>(`${PREFIX}/${projectId}/members/${employeeId}`, {
      project_role: projectRole,
    }),

  removeMember: (projectId: string, employeeId: string) =>
    api.delete<{ message: string }>(`${PREFIX}/${projectId}/members/${employeeId}`),

  /* ── Employee: assigned projects ──────────────────────────── */
  getMyProjects: (params?: QueryParams) =>
    api.get<PaginatedResponse<Project>>(`${PREFIX}/my`, { params }),
};
