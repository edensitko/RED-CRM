import React, { useState } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';

import NavigationSidebar from '../components/NavigationSidebar';
import Sidebar from '../components/Sidebar';
import FloatingChatButton from '../components/FloatingChatButton';
import { useAuth } from '../hooks/useAuth';
import LogoImage from '../assets/logo.jpg';
import { CacheProvider } from '@emotion/react';
import { cacheRtl } from '../theme/rtl';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ef4444', // red color
    },
    secondary: {
      main: '#64748b', // slate-500
    },
    background: {
      default: '#0A0A0A', // darker than black
      paper: '#141414', // slightly lighter black for cards
    },
    text: {
      primary: '#ffffff',
      secondary: '#94A3B8', // slate-400
    },
    divider: '#1F2937', // gray-800
  },
  direction: 'rtl',
});

const MainLayoutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  direction: 'rtl',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const TopBar = styled('header')(({ theme }) => ({
  height: '64px',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  alignItems: 'center',
  padding: '0 1.5rem',
  justifyContent: 'space-between',
}));

const MainContent = styled('main')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row-reverse',
  flex: 1,
  overflow: 'hidden',
}));

const SidebarContainer = styled('aside')(({ theme }) => ({
  width: '12%',
  height: '100%',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  padding: '1rem',
}));

const ContentArea = styled('div')(({ theme }) => ({
  flex: 1,
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  overflow: 'auto',
  padding: '10px',
  margin: '10px',
  borderRadius: 30,
}));

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      handleUserMenuClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettings = () => {
    // open the modal page in modal 
    navigate('/settings');
    handleUserMenuClose();
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ display: 'flex', direction: 'rtl' }}>
          <CssBaseline />
          <MainLayoutRoot>
            <TopBar>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={LogoImage} alt="Logo" style={{ height: '40px' }} />
              
                <Link to="/">

                </Link>
                <Tooltip title="חזרה לדף הבית">
                  <IconButton onClick={() => navigate('/')}>
                    <PublicIcon />
                  </IconButton>
                </Tooltip>
                
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <IconButton>
                  <SearchIcon />
                </IconButton>
                <IconButton>
                  <NotificationsIcon />
                </IconButton>
                <IconButton onClick={handleUserMenuOpen}>
                  <SettingsIcon />
                </IconButton>
                <Avatar sx={{ width: 32, height: 32 }} src={user?.photoURL || undefined} alt={user?.displayName || undefined} />
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleSettings}>הגדרות</MenuItem>
                  <MenuItem onClick={handleLogout}>התנתק</MenuItem>
                </Menu>
              </div>
            </TopBar>
            <MainContent>
              <SidebarContainer>
                <NavigationSidebar />
              </SidebarContainer>
              <ContentArea>
                {children}
              </ContentArea>
            
            </MainContent>
            <FloatingChatButton />
          </MainLayoutRoot>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MainLayout;
