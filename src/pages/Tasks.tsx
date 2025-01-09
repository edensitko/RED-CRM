import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import {
  FaTasks,
  FaCheck,
  FaSpinner,
  FaPause,
  FaEdit,
  FaTrash,
  FaStar,
  FaCalendarAlt,
  FaUser,
  FaComments,
  FaPlus,
  FaFilter,
  FaUsers,
  FaComment,
  FaTimes
} from 'react-icons/fa';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'לביצוע' | 'בביצוע' | 'הושלם';
  priority: 'נמוכה' | 'בינונית' | 'גבוהה';
  dueDate: string;
  assignedTo: string[];
  customerId?: string;
  dealId?: string;
  createdAt: number;
  createdBy: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
}

const TASK_STATUS_CONFIG = {
  'לביצוע': {
    label: 'לביצוע',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <FaSpinner className="mr-2" />
  },
  'בביצוע': {
    label: 'בביצוע',
    color: 'bg-blue-100 text-blue-800',
    icon: <FaPause className="mr-2" />
  },
  'הושלם': {
    label: 'הושלם',
    color: 'bg-green-100 text-green-800',
    icon: <FaCheck className="mr-2" />
  }
} as const;

const TASK_PRIORITY_CONFIG = {
  'נמוכה': {
    label: 'נמוכה',
    color: 'bg-gray-100 text-gray-800'
  },
  'בינונית': {
    label: 'בינונית',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'גבוהה': {
    label: 'גבוהה',
    color: 'bg-red-100 text-red-800'
  }
} as const;

const Tasks: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'completed-tasks'>('my-tasks');
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'לביצוע',
    priority: 'בינונית',
    dueDate: new Date('2025-01-08T22:25:27+02:00').toISOString().split('T')[0],
    assignedTo: [currentUser?.uid || '']
  });

  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || '',
            name: data.name,
            displayName: data.displayName
          } as User;
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    const tasksCollectionRef = collection(db, 'tasks');
    const unsubscribe = onSnapshot(tasksCollectionRef, (snapshot) => {
      const tasksList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'לביצוע',
          priority: data.priority || 'בינונית',
          dueDate: data.dueDate || new Date().toISOString().split('T')[0],
          assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [currentUser?.uid || ''],
          customerId: data.customerId,
          dealId: data.dealId,
          createdAt: data.createdAt || Date.now(),
          createdBy: data.createdBy || currentUser?.uid || ''
        } as Task;
      });
      setTasks(tasksList);
    }, (error) => {
      console.error('Error fetching tasks:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const taskData: Partial<Omit<Task, 'id'>> = {
      title: formData.title || '',
      description: formData.description || '',
      status: formData.status || 'לביצוע',
      priority: formData.priority || 'בינונית',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: (formData.assignedTo && formData.assignedTo.length > 0) 
        ? formData.assignedTo 
        : [currentUser.uid],
      createdAt: Date.now(),
      createdBy: currentUser.uid
    };

    // Only add optional fields if they have values
    if (formData.customerId) {
      taskData.customerId = formData.customerId;
    }
    if (formData.dealId) {
      taskData.dealId = formData.dealId;
    }

    try {
      if (selectedTask) {
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, taskData);
      } else {
        await addDoc(collection(db, 'tasks'), taskData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('האם אתה בטוח שברצון למחוק משימה זו?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [currentUser?.uid || ''],
    });
    setIsModalOpen(true);
  };

  const handleAddComment = async () => {
    if (!currentUser || !selectedTask || !newComment.trim()) return;

    const commentData = {
      userId: currentUser.uid,
      userName: currentUser.email,
      content: newComment,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, `taskComments/${selectedTask.id}`), commentData);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'לביצוע',
      priority: 'בינונית',
      dueDate: new Date('2025-01-08T22:25:27+02:00').toISOString().split('T')[0],
      assignedTo: [currentUser?.uid || '']
    });
    setSelectedTask(null);
  };

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];

    if (activeTab === 'my-tasks') {
      return tasks.filter(task => task.assignedTo.includes(currentUser.uid));
    } else {
      return tasks.filter(task => task.status === 'הושלם');
    }
  }, [tasks, currentUser, activeTab]);

  const sortedTasks = useMemo(() => {
    return filteredTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filteredTasks]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.displayName || user?.email || 'משתמש לא ידוע';
  };

  const getAssignedUserNames = (assignedIds: string[]) => {
    return assignedIds
      .map(id => users.find(user => user.id === id))
      .filter(user => user)
      .map(user => user?.name || user?.displayName || user?.email || 'משתמש לא ידוע')
      .join(', ');
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const MyTasksView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y">
          {sortedTasks.map((task) => (
            <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'הושלם' ? 'לביצוע' : 'הושלם')}
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.status === 'הושלם'
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-gray-300 hover:border-red-500'
                  }`}
                >
                  {task.status === 'הושלם' && <FaCheck className="w-3 h-3" />}
                </button>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium ${task.status === 'הושלם' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                      >
                        <FaEdit className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                      >
                        <FaTrash className="mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 ${task.status === 'הושלם' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${TASK_PRIORITY_CONFIG[task.priority]?.color}`}>
                      <FaStar className="mr-1" />
                      {task.priority}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaCalendarAlt />
                      {new Date(task.dueDate).toLocaleDateString('he-IL')}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.assignedTo.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                              <FaUser className="text-red-500 text-xs" />
                            </div>
                            <span className="text-xs text-gray-500">
                              {user?.name || user?.displayName || user?.email || 'משתמש לא ידוע'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setIsCommentModalOpen(true);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <FaComment />
                      תגובות
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CompletedTasksView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y">
          {sortedTasks.map((task) => (
            <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'הושלם' ? 'לביצוע' : 'הושלם')}
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.status === 'הושלם'
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-gray-300 hover:border-red-500'
                  }`}
                >
                  {task.status === 'הושלם' && <FaCheck className="w-3 h-3" />}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium ${task.status === 'הושלם' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditTask(task)} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300">
                        <FaEdit className="mr-2" />
                        Edit
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300">
                        <FaTrash className="mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${task.status === 'הושלם' ? 'text-gray-400' : 'text-gray-600'}`}>{task.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${TASK_PRIORITY_CONFIG[task.priority]?.color}`}>
                      <FaStar className="mr-1" />
                      {task.priority}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaCalendarAlt />
                      {new Date(task.dueDate).toLocaleDateString('he-IL')}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.assignedTo.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                              <FaUser className="text-red-500 text-xs" />
                            </div>
                            <span className="text-xs text-gray-500">
                              {user?.name || user?.displayName || user?.email || 'משתמש לא ידוע'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setIsCommentModalOpen(true);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <FaComment />
                      תגובות
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaTasks className="text-red-500" />
            משימות
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedTask(null);
              setIsModalOpen(true);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            משימה חדשה
          </motion.button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors ${
                activeTab === 'my-tasks'
                  ? 'border-red-500 text-red-500 bg-red-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaUser className={activeTab === 'my-tasks' ? 'text-red-500' : 'text-gray-400'} />
                המשימות שלי
              </div>
            </button>
            <button
              onClick={() => setActiveTab('completed-tasks')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors ${
                activeTab === 'completed-tasks'
                  ? 'border-red-500 text-red-500 bg-red-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCheck className={activeTab === 'completed-tasks' ? 'text-red-500' : 'text-gray-400'} />
                משימות שהושלמו
              </div>
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'my-tasks' ? <MyTasksView /> : <CompletedTasksView />}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <FaTasks className="ml-4" />
                  {selectedTask ? 'ערוך משימה' : 'צור משימה חדשה'}
                </h2>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-red-500 hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">כותרת</label>
                    <motion.input
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="הזן כותרת למשימה"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">משתמשים מוקצים</label>
                    <motion.select
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      multiple
                      value={formData.assignedTo || [currentUser?.uid || '']}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        const assignedUsers = selectedOptions.length > 0 ? selectedOptions : [currentUser?.uid || ''];
                        setFormData({ ...formData, assignedTo: assignedUsers });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 min-h-[120px]"
                    >
                      {users.map(user => (
                        <option 
                          key={user.id} 
                          value={user.id}
                          className="py-2"
                        >
                          {user.name || user.displayName || user.email || 'משתמש לא ידוע'}
                        </option>
                      ))}
                    </motion.select>
                    <p className="text-sm text-gray-500 mt-1">לחץ על Ctrl (או ⌘ במק) כדי לבחור מספר משתמשים</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                  <motion.textarea
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="תאר את המשימה"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
                    <motion.select
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    >
                      {Object.keys(TASK_STATUS_CONFIG).map((status) => (
                        <option key={status} value={status}>
                          {TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG].label}
                        </option>
                      ))}
                    </motion.select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">עדיפות</label>
                    <motion.select
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    >
                      {Object.keys(TASK_PRIORITY_CONFIG).map((priority) => (
                        <option key={priority} value={priority}>
                          {TASK_PRIORITY_CONFIG[priority as keyof typeof TASK_PRIORITY_CONFIG].label}
                        </option>
                      ))}
                    </motion.select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תאריך יעד</label>
                    <motion.input
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-medium text-white bg-red-500 border border-transparent rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
                  >
                    {selectedTask ? 'עדכן משימה' : 'צור משימה'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {isCommentModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <FaComment className="ml-4" />
                  תגובות למשימה
                </h2>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCommentModalOpen(false)}
                  className="text-white hover:bg-red-500 hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <FaTimes className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {comments[selectedTask.id]?.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{getUserName(comment.userId)}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.timestamp).toLocaleString('he-IL')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                  {(!comments[selectedTask.id] || comments[selectedTask.id].length === 0) && (
                    <p className="text-center text-gray-500">אין תגובות עדיין</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="הוסף תגובה..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaComment className="w-4 h-4" />
                    שלח
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
