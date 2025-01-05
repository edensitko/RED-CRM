import React from 'react';
import { Paper, Typography, Box, LinearProgress } from '@mui/material';

const products = [
  { name: 'חבילה בסיסית', sales: 245, progress: 85, color: '#4CAF50' },
  { name: 'חבילה מתקדמת', sales: 187, progress: 65, color: '#2196F3' },
  { name: 'חבילה עסקית', sales: 142, progress: 50, color: '#FF9800' },
  { name: 'חבילת פרימיום', sales: 98, progress: 35, color: '#9C27B0' },
  { name: 'שירותי ייעוץ', sales: 76, progress: 25, color: '#F44336' },
];

const TopProductsWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        מוצרים מובילים
      </Typography>
      <Box sx={{ mt: 2 }}>
        {products.map((product) => (
          <Box key={product.name} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{product.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {product.sales} מכירות
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={product.progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: `${product.color}22`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: product.color,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TopProductsWidget;
