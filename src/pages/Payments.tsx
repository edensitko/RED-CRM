import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';

interface Payment {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  date: string;
  dueDate: string;
  method: string;
  description: string;
}

const mockPayments: Payment[] = [
  {
    id: 'pay1',
    invoiceNumber: 'INV-2024-001',
    customer: 'חברת אלפא בע"מ',
    amount: 5000,
    status: 'paid',
    date: '2024-12-28',
    dueDate: '2025-01-28',
    method: 'credit_card',
    description: 'תשלום עבור שירותי ייעוץ - דצמבר 2024',
  },
  {
    id: 'pay2',
    invoiceNumber: 'INV-2024-002',
    customer: 'חברת בטא',
    amount: 7500,
    status: 'pending',
    date: '2024-12-25',
    dueDate: '2025-01-25',
    method: 'bank_transfer',
    description: 'פיתוח תוכנה - שלב א',
  },
  {
    id: 'pay3',
    invoiceNumber: 'INV-2024-003',
    customer: 'גמא תעשיות',
    amount: 3000,
    status: 'overdue',
    date: '2024-12-15',
    dueDate: '2025-01-15',
    method: 'check',
    description: 'שירותי תמיכה טכנית - Q4',
  },
  {
    id: 'pay4',
    invoiceNumber: 'INV-2024-004',
    customer: 'דלתא דיגיטל',
    amount: 12000,
    status: 'paid',
    date: '2024-12-10',
    dueDate: '2025-01-10',
    method: 'credit_card',
    description: 'חבילת שיווק דיגיטלי - שנתי',
  },
  {
    id: 'pay5',
    invoiceNumber: 'INV-2024-005',
    customer: 'אפסילון בע"מ',
    amount: 4500,
    status: 'cancelled',
    date: '2024-12-05',
    dueDate: '2025-01-05',
    method: 'bank_transfer',
    description: 'שירותי ייעוץ - בוטל',
  },
];

const Payments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'overdue':
        return 'error.main';
      case 'cancelled':
        return 'text.disabled';
      default:
        return 'text.primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'שולם';
      case 'pending':
        return 'ממתין';
      case 'overdue':
        return 'באיחור';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'כרטיס אשראי';
      case 'bank_transfer':
        return 'העברה בנקאית';
      case 'check':
        return 'צ\'ק';
      default:
        return method;
    }
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = filteredPayments
    .filter((payment) => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter((payment) => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">תשלומים</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          צור חשבונית חדשה
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                סך הכל תשלומים
              </Typography>
              <Typography variant="h5">
                ₪{totalAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                תשלומים שהתקבלו
              </Typography>
              <Typography variant="h5" color="success.main">
                ₪{paidAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                תשלומים בהמתנה
              </Typography>
              <Typography variant="h5" color="warning.main">
                ₪{pendingAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="חיפוש לפי לקוח או מספר חשבונית"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            label="סטטוס"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">הכל</MenuItem>
            <MenuItem value="paid">שולם</MenuItem>
            <MenuItem value="pending">ממתין</MenuItem>
            <MenuItem value="overdue">באיחור</MenuItem>
            <MenuItem value="cancelled">בוטל</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            label="אמצעי תשלום"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <MenuItem value="all">הכל</MenuItem>
            <MenuItem value="credit_card">כרטיס אשראי</MenuItem>
            <MenuItem value="bank_transfer">העברה בנקאית</MenuItem>
            <MenuItem value="check">צ'ק</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מספר חשבונית</TableCell>
                <TableCell>לקוח</TableCell>
                <TableCell>סכום</TableCell>
                <TableCell>תאריך</TableCell>
                <TableCell>תאריך לתשלום</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>אמצעי תשלום</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.invoiceNumber}</TableCell>
                  <TableCell>{payment.customer}</TableCell>
                  <TableCell>₪{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>
                    <Typography color={getStatusColor(payment.status)}>
                      {getStatusText(payment.status)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getMethodText(payment.method)}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <ReceiptIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Payments;
