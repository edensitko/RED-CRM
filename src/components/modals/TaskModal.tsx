import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaCheck, FaChevronDown, FaTimes, FaPlus, FaTasks, FaUser, FaCalendarAlt, FaTag } from 'react-icons/fa';
import { Task, SubTask, TaskCustomer, User, Project } from '../../types/schemas';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  projects: Project[];
  customers: any[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

const statusOptions = [
  { value: 'לביצוע', label: 'לביצוע', color: 'bg-red-500/20 text-red-500' },
  { value: 'בתהליך', label: 'בתהליך', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'הושלם', label: 'הושלם', color: 'bg-green-500/20 text-green-500' }
];

const urgencyOptions = [
  { value: 'low', label: 'נמוך' },
  { value: 'medium', label: 'בינוני' },
  { value: 'high', label: 'גבוה' }
];

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  users,
  projects,
  customers,
  onTaskUpdate
}) => {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('details');
  const [subTaskTab, setSubTaskTab] = useState<'active' | 'completed'>('active');
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [newSubTask, setNewSubTask] = useState<Partial<SubTask>>({
    title: '',
    createdAt: new Date().toISOString(),
    createdBy: '',
    urgency: 'low',
    description: '',
    status: 'לביצוע',
    dueDate: null,
    completed: false
  });
  const [showNewSubTaskForm, setShowNewSubTaskForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const filteredSubTasks = useMemo(() => {
    if (!currentTask?.subTasks) return [];
    return currentTask.subTasks.filter(subTask => 
      subTaskTab === 'active' 
        ? !subTask.completed 
        : subTask.completed
    );
  }, [currentTask?.subTasks, subTaskTab]);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('יש שינויים שלא נשמרו. האם אתה בטוח שברצונך לסגור?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleTaskChange = (field: keyof Task, value: any) => {
    setCurrentTask(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString()
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleSubTaskStatusChange = async (subTaskId: string, newStatus: string) => {
    if (!currentTask) return;

    const updatedSubTasks = currentTask.subTasks?.map(subTask => 
      subTask.id === subTaskId 
        ? { 
            ...subTask, 
            status: newStatus,
            completed: newStatus === 'הושלם',
            updatedAt: new Date().toISOString()
          } 
        : subTask
    );

    try {
      await onTaskUpdate(currentTask.id, { subTasks: updatedSubTasks });
      toast.success('Status updated successfully');
      
      if (newStatus === 'הושלם') {
        setSubTaskTab('completed');
      }
      
      setEditingSubTaskId(null);
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating subtask status:', error);
    }
  };

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask) return;

    if (!newSubTask.title) {
      setFormErrors({ title: 'Title is required' });
      return;
    }

    const newSubTaskComplete: SubTask = {
      ...newSubTask as SubTask,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      createdBy: currentTask.createdBy,
      completed: false
    
    };

    const updatedSubTasks = [...(currentTask.subTasks || []), newSubTaskComplete];

    try {
      await onTaskUpdate(currentTask.id, { subTasks: updatedSubTasks });
      setNewSubTask({
        title: '',
        createdAt: new Date().toISOString(),
        createdBy: '',
        urgency: 'נמוך',
        description: '',
        status: 'לביצוע',
        dueDate: null,
        completed: false
      });
      setShowNewSubTaskForm(false);
      setFormErrors({});
      toast.success('Subtask added successfully');
    } catch (error) {
      toast.error('Failed to add subtask');
      console.error('Error adding subtask:', error);
    }
  };

  const renderDetailsTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-400 mb-1">Title</label>
        <div className="relative">
          <FaTasks className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={currentTask?.title || ''}
            onChange={(e) => handleTaskChange('title', e.target.value)}
            className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter task title"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">Description</label>
        <textarea
          value={currentTask?.description || ''}
          onChange={(e) => handleTaskChange('description', e.target.value)}
          className="w-full bg-[#2a2a2a] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
          placeholder="Enter task description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 mb-1">Status</label>
          <Listbox value={currentTask?.status || 'pending'} onChange={(value) => handleTaskChange('status', value)}>
            <div className="relative">
              <Listbox.Button className="relative w-full bg-[#2a2a2a] text-white pl-3 pr-10 py-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-red-500">
                <span className="block truncate">{currentTask?.status || 'Select status'}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <FaChevronDown className="h-4 w-4 text-gray-400" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-[#2a2a2a] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                  {statusOptions.map((status) => (
                    <Listbox.Option
                      key={status.value}
                      value={status.value}
                      className={({ active }) =>
                        `${active ? 'bg-[#333333]' : ''} cursor-pointer select-none relative py-2 pl-10 pr-4`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {status.label}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500">
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
          <label className="block text-gray-400 mb-1">Due Date</label>
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
  type="date"
  value={currentTask?.dueDate instanceof Timestamp 
    ? currentTask.dueDate.toDate().toISOString().split('T')[0] 
    : currentTask?.dueDate || ''
  }
  onChange={(e) => handleTaskChange('dueDate', e.target.value)}
  className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
/>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubTasksTab = () => (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          onClick={() => setSubTaskTab('active')}
          className={`px-4 py-2 rounded-md ${
            subTaskTab === 'active'
              ? 'bg-red-600 text-white'
              : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setSubTaskTab('completed')}
          className={`px-4 py-2 rounded-md ${
            subTaskTab === 'completed'
              ? 'bg-red-600 text-white'
              : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
          }`}
        >
          Completed
        </button>
      </div>

      {showNewSubTaskForm ? (
        <form onSubmit={handleAddSubTask} className="space-y-4 bg-[#2a2a2a] p-4 rounded-lg">
          <div>
            <label className="block text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={newSubTask.title}
              onChange={(e) => setNewSubTask(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full bg-[#333333] text-white p-2 rounded-lg focus:outline-none focus:ring-2 ${
                formErrors.title ? 'border-2 border-red-500' : 'focus:ring-red-500'
              }`}
              placeholder="Enter subtask title"
            />
            {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
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
              className="bg-[#333333] text-gray-400 px-4 py-2 rounded-lg hover:bg-[#404040]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowNewSubTaskForm(true)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white"
        >
          <FaPlus />
          <span>Add Subtask</span>
        </button>
      )}

      <div className="space-y-2">
        {filteredSubTasks.map((subTask) => (
          <div
            key={subTask.id}
            className="bg-[#2a2a2a] p-4 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">{subTask.title}</h4>
              <div className="flex items-center space-x-2">
                <Listbox
                  value={subTask.status}
                  onChange={(value) => handleSubTaskStatusChange(subTask.id, value)}
                >
                  <div className="relative">
                    <Listbox.Button className={`px-3 py-1 rounded-full text-sm ${
                      statusOptions.find(s => s.value === subTask.status)?.color
                    }`}>
                      {subTask.status}
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-40 bg-[#2a2a2a] rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                        {statusOptions.map((status) => (
                          <Listbox.Option
                            key={status.value}
                            value={status.value}
                            className={({ active }) =>
                              `${active ? 'bg-[#333333]' : ''} cursor-pointer select-none relative py-2 pl-10 pr-4`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {status.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500">
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
            {subTask.description && (
              <p className="text-gray-400 text-sm">{subTask.description}</p>
            )}
            {subTask.dueDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <FaCalendarAlt />
                <span>{new Date(subTask.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

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
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-[#1a1a1a] shadow-xl rounded-2xl">
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

              <div className="mb-4">
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-lg ${
                      activeTab === 'details'
                        ? 'bg-red-600 text-white'
                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('subtasks')}
                    className={`px-4 py-2 rounded-lg ${
                      activeTab === 'subtasks'
                        ? 'bg-red-600 text-white'
                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333]'
                    }`}
                  >
                    Subtasks
                  </button>
                </div>

                {activeTab === 'details' ? renderDetailsTab() : renderSubTasksTab()}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TaskModal;
