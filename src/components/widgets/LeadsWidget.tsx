import React from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, Divider } from '@mui/material';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const LeadsWidget: React.FC = () => {
  const [recentLeads, setRecentLeads] = React.useState<any[]>([]);
  const { currentUser } = useAuth();

  React.useEffect(() => {
    const fetchRecentLeads = async () => {
      if (!currentUser) return;
      
      try {
        const leadsRef = collection(db, `users/${currentUser.uid}/leads`);
        const q = query(leadsRef, orderBy('created', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        
        const leads: any[] = [];
        querySnapshot.forEach((doc) => {
          leads.push({ id: doc.id, ...doc.data() });
        });
        
        setRecentLeads(leads);
      } catch (error) {
        console.error('Error fetching recent leads:', error);
      }
    };

    fetchRecentLeads();
  }, [currentUser]);

  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        לידים אחרונים
      </Typography>
      <List>
        {recentLeads.map((lead, index) => (
          <React.Fragment key={lead.id}>
            <ListItem>
              <ListItemText
                primary={lead.name}
                secondary={`${lead.company} | ${new Date(lead.created).toLocaleDateString('he-IL')}`}
              />
            </ListItem>
            {index < recentLeads.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default LeadsWidget;
