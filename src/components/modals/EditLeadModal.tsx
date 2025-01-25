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
  FaClipboardList
} from 'react-icons/fa';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Lead) => void;
  lead: Lead;
  userId: string;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ isOpen, onClose, onSubmit, lead, userId }) => {
  const [formData, setFormData] = useState<Lead>(lead);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setFormData(lead);
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderBasicDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 mb-1">שם פרטי</label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס שם פרטי"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-1">שם משפחה</label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס שם משפחה"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 mb-1">אימייל</label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס אימייל"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-1">טלפון</label>
          <div className="relative">
            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס מספר טלפון"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 mb-1">חברה</label>
          <div className="relative">
            <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס שם חברה"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-1">סטטוס</label>
          <div className="relative">
            <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="חדש">חדש</option>
              <option value="בתהליך">בתהליך</option>
              <option value="סגור">סגור</option>
              <option value="לא רלוונטי">לא רלוונטי</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdditionalDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 mb-1">תקציב</label>
          <div className="relative">
            <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס תקציב"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-1">ערך משוער</label>
          <div className="relative">
            <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              value={formData.estimatedValue}
              onChange={(e) => handleInputChange('estimatedValue', parseFloat(e.target.value))}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס ערך משוער"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 mb-1">תעשייה</label>
          <div className="relative">
            <FaIndustry className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס תעשייה"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-1">מקור</label>
          <div className="relative">
            <FaTags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="הכנס מקור"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">הערות</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="w-full bg-[#2a2a2a] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
          placeholder="הכנס הערות"
        />
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <Dialog.Panel className="relative bg-[#1a1a1a] rounded-lg w-full max-w-4xl mx-4 shadow-xl">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-[#252525] p-4 rounded-l-lg">
              <Tab.Group>
                <Tab.List className="flex flex-col space-y-2">
                  <Tab
                    className={({ selected }) =>
                      `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selected
                          ? 'bg-red-500 text-white'
                          : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                      }`
                    }
                    onClick={() => setActiveTab('details')}
                  >
                    <FaInfoCircle />
                    <span>פרטים בסיסיים</span>
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selected
                          ? 'bg-red-500 text-white'
                          : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                      }`
                    }
                    onClick={() => setActiveTab('additional')}
                  >
                    <FaClipboardList />
                    <span>פרטים נוספים</span>
                  </Tab>
                </Tab.List>
              </Tab.Group>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <Dialog.Title className="text-xl font-semibold text-white mb-6">
                עריכת ליד
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'details' ? renderBasicDetails() : renderAdditionalDetails()}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    שמור
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

export default EditLeadModal;
