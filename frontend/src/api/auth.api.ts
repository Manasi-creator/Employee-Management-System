import api from './axios';
import type { LoginRequest, LoginResponse, ChangePasswordRequest, User } from '../types';

const AUTH_PREFIX = '/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>(`${AUTH_PREFIX}/login`, data),

  getMe: () =>
    api.get<User | null>(`${AUTH_PREFIX}/me`),

  changePassword: (data: ChangePasswordRequest) =>
    api.post<{ message: string }>(`${AUTH_PREFIX}/change-password`, data),

  logout: () =>
    api.post<{ message: string }>(`${AUTH_PREFIX}/logout`),
};
