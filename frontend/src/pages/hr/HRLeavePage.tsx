import { useEffect, useState, useCallback } from 'react';
import { Box, TextField, Grid, Alert, Typography, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { PageHeader, DataTable, SearchBar, StatusChip, FormDialog } from '../../components';
import type { Column } from '../../components';
import { leaveApi } from '../../api';
import { usePaginatedApi, useDisclosure } from '../../hooks';
import { fullName, formatDate, getErrorMessage } from '../../utils';
import type { LeaveRequest } from '../../types';

export default function HRLeavePage() {
  const paginated = usePaginatedApi<LeaveRequest>(
    useCallback((params) => leaveApi.getManagerLeaves(params), []),
  );

  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const actionDialog = useDisclosure();
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { paginated.refresh(); }, []); // eslint-disable-line

  const openAction = (leave: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setSelected(leave);
    setActionType(action);
    setRemarks('');
    setActionError('');
    actionDialog.open();
  };

  const handleAction = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await leaveApi.actionLeave(selected.id, { status: actionType, remarks: remarks || undefined });
      actionDialog.close();
      paginated.refresh();
    } catch (err) { setActionError(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  };

  const columns: Column<LeaveRequest>[] = [
    { id: 'employee', label: 'Employee', minWidth: 160, render: (r: LeaveRequest) => r.employee ? fullName(r.employee.first_name, r.employee.last_name) : '—' },
    { id: 'leave_type', label: 'Type', minWidth: 110, render: (r: LeaveRequest) => typeof r.leave_type === 'object' ? r.leave_type?.name : String(r.leave_type ?? '—') },
    { id: 'start_date', label: 'From', minWidth: 110, render: (r: LeaveRequest) => formatDate(r.start_date) },
    { id: 'end_date', label: 'To', minWidth: 110, render: (r: LeaveRequest) => formatDate(r.end_date) },
    { id: 'days', label: 'Days', minWidth: 60, align: 'center' },
    { id: 'reason', label: 'Reason', minWidth: 180, render: (r: LeaveRequest) => r.reason || '—' },
    { id: 'status', label: 'Status', minWidth: 110, render: (r: LeaveRequest) => <StatusChip status={r.status} /> },
    {
      id: 'actions', label: 'Actions', align: 'right', minWidth: 120,
      render: (row: LeaveRequest) => row.status === 'PENDING' ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Chip icon={<CheckIcon />} label="Approve" size="small" color="success" variant="outlined" onClick={(e) => { e.stopPropagation(); openAction(row, 'APPROVED'); }} clickable />
          <Chip icon={<CloseIcon />} label="Reject" size="small" color="error" variant="outlined" onClick={(e) => { e.stopPropagation(); openAction(row, 'REJECTED'); }} clickable />
        </Box>
      ) : null,
    },
  ];

  return (
    <Box>
      <PageHeader title="Manager Leave Requests" subtitle="Review and manage manager leave requests" />
      <Box sx={{ mb: 3 }}><SearchBar placeholder="Search leave requests…" onSearch={paginated.setSearch} /></Box>
      <DataTable<LeaveRequest> columns={columns} rows={paginated.items} isLoading={paginated.isLoading} error={paginated.error} page={paginated.page} pageSize={paginated.pageSize} total={paginated.total} totalPages={paginated.totalPages} onPageChange={paginated.setPage} onPageSizeChange={paginated.setPageSize} getRowKey={(r) => r.id} onRetry={paginated.refresh} />

      <FormDialog open={actionDialog.isOpen} title={actionType === 'APPROVED' ? 'Approve Leave' : 'Reject Leave'} onClose={actionDialog.close} onSubmit={handleAction} submitLabel={actionType === 'APPROVED' ? 'Approve' : 'Reject'} isLoading={actionLoading} maxWidth="xs">
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {actionError && <Grid size={{ xs: 12 }}><Alert severity="error">{actionError}</Alert></Grid>}
          {selected && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                {fullName(selected.employee?.first_name ?? '', selected.employee?.last_name ?? '')} — {formatDate(selected.start_date)} to {formatDate(selected.end_date)} ({selected.days} days)
              </Typography>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}><TextField label="Remarks (optional)" fullWidth multiline rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Grid>
        </Grid>
      </FormDialog>
    </Box>
  );
}
