import React, { useState, useEffect } from 'react';
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
  ThemeProvider,
  createTheme,
  CssBaseline,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { leadService } from '../services/firebase/leadService';
import { Lead } from '../types/schemas';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const LEADS_COLLECTION = 'leads';

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
  },
});

const Leads: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Lead | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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
  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    status: 'חדש',
    source: '',
    notes: '',
    lastContact: new Date(),
    budget: 0,
    industry: '',
    score: 0,
    tags: [],
    estimatedValue: 0,
    assignedTo: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchLeads();
    }
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...leads];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((lead) =>
        Object.values(lead).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((lead) => lead.status === filterStatus);
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

    setFilteredLeads(filtered);
  }, [leads, searchTerm, filterStatus, sortColumn, sortDirection]);

  const handleSort = (column: keyof Lead) => {
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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      if (!currentUser) {
        console.log('No user found, returning early');
        return;
      }

      console.log('Fetching leads for user:', currentUser.uid);
      const fetchedLeads = await leadService.getLeadsByAssignee(currentUser.uid);
      console.log('Fetched leads:', fetchedLeads.length);

      setLeads(fetchedLeads);
      setFilteredLeads(fetchedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showSnackbar('שגיאה בטעינת הלידים', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const leadData: Lead = {
        ...formData,
        id: selectedLead?.id || uuidv4(),
        createdBy: currentUser.uid,
        updatedBy: currentUser.uid,
        assignedTo: currentUser.uid,
        createdAt: selectedLead ? selectedLead.createdAt : new Date(),
        updatedAt: new Date(),
        lastContact: new Date(),
        isDeleted: false,
        meetings: [],
      } as Lead;

      if (selectedLead) {
        await leadService.updateLead(selectedLead.id, leadData);
        showSnackbar('הליד עודכן בהצלחה');
      } else {
        await leadService.createLead(leadData);
        showSnackbar('ליד חדש נוצר בהצלחה');
      }

      fetchLeads();
      setOpenEditDialog(false);
      setSelectedLead(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        company: '',
        status: 'חדש',
        source: '',
        notes: '',
        lastContact: new Date(),
        budget: 0,
        industry: '',
        score: 0,
        tags: [],
        estimatedValue: 0,
        assignedTo: ''
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      showSnackbar('שגיאה בשמירת הליד', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      await leadService.deleteLead(id, currentUser.uid);
      await fetchLeads();
      showSnackbar('הליד נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting lead:', error);
      showSnackbar('שגיאה במחיקת הליד', 'error');
    }
  };

  const handleOpenEditDialog = (lead?: Lead) => {
    setSelectedLead(lead || null);
    setFormData(lead || {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      company: '',
      status: 'חדש',
      source: '',
      notes: '',
      lastContact: new Date(),
      budget: 0,
      industry: '',
      score: 0,
      tags: [],
      estimatedValue: 0,
      assignedTo: ''
    });
    setOpenEditDialog(true);
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
            label="חיפוש לידים"
            placeholder="חיפוש"
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
            ליד חדש
          </Button>

          <FormControl sx={{ ml: 2, minWidth: 150 }}>
            <InputLabel id="filter-status-label">סטטוס</InputLabel>
            <Select
              labelId="filter-status-label"
              id="filter-status"
              value={filterStatus}
              label="סטטוס"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">הכל</MenuItem>
              <MenuItem value="חדש">חדש</MenuItem>
              <MenuItem value="בתהליך">בתהליך</MenuItem>
              <MenuItem value="הושלם">הושלם</MenuItem>
              <MenuItem value="לא רלוונטי">לא רלוונטי</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {loading ? (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="leads table">
              <TableHead>
                <TableRow>
                  {['שם', 'חברה', 'אימייל', 'טלפון', 'סטטוס', 'מקור', 'תקציב', 'תאריך יצירה', 'פעולות'].map((header) => (
                    <TableCell key={header}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(6)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(9)].map((_, cellIndex) => (
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
            <Table sx={{ minWidth: 650 }} aria-label="leads table">
              <TableHead>
                <TableRow>
                  {([
                    'firstName',
                    'company',
                    'email',
                    'phoneNumber',
                    'status',
                    'source',
                    'budget',
                    'createdAt'
                  ] as (keyof Lead)[]).map((column) => (
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
                        {column === 'company' && 'חברה'}
                        {column === 'email' && 'אימייל'}
                        {column === 'phoneNumber' && 'טלפון'}
                        {column === 'status' && 'סטטוס'}
                        {column === 'source' && 'מקור'}
                        {column === 'budget' && 'תקציב'}
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
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status}
                        color={
                          lead.status === 'נוצר קשר' ? 'info' :
                          lead.status === 'מוסמך' ? 'warning' :
                          lead.status === 'סגור זכה' ? 'success' :
                          'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell>{lead.budget?.toLocaleString() || '0'} ₪</TableCell>
                    <TableCell>{lead.createdAt.toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => handleOpenEditDialog(lead)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(lead.id)} color="error">
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
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{selectedLead ? 'עריכת ליד' : 'ליד חדש'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="שם פרטי"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="שם משפחה"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="אימייל"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="טלפון"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="חברה"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>סטטוס</InputLabel>
                    <Select
                      value={formData.status || 'חדש'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}
                      label="סטטוס"
                    >
                      <MenuItem value="חדש">חדש</MenuItem>
                      <MenuItem value="בתהליך">בתהליך</MenuItem>
                      <MenuItem value="הושלם">הושלם</MenuItem>
                      <MenuItem value="לא רלוונטי">לא רלוונטי</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="מקור"
                    value={formData.source || ''}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="תקציב"
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="הערות"
                    multiline
                    rows={4}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditDialog(false)}>ביטול</Button>
              <Button type="submit" variant="contained" color="primary">
                {selectedLead ? 'עדכון' : 'יצירה'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
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
