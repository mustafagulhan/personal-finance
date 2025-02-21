import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  CardHeader,
  Button
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
  AccountBalanceWallet,
  Alarm as AlarmIcon,
  MoreVert,
  StickyNote2 as NoteIcon,
  Add as AddIcon,
  ViewList as ViewAllIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm';
import NoteForm from '../components/NoteForm';
import PageTitle from '../components/PageTitle';

function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Başlangıç değerleri ile state'leri tanımla
  const [dashboardData, setDashboardData] = useState({
    summary: {
      currentMonth: {
        income: 0,
        expense: 0,
        netBalance: 0
      },
      percentageChanges: {
        income: 0,
        expense: 0
      },
      vaultBalance: 0  // Kasa bakiyesi için başlangıç değeri
    },
    recentTransactions: [],
    recentNotes: []
  });
  
  const [vault, setVault] = useState({ balance: 0 });
  const [recentNotes, setRecentNotes] = useState([]);
  const [transactionsMenuAnchor, setTransactionsMenuAnchor] = useState(null);
  const [notesMenuAnchor, setNotesMenuAnchor] = useState(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [openNoteForm, setOpenNoteForm] = useState(false);

  // Verileri yükle
  const fetchDashboardData = async () => {
    try {
      const [summaryResponse, transactionsResponse, notesResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/transactions/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/transactions/recent', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/notes/recent', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Debug için
      console.log('Recent transactions:', transactionsResponse.data);

      setDashboardData({
        summary: {
          currentMonth: {
            income: summaryResponse.data.details?.income || 0,
            expense: summaryResponse.data.details?.expense || 0,
            netBalance: summaryResponse.data.netBalance || 0
          },
          percentageChanges: {
            income: 0,
            expense: 0
          },
          vaultBalance: summaryResponse.data.vaultBalance || 0
        },
        recentTransactions: transactionsResponse.data || [], // Son işlemler
        recentNotes: notesResponse.data || []
      });

      setError(null);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Veriler alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Son işlemleri gösterme fonksiyonu
  const renderTransactionRow = (transaction) => {
    const isIncome = transaction.type === 'income';
    
    return (
      <TableRow key={transaction._id}>
        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
        <TableCell>{transaction.description || '-'}</TableCell>
        <TableCell>{transaction.category}</TableCell>
        <TableCell>
          <Chip
            label={isIncome ? "Gelir" : "Gider"}
            size="small"
            sx={{
              backgroundColor: isIncome ? '#10B98115' : '#EF444415',
              color: isIncome ? '#10B981' : '#EF4444',
              fontWeight: 500,
            }}
          />
        </TableCell>
        <TableCell align="right" sx={{ color: isIncome ? '#10B981' : '#EF4444', fontWeight: 500 }}>
          {isIncome ? '+' : '-'}₺{transaction.amount.toFixed(2)}
        </TableCell>
      </TableRow>
    );
  };

  // fetchRecentNotes'u useCallback ile sarmalayalım
  const fetchRecentNotes = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentNotes(response.data.slice(0, 3));
    } catch (error) {
      console.error('Notes fetch error:', error);
    }
  }, [token]); // token dependency olarak eklendi

  useEffect(() => {
    if (token) {
      fetchRecentNotes();
    }
  }, [token, fetchRecentNotes]);

  // İşlemler menüsü için fonksiyonlar
  const handleTransactionsMenuOpen = (event) => {
    setTransactionsMenuAnchor(event.currentTarget);
  };

  const handleTransactionsMenuClose = () => {
    setTransactionsMenuAnchor(null);
  };

  // Notlar menüsü için fonksiyonlar
  const handleNotesMenuOpen = (event) => {
    setNotesMenuAnchor(event.currentTarget);
  };

  const handleNotesMenuClose = () => {
    setNotesMenuAnchor(null);
  };

  // Modal işleyicileri
  const handleTransactionModalOpen = () => {
    setIsTransactionModalOpen(true);
    handleTransactionsMenuClose();
  };

  const handleTransactionModalClose = () => {
    setIsTransactionModalOpen(false);
  };

  const handleNoteModalOpen = () => {
    setIsNoteModalOpen(true);
    handleNotesMenuClose();
  };

  const handleNoteModalClose = () => {
    setIsNoteModalOpen(false);
    setOpenNoteForm(false);
  };

  // İşlem eklendiğinde dashboard verilerini güncelle
  const handleTransactionAdded = async () => {
    await fetchDashboardData();
  };

  // TransactionForm bileşenine prop olarak geçirilecek callback
  const onTransactionSuccess = () => {
    handleTransactionAdded();
  };

  const handleNoteAdded = async (note) => {
    await fetchRecentNotes(); // Notları yenile
    setOpenNoteForm(false);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageTitle title="Dashboard" />
      <Box 
        sx={{ 
          display: 'flex', 
          minHeight: 'calc(100vh - 80px)', // Navbar yüksekliğini çıkar
          bgcolor: 'background.default',
          pt: 3 // Üstten biraz padding ekleyelim
        }}
      >
        <Container maxWidth="lg">
          <Grid 
            container 
            spacing={3} 
            sx={{ 
              alignItems: 'stretch' // Kartların yüksekliğini eşit tutuyoruz
            }}
          >
            {/* İstatistik Kartları */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Toplam Gelir
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                        ₺{(dashboardData.summary.currentMonth?.income || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color={dashboardData.summary.percentageChanges?.income >= 0 ? 'success.main' : 'error.main'}>
                        {dashboardData.summary.percentageChanges?.income >= 0 ? '+' : ''}
                        {(dashboardData.summary.percentageChanges?.income || 0).toFixed(1)}% geçen aya göre
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                      <IncomeIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Toplam Gider
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                        ₺{(dashboardData.summary.currentMonth?.expense || 0).toLocaleString()}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={dashboardData.summary.percentageChanges?.expense >= 0 ? 'error.main' : 'success.main'}
                      >
                        {dashboardData.summary.percentageChanges?.expense >= 0 ? '+' : ''}
                        {(dashboardData.summary.percentageChanges?.expense || 0).toFixed(1)}% geçen aya göre
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ backgroundColor: '#EF444415', color: '#EF4444' }}>
                      <ExpenseIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Net Bakiye
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                        ₺{((dashboardData.summary.currentMonth?.income || 0) - (dashboardData.summary.currentMonth?.expense || 0)).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color={
                        ((dashboardData.summary.currentMonth?.income || 0) - (dashboardData.summary.currentMonth?.expense || 0)) >= 0 
                          ? 'success.main' 
                          : 'error.main'
                      }>
                        Net Durum
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                      <AccountBalanceWallet />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Kasa Bakiyesi
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                        ₺{(dashboardData.summary.vaultBalance || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="primary.main">
                        Güncel Bakiye
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#6366F115', 
                        color: '#6366F1',
                        '&:hover': {
                          backgroundColor: '#6366F130'
                        }
                      }}
                      onClick={() => navigate('/vault')}
                    >
                      <BalanceIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Alt Kartlar */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Button
                        onClick={() => navigate('/transactions')}
                        sx={{ 
                          color: 'text.primary',
                          fontSize: '1.25rem',
                          fontWeight: 500,
                          p: 0,
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: 'primary.main'
                          }
                        }}
                      >
                        Son İşlemler
                      </Button>
                      <IconButton
                        size="small"
                        onClick={handleTransactionsMenuOpen}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  }
                />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Açıklama</TableCell>
                        <TableCell>Kategori</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell align="right">Tutar</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recentTransactions.length > 0 ? (
                        dashboardData.recentTransactions.map(renderTransactionRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              Henüz işlem bulunmuyor
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {/* İşlemler Menüsü */}
              <Menu
                anchorEl={transactionsMenuAnchor}
                open={Boolean(transactionsMenuAnchor)}
                onClose={handleTransactionsMenuClose}
              >
                <MenuItem onClick={handleTransactionModalOpen}>
                  <ListItemIcon>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Yeni İşlem Ekle" />
                </MenuItem>
                <MenuItem onClick={() => {
                  navigate('/transactions');
                  handleTransactionsMenuClose();
                }}>
                  <ListItemIcon>
                    <ViewAllIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Tüm İşlemleri Görüntüle" />
                </MenuItem>
              </Menu>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Button
                        onClick={() => navigate('/notes')}
                        sx={{ 
                          color: 'text.primary',
                          fontSize: '1.25rem',
                          fontWeight: 500,
                          p: 0,
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: 'primary.main'
                          }
                        }}
                      >
                        Son Notlar
                      </Button>
                      <IconButton
                        size="small"
                        onClick={handleNotesMenuOpen}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note, index) => (
                      <React.Fragment key={note._id}>
                        <Card 
                          onClick={() => navigate(`/notes/${note._id}`)}
                          sx={{ 
                            bgcolor: 'background.subtle',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600, 
                                mb: 1,
                                color: 'text.primary'
                              }}
                            >
                              {note.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: note.isReminder ? 1 : 0,
                                opacity: 0.8
                              }}
                            >
                              {note.content}
                            </Typography>
                            {note.isReminder && note.reminderDate && (
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  size="small"
                                  icon={<AlarmIcon sx={{ fontSize: '1rem' }} />}
                                  label={new Date(note.reminderDate).toLocaleDateString()}
                                  sx={{ 
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                    '& .MuiChip-icon': { color: 'inherit' },
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      bgcolor: 'primary.dark',
                                    }
                                  }}
                                />
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                        {index < recentNotes.length - 1 && (
                          <Divider />
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <Box sx={{ 
                      py: 4, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <NoteIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography color="text.secondary">
                        Henüz not bulunmuyor
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Notlar Menüsü */}
              <Menu
                anchorEl={notesMenuAnchor}
                open={Boolean(notesMenuAnchor)}
                onClose={handleNotesMenuClose}
              >
                <MenuItem onClick={handleNoteModalOpen}>
                  <ListItemIcon>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Yeni Not Ekle" />
                </MenuItem>
                <MenuItem onClick={() => {
                  navigate('/notes');
                  handleNotesMenuClose();
                }}>
                  <ListItemIcon>
                    <ViewAllIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Tüm Notları Görüntüle" />
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </Container>

        {/* İşlem Ekleme Modal */}
        <TransactionForm
          open={isTransactionModalOpen}
          handleClose={handleTransactionModalClose}
          onTransactionAdded={onTransactionSuccess}
          editingTransaction={null}
        />

        {/* Not Ekleme Modal */}
        <NoteForm
          open={openNoteForm}
          onClose={handleNoteModalClose}
          onNoteSaved={handleNoteAdded}
        />
      </Box>
    </Container>
  );
}

export default Dashboard; 