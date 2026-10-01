import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Divider, Alert } from '@mui/material';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard, DataTable, StatusChip, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { employeeApi, leaveApi } from '../../api';
import type { ManagerDashboardData, LeaveRequest } from '../../types';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, leaveRes] = await Promise.all([
        employeeApi.getManagerDashboard(),
        leaveApi.getTeamLeaves({ status: 'PENDING', page: 1, page_size: 5 }),
      ]);
      setData(dashRes.data);
      setPendingLeaves(leaveRes.data.items);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const columns: Column<LeaveRequest>[] = [
    {
      id: 'employee_id',
      label: 'Employee',
      render: (row: LeaveRequest) =>
        row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : `Emp #${row.employee_id}`,
    },
    {
      id: 'leave_type_id',
      label: 'Leave Type',
      render: (row: LeaveRequest) => (typeof row.leave_type === 'object' ? row.leave_type.name : `Type #${row.leave_type_id}`),
    },
    { id: 'start_date', label: 'Start Date' },
    { id: 'end_date', label: 'End Date' },
    { id: 'days', label: 'Days', align: 'center' },
    { id: 'reason', label: 'Reason' },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row: LeaveRequest) => <StatusChip status={row.status} />,
    },
  ];

  if (loading) return <LoadingSpinner label="Loading Manager Dashboard..." />;

  return (
    <Box>
      <PageHeader title="Manager Dashboard" subtitle="Manage your direct reports, projects, and leave approvals" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Team Members"
            value={data?.team_size ?? 0}
            icon={<GroupsIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Leave Reviews"
            value={data?.pending_team_leaves ?? 0}
            icon={<EventNoteIcon />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Team Projects"
            value={data?.team_projects?.length ?? 0}
            icon={<FolderIcon />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Tasks"
            value={data?.team_projects?.filter((p) => p.status === 'ACTIVE').length ?? 0}
            icon={<CheckCircleIcon />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Quick Actions & Recent Leaves */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Pending Team Leave Approvals
                </Typography>
                <Button variant="text" onClick={() => navigate('/app/manager/leave')}>
                  View All
                </Button>
              </Box>
              <DataTable
                columns={columns}
                rows={pendingLeaves}
                getRowKey={(row) => row.id}
                emptyMessage="No pending leave requests from team members."
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<GroupsIcon />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/app/manager/team')}
                >
                  View Direct Reports
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventNoteIcon />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/app/manager/leave')}
                >
                  Review Team Leave Requests
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/app/manager/projects')}
                >
                  Create New Project
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Manager Guidance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review pending team leave requests promptly to ensure balanced team availability and project coverage.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
