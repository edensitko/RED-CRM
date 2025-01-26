// import React, { Fragment, useEffect, useState } from 'react';
// import { motion } from 'framer-motion';
// import { Dialog, Transition, Listbox } from '@headlessui/react';
// import { 
//   FaUser, FaCheck, FaTimes, FaTasks, FaPlus, FaHourglassHalf, 
//   FaPlayCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, 
//   FaInfo, FaCalendarAlt, FaUsers, FaProjectDiagram, FaClock, FaTag,
//   FaComments, FaClipboardList, FaChevronDown
// } from 'react-icons/fa';
// import { addDoc, collection, updateDoc, doc, Timestamp } from 'firebase/firestore';
// import { db } from '../../config/firebase';
// import { Task, User, Project } from '../../types/schemas';
// import { CustomerClass } from '../../types/schemas'

// interface CreateTaskModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onCreateTask?: (task: Task) => Promise<void>;
//   onUpdateTask?: (taskId: string, task: Partial<Task>) => Promise<void>;
//   users: User[];
//   projects: Project[];
//   customers: CustomerClass[];
//   task?: Task | null;
// }

// const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
//   isOpen,
//   onClose,
//   onCreateTask,
//   onUpdateTask,
//   users,
//   projects,
//   customers,
//   task
// }) => {
//   const [activeTab, setActiveTab] = useState('details');
//   const [taskState, setTaskState] = useState<Task>({
//     id: '',  
//     title: '',
//     description: '',
//     status: 'לביצוע',
//     dueDate: null,
//     assignedTo: [],             
//     customers: [],
//     project: null,
//     isDeleted: false,
//     urgent: 'גבוהה',  
//     subTasks: [],
//     comments: [],
//     repeat: 'none',
//     tasks: [],
//     files: [],
//     links: [],
//     isFavorite: false
//   });

//   const tabs = [
//     { id: 'details', label: 'פרטי משימה', icon: <FaTasks /> },
//     { id: 'assignee', label: 'משתמש מוקצה', icon: <FaUser /> },
//     { id: 'project', label: 'פרויקט', icon: <FaProjectDiagram /> },
//     { id: 'customer', label: 'לקוח', icon: <FaUsers /> },
//     { id: 'subtasks', label: 'משימות משנה', icon: <FaClipboardList /> },
//     { id: 'comments', label: 'הערות', icon: <FaComments /> },
//   ];

//   const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
//   const [newComment, setNewComment] = useState('');
//   const [newSubTask, setNewSubTask] = useState({ title: '', description: '' });
//   const [showNewSubTaskForm, setShowNewSubTaskForm] = useState(false);

//   useEffect(() => {
//     if (task) {
//       setTaskState({
//         ...task,
//         assignedTo: Array.isArray(task.assignedTo) 
//           ? task.assignedTo 
//           : task.assignedTo 
//             ? [task.assignedTo] 
//             : [],
//       });
//     }
//   }, [task]);

//   // Map Hebrew urgency levels to internal values
//   const mapUrgencyToInternal = (urgent: string) => {
//     const mapping: { [key: string]: string } = {
//       'נמוכה': 'low',
//       'בינונית': 'normal',
//       'גבוהה': 'high'
//     };
//     return mapping[urgent] || urgent;
//   };

//   const mapUrgencyToHebrew = (urgent: string) => {
//     const mapping: { [key: string]: string } = {
//       'low': 'נמוכה',
//       'normal': 'בינונית',
//       'high': 'גבוהה'
//     };
//     return mapping[urgent] || urgent;
//   };

//   const validateForm = (): boolean => {
//     const errors: {[key: string]: string} = {};

//     if (!taskState.title.trim()) {
//       errors['title'] = 'שם משימה הוא שדה חובה';
//       return false;
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       return;
//     }

//     try {
//       const taskData = {
//         ...taskState,
//         createdAt: new Date().toISOString(),
  

        
//       };

//       if (task && onUpdateTask) {
//         await onUpdateTask(task.id, taskData);
//       } else if (onCreateTask) {
//         await onCreateTask(taskData);
//       } else {
//         // If no callbacks provided, save directly to Firebase
//         const tasksRef = collection(db, 'tasks');
//         await addDoc(tasksRef, taskData);
//       }

//       onClose();
//     } catch (error) {
//       console.error('Error saving task:', error);
//       // You might want to show an error message to the user here
//     }
//   };

//   const handleInputChange = (field: keyof Task, value: any) => {
//     setTaskState(prev => ({
//       ...prev,
//       [field]: field === 'urgent' ? mapUrgencyToHebrew(value) : value
//     }));
//     // Clear error when field is updated
//     if (formErrors[field]) {
//       setFormErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   };

//   const handleAddComment = () => {
//     if (!newComment.trim()) return;
    
//     setTaskState(prev => ({
//       ...prev,
//       comments: [...(prev.comments || []), {
//         id: crypto.randomUUID(),
//         text: newComment.trim(),
//         createdAt: Timestamp.now(), // Changed from ISO string to Timestamp
//         userId: '', 
//         createdBy: '',
//       }]
//     }));
//     setNewComment('');
//   };
//   const handleAddSubTask = () => {
//     setTaskState(prev => ({
//       ...prev,
//       subTasks: [...(prev.subTasks || []), {
//         ...newSubTask,
//         id: crypto.randomUUID(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         createdBy: '',
//         urgent: 'גבוהה',
//         status: 'בתהליך',
//         dueDate: new Date(),
//         completed: false,
//       }]
//     }));
//     setNewSubTask({ title: '', description: '' });
//     setShowNewSubTaskForm(false);
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'details':
//         return (
//           <div className="space-y-6" dir="rtl">
//             <div className="bg-[#2a2a2a] rounded-lg p-4">
//               <h3 className="text-xl font-semibold mb-4 text-white text-right">מידע בסיסי</h3>
//               <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
//                 <div>
//                   <label className="block text-gray-400 mb-1 text-right">כותרת</label>
//                   <div className="relative">
//                     <FaTasks className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="text"
//                       value={taskState.title}
//                       onChange={(e) => handleInputChange('title', e.target.value)}
//                       className={`w-full bg-[#333333] text-white pl-10 pr-3 py-2 rounded-lg outline-none focus:ring-2 ${
//                         formErrors.title ? 'ring-2 ring-red-500' : 'focus:ring-[#ec5252]'
//                       } text-right`}
//                       placeholder="הכנס כותרת משימה"
//                       dir="rtl"
//                     />
//                     {formErrors.title && <p className="text-red-500 text-sm mt-1 text-right">{formErrors.title}</p>}
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-gray-400 mb-1 text-right">סטטוס</label>
//                   <Listbox value={taskState.status} onChange={(value) => handleInputChange('status', value)}>
//                     <div className="relative">
//                       <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252]">
//                         <span className="block truncate">{taskState.status}</span>
//                         <span className="absolute inset-y-0 left-0 flex items-center pl-2">
//                           <FaChevronDown className="h-4 w-4 text-gray-400" />
//                         </span>
//                       </Listbox.Button>
//                       <Transition
//                         as={Fragment}
//                         leave="transition ease-in duration-100"
//                         leaveFrom="opacity-100"
//                         leaveTo="opacity-0"
//                       >
//                         <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
//                           {[
//                             { value: 'לביצוע', label: 'לביצוע', color: 'bg-red-500/20 text-red-500' },
//                             { value: 'בתהליך', label: 'בתהליך', color: 'bg-yellow-500/20 text-yellow-500' },
//                             { value: 'הושלם', label: 'הושלם', color: 'bg-green-500/20 text-green-500' }
//                           ].map((status, index) => (
//                             <Listbox.Option
//                               key={`status-option-${index}`}
//                               value={status.value}
//                               className={({ active }) =>
//                                 `${active ? 'bg-[#444444]' : ''} cursor-pointer select-none relative py-2 pr-10 pl-4`
//                               }
//                             >
//                               {({ selected }) => (
//                                 <>
//                                   <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
//                                     {status.label}
//                                   </span>
//                                   {selected && (
//                                     <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
//                                       <FaCheck className="h-4 w-4" />
//                                     </span>
//                                   )}
//                                 </>
//                               )}
//                             </Listbox.Option>
//                           ))}
//                         </Listbox.Options>
//                       </Transition>
//                     </div>
//                   </Listbox>
//                 </div>

//                 <div>
//                   <label className="block text-gray-400 mb-1 text-right">דחיפות</label>
//                   <Listbox value={taskState.urgent} onChange={(value) => handleInputChange('urgent', value)}>
//                     <div className="relative">
//                       <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252]">
//                         <span className="block truncate">{taskState.urgent}</span>
//                         <span className="absolute inset-y-0 left-0 flex items-center pl-2">
//                           <FaChevronDown className="h-4 w-4 text-gray-400" />
//                         </span>
//                       </Listbox.Button>
//                       <Transition
//                         as={Fragment}
//                         leave="transition ease-in duration-100"
//                         leaveFrom="opacity-100"
//                         leaveTo="opacity-0"
//                       >
//                         <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
//                           {[
//                             { value: 'נמוכה', label: 'נמוכה', color: 'bg-green-500/20 text-green-500' },
//                             { value: 'בינונית', label: 'בינונית', color: 'bg-yellow-500/20 text-yellow-500' },
//                             { value: 'גבוהה', label: 'גבוהה', color: 'bg-red-500/20 text-red-500' }
//                           ].map((urgency, index) => (
//                             <Listbox.Option
//                               key={`urgency-option-${index}`}
//                               value={urgency.value}
//                               className={({ active }) =>
//                                 `${active ? 'bg-[#444444]' : ''} cursor-pointer select-none relative py-2 pr-10 pl-4`
//                               }
//                             >
//                               {({ selected }) => (
//                                 <>
//                                   <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
//                                     {urgency.label}
//                                   </span>
//                                   {selected && (
//                                     <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
//                                       <FaCheck className="h-4 w-4" />
//                                     </span>
//                                   )}
//                                 </>
//                               )}
//                             </Listbox.Option>
//                           ))}
//                         </Listbox.Options>
//                       </Transition>
//                     </div>
//                   </Listbox>
//                 </div>

//                 <div>
//                   <label className="block text-gray-400 mb-1 text-right">תאריך יעד</label>
//                   <div className="relative">
//                     <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="date"
//                       value={taskState.dueDate 
//                         ? (typeof taskState.dueDate === 'object' && 'toDate' in taskState.dueDate 
//                             ? taskState.dueDate.toDate() 
//                             : new Date(taskState.dueDate)
//                           ).toISOString().split('T')[0] 
//                         : ''}
//                       onChange={(e) => handleInputChange('dueDate', e.target.value)}
//                       className="w-full bg-[#333333] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
//                       dir="rtl"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-gray-400 mb-1 text-right">תיאור</label>
//                   <textarea
//                     value={taskState.description}
//                     onChange={(e) => handleInputChange('description', e.target.value)}
//                     className="w-full bg-[#333333] text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
//                     placeholder="הכנס תיאור משימה"
//                     dir="rtl"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case 'assignee':
//         return (
//           <div className="space-y-4">
//             <div className="bg-[#2a2a2a] rounded-lg p-4">
//               <h3 className="text-xl font-semibold mb-4 text-white text-right">משתמשים מוקצים</h3>
//               <div className="space-y-2">
//                 {users.map((user) => (
//                   <div
//                     key={user.id || `temp-${crypto.randomUUID()}`}
//                     className="flex items-center justify-between bg-[#333333] p-3 rounded-lg cursor-pointer hover:bg-[#444444] transition-colors"
//                     onClick={() => {
//                       const newAssignedTo = taskState.assignedTo.includes(user.id)
//                         ? taskState.assignedTo.filter(id => id !== user.id)
//                         : [...taskState.assignedTo, user.id];
//                       handleInputChange('assignedTo', newAssignedTo);
//                     }}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-[#1f1f1f] rounded-full flex items-center justify-center">
//                         <FaUser className="text-red-500" />
//                       </div>
//                       <div className="text-right">
//                         <h4 className="text-white font-medium">{user.name}</h4>
//                         <p className="text-gray-400 text-sm">{user.email}</p>
//                       </div>
//                     </div>
//                     {taskState.assignedTo.includes(user.id) && (
//                       <FaCheck className="text-red-500 h-5 w-5" />
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         );

//       case 'project':
//         return (
//           <div className="space-y-5" dir="rtl">
//             <div className="bg-[#2a2a2a] rounded-lg p-6">
//               <h3 className="text-xl font-semibold mb-4 text-white text-right">בחירת פרויקט</h3>
//               <div>
//                 <label className="block text-gray-400 mb-2 text-right">פרויקט</label>
//                 <Listbox value={taskState.project?.id} onChange={(value) => handleInputChange('project', value)}>
//                   <div className="relative">
//                     <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
//                       <span className="block truncate">
//                         {taskState.project ? (
//                           <div className="flex flex-wrap gap-2 justify-end">
//                             <span key={`project-${taskState.project.id}`} className="inline-flex items-center bg-red-500/20 text-red-400 text-sm px-2 py-1 rounded">
//                               {projects.find(p => p.id === taskState.project?.id)?.name || 'פרויקט לא נמצא'}
//                             </span>
//                           </div>
//                         ) : (
//                           <span className="text-gray-400">בחר פרויקט...</span>
//                         )}
//                       </span>
//                       <span className="absolute inset-y-0 left-0 flex items-center pl-2">
//                         <FaChevronDown className="h-4 w-4 text-gray-400" />
//                       </span>
//                     </Listbox.Button>
//                     <Transition
//                       as={Fragment}
//                       leave="transition ease-in duration-100"
//                       leaveFrom="opacity-100"
//                       leaveTo="opacity-0"
//                     >
//                       <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
//                         {projects.map((project, index) => (
//                           <Listbox.Option
//                             key={`project-option-${index}`}
//                             value={project.id}
//                             className={({ active, selected }) =>
//                               `${active ? 'bg-[#3a3a3a]' : ''} 
//                                ${selected ? 'bg-red-500/10' : ''} 
//                                cursor-pointer select-none relative py-2 px-4 text-right transition-colors duration-200`
//                             }
//                           >
//                             {({ selected }) => (
//                               <div className="flex items-center justify-between">
//                                 <span className={`${selected ? 'text-red-400' : 'text-white'} flex items-center gap-2`}>
//                                   {selected && <FaCheck className="h-4 w-4" />}
//                                 </span>
//                                 <span className={`block truncate ${selected ? 'text-red-400 font-medium' : 'text-white'}`}>
//                                   {project.name}
//                                 </span>
//                               </div>
//                             )}
//                           </Listbox.Option>
//                         ))}
//                       </Listbox.Options>
//                     </Transition>
//                   </div>
//                 </Listbox>
//               </div>
//             </div>
//           </div>
//         );

//       case 'customer':
//         return (
//           <div className="space-y-5" dir="rtl">
//             <div className="bg-[#2a2a2a] rounded-lg p-6">
//               <h3 className="text-xl font-semibold mb-4 text-white text-right">בחירת לקוחות</h3>
//               <div>
//                 <label className="block text-gray-400 mb-2 text-right">לקוחות נבחרים</label>
//                 <Listbox 
//                   value={taskState.customers?.map(customer => customer.id) || []} 
//                   onChange={(selectedValues: string[]) => {
//                     const selectedCustomers = customers.filter(c => selectedValues.includes(c.id));
//                     handleInputChange('customers', selectedCustomers);
//                   }}
//                   multiple
//                 >
//                   <div className="relative">
//                     <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
//                       <span className="block truncate">
//                         {taskState.customers && taskState.customers.length > 0 ? (
//                           <div className="flex flex-wrap gap-2 justify-end">
//                             {taskState.customers.map((customer) => (
//                               <span key={`selected-${customer.id}`} className="inline-flex items-center bg-red-500/20 text-red-400 text-sm px-2 py-1 rounded">
//                                 {customer.name}
//                               </span>
//                             ))}
//                           </div>
//                         ) : (
//                           <span className="text-gray-400">בחר לקוחות...</span>
//                         )}
//                       </span>
//                       <span className="absolute inset-y-0 left-0 flex items-center pl-2">
//                         <FaChevronDown className="h-4 w-4 text-gray-400" />
//                       </span>
//                     </Listbox.Button>
//                     <Transition
//                       as={Fragment}
//                       leave="transition ease-in duration-100"
//                       leaveFrom="opacity-100"
//                       leaveTo="opacity-0"
//                     >
//                       <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
//                         {customers.map((customer, index) => (
//                           <Listbox.Option
//                             key={`customer-option-${index}`}
//                             value={customer.id}
//                             className={({ active, selected }) =>
//                               `${active ? 'bg-[#3a3a3a]' : ''} 
//                                ${selected ? 'bg-red-500/10' : ''} 
//                                cursor-pointer select-none relative py-2 px-4 text-right transition-colors duration-200`
//                             }
//                           >
//                             {({ selected }) => (
//                               <div className="flex items-center justify-between">
//                                 <span className={`${selected ? 'text-red-400' : 'text-white'} flex items-center gap-2`}>
//                                   {selected && <FaCheck className="h-4 w-4" />}
//                                 </span>
//                                 <span className={`block truncate ${selected ? 'text-red-400 font-medium' : 'text-white'}`}>
//                                   {customer.name}
//                                 </span>
//                               </div>
//                             )}
//                           </Listbox.Option>
//                         ))}
//                       </Listbox.Options>
//                     </Transition>
//                   </div>
//                 </Listbox>
//               </div>
//             </div>
//           </div>
//         );

//       case 'subtasks':
//         return (
//           <div className="space-y-4">
//             <div className="bg-[#2a2a2a] rounded-lg p-4">
//               <div className="flex justify-between items-center mb-4">
//                 <button
//                   onClick={() => setShowNewSubTaskForm(true)}
//                   className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
//                 >
//                   <FaPlus className="text-sm" />
//                   <span>הוסף משימת משנה</span>
//                 </button>
//               </div>

//               {showNewSubTaskForm && (
//                 <div className="bg-[#333333] rounded-lg p-4 mb-4">
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-gray-400 mb-1 text-right">כותרת</label>
//                       <input
//                         type="text"
//                         value={newSubTask.title}
//                         onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
//                         className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
//                         dir="rtl"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-gray-400 mb-1 text-right">תיאור</label>
//                       <textarea
//                         value={newSubTask.description}
//                         onChange={(e) => setNewSubTask({ ...newSubTask, description: e.target.value })}
//                         className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
//                         dir="rtl"
//                       />
//                     </div>
//                     <div className="flex justify-end gap-2">
//                       <button
//                         onClick={() => setShowNewSubTaskForm(false)}
//                         className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
//                       >
//                         ביטול
//                       </button>
//                       <button
//                         onClick={handleAddSubTask}
//                         className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
//                       >
//                         הוסף
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-2">
//                 {taskState.subTasks?.map((subTask, index) => (
//                   <div key={subTask.id} className="bg-[#333333] rounded-lg p-4">
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <h4 className="text-white font-medium text-right">{subTask.title}</h4>
//                         {subTask.description && (
//                           <p className="text-gray-400 mt-1 text-right">{subTask.description}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         );

//       case 'comments':
//         return (
//           <div className="space-y-4">
//             <div className="bg-[#2a2a2a] rounded-lg p-4">
//               <div className="mb-4">
//                 <div className="flex gap-2">
//                   <textarea
//                     value={newComment}
//                     onChange={(e) => setNewComment(e.target.value)}
//                     className="flex-1 bg-[#333333] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
//                     placeholder="הוסף הערה..."
//                     dir="rtl"
//                   />
//                   <button
//                     onClick={handleAddComment}
//                     disabled={!newComment.trim()}
//                     className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
//                   >
//                     <FaPlus />
//                   </button>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 {taskState.comments?.map((comment) => (
//                   <div key={comment.id} className="bg-[#333333] rounded-lg p-4">
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <p className="text-white text-right">{comment.text}</p>
//                         <div className="flex justify-end items-center gap-2 mt-2">
//                           <span className="text-gray-400 text-sm">
//                             {comment.createdAt instanceof Timestamp
//                               ? comment.createdAt.toDate().toLocaleString('he-IL')
//                               : new Date(comment.createdAt).toLocaleString('he-IL')}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <Transition appear show={isOpen} as={Fragment}>
//       <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
//         <Transition.Child
//           as={Fragment}
//           enter="ease-out duration-300"
//           enterFrom="opacity-0"
//           enterTo="opacity-100"
//           leave="ease-in duration-200"
//           leaveFrom="opacity-100"
//           leaveTo="opacity-0"
//         >
//           <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
//         </Transition.Child>

//         <div className="fixed inset-0 overflow-y-auto">
//           <div className="flex min-h-full items-center justify-center p-4 text-center">
//             <Transition.Child
//               as={Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0 scale-95"
//               enterTo="opacity-100 scale-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100 scale-100"
//               leaveTo="opacity-0 scale-95"
//             >
//               <Dialog.Panel className="w-[900px] h-[600px] transform overflow-hidden rounded-2xl bg-[#1f1f1f] text-right align-middle shadow-xl transition-all">
//                 <div className="flex items-center justify-between p-4 border-b border-gray-800">
//                   <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
//                     {task ? 'עריכת משימה' : 'משימה חדשה'}
//                   </Dialog.Title>
//                   <button
//                     type="button"
//                     className="bg-[#ec5252] text-white p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
//                     onClick={onClose}
//                   >
//                     <FaTimes className="h-4 w-4" />
//                   </button>
//                 </div>

//                 <div className="flex flex-row gap-6 p-6 h-[calc(600px-140px)] overflow-hidden">
//                   <div className="w-1/4 space-y-3 overflow-y-auto custom-scrollbar">
//                     {tabs.map((tab, index) => (
//                       <button
//                         key={`tab-${index}`}
//                         onClick={() => setActiveTab(tab.id)}
//                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 outline-none ${
//                           activeTab === tab.id
//                             ? 'bg-red-500/10 text-red-400'
//                             : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
//                         }`}
//                       >
//                         <span className="text-xl">{tab.icon}</span>
//                         <span>{tab.label}</span>
//                       </button>
//                     ))}
//                   </div>
//                   <div className="w-3/4 bg-[#1f1f1f] rounded-xl overflow-y-auto custom-scrollbar">
//                     {renderTabContent()}
//                   </div>
//                 </div>

//                 <div className="flex justify-end m-4 pt-1 border-t border-gray-800">
//                   <button
//                     type="button"
//                     onClick={handleSubmit}
//                     className="bg-[#ec5252] text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
//                   >
//                     {task ? 'עדכן משימה' : 'צור משימה'}
//                   </button>
//                 </div>
//               </Dialog.Panel>
//             </Transition.Child>
//           </div>
//         </div>
//       </Dialog>
      
//     </Transition>
//   );
// };

// export default CreateTaskModal;


import React, { Fragment, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
  FaUser,
  FaCheck,
  FaTimes,
  FaTasks,
  FaPlus,
  FaCalendarAlt,
  FaUsers,
  FaProjectDiagram,
  FaComments,
  FaClipboardList,
  FaChevronDown,
} from 'react-icons/fa';
import { addDoc, collection, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Your interfaces
import { Task, User, Project, CustomerClass, SubTask } from '../../types/schemas';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask?: (task: Task) => Promise<void>;
  onUpdateTask?: (taskId: string, task: Partial<Task>) => Promise<void>;
  users: User[];
  projects: Project[];
  customers: CustomerClass[];
  task?: Task | null;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  onUpdateTask,
  users,
  projects,
  customers,
  task,
}) => {
  // Manage which tab is active
  const [activeTab, setActiveTab] = useState('details');

  // Local state for the task
  const [taskState, setTaskState] = useState<Task>({
    id: '',
    title: '',
    description: '',
    status: 'לביצוע',
    urgent: 'גבוהה',
    dueDate: null,
    assignedTo: [],
    customers: [],
    project: null,
    subTasks: [],
    comments: [],
    tasks: [],
    files: [],
    links: [],
    isFavorite: false,
    isDeleted: false,
  });

  // Tabs for the left menu
  const tabs = [
    { id: 'details', label: 'פרטי משימה', icon: <FaTasks /> },
    { id: 'assignee', label: 'משתמש מוקצה', icon: <FaUser /> },
    { id: 'project', label: 'פרויקט', icon: <FaProjectDiagram /> },
    { id: 'customer', label: 'לקוח', icon: <FaUsers /> },
    { id: 'subtasks', label: 'משימות משנה', icon: <FaClipboardList /> },
    { id: 'comments', label: 'הערות', icon: <FaComments /> },
  ];

  // Form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Temporary state for new comments/subtasks
  const [newComment, setNewComment] = useState('');
  const [newSubTask, setNewSubTask] = useState({ title: '', description: '' });
  const [showNewSubTaskForm, setShowNewSubTaskForm] = useState(false);

  // Populate local state if editing an existing task
  useEffect(() => {
    if (task) {
      setTaskState((prev) => ({
        ...prev,
        ...task,
        // Ensure assignedTo is always an array
        assignedTo: Array.isArray(task.assignedTo)
          ? task.assignedTo
          : task.assignedTo
          ? [task.assignedTo]
          : [],
      }));
    }
  }, [task]);

  // Utility to map Hebrew urgency to internal
  const mapUrgencyToInternal = (urgent: string) => {
    const mapping: { [key: string]: string } = {
      'נמוכה': 'low',
      'בינונית': 'normal',
      'גבוהה': 'high',
    };
    return mapping[urgent] || urgent;
  };

  // Utility to map internal urgency to Hebrew
  const mapUrgencyToHebrew = (urgent: string) => {
    const mapping: { [key: string]: string } = {
      low: 'נמוכה',
      normal: 'בינונית',
      high: 'גבוהה',
    };
    return mapping[urgent] || urgent;
  };

  // Basic validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!taskState.title.trim()) {
      errors['title'] = 'שם משימה הוא שדה חובה';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit (create or update) the task
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Convert data to what Firestore expects
      const finalTaskData: Task = {
        ...taskState,
        urgent: mapUrgencyToInternal(taskState.urgent),
        dueDate: taskState.dueDate
          ? Timestamp.fromDate(new Date(taskState.dueDate as unknown as string))
          : null,
        // If you want to set `createdAt`/`updatedAt`, do it here:
        // createdAt: task ? task.createdAt || Timestamp.now() : Timestamp.now(),
        createdAt: task?.createdAt || Timestamp.now(),
      };

      // If editing (task exists)
      if (task && task.id && onUpdateTask) {
        await onUpdateTask(task.id, finalTaskData);
      }
      // If creating a new task via callback
      else if (onCreateTask) {
        await onCreateTask(finalTaskData);
      }
      // If directly saving to Firestore
      else {
        const tasksRef = collection(db, 'tasks');
        await addDoc(tasksRef, finalTaskData);
      }

      // Close the modal on success
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      // Optionally show a toast/snackbar error here
    }
  };

  // Generic input handler
  const handleInputChange = (field: keyof Task, value: any) => {
    setTaskState((prev) => ({
      ...prev,
      [field]: field === 'urgent' ? mapUrgencyToHebrew(value) : value,
    }));
    // Clear this field’s error if it exists
    if (formErrors[field]) {
      setFormErrors((prevErr) => ({ ...prevErr, [field]: '' }));
    }
  };

  // Add a comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    setTaskState((prev) => ({
      ...prev,
      comments: [
        ...(prev.comments || []),
        {
          id: crypto.randomUUID(),
          text: newComment.trim(),
          createdAt: Timestamp.now(),
          createdBy: '',
        },
      ],
    }));
    setNewComment('');
  };

  // Add a subtask
  const handleAddSubTask = () => {
    const newSubTaskObj: SubTask = {
      id: crypto.randomUUID(),
      title: newSubTask.title,
      description: newSubTask.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
      urgent: 'גבוהה',
      status: 'בתהליך',
      dueDate: new Date(),
      completed: false,
    };

    setTaskState((prev) => ({
      ...prev,
      subTasks: [...(prev.subTasks || []), newSubTaskObj],
    }));

    setNewSubTask({ title: '', description: '' });
    setShowNewSubTaskForm(false);
  };

  // Renders tab content based on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">
                מידע בסיסי
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-gray-400 mb-1 text-right">
                    כותרת
                  </label>
                  <div className="relative">
                    <FaTasks className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={taskState.title}
                      onChange={(e) =>
                        handleInputChange('title', e.target.value)
                      }
                      className={`w-full bg-[#333333] text-white pl-10 pr-3 py-2 rounded-lg outline-none focus:ring-2 ${
                        formErrors.title
                          ? 'ring-2 ring-red-500'
                          : 'focus:ring-[#ec5252]'
                      } text-right`}
                      placeholder="הכנס כותרת משימה"
                      dir="rtl"
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1 text-right">
                        {formErrors.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-gray-400 mb-1 text-right">
                    סטטוס
                  </label>
                  <Listbox
                    value={taskState.status}
                    onChange={(value) => handleInputChange('status', value)}
                  >
                    <div className="relative">
                      <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252]">
                        <span className="block truncate">
                          {taskState.status}
                        </span>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                          <FaChevronDown className="h-4 w-4 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                          {[
                            { value: 'לביצוע', label: 'לביצוע' },
                            { value: 'בתהליך', label: 'בתהליך' },
                            { value: 'הושלם', label: 'הושלם' },
                          ].map((status, index) => (
                            <Listbox.Option
                              key={`status-option-${index}`}
                              value={status.value}
                              className={({ active }) =>
                                `${
                                  active ? 'bg-[#444444]' : ''
                                } cursor-pointer select-none relative py-2 pr-10 pl-4`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? 'font-medium' : 'font-normal'
                                    }`}
                                  >
                                    {status.label}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                                      <FaCheck className="h-4 w-4" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                {/* Urgent */}
                <div>
                  <label className="block text-gray-400 mb-1 text-right">
                    דחיפות
                  </label>
                  <Listbox
                    value={taskState.urgent}
                    onChange={(value) => handleInputChange('urgent', value)}
                  >
                    <div className="relative">
                      <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252]">
                        <span className="block truncate">
                          {taskState.urgent}
                        </span>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                          <FaChevronDown className="h-4 w-4 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                          {[
                            { value: 'נמוכה', label: 'נמוכה' },
                            { value: 'בינונית', label: 'בינונית' },
                            { value: 'גבוהה', label: 'גבוהה' },
                          ].map((urgency, index) => (
                            <Listbox.Option
                              key={`urgency-option-${index}`}
                              value={urgency.value}
                              className={({ active }) =>
                                `${
                                  active ? 'bg-[#444444]' : ''
                                } cursor-pointer select-none relative py-2 pr-10 pl-4`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? 'font-medium' : 'font-normal'
                                    }`}
                                  >
                                    {urgency.label}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                                      <FaCheck className="h-4 w-4" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-gray-400 mb-1 text-right">
                    תאריך יעד
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={
                        taskState.dueDate
                          ? new Date(
                              taskState.dueDate as unknown as string
                            ).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        handleInputChange('dueDate', e.target.value)
                      }
                      className="w-full bg-[#333333] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-400 mb-1 text-right">
                    תיאור
                  </label>
                  <textarea
                    value={taskState.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    className="w-full bg-[#333333] text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
                    placeholder="הכנס תיאור משימה"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'assignee':
        return (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">
                משתמשים מוקצים
              </h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-[#333333] p-3 rounded-lg cursor-pointer hover:bg-[#444444] transition-colors"
                    onClick={() => {
                      const newAssignedTo = taskState.assignedTo.includes(
                        user.id
                      )
                        ? taskState.assignedTo.filter((id) => id !== user.id)
                        : [...taskState.assignedTo, user.id];
                      handleInputChange('assignedTo', newAssignedTo);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1f1f1f] rounded-full flex items-center justify-center">
                        <FaUser className="text-red-500" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-white font-medium">{user.name}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    {taskState.assignedTo.includes(user.id) && (
                      <FaCheck className="text-red-500 h-5 w-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="space-y-5" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">
                בחירת פרויקט
              </h3>
              <div>
                <label className="block text-gray-400 mb-2 text-right">
                  פרויקט
                </label>
                <Listbox
                  value={taskState.project?.id || ''}
                  onChange={(selectedProjectId: string) => {
                    const selectedProject = projects.find(
                      (p) => p.id === selectedProjectId
                    );
                    handleInputChange('project', selectedProject || null);
                  }}
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
                      <span className="block truncate">
                        {taskState.project
                          ? taskState.project.name
                          : 'בחר פרויקט...'}
                      </span>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
                        {projects.map((project, index) => (
                          <Listbox.Option
                            key={`project-option-${index}`}
                            value={project.id}
                            className={({ active, selected }) =>
                              `${active ? 'bg-[#3a3a3a]' : ''}
                               ${selected ? 'bg-red-500/10' : ''}
                               cursor-pointer select-none relative py-2 px-4 text-right transition-colors duration-200`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex items-center justify-between">
                                <span
                                  className={`${
                                    selected ? 'text-red-400' : 'text-white'
                                  } flex items-center gap-2`}
                                >
                                  {selected && <FaCheck className="h-4 w-4" />}
                                </span>
                                <span
                                  className={`block truncate ${
                                    selected
                                      ? 'text-red-400 font-medium'
                                      : 'text-white'
                                  }`}
                                >
                                  {project.name}
                                </span>
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
        );

      case 'customer':
        return (
          <div className="space-y-5" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">
                בחירת לקוחות
              </h3>
              <div>
                <label className="block text-gray-400 mb-2 text-right">
                  לקוחות נבחרים
                </label>
                <Listbox
                  multiple
                  value={taskState.customers?.map((c) => c.id) || []}
                  onChange={(selectedValues: string[]) => {
                    const selectedCustomers = customers.filter((c) =>
                      selectedValues.includes(c.id)
                    );
                    handleInputChange('customers', selectedCustomers);
                  }}
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
                      <span className="block truncate">
                        {taskState.customers && taskState.customers.length > 0
                          ? taskState.customers
                              .map((customer) => customer.name)
                              .join(', ')
                          : 'בחר לקוחות...'}
                      </span>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
                        {customers.map((customer, index) => (
                          <Listbox.Option
                            key={`customer-option-${index}`}
                            value={customer.id}
                            className={({ active, selected }) =>
                              `${active ? 'bg-[#3a3a3a]' : ''}
                               ${selected ? 'bg-red-500/10' : ''}
                               cursor-pointer select-none relative py-2 px-4 text-right transition-colors duration-200`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex items-center justify-between">
                                <span
                                  className={`${
                                    selected ? 'text-red-400' : 'text-white'
                                  } flex items-center gap-2`}
                                >
                                  {selected && <FaCheck className="h-4 w-4" />}
                                </span>
                                <span
                                  className={`block truncate ${
                                    selected
                                      ? 'text-red-400 font-medium'
                                      : 'text-white'
                                  }`}
                                >
                                  {customer.name}
                                </span>
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
        );

      case 'subtasks':
        return (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setShowNewSubTaskForm(true)}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FaPlus className="text-sm" />
                  <span>הוסף משימת משנה</span>
                </button>
              </div>

              {showNewSubTaskForm && (
                <div className="bg-[#333333] rounded-lg p-4 mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-1 text-right">
                        כותרת
                      </label>
                      <input
                        type="text"
                        value={newSubTask.title}
                        onChange={(e) =>
                          setNewSubTask({
                            ...newSubTask,
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 text-right">
                        תיאור
                      </label>
                      <textarea
                        value={newSubTask.description}
                        onChange={(e) =>
                          setNewSubTask({
                            ...newSubTask,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-[#2a2a2a] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
                        dir="rtl"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowNewSubTaskForm(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={handleAddSubTask}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        הוסף
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {taskState.subTasks?.map((subTask) => (
                  <div key={subTask.id} className="bg-[#333333] rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-right">
                          {subTask.title}
                        </h4>
                        {subTask.description && (
                          <p className="text-gray-400 mt-1 text-right">
                            {subTask.description}
                          </p>
                        )}
                      </div>
                      {/* Could add subtask actions here */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              {/* New Comment */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-[#333333] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
                    placeholder="הוסף הערה..."
                    dir="rtl"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Existing Comments */}
              <div className="space-y-4">
                {taskState.comments?.map((comment) => (
                  <div key={comment.id} className="bg-[#333333] rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white text-right">{comment.text}</p>
                        <div className="flex justify-end items-center gap-2 mt-2">
                          <span className="text-gray-400 text-sm">
                            {comment.createdAt instanceof Timestamp
                              ? comment.createdAt
                                  .toDate()
                                  .toLocaleString('he-IL')
                              : new Date(comment.createdAt).toLocaleString(
                                  'he-IL'
                                )}
                          </span>
                        </div>
                      </div>
                      {/* Could add comment actions here */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-[900px] h-[600px] transform overflow-hidden rounded-2xl bg-[#1f1f1f] text-right align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    {task ? 'עריכת משימה' : 'משימה חדשה'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="bg-[#ec5252] text-white p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
                    onClick={onClose}
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex flex-row gap-6 p-6 h-[calc(600px-140px)] overflow-hidden">
                  {/* Tabs Menu */}
                  <div className="w-1/4 space-y-3 overflow-y-auto custom-scrollbar">
                    {tabs.map((tabItem, index) => (
                      <button
                        key={`tab-${index}`}
                        onClick={() => setActiveTab(tabItem.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 outline-none ${
                          activeTab === tabItem.id
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                        }`}
                      >
                        <span className="text-xl">{tabItem.icon}</span>
                        <span>{tabItem.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="w-3/4 bg-[#1f1f1f] rounded-xl overflow-y-auto custom-scrollbar">
                    {renderTabContent()}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end m-4 pt-1 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-[#ec5252] text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    {task ? 'עדכן משימה' : 'צור משימה'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateTaskModal;
