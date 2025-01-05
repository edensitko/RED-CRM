import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../config/firebase';
import { persistor } from '../store';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = getAuth(firebaseApp);
  const authState = useSelector((state: RootState) => state.auth);

  const signOutUser = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      persistor.purge(); // Clear persisted state if needed
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  return {
    ...authState,
    signOut: signOutUser,
  };
};
