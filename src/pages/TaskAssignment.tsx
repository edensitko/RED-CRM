import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, addDoc, arrayUnion, arrayRemove, onSnapshot, deleteDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Listbox } from '@headlessui/react';
import { 
  FaPlus, FaTimes, FaCheck, FaProjectDiagram, FaCalendarDay, FaCalendarWeek, 
  FaCalendarAlt, FaSync, FaExclamationTriangle, FaExclamationCircle, FaInfo,
  FaTasks, FaUser, FaUsers, FaClock, FaListUl, FaEdit, FaTrash, FaHourglassHalf,
  FaCheckCircle, FaPlayCircle, FaSort, FaSortUp, FaSortDown, FaSearch,
  FaFilter, FaUndo, FaChevronDown,
  FaCalendar
} from 'react-icons/fa';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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
    setSelectedUsers(selectedIds);
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

  const [isRepeatableOpen, setIsRepeatableOpen] = useState(true);
  const [isUrgentOpen, setIsUrgentOpen] = useState(true);
  const [isRepeatableCardsOpen, setIsRepeatableCardsOpen] = useState(true);
  const [isUrgentCardsOpen, setIsUrgentCardsOpen] = useState(true);

  const dailyTasks = repeatableTasks.filter(task => task.repeat === 'daily');
  const weeklyTasks = repeatableTasks.filter(task => task.repeat === 'weekly');
  const monthlyTasks = repeatableTasks.filter(task => task.repeat === 'monthly');

  const highUrgencyTasks = urgentTasks.filter(task => task.urgency === 'גבוהה');
  const mediumUrgencyTasks = urgentTasks.filter(task => task.urgency === 'בינוני');
  const lowUrgencyTasks = urgentTasks.filter(task => task.urgency === 'נמוך');

  console.log('All urgent tasks:', urgentTasks);
  console.log('High urgency tasks:', highUrgencyTasks);
  console.log('Medium urgency tasks:', mediumUrgencyTasks);
  console.log('Low urgency tasks:', lowUrgencyTasks);

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
                            {allowedStatuses.map(status => (
                              <Listbox.Option
                                key={status}
                                value={status}
                                className={({ active }) =>
                                  `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                                }
                              >
                                {status === 'הושלם' ? <FaCheckCircle className="text-green-500" /> : null}
                                {status}
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
                        <FaClock /> תאריך יעד
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={newTaskData.dueDate || ''}
                        onChange={(e) => setNewTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                      />
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
                            {['גבוהה', 'בינוני', 'נמוך'].map(urgency => (
                              <Listbox.Option
                                key={urgency}
                                value={urgency}
                                className={({ active }) =>
                                  `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                                   cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    {urgency === 'גבוהה' ? <FaExclamationCircle className="text-red-500" /> :
                                     urgency === 'בינוני' ? <FaExclamationTriangle className="text-orange-500" /> :
                                     <FaInfo className="text-yellow-500" />}
                                    {urgency}
                                    {selected && <FaCheck className="ml-auto" />}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
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
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
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
                        {allowedStatuses.map(status => (
                          <Listbox.Option
                            key={status}
                            value={status}
                            className={({ active, selected }) =>
                              `${active ? 'bg-red-50 text-red-900' : 'text-gray-900'}
                               ${selected ? 'bg-red-100' : ''}
                               cursor-pointer select-none relative py-2 px-4 flex items-center gap-2`
                            }
                          >
                            {({ selected }) => (
                              <>
                                {status === 'הושלם' ? (
                                  <FaCheckCircle className="text-green-500" />
                                ) : status === 'בתהליך' ? (
                                  <FaPlayCircle className="text-yellow-500" />
                                ) : (
                                  <FaHourglassHalf className="text-blue-500" />
                                )}
                                {status}
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
                    משתמשים
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
                                {user.displayName || user.email}
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'title', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>כותרת</span>
                      {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'description', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>תיאור</span>
                      {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'status', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>סטטוס</span>
                      {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'priority', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>דחיפות</span>
                      {sortConfig.key === 'priority' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSortConfig({ key: 'dueDate', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <div className="flex items-center gap-2">
                      <span>תאריך יעד</span>
                      {sortConfig.key === 'dueDate' ? (sortConfig.direction === 'asc' ? <FaSortUp className="text-red-500" /> : <FaSortDown className="text-red-500" />) : <FaSort className="text-gray-400" />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    משתמשים
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{task.title}</td>
                    <td className="px-6 py-4">{task.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'הושלם' ? 'bg-green-100 text-green-800' :
                        task.status === 'בתהליך' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status === 'הושלם' ? (
                          <><FaCheckCircle className="mr-1" /> {task.status}</>
                        ) : task.status === 'בתהליך' ? (
                          <><FaPlayCircle className="mr-1" /> {task.status}</>
                        ) : (
                          <><FaHourglassHalf className="mr-1" /> {task.status}</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <Listbox
                          value={task.priority}
                          onChange={(value) => {
                            const taskDocRef = doc(db, 'tasks', task.id);
                            updateDoc(taskDocRef, { priority: value });
                          }}
                        >
                          <div className="relative">
                            <Listbox.Button className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-left focus:ring-2 focus:ring-red-500 focus:border-transparent transition">
                              {({ value }) => (
                                <span className="flex items-center gap-2">
                                  {value === 'גבוהה' ? (
                                    <FaExclamationTriangle className="text-red-500" />
                                  ) : value === 'בינונית' ? (
                                    <FaExclamationCircle className="text-yellow-500" />
                                  ) : (
                                    <FaInfo className="text-green-500" />
                                  )}
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
                                  {priority === 'גבוהה' ? (
                                    <FaExclamationTriangle className="text-red-500" />
                                  ) : priority === 'בינונית' ? (
                                    <FaExclamationCircle className="text-yellow-500" />
                                  ) : (
                                    <FaInfo className="text-green-500" />
                                  )}
                                  {priority}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </div>
                        </Listbox>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(task.dueDate).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {task.assignedTo.map(userId => {
                          const user = users.find(u => u.id === userId);
                          return user ? (
                            <span key={userId} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                              <FaUser className="text-blue-500" />
                              {user.displayName || user.email}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <FaEdit className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          onClick={() => {
                            const taskDocRef = doc(db, 'tasks', task.id);
                            deleteDoc(taskDocRef);
                          }}
                        >
                          <FaTrash className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

       
  
      </div>
  );
};

export default TaskAssignment;
