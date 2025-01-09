import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout, setUser } from '../store/authSlice';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { persistor } from '../store';
import { useEffect } from 'react';
import { authService } from '../services/firebase/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setUser(user));
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  const signOutUser = async () => {
    try {
      console.log('Starting sign out process');
      console.log('Current auth state:', { 
        isAuthenticated: authState.isAuthenticated, 
        user: authState.user?.uid 
      });

      // Sign out from Firebase
      await authService.signOut();
      console.log('Firebase sign out successful');

      // Dispatch logout action to Redux
      dispatch(logout());
      console.log('Redux logout action dispatched');

      // Clear persisted state
      await persistor.purge();
      console.log('Persisted state purged');

      // Additional cleanup if needed
      window.location.href = '/login'; // Force redirect to login page
    } catch (error) {
      console.error('Detailed sign out error:', error);
      
      // Force logout even if Firebase sign out fails
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const signInWithEmailAndPassword = async (email: string, password: string) => {
    try {
      const user = await authService.signIn(email, password);
      dispatch(setUser(user));
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const user = await authService.signInWithGoogle();
      dispatch(setUser(user));
      return user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  return {
    ...authState,
    signOut: signOutUser,
    signIn: signInWithEmailAndPassword,
    signInWithGoogle,
  };
};
