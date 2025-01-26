import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase'; 
import { Task, CustomerClass, TaskUser } from '../types/schemas';
import { Project } from '../types/schemas';
import { taskService } from '../services/firebase/taskService'; // Update import for taskService

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
  FaInfo,
  FaClock,
  FaColumns,
  FaCalendarDay
} from 'react-icons/fa';
import { Dialog } from '@headlessui/react';
import ItemModal from '../components/modals/proj_item_modal';
import TaskModal from '../components/modals/TaskModal';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TableAssignments from '../components/widgets/TableAssignments';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
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
  urgent: string[];
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

const TaskStatistics: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const { currentUser } = useAuth();
  const stats = useMemo(() => {
    const userTasks = tasks.filter(task => task.assignedTo?.includes(currentUser?.uid || ''));
    return {
      total: userTasks.length,
      pending: userTasks.filter(task => task.status === 'לביצוע').length,
      inProgress: userTasks.filter(task => task.status === 'בתהליך').length,
      completed: userTasks.filter(task => task.status === 'הושלם').length,
      urgent: userTasks.filter(task => task.urgent === 'גבוהה').length,
      dueToday: userTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = task.dueDate instanceof Timestamp ? 
          task.dueDate.toDate() : new Date(task.dueDate);
        const today = new Date();
        return dueDate.toDateString() === today.toDateString();
      }).length
    };
  }, [tasks, currentUser]);

  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-md p-4 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-white">המשימות שלי - סטטיסטיקה</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-blue-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-400"><FaTasks /></span>
            <span className="text-2xl font-bold text-blue-400">{stats.total}</span>
          </div>
          <p className="text-sm text-blue-400 mt-1">סה"כ משימות</p>
        </div>
        <div className="bg-red-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-400"><FaHourglassHalf /></span>
            <span className="text-2xl font-bold text-red-400">{stats.pending}</span>
          </div>
          <p className="text-sm text-red-400 mt-1">לביצוע</p>
        </div>
        <div className="bg-yellow-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-yellow-400"><FaPlayCircle /></span>
            <span className="text-2xl font-bold text-yellow-400">{stats.inProgress}</span>
          </div>
          <p className="text-sm text-yellow-400 mt-1">בתהליך</p>
        </div>
        <div className="bg-green-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-green-400"><FaCheckCircle /></span>
            <span className="text-2xl font-bold text-green-400">{stats.completed}</span>
          </div>
          <p className="text-sm text-green-400 mt-1">הושלם</p>
        </div>
        <div className="bg-orange-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-orange-400"><FaExclamationCircle /></span>
            <span className="text-2xl font-bold text-orange-400">{stats.urgent}</span>
          </div>
          <p className="text-sm text-orange-400 mt-1">דחוף</p>
        </div>
        <div className="bg-purple-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-purple-400"><FaCalendarDay /></span>
            <span className="text-2xl font-bold text-purple-400">{stats.dueToday}</span>
          </div>
          <p className="text-sm text-purple-400 mt-1">להיום</p>
        </div>
      </div>
    </div>
  );
};

const FilterSection: React.FC<{ filters: Filters; setFilters: (filters: Filters) => void }> = ({
  filters,
  setFilters,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">סטטוס</label>
        <select
          multiple
          value={filters.status}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            setFilters({ ...filters, status: values });
          }}
          className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="לביצוע">לביצוע</option>
          <option value="בתהליך">בתהליך</option>
          <option value="הושלם">הושלם</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">דחיפות</label>
        <select
          multiple
          value={filters.urgent}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            setFilters({ ...filters, urgent: values });
          }}
          className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="נמוכה">נמוכה</option>
          <option value="בינונית">בינונית</option>
          <option value="גבוהה">גבוהה</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">תאריך התחלה</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">תאריך סיום</label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex items-end lg:col-span-4">
        <button
          onClick={() => setFilters({ status: [], search: '', startDate: '', endDate: '', urgent: [] })}
          className="w-full px-4 py-2 bg-[#2a2a2a] text-[#e1e1e1] rounded-lg hover:bg-[#333333] transition-colors border border-gray-700"
        >
          נקה סינון
        </button>
      </div>
    </div>
  );
};

const Tasks: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskUsers, setTaskUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(true);
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
    endDate: '',
    urgent: []
  });
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'לטיפול',
    assignedTo: [],
    project: undefined,
    dueDate: taskService.convertToTimestamp(new Date().toISOString().split('T')[0]),
  });
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'history'>('active');
  const [undoTask, setUndoTask] = useState<{taskId: string, previousStatus: 'pending' | 'in_progress' | 'completed' | null} | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<CustomerClass[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'list'>('kanban');
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
            name: data.name || data.displayName || data.email || '',
            displayName: data.displayName || data.name || data.email || ''
          } as TaskUser;
        });
        setTaskUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Fetch customers first
    const customersRef = collection(db, 'Customers');
    const unsubscribeCustomers = onSnapshot(customersRef, (snapshot) => {
      const customersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          lastName: data.lastName || '',
          companyName: data.companyName || '',
          assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [currentUser?.uid || ''],
          Balance: data.Balance || 0,
          ComeFrom: data.ComeFrom || '',
          Comments: Array.isArray(data.Comments) ? data.Comments : [],
          CreatedBy: data.CreatedBy || '',
          createdAt: data.createdAt || '',
          Email: data.Email || '',
          IsDeleted: data.IsDeleted || false,
          Links: Array.isArray(data.Links) ? data.Links : [],
          Phone: data.Phone || '',
          Projects: Array.isArray(data.Projects) ? data.Projects : [],
          Status: data.Status || 'פעיל',
          Tags: Array.isArray(data.Tags) ? data.Tags : [],
          Tasks: Array.isArray(data.Tasks) ? data.Tasks : [],
          Files: Array.isArray(data.Files) ? data.Files : [],
          subTasks: Array.isArray(data.subTasks) ? data.subTasks : [],
        } as CustomerClass;
      });
      setCustomers(customersList);

      // Now fetch tasks after we have customers data
      const tasksCollectionRef = collection(db, 'tasks');
      const unsubscribeTasks = onSnapshot(
        query(tasksCollectionRef, where('assignedTo', 'array-contains', currentUser?.uid)),
        (snapshot) => {
          const tasksList = snapshot.docs.map(doc => {
            const data = doc.data();
            // Find customer if customerId exists
            const customer = data.customerId ? customersList.find(c => c.id === data.customerId) : null;
            return {
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              status: data.status || 'לביצוע',
              urgent: data.urgent,
              dueDate: data.dueDate || taskService.convertToTimestamp(new Date().toISOString().split('T')[0]),
              assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [currentUser?.uid || ''],
              customerId: data.customerId || undefined,
              customers: customer ? [customer] : [],
              dealId: data.dealId || undefined,
              createdAt: data.createdAt || Date.now(),
              createdBy: data.createdBy || currentUser?.uid || '',
              completedAt: data.completedAt || null,
              previousStatus: data.previousStatus || null,
              project: data.project || undefined,
              updatedAt: data.updatedAt || Date.now(),
              name: data.name || '',
              priority: data.priority || 'medium',
              updatedBy: data.updatedBy || currentUser?.uid || '',
              tasks: data.tasks || [],
              files: data.files || [],
              links: data.links || [],
              isFavorite: data.isFavorite || false,
              subtitle: data.subtitle || '',
              subTasks: data.subTasks || [],
              comments: data.comments || [],
              isDeleted: data.isDeleted || false
            } as unknown as Task;
          });
          setTasks(tasksList);
        },
        (error) => {
          console.error('Error fetching tasks:', error);
        }
      );

      // Store tasks unsubscribe function to be called on cleanup
      return () => unsubscribeTasks();
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
      unsubscribeCustomers();
      unsubscribeProjects();
    };
  }, [currentUser]);

  const handleCreateTask = async (taskData: Task) => {
    try {
      const tasksRef = collection(db, 'tasks');
      await addDoc(tasksRef, {
        ...taskData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: currentUser?.uid,
        assignedTo: taskData.assignedTo || [currentUser?.uid],
        status: 'pending'  // Always use English status internally
      });
      toast.success('המשימה נוצרה בהצלחה');
      setIsModalOpen(false);
      // Reset the form
      setSelectedTask(null);
      setNewTask({
        title: '',
        description: '',
        status: 'pending',
        dueDate: taskService.convertToTimestamp(new Date().toISOString().split('T')[0]),
        assignedTo: [],
        project: undefined,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('שגיאה ביצירת המשימה');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const taskData = {
        title: newTask.title || '',
        description: newTask.description || '',
        status: 'pending',  // Always use English status internally
        dueDate: taskService.convertToTimestamp(newTask.dueDate),
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
        dueDate: taskService.convertToTimestamp(new Date().toISOString().split('T')[0]),
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
      dueDate: taskService.convertToTimestamp(task.dueDate), // Update dueDate conversion
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const statusMapping: { [key: string]: string } = {
        'לביצוע': 'pending',
        'בתהליך': 'in_progress',
        'הושלם': 'completed'
      };
      
      // Convert Hebrew status to English if necessary
      const englishStatus = statusMapping[newStatus] || newStatus;
      
      await updateDoc(taskRef, {
        status: englishStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('שגיאה בעדכון סטטוס המשימה');
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
        userName: taskUsers.find(u => u.id === currentUser.uid)?.name || currentUser.email || 'משתמש לא ידוע',        content: newComment.trim(),
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

  // Add filtered tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by user's tasks
      if (!task.assignedTo?.includes(currentUser?.uid || '')) return false;
      
      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Filter by date range
      if (filters.startDate || filters.endDate) {
        if (!task.dueDate) return false;
        
        const taskDate = task.dueDate instanceof Timestamp ? 
          task.dueDate.toDate() : new Date(task.dueDate);
        
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (taskDate < startDate) return false;
        }
        
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59);
          if (taskDate > endDate) return false;
        }
      }

      // Filter by urgency
      if (filters.urgent.length > 0 && !filters.urgent.includes(task.urgent)) {
        return false;
      }

      return true;
    });
  }, [tasks, filters, currentUser]);

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

  // Helper function to get user names from IDs
  const getAssignedUserNames = (userIds: string[]) => {
    return userIds
      .map(id => taskUsers.find(user => user.id === id))
      .filter(user => user)
      .map(user => user?.displayName || user?.name || user?.email)
      .join(', ');
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;

    const statusMapping: { [key: string]: string } = {
      'לביצוע': 'pending',
      'בתהליך': 'in_progress',
      'הושלם': 'completed'
    };

    const newStatus = statusMapping[destination.droppableId] || destination.droppableId;
    await handleStatusChange(draggableId, newStatus);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'לביצוע':
        return <FaHourglassHalf className="text-gray-400" />;
      case 'בתהליך':
        return <FaPlayCircle className="text-blue-400" />;
      case 'הושלם':
        return <FaCheckCircle className="text-green-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'לביצוע':
        return 'bg-gray-500/10 border-gray-500/20';
      case 'בתהליך':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'הושלם':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return '';
    }
  };

  const getTasksByStatus = (status: string) => {
    const statusMapping: { [key: string]: string } = {
      'לביצוע': 'pending',
      'בתהליך': 'in_progress',
      'הושלם': 'completed'
    };
    
    return filteredTasks.filter(task => {
      if (status === 'לביצוע') return task.status === 'pending' || task.status === 'לביצוע';
      if (status === 'בתהליך') return task.status === 'in_progress' || task.status === 'בתהליך';
      if (status === 'הושלם') return task.status === 'completed' || task.status === 'הושלם';
      return task.status === status;
    });
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    try {
      // Handle Firebase Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      
      // Handle Date object
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      
      // Handle string or number
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTasks.map((task) => (
        <motion.div
          key={task.id}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setSelectedTask(task);
            setIsModalOpen(true);
          }}
          className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-800"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-[#e1e1e1]">{task.title}</h3>
            <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
              {task.status === 'pending' || task.status === 'לביצוע' ? 'לביצוע' :
               task.status === 'in_progress' || task.status === 'בתהליך' ? 'בתהליך' : 'הושלם'}
            </span>
          </div>
          {task.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{task.description}</p>
          )}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <FaClock className="w-4 h-4" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUser className="w-4 h-4" />
              <span>{task.assignedTo?.length || 0}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderTableView = () => {
    return (
      <div className="w-full overflow-x-auto bg-gray-900 rounded-lg shadow-lg">
        <TableAssignments
          tasks={filteredTasks}
          users={taskUsers}
          customers={customers}
          projects={projects}
          onTaskSelect={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>
    );
  };

  return (
    <div className="p-6  min-h-screen text-[#e1e1e1]" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e1e1e1]">משימות</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-[#ec5252] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#1a1a1a]'
              }`}
            >
              <FaColumns className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-[#ec5252] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#1a1a1a]'
              }`}
            >
              <FaThLarge className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-[#ec5252] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#1a1a1a]'
              }`}
            >
              <FaList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <TaskStatistics tasks={tasks} />

      {/* Search and Filters */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-md p-4 mt-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="חיפוש משימות..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-[#2a2a2a] text-[#e1e1e1] rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-gray-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-[#e1e1e1] rounded-lg hover:bg-[#333333] transition-colors"
            >
              <FaFilter className="w-4 h-4" />
              <span>סינון מתקדם</span>
              <FaChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'transform rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <FilterSection filters={filters} setFilters={setFilters} />
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-3 gap-6">
                {['לביצוע', 'בתהליך', 'הושלם'].map((status) => (
                  <Droppable key={status} droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 ${
                          snapshot.isDraggingOver ? 'bg-[#2a2a2a]' : ''
                        }`}
                      >
                        <div className={`flex items-center gap-2 mb-4 p-2 rounded-lg border ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <h3 className="text-lg font-semibold text-[#e1e1e1]">
                            {status}
                          </h3>
                          <span className="mr-auto bg-[#2a2a2a] px-2 py-0.5 rounded-full text-sm text-gray-400">
                            {getTasksByStatus(status).length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {getTasksByStatus(status).map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsModalOpen(true);
                                  }}
                                  className={`bg-[#2a2a2a] border border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-red-500' : ''
                                  }`}
                                >
                                  <h4 className="font-medium text-[#e1e1e1] mb-2">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                      <FaClock className="w-4 h-4" />
                                      <span>{formatDate(task.dueDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <FaUser className="w-4 h-4" />
                                      <span>{task.assignedTo?.length || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderTableView()}
        </>
      )}
      {/* Task Modal */}
      {!loading && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          users={taskUsers}
          projects={projects}
          customers={customers}
          onTaskUpdate={handleTaskUpdate}
          onCreateTask={handleCreateTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleTaskUpdate}
          subTasks={[]} comments={[]} />
      )}
    </div>
  );
};

export default Tasks;
