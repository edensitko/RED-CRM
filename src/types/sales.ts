export interface Sale {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  productName: string;
  amount: number;
  status: 'לא התחיל' | 'בתהליך' | 'בוצע' | 'עוכב';
  priority: 'נמוך' | 'בינוני' | 'גבוה';
  owner: string;
  stage: 'ליד' | 'הצעה' | 'משא ומתן' | 'סגירה' | 'חתימה';
  expectedCloseDate: string;
  actualCloseDate?: string;
  probability: number;
  notes?: string;
  tags?: string[];
  department?: string;
  source?: string;
}

export const SALE_STATUS_CONFIG = {
  'לא התחיל': { 
    color: 'bg-gray-100 text-gray-800', 
    icon: 'FaCircle',
    label: 'לא התחיל'
  },
  'בתהליך': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: 'FaSpinner',
    label: 'בתהליך'
  },
  'בוצע': { 
    color: 'bg-green-100 text-green-800', 
    icon: 'FaCheck',
    label: 'בוצע'
  },
  'עוכב': { 
    color: 'bg-red-100 text-red-800', 
    icon: 'FaPause',
    label: 'עוכב'
  }
};

export const SALE_STAGE_CONFIG = {
  'ליד': { 
    color: 'bg-blue-100 text-blue-800', 
    icon: 'FaLightbulb',
    label: 'ליד'
  },
  'הצעה': { 
    color: 'bg-purple-100 text-purple-800', 
    icon: 'FaFileAlt',
    label: 'הצעה'
  },
  'משא ומתן': { 
    color: 'bg-orange-100 text-orange-800', 
    icon: 'FaHandshake',
    label: 'משא ומתן'
  },
  'סגירה': { 
    color: 'bg-green-100 text-green-800', 
    icon: 'FaChartLine',
    label: 'סגירה'
  },
  'חתימה': { 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: 'FaSignature',
    label: 'חתימה'
  }
};
