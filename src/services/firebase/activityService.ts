import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Activity } from '../../types/schemas';

const ACTIVITIES_COLLECTION = 'activities';

const convertActivityFromFirestore = (doc: DocumentData): Activity => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    completedAt: data.completedAt?.toDate() || null,
    dueDate: data.dueDate?.toDate() || null,
  };
};

export const activityService = {
  async logActivity(activity: Activity): Promise<void> {
    const activityRef = doc(db, ACTIVITIES_COLLECTION, activity.id);
    await setDoc(activityRef, {
      ...activity,
      createdAt: Timestamp.fromDate(activity.createdAt),
      completedAt: activity.completedAt ? Timestamp.fromDate(activity.completedAt) : null,
      dueDate: activity.dueDate ? Timestamp.fromDate(activity.dueDate) : null,
    });
  },

  async getActivity(id: string): Promise<Activity | null> {
    const activityRef = doc(db, ACTIVITIES_COLLECTION, id);
    const activityDoc = await getDoc(activityRef);
    if (!activityDoc.exists()) return null;
    return convertActivityFromFirestore(activityDoc);
  },

  async getRecentActivities(limitCount?: number): Promise<Activity[]> {
    try {
      // Simpler query that should work with default indexes
      const activitiesQuery = query(
        collection(db, ACTIVITIES_COLLECTION),
        orderBy('createdAt', 'desc'),
        ...(limitCount ? [limit(limitCount)] : [])
      );

      const querySnapshot = await getDocs(activitiesQuery);
      return querySnapshot.docs
        .map(convertActivityFromFirestore)
        .filter(activity => !activity.isDeleted);
    } catch (error) {
      console.error('Error in getRecentActivities:', error);
      throw error;
    }
  },

  async getActivitiesByType(type: Activity['type']): Promise<Activity[]> {
    const queryConstraints = [
      where('type', '==', type),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    ];

    const activitiesQuery = query(
      collection(db, ACTIVITIES_COLLECTION),
      ...queryConstraints
    );
    
    const querySnapshot = await getDocs(activitiesQuery);
    return querySnapshot.docs.map(convertActivityFromFirestore);
  },

  async getActivitiesByEntityId(entityId: string): Promise<Activity[]> {
    const queryConstraints = [
      where('entityId', '==', entityId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    ];

    const activitiesQuery = query(
      collection(db, ACTIVITIES_COLLECTION),
      ...queryConstraints
    );
    
    const querySnapshot = await getDocs(activitiesQuery);
    return querySnapshot.docs.map(convertActivityFromFirestore);
  },

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    const queryConstraints = [
      where('createdBy', '==', userId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    ];

    const activitiesQuery = query(
      collection(db, ACTIVITIES_COLLECTION),
      ...queryConstraints
    );
    
    const querySnapshot = await getDocs(activitiesQuery);
    return querySnapshot.docs.map(convertActivityFromFirestore);
  },
};
