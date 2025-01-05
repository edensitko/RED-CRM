import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetProps } from './WidgetTypes';

interface SalesOverviewWidgetProps {
  data?: {
    sales?: {
      month: string;
      value: number;
    }[];
  };
  loading?: boolean;
  error?: any;
  onRefresh?: () => void;
  settings?: Record<string, any>;
  preview?: boolean;
}

const defaultData = [
  { month: 'ינואר', value: 0 },
  { month: 'פברואר', value: 0 },
  { month: 'מרץ', value: 0 },
  { month: 'אפריל', value: 0 },
  { month: 'מאי', value: 0 },
  { month: 'יוני', value: 0 },
];

const previewData = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
];

const SalesOverviewWidget: React.FC<SalesOverviewWidgetProps> = ({ 
  data,
  loading = false,
  error = null,
  onRefresh,
  settings,
  preview = false,
}) => {
  const chartData = preview ? previewData : (data?.sales || defaultData);

  if (error) {
    return (
      <Box sx={{ height: '100%', p: 2 }}>
        <Typography variant="h6" gutterBottom align="right">
          סקירת מכירות
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message || 'Failed to load sales data'}
        </Alert>
      </Box>
    );
  }

  if (preview) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" gutterBottom>
          Sales Overview Preview
        </Typography>
        <Box sx={{ height: 150, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={preview ? "sales" : "value"} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Sales Overview
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={preview ? "sales" : "value"} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default SalesOverviewWidget;
