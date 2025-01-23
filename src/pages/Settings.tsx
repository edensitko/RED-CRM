import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  useTheme,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [language, setLanguage] = React.useState('he');

  const handleSaveSettings = () => {
    // TODO: Implement settings save functionality
    console.log('Settings saved');
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'right' }}>
        הגדרות
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  פרופיל
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="שם מלא"
                  defaultValue={user?.displayName || ''}
                  fullWidth
                  variant="outlined"
                  dir="rtl"
                />
                <TextField
                  label="אימייל"
                  defaultValue={user?.email || ''}
                  fullWidth
                  variant="outlined"
                  dir="rtl"
                  disabled
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  התראות
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    color="primary"
                  />
                }
                label="התראות במייל"
                sx={{ width: '100%', justifyContent: 'space-between' }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaletteIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  תצוגה
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    color="primary"
                  />
                }
                label="מצב כהה"
                sx={{ width: '100%', justifyContent: 'space-between' }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Language Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  שפה
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <TextField
                select
                fullWidth
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                SelectProps={{
                  native: true,
                }}
                variant="outlined"
                dir="rtl"
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </TextField>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSaveSettings}
          sx={{ minWidth: 200 }}
        >
          שמור שינויים
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;
