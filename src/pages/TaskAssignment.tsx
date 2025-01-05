import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'לביצוע' | 'בתהליך' | 'הושלם';
  priority: 'נמוכה' | 'בינונית' | 'גבוהה';
  dueDate: string;
  assignedTo: string;
  customerId?: string;
  dealId?: string;
  createdAt: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
}

const TaskAssignment: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'created'>('all');

  useEffect(() => {
    const db = getDatabase();

    // Fetch users
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData: User[] = [];
        snapshot.forEach((child) => {
          usersData.push({ id: child.key, ...child.val() });
        });
        setUsers(usersData);
      }
    });

    // Fetch tasks
    const tasksRef = ref(db, 'tasks');
    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData: Task[] = [];
        snapshot.forEach((child) => {
          tasksData.push({ id: child.key, ...child.val() });
        });
        setTasks(tasksData);

        // Fetch comments for each task
        tasksData.forEach((task) => {
          const commentsRef = ref(db, `taskComments/${task.id}`);
          onValue(commentsRef, (commentsSnapshot) => {
            if (commentsSnapshot.exists()) {
              const commentsData: Comment[] = [];
              commentsSnapshot.forEach((commentChild) => {
                commentsData.push({ id: commentChild.key, ...commentChild.val() });
              });
              setComments(prev => ({ ...prev, [task.id]: commentsData }));
            }
          });
        });
      }
    });

    return () => {
      unsubscribeTasks();
    };
  }, [currentUser, filter]);

  const handleCreateTask = async () => {
    if (currentUser) {
      const taskData = {
        ...currentTask,
        id: Date.now().toString(),
        createdAt: Date.now(),
        status: currentTask.status || 'לביצוע',
      };

      const db = getDatabase();
      if (currentTask.id) {
        const { id, ...updateData } = taskData;
        await update(ref(db, `tasks/${id}`), updateData);
      } else {
        await push(ref(db, 'tasks'), taskData);
      }

      setIsModalOpen(false);
      setCurrentTask({});
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const db = getDatabase();
    await update(ref(db, `tasks/${taskId}`), { status: newStatus });
  };

  const handleAddComment = async (taskId: string) => {
    if (newComment.trim() && currentUser) {
      const db = getDatabase();
      const comment: Comment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || '',
        content: newComment.trim(),
        timestamp: Date.now(),
      };

      await push(ref(db, `taskComments/${taskId}`), comment);
      setNewComment('');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      const db = getDatabase();
      await remove(ref(db, `tasks/${taskId}`));
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'גבוהה':
        return 'text-red-600 bg-red-100';
      case 'בינונית':
        return 'text-yellow-600 bg-yellow-100';
      case 'נמוכה':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'הושלם':
        return 'text-green-600 bg-green-100';
      case 'בתהליך':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === 'all') return true;
      if (filter === 'assigned') return task.assignedTo === currentUser?.uid;
      return false;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">ניהול משימות</h1>
          <p className="mt-2 text-sm text-gray-700">
            ניהול וחלוקת משימות בין עובדי החברה
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
          <button
            onClick={() => {
              setCurrentTask({});
              setIsModalOpen(true);
            }}
            className=" direction-rtl inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto "
          >
            משימה חדשה
          </button>
        </div>
      </div>

      <div className="flex space-x-4 rtl:space-x-reverse">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          כל המשימות
        </button>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'assigned'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          משימות שהוקצו לי
        </button>
        <button
          onClick={() => setFilter('created')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'created'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          משימות שיצרתי
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => {
                    setCurrentTask(task);
                    setIsModalOpen(true);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-500">{task.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority === 'גבוהה'
                    ? 'גבוהה'
                    : task.priority === 'בינונית'
                    ? 'בינונית'
                    : 'נמוכה'}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status === 'הושלם'
                    ? 'הושלם'
                    : task.status === 'בתהליך'
                    ? 'בתהליך'
                    : 'לביצוע'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(task.dueDate).toLocaleDateString('he-IL')}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700">נוצר ב-</div>
              <div className="mt-1 text-sm text-gray-500">
                {new Date(task.createdAt).toLocaleDateString('he-IL')}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700">הוקצה ל:</div>
              <div className="mt-1 text-sm text-gray-500">
                {users.find((u) => u.id === task.assignedTo)?.displayName ||
                  users.find((u) => u.id === task.assignedTo)?.email}
              </div>
            </div>

            {comments[task.id] && comments[task.id].length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  תגובות:
                </div>
                <div className="space-y-2">
                  {comments[task.id].map((comment, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {comment.userName}
                      </div>
                      <div className="text-gray-500">{comment.content}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(comment.timestamp).toLocaleString('he-IL')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <input
                  type="text"
                  placeholder="הוסף תגובה..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                />
                <button
                  onClick={() => handleAddComment(task.id)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  שלח
                </button>
              </div>
            </div>

            {task.assignedTo === currentUser?.uid && (
              <div className="mt-4">
                <select
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(task.id, e.target.value as Task['status'])
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                >
                  <option value="לביצוע">לביצוע</option>
                  <option value="בתהליך">בתהליך</option>
                  <option value="הושלם">הושלם</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    כותרת
                  </label>
                  <input
                    type="text"
                    value={currentTask.title || ''}
                    onChange={(e) =>
                      setCurrentTask({ ...currentTask, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תיאור
                  </label>
                  <textarea
                    value={currentTask.description || ''}
                    onChange={(e) =>
                      setCurrentTask({
                        ...currentTask,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    הקצה ל
                  </label>
                  <select
                    value={currentTask.assignedTo || ''}
                    onChange={(e) =>
                      setCurrentTask({
                        ...currentTask,
                        assignedTo: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">בחר עובד</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    עדיפות
                  </label>
                  <select
                    value={currentTask.priority || 'בינונית'}
                    onChange={(e) =>
                      setCurrentTask({
                        ...currentTask,
                        priority: e.target.value as Task['priority'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="נמוכה">נמוכה</option>
                    <option value="בינונית">בינונית</option>
                    <option value="גבוהה">גבוהה</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תאריך יעד
                  </label>
                  <input
                    type="date"
                    value={currentTask.dueDate || ''}
                    onChange={(e) =>
                      setCurrentTask({ ...currentTask, dueDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleCreateTask}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    {currentTask.id ? 'עדכן' : 'צור'} משימה
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAssignment;
