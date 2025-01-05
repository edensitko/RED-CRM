export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive';
  lastContact: string;
  created: string;
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'ישראל ישראלי',
    email: 'israel@example.com',
    phone: '050-1234567',
    company: 'חברה א',
    status: 'active',
    lastContact: '2024-12-25',
    created: '2024-01-15',
  },
  {
    id: '2',
    name: 'שרה כהן',
    email: 'sarah@example.com',
    phone: '052-7654321',
    company: 'חברה ב',
    status: 'active',
    lastContact: '2024-12-20',
    created: '2024-02-01',
  },
  {
    id: '3',
    name: 'דוד לוי',
    email: 'david@example.com',
    phone: '054-9876543',
    company: 'חברה ג',
    status: 'inactive',
    lastContact: '2024-11-30',
    created: '2024-03-10',
  },
];
