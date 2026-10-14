import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Divider, Chip, IconButton, InputAdornment, } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context';
import { getErrorMessage } from '../../utils';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    const demoPassword = 'Welcome@123';

    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setIsLoading(true);

    try {
      await login({
        email: demoEmail,
        password: demoPassword,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.125rem',
                mb: 2,
              }}
            >
              EM
            </Box>

            <Typography variant="h3" gutterBottom>
              Welcome back
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Sign in to your Employee Management System
            </Typography>
          </Box>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              id="login-email"
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              sx={{ mb: 2.5 }}
            />

            <TextField
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>

          {/* Demo login options */}
          <Divider sx={{ my: 3 }}>
            <Chip label="Quick Demo Login" size="small" />
          </Divider>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outlined"
              size="small"
              disabled={isLoading}
              onClick={() => handleDemoLogin('hr@ems.com')}
            >
              HR
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={isLoading}
              onClick={() =>
                handleDemoLogin('fin.manager@ems.com')
              }
            >
              Manager
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={isLoading}
              onClick={() => handleDemoLogin('asha@ems.com')}
            >
              Employee
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}