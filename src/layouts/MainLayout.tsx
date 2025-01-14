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
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';

import NavigationSidebar from '../components/NavigationSidebar';
import Sidebar from '../components/Sidebar';
import FloatingChatButton from '../components/FloatingChatButton';
import { NotesProvider } from '../contexts/NotesContext';
import { useAuth } from '../hooks/useAuth';
import LogoImage from '../assets/logo.jpg';

const Logo = styled('img')(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  objectFit: 'cover',
}));

const MainLayoutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  direction: 'rtl',
}));

const MainContent = styled('main')(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  width: '100%',
  height: 'calc(100vh - 64px)', // Subtract header height
  overflowY: 'hidden',
  flexDirection: 'row-reverse',
}));

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '12%',
  height: '100%',
  overflowY: 'auto',
  borderLeft: `1px solid ${theme.palette.divider}`,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  width: '76%', // 100% - (2 * 12%)
  height: '100%',
  overflowY: 'auto',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
  '& > *': {
    minHeight: '100%'
  }
}));

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
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
    // Navigate to settings page or open settings modal
    handleUserMenuClose();
  };

  return (
    <NotesProvider>
      <MainLayoutRoot>
        <CssBaseline />
        
        {/* Full-width Sticky Header */}
        <MuiAppBar 
          position="sticky"
          elevation={1}
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between', 
              minHeight: '64px !important', 
              px: 3, 
              py: 1,
              flexDirection: 'row', 
            }}
          >
            <Logo 
              src={LogoImage} 
              alt="Company Logo" 
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>
                {user?.displayName || 'User'}
              </Typography>
              <IconButton onClick={handleUserMenuOpen}>
                <Avatar
                  src={user?.photoURL || undefined}
                  alt={user?.displayName || undefined}
                  sx={{ 
                    width: 32, 
                    height: 32, 
                  }}
                />
              </IconButton>
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
            </Box>
          </Toolbar>
        </MuiAppBar>

        {/* Main Content Area */}
        <MainContent>
          {/* Right Navigation Sidebar (12%) */}
          <SidebarContainer>
            <NavigationSidebar />
          </SidebarContainer>

          {/* Central Content Area (76%) */}
          <ContentContainer>
            {children}
          </ContentContainer>

          {/* Left Notes Sidebar (12%) */}
          <SidebarContainer 
            sx={{ 
              borderRight: `1px solid ${theme.palette.divider}`,
              borderLeft: 'none' 
            }}
          >
            <Sidebar />
          </SidebarContainer>
        </MainContent>
        <FloatingChatButton />
      </MainLayoutRoot>
    </NotesProvider>
  );
};

export default MainLayout;
