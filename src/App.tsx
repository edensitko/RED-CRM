import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
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
import Sidebar from './components/Sidebar';
import WideScreenMessage from './pages/WideScreenMessage';
import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createStore, combineReducers } from 'redux';
import { store, persistor } from './store';
import { SnackbarProvider } from './contexts/SnackbarContext';

// Debug component to log route changes
const RouteLogger = () => {
  const location = useLocation();
  if (process.env.NODE_ENV === 'development') {
    console.log('Current route:', location.pathname);
  }
  return null;
};

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/customers', element: <Customers /> },
  { path: '/projects', element: <Projects /> },
  { path: '/tasks', element: <Tasks /> },
  { path: '/analytics', element: <Analytics /> },
  { path: '/leads', element: <Leads /> },
  { path: '/sales', element: <Sales /> },
  { path: '/support', element: <Support /> },
  { path: '/workflows', element: <Workflows /> },
  { path: '/chat', element: <Chat /> },
  { path: '/task-assignment', element: <TaskAssignment /> },
  { path: '/time-reports', element: <TimeReports /> },
  { path: '/forms', element: <Forms /> },
  { path: '/documents', element: <Documents /> },
  { path: '/reports', element: <Reports /> },
  { path: '/payments', element: <Payments /> },
];

function App() {
  const [showMigration, setShowMigration] = useState(true);
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1100);

  const handleMigrationComplete = () => {
    setShowMigration(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <RTL>
              <CssBaseline />
              <Router>
                {isWideScreen ? (
                  <AuthProvider>
                    <ChatProvider>
                      <NotesProvider>
                        <SnackbarProvider>
                          <RouteLogger />
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={
                              <ProtectedRoute>
                                <>
                                  <MainLayout />
                                </>
                              </ProtectedRoute>
                            }>
                              {routes.map(({ path, element }) => (
                                <Route
                                  key={path}
                                  path={path === '/' ? '' : path}
                                  element={element}
                                />
                              ))}
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </SnackbarProvider>
                      </NotesProvider>
                    </ChatProvider>
                  </AuthProvider>
                ) : (
                  <WideScreenMessage />
                )}
              </Router>
            </RTL>
          </ThemeProvider>
        </StyledEngineProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
