import React, { useState, useEffect } from 'react';
import { Lead } from '../../types/schemas';
import { Dialog, Tab } from '@headlessui/react';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaMoneyBillWave, 
  FaIndustry,
  FaTags,
  FaUserTie,
  FaInfoCircle,
  FaClipboardList,
  FaTrash
} from 'react-icons/fa';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  lead?: Lead | null;
  userId: string;
}

const LeadModal: React.FC<LeadModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  lead,
  userId 
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    status: 'חדש',
    source: '',
    notes: '',
    lastContact: new Date(),
    budget: 0,
    industry: '',
    score: 0,
    tags: [],
    estimatedValue: 0,
    assignedTo: userId,
    createdBy: userId,
    createdAt: new Date().toISOString()
  });
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (lead) {
      setFormData({
        id: lead.id,  
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phoneNumber: lead.phoneNumber || '',
        company: lead.company || '',
        status: lead.status || 'חדש',
        source: lead.source || '',
        notes: lead.notes || '',
        lastContact: lead.lastContact || new Date(),
        budget: lead.budget || 0,
        industry: lead.industry || '',
        score: lead.score || 0,
        tags: lead.tags || [],
        estimatedValue: lead.estimatedValue || 0,
        assignedTo: lead.assignedTo || userId,
        createdBy: lead.createdBy || userId,
        createdAt: lead.createdAt || new Date().toISOString()
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        company: '',
        status: 'חדש',
        source: '',
        notes: '',
        lastContact: new Date(),
        budget: 0,
        industry: '',
        score: 0,
        tags: [],
        estimatedValue: 0,
        assignedTo: userId,
        createdBy: userId,
        createdAt: new Date().toISOString()
      });
    }
  }, [lead, userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const leadToSubmit = lead?.id 
      ? { ...formData, id: lead.id } 
      : formData;
    
    onSubmit(leadToSubmit as Lead);
  };

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = () => {
    if (onDelete && lead) {
      onDelete(lead);
    }
  };

  const renderBasicDetails = () => (
    <div className="space-y-8 rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">שם פרטי</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaUser />
            </div>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס שם פרטי"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">שם משפחה</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaUser />
            </div>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס שם משפחה"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">אימייל</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaEnvelope />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס אימייל"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">טלפון</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaPhone />
            </div>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס מספר טלפון"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">חברה</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaBuilding />
            </div>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס שם חברה"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">סטטוס</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaUserTie />
            </div>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-8 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right appearance-none transition-all duration-300 group-focus-within:border-red-500"
            >
              <option value="חדש">חדש</option>
              <option value="בתהליך">בתהליך</option>
              <option value="סגור">סגור</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 group-focus-within:text-red-500 transition-colors">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdditionalDetails = () => (
    <div className="space-y-8 rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">תקציב</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaMoneyBillWave />
            </div>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', Number(e.target.value))}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס תקציב"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">ערך משוער</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaMoneyBillWave />
            </div>
            <input
              type="number"
              value={formData.estimatedValue}
              onChange={(e) => handleInputChange('estimatedValue', Number(e.target.value))}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס ערך משוער"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">תעשייה</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaIndustry />
            </div>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס תעשייה"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">מקור</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <FaTags />
            </div>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 transition-all duration-300 group-focus-within:border-red-500"
              placeholder="הכנס מקור"
            />
          </div>
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-400 mb-2 text-right group-focus-within:text-red-400 transition-colors">הערות</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="block w-full bg-[#1e1e1e] border border-gray-800 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-right placeholder-gray-600 min-h-[120px] transition-all duration-300 group-focus-within:border-red-500"
          placeholder="הכנס הערות"
        />
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto rtl"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        
        <Dialog.Panel className="relative bg-[#1a1a1a] rounded-lg w-full max-w-4xl mx-4 shadow-xl">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-[#252525] p-4 rounded-l-lg">
              <Tab.Group>
                <Tab.List className="flex flex-col space-y-2">
                  <Tab
                    className={({ selected }) =>
                      `flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                        selected
                          ? 'bg-red-500 text-white'
                          : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                      }`
                    }
                    onClick={() => setActiveTab('details')}
                  >
                    <FaInfoCircle />
                    <span className="text-right">פרטים בסיסיים</span>
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                        selected
                          ? 'bg-red-500 text-white'
                          : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                      }`
                    }
                    onClick={() => setActiveTab('additional')}
                  >
                    <FaClipboardList />
                    <span className="text-right">פרטים נוספים</span>
                  </Tab>
                </Tab.List>
              </Tab.Group>

              {lead && onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <FaTrash />
                  <span className="text-right">מחק ליד</span>
                </button>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <Dialog.Title className="text-xl font-semibold text-white mb-6 text-right">
                {lead ? 'עריכת ליד' : 'ליד חדש'}
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-6 rtl">
                {activeTab === 'details' ? renderBasicDetails() : renderAdditionalDetails()}

                <div className="flex justify-start space-x-2 space-x-reverse">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {lead ? 'עדכן' : 'צור'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LeadModal;
