import React from 'react';
import { Select, MenuItem, SelectChangeEvent, FormControl, InputLabel } from '@mui/material';

interface StyledSelectProps {
  value: string;
  label: string;
  onSelect: (value: string) => void;
  children?: React.ReactNode;
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  label,
  onSelect,
  children
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onSelect(event.target.value);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      sx={{
        backgroundColor: '#1E1E1E',
        borderRadius: '0.375rem',
        minHeight: '2.5rem',
        '&:hover': {
          borderColor: '#2684FF',
        },
      }}
    >
      {children}
    </Select>
  );
};

export default StyledSelect;