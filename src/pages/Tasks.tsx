import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
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
  project?: { id: string; name: string };
  updatedAt?: number;
  urgency?: string;
  repeat?: string;
  completedAt?: number | null;
  previousStatus?: 'לביצוע' | 'בביצוע' | 'הושלם' | null;
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

interface SortConfig {
  key: keyof Task | '';
  direction: 'asc' | 'desc';
}

interface Filters {
  status: string[];
  priority: string[];
  search: string;
  startDate: string;
  endDate: string;
}

const TASK_STATUS_CONFIG = {
  'לביצוע': {
    label: 'לביצוע',
    color: 'bg-red-100 text-red-800',
    icon: <FaSpinner className="mr-2" />
  },
  'בביצוע': {
    label: 'בביצוע',
    color: 'bg-red-200 text-red-700',
    icon: <FaPause className="mr-2" />
  },
  'הושלם': {
    label: 'הושלם',
    color: 'bg-red-300 text-red-600',
    icon: <FaCheck className="mr-2" />
  }
} as const;

const TASK_PRIORITY_CONFIG = {
  'נמוכה': {
    label: 'נמוכה',
    color: 'bg-red-100 text-red-800'
  },
  'בינונית': {
    label: 'בינונית',
    color: 'bg-red-200 text-red-700'
  },
  'גבוהה': {
    label: 'גבוהה',
    color: 'bg-red-300 text-red-600'
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    search: '',
    startDate: '',
    endDate: ''
  });
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'לביצוע',
    priority: 'בינונית',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: []
  });
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [undoTask, setUndoTask] = useState<{taskId: string, previousStatus: 'לביצוע' | 'בביצוע' | 'הושלם' | null} | null>(null);
  
  // Add timeout ref to clear undo timer
  const undoTimeoutRef = useRef<NodeJS.Timeout>();

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
          createdBy: data.createdBy || currentUser?.uid || '',
          completedAt: data.completedAt,
          previousStatus: data.previousStatus
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

    try {
      const taskData = {
        title: newTask.title || '',
        description: newTask.description || '',
        status: newTask.status || 'לביצוע',
        priority: newTask.priority || 'בינונית',
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        assignedTo: [currentUser.uid],
        createdAt: Date.now(),
        createdBy: currentUser.uid,
        updatedAt: Date.now()
      };

      if (selectedTask) {
        // Update existing task
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, {
          ...taskData,
          updatedAt: Date.now()
        });
      } else {
        // Create new task
        await addDoc(collection(db, 'tasks'), taskData);
      }

      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        status: 'לביצוע',
        priority: 'בינונית',
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: []
      });
      setSelectedTask(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return;
    
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'לביצוע' | 'בביצוע' | 'הושלם') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Store the previous status for undo
      const previousStatus = task.status;
      
      const updates: Partial<Task> = {
        status: newStatus,
        updatedAt: Date.now(),
        previousStatus
      };

      if (newStatus === 'הושלם') {
        updates.completedAt = Date.now();
      } else {
        updates.completedAt = null;
      }

      await updateDoc(taskRef, updates);

      // Set undo state
      setUndoTask({ taskId, previousStatus });

      // Clear previous timeout if exists
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      // Clear undo state after 5 seconds
      undoTimeoutRef.current = setTimeout(() => {
        setUndoTask(null);
      }, 5000);

    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'הושלם',
        completedAt: Date.now()
      });
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleCommentSubmit = async (taskId: string) => {
    if (!currentUser || !newComment.trim()) return;

    try {
      const commentData = {
        userId: currentUser.uid,
        userName: users.find(u => u.id === currentUser.uid)?.name || currentUser.email || 'משתמש לא ידוע',
        content: newComment.trim(),
        timestamp: Date.now()
      };

      const taskRef = doc(db, 'tasks', taskId);
      const commentsRef = collection(taskRef, 'comments');
      await addDoc(commentsRef, commentData);

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUndo = async () => {
    if (!undoTask || !undoTask.previousStatus) return;

    try {
      const taskRef = doc(db, 'tasks', undoTask.taskId);
      const updates: Partial<Task> = {
        status: undoTask.previousStatus as 'לביצוע' | 'בביצוע' | 'הושלם',
        updatedAt: Date.now(),
        completedAt: undoTask.previousStatus === 'הושלם' ? Date.now() : null,
        previousStatus: null
      };

      await updateDoc(taskRef, updates);
      setUndoTask(null);

      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error undoing task status:', error);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    
    return tasks.filter((task) => {
      // Only show tasks assigned to current user
      if (!task.assignedTo.includes(currentUser.uid)) return false;

      // Filter by tab
      if (activeTab === 'active') {
        if (task.status === 'הושלם') return false;
      } else {
        if (task.status !== 'הושלם') return false;
      }

      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      const aValue = sortConfig.key ? a[sortConfig.key] : null;
      const bValue = sortConfig.key ? b[sortConfig.key] : null;
      
      if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, filters, sortConfig, currentUser, activeTab]);

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4 space-x-reverse">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 text-sm font-medium border-b-2 ${
              activeTab === 'active'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent hover:text-red-600 hover:border-red-300'
            }`}
          >
            משימות פעילות
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2.5 text-sm font-medium border-b-2 ${
              activeTab === 'completed'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent hover:text-red-600 hover:border-red-300'
            }`}
          >
            משימות שהושלמו
          </button>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-150 flex items-center"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          משימה חדשה
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="חיפוש משימות..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                סטטוס
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                משימה
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                עדיפות
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך יעד
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr 
                key={task.id} 
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = task.status === 'הושלם' ? 'לביצוע' : 'הושלם';
                        handleStatusChange(task.id, newStatus);
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                        task.status === 'הושלם'
                          ? 'border-red-600 bg-red-600 hover:bg-red-700 hover:border-red-700'
                          : 'border-gray-300 hover:border-red-400'
                      }`}
                      title={task.status === 'הושלם' ? 'סמן כלא הושלם' : 'סמן כהושלם'}
                    >
                      {task.status === 'הושלם' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 mb-1">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-500 line-clamp-2">{task.description}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    TASK_PRIORITY_CONFIG[task.priority]?.color || 'bg-gray-100 text-gray-500'
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(task.dueDate).toLocaleDateString('he-IL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium">פרטי משימה</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                  <div className="text-sm text-gray-900">{selectedTask.title}</div>
                </div>
                {selectedTask.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTask.description}</div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleStatusChange(selectedTask.id, selectedTask.status === 'הושלם' ? 'לביצוע' : 'הושלם')}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                        selectedTask.status === 'הושלם'
                          ? 'border-red-600 bg-red-600 hover:bg-red-700 hover:border-red-700'
                          : 'border-gray-300 hover:border-red-400'
                      }`}
                    >
                      {selectedTask.status === 'הושלם' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className="text-sm text-gray-900">
                      {selectedTask.status === 'הושלם' ? 'הושלם' : 'לא הושלם'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    TASK_PRIORITY_CONFIG[selectedTask.priority]?.color || 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedTask.dueDate).toLocaleDateString('he-IL')}
                  </div>
                </div>
                {selectedTask.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">הושלם בתאריך</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedTask.completedAt).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && !selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    משימה חדשה
                  </h2>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewTask({
                        title: '',
                        description: '',
                        status: 'לביצוע',
                        priority: 'בינונית',
                        dueDate: new Date().toISOString().split('T')[0],
                        assignedTo: []
                      });
                      setSelectedTask(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      כותרת
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תיאור
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        סטטוס
                      </label>
                      <select
                        value={newTask.status}
                        onChange={(e) =>
                          setNewTask({ ...newTask, status: e.target.value as Task['status'] })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {Object.keys(TASK_STATUS_CONFIG).map((status) => (
                          <option key={status} value={status}>
                            {TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        עדיפות
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {Object.keys(TASK_PRIORITY_CONFIG).map((priority) => (
                          <option key={priority} value={priority}>
                            {TASK_PRIORITY_CONFIG[priority as keyof typeof TASK_PRIORITY_CONFIG].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך יעד
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      משתמשים מוקצים
                    </label>
                    <select
                      multiple
                      value={newTask.assignedTo}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setNewTask({ ...newTask, assignedTo: selectedOptions });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.displayName || user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setNewTask({
                          title: '',
                          description: '',
                          status: 'לביצוע',
                          priority: 'בינונית',
                          dueDate: new Date().toISOString().split('T')[0],
                          assignedTo: []
                        });
                        setSelectedTask(null);
                      }}
                      className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                    >
                      צור משימה
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {isCommentModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    תגובות למשימה: {selectedTask.title}
                  </h2>
                  <button
                    onClick={() => {
                      setIsCommentModalOpen(false);
                      setNewComment('');
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {comments[selectedTask.id]?.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {comment.userName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.timestamp).toLocaleString('he-IL')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="הוסף תגובה..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <button
                    onClick={() => handleCommentSubmit(selectedTask.id)}
                    disabled={!newComment.trim()}
                    className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
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
