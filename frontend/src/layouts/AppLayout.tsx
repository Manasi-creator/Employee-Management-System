import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { Sidebar, TopBar } from '../components/layout';
import { useAuth } from '../context';
import { DRAWER_WIDTH } from '../components/layout/Sidebar';

function CachedOutlet() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const [cachedOutlets, setCachedOutlets] = useState<Map<string, ReactNode>>(
    () => new Map(),
  );

  useEffect(() => {
    setCachedOutlets((cached) => {
      if (cached.has(pathname)) return cached;
      const next = new Map(cached);
      next.set(pathname, outlet);
      return next;
    });
  }, [outlet, pathname]);

  const outlets = new Map(cachedOutlets);
  if (!outlets.has(pathname)) outlets.set(pathname, outlet);

  return (
    <>
      {[...outlets].map(([routePath, routeOutlet]) => (
        <div key={routePath} hidden={routePath !== pathname} aria-hidden={routePath !== pathname}>
          {routeOutlet}
        </div>
      ))}
    </>
  );
}

export default function AppLayout() {
  const { role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!role) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar onMenuToggle={() => setMobileOpen((prev) => !prev)} />
      <Sidebar role={role} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }} />
        <Box className="page-container animate-fade-in">
          <CachedOutlet />
        </Box>
      </Box>
    </Box>
  );
}
