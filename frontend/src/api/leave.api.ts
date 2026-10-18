import api from './axios';
import type {
  LeaveRequest,
  LeaveApplyRequest,
  LeaveActionRequest,
  LeaveBalance,
  LeaveType,
  PaginatedResponse,
  QueryParams,
} from '../types';

const PREFIX = '/leaves';

export const leaveApi = {
  /* ── Leave Types ──────────────────────────────────────────── */
  getTypes: () =>
    api.get<LeaveType[]>(`${PREFIX}/types`),

  /* ── Employee Self ────────────────────────────────────────── */
  apply: (data: LeaveApplyRequest) =>
    api.post<LeaveRequest>(PREFIX, data),

  getMyLeaves: (params?: QueryParams) =>
    api.get<PaginatedResponse<LeaveRequest>>(`${PREFIX}/my`, { params }),

  getMyBalance: () =>
    api.get<LeaveBalance[]>(`${PREFIX}/balance`),

  cancel: (id: string) =>
    api.post<LeaveRequest>(`${PREFIX}/${id}/cancel`),

  /* ── Manager: team leaves ─────────────────────────────────── */
  getTeamLeaves: (params?: QueryParams) =>
    api.get<PaginatedResponse<LeaveRequest>>(`${PREFIX}/team`, { params }),

  actionLeave: (id: string, data: LeaveActionRequest) =>
    api.post<LeaveRequest>(`${PREFIX}/${id}/action`, data),

  /* ── HR: manager leaves ───────────────────────────────────── */
  getManagerLeaves: (params?: QueryParams) =>
    api.get<PaginatedResponse<LeaveRequest>>(`${PREFIX}/manager-requests`, { params }),

  /* ── General ──────────────────────────────────────────────── */
  getById: (id: string) =>
    api.get<LeaveRequest>(`${PREFIX}/${id}`),
};
