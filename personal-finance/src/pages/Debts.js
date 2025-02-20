import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import PageTitle from '../components/PageTitle';

const debtCategories = [
  'Kredi',
  'Kredi Kartı',
  'Bireysel Borç',
  'Fatura',
  'Kira',
  'Diğer'
];

function Debts() {
  const { token } = useAuth();
  const theme = useTheme();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [openForm, setOpenForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    dueDate: '',
    category: '',
    attachments: []
  });

  const fetchDebts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/debts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedDebts = response.data.sort((a, b) => 
        new Date(a.dueDate) - new Date(b.dueDate)
      );
      setDebts(sortedDebts);
      setError(null);
    } catch (error) {
      console.error('Debts fetch error:', error);
      setError('Borçlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDebts();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDebt) {
        const response = await axios.put(
          `http://localhost:5000/api/debts/${editingDebt._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDebts(debts.map(debt => 
          debt._id === editingDebt._id ? response.data : debt
        ));
      } else {
        const response = await axios.post(
          'http://localhost:5000/api/debts',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDebts([...debts, response.data]);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Debt save error:', error);
      setError('Borç kaydedilirken bir hata oluştu');
    }
  };

  const handlePayDebt = async (id) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/debts/${id}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const debt = response.data;
      await axios.post(
        'http://localhost:5000/api/transactions',
        {
          type: 'expense',
          amount: debt.amount,
          category: 'Borç Ödemesi',
          description: `${debt.title} borç ödemesi`,
          date: new Date().toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDebts(debts.map(d => d._id === id ? response.data : d));
    } catch (error) {
      console.error('Debt payment error:', error);
      setError('Borç ödenirken bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/debts/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDebts(debts.filter(debt => debt._id !== id));
    } catch (error) {
      console.error('Debt delete error:', error);
      setError('Borç silinirken bir hata oluştu');
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingDebt(null);
    setFormData({
      title: '',
      amount: '',
      description: '',
      dueDate: '',
      category: '',
      attachments: []
    });
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(
          'http://localhost:5000/api/documents',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, response.data]
        }));
        setError(null);
      } catch (error) {
        console.error('File upload error:', error);
        setError('Dosya yüklenirken bir hata oluştu');
      }
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att._id !== attachmentId)
    }));
  };

  const filteredDebts = debts.filter(debt => 
    activeTab === 'pending' ? debt.status === 'pending' : debt.status === 'paid'
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 4
      }}>
        <PageTitle title="Borçlar" />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Borç Ekle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Aktif Borçlar" value="pending" />
        <Tab label="Ödenmiş Borçlar" value="paid" />
      </Tabs>

      <Grid container spacing={2}>
        {filteredDebts.map(debt => (
          <Grid item xs={12} sm={6} md={4} key={debt._id}>
            <Card 
              sx={{ 
                height: '100%',
                '& .MuiCardContent-root': {
                  padding: 2,
                }
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 1
                }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{debt.title}</Typography>
                  <Chip
                    label={debt.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: theme.palette.error.main, 
                    mb: 1,
                    fontSize: '1.2rem'
                  }}
                >
                  ₺{debt.amount.toFixed(2)}
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {debt.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    icon={<WarningIcon sx={{ fontSize: '1rem' }} />}
                    label={`Son: ${new Date(debt.dueDate).toLocaleDateString()}`}
                    size="small"
                    color={new Date(debt.dueDate) < new Date() ? "error" : "default"}
                  />
                  {debt.status === 'paid' && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: '1rem' }} />}
                      label={`Ödendi: ${new Date(debt.paymentDate).toLocaleDateString()}`}
                      size="small"
                      color="success"
                  />
                  )}
                </Box>

                {debt.attachments?.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      icon={<AttachFileIcon sx={{ fontSize: '1rem' }} />}
                      label={`${debt.attachments.length} belge`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                )}

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 0.5
                }}>
                  {debt.status === 'pending' && (
                    <>
                      <IconButton 
                        onClick={() => handlePayDebt(debt._id)} 
                        color="success"
                        size="small"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => {
                          setEditingDebt(debt);
                          setFormData({
                            title: debt.title,
                            amount: debt.amount,
                            description: debt.description || '',
                            dueDate: new Date(debt.dueDate).toISOString().split('T')[0],
                            category: debt.category,
                            attachments: debt.attachments || []
                          });
                          setOpenForm(true);
                        }}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </>
                  )}
                  <IconButton 
                    onClick={() => handleDelete(debt._id)} 
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingDebt ? 'Borç Düzenle' : 'Yeni Borç Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Başlık"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                fullWidth
                inputProps={{ step: "0.01" }}
              />

              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Kategori"
                >
                  {debtCategories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Son Ödeme Tarihi"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
              >
                Belge Ekle
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>

              {formData.attachments.length > 0 && (
                <List dense>
                  {formData.attachments.map(attachment => (
                    <ListItem key={attachment._id}>
                      <ListItemText 
                        primary={attachment.title}
                        secondary={attachment.fileType}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleRemoveAttachment(attachment._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>İptal</Button>
            <Button type="submit" variant="contained">
              {editingDebt ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Debts; 