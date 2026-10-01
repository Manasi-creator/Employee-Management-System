import { useEffect, useState, useCallback } from 'react';
import { Box, Grid, Typography, Alert, Divider, IconButton, Tooltip } from '@mui/material';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import { PageHeader, DataTable, SearchBar, StatusChip, FormDialog, LoadingSpinner } from '../../components';
import type { Column } from '../../components';
import { projectApi } from '../../api';
import type { Project, ProjectMember } from '../../types';

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Team Members Detail Modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchMyProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectApi.getMyProjects({
        page,
        page_size: 10,
        search: search || undefined,
      });
      setProjects(res.data.items);
      setTotalCount(res.data.total);
    } catch {
      setError('Failed to fetch assigned projects.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  const handleViewTeam = async (p: Project) => {
    setSelectedProject(p);
    setDetailOpen(true);
    setMembersLoading(true);
    try {
      const res = await projectApi.getMembers(p.id);
      setMembers(res.data);
    } catch {
      setError('Failed to load project team members.');
    } finally {
      setMembersLoading(false);
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
      label: 'Team Members',
      align: 'center',
      render: (row: Project) => (
        <Tooltip title="View Project Team">
          <IconButton size="small" color="primary" onClick={() => handleViewTeam(row)}>
            <GroupIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="My Projects" subtitle="View all projects and teams you are assigned to" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search my projects..." />
        </Grid>
      </Grid>

      {loading ? (
        <LoadingSpinner label="Loading my projects..." />
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
          emptyMessage="You are currently not assigned to any projects."
        />
      )}

      {/* Team Members Modal */}
      <FormDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSubmit={() => setDetailOpen(false)}
        submitLabel="Close"
        title={`Project Team — ${selectedProject?.name || ''}`}
        maxWidth="sm"
      >
        {membersLoading ? (
          <LoadingSpinner label="Loading team members..." />
        ) : (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedProject?.description || 'No description provided.'}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Team Members ({members.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {members.map((m, idx) => (
                <Box
                  key={m.employee_id || idx}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {m.employee ? `${m.employee.first_name} ${m.employee.last_name}` : `Employee #${m.employee_id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.project_role || 'Member'}
                  </Typography>
                </Box>
              ))}
              {members.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center">
                  No members listed for this project.
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </FormDialog>
    </Box>
  );
}
