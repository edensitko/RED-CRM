import React from 'react';
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FaTasks, FaChevronDown, FaCheck, FaCalendarAlt } from 'react-icons/fa';
import { Task } from '../../../../types/schemas';
import { TASK_STATUSES, URGENCY_LEVELS } from '../../../../constants/status';

interface TaskDetailsProps {
  taskState: Task;
  formErrors: { [key: string]: string };
  onInputChange: (field: keyof Task, value: any) => void;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  taskState,
  formErrors,
  onInputChange,
}) => {
  return (
    <div className="space-y-6" dir="rtl">
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
                onChange={(e) => onInputChange('title', e.target.value)}
                className={`w-full bg-[#333333] text-white pl-10 pr-3 py-2 rounded-lg outline-none focus:ring-2 ${
                  formErrors.title ? 'ring-2 ring-red-500' : 'focus:ring-[#ec5252]'
                } text-right`}
                placeholder="הכנס כותרת משימה"
                dir="rtl"
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1 text-right">{formErrors.title}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 text-right">סטטוס</label>
            <Listbox
              value={taskState.status}
              onChange={(value) => onInputChange('status', value)}
            >
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
                    {Object.values(TASK_STATUSES).map((status, index) => (
                      <Listbox.Option
                        key={`status-option-${index}`}
                        value={status}
                        className={({ active }) =>
                          `${
                            active ? 'bg-[#444444]' : ''
                          } cursor-pointer select-none relative py-2 pr-10 pl-4`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {status}
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
            <Listbox
              value={taskState.urgent}
              onChange={(value) => onInputChange('urgent', value)}
            >
              <div className="relative">
                <Listbox.Button className="relative w-full bg-[#333333] text-white pr-3 pl-10 py-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#ec5252]">
                  <span className="block truncate">{taskState.urgent}</span>
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
                    {Object.values(URGENCY_LEVELS).map((urgency, index) => (
                      <Listbox.Option
                        key={`urgency-option-${index}`}
                        value={urgency}
                        className={({ active }) =>
                          `${
                            active ? 'bg-[#444444]' : ''
                          } cursor-pointer select-none relative py-2 pr-10 pl-4`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {urgency}
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
                value={
                  taskState.dueDate
                    ? new Date(taskState.dueDate as any).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => onInputChange('dueDate', e.target.value)}
                className="w-full bg-[#333333] text-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1 text-right">תיאור</label>
            <textarea
              value={taskState.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              className="w-full bg-[#333333] text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ec5252] min-h-[100px] text-right"
              placeholder="הכנס תיאור משימה"
              dir="rtl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
