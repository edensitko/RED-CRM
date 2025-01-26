import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import CreateTaskModal from './CreateTaskModal';
import { User, Project, Task } from '../../types/schemas';
import { CustomerClass } from '../../types/schemas'

import { taskService } from '../../services/firebase/taskService';
import { toast } from 'react-toastify';

interface CreateTaskProps {
  users: User[];
  projects: Project[];
  customers: CustomerClass[];
  className?: string;
}

const CreateTask: React.FC<CreateTaskProps> = ({
  users,
  projects,
  customers,
  className = ''

}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateTask = async (task: Task) => {
    try {
      await taskService.createTask(task);
      setIsModalOpen(false);
      toast.success('המשימה נוצרה בהצלחה');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('שגיאה ביצירת המשימה');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 transition-colors duration-300 ${className}`}
      >
        <FaPlus className="mr-2" />
        <span>יצירת משימה חדשה</span>
      </button>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
        projects={projects}
        customers={customers}
      />
    </>
  );
};

export default CreateTask;
