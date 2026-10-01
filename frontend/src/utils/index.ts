import dayjs from 'dayjs';
import type { LeaveStatus, ProjectStatus, EmployeeStatus } from '../types';

/* ── Formatting ──────────────────────────────────────────────── */
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY');
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY h:mm A');
};

export const fullName = (first: string, last: string): string =>
  `${first} ${last}`.trim();

export const getInitials = (first: string, last: string): string =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

/* ── Status Colors (MUI palette keys) ────────────────────────── */
export const leaveStatusColor = (status: LeaveStatus): 'warning' | 'success' | 'error' | 'default' => {
  const map: Record<LeaveStatus, 'warning' | 'success' | 'error' | 'default'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    CANCELLED: 'default',
  };
  return map[status] ?? 'default';
};

export const projectStatusColor = (status: ProjectStatus): 'info' | 'success' | 'warning' | 'default' => {
  const map: Record<ProjectStatus, 'info' | 'success' | 'warning' | 'default'> = {
    PLANNING: 'info',
    ACTIVE: 'success',
    ON_HOLD: 'warning',
    COMPLETED: 'default',
  };
  return map[status] ?? 'default';
};

export const employeeStatusColor = (status: EmployeeStatus): 'success' | 'default' => {
  return status === 'ACTIVE' ? 'success' : 'default';
};

/* ── Status Labels ───────────────────────────────────────────── */
export const humanize = (str: string): string =>
  str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ── Validation ──────────────────────────────────────────────── */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean =>
  /^[+]?[\d\s-]{7,15}$/.test(phone);

export const isDateBefore = (start: string, end: string): boolean =>
  dayjs(start).isBefore(dayjs(end)) || dayjs(start).isSame(dayjs(end));

/* ── Error extraction ────────────────────────────────────────── */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred.';
};

/* ── Storage ─────────────────────────────────────────────────── */
export const storage = {
  getToken: (): string | null => localStorage.getItem('access_token'),
  setToken: (token: string): void => localStorage.setItem('access_token', token),
  removeToken: (): void => localStorage.removeItem('access_token'),
  getUser: (): string | null => localStorage.getItem('user'),
  setUser: (user: string): void => localStorage.setItem('user', user),
  removeUser: (): void => localStorage.removeItem('user'),
  clear: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};
