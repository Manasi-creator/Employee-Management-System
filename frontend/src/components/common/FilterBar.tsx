import { Box, FormControl, InputLabel, Select, MenuItem, Button, type SxProps } from '@mui/material';
import type { ReactNode } from 'react';

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  value: string | number | '';
  onChange?: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onChange?: (filterId: string, value: string | number) => void;
  onReset?: () => void;
  children?: ReactNode;
  sx?: SxProps;
}

export default function FilterBar({ filters, onChange, onReset, children, sx }: FilterBarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
        ...sx,
      }}
    >
      {filters.map((filter) => (
        <FormControl key={filter.id} size="small" sx={{ minWidth: 160 }}>
          <InputLabel id={`filter-${filter.id}-label`}>{filter.label}</InputLabel>
          <Select
            labelId={`filter-${filter.id}-label`}
            id={`filter-${filter.id}`}
            value={filter.value}
            label={filter.label}
            onChange={(e) => {
              const val = e.target.value as string | number;
              filter.onChange?.(String(val));
              onChange?.(filter.id, val);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {filter.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
      {onReset && (
        <Button variant="text" size="small" onClick={onReset} sx={{ textTransform: 'none' }}>
          Reset Filters
        </Button>
      )}
      {children}
    </Box>
  );
}
