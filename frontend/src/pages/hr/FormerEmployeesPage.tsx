import { useEffect, useState, useCallback } from 'react';
import { Box, Grid, Typography, Card, CardContent, Divider } from '@mui/material';
import { PageHeader, DataTable, SearchBar, StatusChip, FormDialog } from '../../components';
import type { Column } from '../../components/common/DataTable';
import { formerEmployeeApi } from '../../api';
import { usePaginatedApi, useDisclosure } from '../../hooks';
import { fullName, formatDate } from '../../utils';
import type { FormerEmployee, ProjectHistory, LeaveHistory } from '../../types';

export default function FormerEmployeesPage() {
  const paginated = usePaginatedApi<FormerEmployee>(
    useCallback((params) => formerEmployeeApi.getAll(params), []),
  );
  const [selected, setSelected] = useState<FormerEmployee | null>(null);
  const detailDialog = useDisclosure();

  useEffect(() => { paginated.refresh(); }, []); // eslint-disable-line

  const openDetail = async (fe: FormerEmployee) => {
    try {
      const res = await formerEmployeeApi.getById(fe.id);
      setSelected(res.data);
    } catch {
      setSelected(fe);
    }
    detailDialog.open();
  };

  const columns: Column<FormerEmployee>[] = [
    { id: 'employee_code', label: 'Code', sortable: true, minWidth: 90 },
    { id: 'name', label: 'Name', minWidth: 160, render: (r: FormerEmployee) => fullName(r.first_name, r.last_name) },
    { id: 'email', label: 'Email', minWidth: 180 },
    { id: 'department_name', label: 'Department', minWidth: 130 },
    { id: 'designation_name', label: 'Designation', minWidth: 130 },
    { id: 'joining_date', label: 'Joined', minWidth: 110, render: (r: FormerEmployee) => formatDate(r.joining_date) },
    { id: 'leaving_date', label: 'Left', minWidth: 110, render: (r: FormerEmployee) => formatDate(r.leaving_date) },
  ];

  return (
    <Box>
      <PageHeader title="Former Employees" subtitle="Historical employee records (read-only)" />
      <Box sx={{ mb: 3 }}><SearchBar placeholder="Search former employees…" onSearch={paginated.setSearch} /></Box>
      <DataTable<FormerEmployee> columns={columns} rows={paginated.items} isLoading={paginated.isLoading} error={paginated.error} page={paginated.page} pageSize={paginated.pageSize} total={paginated.total} totalPages={paginated.totalPages} onPageChange={paginated.setPage} onPageSizeChange={paginated.setPageSize} getRowKey={(r) => r.id} onRowClick={openDetail} onRetry={paginated.refresh} />

      <FormDialog open={detailDialog.isOpen} title="Former Employee Details" onClose={detailDialog.close} onSubmit={detailDialog.close} submitLabel="Close" maxWidth="md">
        {selected && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {([['Employee Code', selected.employee_code], ['Name', fullName(selected.first_name, selected.last_name)], ['Email', selected.email], ['Phone', selected.phone], ['Department', selected.department_name], ['Designation', selected.designation_name], ['Manager', selected.manager_name ?? '—'], ['Joined', formatDate(selected.joining_date)], ['Left', formatDate(selected.leaving_date)], ['Archived', formatDate(selected.archived_at)]] as [string, string][]).map(([label, value]) => (
                <Grid size={{ xs: 12, sm: 6 }} key={label}>
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>{label}</Box>
                  <Box sx={{ fontSize: '0.875rem' }}>{value}</Box>
                </Grid>
              ))}
            </Grid>

            {selected.project_history && selected.project_history.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1.5 }}>Project History</Typography>
                {selected.project_history.map((p: ProjectHistory, i: number) => (
                  <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{p.project_name} — {p.project_role}</Typography>
                        <StatusChip status={p.status} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{formatDate(p.start_date)} – {formatDate(p.end_date)}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {selected.leave_history && selected.leave_history.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1.5 }}>Leave History</Typography>
                {selected.leave_history.map((l: LeaveHistory, i: number) => (
                  <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{l.leave_type} — {l.days} day(s)</Typography>
                        <StatusChip status={l.status} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{formatDate(l.start_date)} – {formatDate(l.end_date)}</Typography>
                      {l.reason && <Typography variant="body2" sx={{ mt: 0.5 }}>{l.reason}</Typography>}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </FormDialog>
    </Box>
  );
}
