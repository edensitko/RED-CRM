import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number; // in seconds
  category: string;
  description: string;
  createdAt: Timestamp;
}

interface ActiveTimer {
  isRunning: boolean;
  startTime: string | null;
  userId: string;
}

interface TimeTrackingContextType {
  timeEntries: TimeEntry[];
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  timerStartTime: Date | null;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => Promise<void>;
  categories: string[];
}

const TimeTrackingContext = createContext<TimeTrackingContextType | null>(null);

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};

export const TimeTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const { currentUser } = useAuth();
  
  const categories = [
    'פיתוח',
    'פגישות',
    'תכנון',
    'בדיקות',
    'תחזוקה',
    'אחר'
  ];

  // Load timer state from Firebase on mount
  useEffect(() => {
    const loadTimerState = async () => {
      if (!currentUser) return;

      try {
        const timerDocRef = doc(db, 'activeTimers', currentUser.uid);
        const timerDoc = await getDoc(timerDocRef);
        
        if (timerDoc.exists()) {
          const timerData = timerDoc.data() as ActiveTimer;
          if (timerData.isRunning && timerData.startTime) {
            setIsTimerRunning(true);
            setTimerStartTime(new Date(timerData.startTime));
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };

    loadTimerState();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const timeEntriesRef = collection(db, 'timeEntries');
    const timeEntriesQuery = query(
      timeEntriesRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(timeEntriesQuery, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeEntry[];
      setTimeEntries(entries);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const startTimer = async () => {
    if (!currentUser) return;

    const startTime = new Date();
    setIsTimerRunning(true);
    setTimerStartTime(startTime);

    // Save timer state to Firebase
    try {
      const timerDocRef = doc(db, 'activeTimers', currentUser.uid);
      await setDoc(timerDocRef, {
        isRunning: true,
        startTime: startTime.toISOString(),
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  };

  const stopTimer = async () => {
    if (!currentUser) return;

    setIsTimerRunning(false);

    // Clear timer state in Firebase
    try {
      const timerDocRef = doc(db, 'activeTimers', currentUser.uid);
      await setDoc(timerDocRef, {
        isRunning: false,
        startTime: null,
        userId: currentUser.uid
      });
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
  };

  const addTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'timeEntries'), {
        ...entry,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding time entry:', error);
      throw error;
    }
  };

  return (
    <TimeTrackingContext.Provider
      value={{
        timeEntries,
        isTimerRunning,
        startTimer,
        stopTimer,
        timerStartTime,
        addTimeEntry,
        categories
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};
