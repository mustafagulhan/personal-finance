import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Download as DownloadIcon,
  CalendarMonth,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Category
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import PageTitle from '../components/PageTitle';
import ReportDialog from '../components/ReportDialog';

// Pasta grafik için renk paleti
const COLORS = [
  '#4E2A84', // Koyu Mor
  '#4BC0C0', // Turkuaz
  '#9FE2BF', // Açık Yeşil
  '#6B4423', // Kahverengi
  '#DAA520', // Altın
  '#FF6B6B', // Kırmızı
  '#FF69B4', // Pembe
  '#9370DB'  // Mor
];

const Reports = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('month');
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0
    },
    incomeByCategory: [],
    expenseByCategory: []
  });
  const [chartData, setChartData] = useState([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/reports?range=${range}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReportData(response.data);
      setError(null);
    } catch (error) {
      console.error('Report data fetch error:', error);
      setError('Rapor verileri alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reports/chart-data?range=${range}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Grafik verilerini düzenle
      const { incomeData, expenseData } = response.data;
      const formattedData = [];

      if (range === 'month') {
        // Ayın her günü için veri oluştur
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const income = incomeData.find(d => d._id === i)?.total || 0;
          const expense = expenseData.find(d => d._id === i)?.total || 0;
          formattedData.push({
            name: i.toString(),
            Gelir: income,
            Gider: expense
          });
        }
      } else {
        // Her ay için veri oluştur
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        for (let i = 1; i <= 12; i++) {
          const income = incomeData.find(d => d._id === i)?.total || 0;
          const expense = expenseData.find(d => d._id === i)?.total || 0;
          formattedData.push({
            name: months[i-1],
            Gelir: income,
            Gider: expense
          });
        }
      }

      setChartData(formattedData);
    } catch (error) {
      console.error('Chart data fetch error:', error);
    }
  };

  useEffect(() => {
    fetchReportData();
    fetchChartData();
  }, [range, token]);

  const handleDownloadPDF = async (filters) => {
    try {
      const response = await axios({
        url: 'http://localhost:5000/api/reports/generate-pdf',
        method: 'POST',
        data: filters,
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapor-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setReportDialogOpen(false);
    } catch (error) {
      console.error('PDF download error:', error);
      setError('PDF indirme işlemi başarısız oldu');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Başlık ve Kontroller */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 4 
      }}>
        <PageTitle title="Finansal Raporlar" />
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Zaman Aralığı</InputLabel>
            <Select
              value={range}
              label="Zaman Aralığı"
              onChange={(e) => setRange(e.target.value)}
            >
              <MenuItem value="month">Bu Ay</MenuItem>
              <MenuItem value="year">Bu Yıl</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setReportDialogOpen(true)}
          >
            PDF İndir
          </Button>
        </Stack>
      </Box>

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              p: 1,
              color: 'success.main'
            }}>
              <TrendingUp />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Toplam Gelir
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: 'success.main', my: 2 }}>
                ₺{reportData.summary.totalIncome.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {range === 'month' ? 'Bu ay' : 'Bu yıl'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              p: 1,
              color: 'error.main'
            }}>
              <TrendingDown />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Toplam Gider
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: 'error.main', my: 2 }}>
                ₺{reportData.summary.totalExpense.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {range === 'month' ? 'Bu ay' : 'Bu yıl'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              p: 1,
              color: reportData.summary.netBalance >= 0 ? 'success.main' : 'error.main'
            }}>
              <AccountBalance />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Net Bakiye
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  color: reportData.summary.netBalance >= 0 ? 'success.main' : 'error.main',
                  my: 2 
                }}
              >
                ₺{reportData.summary.netBalance.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {range === 'month' ? 'Bu ay' : 'Bu yıl'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3}>
        {/* Gelir/Gider Trendi */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {range === 'month' ? 'Aylık Gelir/Gider Trendi' : 'Yıllık Gelir/Gider Trendi'}
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Gelir"
                      stackId="1"
                      stroke={theme.palette.success.main}
                      fill={theme.palette.success.light}
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="Gider"
                      stackId="2"
                      stroke={theme.palette.error.main}
                      fill={theme.palette.error.light}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Kategori Dağılımı (Pasta Grafik) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Gelir Kategorileri</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.incomeByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {reportData.incomeByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Gider Kategorileri</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {reportData.expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        onDownload={handleDownloadPDF}
      />
    </Container>
  );
};

export default Reports; 