import React, { Fragment, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { FaUser, FaCheck, FaTimes, FaTasks, FaPlus, FaHourglassHalf, FaPlayCircle, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfo } from 'react-icons/fa';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

// Types
type PriorityType = 'גבוהה' | 'בינונית' | 'נמוכה';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface NewTask {
  title: string;
  description: string;
  status: string;
  priority: PriorityType;
  dueDate: Date;
  assignedTo: string[];
  project?: { id: string; name: string; };
  customers: Array<{ 
    id: string; 
    firstName: string;
    lastName: string;
    email: string; 
    phone: string; 
  }>;
  repeat?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: NewTask) => Promise<void>;
  users: User[];
  projects: Project[];
  customers: Customer[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreateTask, users, projects, customers }) => {
  const initialTaskData: NewTask = {
    title: '',
    description: '',
    status: 'לביצוע',
    priority: 'בינונית',
    dueDate: new Date(),
    assignedTo: [],
    customers: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const [newTaskData, setNewTaskData] = React.useState<NewTask>(initialTaskData);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setNewTaskData(initialTaskData);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newTaskData.title.trim()) {
      newErrors.title = 'כותרת משימה נדרשת';
    }
    if (!newTaskData.description.trim()) {
      newErrors.description = 'תיאור משימה נדרש';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onCreateTask(newTaskData);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleInputChange = (field: keyof NewTask, value: any) => {
    setNewTaskData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-right align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  משימה חדשה
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">כותרת</label>
                    <input
                      type="text"
                      value={newTaskData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full p-2 border rounded-md ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="הכנס כותרת למשימה"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                    <textarea
                      value={newTaskData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`w-full p-2 border rounded-md ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="הכנס תיאור למשימה"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">עדיפות</label>
                    <Listbox
                      value={newTaskData.priority}
                      onChange={(value) => handleInputChange('priority', value)}
                    >
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-right border border-gray-300 focus:outline-none focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-red-300 sm:text-sm">
                          <span className="block truncate">{newTaskData.priority}</span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                            {['גבוהה', 'בינונית', 'נמוכה'].map((priority) => (
                              <Listbox.Option
                                key={priority}
                                value={priority}
                                className={({ active, selected }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  } ${selected ? 'bg-red-50' : ''}`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {priority}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">תאריך יעד</label>
                    <input
                      type="date"
                      value={newTaskData.dueDate instanceof Date ? newTaskData.dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('dueDate', new Date(e.target.value))}
                      className="w-full p-2 border rounded-md border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">משתמשים מוקצים</label>
                    <Listbox
                      value={newTaskData.assignedTo}
                      onChange={(value) => handleInputChange('assignedTo', value)}
                      multiple
                    >
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-right border border-gray-300 focus:outline-none focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-red-300 sm:text-sm">
                          <span className="block truncate">
                            {newTaskData.assignedTo.length > 0
                              ? users
                                  .filter((u) => newTaskData.assignedTo.includes(u.id))
                                  .map((u) => u.firstName || u.email)
                                  .join(', ')
                              : 'בחר משתמשים'}
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                            {users.map((user) => (
                              <Listbox.Option
                                key={user.id}
                                value={user.id}
                                className={({ active, selected }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  } ${selected ? 'bg-red-50' : ''}`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {user.firstName || user.email}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">לקוחות</label>
                    <Listbox
                      value={newTaskData.customers}
                      onChange={(value) => handleInputChange('customers', value)}
                      multiple
                    >
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-right border border-gray-300 focus:outline-none focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-red-300 sm:text-sm">
                          <span className="block truncate">
                            {newTaskData.customers.length > 0
                              ? newTaskData.customers.map(c => `${c.firstName} ${c.lastName}`).join(', ')
                              : 'בחר לקוחות'}
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                            {customers.map((customer) => (
                              <Listbox.Option
                                key={customer.id}
                                value={{ 
                                  id: customer.id, 
                                  firstName: customer.firstName,
                                  lastName: customer.lastName,
                                  email: customer.email, 
                                  phone: customer.phone 
                                }}
                                className={({ active, selected }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-red-100 text-red-900' : 'text-gray-900'
                                  } ${selected ? 'bg-red-50' : ''}`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {`${customer.firstName} ${customer.lastName}`}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
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

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                      צור משימה
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateTaskModal;
