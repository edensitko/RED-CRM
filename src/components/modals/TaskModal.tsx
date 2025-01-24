import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { doc, updateDoc, Timestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaCheck, FaChevronDown, FaTimes, FaPlus, FaTasks, FaUser, FaCalendarAlt, FaTag, FaProjectDiagram, FaUsers, FaClipboardList, FaComments } from 'react-icons/fa';
import { Task, SubTask, User, Project } from '../../types/schemas';
import { CustomerClass } from '../../types/customer';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
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
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' }
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
  const [taskState, setTaskState] = useState<Partial<Task>>({
    id: task?.id || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || statusOptions[0].value,
    dueDate: task?.dueDate || null,
    assignedTo: task?.assignedTo || [],
    customers: task?.customers || [],
    subTasks: task?.subTasks || [],
    comments: task?.comments || [],
    urgent: task?.urgent || 'גבוהה',
    repeat: task?.repeat || 'none',
    
  });

  const [activeTab, setActiveTab] = useState<'details' | 'assignee' | 'project' | 'customer' | 'subtasks' | 'comments'>('details');
  const [newSubTask, setNewSubTask] = useState<Partial<SubTask>>({
    title: '',
    description: '',
  });
  const [newComment, setNewComment] = useState('');
  const [showNewSubTaskForm, setShowNewSubTaskForm] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (task) {
      setTaskState({
        ...task,
        assignedTo: Array.isArray(task.assignedTo) 
          ? task.assignedTo 
          : task.assignedTo 
            ? [task.assignedTo] 
            : [],
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        urgent: mapUrgencyToInternal(taskState.urgent || 'נמוכה')
      };

      if (task) {
        await onUpdateTask(task.id, taskData);
        toast.success('Task updated successfully!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
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
    setTaskState(prev => ({
      ...prev,
      [field]: field === 'urgent' ? mapUrgencyToHebrew(value) : value
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    setTaskState(prev => ({
      ...prev,
      comments: [...(prev.comments || []), {
        id: crypto.randomUUID(),
        text: newComment.trim(),
        createdAt: Timestamp.now(),
        userId: '', 
        createdBy: '',
      }]
    }));
    setNewComment('');
  };

  const handleAddSubTask = () => {
    setTaskState(prev => ({
      ...prev,
      subTasks: [...(prev.subTasks || []), {
        ...newSubTask,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
        urgent: 'גבוהה',
        status: 'בתהליך',
        dueDate: new Date(),
        completed: false,
        title: newSubTask.title || '', // Ensure title is a string
        description: newSubTask.description || '' // Ensure description is a string
      }]
    }));
    setNewSubTask({ title: '', description: '' });
    setShowNewSubTaskForm(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-4" dir="rtl">
            <div>
              <label className="block text-gray-400 mb-1 text-right">כותרת</label>
              <div className="relative">
                <FaTasks className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={taskState.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full bg-[#333333] text-white p-2 rounded-lg focus:outline-none focus:ring-2 text-right ${
                    formErrors.title ? 'border-2 border-red-500' : 'focus:ring-red-500'
                  }`}
                  placeholder="Enter task title"
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1 text-right">{formErrors.title}</p>}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-right">תיאור</label>
              <textarea
                value={taskState.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-[#333333] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] text-right"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 text-right">סטטוס</label>
                <Listbox value={taskState.status} onChange={(value) => handleInputChange('status', value)}>
                  <div className="relative">
                    <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500">
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
                        {statusOptions.map((status) => (
                          <Listbox.Option
                            key={status.value}
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
                <label className="block text-gray-400 mb-1 text-right">תאריך יעד</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={taskState.dueDate ? taskState.dueDate.toDate().toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full bg-[#333333] text-white pr-10 pl-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'assignee':
        return (
          <div className="space-y-4" dir="rtl">
            <div>
              <label className="block text-gray-400 mb-1 text-right">משתמש מוקצה</label>
              <Listbox value={taskState.assignedTo} onChange={(value) => handleInputChange('assignedTo', value)}>
                <div className="relative">
                  <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                    <span className="block truncate">{taskState.assignedTo}</span>
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
                      {users.map((user) => (
                        <Listbox.Option
                          key={user.id}
                          value={user.id}
                          className={({ active }) =>
                            `${active ? 'bg-[#444444]' : ''} cursor-pointer select-none relative py-2 pr-10 pl-4`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {user.name}
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
          </div>
        );
      case 'project':
        return (
          <div className="space-y-4" dir="rtl">
            <div>
              <label className="block text-gray-400 mb-1 text-right">פרויקט</label>
              <Listbox value={taskState.project?.id} onChange={(value) => handleInputChange('project', value)}>
                <div className="relative">
                  <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                    <span className="block truncate">
                      {projects.find(p => p.id === taskState.project?.id)?.name || 'בחר פרויקט'}
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
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#333333] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                      {projects.map((project) => (
                        <Listbox.Option
                          key={project.id}
                          value={project.id}
                          className={({ active }) =>
                            `${active ? 'bg-red-500 text-white' : 'text-white'}
                            cursor-pointer select-none relative py-2 pl-10 pr-4 text-right`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {project.name}
                              </span>
                              {selected && (
                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-red-500'}`}>
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
          </div>
        );
      case 'customer':
        return (
          <div className="space-y-4" dir="rtl">
            <div>
              <label className="block text-gray-400 mb-1 text-right">לקוח</label>
              <Listbox 
                value={taskState.customers?.map(customer => customer.id) || []} 
                onChange={(selectedValues: string[]) => {
                  const selectedCustomers = customers.filter(c => selectedValues.includes(c.id));
                  handleInputChange('customers', selectedCustomers);
                }}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500">
                  <span className="block truncate">
                  {customers
                    .filter((c) => taskState.customers?.map(customer => customer.id).includes(c.id))
                    .map((c) => c.name)
                    .join(', ') || 'No customer selected'}
                  </span>                     <span className="absolute inset-y-0 left-0 flex items-center pl-2">
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
                      {customers.map((customer) => (
                        <Listbox.Option
                          key={customer.id}
                          value={customer.id}
                          className={({ active }) =>
                            `${active ? 'bg-[#444444]' : ''} cursor-pointer select-none relative py-2 pr-10 pl-4`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {customer.name}
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
          </div>
        );
      case 'subtasks':
        return (
          <div className="space-y-4" dir="rtl">
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
                    className={`w-full bg-[#444444] text-white p-2 rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.title ? 'border-2 border-red-500' : 'focus:ring-red-500'
                    }`}
                    placeholder="Enter subtask title"
                  />
                  {formErrors.title && <p className="text-red-500 text-sm mt-1 text-right">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-right">תיאור</label>
                  <textarea
                    value={newSubTask.description}
                    onChange={(e) => setNewSubTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#444444] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                    placeholder="Enter subtask description"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Add Subtask
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewSubTaskForm(false);
                      setFormErrors({});
                    }}
                    className="bg-[#444444] text-gray-400 px-4 py-2 rounded-lg hover:bg-[#555555]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewSubTaskForm(true)}
                className="flex items-center space-x-reverse-2 text-gray-400 hover:text-white"
              >
                <FaPlus />
                <span>Add Subtask</span>
              </button>
            )}
          </div>
        );
      case 'comments':
        return (
          <div className="space-y-4" dir="rtl">
            <div>
              <label className="block text-gray-400 mb-1 text-right">הערות</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-[#333333] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                placeholder="Enter comment"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleAddComment}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Add Comment
              </button>
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
            <div className="fixed inset-0 bg-black opacity-30" />
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
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-[#1a1a1a] shadow-xl rounded-2xl" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white"
                >
                  Task Details
                </Dialog.Title>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white"
                  onClick={handleClose}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-row-reverse space-x-reverse-4 mb-6">
                <div className="w-1/4 space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-reverse-2 px-4 py-2 rounded-lg text-right ${
                        activeTab === tab.id
                          ? 'bg-red-600 text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <div className="w-3/4">
                  {renderTabContent()}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {task && (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete Task
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {task ? 'Update Task' : 'Create Task'}
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
