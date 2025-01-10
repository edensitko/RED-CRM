export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: 'פעיל' | 'לא פעיל';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  metadata?: {
    [key: string]: any;
  };
}
