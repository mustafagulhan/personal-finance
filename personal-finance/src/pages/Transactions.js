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
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  const theme = useTheme();

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTransactions(response.data);
      setError(null);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      setError('İşlemler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  const handleTransactionAdded = (transaction, operation) => {
    if (operation === 'add') {
      setTransactions([transaction, ...transactions]);
    } else if (operation === 'update') {
      setTransactions(transactions.map(t => 
        t._id === transaction._id ? transaction : t
      ));
    }
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
      setEditingTransaction(response.data);
      setOpenForm(true);
    } catch (error) {
      console.error('Get transaction error:', error);
      setError('İşlem detayları alınırken bir hata oluştu');
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingTransaction(null);
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

  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await axios({
        url: `http://localhost:5000/api/documents/${attachment._id}/download`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Blob URL oluştur
      const blob = new Blob([response.data], { type: attachment.fileType });
      const url = window.URL.createObjectURL(blob);

      // İndirme işlemini başlat
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.title;
      document.body.appendChild(link);
      link.click();

      // Temizlik
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Dosya indirilirken bir hata oluştu');
    }
  };

  const columns = [
    {
      field: 'date',
      headerName: 'Tarih',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('tr-TR')
    },
    {
      field: 'type',
      headerName: 'Tür',
      width: 120,
      valueFormatter: (params) => params.value === 'income' ? 'Gelir' : 'Gider'
    },
    {
      field: 'amount',
      headerName: 'Tutar',
      width: 130,
      valueFormatter: (params) => `₺${params.value.toFixed(2)}`
    },
    {
      field: 'category',
      headerName: 'Kategori',
      width: 150
    },
    {
      field: 'description',
      headerName: 'Açıklama',
      width: 200
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" className="page-title">
          İşlemler
        </Typography>
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
                                  onClick={() => handleDownloadAttachment(attachment)}
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
        editingTransaction={editingTransaction}
      />
    </Container>
  );
}

export default Transactions; 