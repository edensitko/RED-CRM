import { Timestamp } from 'firebase/firestore';

export const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleString('he-IL');
};

export const toTimestamp = (date: Date | string | null): Timestamp | null => {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return Timestamp.fromDate(dateObj);
};
