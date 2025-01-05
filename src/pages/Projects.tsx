import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaProjectDiagram, 
  FaCalendarAlt, 
  FaUsers, 
  FaEdit, 
  FaTrash, 
  FaCheck,
  FaPlus,
  FaSpinner,
  FaPause
} from 'react-icons/fa';
import { customerService } from '../services/firebase/customerService';
import { Customer } from '../types/schemas';

interface Project {
  id: string;
  name: string;
  description: string;
  customerId: string;
  status: 'תכנון' | 'בביצוע' | 'הושלם';
  startDate: string;
  endDate: string;
  budget: number;
  createdAt: string;
}

const PROJECT_STATUS_CONFIG = {
  'תכנון': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaSpinner className="text-red-500" />,
    label: 'תכנון'
  },
  'בביצוע': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaPause className="text-yellow-500" />,
    label: 'בביצוע'
  },
  'הושלם': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheck className="text-green-500" />,
    label: 'הושלם'
  }
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    customerId: '',
    status: 'תכנון',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0
  });

  useEffect(() => {
    const db = getDatabase();
    const projectsRef = ref(db, 'projects');
    const customersRef = ref(db, 'customers');

    const fetchProjects = onValue(projectsRef, (snapshot) => {
      const projectsData: Project[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        projectsData.push({
          id: child.key || '',
          name: data.name || '',
          description: data.description || '',
          customerId: data.customerId || '',
          status: ['תכנון', 'בביצוע', 'הושלם'].includes(data.status) 
            ? data.status 
            : 'תכנון',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          budget: data.budget || 0
        });
      });
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching projects:', error);
      setError(error.message);
      setLoading(false);
    });

    const fetchCustomers = onValue(customersRef, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        customersData.push({
          id: child.key || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          companyName: data.companyName || ''
        });
      });
      setCustomers(customersData);
    }, (error) => {
      console.error('Error fetching customers:', error);
    });

    return () => {
      // Unsubscribe from listeners
      fetchProjects();
      fetchCustomers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();
    const projectsRef = ref(db, 'projects');

    try {
      if (selectedProject) {
        await update(projectsRef.child(selectedProject.id), {
          ...formData,
        });
      } else {
        await push(projectsRef, {
          ...formData,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        customerId: '',
        status: 'תכנון',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        budget: 0
      });
    } catch (error) {
      console.error('Error adding project:', error);
      setError('Failed to add project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const db = getDatabase();
      const projectRef = ref(db, `projects/${id}`);
      try {
        await remove(projectRef);
      } catch (error) {
        console.error('Error deleting project:', error);
        setError('Failed to delete project');
      }
    }
  };

  const updateProjectStatus = async (id: string, newStatus: Project['status']) => {
    const db = getDatabase();
    const projectRef = ref(db, `projects/${id}`);
    try {
      await update(projectRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaProjectDiagram className="ml-4 text-red-600" /> פרויקטים
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedProject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          <FaPlus className="ml-2" /> הוסף פרויקט
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const status = PROJECT_STATUS_CONFIG[project.status];
          const customer = customers.find(c => c.id === project.customerId);
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                    {customer && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <FaUsers className="ml-2" /> 
                        {customer.firstName} {customer.lastName} ({customer.companyName})
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedProject(project);
                        setFormData(project);
                        setIsModalOpen(true);
                      }}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <FaEdit />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`${status.color} px-3 py-1 rounded-full text-xs flex items-center`}>
                      {status.icon}
                      <span className="mr-2">{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <FaCalendarAlt className="ml-2" />
                    {new Date(project.startDate).toLocaleDateString('he-IL')} - 
                    {new Date(project.endDate).toLocaleDateString('he-IL')}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  {Object.keys(PROJECT_STATUS_CONFIG).map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (selectedProject) {
                          const db = getDatabase();
                          const projectRef = ref(db, `projects/${selectedProject.id}`);
                          update(projectRef, { status: s });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs ${
                        selectedProject && selectedProject.status === s 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {PROJECT_STATUS_CONFIG[s as Project['status']].label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaProjectDiagram className="ml-4" /> 
                {selectedProject ? 'ערוך פרויקט' : 'צור פרויקט חדש'}
              </h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-red-500 rounded-full p-2 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם הפרויקט
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="הזן שם פרויקט"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    לקוח
                  </label>
                  <motion.select
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} ({customer.companyName})
                      </option>
                    ))}
                  </motion.select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור הפרויקט
                </label>
                <motion.textarea
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="תאר את מטרות ודרישות הפרויקט"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך התחלה
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך סיום
                  </label>
                  <motion.input
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תקציב
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    required
                    min="0"
                    placeholder="תקציב הפרויקט"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סטטוס הפרויקט
                </label>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {(['תכנון', 'בביצוע', 'הושלם'] as Project['status'][]).map((status) => (
                    <label 
                      key={status} 
                      className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition duration-300 ${
                        formData.status === status 
                          ? 'bg-blue-100 border-blue-500 border-2' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <input 
                        type="radio" 
                        value={status}
                        checked={formData.status === status}
                        onChange={() => setFormData({ ...formData, status: status })}
                        className="hidden"
                      />
                      {PROJECT_STATUS_CONFIG[status].label}
                    </label>
                  ))}
                </motion.div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ביטול
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                >
                  <FaCheck className="ml-2" /> {selectedProject ? 'עדכן פרויקט' : 'צור פרויקט'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Projects;
