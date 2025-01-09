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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { FaTools } from 'react-icons/fa';

interface Form {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  submissions: number;
  status: 'active' | 'draft' | 'archived';
}

const mockForms: Form[] = [
  {
    id: 'form1',
    name: 'טופס יצירת קשר',
    type: 'contact',
    createdAt: '2024-12-15',
    submissions: 145,
    status: 'active',
  },
  {
    id: 'form2',
    name: 'טופס הרשמה לניוזלטר',
    type: 'newsletter',
    createdAt: '2024-12-10',
    submissions: 89,
    status: 'active',
  },
  {
    id: 'form3',
    name: 'סקר שביעות רצון לקוחות',
    type: 'survey',
    createdAt: '2024-12-05',
    submissions: 67,
    status: 'active',
  },
  {
    id: 'form4',
    name: 'טופס בקשת הצעת מחיר',
    type: 'quote',
    createdAt: '2024-11-28',
    submissions: 34,
    status: 'draft',
  },
  {
    id: 'form5',
    name: 'טופס דיווח תקלה',
    type: 'support',
    createdAt: '2024-11-20',
    submissions: 56,
    status: 'archived',
  },
];

const Forms: React.FC = () => {
  // const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState('all');

  // const filteredForms = mockForms.filter((form) => {
  //   const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
  //   return matchesSearch && matchesStatus;
  // });

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return 'success.main';
  //     case 'draft':
  //       return 'warning.main';
  //     case 'archived':
  //       return 'error.main';
  //     default:
  //       return 'text.primary';
  //   }
  // };

  // return (
  //   <Box sx={{ p: 3 }}>
  //     <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  //       <Typography variant="h4">טפסים</Typography>
  //       <Button
  //         variant="contained"
  //         color="primary"
  //         startIcon={<AddIcon />}
  //       >
  //         צור טופס חדש
  //       </Button>
  //     </Box>

  //     <Grid container spacing={2} sx={{ mb: 3 }}>
  //       <Grid item xs={12} sm={6} md={4}>
  //         <TextField
  //           fullWidth
  //           label="חיפוש טפסים"
  //           value={searchTerm}
  //           onChange={(e) => setSearchTerm(e.target.value)}
  //         />
  //       </Grid>
  //       <Grid item xs={12} sm={6} md={4}>
  //         <TextField
  //           fullWidth
  //           select
  //           label="סטטוס"
  //           value={statusFilter}
  //           onChange={(e) => setStatusFilter(e.target.value)}
  //         >
  //           <MenuItem value="all">הכל</MenuItem>
  //           <MenuItem value="active">פעיל</MenuItem>
  //           <MenuItem value="draft">טיוטה</MenuItem>
  //           <MenuItem value="archived">בארכיון</MenuItem>
  //         </TextField>
  //       </Grid>
  //     </Grid>

  //     <Card>
  //       <TableContainer>
  //         <Table>
  //           <TableHead>
  //             <TableRow>
  //               <TableCell>שם הטופס</TableCell>
  //               <TableCell>סוג</TableCell>
  //               <TableCell>תאריך יצירה</TableCell>
  //               <TableCell>מספר שליחות</TableCell>
  //               <TableCell>סטטוס</TableCell>
  //               <TableCell>פעולות</TableCell>
  //             </TableRow>
  //           </TableHead>
  //           <TableBody>
  //             {filteredForms.map((form) => (
  //               <TableRow key={form.id}>
  //                 <TableCell>{form.name}</TableCell>
  //                 <TableCell>{form.type}</TableCell>
  //                 <TableCell>{form.createdAt}</TableCell>
  //                 <TableCell>{form.submissions}</TableCell>
  //                 <TableCell>
  //                   <Typography color={getStatusColor(form.status)}>
  //                     {form.status === 'active' && 'פעיל'}
  //                     {form.status === 'draft' && 'טיוטה'}
  //                     {form.status === 'archived' && 'בארכיון'}
  //                   </Typography>
  //                 </TableCell>
  //                 <TableCell>
  //                   <IconButton size="small" color="primary">
  //                     <VisibilityIcon />
  //                   </IconButton>
  //                   <IconButton size="small" color="primary">
  //                     <EditIcon />
  //                   </IconButton>
  //                   <IconButton size="small" color="error">
  //                     <DeleteIcon />
  //                   </IconButton>
  //                 </TableCell>
  //               </TableRow>
  //             ))}
  //           </TableBody>
  //         </Table>
  //       </TableContainer>
  //     </Card>
  //   </Box>
  // );
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
      <div className="text-center p-10 bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-center mb-6">
          <FaTools className="text-6xl text-red-500 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          עמוד בשיפוצים
        </h1>
        <p className="text-gray-600 mb-6">
          הדף נמצא כרגע בתהליך של שדרוג ושיפוץ. אנא חזור מאוחר יותר.
        </p>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
          <p className="text-yellow-700">
            <strong>הודעה:</strong> אנו עובדים על שיפור חווית המשתמש. תודה על הסבלנות.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forms;
