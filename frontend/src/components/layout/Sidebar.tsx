import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccountOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import ArchiveIcon from '@mui/icons-material/ArchiveOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import type { Role } from '../../types';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'HR':
      return [
        { label: 'Dashboard', path: '/app/hr/dashboard', icon: <DashboardIcon /> },
        { label: 'Employees', path: '/app/hr/employees', icon: <PeopleIcon /> },
        { label: 'Managers', path: '/app/hr/managers', icon: <SupervisorAccountIcon /> },
        { label: 'Departments', path: '/app/hr/departments', icon: <BusinessIcon /> },
        { label: 'Designations', path: '/app/hr/designations', icon: <BadgeIcon /> },
        { label: 'Leave Requests', path: '/app/hr/leave', icon: <EventNoteIcon /> },
        { label: 'Projects', path: '/app/hr/projects', icon: <FolderIcon /> },
        { label: 'Former Employees', path: '/app/hr/former-employees', icon: <ArchiveIcon /> },
        { label: 'Profile', path: '/app/hr/profile', icon: <PersonIcon /> },
      ];
    case 'MANAGER':
      return [
        { label: 'Dashboard', path: '/app/manager/dashboard', icon: <DashboardIcon /> },
        { label: 'My Team', path: '/app/manager/team', icon: <GroupsIcon /> },
        { label: 'Leave', path: '/app/manager/leave', icon: <EventNoteIcon /> },
        { label: 'Projects', path: '/app/manager/projects', icon: <FolderIcon /> },
        { label: 'Profile', path: '/app/manager/profile', icon: <PersonIcon /> },
      ];
    case 'EMPLOYEE':
      return [
        { label: 'Dashboard', path: '/app/employee/dashboard', icon: <DashboardIcon /> },
        { label: 'Profile', path: '/app/employee/profile', icon: <PersonIcon /> },
        { label: 'Leave', path: '/app/employee/leave', icon: <EventNoteIcon /> },
        { label: 'Projects', path: '/app/employee/projects', icon: <FolderIcon /> },
      ];
    default:
      return [];
  }
}

interface SidebarProps {
  role: Role;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navItems = useMemo(() => getNavItems(role), [role]);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          EM
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            EMS
          </Typography>
          <Typography variant="caption" sx={{ lineHeight: 1 }}>
            Employee Management
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onMobileClose();
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { variant: 'body2', sx: { fontWeight: isActive ? 600 : 400 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Role Badge */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="overline" color="text.secondary">
          Role
        </Typography>
        <Typography variant="subtitle2">{role}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper', position: 'fixed' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export { DRAWER_WIDTH };
