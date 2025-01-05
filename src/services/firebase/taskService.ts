import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Task } from '../../types/schemas';
import { activityService } from './activityService';

const TASKS_COLLECTION = 'tasks';

const convertTaskFromFirestore = (doc: DocumentData): Task => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    dueDate: data.dueDate?.toDate() || null,
    completedAt: data.completedAt?.toDate() || null,
  };
};

export const taskService = {
  async createTask(task: Task): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, task.id);
    await setDoc(taskRef, {
      ...task,
      createdAt: Timestamp.fromDate(task.createdAt),
      updatedAt: Timestamp.fromDate(task.updatedAt),
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
      completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
      isDeleted: false,
    });

    await activityService.logActivity({
      type: 'create',
      entityType: 'task',
      entityId: task.id,
      description: 'יצירת משימה חדשה',
      createdBy: task.createdBy,
      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        status: task.status,
      },
    });
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
      dueDate: updates.dueDate ? Timestamp.fromDate(updates.dueDate) : undefined,
      completedAt: updates.completedAt ? Timestamp.fromDate(updates.completedAt) : undefined,
    };
    await updateDoc(taskRef, updateData);
  },

  async getTask(id: string): Promise<Task | null> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) return null;
    return convertTaskFromFirestore(taskDoc);
  },

  async getTasksByAssignee(assigneeId: string, maxResults?: number): Promise<Task[]> {
    const tasksQuery = query(
      collection(db, TASKS_COLLECTION),
      where('assignedTo', '==', assigneeId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const finalQuery = maxResults ? query(tasksQuery, limit(maxResults)) : tasksQuery;
    const querySnapshot = await getDocs(finalQuery);
    return querySnapshot.docs.map(convertTaskFromFirestore);
  },

  async getTasksByStatus(status: Task['status'], maxResults?: number): Promise<Task[]> {
    const tasksQuery = query(
      collection(db, TASKS_COLLECTION),
      where('status', '==', status),
      where('dueDate', '>=', new Date()),
      orderBy('dueDate', 'asc')
    );

    const finalQuery = maxResults ? query(tasksQuery, limit(maxResults)) : tasksQuery;
    const querySnapshot = await getDocs(finalQuery);
    return querySnapshot.docs.map(convertTaskFromFirestore);
  },

  async deleteTask(id: string, deletedBy: string): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(taskRef, {
      isDeleted: true,
      deletedAt: Timestamp.fromDate(new Date()),
      deletedBy,
    });

    await activityService.logActivity({
      type: 'delete',
      entityType: 'task',
      entityId: id,
      description: 'מחיקת משימה',
      createdBy: deletedBy,
    });
  },
};
