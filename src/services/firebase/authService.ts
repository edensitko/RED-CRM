import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { User as AppUser } from '../../types/schemas';

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign in error:', authError.message);
      throw new Error(this.getAuthErrorMessage(authError));
    }
  },

  async signUp(email: string, password: string, userData: Partial<AppUser>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const now = new Date();
      // Create user document in Firestore with all required fields
      const userDoc: AppUser = {
        id: user.uid,
        email: user.email || email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'user',
        phoneNumber: userData.phoneNumber || '',
        isActive: true,
        hireDate: now,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        updatedBy: user.uid,
        preferences: {
          language: 'he',
          theme: 'light',
          notifications: true,
          emailNotifications: true
        }
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);

      return user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign up error:', authError.message);
      throw new Error(this.getAuthErrorMessage(authError));
    }
  },

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create user document if not exists
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'user',
          isActive: true,
        });
      }

      return user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Google sign in error:', authError.message);
      throw new Error(this.getAuthErrorMessage(authError));
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign out error:', authError.message);
      throw new Error(this.getAuthErrorMessage(authError));
    }
  },

  getAuthErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'כתובת אימייל לא חוקית';
      case 'auth/user-disabled':
        return 'המשתמש נחסם';
      case 'auth/user-not-found':
        return 'משתמש לא נמצא';
      case 'auth/wrong-password':
        return 'סיסמה שגויה';
      case 'auth/email-already-in-use':
        return 'כתובת אימייל כבר בשימוש';
      case 'auth/weak-password':
        return 'סיסמה חלשה מדי';
      case 'auth/operation-not-allowed':
        return 'פעולה לא מאושרת';
      default:
        return 'שגיאה לא מוכרת. אנא נסה שוב';
    }
  },

  async getUserRole(uid: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data().role : null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  },
};
