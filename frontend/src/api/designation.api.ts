import api from './axios';
import type { Designation, DesignationCreateRequest, DesignationUpdateRequest, PaginatedResponse, QueryParams } from '../types';

const PREFIX = '/designations';

export const designationApi = {
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Designation>>(PREFIX, { params }),

  getList: (departmentId?: string) =>
    api.get<Designation[]>(`${PREFIX}/list`, { params: departmentId ? { department_id: departmentId } : undefined }),

  getById: (id: string) =>
    api.get<Designation>(`${PREFIX}/${id}`),

  create: (data: DesignationCreateRequest) =>
    api.post<Designation>(PREFIX, data),

  update: (id: string, data: DesignationUpdateRequest) =>
    api.put<Designation>(`${PREFIX}/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`${PREFIX}/${id}`),
};
