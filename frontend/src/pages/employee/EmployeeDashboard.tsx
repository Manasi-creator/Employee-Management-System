import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard, DataTable, StatusChip, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { employeeApi, leaveApi, projectApi } from '../../api';
import type { EmployeeDashboardData, LeaveRequest, Project, Employee } from '../../types';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [dashData, setDashData] = useState<EmployeeDashboardData | null>(null);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashRes, profRes, leaveRes, projRes] = await Promise.all([
          employeeApi.getEmployeeDashboard(),
          employeeApi.getMyProfile(),
          leaveApi.getMyLeaves({ page: 1, page_size: 5 }),
          projectApi.getMyProjects({ page: 1, page_size: 5 }),
        ]);
        setDashData(dashRes.data);
        setProfile(profRes.data);
        setRecentLeaves(leaveRes.data.items);
        setMyProjects(projRes.data.items);
      } catch {
        setError('Failed to load employee dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const leaveColumns: Column<LeaveRequest>[] = [
    {
      id: 'leave_type_id',
      label: 'Leave Type',
      render: (row: LeaveRequest) => (typeof row.leave_type === 'object' ? row.leave_type.name : `Type #${row.leave_type_id}`),
    },
    { id: 'start_date', label: 'Start Date' },
    { id: 'end_date', label: 'End Date' },
    { id: 'days', label: 'Days', align: 'center' },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row: LeaveRequest) => <StatusChip status={row.status} />,
    },
  ];

  if (loading) return <LoadingSpinner label="Loading Dashboard..." />;

  const totalRemainingDays =
    dashData?.leave_balance?.reduce((sum, b) => sum + (b.remaining || 0), 0) ?? 0;
  const pendingLeavesCount =
    recentLeaves.filter((r) => r.status === 'PENDING').length;

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${profile?.first_name || 'Employee'}!`}
        subtitle="Overview of your leave balances, assigned projects, and recent activity"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Top Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Leave Balance Remaining"
            value={`${totalRemainingDays} days`}
            icon={<EventNoteIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Assigned Projects"
            value={myProjects.length}
            icon={<FolderIcon />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Pending Leave Applications"
            value={pendingLeavesCount}
            icon={<EventNoteIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Leaves */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Leave Requests
                </Typography>
                <Button variant="text" onClick={() => navigate('/app/employee/leave')}>
                  View All
                </Button>
              </Box>
              <DataTable
                columns={leaveColumns}
                rows={recentLeaves}
                getRowKey={(row) => row.id}
                emptyMessage="No leave requests submitted yet."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Assigned Projects & Quick Profile */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  My Active Projects
                </Typography>
                <Button variant="text" onClick={() => navigate('/app/employee/projects')}>
                  All Projects
                </Button>
              </Box>
              {myProjects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                  No active project assignments.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {myProjects.map((p) => (
                    <Box
                      key={p.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {p.name}
                        </Typography>
                        <StatusChip status={p.status} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {p.description || 'No description provided.'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Profile Summary Card */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                My Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Employee Code:</strong> {profile?.employee_code || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Department:</strong> {profile?.department?.name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Designation:</strong> {profile?.designation?.name || 'N/A'}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon />}
                  sx={{ mt: 1, alignSelf: 'flex-start' }}
                  onClick={() => navigate('/app/employee/profile')}
                >
                  View Full Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
