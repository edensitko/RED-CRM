import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
}

interface ReportsWidgetProps {
  preview?: boolean;
  data?: any;
  onRefresh?: () => void;
}

const ReportsWidget: React.FC<ReportsWidgetProps> = ({ preview = false, data, onRefresh }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preview) {
      // Show sample reports in preview mode
      setReports([
        {
          id: '1',
          title: 'Monthly Revenue',
          description: 'Total revenue for current month',
          icon: <MoneyIcon />,
          value: '$45,678',
          trend: 'up',
        },
        {
          id: '2',
          title: 'Active Customers',
          description: 'Number of active customers',
          icon: <PeopleIcon />,
          value: '234',
          trend: 'stable',
        },
        {
          id: '3',
          title: 'Sales Growth',
          description: 'Year over year growth',
          icon: <TrendingUpIcon />,
          value: '15%',
          trend: 'up',
        },
      ]);
      setLoading(false);
      return;
    }

    const loadReports = async () => {
      try {
        setLoading(true);
        if (data?.reports) {
          setReports(data.reports);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [preview, data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Reports & Analytics
        </Typography>
        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {reports.length > 0 ? (
        <List>
          {reports.map((report) => (
            <ListItem key={report.id}>
              <ListItemIcon>
                {report.icon || <ReportIcon />}
              </ListItemIcon>
              <ListItemText
                primary={report.title}
                secondary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {report.description}
                    {report.value && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="primary"
                        sx={{ fontWeight: 'medium' }}
                      >
                        {report.value}
                      </Typography>
                    )}
                    {report.trend && (
                      <TrendingUpIcon
                        sx={{
                          color: report.trend === 'up' ? 'success.main' : 
                                report.trend === 'down' ? 'error.main' : 
                                'warning.main',
                          fontSize: 16,
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">
            No reports available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ReportsWidget;
