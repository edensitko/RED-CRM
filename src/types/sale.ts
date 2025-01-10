export interface Sale {
  id: string;
  customer: string;
  customerId: string;
  productName: string;
  amount: number;
  status: 'טיוטא' | 'מו"מ' | 'סגור';
  priority: 'נמוך' | 'בינוני' | 'גבוה';
  expectedCloseDate: string;
  actualCloseDate: string | null;
  notes: string;
  title: string;
  owner: string;
  stage: string;
  probability: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
