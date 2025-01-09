import { ReactNode } from "react";

export interface BaseEntity {
  id: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  phoneNumber: string;
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
  department?: string;
  position?: string;
  hireDate: Date;
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
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignedTo: string;
  relatedTo?: {
    type: 'customer' | 'lead';
    id: string;
  };
  category: 'meeting' | 'call' | 'email' | 'follow_up' | 'other';
  reminderDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: Date;
    createdBy: string;
    isEdited: boolean;
  }>;
}

export interface Customer extends BaseEntity {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  status: 'פעיל' | 'לא פעיל';
  source: string;
  notes: string;
  tags: string[];
  lastContact?: Date;
  website?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  annualRevenue?: number;
  paymentTerms?: string;
  contracts?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    type: string;
    value: number;
    status: 'פעיל' | 'נגמר' | 'הושבת';
  }>;
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  contacts?: Array<{
    id: string;
    name: string;
    position: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
  documents?: Array<{
    id: string;
    type: 'contract' | 'invoice' | 'proposal' | 'other';
    name: string;
    url: string;
    createdAt: Date;
    createdBy: string;
  }>;
  preferredContactMethod?: 'email' | 'phone' | 'whatsapp';
  marketingPreferences?: {
    newsletter: boolean;
    promotions: boolean;
    updates: boolean;
  };
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
  lastContact?: Date;
  tags: string[];
  industry?: string;
  budget?: number;
  timeline?: 'immediate' | '1_month' | '3_months' | '6_months' | 'unknown';
  interests?: string[];
  competitors?: string[];
  meetings?: Array<{
    id: string;
    date: Date;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  customerId: string;
  status: 'planning' | 'in_progress' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  createdAt: string;
  isFavorite?: boolean;
}

export interface Report extends BaseEntity {
  title: string;
  type: 'sales' | 'leads' | 'performance' | 'customer' | 'custom';
  description: string;
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    lastRun?: Date;
    nextRun?: Date;
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
    downloadedAt: Date;
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
  completedAt?: Date;
  dueDate?: Date;
}
