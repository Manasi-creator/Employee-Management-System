import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  label?: string;
  fullPage?: boolean;
}

export default function LoadingState({ message, label = 'Loading…', fullPage }: LoadingStateProps) {
  const displayMessage = message || label;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: fullPage ? 0 : 8,
        minHeight: fullPage ? '60vh' : 200,
        gap: 2,
      }}
    >
      <CircularProgress size={36} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        {displayMessage}
      </Typography>
    </Box>
  );
}
