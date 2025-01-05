import { User, AdminUser, Task, Customer, Lead, Report, Activity } from '../types/schemas';

// Mock Admin Users
export const adminUsers: AdminUser[] = [
  {
    id: '1',
    email: 'admin@redcrm.com',
    firstName: 'משה',
    lastName: 'כהן',
    role: 'admin',
    phoneNumber: '052-1234567',
    isActive: true,
    lastLogin: new Date('2025-01-02T10:00:00'),
    createdAt: new Date('2024-01-01'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-01'),
    updatedBy: 'system',
    permissions: ['all'],
    department: 'הנהלה',
    managedDepartments: ['מכירות', 'שיווק', 'תמיכה'],
    canManageUsers: true,
    canManageRoles: true,
    canViewReports: true,
    canManageSettings: true,
    hireDate: new Date('2023-01-01'),
    preferences: {
      language: 'he',
      theme: 'light',
      notifications: true,
      emailNotifications: true,
    },
    avatar: 'https://example.com/avatars/moshe.jpg',
    position: 'מנכ"ל',
  },
  {
    id: '2',
    email: 'sarah@redcrm.com',
    firstName: 'שרה',
    lastName: 'לוי',
    role: 'admin',
    phoneNumber: '052-7654321',
    isActive: true,
    lastLogin: new Date('2025-01-02T09:30:00'),
    createdAt: new Date('2024-01-01'),
    createdBy: '1',
    updatedAt: new Date('2024-01-01'),
    updatedBy: '1',
    permissions: ['users', 'reports'],
    department: 'משאבי אנוש',
    managedDepartments: ['משאבי אנוש'],
    canManageUsers: true,
    canManageRoles: false,
    canViewReports: true,
    canManageSettings: false,
    hireDate: new Date('2023-02-01'),
    preferences: {
      language: 'he',
      theme: 'dark',
      notifications: true,
      emailNotifications: true,
    },
    avatar: 'https://example.com/avatars/sarah.jpg',
    position: 'מנהלת משאבי אנוש',
  },
];

// Mock Regular Users
export const users: User[] = [
  {
    id: '3',
    email: 'yossi@redcrm.com',
    firstName: 'יוסי',
    lastName: 'לוי',
    role: 'user',
    phoneNumber: '052-9876543',
    isActive: true,
    lastLogin: new Date('2025-01-02T09:00:00'),
    createdAt: new Date('2024-01-01'),
    createdBy: adminUsers[0].id,
    updatedAt: new Date('2024-01-01'),
    updatedBy: adminUsers[0].id,
    department: 'מכירות',
    position: 'מנהל מכירות',
    hireDate: new Date('2023-03-01'),
    preferences: {
      language: 'he',
      theme: 'light',
      notifications: true,
      emailNotifications: true,
    },
    targets: {
      sales: 100000,
      leads: 20,
      meetings: 15,
    },
  },
  {
    id: '4',
    email: 'dana@redcrm.com',
    firstName: 'דנה',
    lastName: 'כהן',
    role: 'user',
    phoneNumber: '052-1112233',
    isActive: true,
    lastLogin: new Date('2025-01-02T08:45:00'),
    createdAt: new Date('2024-01-01'),
    createdBy: adminUsers[0].id,
    updatedAt: new Date('2024-01-01'),
    updatedBy: adminUsers[0].id,
    department: 'שיווק',
    position: 'מנהלת שיווק',
    hireDate: new Date('2023-04-01'),
    preferences: {
      language: 'he',
      theme: 'dark',
      notifications: true,
      emailNotifications: false,
    },
    targets: {
      sales: 80000,
      leads: 30,
      meetings: 10,
    },
  },
];

// Mock Tasks
export const tasks: Task[] = [
  {
    id: '1',
    title: 'פגישת היכרות עם לקוח חדש',
    description: 'פגישת זום להצגת המוצר',
    status: 'pending',
    priority: 'high',
    dueDate: new Date('2025-01-05'),
    assignedTo: users[0].id,
    createdAt: new Date('2025-01-01'),
    createdBy: adminUsers[0].id,
    updatedAt: new Date('2025-01-01'),
    updatedBy: adminUsers[0].id,
    category: 'meeting',
    reminderDate: new Date('2025-01-05T09:00:00'),
    comments: [
      {
        id: '1',
        text: 'הלקוח ביקש להקדים בשעה',
        createdAt: new Date('2025-01-01T10:00:00'),
        createdBy: users[0].id,
        isEdited: false,
      },
    ],
  },
  {
    id: '2',
    title: 'מעקב אחר הצעת מחיר',
    description: 'לבדוק סטטוס הצעת מחיר שנשלחה',
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date('2025-01-04'),
    assignedTo: users[1].id,
    createdAt: new Date('2025-01-01'),
    createdBy: users[0].id,
    updatedAt: new Date('2025-01-01'),
    updatedBy: users[0].id,
    category: 'follow_up',
    relatedTo: {
      type: 'lead',
      id: '1',
    },
  },
];

// Mock Customers
export const customers: Customer[] = [
  {
    id: '1',
    companyName: 'חברת הייטק בע"מ',
    firstName: 'דוד',
    lastName: 'ישראלי',
    email: 'david@hitech.co.il',
    phoneNumber: '03-1234567',
    address: {
      street: 'רוטשילד 123',
      city: 'תל אביב',
      state: 'תל אביב',
      zipCode: '6123456',
      country: 'ישראל',
    },
    status: 'active',
    source: 'הפניה',
    notes: 'לקוח VIP',
    tags: ['הייטק', 'תוכנה'],
    lastContact: new Date('2025-01-01'),
    createdAt: new Date('2024-12-01'),
    createdBy: users[0].id,
    updatedAt: new Date('2024-12-01'),
    updatedBy: users[0].id,
    website: 'www.hitech.co.il',
    industry: 'טכנולוגיה',
    size: 'large',
    annualRevenue: 5000000,
    contacts: [
      {
        id: '1',
        name: 'דוד ישראלי',
        position: 'מנכ"ל',
        email: 'david@hitech.co.il',
        phone: '03-1234567',
        isPrimary: true,
      },
    ],
    preferredContactMethod: 'email',
    marketingPreferences: {
      newsletter: true,
      promotions: false,
      updates: true,
    },
  },
  {
    id: '2',
    companyName: 'מסעדת השף',
    firstName: 'רונית',
    lastName: 'כהן',
    email: 'ronit@chef.co.il',
    phoneNumber: '03-7654321',
    address: {
      street: 'הרצל 45',
      city: 'תל אביב',
      state: 'תל אביב',
      zipCode: '6123457',
      country: 'ישראל',
    },
    status: 'active',
    source: 'אתר',
    notes: 'מעוניינת בשירותי קייטרינג',
    tags: ['מסעדנות', 'קייטרינג'],
    lastContact: new Date('2025-01-02'),
    createdAt: new Date('2024-12-15'),
    createdBy: users[1].id,
    updatedAt: new Date('2024-12-15'),
    updatedBy: users[1].id,
    industry: 'מסעדנות',
    size: 'small',
    annualRevenue: 1000000,
    preferredContactMethod: 'phone',
  },
];

// Mock Leads
export const leads: Lead[] = [
  {
    id: '1',
    firstName: 'רונית',
    lastName: 'כהן',
    email: 'ronit@startup.co.il',
    phoneNumber: '054-1234567',
    company: 'סטארטאפ חדשני',
    source: 'כנס טכנולוגי',
    status: 'new',
    score: 85,
    notes: 'מעוניינת במערכת CRM',
    estimatedValue: 50000,
    assignedTo: users[0].id,
    lastContact: new Date('2025-01-01'),
    tags: ['סטארטאפ', 'CRM'],
    createdAt: new Date('2025-01-01'),
    createdBy: users[0].id,
    updatedAt: new Date('2025-01-01'),
    updatedBy: users[0].id,
    industry: 'טכנולוגיה',
    budget: 100000,
    timeline: '1_month',
    interests: ['אוטומציה', 'אינטגרציות'],
    meetings: [
      {
        id: '1',
        date: new Date('2025-01-03'),
        type: 'video',
        summary: 'פגישת היכרות ראשונית',
        nextSteps: 'להכין הצעת מחיר',
      },
    ],
    conversionProbability: 0.7,
    preferredContactTime: 'morning',
  },
  {
    id: '2',
    firstName: 'אבי',
    lastName: 'לוי',
    email: 'avi@business.co.il',
    phoneNumber: '054-7654321',
    company: 'עסקים בע"מ',
    source: 'המלצה',
    status: 'contacted',
    score: 65,
    notes: 'מחפש פתרון לניהול לקוחות',
    estimatedValue: 30000,
    assignedTo: users[1].id,
    lastContact: new Date('2025-01-02'),
    tags: ['ניהול לקוחות'],
    createdAt: new Date('2025-01-02'),
    createdBy: users[1].id,
    updatedAt: new Date('2025-01-02'),
    updatedBy: users[1].id,
    industry: 'קמעונאות',
    timeline: '3_months',
    preferredContactTime: 'afternoon',
  },
];

// Mock Reports
export const reports: Report[] = [
  {
    id: '1',
    title: 'דוח מכירות חודשי',
    type: 'sales',
    description: 'סיכום מכירות לחודש ינואר 2025',
    parameters: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    },
    schedule: {
      frequency: 'monthly',
      recipients: [adminUsers[0].email],
      lastRun: new Date('2025-01-01'),
      nextRun: new Date('2025-02-01'),
      format: 'pdf',
      timezone: 'Asia/Jerusalem',
    },
    data: {
      totalSales: 150000,
      newCustomers: 5,
      topPerformer: users[0].id,
    },
    isPublic: false,
    createdAt: new Date('2025-01-01'),
    createdBy: adminUsers[0].id,
    updatedAt: new Date('2025-01-01'),
    updatedBy: adminUsers[0].id,
    category: 'מכירות',
    version: 1,
    visualizations: [
      {
        type: 'chart',
        config: {
          type: 'bar',
          data: {
            labels: ['ינואר', 'פברואר', 'מרץ'],
            datasets: [{
              label: 'מכירות',
              data: [150000, 160000, 140000],
            }],
          },
        },
      },
    ],
  },
  {
    id: '2',
    title: 'דוח לידים שבועי',
    type: 'leads',
    description: 'סיכום לידים חדשים',
    parameters: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-07'),
    },
    schedule: {
      frequency: 'weekly',
      recipients: [users[0].email, users[1].email],
      lastRun: new Date('2025-01-01'),
      nextRun: new Date('2025-01-08'),
      format: 'excel',
      timezone: 'Asia/Jerusalem',
    },
    data: {
      newLeads: 10,
      convertedLeads: 3,
      topSources: ['אתר', 'המלצות', 'כנסים'],
    },
    isPublic: true,
    createdAt: new Date('2025-01-01'),
    createdBy: users[0].id,
    updatedAt: new Date('2025-01-01'),
    updatedBy: users[0].id,
    category: 'לידים',
    version: 1,
  },
];

// Mock Activities
export const activities: Activity[] = [
  {
    id: '1',
    type: 'create',
    entityType: 'lead',
    entityId: leads[0].id,
    description: 'יצירת ליד חדש',
    createdAt: new Date('2025-01-01'),
    createdBy: users[0].id,
    updatedAt: new Date('2025-01-01'),
    updatedBy: users[0].id,
    metadata: {
      leadName: `${leads[0].firstName} ${leads[0].lastName}`,
      source: leads[0].source,
    },
    ip: '192.168.1.1',
  },
  {
    id: '2',
    type: 'update',
    entityType: 'customer',
    entityId: customers[0].id,
    description: 'עדכון פרטי לקוח',
    createdAt: new Date('2025-01-02'),
    createdBy: users[1].id,
    updatedAt: new Date('2025-01-02'),
    updatedBy: users[1].id,
    metadata: {
      customerName: `${customers[0].firstName} ${customers[0].lastName}`,
      changedFields: ['phoneNumber', 'email'],
    },
    ip: '192.168.1.2',
  },
];

// Helper function to get creator details
export const getCreatorDetails = (creatorId: string): User | AdminUser | undefined => {
  return [...adminUsers, ...users].find(user => user.id === creatorId);
};

// Helper function to get assigned user details
export const getAssignedUserDetails = (userId: string): User | AdminUser | undefined => {
  return [...adminUsers, ...users].find(user => user.id === userId);
};

// Helper function to get activity description
export const getActivityDescription = (activity: Activity): string => {
  const creator = getCreatorDetails(activity.createdBy);
  const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'משתמש לא ידוע';
  
  switch (activity.type) {
    case 'create':
      return `${creatorName} יצר ${activity.entityType} חדש`;
    case 'update':
      return `${creatorName} עדכן ${activity.entityType}`;
    case 'delete':
      return `${creatorName} מחק ${activity.entityType}`;
    default:
      return `${creatorName} ביצע פעולה על ${activity.entityType}`;
  }
};
