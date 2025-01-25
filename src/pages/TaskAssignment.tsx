import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, addDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, setDoc, Timestamp, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { FaSort, FaSortUp, FaSortDown, FaUser, FaEdit, FaTrash, FaCheck, FaChevronDown, FaHourglassHalf, FaPlayCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfo, FaTimes, FaPlus, FaSync, FaTasks, FaClock, FaCalendarAlt, FaCalendar, FaCalendarDay, FaUsers, FaUndo, FaListUl, FaSearch, FaFilter, FaSave, FaExternalLinkAlt, FaArrowUp, FaArrowDown, FaCalendarWeek, FaMinus, FaChevronUp, FaProjectDiagram } from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { CustomerClass } from '../types/customer';
import { Task, TaskCustomer, Project, SubTask } from '../types/schemas';
import TaskModal from '../components/modals/TaskModal';
import { User } from '../types/schemas';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateTask from '../components/CreateTask';
import TableAssignments from '../components/TableAssignments';

const statusOptions = [
  { value: 'לביצוע', icon: <FaHourglassHalf className="h-5 w-5 text-blue-500" />, bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  { value: 'בתהליך', icon: <FaPlayCircle className="h-5 w-5 text-yellow-500" />, bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { value: 'הושלם', icon: <FaCheckCircle className="h-5 w-5 text-green-500" />, bgColor: 'bg-green-100', textColor: 'text-green-800' }
];

// Types

interface Filters {
  status: string[];
  assignedTo: string[];
  search: string;
  startDate: string;
  endDate: string;
  customers: string[];
  projects: string[];
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

const getStatusText = (status: string): string => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? option.value : status;
};

const getUrgencyText = (urgent?: string): string => {
  switch (urgent) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Not defined';
  }
};

const TaskAssignment: React.FC = () => {
  const allowedStatuses = ['לביצוע', 'בתהליך', 'הושלם'];
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<CustomerClass[]>([]);
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
    const retryDelay = 1000;

    const setupProjectsListener = () => {
      try {
        console.log('Setting up projects listener...');
        const projectsRef = collection(db, 'projects');
        
        const unsubscribe = onSnapshot(
          projectsRef,
          (snapshot) => {
            console.log('Received projects snapshot:', snapshot.size, 'documents');
            const projectsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Project[];
            console.log('Processed projects data:', projectsData);
            setProjects(projectsData);
          },
          (error) => {
            console.error('Error fetching projects:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying projects setup (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
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
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Debug projects state changes
  useEffect(() => {
    console.log('Projects state updated:', projects);
  }, [projects]);

  // Fetch customers with error handling and retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const setupCustomersListener = () => {
      try {
        console.log('Setting up customers listener...');
        const customersRef = collection(db, 'Customers'); // Changed to lowercase 'customers'
        console.log('Customers collection reference:', customersRef.path);
        
        const unsubscribe = onSnapshot(
          customersRef,
          (snapshot) => {
            console.log('Received customers snapshot:', snapshot.size, 'documents');
            const customersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as CustomerClass[];
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

  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', taskId, 'with updates:', updates);
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        console.error(`Task with ID ${taskId} does not exist`);
        toast.error('לא ניתן למצוא את המשימה לעדכון');
        return;
      }

      // Get the current task data
      const currentTask = taskDoc.data() as Task;
      console.log('Current task data:', currentTask);
      
      // Create the update object
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser?.uid || ''
      };

      // Special handling for dates
      if (updates.dueDate && typeof updates.dueDate !== 'object' || (updates.dueDate && !('seconds' in updates.dueDate))) {
        if (typeof updates.dueDate === 'string') {
          updateData.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
        } else if (updates.dueDate && typeof updates.dueDate === 'object' && 'getTime' in updates.dueDate) {
          updateData.dueDate = Timestamp.fromDate(updates.dueDate);
        }
      }

      // Ensure arrays are always arrays
      if (updates.assignedTo && !Array.isArray(updates.assignedTo)) {
        updateData.assignedTo = [updates.assignedTo];
      }
      if (updates.customers && !Array.isArray(updates.customers)) {
        updateData.customers = [updates.customers];
      }
      if (updates.subTasks && !Array.isArray(updates.subTasks)) {
        updateData.subTasks = [updates.subTasks];
      }
      if (updates.comments && !Array.isArray(updates.comments)) {
        updateData.comments = [updates.comments];
      }

      // If we're updating status, ensure it's valid
      if (updates.status && !allowedStatuses.includes(updates.status)) {
        console.error('Invalid status:', updates.status);
        toast.error('סטטוס לא חוקי');
        return;
      }

      // Proceed with update
      await updateDoc(taskRef, updateData);
      console.log('Update successful. New data:', updateData);
      toast.success('המשימה עודכנה בהצלחה');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('שגיאה בעדכון המשימה');
    }
  };

  const handleAssignedUsersChange = async (taskId: string, newUsers: string[]) => {
    await handleUpdateTask(taskId, { assignedTo: newUsers });
  };

  const handleCustomersChange = async (taskId: string, customers: CustomerClass[]) => {
    await handleUpdateTask(taskId, { customers });
  };

  const handleInlineEdit = async (taskId: string, field: keyof Task, value: any) => {
    await handleUpdateTask(taskId, { [field]: value });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!newStatus || !allowedStatuses.includes(newStatus)) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      await updateDoc(taskRef, {
        status: newStatus,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    assignedTo: [],
    startDate: '',
    endDate: '',
    customers: [],
    projects: []
  });

  const [newTaskData, setNewTaskData] = useState<Task>({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    status: 'לביצוע',
    assignedTo: [],
    repeat: 'none',
    customers: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: currentUser?.uid || '', // Add this line
    updatedBy: currentUser?.uid || '', // Add this line
    urgent: 'גבוהה',
    isFavorite: false,
    tasks: [],
    files: [],
    links: [],
    comments: [],
    subTasks: [],
    project: null,
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  // Add state for subtask modal
  const [showSubTaskModal, setShowSubTaskModal] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [newSubTaskData, setNewSubTaskData] = useState<SubTask>({
    id: crypto.randomUUID(),
    title: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: '',
    urgent: 'גבוהה',
    status: 'לביצוע',
    dueDate: null,
    description: '',
    completed: false

  });

  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);

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
    console.log('Starting to fetch tasks...');
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      console.log('Raw snapshot data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const tasksData = snapshot.docs.map(doc => {
        const data = doc.data();
        const task = {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'לביצוע',
          assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [],
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate : (data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null),
          project: data.project ? {
            id: data.project.id || '',
            name: data.project.name || '',
            status: data.project.status || '',
            budget: data.project.budget || 0,
            createdAt: data.project.createdAt || null,
            customerId: data.project.customerId || '',
            description: data.project.description || '',
            endDate: data.project.endDate || null,
            isFavorite: data.project.isFavorite || false,
            startDate: data.project.startDate || null
          } : undefined,
          customers: Array.isArray(data.customers) ? data.customers.map(customer => ({
            id: customer.id || '',
            name: customer.name || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phone: customer.phone || ''
          })) : [],
          urgency: data.urgency || 'נמוכה',
          repeat: data.repeat || 'לא',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
          createdBy: data.createdBy || '',
          updatedBy: data.updatedBy || '',
          comments: Array.isArray(data.comments) ? data.comments : [],
          subTasks: Array.isArray(data.subTasks) ? data.subTasks : []
        } as unknown as Task;
        console.log('Processed task:', task);
        return task;
      });
      
      console.log('All processed tasks:', tasksData);
      setTasks(tasksData);
    }, (error) => {
      console.error('Error fetching tasks:', error);
    });

    return () => unsubscribeTasks();
  }, []);

  // Debug tasks state changes
  useEffect(() => {
    console.log('Tasks state updated:', tasks);
  }, [tasks]);

  useEffect(() => {
    if (selectedTask) {
      setShowTaskModal(true);
    }
  }, [selectedTask]);

  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

  const handleFilterChange = (filterName: string, value: any) => {
    setHasAppliedFilters(true);
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setHasAppliedFilters(false);
    setFilters({
      status: [],
      assignedTo: [],
      search: '',
      startDate: '',
      endDate: '',
      customers: [],
      projects: []
    });
    setSelectedUsers([]);
  };

  const filteredTasks = useMemo(() => {
    console.log('Filtering tasks:', tasks);
    console.log('Current filters:', filters);

    if (!hasAppliedFilters) {
      return tasks;
    }

    return tasks.filter(task => {
      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Filter by assigned users
      if (filters.assignedTo.length > 0 && !(task.assignedTo || []).some(userId => filters.assignedTo.includes(userId))) {
        return false;
      }

      // Filter by customers
      if (filters.customers.length > 0 && !(task.customers || []).some(customer => filters.customers.includes(customer.id))) {
        return false;
      }

      // Filter by projects
      if (filters.projects.length > 0) {
        const projectMatches = filters.projects.includes(task.project?.id || '') || 
                             (task.project && filters.projects.includes(task.project.id));
        if (!projectMatches) {
          return false;
        }
      }

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = (task.title || '').toLowerCase().includes(searchTerm);
        const matchesDescription = (task.description || '').toLowerCase().includes(searchTerm);
        const matchesProject = task.project?.name?.toLowerCase().includes(searchTerm) || 
                           projects.find(p => p.id === task.project?.id)?.name?.toLowerCase().includes(searchTerm) || 
                           false;
        const matchesCustomers = (task.customers || []).some(customer => 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm)
        );
        const matchesAssignedUsers = (task.assignedTo || []).some(userId => {
          const user = users.find(u => u.id === userId);
          return user && (
            (user.firstName && user.lastName && 
              `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm)) ||
            (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
          );
        });

        if (!matchesTitle && !matchesDescription && !matchesProject && !matchesCustomers && !matchesAssignedUsers) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters, users, hasAppliedFilters]);

  useEffect(() => {
    console.log('Filtered tasks updated:', filteredTasks);
  }, [filteredTasks]);

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
      const aNames = (a.customers || []).map(c => `${c.name} ${c.lastName}`).sort().join(',');
      const bNames = (b.customers || []).map(c => `${c.name} ${c.lastName}`).sort().join(',');
      return direction * aNames.localeCompare(bNames);
    }

    if (sortConfig.key === 'project') {
      const aName = (a.project?.name || projects.find(p => p.id === a.project?.id)?.name) || '';
      const bName = (b.project?.name || projects.find(p => p.id === b.project?.id)?.name) || '';
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
  const urgentTasks = tasks.filter(task => task.urgent);

  const [isRepeatableCardsOpen, setIsRepeatableCardsOpen] = useState(true);
  const [isUrgentCardsOpen, setIsUrgentCardsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const dailyTasks = repeatableTasks.filter(task => task.repeat === 'daily');
  const weeklyTasks = repeatableTasks.filter(task => task.repeat === 'weekly');
  const monthlyTasks = repeatableTasks.filter(task => task.repeat === 'monthly');

  const highUrgencyTasks = urgentTasks.filter(task => task.urgent === 'גבוהה');
  const mediumUrgencyTasks = urgentTasks.filter(task => task.urgent === 'בינונית');
  const lowUrgencyTasks = urgentTasks.filter(task => task.urgent === 'נמוכה');

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
                  {task.dueDate 
                    ? ('toDate' in task.dueDate ? task.dueDate.toDate() : task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </span>
                <span className="flex items-center gap-2">
                  <FaUser />
                  {task.assignedTo?.length || 0} users
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
                Show less
              </>
            ) : (
              <>
                <FaChevronDown className="text-xs" />
                Show more {tasks.length - 3} tasks
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const handleDeleteSubTask = async (taskId: string, subTaskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      const updatedTask = { ...selectedTask };
      const updatedSubTasks = updatedTask.subTasks?.filter(st => st.id !== subTaskId) || [];
      
      await updateDoc(taskRef, {
        subTasks: updatedSubTasks
      });

      setSelectedTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subTasks: updatedSubTasks
        } as Task;
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleAddSubTask = async (taskId: string) => {
    if (!newSubTaskTitle.trim()) return;

    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      const newSubTask: Task = {
        id: crypto.randomUUID(),
        title: newSubTaskTitle,
        description: '',
        status: 'לביצוע',
        dueDate: null,
        assignedTo: [],
        customers: [],
        urgent: 'גבוהה',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.uid || '',
        updatedBy: currentUser?.uid || '',
        isDeleted: false,
        isFavorite: false,
        tasks: [],
        files: [],
        links: [],
      };

      await updateDoc(taskRef, {
        subTasks: arrayUnion(newSubTask)
      });

      setNewSubTaskTitle('');
      setSelectedTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subTasks: [...(prev.subTasks || []), newSubTask]
        } as Task;
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string, completed: boolean) => {
    if (!selectedTask) {
      console.error('No task selected');
      return;
    }
    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      const subTasks = selectedTask.subTasks || [];
      const updatedSubTasks = subTasks.map(subTask => {
        if (subTask.id === subTaskId) {
          return { ...subTask, completed };
        }
        return subTask;
      });
      await updateDoc(taskRef, {
        subTasks: updatedSubTasks
      });
      
      // Update local state
      setSelectedTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subTasks: updatedSubTasks
        } as Task;
      });
    } catch (error) {
      console.error('Error toggling sub-task:', error);
    }
  };

  // Add function to handle subtask creation
  const handleCreateSubTask = async () => {
    if (!parentTaskId) return;
    
    try {
      const taskRef = doc(db, 'tasks', parentTaskId);  // Changed from 'Task' to 'tasks'
      const newSubTask: SubTask = {
        id: crypto.randomUUID(),
        title: newSubTaskData.title,
        description: newSubTaskData.description,
        status: 'בתהליך',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.uid || '',
        urgent: 'גבוהה',
        dueDate: undefined,
        completed: false
      };

      const parentTask = tasks.find(t => t.id === parentTaskId);
      if (!parentTask) return;

      const updatedSubTasks = [...(parentTask.subTasks || []), newSubTask];
      
      await updateDoc(taskRef, {
        subTasks: updatedSubTasks
      });

      setNewSubTaskData({
        id: crypto.randomUUID(),
        title: newSubTaskData.title,
        description: newSubTaskData.description,
        status: 'בתהליך',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.uid || '',
        urgent: 'גבוהה',
        dueDate: undefined,
        completed: false
      });
      setShowSubTaskModal(false);
      setParentTaskId(null);
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const TaskDetailsModal = ({ task, onClose }: { task: Task; onClose: () => void }) => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-300">{task.title}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onClose();
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <FaEdit className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                <p className="text-gray-300">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status ?? '')}`}>
                  {getStatusText(task.status ?? '')}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Urgency</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(task.urgent ?? '')}`}>
                  {getUrgencyText(task.urgent ?? '')}
                </span>
              </div>
            </div>

            {(task.project || task.project) && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Project</h3>
                <span className="text-gray-300">
                  {task.project?.name || projects.find(p => p.id === task.project?.id)?.name || 'Unknown Project'}
                </span>
              </div>
            )}

            {task.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Due Date</h3>
                <div className="flex items-center space-x-2">
                  <FaCalendarAlt className="text-gray-400" />
                  <span className="text-gray-300">
                    {task.dueDate.toDate().toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            )}

            {task.assignedTo && task.assignedTo.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Assigned To</h3>
                <div className="flex flex-wrap gap-2">
                  {task.assignedTo.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <span
                        key={userId || `temp-${crypto.randomUUID()}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#1a1a1a] text-gray-300"
                      >
                        <FaUser className="mr-1 text-gray-400" />
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User'}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {task.customers && task.customers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Customers</h3>
                <div className="flex flex-wrap gap-2">
                  {task.customers.map(customer => (
                    <span
                      key={customer.id || `temp-${crypto.randomUUID()}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#1a1a1a] text-gray-300"
                    >
                      <FaUser className="mr-1 text-gray-400" />
                      {customer.name || 'Unnamed Customer'} {customer.lastName || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-400">Subtasks</h3>
                <button
                  onClick={() => {
                    setParentTaskId(task.id);
                    setShowSubTaskModal(true);
                  }}
                  className="text-blue-500 hover:text-blue-400 flex items-center space-x-2"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Add subtask</span>
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {task.subTasks?.map((subTask) => (
                  <div 
                    key={subTask.id || `temp-${crypto.randomUUID()}`}
                    className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        onChange={(e) => handleToggleSubTask(task.id, subTask.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`text-sm ${subTask.createdBy ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                        {subTask.title}
                      </span>
                    </div>
                    {subTask.dueDate && (
                      <span className="text-xs text-gray-500">
                        {new Date(subTask.dueDate).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const MultiSelectDropdown = ({ 
    options, 
    selectedValues, 
    onChange, 
    placeholder = 'בחר אפשרויות', 
    className = 'z-40',
    onInteractionStart
  }: { 
    options: { value: string; label: string }[], 
    selectedValues: string[], 
    onChange: (newValues: string[]) => void, 
    placeholder?: string, 
    className?: string,
    onInteractionStart?: (e: React.MouseEvent) => void
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (value: string) => {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange(newSelectedValues);
    };

    return (
      <div 
        className={`relative ${className}`} 
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click event
          onInteractionStart?.(e);
        }}
      >
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click event
            setIsOpen(!isOpen);
          }}
          className="w-full bg-[#2a2a2a] text-white border border-gray-700 rounded-md px-2 py-1 text-left flex justify-between items-center"
        >
          {selectedValues.length > 0 
            ? `נבחרו ${selectedValues.length} פריטים` 
            : placeholder}
          <span>{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div 
            className="absolute z-10 w-full bg-[#2a2a2a] border border-gray-700 rounded-md mt-1 max-h-60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent row click event
          >
            {options.map(option => (
              <div 
                key={option.value || `temp-${crypto.randomUUID()}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click event
                  toggleOption(option.value);
                }}
                className={`px-2 py-1 cursor-pointer hover:bg-gray-700 ${
                  selectedValues.includes(option.value) ? 'bg-blue-600' : ''
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedValues.includes(option.value)}
                  readOnly 
                  className="mr-2"
                  onClick={(e) => e.stopPropagation()} // Prevent row click event
                />
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleCreateTask = async (taskData: Task) => {
    try {
      const newTask = {
        ...taskData,
        status: taskData.status || 'לביצוע',
        urgent: taskData.urgent || 'נמוכה',
        assignedTo: Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [],
        customers: Array.isArray(taskData.customers) ? taskData.customers : [],
        dueDate: taskData.dueDate instanceof Timestamp ? taskData.dueDate : (taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null),
        project: taskData.project ? taskData.project : null,  
        subTasks: taskData.subTasks || [],
        createdAt: Timestamp.now(),
        createdBy: currentUser?.uid || '',
        updatedAt: Timestamp.now(),
        updatedBy: currentUser?.uid || '',
        isDeleted: false,
        repeat: taskData.repeat || 'none',
        comments: taskData.comments || [],
        links: taskData.links || [],
        files: taskData.files || [],
        tasks: taskData.tasks || [],
      };

      const tasksRef = collection(db, 'tasks');
      await addDoc(tasksRef, newTask);
      
      setIsModalOpen(false);
      toast.success('המשימה נוצרה בהצלחה');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('שגיאה ביצירת המשימה');
    }
  };

  const NameModal = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskName.trim()) {
        try {
          const createdTask: Task = {
            id: crypto.randomUUID(),
            title: newTaskName,
            description: '',
            status: 'לביצוע',
            assignedTo: [],
            createdAt: Timestamp.now(),
            createdBy: currentUser?.uid || '',
            updatedAt: Timestamp.now(),
            updatedBy: currentUser?.uid || '',
            isDeleted: false,
            urgent: 'נמוכה',
            subTasks: [],
            comments: [],        
            links: [],
            files: [],
            tasks: [],
            repeat: 'none',
            isFavorite: false
          };
          
          await addDoc(collection(db, 'tasks'), createdTask);  // Changed from 'Task' to 'tasks'
          
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
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">New Task</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Task name"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                  disabled={!newTaskName.trim()}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

 
  // Add handlers for table editing
  const handleCustomerChange = async (taskId: string, customer: TaskCustomer | null) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      await updateDoc(taskRef, {
        customer: customer,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleAssignedToChange = async (taskId: string, assignedTo: string[]) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      await updateDoc(taskRef, {
        assignedTo: assignedTo,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating assigned users:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);  // Changed from 'Task' to 'tasks'
      await deleteDoc(taskRef);
      
      setSelectedTask(null);
      setShowTaskModal(false);
      toast.success('המשימה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('שגיאה במחיקת המשימה');
    }
  };

  // Add SubTask Modal Component
  const SubTaskModal = ({ onClose }: { onClose: () => void }) => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Subtask</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newSubTaskData.title}
                onChange={(e) => setNewSubTaskData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newSubTaskData.description}
                onChange={(e) => setNewSubTaskData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={newSubTaskData.status}
                onChange={(e) => setNewSubTaskData(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <Listbox
                value={newSubTaskData.createdAt}
                onChange={(value) => setNewSubTaskData(prev => ({ ...prev, assignedTo: value }))}
                multiple
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-red-500">
                    <span className="block truncate">
                      {newSubTaskData.createdBy?.length === 0 
                        ? 'Select users' 
                        : `${newSubTaskData.createdAt?.length || 0} selected`}
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
                          value={user.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'משתמש לא ידוע'}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <FaCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
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
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="datetime-local"
                value={newSubTaskData.dueDate ? new Date(newSubTaskData.dueDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setNewSubTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Urgent</label>
              <select
                value={newSubTaskData.urgent}
                onChange={(e) => setNewSubTaskData(prev => ({ ...prev, urgent: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="נמוכה">נמוכה</option>
                <option value="בינונית">בינונית</option>
                <option value="גבוהה">גבוהה</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Subtask
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Utility functions for status and urgency colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'in_progress':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };


  // <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
  // <div className="flex justify-between items-center mb-8">
  //   <div className="flex items-center gap-4">
  //     <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
  //       <FaProjectDiagram className="text-red-500" />
  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
          <FaProjectDiagram className="text-red-500" />
            ניהול משימות</h1>
             </div>
          <CreateTask
            users={users}
            customers={customers}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors" projects={projects}          />
       
        </div>
        {/* Filters */}
        <div className="bg-[#252525] rounded-lg p-4 mb-6 border border-[#2a2a2a]" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-300 flex  gap-2">
             
סנן לפי    <FaFilter className="text-gray-400" />        </h2>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-gray-500 hover:text-gray-700 transition-colors bg-[#ec5252] p-2 rounded-full"
            >
              <FaChevronDown className={`transition-transform duration-200 text-white ${showAdvancedFilters ? 'transform rotate-180' : ''}`} />
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">סטטוס </label>
                <Listbox
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#2a2a2a] py-2 pl-10 pr-3 text-right text-gray-300 border border-gray-700 z-50 focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm">
                      <span className="block truncate">
                        {filters.status.length > 0
                          ? filters.status.map(status => getStatusText(status)).join(', ')
                          : 'בחר סטטוס'}
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
                      <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2a2a2a] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {statusOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-[#3a3a3a] text-white' : 'text-gray-300'
                              }`
                            }
                            value={option.value}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {option.value}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500">
                                    <FaCheck className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                ) : null}
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
                <label className="block text-sm font-medium text-gray-300 mb-1">משוייך ל</label>
                <Listbox
                  value={filters.assignedTo}
                  onChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#2a2a2a] py-2 pl-10 pr-3 text-right text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 sm:text-sm">
                      <span className="block truncate">
                        {filters.assignedTo.length > 0
                          ? filters.assignedTo
                              .map(userId => {
                                const user = users.find(u => u.id === userId);
                                console.log('User object:', user); // Debug log
                                return user 
                                  ? user.name || 'משתמש לא ידוע'
                                  : 'משתמש לא ידוע';
                              })
                              .join(', ')
                          : 'בחר משתמשים'}
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
                      <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2a2a2a] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {users.map((user) => (
                          <Listbox.Option
                            key={user.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-[#3a3a3a] text-white' : 'text-gray-300'
                              }`
                            }
                            value={user.id}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {user.name || 'משתמש לא ידוע'}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500">
                                    <FaCheck className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                ) : null}
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
                <label className="block text-sm font-medium text-gray-300 mb-1">לקוח</label>
                <MultiSelectDropdown 
                  options={customers.map(customer => ({ 
                    value: customer.id, 
                    label: `${customer.name} ${customer.lastName || ''}` 
                  }))}
                  selectedValues={filters.customers}
                  onChange={(selectedCustomerIds) => {
                    setFilters(prev => ({ ...prev, customers: selectedCustomerIds }));
                  }}
                  placeholder="בחר לקוחות"
                  onInteractionStart={(e) => e.stopPropagation()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 ">פרויקט</label>
                <MultiSelectDropdown 
                  options={projects.map(project => ({ 
                    value: project.id, 
                    label: project.name 
                  }))}
                  selectedValues={filters.projects}
                  onChange={(selectedProjectIds) => {
                    setFilters(prev => ({ ...prev, projects: selectedProjectIds }));
                  }}
                  placeholder="בחר פרויקטים"
                  onInteractionStart={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
            </div>

        {/* Search Bar */}
        <div className="mb-4 flex justify-end" dir="ltr">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש משימה..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className=" px-4 py-2 text-right bg-[#2a2a2a] text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          </div>

        {/* Active Filters */}
        {(filters.status.length > 0 || filters.assignedTo.length > 0 || filters.search || filters.projects.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 " dir="rtl">
            {filters.status.map(status => (
              <span key={status} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <FaHourglassHalf className="text-red-500" />
                {status}
                <button 
                  onClick={() => handleFilterChange('status', filters.status.filter(s => s !== status))}
                  className="ml-1 hover:text-red-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            {filters.assignedTo.map(userId => (
              <span key={userId} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <FaUser className="text-red-500" />
                {users.find(u => u.id === userId)?.firstName && users.find(u => u.id === userId)?.lastName 
                  ? `${users.find(u => u.id === userId)?.firstName} ${users.find(u => u.id === userId)?.lastName}`.trim()
                  : users.find(u => u.id === userId)?.firstName || users.find(u => u.id === userId)?.name}
                <button 
                  onClick={() => handleFilterChange('assignedTo', filters.assignedTo.filter(id => id !== userId))}
                  className="ml-1 hover:text-red-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <FaSearch className="text-red-500" />
                חיפוש: {filters.search}
                <button 
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-red-800"
                >
                  <FaTimes />
                </button>
              </span>
            )}
            {filters.projects.map(projectId => (
              <span key={projectId} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <FaProjectDiagram className="text-red-500" />
                {projects.find(p => p.id === projectId)?.name}
                <button 
                  onClick={() => handleFilterChange('projects', filters.projects.filter(id => id !== projectId))}
                  className="ml-1 hover:text-red-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        )}

      
      <div className="w-full overflow-x-auto" dir="rtl">
        <div className="overflow-x-auto bg-[#1a1a1a] rounded-lg shadow-xl">
          <TableAssignments 
            tasks={filteredTasks}
            users={users}
            customers={customers}
            projects={projects}
            onTaskSelect={(task) => {
              setSelectedTask(task);
              setShowTaskModal(true);
            }}
            sortConfig={sortConfig}
            onSort={handleSort}
            onTaskUpdate={handleUpdateTask}
          />
        </div>
      </div>
      
      {selectedTask && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleCloseTaskModal}
          task={selectedTask}
          customers={customers}
          onTaskUpdate={handleUpdateTask}
          users={users}
          projects={projects}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          subTasks={[]} 
          comments={[]}       
        />
      )}
      {showNameModal && <NameModal />}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={(taskData: Task) => handleCreateTask(taskData)}
        projects={projects} 
        customers={customers} 
        users={users}          
      />
      {/* Add SubTask Modal */}
      <AnimatePresence>
        {showSubTaskModal && (
          <SubTaskModal onClose={() => {
            setShowSubTaskModal(false);
            setParentTaskId(null);
          }} />
        )}
      </AnimatePresence>
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default TaskAssignment;