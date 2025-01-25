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
  status: 'לביצוע' | 'בתהליך' | 'הושלם';
  startDate: string;
  endDate: string;
  createdBy: string;
  expenses?: number;
  revenue?: number;
}

interface Task {
  id: string;
  status: 'לביצוע' | 'בתהליך' | 'הושלם';
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
    color: 'bg-red-900/50 text-red-200', 
    icon: <FaExclamationCircle className="text-red-400" />,
    label: 'לביצוע'
  },
  'בתהליך': { 
    color: 'bg-yellow-900/50 text-yellow-200', 
    icon: <FaChartBar className="text-yellow-400" />,
    label: 'בתהליך'
  },
  'הושלם': { 
    color: 'bg-green-900/50 text-green-200', 
    icon: <FaCheckCircle className="text-green-400" />,
    label: 'הושלם'
  }
};

const PRIORITY_CONFIG = {
  'נמוכה': { 
    color: 'bg-green-900/50 text-green-200', 
    icon: <FaFlag className="text-green-400" />,
    label: 'נמוכה'
  },
  'בינונית': { 
    color: 'bg-yellow-900/50 text-yellow-200', 
    icon: <FaFlag className="text-yellow-400" />,
    label: 'בינונית'
  },
  'גבוהה': { 
    color: 'bg-red-900/50 text-red-200', 
    icon: <FaFlag className="text-red-400" />,
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
    const tasksQuery = query(collection(db, 'Tasks'));
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

  const calculateFinancialMetrics = () => {
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalExpenses = projects.reduce((sum, project) => sum + (project.expenses || 0), 0);
    const totalRevenue = projects.reduce((sum, project) => sum + (project.revenue || 0), 0);
    const profit = totalRevenue - totalExpenses;
    
    const projectsWithProfit = projects.filter(project => 
      (project.revenue || 0) - (project.expenses || 0) > 0
    ).length;

    const averageProjectBudget = totalBudget / (projects.length || 1);

    // Only include statuses that exist in STATUS_CONFIG
    const budgetByStatus = projects.reduce((acc, project) => {
      if (project.status in STATUS_CONFIG) {
        acc[project.status] = (acc[project.status] || 0) + (project.budget || 0);
      }
      return acc;
    }, {} as Record<keyof typeof STATUS_CONFIG, number>);

    return {
      totalBudget,
      totalExpenses,
      totalRevenue,
      profit,
      projectsWithProfit,
      averageProjectBudget,
      budgetByStatus
    };
  };

  const calculateProjectTimelines = () => {
    const now = new Date();
    const activeProjects = projects.filter(project => project.status !== 'הושלם');
    
    const projectsOnSchedule = activeProjects.filter(project => {
      const endDate = new Date(project.endDate);
      return endDate >= now;
    }).length;

    const projectsBehindSchedule = activeProjects.filter(project => {
      const endDate = new Date(project.endDate);
      return endDate < now;
    }).length;

    const averageProjectDuration = projects
      .filter(project => project.status === 'הושלם')
      .reduce((sum, project) => {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        return sum + (end.getTime() - start.getTime());
      }, 0) / (projects.filter(project => project.status === 'הושלם').length || 1);

    return {
      projectsOnSchedule,
      projectsBehindSchedule,
      averageProjectDuration: Math.round(averageProjectDuration / (1000 * 60 * 60 * 24)) // Convert to days
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#ec5252]"></div>
        </div>
      </div>
    );
  }

  const userMetrics = calculateUserMetrics();
  const teamMetrics = calculateTeamMetrics();
  const generalMetrics = calculateGeneralMetrics();
  const financialMetrics = calculateFinancialMetrics();
  const timelineMetrics = calculateProjectTimelines();

  if (!userMetrics) return null;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
      <div className="space-y-6">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">משימות שלי</p>
                <h3 className="text-2xl font-bold">{userMetrics.totalTasks}</h3>
              </div>
              <FaTasks className="text-[#ec5252] text-3xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">פרויקטים שלי</p>
                <h3 className="text-2xl font-bold">{userMetrics.totalProjects}</h3>
              </div>
              <FaProjectDiagram className="text-[#ec5252] text-3xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">לקוחות שלי</p>
                <h3 className="text-2xl font-bold">{userMetrics.totalCustomers}</h3>
              </div>
              <FaUsers className="text-[#ec5252] text-3xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">משימות שהתקבלו היום</p>
                <h3 className="text-2xl font-bold">{userMetrics.tasksCreatedToday}</h3>
              </div>
              <FaCalendarAlt className="text-[#ec5252] text-3xl" />
            </div>
          </motion.div>
        </div>

        {/* Team Stats */}
        {teamMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaUserClock className="text-[#ec5252]" />
                משתמשים פעילים
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{teamMetrics.activeUsers}</div>
                <div className="text-gray-400">מתוך {teamMetrics.totalUsers} משתמשים</div>
              </div>
            </motion.div>

            {/* Task Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaListAlt className="text-[#ec5252]" />
                חלוקת משימות
              </h3>
              <div className="space-y-4">
                {teamMetrics.tasksByUser.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-300">{user.name}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div
                          className="bg-[#ec5252] h-2.5 rounded-full"
                          style={{
                            width: `${(user.completedTasks / (user.tasksCount || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-gray-400">
                      {user.completedTasks}/{user.tasksCount}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Financial Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaChartBar className="text-[#ec5252]" />
              סקירה פיננסית
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">תקציב כולל</span>
                <span className="text-2xl font-bold">₪{financialMetrics.totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">הוצאות</span>
                <span className="text-xl font-bold text-red-400">₪{financialMetrics.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">הכנסות</span>
                <span className="text-xl font-bold text-green-400">₪{financialMetrics.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">רווח</span>
                  <span className={`text-2xl font-bold ${financialMetrics.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₪{financialMetrics.profit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Project Performance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaProjectDiagram className="text-[#ec5252]" />
              ביצועי פרויקטים
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">פרויקטים רווחיים</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-400">{financialMetrics.projectsWithProfit}</span>
                  <span className="text-gray-400">מתוך {projects.length}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">תקציב ממוצע לפרויקט</span>
                <span className="text-xl font-bold">₪{Math.round(financialMetrics.averageProjectBudget).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Project Timelines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">פרויקטים בזמן</p>
                <h3 className="text-2xl font-bold text-green-400">{timelineMetrics.projectsOnSchedule}</h3>
              </div>
              <FaCalendarAlt className="text-green-400 text-3xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">פרויקטים באיחור</p>
                <h3 className="text-2xl font-bold text-red-400">{timelineMetrics.projectsBehindSchedule}</h3>
              </div>
              <FaClock className="text-red-400 text-3xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">משך פרויקט ממוצע</p>
                <h3 className="text-2xl font-bold">{timelineMetrics.averageProjectDuration} ימים</h3>
              </div>
              <FaUserClock className="text-[#ec5252] text-3xl" />
            </div>
          </motion.div>
        </div>

        {/* Budget Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#252525] p-6 rounded-lg shadow-lg border border-gray-800"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaChartBar className="text-[#ec5252]" />
            חלוקת תקציב לפי סטטוס
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {config.icon}
                  <span className="text-gray-400">{config.label}</span>
                </div>
                <span className="text-xl font-bold">
                  ₪{(financialMetrics.budgetByStatus[status as keyof typeof STATUS_CONFIG] || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
