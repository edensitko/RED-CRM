import {
  Timeline,
  People,
  Assignment,
  TrendingUp,
  Task,
  Group,
  PieChart,
  FlashOn,
  Assessment,
} from '@mui/icons-material';
import { WidgetDefinition } from './WidgetTypes';
import QuickActionsWidget from './QuickActionsWidget';
import ActivitiesWidget from './ActivitiesWidget';
import ReportsWidget from './ReportsWidget';
import TeamPerformanceWidget from './TeamPerformanceWidget';
import CustomersWidget from './CustomersWidget';
import SalesOverviewWidget from './SalesOverviewWidget';
import TasksWidget from './TasksWidget';
import LeadsWidget from './LeadsWidget';
import RevenueDistributionWidget from './RevenueDistributionWidget';

export const widgetDefinitions: Record<string, WidgetDefinition> = {
  quickActions: {
    type: 'quickActions',
    title: 'פעולות מהירות',
    description: 'גישה מהירה לפעולות נפוצות ושימושיות',
    icon: FlashOn,
    defaultSize: { w: 3, h: 2 },
    component: QuickActionsWidget,
    previewData: {
      actions: ['צור לקוח חדש', 'הוסף משימה', 'צור הזדמנות מכירה']
    }
  },
  activities: {
    type: 'activities',
    title: 'פעילויות אחרונות',
    description: 'צפה בכל הפעילויות האחרונות במערכת',
    icon: Timeline,
    defaultSize: { w: 3, h: 4 },
    component: ActivitiesWidget,
    previewData: {
      activities: [
        { type: 'task', title: 'משימה חדשה נוצרה', time: '10:30' },
        { type: 'customer', title: 'לקוח חדש נוסף', time: '09:15' },
      ]
    }
  },
  reports: {
    type: 'reports',
    title: 'דוחות',
    description: 'צפה בדוחות וניתוחים של הנתונים שלך',
    icon: Assessment,
    defaultSize: { w: 3, h: 4 },
    component: ReportsWidget,
    previewData: {
      reports: ['דוח מכירות חודשי', 'דוח לקוחות פעילים', 'דוח ביצועי צוות']
    }
  },
  teamPerformance: {
    type: 'teamPerformance',
    title: 'ביצועי צוות',
    description: 'מעקב אחר ביצועי הצוות והישגים',
    icon: Group,
    defaultSize: { w: 6, h: 4 },
    component: TeamPerformanceWidget,
    previewData: {
      team: [
        { name: 'דני', sales: 85 },
        { name: 'רונית', sales: 92 },
        { name: 'יוסי', sales: 78 }
      ]
    }
  },
  customers: {
    type: 'customers',
    title: 'לקוחות',
    description: 'רשימת הלקוחות האחרונים והפעילים',
    icon: People,
    defaultSize: { w: 3, h: 4 },
    component: CustomersWidget,
    previewData: {
      customers: [
        { name: 'חברת אלפא', status: 'פעיל' },
        { name: 'חברת בטא', status: 'ממתין' }
      ]
    }
  },
  sales: {
    type: 'sales',
    title: 'סקירת מכירות',
    description: 'סקירה כללית של המכירות והמגמות',
    icon: TrendingUp,
    defaultSize: { w: 6, h: 4 },
    component: SalesOverviewWidget,
    previewData: {
      data: [
        { month: 'ינואר', value: 65 },
        { month: 'פברואר', value: 72 },
        { month: 'מרץ', value: 85 }
      ]
    }
  },
  tasks: {
    type: 'tasks',
    title: 'משימות',
    description: 'רשימת המשימות הפעילות והקרובות',
    icon: Task,
    defaultSize: { w: 3, h: 4 },
    component: TasksWidget,
    previewData: {
      tasks: [
        { title: 'פגישת לקוח', due: 'היום' },
        { title: 'מעקב הצעת מחיר', due: 'מחר' }
      ]
    }
  },
  leads: {
    type: 'leads',
    title: 'לידים',
    description: 'מעקב אחר לידים חדשים והזדמנויות',
    icon: Assignment,
    defaultSize: { w: 3, h: 4 },
    component: LeadsWidget,
    previewData: {
      leads: [
        { name: 'חברת גמא', status: 'חדש' },
        { name: 'חברת דלתא', status: 'במעקב' }
      ]
    }
  },
  revenueDistribution: {
    type: 'revenueDistribution',
    title: 'התפלגות הכנסות',
    description: 'ניתוח התפלגות ההכנסות לפי קטגוריות',
    icon: PieChart,
    defaultSize: { w: 6, h: 4 },
    component: RevenueDistributionWidget,
    previewData: {
      distribution: [
        { category: 'מוצרים', value: 45 },
        { category: 'שירותים', value: 35 },
        { category: 'תמיכה', value: 20 }
      ]
    }
  },
};

export const getWidgetDefinition = (type: string): WidgetDefinition | undefined => {
  return widgetDefinitions[type];
};