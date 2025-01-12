import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
import { FaSort, FaSortUp, FaSortDown, FaUser, FaEdit, FaTrash, FaCheck, FaChevronDown, FaHourglassHalf, FaPlayCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfo, FaTimes, FaPlus, FaSync, FaTasks, FaClock, FaCalendarAlt, FaCalendar, FaCalendarDay, FaUsers, FaUndo, FaListUl, FaSearch, FaFilter, FaSave, FaExternalLinkAlt, FaArrowUp, FaArrowDown, FaCalendarWeek, FaMinus, FaChevronUp } from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import CreateTaskModal from '../components/CreateTaskModal';
import { Customer } from '../types/customer';

const priorityOptions = [
  { value: 'גבוהה', label: 'גבוהה', icon: <FaExclamationCircle className="mr-2 text-red-500" /> },
  { value: 'בינונית', label: 'בינונית', icon: <FaExclamationTriangle className="mr-2 text-yellow-500" /> },
  { value: 'נמוכה', label: 'נמוכה', icon: <FaInfo className="mr-2 text-green-500" /> }
];

// Types
interface TaskCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: PriorityType;
  assignedTo?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  customers?: TaskCustomer[];
  urgency?: string;
  repeat?: string;
}

interface User {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}

type PriorityType = 'גבוהה' | 'בינונית' | 'נמוכה';

interface Filters {
  status: string[];
  assignedTo: string[];
  priority: string[];
  search: string;
  startDate: string;
  endDate: string;
  customers: string[];
}

interface DropdownOption {
  value: string;
  label: string;
  icon?: JSX.Element;
}

interface SortConfig {
  key: keyof Task | '';
  direction: 'asc' | 'desc';
}

interface NewTask {
  title: string;
  description: string;
  status: string;
  priority: PriorityType;
  dueDate?: Date;
  assignedTo: string[];
  project?: {
    id: string;
    name: string;
  };
  customers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>;
  repeat?: string;
  urgency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Project {
  id: string;
  name: string;
}

interface SimpleCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const TaskAssignment: React.FC = () => {
  const allowedStatuses = ['לביצוע', 'בתהליך', 'הושלם'];
  const allowedPriorities: PriorityType[] = ['גבוהה', 'בינונית', 'נמוכה'];
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  // Fetch users with error handling and retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const setupUsersListener = () => {
      try {
        const unsubscribe = onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as User[];
            setUsers(usersData);
            retryCount = 0; // Reset retry count on successful connection
          },
          (error) => {
            console.error('Error fetching users:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(setupUsersListener, retryDelay);
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up users listener:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupUsersListener, retryDelay);
        }
        return () => {}; // Return empty cleanup function if setup fails
      }
    };

    const unsubscribe = setupUsersListener();
    return () => unsubscribe();
  }, []);

  // Fetch projects with error handling and retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const setupProjectsListener = () => {
      try {
        const unsubscribe = onSnapshot(
          collection(db, 'projects'),
          (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Project[];
            setProjects(projectsData);
            retryCount = 0;
          },
          (error) => {
            console.error('Error fetching projects:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(setupProjectsListener, retryDelay);
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up projects listener:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupProjectsListener, retryDelay);
        }
        return () => {};
      }
    };

    const unsubscribe = setupProjectsListener();
    return () => unsubscribe();
  }, []);

  // Fetch customers with error handling and retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const setupCustomersListener = () => {
      try {
        console.log('Setting up customers listener...');
        const customersRef = collection(db, 'customers'); // Changed to lowercase 'customers'
        console.log('Customers collection reference:', customersRef.path);
        
        const unsubscribe = onSnapshot(
          customersRef,
          (snapshot) => {
            console.log('Received customers snapshot:', snapshot.size, 'documents');
            const customersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Customer[];
            console.log('Processed customers data:', customersData);
            setCustomers(customersData);
          },
          (error) => {
            console.error('Error fetching customers:', error);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up customers listener:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying customers setup (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
          setTimeout(() => setupCustomersListener(), retryDelay);
        }
        return () => {};
      }
    };

    const unsubscribe = setupCustomersListener();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Debug customers state changes
  useEffect(() => {
    if (customers.length === 0) {
      console.warn('Customers array is empty');
    } else {
      console.log('Customers state updated:', customers);
    }
  }, [customers]);

  useEffect(() => {
    console.log('Customers state updated:', customers);
  }, [customers]);

  const statusOptions = [
    { value: 'לביצוע', label: 'לביצוע', icon: <FaHourglassHalf className="text-blue-500" /> },
    { value: 'בתהליך', label: 'בתהליך', icon: <FaPlayCircle className="text-yellow-500" /> },
    { value: 'הושלם', label: 'הושלם', icon: <FaCheckCircle className="text-green-500" /> }
  ];

  const urgencyOptions = [
    { value: 'גבוהה', label: 'גבוהה', icon: <FaExclamationCircle className="text-red-500" /> },
    { value: 'בינונית', label: 'בינונית', icon: <FaExclamationTriangle className="text-yellow-500" /> },
    { value: 'נמוכ', label: 'נמוכ', icon: <FaInfo className="text-blue-500" /> }
  ];

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(collection(db, 'tasks'), taskId);
      
      // Create a clean copy of the updates
      const cleanUpdates = { ...updates };
      
      // Special handling for customers field
      if ('customers' in cleanUpdates) {
        cleanUpdates.customers = cleanUpdates.customers || [];
        // Ensure each customer has only id and name fields
        cleanUpdates.customers = cleanUpdates.customers.map(({ id, firstName, lastName, email, phone }) => ({ id, firstName, lastName, email, phone }));
      }
      
      // Filter out any undefined values
      const validUpdates = Object.fromEntries(
        Object.entries(cleanUpdates).filter(([_, value]) => value !== undefined)
      );
      
      if (Object.keys(validUpdates).length > 0) {
        await updateDoc(taskRef, validUpdates);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!newStatus) return;
    await handleTaskUpdate(taskId, { status: newStatus });
  };

  const handleUrgencyChange = async (taskId: string, newUrgency: string) => {
    if (!newUrgency) return;
    await handleTaskUpdate(taskId, { urgency: newUrgency });
  };

  const handleAssignedUsersChange = async (taskId: string, newUsers: string[]) => {
    await handleTaskUpdate(taskId, { 
      assignedTo: Array.isArray(newUsers) ? newUsers : [] 
    });
  };

  const handleProjectChange = async (taskId: string, project: { id: string; name: string } | undefined) => {
    await handleTaskUpdate(taskId, { project: project || undefined });
  };

  const handleCustomersChange = async (taskId: string, customers: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string }>) => {
    if (!Array.isArray(customers)) {
      customers = [];
    }
    
    // Ensure we only pass id and name fields
    const cleanCustomers: SimpleCustomer[] = customers.map(({ id, firstName, lastName, email, phone }) => ({
      id: id || '',
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone: phone || ''
    }));
    
    await handleTaskUpdate(taskId, { customers: cleanCustomers });
  };

  const handleInlineEdit = async (taskId: string, field: keyof Task, value: any) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        [field]: value,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    priority: [],
    assignedTo: [],
    startDate: '',
    endDate: '',
    customers: []
  });

  const [newTaskData, setNewTaskData] = useState<NewTask>({
    title: '',
    description: '',
    status: 'לביצוע',
    priority: 'בינונית',
    dueDate: new Date() ,
    assignedTo: [],
    repeat: 'none',
    project: undefined,
    customers: [],
    urgency: 'בינונית'
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const truncateText = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const handleReadMore = (task: Task) => {
    setSelectedTask({
      ...task,
      assignedTo: task.assignedTo || [],
      customers: task.customers || [],
      project: task.project || undefined,
    });
    setShowTaskModal(true);
  };

  useEffect(() => {
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    return () => {
      unsubscribeTasks();
    };
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setShowTaskModal(true);
    }
  }, [selectedTask]);

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleUserChange = (selectedIds: string[]) => {
    setNewTaskData(prev => ({
      ...prev,
      assignedTo: selectedIds
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: [],
      assignedTo: [],
      priority: [],
      search: '',
      startDate: '',
      endDate: '',
      customers: []
    });
    setSelectedUsers([]);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Filter by assigned users
      if (filters.assignedTo.length > 0 && !(task.assignedTo || []).some(userId => filters.assignedTo.includes(userId))) {
        return false;
      }

      // Filter by priority
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Filter by customers
      if (filters.customers.length > 0 && !(task.customers || []).some(customer => filters.customers.includes(customer.id))) {
        return false;
      }

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = (task.title || '').toLowerCase().includes(searchTerm);
        const matchesDescription = (task.description || '').toLowerCase().includes(searchTerm);
        const matchesProject = task.project?.name?.toLowerCase().includes(searchTerm) || false;
        const matchesCustomers = (task.customers || []).some(customer => 
          customer.firstName.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm)
        );
        const matchesAssignedUsers = (task.assignedTo || []).some(userId => {
          const user = users.find(u => u.id === userId);
          return user && (
            (user.firstName && user.lastName && 
              `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm)) ||
            (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
          );
        });

        if (!matchesTitle && !matchesDescription && !matchesProject && !matchesCustomers && !matchesAssignedUsers) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters, users]);

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

    // Handle different field types
    if (sortConfig.key === 'assignedTo') {
      return direction * ((a.assignedTo?.length || 0) - (b.assignedTo?.length || 0));
    }

    if (sortConfig.key === 'customers') {
      // Sort by customer names
      const aNames = (a.customers || []).map(c => `${c.firstName} ${c.lastName}`).sort().join(',');
      const bNames = (b.customers || []).map(c => `${c.firstName} ${c.lastName}`).sort().join(',');
      return direction * aNames.localeCompare(bNames);
    }

    if (sortConfig.key === 'project') {
      const aName = a.project?.name || '';
      const bName = b.project?.name || '';
      return direction * aName.localeCompare(bName);
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

  const repeatableTasks = tasks.filter(task => task.repeat !== 'none');
  const urgentTasks = tasks.filter(task => task.urgency);

  const [isRepeatableCardsOpen, setIsRepeatableCardsOpen] = useState(true);
  const [isUrgentCardsOpen, setIsUrgentCardsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const dailyTasks = repeatableTasks.filter(task => task.repeat === 'daily');
  const weeklyTasks = repeatableTasks.filter(task => task.repeat === 'weekly');
  const monthlyTasks = repeatableTasks.filter(task => task.repeat === 'monthly');

  const highUrgencyTasks = urgentTasks.filter(task => task.urgency === 'גבוהה');
  const mediumUrgencyTasks = urgentTasks.filter(task => task.urgency === 'בינונית');
  const lowUrgencyTasks = urgentTasks.filter(task => task.urgency === 'נמוכ');

  console.log('All urgent tasks:', urgentTasks);
  console.log('High urgency tasks:', highUrgencyTasks);
  console.log('Medium urgency tasks:', mediumUrgencyTasks);
  console.log('Low urgency tasks:', lowUrgencyTasks);

  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleDateChange = (taskId: string, value: string) => {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Set time to noon to avoid timezone issues
        date.setHours(12, 0, 0, 0);
        handleInlineEdit(taskId, 'dueDate', date.toISOString());
      }
    } catch (error) {
      console.error('Invalid date:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderTaskList = (tasks: Task[], sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey];
    const displayTasks = isExpanded ? tasks : tasks.slice(0, 3);
    const hasMore = tasks.length > 3;

    return (
      <div className="space-y-3">
        <div className="max-h-[400px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {displayTasks.map(task => (
            <div 
              key={task.id} 
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-0.5"
              onClick={() => {
                setSelectedTask(task);
                setShowTaskModal(true);
              }}
            >
              <h4 className="font-medium text-gray-800 mb-2">{task.title}</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-2">
                  <FaCalendarAlt />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </span>
                <span className="flex items-center gap-2">
                  <FaUser />
                  {task.assignedTo?.length || 0} משתמשים
                </span>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => toggleSection(sectionKey)}
            className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 transition-colors"
          >
            {isExpanded ? (
              <>
                <FaChevronUp className="text-xs" />
                הצג פחות
              </>
            ) : (
              <>
                <FaChevronDown className="text-xs" />
                הצג עוד {tasks.length - 3} משימות
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const TaskModal = ({ task, onClose }: { task: Task; onClose: () => void }) => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white p-6 rounded-lg w-full max-w-2xl m-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">{task.title}</h2>
            <button 
              onClick={() => onClose()} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 text-gray-700">תיאור:</h3>
            <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">{task.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-3">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">סטטוס:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium bg-${task.status === 'הושלם' ? 'green' : task.status === 'בתהליך' ? 'yellow' : 'blue'}-100 text-${task.status === 'הושלם' ? 'green' : task.status === 'בתהליך' ? 'yellow' : 'blue'}-800`}>{task.status}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">עדיפות:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium bg-${task.priority === 'גבוהה' ? 'red' : task.priority === 'בינונית' ? 'yellow' : 'green'}-100 text-${task.priority === 'גבוהה' ? 'red' : task.priority === 'בינונית' ? 'yellow' : 'green'}-800`}>{task.priority}</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">תאריך יעד:</span>
                <span className="text-gray-600">{task.dueDate}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">שייך ל:</span>
                <span className="text-gray-600">{task.assignedTo?.join(', ') || 'לא הוקצה'}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const handleCreateTask = async () => {
    try {
      if (!newTaskData.title) {
        console.error('Title is required');
        return;
      }

      const now = new Date().toISOString();
      const taskData = {
        ...newTaskData,
        createdAt: now,
        updatedAt: now,
        customers: newTaskData.customers?.map(customer => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        })) || []
      };

      const tasksRef = collection(db, 'tasks');
      await addDoc(tasksRef, taskData);

      // Reset form
      setNewTaskData({
        title: '',
        description: '',
        status: 'לביצוע',
        priority: 'בינונית',
        dueDate: new Date(),
        assignedTo: [],
        repeat: 'none',
        project: undefined,
        customers: [],
        urgency: 'בינונית'
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const NameModal = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskName.trim()) {
        try {
          const newTask = {
            title: newTaskName.trim(),
            description: '',
            status: 'לביצוע',
            priority: 'בינונית' as PriorityType,
            assignedTo: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const docRef = await addDoc(collection(db, 'tasks'), newTask);
          const createdTask = { ...newTask, id: docRef.id };
          
          setShowNameModal(false);
          setNewTaskName('');
          setSelectedTask(createdTask);
          setShowTaskModal(true);
        } catch (error) {
          console.error('Error creating task:', error);
        }
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30"></div>
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">משימה חדשה</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="שם המשימה"
                  className="w-full p-2 border border-gray-300 rounded text-right"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNameModal(false);
                    setNewTaskName('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                  disabled={!newTaskName.trim()}
                >
                  המשך
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-red-700 flex items-center gap-2">
          <FaTasks /> משימות
        </h1>
        <button
          onClick={() => setShowNameModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          משימה חדשה
        </button>
      </div>

      {/* Urgent Tasks Section */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div
          className="flex items-center justify-between cursor-pointer p-4 border-b border-gray-100"
          onClick={() => setIsUrgentCardsOpen(!isUrgentCardsOpen)}
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationCircle className="text-red-500" />
            משימות דחופות
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {highUrgencyTasks.length + mediumUrgencyTasks.length} משימות
            </span>
            <FaChevronDown
              className={`transition-transform duration-200 text-gray-400 ${isUrgentCardsOpen ? 'transform rotate-180' : ''}`}
            />
          </div>
        </div>
        
        <AnimatePresence>
          {isUrgentCardsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* High Urgency Tasks */}
                <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                    <FaArrowUp className="text-red-500" />
                    דחיפות גבוהה
                    <span className="text-sm font-normal text-red-500 ml-2">
                      ({highUrgencyTasks.length})
                    </span>
                  </h3>
                  {highUrgencyTasks.length > 0 ? (
                    renderTaskList(highUrgencyTasks, 'highUrgency')
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      אין משימות דחופות גבוהות
                    </div>
                  )}
                </div>

                {/* Medium Urgency Tasks */}
                <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-100">
                  <h3 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
                    <FaMinus className="text-yellow-500" />
                    דחיפות בינונית
                    <span className="text-sm font-normal text-yellow-600 ml-2">
                      ({mediumUrgencyTasks.length})
                    </span>
                  </h3>
                  {mediumUrgencyTasks.length > 0 ? (
                    renderTaskList(mediumUrgencyTasks, 'mediumUrgency')
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      אין משימות דחופות בינוניות
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Repeatable Tasks Section */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div
          className="flex items-center justify-between cursor-pointer p-4 border-b border-gray-100"
          onClick={() => setIsRepeatableCardsOpen(!isRepeatableCardsOpen)}
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaSync className="text-blue-500" />
            משימות חוזרות
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {dailyTasks.length + weeklyTasks.length + monthlyTasks.length} משימות
            </span>
            <FaChevronDown
              className={`transition-transform duration-200 text-gray-400 ${isRepeatableCardsOpen ? 'transform rotate-180' : ''}`}
            />
          </div>
        </div>
        
        <AnimatePresence>
          {isRepeatableCardsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Daily Tasks */}
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                    <FaClock className="text-blue-500" />
                    משימות יומיות
                    <span className="text-sm font-normal text-blue-500 ml-2">
                      ({dailyTasks.length})
                    </span>
                  </h3>
                  {dailyTasks.length > 0 ? (
                    renderTaskList(dailyTasks, 'dailyTasks')
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      אין משימות יומיות
                    </div>
                  )}
                </div>

                {/* Weekly Tasks */}
                <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                  <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                    <FaCalendarWeek className="text-purple-500" />
                    משימות שבועיות
                    <span className="text-sm font-normal text-purple-500 ml-2">
                      ({weeklyTasks.length})
                    </span>
                  </h3>
                  {weeklyTasks.length > 0 ? (
                    renderTaskList(weeklyTasks, 'weeklyTasks')
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      אין משימות שבועיות
                    </div>
                  )}
                </div>

                {/* Monthly Tasks */}
                <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                  <h3 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-indigo-500" />
                    משימות חודשיות
                    <span className="text-sm font-normal text-indigo-500 ml-2">
                      ({monthlyTasks.length})
                    </span>
                  </h3>
                  {monthlyTasks.length > 0 ? (
                    renderTaskList(monthlyTasks, 'monthlyTasks')
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      אין משימות חודשיות
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6 mb-8">
        <div className="flex justify-between items-center mb-6">
         
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
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                <Listbox
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500">
                      <span className="flex flex-wrap gap-2">
                        {filters.status.length > 0 ? (
                          filters.status.map(status => {
                            const option = statusOptions.find(opt => opt.value === status);
                            return option ? (
                              <span key={status} className="inline-flex items-center gap-1">
                                {option.icon}
                                <span>{option.label}</span>
                              </span>
                            ) : null;
                          })
                        ) : (
                          'כל הסטטוסים'
                        )}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {statusOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-red-50 text-red-900' : 'text-gray-900'
                              }`
                            }
                            value={option.value}
                          >
                            {({ selected }) => (
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                                {option.icon}
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                    <FaCheck className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">דחיפות</label>
                <Listbox
                  value={filters.priority}
                  onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500">
                      <span className="flex flex-wrap gap-2">
                        {filters.priority.length > 0 ? (
                          filters.priority.map(priority => {
                            const option = priorityOptions.find(opt => opt.value === priority);
                            return option ? (
                              <span key={priority} className="inline-flex items-center gap-1">
                                {option.icon}
                                <span>{option.label}</span>
                              </span>
                            ) : null;
                          })
                        ) : (
                          'כל הדחיפויות'
                        )}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {priorityOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-red-50 text-red-900' : 'text-gray-900'
                              }`
                            }
                            value={option.value}
                          >
                            {({ selected }) => (
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                                {option.icon}
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                    <FaCheck className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שייך ל</label>
                <Listbox
                  value={filters.assignedTo}
                  onChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500">
                      <span className="flex flex-wrap gap-2">
                        {filters.assignedTo.length > 0 ? (
                          filters.assignedTo.map(userId => {
                            const user = users.find(u => u.id === userId);
                            return user ? (
                              <span key={userId} className="inline-flex items-center gap-1">
                                <FaUser className="text-gray-400 w-3 h-3" />
                                <span className="truncate max-w-[100px]">
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.displayName || user.email}
                                </span>
                              </span>
                            ) : null;
                          })
                        ) : (
                          'כל המשתמשים'
                        )}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {users.map((user) => (
                          <Listbox.Option
                            key={user.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-red-50 text-red-900' : 'text-gray-900'
                              }`
                            }
                            value={user.id}
                          >
                            {({ selected }) => (
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.displayName || user.email}
                                </span>
                                <FaUser className={`${selected ? 'text-red-500' : 'text-gray-400'} w-4 h-4`} />
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                    <FaCheck className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">לקוחות</label>
                <Listbox
                  value={filters.customers}
                  onChange={(value) => setFilters(prev => ({ ...prev, customers: value }))}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500">
                      <span className="flex flex-wrap gap-2">
                        {filters.customers.length > 0 ? (
                          customers
                            .filter(c => filters.customers.includes(c.id))
                            .map(customer => (
                              <span key={customer.id} className="inline-flex items-center gap-1">
                                <FaUser className="text-gray-400 w-3 h-3" />
                                <span className="truncate max-w-[100px]">{`${customer.firstName} ${customer.lastName}`}</span>
                              </span>
                            ))
                        ) : (
                          'כל הלקוחות'
                        )}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {customers.map((customer) => (
                          <Listbox.Option
                            key={customer.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-green-50 text-green-900' : 'text-gray-900'
                              }`
                            }
                            value={customer.id}
                          >
                            {({ selected }) => (
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {`${customer.firstName} ${customer.lastName}`}
                                </span>
                                <FaUser className={`${selected ? 'text-green-500' : 'text-gray-400'} w-4 h-4`} />
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                                    <FaCheck className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
           
           
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="חפש משימות..."
              className="w-full border border-gray-300 rounded-lg px-10 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Active Filters */}
        {(filters.status.length > 0 || filters.assignedTo.length > 0 || filters.search) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.status.map(status => (
              <span key={status} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                <FaHourglassHalf className="text-yellow-500" />
                {status}
                <button 
                  onClick={() => handleFilterChange('status', filters.status.filter(s => s !== status))}
                  className="ml-1 hover:text-yellow-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            {filters.assignedTo.map(userId => (
              <span key={userId} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <FaUser className="text-blue-500" />
                {users.find(u => u.id === userId)?.firstName && users.find(u => u.id === userId)?.lastName 
                  ? `${users.find(u => u.id === userId)?.firstName} ${users.find(u => u.id === userId)?.lastName}`
                  : users.find(u => u.id === userId)?.displayName || users.find(u => u.id === userId)?.email}
                <button 
                  onClick={() => handleFilterChange('assignedTo', filters.assignedTo.filter(id => id !== userId))}
                  className="ml-1 hover:text-blue-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <FaSearch className="text-blue-500" />
                חיפוש: {filters.search}
                <button 
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-blue-800"
                >
                  <FaTimes />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden border border-red-300">
          <thead className="bg-gray-50 border-b border-red-300">
            <tr>
              <th scope="col" className="w-10 px-2 py-3">
                <span className="sr-only">פתח משימה</span>
              </th>
              <th 
                scope="col" 
                className="min-w-[200px] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  משימה
                  {sortConfig.key === 'title' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  סטטוס
                  {sortConfig.key === 'status' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-2">
                  עדיפות
                  {sortConfig.key === 'priority' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-2">
                  תאריך יעד
                  {sortConfig.key === 'dueDate' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('assignedTo')}
              >
                <div className="flex items-center gap-2">
                  שייך ל
                  {sortConfig.key === 'assignedTo' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('project')}
              >
                <div className="flex items-center gap-2">
                  פרויקט
                  {sortConfig.key === 'project' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('customers')}
              >
                <div className="flex items-center gap-2">
                  לקוחות
                  {sortConfig.key === 'customers' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-200">
            {sortedTasks.map((task) => (
              <tr 
                key={task.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-2 py-3 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask({
                        ...task,
                        assignedTo: task.assignedTo || [],
                        customers: task.customers || [],
                        project: task.project || undefined,
                      });
                      setShowTaskModal(true);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200"
                  >
                    <FaExternalLinkAlt className="text-gray-500 hover:text-red-500 w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {task.title}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Listbox
                      value={task.status}
                      onChange={(value) => handleInlineEdit(task.id, 'status', value)}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                          <span className="flex items-center gap-2">
                            {task.status === 'הושלם' ? <FaCheckCircle className="text-green-500" /> : null}
                            <span className="ml-2">{task.status}</span>
                            <FaChevronDown className="ml-auto h-4 w-4" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {statusOptions.map((option) => (
                              <Listbox.Option
                                key={option.value}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  }`
                                }
                                value={option.value}
                              >
                                {({ selected }) => (
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {option.label}
                                    </span>
                                    {option.icon}
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                        <FaCheck className="h-4 w-4" aria-hidden="true" />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Listbox
                      value={task.priority}
                      onChange={(value) => handleInlineEdit(task.id, 'priority', value)}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium 
                            ${task.priority === 'גבוהה' ? 'bg-red-100 text-red-800' :
                            task.priority === 'בינונית' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'}`}>
                            <span className="ml-2">{task.priority}</span>
                            {priorityOptions.find(option => option.value === task.priority)?.icon}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm right-0">
                            {priorityOptions.map((option) => (
                              <Listbox.Option
                                key={option.value}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  }`
                                }
                                value={option.value}
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {option.label}
                                      </span>
                                      {option.icon}
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                          <FaCheck className="h-4 w-4" />
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={task.dueDate ? formatDateForInput(task.dueDate) : ''}
                      onChange={(e) => handleDateChange(task.id, e.target.value)}
                      className="border-0 bg-transparent focus:ring-2 focus:ring-red-500 rounded-lg px-2 py-1"
                    />
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Listbox
                      value={task.assignedTo}
                      onChange={(value) => handleInlineEdit(task.id, 'assignedTo', value)}
                      multiple
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                          <div className="flex flex-wrap gap-1">
                            {(task.assignedTo || []).map(userId => {
                              const user = users.find(u => u.id === userId);
                              return user ? (
                                <span
                                  key={userId}
                                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                                >
                                  <FaUser className="text-gray-400 w-3 h-3" />
                                  <span className="truncate max-w-[100px]">
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}`
                                      : user.displayName || user.email}
                                  </span>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {users.map((user) => (
                              <Listbox.Option
                                key={user.id}
                                value={user.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-50 text-red-900' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {user.firstName && user.lastName 
                                          ? `${user.firstName} ${user.lastName}`
                                          : user.displayName || user.email}
                                      </span>
                                      <FaUser className={`${selected ? 'text-red-500' : 'text-gray-400'} w-4 h-4`} />
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                        <FaCheck className="h-4 w-4" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Listbox
                      value={task.project}
                      onChange={(value) => handleInlineEdit(task.id, 'project', value)}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-purple-500">
                          {task.project ? (
                            <span className="inline-flex items-center">
                              <FaTasks className="mr-2 text-purple-500" />
                              <span>{task.project.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">בחר פרויקט</span>
                          )}
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            <Listbox.Option
                              key="none"
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-purple-50 text-purple-900' : 'text-gray-900'
                                }`
                              }
                              value={undefined}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                   -
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                      <FaCheck className="h-5 w-5" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                            {projects.map((project) => (
                              <Listbox.Option
                                key={project.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-purple-50 text-purple-900' : 'text-gray-900'
                                  }`
                                }
                                value={project}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {project.name}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                        <FaCheck className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Listbox
                      value={task.customers || []}
                      onChange={(value) => handleInlineEdit(task.id, 'customers', value)}
                      multiple
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <div className="flex flex-wrap gap-1">
                            {(task.customers || []).map(customer => (
                              <span
                                key={customer.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                <FaUser className="text-green-500 w-3 h-3 mr-1" />
                                <span className="truncate max-w-[100px]">{`${customer.firstName} ${customer.lastName}`}</span>
                              </span>
                            ))}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {customers.map((customer) => (
                              <Listbox.Option
                                key={customer.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-green-50 text-green-900' : 'text-gray-900'
                                  }`
                                }
                                value={customer}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {`${customer.firstName} ${customer.lastName}`}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                                        <FaCheck className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </td>
              </tr>
            ))}
            {/* Empty row at the bottom */}
            <tr className="h-36">
              <td colSpan={7} className="px-6 py-4 whitespace-nowrap"></td>
            </tr>
          </tbody>
        </table>
        {/* div with 50px padidng and text right align */}
        <div className="p-36">
          <p className="text-right">
            <span className="font-bold"></span>{' '}
            <span className="text-green-500 font-bold">
            </span>
          </p>
        </div>
      </div>

      {showTaskModal && selectedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
          >
            <div className="p-3">
              <div className="flex justify-between items-start  border-b ">
                <h2 className="text-xl font-bold text-gray-900 text-right">{selectedTask.title}</h2>
                <button 
                  onClick={() => setSelectedTask(null)} 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="space-y-1">
                <div className="bg-gray-50 rounded-lg">
                  <h3 className="text-md font-semibold text-gray-900  text-right">כותרת</h3>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      updateDoc(taskRef, { title: e.target.value });
                      setSelectedTask({ ...selectedTask, title: e.target.value });
                    }}
                    className="w-full border-0 bg-transparent focus:ring-2 focus:ring-red-500 rounded-lg px-2 py-1"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-1 ">
                  <h3 className="text-md font-semibold text-gray-900  text-right">תיאור המשימה</h3>
                  <textarea
                    value={selectedTask.description}
                    onChange={(e) => {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      updateDoc(taskRef, { description: e.target.value });
                      setSelectedTask({ ...selectedTask, description: e.target.value });
                    }}
                    rows={2}
                    className="w-full border-0 bg-transparent focus:ring-2 focus:ring-red-500 rounded-lg px-2 py-1 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">סטטוס</h3>
                    <Listbox
                      value={selectedTask.status}
                      onChange={(value) => {
                        const taskRef = doc(db, 'tasks', selectedTask.id);
                        updateDoc(taskRef, { status: value });
                        setSelectedTask({ ...selectedTask, status: value });
                      }}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium 
                            ${selectedTask.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                            selectedTask.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}>
                            <span className="ml-2">{selectedTask.status}</span>
                            {statusOptions.find(option => option.value === selectedTask.status)?.icon}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {statusOptions.map((option) => (
                              <Listbox.Option
                                key={option.value}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  }`
                                }
                                value={option.value}
                              >
                                {option.icon}
                                
                                
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">דחיפות</h3>
                    <Listbox
                      value={selectedTask.urgency || 'בינונית'}
                      onChange={(value) => {
                        const taskRef = doc(db, 'tasks', selectedTask.id);
                        updateDoc(taskRef, { urgency: value });
                        setSelectedTask({ ...selectedTask, urgency: value });
                      }}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium 
                            ${selectedTask.urgency === 'גבוהה' ? 'bg-red-100 text-red-800' :
                            selectedTask.urgency === 'בינונית' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}>
                            <span className="ml-2">{selectedTask.urgency || 'בינונית'}</span>
                            {urgencyOptions.find(option => option.value === selectedTask.urgency)?.icon}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {urgencyOptions.map((option) => (
                              <Listbox.Option
                                key={option.value}
                                value={option.value}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  }`
                                }
                              >
                                {option.icon}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">שייך ל</h3>
                    <Listbox
                      value={selectedTask.assignedTo || []}
                      onChange={(value) => {
                        const taskRef = doc(db, 'tasks', selectedTask.id);
                        // Ensure value is always an array
                        const assignedUsers = Array.isArray(value) ? value : [value];
                        updateDoc(taskRef, { assignedTo: assignedUsers });
                        setSelectedTask({ ...selectedTask, assignedTo: assignedUsers });
                      }}
                      multiple
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                          <div className="flex flex-wrap gap-1">
                            {(selectedTask.assignedTo || []).map(userId => {
                              const user = users.find(u => u.id === userId);
                              return user ? (
                                <span
                                  key={userId}
                                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                                >
                                  <FaUser className="text-gray-400 w-3 h-3" />
                                  <span className="truncate max-w-[100px]">
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}`
                                      : user.displayName || user.email}
                                  </span>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {users.map((user) => (
                              <Listbox.Option
                                key={user.id}
                                value={user.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-50 text-red-900' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {user.firstName && user.lastName 
                                          ? `${user.firstName} ${user.lastName}`
                                          : user.displayName || user.email}
                                      </span>
                                      <FaUser className={`${selected ? 'text-red-500' : 'text-gray-400'} w-4 h-4`} />
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                        <FaCheck className="h-4 w-4" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">תאריך יעד</h3>
                    <input
                      type="date"
                      value={selectedTask.dueDate ? formatDateForInput(selectedTask.dueDate) : ''}
                      onChange={(e) => {
                        const taskRef = doc(db, 'tasks', selectedTask.id);
                        updateDoc(taskRef, { dueDate: new Date(e.target.value).toISOString() });
                        setSelectedTask({ ...selectedTask, dueDate: new Date(e.target.value).toISOString() });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">פרויקט</h3>
                    <Listbox
                      value={selectedTask.project}
                      onChange={(value) => {
                        const taskRef = doc(db, 'tasks', selectedTask.id);
                        updateDoc(taskRef, { project: value || undefined });
                        setSelectedTask({ ...selectedTask, project: value });
                      }}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-purple-500">
                          {selectedTask.project ? (
                            <span className="inline-flex items-center">
                              <FaTasks className="mr-2 text-purple-500" />
                              <span>{selectedTask.project.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">בחר פרויקט</span>
                          )}
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            <Listbox.Option
                              key="none"
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-purple-50 text-purple-900' : 'text-gray-900'
                                }`
                              }
                              value={undefined}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                   -
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                      <FaCheck className="h-5 w-5" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                            {projects.map((project) => (
                              <Listbox.Option
                                key={project.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-purple-50 text-purple-900' : 'text-gray-900'
                                  }`
                                }
                                value={project}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {project.name}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                        <FaCheck className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">לקוחות</h3>
                    <Listbox
                      value={selectedTask.customers || []}
                      onChange={(value) => {
                        if (selectedTask?.id && Array.isArray(value)) {
                          const validCustomers = value.filter(customer => 
                            customer && typeof customer === 'object' && 'id' in customer && 'firstName' in customer && 'lastName' in customer
                          );
                          handleTaskUpdate(selectedTask.id, { customers: validCustomers });
                          setSelectedTask({ ...selectedTask, customers: validCustomers });
                        }
                      }}
                      multiple
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <div className="flex flex-wrap gap-1">
                            {(selectedTask.customers || []).map(customer => (
                              <span
                                key={customer.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                <FaUser className="text-green-500 w-3 h-3 mr-1" />
                                <span className="truncate max-w-[100px]">{`${customer.firstName} ${customer.lastName}`}</span>
                              </span>
                            ))}
                          </div>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {customers.map((customer) => (
                              <Listbox.Option
                                key={customer.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-green-50 text-green-900' : 'text-gray-900'
                                  }`
                                }
                                value={customer}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {`${customer.firstName} ${customer.lastName}`}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                                        <FaCheck className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <motion.button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  ביטול
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-400 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2"
                  onClick={async () => {
                    try {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      await updateDoc(taskRef, {
                        title: selectedTask.title,
                        description: selectedTask.description,
                        status: selectedTask.status,
                        urgency: selectedTask.urgency,
                        assignedTo: selectedTask.assignedTo,
                        dueDate: selectedTask.dueDate,
                        updatedAt: new Date().toISOString()
                      });
                      setSelectedTask(null);
                    } catch (error) {
                      console.error('Error saving task:', error);
                    }
                  }}
                >
                  <FaSave className="ml-2 -mr-1 h-4 w-4" />
                  שמור שינויים
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={async () => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
                      try {
                        await deleteDoc(doc(collection(db, 'tasks'), selectedTask.id));
                        setSelectedTask(null);
                      } catch (error) {
                        console.error('Error deleting task:', error);
                      }
                    }
                  }}
                >
                  <FaTrash className="ml-2 -mr-1 h-4 w-4" />
                  מחק משימה
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showNameModal && <NameModal />}
      {isModalOpen && (
        <CreateTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateTask={handleCreateTask}
          users={users}
          projects={projects}
          customers={customers} // Pass customers to modal
        />
      )}
    </div>
  );
};

export default TaskAssignment;
