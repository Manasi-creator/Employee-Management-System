import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Role, LoginRequest } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;
  const role = user?.role ?? null;
  const isFirstLogin = user?.is_first_login ?? false;

  /* ── Restore session on mount ────────────────────────────── */
  const restoreSession = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    restoreSession();
  }, [restoreSession]);

  /* ── Login ───────────────────────────────────────────────── */
  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    const loggedInUser = response.data.user;
    setUser(loggedInUser);

    if (loggedInUser.is_first_login) {
      navigate('/change-password', { replace: true });
    } else {
      const dashboardPath = getRoleDashboard(loggedInUser.role);
      navigate(dashboardPath, { replace: true });
    }
  };

  /* ── Logout ──────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  /* ── Update User ─────────────────────────────────────────── */
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
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
