import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { PageHeader, DataTable, StatusChip, FormDialog, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { leaveApi } from '../../api';
import type { LeaveRequest, LeaveType, LeaveBalance } from '../../types';

export default function ManagerLeavePage() {
  const [tabIndex, setTabIndex] = useState(0);

  /* Team Leaves State */
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [teamPage, setTeamPage] = useState(1);
  const [teamTotal, setTeamTotal] = useState(0);
  const [teamFilterStatus, setTeamFilterStatus] = useState<string>('ALL');

  /* My Leaves State */
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [myBalances, setMyBalances] = useState<LeaveBalance[]>([]);
  const [myPage, setMyPage] = useState(1);
  const [myTotal, setMyTotal] = useState(0);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* Action Modal State (Approve/Reject) */
  const [actionLeave, setActionLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  /* Apply Leave Modal State */
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyFormData, setApplyFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [applySubmitting, setApplySubmitting] = useState(false);

  const fetchTypes = async () => {
    try {
      const res = await leaveApi.getTypes();
      setLeaveTypes(res.data);
    } catch {
      // soft fail
    }
  };

  const fetchTeamLeaves = useCallback(async () => {
    try {
      const res = await leaveApi.getTeamLeaves({
        page: teamPage,
        page_size: 10,
        status: teamFilterStatus === 'ALL' ? undefined : teamFilterStatus,
      });
      setTeamLeaves(res.data.items);
      setTeamTotal(res.data.total);
    } catch {
      setError('Failed to fetch team leave requests.');
    }
  }, [teamPage, teamFilterStatus]);

  const fetchMyLeaves = useCallback(async () => {
    try {
      const [leavesRes, balRes] = await Promise.all([
        leaveApi.getMyLeaves({ page: myPage, page_size: 10 }),
        leaveApi.getMyBalance(),
      ]);
      setMyLeaves(leavesRes.data.items);
      setMyTotal(leavesRes.data.total);
      setMyBalances(balRes.data);
    } catch {
      setError('Failed to fetch my leave history.');
    }
  }, [myPage]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTypes(), fetchTeamLeaves(), fetchMyLeaves()]).finally(() => {
      setLoading(false);
    });
  }, [fetchTeamLeaves, fetchMyLeaves]);

  const handleOpenAction = (leave: LeaveRequest, type: 'APPROVED' | 'REJECTED') => {
    setActionLeave(leave);
    setActionType(type);
    setActionRemarks('');
    setActionDialogOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!actionLeave) return;
    try {
      setActionSubmitting(true);
      setError(null);
      await leaveApi.actionLeave(actionLeave.id, {
        status: actionType,
        remarks: actionRemarks,
      });
      setSuccessMsg(`Leave request ${actionType.toLowerCase()} successfully.`);
      setActionDialogOpen(false);
      fetchTeamLeaves();
    } catch {
      setError('Failed to update leave status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleApplySubmit = async () => {
    try {
      setApplySubmitting(true);
      setError(null);
      await leaveApi.apply({
        leave_type_id: Number(applyFormData.leave_type_id),
        start_date: applyFormData.start_date,
        end_date: applyFormData.end_date,
        reason: applyFormData.reason,
      });
      setSuccessMsg('Leave request submitted successfully.');
      setApplyDialogOpen(false);
      setApplyFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      fetchMyLeaves();
    } catch {
      setError('Failed to submit leave request.');
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleCancelLeave = async (id: number) => {
    try {
      setError(null);
      await leaveApi.cancel(id);
      setSuccessMsg('Leave request cancelled.');
      fetchMyLeaves();
    } catch {
      setError('Failed to cancel leave request.');
    }
  };

  const teamColumns: Column<LeaveRequest>[] = [
    {
      id: 'employee_id',
      label: 'Employee',
      render: (row: LeaveRequest) =>
        row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : `Emp #${row.employee_id}`,
    },
    {
      id: 'leave_type_id',
      label: 'Type',
      render: (row: LeaveRequest) => (typeof row.leave_type === 'object' ? row.leave_type.name : `Type #${row.leave_type_id}`),
    },
    { id: 'start_date', label: 'Start' },
    { id: 'end_date', label: 'End' },
    { id: 'days', label: 'Days', align: 'center' },
    { id: 'reason', label: 'Reason' },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row: LeaveRequest) => <StatusChip status={row.status} />,
    },
    {
      id: 'id',
      label: 'Actions',
      align: 'center',
      render: (row: LeaveRequest) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          {row.status === 'PENDING' ? (
            <>
              <Tooltip title="Approve">
                <IconButton color="success" size="small" onClick={() => handleOpenAction(row, 'APPROVED')}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton color="error" size="small" onClick={() => handleOpenAction(row, 'REJECTED')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Processed
            </Typography>
          )}
        </Box>
      ),
    },
  ];

  const myColumns: Column<LeaveRequest>[] = [
    {
      id: 'leave_type_id',
      label: 'Type',
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
        title="Leave Management"
        subtitle="Review team member leave requests and manage your personal leave"
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
          <Tab label="Team Leave Requests" />
          <Tab label="My Leave Requests & Balances" />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                label="Filter Status"
                value={teamFilterStatus}
                onChange={(e) => setTeamFilterStatus(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {loading ? (
            <LoadingSpinner label="Loading team leave requests..." />
          ) : (
            <DataTable
              columns={teamColumns}
              rows={teamLeaves}
              getRowKey={(row) => row.id}
              page={teamPage}
              pageSize={10}
              total={teamTotal}
              totalPages={Math.ceil(teamTotal / 10)}
              onPageChange={setTeamPage}
              emptyMessage="No team leave requests found."
            />
          )}
        </Box>
      )}

      {tabIndex === 1 && (
        <Box>
          {/* Leave Balances Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {myBalances.map((b, idx) => {
              const name = typeof b.leave_type === 'object' ? b.leave_type.name : String(b.leave_type);
              return (
                <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {name} Balance
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {b.remaining}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        / {b.total} days remaining ({b.used} used)
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {loading ? (
            <LoadingSpinner label="Loading my leaves..." />
          ) : (
            <DataTable
              columns={myColumns}
              rows={myLeaves}
              getRowKey={(row) => row.id}
              page={myPage}
              pageSize={10}
              total={myTotal}
              totalPages={Math.ceil(myTotal / 10)}
              onPageChange={setMyPage}
              emptyMessage="No leave requests submitted yet."
            />
          )}
        </Box>
      )}

      {/* Action Dialog (Approve / Reject) */}
      <FormDialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        title={`${actionType === 'APPROVED' ? 'Approve' : 'Reject'} Leave Request`}
        onSubmit={handleActionSubmit}
        isLoading={actionSubmitting}
      >
        {actionLeave && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2">
              Employee: <strong>{actionLeave.employee ? `${actionLeave.employee.first_name} ${actionLeave.employee.last_name}` : actionLeave.employee_id}</strong>
            </Typography>
            <Typography variant="body2">
              Dates: {actionLeave.start_date} to {actionLeave.end_date} ({actionLeave.days} days)
            </Typography>
            <Typography variant="body2">
              Reason: <em>"{actionLeave.reason}"</em>
            </Typography>
            <TextField
              label="Manager Remarks (Optional)"
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        )}
      </FormDialog>

      {/* Apply Leave Dialog */}
      <FormDialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        title="Apply for Leave"
        onSubmit={handleApplySubmit}
        isLoading={applySubmitting}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Leave Type"
            value={applyFormData.leave_type_id}
            onChange={(e) => setApplyFormData({ ...applyFormData, leave_type_id: e.target.value })}
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
                value={applyFormData.start_date}
                onChange={(e) => setApplyFormData({ ...applyFormData, start_date: e.target.value })}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="End Date"
                type="date"
                value={applyFormData.end_date}
                onChange={(e) => setApplyFormData({ ...applyFormData, end_date: e.target.value })}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Reason for Leave"
            value={applyFormData.reason}
            onChange={(e) => setApplyFormData({ ...applyFormData, reason: e.target.value })}
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
