import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  progress: number;
  color: string;
}

interface TeamPerformanceWidgetProps {
  preview?: boolean;
  data?: any;
  onRefresh: () => void;
}

const defaultTeamData = [
  { id: '1', name: 'דניאל כהן', avatar: 'DC', progress: 0, color: '#4CAF50' },
  { id: '2', name: 'רחל לוי', avatar: 'RL', progress: 0, color: '#2196F3' },
  { id: '3', name: 'משה גולן', avatar: 'MG', progress: 0, color: '#FF9800' },
  { id: '4', name: 'שירה אדרי', avatar: 'SA', progress: 0, color: '#9C27B0' },
];

const TeamPerformanceWidget: React.FC<TeamPerformanceWidgetProps> = ({ preview = false, data, onRefresh }) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preview) {
      // Show sample data in preview mode
      setTeamMembers([
        {
          id: '1',
          name: 'John Doe',
          role: 'Sales Manager',
          performance: 85,
          tasks: 12,
          deals: 5
        },
        {
          id: '2',
          name: 'Jane Smith',
          role: 'Sales Representative',
          performance: 92,
          tasks: 15,
          deals: 7
        }
      ]);
      setLoading(false);
      return;
    }

    const fetchTeamData = async () => {
      try {
        setLoading(true);
        if (data?.teamMembers) {
          setTeamMembers(data.teamMembers);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [preview, data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">ביצועי צוות</Typography>
        <Tooltip title="רענן">
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Paper sx={{ p: 2 }}>
        {teamMembers.length > 0 ? (
          <List>
            {teamMembers.map((member) => (
              <ListItem key={member.id}>
                <ListItemAvatar>
                  <Avatar>{member.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name}
                  secondary={member.role}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={`${member.performance}%`}
                    color={member.performance >= 80 ? 'success' : 'warning'}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Tasks: {member.tasks} | Deals: {member.deals}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No team members data available
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TeamPerformanceWidget;
