import { useEffect, useState, useCallback } from 'react';
import { Box, Grid, Typography, Card, CardContent, IconButton, Tooltip, Alert } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import MailIcon from '@mui/icons-material/MailOutlined';
import PhoneIcon from '@mui/icons-material/PhoneOutlined';
import { PageHeader, DataTable, SearchBar, StatusChip, FormDialog, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { employeeApi } from '../../api';
import type { Employee } from '../../types';

export default function TeamEmployeesPage() {
  const [team, setTeam] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getMyTeam({
        page,
        page_size: rowsPerPage,
        search: search || undefined,
      });
      setTeam(res.data.items);
      setTotalCount(res.data.total);
    } catch {
      setError('Failed to fetch team members.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleView = (emp: Employee) => {
    setSelectedMember(emp);
    setDetailOpen(true);
  };

  const columns: Column<Employee>[] = [
    { id: 'employee_code', label: 'Emp Code' },
    {
      id: 'first_name',
      label: 'Name',
      render: (row: Employee) => `${row.first_name} ${row.last_name}`,
    },
    { id: 'email', label: 'Email' },
    { id: 'department_id', label: 'Department', render: (row: Employee) => row.department?.name || 'N/A' },
    { id: 'designation_id', label: 'Designation', render: (row: Employee) => row.designation?.name || 'N/A' },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row: Employee) => <StatusChip status={row.status} />,
    },
    {
      id: 'id',
      label: 'Actions',
      align: 'center',
      render: (row: Employee) => (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => handleView(row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="My Team" subtitle="Direct reports and team member details" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search team members..." />
        </Grid>
      </Grid>

      {loading ? (
        <LoadingSpinner label="Loading team..." />
      ) : (
        <DataTable
          columns={columns}
          rows={team}
          getRowKey={(row) => row.id}
          page={page}
          pageSize={rowsPerPage}
          total={totalCount}
          totalPages={Math.ceil(totalCount / rowsPerPage)}
          onPageChange={setPage}
          onPageSizeChange={setRowsPerPage}
          emptyMessage="No direct reports found."
        />
      )}

      {/* Member Details Modal */}
      <FormDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSubmit={() => setDetailOpen(false)}
        submitLabel="Close"
        title={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Team Member Details'}
        maxWidth="sm"
      >
        {selectedMember && (
          <Box sx={{ pt: 1 }}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Employee Code
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedMember.employee_code}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <StatusChip status={selectedMember.status} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedMember.department?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Designation
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedMember.designation?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MailIcon fontSize="inherit" /> Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedMember.email}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="inherit" /> Phone
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedMember.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Joining Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedMember.joining_date || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </FormDialog>
    </Box>
  );
}
