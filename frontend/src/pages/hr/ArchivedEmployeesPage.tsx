import { useCallback, useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { PageHeader, DataTable, SearchBar, StatusChip, FormDialog } from '../../components';
import type { Column } from '../../components/common/DataTable';
import { employeeApi } from '../../api';
import { usePaginatedApi, useDisclosure } from '../../hooks';
import { formatDate, formatPhone, fullName } from '../../utils';
import type { Employee } from '../../types';

export default function ArchivedEmployeesPage() {
  const paginated = usePaginatedApi<Employee>(
    useCallback((params) => employeeApi.getAll({ ...params, status: 'INACTIVE' }), []),
    { status: 'INACTIVE' },
  );
  const [selected, setSelected] = useState<Employee | null>(null);
  const detailDialog = useDisclosure();

  useEffect(() => {
    paginated.refresh();
  }, []);

  const columns: Column<Employee>[] = [
    { id: 'employee_code', label: 'Code', sortable: true, minWidth: 90 },
    { id: 'name', label: 'Name', minWidth: 160, render: (row) => fullName(row.first_name, row.last_name) },
    { id: 'email', label: 'Email', minWidth: 180 },
    { id: 'phone', label: 'Phone', minWidth: 130, render: (row) => formatPhone(row.country_code, row.phone) },
    { id: 'department', label: 'Department', minWidth: 130, render: (row) => row.department?.name ?? '—' },
    { id: 'designation', label: 'Designation', minWidth: 130, render: (row) => row.designation?.name ?? '—' },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <Box>
      <PageHeader title="Archived Employees" subtitle="Employees marked inactive" />
      <Box sx={{ mb: 3 }}>
        <SearchBar placeholder="Search archived employees…" onSearch={paginated.setSearch} />
      </Box>
      <DataTable<Employee>
        columns={columns}
        rows={paginated.items}
        isLoading={paginated.isLoading}
        error={paginated.error}
        page={paginated.page}
        pageSize={paginated.pageSize}
        total={paginated.total}
        totalPages={paginated.totalPages}
        onPageChange={paginated.setPage}
        onPageSizeChange={paginated.setPageSize}
        getRowKey={(row) => row.id}
        onRowClick={(row) => { setSelected(row); detailDialog.open(); }}
        onRetry={paginated.refresh}
      />

      <FormDialog
        open={detailDialog.isOpen}
        title="Inactive Employee Details"
        onClose={detailDialog.close}
        onSubmit={detailDialog.close}
        submitLabel="Close"
        maxWidth="md"
      >
        {selected && (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {([
              ['Employee Code', selected.employee_code],
              ['Name', fullName(selected.first_name, selected.last_name)],
              ['Email', selected.email],
              ['Phone', formatPhone(selected.country_code, selected.phone)],
              ['Gender', selected.gender],
              ['Date of Birth', formatDate(selected.date_of_birth)],
              ['Department', selected.department?.name ?? '—'],
              ['Designation', selected.designation?.name ?? '—'],
              ['Joining Date', formatDate(selected.joining_date)],
              ['Status', selected.status],
              ['Address', selected.address || '—'],
              ['Skills', selected.skills || '—'],
              ['Emergency Contact', selected.emergency_contact || '—'],
            ] as [string, string][]).map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={label}>
                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>{label}</Box>
                <Box sx={{ fontSize: '0.875rem' }}>{value}</Box>
              </Grid>
            ))}
          </Grid>
        )}
      </FormDialog>
    </Box>
  );
}
