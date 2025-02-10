import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    recentTransactions: [],
    summary: { totalIncome: 0, totalExpense: 0 }
  });

  const { token } = useAuth();

  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Dashboard data:', response.data);
        setDashboardData(response.data);
        setError(null);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

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
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Özet Kartları */}
        <Grid item xs={12}>
          <Typography variant="h5" className="section-title">
            Gelir/Gider Özeti
          </Typography>
          <Grid container spacing={3}>
            {/* Gelir Kartı */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(34, 197, 94, 0.2)',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                      }}
                    >
                      <IncomeIcon sx={{ color: theme.palette.success.main }} />
                    </Box>
                    <Typography variant="h6">
                      Toplam Gelir
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: theme.palette.success.main }}>
                    ₺{dashboardData.summary.totalIncome.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Gider Kartı */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                      }}
                    >
                      <ExpenseIcon sx={{ color: theme.palette.error.main }} />
                    </Box>
                    <Typography variant="h6">
                      Toplam Gider
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: theme.palette.error.main }}>
                    ₺{dashboardData.summary.totalExpense.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Bakiye Kartı */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: theme.palette.mode === 'light' 
                          ? 'rgba(25, 118, 210, 0.2)' 
                          : 'rgba(144, 202, 249, 0.2)',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                      }}
                    >
                      <BalanceIcon sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6">
                      Net Bakiye
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
                    ₺{(dashboardData.summary.totalIncome - dashboardData.summary.totalExpense).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Son İşlemler */}
        <Grid item xs={12}>
          <Typography variant="h5" className="section-title" sx={{ mt: 4 }}>
            Son İşlemler
          </Typography>
          <Card>
            <CardContent>
              <Box sx={{ mt: 2 }}>
                {dashboardData.recentTransactions.map((transaction) => (
                  <Box
                    key={transaction._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" color="text.primary">
                        {transaction.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: transaction.type === 'income'
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        fontWeight: 500,
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 