export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  activeDeals: number;
  totalRevenue: number;
  pendingTasks: number;
  customerSatisfaction: number;
  recentActivities: Activity[];
  salesByProduct: SalesByProduct[];
  leadsBySource: LeadsBySource[];
}

interface Activity {
  id: string;
  type: 'lead' | 'deal' | 'task' | 'meeting';
  description: string;
  timestamp: string;
  user: string;
}

interface SalesByProduct {
  product: string;
  revenue: number;
  percentage: number;
}

interface LeadsBySource {
  source: string;
  count: number;
  percentage: number;
}

export const mockDashboardData: DashboardStats = {
  totalLeads: 245,
  newLeadsToday: 12,
  activeDeals: 28,
  totalRevenue: 850000,
  pendingTasks: 34,
  customerSatisfaction: 92,
  
  recentActivities: [
    {
      id: '1',
      type: 'lead',
      description: 'ליד חדש נוצר: חברת אלפא בע"מ',
      timestamp: '2024-12-31T15:30:00',
      user: 'שרה לוי',
    },
    {
      id: '2',
      type: 'deal',
      description: 'עסקה נסגרה: פרויקט פיתוח תוכנה',
      timestamp: '2024-12-31T14:45:00',
      user: 'דוד כהן',
    },
    {
      id: '3',
      type: 'task',
      description: 'משימה הושלמה: הכנת הצעת מחיר',
      timestamp: '2024-12-31T13:20:00',
      user: 'רות אברהם',
    },
  ],

  salesByProduct: [
    {
      product: 'ייעוץ עסקי',
      revenue: 320000,
      percentage: 38,
    },
    {
      product: 'פיתוח תוכנה',
      revenue: 280000,
      percentage: 33,
    },
    {
      product: 'שיווק דיגיטלי',
      revenue: 250000,
      percentage: 29,
    },
  ],

  leadsBySource: [
    {
      source: 'אתר אינטרנט',
      count: 98,
      percentage: 40,
    },
    {
      source: 'המלצות',
      count: 73,
      percentage: 30,
    },
    {
      source: 'רשתות חברתיות',
      count: 49,
      percentage: 20,
    },
    {
      source: 'אחר',
      count: 25,
      percentage: 10,
    },
  ],
};
