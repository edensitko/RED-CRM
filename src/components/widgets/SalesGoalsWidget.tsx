import React from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

const goals = [
  {
    title: 'יעד מכירות שנתי',
    current: 850000,
    target: 1000000,
    progress: 85,
    color: '#4CAF50',
  },
  {
    title: 'יעד לקוחות חדשים',
    current: 45,
    target: 60,
    progress: 75,
    color: '#2196F3',
  },
  {
    title: 'יעד הכנסה חודשית',
    current: 75000,
    target: 100000,
    progress: 75,
    color: '#FF9800',
  },
];

const SalesGoalsWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        יעדי מכירות
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
        {goals.map((goal) => (
          <Box
            key={goal.title}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <CircularProgress
                variant="determinate"
                value={goal.progress}
                size={80}
                thickness={4}
                sx={{ color: goal.color }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(goal.progress)}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {goal.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {goal.current.toLocaleString('he-IL')} / {goal.target.toLocaleString('he-IL')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default SalesGoalsWidget;
