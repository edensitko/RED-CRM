
import {  FaTools } from 'react-icons/fa';

// interface Ticket {
//   id: string;
//   title: string;
//   description: string;
//   customer: string;
//   status: 'new' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   assignedTo: string;
//   category: string;
//   createdAt: number;
//   updatedAt: number;
//   dueDate?: string;
//   responses: Response[];
// }

// interface Response {
//   id: string;
//   userId: string;
//   userName: string;
//   content: string;
//   timestamp: number;
//   isInternal: boolean;
// }

const Support: React.FC = () => {
  // const { currentUser } = useAuth();
  // const [tickets, setTickets] = useState<Ticket[]>([]);
  // const [users, setUsers] = useState<any[]>([]);
  // const [customers, setCustomers] = useState<any[]>([]);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [currentTicket, setCurrentTicket] = useState<Partial<Ticket>>({});
  // const [newResponse, setNewResponse] = useState('');
  // const [isInternalResponse, setIsInternalResponse] = useState(false);
  // const [filter, setFilter] = useState('all');
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // const categories = [
  //   'תמיכה טכנית',
  //   'שאלות מוצר',
  //   'חיוב ותשלומים',
  //   'תקלות',
  //   'בקשות שדרוג',
  //   'אחר',
  // ];

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

  //   // Fetch customers
  //   const customersRef = ref(db, 'customers');
  //   onValue(customersRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const customersData: any[] = [];
  //       snapshot.forEach((child) => {
  //         customersData.push({ id: child.key, ...child.val() });
  //       });
  //       setCustomers(customersData);
  //     }
  //   });

  //   // Fetch tickets
  //   const ticketsRef = ref(db, 'tickets');
  //   onValue(ticketsRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const ticketsData: Ticket[] = [];
  //       snapshot.forEach((child) => {
  //         const ticket = { id: child.key, ...child.val() };
  //         if (
  //           filter === 'all' ||
  //           (filter === 'assigned' && ticket.assignedTo === currentUser?.uid) ||
  //           (filter === 'unassigned' && !ticket.assignedTo)
  //         ) {
  //           ticketsData.push(ticket);
  //         }
  //       });
  //       setTickets(ticketsData.sort((a, b) => b.createdAt - a.createdAt));
  //     }
  //   });
  // }, [currentUser, filter]);

  // const handleDelete = useCallback(async (id: string) => {
  //   try {
  //     const db = getDatabase();
  //     await remove(ref(db, `tickets/${id}`));
  //     setTickets(tickets.filter(ticket => ticket.id !== id));
  //   } catch (err) {
  //     console.error('Error deleting ticket:', err);
  //     setError('Failed to delete ticket. Please try again.');
  //   }
  // }, [tickets]);

  // const validateTicket = (ticket: Partial<Ticket>): boolean => {
  //   if (!ticket.title || ticket.title.trim() === '') {
  //     setError('כותרת הפנייה לא יכולה להיות ריקה');
  //     return false;
  //   }
  //   if (!ticket.description || ticket.description.trim() === '') {
  //     setError('תיאור הפנייה לא יכול להיות ריק');
  //     return false;
  //   }
  //   if (!ticket.customer) {
  //     setError('יש לבחור לקוח');
  //     return false;
  //   }
  //   if (!ticket.priority) {
  //     setError('יש לבחור רמת עדיפות');
  //     return false;
  //   }
  //   if (!ticket.category) {
  //     setError('יש לבחור קטגוריה');
  //     return false;
  //   }
  //   return true;
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError(null);

  //   if (!validateTicket(currentTicket)) {
  //     return;
  //   }

  //   try {
  //     const db = getDatabase();
      
  //     const ticketData = {
  //       ...currentTicket,
  //       updatedAt: Date.now(),
  //       createdAt: currentTicket.createdAt || Date.now(),
  //       responses: currentTicket.responses || [],
  //       status: currentTicket.status || 'new',
  //     };

  //     if (currentTicket.id) {
  //       const { id, ...updateData } = ticketData;
  //       await update(ref(db, `tickets/${id}`), updateData);
  //     } else {
  //       await push(ref(db, 'tickets'), ticketData);
  //     }

  //     setIsModalOpen(false);
  //     setCurrentTicket({});
  //   } catch (err) {
  //     console.error('Error submitting ticket:', err);
  //     setError('Failed to submit ticket. Please try again.');
  //   }
  // };

  // const handleAddResponse = async (ticketId: string) => {
  //   if (newResponse.trim() && currentUser) {
  //     const db = getDatabase();
  //     const response = {
  //       userId: currentUser.uid,
  //       userName: currentUser.displayName || currentUser.email,
  //       content: newResponse.trim(),
  //       timestamp: Date.now(),
  //       isInternal: isInternalResponse,
  //     };

  //     const ticket = tickets.find((t) => t.id === ticketId);
  //     if (ticket) {
  //       const responses = [...(ticket.responses || []), response];
  //       await update(ref(db, `tickets/${ticketId}`), {
  //         responses,
  //         updatedAt: Date.now(),
  //       });
  //       setNewResponse('');
  //       setIsInternalResponse(false);
  //     }
  //   }
  // };

  // const getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case 'urgent':
  //       return 'bg-red-100 text-red-800';
  //     case 'high':
  //       return 'bg-orange-100 text-orange-800';
  //     case 'medium':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'low':
  //       return 'bg-green-100 text-green-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'new':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'in-progress':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'waiting':
  //       return 'bg-purple-100 text-purple-800';
  //     case 'resolved':
  //       return 'bg-green-100 text-green-800';
  //     case 'closed':
  //       return 'bg-gray-100 text-gray-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // return (
  //   <div className="space-y-6 bg-gray-50 min-h-screen p-8" dir="rtl">
  //     {error && (
  //       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
  //         <span className="block sm:inline">{error}</span>
  //       </div>
  //     )}

  //     <div className="sm:flex sm:items-center">
  //       <div className="sm:flex-auto">
  //         <h1 className="text-2xl font-semibold text-gray-800">תמיכה ושירות</h1>
  //         <p className="mt-2 text-sm text-gray-600">
  //           ניהול פניות ובקשות תמיכה מלקוחות
  //         </p>
  //       </div>
  //       <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
  //         <motion.button
  //           whileHover={{ scale: 1.05 }}
  //           whileTap={{ scale: 0.95 }}
  //           onClick={() => {
  //             setCurrentTicket({});
  //             setIsModalOpen(true);
  //           }}
  //           className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
  //         >
  //           <FaPlus className="ml-2" /> פנייה חדשה
  //         </motion.button>
  //       </div>
  //     </div>

  //     <div className="flex space-x-reverse space-x-4 mt-4">
  //       <button
  //         onClick={() => setFilter('all')}
  //         className={`px-4 py-2 text-sm font-medium rounded-md ${
  //           filter === 'all'
  //             ? 'bg-red-100 text-red-700'
  //             : 'text-gray-700 hover:bg-gray-100'
  //         }`}
  //       >
  //         כל הפניות
  //       </button>
  //       <button
  //         onClick={() => setFilter('assigned')}
  //         className={`px-4 py-2 text-sm font-medium rounded-md ${
  //           filter === 'assigned'
  //             ? 'bg-red-100 text-red-700'
  //             : 'text-gray-700 hover:bg-gray-100'
  //         }`}
  //       >
  //         הפניות שלי
  //       </button>
  //       <button
  //         onClick={() => setFilter('unassigned')}
  //         className={`px-4 py-2 text-sm font-medium rounded-md ${
  //           filter === 'unassigned'
  //             ? 'bg-red-100 text-red-700'
  //             : 'text-gray-700 hover:bg-gray-100'
  //         }`}
  //       >
  //         לא משויך
  //       </button>
  //     </div>

  //     <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
  //       <ul className="divide-y divide-gray-200">
  //         {tickets.map((ticket) => (
  //           <li key={ticket.id} className="hover:bg-gray-50 transition-colors">
  //             <div className="px-4 py-4 sm:px-6">
  //               <div className="flex items-center justify-between">
  //                 <div className="flex items-center space-x-reverse space-x-3">
  //                   <p className="text-sm font-medium text-red-600 truncate">
  //                     {ticket.title}
  //                   </p>
  //                   <span
  //                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
  //                       ticket.priority
  //                     )}`}
  //                   >
  //                     {ticket.priority}
  //                   </span>
  //                   <span
  //                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
  //                       ticket.status
  //                     )}`}
  //                   >
  //                     {ticket.status}
  //                   </span>
  //                 </div>
  //                 <div className="flex space-x-reverse space-x-2">
  //                   <button
  //                     onClick={() => {
  //                       setCurrentTicket(ticket);
  //                       setIsModalOpen(true);
  //                     }}
  //                     className="text-gray-500 hover:text-gray-700 flex items-center"
  //                   >
  //                     <FaEdit className="ml-1" /> ערוך
  //                   </button>
  //                   <button
  //                     onClick={() => handleDelete(ticket.id)}
  //                     className="text-red-600 hover:text-red-900 flex items-center"
  //                   >
  //                     <FaTrash className="ml-1" /> מחק
  //                   </button>
  //                 </div>
  //               </div>
  //               <div className="mt-2 flex justify-between">
  //                 <div className="flex flex-col">
  //                   <p className="flex items-center text-sm text-gray-600">
  //                     {customers.find((c) => c.id === ticket.customer)?.name}
  //                   </p>
  //                   <p className="flex items-center text-sm text-gray-600 mt-1">
  //                     {ticket.category}
  //                   </p>
  //                 </div>
  //                 <div className="flex items-center text-sm text-gray-600">
  //                   נוצר ב-{' '}
  //                   {new Date(ticket.createdAt).toLocaleDateString('he-IL')}
  //                 </div>
  //               </div>
  //               {ticket.responses && ticket.responses.length > 0 && (
  //                 <div className="mt-4 space-y-2">
  //                   {ticket.responses.map((response, index) => (
  //                     <div
  //                       key={index}
  //                       className={`p-2 rounded-lg ${
  //                         response.isInternal
  //                           ? 'bg-gray-100 border border-gray-200'
  //                           : 'bg-blue-50'
  //                       }`}
  //                     >
  //                       <div className="flex justify-between">
  //                         <span className="text-sm font-medium text-gray-800">
  //                           {response.userName}
  //                         </span>
  //                         <span className="text-xs text-gray-600">
  //                           {new Date(response.timestamp).toLocaleString(
  //                             'he-IL'
  //                           )}
  //                         </span>
  //                       </div>
  //                       <p className="text-sm mt-1 text-gray-700">{response.content}</p>
  //                     </div>
  //                   ))}
  //                 </div>
  //               )}
  //               <div className="mt-4">
  //                 <div className="flex space-x-reverse space-x-2">
  //                   <input
  //                     type="text"
  //                     placeholder="הוסף תגובה..."
  //                     value={newResponse}
  //                     onChange={(e) => setNewResponse(e.target.value)}
  //                     className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                   />
  //                   <label className="flex items-center">
  //                     <input
  //                       type="checkbox"
  //                       checked={isInternalResponse}
  //                       onChange={(e) => setIsInternalResponse(e.target.checked)}
  //                       className="rounded border-gray-300 text-red-600 focus:ring-red-500"
  //                     />
  //                     <span className="mr-2 text-sm text-gray-600">
  //                       הערה פנימית
  //                     </span>
  //                   </label>
  //                   <button
  //                     onClick={() => handleAddResponse(ticket.id)}
  //                     className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
  //                   >
  //                     שלח
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>
  //           </li>
  //         ))}
  //       </ul>
  //     </div>

  //     {/* Ticket Modal */}
  //     {isModalOpen && (
  //       <div className="fixed inset-0 z-10 overflow-y-auto" dir="rtl">
  //         <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
  //           <motion.div
  //             initial={{ opacity: 0 }}
  //             animate={{ opacity: 0.75 }}
  //             className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
  //             onClick={() => setIsModalOpen(false)}
  //           ></motion.div>

  //           <motion.div 
  //             initial={{ opacity: 0, scale: 0.95 }}
  //             animate={{ opacity: 1, scale: 1 }}
  //             transition={{ duration: 0.2 }}
  //             className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
  //           >
  //             <form onSubmit={handleSubmit} className="space-y-4">
  //               <div>
  //                 <label className="block text-sm font-medium text-gray-700">
  //                   נושא
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={currentTicket.title || ''}
  //                   onChange={(e) =>
  //                     setCurrentTicket({ ...currentTicket, title: e.target.value })
  //                   }
  //                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                   required
  //                   placeholder="הזן נושא פנייה"
  //                 />
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-medium text-gray-700">
  //                   תיאור
  //                 </label>
  //                 <textarea
  //                   value={currentTicket.description || ''}
  //                   onChange={(e) =>
  //                     setCurrentTicket({
  //                       ...currentTicket,
  //                       description: e.target.value,
  //                     })
  //                   }
  //                   rows={3}
  //                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                   required
  //                   placeholder="תאר את הבעיה או הבקשה בפירוט"
  //                 />
  //               </div>

  //               <div className="grid grid-cols-2 gap-4">
  //                 <div>
  //                   <label className="block text-sm font-medium text-gray-700">
  //                     לקוח
  //                   </label>
  //                   <select
  //                     value={currentTicket.customer || ''}
  //                     onChange={(e) =>
  //                       setCurrentTicket({
  //                         ...currentTicket,
  //                         customer: e.target.value,
  //                       })
  //                     }
  //                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                     required
  //                   >
  //                     <option value="">בחר לקוח</option>
  //                     {customers.map((customer) => (
  //                       <option key={customer.id} value={customer.id}>
  //                         {customer.name}
  //                       </option>
  //                     ))}
  //                   </select>
  //                 </div>

  //                 <div>
  //                   <label className="block text-sm font-medium text-gray-700">
  //                     קטגוריה
  //                   </label>
  //                   <select
  //                     value={currentTicket.category || ''}
  //                     onChange={(e) =>
  //                       setCurrentTicket({
  //                         ...currentTicket,
  //                         category: e.target.value,
  //                       })
  //                     }
  //                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                     required
  //                   >
  //                     <option value="">בחר קטגוריה</option>
  //                     {categories.map((category) => (
  //                       <option key={category} value={category}>
  //                         {category}
  //                       </option>
  //                     ))}
  //                   </select>
  //                 </div>
  //               </div>

  //               <div className="grid grid-cols-2 gap-4">
  //                 <div>
  //                   <label className="block text-sm font-medium text-gray-700">
  //                     עדיפות
  //                   </label>
  //                   <select
  //                     value={currentTicket.priority || ''}
  //                     onChange={(e) =>
  //                       setCurrentTicket({
  //                         ...currentTicket,
  //                         priority: e.target.value as Ticket['priority'],
  //                       })
  //                     }
  //                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                     required
  //                   >
  //                     <option value="">בחר עדיפות</option>
  //                     <option value="low">נמוך</option>
  //                     <option value="medium">בינוני</option>
  //                     <option value="high">גבוה</option>
  //                     <option value="urgent">דחוף</option>
  //                   </select>
  //                 </div>

  //                 <div>
  //                   <label className="block text-sm font-medium text-gray-700">
  //                     סטטוס
  //                   </label>
  //                   <select
  //                     value={currentTicket.status || 'new'}
  //                     onChange={(e) =>
  //                       setCurrentTicket({
  //                         ...currentTicket,
  //                         status: e.target.value as Ticket['status'],
  //                       })
  //                     }
  //                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800"
  //                   >
  //                     <option value="new">חדש</option>
  //                     <option value="in-progress">בטיפול</option>
  //                     <option value="waiting">ממתין</option>
  //                     <option value="resolved">פתור</option>
  //                     <option value="closed">סגור</option>
  //                   </select>
  //                 </div>
  //               </div>

  //               <div className="flex justify-start space-x-reverse space-x-2">
  //                 <motion.button
  //                   type="button"
  //                   whileHover={{ scale: 1.05 }}
  //                   whileTap={{ scale: 0.95 }}
  //                   onClick={() => setIsModalOpen(false)}
  //                   className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
  //                 >
  //                   ביטול
  //                 </motion.button>
  //                 <motion.button
  //                   type="submit"
  //                   whileHover={{ scale: 1.05 }}
  //                   whileTap={{ scale: 0.95 }}
  //                   className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
  //                 >
  //                   שמור
  //                 </motion.button>
  //               </div>
  //             </form>
  //           </motion.div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-890" dir="rtl">
    <div className="text-center p-10 bg-black rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
      <div className="flex justify-center mb-6">
        <FaTools className="text-6xl text-red-500 animate-bounce" />
      </div>
      <h1 className="text-3xl font-bold text-gray-100 mb-4">
        עמוד בשיפוצים
      </h1>
      <p className="text-gray-600 mb-6">
        הדף נמצא כרגע בתהליך של שדרוג ושיפוץ. אנא חזור מאוחר יותר.
      </p>
      <div className="bg-red-900 bg-opacity-30 border-l-4 border-red-600 p-4 rounded">
        <p className="text-red-300">
          <strong>הודעה:</strong> אנו עובדים על שיפור חווית המשתמש. תודה על הסבלנות.
        </p>
      </div>
    </div>
  </div>
  );
};

export default Support;
