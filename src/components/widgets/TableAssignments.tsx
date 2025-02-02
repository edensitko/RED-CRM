import React, { useCallback, useState } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaCircle, FaSpinner, FaCheckCircle, FaBan, FaArrowDown, FaEquals, FaArrowUp, FaExclamation, FaEdit, FaCheck } from 'react-icons/fa';
import { TaskUser, CustomerClass, Task, Project } from '../../types/schemas';
import { taskService } from '../../services/firebase/taskService';
import { Timestamp } from 'firebase/firestore';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

interface TableAssignmentsProps {
  tasks: Task[];
  users: TaskUser[];
  customers: any[];
  projects: any[];
  onTaskSelect: (task: Task) => void;
  onTaskUpdate: (taskId: string, data: any) => void;
  sortConfig: {
    key: keyof Task | 'customers' | '';
    direction: 'asc' | 'desc';
  };
  onSort: (key: keyof Task) => void;
}

const statusOptions = [
  { value: 'לביצוע', label: 'לביצוע', bgColor: 'bg-blue-900', textColor: 'text-blue-200', icon: <FaCircle className="w-2 h-2 text-blue-400" /> },
  { value: 'בתהליך', label: 'בתהליך', bgColor: 'bg-yellow-900', textColor: 'text-yellow-200', icon: <FaSpinner className="w-2 h-2 text-yellow-400" /> },
  { value: 'הושלם', label: 'הושלם', bgColor: 'bg-green-900', textColor: 'text-green-200', icon: <FaCheckCircle className="w-2 h-2 text-green-400" /> },
];

const urgencyOptions = [
  { value: 'נמוכה', label: 'נמוכה', bgColor: 'bg-gray-900', textColor: 'text-gray-200', icon: <FaArrowDown className="w-2 h-2 text-gray-400" /> },
  { value: 'בינונית', label: 'בינונית', bgColor: 'bg-yellow-900', textColor: 'text-yellow-200', icon: <FaEquals className="w-2 h-2 text-yellow-400" /> },
  { value: 'גבוהה', label: 'גבוהה', bgColor: 'bg-red-900', textColor: 'text-red-200', icon: <FaArrowUp className="w-2 h-2 text-red-400" /> },
];

const columns = [
  { key: 'no' as keyof Task, label: '', width: 'w-8',editable: false },
  { key: 'title' as keyof Task, label: 'כותרת', width: 'w-40', editable: false },
  { key: 'status' as keyof Task, label: 'סטטוס', width: 'w-40', editable: true },
  { key: 'urgent' as keyof Task, label: 'דחיפות', width: 'w-40', editable: true },
  { key: 'dueDate' as keyof Task, label: 'תאריך יעד', width: 'w-40', editable: true },
  { key: 'assignedTo' as keyof Task, label: 'אחראי', width: 'w-40', editable: true },
  { key: 'customers' as keyof Task, label: 'לקוח', width: 'w-40', editable: true },
  { key: 'project' as keyof Task, label: 'פרויקט', width: 'w-40', editable: true }
];

const formatDate = (date: Date | string | Timestamp | null | undefined) => {
  if (!date) return '-';
  try {
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (date instanceof Timestamp) {
      d = date.toDate();
    } else if (typeof date === 'string') {
      // Try parsing the string date
      d = new Date(date);
    } else {
      return '-';
    }

    // Check if date is valid
    if (isNaN(d.getTime())) {
      return '-';
    }

    // Format the date in Israel timezone
    return new Intl.DateTimeFormat('he-IL', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Jerusalem'
    }).format(d);
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return '-';
  }
};

const TableAssignments: React.FC<TableAssignmentsProps> = ({
  tasks,
  users,
  customers,
  projects,
  onTaskSelect,
  onTaskUpdate,
  sortConfig,
  onSort
}): JSX.Element => {

  const [editing, setEditing] = useState<{ taskId: string | null; field: string | null }>({ taskId: null, field: null });
  const [editValue, setEditValue] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const getStatusBadge = useCallback((status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.bgColor} ${option.textColor}`}>
        {option.icon}
        <span className="mr-1">{option.label}</span>
      </span>
    );
  }, []);

  const getUrgencyBadge = useCallback((urgent: string) => {
    const option = urgencyOptions.find(opt => opt.value === urgent);
    if (!option) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.bgColor} ${option.textColor}`}>
        {option.icon}
        <span className="mr-1">{option.label}</span>
      </span>
    );
  }, []);

  const getUserDisplayName = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }, [users]);

  const handleSort = useCallback((key: keyof Task) => {
    onSort(key);
  }, [onSort]);

  const handleEdit = (taskId: string, field: string, currentValue: any) => {
    setEditing({ taskId, field });
    if (field === 'assignedTo') {
      setSelectedUsers(currentValue || []);
    } else if (field === 'customers') {
      setSelectedCustomers(currentValue?.map((c: any) => c.id) || []);
    } else if (field === 'project') {
      setSelectedProject(currentValue?.id || '');
    } else {
      setEditValue(currentValue?.toString() || '');
    }
  };

  const handleSave = async (taskId: string, field: keyof Task, value?: any) => {
    try {
      const updateData = {
        [field]: value || editValue
      };
      
      await taskService.updateTask(taskId, updateData);
      setEditValue('');
      setEditing({ taskId: null, field: null });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const renderCell = (task: Task, column: any) => {
    const isEditing = editing.taskId === task.id && editing.field === column.key;

    if (isEditing) {
      switch (column.key) {
        case 'assignedTo':
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={selectedUsers[0] || 'none'}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedUsers([e.target.value]);
                }}
                className="w-full bg-gray-700 text-white rounded p-1"
                dir="rtl"
              >
                <option key="select-user" value="none">בחר אחראי</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.name || user.email || user.id}
                  </option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave(task.id, column.key);
                }}
                className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
              >
                <FaCheck className="w-4 h-4" />
              </button>
            </div>
          );

        case 'customers':
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={selectedCustomers[0] || 'none'}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedCustomers([e.target.value]);
                }}
                className="w-full bg-gray-700 text-white rounded p-1"
              >
                <option key="select-customer" value="none">בחר לקוח</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.lastName}
                  </option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave(task.id, column.key);
                }}
                className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
              >
                <FaCheck className="w-4 h-4" />
              </button>
            </div>
          );

        case 'project':
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={selectedProject}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedProject(e.target.value);
                }}
                className="w-full bg-gray-700 text-white rounded p-1"
              >
                <option key="select-project" value="none">בחר פרויקט</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave(task.id, column.key);
                }}
                className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
              >
                <FaCheck className="w-4 h-4" />
              </button>
            </div>
          );

        case 'status':
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={editValue}
                onChange={(e) => {
                  e.stopPropagation();
                  setEditValue(e.target.value);
                  handleSave(task.id, 'status', e.target.value);
                }}
                className="w-full bg-gray-700 text-white rounded p-1"
              >
                <option key="select-status" value="none">בחר סטטוס</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave(task.id, column.key);
                }}
                className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
              >
                <FaCheck className="w-4 h-4" />
              </button>
            </div>
          );

        case 'urgent':
          const urgentOption = urgencyOptions.find(opt => opt.value === task.urgent) || urgencyOptions[0];
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {isEditing ? (
                <>
                  <select
                    value={editValue || task.urgent}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newValue = e.target.value;
                      setEditValue(newValue);
                      handleSave(task.id, 'urgent', newValue);
                    }}
                    className="w-full bg-gray-700 text-white rounded-xl p-1.5"
                    dir="rtl"
                  >
                    {urgencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${urgentOption.bgColor} ${urgentOption.textColor} cursor-pointer hover:opacity-90 transition-all duration-200`}
                  onClick={() => handleEdit(task.id, column.key, task.urgent)}
                >
                  {urgentOption.icon}
                  <span>{urgentOption.label}</span>
                </div>
              )}
            </div>
          );

        case 'dueDate':
          const currentDate = task.dueDate?.seconds ? new Date(task.dueDate?.seconds * 1000) : null 

          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  value={currentDate}
                  onChange={(newDate) => {
                    if (newDate) {
                      // Set the time to noon in local timezone to avoid date shifting
                      const localDate = new Date(newDate);
                      localDate.setHours(12, 0, 0, 0);
                      handleSave(task.id, column.key, localDate);
                    }
                  }}
                  format="dd/MM/yyyy"
                  sx={{
                    width: '100%',
                    '& .MuiInputBase-root': {
                      color: 'white',
                      backgroundColor: '#374151',
                      '&:hover': {
                        backgroundColor: '#4B5563',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4B5563',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6B7280',
                      },
                      '& .MuiIconButton-root': {
                        color: 'white',
                      },
                    },
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      dir: "rtl",
                    },
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          backgroundColor: '#1F2937',
                          color: 'white',
                        },
                        '& .MuiPickersDay-root': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#374151',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#3B82F6',
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
          );

        default:
          let displayValue: string;
          const value = task[column.key as keyof Task];
          if (value === null || value === undefined) {
            displayValue = '';
          } else if (value instanceof Timestamp) {
            displayValue = formatDate(value);
          } else if (Array.isArray(value)) {
            if (column.key === 'assignedTo') {
              const assignedUserNames = value
                .map(userId => users.find(u => u.id === userId))
                .filter((user): user is TaskUser => user !== undefined)
                .map(user => user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.name || user.email || user.id)
              ;
              displayValue = assignedUserNames.length > 0 ? assignedUserNames.join(', ') : '-';
            } else if (column.key === 'subTasks' && value.length > 0) {
              displayValue = `${value.length} משימות משנה`;
            } else if (column.key === 'comments' && value.length > 0) {
              displayValue = `${value.length} תגובות`;
            } else {
              displayValue = value.length.toString();
            }
          } else if (typeof value === 'object' && value !== null) {
            if ('name' in value) {
              displayValue = (value as { name: string }).name;
            } else if ('title' in value) {
              displayValue = (value as { title: string }).title;
            } else {
              displayValue = JSON.stringify(value);
            }
          } else if (column.key === 'urgent') {
            const option = urgencyOptions.find(opt => opt.value === value);
            displayValue = option ? option.label : value?.toString() || '-';
          } else {
            displayValue = String(value || '-');
          }

          return (
            <div 
              onClick={(e) => {
                if (column.editable) {
                  e.stopPropagation();
                  handleEdit(task.id, column.key, task[column.key as keyof Task]);
                }
              }} 
              className={`truncate ${column.width}`}
              dir="rtl"
            >
              {displayValue}
            </div>
          );
      }
    }

    switch (column.key) {



      case 'no':
        return (
          <div >
            <button className="text-gray-400 hover:text-gray-300 bg-transparent rounded p-0"
              onClick={(e) => {
                e.stopPropagation();
                onTaskSelect(task);
              }}
            >
              <FaEdit className="w-4 h-4 cursor-pointer bg-transparent rounded hover:bg-gray-500 p-0 " />
            </button>
          </div>
        );

      case 'title':
        return (
          <div className={`flex items-center justify-between ${column.width}`}>
            <span className="flex-1 text-right truncate">{task.title}</span>
          </div>
        ); 


      case 'assignedTo':
        const assignedUsers = task.assignedTo 
          ? task.assignedTo
            .map(userId => users.find(u => u.id === userId))
            .filter((user): user is TaskUser => user !== undefined)
            .map(user => user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.name || user.email || '-'
            )
          : [];

        return (
          <div 
            onClick={(e) => {
              if (column.editable) {
                e.stopPropagation();
                handleEdit(task.id, column.key, task.assignedTo);
              }
            }} 
            className={`${column.width} text-right truncate`}
            dir="rtl"
          >
            {assignedUsers.length > 0 ? assignedUsers.join(', ') : '-'}
          </div>
        );

      case 'customers':
        const customer = task.customers && task.customers[0];
        return (
          <div onClick={(e) => {
            if (column.editable) {
              e.stopPropagation();
              handleEdit(task.id, column.key, task.customers);
            }
          }} className={`truncate ${column.width}`}>
            {customer ? `${customer.name} ${customer.lastName}` : '-'}
          </div>
        );

      case 'project':
        return (
          <div onClick={(e) => {
            if (column.editable) {
              e.stopPropagation();
              handleEdit(task.id, column.key, task.project);
            }
          }} className={`truncate ${column.width}`}>
            {task.project?.name || '-'}
          </div>
        );

      case 'status':
        return (
          <div onClick={(e) => {
            if (column.editable) {
              e.stopPropagation();
              handleEdit(task.id, column.key, task.status);
            }
          }} className={`${column.width}`}>
            {getStatusBadge(task.status)}
          </div>
        );

      case 'urgent':
        const urgentOption = urgencyOptions.find(opt => opt.value === task.urgent) || urgencyOptions[0];
        return (
          <div onClick={(e) => {
            if (column.editable) {
              e.stopPropagation();
              handleEdit(task.id, column.key, task.urgent);
            }
          }} className={`${column.width}`}>
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${urgentOption.bgColor} ${urgentOption.textColor} cursor-pointer hover:opacity-90 transition-all duration-200`}
              onClick={() => handleEdit(task.id, column.key, task.urgent)}
            >
              {urgentOption.icon}
              <span>{urgentOption.label}</span>
            </div>
          </div>
        );

      case 'dueDate':
        const displayDate = formatDate(task.dueDate);
        return (
          <div 
            onClick={(e) => {
              if (column.editable) {
                e.stopPropagation();
                handleEdit(task.id, column.key, task.dueDate);
              }
            }} 
            className={`${column.width} text-right`}
            dir="rtl"
          >
            {displayDate}
          </div>
        );

      default:
        const value = task[column.key as keyof Task];
        let displayValue: string = '-';

        if (Array.isArray(value)) {
          if (column.key === 'assignedTo') {
            const assignedUserNames = value
              .map(userId => users.find(u => u.id === userId))
              .filter((user): user is TaskUser => user !== undefined)
              .map(user => user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.name || user.email || '-'
              );
            displayValue = assignedUserNames.length > 0 ? assignedUserNames.join(', ') : '-';
          } else if (column.key === 'subTasks' && value.length > 0) {
            displayValue = `${value.length} משימות משנה`;
          } else if (column.key === 'comments' && value.length > 0) {
            displayValue = `${value.length} תגובות`;
          } else {
            displayValue = value.length.toString();
          }
        } else if (typeof value === 'object' && value !== null) {
          if ('name' in value) {
            displayValue = (value as { name: string }).name;
          } else if ('title' in value) {
            displayValue = (value as { title: string }).title;
          } else {
            displayValue = JSON.stringify(value);
          }
        } else if (column.key === 'urgent') {
          const option = urgencyOptions.find(opt => opt.value === value);
          displayValue = option ? option.label : value?.toString() || '-';
        } else {
          displayValue = String(value || '-');
        }

        return (
          <div 
            onClick={(e) => {
              if (column.editable) {
                e.stopPropagation();
                handleEdit(task.id, column.key, task[column.key as keyof Task]);
              }
            }} 
            className={`truncate ${column.width}`}
            dir="rtl"
          >
            {displayValue}
          </div>
        );
    }
  };

  return (
    <div className="relative rounded-lg shadow ring-1 ring-black ring-opacity-5">
      <div className="overflow-y-scroll max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 -webkit-overflow-scrolling-touch">
        <table className="w-full divide-y divide-gray-700 bg-[#1a1a1a]">
          <thead className="sticky top-0 bg-[#242424] z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`${column.width} px-3 py-3.5 text-right text-sm font-semibold text-[#e1e1e1] cursor-pointer whitespace-nowrap`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    {sortConfig.key === column.key && (
                      <span>
                        {sortConfig.direction === 'asc' ? (
                          <FaSortUp className="w-4 h-4" />
                        ) : (
                          <FaSortDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {tasks.map((task, rowIndex) => (
              <tr 
                key={task.id} 
                className={`hover:bg-[#2a2a2a] cursor-pointer ${rowIndex % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#242424]'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskSelect(task);
                }}
              >
                {columns.map(column => (
                  <td key={column.key} className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                    {renderCell(task, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableAssignments;
