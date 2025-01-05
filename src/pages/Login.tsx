import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { firebaseApp } from '../config/firebase';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  ThemeProvider, 
  createTheme, 
  Paper,
  IconButton,
  InputAdornment,
  CssBaseline
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Google as GoogleIcon 
} from '@mui/icons-material';
import logo from '../assets/logo.jpg';

// Create an RTL theme
const rtlTheme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
  palette: {
    primary: {
      main: '#ff4d4d',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& label.Mui-focused': {
            color: '#ff4d4d',
          },
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#ff4d4d',
            },
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = getAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('נא למלא את כל השדות');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      if (isSignup) {
        if (password !== confirmPassword) {
          setError('הסיסמאות אינן תואמות');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        dispatch(setUser(userCredential.user));
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        dispatch(setUser(userCredential.user));
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'אירעה שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      dispatch(setUser(userCredential.user));
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'אירעה שגיאה בהתחברות עם Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={rtlTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          backgroundColor: '#ff4d4d', 
          height: '100vh', 
          width: '100vw',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '20px',
          overflow: 'auto',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <Paper 
          elevation={10}
          sx={{
            width: '100%', 
            maxWidth: '450px', 
            borderRadius: '20px', 
            padding: '30px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 3 
            }}
          >
            <img 
              src={logo} 
              alt="לוגו" 
              style={{ 
                maxWidth: '150px', 
                borderRadius: '50%', 
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)', 
                marginBottom: '10px',
                objectFit: 'contain'
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                color: '#ff4d4d', 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px'
              }}
            >
              {isSignup ? 'הירשם למערכת CRM' : 'התחבר למערכת CRM'}
            </Typography>
            
            <Box 
              sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2 
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                label="אימייל"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                  }
                }}
              />
              <TextField
                fullWidth
                variant="outlined"
                label="סיסמה"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                  }
                }}
              />
              {isSignup && (
                <TextField
                  fullWidth
                  variant="outlined"
                  label="אשר סיסמה"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                    }
                  }}
                />
              )}
              
              {error && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'error.main', 
                    textAlign: 'center',
                    marginTop: '10px'
                  }}
                >
                  {error}
                </Typography>
              )}
              
              <Button 
                variant="contained" 
                onClick={handleEmailSignIn}
                disabled={loading}
                fullWidth
                sx={{
                  backgroundColor: '#ff4d4d', 
                  color: 'white', 
                  '&:hover': { 
                    backgroundColor: '#ff6b6b' 
                  },
                  padding: '15px',
                  borderRadius: '15px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  marginTop: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'טוען...' : (isSignup ? 'הירשם' : 'התחבר')}
              </Button>
              
              <Button 
                variant="text" 
                onClick={() => setIsSignup(!isSignup)}
                fullWidth
                sx={{
                  color: '#ff4d4d',
                  marginTop: '10px',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,77,77,0.1)',
                  }
                }}
              >
                {isSignup ? 'יש לך כבר חשבון? התחבר' : 'אין לך חשבון? הירשם'}
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleGoogleSignIn}
                disabled={loading}
                fullWidth
                startIcon={<GoogleIcon />}
                sx={{
                  backgroundColor: 'white', 
                  color: '#4285F4', 
                  '&:hover': { backgroundColor: '#f0f0f0' },
                  padding: '15px',
                  borderRadius: '15px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  marginTop: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'טוען...' : 'התחבר עם Google'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
