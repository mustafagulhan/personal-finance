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

const Reports = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      percentageChange: {
        income: 0,
        expense: 0
      }
    },
    monthlyData: [],
    categoryData: [],
    dailyBalances: [],
    topExpenses: [],
    topIncomes: []
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/reports?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
      setError(null);
    } catch (error) {
      console.error('Report data fetch error:', error);
      setError('Rapor verileri alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, token]);

  const handleDownloadPDF = async () => {
    try {
      const response = await axios({
        url: 'http://localhost:5000/api/reports/download',
        method: 'POST',
        data: { range: dateRange },
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      // PDF'i indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapor-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      setError('PDF indirme işlemi başarısız oldu');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
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
            <InputLabel>Tarih Aralığı</InputLabel>
            <Select
              value={dateRange}
              label="Tarih Aralığı"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="month">Bu Ay</MenuItem>
              <MenuItem value="quarter">Son 3 Ay</MenuItem>
              <MenuItem value="year">Bu Yıl</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            PDF İndir
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Toplam Gelir
                </Typography>
                <TrendingUp color="success" />
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ₺{reportData.summary.totalIncome.toLocaleString()}
              </Typography>
              <Typography color={reportData.summary.percentageChange.income >= 0 ? "success.main" : "error.main"}>
                {reportData.summary.percentageChange.income >= 0 ? "+" : ""}
                {reportData.summary.percentageChange.income}% geçen döneme göre
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Toplam Gider
                </Typography>
                <TrendingDown color="error" />
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ₺{reportData.summary.totalExpense.toLocaleString()}
              </Typography>
              <Typography color={reportData.summary.percentageChange.expense <= 0 ? "success.main" : "error.main"}>
                {reportData.summary.percentageChange.expense >= 0 ? "+" : ""}
                {reportData.summary.percentageChange.expense}% geçen döneme göre
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Net Bakiye
                </Typography>
                <AccountBalance color="info" />
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ₺{reportData.summary.netBalance.toLocaleString()}
              </Typography>
              <Typography color={reportData.summary.netBalance >= 0 ? "success.main" : "error.main"}>
                {reportData.summary.netBalance >= 0 ? "Pozitif" : "Negatif"} Bakiye
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Kategori Sayısı
                </Typography>
                <Category color="warning" />
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {reportData.categoryData.length}
              </Typography>
              <Typography color="text.secondary">
                Aktif Kategori
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3}>
        {/* Gelir/Gider Dağılımı */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Gelir/Gider Dağılımı</Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={reportData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
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
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Kategori Dağılımı</Typography>
              <Box sx={{ height: 350, position: 'relative' }}>
                <ResponsiveContainer>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={reportData.categoryData.filter(item => item.amount > 0)}
                      dataKey="amount"
                      nameKey="category"
                      cx="45%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      label={({ name, percent, x, y, cx, cy }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = 100;
                        const x1 = cx + radius * Math.cos(-percent * 360 * RADIAN);
                        const y1 = cy + radius * Math.sin(-percent * 360 * RADIAN);

                        return (
                          <g>
                            <text
                              x={x1}
                              y={y1}
                              fill="#666"
                              textAnchor={x1 > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={11}
                            >
                              {`${name} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                          </g>
                        );
                      }}
                      labelLine={true}
                    >
                      {reportData.categoryData
                        .filter(item => item.amount > 0)
                        .map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={[
                              '#4E2A84', // Koyu Mor
                              '#4BC0C0', // Turkuaz
                              '#9FE2BF', // Açık Yeşil
                              '#6B4423', // Kahverengi
                              '#DAA520', // Altın
                              '#FF6B6B', // Kırmızı
                              '#FF69B4', // Pembe
                              '#9370DB'  // Mor
                            ][index % 8]}
                            strokeWidth={0}
                          />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      wrapperStyle={{
                        paddingLeft: '40px',
                        fontSize: '12px',
                        lineHeight: '24px'
                      }}
                      formatter={(value, entry) => {
                        const { payload } = entry;
                        if (payload.value > 0) {
                          return `${value} (₺${payload.value.toLocaleString()})`;
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Günlük Bakiye Değişimi */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Günlük Bakiye Değişimi</Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer>
                  <AreaChart data={reportData.dailyBalances}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main + '40'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* En Yüksek Giderler ve Gelirler */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>En Yüksek Giderler</Typography>
              {reportData.topExpenses.map((expense, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{expense.description}</Typography>
                    <Typography color="error.main">₺{expense.amount.toLocaleString()}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {expense.category} • {new Date(expense.date).toLocaleDateString()}
                  </Typography>
                  {index < reportData.topExpenses.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>En Yüksek Gelirler</Typography>
              {reportData.topIncomes.map((income, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{income.description}</Typography>
                    <Typography color="success.main">₺{income.amount.toLocaleString()}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {income.category} • {new Date(income.date).toLocaleDateString()}
                  </Typography>
                  {index < reportData.topIncomes.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports; 