import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  FaProjectDiagram, 
  FaCalendarAlt, 
  FaUsers, 
  FaEdit, 
  FaTrash, 
  FaCheck,
  FaPlus,
  FaSpinner,
  FaPause,
  FaColumns,
  FaList,
  FaThLarge,
  FaMoneyBillWave,
  FaClock,
  FaSearch,
  FaTimes,
  FaStar
} from 'react-icons/fa';
import { customerService } from '../services/firebase/customerService';
import { toggleProjectFavorite } from '../services/firebase/projectService';
import { Customer } from '../types/schemas';
import { useAuth } from '../hooks/useAuth';

interface Project {
  id: string;
  name: string;
  description: string;
  customerId: string;
  status: 'planning' | 'in_progress' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  createdAt: string;
  isFavorite?: boolean;
}

const STATUS_MAPPING = {
  'planning': 'תכנון',
  'in_progress': 'בביצוע',
  'completed': 'הושלם'
} as const;

const REVERSE_STATUS_MAPPING = {
  'תכנון': 'planning',
  'בביצוע': 'in_progress',
  'הושלם': 'completed'
} as const;

const PROJECT_STATUS_CONFIG = {
  'planning': { 
    color: 'bg-red-100 text-red-800', 
    icon: <FaSpinner className="text-red-500" />,
    label: 'תכנון'
  },
  'in_progress': { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <FaPause className="text-yellow-500" />,
    label: 'בביצוע'
  },
  'completed': { 
    color: 'bg-green-100 text-green-800', 
    icon: <FaCheck className="text-green-500" />,
    label: 'הושלם'
  }
};

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerId: '',
    status: 'planning' as Project['status'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'startDate' | 'endDate' | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredProjects = projects
    .filter(project => {
      if (showFavorites) return project.isFavorite;
      
      const customer = customers.find(c => c.id === project.customerId);
      const searchLower = searchQuery.toLowerCase();
      
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        (customer && 
          (`${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower) ||
           customer.companyName.toLowerCase().includes(searchLower)))
      );
    });

  const handleSort = (field: 'startDate' | 'endDate') => {
    const newOrder = field === sortField && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    
    const sortedProjects = [...projects].sort((a, b) => {
      const dateA = new Date(a[field]).getTime();
      const dateB = new Date(b[field]).getTime();
      return newOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setProjects(sortedProjects);
  };

  // Group projects by status
  const groupedProjects = filteredProjects.reduce((acc, project) => {
    if (!acc[project.status]) {
      acc[project.status] = [];
    }
    acc[project.status].push(project);
    return acc;
  }, {} as Record<Project['status'], Project[]>);

  // Define status columns
  const statusColumns: Project['status'][] = ['planning', 'in_progress', 'completed'];

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const projectRef = doc(db, `projects/${draggableId}`);
    
    try {
      // Convert the English status back to Hebrew for storage
      await updateDoc(projectRef, {
        status: STATUS_MAPPING[destination.droppableId as Project['status']]
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };

  const toggleFavorite = async (projectId: string, isFavorite: boolean) => {
    try {
      await toggleProjectFavorite(projectId, isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects from Firestore
        const projectsRef = collection(db, 'projects');
        onSnapshot(projectsRef, (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              name: docData.name || '',
              description: docData.description || '',
              customerId: docData.customerId || '',
              status: (docData.status && typeof docData.status === 'string' && docData.status in REVERSE_STATUS_MAPPING 
                ? REVERSE_STATUS_MAPPING[docData.status as keyof typeof REVERSE_STATUS_MAPPING]
                : 'planning') as Project['status'],
              startDate: docData.startDate || '',
              endDate: docData.endDate || '',
              budget: docData.budget || 0,
              createdAt: docData.createdAt || '',
              isFavorite: docData.isFavorite
            } as Project;
          });
          setProjects(data);
        });

        // Fetch customers from Firestore
        if (!user) {
          throw new Error('No authenticated user found');
        }
        
        const fetchedCustomers = await customerService.getAllCustomers(user.uid);
        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const projectData = {
        ...formData,
        // Convert English status to Hebrew for storage
        status: STATUS_MAPPING[formData.status]
      };

      if (selectedProject) {
        const projectRef = doc(db, `projects/${selectedProject.id}`);
        await updateDoc(projectRef, projectData);
      } else {
        const projectsRef = collection(db, 'projects');
        await addDoc(projectsRef, {
          ...projectData,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        customerId: '',
        status: 'planning',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        budget: 0
      });
      setSelectedProject(null);
    } catch (error) {
      console.error('Error adding project:', error);
      setError('Failed to add project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const projectRef = doc(db, `projects/${id}`);
      try {
        await deleteDoc(projectRef);
      } catch (error) {
        console.error('Error deleting project:', error);
        setError('Failed to delete project');
      }
    }
  };

  const updateProjectStatus = async (id: string, newStatus: Project['status']) => {
    const projectRef = doc(db, `projects/${id}`);
    try {
      await updateDoc(projectRef, { status: STATUS_MAPPING[newStatus] });
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
            <FaProjectDiagram className="text-red-500" />
            פרויקטים
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedProject(null);
            setFormData({
              name: '',
              description: '',
              customerId: '',
              status: 'planning',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              budget: 0
            });
            setIsModalOpen(true);
          }}
          className="bg-red-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-red-600 transition duration-300"
        >
          <FaPlus className="ml-1" />
          <span>פרויקט חדש</span>
        </motion.button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש לפי שם פרויקט, תיאור או לקוח..."
            className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center"
            >
              <FaTimes className="h-5 w-5 text-gray-400 hover:text-red-500" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`p-2 rounded ${showFavorites ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            title={showFavorites ? 'הצג את כל הפרויקטים' : 'הצג מועדפים בלבד'}
          >
            <FaStar />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            title="תצוגת רשת"
          >
            <FaThLarge />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            title="תצוגת קנבן"
          >
            <FaColumns />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            title="תצוגת רשימה"
          >
            <FaList />
          </button>
        </div>
      </div>

      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          נמצאו {filteredProjects.length} תוצאות עבור "{searchQuery}"
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusColumns.map((status) => (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-gray-100 rounded-lg p-4 min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        {PROJECT_STATUS_CONFIG[status].icon}
                        <span>{PROJECT_STATUS_CONFIG[status].label}</span>
                      </h2>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_CONFIG[status].color}`}>
                        {groupedProjects[status]?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {groupedProjects[status]?.map((project, index) => (
                        <Draggable 
                          key={project.id} 
                          draggableId={project.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => {
                                setSelectedProject(project);
                                setIsViewModalOpen(true);
                              }}
                              style={{
                                ...provided.draggableProps.style,
                                transform: snapshot.isDragging
                                  ? provided.draggableProps.style?.transform
                                  : 'none'
                              }}
                              className={`bg-white p-4 rounded-lg shadow transition-all cursor-pointer ${
                                snapshot.isDragging 
                                  ? 'shadow-lg ring-2 ring-red-500 rotate-1 scale-105' 
                                  : 'hover:shadow-lg hover:-translate-y-1'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">{project.name}</h3>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject(project);
                                      setFormData(project);
                                      setIsModalOpen(true);
                                    }}
                                    className="text-gray-600 hover:text-red-500"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(project.id);
                                    }}
                                    className="text-gray-600 hover:text-red-500"
                                  >
                                    <FaTrash />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(project.id, project.isFavorite ?? false);
                                    }}
                                    className={`text-gray-600 hover:text-yellow-500 ${project.isFavorite ? 'text-yellow-500' : ''}`}
                                  >
                                    <FaStar />
                                  </button>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                              <div className="flex justify-between items-center text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <FaCalendarAlt />
                                  <span>{new Date(project.startDate).toLocaleDateString('he-IL')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FaUsers />
                                  <span>
                                    {customers.find(c => c.id === project.customerId)?.firstName || 'לא נבחר לקוח'}
                                  </span>
                                </div>
                              </div>
                              {project.budget > 0 && (
                                <div className="mt-2 text-sm font-semibold text-gray-700">
                                  ₪{project.budget.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('startDate')}
                    className="flex items-center gap-1 hover:text-red-600 transition-colors"
                  >
                    תאריך התחלה
                    {sortField === 'startDate' && (
                      <span className="text-red-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('endDate')}
                    className="flex items-center gap-1 hover:text-red-600 transition-colors"
                  >
                    תאריך סיום
                    {sortField === 'endDate' && (
                      <span className="text-red-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תקציב</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsViewModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_CONFIG[project.status].color}`}>
                      {PROJECT_STATUS_CONFIG[project.status].icon}
                      <span className="mr-2">{PROJECT_STATUS_CONFIG[project.status].label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customers.find(c => c.id === project.customerId)?.firstName || 'לא נבחר לקוח'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.startDate).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.endDate 
                      ? new Date(project.endDate).toLocaleDateString('he-IL')
                      : 'לא נקבע'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₪{project.budget.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setFormData(project);
                          setIsModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(project.id, project.isFavorite ?? false);
                        }}
                        className={`text-gray-600 hover:text-yellow-500 ${project.isFavorite ? 'text-yellow-500' : ''}`}
                      >
                        <FaStar />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedProject(project);
                setIsViewModalOpen(true);
              }}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-xl">{project.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setFormData(project);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-600 hover:text-red-500"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-gray-600 hover:text-red-500"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(project.id, project.isFavorite ?? false);
                    }}
                    className={`text-gray-600 hover:text-yellow-500 ${project.isFavorite ? 'text-yellow-500' : ''}`}
                  >
                    <FaStar />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="space-y-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${PROJECT_STATUS_CONFIG[project.status].color}`}>
                  {PROJECT_STATUS_CONFIG[project.status].icon}
                  <span className="mr-2">{PROJECT_STATUS_CONFIG[project.status].label}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt />
                    <span>{new Date(project.startDate).toLocaleDateString('he-IL')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers />
                    <span>
                      {customers.find(c => c.id === project.customerId)?.firstName || 'לא נבחר לקוח'}
                    </span>
                  </div>
                </div>
                {project.budget > 0 && (
                  <div className="text-lg font-semibold text-gray-700">
                    ₪{project.budget.toLocaleString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
                className="text-red-500 hover:bg-red-500 rounded-full p-2 transition"
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
                  {(['planning', 'in_progress', 'completed'] as Project['status'][]).map((status) => (
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

      {/* View Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaProjectDiagram className="ml-4" /> 
                {selectedProject ? 'פרטי פרויקט' : ''}
              </h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsViewModalOpen(false)}
                className="text-red-600 hover:bg-red-500 rounded-full p-2 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {selectedProject && (
              <div className="space-y-6 p-8">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${PROJECT_STATUS_CONFIG[selectedProject.status].color}`}>
                      {PROJECT_STATUS_CONFIG[selectedProject.status].icon}
                      <span className="mr-2">{PROJECT_STATUS_CONFIG[selectedProject.status].label}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedProject.id, selectedProject.isFavorite ?? false)}
                      className={`p-2 rounded hover:bg-gray-100 ${selectedProject.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                      title={selectedProject.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                    >
                      <FaStar className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">תיאור הפרויקט</h3>
                  <p className="text-gray-700">{selectedProject.description || 'אין תיאור'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">לקוח</h3>
                    <p className="text-gray-700">
                      {customers.find(c => c.id === selectedProject.customerId)?.firstName || 'לא נבחר לקוח'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">תקציב</h3>
                    <p className="text-gray-700">₪{selectedProject.budget.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">תאריך התחלה</h3>
                    <p className="text-gray-700">
                      {new Date(selectedProject.startDate).toLocaleDateString('he-IL')}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">תאריך סיום</h3>
                    <p className="text-gray-700">
                      {selectedProject.endDate 
                        ? new Date(selectedProject.endDate).toLocaleDateString('he-IL')
                        : 'לא נקבע'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setTimeout(() => {
                        setFormData(selectedProject);
                        setIsModalOpen(true);
                      }, 300);
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-red-700 transition duration-300"
                  >
                    <FaEdit className="ml-1" />
                    <span>ערוך</span>
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 "
                  >
                    סגור
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
      )}
        {/* Statistics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
        {/* Total Projects */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">סה"כ פרויקטים</p>
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <FaProjectDiagram className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-500">בביצוע: </span>
              <span className="font-bold text-gray-900">
                {projects.filter(p => p.status === 'in_progress').length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500">הושלמו: </span>
              <span className="font-bold text-gray-900">
                {projects.filter(p => p.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">סה"כ תקציב</p>
              <p className="text-3xl font-bold text-gray-900">
                ₪{projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <FaMoneyBillWave className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-500">ממוצע לפרויקט: </span>
              <span className="font-bold text-gray-900">
                ₪{(projects.reduce((sum, p) => sum + (p.budget || 0), 0) / (projects.length || 1)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Project Duration */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">משך זמן ממוצע</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(projects.reduce((sum, p) => {
                  const start = new Date(p.startDate);
                  const end = p.endDate ? new Date(p.endDate) : new Date();
                  return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / (projects.length || 1))} ימים
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <FaClock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-500">פרויקטים פעילים: </span>
              <span className="font-bold text-gray-900">
                {projects.filter(p => p.status !== 'completed').length}
              </span>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">לקוחות עם פרויקטים</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(projects.map(p => p.customerId)).size}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <FaUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-500">ממוצע פרויקטים ללקוח: </span>
              <span className="font-bold text-gray-900">
                {(projects.length / (new Set(projects.map(p => p.customerId)).size || 1)).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
