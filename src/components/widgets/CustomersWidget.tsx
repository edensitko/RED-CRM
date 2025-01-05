import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, Divider, CircularProgress, ListItemAvatar, Avatar, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface CustomersWidgetProps {
  preview?: boolean;
  data?: any;
}

const CustomersWidget: React.FC<CustomersWidgetProps> = ({ preview = false, data }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (preview) {
      // Show sample data in preview mode
      setCustomers([
        {
          id: '1',
          name: 'John Doe',
          company: 'Tech Corp',
          email: 'john@techcorp.com',
          status: 'active'
        },
        {
          id: '2',
          name: 'Jane Smith',
          company: 'Design Co',
          email: 'jane@designco.com',
          status: 'new'
        }
      ]);
      setLoading(false);
      return;
    }

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        if (data?.customers) {
          setCustomers(data.customers);
        } else if (currentUser) {
          const customersRef = collection(db, `users/${currentUser.uid}/customers`);
          const q = query(customersRef, orderBy('createdAt', 'desc'), limit(5));
          const querySnapshot = await getDocs(q);
          
          const customers: any[] = [];
          querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() });
          });
          
          setCustomers(customers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [preview, data, currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        לקוחות אחרונים
      </Typography>
      <List>
        {customers.map((customer) => (
          <ListItem key={customer.id}>
            <ListItemAvatar>
              <Avatar>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={customer.name}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {customer.company}
                  </Typography>
                  <br />
                  <Typography component="span" variant="caption" color="text.secondary">
                    {customer.email}
                  </Typography>
                </>
              }
            />
            <Chip 
              label={customer.status === 'active' ? 'פעיל' : 'חדש'}
              color={customer.status === 'active' ? 'success' : 'info'}
              size="small"
              sx={{ ml: 1 }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default CustomersWidget;
