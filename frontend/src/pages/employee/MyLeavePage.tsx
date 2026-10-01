import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PageHeader, DataTable, StatusChip, FormDialog, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { leaveApi } from '../../api';
import type { LeaveRequest, LeaveType, LeaveBalance } from '../../types';

export default function MyLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* Apply Dialog State */
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaveData = useCallback(async () => {
    try {
      setLoading(true);
      const [lRes, bRes, tRes] = await Promise.all([
        leaveApi.getMyLeaves({ page, page_size: 10 }),
        leaveApi.getMyBalance(),
        leaveApi.getTypes(),
      ]);
      setLeaves(lRes.data.items);
      setTotalCount(lRes.data.total);
      setBalances(bRes.data);
      setLeaveTypes(tRes.data);
    } catch {
      setError('Failed to fetch leave data.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const handleApplySubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await leaveApi.apply({
        leave_type_id: Number(formData.leave_type_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
      });
      setSuccessMsg('Leave request submitted successfully.');
      setApplyDialogOpen(false);
      setFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      fetchLeaveData();
    } catch {
      setError('Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: number) => {
    try {
      setError(null);
      await leaveApi.cancel(id);
      setSuccessMsg('Leave request cancelled successfully.');
      fetchLeaveData();
    } catch {
      setError('Failed to cancel leave request.');
    }
  };

  const columns: Column<LeaveRequest>[] = [
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
    {
      id: 'remarks',
      label: 'Manager Remarks',
      render: (row: LeaveRequest) => row.remarks || '-',
    },
    {
      id: 'id',
      label: 'Actions',
      align: 'center',
      render: (row: LeaveRequest) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {row.status === 'PENDING' && (
            <Button size="small" color="error" onClick={() => handleCancelLeave(row.id)}>
              Cancel
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="My Leaves"
        subtitle="View your leave balances and track application history"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setApplyDialogOpen(true)}>
            Apply For Leave
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Leave Balances Header Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {balances.map((b, idx) => {
          const typeName = typeof b.leave_type === 'object' ? b.leave_type.name : String(b.leave_type);
          return (
            <Grid size={{ xs: 12, sm: 4 }} key={idx}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {typeName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {b.remaining}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {b.total} days left ({b.used} used)
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Leave History Table */}
      {loading ? (
        <LoadingSpinner label="Loading leaves..." />
      ) : (
        <DataTable
          columns={columns}
          rows={leaves}
          getRowKey={(row) => row.id}
          page={page}
          pageSize={10}
          total={totalCount}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={setPage}
          emptyMessage="No leave requests found."
        />
      )}

      {/* Apply Leave Dialog */}
      <FormDialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        title="Apply for Leave"
        onSubmit={handleApplySubmit}
        isLoading={submitting}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Leave Type"
            value={formData.leave_type_id}
            onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
            required
            fullWidth
          >
            {leaveTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name} ({type.max_days} days/yr)
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Reason for Leave"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </FormDialog>
    </Box>
  );
}
