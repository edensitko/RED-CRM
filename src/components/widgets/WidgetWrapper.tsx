import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { LayoutItem } from './WidgetTypes';
import { widgetDefinitions } from './widgetDefinitions';

interface WidgetWrapperProps {
  item: LayoutItem;
  onRemove: (id: string) => void;
  onLockToggle: (id: string) => void;
  onEdit?: (id: string) => void;
  isLocked?: boolean;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  item,
  onRemove,
  onLockToggle,
  onEdit,
  isLocked = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRemove = () => {
    handleClose();
    onRemove(item.i);
  };

  const handleLockToggle = () => {
    handleClose();
    onLockToggle(item.i);
  };

  const handleEdit = () => {
    handleClose();
    onEdit?.(item.i);
  };

  const widgetDef = widgetDefinitions[item.widget];

  return (
    <Paper
      elevation={isHovered ? 4 : 1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease-in-out',
        position: 'relative',
        '&:hover': {
          '& .widget-actions': {
            opacity: 1,
          },
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        className="widget-actions"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          zIndex: 1,
          backgroundColor: 'background.paper',
          borderRadius: '50%',
          boxShadow: 2,
        }}
      >
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>הגדרות</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleLockToggle}>
          <ListItemIcon>
            {item.static ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{item.static ? 'בטל נעילה' : 'נעל'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>הסר</ListItemText>
        </MenuItem>
      </Menu>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {widgetDef?.component ? (
          <widgetDef.component settings={item.settings} />
        ) : (
          <Box>Widget not found: {item.widget}</Box>
        )}
      </Box>
    </Paper>
  );
};
