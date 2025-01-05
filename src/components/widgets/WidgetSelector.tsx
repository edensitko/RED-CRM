import React, { useState } from 'react';
import {
  Box,
  Menu,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import { WidgetDefinition } from './WidgetTypes';
import { widgetDefinitions } from './widgetDefinitions';

interface WidgetSelectorProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (widgetType: string) => void;
}

interface WidgetPreviewProps {
  widget: WidgetDefinition;
  selected: boolean;
  onClick: () => void;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ widget, selected, onClick }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        cursor: 'pointer',
        height: '100%',
        border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
        '&:hover': {
          boxShadow: 3,
          borderColor: selected ? theme.palette.primary.main : theme.palette.primary.light
        }
      }} 
      onClick={onClick}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {React.createElement(widget.icon, { sx: { fontSize: 24 } })}
          <Typography variant="h6" component="span">
            {widget.title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {widget.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Chip
            label={widget.type}
            size="small"
            color="primary"
            variant={selected ? "filled" : "outlined"}
          />
        </Box>
      </Box>
    </Paper>
  );
};

const WidgetSelector = ({
  anchorEl,
  onClose,
  onSelect,
}: WidgetSelectorProps) => {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const theme = useTheme();

  const handleSelect = () => {
    if (selectedWidget) {
      onSelect(selectedWidget);
      setSelectedWidget(null);
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '80vw',
          maxWidth: '1200px',
          maxHeight: '80vh'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          בחר ווידג'ט
        </Typography>
        <Grid container spacing={2}>
          {Object.values(widgetDefinitions).map((widget) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={widget.type}>
              <WidgetPreview
                widget={widget}
                selected={selectedWidget === widget.type}
                onClick={() => {
                  setSelectedWidget(widget.type);
                  onSelect(widget.type);
                  onClose();
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Menu>
  );
};

export default WidgetSelector;
