import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  Link
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Import your navigation icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import TaskIcon from '@mui/icons-material/Task';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChatIcon from '@mui/icons-material/Chat';
import ArticleIcon from '@mui/icons-material/Article';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentIcon from '@mui/icons-material/Payment';
import HelpIcon from '@mui/icons-material/Help';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const navigation = [
  { name: 'לוח בקרה', href: '/', icon: DashboardIcon },
  { name: 'לקוחות', href: '/customers', icon: PeopleIcon },
  { name: 'פרויקטים', href: '/projects', icon: FolderIcon },
  { name: 'המשימות שלי', href: '/tasks', icon: TaskIcon },
  { name: 'דיווחי זמן', href: '/time-reports', icon: AccessTimeIcon },
  { name: 'ניהול משימות', href: '/task-assignments', icon: TaskAltIcon },
  { name: 'רעיונות', href: '/ideas', icon: EmojiObjectsIcon },
  { name: 'אנליטיקה', href: '/analytics', icon: BarChartIcon },
  { name: 'לידים', href: '/leads', icon: ContactMailIcon },
  { name: 'טפסים', href: '/forms', icon: DescriptionIcon },
  { name: 'מכירות', href: '/sales', icon: AttachMoneyIcon },
  { name: 'תמיכה', href: '/support', icon: HelpIcon },
  { name: 'תהליכי עבודה', href: '/workflows', icon: AccountTreeIcon },
  { name: 'צ׳אט', href: '/chat', icon: ChatIcon },
  { name: 'מסמכים', href: '/documents', icon: ArticleIcon },
  { name: 'דוחות', href: '/reports', icon: AssessmentIcon },
  { name: 'תשלומים', href: '/payments', icon: PaymentIcon },
];

const NavigationSidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = currentUser?.displayName || 'אורח';
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
      greeting = ' ☀️ , בוקר טוב';
    } else if (hour >= 12 && hour < 17) {
      greeting = ' 🌤️ , צהריים טובים';
    } else if (hour >= 17 && hour < 21) {
      greeting = ' 🌅 , ערב טוב';
    } else {
      greeting = ' 🌙 , לילה טוב';
    }

    return (
      <Box>
        <Typography>{greeting}</Typography>
        <Typography>{userName}</Typography>
      </Box>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="Navigation Sidebar"
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'background.default',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 1, textAlign: 'left' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#fff',
            fontWeight: 600,
            fontSize: '1.2rem',
            mb: 1
          }}
        >
          {getGreeting()}
        </Typography>
      </Box>
      <List component="nav" sx={{ flex: 1, py: 0, direction: 'rtl' }} >
        {navigation.map((item) => {
          const isSelected = 
            item.href === '/' 
              ? location.pathname === '/' || location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href);
            
          return (
            <ListItem 
              key={item.name} 
              disablePadding 
            
                sx={{ 
                '& .MuiListItemIcon-root': {
                  mx: 1,

                },  
               
              }}
            >
              <ListItemButton

                component={Link}
                href={item.href}
                selected={isSelected}
                sx={{
                  minHeight: 65,
                  mx: 0.0,
                  my: 0.5,
                  py: 1,
                  px: 1,
                  borderRadius: 3,
                  color: '#fff',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isSelected ? '#ef4444' : '#fff',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 100,
                    color: isSelected ? '#ef4444' : '#fff',
                    display: 'flex',
                    width: '100%',
                    fontSize: 28,
                    '& .MuiSvgIcon-root': {
                      fontSize: 26,
                      color: isSelected ? '#ef4444' : '#fff'
                    }
                  }}
                >  
                  <item.icon />
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 600,
                      textAlign: 'left',
                      color: isSelected ? '#ef4444' : '#fff'
                    }}
                    sx={{ ml: 1 }}
                  />
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
