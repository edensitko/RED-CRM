import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, update } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getDatabase();

  const handleRoleSelect = async (role: 'admin' | 'user') => {
    if (!currentUser) {
      console.error('No current user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Updating role for user:', currentUser.uid, 'to:', role);
      const userRef = ref(db, `users/${currentUser.uid}`);
      await update(userRef, {
        role: role,
        updatedAt: Date.now()
      });
      
      console.log('Role updated successfully');
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Choose Your Role
        </h1>
        
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <button
            onClick={() => handleRoleSelect('user')}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-4 bg-blue-600 text-white rounded-lg px-6 py-8 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            <svg 
              className="w-8 h-8" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            <div className="text-left">
              <div className="text-xl font-semibold">Continue as User</div>
              <div className="text-sm opacity-90">Access standard user features</div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('admin')}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-4 bg-gray-800 text-white rounded-lg px-6 py-8 hover:bg-gray-900 transition-colors duration-200 disabled:opacity-50"
          >
            <svg 
              className="w-8 h-8" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
            <div className="text-left">
              <div className="text-xl font-semibold">Continue as Admin</div>
              <div className="text-sm opacity-90">Access administrative controls</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
