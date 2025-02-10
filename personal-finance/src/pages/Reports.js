import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';

const Reports = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    monthlyData: [],
    categoryData: [],
    summary: {
      totalIncome: 0,
      totalExpense: 0
    }
  });
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year
  const theme = useTheme();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const fetchReportData = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reports?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReportData(response.data);
      setError(null);
    } catch (error) {
      console.error('Reports data fetch error:', error);
      setError('Rapor verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    if (token) {
      fetchReportData();
    }
  }, [token, fetchReportData]);

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" className="page-title">
        Raporlar
      </Typography>

      {/* Zaman Aralığı Seçimi */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" className="section-title">
          Zaman Aralığı
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Dönem</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Dönem"
          >
            <MenuItem value="month">Son 1 Ay</MenuItem>
            <MenuItem value="quarter">Son 3 Ay</MenuItem>
            <MenuItem value="year">Son 1 Yıl</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Özet Kartları */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Toplam Gelir
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.success.main }}>
                ₺{reportData.summary.totalIncome.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Toplam Gider
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.error.main }}>
                ₺{reportData.summary.totalExpense.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Net Bakiye
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
                ₺{(reportData.summary.totalIncome - reportData.summary.totalExpense).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gelir/Gider Grafiği */}
        <Grid item xs={12}>
          <Typography variant="h5" className="section-title" sx={{ mt: 4 }}>
            Gelir/Gider Dağılımı
          </Typography>
          <Card>
            <CardContent>
              <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={reportData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" name="Gelir" fill={theme.palette.success.main} />
                    <Bar dataKey="expense" name="Gider" fill={theme.palette.error.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Kategori Dağılımı */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" className="section-title" sx={{ mt: 4 }}>
            Kategori Dağılımı
          </Typography>
          <Card>
            <CardContent>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={reportData.categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {reportData.categoryData.map((entry, index) => (
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
      </Grid>
    </Container>
  );
};

export default Reports; 