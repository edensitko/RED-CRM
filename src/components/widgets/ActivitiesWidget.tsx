import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Activity } from '../../types/schemas';

interface ActivitiesWidgetProps {
  preview?: boolean;
  data?: any;
  onRefresh?: () => void;
  error?: string;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'create':
      return <PersonIcon />;
    case 'update':
      return <PersonIcon />;
    case 'delete':
      return <PersonIcon />;
    default:
      return <PersonIcon />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'create':
      return 'success';
    case 'update':
      return 'info';
    case 'delete':
      return 'error';
    default:
      return 'default';
  }
};

const ActivitiesWidget: React.FC<ActivitiesWidgetProps> = ({ preview = false, data, onRefresh, error }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preview) {
      // Show sample data in preview mode
      setActivities([
        {
          id: '1',
          type: 'lead',
          title: 'New Lead Created',
          description: 'John Doe from Company XYZ',
          timestamp: new Date(),
          status: 'new'
        },
        {
          id: '2',
          type: 'customer',
          title: 'Customer Updated',
          description: 'Profile updated for Jane Smith',
          timestamp: new Date(),
          status: 'updated'
        }
      ]);
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Your existing fetch logic here
        const fetchedActivities = data?.activities || [];
        setActivities(fetchedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [preview, data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">פעילות אחרונה</Typography>
        {onRefresh && (
          <Tooltip title="רענן">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <List dense>
        {activities.map((activity) => (
          <ListItem
            key={activity.id}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>
              {getActivityIcon(activity.type)}
            </ListItemIcon>
            <ListItemText
              primary={activity.type}
              secondary={
                <Box component="span">
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ display: 'block' }}
                  >
                    {activity.description}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </Typography>
                </Box>
              }
            />
            <Box sx={{ ml: 2 }}>
              <Chip
                label={activity.status}
                color={activity.status === 'completed' ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </ListItem>
        ))}
      </List>
      
      {activities.length === 0 && (
        <Typography variant="body2" color="text.secondary" align="center">
          אין פעילויות להצגה
        </Typography>
      )}
    </Box>
  );
};

export default ActivitiesWidget;
