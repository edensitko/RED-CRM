import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface SalesData {
  month: string;
  value: number;
}

interface TeamMemberPerformance {
  name: string;
  sales: number;
  leads: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Timestamp;
  userId: string;
  entityId?: string;
  entityType?: string;
}

interface DashboardData {
  sales: SalesData[];
  teamPerformance: TeamMemberPerformance[];
  activities: Activity[];
}

export const useDashboardWidgetData = () => {
  const [data, setData] = useState<DashboardData>({
    sales: [],
    teamPerformance: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  const fetchSalesData = async () => {
    if (!currentUser) return [];
    
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const salesRef = collection(db, 'sales');
      const q = query(
        salesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(sixMonthsAgo)),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const monthlyData: { [key: string]: number } = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date.toDate();
        const monthKey = date.toLocaleDateString('he-IL', { month: 'long' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (data.amount || 0);
      });

      return Object.entries(monthlyData).map(([month, value]) => ({
        month,
        value,
      }));
    } catch (err) {
      console.error('Error fetching sales data:', err);
      throw err;
    }
  };

  const fetchTeamPerformance = async () => {
    if (!currentUser) return [];
    
    try {
      const teamRef = collection(db, 'team');
      const q = query(teamRef, where('managerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.name,
          sales: data.sales || 0,
          leads: data.leads || 0,
        };
      });
    } catch (err) {
      console.error('Error fetching team performance:', err);
      throw err;
    }
  };

  const fetchActivitiesData = async () => {
    if (!currentUser) return [];
    
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [salesData, teamData, activitiesData] = await Promise.all([
          fetchSalesData(),
          fetchTeamPerformance(),
          fetchActivitiesData()
        ]);

        setData({
          sales: salesData,
          teamPerformance: teamData,
          activities: activitiesData
        });
        
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const refreshData = () => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [salesData, teamData, activitiesData] = await Promise.all([
          fetchSalesData(),
          fetchTeamPerformance(),
          fetchActivitiesData()
        ]);

        setData({
          sales: salesData,
          teamPerformance: teamData,
          activities: activitiesData
        });
        
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  return { data, loading, error, refreshData };
};

export default useDashboardWidgetData;
