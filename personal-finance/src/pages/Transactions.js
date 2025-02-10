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

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setOpenForm(true);
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
      const response = await axios.get(
        `http://localhost:5000/api/documents/${attachment._id}/view`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (attachment.fileType === 'application/pdf') {
        const pdfWindow = window.open('', '_blank');
        pdfWindow.document.write(`
          <html>
            <head>
              <title>${response.data.title}</title>
            </head>
            <body style="margin:0;padding:0;">
              <embed width="100%" height="100%" src="${response.data.data}" type="application/pdf">
            </body>
          </html>
        `);
      } else if (attachment.fileType.startsWith('image/')) {
        setViewingImage({
          url: response.data.data,
          title: response.data.title
        });
        setImageDialogOpen(true);
      }
    } catch (error) {
      console.error('View error:', error);
      setError('Dosya görüntülenirken bir hata oluştu');
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/${attachment._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      setError('Dosya indirilirken bir hata oluştu');
    }
  };

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
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    {transaction.attachments?.length > 0 && (
                      <Chip
                        size="small"
                        icon={<AttachFileIcon />}
                        label={transaction.attachments.length}
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{transaction.type === 'income' ? 'Gelir' : 'Gider'}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right">₺{transaction.amount.toFixed(2)}</TableCell>
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
                                  borderRadius: 1,
                                  bgcolor: 'background.default'
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
          {viewingImage && (
            <Box
              component="img"
              src={viewingImage.url}
              alt={viewingImage.title}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
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