import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useTimeTracking } from '../contexts/TimeTrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date;
  endTime: Date;
}

export const CreateTimeEntryModal: React.FC<CreateTimeEntryModalProps> = ({
  isOpen,
  onClose,
  startTime,
  endTime
}) => {
  const { addTimeEntry, categories } = useTimeTracking();
  const { currentUser } = useAuth();
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setError('');

    try {
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      await addTimeEntry({
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        duration,
        category,
        description
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create time entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">הוספת דיווח זמן חדש</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4" dir="rtl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  זמן התחלה
                </label>
                <div className="text-gray-600">
                  {startTime.toLocaleTimeString('he-IL')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  זמן סיום
                </label>
                <div className="text-gray-600">
                  {endTime.toLocaleTimeString('he-IL')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  קטגוריה
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="תאר את העבודה שביצעת..."
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-red-500 text-white rounded-lg ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                  }`}
                >
                  שמור
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
