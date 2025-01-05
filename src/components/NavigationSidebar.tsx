import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

// Import your navigation icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ProjectIcon from '@mui/icons-material/Work';
import TaskIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LeadsIcon from '@mui/icons-material/ContactMail';
import SalesIcon from '@mui/icons-material/AttachMoney';
import SupportIcon from '@mui/icons-material/Support';
import WorkflowIcon from '@mui/icons-material/AccountTree';
import ChatIcon from '@mui/icons-material/Chat';
import TimeReportIcon from '@mui/icons-material/Timer';
import FormsIcon from '@mui/icons-material/Description';
import DocumentIcon from '@mui/icons-material/Article';
import ReportIcon from '@mui/icons-material/Report';
import PaymentIcon from '@mui/icons-material/Payment';

const navigation = [
  { name: 'לוח בקרה', href: '/', icon: DashboardIcon },
  { name: 'לקוחות', href: '/customers', icon: PeopleIcon },
  { name: 'פרויקטים', href: '/projects', icon: ProjectIcon },
  { name: 'משימות', href: '/tasks', icon: TaskIcon },
  { name: 'אנליטיקה', href: '/analytics', icon: AnalyticsIcon },
  { name: 'לידים', href: '/leads', icon: LeadsIcon },
  { name: 'מכירות', href: '/sales', icon: SalesIcon },
  { name: 'תמיכה', href: '/support', icon: SupportIcon },
  { name: 'תהליכי עבודה', href: '/workflows', icon: WorkflowIcon },
  { name: 'צ׳אט', href: '/chat', icon: ChatIcon },
  { name: 'הקצאת משימות', href: '/task-assignment', icon: TaskIcon },
  { name: 'דיווחי זמן', href: '/time-reports', icon: TimeReportIcon },
  { name: 'טפסים', href: '/forms', icon: FormsIcon },
  { name: 'מסמכים', href: '/documents', icon: DocumentIcon },
  { name: 'דוחות', href: '/reports', icon: ReportIcon },
  { name: 'תשלומים', href: '/payments', icon: PaymentIcon },
];

const NavigationSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Navigation Sidebar"
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo and Title */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 2, 
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
       
      </Box>

      {/* Navigation List */}
      <List 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          py: 0 
        }}
      >
        {navigation.map((item) => {
          const isSelected = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
            
          return (
            <ListItem 
              key={item.name} 
              disablePadding 
              sx={{ 
                direction: 'rtl',
                '& .MuiListItemButton-root': {
                  justifyContent: 'flex-end',
                }
              }}
            >
              <ListItemButton
                component={Link}
                to={item.href}
                selected={isSelected}
                sx={{
                  minHeight: 48,
                  mx: 1,
                  my: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemText 
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'right',
                  }}
                  sx={{ mr: 2 }}
                />
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isSelected ? 'white' : 'primary.main',
                    justifyContent: 'flex-start',
                  }}
                >
                  <item.icon />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default NavigationSidebar;
