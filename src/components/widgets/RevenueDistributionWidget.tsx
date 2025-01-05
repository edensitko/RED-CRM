import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { ResponsivePie } from '@nivo/pie';

const data = [
  { id: 'מוצר א', value: 35, color: '#FF6B6B' },
  { id: 'מוצר ב', value: 25, color: '#4ECDC4' },
  { id: 'מוצר ג', value: 20, color: '#45B7D1' },
  { id: 'מוצר ד', value: 15, color: '#96CEB4' },
  { id: 'אחר', value: 5, color: '#FFEEAD' },
];

const RevenueDistributionWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        התפלגות הכנסות
      </Typography>
      <Box sx={{ height: 'calc(100% - 40px)' }}>
        <ResponsivePie
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          innerRadius={0.6}
          padAngle={0.7}
          cornerRadius={3}
          colors={{ datum: 'data.color' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          enableArcLinkLabels={false}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor="#ffffff"
        />
      </Box>
    </Paper>
  );
};

export default RevenueDistributionWidget;
