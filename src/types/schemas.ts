import { Timestamp } from 'firebase/firestore';
import { CustomerClass } from './customer';

export type FirebaseDate = Date | Timestamp;

export interface SubTask {
  id: string;
  title: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  urgency: string;
  status: string;
  dueDate: any;
  description: string;
  completed: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
  isDeleted?: boolean;
  deletedAt?: FirebaseDate;
  deletedBy?: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'manager';
  createdAt: Date | string;
  lastLogin: Date | string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  department?: string;
  isActive?: boolean;
  displayName?: string;
  avatar?: string;
  position?: string;
  preferences: {
    language: 'he' | 'en';
    theme: 'light' | 'dark';
    notifications: boolean;
    emailNotifications: boolean;
  };
  targets?: {
    sales: number;
    leads: number;
    meetings: number;
  };
}

export interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
  department: string;
  managedDepartments: string[];
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface Task extends BaseEntity {
  tasks: never[];
  files: never[];
  links: never[];
  isFavorite: boolean;
  title: string;
  description: string;
  status: 'לביצוע' | 'בתהליך' | 'הושלם';
  urgency: 'נמוכה' | 'בינונית' | 'גבוהה';
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  dueDate?: Timestamp | null;
  assignedTo: string[];
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: string;
    budget: number;
    createdAt: Timestamp;
    customerId: string;
    description: string;
    endDate: Timestamp;
    isFavorite: boolean;
    startDate: string;
  } | null;
  customers?: TaskCustomer[];
  subTasks?: SubTask[];
  comments?: Array<{
    id: string;
    text: string;
    createdAt: Timestamp;
    createdBy: string;
    user?: {
      id: string;
      name: string;
    };
  }>;
  completed?: boolean;
  completedAt?: Timestamp | null;
  isDeleted?: boolean;
}

export interface Project extends BaseEntity {
  name: string;
  description: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
  };
  userId: string;
  projectManager: string;
  status: 'לביצוע' | 'בתהליך' | 'הושלם';
  startDate: string;
  endDate: string;
  budget: number;
  isFavorite: boolean;
  links: string[];
  comments: Array<{
    text: string;
    createdAt: string;
    userId: string;
    user?: {
      id: string;
      name: string;
    };
  }>;
  files?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    createdAt: string;
    createdBy: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    assignedTo: string;
    assignedUser?: {
      id: string;
      name: string;
    };
  }>;
}

export interface Lead extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'חדש' | 'נוצר קשר' | 'מוסמך' | 'הצעה' | 'משא ומתן' | 'סגור זכה' | 'סגור הפסיד';
  score: number;
  notes: string;
  estimatedValue: number;
  assignedTo: string;
  lastContact?: FirebaseDate;
  tags: string[];
  industry?: string;
  budget?: number;
  timeline?: 'immediate' | '1_month' | '3_months' | '6_months' | 'unknown';
  interests?: string[];
  competitors?: string[];
  meetings?: Array<{
    id: string;
    date: FirebaseDate;
    type: 'phone' | 'video' | 'in_person';
    summary: string;
    outcome?: string;
    nextSteps?: string;
  }>;
  requirements?: string[];
  objections?: string[];
  conversionProbability?: number;
  lostReason?: string;
  preferredContactTime?: 'morning' | 'afternoon' | 'evening';
  marketingCampaign?: string;
  referralSource?: string;
}

export interface Report extends BaseEntity {
  title: string;
  type: 'sales' | 'leads' | 'performance' | 'customer' | 'custom';
  description: string;
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    lastRun?: FirebaseDate;
    nextRun?: FirebaseDate;
    format: 'pdf' | 'excel' | 'csv';
    timezone: string;
  };
  data: any;
  isPublic: boolean;
  category?: string;
  tags?: string[];
  version?: number;
  exportHistory?: Array<{
    id: string;
    format: 'pdf' | 'excel' | 'csv';
    downloadedAt: FirebaseDate;
    downloadedBy: string;
    fileSize: number;
    url: string;
  }>;
  filters?: Record<string, any>;
  visualizations?: Array<{
    type: 'chart' | 'table' | 'metric';
    config: Record<string, any>;
  }>;
  permissions?: {
    viewUsers: string[];
    editUsers: string[];
    departments: string[];
  };
}

export interface Activity extends BaseEntity {
  type: 'create' | 'update' | 'delete' | 'login' | 'export' | 'other';
  entityType: 'user' | 'customer' | 'lead' | 'task' | 'report';
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  completedAt?: FirebaseDate;
  dueDate?: FirebaseDate;
}

export interface Item extends BaseEntity {
  name: string;
  description: string;
  status: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  assignedTo?: string;
  assignedUser?: {
    id: string;
    name: string;
  };
  dueDate?: FirebaseDate;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: FirebaseDate;
    uploadedBy: string;
  }>;
}

export interface TaskCustomer {
  id: string;
  name: string;  
  lastName: string;
  companyName: string;  
  assignedTo: string[];
  Balance: number;
  ComeFrom: string;
  Comments: string[];
  CreatedBy: string;
  createdAt: string;
  Email: string;
  IsDeleted: boolean;
  LastName: string;
  Links: Array<string | { url: string; description: string }>;
  Phone: number;
  Projects: string[];
  Status: "פעיל" | "לא פעיל" | "בטיפול";
  Tags: string[];
  Tasks: string[];
  Files: Array<{ name: string; url: string; uploadedAt: string; size: number }>;
}

export type Customer = {
  name: string;
  companyName: string;
} & CustomerClass;
