import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotesProvider } from './contexts/NotesContext';
import { theme } from './theme/theme';
import { RTL } from './theme/rtl';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Analytics from './pages/Analytics';
import Leads from './pages/Leads';
import Sales from './pages/Sales';
import Support from './pages/Support';
import Workflows from './pages/Workflows';
import Chat from './pages/Chat';
import TaskAssignment from './pages/TaskAssignment';
import TimeReports from './pages/TimeReports';
import Forms from './pages/Forms';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Payments from './pages/Payments';
import WideScreenMessage from './pages/WideScreenMessage';
import NotFound from './pages/NotFound'; 
import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { SnackbarProvider } from 'notistack';
import Ideas from './pages/Ideas';
import StylesScreen from './styles/globalexample';
import ChatPage from './pages/ChatPage';

// Debug component to log route changes
const RouteLogger = () => {
  const location = useLocation();
  if (process.env.NODE_ENV === 'development') {
    console.log('Current route:', location.pathname);
  }
  return null;
};

const routes = [
  { path: '/', element: <Navigate to="/dashboard" /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/customers', element: <Customers /> },
  { path: '/projects', element: <Projects /> },
  { path: '/tasks', element: <Tasks /> },
  { path: '/analytics', element: <Analytics /> },
  { path: '/leads', element: <Leads /> },
  { path: '/sales', element: <Sales /> },
  { path: '/support', element: <Support /> },
  { path: '/workflows', element: <Workflows /> },
  { path: '/ideas', element: <Ideas /> },
  { path: '/chat', element: <Chat /> },
  { path: '/task-assignment', element: <TaskAssignment /> },
  { path: '/time-reports', element: <TimeReports /> },
  { path: '/forms', element: <Forms /> },
  { path: '/documents', element: <Documents /> },
  { path: '/reports', element: <Reports /> },
  { path: '/payments', element: <Payments /> },
  { path: '/task-assignments', element: <TaskAssignment /> },
  // { path: '/example', element: <StylesScreen /> },
  { path: '*', element: <NotFound /> },
];

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'red',
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        color: 'white',
        fontSize: '24px',
      }}>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  console.log('App component rendered');

  if (loading) {
    console.log('Loading state active');
    return <LoadingScreen />;
  }

  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isWideScreen) {
    console.log('Rendering WideScreenMessage');
    return <WideScreenMessage />;
  }

  console.log('Rendering main app');
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <RTL>
              <CssBaseline />
              <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
                <NotesProvider>
                  <ChatProvider>
                    <RouteLogger />
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/*"
                        element={
                          currentUser ? (
                            <ProtectedRoute>
                              <MainLayout>
                                <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
                                  <Routes>
                                    {routes.map((route) => (
                                      <Route
                                        key={route.path}
                                        path={route.path}
                                        element={route.element}
                                      />
                                    ))}
                                    <Route path="/customers" element={<Customers />} />
                                    <Route path="/tasks" element={<TaskAssignment />} />
                                    <Route path="/chat" element={<ChatPage />} />
                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </SnackbarProvider>
                              </MainLayout>
                            </ProtectedRoute>
                          ) : (
                            <Navigate to="/login" />
                          )
                        }
                      />
                    </Routes>
                  </ChatProvider>
                </NotesProvider>
              </SnackbarProvider>
            </RTL>
          </ThemeProvider>
        </StyledEngineProvider>
      </PersistGate>
    </Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </AuthProvider>
  );
}

function Root() {
  console.log('Root component rendered');
  return (
    <Router>
      <App />
    </Router>
  );
}

export default Root;