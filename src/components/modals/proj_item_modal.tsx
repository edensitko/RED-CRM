import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  FaUser, FaEnvelope, FaPhone, FaBuilding, FaTag, FaLink, 
  FaFile, FaCog, FaTrash, FaTasks, FaProjectDiagram, FaUsers,
  FaPlus, FaCheck, FaComments
} from 'react-icons/fa';
import { projectService } from '../../services/firebase/projectService';
import { taskService } from '../../services/firebase/taskService';
import { userService } from '../../services/firebase/userService';
import { Task, User ,CustomerClass} from '../../types/schemas';
import { ProjectClass } from '../../types/project';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: CustomerClass) => void;
  onDelete?: (customer: CustomerClass) => void;
  customer?: CustomerClass;
  userId: string;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, onSubmit, onDelete, customer, userId }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'files' | 'tasks' | 'projects' | 'users' | 'actions' | 'comments'>('profile');
  const [formData, setFormData] = useState<Partial<CustomerClass>>(customer || {
    id:'',
    assignedTo: [],
    Balance: 0,
    ComeFrom: '',
    Comments: [],
    companyName:'',
    CreatedBy: '',
    createdAt: '',
    Email: '',
    IsDeleted: false,
    lastName: '',
    Links: [],
    name: '',
    Phone: 0,
    Projects: [],
    Status: "פעיל",
    Tags: [],
    Tasks: [],
  });

  const [customerProjects, setCustomerProjects] = useState<ProjectClass[]>([]);
  const [customerTasks, setCustomerTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectClass[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, [customer]);

  const fetchData = async () => {
    try {
      // Fetch all data
      const [projects, tasks, users] = await Promise.all([
        projectService.getAllProjects(userId),
        taskService.getAllTasks(userId),
        userService.getAllUsers()
      ]);

      setAllProjects(projects);
      setAllTasks(tasks);
      setAllUsers(users);

      // Filter customer-specific data
      if (customer?.Projects) {
        const customerProjs = projects.filter(p => customer.Projects.includes(p.id));
        setCustomerProjects(customerProjs);
      }
      if (customer?.Tasks) {
        const customerTsks = tasks.filter(t => customer.Tasks.includes(t.id));
        setCustomerTasks(customerTsks);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (field: keyof CustomerClass, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const newCustomer = {
      ...formData,
      id: customer?.id || formData.id || crypto.randomUUID(),
      createdAt: formData.createdAt || timestamp,
    } as CustomerClass;
    onSubmit(newCustomer);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && formData) {
      onDelete(formData as CustomerClass);
      onClose();
    }
  };

  const handleAddProject = async (projectId: string) => {
    const updatedProjects = [...(formData.Projects || []), projectId];
    setFormData(prev => ({
      ...prev,
      Projects: updatedProjects
    }));
  };

  const handleRemoveProject = async (projectId: string) => {
    const updatedProjects = formData.Projects?.filter(id => id !== projectId) || [];
    setFormData(prev => ({
      ...prev,
      Projects: updatedProjects
    }));
  };

  const handleAddTask = async (taskId: string) => {
    const updatedTasks = [...(formData.Tasks || []), taskId];
    setFormData(prev => ({
      ...prev,
      Tasks: updatedTasks
    }));
  };

  const handleRemoveTask = async (taskId: string) => {
    const updatedTasks = formData.Tasks?.filter(id => id !== taskId) || [];
    setFormData(prev => ({
      ...prev,
      Tasks: updatedTasks
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">מידע בסיסי</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <FaUser className="w-5 h-5 text-red-500" />
                    </div>
                    <label className="text-sm font-medium text-gray-300">שם פרטי</label>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-[#333333] border-0 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 text-right"
                    placeholder="הכנס שם פרטי"
                  />
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <FaUser className="w-5 h-5 text-red-500" />
                    </div>
                    <label className="text-sm font-medium text-gray-300">שם משפחה</label>
                  </div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full bg-[#333333] border-0 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 text-right"
                    placeholder="הכנס שם משפחה"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <FaEnvelope className="w-5 h-5 text-red-500" />
                    </div>
                    <label className="text-sm font-medium text-gray-300">דוא״ל</label>
                  </div>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => handleChange('Email', e.target.value)}
                    className="w-full bg-[#333333] border-0 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 text-right"
                    placeholder="הכנס דוא״ל"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <FaPhone className="w-5 h-5 text-red-500" />
                    </div>
                    <label className="text-sm font-medium text-gray-300">טלפון</label>
                  </div>
                  <input
                    type="tel"
                    value={formData.Phone || ''}
                    onChange={(e) => handleChange('Phone', parseInt(e.target.value) || 0)}
                    className="w-full bg-[#333333] border-0 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 text-right"
                    placeholder="הכנס מספר טלפון"
                  />
                </div>

                {/* Company Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <FaBuilding className="w-5 h-5 text-red-500" />
                    </div>
                    <label className="text-sm font-medium text-gray-300">שם חברה</label>
                  </div>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full bg-[#333333] border-0 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 text-right"
                    placeholder="הכנס שם חברה"
                  />
                </div>

                {/* Source Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <FaTag className="w-5 h-5 text-red-500" />
                    </div>
                    <label className="text-sm font-medium text-gray-300">מקור</label>
                  </div>
                  <input
                    type="text"
                    value={formData.ComeFrom}
                    onChange={(e) => handleChange('ComeFrom', e.target.value)}
                    className="w-full bg-[#333333] border-0 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 text-right"
                    placeholder="הכנס מקור"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">משימות</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="חיפוש משימות..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-[#333333] text-white border-0 focus:ring-2 focus:ring-red-500 text-right"
                  />
                </div>
              </div>

              {/* Connected Tasks */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-3 text-right">משימות מקושרות</h4>
                <div className="space-y-2">
                  {customerTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between bg-[#333333] p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaTasks className="text-red-500" />
                        <div className="text-right">
                          <h4 className="text-white font-medium">{task.title}</h4>
                          <p className="text-gray-400 text-sm">{task.status}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveTask(task.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Tasks */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3 text-right">משימות זמינות</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allTasks
                    .filter(task => !formData.Tasks?.includes(task.id))
                    .filter(task => 
                      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(task => (
                      <div key={task.id} className="flex items-center justify-between bg-[#333333] p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FaTasks className="text-gray-500" />
                          <div className="text-right">
                            <h4 className="text-white font-medium">{task.title}</h4>
                            <p className="text-gray-400 text-sm">{task.status}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddTask(task.id)}
                          className="text-gray-400 hover:text-green-500"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">פרויקטים</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="חיפוש פרויקטים..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-[#333333] text-white border-0 focus:ring-2 focus:ring-red-500 text-right"
                  />
                </div>
              </div>

              {/* Connected Projects */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-3 text-right">פרויקטים מקושרים</h4>
                <div className="space-y-2">
                  {customerProjects.map(project => (
                    <div key={project.id} className="flex items-center justify-between bg-[#333333] p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaProjectDiagram className="text-red-500" />
                        <div className="text-right">
                          <h4 className="text-white font-medium">{project.name}</h4>
                          <p className="text-gray-400 text-sm">{project.status}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveProject(project.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Projects */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3 text-right">פרויקטים זמינים</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allProjects
                    .filter(project => !formData.Projects?.includes(project.id))
                    .filter(project => 
                      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(project => (
                      <div key={project.id} className="flex items-center justify-between bg-[#333333] p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FaProjectDiagram className="text-gray-500" />
                          <div className="text-right">
                            <h4 className="text-white font-medium">{project.name}</h4>
                            <p className="text-gray-400 text-sm">{project.status}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddProject(project.id)}
                          className="text-gray-400 hover:text-green-500"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">משתמשים</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="חיפוש משתמשים..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-[#333333] text-white border-0 focus:ring-2 focus:ring-red-500 text-right"
                  />
                </div>
              </div>

              {/* Assigned Users */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-3 text-right">משתמשים מקושרים</h4>
                <div className="space-y-2">
                  {allUsers
                    .filter(user => formData.assignedTo?.includes(user.id))
                    .map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-[#333333] p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <FaUser className="text-red-500" />
                          </div>
                          <div className="text-right">
                            <h4 className="text-white font-medium">{user.firstName}</h4>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updatedUsers = formData.assignedTo?.filter(id => id !== user.id) || [];
                            setFormData(prev => ({ ...prev, assignedTo: updatedUsers }));
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Available Users */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3 text-right">משתמשים זמינים</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allUsers
                    .filter(user => !formData.assignedTo?.includes(user.id))
                    .filter(user =>
                      (user.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    )
                    .map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-[#333333] p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                            <FaUser className="text-gray-500" />
                          </div>
                          <div className="text-right">
                            <h4 className="text-white font-medium">{user.firstName}</h4>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updatedUsers = [...(formData.assignedTo || []), user.id];
                            setFormData(prev => ({ ...prev, assignedTo: updatedUsers }));
                          }}
                          className="text-gray-400 hover:text-green-500"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">קבצים וקישורים</h3>
              <div className="space-y-4">
                {/* Links Section */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-2 text-right">קישורים</h4>
                  <div className="space-y-2">
                    {formData.Links?.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        <FaLink className="text-red-500" />
                        <a 
                          href={typeof link === 'string' ? link : link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-white"
                        >
                          {typeof link === 'string' ? link : link.description || link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 text-sm rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    הוסף קישור
                  </button>
                </div>

                {/* Files Section */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-2 text-right">קבצים</h4>
                  <div className="space-y-2">
                    {/* Add file list here */}
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 text-sm rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    העלה קובץ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white text-right">הערות</h3>
              </div>
              <div className="space-y-4">
                {formData.Comments?.map((comment, index) => (
                  <div key={index} className="flex items-start gap-4 bg-[#333333] p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <FaComments className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <textarea
                          value={comment}
                          onChange={(e) => {
                            const newComments = [...(formData.Comments || [])];
                            newComments[index] = e.target.value;
                            setFormData(prev => ({ ...prev, Comments: newComments }));
                          }}
                          className="w-full min-h-[100px] rounded-md bg-[#404040] border-gray-700 text-white focus:ring-red-500 focus:border-red-500 text-right"
                        />
                        <button
                          onClick={() => {
                            const newComments = formData.Comments?.filter((_, i) => i !== index) || [];
                            setFormData(prev => ({ ...prev, Comments: newComments }));
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="text-sm text-gray-400 mt-2 text-right">
                        נוסף על ידי {userId} בתאריך {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newComments = [...(formData.Comments || []), ''];
                    setFormData(prev => ({ ...prev, Comments: newComments }));
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  הוסף הערה
                </button>
              </div>
            </div>
          </div>
        );

      case 'actions':
        return (
          <div className="space-y-6" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">פעולות נוספות</h3>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-4 py-3 text-left rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center gap-2"
                >
                  <FaTrash />
                  מחק לקוח
                </button>
                {/* Add more actions here */}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-[#252525] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex h-[80vh]">
            {/* Sidebar */}
            <div className="w-64 bg-[#2a2a2a] border-r border-gray-700 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                    activeTab === 'profile'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <FaUser className="w-5 h-5" />
                  <span>פרופיל לקוח</span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                    activeTab === 'tasks'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <FaTasks className="w-5 h-5" />
                  <span>משימות</span>
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                    activeTab === 'projects'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <FaProjectDiagram className="w-5 h-5" />
                  <span>פרויקטים</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                    activeTab === 'users'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <FaUsers className="w-5 h-5" />
                  <span>משתמשים</span>
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                    activeTab === 'files'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <FaFile className="w-5 h-5" />
                  <span>קבצים וקישורים</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${
                    activeTab === 'comments' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-[#333333]'
                  }`}
                >
                  <FaComments />
                  <span>הערות</span>
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`w-full px-2 py-1.5 rounded-lg flex items-center ${activeTab === 'actions' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-[#333333] hover:text-white'}`}
                >
                  <FaCog className="w-5 h-5" />
                  <span>פעולות נוספות</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  {renderTabContent()}
                  
                  {/* Footer Actions */}
                  <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                    >
                      בטל
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      {customer ? 'עדכן לקוח' : 'הוסף לקוח'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditCustomerModal;
