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
  Fade,
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
import { useAuth } from '../hooks/useAuth';
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

import { styled } from '@mui/material/styles';

const AnimatedDialog = styled(Dialog)`
  & .MuiDialog-paper {
    direction: ltr;
    text-align: center;
    background-color: #ffffff;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    border: 1px solid #d32f2f;
  }
`;

const Customers: React.FC = () => {
  const { user, signOut } = useAuth();
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
    source: '',
    notes: '',
    tags: [],
    lastContact: new Date(),
    website: '',
    industry: '',
    size: 'small',
    annualRevenue: 0,
    paymentTerms: '',
  });
  const [notes, setNotes] = useState<string>('');
  const [openNoteDialog, setOpenNoteDialog] = useState(false);

  useEffect(() => {
    console.log('Checking Firebase connection...');
    console.log('Firebase app initialized:', !!db);
    console.log('Auth state:', { 
      user: user?.uid,
      isAuthenticated: !!user 
    });
    fetchCustomers();
  }, [user]);

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
        const valueA = a[sortColumn] ?? '';
        const valueB = b[sortColumn] ?? '';
        
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
      if (!user) {
        console.log('No user found, returning early');
        return;
      }

      console.log('Fetching customers for user:', user.uid);
      
      // Use getAllCustomers to fetch all non-deleted customers
      const fetchedCustomers = await customerService.getAllCustomers(user.uid);
      console.log('Fetched customers:', fetchedCustomers.length);

      setCustomers(fetchedCustomers);
      setFilteredCustomers(fetchedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      showSnackbar('שגיאה בטעינת הלקוחות', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const customerData: Customer = {
        ...formData,
        id: selectedCustomer?.id || uuidv4(),
        userId: user.uid,  // Add this line
        createdBy: user.uid,
        updatedBy: user.uid,
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
    if (!user) return;

    try {
      await customerService.deleteCustomer(id, user.uid);
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
      source: '',
      notes: '',
      tags: [],
      lastContact: new Date(),
      website: '',
      industry: '',
      size: 'small',
      annualRevenue: 0,
      paymentTerms: '',
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
    if (!user || !selectedCustomer) return;

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
              mr: 2,
              backgroundColor: ltrTheme.palette.primary.main,
              '&:hover': {
                backgroundColor: ltrTheme.palette.primary.dark,
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
                  {([
                    'firstName',
                    'companyName',
                    'email',
                    'phone',
                    'status',
                    'industry',
                    'size',
                    'annualRevenue',
                    'website',
                    'createdAt'
                  ] as (keyof Customer)[]).map((column) => (
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
                        {column === 'industry' && 'תעשייה'}
                        {column === 'size' && 'גודל'}
                        {column === 'annualRevenue' && 'הכנסה שנתית'}
                        {column === 'website' && 'אתר'}
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
                    <TableCell>{customer.industry || '-'}</TableCell>
                    <TableCell>{customer.size || '-'}</TableCell>
                    <TableCell>{customer.annualRevenue?.toLocaleString() || '0'} ₪</TableCell>
                    <TableCell>
                      {customer.website ? (
                        <a href={customer.website} target="_blank" rel="noopener noreferrer">
                          {customer.website}
                        </a>
                      ) : '-'}
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

        {openEditDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <PersonIcon className="ml-4" /> 
                  {selectedCustomer ? 'ערוך לקוח' : 'צור לקוח חדש'}
                </h2>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpenEditDialog(false)}
                  className="text-red-500 hover:bg-red-500 hover:text-white rounded-full p-2 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם פרטי
                    </label>
                    <motion.input
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      placeholder="הכנס שם פרטי"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם משפחה
                    </label>
                    <motion.input
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      placeholder="הכנס שם משפחה"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      אימייל
                    </label>
                    <motion.input
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="הכנס כתובת אימייל"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      טלפון
                    </label>
                    <motion.input
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      placeholder="הכנס מספר טלפון"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    חברה
                  </label>
                  <motion.input
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="הכנס שם חברה"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הערות
                  </label>
                  <motion.textarea
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="הכנס הערות"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setOpenEditDialog(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    ביטול
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                  >
                    <span className="ml-2">✓</span> {selectedCustomer ? 'עדכן לקוח' : 'צור לקוח'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        <AnimatedDialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="sm" 
          fullWidth
          TransitionComponent={Fade}
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.3 }
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
        </AnimatedDialog>

        <AnimatedDialog 
          open={openNoteDialog} 
          onClose={handleCloseNoteDialog} 
          maxWidth="sm" 
          fullWidth
          TransitionComponent={Fade}
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.3 }
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
        </AnimatedDialog>

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
