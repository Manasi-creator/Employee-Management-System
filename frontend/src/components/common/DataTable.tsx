import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Box,
  Pagination,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import type { ReactNode } from 'react';
import LoadingState from '../../components/feedback/LoadingState';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';

export interface Column<T> {
  id: string;
  label: string;
  sortable?: boolean;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T) => string | number;
  onRetry?: () => void;
}

export default function DataTable<T>({
  columns,
  rows,
  isLoading,
  error,
  emptyMessage = 'No records found',
  emptyIcon,
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 0,
  sortBy,
  sortOrder = 'asc',
  onPageChange,
  onPageSizeChange,
  onSort,
  onRowClick,
  getRowKey,
  onRetry,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message="Loading data…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  }

  const handleSort = (field: string) => {
    if (!onSort) return;
    const isAsc = sortBy === field && sortOrder === 'asc';
    onSort(field, isAsc ? 'desc' : 'asc');
  };

  return (
    <Box className="table-container">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align ?? 'left'}
                  sx={{ minWidth: col.minWidth }}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={getRowKey ? getRowKey(row) : index}
                hover
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align ?? 'left'}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.id] ?? '—')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {(onPageChange || onPageSizeChange) && total > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Rows per page:
            </Typography>
            <FormControl size="small">
              <Select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                sx={{ minWidth: 70 }}
              >
                {[5, 10, 25, 50].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {`${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
            </Typography>
          </Box>
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => onPageChange?.(p)}
              size="small"
              shape="rounded"
            />
          )}
        </Box>
      )}
    </Box>
  );
}
