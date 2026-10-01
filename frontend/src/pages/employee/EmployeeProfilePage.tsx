import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { PageHeader, LoadingSpinner, StatusChip } from '../../components';
import { useAuth } from '../../context';
import { employeeApi } from '../../api';
import type { Employee } from '../../types';

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getMyProfile();
      setProfile(res.data);
      setFormData({
        phone: res.data.phone || '',
        address: res.data.address || '',
      });
    } catch {
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await employeeApi.updateMyProfile(formData);
      setProfile(res.data);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully.');
    } catch {
      setError('Failed to update profile.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading profile..." />;

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : 'EM';

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="View employment information and update contact details" />

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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {profile?.first_name} {profile?.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {profile?.email}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <StatusChip status={profile?.status || 'ACTIVE'} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                fullWidth
                onClick={() => navigate('/change-password')}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Personal & Job Information
                </Typography>
                {!isEditing ? (
                  <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
                    Edit Contact
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" color="inherit" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Employee Code" value={profile?.employee_code || ''} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Role" value={user?.role || ''} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="First Name" value={profile?.first_name || ''} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Last Name" value={profile?.last_name || ''} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Email" value={profile?.email || ''} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    fullWidth
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Department" value={profile?.department?.name || 'N/A'} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Designation" value={profile?.designation?.name || 'N/A'} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Manager"
                    value={profile?.manager ? `${profile.manager.first_name} ${profile.manager.last_name}` : 'N/A'}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Joining Date" value={profile?.joining_date || 'N/A'} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
