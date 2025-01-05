import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google sign in successful:', result.user);

    // Check if user exists in database
    const userDoc = doc(db, 'users', result.user.uid);
    const userSnapshot = await getDoc(userDoc);

    if (!userSnapshot.exists()) {
      // Create new user document with default settings
      await setDoc(userDoc, {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      // Create default dashboard settings
      const dashboardDoc = doc(db, `users/${result.user.uid}/settings/dashboard`);
      await setDoc(dashboardDoc, {
        layouts: [],
        isLocked: true
      });
    } else {
      // Update last login
      await updateDoc(userDoc, {
        lastLogin: serverTimestamp(),
      });
    }

    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, 'users', result.user.uid), {
      lastLogin: serverTimestamp(),
    });
    return result.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

const signUp = async (email: string, password: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    
    // Create user document
    await setDoc(doc(db, 'users', result.user.uid), {
      id: result.user.uid,
      email: result.user.email,
      name: name,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    // Create default dashboard settings
    await setDoc(doc(db, `users/${result.user.uid}/settings/dashboard`), {
      layouts: [],
      isLocked: true
    });

    return result.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export default {
  signInWithGoogle,
  signIn,
  signUp,
  signOut,
  onAuthStateChanged,
};
