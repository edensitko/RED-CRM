import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  InputAdornment,
  Chip,
  Divider,
  Skeleton,
  Snackbar,
  Alert,
  Stack,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  NoteAdd as NoteAddIcon,
} from '@mui/icons-material';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: 'חדש' | 'בתהליך' | 'הושלם' | 'לא רלוונטי';
  created: string;
  lastContact: string;
  notes: string;
}

const initialLeadState: Omit<Lead, 'id'> = {
  name: '',
  company: '',
  email: '',
  phone: '',
  source: '',
  status: 'חדש',
  created: '',
  lastContact: '',
  notes: '',
};

const Leads: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(initialLeadState);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchLeads();
    }
  }, [currentUser]);

  const fetchLeads = async () => {
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    try {
      setLoading(true);
      const leadsRef = collection(db, `users/${currentUser.uid}/leads`);
      const q = query(leadsRef, orderBy('created', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        leadsData.push({
          id: doc.id,
          ...doc.data() as Omit<Lead, 'id'>
        });
      });
      
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showSnackbar('שגיאה בטעינת הלידים', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    try {
      setLoading(true);
      const leadData = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        status: formData.status,
        notes: formData.notes,
        created: selectedLead ? formData.created : new Date().toISOString(),
        lastContact: formData.lastContact || new Date().toISOString()
      };
      
      if (selectedLead) {
        const leadDoc = doc(db, `users/${currentUser.uid}/leads/${selectedLead.id}`);
        await updateDoc(leadDoc, leadData);
        showSnackbar('הליד עודכן בהצלחה', 'success');
      } else {
        const leadsRef = collection(db, `users/${currentUser.uid}/leads`);
        await addDoc(leadsRef, leadData);
        showSnackbar('ליד חדש נוצר בהצלחה', 'success');
      }
      
      handleCloseDialog();
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      showSnackbar('שגיאה בשמירת הליד', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    if (window.confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) {
      try {
        setLoading(true);
        const leadDoc = doc(db, `users/${currentUser.uid}/leads/${id}`);
        await deleteDoc(leadDoc);
        showSnackbar('הליד נמחק בהצלחה', 'success');
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        showSnackbar('שגיאה במחיקת הליד', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredLeads = leads.filter((lead) =>
    Object.values(lead).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleOpenDialog = (lead: Lead | null = null) => {
    setSelectedLead(lead);
    setFormData(lead || initialLeadState);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLead(null);
    setFormData(initialLeadState);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveNote = async () => {
    if (!currentUser || !selectedLead) return;

    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/leads/${selectedLead.id}`), { notes: formData.notes });
      showSnackbar('הערה נשמרה בהצלחה');
    } catch (error) {
      console.error('Error saving note:', error);
      showSnackbar('שגיאה בשמירת ההערה', 'error');
    }
  };

  return (
    <ThemeProvider theme={createTheme({
      palette: {
        primary: {
          main: '#d32f2f',
        },
      },
    })}>
      <CssBaseline />
      <Box 
        component="div"
        sx={{ 
          p: 3, 
          direction: 'ltr',
          textAlign: 'left',
          background: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          לידים
        </Typography>

        <Paper 
          elevation={3} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3, 
            p: 2, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            flexDirection: 'row',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="חפש לידים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              mr: 2,
              '& .MuiInputBase-root': {
                flexDirection: 'row',
              },
              '& .MuiInputAdornment-root': {
                marginLeft: 'auto',
                marginRight: 0,
              }
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
            sx={{ 
              ml: 2,
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            ליד חדש
          </Button>
        </Paper>

        {loading ? (
          <List>
            {[...Array(6)].map((_, index) => (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <List>
            {filteredLeads.map((lead, index) => (
              <React.Fragment key={lead.id}>
                <ListItem
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" onClick={() => handleOpenDialog(lead)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(lead.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                  sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 2, 
                    mb: 1,
                    transition: 'background-color 0.3s, transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      width: 48,
                      height: 48,
                    }}>
                      {lead.name[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" color="text.primary">
                          {lead.name}
                        </Typography>
                        <Chip 
                          label={lead.status}
                          color={lead.status === 'הושלם' ? 'success' : lead.status === 'בתהליך' ? 'warning' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          component="span" 
                          sx={{ display: 'block' }}
                        >
                          {lead.company}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          component="span" 
                          sx={{ display: 'block' }}
                        >
                          {lead.email} | {lead.phone}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredLeads.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle color="primary" sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
            {selectedLead ? `ערוך את ${selectedLead.name}` : 'ליד חדש'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="שם"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="חברה"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="אימייל"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="טלפון"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="הערות"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  color="primary"
                />
              </Stack>
              <DialogActions sx={{ mt: 2 }}>
                <Button onClick={handleCloseDialog} color="secondary" variant="outlined">
                  ביטול
                </Button>
                <Button type="submit" color="primary" variant="contained">
                  שמור
                </Button>
                <Button onClick={handleSaveNote} color="primary" variant="outlined" startIcon={<NoteAddIcon />}>
                  שמור הערה
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Leads;
