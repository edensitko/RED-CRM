import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
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
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaHourglassHalf,
  FaPlayCircle,
  FaCheckCircle,
  FaFilter,
  FaChevronDown
} from 'react-icons/fa';
import SearchIcon from '@mui/icons-material/Search';
import { customerService } from '../services/firebase/customerService';
import { projectService } from '../services/firebase/projectService';
import { ProjectClass, ProjectStatus } from '../types/project';
import { CustomerClass } from '../types/schemas';

import { useAuth } from '../hooks/useAuth';
import { Dialog } from '@headlessui/react';
import ProjectDetails from './ProjectDetails';
import { 
  Paper, 
  TextField, 
  InputAdornment, 
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
 

} from '@mui/material';
import CreateProjectModal from '../components/modals/CreateProjectModal';

// Define the status types
type HebrewStatus = 'לביצוע' | 'בתהליך' | 'הושלם';
type EnglishStatus = 'todo' | 'in_progress' | 'completed';

const STATUS_MAPPING: Record<HebrewStatus, EnglishStatus> = {
  'לביצוע': 'todo',
  'בתהליך': 'in_progress',
  'הושלם': 'completed'
} as const;

const REVERSE_STATUS_MAPPING: Record<EnglishStatus, HebrewStatus> = {
  'todo': 'לביצוע',
  'in_progress': 'בתהליך',
  'completed': 'הושלם'
} as const;

const STATUS_COLORS = {
  'לביצוע': 'gray',
  'בתהליך': 'blue',
  'הושלם': 'green'
};

const PROJECT_STATUS_CONFIG = {
  'todo': { 
    color: 'bg-gray-900/30 text-gray-400', 
    icon: <FaSpinner className="text-gray-400" />,
    label: 'לביצוע'
  },
  'in_progress': { 
    color: 'bg-blue-900/30 text-blue-400', 
    icon: <FaPause className="text-blue-400" />,
    label: 'בתהליך'
  },
  'completed': { 
    color: 'bg-green-900/30 text-green-400', 
    icon: <FaCheck className="text-green-400" />,
    label: 'הושלם'
  }
} as const;

const toTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  return Timestamp.fromDate(date);
};

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectClass[]>([]);
  const [customers, setCustomers] = useState<CustomerClass[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectClass | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(new ProjectClass({
    status: 'לביצוע',
    startDate: Timestamp.fromDate(new Date())
  }));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'startDate' | 'endDate' | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredProjects = projects
    .filter(project => {
      if (showFavorites) return project.isFavorite;
      
      const customer = customers.find(c => c.id === project.customerId);
      const searchLower = searchQuery.toLowerCase();
      
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        (customer && 
          (`${customer.name} ${customer.lastName}`.toLowerCase().includes(searchLower) ||
           customer.companyName.toLowerCase().includes(searchLower)))
      );
    });

  const handleSort = (field: 'startDate' | 'endDate') => {
    const newOrder = field === sortField && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    
    const sortedProjects = [...projects].sort((a, b) => {
      // Safely handle potentially missing or invalid dates
      const getDateValue = (project: ProjectClass, field: 'startDate' | 'endDate') => {
        const dateValue = project[field];
        if (!dateValue) return 0; // Handle missing dates
        
        try {
          return new Date(dateValue.toDate()).getTime();
        } catch (error) {
          console.error(`Invalid date for project ${project.id}:`, error);
          return 0;
        }
      };

      const dateA = getDateValue(a, field);
      const dateB = getDateValue(b, field);
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
  }, {} as Record<ProjectClass['status'], ProjectClass[]>);

  // Define status columns
  const statusColumns: ProjectClass['status'][] = ['לביצוע', 'בתהליך', 'הושלם'];

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination || !draggableId) {
      return;
    }

    // Don't do anything if dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    try {
      // Find the project that was dragged
      const project = projects.find(p => p.id === draggableId);
      if (!project) {
        console.error('Project not found:', draggableId);
        return;
      }

      // Update the project status
      const newStatus = destination.droppableId as ProjectStatus;
      await projectService.updateProject(draggableId, { status: newStatus });

      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(p => {
          if (p.id === draggableId) {
            p.status = newStatus;
            return p;
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };

  const toggleFavorite = async (projectId: string, isFavorite: boolean) => {
    try {
      await projectService.toggleProjectFavorite(projectId, isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!user) {
          throw new Error('No authenticated user found');
        }
        
        // Subscribe to projects
        const unsubscribe = projectService.subscribeToProjects(user.uid, (projectsData) => {
          console.log('Received projects:', projectsData.map(p => ({ id: p.id, name: p.name })));
          // Ensure all projects have valid IDs
          const validProjects = projectsData.filter(project => {
            if (!project.id) {
              console.error('Found project without ID:', project);
              return false;
            }
            return true;
          });
          setProjects(validProjects);
          setLoading(false);
        });

        // Subscribe to customers
        const customersRef = collection(db, 'Customers');
        const q = query(
          customersRef,
          where('createdBy', '==', user.uid),
          orderBy('name')
        );
        const unsubscribeCustomers = onSnapshot(q, (snapshot) => {
          console.log('Customers snapshot size:', snapshot.size);
          const customersData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Raw customer data:', data);
            return {
              id: doc.id,
              ...data
            };
          }) as CustomerClass[];
          console.log('Processed customers:', customersData);
          setCustomers(customersData);
        });

        // Fetch users
        const fetchUsers = async () => {
          try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersData = usersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setUsers(usersData);
          } catch (error) {
            console.error('Error fetching users:', error);
          }
        };

        fetchUsers();

        // Cleanup subscription
        return () => {
          unsubscribe();
          unsubscribeCustomers();
        };
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('No authenticated user found');
      return;
    }

    try {
      const projectData = {
        ...formData,
        userId: user.uid,
        createdBy: user.uid,
        updatedBy: user.uid,
        startDate: Timestamp.fromDate(formData.startDate.toDate()),
        endDate: formData.endDate ? Timestamp.fromDate(formData.endDate.toDate()) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (selectedProject) {
        await projectService.updateProject(selectedProject.id, projectData);
      } else {
        await projectService.createProject(projectData);
      }
      
      setIsModalOpen(false);
      setFormData(new ProjectClass({
        status: 'לביצוע',
        startDate: Timestamp.fromDate(new Date())
      }));
      setSelectedProject(null);
    } catch (error) {
      console.error('Error managing project:', error);
      setError('Failed to manage project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(id);
      } catch (error) {
        console.error('Error deleting project:', error);
        setError('Failed to delete project');
      }
    }
  };

  const updateProjectStatus = async (id: string, newStatus: ProjectClass['status']) => {
    const projectRef = doc(db, `projects/${id}`);
    try {
      await updateDoc(projectRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'לביצוע':
        return <FaHourglassHalf className="text-gray-400" />;
      case 'בתהליך':
        return <FaPlayCircle className="text-blue-400" />;
      case 'הושלם':
        return <FaCheckCircle className="text-green-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'לביצוע':
        return 'bg-gray-500/10 border-gray-500/20';
      case 'בתהליך':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'הושלם':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return '';
    }
  };

  // Helper function to safely format dates
  const formatDate = (date: Date | Timestamp | null) => {
    if (!date) return '';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const renderKanbanView = () => (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-3 gap-6">
        {['לביצוע', 'בתהליך', 'הושלם'].map((status) => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 ${
                  snapshot.isDraggingOver ? 'bg-[#2a2a2a]' : ''
                }`}
              >
                <div className={`flex items-center gap-2 mb-4 p-2 rounded-lg border ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <h3 className="text-lg font-semibold text-[#e1e1e1]">
                    {status}
                  </h3>
                  <span className="mr-auto bg-[#2a2a2a] px-2 py-0.5 rounded-full text-sm text-gray-400">
                    {groupedProjects[status as ProjectStatus]?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupedProjects[status as ProjectStatus]?.map((project, index) => (
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
                          className={`bg-[#2a2a2a] border border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-red-500' : ''
                          }`}
                        >
                          <h4 className="font-medium text-[#e1e1e1] mb-2">{project.name}</h4>
                          {project.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="w-4 h-4" />
                              <span>{formatDate(project.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaUsers className="w-4 h-4" />
                              <span>{customers.find(c => c.id === project.customerId)?.name || 'לא נבחר לקוח'}</span>
                            </div>
                          </div>
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
  );

  return (
    <div className="p-6 min-h-screen text-[#e1e1e1]" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e1e1e1]">פרויקטים</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Project
          </Button>
          <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-[#ec5252] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#1a1a1a]'
              }`}
            >
              <FaColumns className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-[#ec5252] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#1a1a1a]'
              }`}
            >
              <FaThLarge className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-[#ec5252] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#1a1a1a]'
              }`}
            >
              <FaList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white">סטטיסטיקת פרויקטים</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects */}
          <div className="bg-blue-900/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-400"><FaProjectDiagram /></span>
              <span className="text-2xl font-bold text-blue-400">{projects.length}</span>
            </div>
            <p className="text-sm text-blue-400 mt-1">סה"כ פרויקטים</p>
          </div>

          {/* In Progress */}
          <div className="bg-yellow-900/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400"><FaClock /></span>
              <span className="text-2xl font-bold text-yellow-400">
                {projects.filter(p => p.status === 'בתהליך').length}
              </span>
            </div>
            <p className="text-sm text-yellow-400 mt-1">בתהליך</p>
          </div>

          {/* Completed */}
          <div className="bg-green-900/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-400"><FaCheck /></span>
              <span className="text-2xl font-bold text-green-400">
                {projects.filter(p => p.status === 'הושלם').length}
              </span>
            </div>
            <p className="text-sm text-green-400 mt-1">הושלמו</p>
          </div>

          {/* Total Budget */}
          <div className="bg-purple-900/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-purple-400"><FaMoneyBillWave /></span>
              <span className="text-2xl font-bold text-purple-400">
                ₪{projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-purple-400 mt-1">סה"כ תקציב</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="חיפוש פרויקטים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2a2a2a] text-[#e1e1e1] rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-gray-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
            <button
              onClick={() => setShowFavorites(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-[#e1e1e1] rounded-lg hover:bg-[#333333] transition-colors border border-gray-700"
            >
              <FaFilter className="w-4 h-4" />
              <span>סינון מתקדם</span>
              <FaChevronDown className={`w-4 h-4 transition-transform ${showFavorites ? 'transform rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFavorites && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">סטטוס</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(new ProjectClass({ ...formData, status: e.target.value as ProjectStatus }))}
                  className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">הכל</option>
                  <option value="לביצוע">לביצוע</option>
                  <option value="בתהליך">בתהליך</option>
                  <option value="הושלם">הושלם</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">תאריך התחלה</label>
                <input
                  type="date"
                  value={formData.startDate.toDate().toISOString().split('T')[0]}
                  onChange={(e) => setFormData(new ProjectClass({ ...formData, startDate: Timestamp.fromDate(new Date(e.target.value)) }))}
                  className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">תאריך סיום</label>
                <input
                  type="date"
                  value={formData.endDate ? formData.endDate.toDate().toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(new ProjectClass({ ...formData, endDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))}
                  className="w-full bg-[#2a2a2a] text-[#e1e1e1] border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFormData(new ProjectClass({
                      status: 'לביצוע',
                      startDate: Timestamp.fromDate(new Date())
                    }));
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-2 bg-[#2a2a2a] text-[#e1e1e1] rounded-lg hover:bg-[#333333] transition-colors border border-gray-700"
                >
                  נקה סינון
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : viewMode === 'kanban' ? (
        renderKanbanView()
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
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].color}`}>
                      {PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].icon}
                      <span className="mr-2">{PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customers.find(c => c.id === project.customerId)?.name || 'לא נבחר לקוח'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(project.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.endDate 
                      ? formatDate(project.endDate)
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
              transition={{ duration: 0.3 }}
              className="bg-[#141414] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-gray-300"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-xl text-white">{project.name}</h3>
                <div className="flex gap-2">
                  <div className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].color}`}>
                    {PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].icon}
                    <span>{project.status}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setFormData(project);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(project.id, project.isFavorite ?? false);
                    }}
                    className={`text-gray-400 hover:text-yellow-500 ${project.isFavorite ? 'text-yellow-500' : ''}`}
                  >
                    <FaStar />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 mb-4">{project.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <FaCalendarAlt />
                  <span>{formatDate(project.startDate)}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].color}`}>
                  {PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].label}
                </div>
              </div>
              {project.budget > 0 && (
                <div className="mt-3 text-sm font-semibold text-gray-400">
                  ₪{project.budget.toLocaleString()}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      <ProjectDetails
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        project={selectedProject} customers={[]} users={[]}      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(project) => {
          setProjects([...projects, project]);
          setIsCreateModalOpen(false);
        }}
        users={users}
        userId={user?.uid || ''}
      />
    </div>
  );
};

export default Projects;
