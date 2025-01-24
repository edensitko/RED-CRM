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
  serverTimestamp,
  Timestamp,
  DocumentData,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Task } from '../../types/schemas';
import { activityService } from './activityService';

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

const convertTaskFromFirestore = (doc: DocumentData): Task => {
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
  async createTask(task: Task): Promise<void> {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const now = serverTimestamp();
    
    const taskData = {
      ...task,
      createdAt: now,
      updatedAt: now,
      dueDate: convertToTimestamp(task.dueDate),
      completedAt: convertToTimestamp(task.completedAt),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedBy: task.createdBy,
      comments: task.comments || [],
      subTasks: task.subTasks || [],
      customers: task.customers || [],
      project: task.project || null,
      completed: task.status === 'הושלם',
      isFavorite: task.isFavorite || false
    };

    await addDoc(tasksRef, taskData);

    await activityService.logActivity({
      type: 'create',
      entityType: 'task',
      entityId: task.id,
      description: 'יצירת משימה חדשה',
      createdBy: task.createdBy,
      metadata: {
        taskTitle: task.title,
        status: task.status,
      },
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: task.createdBy
    });
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: updates.updatedBy || updates.createdBy
      };

      // Convert any date fields to Timestamps
      if (updates.dueDate !== undefined) {
        updateData.dueDate = convertToTimestamp(updates.dueDate);
      }
      if (updates.completedAt !== undefined) {
        updateData.completedAt = convertToTimestamp(updates.completedAt);
      }
      if (updates.deletedAt !== undefined) {
        updateData.deletedAt = convertToTimestamp(updates.deletedAt);
      }

      // If completed is explicitly set, update the status accordingly
      if (updates.status !== undefined) {
        updateData.status = updates.status === 'הושלם' ? 'הושלם' : 'לביצוע';
        updateData.completedAt = updates.status === 'הושלם' ? convertToTimestamp(new Date()) : null;
        updateData.completed = updates.status === 'הושלם';
      }

      // Handle array fields properly
      if (updates.comments !== undefined) {
        updateData.comments = updates.comments;
      }
      if (updates.subTasks !== undefined) {
        updateData.subTasks = updates.subTasks;
      }
      if (updates.customers !== undefined) {
        updateData.customers = updates.customers;
      }

      // Handle project data
      if (updates.project !== undefined) {
        updateData.project = updates.project;
        updateData.projectId = updates.project?.id || null;
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async getTask(userId: string, id: string): Promise<Task | null> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) return null;
    
    const data = taskDoc.data();
    return {
      id: taskDoc.id,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'בתהליך',
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      dueDate: data.dueDate?.toDate() || null,
      completedAt: data.completedAt?.toDate() || null,
      assignedTo: data.assignedTo || [],
      project: data.project || null,
      customers: data.customers || [],
      subTasks: data.subTasks || [],
      urgency: data.urgency || 'נמוך',
      repeat: data.repeat || null,
      previousStatus: data.previousStatus || null,
    } as unknown as Task;
  },

  async getTasksByAssignee(userId: string, assigneeId: string, maxResults?: number): Promise<Task[]> {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('assignedTo', '==', assigneeId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxResults || 100)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status || '',
        priority: data.priority || '',
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dueDate: data.dueDate?.toDate() || null,
        completedAt: data.completedAt?.toDate() || null,
        assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo].filter(Boolean),
        project: data.project || null,
        customers: data.customers || [],
        subTasks: data.subTasks || [],
        previousStatus: data.previousStatus || null,
        urgency: data.urgency || 'low',
        category: data.category || '',
        comments: data.comments || []
      } as unknown as Task;
    });
  },

  async getTasksByStatus(userId: string, status: Task['status'], maxResults?: number): Promise<Task[]> {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('status', '==', status),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxResults || 100)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dueDate: data.dueDate?.toDate() || null,
        completedAt: data.completedAt?.toDate() || null,
        assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo].filter(Boolean),
        project: data.project || null,
        customers: data.customers || [],
        subTasks: data.subTasks || [],
        previousStatus: data.previousStatus || null,
        urgency: data.urgency || 'low',
        repeat: data.repeat || ''
      } as unknown as Task;
    });
  },

  async getAllTasks(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dueDate: data.dueDate?.toDate() || null,
        completedAt: data.completedAt?.toDate() || null,
        assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo].filter(Boolean),
        project: data.project || null,
        customers: data.customers || [],
        subTasks: data.subTasks || [],
        previousStatus: data.previousStatus || null,
        urgency: data.urgency || 'low',
        repeat: data.repeat || ''
      } as unknown as Task;
    });
  },

  async deleteTask(id: string, deletedBy: string): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(taskRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
    });

    await activityService.logActivity({
      type: 'delete',
      entityType: 'task',
      entityId: id,
      description: 'מחיקת משימה',
      createdBy: deletedBy,
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
 
      updatedBy: ''
    });
  },
};
