import React, { Fragment, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { FaSort, FaSortUp, FaSortDown, FaUser, FaEdit, FaTrash, FaCheck, FaChevronDown, FaHourglassHalf, FaPlayCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfo, FaTimes, FaPlus, FaSync, FaTasks, FaClock, FaCalendarAlt, FaCalendar, FaCalendarDay, FaUsers, FaUndo, FaListUl, FaSearch, FaFilter, FaSave } from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: PriorityType;
  dueDate: string;
  createdAt: string;
  assignedTo: string[];
  repeat?: string;
  project?: string;
  urgency?: string;
}

interface User {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}

type PriorityType = 'נמוכה' | 'בינונית' | 'גבוהה';

interface Filters {
  priority: string[];
  status: string[];
  startDate: string;
  endDate: string;
  search: string;
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

const TaskAssignment: React.FC = () => {
  const allowedStatuses = ['לביצוע', 'בתהליך', 'הושלם'];
  const allowedPriorities: PriorityType[] = ['נמוכה', 'בינונית', 'גבוהה'];
  const { currentUser } = useAuth();
  
  const statusOptions = [
    { value: 'לביצוע', label: 'לביצוע', icon: <FaHourglassHalf className="text-blue-500" /> },
    { value: 'בתהליך', label: 'בתהליך', icon: <FaPlayCircle className="text-yellow-500" /> },
    { value: 'הושלם', label: 'הושלם', icon: <FaCheckCircle className="text-green-500" /> }
  ];

  const urgencyOptions = [
    { value: 'גבוהה', label: 'גבוהה', icon: <FaExclamationCircle className="text-red-500" /> },
    { value: 'בינונית', label: 'בינונית', icon: <FaExclamationTriangle className="text-yellow-500" /> },
    { value: 'נמוכה', label: 'נמוכה', icon: <FaInfo className="text-blue-500" /> }
  ];

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleUrgencyChange = async (taskId: string, newUrgency: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { urgency: newUrgency });
    } catch (error) {
      console.error('Error updating task urgency:', error);
    }
  };

  const handleAssignedUsersChange = async (taskId: string, newUsers: string[]) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      // If no users selected, assign to current user
      const usersToAssign = newUsers.length > 0 ? newUsers : currentUser ? [currentUser.uid] : [];
      await updateDoc(taskRef, { assignedTo: usersToAssign });
    } catch (error) {
      console.error('Error updating assigned users:', error);
    }
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    priority: [],
    status: [],
    startDate: '',
    endDate: '',
    search: ''
  });

  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'לביצוע',
    priority: 'בינונית',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: [],
    repeat: '',
    urgency: 'בינוני'
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const truncateText = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const handleReadMore = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUserChange = (selectedIds: string[]) => {
    setNewTaskData(prev => ({
      ...prev,
      assignedTo: selectedIds
    }));
  };

  const resetFilters = () => {
    setFilters({
      priority: [],
      status: [],
      startDate: '',
      endDate: '',
      search: ''
    });
    setSelectedUsers([]);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesPriority = filters.priority.length === 0 || filters.priority.includes(task.priority);
    const matchesStatus = filters.status.length === 0 || filters.status.includes(task.status);
    const matchesDate = (!filters.startDate || task.dueDate >= filters.startDate) &&
                       (!filters.endDate || task.dueDate <= filters.endDate);
    const matchesSearch = !filters.search || 
                        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                        task.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesUser = selectedUsers.length === 0 || 
                       selectedUsers.some(userId => task.assignedTo.includes(userId));

    return matchesPriority && matchesStatus && matchesDate && matchesSearch && matchesUser;
  });

  const sortTasks = (a: Task, b: Task) => {
    if (!sortConfig.key) return 0;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction * aValue.localeCompare(bValue);
    }

    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      return direction * (aValue.length - bValue.length);
    }

    return 0;
  };

  const sortedTasks = [...filteredTasks].sort(sortTasks);

  const repeatableTasks = tasks.filter(task => task.repeat !== 'none');
  const urgentTasks = tasks.filter(task => task.urgency);

  const [isRepeatableCardsOpen, setIsRepeatableCardsOpen] = useState(true);
  const [isUrgentCardsOpen, setIsUrgentCardsOpen] = useState(true);

  const dailyTasks = repeatableTasks.filter(task => task.repeat === 'daily');
  const weeklyTasks = repeatableTasks.filter(task => task.repeat === 'weekly');
  const monthlyTasks = repeatableTasks.filter(task => task.repeat === 'monthly');

  const highUrgencyTasks = urgentTasks.filter(task => task.urgency === 'גבוהה');
  const mediumUrgencyTasks = urgentTasks.filter(task => task.urgency === 'בינוני');
  const lowUrgencyTasks = urgentTasks.filter(task => task.urgency === 'נמוכ');

  console.log('All urgent tasks:', urgentTasks);
  console.log('High urgency tasks:', highUrgencyTasks);
  console.log('Medium urgency tasks:', mediumUrgencyTasks);
  console.log('Low urgency tasks:', lowUrgencyTasks);

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
              onClick={onClose} 
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
                <span className={`px-2 py-1 rounded-full text-sm ${
                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>{task.status}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">עדיפות:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  task.priority === 'גבוהה' ? 'bg-red-100 text-red-800' :
                  task.priority === 'בינונית' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>{task.priority}</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">תאריך יעד:</span>
                <span className="text-gray-600">{task.dueDate}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">שייך ל:</span>
                <span className="text-gray-600">{task.assignedTo.join(', ')}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="task-assignment-container p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-red-700 flex items-center gap-2">
          <FaTasks /> משימות
        </h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-red-600 to-red-400 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2" 
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus className="text-lg" /> צור משימה חדשה
        </motion.button>
      </div>


      <div className="space-y-6 mb-8">
          {/* Repeatable Tasks Card */}
          <motion.div
            initial={false}
            className="bg-white rounded-lg shadow-lg overflow-hidden w-full"
          >
            <div
              className="bg-blue-50 p-4 flex items-center justify-between cursor-pointer"
              onClick={() => {
                setIsRepeatableCardsOpen(!isRepeatableCardsOpen);
                setIsUrgentCardsOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <FaSync className="text-blue-500 text-xl" />
                <h3 className="text-lg font-medium text-gray-900">משימות חוזרות</h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {repeatableTasks.length}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isRepeatableCardsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown className="text-gray-500" />
              </motion.div>
            </div>

            <AnimatePresence initial={false}>
              {isRepeatableCardsOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" />
                        <span className="text-sm font-medium text-gray-600">משימות שחוזרות על עצמן</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Daily Tasks */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FaClock className="text-blue-500" />
                          <span className="text-sm font-medium text-gray-600">משימות יומיות</span>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {dailyTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {dailyTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <FaUser />
                                  <span>{task.assignedTo.length} משתמשים</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendar />
                                  <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {dailyTasks.length > 3 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-500">ועוד {dailyTasks.length - 3} משימות...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Weekly Tasks */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FaCalendarAlt className="text-purple-500" />
                          <span className="text-sm font-medium text-gray-600">משימות שבועיות</span>
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {weeklyTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {weeklyTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <FaUser />
                                  <span>{task.assignedTo.length} משתמשים</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendar />
                                  <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {weeklyTasks.length > 3 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-500">ועוד {weeklyTasks.length - 3} משימות...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Monthly Tasks */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FaCalendarAlt className="text-indigo-500" />
                          <span className="text-sm font-medium text-gray-600">משימות חודשיות</span>
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {monthlyTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {monthlyTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <FaUser />
                                  <span>{task.assignedTo.length} משתמשים</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendar />
                                  <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {monthlyTasks.length > 3 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-500">ועוד {monthlyTasks.length - 3} משימות...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Urgent Tasks Card */}
          <motion.div
            initial={false}
            className="bg-white rounded-lg shadow-lg overflow-hidden w-full"
          >
            <div
              className="bg-red-50 p-4 flex items-center justify-between cursor-pointer"
              onClick={() => {
                setIsUrgentCardsOpen(!isUrgentCardsOpen);
                setIsRepeatableCardsOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500 text-xl" />
                <h3 className="text-lg font-medium text-gray-900">משימות דחופות</h3>
                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {urgentTasks.length}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isUrgentCardsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown className="text-gray-500" />
              </motion.div>
            </div>

            <AnimatePresence initial={false}>
              {isUrgentCardsOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FaExclamationCircle className="text-red-500" />
                        <span className="text-sm font-medium text-gray-600">משימות שדורשות טיפול מיידי</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* High Urgency Tasks */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FaExclamationCircle className="text-red-500" />
                          <span className="text-sm font-medium text-gray-600">דחיפות גבוהה</span>
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {highUrgencyTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {highUrgencyTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <FaUser />
                                  <span>{task.assignedTo.length} משתמשים</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendar />
                                  <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {highUrgencyTasks.length > 3 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-500">ועוד {highUrgencyTasks.length - 3} משימות...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Medium Urgency Tasks */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FaExclamationTriangle className="text-orange-500" />
                          <span className="text-sm font-medium text-gray-600">דחיפות בינונית</span>
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {mediumUrgencyTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {mediumUrgencyTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <FaUser />
                                  <span>{task.assignedTo.length} משתמשים</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendar />
                                  <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {mediumUrgencyTasks.length > 3 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-500">ועוד {mediumUrgencyTasks.length - 3} משימות...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Low Urgency Tasks */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FaInfo className="text-yellow-500" />
                          <span className="text-sm font-medium text-gray-600">דחיפות נמוכה</span>
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {lowUrgencyTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {lowUrgencyTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                                  task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <FaUser />
                                  <span>{task.assignedTo.length} משתמשים</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendar />
                                  <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {lowUrgencyTasks.length > 3 && (
                            <div className="text-center mt-2">
                              <span className="text-sm text-gray-500">ועוד {lowUrgencyTasks.length - 3} משימות...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FaPlus className="text-white text-xl" />
                  <h2 className="text-2xl font-bold text-white">צור משימה חדשה</h2>
                </div>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  <FaTimes className="w-6 h-6" />
                </motion.button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, 'tasks'), {
                  ...newTaskData,
                  assignedTo: newTaskData.assignedTo.length > 0 ? newTaskData.assignedTo : currentUser ? [currentUser.uid] : [],
                  createdAt: Date.now(),
                });
                setIsModalOpen(false);
              }} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaListUl /> כותרת
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="הזן כותרת"
                      value={newTaskData.title || ''}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaEdit /> תיאור
                    </label>
                    <textarea
                      name="description"
                      placeholder="הזן תיאור"
                      value={newTaskData.description || ''}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Listbox
                        value={newTaskData.status}
                        onChange={(value) => setNewTaskData(prev => ({ ...prev, status: value }))}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                            {({ value }) => (
                              <span className="flex items-center gap-2">
                                {value === 'הושלם' ? <FaCheckCircle className="text-green-500" /> : null}
                                {value || 'בחר סטטוס'}
                                <FaChevronDown className="ml-auto h-4 w-4" />
                              </span>
                            )}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {statusOptions.map(status => (
                              <Listbox.Option
                                key={status.value}
                                value={status.value}
                                className={({ active }) =>
                                  `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                                }
                              >
                                {status.icon}
                                {status.label}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                    <div className="relative">
                      <Listbox
                        value={newTaskData.priority}
                        onChange={(value) => setNewTaskData(prev => ({ ...prev, priority: value }))}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                            {({ value }) => (
                              <span className="flex items-center gap-2">
                                {value === 'גבוהה' ? <FaExclamationTriangle className="text-red-500" /> : null}
                                {value || 'בחר דחיפות'}
                                <FaChevronDown className="ml-auto h-4 w-4" />
                              </span>
                            )}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {allowedPriorities.map(priority => (
                              <Listbox.Option
                                key={priority}
                                value={priority}
                                className={({ active }) =>
                                  `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                                }
                              >
                                {priority === 'גבוהה' ? <FaExclamationTriangle className="text-red-500" /> : null}
                                {priority}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <FaClock className="text-blue-500" />
                        תאריך יעד
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaCalendarAlt className="text-red-500" />
                        </div>
                        <input
                          type="date"
                          className="block w-full pr-10 border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-right"
                          value={newTaskData.dueDate ? newTaskData.dueDate.toString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            date.setHours(0, 0, 0, 0);
                            setNewTaskData(prev => ({ ...prev, dueDate: date }));
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Listbox
                        value={newTaskData.repeat}
                        onChange={(value) => setNewTaskData(prev => ({ ...prev, repeat: value }))}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                            {({ value }) => (
                              <span className="flex items-center gap-2">
                                {value === 'daily' ? <FaCalendarDay className="text-blue-500" /> : null}
                                {value || 'בחר חזרה'}
                                <FaChevronDown className="ml-auto h-4 w-4" />
                              </span>
                            )}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {['none', 'daily', 'weekly', 'monthly'].map(repeat => (
                              <Listbox.Option
                                key={repeat}
                                value={repeat}
                                className={({ active }) =>
                                  `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                                }
                              >
                                {repeat === 'daily' ? <FaCalendarDay className="text-blue-500" /> : null}
                                {repeat === 'none' ? 'לא חוזר' : repeat}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Listbox
                        value={newTaskData.urgency}
                        onChange={(value) => setNewTaskData(prev => ({ ...prev, urgency: value }))}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                            {({ value }) => (
                              <span className="flex items-center gap-2">
                                {value === 'גבוהה' ? <FaExclamationCircle className="text-red-500" /> :
                                 value === 'בינוני' ? <FaExclamationTriangle className="text-orange-500" /> :
                                 <FaInfo className="text-yellow-500" />}
                                {value || 'בחר דחיפות'}
                                <FaChevronDown className="ml-auto h-4 w-4" />
                              </span>
                            )}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {urgencyOptions.map(urgency => (
                              <Listbox.Option
                                key={urgency.value}
                                value={urgency.value}
                                className={({ active }) =>
                                  `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                                }
                              >
                                {urgency.icon}
                                {urgency.label}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שייך ל
                    </label>
                    <Listbox
                      value={newTaskData.assignedTo.length > 0 ? newTaskData.assignedTo : currentUser ? [currentUser.uid] : []}
                      onChange={handleUserChange}
                      multiple
                    >
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                          <span className="block truncate">
                            {(newTaskData.assignedTo.length > 0 ? newTaskData.assignedTo : currentUser ? [currentUser.uid] : []).map(userId => {
                              const user = users.find(u => u.id === userId);
                              return user ? (
                                <span
                                  key={userId}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                                >
                                  <FaUser className="text-red-500" />
                                  <span className="truncate max-w-[150px]">
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}`
                                      : user.displayName || user.email}
                                  </span>
                                </span>
                              ) : null;
                            })}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <FaChevronDown
                              className="h-4 w-4 text-gray-400"
                              aria-hidden="true"
                            />
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
                                {({ selected, active }) => (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <FaUser className={`${selected ? 'text-red-500' : 'text-gray-400'} w-4 h-4`} />
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {user.firstName && user.lastName 
                                          ? `${user.firstName} ${user.lastName}`
                                          : user.displayName || user.email}
                                      </span>
                                    </div>
                                    {selected && (
                                      <span
                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active ? 'text-red-600' : 'text-red-600'
                                        }`}
                                      >
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
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <motion.button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    ביטול
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-400 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2"
                  >
                    <FaCheck /> צור משימה
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


        
        <AnimatePresence>
          {selectedTaskId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-white text-xl" />
                    <h2 className="text-2xl font-bold text-white">עדכון דחיפות</h2>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedTaskId('')}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition"
                  >
                    <FaTimes className="w-6 h-6" />
                  </motion.button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Listbox
                        value={tasks.find(t => t.id === selectedTaskId)?.priority}
                        onChange={(value) => {
                          const taskDocRef = doc(db, 'tasks', selectedTaskId);
                          updateDoc(taskDocRef, { priority: value });
                        }}
                      >
                        <div className="relative">
                          <Listbox.Button className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium w-full justify-between ${
                            tasks.find(t => t.id === selectedTaskId)?.priority === 'גבוהה' ? 'bg-red-100 text-red-800' :
                            tasks.find(t => t.id === selectedTaskId)?.priority === 'בינונית' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            <span className="flex items-center gap-2">
                              {tasks.find(t => t.id === selectedTaskId)?.priority === 'גבוהה' ? <FaExclamationTriangle className="text-red-500" /> : null}
                              {tasks.find(t => t.id === selectedTaskId)?.priority || 'בחר דחיפות'}
                              <FaChevronDown className="ml-2 h-4 w-4" />
                            </span>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none text-sm">
                            {allowedPriorities.map(priority => (
                              <Listbox.Option
                                key={priority}
                                value={priority}
                                className={({ active }) =>
                                  `${active ? 'text-white bg-red-600' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 pl-3 pr-9`
                                }
                              >
                                {({ selected, active }) => (
                                  <div className="flex items-center gap-2">
                                    {priority === 'גבוהה' ? <FaExclamationTriangle className="text-red-500" /> : null}
                                    <span className={`${selected ? 'font-semibold' : 'font-normal'} block truncate`}>
                                      {priority}
                                    </span>
                                    {selected && (
                                      <span className={`${active ? 'text-white' : 'text-red-600'} absolute left-0 flex items-center pl-4`}>
                                        <FaCheck className="h-4 w-4" aria-hidden="true" />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col space-y-6">
            {/* Header and Search */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaListUl /> כל המשימות
              </h2>
            </div>

            {/* Search Bar */}
            <div className="relative w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaSearch className="text-gray-500" />
                חיפוש
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="חפש משימות..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                />
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <FaFilter className="text-red-500" />
                  <span className="font-medium">סינון מתקדם</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-300"
                >
                  <FaUndo className="text-gray-500" />
                  איפוס סינון
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Priority Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaExclamationCircle className="text-red-500" />
                    דחיפות
                  </label>
                  <Listbox
                    value={filters.priority}
                    onChange={(values) => handleFilterChange('priority', values)}
                    multiple
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                        <span className="flex items-center gap-2">
                          <FaExclamationCircle className="text-red-500" />
                          {filters.priority.length > 0 
                            ? `${filters.priority.length} נבחרו`
                            : 'בחר דחיפות'}
                          <FaChevronDown className="ml-auto h-4 w-4" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {allowedPriorities.map(priority => (
                          <Listbox.Option
                            key={priority}
                            value={priority}
                            className={({ active, selected }) =>
                              `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                               ${selected ? 'bg-red-100' : ''}
                               cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                            }
                          >
                            {({ selected }) => (
                              <>
                                {priority === 'גבוהה' ? (
                                  <FaExclamationTriangle className="text-red-500" />
                                ) : priority === 'בינונית' ? (
                                  <FaExclamationCircle className="text-yellow-500" />
                                ) : (
                                  <FaInfo className="text-green-500" />
                                )}
                                {priority}
                                {selected && <FaCheck className="ml-auto" />}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaHourglassHalf className="text-yellow-500" />
                    סטטוס
                  </label>
                  <Listbox
                    value={filters.status}
                    onChange={(values) => handleFilterChange('status', values)}
                    multiple
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                        <span className="flex items-center gap-2">
                          <FaHourglassHalf className="text-yellow-500" />
                          {filters.status.length > 0 
                            ? `${filters.status.length} נבחרו`
                            : 'בחר סטטוס'}
                          <FaChevronDown className="ml-auto h-4 w-4" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {statusOptions.map(status => (
                          <Listbox.Option
                            key={status.value}
                            value={status.value}
                            className={({ active, selected }) =>
                              `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                               ${selected ? 'bg-red-100' : ''}
                               cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                            }
                          >
                            {({ selected }) => (
                              <>
                                {status.icon}
                                {status.label}
                                {selected && <FaCheck className="ml-auto" />}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Users Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaUsers className="text-blue-500" />
                    שייך ל
                  </label>
                  <Listbox
                    value={selectedUsers}
                    onChange={handleUserChange}
                    multiple
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                        <span className="flex items-center gap-2">
                          <FaUsers className="text-blue-500" />
                          {selectedUsers.length > 0 
                            ? `${selectedUsers.length} נבחרו`
                            : 'בחר משתמשים'}
                          <FaChevronDown className="ml-auto h-4 w-4" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {users.map(user => (
                          <Listbox.Option
                            key={user.id}
                            value={user.id}
                            className={({ active, selected }) =>
                              `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                               ${selected ? 'bg-red-100' : ''}
                               cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <FaUser className="text-blue-500" />
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.displayName || user.email}
                                {selected && <FaCheck className="ml-auto" />}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Start Date */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500" />
                    מתאריך
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>

                {/* End Date */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500" />
                    עד תאריך
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Active Filters */}
              {(filters.priority.length > 0 || filters.status.length > 0 || filters.startDate || filters.endDate || filters.search) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.priority.map(priority => (
                    <span key={priority} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      <FaExclamationCircle className="text-red-500" />
                      {priority}
                      <button 
                        onClick={() => handleFilterChange('priority', filters.priority.filter(p => p !== priority))}
                        className="ml-1 hover:text-red-800"
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
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
                  {filters.startDate && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      <FaCalendarAlt className="text-purple-500" />
                      מתאריך: {filters.startDate}
                      <button 
                        onClick={() => handleFilterChange('startDate', '')}
                        className="ml-1 hover:text-purple-800"
                      >
                        <FaTimes />
                      </button>
                    </span>
                  )}
                  {filters.endDate && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      <FaCalendarAlt className="text-purple-500" />
                      עד תאריך: {filters.endDate}
                      <button 
                        onClick={() => handleFilterChange('endDate', '')}
                        className="ml-1 hover:text-purple-800"
                      >
                        <FaTimes />
                      </button>
                    </span>
                  )}
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
          </div>
          
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-48 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'title', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>כותרת</span>
                      {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                  <th scope="col" className="w-64 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תיאור
                  </th>
                  <th scope="col" className="w-32 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th scope="col" className="w-32 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    דחיפות
                  </th>
                  <th scope="col" className="w-40 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שייך ל
                  </th>
                  <th scope="col" className="w-32 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'dueDate', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>תאריך יעד</span>
                      {sortConfig.key === 'dueDate' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTasks.map(task => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      if (
                        e.target === e.currentTarget ||
                        (e.target as HTMLElement).closest('td')?.cellIndex === 1
                      ) {
                        handleReadMore(task);
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap max-w-[12rem]">
                      <span className="text-sm font-medium text-gray-900 truncate block" title={task.title}>
                        {task.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {truncateText(task.description, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Listbox
                        value={task.status}
                        onChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                              task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                              task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {statusOptions.find(option => option.value === task.status)?.icon}
                              <span className="mr-1.5">{task.status}</span>
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
                                  {({ selected, active }) => (
                                    <>
                                      <div className="flex items-center gap-2">
                                        {option.icon}
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {option.value}
                                        </span>
                                      </div>
                                      {selected && (
                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active ? 'text-red-600' : 'text-red-600'
                                        }`}>
                                          <FaCheck className="h-5 w-5" aria-hidden="true" />
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
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Listbox
                        value={task.urgency || 'בינונית'}
                        onChange={(value) => handleUrgencyChange(task.id, value)}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                              task.urgency === 'גבוהה' ? 'bg-red-100 text-red-800' :
                              task.urgency === 'בינונית' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {urgencyOptions.find(option => option.value === task.urgency)?.icon}
                              <span className="mr-1.5">{task.urgency || 'בינונית'}</span>
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
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                    }`
                                  }
                                  value={option.value}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <div className="flex items-center gap-2">
                                        {option.icon}
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {option.value}
                                        </span>
                                      </div>
                                      {selected && (
                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active ? 'text-red-600' : 'text-red-600'
                                        }`}>
                                          <FaCheck className="h-5 w-5" aria-hidden="true" />
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
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Listbox
                        value={task.assignedTo}
                        onChange={(value) => handleAssignedUsersChange(task.id, value)}
                        multiple
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                            <span className="block truncate">
                              {task.assignedTo.length > 0 ? (
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {task.assignedTo.map(userId => {
                                    const user = users.find(u => u.id === userId);
                                    return user ? (
                                      <span
                                        key={userId}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                                      >
                                        <FaUser className="text-red-500 w-3 h-3" />
                                        <span className="truncate max-w-[100px]">
                                          {user.firstName && user.lastName 
                                            ? `${user.firstName} ${user.lastName}`
                                            : user.displayName || user.email}
                                          {userId === currentUser?.uid && " (אני)"}
                                        </span>
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-500">בחר משתמשים</span>
                              )}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                              <FaChevronDown
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
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
                                  {({ selected, active }) => (
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
                                        <span
                                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                            active ? 'text-red-600' : 'text-red-600'
                                          }`}
                                        >
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-medium">
                          {new Date(task.dueDate).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                        <FaCalendarAlt className="text-red-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {showTaskModal && selectedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setSelectedTask(null)}
                >
                  <FaTimes className="w-5 h-5" />
                </motion.button>
                <h2 className="text-2xl font-bold text-gray-900 text-right">{selectedTask.title}</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-right">כותרת</h3>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      updateDoc(taskRef, { title: e.target.value });
                      setSelectedTask({ ...selectedTask, title: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-right">תיאור המשימה</h3>
                  <textarea
                    value={selectedTask.description}
                    onChange={(e) => {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      updateDoc(taskRef, { description: e.target.value });
                      setSelectedTask({ ...selectedTask, description: e.target.value });
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
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
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            selectedTask.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                            selectedTask.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {statusOptions.find(option => option.value === selectedTask.status)?.icon}
                            <span className="mr-2">{selectedTask.status}</span>
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
                                {({ selected, active }) => (
                                  <>
                                    <div className="flex items-center gap-2 justify-end">
                                      {option.icon}
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {option.value}
                                      </span>
                                    </div>
                                    {selected && (
                                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-red-600' : 'text-red-600'
                                      }`}>
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

                  <div className="bg-gray-50 rounded-lg p-4">
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
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            selectedTask.urgency === 'גבוהה' ? 'bg-red-100 text-red-800' :
                            selectedTask.urgency === 'בינונית' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {urgencyOptions.find(option => option.value === selectedTask.urgency)?.icon}
                            <span className="mr-2">{selectedTask.urgency || 'בינונית'}</span>
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
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  }`
                                }
                                value={option.value}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <div className="flex items-center gap-2 justify-end">
                                      {option.icon}
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {option.value}
                                      </span>
                                    </div>
                                    {selected && (
                                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-red-600' : 'text-red-600'
                                      }`}>
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
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">שייך ל</h3>
                  <Listbox
                    value={selectedTask.assignedTo}
                    onChange={(value) => {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      updateDoc(taskRef, { assignedTo: value });
                      setSelectedTask({ ...selectedTask, assignedTo: value });
                    }}
                    multiple
                  >
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-right border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <span className="block truncate">
                          {selectedTask.assignedTo.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {selectedTask.assignedTo.map(userId => {
                                const user = users.find(u => u.id === userId);
                                return user ? (
                                  <span
                                    key={userId}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                                  >
                                    <FaUser className="text-red-500 w-3 h-3" />
                                    <span className="truncate max-w-[100px]">
                                      {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.displayName || user.email}
                                      {userId === currentUser?.uid && " (אני)"}
                                    </span>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-500">בחר משתמשים</span>
                          )}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                          <FaChevronDown
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
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
                              {({ selected, active }) => (
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
                                    <span
                                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-red-600' : 'text-red-600'
                                      }`}
                                    >
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">תאריך יעד</h3>
                  <input
                    type="date"
                    value={new Date(selectedTask.dueDate).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const taskRef = doc(db, 'tasks', selectedTask.id);
                      updateDoc(taskRef, { dueDate: new Date(e.target.value).toISOString() });
                      setSelectedTask({ ...selectedTask, dueDate: new Date(e.target.value).toISOString() });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={async () => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
                      try {
                        await deleteDoc(doc(db, 'tasks', selectedTask.id));
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
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => setSelectedTask(null)}
                >
                  ביטול
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TaskAssignment;
