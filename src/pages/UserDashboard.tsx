import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h1 className="text-2xl font-semibold text-gray-900">User Dashboard</h1>
            <p className="mt-4 text-gray-600">
              Welcome back, {currentUser?.displayName || 'User'}!
            </p>
            
            {/* Dashboard Content */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Example Card */}
              <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Tasks
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          12
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Card */}
              <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Completed Tasks
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          8
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Card */}
              <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pending Tasks
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          4
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <div className="mt-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {[1, 2, 3].map((item, index) => (
                      <li key={item}>
                        <div className="relative pb-8">
                          {index !== 2 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  Task {item} completed
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {item} hour ago
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
