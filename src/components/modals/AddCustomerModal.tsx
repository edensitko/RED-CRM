import React, { useState } from 'react';
import { CustomerClass } from '../../types/schemas';
import { Dialog } from '@headlessui/react';
import { 
  FaUser, FaEnvelope, FaPhone, FaBuilding
} from 'react-icons/fa';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: CustomerClass) => void;
  userId: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSubmit, userId }) => {
  const [formData, setFormData] = useState<Partial<CustomerClass>>({
    id: '',
    assignedTo: [],
    Balance: 0,
    ComeFrom: '',
    Comments: [],
    companyName: '',
    CreatedBy: userId,
    createdAt: new Date().toISOString(),
    Email: '',
    IsDeleted: false,
    lastName: '',
    Links: [],
    name: '',
    Phone: 0,
    Projects: [],
    Status: "פעיל",
    Tags: [],
    Tasks: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CustomerClass);
  };

  const handleInputChange = (field: keyof CustomerClass, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <Dialog.Panel className="relative bg-[#1a1a1a] rounded-lg w-full max-w-2xl mx-4 shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-xl font-semibold text-white mb-6">
              Add New Customer
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Last Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => handleInputChange('Email', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Phone</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.Phone}
                    onChange={(e) => handleInputChange('Phone', parseInt(e.target.value))}
                    className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Company Name</label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Status</label>
                <select
                  value={formData.Status}
                  onChange={(e) => handleInputChange('Status', e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="פעיל">פעיל</option>
                  <option value="לא פעיל">לא פעיל</option>
                  <option value="בהמתנה">בהמתנה</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Balance</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.Balance}
                    onChange={(e) => handleInputChange('Balance', parseFloat(e.target.value))}
                    className="w-full bg-[#2a2a2a] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter balance"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-[#2a2a2a] px-6 py-4 rounded-b-lg flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#ec5252] text-white rounded-lg hover:bg-red-600"
            >
              צור לקוח
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddCustomerModal;
