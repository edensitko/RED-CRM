import React from 'react';
import { FaTools } from 'react-icons/fa';

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
  // const { currentUser } = useAuth();
  // const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  // const [users, setUsers] = useState<any[]>([]);
  // const [projects, setProjects] = useState<any[]>([]);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [currentEntry, setCurrentEntry] = useState<CurrentEntry>({});
  // const [filter, setFilter] = useState('all');
  // const [dateRange, setDateRange] = useState({
  //   start: new Date().toISOString().split('T')[0],
  //   end: new Date().toISOString().split('T')[0],
  // });

  // useEffect(() => {
  //   const db = getDatabase();

  //   // Fetch users
  //   const usersRef = ref(db, 'users');
  //   onValue(usersRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const usersData: any[] = [];
  //       snapshot.forEach((child) => {
  //         usersData.push({ id: child.key, ...child.val() });
  //       });
  //       setUsers(usersData);
  //     }
  //   });

  //   // Fetch projects
  //   const projectsRef = ref(db, 'projects');
  //   onValue(projectsRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const projectsData: any[] = [];
  //       snapshot.forEach((child) => {
  //         projectsData.push({ id: child.key, ...child.val() });
  //       });
  //       setProjects(projectsData);
  //     }
  //   });

  //   // Fetch time entries
  //   const timeEntriesRef = ref(db, 'timeEntries');
  //   onValue(timeEntriesRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const entriesData: TimeEntry[] = [];
  //       snapshot.forEach((child) => {
  //         const entry = { id: child.key, ...child.val() };
  //         if (entry.userId === currentUser?.uid) {
  //           if (
  //             entry.date >= dateRange.start &&
  //             entry.date <= dateRange.end
  //           ) {
  //             entriesData.push(entry);
  //           }
  //         }
  //       });
  //       setTimeEntries(entriesData.sort((a, b) => {
  //         const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
  //         const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
  //         return dateB - dateA;
  //       }));
  //     }
  //   });
  // }, [currentUser, dateRange]);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const db = getDatabase();
    
  //   if (!currentEntry.date || !currentEntry.startTime || !currentEntry.endTime) {
  //     return;
  //   }

  //   const startDateTime = new Date(`${currentEntry.date}T${currentEntry.startTime}`).getTime();
  //   const endDateTime = new Date(`${currentEntry.date}T${currentEntry.endTime}`).getTime();
  //   const duration = (endDateTime - startDateTime) / (1000 * 60 * 60); // Duration in hours

  //   const entryData = {
  //     ...currentEntry,
  //     userId: currentUser?.uid,
  //     startTime: currentEntry.startTime,
  //     endTime: currentEntry.endTime,
  //     duration,
  //     createdAt: Date.now(),
  //   };

  //   if (currentEntry.id) {
  //     const { id, ...updateData } = entryData;
  //     await update(ref(db, `timeEntries/${id}`), updateData);
  //   } else {
  //     await push(ref(db, 'timeEntries'), entryData);
  //   }

  //   setIsModalOpen(false);
  //   setCurrentEntry({});
  // };

  // const handleDelete = async (id: string) => {
  //   if (window.confirm('האם אתה בטוח שברצונך למחוק דיווח זה?')) {
  //     const db = getDatabase();
  //     await remove(ref(db, `timeEntries/${id}`));
  //   }
  // };

  // const getTotalHours = () => {
  //   return timeEntries.reduce((total, entry) => total + entry.duration, 0);
  // };

  // const getProjectHours = () => {
  //   const projectHours: { [key: string]: number } = {};
  //   timeEntries.forEach((entry) => {
  //     projectHours[entry.project] = (projectHours[entry.project] || 0) + entry.duration;
  //   });
  //   return projectHours;
  // };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">דוחות זמן</h1>
          <button 
            className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            onClick={() => {
              // Add logic to create new time entry
            }}
          >
            דיווח חדש
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Time Entry Form */}
          <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">הזנת דיווח שעות</h2>
            <form className="space-y-4">
              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  תאריך
                </label>
                <input
                  type="date"
                  className="w-full bg-[#2A2A2A] text-gray-200 border-gray-700 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Start Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  שעת התחלה
                </label>
                <input
                  type="time"
                  className="w-full bg-[#2A2A2A] text-gray-200 border-gray-700 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* End Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  שעת סיום
                </label>
                <input
                  type="time"
                  className="w-full bg-[#2A2A2A] text-gray-200 border-gray-700 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 rtl:space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-red-700 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  צור דיווח
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>

          {/* Middle Column - Time Entries List */}
          <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">דיווחי שעות</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="bg-[#2A2A2A] text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">תאריך</th>
                    <th className="px-4 py-3">שעת התחלה</th>
                    <th className="px-4 py-3">שעת סיום</th>
                    <th className="px-4 py-3">משך זמן</th>
                    <th className="px-4 py-3">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder for time entries */}
                  <tr className="border-b border-gray-700 hover:bg-[#2A2A2A]">
                    <td className="px-4 py-3">01/01/2024</td>
                    <td className="px-4 py-3">09:00</td>
                    <td className="px-4 py-3">17:00</td>
                    <td className="px-4 py-3">8 שעות</td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button className="text-blue-400 hover:text-blue-300">
                          ערוך
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeReports;
