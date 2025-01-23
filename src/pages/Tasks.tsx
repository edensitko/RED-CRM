import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { CustomerClass } from '../types/customer';
import { Task } from '../types/schemas';
import { Project } from '../types/schemas';

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
  FaTimes,
  FaSearch,
  FaThLarge,
  FaList,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronDown,
  FaHourglassHalf,
  FaPlayCircle,
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfo
} from 'react-icons/fa';
import { Dialog } from '@headlessui/react';
import ItemModal from '../components/modals/ItemModal';
import TaskModal from '../components/modals/TaskModal';
import { toast } from 'react-toastify';
import { users } from '../data/mockData';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

interface TaskUser {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number | null;
  updatedAt: number | null;
  contactPerson: string;
  status: string;
  type: string;
  website: string;
  industry: string;
}

interface SortConfig {
  key: keyof Task | '';
  direction: 'asc' | 'desc';
}

interface Filters {
  status: string[];
  search: string;
  startDate: string;
  endDate: string;
}

const TASK_STATUS_ICONS = {
  'pending': <FaHourglassHalf className="text-red-500" />,
  'in_progress': <FaPlayCircle className="text-yellow-500" />,
  'completed': <FaCheckCircle className="text-green-500" />,
  'פעיל': <FaPlayCircle className="text-blue-500" />,
  'active': <FaPlayCircle className="text-blue-500" />
};

const TASK_URGENCY_ICONS = {
  'low': <FaInfo className="text-green-500" />,
  'medium': <FaExclamationTriangle className="text-yellow-500" />,
  'high': <FaExclamationCircle className="text-red-500" />
};

const Tasks: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskUsers, setTaskUsers] = useState<TaskUser[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    status: [],
    search: '',
    startDate: '',
    endDate: ''
  });
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: [],
    project: undefined,
  });
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'history'>('active');
  const [undoTask, setUndoTask] = useState<{taskId: string, previousStatus: 'pending' | 'in_progress' | 'completed' | null} | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
          } as TaskUser;
        });
        setTaskUsers(usersData);
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
          status: data.status || 'pending',
          dueDate: data.dueDate || new Date().toISOString().split('T')[0],
          assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [currentUser?.uid || ''],
          customerId: data.customerId || undefined,
          dealId: data.dealId || undefined,
          createdAt: data.createdAt || Date.now(),
          createdBy: data.createdBy || currentUser?.uid || '',
          completedAt: data.completedAt || null,
          previousStatus: data.previousStatus || null,
          project: data.project || undefined,
          updatedAt: data.updatedAt || Date.now(),
          name: data.name || '',
          priority: data.priority || 'medium', // Add default priority
          updatedBy: data.updatedBy || currentUser?.uid || '' // Add updatedBy
        } as Task;
      });
      setTasks(tasksList);
    }, (error) => {
      console.error('Error fetching tasks:', error);
    });

    // Fetch customers
    const customersRef = collection(db, 'customers');
    const unsubscribeCustomers = onSnapshot(customersRef, (snapshot) => {
      const customersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          contactPerson: data.contactPerson || '',
          status: data.status || '',
          type: data.type || '',
          website: data.website || '',
          industry: data.industry || ''
        } as Customer;
      });
      setCustomers(customersList);
    });

    // Fetch projects
    const projectsRef = collection(db, 'projects');
    const unsubscribeProjects = onSnapshot(projectsRef, (snapshot) => {
      const projectsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          customerId: data.customerId || undefined,
          status: data.status || 'תכנון',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          budget: data.budget || 0,
          createdAt: data.createdAt || '',
          isFavorite: data.isFavorite || false
          
          
        } as Project;
      });
      setProjects(projectsList);
    });

    return () => {
      unsubscribe();
      unsubscribeCustomers();
      unsubscribeProjects();
    };
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const taskData = {
        title: newTask.title || '',
        description: newTask.description || '',
        status: newTask.status || 'pending',
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        assignedTo: [currentUser.uid],
        createdAt: Date.now(),
        createdBy: currentUser.uid,
        updatedAt: Date.now(),
        project: newTask.project,
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
        status: 'pending',
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: [],
        project: undefined,
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
      title: task.title || '',
      description: task.description || '',
      status: ['pending', 'in_progress', 'completed', 'פעיל', 'active'].includes(task.status) 
        ? task.status as 'pending' | 'in_progress' | 'completed' | 'פעיל' | 'active' 
        : 'pending',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: task.assignedTo || [],
      project: task.project || undefined,
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

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Store the previous status for undo
      const previousStatus = task.status;
      
      const updates: Partial<Task> = {
        status: newStatus,
        updatedAt: Date.now(),
      };

      if (newStatus === 'completed') {
        updates.createdAt = Date.now();
      } else {
        updates.createdAt = null;
      }

      await updateDoc(taskRef, updates);

    
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
        status: 'completed',
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
        userName: users.find(u => u.id === currentUser.uid)?.firstName || currentUser.email || 'משתמש לא ידוע',
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
        status: undoTask.previousStatus as 'pending' | 'in_progress' | 'completed',
        updatedAt: Date.now(),
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



  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Update task in Firestore
      const taskDocRef = doc(db, 'tasks', taskId);
      await updateDoc(taskDocRef, {
        ...updates,
        updatedAt: Timestamp.now().toMillis()
      });

      // Update local state
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);

      // Update selected task if it's the current one
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }

      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by tab
    switch (activeTab) {
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      case 'history':
        filtered = filtered.filter(task => task.status !== 'pending');
        break;
      default: // 'active'
        filtered = filtered.filter(task => task.status !== 'completed');
    }

    // Apply other filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.title));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortConfig.key !== '') {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Task] ?? '';
        const bValue = b[sortConfig.key as keyof Task] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tasks, filters, sortConfig, activeTab]);

  const handleSort = (key: keyof Task) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortTasks = (a: Task, b: Task) => {
    if (!sortConfig.key) return 0;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.key === 'assignedTo') {
      return direction * ((a.assignedTo?.length || 0) - (b.assignedTo?.length || 0));
    }

    if (sortConfig.key === 'dueDate' || sortConfig.key === 'createdAt') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return direction * (aDate - bDate);
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction * aValue.localeCompare(bValue);
    }

    return 0;
  };

  const sortedTasks = [...filteredTasks].sort(sortTasks);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6  min-h-screen text-[#e1e1e1]" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e1e1e1]">משימות</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש משימות..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-[#242424] text-[#e1e1e1] rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-gray-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FaFilter className="w-4 h-4" />
            סינון מתקדם
            <FaChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'transform rotate-180' : ''}`} />
          </motion.button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-[#e1e1e1] rounded-lg hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-900/20"
          >
            <span>משימה חדשה</span>
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select
                multiple
                value={filters.status}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, status: values }));
                }}
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
              >
                <option value="pending">לביצוע</option>
                <option value="in_progress">בתהליך</option>
                <option value="completed">הושלם</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-1/2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-1/2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('title')}
                    >
                      כותרת
                      <span className="ml-2">
                        {sortConfig.key === 'title' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort className="text-gray-400 group-hover:text-gray-500" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('status')}
                    >
                      סטטוס
                      <span className="ml-2">
                        {sortConfig.key === 'status' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort className="text-gray-400 group-hover:text-gray-500" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('dueDate')}
                    >
                      תאריך יעד
                      <span className="ml-2">
                        {sortConfig.key === 'dueDate' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort className="text-gray-400 group-hover:text-gray-500" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('assignedTo')}
                    >
                      משוייך ל
                      <span className="ml-2">
                        {sortConfig.key === 'assignedTo' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort className="text-gray-400 group-hover:text-gray-500" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort('urgency')}
                    >
                      דחיפות
                      <span className="ml-2">
                        {sortConfig.key === 'urgency' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort className="text-gray-400 group-hover:text-gray-500" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500">{task.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'pending' ? 'bg-red-500/20 text-red-500' :
                        task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                        task.status === 'active' ? 'bg-blue-500/20 text-blue-500' :
                        task.status === 'פעיל' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {task.status || 'No Status'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          {new Date(task.dueDate).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assignedTo.map((userId, index) => (
                        <span key={userId} className="inline-block">
                          {users.find(u => u.id === userId)?.firstName || userId}
                          {index < task.assignedTo.length - 1 && <span>, </span>}
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.urgency && ['low', 'medium', 'high'].includes(task.urgency) && TASK_URGENCY_ICONS[task.urgency as keyof typeof TASK_URGENCY_ICONS]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Grid */}
      {viewMode === 'grid' && (
        <AnimatePresence>
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {sortedTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-[#e1e1e1] truncate flex-1">{task.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1.5 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors"
                    >
                      <FaEdit className="text-[#e1e1e1] text-sm" />
                    </button>
                  </div>
                </div>

                <p className="text-[#888888] text-sm mb-4 line-clamp-2">{task.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-[#888888]" />
                    <span className="text-sm text-[#e1e1e1]">
                      {new Date(task.dueDate).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-[#888888]" />
                    <span className="text-sm text-[#e1e1e1]">
                      {task.assignedTo.length} משתתפים
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.status === 'pending' ? 'bg-red-500/20 text-red-500' :
                    task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                    task.status === 'active' ? 'bg-blue-500/20 text-blue-500' :
                    task.status === 'פעיל' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {task.status || 'No Status'}
                  </span>
                  {task.project && (
                    <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-500">
                      {task.project.name}
                    </span>
                  )}
                  {task.urgency && ['low', 'medium', 'high'].includes(task.urgency) && TASK_URGENCY_ICONS[task.urgency as keyof typeof TASK_URGENCY_ICONS]}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Undo Toast */}
      <AnimatePresence>
        {undoTask && (
          <motion.div
            key="undo-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-[#2a2a2a] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <span>סטטוס המשימה שונה</span>
            <button
              onClick={() => {
                if (undoTask) {
                  handleStatusChange(undoTask.taskId, undoTask.previousStatus || 'pending');
                  setUndoTask(null);
                }
              }}
              className="text-red-500 hover:text-red-400 font-medium"
            >
              בטל
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Creation/Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask || null}
        users={users}
        projects={projects}
        customers={customers}
        onTaskUpdate={handleTaskUpdate}
      />

      {/* Comments Modal */}
      <AnimatePresence>
        {isCommentModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        )}
        {isCommentModalOpen && selectedTask && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1e1e1e] rounded-lg w-full max-w-2xl overflow-hidden relative text-[#e1e1e1]" dir="rtl"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">תגובות למשימה: {selectedTask.title}</h2>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {comments[selectedTask.id]?.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-[#141414] rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#e1e1e1]">
                          {comment.userName}
                        </span>
                        <span className="text-sm text-[#888888]">
                          {new Date(comment.timestamp).toLocaleString('he-IL')}
                        </span>
                      </div>
                      <p className="text-[#888888]">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 space-x-reverse">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="הוסף תגובה..."
                    className="flex-1 bg-[#141414] text-[#e1e1e1] border border-[#2a2a2a] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    onClick={() => handleCommentSubmit(selectedTask.id)}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-red-600 text-[#e1e1e1] rounded-lg hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-900/20 disabled:opacity-50"
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
