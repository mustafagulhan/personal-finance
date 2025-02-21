import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  IconButton,
  Collapse,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import TransactionForm from '../components/TransactionForm';
import { useTheme } from '@mui/material/styles';
import PageTitle from '../components/PageTitle';

function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [balances, setBalances] = useState({
    netBalance: 0,
    vaultBalance: 0,
    totalBalance: 0
  });
  const theme = useTheme();

  // Sıralama fonksiyonunu ayrı bir yardımcı fonksiyon olarak tanımlayalım
  const sortTransactions = (transactions) => {
    return [...transactions].sort((a, b) => {
      // Önce tarihleri karşılaştır
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // Tarihler aynıysa, createdAt'e göre sırala
      const createdAtA = new Date(a.createdAt);
      const createdAtB = new Date(b.createdAt);
      return createdAtB.getTime() - createdAtA.getTime();
    });
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const sortedTransactions = sortTransactions(response.data);
      setTransactions(sortedTransactions);
      setError(null);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('İşlemler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Bakiyeleri getir
  const fetchBalances = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBalances({
        netBalance: response.data.netBalance,
        vaultBalance: response.data.vaultBalance,
        totalBalance: response.data.totalBalance
      });
    } catch (error) {
      console.error('Balances fetch error:', error);
      setError('Bakiyeler alınırken bir hata oluştu');
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
      fetchBalances();
    }
  }, [token]);

  const handleTransactionAdded = async (updatedTransaction) => {
    try {
      if (editingTransaction) {
        // Düzenleme işlemi
        setTransactions(prevTransactions => {
          const updatedTransactions = prevTransactions.map(transaction => 
            transaction._id === updatedTransaction._id ? updatedTransaction : transaction
          );
          return sortTransactions(updatedTransactions);
        });
      } else {
        // Yeni işlem ekleme
        setTransactions(prevTransactions => {
          const newTransactions = [updatedTransaction, ...prevTransactions];
          return sortTransactions(newTransactions);
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error('Transaction update error:', error);
      setError('İşlem güncellenirken bir hata oluştu');
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = async (transaction) => {
    try {
      // İşlemi tüm detaylarıyla getir
      const response = await axios.get(
        `http://localhost:5000/api/transactions/${transaction._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setEditingTransaction(response.data);
        setOpenForm(true);
        setError(null); // Hata varsa temizle
      }
    } catch (error) {
      console.error('Get transaction error:', error);
      // Daha detaylı hata mesajı
      const errorMessage = error.response?.data?.message || 'İşlem detayları alınırken bir hata oluştu';
      setError(errorMessage);
      
      // Hata durumunda form açılmasın
      setEditingTransaction(null);
      setOpenForm(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      setError('İşlem silinirken bir hata oluştu');
    }
  };

  const handleExpandClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleViewAttachment = async (attachment) => {
    try {
      if (attachment.fileType.startsWith('image/')) {
        // Resim dosyaları için doğrudan URL oluştur
        const imageUrl = `http://localhost:5000/uploads/${attachment.path.split('\\').pop()}`;
        setViewingImage({
          url: imageUrl,
          title: attachment.title
        });
        setImageDialogOpen(true);
      } else if (attachment.fileType === 'application/pdf') {
        // PDF dosyaları için yeni pencerede aç
        window.open(`http://localhost:5000/uploads/${attachment.path.split('\\').pop()}`, '_blank');
      }
    } catch (error) {
      console.error('View error:', error);
      setError('Dosya görüntülenirken bir hata oluştu');
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await axios({
        url: `http://localhost:5000/api/documents/download/${documentId}`,
        method: 'GET',
        responseType: 'blob',
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });

      // Content-Type ve dosya adını al
      const contentType = response.headers['content-type'];
      const filename = response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'document';

      // Blob oluştur
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // İndirme işlemini başlat
      const link = document.createElement('a');
      link.href = url;
      link.download = decodeURIComponent(filename);
      document.body.appendChild(link);
      link.click();

      // Temizlik
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      setError('Dosya indirilirken bir hata oluştu');
    }
  };

  const handleTransactionUpdated = async (updatedTransaction) => {
    // İşlemler listesini güncelle
    setTransactions(prevTransactions =>
      prevTransactions.map(transaction =>
        transaction._id === updatedTransaction._id ? updatedTransaction : transaction
      )
    );
    // Bakiyeleri yeniden yükle
    fetchBalances();
  };

  // Loading durumunu göster
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 4
      }}>
        <PageTitle title="İşlemler" />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Yeni İşlem
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Tarih</TableCell>
              <TableCell>Tür</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">Tutar</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <React.Fragment key={transaction._id}>
                <TableRow>
                  <TableCell padding="checkbox">
                    {transaction.attachments?.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handleExpandClick(transaction._id)}
                        sx={{
                          transform: expandedRow === transaction._id ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.3s'
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>{transaction.type === 'income' ? 'Gelir' : 'Gider'}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: transaction.type === 'income' 
                        ? theme.palette.success.main 
                        : theme.palette.error.main,
                      fontWeight: 500,
                    }}
                  >
                    {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(transaction)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(transaction._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {transaction.attachments?.length > 0 && (
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={expandedRow === transaction._id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Ekler
                          </Typography>
                          <Stack spacing={1}>
                            {transaction.attachments.map((attachment) => (
                              <Box
                                key={attachment._id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 1,
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1
                                }}
                              >
                                <AttachFileIcon color="action" />
                                <Typography sx={{ flex: 1 }}>{attachment.title}</Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewAttachment(attachment)}
                                  title="Görüntüle"
                                >
                                  <ViewIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownload(attachment._id)}
                                  title="İndir"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resim Görüntüleme Dialog'u */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{viewingImage?.title}</DialogTitle>
        <DialogContent>
          <img
            src={viewingImage?.url}
            alt={viewingImage?.title}
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <TransactionForm
        open={openForm}
        handleClose={handleCloseForm}
        onTransactionAdded={handleTransactionAdded}
        onTransactionUpdated={handleTransactionUpdated}
        editingTransaction={editingTransaction}
      />
    </Container>
  );
}

export default Transactions; 