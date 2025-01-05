import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/firebase/taskService';
import { leadService } from '../services/firebase/leadService';
import { customerService } from '../services/firebase/customerService';
import { reportService } from '../services/firebase/reportService';
import { activityService } from '../services/firebase/activityService';
import { Task, Lead, Customer, Report, Activity } from '../types/schemas';

export const useDashboardData = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    recentTasks: Task[];
    recentLeads: Lead[];
    recentCustomers: Customer[];
    recentReports: Report[];
    recentActivities: Activity[];
  }>({
    recentTasks: [],
    recentLeads: [],
    recentCustomers: [],
    recentReports: [],
    recentActivities: [],
  });

  const fetchDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const [tasks, leads, customers, reports, activities] = await Promise.allSettled([
        taskService.getTasksByAssignee(currentUser.uid, 5),
        leadService.getLeadsByStatus('new', 5),
        customerService.getActiveCustomers(5),
        reportService.getAllReports(),
        activityService.getRecentActivities(10),
      ]);

      const handleResult = <T,>(result: PromiseSettledResult<T[]>, defaultValue: T[] = []): T[] => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        console.error('Error fetching data:', result.reason);
        return defaultValue;
      };

      const sortedReports = handleResult(reports)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      setData({
        recentTasks: handleResult(tasks),
        recentLeads: handleResult(leads),
        recentCustomers: handleResult(customers),
        recentReports: sortedReports,
        recentActivities: handleResult(activities),
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const refreshData = async () => {
    await fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    refreshData,
  };
};
