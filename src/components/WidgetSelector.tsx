import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Typography,
  Paper,
  Popper,
  Fade,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  MonetizationOn as MonetizationOnIcon,
  CheckCircle as CheckCircleIcon,
  PieChart as PieChartIcon,
  Widgets as WidgetsIcon,
} from '@mui/icons-material';
import { getAllWidgetDefinitions, getWidgetDefinition } from './widgets/widgetDefinitions';

interface WidgetSelectorProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (widgetType: string) => void;
}

const iconMap: { [key: string]: React.ComponentType } = {
  Speed: SpeedIcon,
  History: HistoryIcon,
  Assessment: AssessmentIcon,
  Group: GroupIcon,
  People: PeopleIcon,
  MonetizationOn: MonetizationOnIcon,
  CheckCircle: CheckCircleIcon,
  PieChart: PieChartIcon,
};

const WidgetSelector: React.FC<WidgetSelectorProps> = ({
  anchorEl,
  onClose,
  onSelect,
}) => {
  const open = Boolean(anchorEl);
  const widgets = getAllWidgetDefinitions();
  const [previewWidget, setPreviewWidget] = useState<string | null>(null);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);

  // Dynamic icon component rendering
  const renderIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || WidgetsIcon;
    return <Icon />;
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>, widgetType: string) => {
    setPreviewWidget(widgetType);
    setPreviewAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setPreviewWidget(null);
    setPreviewAnchorEl(null);
  };

  const renderPreview = () => {
    if (!previewWidget) return null;

    const widget = getWidgetDefinition(previewWidget);
    if (!widget) return null;

    const WidgetComponent = widget.component;
    
    return (
      <Box sx={{ p: 2, width: 400 }}>
        <Typography variant="h6" gutterBottom>
          {widget.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {widget.description}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Default Size: {widget.defaultSize.w}x{widget.defaultSize.h}
        </Typography>
        <Paper sx={{ 
          mt: 2, 
          height: 200, 
          overflow: 'hidden',
          backgroundColor: 'background.paper'
        }}>
          <WidgetComponent preview />
        </Paper>
      </Box>
    );
  };

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          <List>
            {widgets.map((widget) => (
              <ListItem
                button
                key={widget.type}
                onClick={() => {
                  onSelect(widget.type);
                  onClose();
                }}
                onMouseEnter={(e) => handleMouseEnter(e, widget.type)}
                onMouseLeave={handleMouseLeave}
              >
                <ListItemIcon>
                  {renderIcon(widget.icon)}
                </ListItemIcon>
                <ListItemText
                  primary={widget.name}
                  secondary={widget.description}
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    fontWeight: 'medium',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      <Popper
        open={Boolean(previewWidget)}
        anchorEl={previewAnchorEl}
        placement="right-start"
        transition
        sx={{ 
          zIndex: 1301,
          ml: 1,
        }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper 
              elevation={4}
              sx={{ 
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {renderPreview()}
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default WidgetSelector;
