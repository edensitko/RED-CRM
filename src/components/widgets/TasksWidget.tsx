import React from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, Divider, Chip, CircularProgress, ListItemIcon } from '@mui/material';
import { Assignment as TaskIcon, CheckCircle as CompletedIcon, Schedule as PendingIcon } from '@mui/icons-material';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface TasksWidgetProps {
  data?: any;
  loading?: boolean;
  error?: any;
  onRefresh?: () => void;
  settings?: Record<string, any>;
  preview?: boolean;
}

const previewTasks = [
  { id: '1', title: 'Follow up with client', status: 'pending', dueDate: new Date() },
  { id: '2', title: 'Review proposal', status: 'completed', dueDate: new Date() },
  { id: '3', title: 'Send invoice', status: 'pending', dueDate: new Date() },
];

const TasksWidget: React.FC<TasksWidgetProps> = ({ loading = false, preview = false }) => {
  const [recentTasks, setRecentTasks] = React.useState<any[]>([]);
  const { currentUser } = useAuth();

  React.useEffect(() => {
    const fetchRecentTasks = async () => {
      if (!currentUser) return;
      
      try {
        const tasksRef = collection(db, 'tasks');
        const q = query(
          tasksRef,
          where('userId', '==', currentUser.uid),
          where('status', '!=', 'completed'),
          orderBy('status'),
          orderBy('dueDate'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        
        const tasks: any[] = [];
        querySnapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() });
        });
        
        setRecentTasks(tasks);
      } catch (error) {
        console.error('Error fetching recent tasks:', error);
      }
    };

    fetchRecentTasks();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const tasks = preview ? previewTasks : recentTasks;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (preview) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" gutterBottom>
          Tasks Preview
        </Typography>
        <List dense>
          {tasks.map((task) => (
            <ListItem key={task.id} sx={{ opacity: 0.7 }}>
              <ListItemIcon>
                {task.status === 'completed' ? (
                  <CompletedIcon color="success" />
                ) : (
                  <PendingIcon color="warning" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={task.title}
                secondary={
                  <Chip
                    label={task.status}
                    size="small"
                    color={task.status === 'completed' ? 'success' : 'warning'}
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom align="right">
        משימות אחרונות
      </Typography>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem>
                <ListItemIcon>
                  {task.status === 'completed' ? (
                    <CompletedIcon color="success" />
                  ) : (
                    <PendingIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={task.title}
                  secondary={new Date(task.dueDate.toDate()).toLocaleDateString('he-IL')}
                  sx={{ textAlign: 'right' }}
                />
                <Chip
                  label={task.status === 'in_progress' ? 'בתהליך' : 'ממתין'}
                  color={getStatusColor(task.status) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
              </ListItem>
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="אין משימות פעילות"
              sx={{ textAlign: 'right' }}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default TasksWidget;
