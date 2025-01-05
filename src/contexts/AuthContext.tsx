import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import firebase from '../services/firebase';
import { db } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = firebase.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUserRole(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      await firebase.signIn(email, password);
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await firebase.signUp(email, password, name);
      navigate('/');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await firebase.signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebase.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userRole,
    signIn,
    signOut,
    signUp,
    signInWithGoogle,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
