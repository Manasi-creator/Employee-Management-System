import { useEffect, useCallback } from 'react';
import { Grid, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccountOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import { PageHeader, StatCard, LoadingState, ErrorState } from '../../components';
import { employeeApi } from '../../api';
import { useApi } from '../../hooks';
import type { HRDashboardData, DepartmentSummary } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

export default function HRDashboard() {
  const {
    data,
    isLoading,
    error,
    execute,
  } = useApi<HRDashboardData>(
    useCallback(() => employeeApi.getHRDashboard(), []),
  );

  useEffect(() => {
    execute();
  }, [execute]);

  if (isLoading) return <LoadingState fullPage message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={() => execute()} />;

  return (
    <Box>
      <PageHeader title="HR Dashboard" subtitle="Organization overview" />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Total Employees"
            value={data?.total_employees ?? 0}
            icon={<PeopleIcon />}
            color="#4F5AE5"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Managers"
            value={data?.total_managers ?? 0}
            icon={<SupervisorAccountIcon />}
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Active Employees"
            value={data?.active_employees ?? 0}
            icon={<PersonIcon />}
            color="#2563EB"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Departments"
            value={data?.total_departments ?? 0}
            icon={<BusinessIcon />}
            color="#D97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Pending Leaves"
            value={data?.pending_manager_leaves ?? 0}
            icon={<EventNoteIcon />}
            color="#DC2626"
            subtitle="Manager leave requests"
          />
        </Grid>
      </Grid>

      {/* Department Summary */}
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Department Summary
          </Typography>
          {data?.department_summary && data.department_summary.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Employees</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.department_summary.map((dept: DepartmentSummary) => (
                    <TableRow key={dept.department_name}>
                      <TableCell>{dept.department_name}</TableCell>
                      <TableCell align="right">{dept.employee_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No department data available.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
