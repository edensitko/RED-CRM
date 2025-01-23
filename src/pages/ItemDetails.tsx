import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaInfoCircle, FaTasks, FaComments, FaFileAlt, FaClock, FaLink, FaDownload, FaCheckCircle, FaEdit, FaTrash } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';
import { Project } from '../types/schemas';
import { CustomerClass } from '../types/customer';
import { Task } from '../types/schemas';
import { PROJECT_STATUS_CONFIG } from '../config/projectConfig';
import { taskService } from '../services/firebase/taskService';
import { collection, getDocs, query, where, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import crypto from 'crypto';
import { Timestamp } from 'firebase/firestore';

interface CustomerDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  customers: CustomerClass[];
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  isOpen,
  onClose,
  project,
  customers,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed' | 'customer'>('all');
  const [taskSort, setTaskSort] = useState<'dueDate' | 'priority' | 'createdAt'>('createdAt');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];
    
    // Apply filter
    if (taskFilter === 'customer') {
      filtered = filtered.filter(task => project?.customerId ? task.assignedTo?.includes(project.customerId) : false);
    } else if (taskFilter !== 'all') {
      filtered = filtered.filter(task => 
        taskFilter === 'completed' 
          ? task.status === 'completed'
          : !['completed'].includes(task.status)
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (taskSort) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const aTime = a.dueDate instanceof Timestamp ? 
            a.dueDate.toDate().getTime() : a.dueDate.getTime();
          const bTime = b.dueDate instanceof Timestamp ? 
            b.dueDate.toDate().getTime() : b.dueDate.getTime();
          return aTime - bTime;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - 
                 priorityOrder[b.priority as keyof typeof priorityOrder];
        default: // createdAt
          return b.createdAt instanceof Timestamp ? 
            b.createdAt.toDate().getTime() - (a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : a.createdAt.getTime()) :
            b.createdAt.getTime() - (a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : a.createdAt.getTime());
      }
    });
    
    return filtered;
  }, [tasks, taskFilter, taskSort]);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!project) return;
      
      setIsLoading(true);
      try {
        // Fetch tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            assignedTo: data.assignedTo || '',
            projectId: data.projectId,
            category: data.category || 'other',
            createdAt: data.createdAt,
            createdBy: data.createdBy || '',
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy || '',
            completedAt: data.completedAt,
            dueDate: data.dueDate,
            customerId: project?.customerId || '' // Add the customerId from the project
          };
        });
        setTasks(tasksData);

        // Fetch files
        const filesQuery = query(
          collection(db, 'files'),
          where('projectId', '==', project.id)
        );
        const filesSnapshot = await getDocs(filesQuery);
        const filesData = filesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setFiles(filesData);

        // Fetch forms
        const formsQuery = query(
          collection(db, 'forms'),
          where('projectId', '==', project.id)
        );
        const formsSnapshot = await getDocs(formsQuery);
        const formsData = formsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setForms(formsData);

        // Fetch comments
        const commentsQuery = query(
          collection(db, 'comments'),
          where('projectId', '==', project.id),
          orderBy('createdAt', 'desc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt
        }));
        setComments(commentsData);

      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [project]);
  
  if (!project) return null;

  // Helper function to safely convert FirebaseDate to Date
  const toJSDate = (firebaseDate: any): Date => {
    if (firebaseDate instanceof Timestamp) {
      return firebaseDate.toDate();
    }
    return firebaseDate;
  };

  // Map task status to config keys
  const STATUS_TO_CONFIG_MAP: Record<string, keyof typeof PROJECT_STATUS_CONFIG> = {
    'pending': 'NOT_STARTED',
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
    'planning': 'NOT_STARTED'  // Add default mapping for 'planning' status
  };

  const getStatusConfig = (status: string | undefined) => {
    const configKey = status ? STATUS_TO_CONFIG_MAP[status] || 'NOT_STARTED' : 'NOT_STARTED';
    return PROJECT_STATUS_CONFIG[configKey];
  };

  const menuItems = [
    { id: 'overview', label: 'סקירה', icon: <FaInfoCircle size={12}  /> },
    { id: 'tasks', label: 'משימות', icon: <FaTasks size={20} /> },
    { id: 'files', label: 'קבצים', icon: <FaFileAlt size={20} /> },
    { id: 'comments', label: 'תגובות', icon: <FaComments size={20} /> },
  ];

  const handleAddComment = async () => {
    if (!newComment.trim() || !project) return;

    try {
      const commentRef = doc(collection(db, 'comments'));
      const newCommentData = {
        id: commentRef.id,
        projectId: project.id,
        content: newComment,
        createdAt: new Date(),
        createdBy: 'current-user-id', // Replace with actual user ID
        createdByName: 'Current User', // Replace with actual user name
        isEdited: false
      };

      await setDoc(commentRef, newCommentData);
      setComments(prev => [{ ...newCommentData, createdAt: new Date() }, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
      await taskService.updateTask(taskId, {
        status: newStatus,
        dueDate: newStatus === 'completed' ? new Date() : undefined,
      });
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: newStatus, 
                completedAt: newStatus === 'completed' ? new Date() : null 
              } 
            : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !project) return;

    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: newTaskTitle.trim(),
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user-id', // Replace with actual user ID
        dueDate: undefined,
        description: '',
        isDeleted: false,
        updatedBy: '',
        projectId: '',
        assignedTo: [],
      };

      await taskService.createTask(newTask);
      setTasks(prevTasks => [newTask, ...prevTasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Project Overview */}
              <div className="bg-[#252525] rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">סקירה כללית</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">פרטי לקוח</h4>
                    <div className="bg-[#2a2a2a] p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <FaUser className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">{customers.find(c => c.id === project.customerId)?.name}</p>
                          <p className="text-sm text-gray-400">{customers.find(c => c.id === project.customerId)?.Email}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#333333]">
                        <p className="text-sm text-gray-400">טלפון</p>
                        <p className="font-medium">{customers.find(c => c.id === project.customerId)?.Phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">פרטי לקוח</h4>
                    <div className="bg-[#2a2a2a] p-4 rounded-lg space-y-4">
                      <div>
                        <p className="text-sm text-gray-400">תאריך התחלה</p>
                        <p className="font-medium">{new Date(project.startDate).toLocaleDateString('he-IL')}</p>
                      </div>
                      {project.endDate && (
                        <div>
                          <p className="text-sm text-gray-400">תאריך סיום</p>
                          <p className="font-medium">{new Date(project.endDate).toLocaleDateString('he-IL')}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-400">תקציב</p>
                        <p className="font-medium text-xl">₪{project.budget?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Overview */}
              <div className="bg-[#252525] rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">משימות</h3>
                  <button className="text-sm text-red-500 hover:text-red-400 font-medium">
                    צפה בכל המשימות
                  </button>
                </div>
                <div className="space-y-3">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#303030] transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium mb-1 truncate">{task.title}</h4>
                          <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                        </div>
                        <div className={`shrink-0 px-3 py-1 rounded-full text-sm ${PROJECT_STATUS_CONFIG[STATUS_TO_CONFIG_MAP[task.status] || 'NOT_STARTED'].color}`}>
                          {PROJECT_STATUS_CONFIG[STATUS_TO_CONFIG_MAP[task.status] || 'NOT_STARTED'].label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-6 bg-[#252525] rounded-lg p-6">
              {/* Quick Stats */}
              <div className="bg-[#e1e1e1e] rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">סטטיסטיקות</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">משימות פתוחות</p>
                      <div className="bg-red-500/10 p-2 rounded-full">
                        <FaTasks className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold mt-2">
                      {tasks.filter(t => t.status !== 'completed').length}
                    </p>
                  </div>
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">ימים שנותרו</p>
                      <div className="bg-yellow-500/10 p-2 rounded-full">
                        <FaClock className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold mt-2">
                      {project.endDate ? Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : '-'}
                    </p>
                  </div>
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">התקדמות</p>
                      <div className="bg-green-500/10 p-2 rounded-full">
                        <FaCheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold mt-2">
                      {Math.round((tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[#252525] rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">פעילות אחרונה</h3>
                <div className="space-y-4">
                  {comments.slice(0, 5).map(comment => (
                    <div key={comment.id} className="flex items-center gap-3">
                      <div className="bg-[#2a2a2a] p-2 rounded-full shrink-0">
                        <FaCheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{comment.content}</p>
                        <p className="text-sm text-gray-400">{new Date(comment.createdAt.toDate()).toLocaleString('he-IL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold">משימות</h3>
                <div className="flex space-x-2">
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value as 'all' | 'active' | 'completed' | 'customer')}
                    className="rounded-lg border border-[#333333] bg-[#0a0a0a] px-3 py-1 text-white"
                  >
                    <option value="all">הכל</option>
                    <option value="customer">משימות לקוח</option>
                    <option value="active">פעיל</option>
                    <option value="completed">הושלם</option>
                  </select>
                  <select
                    value={taskSort}
                    onChange={(e) => setTaskSort(e.target.value as 'dueDate' | 'priority' | 'createdAt')}
                    className="rounded-lg border border-[#333333] bg-[#0a0a0a] px-3 py-1 text-white"
                  >
                    <option value="createdAt">תאריך יצירה</option>
                    <option value="dueDate">תאריך יעד</option>
                    <option value="priority">עדיפות</option>
                  </select>
                </div>
              </div>
              <form onSubmit={handleCreateTask} className="flex space-x-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="משימה חדשה..."
                  className="rounded-lg border border-[#333333] bg-[#0a0a0a] px-4 py-2 w-64 text-white placeholder-neutral-500"
                />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  הוספה
                </button>
              </form>
            </div>
            <div className="space-y-4">
              {filteredAndSortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#0a0a0a] rounded-lg p-4 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTaskStatus(task.id, task.status)}
                        className="mt-1"
                      />
                      <div>
                        <h4 className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="mt-2 space-y-2 text-sm text-gray-400">
                          {task.description && (
                            <p>{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <FaClock className="mr-1" />
                              נוצר: {toJSDate(task.createdAt).toLocaleDateString('he-IL')}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center">
                                <FaClock className="mr-1" />
                                יעד: {toJSDate(task.dueDate).toLocaleDateString('he-IL')}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority === 'high' ? 'גבוה' :
                               task.priority === 'medium' ? 'בינוני' : 'נמוך'}
                            </span>
                            {task.assignedTo?.includes(project?.customerId) && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                משויך ללקוח
                              </span>
                            )}
                          </div>
                         
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">קבצים</h3>
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                העלאת קובץ
              </button>
            </div>
            <div className="space-y-3">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="text-gray-400" />
                    <span>{file.name}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-200">
                    <FaDownload />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'forms':
        return (
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">טפסים</h3>
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                טופס חדש
              </button>
            </div>
            <div className="space-y-3">
              {forms.map(form => (
                <div key={form.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="text-gray-400" />
                    <span>{form.name}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-200">
                    <FaDownload />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'links':
        return (
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">קישורים</h3>
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                הוספת קישור
              </button>
            </div>
            <div className="space-y-3">
              {project.links?.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaLink className="text-gray-400" />
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600">
                      {link}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'comments':
        return (
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">תגובות</h3>
            
            {/* Add Comment Form */}
            <div className="mb-6">
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="הוסף תגובה..."
                  className="flex-1 p-2 border border-[#333333] bg-[#0a0a0a] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-neutral-500"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                >
                  שלח
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-[#0a0a0a] rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-left">
                        <p className="font-medium">{comment.createdByName}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(comment.createdAt.toDate()).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <img
                        src="/default-avatar.png"
                        alt={comment.createdByName}
                        className="w-8 h-8 rounded-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.isEdited && (
                        <span className="text-sm text-gray-400">(נערך)</span>
                      )}
                      <button className="text-gray-400 hover:text-gray-200">
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 whitespace-pre-wrap text-right">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">ציר זמן</h3>
            <p className="text-gray-400">תוכן ציר הזמן יתווסף בקרוב...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-[#1e1e1e] rounded-lg w-[90vw] max-w-7xl h-[85vh] overflow-hidden relative text-white" dir="rtl">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-[#141414] border-l border-[#2a2a2a] p-4 flex flex-col justify-between">
              {/* Project Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{project?.name}</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  getStatusConfig(project?.status).color
                }`}>
                  {getStatusConfig(project?.status).label}
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">תיאור</label>
                  <p className="text-gray-200">{project?.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">תקציב</label>
                    <p className="text-xl font-semibold">₪{project?.budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">תאריך התחלה</label>
                    <p className="text-gray-200">{new Date(project?.startDate || '').toLocaleDateString('he-IL')}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-5 px-2 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gray-600 text-white font-medium shadow-lg shadow-red-900/20'
                        : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white bg-black'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className=" bg-[#141414] pt-4 border-t border-[#2a2a2a] space-y-2">
                <button
                  onClick={() => {/* Add edit handler */}}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-900/20"
                >
                  <FaEdit />
                  <span>ערוך פרויקט</span>
                </button>
                <button
                  onClick={() => {/* Add delete handler */}}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all duration-200 bg-black"
                >
                  <FaTrash />
                  <span>מחק פרויקט</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#1e1e1e]">
              <div className="p-6">
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 text-neutral-400 hover:text-white transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
                <div className="max-w-4xl mx-auto">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
      
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button 
          className="flex items-center justify-center w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 shadow-red-900/20"
          onClick={() => {/* Add chat handler */}}
        >
          <FaComments size={24} />
        </button>
      </div>
    </Dialog>
  );
};

export default CustomerDetails;