import { useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { PageHeader, DataTable, SearchBar, StatusChip } from '../../components';
import type { Column } from '../../components';
import { projectApi } from '../../api';
import { usePaginatedApi } from '../../hooks';
import { formatDate } from '../../utils';
import type { Project } from '../../types';

export default function HRProjectsPage() {
  const paginated = usePaginatedApi<Project>(
    useCallback((params) => projectApi.getAll(params), []),
  );

  useEffect(() => { paginated.refresh(); }, []); // eslint-disable-line

  const columns: Column<Project>[] = [
    { id: 'name', label: 'Project Name', sortable: true, minWidth: 180 },
    { id: 'description', label: 'Description', minWidth: 220, render: (r: Project) => r.description ? (r.description.length > 80 ? r.description.slice(0, 80) + '…' : r.description) : '—' },
    { id: 'start_date', label: 'Start', minWidth: 110, render: (r: Project) => formatDate(r.start_date) },
    { id: 'end_date', label: 'End', minWidth: 110, render: (r: Project) => formatDate(r.end_date) },
    { id: 'status', label: 'Status', minWidth: 110, render: (r: Project) => <StatusChip status={r.status} /> },
    { id: 'members', label: 'Members', minWidth: 80, align: 'center', render: (r: Project) => r.members?.length ?? 0 },
  ];

  return (
    <Box>
      <PageHeader title="Projects" subtitle="View all projects (read-only)" />
      <Box sx={{ mb: 3 }}><SearchBar placeholder="Search projects…" onSearch={paginated.setSearch} /></Box>
      <DataTable<Project> columns={columns} rows={paginated.items} isLoading={paginated.isLoading} error={paginated.error} page={paginated.page} pageSize={paginated.pageSize} total={paginated.total} totalPages={paginated.totalPages} onPageChange={paginated.setPage} onPageSizeChange={paginated.setPageSize} onSort={paginated.setSorting} getRowKey={(r) => r.id} onRetry={paginated.refresh} />
    </Box>
  );
}
