import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
  Chip,
  Skeleton,
  Snackbar,
  Alert,
  Stack,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Person as PersonIcon,
  NoteAdd as NoteAddIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { customerService } from '../services/firebase/customerService'; 
import { Customer } from '../types/schemas';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CUSTOMERS_COLLECTION = 'customers'; 

// LTR Theme with Red Palette
const ltrTheme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#d32f2f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff1744',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: [
      'Rubik',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderRadius: 12,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: 8,
            direction: 'ltr',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderRadius: 8,
          transition: 'background-color 0.3s',
          '&:hover': {
            backgroundColor: 'rgba(211, 47, 47, 0.08)',
          },
        },
      },
    },
  },
});

const Customers: React.FC = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Customer | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [formData, setFormData] = useState<Partial<Customer>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    status: 'פעיל',
    value: 0,
  });
  const [notes, setNotes] = useState<string>('');
  const [openNoteDialog, setOpenNoteDialog] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((customer) =>
        Object.values(customer).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((customer) => customer.status === filterStatus);
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterStatus, sortColumn, sortDirection]);

  const handleSort = (column: keyof Customer) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;

      // Fetch all non-deleted customers
      const baseQuery = query(
        collection(db, CUSTOMERS_COLLECTION),
        where('isDeleted', '==', false)
      );
      
      const querySnapshot = await getDocs(baseQuery);
      const fetchedCustomers = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastContact: data.lastContact?.toDate() || null,
            contracts: data.contracts?.map((contract: any) => ({
              ...contract,
              startDate: contract.startDate?.toDate() || new Date(),
              endDate: contract.endDate?.toDate() || new Date(),
            })) || [],
            status: data.status || 'פעיל',
            isDeleted: data.isDeleted || false,
          } as Customer;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort in descending order after fetching

      setCustomers(fetchedCustomers);
      setFilteredCustomers(fetchedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showSnackbar('שגיאה בטעינת הלקוחות', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const customerData: Customer = {
        ...formData,
        id: selectedCustomer?.id || uuidv4(),
        createdBy: currentUser.uid,
        updatedBy: currentUser.uid,
        createdAt: selectedCustomer ? selectedCustomer.createdAt : new Date(),
        updatedAt: new Date(),
        lastContact: new Date(),
        contracts: [],
        status: 'פעיל',
        isDeleted: false,
      } as Customer;

      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, customerData);
        showSnackbar('הלקוח עודכן בהצלחה');
      } else {
        await customerService.createCustomer(customerData);
        showSnackbar('לקוח חדש נוצר בהצלחה');
      }

      fetchCustomers();
      setOpenEditDialog(false);
      setSelectedCustomer(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving customer:', error);
      showSnackbar('שגיאה בשמירת הלקוח', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      await customerService.deleteCustomer(id, currentUser.uid);
      await fetchCustomers();
      showSnackbar('הלקוח נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting customer:', error);
      showSnackbar('שגיאה במחיקת הלקוח', 'error');
    }
  };

  const handleOpenEditDialog = (customer?: Customer) => {
    setSelectedCustomer(customer || null);
    setFormData(customer || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      status: 'פעיל', 
      value: 0,
    });
    setOpenEditDialog(true);
  };

  const handleOpenViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenViewDialog(true);
    setOpenEditDialog(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setOpenEditDialog(true);
    setOpenViewDialog(false);
  };

  const handleSaveNote = async () => {
    if (!currentUser || !selectedCustomer) return;

    try {
      await customerService.updateCustomer(selectedCustomer.id, { notes });
      showSnackbar('הערה נשמרה בהצלחה');
    } catch (error) {
      console.error('Error saving note:', error);
      showSnackbar('שגיאה בשמירת ההערה', 'error');
    }
  };

  const handleOpenNoteDialog = () => {
    setOpenNoteDialog(true);
  };

  const handleCloseNoteDialog = () => {
    setOpenNoteDialog(false);
  };

  return (
    <ThemeProvider theme={ltrTheme}>
      <CssBaseline />
      <Box 
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{ 
          p: 3, 
          direction: 'ltr',
          textAlign: 'left',
          background: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          לקוחות
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
            label="חיפוש לקוחות"
            placeholder="חיפוש "
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
            startIcon={<AddIcon />} 
            onClick={() => handleOpenEditDialog()}
            sx={{ 
              ml: 2,
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            לקוח חדש
          </Button>
          <FormControl sx={{ ml: 2, minWidth: 150 }}>
            <InputLabel id="filter-status-label">הכל</InputLabel>
            <Select
              labelId="filter-status-label"
              id="filter-status"
              value={filterStatus}
              label="סטטוס"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">הכל </MenuItem>
              <MenuItem value="פעיל">פעיל</MenuItem>
              <MenuItem value="לא פעיל">לא פעיל</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {loading ? (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="customers table">
              <TableHead>
                <TableRow>
                  {['שם', 'חברה', 'אימייל', 'טלפון', 'סטטוס', 'תאריך יצירה', 'פעולות'].map((header) => (
                    <TableCell key={header}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(6)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(7)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="customers table">
              <TableHead>
                <TableRow>
                  {(['firstName', 'companyName', 'email', 'phone', 'status', 'createdAt'] as (keyof Customer)[]).map((column) => (
                    <TableCell key={column}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer' 
                        }} 
                        onClick={() => handleSort(column)}
                      >
                        {column === 'firstName' && 'שם'}
                        {column === 'companyName' && 'חברה'}
                        {column === 'email' && 'אימייל'}
                        {column === 'phone' && 'טלפון'}
                        {column === 'status' && 'סטטוס'}
                        {column === 'createdAt' && 'תאריך יצירה'}
                        {sortColumn === column && (
                          sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                    <TableCell>{customer.companyName}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status}
                        color={customer.status === 'פעיל' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{customer.createdAt.toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => handleOpenEditDialog(customer)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(customer.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
          maxWidth="sm" 
          fullWidth
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          sx={{
            '& .MuiDialog-paper': {
              direction: 'ltr',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              border: '1px solid #d32f2f',
            }
          }}
        >
          <DialogTitle color="primary" sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
            {selectedCustomer ? `ערוך את ${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'ערוך לקוח'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="שם פרטי"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    color="primary"
                  />
                  <TextField
                    fullWidth
                    label="שם משפחה"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    color="primary"
                  />
                </Stack>
                <TextField
                  fullWidth
                  label="חברה"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="אימייל"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="טלפון"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  color="primary"
                />
                <TextField
                  fullWidth
                  label="הערות"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={4}
                  color="primary"
                  onClick={handleOpenNoteDialog}
                />
              </Stack>
              <DialogActions sx={{ mt: 2 }}>
                <Button onClick={() => setOpenEditDialog(false)} color="secondary" variant="outlined">
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

        <Dialog 
          open={openNoteDialog} 
          onClose={handleCloseNoteDialog} 
          maxWidth="sm" 
          fullWidth
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          sx={{
            '& .MuiDialog-paper': {
              direction: 'ltr',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              border: '1px solid #d32f2f',
            }
          }}
        >
          <DialogTitle color="primary" sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
            הערות
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" color="text.secondary" sx={{ 
              direction: 'ltr', 
              textAlign: 'left',
              unicodeBidi: 'bidi-override'
            }}>
              {notes}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
            <Button onClick={handleCloseNoteDialog} color="secondary" variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}>
              סגור
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="sm" 
          fullWidth
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          sx={{
            '& .MuiDialog-paper': {
              direction: 'ltr',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              border: '1px solid #d32f2f',
            }
          }}
        >
          <DialogTitle color="primary" sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
            {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'פרטי לקוח'}
          </DialogTitle>
          <DialogContent>
            {selectedCustomer && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'primary.contrastText',
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  mb: 3,
                }}>
                  {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                </Avatar>
                <Typography variant="h6" color="text.primary" sx={{ mb: 1, textAlign: 'center' }}>
                  {selectedCustomer.companyName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
                  {selectedCustomer.email}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  {selectedCustomer.phone}
                </Typography>
                <Chip 
                  label={selectedCustomer.status === 'פעיל' ? 'פעיל' : 'לא פעיל'}
                  color={selectedCustomer.status === 'פעיל' ? 'success' : 'error'}
                  size="medium"
                  variant="outlined"
                  sx={{ mt: 2, mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'left', direction: 'ltr' }}>
                  הערות: {notes}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
            <Button onClick={() => setOpenViewDialog(false)} color="secondary" variant="outlined" sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}>
              סגור
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
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

export default Customers;
