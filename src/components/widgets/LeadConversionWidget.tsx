import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';

const data = [
  {
    id: 'המרות',
    color: '#FF6B6B',
    data: [
      { x: 'ינו', y: 45 },
      { x: 'פבר', y: 52 },
      { x: 'מרץ', y: 48 },
      { x: 'אפר', y: 58 },
      { x: 'מאי', y: 62 },
      { x: 'יונ', y: 68 },
    ],
  },
];

const LeadConversionWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        המרת לידים
      </Typography>
      <Box sx={{ height: 'calc(100% - 40px)' }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 0, max: 100 }}
          curve="cardinal"
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            format: (v) => `${v}%`,
          }}
          enablePoints={true}
          pointSize={8}
          pointColor="#ffffff"
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableGridX={false}
          enableArea={true}
          areaOpacity={0.1}
          colors={['#FF6B6B']}
          theme={{
            axis: {
              ticks: {
                text: {
                  fontSize: 12,
                },
              },
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default LeadConversionWidget;
