import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaUsers, 
  FaProjectDiagram, 
  FaTasks, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaFlag
} from 'react-icons/fa';

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
  status: 'todo' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

const STATUS_CONFIG = {
  'todo': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaExclamationCircle className="text-red-500" />,
    label: 'To Do'
  },
  'in-progress': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaChartBar className="text-yellow-500" />,
    label: 'In Progress'
  },
  'completed': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheckCircle className="text-green-500" />,
    label: 'Completed'
  }
};

const PRIORITY_CONFIG = {
  'low': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaFlag className="text-green-500" />,
    label: 'Low'
  },
  'medium': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaFlag className="text-yellow-500" />,
    label: 'Medium'
  },
  'high': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaFlag className="text-red-500" />,
    label: 'High'
  }
};

const PROJECT_STATUS_CONFIG = {
  'todo': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaExclamationCircle className="text-red-500" />,
    label: 'לא נעשה'
  },
  'in-progress': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaChartBar className="text-yellow-500" />,
    label: 'בתהליך'
  },
  'completed': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheckCircle className="text-green-500" />,
    label: 'הושלם'
  }
};

const TASK_STATUS_CONFIG = {
  'todo': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaExclamationCircle className="text-red-500" />,
    label: 'לא נעשה'
  },
  'in-progress': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaChartBar className="text-yellow-500" />,
    label: 'בתהליך'
  },
  'completed': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheckCircle className="text-green-500" />,
    label: 'הושלם'
  }
};

const TASK_PRIORITY_CONFIG = {
  'low': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaFlag className="text-green-500" />,
    label: 'נמוך'
  },
  'medium': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaFlag className="text-yellow-500" />,
    label: 'בינוני'
  },
  'high': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaFlag className="text-red-500" />,
    label: 'גבוה'
  }
};

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const statsRef = ref(db, 'stats');
    const projectsRef = ref(db, 'projects');
    const tasksRef = ref(db, 'tasks');

    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      }
    });

    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData: Project[] = [];
        snapshot.forEach((childSnapshot) => {
          projectsData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val(),
          });
        });
        setProjects(projectsData);
      }
    });

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData: Task[] = [];
        snapshot.forEach((childSnapshot) => {
          tasksData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val(),
          });
        });
        setTasks(tasksData);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeStats();
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, []);

  const calculateProjectMetrics = () => {
    const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
    const activeProjects = projects.filter(
      (project) => project.status === 'in-progress'
    ).length;
    const completedProjects = projects.filter(
      (project) => project.status === 'completed'
    ).length;

    return {
      totalBudget,
      activeProjects,
      completedProjects,
    };
  };

  const calculateTaskMetrics = () => {
    const tasksByStatus = projects.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const tasksByPriority = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const overdueTasks = tasks.filter(
      (task) =>
        task.status !== 'completed' &&
        new Date(task.dueDate) < new Date() &&
        task.dueDate
    ).length;

    return {
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
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

  const projectMetrics = calculateProjectMetrics();
  const taskMetrics = calculateTaskMetrics();

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaChartBar className="ml-4 text-red-600" /> ניתוח נתונים
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">סקירת פרויקטים</h2>
            <FaProjectDiagram className="text-red-600" />
          </div>
          <div className="space-y-3">
            {Object.keys(PROJECT_STATUS_CONFIG).map((status) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {PROJECT_STATUS_CONFIG[status as Project['status']].icon}
                  <span>{PROJECT_STATUS_CONFIG[status as Project['status']].label}</span>
                </div>
                <span className="font-bold">
                  {projects.filter(p => p.status === status).length}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tasks Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">סקירת מטלות</h2>
            <FaTasks className="text-yellow-600" />
          </div>
          <div className="space-y-3">
            {Object.keys(TASK_STATUS_CONFIG).map((status) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {TASK_STATUS_CONFIG[status as Task['status']].icon}
                  <span>{TASK_STATUS_CONFIG[status as Task['status']].label}</span>
                </div>
                <span className="font-bold">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Task Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">עדיפות מטלות</h2>
            <FaFlag className="text-blue-600" />
          </div>
          <div className="space-y-3">
            {Object.keys(TASK_PRIORITY_CONFIG).map((priority) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {TASK_PRIORITY_CONFIG[priority as Task['priority']].icon}
                  <span>{TASK_PRIORITY_CONFIG[priority as Task['priority']].label}</span>
                </div>
                <span className="font-bold">
                  {tasks.filter(t => t.priority === priority).length}
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
