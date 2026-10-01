import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { Sidebar, TopBar } from '../components/layout';
import { useAuth } from '../context';
import { DRAWER_WIDTH } from '../components/layout/Sidebar';

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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }} />
        <Box className="page-container animate-fade-in">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
