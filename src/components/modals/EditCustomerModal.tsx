import React, { useState, useEffect } from 'react';
import { CustomerClass } from '../../types/customer';
import { Dialog } from '@headlessui/react';
import { 
  FaUser, FaEnvelope, FaPhone, FaBuilding, FaTag, FaLink, 
  FaFile, FaCog, FaUsers, FaComments,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { userService } from '../../services/firebase/userService';
import { User } from '../../types/schemas';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: CustomerClass) => void;
  customer: CustomerClass;
  userId: string;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, onSubmit, customer, userId }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'files' | 'users' | 'comments'>('profile');
  const [formData, setFormData] = useState<CustomerClass>(customer);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setFormData(customer);
  }, [customer]);

  const fetchUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CustomerClass, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
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
            </div>
          </form>
        );
      case 'users':
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Search users..."
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium">Assigned Users</h3>
              {formData.assignedTo?.map(userId => {
                const user = allUsers.find(u => u.id === userId);
                return user ? (
                  <div key={user.id} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <FaUser className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{user.firstName}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInputChange('assignedTo', formData.assignedTo?.filter(id => id !== user.id))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : null;
              })}
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium">Available Users</h3>
              {allUsers
                .filter(user => !formData.assignedTo?.includes(user.id))
                .filter(user =>
                  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded-lg cursor-pointer hover:bg-[#333333]"
                    onClick={() => handleInputChange('assignedTo', [...(formData.assignedTo || []), user.id])}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <FaUser className="text-gray-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{user.firstName}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <Dialog.Panel className="relative bg-[#1a1a1a] rounded-lg w-full max-w-6xl mx-4 shadow-xl">
          <div className="flex h-[80vh]">
            {/* Sidebar */}
            <div className="w-64 bg-[#2a2a2a] p-4 rounded-l-lg">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === 'profile' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-[#333333]'
                  }`}
                >
                  <FaUser />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === 'files' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-[#333333]'
                  }`}
                >
                  <FaFile />
                  <span>Files</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === 'users' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-[#333333]'
                  }`}
                >
                  <FaUsers />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === 'comments' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-[#333333]'
                  }`}
                >
                  <FaComments />
                  <span>Comments</span>
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <Dialog.Title className="text-xl font-semibold text-white mb-6">
                Edit Customer
              </Dialog.Title>

              {renderTabContent()}
            </div>
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
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              ערוך לקוח
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditCustomerModal;
