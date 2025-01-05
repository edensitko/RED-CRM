import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import {
  Box,
  Paper,
  IconButton,
  Button,
  Typography,
  Tooltip,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { getDashboardLayout, saveDashboardLayout } from '../services/firebase/dashboardService';
import WidgetSelector from '../components/widgets/WidgetSelector';
import { getWidgetDefinition } from '../components/widgets/widgetDefinitions';
import useDashboardWidgetData from '../hooks/useDashboardWidgetData';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import ActivitiesWidget from '../components/widgets/ActivitiesWidget';
import CustomersWidget from '../components/widgets/CustomersWidget';
import LeadsWidget from '../components/widgets/LeadsWidget';
import SalesOverviewWidget from '../components/widgets/SalesOverviewWidget';
import TasksWidget from '../components/widgets/TasksWidget';
import TeamPerformanceWidget from '../components/widgets/TeamPerformanceWidget';
import RevenueDistributionWidget from '../components/widgets/RevenueDistributionWidget';
import QuickActionsWidget from '../components/widgets/QuickActionsWidget';
import ReportsWidget from '../components/widgets/ReportsWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const widgetComponents: Record<string, React.ComponentType<any>> = {
  quickActions: QuickActionsWidget,
  activities: ActivitiesWidget,
  reports: ReportsWidget,
  teamPerformance: TeamPerformanceWidget,
  customers: CustomersWidget,
  sales: SalesOverviewWidget,
  tasks: TasksWidget,
  leads: LeadsWidget,
  revenueDistribution: RevenueDistributionWidget,
};

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  widget: string;
  settings: any;
  moved?: boolean;
  static?: boolean;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { data: widgetData, refreshData } = useDashboardWidgetData();
  const [layouts, setLayouts] = useState<{ [key: string]: LayoutItem[] }>({});
  const [currentLayout, setCurrentLayout] = useState<LayoutItem[]>([]);
  const [isLayoutLocked, setIsLayoutLocked] = useState(true);
  const [widgetSelectorAnchor, setWidgetSelectorAnchor] = useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadLayout = async () => {
      if (currentUser) {
        try {
          const savedLayout = await getDashboardLayout(currentUser.uid);
          if (savedLayout && savedLayout.length > 0) {
            setCurrentLayout(savedLayout);
            setLayouts({
              lg: savedLayout,
              md: savedLayout.map(item => ({ ...item })),
              sm: savedLayout.map(item => ({ ...item })),
              xs: savedLayout.map(item => ({ ...item })),
              xxs: savedLayout.map(item => ({ ...item })),
            });
          }
        } catch (error) {
          console.error('Error loading layout:', error);
          showSnackbar('Error loading dashboard layout', 'error');
        }
      }
    };
    loadLayout();
  }, [currentUser, showSnackbar]);

  const handleOpenWidgetSelector = (event: React.MouseEvent<HTMLElement>) => {
    setWidgetSelectorAnchor(event.currentTarget);
  };

  const handleCloseWidgetSelector = () => {
    setWidgetSelectorAnchor(null);
  };

  const handleAddWidget = useCallback((widgetType: string) => {
    const widgetDef = getWidgetDefinition(widgetType);
    if (!widgetDef) {
      showSnackbar('Invalid widget type', 'error');
      return;
    }

    const newId = `widget-${Date.now()}`;
    const newWidget: LayoutItem = {
      i: newId,
      x: 0,
      y: currentLayout.length,
      w: 6,
      h: 4,
      minW: 2,
      minH: 2,
      widget: widgetType,
      settings: {},
      moved: false,
      static: false,
    };

    const newLayout = [...currentLayout, newWidget];
    setCurrentLayout(newLayout);
    setLayouts(prevLayouts => ({
      ...prevLayouts,
      lg: newLayout,
      md: newLayout.map(item => ({ ...item })),
      sm: newLayout.map(item => ({ ...item })),
      xs: newLayout.map(item => ({ ...item })),
      xxs: newLayout.map(item => ({ ...item })),
    }));
    saveDashboardLayout(currentUser?.uid || '', newLayout);
    showSnackbar('Widget added successfully', 'success');
  }, [currentLayout, currentUser, showSnackbar]);

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    try {
      const newLayout = currentLayout.filter(item => item.i !== widgetId);
      setCurrentLayout(newLayout);
      setLayouts(prevLayouts => ({
        ...prevLayouts,
        lg: newLayout,
        md: newLayout.map(item => ({ ...item })),
        sm: newLayout.map(item => ({ ...item })),
        xs: newLayout.map(item => ({ ...item })),
        xxs: newLayout.map(item => ({ ...item })),
      }));
      await saveDashboardLayout(currentUser?.uid || '', newLayout);
      showSnackbar('Widget removed successfully', 'success');
    } catch (error) {
      console.error('Error removing widget:', error);
      showSnackbar('Failed to remove widget', 'error');
    }
  }, [currentLayout, currentUser, showSnackbar]);

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (!isLayoutLocked) {
      const updatedLayout = layout.map((item) => ({
        ...item,
        widget: (currentLayout.find(l => l.i === item.i) as LayoutItem)?.widget || '',
        settings: (currentLayout.find(l => l.i === item.i) as LayoutItem)?.settings || {},
      }));

      setCurrentLayout(updatedLayout);
      setLayouts(prevLayouts => ({
        ...prevLayouts,
        lg: updatedLayout,
        md: updatedLayout.map(item => ({ ...item })),
        sm: updatedLayout.map(item => ({ ...item })),
        xs: updatedLayout.map(item => ({ ...item })),
        xxs: updatedLayout.map(item => ({ ...item })),
      }));

      saveDashboardLayout(currentUser?.uid || '', updatedLayout).catch(error => {
        console.error('Error saving layout:', error);
        showSnackbar('Failed to save layout changes', 'error');
      });
    }
  }, [isLayoutLocked, currentLayout, currentUser, showSnackbar]);

  const renderWidget = useCallback((item: LayoutItem) => {
    const WidgetComponent = widgetComponents[item.widget];
    if (!WidgetComponent) return null;

    const widgetDataForItem = widgetData?.[item.widget];

    return (
      <Box sx={{ height: '100%', position: 'relative' }}>
        <Paper 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            p: 0,
          }}
        >
          {!isLayoutLocked && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleRemoveWidget(item.i)}
                sx={{
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          <Box className="drag-handle" sx={{ cursor: !isLayoutLocked ? 'move' : 'default', height: '100%' }}>
            <WidgetComponent
              data={widgetDataForItem}
              settings={item.settings}
              onRefresh={refreshData}
            />
          </Box>
        </Paper>
      </Box>
    );
  }, [isLayoutLocked, widgetData, handleRemoveWidget, refreshData]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenWidgetSelector}
            color="primary"
          >
            הוסף ווידג'ט
          </Button>
          <IconButton
            onClick={() => setIsLayoutLocked(!isLayoutLocked)}
            color={isLayoutLocked ? 'default' : 'primary'}
            sx={{ ml: 1 }}
          >
            {isLayoutLocked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Box>

        <TextField
          size="small"
          placeholder="חפש ווידג'טים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: '300px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Content Section */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: 'background.default'
        }}
      >
        {currentLayout.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '50%',
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              }}
            >
              <DashboardIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              הלוח שלך ריק
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              הוסף ווידג'טים כדי להתחיל להתאים אישית את הלוח שלך
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenWidgetSelector}
            >
              הוסף את הווידג'ט הראשון שלך
            </Button>
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1800, md: 1200, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
            rowHeight={60}
            isDraggable={!isLayoutLocked}
            isResizable={!isLayoutLocked}
            draggableHandle=".drag-handle"
            margin={[16, 16]}
            containerPadding={[16, 16]}
            useCSSTransforms={true}
          >
            {currentLayout.map((item) => (
              <Box key={item.i} className="widget-container">
                {renderWidget(item)}
              </Box>
            ))}
          </ResponsiveGridLayout>
        )}
      </Box>

      <WidgetSelector
        anchorEl={widgetSelectorAnchor}
        onClose={handleCloseWidgetSelector}
        onSelect={(widgetType) => {
          handleAddWidget(widgetType);
          handleCloseWidgetSelector();
        }}
      />
    </Box>
  );
};

export default Dashboard;
