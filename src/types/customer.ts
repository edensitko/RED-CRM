export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  industry: string;
  status: string;
  size: string;
  annualRevenue: number;
  website: string;
  source: string;
  paymentTerms: string;
  notes: string;
  isDeleted: boolean;
  lastContact: Date;
  contracts: any[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  userId: string;
}
