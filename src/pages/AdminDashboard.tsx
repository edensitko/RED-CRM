import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDatabase, ref, get } from 'firebase/database';

interface UserData {
  role: string;
  name: string;
  email: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  startDate: string;
  status: 'active' | 'inactive';
}

const generateEmployees = (count: number): Employee[] => {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const positions = ['Manager', 'Senior', 'Junior', 'Intern', 'Lead'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `emp-${index + 1}`,
    name: `Employee ${index + 1}`,
    email: `employee${index + 1}@redcrm.com`,
    position: positions[Math.floor(Math.random() * positions.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: Math.random() > 0.1 ? 'active' : 'inactive'
  }));
};

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock employees data
    setEmployees(generateEmployees(30));
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const db = getDatabase();
      const userRef = ref(db, `users/${currentUser.uid}`);
      
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.role !== 'admin') {
            navigate('/dashboard');
            return;
          }
          setUserData(data);
        } else {
          navigate('/role-selection');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-red-600">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome Admin, {userData?.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
            <div className="mt-4 bg-white shadow rounded-lg">
              <div className="p-6">
                <p className="text-gray-500">No recent activity to display.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
