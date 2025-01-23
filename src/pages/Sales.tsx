import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaFilter, 
  FaChartBar, 
  FaTable, 
  FaChartPie,
  FaLightbulb,
  FaFileAlt,
  FaHandshake,
  FaChartLine,
  FaSignature,
  FaSpinner,
  FaCheck,
  FaPause,
  FaCircle,
  FaTools
} from 'react-icons/fa';
import { salesService } from '../services/firebase/salesService';
import { Sale, SALE_STATUS_CONFIG, SALE_STAGE_CONFIG } from '../types/sales';
import { customerService } from '../services/firebase/customerService';
import { Customer } from '../types/schemas';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Sales: React.FC = () => {
  // const { currentUser } = useAuth();
  // const [sales, setSales] = useState<Sale[]>([]);
  // const [customers, setCustomers] = useState<Customer[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [view, setView] = useState<'table' | 'board' | 'analytics'>('board');
  // const [filters, setFilters] = useState<{
  //   status?: Sale['status'],
  //   stage?: Sale['stage'],
  //   priority?: Sale['priority']
  // }>({});

  // const filteredSales = useMemo(() => {
  //   return sales.filter(sale => 
  //     (!filters.status || sale.status === filters.status) &&
  //     (!filters.stage || sale.stage === filters.stage) &&
  //     (!filters.priority || sale.priority === filters.priority)
  //   );
  // }, [sales, filters]);

  // const stageData = useMemo(() => {
  //   const stageCounts = sales.reduce((acc, sale) => {
  //     acc[sale.stage] = (acc[sale.stage] || 0) + 1;
  //     return acc;
  //   }, {} as Record<Sale['stage'], number>);

  //   return Object.entries(stageCounts).map(([name, value]) => ({ name, value }));
  // }, [sales]);

  // const statusData = useMemo(() => {
  //   const statusCounts = sales.reduce((acc, sale) => {
  //     acc[sale.status] = (acc[sale.status] || 0) + 1;
  //     return acc;
  //   }, {} as Record<Sale['status'], number>);

  //   return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  // }, [sales]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const activeCustomers = await customerService.getActiveCustomers();
  //       setCustomers(activeCustomers);

  //       salesService.getSales((fetchedSales) => {
  //         setSales(fetchedSales);
  //         setLoading(false);
  //       }, (err) => {
  //         setError(err.message);
  //         setLoading(false);
  //       });
  //     } catch (err) {
  //       console.error('Error fetching data:', err);
  //       setError('Failed to load sales or customers');
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // const renderTableView = () => (
  //   <div className="overflow-x-auto" dir="rtl">
  //     <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
  //       <thead className="bg-gray-100">
  //         <tr>
  //           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כותרת</th>
  //           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
  //           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שלב</th>
  //           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
  //           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סכום</th>
  //           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך סגירה צפוי</th>
  //         </tr>
  //       </thead>
  //       <tbody className="divide-y divide-gray-200">
  //         {filteredSales.map((sale) => {
  //           const customer = customers.find(c => c.id === sale.customerId);
  //           const stageConfig = SALE_STAGE_CONFIG[sale.stage];
  //           const statusConfig = SALE_STATUS_CONFIG[sale.status];

  //           return (
  //             <tr key={sale.id} className="hover:bg-gray-50 transition">
  //               <td className="px-6 py-4 whitespace-nowrap">{sale.title}</td>
  //               <td className="px-6 py-4 whitespace-nowrap">
  //                 {customer ? `${customer.firstName} ${customer.lastName}` : 'לא מוגדר'}
  //               </td>
  //               <td className="px-6 py-4 whitespace-nowrap">
  //                 <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${stageConfig.color}`}>
  //                   {React.createElement(stageConfig.icon as any, { className: 'ml-2' })}
  //                   {stageConfig.label}
  //                 </div>
  //               </td>
  //               <td className="px-6 py-4 whitespace-nowrap">
  //                 <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${statusConfig.color}`}>
  //                   {React.createElement(statusConfig.icon as any, { className: 'ml-2' })}
  //                   {statusConfig.label}
  //                 </div>
  //               </td>
  //               <td className="px-6 py-4 whitespace-nowrap">₪{sale.amount.toLocaleString()}</td>
  //               <td className="px-6 py-4 whitespace-nowrap">{sale.expectedCloseDate}</td>
  //             </tr>
  //           );
  //         })}
  //       </tbody>
  //     </table>
  //   </div>
  // );

  // const renderAnalyticsView = () => (
  //   <div className="grid grid-cols-1 md:grid-cols-2 gap-8" dir="rtl">
  //     <div className="bg-white shadow-lg rounded-lg p-6">
  //       <h3 className="text-xl font-semibold mb-4 flex items-center">
  //         <FaChartPie className="ml-3 text-blue-600" /> התפלגות שלבי מכירה
  //       </h3>
  //       <PieChart width={400} height={300}>
  //         <Pie
  //           data={stageData}
  //           cx={200}
  //           cy={150}
  //           labelLine={false}
  //           outerRadius={120}
  //           fill="#8884d8"
  //           dataKey="value"
  //         >
  //           {stageData.map((entry, index) => (
  //             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  //           ))}
  //         </Pie>
  //         <Tooltip />
  //         <Legend />
  //       </PieChart>
  //     </div>

  //     <div className="bg-white shadow-lg rounded-lg p-6">
  //       <h3 className="text-xl font-semibold mb-4 flex items-center">
  //         <FaChartBar className="ml-3 text-green-600" /> סטטוס מכירות
  //       </h3>
  //       <BarChart width={400} height={300} data={statusData}>
  //         <XAxis dataKey="name" />
  //         <YAxis />
  //         <Tooltip />
  //         <Legend />
  //         <Bar dataKey="value" fill="#8884d8" />
  //       </BarChart>
  //     </div>
  //   </div>
  // );

  // const renderBoardView = () => (
  //   <div className="grid grid-cols-5 gap-4" dir="rtl">
  //     {Object.keys(SALE_STAGE_CONFIG).map((stage) => (
  //       <div key={stage} className="bg-white rounded-lg shadow-md p-4">
  //         <div className="flex justify-between items-center mb-4">
  //           <h3 className="text-lg font-semibold flex items-center">
  //             {React.createElement(SALE_STAGE_CONFIG[stage as Sale['stage']].icon as any, { 
  //               className: 'ml-2 ' + SALE_STAGE_CONFIG[stage as Sale['stage']].color.split(' ')[1] 
  //             })}
  //             {SALE_STAGE_CONFIG[stage as Sale['stage']].label}
  //           </h3>
  //           <span className="text-sm text-gray-500">
  //             {filteredSales.filter(sale => sale.stage === stage).length}
  //           </span>
  //         </div>
  //         {filteredSales
  //           .filter(sale => sale.stage === stage)
  //           .map((sale) => {
  //             const customer = customers.find(c => c.id === sale.customerId);
  //             const statusConfig = SALE_STATUS_CONFIG[sale.status];

  //             return (
  //               <motion.div 
  //                 key={sale.id}
  //                 initial={{ opacity: 0, y: 20 }}
  //                 animate={{ opacity: 1, y: 0 }}
  //                 className="bg-gray-100 rounded-lg p-3 mb-3 hover:shadow-md transition"
  //               >
  //                 <div className="flex justify-between items-center mb-2">
  //                   <h4 className="font-medium">{sale.title}</h4>
  //                   <div className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
  //                     {React.createElement(statusConfig.icon as any, { className: 'ml-1' })}
  //                     {statusConfig.label}
  //                   </div>
  //                 </div>
  //                 <div className="text-sm text-gray-600">
  //                   {customer ? `${customer.firstName} ${customer.lastName}` : 'לקוח לא מוגדר'}
  //                 </div>
  //                 <div className="mt-2 text-sm text-gray-500">
  //                   ₪{sale.amount.toLocaleString()} | {sale.expectedCloseDate}
  //                 </div>
  //               </motion.div>
  //             );
  //           })}
  //       </div>
  //     ))}
  //   </div>
  // );

  // return (
  //   <div className="container mx-auto px-4 py-8" dir="rtl">
  //     <div className="flex justify-between items-center mb-8">
  //       <h1 className="text-3xl font-bold text-gray-800 flex items-center">
  //         <FaChartLine className="ml-4 text-red-600" /> מכירות
  //       </h1>
  //       <div className="flex space-x-4">
  //         <motion.button
  //           whileHover={{ scale: 1.05 }}
  //           whileTap={{ scale: 0.95 }}
  //           onClick={() => {/* Open add sale modal */}}
  //           className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
  //         >
  //           <FaPlus className="ml-2" /> הוסף מכירה
  //         </motion.button>
  //         <div className="flex space-x-2">
  //           {['board', 'table', 'analytics'].map((viewType) => (
  //             <motion.button
  //               key={viewType}
  //               whileHover={{ scale: 1.05 }}
  //               whileTap={{ scale: 0.95 }}
  //               onClick={() => setView(viewType as any)}
  //               className={`px-4 py-2 rounded-lg transition ${
  //                 view === viewType 
  //                   ? 'bg-blue-600 text-white' 
  //                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
  //               }`}
  //             >
  //               {viewType === 'board' && <FaTable className="ml-2" />}
  //               {viewType === 'table' && <FaTable className="ml-2" />}
  //               {viewType === 'analytics' && <FaChartBar className="ml-2" />}
  //               {viewType}
  //             </motion.button>
  //           ))}
  //         </div>
  //       </div>
  //     </div>

  //     {loading ? (
  //       <div className="text-center py-8">טוען מכירות...</div>
  //     ) : error ? (
  //       <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
  //     ) : (
  //       <>
  //         <div className="mb-6 flex space-x-4">
  //           {/* Status Filter */}
  //           <select 
  //             onChange={(e) => setFilters(prev => ({ 
  //               ...prev, 
  //               status: e.target.value as Sale['status'] 
  //             }))}
  //             className="px-4 py-2 border rounded-lg"
  //           >
  //             <option value="">כל הסטטוסים</option>
  //             {Object.keys(SALE_STATUS_CONFIG).map(status => (
  //               <option key={status} value={status}>{status}</option>
  //             ))}
  //           </select>

  //           {/* Stage Filter */}
  //           <select 
  //             onChange={(e) => setFilters(prev => ({ 
  //               ...prev, 
  //               stage: e.target.value as Sale['stage'] 
  //             }))}
  //             className="px-4 py-2 border rounded-lg"
  //           >
  //             <option value="">כל השלבים</option>
  //             {Object.keys(SALE_STAGE_CONFIG).map(stage => (
  //               <option key={stage} value={stage}>{stage}</option>
  //             ))}
  //           </select>
  //         </div>

  //         {view === 'table' && renderTableView()}
  //         {view === 'board' && renderBoardView()}
  //         {view === 'analytics' && renderAnalyticsView()}
  //       </>
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

export default Sales;
