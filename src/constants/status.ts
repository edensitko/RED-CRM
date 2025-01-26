export const TASK_STATUSES = {
  TODO: 'לביצוע',
  IN_PROGRESS: 'בתהליך',
  COMPLETED: 'הושלם'
} as const;

export const URGENCY_LEVELS = {
  LOW: 'נמוכה',
  MEDIUM: 'בינונית',
  HIGH: 'גבוהה'
} as const;

export const TABS = [
  { id: 'details', label: 'פרטי משימה' },
  { id: 'assignee', label: 'משתמש מוקצה' },
  { id: 'project', label: 'פרויקט' },
  { id: 'customer', label: 'לקוח' },
  { id: 'subtasks', label: 'משימות משנה' },
  { id: 'comments', label: 'הערות' },
] as const;
