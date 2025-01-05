import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, remove, update, set } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaCheck, 
  FaPause, 
  FaSpinner,
  FaProjectDiagram,
  FaCalendarAlt,
  FaFlag,
  FaArrowDown,
  FaEquals,
  FaArrowUp
} from 'react-icons/fa';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: 'להתחלה' | 'בביצוע' | 'הושלם';
  priority: 'נמוך' | 'בינוני' | 'גבוה';
  assignedTo: string;
  dueDate: string;
}

const TASK_STATUS_CONFIG = {
  'להתחלה': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaSpinner className="text-red-500" />,
    label: 'להתחלה'
  },
  'בביצוע': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaPause className="text-yellow-500" />,
    label: 'בביצוע'
  },
  'הושלם': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheck className="text-green-500" />,
    label: 'הושלם'
  }
};

const TASK_PRIORITY_CONFIG = {
  'נמוך': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaArrowDown className="text-green-500" />,
    label: 'נמוך'
  },
  'בינוני': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaEquals className="text-yellow-500" />,
    label: 'בינוני'
  },
  'גבוה': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaArrowUp className="text-red-500" />,
    label: 'גבוה'
  }
};

const Tasks: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    projectId: '',
    status: 'להתחלה',
    priority: 'בינוני',
    assignedTo: currentUser?.uid || '',
    dueDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const db = getDatabase();
    const tasksRef = ref(db, 'tasks');
    
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData: Task[] = [];
        snapshot.forEach((child) => {
          const data = child.val();
          tasksData.push({
            id: child.key || Date.now().toString(),
            title: data.title || '',
            description: data.description || '',
            projectId: data.projectId || '',
            status: ['להתחלה', 'בביצוע', 'הושלם'].includes(data.status) 
              ? data.status 
              : 'להתחלה',
            priority: ['נמוך', 'בינוני', 'גבוה'].includes(data.priority)
              ? data.priority 
              : 'בינוני',
            assignedTo: data.assignedTo || '',
            dueDate: data.dueDate || new Date().toISOString(),
          });
        });
        setTasks(tasksData);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();
    
    if (selectedTask) {
      // Update existing task
      update(ref(db, `tasks/${selectedTask.id}`), formData);
    } else {
      // Create new task
      push(ref(db, 'tasks'), {
        ...formData,
      });
    }
    
    setIsModalOpen(false);
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      projectId: '',
      status: 'להתחלה',
      priority: 'בינוני',
      assignedTo: currentUser?.uid || '',
      dueDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const db = getDatabase();
    remove(ref(db, `tasks/${taskId}`));
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaProjectDiagram className="mr-4 text-red-600" /> מטלות
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          <FaPlus className="mr-2" /> הוסף מטלה
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{task.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedTask(task);
                      setFormData(task);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <FaEdit />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <FaTrash />
                  </motion.button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`${TASK_STATUS_CONFIG[task.status].color} px-3 py-1 rounded-full text-xs flex items-center`}>
                    {TASK_STATUS_CONFIG[task.status].icon}
                    <span className="ml-2">{TASK_STATUS_CONFIG[task.status].label}</span>
                  </div>
                  <div className={`${TASK_PRIORITY_CONFIG[task.priority].color} px-3 py-1 rounded-full text-xs flex items-center`}>
                    {TASK_PRIORITY_CONFIG[task.priority].icon}
                    <span className="ml-2">{TASK_PRIORITY_CONFIG[task.priority].label}</span>
                  </div>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <FaCalendarAlt className="mr-2" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaProjectDiagram className="mr-4" /> 
                {selectedTask ? 'ערוך מטלה' : 'הוסף מטלה חדשה'}
              </h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-red-500 rounded-full p-2 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם המטלה
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="הכנס שם המטלה"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך יעד
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור המטלה
                </label>
                <motion.textarea
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="תיאור המטלה"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סטטוס המטלה
                  </label>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    {(['להתחלה', 'בביצוע', 'הושלם'] as Task['status'][]).map((status) => (
                      <label 
                        key={status} 
                        className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition duration-300 ${
                          formData.status === status 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={formData.status === status}
                          onChange={() => setFormData({ ...formData, status: status })}
                          className="hidden"
                        />
                        {TASK_STATUS_CONFIG[status].label}
                      </label>
                    ))}
                  </motion.div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    עדיפות
                  </label>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    {(['נמוך', 'בינוני', 'גבוה'] as Task['priority'][]).map((priority) => (
                      <label 
                        key={priority} 
                        className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition duration-300 ${
                          formData.priority === priority 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={() => setFormData({ ...formData, priority: priority })}
                          className="hidden"
                        />
                        {TASK_PRIORITY_CONFIG[priority].label}
                      </label>
                    ))}
                  </motion.div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  בטל
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                >
                  <FaCheck className="mr-2" /> {selectedTask ? 'עדכן מטלה' : 'הוסף מטלה'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
