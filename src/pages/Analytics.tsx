import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaUsers, 
  FaProjectDiagram, 
  FaTasks, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaFlag,
  FaCalendarAlt,
  FaClock,
  FaUserClock,
  FaListAlt
} from 'react-icons/fa';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalCustomers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
}

interface Project {
  id: string;
  name: string;
  budget: number;
  status: 'לביצוע' | 'בביצוע' | 'הושלם';
  startDate: string;
  endDate: string;
  createdBy: string;
}

interface Task {
  id: string;
  status: 'לביצוע' | 'בביצוע' | 'הושלם';
  priority: 'נמוכה' | 'בינונית' | 'גבוהה';
  dueDate: string;
  createdBy: string;
  assignedTo: string[];
  createdAt: any;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: any;
  createdBy: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  lastLogin: any;
  createdAt: any;
}

const STATUS_CONFIG = {
  'לביצוע': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaExclamationCircle className="text-red-500" />,
    label: 'לביצוע'
  },
  'בביצוע': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaChartBar className="text-yellow-500" />,
    label: 'בביצוע'
  },
  'הושלם': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheckCircle className="text-green-500" />,
    label: 'הושלם'
  }
};

const PRIORITY_CONFIG = {
  'נמוכה': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaFlag className="text-green-500" />,
    label: 'נמוכה'
  },
  'בינונית': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaFlag className="text-yellow-500" />,
    label: 'בינונית'
  },
  'גבוהה': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaFlag className="text-red-500" />,
    label: 'גבוהה'
  }
};

const Analytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'));
    const tasksQuery = query(collection(db, 'tasks'));
    const customersQuery = query(collection(db, 'customers'));
    const usersQuery = query(collection(db, 'users'));

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    });

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeCustomers();
      unsubscribeUsers();
    };
  }, []);

  const calculateUserMetrics = () => {
    if (!currentUser) return null;

    const userTasks = tasks.filter(task => task.createdBy === currentUser.uid);
    const userProjects = projects.filter(project => project.createdBy === currentUser.uid);
    const userCustomers = customers.filter(customer => customer.createdBy === currentUser.uid);
    
    const tasksCreatedToday = userTasks.filter(task => {
      const taskDate = new Date(task.createdAt.seconds * 1000);
      const today = new Date();
      return taskDate.toDateString() === today.toDateString();
    }).length;

    const completedTasks = userTasks.filter(task => task.status === 'הושלם').length;
    const assignedTasks = tasks.filter(task => task.assignedTo?.includes(currentUser.uid)).length;

    return {
      totalTasks: userTasks.length,
      tasksCreatedToday,
      completedTasks,
      assignedTasks,
      totalProjects: userProjects.length,
      totalCustomers: userCustomers.length
    };
  };

  const calculateTeamMetrics = () => {
    const activeUsers = users.filter(user => {
      if (!user.lastLogin) return false;
      const lastLogin = new Date(user.lastLogin.seconds * 1000);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      return lastLogin > twoDaysAgo;
    }).length;

    const tasksByUser = users.map(user => ({
      userId: user.id,
      name: user.name || user.email,
      tasksCount: tasks.filter(task => task.assignedTo?.includes(user.id)).length,
      completedTasks: tasks.filter(task => 
        task.assignedTo?.includes(user.id) && task.status === 'הושלם'
      ).length
    }));

    return {
      activeUsers,
      totalUsers: users.length,
      tasksByUser
    };
  };

  const calculateGeneralMetrics = () => {
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const overdueTasks = tasks.filter(task => 
      task.status !== 'הושלם' && 
      new Date(task.dueDate) < new Date() && 
      task.dueDate
    ).length;

    const projectsByStatus = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      projectsByStatus,
      totalCustomers: customers.length,
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'הושלם').length
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const userMetrics = calculateUserMetrics();
  const teamMetrics = calculateTeamMetrics();
  const generalMetrics = calculateGeneralMetrics();

  if (!userMetrics) return null;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaChartBar className="text-red-600" />
          ניתוח נתונים
        </h1>
      </div>

      {/* Personal Activity Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <FaUserClock className="text-blue-600" />
          הפעילות שלי
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">משימות שיצרתי היום</h2>
              <FaClock className="text-blue-600 text-xl" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{userMetrics.tasksCreatedToday}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">משימות שהושלמו</h2>
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{userMetrics.completedTasks}</p>
            <p className="text-sm text-gray-500 mt-2">מתוך {userMetrics.totalTasks} משימות</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">משימות שהוקצו לי</h2>
              <FaListAlt className="text-yellow-600 text-xl" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{userMetrics.assignedTasks}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">פרויקטים פעילים</h2>
              <FaProjectDiagram className="text-red-600 text-xl" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{userMetrics.totalProjects}</p>
          </motion.div>
        </div>
      </div>

      {/* Team Activity Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <FaUsers className="text-green-600" />
          פעילות צוות
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">סטטיסטיקת משתמשים</h2>
              <FaUsers className="text-blue-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>משתמשים פעילים</span>
                <span className="font-bold text-green-600">{teamMetrics.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>סה"כ משתמשים</span>
                <span className="font-bold">{teamMetrics.totalUsers}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">ביצועי צוות</h2>
              <FaTasks className="text-yellow-600" />
            </div>
            <div className="space-y-4">
              {teamMetrics.tasksByUser.map(user => (
                <div key={user.userId} className="flex justify-between items-center">
                  <span>{user.name}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{user.completedTasks} הושלמו</span>
                    <span className="text-gray-600">מתוך {user.tasksCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* General Stats Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <FaChartBar className="text-yellow-600" />
          סטטיסטיקה כללית
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Project Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">סטטוס פרויקטים</h2>
              <FaProjectDiagram className="text-red-600" />
            </div>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                  <span className="font-bold">
                    {generalMetrics.projectsByStatus[status] || 0}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Task Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">סטטוס משימות</h2>
              <FaTasks className="text-yellow-600" />
            </div>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                  <span className="font-bold">
                    {generalMetrics.tasksByStatus[status] || 0}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Task Priority */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">עדיפות משימות</h2>
              <FaFlag className="text-blue-600" />
            </div>
            <div className="space-y-3">
              {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                  <span className="font-bold">
                    {generalMetrics.tasksByPriority[priority] || 0}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
