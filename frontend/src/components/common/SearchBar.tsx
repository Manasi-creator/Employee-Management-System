import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
}

export default function SearchBar({
  placeholder = 'Search…',
  value: externalValue,
  onSearch,
  onChange,
  debounceMs = 400,
}: SearchBarProps) {
  const [value, setValue] = useState(externalValue ?? '');

  useEffect(() => {
    if (externalValue !== undefined) setValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(value);
      onChange?.(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch, onChange]);

  return (
    <TextField
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: 260 }}
      aria-label="Search"
    />
  );
}
