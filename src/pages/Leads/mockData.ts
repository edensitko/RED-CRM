export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'חדש' | 'בטיפול' | 'נסגר' | 'לא רלוונטי';
  assignedTo: string;
  created: string;
  lastActivity: string;
  potentialValue: number;
  notes: string;
}

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'יעקב כהן',
    email: 'yaakov@example.com',
    phone: '050-1111222',
    source: 'אתר אינטרנט',
    status: 'חדש',
    assignedTo: 'שרה לוי',
    created: '2024-12-28',
    lastActivity: '2024-12-28',
    potentialValue: 15000,
    notes: 'מעוניין בשירותי ייעוץ עסקי',
  },
  {
    id: '2',
    name: 'רחל אברהם',
    email: 'rachel@example.com',
    phone: '052-3334444',
    source: 'המלצה',
    status: 'בטיפול',
    assignedTo: 'דוד כהן',
    created: '2024-12-25',
    lastActivity: '2024-12-27',
    potentialValue: 25000,
    notes: 'דורש הצעת מחיר מפורטת',
  },
  {
    id: '3',
    name: 'משה לוי',
    email: 'moshe@example.com',
    phone: '054-5556666',
    source: 'כנס מקצועי',
    status: 'נסגר',
    assignedTo: 'רות כהן',
    created: '2024-12-20',
    lastActivity: '2024-12-26',
    potentialValue: 50000,
    notes: 'חתם על חוזה שירות שנתי',
  },
];
