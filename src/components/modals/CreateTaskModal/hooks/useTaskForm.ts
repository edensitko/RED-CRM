import { useState, useEffect } from 'react';
import { Task } from '../../../../types/schemas';
import { TASK_STATUSES, URGENCY_LEVELS } from '../../../../constants/status';
import { Timestamp } from 'firebase/firestore';

const initialTaskState: Task = {
  id: '',
  title: '',
  description: '',
  status: TASK_STATUSES.TODO,
  urgent: URGENCY_LEVELS.HIGH,
  dueDate: null,
  assignedTo: [],
  customers: [],
  project: null,
  subTasks: [],
  comments: [],
  tasks: [],
  files: [],
  links: [],
  isFavorite: false,
  isDeleted: false,
};

export const useTaskForm = (initialTask?: Task) => {
  const [taskState, setTaskState] = useState<Task>(initialTask || initialTaskState);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (initialTask) {
      setTaskState({
        ...initialTask,
        assignedTo: Array.isArray(initialTask.assignedTo) 
          ? initialTask.assignedTo 
          : initialTask.assignedTo 
            ? [initialTask.assignedTo] 
            : [],
      });
    }
  }, [initialTask]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!taskState.title.trim()) {
      errors['title'] = 'שם משימה הוא שדה חובה';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setTaskState(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddComment = (text: string) => {
    if (!text.trim()) return;
    
    setTaskState(prev => ({
      ...prev,
      comments: [...(prev.comments || []), {
        id: crypto.randomUUID(),
        text: text.trim(),
        createdAt: Timestamp.now(),
        createdBy: '',
      }]
    }));
  };

  const handleAddSubTask = (title: string, description: string) => {
    if (!title.trim()) return;

    setTaskState(prev => ({
      ...prev,
      subTasks: [...(prev.subTasks || []), {
        id: crypto.randomUUID(),
        title: title.trim(),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
        urgent: URGENCY_LEVELS.HIGH,
        status: TASK_STATUSES.IN_PROGRESS,
        dueDate: new Date(),
        completed: false,
      }]
    }));
  };

  return {
    taskState,
    formErrors,
    activeTab,
    setActiveTab,
    validateForm,
    handleInputChange,
    handleAddComment,
    handleAddSubTask,
  };
};
