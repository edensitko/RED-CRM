import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaInfoCircle, FaCheckCircle, FaComments, FaClock, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { Task } from '../types/schemas';
import { customers } from '../data/mockData';

interface TaskDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TASK_STATUS_CONFIG = {
  'pending': {
    label: 'ממתין',
    color: 'bg-yellow-500',
  },
  'in_progress': {
    label: 'בתהליך',
    color: 'bg-blue-500',
  },
  'completed': {
    label: 'הושלם',
    color: 'bg-green-500',
  },
  'cancelled': {
    label: 'בוטל',
    color: 'bg-red-500',
  },
};

const TaskDetails: React.FC<TaskDetailsProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  if (!task) return null;

  const getStatusConfig = (status: string | undefined) => {
    const configKey = status || 'pending';
    return TASK_STATUS_CONFIG[configKey as keyof typeof TASK_STATUS_CONFIG] || TASK_STATUS_CONFIG.pending;
  };

  const menuItems = [
    { id: 'overview', label: 'סקירה', icon: <FaInfoCircle size={12} /> },
    { id: 'comments', label: 'תגובות', icon: <FaComments size={20} /> },
    { id: 'timeline', label: 'ציר זמן', icon: <FaClock size={20} /> },
  ];

  const handleAddComment = async () => {
    // Implement comment functionality
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#e1e1e1]">פרטי משימה</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#888888] block mb-1">תיאור</label>
                  <p className="text-[#e1e1e1]">{task.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#888888] block mb-1">תאריך יעד</label>
                    <p className="text-[#e1e1e1]">
                      {task.dueDate ? 
                        (typeof task.dueDate === 'string' 
                          ? task.dueDate 
                          : 'toDate' in task.dueDate 
                            ? task.dueDate.toDate().toLocaleDateString('he-IL')
                            : task.dueDate  
                        )
                        : 'לא נקבע'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-[#888888] block mb-1">עדיפות</label>
                    <p className={`inline-flex px-2 py-1 rounded-full text-sm ${
                      task.status === 'בתהליך' ? 'bg-red-500 text-[#e1e1e1]' :
                      task.status === 'לביצוע' ? 'bg-yellow-500 text-[#e1e1e1]' :
                      'bg-green-500 text-[#e1e1e1]'
                    }`}>
                      {task.status === 'לביצוע' ? 'גבוהה' :
                       task.status === 'בתהליך' ? 'בינונית' : 'נמוכה'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'comments':
        return (
          <div className="space-y-4">
            {/* Add Comment Form */}
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="הוסף תגובה..."
                className="w-full bg-[#1a1a1a] text-[#e1e1e1] rounded-lg p-3 min-h-[100px] focus:ring-1 focus:ring-red-500 focus:outline-none placeholder-[#888888]"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-red-600 text-[#e1e1e1] rounded-lg hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-900/20"
                >
                  הוסף תגובה
                </button>
              </div>
            </div>

            {/* Comments List */}
            {comments.map((comment) => (
              <div key={comment.id} className="bg-[#0a0a0a] rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-medium text-[#e1e1e1]">{comment.createdByName}</p>
                      <p className="text-sm text-[#888888]">
                        {new Date(comment.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[#888888]">{comment.content}</p>
              </div>
            ))}
          </div>
        );
      case 'timeline':
        return (
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-[#e1e1e1]">ציר זמן</h3>
            <p className="text-[#888888]">תוכן ציר הזמן יתווסף בקרוב...</p>
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
      className="relative z-50" dir='rtl'
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" dir="ltr" />
      <div className="fixed inset-0 flex items-center justify-center p-4" dir="ltr">
        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1e1e1e] p-6 shadow-xl transition-all">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors"
            >
              <FaTimes className="text-[#e1e1e1] text-sm" />
            </button>
            <Dialog.Title className="text-xl font-bold text-red-500">
              {task ? 'עריכת משימה' : 'משימה חדשה'}
            </Dialog.Title>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-right" dir="rtl">
            <div>
              <label htmlFor="title" className="block text-[#e1e1e1] mb-1">
                כותרת
              </label>
              <input
                type="text"
                id="title"
                value={task?.title}
                readOnly
                className="w-full px-2 py-2 bg-[#2a2a2a] text-[#e1e1e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-[#e1e1e1] mb-1">
                תיאור
              </label>
              <textarea
                id="description"
                value={task?.description}
                readOnly
                className="w-full px-3 py-2 bg-[#2a2a2a] text-[#e1e1e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-[#e1e1e1] mb-1">
                  סטטוס
                </label>
                <p className={`inline-flex px-2 py-1 rounded-full text-sm ${
                  getStatusConfig(task?.status).color
                }`}>
                  {getStatusConfig(task?.status).label}
                </p>
              </div>

              <div>
                
               
                  
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="project" className="block text-[#e1e1e1] mb-1">
                  פרויקט
                </label>
                <p className="text-[#e1e1e1]">{task?.project?.name}</p>
              </div>

              <div>
                <label htmlFor="customer" className="block text-[#e1e1e1] mb-1">
                  לקוח
                </label>
                <p className="text-[#e1e1e1]">
                  {task?.customers?.map(customer => customer.name).join(', ') || 'לא נקבע'}
                  
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-[#e1e1e1] mb-1">
                תאריך יעד
              </label>
              <p className="text-[#e1e1e1]">
                {task?.dueDate ? 
                  (typeof task.dueDate === 'string' 
                    ? task.dueDate 
                    : 'toDate' in task.dueDate 
                      ? task.dueDate.toDate().toLocaleDateString('he-IL')
                      : task.dueDate
                  )
                  : 'לא נקבע'}
              </p>
            </div>

            <div className="flex justify-start gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#3a3a3a] text-[#e1e1e1] rounded-lg hover:bg-[#4a4a4a] transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TaskDetails;
