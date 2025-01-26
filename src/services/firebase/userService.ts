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
import { User } from '../../types/schemas';

const USERS_COLLECTION = 'users';

export const userService = {
  async createUser(user: User ): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: Timestamp.fromDate(user.updatedAt.toDate()),
    });
  },

  async updateUser(id: string, updates: Partial<User >): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, id);
    const updateData = { ...updates, updatedAt: Timestamp.fromDate(new Date()) };
    await updateDoc(userRef, updateData);
  },

  async getUser(id: string): Promise<User | null> {
    const userRef = doc(db, USERS_COLLECTION, id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    return userSnap.data() as User ;
  },

  async getAllUsers(): Promise<(User )[]> {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    return usersSnap.docs.map(doc => doc.data() as User );
  },


  async getActiveUsers(): Promise<(User )[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('isActive', '==', true)
    );
    const usersSnap = await getDocs(q);
    return usersSnap.docs.map(doc => doc.data() as User);
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

 
 

  async getUsersByDepartment(department: string): Promise<(User)[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('department', '==', department),
      where('isActive', '==', true)
    );
    const usersSnap = await getDocs(q);
    return usersSnap.docs.map(doc => doc.data() as User );
  },
};
