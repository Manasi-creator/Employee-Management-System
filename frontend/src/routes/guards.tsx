import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleDashboard } from '../context';
import { LoadingState } from '../components/feedback';
import type { Role } from '../types';

/* ── Redirect authenticated users away from public pages ───── */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role, isFirstLogin } = useAuth();

  if (isLoading) return <LoadingState fullPage />;

  if (isAuthenticated && role) {
    if (isFirstLogin) return <Navigate to="/change-password" replace />;
    return <Navigate to={getRoleDashboard(role)} replace />;
  }

  return <>{children}</>;
}

/* ── Require authentication ────────────────────────────────── */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isFirstLogin } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState fullPage />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isFirstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}

/* ── Role guard ────────────────────────────────────────────── */
interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) return <LoadingState fullPage />;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
