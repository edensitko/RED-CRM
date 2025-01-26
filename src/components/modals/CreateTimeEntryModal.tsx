import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useTimeTracking } from '../../contexts/TimeTrackingContext';
import { useAuth } from '../../contexts/AuthContext';
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">הוספת דיווח זמן חדש</h2>
              <button
                onClick={onClose}
                className="bg-[#ec5252] hover:bg-red-500/30 text-white p-2 rounded-full transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4" dir="rtl">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  זמן התחלה
                </label>
                <div className="text-gray-300">
                  {startTime.toLocaleTimeString('he-IL')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  זמן סיום
                </label>
                <div className="text-gray-300">
                  {endTime.toLocaleTimeString('he-IL')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  קטגוריה
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-[#2a2a2a] border-gray-800 text-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  תיאור
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-[#2a2a2a] border-gray-800 text-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="תאר את העבודה שביצעת..."
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <div className="flex justify-end pt-4 ">
                <button
                  type="button"
                  onClick={onClose}
                  className="m-2 px-4 py-2 bg-[#1a1a1a] text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`m-2 px-4 py-2 bg-[#ec5252] text-white rounded-lg ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/30'
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
