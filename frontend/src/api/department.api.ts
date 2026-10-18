import api from './axios';
import type { Department, DepartmentCreateRequest, DepartmentUpdateRequest, PaginatedResponse, QueryParams } from '../types';

const PREFIX = '/departments';

export const departmentApi = {
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Department>>(PREFIX, { params }),

  getList: () =>
    api.get<Department[]>(`${PREFIX}/list`),

  getById: (id: string) =>
    api.get<Department>(`${PREFIX}/${id}`),

  create: (data: DepartmentCreateRequest) =>
    api.post<Department>(PREFIX, data),

  update: (id: string, data: DepartmentUpdateRequest) =>
    api.put<Department>(`${PREFIX}/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`${PREFIX}/${id}`),
};
