import React from 'react';
import { Paper, Typography, Box, Avatar, Chip } from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const activities = [
  {
    id: 1,
    user: 'רונית כהן',
    avatar: 'RC',
    action: 'יצרה ליד חדש',
    target: 'חברת אלפא',
    type: 'ליד',
    time: '2025-01-01T22:30:00',
  },
  {
    id: 2,
    user: 'דני לוי',
    avatar: 'DL',
    action: 'סגר עסקה',
    target: 'חברת ביתא',
    type: 'מכירה',
    time: '2025-01-01T21:15:00',
  },
  {
    id: 3,
    user: 'מיכל רון',
    avatar: 'MR',
    action: 'קבעה פגישה',
    target: 'חברת גמא',
    type: 'פגישה',
    time: '2025-01-01T20:45:00',
  },
  {
    id: 4,
    user: 'יוסי כהן',
    avatar: 'YC',
    action: 'עדכן סטטוס',
    target: 'חברת דלתא',
    type: 'עדכון',
    time: '2025-01-01T19:30:00',
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'ליד':
      return 'primary';
    case 'מכירה':
      return 'success';
    case 'פגישה':
      return 'info';
    default:
      return 'default';
  }
};

const ActivityLogWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        לוג פעילות
      </Typography>
      <Box sx={{ mt: 2 }}>
        {activities.map((activity) => (
          <Box
            key={activity.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'background.default' },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{activity.avatar}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {activity.user}
                </Typography>
                <Typography variant="body2" sx={{ mx: 0.5 }}>
                  {activity.action}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {activity.target}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(activity.time), 'HH:mm', { locale: he })}
              </Typography>
            </Box>
            <Chip
              label={activity.type}
              size="small"
              color={getTypeColor(activity.type)}
              sx={{ ml: 1 }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ActivityLogWidget;
