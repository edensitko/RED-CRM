import React, { Fragment, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { 
  FaUser, FaCheck, FaTimes, FaTasks, FaPlus, FaHourglassHalf, 
  FaPlayCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, 
  FaInfo, FaCalendarAlt, FaUsers, FaProjectDiagram, FaClock, FaTag,
  FaComments, FaClipboardList, FaChevronDown
} from 'react-icons/fa';
import { addDoc, collection, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Task, User, Project } from '../../types/schemas';
import { CustomerClass } from '../../types/customer';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask?: (task: Task) => Promise<void>;
  onUpdateTask?: (taskId: string, task: Partial<Task>) => Promise<void>;
  users: User[];
  projects: Project[];
  customers: CustomerClass[];
  task?: Task | null;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  onUpdateTask,
  users,
  projects,
  customers,
  task
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [taskState, setTaskState] = useState<Task>({
    id: '',  
    title: '',
    description: '',
    status: 'לביצוע',
    dueDate: null,
    assignedTo: [],             
    customers: [],
    project: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '',
    updatedBy: '',
    isDeleted: false,
    urgent: 'גבוהה',  
    subTasks: [],
    comments: [],
    repeat: 'none',
    tasks: [],
    files: [],
    links: [],
    isFavorite: false
  });

  const tabs = [
    { id: 'details', label: 'פרטי משימה', icon: <FaTasks /> },
    { id: 'assignee', label: 'משתמש מוקצה', icon: <FaUser /> },
    { id: 'project', label: 'פרויקט', icon: <FaProjectDiagram /> },
    { id: 'customer', label: 'לקוח', icon: <FaUsers /> },
    { id: 'subtasks', label: 'משימות משנה', icon: <FaClipboardList /> },
    { id: 'comments', label: 'הערות', icon: <FaComments /> },
  ];

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [newComment, setNewComment] = useState('');
  const [newSubTask, setNewSubTask] = useState({ title: '', description: '' });
  const [showNewSubTaskForm, setShowNewSubTaskForm] = useState(false);

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

  // Map Hebrew urgency levels to internal values
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

    if (!taskState.title.trim()) {
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

      if (task && onUpdateTask) {
        await onUpdateTask(task.id, taskData);
      } else if (onCreateTask) {
        await onCreateTask(taskData);
      } else {
        // If no callbacks provided, save directly to Firebase
        const tasksRef = collection(db, 'tasks');
        await addDoc(tasksRef, taskData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setTaskState(prev => ({
      ...prev,
      [field]: field === 'urgent' ? mapUrgencyToHebrew(value) : value
    }));
    // Clear error when field is updated
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
        createdAt: Timestamp.now(), // Changed from ISO string to Timestamp
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
      }]
    }));
    setNewSubTask({ title: '', description: '' });
    setShowNewSubTaskForm(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">כותרת</label>
              <div className="relative">
                <FaTasks className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={taskState.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full bg-[#2a2a2a] text-white pr-10 pl-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${formErrors.title ? 'border-2 border-red-500' : 'focus:ring-red-500'}`}
                  placeholder="הזן כותרת משימה"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">תיאור</label>
              <textarea
                value={taskState.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                placeholder="הזן תיאור משימה"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">דחיפות</label>
              <div className="flex space-x-2">
                {['נמוכה', 'בינונית', 'גבוהה'].map((urgent) => (
                  <button
                    key={urgent}
                    type="button"
                    onClick={() => handleInputChange('urgent', urgent)}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                      mapUrgencyToHebrew(taskState.urgent) === urgent
                        ? 'bg-red-600 text-white'
                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
                    }`}
                  >
                    {urgent}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">תאריך יעד</label>
              <div className="relative">
                <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={taskState.dueDate ? taskState.dueDate.toString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white pr-10 pl-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        );

      case 'assignee':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">משתמשים מוקצים</label>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id || `temp-${crypto.randomUUID()}`}
                    className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded-lg cursor-pointer hover:bg-[#333333]"
                    onClick={() => {
                      const newAssignedTo = taskState.assignedTo.includes(user.id)
                        ? taskState.assignedTo.filter(id => id !== user.id)
                        : [...taskState.assignedTo, user.id];
                      handleInputChange('assignedTo', newAssignedTo);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <FaUser className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{user.name}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    {taskState.assignedTo.includes(user.id) && (
                      <FaCheck className="text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">פרויקט</label>
              <Listbox
                value={taskState.project?.id || ''}
                onChange={(value) => {
                  const project = projects.find(p => p.id === value);
                  handleInputChange('project', value);
                  handleInputChange('project', project);
                }}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#2a2a2a] py-2 pl-3 pr-10 text-right text-white">
                    <span className="block truncate">
                      {taskState.project?.name || 'בחר פרויקט'}
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2a2a2a] py-1">
                    {projects.map((project) => (
                      <Listbox.Option
                        key={project.id || `temp-${crypto.randomUUID()}`}
                        value={project.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-red-600 text-white' : 'text-gray-400'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {project.name || 'Unnamed Project'}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                <FaCheck className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        );

      case 'customer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">לקוחות</label>
              <Listbox
                value={taskState.customers?.map(c => c.id) || []}
                onChange={(value) => {
                  const selectedCustomers = customers.filter(c => value.includes(c.id));
                  handleInputChange('customers', selectedCustomers);
                }}
                multiple
              >
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#2a2a2a] py-2 pl-3 pr-10 text-right text-white">
                    <span className="block truncate">
                      {taskState.customers?.length
                        ? taskState.customers.map(c => c.name || 'לקוח ללא שם').join(', ')
                        : 'בחר לקוחות'}
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2a2a2a] py-1">
                    {customers.map((customer) => (
                      <Listbox.Option
                        key={customer.id || `temp-${crypto.randomUUID()}`}
                        value={customer.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-red-600 text-white' : 'text-gray-400'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {customer.name || 'Unnamed Customer'}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                <FaCheck className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        );

      case 'subtasks':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-gray-400">משימות משנה</label>
                <button
                  type="button"
                  onClick={() => setShowNewSubTaskForm(true)}
                  className="flex items-center space-x-1 text-red-500 hover:text-red-400"
                >
                  <FaPlus className="h-4 w-4" />
                  <span>הוסף משימת משנה</span>
                </button>
              </div>

              {showNewSubTaskForm && (
                <div className="bg-[#2a2a2a] p-4 rounded-lg mb-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newSubTask.title}
                      onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
                      className="w-full bg-[#333333] text-white px-4 py-2 rounded-lg"
                      placeholder="כותרת משימת משנה"
                    />
                    <textarea
                      value={newSubTask.description}
                      onChange={(e) => setNewSubTask({ ...newSubTask, description: e.target.value })}
                      className="w-full bg-[#333333] text-white px-4 py-2 rounded-lg"
                      placeholder="תיאור משימת משנה"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowNewSubTaskForm(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                      >
                        ביטול
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSubTask}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        הוסף
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {taskState.subTasks?.map((subTask, index) => (
                  <div key={subTask.id} className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{subTask.title}</h4>
                        <p className="text-gray-400 text-sm">{subTask.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newSubTasks = [...(taskState.subTasks || [])];
                          newSubTasks.splice(index, 1);
                          handleInputChange('subTasks', newSubTasks);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FaTimes className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">הערות</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                placeholder="הוסף הערה חדשה"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                הוסף הערה
              </button>
            </div>

            <div className="space-y-2">
              {taskState.comments?.map((comment) => (
                <div key={comment.id} className="bg-[#2a2a2a] p-4 rounded-lg">
                  <p className="text-white">{comment.text}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {comment.createdAt.toString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1a1a1a] p-6 text-right align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-4">
                  {task ? 'עריכת משימה' : 'משימה חדשה'}
                </Dialog.Title>

                <div className="flex space-x-4 mb-6">
                  <div className="w-1/4 space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-right ${
                          activeTab === tab.id
                            ? 'bg-red-600 text-white'
                            : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
                        }`}
                      >
                        <span className="ml-2">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="w-3/4 bg-[#1a1a1a] rounded-lg p-4">
                    {renderTabContent()}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-transparent bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-[#333333] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    {task ? 'עדכן משימה' : 'צור משימה'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateTaskModal;
