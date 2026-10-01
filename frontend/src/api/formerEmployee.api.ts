import api from './axios';
import type { FormerEmployee, PaginatedResponse, QueryParams } from '../types';

const PREFIX = '/former-employees';

export const formerEmployeeApi = {
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<FormerEmployee>>(PREFIX, { params }),

  getById: (id: number) =>
    api.get<FormerEmployee>(`${PREFIX}/${id}`),
};
