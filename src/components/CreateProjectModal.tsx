import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import { projectService } from '../services/firebase/projectService';
import { customerService } from '../services/firebase/customerService';
import { CustomerClass } from '../types/customer';
import { ProjectClass, ProjectStatus } from '../types/project';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: ProjectClass) => void;
  users: any[];
  userId: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  users,
  userId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: 0,
    customerId: '',
    assignedTo: [] as string[],
    status: 'לביצוע' as ProjectStatus,
    startDate: '',
    endDate: '',
  });

  const [customers, setCustomers] = useState<CustomerClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const activeCustomers = await customerService.getActiveCustomers(userId);
        setCustomers(activeCustomers);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
      }
    };

    fetchCustomers();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.customerId || !formData.startDate) {
        throw new Error('אנא מלא את כל השדות החובה');
      }

      const newProject: Partial<ProjectClass> = {
        ...formData,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
        isDeleted: false,
        tasks: [],
        userId: userId
      };

      const projectId = await projectService.createProject(newProject);
      
      if (projectId) {
        if (onProjectCreated) {
          onProjectCreated({ ...newProject, id: projectId } as ProjectClass);
        }
        onClose();
      } else {
        throw new Error('Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : 
              name === 'assignedTo' ? [value] : 
              value
    }));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-[#1e1e1e] rounded-lg w-full max-w-2xl overflow-hidden relative text-white" dir="rtl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold">
                פרויקט חדש
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    שם הפרויקט *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-400">
                    לקוח
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({ ...formData, customerId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-700 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.lastName} {customer.companyName ? `(${customer.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    משתמש אחראי
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo[0] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">בחר משתמש</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    תקציב
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    סטטוס
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
                  >
                    <option value="לביצוע" className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                      לביצוע
                    </option>
                    <option value="בתהליך" className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                      בתהליך
                    </option>
                    <option value="הושלם" className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                      הושלם
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <div className={`w-2 h-2 rounded-full ${
                      formData.status === 'לביצוע' ? 'bg-red-400' :
                      formData.status === 'בתהליך' ? 'bg-yellow-400' :
                      'bg-emerald-400'
                    }`}></div>
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    תאריך התחלה *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    תאריך סיום
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    min={formData.startDate}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  תיאור
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      יוצר פרויקט...
                    </>
                  ) : (
                    'צור פרויקט'
                  )}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateProjectModal;
