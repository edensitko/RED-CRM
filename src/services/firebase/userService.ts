import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, AdminUser } from '../../types/schemas';

const USERS_COLLECTION = 'users';

export const userService = {
  async createUser(user: User | AdminUser): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(userRef, {
      ...user,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt),
      lastLogin: user.lastLogin ? Timestamp.fromDate(user.lastLogin) : null,
      hireDate: Timestamp.fromDate(user.hireDate),
    });
  },

  async updateUser(id: string, updates: Partial<User | AdminUser>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, id);
    const updateData = { ...updates, updatedAt: Timestamp.fromDate(new Date()) };
    await updateDoc(userRef, updateData);
  },

  async getUser(id: string): Promise<User | AdminUser | null> {
    const userRef = doc(db, USERS_COLLECTION, id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    return userSnap.data() as User | AdminUser;
  },

  async getAllUsers(): Promise<(User | AdminUser)[]> {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    return usersSnap.docs.map(doc => doc.data() as User | AdminUser);
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', 'admin')
    );
    const adminsSnap = await getDocs(q);
    return adminsSnap.docs.map(doc => doc.data() as AdminUser);
  },

  async getActiveUsers(): Promise<(User | AdminUser)[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('isActive', '==', true)
    );
    const usersSnap = await getDocs(q);
    return usersSnap.docs.map(doc => doc.data() as User | AdminUser);
  },

  async deleteUser(id: string): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: Timestamp.fromDate(new Date()),
      isActive: false,
    });
  },

  async hardDeleteUser(id: string): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(userRef);
  },

  async updateUserPreferences(
    id: string,
    preferences: User['preferences']
  ): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(userRef, { preferences });
  },

  async updateUserTargets(
    id: string,
    targets: NonNullable<User['targets']>
  ): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(userRef, { targets });
  },

  async getUsersByDepartment(department: string): Promise<(User | AdminUser)[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('department', '==', department),
      where('isActive', '==', true)
    );
    const usersSnap = await getDocs(q);
    return usersSnap.docs.map(doc => doc.data() as User | AdminUser);
  },
};
