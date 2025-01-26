import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  FaTimes, FaInfoCircle, FaTasks, FaComments, 
  FaFileAlt, FaClock, FaLink, FaDownload, 
  FaCheckCircle, FaEdit, FaTrash, FaUser,
  FaPlus, FaCalendarAlt, FaMoneyBillWave
} from 'react-icons/fa';
import { SubTask } from '../types/schemas';
import { CustomerClass } from '../types/schemas';
import { Task } from '../types/schemas';
import { PROJECT_STATUS_CONFIG } from '../config/projectConfig';
import { taskService } from '../services/firebase/taskService';
import { collection, getDocs, query, where, orderBy, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectClass } from '../types/project';
import { motion, AnimatePresence } from 'framer-motion';
import TaskModal from '../components/modals/TaskModal';

interface ProjectDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectClass | null;
  customers: CustomerClass[];
  onSubmit?: (project: ProjectClass) => void;
  isNew?: boolean;
  users: any[];
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  isOpen,
  onClose,
  project,
  customers,
  onSubmit,
  isNew = false,
  users = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!project) return;
      setIsLoading(true);
      try {
        // Fetch tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', project.id),
          orderBy('createdAt', 'desc')
        );
        const taskSnapshot = await getDocs(tasksQuery);
        const tasksData = taskSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        setTasks(tasksData);

        // Fetch files
        const filesQuery = query(
          collection(db, 'files'),
          where('projectId', '==', project.id),
          orderBy('createdAt', 'desc')
        );
        const filesSnapshot = await getDocs(filesQuery);
        const filesData = filesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFiles(filesData);

        // Fetch comments
        const commentsQuery = query(
          collection(db, 'comments'),
          where('projectId', '==', project.id),
          orderBy('createdAt', 'desc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);

      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, project]);

  const customer = useMemo(() => {
    if (!project) return null;
    return customers.find(c => c.id === project.customerId);
  }, [project, customers]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newComment.trim()) return;

    try {
      const commentRef = doc(collection(db, 'comments'));
      await setDoc(commentRef, {
        content: newComment,
        projectId: project.id,
        createdAt: new Date(),
        createdBy: project.createdBy
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updates);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    await handleTaskUpdate(taskId, { status: completed ? 'הושלם' : 'לביצוע' });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  if (!project) return null;

  return (
    <div>
      <Dialog
        open={isOpen}
        onClose={onClose}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-[#1e1e1e] rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden relative text-white" dir="rtl">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                  <p className="text-gray-400">טוען פרטי פרויקט...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-[#333333]">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{project?.name}</h2>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      project?.status === 'לביצוע' ? 'bg-red-900/30 text-red-400' :
                      project?.status === 'בתהליך' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-emerald-900/30 text-emerald-400'
                    }`}>
                      {project?.status}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex border-b border-[#333333]">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'overview'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaInfoCircle />
                      סקירה כללית
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'tasks'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaTasks />
                      משימות
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'comments'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaComments />
                      תגובות
                    </div>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto" style={{ height: 'calc(80vh - 140px)' }}>
                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
                          <h3 className="text-lg font-medium mb-4">פרטי פרויקט</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-gray-400">לקוח</label>
                              <p className="text-white">{customers.find(c => c.id === project?.customerId)?.name || 'לא נבחר'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">תקציב</label>
                              <p className="text-white">{project?.budget ? `₪${project.budget.toLocaleString()}` : 'לא הוגדר'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">תאריך התחלה</label>
                              <p className="text-white">{project?.startDate ? (project.startDate.toDate?.() || new Date(project.startDate as any)).toLocaleDateString() : 'לא הוגדר'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">תאריך סיום</label>
                              <p className="text-white">{project?.endDate ? (project.endDate.toDate?.() || new Date(project.endDate as any)).toLocaleDateString() : 'לא הוגדר'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
                          <h3 className="text-lg font-medium mb-4">תיאור</h3>
                          <p className="text-gray-300 whitespace-pre-wrap">{project?.description || 'אין תיאור'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">משימות</h3>
                        <button
                          onClick={() => {
                            setSelectedTask(null);
                            setIsTaskModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaPlus className="w-4 h-4" />
                          <span>הוסף משימה</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {tasks.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <FaTasks className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>אין משימות עדיין</p>
                          </div>
                        ) : (
                          tasks.map(task => (
                            <div
                              key={task.id}
                              className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333] hover:border-[#444444] transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <input
                                    type="checkbox"
                                    checked={task.status === 'הושלם'}
                                    onChange={() => handleTaskCompletion(task.id, task.status !== 'הושלם')}
                                    className="w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500 focus:ring-offset-[#0a0a0a] bg-[#1e1e1e]"
                                  />
                                  <span className={task.status === 'הושלם' ? 'line-through text-gray-400' : ''}>{task.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditTask(task)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                  >
                                    <FaEdit className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {comments.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <FaComments className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>אין תגובות עדיין</p>
                          </div>
                        ) : (
                          comments.map(comment => (
                            <div
                              key={comment.id}
                              className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaUser className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{comment.userName}</span>
                                    <span className="text-sm text-gray-400">
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-300">{comment.content}</p>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-6">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="הוסף תגובה..."
                          className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!newComment.trim()}
                          >
                            שלח תגובה
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={selectedTask}
          users={users}
          projects={[]}
          customers={customers}
          onTaskUpdate={handleTaskUpdate} onCreateTask={function (task: Task): Promise<void> {
            throw new Error('Function not implemented.');
          } } onUpdateTask={function (taskId: string, updates: Partial<Task>): Promise<void> {
            throw new Error('Function not implemented.');
          } } onDeleteTask={function (taskId: string): Promise<void> {
            throw new Error('Function not implemented.');
          } } subTasks={[]} comments={[]}        />
      )}
    </div>
  );
};

export default ProjectDetails;