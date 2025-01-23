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
  SvgIcon,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  HourglassEmpty as HourglassEmptyIcon,
  NewReleases as NewReleasesIcon,
  ContactMail as ContactMailIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Notes,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { customerService } from '../services/firebase/customerService';
import { projectService } from '../services/firebase/projectService';
import { taskService } from '../services/firebase/taskService';
import {  Project, Task } from '../types/schemas';
import { useAuth } from '../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { CustomerClass } from '../types/customer';
import { 
  collection, 
  query, 
  where,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import ItemModal from '../components/modals/ItemModal';
import CustomerDetails from '../components/CustomerDetails';
import StyledSelect from '../components/StyledSelect';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';
import { format, subDays, subMonths, parseISO, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { heIL } from '@mui/x-date-pickers/locales';

const CUSTOMERS_COLLECTION = 'Customers';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const rtlTheme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
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
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderRadius: 3,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          backgroundColor: '#141414',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: 3,
            direction: 'rtl',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderRadius: 3,
          transition: 'background-color 0.3s',
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          },
        },
      },
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#ef4444',
    },
    secondary: {
      main: '#64748b',
    },
    background: {
      default: '#0A0A0A',
      paper: '#141414',
    },
    text: {
      primary: '#ffffff',
    },
  },
});

import { styled } from '@mui/material/styles';
import { FaBuilding, FaInfoCircle, FaLink, FaUser, FaTimes, Fa500Px, FaPlus } from 'react-icons/fa';

const AnimatedDialog = styled(Dialog)`
  & .MuiDialog-paper {
    direction: rtl;
    background-color: #141414;
    border-radius: 12px;
    padding: 0;
    max-width: 1000px;
    width: 100%;
    margin: 16px;
  }
`;

const TabPanel = styled(Box)`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 24px;
  margin-top: 16px;
`;

const StyledTab = styled(Tab)`
  color: #ffffff;
  &.Mui-selected {
    color: #ff1744;
  }
`;

// Status configurations
type StatusConfigType = {
  [key: string]: {
    color: 'default' | 'success' | 'error' | 'warning' | 'primary' | 'secondary' | 'info';
    icon: React.ComponentType;
  };
};

const statusConfig: StatusConfigType = {
  'פעיל': {
    color: 'success',
    icon: CheckCircleIcon,
  },
  'לא פעיל': {
    color: 'error',
    icon: CancelIcon,
  },
  'בהמתנה': {
    color: 'warning',
    icon: HourglassEmptyIcon,
  },
  'חדש': {
    color: 'info',
    icon: NewReleasesIcon,
  },
};

const priorityConfig = {
  high: {
    color: '#f44336',
    icon: ErrorIcon,
    backgroundColor: '#ffebee',
    label: 'דחוף'
  },
  medium: {
    color: '#ff9800',
    icon: WarningIcon,
    backgroundColor: '#fff3e0',
    label: 'בינוני'
  },
  low: {
    color: '#4caf50',
    icon: CheckCircleIcon,
    backgroundColor: '#e8f5e9',
    label: 'רגיל'
  }
};

const columns = [
  { id: 'firstName', label: 'שם פרטי' },
  { id: 'lastName', label: 'שם משפחה' },
  { id: 'email', label: 'אימייל' },
  { id: 'phone', label: 'טלפון' },
  { id: 'companyName', label: 'חברה' },
  { id: 'status', label: 'סטטוס' },
  { id: 'source', label: 'מקור' },
  { id: 'annualRevenue', label: 'הכנסה שנתית' },
  { id: 'lastContact', label: 'קשר אחרון' },
];

const Customers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerClass[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerClass[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof CustomerClass | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerClass | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
  id:'',
  assignedTo: [],
  Balance: 0,
  ComeFrom: '',
  Comments: [],
  CompanyName:'',
  CreatedBy: '',
  createdAt: '',
  Email: '',
  IsDeleted: false,
  LastName: '',
  Links: [],
  Name: '',
  Phone: 0,
  Projects: [],
  Status: "פעיל" ,
  Tags: [],
  Tasks: [],
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [statistics, setStatistics] = useState({
    totalCustomers: 0,
    newLastWeek: 0,
    newLastMonth: 0,
    totalBalance: 0,
    expectedBalance: 0,
    customersByStatus: [] as { name: string; value: number }[],
    customersBySource: [] as { name: string; value: number }[],
    revenueData: [] as { date: string; amount: number }[],
    growthData: [] as { date: string; customers: number }[]
  });

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [dateRangeType, setDateRangeType] = useState<'week' | 'month' | 'custom'>('week');

  const handleAddCustomer = async (customer: CustomerClass) => {
    try {
      const newCustomer = {
        ...customer,
        id: uuidv4(), // Generate new ID for new customer
        CreatedBy: user?.uid,
        IsDeleted: false,
        createdAt: new Date().toISOString(),
      };
      await customerService.createCustomer(newCustomer);
      showSnackbar('הלקוח נוסף בהצלחה');
    } catch (error) {
      console.error('Error adding customer:', error);
      showSnackbar('שגיאה בהוספת הלקוח', 'error');
    }
  };

  const handleEditCustomer = async (customer: CustomerClass) => {
    try {
      const updatedCustomer = {
        ...customer,
        updatedAt: new Date().toISOString(),
      };
      await customerService.updateCustomer(customer.id, updatedCustomer);
      showSnackbar('הלקוח עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating customer:', error);
      showSnackbar('שגיאה בעדכון הלקוח', 'error');
    }
  };

  const handleEditClick = (customer: CustomerClass) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleAddNewCustomer = () => {
    setIsAddingNew(true);
  };

  useEffect(() => {
    console.log('Checking Firebase connection...');
    console.log('Firebase app initialized:', !!db);
    console.log('Auth state:', { 
      user: user?.uid,
      isAuthenticated: !!user 
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up customers listener');
    const customersRef = collection(db, CUSTOMERS_COLLECTION);
    const q = query(
      customersRef,
      where('IsDeleted', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomerClass[];
      
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      setLoading(false);
    }, (error) => {
      console.error('Error in customers snapshot:', error);
      showSnackbar('שגיאה בטעינת הלקוחות', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    if (dateRangeType === 'week') {
      startDate = startOfDay(subDays(now, 7));
    } else if (dateRangeType === 'month') {
      startDate = startOfDay(subMonths(now, 1));
    } else {
      startDate = dateRange[0] ? startOfDay(dateRange[0]) : startOfDay(subDays(now, 7));
      endDate = dateRange[1] ? endOfDay(dateRange[1]) : endOfDay(now);
    }

    const newStats = {
      totalCustomers: customers.length,
      newLastWeek: customers.filter(c => {
        const date = parseISO(c.createdAt);
        return date >= startDate && date <= endDate;
      }).length,
      newLastMonth: customers.filter(c => parseISO(c.createdAt) > startDate).length,
      totalBalance: customers.reduce((sum, c) => sum + (c.Balance || 0), 0),
      expectedBalance: customers.reduce((sum, c) => sum + (c.Balance || 0), 0),
      customersByStatus: Object.entries(
        customers.reduce((acc, customer) => {
          acc[customer.Status] = (acc[customer.Status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value })),
      customersBySource: Object.entries(
        customers.reduce((acc, customer) => {
          acc[customer.ComeFrom || 'אחר'] = (acc[customer.ComeFrom || 'אחר'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value })),
      revenueData: Array.from({ length: 7 }).map((_, i) => ({
        date: format(subDays(endDate, 6 - i), 'MM/dd'),
        amount: Math.floor(Math.random() * 10000)
      })),
      growthData: Array.from({ length: 7 }).map((_, i) => ({
        date: format(subDays(endDate, 6 - i), 'MM/dd'),
        customers: Math.floor(Math.random() * 100)
      }))
    };

    setStatistics(newStats);
  }, [customers, dateRangeType, dateRange]);

  useEffect(() => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((customer) =>
        Object.entries(customer).some(([_, value]) =>
          value !== null && value !== undefined ? value.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false
        )
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((customer) => customer.Status === filterStatus);
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

  const handleSort = (column: keyof CustomerClass) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.Name || !formData.LastName || !formData.Email || !formData.Phone) {
      showSnackbar('נא למלא את כל השדות החובה', 'error');
      return;
    }

    try {
      setLoading(true);
      const timestamp = Timestamp.now();
      
      const customerData = {
        ...formData,
        id: selectedCustomer?.id || uuidv4(),
        userId: user.uid,
        createdBy: selectedCustomer ? selectedCustomer.CreatedBy : user.uid,
        updatedBy: user.uid,
        createdAt: selectedCustomer ? 
          (typeof selectedCustomer.createdAt === 'object' && selectedCustomer.createdAt !== null && 'toDate' in selectedCustomer.createdAt ? 
            selectedCustomer.createdAt : 
            timestamp) :
          timestamp,
        updatedAt: timestamp,
        isDeleted: false,
        status: formData.Status || 'פעיל',
        tags: formData.Tags || [],
      };

      const customersRef = collection(db, CUSTOMERS_COLLECTION);
      
      if (selectedCustomer) {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, selectedCustomer.id);
        await updateDoc(customerRef, {
          ...customerData,
          id: selectedCustomer.id,
        });
        console.log('Customer updated successfully');
        showSnackbar('הלקוח עודכן בהצלחה');
      } else {
        await addDoc(customersRef, customerData);
        console.log('New customer created successfully');
        showSnackbar('לקוח חדש נוצר בהצלחה');
      }

      setIsAddingNew(false);
      setIsEditModalOpen(false);
      setSelectedCustomer(undefined);
      setFormData({
        id:'',
  assignedTo: [],
  Balance: 0,
  ComeFrom: '',
  Comments: [],
  CompanyName:'',
  CreatedBy: '',
  createdAt: '',
  Email: '',
  IsDeleted: false,
  LastName: '',
  Links: [],
  Name: '',
  Phone: 0,
  Projects: [],
  Status: "פעיל" ,
  Tags: [],
  Tasks: [],
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      showSnackbar('שגיאה בשמירת הלקוח', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (event: React.FormEvent, updatedItem: CustomerClass) => {
    event.preventDefault();
    const validStatuses = ["פעיל", "לא פעיל", "בטיפול"] as const;
    if (!validStatuses.includes(updatedItem.Status as any)) {
      console.error('Invalid status value:', updatedItem.Status);
      return;
    }
    setFormData({
      ...formData,
      Status: updatedItem.Status as "פעיל" | "לא פעיל" | "בטיפול"
    });
    setCustomers((prevCustomers) => {
      return prevCustomers.map((customer) => {
        if (customer.id === updatedItem.id) {
          return {
            ...customer,
            ...updatedItem,
            status: updatedItem.Status as "פעיל" | "לא פעיל" | "בטיפול"
          };
        }
        return customer;
      });
    });
    handleSubmit(event);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;

    try {
      setLoading(true);
      await customerService.deleteCustomer(id, user.uid);
      showSnackbar('הלקוח נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting customer:', error);
      showSnackbar('שגיאה במחיקת הלקוח', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewDialog = (customer: CustomerClass) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCustomerClick = (customer: CustomerClass) => {
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(undefined);
    } else {
      setSelectedCustomer(customer);
    }
  };

  const renderCustomerDetails = (customer: CustomerClass) => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
        {customer.name} {customer.lastName}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" component="p">
          <span style={{ fontWeight: 'bold' }}>דוא״ל:</span> {customer.Email}
        </Typography>
        <Typography variant="body1" component="p">
          <span style={{ fontWeight: 'bold' }}>טלפון:</span> {customer.Phone}
        </Typography>
        <Typography variant="body1" component="p">
        </Typography>
        <Typography variant="body1" component="p">
          <span style={{ fontWeight: 'bold' }}>סטטוס:</span> {customer.Status}
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" component="p">
          <span style={{ fontWeight: 'bold' }}>מקור:</span> {customer.ComeFrom}
        </Typography>
      </Box>
    </Box>
  );

  const renderCellContent = (value: any) => {
    if (!value) return '';
    
    if (value instanceof Date) {
      return value.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return Object.values(value).filter(Boolean).join(', ');
    }
    
    return value;
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={rtlTheme}>
        <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-[#ec5252] flex items-center gap-2">
                <FaUser />
                לקוחות
              </h1>
            </div>


            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center justify-center bg-[#ec5252] hover:bg-red-700 text-white rounded-md px-4 py-2 transition-colors duration-300 gap-2"
            >
              <FaPlus />
              הוסף לקוח
            </button>
          </div>
          
        
      
          <Box sx={{ p: 3 }}>
            {/* Date Range Selection */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={dateRangeType}
                exclusive
                onChange={(e, value) => value && setDateRangeType(value)}
                sx={{
                  '& .MuiToggleButton-root': {
                    color: '#ffffff',
                    borderColor: '#ec5252',
                    '&.Mui-selected': {
                      backgroundColor: '#ec5252',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#ec5252',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#ec5252',
                    },
                  },
                }}
              >
                <ToggleButton value="week">
                  שבוע אחרון
                </ToggleButton>
                <ToggleButton value="month">
                  חודש אחרון
                </ToggleButton>
                <ToggleButton value="custom">
                  טווח תאריכים
                </ToggleButton>
              </ToggleButtonGroup>

              {dateRangeType === 'custom' && (
                <LocalizationProvider 
                  dateAdapter={AdapterDateFns}
                  localeText={heIL.components.MuiLocalizationProvider.defaultProps.localeText}
                >
                  <DateRangePicker
                    value={dateRange}
                    onChange={(newValue) => {
                      setDateRange(newValue);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#141414',
                            borderRadius: '8px',
                            color: '#e1e1e1',
                            '& input': {
                              textAlign: 'left',
                            },
                            '& fieldset': {
                              borderColor: '#2a2a2a',
                            },
                            '&:hover fieldset': {
                              borderColor: '#404040',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2563eb',
                            },
                          },
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              )}
            </Box>

            {/* Statistics Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 120,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', color: '#808080' }}>
                    {dateRangeType === 'week' ? 'לקוחות חדשים (שבוע אחרון)' :
                     dateRangeType === 'month' ? 'לקוחות חדשים (חודש אחרון)' :
                     'לקוחות חדשים (טווח נבחר)'}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mt: 'auto', fontWeight: 'bold' }}>
                    {statistics.newLastWeek}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 120,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', color: '#808080' }}>
                    סך לקוחות פעילים
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mt: 'auto', fontWeight: 'bold' }}>
                    {statistics.customersByStatus.find(s => s.name === 'פעיל')?.value || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 120,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', color: '#808080' }}>
                    {dateRangeType === 'week' ? 'הכנסות (שבוע אחרון)' :
                     dateRangeType === 'month' ? 'הכנסות (חודש אחרון)' :
                     'הכנסות (טווח נבחר)'}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mt: 'auto', fontWeight: 'bold' }}>
                    ₪{statistics.totalBalance.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 120,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', color: '#808080' }}>
                    יתרה צפויה
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mt: 'auto', fontWeight: 'bold' }}>
                    ₪{statistics.expectedBalance.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={8} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 200,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div">
                    הכנסות בשבוע האחרון
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statistics.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" stroke="#e1e1e1" />
                      <YAxis stroke="#e1e1e1" />
                      <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', color: '#e1e1e1' }} />
                      <Line type="monotone" dataKey="amount" stroke="#ec5252" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 200,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div">
                    התפלגות סטטוס לקוחות
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.customersByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        fill="#2563eb"
                      >
                        {statistics.customersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['green', 'yellow', 'red'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ec5252', color: '#e1e1e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 200,
                    bgcolor: '#1a1a1a',
                    color: '#e1e1e1',
                    borderRadius: '12px',
                  }}
                >
                  <Typography variant="h6" gutterBottom component="div">
                    התפלגות מקור לקוחות
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.customersBySource}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        fill="#2563eb"
                      >
                        {statistics.customersBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#ec5252', 'blue', 'yellow', 'brown', 'pink'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ec5252', color: '#e1e1e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap', 
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
              }}
            
              >
              <TextField
                dir="ltr"
                sx={{
                  width: '400px',
                  flexGrow: 1, 
                  maxWidth: 600,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#141414',
                    borderRadius: '8px',
                    direction: 'rtl',
                    textAlign: 'left',
                    '& input': {
                      textAlign: 'left',
                    },
                    '& fieldset': {
                      borderColor: '#2a2a2a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#404040',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#e1e1e1',
                  },
                }}
                placeholder="חפש לקוחות..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (

                    <InputAdornment position="start" >
                      <SearchIcon sx={{ color: '#808080' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#2a2a2a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#404040',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ef4444',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#808080',
                    '&.Mui-focused': {
                      color: '#ef4444',
                    },
                  },
                }}
              >
                <InputLabel>סנן לפי סטטוס</InputLabel>
                <StyledSelect
                  value={filterStatus || ''}
                  label="סנן לפי סטטוס"
                  onSelect={(value) => setFilterStatus(value)}
                >
                  <MenuItem value="פעיל">פעיל</MenuItem>
                  <MenuItem value="לא פעיל">לא פעיל</MenuItem>
                  <MenuItem value="בטיפול">בטיפול</MenuItem>
                </StyledSelect>
              </FormControl>
            </Box>

            <Box sx={{ direction: 'rtl' }}>
              <TableContainer component={Paper} sx={{
                backgroundColor: '#141414',
                borderRadius: '12px',
                border: '1px solid #2a2a2a',
                '& .MuiTableCell-root': {
                  borderColor: '#2a2a2a',
                  color: '#e1e1e1',
                  textAlign: 'right',
                  padding: '16px',
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: '#1a1a1a',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease-in-out',
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  backgroundColor: '#1a1a1a',
                  color: '#808080',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                },
                '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': {
                  borderBottom: 'none',
                },
                '& .MuiChip-root': {
                  borderRadius: '6px',
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 'medium',
                },
                '& .MuiIconButton-root': {
                  color: '#808080',
                  padding: '6px',
                  '&:hover': {
                    backgroundColor: '#2a2a2a',
                    color: '#e1e1e1',
                  },
                },
              }}>
                <Table dir="rtl">
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSort('name')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        שם {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell onClick={() => handleSort('lastName')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        שם משפחה {sortColumn === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell onClick={() => handleSort('Email')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        דוא״ל {sortColumn === 'Email' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell onClick={() => handleSort('Phone')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        טלפון {sortColumn === 'Phone' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                   
                      <TableCell onClick={() => handleSort('Status')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        סטטוס {sortColumn === 'Status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell onClick={() => handleSort('ComeFrom')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        מקור {sortColumn === 'ComeFrom' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell onClick={() => handleSort('Balance')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        תקציב {sortColumn === 'Balance' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredCustomers.map((customer, index) => (
                      <TableRow 
                        key={`customer-${customer.id}-${index}`}
                        onClick={() => handleCustomerClick(customer)}
                        sx={{ '&:hover': { backgroundColor: '#2a2a2a' } }}
                      >
                        <TableCell style={{ textAlign: 'right' }}>{customer.name}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{customer.lastName}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{customer.Email}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{customer.Phone}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <Chip 
                            label={customer.Status}
                            color={statusConfig[customer.Status]?.color || 'default'}
                            size="small"
                            sx={{
                              '& .MuiChip-label': {
                                padding: '0 8px',
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{customer.ComeFrom}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>₪{customer.Balance?.toLocaleString() || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {(selectedCustomer || isAddingNew) && (
              <CustomerDetails
                customer={selectedCustomer}
                isNew={isAddingNew}
                onClose={() => {
                  setSelectedCustomer(undefined);
                  setIsAddingNew(false);
                }}
                onSubmit={async (customer) => {
                  if (isAddingNew) {
                    await handleAddCustomer(customer);
                  } else {
                    await handleEditCustomer(customer);
                  }
                  setSelectedCustomer(undefined);
                  setIsAddingNew(false);
                }}
                users={users}
              />
            )}

            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
            >
              <Alert
                onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
                severity={snackbar.severity}
                sx={{ width: '100%' }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </div>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default Customers;
