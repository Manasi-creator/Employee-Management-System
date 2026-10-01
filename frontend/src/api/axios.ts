import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';
import { getMockResponse } from './mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/* ── Request Interceptor: attach JWT ─────────────────────────── */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ── Response Interceptor: centralized error handling ────────── */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { msg: string }[] }>) => {
    const apiError: ApiError = {
      status: 0,
      message: 'An unexpected error occurred. Please try again.',
    };

    if (!error.response) {
      const mock = getMockResponse(error.config?.url || '');
      if (mock) {
        return Promise.resolve(mock as any);
      }
      apiError.message = 'Network error. Please check your connection and try again.';
      return Promise.reject(apiError);
    }

    const { status, data } = error.response;
    apiError.status = status;

    switch (status) {
      case 400:
        apiError.message = extractDetail(data) || 'Invalid request. Please check your input.';
        break;
      case 401:
        apiError.message = 'Session expired. Please log in again.';
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        break;
      case 403:
        apiError.message = 'You do not have permission to perform this action.';
        break;
      case 404:
        apiError.message = extractDetail(data) || 'The requested resource was not found.';
        break;
      case 409:
        apiError.message = extractDetail(data) || 'A conflict occurred. The resource may already exist.';
        break;
      case 422:
        apiError.message = extractValidationErrors(data) || 'Please correct the highlighted fields.';
        break;
      case 500:
      default:
        apiError.message = 'Something went wrong on the server. Please try again later.';
        break;
    }

    return Promise.reject(apiError);
  },
);

function extractDetail(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { detail?: string | { msg: string }[] };
  if (typeof d.detail === 'string') return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail.map((e) => e.msg).join('; ');
  }
  return null;
}

function extractValidationErrors(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { detail?: string | { loc: string[]; msg: string }[] };
  if (typeof d.detail === 'string') return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((e) => {
        const field = e.loc?.[e.loc.length - 1] || 'field';
        return `${field}: ${e.msg}`;
      })
      .join('; ');
  }
  return null;
}

export default api;
