import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Personnel() {
  const { token } = useAuth();
  const [personnel, setPersonnel] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    insurancePremium: '',
    travelAllowance: '',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const fetchPersonnel = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/personnel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPersonnel(response.data);
      setError(null);
    } catch (error) {
      console.error('Personnel fetch error:', error);
      setError('Personel listesi alınamadı');
    }
  };

  useEffect(() => {
    if (token) {
      fetchPersonnel();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/personnel/${editingId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/personnel',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      setOpenForm(false);
      setFormData({
        name: '',
        salary: '',
        insurancePremium: '',
        travelAllowance: '',
        startDate: new Date().toISOString().split('T')[0],
        isActive: true
      });
      setEditingId(null);
      fetchPersonnel();
    } catch (error) {
      console.error('Save personnel error:', error);
      setError('Personel kaydedilemedi');
    }
  };

  const handleEdit = (person) => {
    setFormData({
      name: person.name,
      salary: person.salary,
      insurancePremium: person.insurancePremium,
      travelAllowance: person.travelAllowance,
      startDate: new Date(person.startDate).toISOString().split('T')[0],
      isActive: person.isActive
    });
    setEditingId(person._id);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/personnel/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchPersonnel();
      } catch (error) {
        console.error('Delete personnel error:', error);
        setError('Personel silinemedi');
      }
    }
  };

  const calculateTotalCost = (person) => {
    return person.salary + person.insurancePremium + person.travelAllowance;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" className="page-title">
        Personel Yönetimi
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              salary: '',
              insurancePremium: '',
              travelAllowance: '',
              startDate: new Date().toISOString().split('T')[0],
              isActive: true
            });
            setOpenForm(true);
          }}
        >
          Yeni Personel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Durum</TableCell>
              <TableCell>Ad Soyad</TableCell>
              <TableCell align="right">Maaş</TableCell>
              <TableCell align="right">Sigorta Primi</TableCell>
              <TableCell align="right">Yol Harcırahı</TableCell>
              <TableCell align="right">Toplam Maliyet</TableCell>
              <TableCell>Başlangıç Tarihi</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personnel.map((person) => (
              <TableRow key={person._id}>
                <TableCell>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: person.isActive ? 'success.main' : 'error.main',
                      display: 'inline-block',
                      mr: 1
                    }}
                  />
                  {person.isActive ? 'Aktif' : 'Pasif'}
                </TableCell>
                <TableCell>{person.name}</TableCell>
                <TableCell align="right">₺{person.salary.toFixed(2)}</TableCell>
                <TableCell align="right">₺{person.insurancePremium.toFixed(2)}</TableCell>
                <TableCell align="right">₺{person.travelAllowance.toFixed(2)}</TableCell>
                <TableCell align="right">₺{calculateTotalCost(person).toFixed(2)}</TableCell>
                <TableCell>{new Date(person.startDate).toLocaleDateString('tr-TR')}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(person)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(person._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Personel Düzenle' : 'Yeni Personel'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Ad Soyad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Maaş"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                label="Sigorta Primi"
                type="number"
                value={formData.insurancePremium}
                onChange={(e) => setFormData({ ...formData, insurancePremium: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                label="Yol Harcırahı"
                type="number"
                value={formData.travelAllowance}
                onChange={(e) => setFormData({ ...formData, travelAllowance: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Aktif"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>İptal</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Personnel; 