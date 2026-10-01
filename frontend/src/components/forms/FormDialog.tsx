import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ReactNode } from 'react';

interface FormDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  onSubmit: () => void;
  onClose: () => void;
}

export default function FormDialog({
  open,
  title,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading,
  maxWidth = 'sm',
  onSubmit,
  onClose,
}: FormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}
          <IconButton onClick={onClose} size="small" aria-label="Close dialog">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Saving…' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
