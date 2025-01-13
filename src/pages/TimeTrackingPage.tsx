import React, { useState, useEffect } from 'react';
import { useTimeTracking } from '../contexts/TimeTrackingContext';
import { CreateTimeEntryModal } from '../components/CreateTimeEntryModal';
import { FaPlay, FaStop, FaClock, FaFilter } from 'react-icons/fa';

export const TimeTrackingPage: React.FC = () => {
  const {
    timeEntries,
    isTimerRunning,
    startTimer,
    stopTimer,
    timerStartTime,
    categories
  } = useTimeTracking();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [modalStartTime, setModalStartTime] = useState<Date>(new Date());
  const [modalEndTime, setModalEndTime] = useState<Date>(new Date());

  // Update elapsed time
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isTimerRunning && timerStartTime) {
      intervalId = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - timerStartTime.getTime()) / 1000
        );
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTimerRunning, timerStartTime]);

  const handleStartTimer = () => {
    startTimer();
  };

  const handleStopTimer = () => {
    if (timerStartTime) {
      setModalStartTime(timerStartTime);
      setModalEndTime(new Date());
      setIsModalOpen(true);
    }
    stopTimer();
    setElapsedTime(0);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredEntries = selectedCategory
    ? timeEntries.filter((entry) => entry.category === selectedCategory)
    : timeEntries;

  return (
    <div className="container mx-auto p-4 max-w-4xl" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">דיווחי זמן</h1>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-3xl font-mono">{formatTime(elapsedTime)}</div>
            {!isTimerRunning ? (
              <button
                onClick={handleStartTimer}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
              >
                <FaPlay />
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
              >
                <FaStop />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center mb-6">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-8 pr-4 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 appearance-none"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FaFilter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{entry.category}</h3>
                  <p className="text-sm text-gray-600">{entry.description}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTime(entry.duration)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FaClock className="mr-1" />
                <span>
                  {new Date(entry.startTime.toDate()).toLocaleTimeString('he-IL')} -{' '}
                  {new Date(entry.endTime.toDate()).toLocaleTimeString('he-IL')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateTimeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        startTime={modalStartTime}
        endTime={modalEndTime}
      />
    </div>
  );
};
