import { useEffect, useState, useCallback } from 'react';
import { Box, Button, TextField, MenuItem, Grid, Alert, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import ArchiveIcon from '@mui/icons-material/ArchiveOutlined';
import {
  PageHeader,
  DataTable,
  SearchBar,
  FilterBar,
  StatusChip,
  ConfirmDialog,
  FormDialog,
} from '../../components';
import type { Column, FilterConfig } from '../../components';
import { employeeApi, departmentApi, designationApi } from '../../api';
import { usePaginatedApi, useDisclosure } from '../../hooks';
import { fullName, formatDate, getErrorMessage } from '../../utils';
import type { Employee, EmployeeCreateRequest, EmployeeUpdateRequest, Department, Designation } from '../../types';

export default function ManagersPage() {
  const paginated = usePaginatedApi<Employee>(
    useCallback((params) => employeeApi.getManagers(params), []),
  );

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);

  const createDialog = useDisclosure();
  const editDialog = useDisclosure();
  const viewDialog = useDisclosure();
  const archiveDialog = useDisclosure();

  const [formData, setFormData] = useState<Partial<EmployeeCreateRequest>>({});
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [nextCode, setNextCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');

  useEffect(() => {
    departmentApi.getAll({ page_size: 100 }).then((res) => setDepartments(res.data.items)).catch(() => {});
  }, []);

  const loadDesignations = (deptId: number) => {
    designationApi.getAll({ department_id: deptId, page_size: 100 }).then((res) => setDesignations(res.data.items)).catch(() => {});
  };

  const resetForm = () => {
    setFormData({});
    setFormError('');
  };

  const openCreate = async () => {
    resetForm();
    try {
      const res = await employeeApi.getNextCode();
      const code = res.data.employee_code;
      setNextCode(code);
      setFormData((p) => ({ ...p, employee_code: code }));
    } catch {
      setNextCode('');
    }
    createDialog.open();
  };

  const openEdit = (manager: Employee) => {
    setSelectedManager(manager);
    setFormData({
      first_name: manager.first_name,
      last_name: manager.last_name,
      phone: manager.phone,
      address: manager.address,
      skills: manager.skills,
      emergency_contact: manager.emergency_contact,
      department_id: manager.department_id,
      designation_id: manager.designation_id,
      status: manager.status,
    });
    if (manager.department_id) loadDesignations(manager.department_id);
    setFormError('');
    editDialog.open();
  };

  const openView = (manager: Employee) => {
    setSelectedManager(manager);
    viewDialog.open();
  };

  const openArchive = (manager: Employee) => {
    setSelectedManager(manager);
    archiveDialog.open();
  };

  const handleCreate = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await employeeApi.create({ ...formData, role: 'MANAGER' } as EmployeeCreateRequest);
      createDialog.close();
      paginated.refresh();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedManager) return;
    setFormLoading(true);
    setFormError('');
    try {
      await employeeApi.update(selectedManager.id, formData as EmployeeUpdateRequest);
      editDialog.close();
      paginated.refresh();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedManager) return;
    setFormLoading(true);
    try {
      await employeeApi.archive(selectedManager.id);
      archiveDialog.close();
      paginated.refresh();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      value: statusFilter,
      options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }],
      onChange: (val) => { setStatusFilter(val); paginated.setFilters({ status: val || undefined, department_id: deptFilter ? Number(deptFilter) : undefined }); },
    },
    {
      id: 'department',
      label: 'Department',
      value: deptFilter,
      options: departments.map((d) => ({ label: d.name, value: String(d.id) })),
      onChange: (val) => { setDeptFilter(val); paginated.setFilters({ status: statusFilter || undefined, department_id: val ? Number(val) : undefined }); },
    },
  ];

  const columns: Column<Employee>[] = [
    { id: 'employee_code', label: 'Code', sortable: true, minWidth: 90 },
    { id: 'name', label: 'Name', sortable: true, minWidth: 150, render: (row) => fullName(row.first_name, row.last_name) },
    { id: 'email', label: 'Email', minWidth: 180 },
    { id: 'phone', label: 'Phone', minWidth: 120 },
    { id: 'department', label: 'Department', minWidth: 130, render: (row) => row.department?.name ?? '—' },
    { id: 'designation', label: 'Designation', minWidth: 130, render: (row) => row.designation?.name ?? '—' },
    { id: 'joining_date', label: 'Joined', sortable: true, minWidth: 110, render: (row) => formatDate(row.joining_date) },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View"><IconButton size="small" onClick={(e) => { e.stopPropagation(); openView(row); }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Archive"><IconButton size="small" onClick={(e) => { e.stopPropagation(); openArchive(row); }}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Managers" subtitle="Manage enterprise managers and team leads" action={<Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Manager</Button>} />
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={paginated.params.search ? String(paginated.params.search) : ''} onSearch={paginated.setSearch} placeholder="Search managers..." />
        <FilterBar filters={filterConfigs} onReset={() => { setStatusFilter(''); setDeptFilter(''); paginated.setFilters({}); }} />
      </Box>

      <DataTable<Employee> columns={columns} rows={paginated.items} isLoading={paginated.isLoading} error={paginated.error} page={paginated.page} pageSize={paginated.pageSize} total={paginated.total} totalPages={paginated.totalPages} onPageChange={paginated.setPage} onPageSizeChange={paginated.setPageSize} onSort={paginated.setSorting} getRowKey={(r) => r.id} onRetry={paginated.refresh} />

      <FormDialog open={createDialog.isOpen} title="Add Manager" onClose={() => { createDialog.close(); resetForm(); }} onSubmit={handleCreate} isLoading={formLoading} maxWidth="md">
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {formError && <Grid size={{ xs: 12 }}><Alert severity="error">{formError}</Alert></Grid>}
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Employee Code" fullWidth required value={formData.employee_code ?? nextCode} disabled slotProps={{ input: { readOnly: true } }} helperText="Auto-assigned" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" type="email" fullWidth required value={formData.email ?? ''} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="First Name" fullWidth required value={formData.first_name ?? ''} onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Last Name" fullWidth required value={formData.last_name ?? ''} onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth required value={formData.phone ?? ''} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Birth" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={formData.date_of_birth ?? ''} onChange={(e) => setFormData((p) => ({ ...p, date_of_birth: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Gender" fullWidth value={formData.gender ?? ''} onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' }))}>
              <MenuItem value="MALE">Male</MenuItem><MenuItem value="FEMALE">Female</MenuItem><MenuItem value="OTHER">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Joining Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={formData.joining_date ?? ''} onChange={(e) => setFormData((p) => ({ ...p, joining_date: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Department" fullWidth required value={formData.department_id ?? ''} onChange={(e) => { const id = Number(e.target.value); setFormData((p) => ({ ...p, department_id: id, designation_id: undefined })); loadDesignations(id); }}>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Designation" fullWidth required value={formData.designation_id ?? ''} onChange={(e) => setFormData((p) => ({ ...p, designation_id: Number(e.target.value) }))}>
              {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}><TextField label="Address" fullWidth multiline rows={2} value={formData.address ?? ''} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Skills" fullWidth value={formData.skills ?? ''} onChange={(e) => setFormData((p) => ({ ...p, skills: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Emergency Contact" fullWidth value={formData.emergency_contact ?? ''} onChange={(e) => setFormData((p) => ({ ...p, emergency_contact: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Password" type="password" fullWidth value={formData.password ?? ''} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} helperText="Initial login password" /></Grid>
        </Grid>
      </FormDialog>

      <FormDialog open={editDialog.isOpen} title="Edit Manager" onClose={() => { editDialog.close(); resetForm(); }} onSubmit={handleUpdate} isLoading={formLoading} maxWidth="md">
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {formError && <Grid size={{ xs: 12 }}><Alert severity="error">{formError}</Alert></Grid>}
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="First Name" fullWidth value={formData.first_name ?? ''} onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Last Name" fullWidth value={formData.last_name ?? ''} onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={formData.phone ?? ''} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Status" fullWidth value={formData.status ?? 'ACTIVE'} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}>
              <MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Department" fullWidth value={formData.department_id ?? ''} onChange={(e) => { const id = Number(e.target.value); setFormData((p) => ({ ...p, department_id: id, designation_id: undefined })); loadDesignations(id); }}>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Designation" fullWidth value={formData.designation_id ?? ''} onChange={(e) => setFormData((p) => ({ ...p, designation_id: Number(e.target.value) }))}>
              {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}><TextField label="Address" fullWidth multiline rows={2} value={formData.address ?? ''} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Skills" fullWidth value={formData.skills ?? ''} onChange={(e) => setFormData((p) => ({ ...p, skills: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Emergency Contact" fullWidth value={formData.emergency_contact ?? ''} onChange={(e) => setFormData((p) => ({ ...p, emergency_contact: e.target.value }))} /></Grid>
        </Grid>
      </FormDialog>

      <FormDialog open={viewDialog.isOpen} title="Manager Details" onClose={viewDialog.close} onSubmit={viewDialog.close} submitLabel="Close" maxWidth="sm">
        {selectedManager && (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {([['Employee Code', selectedManager.employee_code], ['Name', fullName(selectedManager.first_name, selectedManager.last_name)], ['Email', selectedManager.email], ['Phone', selectedManager.phone], ['Department', selectedManager.department?.name ?? '—'], ['Designation', selectedManager.designation?.name ?? '—'], ['Joining Date', formatDate(selectedManager.joining_date)], ['Status', selectedManager.status]] as [string, string][]).map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={label}>
                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>{label}</Box>
                <Box sx={{ fontSize: '0.875rem' }}>{value}</Box>
              </Grid>
            ))}
          </Grid>
        )}
      </FormDialog>

      <ConfirmDialog open={archiveDialog.isOpen} title="Archive Manager" message={`Archive ${selectedManager ? fullName(selectedManager.first_name, selectedManager.last_name) : ''}?`} confirmLabel="Archive" confirmColor="error" isLoading={formLoading} onConfirm={handleArchive} onCancel={archiveDialog.close} />
    </Box>
  );
}
