import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { translations } from '../utils/translations';

const { auth } = translations;

const RoleSelectionPopup: React.FC = () => {
  const { user, updateUserRole } = useAuth();

  const handleRoleSelect = async (role: 'admin' | 'user') => {
    try {
      if (user) {
        await updateUserRole(user.uid, role);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {auth.roleSelection.title}
        </h2>
        <p className="text-gray-600 mb-6">
          {auth.roleSelection.subtitle}
        </p>
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('user')}
            className="w-full px-4 py-3 text-right rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="mr-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {auth.roleSelection.user.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {auth.roleSelection.user.description}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('admin')}
            className="w-full px-4 py-3 text-right rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {auth.roleSelection.admin.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {auth.roleSelection.admin.description}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPopup;
