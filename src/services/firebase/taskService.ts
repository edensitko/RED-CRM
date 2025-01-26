import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where, Timestamp, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Task } from '../../types/schemas';

const TASKS_COLLECTION = 'tasks';

const convertToTimestamp = (date: Date | string | Timestamp | null | undefined) => {
  if (!date) return null;
  if (date instanceof Timestamp) {
    return date;
  }
  if (date instanceof Date) {
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);
    return Timestamp.fromDate(localDate);
  }
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setHours(12, 0, 0, 0);
      return Timestamp.fromDate(parsedDate);
    }
  }
  return null;
};

const convertTaskFromFirestore = (doc: any): Task => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    dueDate: data.dueDate?.toDate() || null,
    completedAt: data.completedAt?.toDate() || null,
    completed: data.status === 'הושלם',
    assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo].filter(Boolean),
    project: data.project || null,
    customers: data.customers || [],
    subTasks: data.subTasks || [],
    previousStatus: data.previousStatus || null,
    urgency: data.urgency || 'low',
    repeat: data.repeat || ''
  };
};

export const taskService = {
  createTask: async (taskData: Omit<Task, 'id'>): Promise<string> => {
    try {
      const tasksRef = collection(db, TASKS_COLLECTION);
      const finalData = {
        ...taskData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        dueDate: convertToTimestamp(taskData.dueDate),
      };
      const docRef = await addDoc(tasksRef, finalData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (taskId: string, taskData: Partial<Task>): Promise<void> => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      
      // Create a clean update object without any undefined values
      const updateData: Record<string, any> = {
        updatedAt: Timestamp.now()
      };

      // Process each field, removing undefined values and converting dates
      Object.entries(taskData).forEach(([key, value]) => {
        if (value === undefined) {
          return; // Skip undefined values entirely
        }
        
        if (key === 'dueDate' || key === 'date' || key === 'startDate' || key === 'endDate') {
          updateData[key] = value ? convertToTimestamp(value as Date | string | Timestamp) : null;
        } else {
          updateData[key] = value;
        }
      });

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  getTasks: async (): Promise<Task[]> => {
    try {
      const tasksRef = collection(db, TASKS_COLLECTION);
      const q = query(tasksRef, where('isDeleted', '==', false));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertTaskFromFirestore(doc)) as Task[];
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  getTask: async (taskId: string): Promise<Task | null> => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const taskDoc = await getDoc(taskRef);
      if (!taskDoc.exists()) return null;
      return convertTaskFromFirestore(taskDoc);
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  getTasksByAssignee: async (assigneeId: string, maxResults?: number): Promise<Task[]> => {
    try {
      const tasksRef = collection(db, TASKS_COLLECTION);
      const q = query(
        tasksRef,
        where('assignedTo', '==', assigneeId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(maxResults || 100)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertTaskFromFirestore(doc)) as Task[];
    } catch (error) {
      console.error('Error getting tasks by assignee:', error);
      throw error;
    }
  },

  getTasksByStatus: async (status: Task['status'], maxResults?: number): Promise<Task[]> => {
    try {
      const tasksRef = collection(db, TASKS_COLLECTION);
      const q = query(
        tasksRef,
        where('status', '==', status),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(maxResults || 100)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertTaskFromFirestore(doc)) as Task[];
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      throw error;
    }
  },

  getAllTasks: async (userId?: string): Promise<Task[]> => {
    try {
      const tasksRef = collection(db, TASKS_COLLECTION);
      const q = query(tasksRef, where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertTaskFromFirestore(doc)) as Task[];
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  },
  convertToTimestamp
};
