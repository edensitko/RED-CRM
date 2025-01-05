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
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SalesData {
  month: string;
  revenue: number;
  deals: number;
}

interface LeadSource {
  name: string;
  value: number;
}

interface TopProduct {
  name: string;
  revenue: number;
  deals: number;
}

const mockSalesData: SalesData[] = [
  { month: 'ינואר', revenue: 120000, deals: 15 },
  { month: 'פברואר', revenue: 150000, deals: 18 },
  { month: 'מרץ', revenue: 180000, deals: 22 },
  { month: 'אפריל', revenue: 220000, deals: 25 },
  { month: 'מאי', revenue: 200000, deals: 20 },
  { month: 'יוני', revenue: 250000, deals: 28 },
];

const mockLeadSources: LeadSource[] = [
  { name: 'אתר אינטרנט', value: 35 },
  { name: 'המלצות', value: 25 },
  { name: 'רשתות חברתיות', value: 20 },
  { name: 'תערוכות', value: 15 },
  { name: 'אחר', value: 5 },
];

const mockTopProducts: TopProduct[] = [
  { name: 'ייעוץ עסקי', revenue: 350000, deals: 45 },
  { name: 'פיתוח תוכנה', revenue: 280000, deals: 32 },
  { name: 'שיווק דיגיטלי', revenue: 220000, deals: 28 },
  { name: 'ניהול מדיה', revenue: 180000, deals: 25 },
  { name: 'אבטחת מידע', revenue: 150000, deals: 20 },
];

const COLORS = ['#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFB2B2'];

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">דוחות וניתוח נתונים</Typography>
        <FormControl sx={{ width: 200 }}>
          <InputLabel>טווח זמן</InputLabel>
          <Select
            value={timeRange}
            label="טווח זמן"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="1month">חודש אחרון</MenuItem>
            <MenuItem value="3months">3 חודשים</MenuItem>
            <MenuItem value="6months">6 חודשים</MenuItem>
            <MenuItem value="1year">שנה</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Sales Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                סקירת מכירות
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockSalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FF0000"
                      name="הכנסות"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="deals"
                      stroke="#000000"
                      name="עסקאות"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Sources */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                מקורות לידים
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockLeadSources}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {mockLeadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                מוצרים מובילים
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>מוצר</TableCell>
                      <TableCell align="right">הכנסות</TableCell>
                      <TableCell align="right">עסקאות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockTopProducts.map((product) => (
                      <TableRow key={product.name}>
                        <TableCell component="th" scope="row">
                          {product.name}
                        </TableCell>
                        <TableCell align="right">
                          ₪{product.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{product.deals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Export Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" color="primary">
              ייצא ל-PDF
            </Button>
            <Button variant="outlined" color="primary">
              ייצא ל-Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
