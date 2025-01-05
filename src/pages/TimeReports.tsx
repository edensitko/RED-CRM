import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

interface TimeEntry {
  id: string;
  userId: string;
  project: string;
  task: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  date: string;
  createdAt: number;
}

interface CurrentEntry extends Partial<TimeEntry> {
  date?: string;
  startTime?: string;
  endTime?: string;
}

const TimeReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<CurrentEntry>({});
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const db = getDatabase();

    // Fetch users
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData: any[] = [];
        snapshot.forEach((child) => {
          usersData.push({ id: child.key, ...child.val() });
        });
        setUsers(usersData);
      }
    });

    // Fetch projects
    const projectsRef = ref(db, 'projects');
    onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData: any[] = [];
        snapshot.forEach((child) => {
          projectsData.push({ id: child.key, ...child.val() });
        });
        setProjects(projectsData);
      }
    });

    // Fetch time entries
    const timeEntriesRef = ref(db, 'timeEntries');
    onValue(timeEntriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const entriesData: TimeEntry[] = [];
        snapshot.forEach((child) => {
          const entry = { id: child.key, ...child.val() };
          if (
            filter === 'all' ||
            (filter === 'my' && entry.userId === currentUser?.uid)
          ) {
            if (
              entry.date >= dateRange.start &&
              entry.date <= dateRange.end
            ) {
              entriesData.push(entry);
            }
          }
        });
        setTimeEntries(entriesData.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
          const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
          return dateB - dateA;
        }));
      }
    });
  }, [currentUser, filter, dateRange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();
    
    if (!currentEntry.date || !currentEntry.startTime || !currentEntry.endTime) {
      return;
    }

    const startDateTime = new Date(`${currentEntry.date}T${currentEntry.startTime}`).getTime();
    const endDateTime = new Date(`${currentEntry.date}T${currentEntry.endTime}`).getTime();
    const duration = (endDateTime - startDateTime) / (1000 * 60 * 60); // Duration in hours

    const entryData = {
      ...currentEntry,
      userId: currentUser?.uid,
      startTime: currentEntry.startTime,
      endTime: currentEntry.endTime,
      duration,
      createdAt: Date.now(),
    };

    if (currentEntry.id) {
      const { id, ...updateData } = entryData;
      await update(ref(db, `timeEntries/${id}`), updateData);
    } else {
      await push(ref(db, 'timeEntries'), entryData);
    }

    setIsModalOpen(false);
    setCurrentEntry({});
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק דיווח זה?')) {
      const db = getDatabase();
      await remove(ref(db, `timeEntries/${id}`));
    }
  };

  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.duration, 0);
  };

  const getProjectHours = () => {
    const projectHours: { [key: string]: number } = {};
    timeEntries.forEach((entry) => {
      projectHours[entry.project] = (projectHours[entry.project] || 0) + entry.duration;
    });
    return projectHours;
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">דיווחי שעות</h1>
          <p className="mt-2 text-sm text-gray-700">
            ניהול ומעקב אחר שעות עבודה
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
          <button
            onClick={() => {
              setCurrentEntry({});
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            דיווח חדש
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            כל הדיווחים
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'my'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            הדיווחים שלי
          </button>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
          <span>עד</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-red-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סך הכל שעות
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {getTotalHours().toFixed(1)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פרויקט
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                משימה
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                שעות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                עובד
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">פעולות</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {projects.find((p) => p.id === entry.project)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.task}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.duration.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {users.find((u) => u.id === entry.userId)?.displayName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setCurrentEntry(entry);
                      setIsModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-900 ml-4"
                  >
                    ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Time Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תאריך
                  </label>
                  <input
                    type="date"
                    value={currentEntry.date || ''}
                    onChange={(e) =>
                      setCurrentEntry({
                        ...currentEntry,
                        date: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    פרויקט
                  </label>
                  <select
                    value={currentEntry.project || ''}
                    onChange={(e) =>
                      setCurrentEntry({
                        ...currentEntry,
                        project: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">בחר פרויקט</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    משימה
                  </label>
                  <input
                    type="text"
                    value={currentEntry.task || ''}
                    onChange={(e) =>
                      setCurrentEntry({
                        ...currentEntry,
                        task: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תיאור
                  </label>
                  <textarea
                    value={currentEntry.description || ''}
                    onChange={(e) =>
                      setCurrentEntry({
                        ...currentEntry,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      שעת התחלה
                    </label>
                    <input
                      type="time"
                      value={currentEntry.startTime || ''}
                      onChange={(e) =>
                        setCurrentEntry({
                          ...currentEntry,
                          startTime: e.target.value 
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      שעת סיום
                    </label>
                    <input
                      type="time"
                      value={currentEntry.endTime || ''}
                      onChange={(e) =>
                        setCurrentEntry({
                          ...currentEntry,
                          endTime: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    {currentEntry.id ? 'עדכן' : 'צור'} דיווח
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeReports;
