import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  Typography,
  Card,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import GroupAddIcon from '@mui/icons-material/GroupAddOutlined';
import PersonRemoveIcon from '@mui/icons-material/PersonRemoveOutlined';
import { PageHeader, DataTable, SearchBar, StatusChip, FormDialog, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { projectApi, employeeApi } from '../../api';
import type { Project, ProjectMember, Employee, ProjectStatus } from '../../types';

export default function ManagerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* Project Create/Edit Dialog */
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'ACTIVE' as ProjectStatus,
    start_date: '',
    end_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  /* Delete Dialog */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  /* Members Dialog */
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [teamOptions, setTeamOptions] = useState<Employee[]>([]);
  const [addMemberForm, setAddMemberForm] = useState({ employee_id: '', project_role: '' });
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectApi.getAll({
        page,
        page_size: 10,
        search: search || undefined,
      });
      setProjects(res.data.items);
      setTotalCount(res.data.total);
    } catch {
      setError('Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      description: '',
      status: 'ACTIVE',
      start_date: '',
      end_date: '',
    });
    setProjectDialogOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setProjectForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      start_date: p.start_date || '',
      end_date: p.end_date || '',
    });
    setProjectDialogOpen(true);
  };

  const handleProjectSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      if (editingProject) {
        await projectApi.update(editingProject.id, projectForm);
        setSuccessMsg('Project updated successfully.');
      } else {
        await projectApi.create(projectForm);
        setSuccessMsg('Project created successfully.');
      }
      setProjectDialogOpen(false);
      fetchProjects();
    } catch {
      setError('Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (p: Project) => {
    setDeletingProject(p);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingProject) return;
    try {
      setDeleteSubmitting(true);
      setError(null);
      await projectApi.delete(deletingProject.id);
      setSuccessMsg('Project deleted successfully.');
      setDeleteDialogOpen(false);
      fetchProjects();
    } catch {
      setError('Failed to delete project.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  /* Members Management */
  const handleOpenMembers = async (p: Project) => {
    setSelectedProject(p);
    setMembersDialogOpen(true);
    setMembersLoading(true);
    try {
      const [mRes, tRes] = await Promise.all([
        projectApi.getMembers(p.id),
        employeeApi.getMyTeam({ page_size: 100 }),
      ]);
      setMembers(mRes.data);
      setTeamOptions(tRes.data.items);
    } catch {
      setError('Failed to load project members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !addMemberForm.employee_id) return;
    try {
      setError(null);
      await projectApi.addMember(selectedProject.id, {
        employee_id: Number(addMemberForm.employee_id),
        project_role: addMemberForm.project_role || 'Developer',
      });
      setAddMemberForm({ employee_id: '', project_role: '' });
      const res = await projectApi.getMembers(selectedProject.id);
      setMembers(res.data);
      setSuccessMsg('Member added to project.');
    } catch {
      setError('Failed to add member to project.');
    }
  };

  const handleRemoveMember = async (employeeId: number) => {
    if (!selectedProject) return;
    try {
      setError(null);
      await projectApi.removeMember(selectedProject.id, employeeId);
      const res = await projectApi.getMembers(selectedProject.id);
      setMembers(res.data);
      setSuccessMsg('Member removed from project.');
    } catch {
      setError('Failed to remove member.');
    }
  };

  const columns: Column<Project>[] = [
    { id: 'name', label: 'Project Name' },
    { id: 'description', label: 'Description' },
    { id: 'start_date', label: 'Start Date' },
    { id: 'end_date', label: 'End Date' },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row: Project) => <StatusChip status={row.status} />,
    },
    {
      id: 'id',
      label: 'Actions',
      align: 'center',
      render: (row: Project) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          <Tooltip title="Manage Team Members">
            <IconButton color="info" size="small" onClick={() => handleOpenMembers(row)}>
              <GroupAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Project">
            <IconButton color="primary" size="small" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Project">
            <IconButton color="error" size="small" onClick={() => handleOpenDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Manager Projects"
        subtitle="Manage team projects, assignments, and deliverables"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Create Project
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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SearchBar value={search} onSearch={setSearch} placeholder="Search projects..." />
        </Grid>
      </Grid>

      {loading ? (
        <LoadingSpinner label="Loading projects..." />
      ) : (
        <DataTable
          columns={columns}
          rows={projects}
          getRowKey={(row) => row.id}
          page={page}
          pageSize={10}
          total={totalCount}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={setPage}
          emptyMessage="No projects found."
        />
      )}

      {/* Project Create/Edit Dialog */}
      <FormDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        onSubmit={handleProjectSubmit}
        isLoading={submitting}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Project Name"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            select
            label="Status"
            value={projectForm.status}
            onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
            required
            fullWidth
          >
            <MenuItem value="PLANNING">PLANNING</MenuItem>
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="ON_HOLD">ON_HOLD</MenuItem>
            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
          </TextField>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Start Date"
                type="date"
                value={projectForm.start_date}
                onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="End Date"
                type="date"
                value={projectForm.end_date}
                onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
        </Box>
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <FormDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Project"
        onSubmit={handleDeleteSubmit}
        isLoading={deleteSubmitting}
        submitLabel="Delete"
      >
        <Typography variant="body2" color="error">
          Are you sure you want to delete the project <strong>"{deletingProject?.name}"</strong>? This action cannot be undone.
        </Typography>
      </FormDialog>

      {/* Manage Members Modal */}
      <FormDialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        onSubmit={() => setMembersDialogOpen(false)}
        submitLabel="Done"
        title={`Project Members — ${selectedProject?.name || ''}`}
        maxWidth="md"
      >
        {membersLoading ? (
          <LoadingSpinner label="Loading members..." />
        ) : (
          <Box sx={{ pt: 1 }}>
            {/* Add Member Form */}
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Add Team Member to Project
              </Typography>
              <Box component="form" onSubmit={handleAddMember} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  select
                  label="Select Team Member"
                  value={addMemberForm.employee_id}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, employee_id: e.target.value })}
                  required
                  size="small"
                  sx={{ minWidth: 200, flex: 1 }}
                >
                  {teamOptions.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({t.employee_code})
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Role in Project"
                  placeholder="e.g. Lead, Frontend Developer"
                  value={addMemberForm.project_role}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, project_role: e.target.value })}
                  size="small"
                  sx={{ minWidth: 200, flex: 1 }}
                />
                <Button type="submit" variant="contained" size="medium">
                  Add Member
                </Button>
              </Box>
            </Card>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Current Members ({members.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {members.map((m) => (
                <Grid size={{ xs: 12, sm: 6 }} key={m.employee_id}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {m.employee ? `${m.employee.first_name} ${m.employee.last_name}` : `Emp #${m.employee_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.project_role || 'Member'}
                      </Typography>
                    </Box>
                    <IconButton color="error" size="small" onClick={() => handleRemoveMember(m.employee_id)}>
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
              {members.length === 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    No members assigned to this project yet.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </FormDialog>
    </Box>
  );
}
