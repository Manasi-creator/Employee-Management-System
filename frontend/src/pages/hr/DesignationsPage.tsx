import { useEffect, useState, useCallback } from 'react';
import { Box, Button, TextField, MenuItem, Grid, Alert, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { PageHeader, DataTable, SearchBar, ConfirmDialog, FormDialog } from '../../components';
import type { Column } from '../../components';
import { designationApi, departmentApi } from '../../api';
import { usePaginatedApi, useDisclosure } from '../../hooks';
import { formatDate, getErrorMessage } from '../../utils';
import type { Designation, DesignationCreateRequest, Department } from '../../types';

export default function DesignationsPage() {
  const paginated = usePaginatedApi<Designation>(
    useCallback((params) => designationApi.getAll(params), []),
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selected, setSelected] = useState<Designation | null>(null);
  const createDialog = useDisclosure();
  const editDialog = useDisclosure();
  const deleteDialog = useDisclosure();
  const [formData, setFormData] = useState<Partial<DesignationCreateRequest>>({});
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { paginated.refresh(); loadDepts(); }, []); // eslint-disable-line

  const loadDepts = async () => { try { const r = await departmentApi.getAll({ page_size: 100 }); setDepartments(r.data.items); } catch { } };

  const resetForm = () => { setFormData({}); setFormError(''); };

  const handleCreate = async () => {
    if (!formData.name?.trim() || !formData.department_id) { setFormError('Name and department are required.'); return; }
    setFormLoading(true);
    try { await designationApi.create(formData as DesignationCreateRequest); createDialog.close(); resetForm(); paginated.refresh(); }
    catch (err) { setFormError(getErrorMessage(err)); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setFormLoading(true);
    try { await designationApi.update(selected.id, formData); editDialog.close(); resetForm(); paginated.refresh(); }
    catch (err) { setFormError(getErrorMessage(err)); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try { await designationApi.delete(selected.id); deleteDialog.close(); paginated.refresh(); }
    catch (err) { setFormError(getErrorMessage(err)); }
    finally { setFormLoading(false); }
  };

  const columns: Column<Designation>[] = [
    { id: 'name', label: 'Name', sortable: true, minWidth: 180 },
    { id: 'description', label: 'Description', minWidth: 220, render: (r: Designation) => r.description || '—' },
    { id: 'department', label: 'Department', minWidth: 150, render: (r: Designation) => r.department?.name ?? '—' },
    { id: 'created_at', label: 'Created', minWidth: 120, render: (r: Designation) => formatDate(r.created_at) },
    {
      id: 'actions', label: 'Actions', align: 'right', minWidth: 100,
      render: (row: Designation) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelected(row); setFormData({ name: row.name, description: row.description, department_id: row.department_id }); setFormError(''); editDialog.open(); }} aria-label="Edit"><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelected(row); deleteDialog.open(); }} aria-label="Delete"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const formFields = (
    <Grid container spacing={2} sx={{ pt: 1 }}>
      {formError && <Grid size={{ xs: 12 }}><Alert severity="error">{formError}</Alert></Grid>}
      <Grid size={{ xs: 12 }}><TextField label="Name" fullWidth required value={formData.name ?? ''} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} /></Grid>
      <Grid size={{ xs: 12 }}><TextField label="Description" fullWidth multiline rows={2} value={formData.description ?? ''} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} /></Grid>
      <Grid size={{ xs: 12 }}>
        <TextField select label="Department" fullWidth required value={formData.department_id ?? ''} onChange={(e) => setFormData((p) => ({ ...p, department_id: Number(e.target.value) }))}>
          {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <PageHeader title="Designations" subtitle="Manage job designations" action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); createDialog.open(); }}>Add Designation</Button>} />
      <Box sx={{ mb: 3 }}><SearchBar placeholder="Search designations…" onSearch={paginated.setSearch} /></Box>
      <DataTable<Designation> columns={columns} rows={paginated.items} isLoading={paginated.isLoading} error={paginated.error} page={paginated.page} pageSize={paginated.pageSize} total={paginated.total} totalPages={paginated.totalPages} onPageChange={paginated.setPage} onPageSizeChange={paginated.setPageSize} onSort={paginated.setSorting} getRowKey={(r) => r.id} onRetry={paginated.refresh} />

      <FormDialog open={createDialog.isOpen} title="Add Designation" onClose={() => { createDialog.close(); resetForm(); }} onSubmit={handleCreate} isLoading={formLoading}>{formFields}</FormDialog>
      <FormDialog open={editDialog.isOpen} title="Edit Designation" onClose={() => { editDialog.close(); resetForm(); }} onSubmit={handleUpdate} isLoading={formLoading}>{formFields}</FormDialog>
      <ConfirmDialog open={deleteDialog.isOpen} title="Delete Designation" message={`Delete "${selected?.name}"?`} confirmLabel="Delete" confirmColor="error" isLoading={formLoading} onConfirm={handleDelete} onCancel={deleteDialog.close} />
    </Box>
  );
}
