import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface QuickActionsWidgetProps {
  preview?: boolean;
  data?: any;
  onRefresh: () => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ preview = false, data, onRefresh }) => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preview) {
      // Show sample actions in preview mode
      setActions([
        {
          id: '1',
          title: 'New Lead',
          icon: <AddIcon />,
          onClick: () => console.log('New Lead clicked'),
        },
        {
          id: '2',
          title: 'Add Customer',
          icon: <PersonAddIcon />,
          onClick: () => console.log('Add Customer clicked'),
        },
        {
          id: '3',
          title: 'Create Task',
          icon: <TaskIcon />,
          onClick: () => console.log('Create Task clicked'),
        },
      ]);
      setLoading(false);
      return;
    }

    const loadActions = async () => {
      try {
        setLoading(true);
        if (data?.actions) {
          setActions(data.actions);
        } else {
          setActions([
            {
              id: 'add-lead',
              title: 'Add Lead',
              icon: <PersonIcon />,
              onClick: () => navigate('/leads/new'),
            },
            {
              id: 'add-customer',
              title: 'Add Customer',
              icon: <BusinessIcon />,
              onClick: () => navigate('/customers/new'),
            },
            {
              id: 'add-task',
              title: 'New Task',
              icon: <TaskIcon />,
              onClick: () => navigate('/tasks/new'),
            },
            {
              id: 'add-meeting',
              title: 'New Meeting',
              icon: <DocumentIcon />,
              onClick: () => navigate('/calendar/new'),
            },
            {
              id: 'send-email',
              title: 'Send Email',
              icon: <AddIcon />,
              onClick: () => window.location.href = 'mailto:',
            },
            {
              id: 'make-call',
              title: 'Make Call',
              icon: <AddIcon />,
              onClick: () => window.location.href = 'tel:',
            },
          ]);
        }
      } catch (error) {
        console.error('Error loading quick actions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActions();
  }, [preview, data, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (preview) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" gutterBottom>
          Quick Actions Preview
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="contained"
              color="primary"
              size="small"
              startIcon={action.icon}
              sx={{ pointerEvents: 'none', opacity: 0.7 }}
            >
              {action.title}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={2}>
        {actions.map((action) => (
          <Grid item xs={6} key={action.id}>
            <Button
              variant="outlined"
              startIcon={action.icon}
              onClick={action.onClick}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                py: 1.5,
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {action.title}
            </Button>
          </Grid>
        ))}
      </Grid>
      {actions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">
            No quick actions available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuickActionsWidget;
