export interface Widget {
  visible: boolean;
  id: string;
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  type: 'chart' | 'list' | 'stats' | 'table';
  category: string;
  defaultPosition: { x: number; y: number; w: number; h: number };
  dataSource: string;
}

export const availableWidgets: Widget[] = [
  // Dashboard Widgets
  {
    visible: true,
    id: 'total-stats',
    title: 'סטטיסטיקות כלליות',
    description: 'מציג סטטיסטיקות כלליות של המערכת',
    size: 'large',
    type: 'stats',
    category: 'dashboard',
    defaultPosition: { x: 0, y: 0, w: 12, h: 1 },
    dataSource: 'stats',
  },
  
  // Leads Widgets
  {
    visible: true,
    id: 'recent-leads',
    title: 'לידים אחרונים',
    description: 'מציג את הלידים האחרונים שנוספו למערכת',
    size: 'medium',
    type: 'list',
    category: 'leads',
    defaultPosition: { x: 0, y: 1, w: 6, h: 2 },
    dataSource: 'leads',
  },
  {
    visible: true,
    id: 'leads-by-source',
    title: 'לידים לפי מקור',
    description: 'מציג התפלגות של לידים לפי מקור',
    size: 'medium',
    type: 'chart',
    category: 'leads',
    defaultPosition: { x: 6, y: 1, w: 6, h: 2 },
    dataSource: 'leads',
  },

  // Sales Widgets
  {
    visible: true,
    id: 'sales-overview',
    title: 'סקירת מכירות',
    description: 'מציג סקירה כללית של המכירות',
    size: 'medium',
    type: 'chart',
    category: 'sales',
    defaultPosition: { x: 0, y: 3, w: 6, h: 2 },
    dataSource: 'deals',
  },
  {
    visible: true,
    id: 'recent-deals',
    title: 'עסקאות אחרונות',
    description: 'מציג את העסקאות האחרונות שנסגרו',
    size: 'medium',
    type: 'list',
    category: 'sales',
    defaultPosition: { x: 6, y: 3, w: 6, h: 2 },
    dataSource: 'deals',
  },

  // Tasks Widgets
  {
    visible: true,
    id: 'my-tasks',
    title: 'המשימות שלי',
    description: 'מציג את המשימות שהוקצו לך',
    size: 'medium',
    type: 'list',
    category: 'tasks',
    defaultPosition: { x: 0, y: 5, w: 6, h: 2 },
    dataSource: 'tasks',
  },
  {
    visible: true,
    id: 'tasks-by-status',
    title: 'משימות לפי סטטוס',
    description: 'מציג התפלגות של משימות לפי סטטוס',
    size: 'medium',
    type: 'chart',
    category: 'tasks',
    defaultPosition: { x: 6, y: 5, w: 6, h: 2 },
    dataSource: 'tasks',
  },

  // Projects Widgets
  {
    visible: true,
    id: 'active-projects',
    title: 'פרויקטים פעילים',
    description: 'מציג את הפרויקטים הפעילים כרגע',
    size: 'medium',
    type: 'list',
    category: 'projects',
    defaultPosition: { x: 0, y: 7, w: 6, h: 2 },
    dataSource: 'projects',
  },

  // Support Widgets
  {
    visible: true,
    id: 'support-tickets',
    title: 'קריאות שירות',
    description: 'מציג את קריאות השירות הפתוחות',
    size: 'medium',
    type: 'list',
    category: 'support',
    defaultPosition: { x: 6, y: 7, w: 6, h: 2 },
    dataSource: 'support',
  },
];
