import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
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
  FaArrowDown
} from 'react-icons/fa';
import SearchIcon from '@mui/icons-material/Search';
import { customerService } from '../services/firebase/customerService';
import { projectService } from '../services/firebase/projectService';
import { ProjectClass, ProjectStatus } from '../types/project';
import {  CustomerClass } from '../types/customer';

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
import CreateProjectModal from '../components/CreateProjectModal';

// Define the status types
type HebrewStatus = 'לביצוע' | 'בתהליך' | 'הושלם';
type EnglishStatus = 'planning' | 'in_progress' | 'completed';

const STATUS_MAPPING: Record<HebrewStatus, EnglishStatus> = {
  'לביצוע': 'planning',
  'בתהליך': 'in_progress',
  'הושלם': 'completed'
} as const;

const REVERSE_STATUS_MAPPING: Record<EnglishStatus, HebrewStatus> = {
  'planning': 'לביצוע',
  'in_progress': 'בתהליך',
  'completed': 'הושלם'
} as const;

const PROJECT_STATUS_CONFIG = {
  'planning': { 
    color: 'bg-red-900/30 text-red-400', 
    icon: <FaSpinner className="text-red-400" />,
    label: 'לביצוע'
  },
  'in_progress': { 
    color: 'bg-yellow-900/30 text-yellow-400', 
    icon: <FaPause className="text-yellow-400" />,
    label: 'בתהליך'
  },
  'completed': { 
    color: 'bg-emerald-900/30 text-emerald-400', 
    icon: <FaCheck className="text-emerald-400" />,
    label: 'הושלם'
  }
} as const;

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
    startDate: new Date().toISOString().split('T')[0]
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
        const usersCollection = collection(db, 'users');
        const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(usersData);
        });

        // Cleanup subscription
        return () => {
          unsubscribe();
          unsubscribeUsers();
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedProject) {
        await projectService.updateProject(selectedProject.id, projectData);
      } else {
        await projectService.createProject(projectData);
      }
      
      setIsModalOpen(false);
      setFormData(new ProjectClass({
        status: 'לביצוע',
        startDate: new Date().toISOString().split('T')[0]
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

  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
            <FaProjectDiagram className="text-red-500" />
            פרויקטים
          </h1>
        </div>
        <Button
          variant="contained"
          startIcon={<FaPlus />}
          onClick={() => setIsCreateModalOpen(true)}
          sx={{ 
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          פרויקט חדש
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Paper 
            elevation={3} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              borderRadius: 2,
              bgcolor: 'background.default',
              flexDirection: 'row',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              label="חיפוש פרויקטים"
              placeholder="חיפוש"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiInputBase-root': {
                  flexDirection: 'row',
                },
                '& .MuiInputAdornment-root': {
                  marginLeft: 'auto',
                  marginRight: 0,
                }
              }}
            />
          </Paper>
        </div>
        
        <div className="flex items-center gap-2">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setViewMode(newValue);
              }
            }}
            aria-label="view mode"
          >
            <ToggleButton value="kanban" aria-label="kanban view">
              <FaColumns />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <FaThLarge />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <FaList />
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton
            onClick={() => setShowFavorites(prev => !prev)}
            sx={{ 
              color: showFavorites ? 'warning.main' : 'text.secondary',
              '&:hover': {
                color: 'warning.main'
              }
            }}
          >
            <FaStar />
          </IconButton>
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
            {Object.entries(groupedProjects).map(([status, statusProjects]) => (
              <div key={status} className="flex-1 min-w-[300px] mx-2">
                <div className={`p-4 rounded-lg ${
                  status === 'הושלם' 
                    ? 'bg-emerald-900/10 border border-emerald-400/20' 
                    : status === 'בתהליך'
                    ? 'bg-yellow-900/10 border border-yellow-400/20'
                    : 'bg-red-900/10 border border-red-400/20'
                }`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {PROJECT_STATUS_CONFIG[STATUS_MAPPING[status as HebrewStatus]].icon}
                    <span className={`px-2 py-1 rounded-full text-sm ${PROJECT_STATUS_CONFIG[STATUS_MAPPING[status as HebrewStatus]].color}`}>
                      {status}
                    </span>
                  </h3>
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4"
                      >
                        {statusProjects.map((project, index) => (
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
                                    : 'none',
                                  opacity: project.status === 'הושלם' ? 0.8 : 1,
                                }}
                                className={`bg-[#141414] p-4 rounded-lg shadow transition-all cursor-pointer text-gray-300 ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg ring-2 ring-red-500 rotate-1 scale-105' 
                                    : project.status === 'הושלם'
                                    ? 'hover:shadow-lg hover:-translate-y-1 border border-emerald-400/20 bg-emerald-900/10'
                                    : 'hover:shadow-lg hover:-translate-y-1'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-lg text-white">{project.name}</h3>
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
                                <p className="text-gray-400 mb-3">{project.description}</p>
                                <div className="flex justify-between items-center text-sm text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <FaCalendarAlt />
                                    <span>{new Date(project.startDate).toLocaleDateString('he-IL')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FaUsers />
                                    <span>
                                      {customers.find(c => c.id === project.customerId)?.name || 'לא נבחר לקוח'}
                                    </span>
                                  </div>
                                </div>
                                {project.budget > 0 && (
                                  <div className="mt-2 text-sm font-semibold text-gray-400">
                                    ₪{project.budget.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
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
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].color}`}>
                      {PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].icon}
                      <span className="mr-2">{PROJECT_STATUS_CONFIG[STATUS_MAPPING[project.status as HebrewStatus]].label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customers.find(c => c.id === project.customerId)?.name || 'לא נבחר לקוח'}
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
                  <span>{new Date(project.startDate).toLocaleDateString('he-IL')}</span>
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
                    onChange={(e) => setFormData(new ProjectClass({ ...formData, name: e.target.value }))}
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
                    onChange={(e) => setFormData(new ProjectClass({ ...formData, customerId: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.lastName}
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
                  onChange={(e) => setFormData(new ProjectClass({ ...formData, description: e.target.value }))}
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
                    onChange={(e) => setFormData(new ProjectClass({ ...formData, startDate: e.target.value }))}
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
                    onChange={(e) => setFormData(new ProjectClass({ ...formData, endDate: e.target.value }))}
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
                    onChange={(e) => setFormData(new ProjectClass({ ...formData, budget: Number(e.target.value) }))}
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
                  {(['לביצוע', 'בתהליך', 'הושלם'] as const).map((status) => (
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
                        onChange={() => setFormData(new ProjectClass({ ...formData, status }))}
                        className="hidden"
                      />
                      {PROJECT_STATUS_CONFIG[STATUS_MAPPING[status] as keyof typeof PROJECT_STATUS_CONFIG].label}
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
      <ProjectDetails
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        project={selectedProject}
        customers={customers} users={users}      />
        
      {/* Statistics Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
        {/* Total Projects */}
        <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6 border-t-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">סה"כ פרויקטים</p>
              <p className="text-3xl font-bold text-white">{projects.length}</p>
            </div>
            <div className="bg-red-900/20 rounded-full p-3">
              <FaProjectDiagram className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-400">בתהליך: </span>
              <span className="font-bold text-gray-300">
                {projects.filter(p => p.status === 'בתהליך').length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-400">הושלמו: </span>
              <span className="font-bold text-gray-300">
                {projects.filter(p => p.status === 'הושלם').length}
              </span>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">פרויקטים בתהליך</p>
              <p className="text-3xl font-bold text-white">
                {projects.filter(p => p.status === 'בתהליך').length}
              </p>
            </div>
            <div className="bg-yellow-900/20 rounded-full p-3">
              <FaClock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6 border border-emerald-400/20 bg-emerald-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-1">פרויקטים שהושלמו</p>
              <p className="text-2xl font-semibold text-emerald-300">
                {projects.filter(p => p.status === 'הושלם').length}
              </p>
            </div>
            <div className="bg-emerald-900/40 rounded-full p-3">
              <FaCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">סה"כ תקציב</p>
              <p className="text-3xl font-bold text-white">
                ₪{projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-900/20 rounded-full p-3">
              <FaMoneyBillWave className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
