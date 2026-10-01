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

  getById: (id: number) =>
    api.get<Project>(`${PREFIX}/${id}`),

  create: (data: ProjectCreateRequest) =>
    api.post<Project>(PREFIX, data),

  update: (id: number, data: ProjectUpdateRequest) =>
    api.put<Project>(`${PREFIX}/${id}`, data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`${PREFIX}/${id}`),

  /* ── Members ──────────────────────────────────────────────── */
  getMembers: (projectId: number) =>
    api.get<ProjectMember[]>(`${PREFIX}/${projectId}/members`),

  addMember: (projectId: number, data: ProjectMemberAddRequest) =>
    api.post<ProjectMember>(`${PREFIX}/${projectId}/members`, data),

  removeMember: (projectId: number, employeeId: number) =>
    api.delete<{ message: string }>(`${PREFIX}/${projectId}/members/${employeeId}`),

  /* ── Employee: assigned projects ──────────────────────────── */
  getMyProjects: (params?: QueryParams) =>
    api.get<PaginatedResponse<Project>>(`${PREFIX}/my`, { params }),
};
