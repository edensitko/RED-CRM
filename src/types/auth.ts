import { User } from 'firebase/auth';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
}

export interface UserRole {
  id: string;
  role: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
