import React from 'react';
import { getDatabase, ref, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

interface RoleSelectionModalProps {
  userId: string;
  onClose: () => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ userId, onClose }) => {
  const navigate = useNavigate();
  const db = getDatabase();

  const handleRoleSelection = async (role: 'admin' | 'user') => {
    try {
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        role: role,
        updatedAt: Date.now()
      });
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Select Your Role</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Choose how you want to use the application
            </p>
          </div>
          <div className="mt-4 flex flex-col space-y-4">
            <button
              onClick={() => handleRoleSelection('user')}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              Continue as User
            </button>
            <button
              onClick={() => handleRoleSelection('admin')}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              Continue as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
