import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Role, LoginRequest } from '../types';
import { authApi } from '../api';
import { storage } from '../utils';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = storage.getUser();
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!token && !!user;
  const role = user?.role ?? null;
  const isFirstLogin = user?.is_first_login ?? false;

  /* ── Restore session on mount ────────────────────────────── */
  const restoreSession = useCallback(async () => {
    const savedToken = storage.getToken();
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    try {
      setToken(savedToken);
      const response = await authApi.getMe();
      setUser(response.data);
      storage.setUser(JSON.stringify(response.data));
    } catch {
      storage.clear();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /* ── Login ───────────────────────────────────────────────── */
  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    const { access_token, user: loggedInUser } = response.data;
    storage.setToken(access_token);
    storage.setUser(JSON.stringify(loggedInUser));
    setToken(access_token);
    setUser(loggedInUser);

    if (loggedInUser.is_first_login) {
      navigate('/change-password', { replace: true });
    } else {
      const dashboardPath = getRoleDashboard(loggedInUser.role);
      navigate(dashboardPath, { replace: true });
    }
  };

  /* ── Logout ──────────────────────────────────────────────── */
  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    storage.clear();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  /* ── Update User ─────────────────────────────────────────── */
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    storage.setUser(JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        isFirstLogin,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getRoleDashboard(role: Role): string {
  const map: Record<Role, string> = {
    HR: '/app/hr/dashboard',
    MANAGER: '/app/manager/dashboard',
    EMPLOYEE: '/app/employee/dashboard',
  };
  return map[role];
}
