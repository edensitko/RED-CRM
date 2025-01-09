// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FaTasks, FaCheck, FaCalendarAlt, FaUser, FaEdit, FaTrash, FaStar, FaCalendarDay, FaCalendarWeek, FaCalendarPlus } from 'react-icons/fa';
// import { useAuth } from '../hooks/useAuth';
// import { taskService } from '../services/firebase/taskService';
// import { Task } from '../types/schemas';

// const TASK_STATUS_CONFIG = {
//   'pending': {
//     label: 'ממתין',
//     color: 'bg-yellow-100 text-yellow-800',
//     icon: <FaTasks className="mr-2" />
//   },
//   'in_progress': {
//     label: 'בביצוע',
//     color: 'bg-blue-100 text-blue-800',
//     icon: <FaTasks className="mr-2" />
//   },
//   'completed': {
//     label: 'הושלם',
//     color: 'bg-green-100 text-green-800',
//     icon: <FaCheck className="mr-2" />
//   },
//   'cancelled': {
//     label: 'בוטל',
//     color: 'bg-red-100 text-red-800',
//     icon: <FaTasks className="mr-2" />
//   }
// };

// const TASK_PRIORITY_CONFIG = {
//   'low': {
//     label: 'נמוכה',
//     color: 'bg-gray-100 text-gray-800'
//   },
//   'medium': {
//     label: 'בינונית',
//     color: 'bg-yellow-100 text-yellow-800'
//   },
//   'high': {
//     label: 'גבוהה',
//     color: 'bg-red-100 text-red-800'
//   }
// };

// const Missions: React.FC = () => {
//   const { user } = useAuth();
//   const [myMissions, setMyMissions] = useState<Task[]>([]);
//   const [allMissions, setAllMissions] = useState<Task[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     status: 'pending' as Task['status'],
//     priority: 'medium' as Task['priority'],
//     dueDate: new Date().toISOString().split('T')[0],
//     category: 'other' as Task['category']
//   });

//   const buttonStyle = "bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300";

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) {
//         setError('No authenticated user found');
//         setLoading(false);
//         return;
//       }

//       try {
//         // Fetch my missions
//         const myTasksData = await taskService.getTasksByAssignee(user.uid, user.uid);
//         setMyMissions(myTasksData);

//         // Fetch all missions
//         const allTasksData = await taskService.getTasksByAssignee(user.uid, '');
//         const otherUsersTasks = allTasksData.filter(task => task.assignedTo !== user.uid);
//         setAllMissions(otherUsersTasks);
//       } catch (error) {
//         console.error('Error fetching missions:', error);
//         setError('Failed to fetch missions');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [user]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user) return;

//     try {
//       const taskData: Partial<Task> = {
//         ...formData,
//         assignedTo: user.uid,
//         createdAt: new Date(),
//         createdBy: user.uid,
//         updatedAt: new Date(),
//         updatedBy: user.uid,
//         dueDate: new Date(formData.dueDate)
//       };

//       if (selectedTask) {
//         await taskService.updateTask(selectedTask.id, taskData);
//       } else {
//         await taskService.createTask(taskData as Task);
//       }

//       setIsModalOpen(false);
//       setFormData({
//         title: '',
//         description: '',
//         status: 'pending',
//         priority: 'medium',
//         dueDate: new Date().toISOString().split('T')[0],
//         category: 'other'
//       });
//       setSelectedTask(null);
//     } catch (error) {
//       console.error('Error saving mission:', error);
//       setError('Failed to save mission');
//     }
//   };

//   const handleDeleteTask = async (id: string) => {
//     if (!user) return;
    
//     if (window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) {
//       try {
//         await taskService.deleteTask(id, user.uid);
//       } catch (error) {
//         console.error('Error deleting mission:', error);
//         setError('Failed to delete mission');
//       }
//     }
//   };

//   const isToday = (date: Date) => {
//     const today = new Date('2025-01-08T22:22:40+02:00');
//     return (
//       date.getDate() === today.getDate() &&
//       date.getMonth() === today.getMonth() &&
//       date.getFullYear() === today.getFullYear()
//     );
//   };

//   const isThisWeek = (date: Date) => {
//     const today = new Date('2025-01-08T22:22:40+02:00');
//     const weekStart = new Date(today);
//     weekStart.setDate(today.getDate() - today.getDay());
//     const weekEnd = new Date(weekStart);
//     weekEnd.setDate(weekStart.getDate() + 6);
//     return date >= weekStart && date <= weekEnd;
//   };

//   const isThisMonth = (date: Date) => {
//     const today = new Date('2025-01-08T22:22:40+02:00');
//     return (
//       date.getMonth() === today.getMonth() &&
//       date.getFullYear() === today.getFullYear()
//     );
//   };

//   const getDailyTasks = (tasks: Task[]) => tasks.filter(task => {
//     if (!task.dueDate) return false;
//     const dueDate = new Date(task.dueDate);
//     return isToday(dueDate);
//   });

//   const getWeeklyTasks = (tasks: Task[]) => tasks.filter(task => {
//     if (!task.dueDate) return false;
//     const dueDate = new Date(task.dueDate);
//     return isThisWeek(dueDate) && !isToday(dueDate);
//   });

//   const getMonthlyTasks = (tasks: Task[]) => tasks.filter(task => {
//     if (!task.dueDate) return false;
//     const dueDate = new Date(task.dueDate);
//     return isThisMonth(dueDate) && !isThisWeek(dueDate);
//   });

//   const handleTaskClick = (task: Task) => {
//     setSelectedTask(task);
//     setFormData({
//       ...task,
//       dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
//     });
//     setIsModalOpen(true);
//   };

//   const renderTaskSection = (tasks: Task[], title: string, showAssignee: boolean = false) => (
//     <div className="mb-12">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
//         <FaTasks className="text-red-500" />
//         {title}
//       </h2>
//       <div className="space-y-8">
//         {renderTaskList(getDailyTasks(tasks), 'משימות להיום', <FaCalendarDay size={24} className="text-red-500" />, showAssignee)}
//         {renderTaskList(getWeeklyTasks(tasks), 'משימות לשבוע הקרוב', <FaCalendarWeek size={24} className="text-red-500" />, showAssignee)}
//         {renderTaskList(getMonthlyTasks(tasks), 'משימות לחודש הקרוב', <FaCalendarPlus size={24} className="text-red-500" />, showAssignee)}
//       </div>
//     </div>
//   );

//   const renderTaskList = (tasks: Task[], title: string, icon: React.ReactNode, showAssignee: boolean = false) => (
//     <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
//       <div className="flex items-center gap-3 mb-6">
//         {icon}
//         <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
//         <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full ml-2">
//           {tasks.length}
//         </span>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {tasks.map((task) => (
//           <motion.div
//             key={task.id}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer"
//             onClick={() => handleTaskClick(task)}
//           >
//             <div className="flex justify-between items-start mb-4">
//               <h3 className="font-semibold text-lg">{task.title}</h3>
//               <div className="flex gap-2">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleTaskClick(task);
//                   }}
//                   className={buttonStyle}
//                 >
//                   <FaEdit />
//                 </motion.button>
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDeleteTask(task.id);
//                   }}
//                   className={buttonStyle}
//                 >
//                   <FaTrash />
//                 </motion.button>
//               </div>
//             </div>
//             <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>
//             <div className="space-y-3">
//               <div className="flex flex-wrap gap-2">
//                 <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${TASK_STATUS_CONFIG[task.status].color}`}>
//                   {TASK_STATUS_CONFIG[task.status].icon}
//                   <span>{TASK_STATUS_CONFIG[task.status].label}</span>
//                 </div>
//                 <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${TASK_PRIORITY_CONFIG[task.priority].color}`}>
//                   <FaStar className="mr-1" />
//                   {TASK_PRIORITY_CONFIG[task.priority].label}
//                 </div>
//               </div>
//               <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
//                 <div className="flex items-center gap-2">
//                   <FaCalendarAlt className="text-red-500" />
//                   <span>{new Date(task.dueDate || '').toLocaleDateString('he-IL')}</span>
//                 </div>
//                 {showAssignee && (
//                   <div className="flex items-center gap-2">
//                     <FaUser className="text-red-500" />
//                     <span>{task.assignedTo === user?.uid ? 'אני' : 'אחר'}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </motion.div>
//         ))}
//         {tasks.length === 0 && (
//           <div className="col-span-full text-center text-gray-500 py-8">
//             אין משימות לתצוגה בקטגוריה זו
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="missions-container">
//       <motion.button
//         whileHover={{ scale: 1.05 }}
//         whileTap={{ scale: 0.95 }}
//         onClick={() => {
//           setSelectedTask(null);
//           setFormData({
//             title: '',
//             description: '',
//             status: 'pending',
//             priority: 'medium',
//             dueDate: new Date().toISOString().split('T')[0],
//             category: 'other'
//           });
//           setIsModalOpen(true);
//         }}
//         className={buttonStyle}
//       >
//         <FaTasks className="text-white" />
//         משימה חדשה
//       </motion.button>
//       {renderTaskSection(myMissions, 'המשימות שלי')}
//       {renderTaskSection(allMissions, 'כל המשימות', true)}
//       <AnimatePresence>
//         {isModalOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex items-center justify-center"
//           >
//             <motion.div
//               initial={{ scale: 0.5 }}
//               animate={{ scale: 1 }}
//               exit={{ scale: 0.5 }}
//               className="bg-white rounded-lg shadow-lg p-6 w-1/2"
//             >
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">משימה</h2>
//               <form onSubmit={handleSubmit}>
//                 <div className="mb-6">
//                   <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">כותרת</label>
//                   <input
//                     type="text"
//                     id="title"
//                     value={formData.title}
//                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   />
//                 </div>
//                 <div className="mb-6">
//                   <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">תיאור</label>
//                   <textarea
//                     id="description"
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   />
//                 </div>
//                 <div className="mb-6">
//                   <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">סטטוס</label>
//                   <select
//                     id="status"
//                     value={formData.status}
//                     onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
//                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   >
//                     {Object.keys(TASK_STATUS_CONFIG).map((status) => (
//                       <option key={status} value={status}>{TASK_STATUS_CONFIG[status].label}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="mb-6">
//                   <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">דחיפות</label>
//                   <select
//                     id="priority"
//                     value={formData.priority}
//                     onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
//                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   >
//                     {Object.keys(TASK_PRIORITY_CONFIG).map((priority) => (
//                       <option key={priority} value={priority}>{TASK_PRIORITY_CONFIG[priority].label}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="mb-6">
//                   <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">תאריך יעד</label>
//                   <input
//                     type="date"
//                     id="dueDate"
//                     value={formData.dueDate}
//                     onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
//                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   />
//                 </div>
//                 <motion.button
//                   type="button"
//                   onClick={() => setIsModalOpen(false)}
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
//                 >
//                   ביטול
//                 </motion.button>
//                 <motion.button
//                   type="submit"
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   className={buttonStyle}
//                 >
//                   <FaCheck className="ml-2" /> {selectedTask ? 'עדכן משימה' : 'צור משימה'}
//                 </motion.button>
//               </form>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default Missions;
