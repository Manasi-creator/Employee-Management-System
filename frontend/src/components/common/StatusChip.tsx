import { Chip, type ChipProps } from '@mui/material';

interface StatusChipProps {
  status: string;
  colorMap?: Record<string, ChipProps['color']>;
  size?: ChipProps['size'];
}

const DEFAULT_COLOR_MAP: Record<string, ChipProps['color']> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
  PLANNING: 'info',
  ON_HOLD: 'warning',
  COMPLETED: 'default',
};

export default function StatusChip({ status, colorMap, size = 'small' }: StatusChipProps) {
  const map = colorMap ?? DEFAULT_COLOR_MAP;
  const color = map[status] ?? 'default';
  const label = status.replace(/_/g, ' ');

  return <Chip label={label} color={color} size={size} variant="filled" />;
}
