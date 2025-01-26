import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { doc, updateDoc, Timestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaCheck, FaChevronDown, FaTimes, FaPlus, FaTasks, FaUser, FaCalendarAlt, FaTag, FaProjectDiagram, FaUsers, FaClipboardList, FaComments, FaTrash, FaArrowDown, FaEquals, FaArrowUp } from 'react-icons/fa';
import { Task, SubTask, Project } from '../../types/schemas';
import { CustomerClass } from '../../types/schemas';
import { useAuth } from '../../contexts/AuthContext';

interface TaskUser {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: TaskUser[];
  projects: Project[];
  customers: CustomerClass[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onCreateTask: (task: Task) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  subTasks: SubTask[];
  comments: Array<{ id: string; text: string; createdAt: Timestamp }>;
}

const statusOptions = [
  { value: 'לביצוע', label: 'לביצוע', color: 'bg-red-500/20 text-red-500' },
  { value: 'בתהליך', label: 'בתהליך', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'הושלם', label: 'הושלם', color: 'bg-green-500/20 text-green-500' }
];

const urgencyOptions = [
  { value: 'נמוכה', label: 'נמוכה', icon: <FaArrowDown className="w-4 h-4 text-gray-400" /> },
  { value: 'בינונית', label: 'בינונית', icon: <FaEquals className="w-4 h-4 text-yellow-400" /> },
  { value: 'גבוהה', label: 'גבוהה', icon: <FaArrowUp className="w-4 h-4 text-red-400" /> }
];

const tabs: { id: 'details' | 'assignee' | 'project' | 'customer' | 'subtasks' | 'comments'; label: string; icon: JSX.Element }[] = [
  { id: 'details', label: 'פרטי משימה', icon: <FaTasks /> },
  { id: 'assignee', label: 'משתמש מוקצה', icon: <FaUser /> },
  { id: 'project', label: 'פרויקט', icon: <FaProjectDiagram /> },
  { id: 'customer', label: 'לקוח', icon: <FaUsers /> },
  { id: 'subtasks', label: 'משימות משנה', icon: <FaClipboardList /> },
  { id: 'comments', label: 'הערות', icon: <FaComments /> },
];

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  users,
  projects,
  customers,
  onTaskUpdate,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.uid;
  const currentUserData = users?.find(u => u.id === currentUserId) || {
    id: currentUserId || '',
    email: currentUser?.email || '',
    name: currentUser?.displayName || currentUser?.email || '',
    displayName: currentUser?.displayName || currentUser?.email || ''
  };
  const [isLoading, setIsLoading] = useState(false);

  const getInputDateValue = (date: Timestamp | null | undefined): string => {
    if (!date) return '';
    try {
      if (date instanceof Timestamp) {
        return date.toDate().toISOString().split('T')[0];
      }
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const [taskState, setTaskState] = useState<Task>({
    id: task?.id || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'לביצוע',
    urgent: task?.urgent || 'נמוכה',
    assignedTo: task?.assignedTo || [currentUser?.uid || ''],
    dueDate: task?.dueDate || null,
    customers: task?.customers || [],
    project: task?.project || null,
    subTasks: task?.subTasks || [],
    completedAt: task?.completedAt || null,
    isDeleted: task?.isDeleted || false,
    tasks: task?.tasks || [],
    files: task?.files || [],
    links: task?.links || [],
    isFavorite: task?.isFavorite || false,
    comments: task?.comments || []
  });

  const [newSubTask, setNewSubTask] = useState<Partial<SubTask>>({
    title: '',
    description: '',
    completed: false,
    status: 'בתהליך',
    urgent: 'גבוהה',
    dueDate: '',
  });

  const [activeTab, setActiveTab] = useState<'details' | 'assignee' | 'project' | 'customer' | 'subtasks' | 'comments'>('details');
  const [showNewSubTaskForm, setShowNewSubTaskForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (task) {
      setTaskState({
        ...task,
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
        customers: task.customers || [],
        subTasks: task.subTasks || [],
        comments: task.comments || [],
        tasks: task.tasks || [],
        files: task.files || [],
        links: task.links || []
      });
    }
  }, [task]);

  const mapUrgencyToInternal = (urgent: string) => {
    const mapping: { [key: string]: string } = {
      'נמוכה': 'low',
      'בינונית': 'normal',
      'גבוהה': 'high'
    };
    return mapping[urgent] || urgent;
  };

  const mapUrgencyToHebrew = (urgent: string) => {
    const mapping: { [key: string]: string } = {
      'low': 'נמוכה',
      'normal': 'בינונית',
      'high': 'גבוהה'
    };
    return mapping[urgent] || urgent;
  };

  const formatDate = (date: Timestamp | Date | string | null, format: 'date' | 'datetime' = 'date') => {
    if (!date) return '';
    
    let dateObj: Date;
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    if (format === 'datetime') {
      return dateObj.toLocaleString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return dateObj.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!taskState?.title?.trim()) {
      errors['title'] = 'שם משימה הוא שדה חובה';
      return false;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const taskData = {
        ...taskState,
        createdAt: taskState.createdAt || Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.now(),
        urgent: mapUrgencyToInternal(taskState.urgent || 'נמוכה'),
        comments: taskState.comments || [],
        subTasks: taskState.subTasks || []
      };

      if (task) {
        await onUpdateTask(task.id, taskData);
        toast.success('Task updated successfully!');
      } else {
        await onCreateTask(taskData);
        toast.success('Task created successfully!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    try {
      await onDeleteTask(task.id);
      toast.success('Task deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task.');
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setTaskState(prev => {
      if (field === 'dueDate') {
        return {
          ...prev,
          [field]: value ? Timestamp.fromDate(new Date(value)) : null
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUserId || !currentUserData) return;
    
    const now = Timestamp.now();
    const newCommentData = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      createdAt: now,
      createdBy: currentUserId,
      user: {
        id: currentUserId,
        name: currentUserData?.name || 'Unknown User'  // Provide a fallback value
      }
    };

    setTaskState(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newCommentData]
    }));
    setNewComment('');
  };

  const handleAddSubTask = () => {
    if (!newSubTask.title?.trim() || !currentUserId) return;
    
    const now = Timestamp.now();
    const newSubTaskData: SubTask = {
      id: crypto.randomUUID(),
      title: newSubTask.title.trim(),
      description: newSubTask.description || '',
      completed: false,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId,
      urgent: newSubTask.urgent || 'גבוהה',
      status: newSubTask.status || 'בתהליך',
      dueDate: newSubTask.dueDate ? Timestamp.fromDate(new Date(newSubTask.dueDate)) : now,
    };

    setTaskState(prev => ({
      ...prev,
      subTasks: [...(prev.subTasks || []), newSubTaskData]
    }));
    
    // Reset form
    setNewSubTask({
      title: '',
      description: '',
      completed: false,
      status: 'בתהליך',
      urgent: 'גבוהה',
      dueDate: '',
    });
    setShowNewSubTaskForm(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-6 " dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">מידע בסיסי</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 text-right">כותרת</label>
                  <div className="relative">
                    <FaTasks className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={taskState.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full bg-[#333333] text-white pl-10 pr-3 py-2 rounded-lg outline-none focus:ring-2 ${
                        formErrors.title ? 'ring-2 ring-red-500' : 'focus:ring-[#ec5252]'
                      } text-right`}
                      placeholder="הכנס כותרת משימה"
                      dir="rtl"
                    />
                    {formErrors.title && <p className="text-red-500 text-sm mt-1 text-right">{formErrors.title}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-right">סטטוס</label>
                  <Listbox value={taskState.status} onChange={(value) => handleInputChange('status', value)}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252]">
                        <span className="block truncate">{taskState.status}</span>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                          <FaChevronDown className="h-4 w-4 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                          {statusOptions.map((status, index) => (
                            <Listbox.Option
                              key={`status-option-${index}`}
                              value={status.value}
                              className={({ active }) =>
                                `${active ? 'bg-[#444444]' : ''} cursor-pointer select-none relative py-2 pr-10 pl-4`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                    {status.label}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                                      <FaCheck className="h-4 w-4" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-right">דחיפות</label>
                  <Listbox value={taskState.urgent} onChange={(value) => handleInputChange('urgent', value)}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
                        {({ value }) => {
                          const selectedOption = urgencyOptions.find(opt => opt.value === value);
                          return (
                            <>
                              <span className="flex items-center gap-2">
                                {selectedOption?.icon}
                                <span>{selectedOption?.label || value}</span>
                              </span>
                              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                                <FaChevronDown className="h-4 w-4 text-gray-400" />
                              </span>
                            </>
                          );
                        }}
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-xl shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
                          {urgencyOptions.map((urgency, index) => (
                            <Listbox.Option
                              key={`urgency-option-${index}`}
                              value={urgency.value}
                              className={({ active }) =>
                                `${active ? 'bg-[#444444]' : ''} cursor-pointer select-none relative py-2 px-3 hover:bg-[#444444] transition-colors duration-150`
                              }
                            >
                              {({ selected }) => (
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`flex items-center gap-2 ${selected ? 'font-medium' : 'font-normal'}`}>
                                    {urgency.icon}
                                    {urgency.label}
                                  </span>
                                  {selected && (
                                    <span className="text-[#ec5252]">
                                      <FaCheck className="h-4 w-4" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-right">תאריך יעד</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={getInputDateValue(taskState.dueDate)}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      className="w-full bg-[#333333] text-white pr-10 pl-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                      min={new Date().toISOString().split('T')[0]}
                      dir="rtl"
                    />
                  </div>
                </div>
   

                <div>
                  <label className="block text-gray-400 mb-1 text-right">תיאור</label>
                  <textarea
                    value={taskState.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full bg-[#333333] text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
                    placeholder="הכנס תיאור משימה"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'assignee':
        return (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">משתמשים מוקצים</h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id || `temp-${crypto.randomUUID()}`}
                    className="flex items-center justify-between bg-[#333333] p-3 rounded-lg cursor-pointer hover:bg-[#444444] transition-colors"
                    onClick={() => {
                      const newAssignedTo = taskState.assignedTo.includes(user.id)
                        ? taskState.assignedTo.filter(id => id !== user.id)
                        : [...taskState.assignedTo, user.id];
                      handleInputChange('assignedTo', newAssignedTo);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1f1f1f] rounded-full flex items-center justify-center">
                        <FaUser className="text-red-500" />
                      </div>
                      <div className="text-right">
                        <h4 className="text-white font-medium">{user.name}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    {taskState.assignedTo.includes(user.id) && (
                      <FaCheck className="text-red-500 h-5 w-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'project':
        return (
          <div className="space-y-5" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">בחירת פרויקט</h3>
              <div>
                <label className="block text-gray-400 mb-2 text-right">פרויקט</label>
                <Listbox value={taskState.project?.id} onChange={(value) => handleInputChange('project', value)}>
                  <div className="relative">
                    <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
                      <span className="block truncate">
                        {taskState.project ? (
                          <div className="flex flex-wrap gap-2 justify-end">
                            <span key={`project-${taskState.project.id}`} className="inline-flex items-center bg-red-500/20 text-red-400 text-sm px-2 py-1 rounded">
                              {projects.find(p => p.id === taskState.project?.id)?.name || 'פרויקט לא נמצא'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">בחר פרויקט...</span>
                        )}
                      </span>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
                        {projects.map((project, index) => (
                          <Listbox.Option
                            key={`project-option-${index}`}
                            value={project.id}
                            className={({ active, selected }) =>
                              `${active ? 'bg-[#3a3a3a]' : ''} 
                               ${selected ? 'bg-red-500/10' : ''} 
                               cursor-pointer select-none relative py-2 px-4 text-right transition-colors duration-200`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex items-center justify-between">
                                <span className={`${selected ? 'text-red-400' : 'text-white'} flex items-center gap-2`}>
                                  {selected && <FaCheck className="h-4 w-4" />}
                                </span>
                                <span className={`block truncate ${selected ? 'text-red-400 font-medium' : 'text-white'}`}>
                                  {project.name}
                                </span>
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
        );
      case 'customer':
        return (
          <div className="space-y-5" dir="rtl">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white text-right">בחירת לקוחות</h3>
              <div>
                <label className="block text-gray-400 mb-2 text-right">לקוחות נבחרים</label>
                <Listbox 
                  value={taskState.customers?.map(customer => customer.id) || []} 
                  onChange={(selectedValues: string[]) => {
                    const selectedCustomers = customers.filter(c => selectedValues.includes(c.id));
                    handleInputChange('customers', selectedCustomers);
                  }}
                  multiple
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-3 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[45px]">
                      <span className="block truncate">
                        {taskState.customers && taskState.customers.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {taskState.customers.map((customer) => (
                              <span key={`selected-${customer.id}`} className="inline-flex items-center bg-red-500/20 text-red-400 text-sm px-2 py-1 rounded">
                                {customer.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">בחר לקוחות...</span>
                        )}
                      </span>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none py-1">
                        {customers.map((customer, index) => (
                          <Listbox.Option
                            key={`customer-option-${index}`}
                            value={customer.id}
                            className={({ active, selected }) =>
                              `${active ? 'bg-[#3a3a3a]' : ''} 
                               ${selected ? 'bg-red-500/10' : ''} 
                               cursor-pointer select-none relative py-2 px-4 text-right transition-colors duration-200`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex items-center justify-between">
                                <span className={`${selected ? 'text-red-400' : 'text-white'} flex items-center gap-2`}>
                                  {selected && <FaCheck className="h-4 w-4" />}
                                </span>
                                <span className={`block truncate ${selected ? 'text-red-400 font-medium' : 'text-white'}`}>
                                  {customer.name}
                                </span>
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
        );
      case 'subtasks':
        return (
          <div className="space-y-5 p-6" dir="rtl">
            {/* Display existing subtasks */}
            <div className="space-y-4 mb-6">
              {taskState.subTasks && taskState.subTasks.map((subtask, index) => (
                <div key={subtask.id || index} className="bg-[#2a2a2a] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={(e) => {
                          const updatedSubTasks = [...(taskState.subTasks || [])];
                          updatedSubTasks[index] = {
                            ...subtask,
                            completed: e.target.checked,
                            updatedAt: Timestamp.now()
                          };
                          setTaskState(prev => ({
                            ...prev,
                            subTasks: updatedSubTasks
                          }));
                        }}
                        className="form-checkbox h-4 w-4 text-[#ec5252] rounded border-gray-500 bg-[#333333] focus:ring-[#ec5252] outline-none"
                      />
                      <span className={`text-lg font-medium ${subtask.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        subtask.urgent === 'גבוהה' ? 'bg-red-500/20 text-red-400' :
                        subtask.urgent === 'בינונית' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {subtask.urgent}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {formatDate(subtask.dueDate)}
                      </span>
                    </div>
                  </div>
                  {subtask.description && (
                    <p className="text-gray-400 mt-2">{subtask.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Add new subtask form */}
            {showNewSubTaskForm ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddSubTask();
              }} className="space-y-4 bg-[#333333] p-4 rounded-lg">
                <div>
                  <label className="block text-gray-400 mb-1 text-right">כותרת</label>
                  <input
                    type="text"
                    value={newSubTask.title}
                    onChange={(e) => setNewSubTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#444444] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                    placeholder="הכנס כותרת משימת משנה"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-right">תיאור</label>
                  <textarea
                    value={newSubTask.description}
                    onChange={(e) => setNewSubTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#444444] text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
                    placeholder="הכנס תיאור משימת משנה"
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-400 mb-1 text-right">דחיפות</label>
                    <select
                      value={newSubTask.urgent}
                      onChange={(e) => setNewSubTask(prev => ({ ...prev, urgent: e.target.value }))}
                      className="w-full bg-[#444444] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                      dir="rtl"
                    >
                      {urgencyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-400 mb-1 text-right">סטטוס</label>
                    <select
                      value={newSubTask.status}
                      onChange={(e) => setNewSubTask(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-[#444444] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                      dir="rtl"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-right">תאריך יעד</label>
                  <input
                    type="datetime-local"
                    value={newSubTask.dueDate || ''}
                    onChange={(e) => setNewSubTask(prev => ({ 
                      ...prev, 
                      dueDate: e.target.value || '' 
                    }))}
                    className="w-full bg-[#444444] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                    dir="rtl"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    הוסף משימת משנה
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewSubTaskForm(false);
                      setNewSubTask({
                        title: '',
                        description: '',
                        completed: false,
                        status: 'בתהליך',
                        urgent: 'גבוהה',
                        dueDate: '',
                      });
                    }}
                    className="bg-[#444444] text-gray-400 px-4 py-2 rounded-lg hover:bg-[#555555]"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewSubTaskForm(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <FaPlus />
                <span>הוסף משימת משנה</span>
              </button>
            )}
          </div>
        );
      case 'comments':
        return (
          <div className="space-y-5 p-6" dir="rtl">
            {/* Display existing comments */}
            <div className="space-y-4">
              {taskState.comments && taskState.comments.map((comment, index) => (
                <div key={comment.id || index} className="bg-[#2a2a2a] p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-400 text-sm">
                      {formatDate(comment.createdAt, 'datetime')}
                    </span>
                    <span className="text-red-400 font-medium">
                      {comment.user?.name || 'משתמש לא ידוע'}
                    </span>
                  </div>
                  <p className="text-white text-right">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Add new comment form */}
            <div className="bg-[#2a2a2a] p-4 rounded-lg">
              <label className="block text-gray-400 mb-2 text-right">הוסף הערה חדשה</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-[#333333] text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
                placeholder="הכנס את ההערה שלך כאן..."
                dir="rtl"
              />
              <div className="mt-3 flex justify-start">
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-lg ${
                    newComment.trim() 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  הוסף הערה
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleCreateTask = async () => {
    try {
      setIsLoading(true);
      const tasksRef = collection(db, 'tasks');
      const newTask = {
        title: taskState.title,
        description: taskState.description,
        status: taskState.status,
        urgent: taskState.urgent,
        dueDate: taskState.dueDate instanceof Timestamp ? taskState.dueDate : (taskState.dueDate ? Timestamp.fromDate(new Date(taskState.dueDate)) : null),
        assignedTo: taskState.assignedTo,
        project: taskState.project,
        customers: taskState.customers,
        createdAt: Timestamp.now(),
        createdBy: currentUser?.uid,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser?.uid,
        tasks: [],
        files: [],
        links: [],
        isFavorite: false,
        comments: []
      };

      await addDoc(tasksRef, newTask);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={handleClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-[900px] h-[600px] p-6 overflow-hidden text-left align-middle transition-all transform bg-[#1a1a1a] shadow-xl rounded-2xl" dir="rtl">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-medium leading-6 text-white"
                >
                  {task ? 'ערוך משימה' : 'צור משימה חדשה'}
                </Dialog.Title>
                <button
                  type="button"
                  className="bg-[#ec5252] text-white p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
                  onClick={handleClose}
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-row-reverse gap-6 h-[calc(100%-120px)]">
                <div className="w-3/4 bg-[#1f1f1f] rounded-xl overflow-y-auto custom-scrollbar">
                  {renderTabContent()}
                </div>
                <div className="w-1/4 space-y-2 overflow-y-auto custom-scrollbar justify-start" dir='ltr'>
                  {tabs.map((tab, index) => (
                    <button
                      key={`tab-${index}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-end px-4 py-3 rounded-lg transition-all duration-200 outline-none ${
                        activeTab === tab.id
                          ? 'bg-red-500/10 text-red-400 '
                          : 'bg-[#2a2a2a] text-gray-400'
                      }`}
                    >  
                    <span className="ml-2" dir="rtl">{tab.label}</span>
                      <span className="ml-2"  dir="rtl">{tab.icon}</span>
                    
                    </button>
                  ))}
                  {task && (
                    <button
                      onClick={handleDeleteTask}
                      className="w-full flex items-center justify-end px-4 py-3 rounded-lg bg-[#2a2a2a] text-red-400"
                    >
                      <FaTrash className="ml-2" />
                      <span>מחק משימה</span>
                    </button>
                  )}
                </div>
                
              </div>

              <div className="flex justify-end  m-4 pt-1 border-t border-gray-800">
                <button
                  type="button"
                  onClick={task ? handleSubmit : handleCreateTask}
                  className="bg-[#ec5252] text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  {task ? 'עדכן משימה' : 'צור משימה'}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TaskModal;
