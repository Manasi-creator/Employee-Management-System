import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types';
import { notifyDataChanged } from './dataEvents';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (method && method !== 'get' && !response.config.url?.startsWith('/auth/')) {
      notifyDataChanged();
    }
    return response;
  },
  (error: AxiosError<{ detail?: string | { msg: string }[] }>) => {
    const apiError: ApiError = {
      status: 0,
      message: 'An unexpected error occurred. Please try again.',
    };

    if (!error.response) {
      apiError.message = 'Network error. Please check your connection and try again.';
      return Promise.reject(apiError);
    }

    const { status, data } = error.response;
    apiError.status = status;

    switch (status) {
      case 400:
        apiError.message = friendlyDetail(extractDetail(data) ?? '');
        break;
      case 401:
        if (configIsLogin(error.config?.url)) {
          apiError.message = 'The email or password is incorrect. Please try again.';
        } else {
          apiError.message = 'Your session has expired. Please log in again.';
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        break;
      case 403:
        apiError.message = 'You do not have permission to perform this action.';
        break;
      case 404:
        apiError.message = 'The requested record could not be found. Refresh and try again.';
        break;
      case 409:
        apiError.message = friendlyConflict(data);
        break;
      case 422:
        apiError.message = friendlyValidationErrors(data) || 'Some information is invalid. Please check your entries and try again.';
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

function configIsLogin(url?: string): boolean {
  return Boolean(url && /\/auth\/login(?:\?|$)/.test(url));
}

function friendlyValidationErrors(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { detail?: string | { loc: string[]; msg: string }[] };
  if (typeof d.detail === 'string') return friendlyDetail(d.detail);
  if (Array.isArray(d.detail)) {
    const messages = d.detail.map((error) => {
      const field = error.loc?.[error.loc.length - 1] || '';
      if (field === 'phone' || field === 'country_code') {
        return error.msg.includes('pattern')
          ? field === 'phone'
            ? 'Use digits only and enter exactly 10 digits.'
            : 'Enter a valid country code using digits and an optional leading +.'
          : 'Enter a valid country code and a 10-digit phone number.';
      }
      if (error.msg.includes('provided together')) {
        return 'Enter the country code and phone number together.';
      }
      if (field === 'email') return 'Enter a valid email address.';
      if (field === 'joining_date') return 'Enter a valid joining date.';
      if (field === 'date_of_birth') return 'Enter a valid date of birth.';
      if (field === 'gender') return 'Select a gender.';
      if (field === 'password') return 'Password does not meet the requirements.';
      return 'Check the required fields and try again.';
    });
    return [...new Set(messages)].join(' ');
  }
  return null;
}

function friendlyDetail(detail: string): string {
  if (/designation must belong to the selected department/i.test(detail)) {
    return 'Choose a designation that belongs to the selected department.';
  }
  if (/cannot be their own manager/i.test(detail)) {
    return 'Choose a different manager; an employee cannot manage themselves.';
  }
  if (/invalid gender/i.test(detail)) return 'Select a valid gender.';
  if (/department not found/i.test(detail)) return 'Choose a department from the list.';
  if (/designation not found/i.test(detail)) return 'Choose a designation from the list.';
  if (/manager not found|invalid manager/i.test(detail)) return 'Choose a valid manager from the list.';
  if (/invalid status/i.test(detail)) return 'Choose a valid status.';
  if (/phone|country code/i.test(detail)) {
    return 'Enter a valid country code and a 10-digit phone number.';
  }
  if (/email/i.test(detail)) return 'Enter a valid email address.';
  if (/password/i.test(detail)) return 'Password does not meet the requirements.';
  if (/date/i.test(detail)) return 'Enter a valid date.';
  return 'Some information is invalid. Please check your entries and try again.';
}

function friendlyConflict(data: unknown): string {
  const detail = extractDetail(data) ?? '';
  if (/email/i.test(detail)) return 'An account with this email already exists.';
  if (/employee code/i.test(detail)) return 'This employee code is already in use.';
  return 'This action conflicts with an existing record. Refresh and try again.';
}

export default api;
